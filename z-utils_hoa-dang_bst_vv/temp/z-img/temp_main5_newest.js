import fs from "fs";
import { spawn } from "child_process";
import sharp from "sharp";
import { sleep } from './utils/utils.js';
import { findMatchingRegionsAndroids } from './utils/opencvNodejs.js';
import readline from "readline";


class OCRWorker {
    constructor() {
        this.process = spawn('python', ['ocr_worker.py']);
        this.buffer = '';
        this.readyPromise = new Promise(resolve => this.readyResolve = resolve);
        this.pendingResolve = null;

        this.process.stdout.on('data', (data) => {
            this.buffer += data.toString();
            this._processBuffer();
        });
        this.process.stderr.on('data', () => { });
    }

    _processBuffer() {
        const lines = this.buffer.split('\n');
        this.buffer = lines.pop();

        for (const line of lines) {
            if (!line.trim()) continue;
            if (line.trim() === 'ready') { this.readyResolve(); continue; }

            if (this.pendingResolve) {
                try { this.pendingResolve(null, JSON.parse(line)); }
                catch (e) { this.pendingResolve(e, null); }
                this.pendingResolve = null;
            }
        }
    }

    scan(imageBuffer) {
        return this.readyPromise.then(() => new Promise((resolve, reject) => {
            this.pendingResolve = (err, result) => err ? reject(err) : resolve(result);

            const sizeBuffer = Buffer.alloc(4);
            sizeBuffer.writeUInt32BE(imageBuffer.length);
            this.process.stdin.write(sizeBuffer);
            this.process.stdin.write(imageBuffer);
        }));
    }

    close() {
        this.process.stdin.end();
        this.process.kill('SIGTERM');
    }
}


class OCRWorkerPool {
    constructor(size = 5) {
        this.workers = Array.from({ length: size }, () => new OCRWorker());
        this.queue = []; // hàng chờ: mỗi phần tử là { resolve }
        this.available = [...this.workers]; // workers đang rảnh
    }

    async acquire() {
        // Nếu có worker rảnh, trả luôn
        if (this.available.length > 0) {
            return this.available.pop();
        }
        // Không có worker rảnh → chờ
        return new Promise(resolve => this.queue.push(resolve));
    }

    release(worker) {
        // Nếu có task đang chờ, giao worker cho task đó luôn
        if (this.queue.length > 0) {
            const next = this.queue.shift();
            next(worker);
        } else {
            this.available.push(worker);
        }
    }

    async scan(imageBuffer) {
        const worker = await this.acquire();
        try {
            return await worker.scan(imageBuffer);
        } finally {
            this.release(worker); // luôn trả worker dù thành công hay lỗi
        }
    }

    async waitReady() {
        await Promise.all(this.workers.map(w => w.readyPromise));
    }

    close() {
        this.workers.forEach(w => w.close());
    }
}

// ────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────

function runAdb(args) {
    return new Promise((resolve, reject) => {
        const proc = spawn("adb", args);
        const stdout = [];
        const stderr = [];

        proc.stdout.on("data", d => stdout.push(d));
        proc.stderr.on("data", d => stderr.push(d));

        proc.on("close", code => {
            if (code !== 0) {
                reject(Buffer.concat(stderr).toString());
                return;
            }
            resolve(Buffer.concat(stdout));
        });
    });
}

async function connectAll() {
    for (const port of ports) {
        const host = `127.0.0.1:${port}`;
        try {
            const result = await runAdb(["connect", host]);
            console.log(`[${host}] Connected:`, result.toString().trim());
        } catch (err) {
            console.error(`[${host}] Failed:`, err.toString().trim());
        }
    }
    console.log("Done.");
}

async function tap(host, x, y) {
    await runAdb(["-s", host, "shell", "input", "tap", String(x), String(y)]);
}

