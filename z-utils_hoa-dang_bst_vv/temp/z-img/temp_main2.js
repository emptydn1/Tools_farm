import fs from "fs";
import { spawn } from "child_process";
import sharp from "sharp";
import { sleep } from './utils/utils.js';
import { findMatchingRegionsAndroids } from './utils/opencvNodejs.js';


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

const data = JSON.parse(fs.readFileSync("answer.json", "utf8"));
const ports = [16448, 16480, 16512, 16544, 16576, 16608, 16640, 16672, 16704, 16736, 16768, 16800, 16832, 16864, 16896, 16928];
// const ports = [16448, 16480, 16512, 16544, 16576, 16608, 16640, 16672, 16704, 16736, 16768, 16800, 16832, 16864, 16896, 16928];

(async () => {
    try {
        await connectAll();

        // let buffer = fs.readFileSync("question_temp.png");
        // const croppedBuffer = await sharp(buffer)
        //     .extract({ left: 16, top: 145, width: 320, height: 25 })
        //     .png()
        //     .toBuffer();
        // fs.writeFileSync("screenshot.png", croppedBuffer);

        const tasks = [];
        for (const [index, port] of ports.entries()) {
            const ocr = new OCRWorker();
            await sleep(1000);

            const task = (async () => {
                const host = `127.0.0.1:${port}`;
                let running = true;

                while (running) {
                    try {
                        let exclude = [];
                        const pngBuffer = await runAdb(["-s", host, "exec-out", "screencap", "-p"]);
                        const { matchedPoints } = await findMatchingRegionsAndroids({
                            buffer: pngBuffer,
                            templateImages: [
                                'C:\\Users\\huy\\Desktop\\Tools_Farm\\z-img\\hoa_dang.png',
                                'C:\\Users\\huy\\Desktop\\Tools_Farm\\z-img\\cau_hoi.png',
                                'C:\\Users\\huy\\Desktop\\Tools_Farm\\z-img\\ket_thuc.png',
                            ].filter(item => !exclude.includes(item)),
                            matchThreshold: 0.8,
                            // drawType: "drawLine"
                        });
                        if (matchedPoints.length > 0) {
                            for (const { x, y, mathImagePath } of matchedPoints) {
                                if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\z-img\\hoa_dang.png') {
                                    exclude.push(mathImagePath);
                                    await tap(host, x, y);
                                }
                                else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\z-img\\cau_hoi.png') {
                                    const croppedBuffer = await sharp(pngBuffer)
                                        .extract({ left: 16, top: 145, width: 320, height: 25 })
                                        .png()
                                        .toBuffer();

                                    const results = await ocr.scan(croppedBuffer);
                                    const result2 = data.find(item => item?.question?.toLowerCase().includes(results[0].text.toLowerCase()));

                                    actions[result2?.answer ?? 3]?.(host);

                                    await sleep(1000)
                                    await tap(host, 390, 50);
                                    exclude = []
                                }
                                else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\z-img\\ket_thuc.png') {
                                    running = false;
                                    break;
                                }
                            }
                        }
                    } catch (e) {
                        console.error(host, e.toString());
                    }

                    await sleep(1000);
                }

                ocr.close();
                console.log(`[${host}] Done`);
            })();
            tasks.push(task);
        }

        await Promise.all(tasks);
        console.log("Tất cả ports đã xong!");
    } catch (err) {
        console.error("Error:", err);
    }
})();