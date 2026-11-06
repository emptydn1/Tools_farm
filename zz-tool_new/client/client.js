// client.js - chạy trên máy có các giả lập.
// Không có logic gì: chỉ nhận lệnh từ server -> chạy adb -> trả kết quả.
// Chạy: set SERVER=ws://IP_SERVER:9090 && node client.js

import WebSocket from "ws";
import { spawn } from "child_process";

const SERVER = process.env.SERVER || "ws://192.168.1.100:9090";

// Danh sách port giả lập trên máy này (phải trùng với HOSTS bên server)
const ports = [
    16448,
    16480, 16512, 16544, 16576,
    16608, 16640, 16672, 16704, 16736,
    16768, 16800, 16832, 16864, 16896,
    16928, 16960, 16992, 17024, 17056,
];
const hosts = ports.map(p => `127.0.0.1:${p}`);

function runAdb(args) {
    return new Promise((resolve, reject) => {
        const proc = spawn("adb", args);
        const stdout = [];
        const stderr = [];
        proc.stdout.on("data", d => stdout.push(d));
        proc.stderr.on("data", d => stderr.push(d));
        proc.on("error", reject);
        proc.on("close", code => {
            if (code !== 0) return reject(Buffer.concat(stderr).toString());
            resolve(Buffer.concat(stdout));
        });
    });
}

async function connectAll() {
    for (const host of hosts) {
        try {
            const result = await runAdb(["connect", host]);
            console.log(`[${host}] Connected:`, result.toString().trim());
        } catch (err) {
            console.error(`[${host}] Failed:`, err.toString().trim());
        }
    }
}

async function execute(host, cmd, args) {
    switch (cmd) {
        case "tap":
            await runAdb(["-s", host, "shell", "input", "tap", String(args.x), String(args.y)]);
            return null;

        case "swipe":
            await runAdb(["-s", host, "shell", "input", "swipe",
                String(args.x1), String(args.y1), String(args.x2), String(args.y2), String(args.duration)]);
            return null;

        case "text":
            await runAdb(["-s", host, "shell", "input", "text", args.text]);
            return null;

        case "screencap":
            // Chỉ chụp nguyên màn hình và gửi lên, việc cắt ảnh do server làm
            return runAdb(["-s", host, "exec-out", "screencap", "-p"]);

        default:
            throw new Error(`Lệnh không hỗ trợ: ${cmd}`);
    }
}

function connectServer() {
    const ws = new WebSocket(SERVER, { maxPayload: 50 * 1024 * 1024 });

    ws.on("open", () => {
        console.log(`Đã kết nối server ${SERVER}`);
        ws.send(JSON.stringify({ type: "register", hosts }));
    });

    ws.on("message", async raw => {
        let msg;
        try { msg = JSON.parse(raw.toString()); } catch { return; }
        const { id, host, cmd, args } = msg;

        try {
            const result = await execute(host, cmd, args || {});
            if (ws.readyState !== WebSocket.OPEN) return;

            if (Buffer.isBuffer(result)) {
                // Ảnh: 4 byte requestId + PNG
                const header = Buffer.alloc(4);
                header.writeUInt32BE(id);
                ws.send(Buffer.concat([header, result]));
            } else {
                ws.send(JSON.stringify({ type: "result", id }));
            }
        } catch (err) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "result", id, error: String(err).trim() || "adb error" }));
            }
        }
    });

    ws.on("close", () => {
        console.log("Mất kết nối server, thử lại sau 2s...");
        setTimeout(connectServer, 2000);
    });
    ws.on("error", err => console.error("WS error:", err.message));
}

(async () => {
    await connectAll();
    connectServer();
})();
