// deviceBridge.js - cầu nối giữa server và máy client qua WebSocket.
// Server gọi tap/swipe/input_text/screencap giống hệt như gọi adb tại chỗ,
// nhưng thực tế lệnh được gửi xuống client, client chạy adb rồi trả kết quả về.

import { WebSocketServer } from "ws";

const devices = new Map();   // host -> ws của client đang giữ device đó
const waiters = new Map();   // host -> [resolve] đang chờ device online
const pending = new Map();   // requestId -> { resolve, reject, timer, ws }
let nextId = 1;

class DisconnectedError extends Error {}

export function startBridge(port = 9090) {
    const wss = new WebSocketServer({ port, maxPayload: 50 * 1024 * 1024 });

    wss.on("connection", (ws, req) => {
        ws.hosts = [];
        console.log(`[BRIDGE] Client kết nối từ ${req.socket.remoteAddress}`);

        ws.on("message", (data, isBinary) => {
            // Ảnh: 4 byte đầu = requestId, phần còn lại = PNG
            if (isBinary) {
                settle(data.readUInt32BE(0), null, data.subarray(4));
                return;
            }

            let msg;
            try { msg = JSON.parse(data.toString()); } catch { return; }

            if (msg.type === "register") {
                ws.hosts = msg.hosts || [];
                for (const host of ws.hosts) {
                    devices.set(host, ws);
                    (waiters.get(host) || []).forEach(r => r());
                    waiters.delete(host);
                }
                console.log(`[BRIDGE] Đăng ký ${ws.hosts.length} device`);
            } else if (msg.type === "result") {
                settle(msg.id, msg.error, msg.data);
            }
        });

        ws.on("close", () => {
            console.log(`[BRIDGE] Client ngắt kết nối (${ws.hosts.length} device offline)`);
            for (const host of ws.hosts) {
                if (devices.get(host) === ws) devices.delete(host);
            }
            for (const [id, p] of pending) {
                if (p.ws === ws) {
                    clearTimeout(p.timer);
                    pending.delete(id);
                    p.reject(new DisconnectedError("client disconnected"));
                }
            }
        });
    });

    console.log(`[BRIDGE] Server lắng nghe ws://0.0.0.0:${port}`);
    return wss;
}

function settle(id, error, data) {
    const p = pending.get(id);
    if (!p) return;
    clearTimeout(p.timer);
    pending.delete(id);
    if (error) p.reject(new Error(error));
    else p.resolve(data);
}

export function waitForDevice(host) {
    if (devices.has(host)) return Promise.resolve();
    return new Promise(resolve => {
        if (!waiters.has(host)) waiters.set(host, []);
        waiters.get(host).push(resolve);
    });
}

// Gửi 1 lệnh xuống client. Nếu client rớt mạng giữa chừng thì chờ kết nối lại rồi gửi lại.
async function call(host, cmd, args = {}, timeoutMs = 30000) {
    while (true) {
        await waitForDevice(host);
        const ws = devices.get(host);
        const id = nextId++;
        if (nextId > 0xffffffff) nextId = 1;

        try {
            return await new Promise((resolve, reject) => {
                const timer = setTimeout(() => {
                    pending.delete(id);
                    reject(new Error(`[${host}] ${cmd} timeout`));
                }, timeoutMs);
                pending.set(id, { resolve, reject, timer, ws });
                ws.send(JSON.stringify({ id, host, cmd, args }));
            });
        } catch (err) {
            if (err instanceof DisconnectedError) {
                console.log(`[${host}] mất kết nối, chờ client quay lại...`);
                continue;
            }
            throw err;
        }
    }
}

// ── API giống code cũ ──────────────────────────────────────────

export const tap = (host, x, y) => call(host, "tap", { x, y });

export async function swipe(host, x1, y1, x2, y2, duration = 300) {
    try {
        await call(host, "swipe", { x1, y1, x2, y2, duration });
        await new Promise(r => setTimeout(r, 200));
    } catch (error) { }
}

export const input_text = (host, text) => call(host, "text", { text });

// Nhận nguyên màn hình (PNG) từ client, việc cắt vùng làm ở server
export const screencap = host => call(host, "screencap");