function generateUniqueFileName(prefix = 'file') {
    const [seconds, nanoseconds] = process.hrtime();
    const random = Math.random().toString(36).slice(2, 8);
    return `${prefix}_${seconds}${nanoseconds}_${random}.png`;
}

const actions = {
    1: (host) => tap(host, 250, 295),
    2: (host) => tap(host, 250, 345),
    3: (host) => tap(host, 250, 385),
    4: (host) => tap(host, 250, 430),
};

// ────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────


const data = JSON.parse(fs.readFileSync("answer.json", "utf8"));
const ports = [16448, 16480, 16512, 16544, 16576, 16608, 16640, 16672, 16704, 16736, 16768, 16800, 16832, 16864, 16896, 16928];
// const ports = [16448, 16480, 16512, 16544, 16576, 16608, 16640, 16672, 16704, 16736, 16768, 16800, 16832, 16864, 16896, 16928];



let isPaused = false; // o = dừng, i = tiếp tục
let isKilled = false; // k = kill all

function setupKeyboard() {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);

    process.stdin.on('keypress', (str, key) => {
        if (key.name === 'i') {
            isPaused = false;
            console.log('\n[CONTROL] ▶ Tiếp tục chạy');
        } else if (key.name === 'o') {
            isPaused = true;
            console.log('\n[CONTROL] ⏸ Tạm dừng');
        } else if (key.name === 'k') {
            isKilled = true;
            isPaused = false; // bỏ pause để các vòng while thoát được
            console.log('\n[CONTROL] ✖ Kill all - đang dừng...');
        }
    });

    console.log('Phím điều khiển: [i] Tiếp tục  [o] Tạm dừng  [k] Kill all\n');
}


(async () => {
    try {
        setupKeyboard();
        await connectAll();

        const ocrPool = new OCRWorkerPool(5);
        await ocrPool.waitReady();

        for (const [index, port] of ports.entries()) {
            await sleep(500);

            (async () => {
                const host = `127.0.0.1:${port}`;
                let exclude = [];

                while (!isKilled) {
                    while (isPaused && !isKilled) {
                        await sleep(300);
                    }
                    if (isKilled) break;

                    try {
                        const pngBuffer = await runAdb(["-s", host, "exec-out", "screencap", "-p"]);
                        const { matchedPoints } = await findMatchingRegionsAndroids({
                            buffer: pngBuffer,
                            templateImages: [
                                'C:\\Users\\huy\\Desktop\\Tools_Farm\\z-img\\hoa_dang.png',
                                'C:\\Users\\huy\\Desktop\\Tools_Farm\\z-img\\cau_hoi.png',
                            ].filter(item => !exclude.includes(item)),
                            matchThreshold: 0.8,
                        });

                        if (matchedPoints.length > 0) {
                            for (const { x, y, mathImagePath } of matchedPoints) {
                                if (isKilled) break;

                                if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\z-img\\hoa_dang.png') {
                                    exclude.push(mathImagePath);
                                    await tap(host, x, y);
                                }
                                else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\z-img\\cau_hoi.png') {
                                    const croppedBuffer = await sharp(pngBuffer)
                                        .extract({ left: 16, top: 145, width: 320, height: 25 })
                                        .png()
                                        .toBuffer();

                                    const results = await ocrPool.scan(croppedBuffer);
                                    const result2 = data.find(item => item?.question?.toLowerCase().includes(results[0].text.toLowerCase()));

                                    if (result2?.answer) {
                                        actions[result2.answer]?.(host);
                                    } else {
                                        actions[3]?.(host);
                                    }

                                    await sleep(1000);
                                    await tap(host, 390, 50);
                                    exclude = [];
                                }
                            }
                        }
                    } catch (e) {
                        console.error(`[${host}] Error:`, e.toString());
                    }

                    await sleep(1000);
                }

                console.log(`[${host}] Stopped`);
            })();
        }

        while (!isKilled) {
            await sleep(500);
        }

        ocrPool.close();
        console.log("Tất cả đã dừng!");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
})();