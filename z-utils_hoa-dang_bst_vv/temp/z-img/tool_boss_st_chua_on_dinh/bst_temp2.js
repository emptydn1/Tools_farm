import fs from "fs";
import { spawn } from "child_process";
// import sharp from "sharp";
import { sleep } from './utils/utils.js';
// import { findMatchingRegionsAndroids } from './utils/opencvNodejs.js';
import readline from "readline";


class OCRWorker {
    constructor() {
        this.process = spawn('python', ['ocr_worker2.py']);
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

async function swipe(host, x1, y1, x2, y2, duration = 300) {
    await runAdb(["-s", host, "shell", "input", "swipe", String(x1), String(y1), String(x2), String(y2), String(duration)]);
}


function generateUniqueFileName(prefix = 'file') {
    const [seconds, nanoseconds] = process.hrtime();
    const random = Math.random().toString(36).slice(2, 8);
    return `${prefix}_${seconds}${nanoseconds}_${random}.png`;
}

const actions = {
    1: (host) => tap(host, 190, 295),
    2: (host) => tap(host, 190, 345),
    3: (host) => tap(host, 190, 385),
    4: (host) => tap(host, 190, 430),
};

// ────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────


let isPaused = true; // o = dừng, i = tiếp tục
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

const pnst = [
    "135,65",     //vo quang
    "148,68",     //lam tai
    "52,46",      //nong tu
    "14,35",      //phan my44
    "100,74",     //che linh4
    "15,14",      //hoang tram
];

const hhnd = [
    "67,20",      //vo minh
    "9,29",       //tham diep
    "46,11",      //duong hoang
    "67,8",       //bui sam5
    "65,30",      //phan long11
    "8,9",        //phan trang
    "34,36",      //trinh dao
];

const dts = [
    "194,61",     //le dang
    "19,71",      //lai tu23
    "35,69",      //che hong22
    "83,96",      //doan vinh
    "63,79",      //na linh
    "206,41",     //phan hieu
];

const arrays = { pnst, hhnd, dts };
const clickPosition = [
    { x: 815, y: 130 },
    { x: 815, y: 200 },
    { x: 815, y: 270 },
    { x: 815, y: 340 },
    { x: 815, y: 410 },

    { x: 815, y: 340 },
    { x: 815, y: 410 },
];


const ports = [16448];
// const ports = [16448, 16480, 16512, 16544, 16576, 16608, 16640, 16672, 16704, 16736, 16768, 16800, 16832, 16864, 16896, 16928];

(async () => {
    try {
        setupKeyboard();
        await connectAll();
        const ocrPool = new OCRWorkerPool(1);
        await ocrPool.waitReady();

        for (const port of ports) {
            let host = `127.0.0.1:${port}`

            const pngBuffer = await runAdb(["-s", host, "exec-out", "screencap", "-p"]);
            const data = await ocrPool.scan(pngBuffer);
            if (data.length == 0) continue;
            const missionCompleted = data.some(item => item.text.includes('1/1'));
            console.log(data);

            if (missionCompleted) {
                await tap(host, 102, 198)
            } else {
                await tap(host, 102, 198)
                let point;
                data.forEach(item => {
                    const match = item.text.replace('.', ',').match(/(\d+),(\d+)/);
                    if (match) {
                        const coord = `${match[1]},${match[2]}`;
                        Object.entries(arrays).forEach(([arrName, arr]) => {
                            const index = arr.indexOf(coord);
                            if (index !== -1) {
                                point = index;
                                console.log(`coord: ${coord} | arrName: ${arrName} | index: ${index}`);
                            }
                        });
                    }
                });


                if (!clickPosition[point]) return;
                await sleep(5000);
                await tap(host, 102, 198)   // click nv

                await tap(host, 140, 157)
                await tap(host, 140, 157)

                await tap(host, 140, 250);    // doi xung quanh
                if (point > 4) {
                    await swipe(host, 475, 265, 475, 155, 1250)
                    await sleep(500);
                }
                await tap(host, clickPosition[point].x, clickPosition[point].y);
                await tap(host, 900, 225);
                await tap(host, 900, 225);
                await tap(host, 60, 155);
                await tap(host, 102, 198)
            }
        }
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
})();
