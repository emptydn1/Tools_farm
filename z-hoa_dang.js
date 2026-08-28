import fs from "fs";
import { spawn } from "child_process";
import sharp from "sharp";
import { sleep } from './utils/utils.js';
import { findMatchingRegionsAndroids } from './utils/opencvNodejs.js';
import readline from "readline";
import Tesseract from "tesseract.js";


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
    1: (host) => tap(host, 190, 295),
    2: (host) => tap(host, 190, 345),
    3: (host) => tap(host, 190, 385),
    4: (host) => tap(host, 190, 430),
};

// ────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────


const data = JSON.parse(fs.readFileSync("C:\\Users\\huy\\Desktop\\Tools_farm\\z-utils_hoa-dang_bst_vv\\answer_Tesseract.json", "utf8"));
// const ports = [16448, 16480, 16512, 16544, 16576, 16608, 16640, 16672, 16704, 16736, 16768, 16800, 16832];
// const ports = [16448, 16480, 16512, 16544, 16576, 16608, 16640, 16672, 16704, 16736, 16768, 16800, 16832, 16864, 16896, 16928];
const ports = [
    16448, 16480, 16512, 16544, 16576,
    16608, 16640, 16672, 16704, 16736,
    16768, 16800, 16832, 16864, 16896,
    16928, 16960, 16992, 17024, 17056
]



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


(async () => {
    try {
        // await runAdb(["disconnect"]);
        setupKeyboard();
        await connectAll();
        let pathMatch = "C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-hoa_dang"

        const worker = await Tesseract.createWorker("vie");
        await worker.setParameters({ tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE });

        const workerPromises = [];

        for (const [index, port] of ports.entries()) {
            await sleep(500);

            const p = (async () => {
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
                                `${pathMatch}\\hoa_dang.png`,
                                `${pathMatch}\\cau_hoi.png`,
                            ].filter(item => !exclude.includes(item)),
                            matchThreshold: 0.8,
                        });

                        if (matchedPoints.length > 0) {
                            const seen = new Set();
                            let matchedFilter = matchedPoints.filter(
                                point => !seen.has(point.math_image_path) && seen.add(point.math_image_path)
                            );

                            for (const { x, y, mathImagePath } of matchedFilter) {
                                if (isKilled) break;

                                if (mathImagePath == `${pathMatch}\\hoa_dang.png`) {
                                    exclude.push(mathImagePath);
                                    await tap(host, x, y);
                                }
                                else if (mathImagePath == `${pathMatch}\\cau_hoi.png`) {
                                    const buffer = await sharp(pngBuffer)
                                        .extract({ left: 16, top: 145, width: 320, height: 23 })
                                        .resize({ width: 320 * 5, height: 23 * 5 })
                                        .toBuffer();
                                    const { data: ocrData } = await worker.recognize(buffer);
                                    const questionText = ocrData.text.toLowerCase();
                                    const result = data.find(item => questionText.includes(item?.question?.toLowerCase()));

                                    if (result?.answer) {
                                        actions[result.answer]?.(host);
                                    } else {
                                        actions[3]?.(host);
                                    }

                                    await sleep(1000);
                                    await tap(host, 390, 50);
                                    exclude = [];
                                }
                            }
                        } else {
                            const positions = [
                                [480, 150], // up
                                [480, 395], // down
                                [350, 260], // left
                                [650, 260], // right
                            ];

                            const [x, y] = positions[Math.floor(Math.random() * positions.length)];
                            await tap(host, x, y);
                            exclude = [];
                        }
                    } catch (e) {
                        console.error(`[${host}] Error:`, e.toString());
                    }
                    await sleep(500);
                }

                console.log(`[${host}] Stopped`);
            })();
            workerPromises.push(p);
        }

        while (!isKilled) {
            await sleep(500);
        }

        await Promise.all(workerPromises);
        await worker.terminate();

        console.log("Tất cả đã dừng!");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
})();