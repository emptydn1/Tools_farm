import fs from "fs";
import { spawn } from "child_process";
import sharp from "sharp";
import { sleep } from './utils/utils.js';
import { findMatchingRegionsAndroids } from './utils/opencvNodejs.js';
import readline from "readline";
// import Tesseract from "tesseract.js";
// import { distance } from "fastest-levenshtein";


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
    await sleep(200)
}

// ────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────


// const data = JSON.parse(fs.readFileSync("answer_Tesseract.json", "utf8"));
// const ports = [16448, 16480, 16512, 16544, 16576, 16608, 16640, 16672, 16704, 16736, 16768, 16800, 16832];
// const ports = [16448, 16480, 16512, 16544, 16576, 16608, 16640, 16672, 16704, 16736, 16768, 16800, 16832, 16864, 16896, 16928];
// const ports = [
//     16448,
//     //  16480, 16512, 16544, 16576,
//     // 16608, 16640, 16672, 16704, 16736,
//     // 16768, 16800, 16832, 16864, 16896,
//     // 16928, 16960, 16992, 17024, 17056
// ]

const ports = [16448]
// const ports = [16448, 16480, 16512, 16544, 16576, 16608, 16640, 16672, 16704, 16736, 16768, 16800, 16832, 16864, 16896, 16928]






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
        if (key.ctrl && key.name === "c") {
            process.exit();
        }
    });

    console.log('Phím điều khiển: [i] Tiếp tục  [o] Tạm dừng  [k] Kill all\n');
}



let logout_and_login = async (host) => {
    await tap(host, 946, 257)
    await sleep(800);
    await tap(host, 946, 337)
    await sleep(800);
    await tap(host, 153, 115)
    await sleep(500);
    await tap(host, 800, 250)
    await sleep(500);

    await tap(host, 490, 395)
    await sleep(1000);
    await tap(host, 585, 360)

    await sleep(2000);
    await tap(host, 490, 435) // nhấn nút đăng nhập
    await sleep(1000);
    await tap(host, 870, 455) // nhấn nút vào game
}

let logout = async (host) => {
    await sleep(500)
    await tap(host, 60, 385);   // click ra ngoai goc 8h
    await sleep(500)
    await tap(host, 60, 385);   // click ra ngoai goc 8h
    await sleep(500)
    await tap(host, 946, 257)
    await sleep(800);
    await tap(host, 946, 337)
    await sleep(800);
    await tap(host, 153, 115)
    await sleep(500);
    await tap(host, 800, 250)
    await sleep(500);
}


async function waitUntilMatch({ deviceId, region, templateImages, matchThreshold = 0.8, interval = 300 }) {
    while (true) {
        const result = await captureAndMatch({ deviceId, region, templateImages, matchThreshold });

        if (result.length > 0) {
            await sleep(500);
            return result;
        }

        await sleep(interval)
    }
}


async function captureAndMatch({ deviceId, region, templateImages, matchThreshold = 0.95 }) {
    const buffer = await runAdb(["-s", deviceId, "exec-out", "screencap", "-p"]);
    const pngBuffer = await sharp(buffer)
        .extract(region)
        .toBuffer();

    fs.writeFileSync("xxxxxxxx.png", pngBuffer)
    const { matchedPoints } = await findMatchingRegionsAndroids({
        buffer: pngBuffer,
        templateImages,
        matchThreshold,
    });

    return matchedPoints;
}


async function checkRegionsParallel(buffer, regions) {
    // mẫu
    //    const regions = [
    //         {
    //             name: "giao_dich_va_khoa",
    //             area: { left: 270, top: 370, width: 120, height: 70 },
    //             templates: [
    //                 `${path_giao_dich}\\gd.png`,
    //             ],
    //         },
    //     ];

    const results = await Promise.all(
        regions.map(async (region) => {
            const cropped = await sharp(buffer).extract(region.area).toBuffer();
            const { matchedPoints } = await findMatchingRegionsAndroids({
                buffer: cropped,
                templateImages: region.templates,
                matchThreshold: region.threshold ?? 0.8,
            });
            return { name: region.name, matchedPoints };
        })
    );
    return results.filter(r => r.matchedPoints.length > 0);
}



async function waitUntilAllMatch(hosts, templatePath) {
    const BATCH_SIZE = 16;
    function chunkArray(arr, size) {
        const chunks = [];
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return chunks;
    }

    const done = new Set();

    while (done.size < hosts.length) {
        const remaining = hosts.filter(h => !done.has(h));
        const batches = chunkArray(remaining, BATCH_SIZE);

        for (const batch of batches) {
            const results = await Promise.all(
                batch.map(host =>
                    captureAndMatch(host, templatePath).catch(err => {
                        console.error(`Lỗi ở ${host}:`, err.message);
                        return { host, isOk: false };
                    })
                )
            );

            for (const { host, isOk } of results) {
                if (isOk) {
                    console.log(`ok - ${host}`);
                    done.add(host);
                }
            }

            if (done.size < hosts.length) {
                await new Promise(r => setTimeout(r, 500));
            }
        }
    }
}


(async () => {
    try {
        setupKeyboard();
        await connectAll();

        let path_giao_dich = `C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-giao-dich\\gom-van`;


        const workerPromises = [];
        for (const [index, port] of ports.entries()) {
            await sleep(500);

            const p = (async () => {
                const host = `127.0.0.1:${port}`;

                try {
                    while (!isKilled) {
                        while (isPaused && !isKilled) await sleep(300);
                        if (isKilled) break;

































                    }
                } catch (e) {
                    console.error(`[${host}] Error:`, e.toString());
                }

                console.log(`[${host}] Stopped`);
            })();
            workerPromises.push(p);
        }

        while (!isKilled) await sleep(500);
        await Promise.all(workerPromises);

        console.log("Tất cả đã dừng!");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
})();