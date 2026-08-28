import fs from "fs";
import { spawn } from "child_process";
import sharp from "sharp";
import { sleep } from './utils/utils.js';
import { findMatchingRegionsAndroids } from './utils/opencvNodejs.js';


class OCRWorker {
    constructor() {
        this.process = spawn('python', ['ocr_worker.py']);
        this.buffer = '';
        this.queue = [];        // jobs chờ gửi đi
        this.busy = false;      // python đang xử lý không
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

            // Python trả kết quả → resolve promise hiện tại
            if (this.pendingResolve) {
                try { this.pendingResolve(null, JSON.parse(line)); }
                catch (e) { this.pendingResolve(e, null); }
                this.pendingResolve = null;
            }

            this.busy = false;
            this._flush(); // gửi job tiếp theo nếu có
        }
    }

    _flush() {
        if (this.busy || this.queue.length === 0) return;
        const { imageBuffer, resolve, reject } = this.queue.shift();
        this.busy = true;
        this.pendingResolve = (err, result) => err ? reject(err) : resolve(result);

        const sizeBuffer = Buffer.alloc(4);
        sizeBuffer.writeUInt32BE(imageBuffer.length);
        this.process.stdin.write(sizeBuffer);
        this.process.stdin.write(imageBuffer);
    }

    scan(imageBuffer) {
        return this.readyPromise.then(() => new Promise((resolve, reject) => {
            this.queue.push({ imageBuffer, resolve, reject });
            this._flush();
        }));
    }

    close() { this.process.stdin.end(); }
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
const ports = [16448, 16480, 16512, 16544];
// const ports = [16448, 16480, 16512, 16544, 16576, 16608, 16640, 16672, 16704, 16736, 16768, 16800, 16832, 16864, 16896, 16928];
const ocr = new OCRWorker();

(async () => {
    try {
        // await connectAll();

        // let buffer = fs.readFileSync("question_temp.png");
        // const croppedBuffer = await sharp(buffer)
        //     .extract({ left: 16, top: 145, width: 320, height: 25 })
        //     .png()
        //     .toBuffer();
        // fs.writeFileSync("screenshot.png", croppedBuffer);


        for (const [index, port] of ports.entries()) {
            await sleep(500);
            const host = `127.0.0.1:${port}`;


            // (async () => {

            // })();


            let matchImgFunc = setInterval(async () => {
                try {
                    let exclude = [];
                    // const pngBuffer = await runAdb(["-s", host, "exec-out", "screencap", "-p"]);
                    const pngBuffer = fs.readFileSync("C:\\Users\\huy\\Desktop\\tools_cdp\\x.png");
                    const { matchedPoints } = await findMatchingRegionsAndroids({
                        buffer: pngBuffer,
                        templateImages: [
                            'C:\\Users\\huy\\Desktop\\tools_cdp\\z-img\\hoa_dang.png',
                            'C:\\Users\\huy\\Desktop\\tools_cdp\\z-img\\cau_hoi.png',
                            // 'C:\\Users\\huy\\Desktop\\tools_cdp\\z-img\\ket_thuc.png',
                        ].filter(item => !exclude.includes(item)),
                        matchThreshold: 0.8,
                        // drawType: "drawLine"
                    });
                    if (matchedPoints.length > 0) {
                        for (const { x, y, mathImagePath } of matchedPoints) {
                            if (mathImagePath == 'C:\\Users\\huy\\Desktop\\tools_cdp\\z-img\\hoa_dang.png') {
                                exclude.push(mathImagePath);
                                await tap(host, x, y);
                            }
                            else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\tools_cdp\\z-img\\cau_hoi.png') {
                                console.count(mathImagePath);


                                const croppedBuffer = await sharp(pngBuffer)
                                    .extract({ left: 16, top: 145, width: 320, height: 25 })
                                    .png()
                                    .toBuffer();

                                const results = await ocr.scan(croppedBuffer);
                                console.log(results);
                                const result2 = data.find(item => item?.question?.toLowerCase().includes(results[0].text.toLowerCase()));
                                console.log(result2)

                                if (result2) {
                                    // actions[result2.answer]?.(host)
                                    console.log(3);

                                } else {
                                    // actions[3]?.(host);
                                    // fs.writeFileSync(`C:\\Users\\huy\\Desktop\\tools_cdp\\match-img\\${generateUniqueFileName()}`, pngBuffer);
                                    console.log("luu file");
                                }

                                console.log("outside");

                                // await tap(host, 390, 50);
                                // exclude.shift()
                            }
                            else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\tools_cdp\\z-img\\ket_thuc.png') {
                                console.log(1);
                                clearInterval(matchImgFunc);
                                break;
                            }
                        }
                    }
                } catch (e) {
                    console.error(host, e.toString());
                } finally {
                    isRunning = false;
                }
            }, 2000);
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        ocr.close();
    }
})();