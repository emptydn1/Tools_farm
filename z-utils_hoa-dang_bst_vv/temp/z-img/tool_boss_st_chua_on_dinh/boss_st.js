import fs from "fs";
import { spawn } from "child_process";
import sharp from "sharp";
import path from "path";
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

    // Nhận array của buffers, trả về array of results
    scanBatch(imageBuffers) {
        return this.readyPromise.then(() => new Promise((resolve, reject) => {
            this.pendingResolve = (err, result) => err ? reject(err) : resolve(result);

            // Gửi số lượng ảnh trước
            const countBuffer = Buffer.alloc(4);
            countBuffer.writeUInt32BE(imageBuffers.length);
            this.process.stdin.write(countBuffer);

            // Gửi từng ảnh
            for (const buf of imageBuffers) {
                const sizeBuffer = Buffer.alloc(4);
                sizeBuffer.writeUInt32BE(buf.length);
                this.process.stdin.write(sizeBuffer);
                this.process.stdin.write(buf);
            }
        }));
    }

    close() {
        this.process.stdin.end();
        this.process.kill('SIGTERM');
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
    await sleep(200)
}

async function swipe(host, x1, y1, x2, y2, duration = 300) {
    await runAdb(["-s", host, "shell", "input", "swipe", String(x1), String(y1), String(x2), String(y2), String(duration)]);
    await sleep(200)
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

let isPaused = true;

function setupKeyboard(ocrWorker) {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);

    process.stdin.on('keypress', async (str, key) => {
        if (key.ctrl && key.name === 'c') {
            ocrWorker.close();
            process.exit(0);
        } else if (key.name === 'i') {
            isPaused = false;
            console.log('\n[CONTROL] ▶ Tiếp tục');
        } else if (key.name === 'o') {
            isPaused = true;
            console.log('\n[CONTROL] ⏸ Tạm dừng');
        }
    });

    console.log('Phím điều khiển: [i] Bật  [o] Tắt  [Ctrl+C] Thoát\n');
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


// const ports = [16448];
const ports = [16448, 16480, 16512, 16544, 16576, 16608, 16640, 16672, 16704, 16736, 16768, 16800, 16832];

async function waitIfPaused() {
    while (isPaused) {
        await sleep(1000);
    }
}

(async () => {
    try {
        await connectAll();
        const ocrWorker = new OCRWorker();
        await ocrWorker.readyPromise;
        console.log('[OCR] Worker sẵn sàng.');
        setupKeyboard(ocrWorker);

        while (true) {
            try {
                await waitIfPaused();


                const cropJobs = await Promise.all(ports.map(async (port) => {
                    const host = `127.0.0.1:${port}`;
                    try {
                        const pngBuffer = await runAdb(["-s", host, "exec-out", "screencap", "-p"]);
                        const croppedBuffer = await sharp(pngBuffer)
                            .extract({ left: 10, top: 190, width: 220, height: 90 })
                            .png()
                            .toBuffer();
                        return { host, croppedBuffer };
                    } catch (err) {
                        console.error(`Error on ${host}:`, err);
                        return null;
                    }
                }));
                const validJobs = cropJobs.filter(Boolean);
                console.log(`[SCAN] Chụp xong ${validJobs.length} thiết bị, đang OCR batch...`);

                // Bước 2: gửi batch 1 lần duy nhất
                const batchResults = await ocrWorker.scanBatch(validJobs.map(j => j.croppedBuffer));

                // Bước 3: ghép kết quả
                let resultsScan = validJobs.map((job, i) => ({
                    host: job.host,
                    data: batchResults[i],
                }));

                ///////////////////// click points
                const half = Math.ceil(resultsScan.length / 2);
                const firstHalf = resultsScan.slice(0, half);
                const secondHalf = resultsScan.slice(half);

                const processOne = async ({ host, data }) => {
                    const missionCompleted = data.some(item => item.text.includes('1/1'));

                    if (missionCompleted) {
                        await tap(host, 102, 198);
                    } else {
                        await tap(host, 102, 198);

                        let point;
                        data.forEach(item => {
                            const match = item.text.replace('.', ',').match(/(\d+),(\d+)/);
                            if (match) {
                                const coord = `${match[1]},${match[2]}`;
                                Object.entries(arrays).forEach(([arrName, arr]) => {
                                    const index = arr.indexOf(coord);
                                    if (index !== -1) {
                                        point = index;
                                    }
                                });
                            }
                        });

                        if (!clickPosition[point]) return;
                        await tap(host, 102, 198);
                        await tap(host, 140, 157);
                        await tap(host, 140, 157);
                        await tap(host, 140, 250);
                        if (point > 4) await swipe(host, 475, 265, 475, 155, 1250);
                        await tap(host, clickPosition[point].x, clickPosition[point].y);
                        await tap(host, 900, 225);
                        await tap(host, 900, 225);
                        await tap(host, 60, 155);
                        await tap(host, 102, 198);
                    }
                };

                await waitIfPaused();

                await sleep(3000);
                await Promise.all(firstHalf.map(processOne));
                await sleep(3000);
                await Promise.all(secondHalf.map(processOne));
            } catch (e) {
                console.error(`Error:`, e.toString());
            }
            await sleep(5000);
        }
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
})();
