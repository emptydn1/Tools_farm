import fs from "fs";
import { spawn } from "child_process";
import sharp from "sharp";
import { sleep } from './utils/utils.js';
import { findMatchingRegionsAndroids } from './utils/opencvNodejs.js';
import readline from "readline";
import Tesseract from "tesseract.js";
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

const ports = [16448, 16480, 16512, 16544, 16576, 16608, 16640, 16672, 16704, 16736, 16768, 16800, 16832, 16864, 16896, 16928]






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

const data = [
    // pnst
    { pos: "148 68", name: "lam tai", group: "pnst" },
    { pos: "52 46", name: "nong tu", group: "pnst" },
    { pos: "135 65", name: "vo quang", group: "pnst" },
    { pos: "14 35", name: "phan my44", group: "pnst" },
    { pos: "100 74", name: "che linh4", group: "pnst" },
    { pos: "15 14", name: "hoang tram", group: "pnst" },
    { pos: "168 65", name: "nong nhu", group: "pnst" },

    // hhnd
    { pos: "8 9", name: "phan trang", group: "hhnd" },
    { pos: "46 11", name: "duong hoang", group: "hhnd" },
    { pos: "9 29", name: "tham diep", group: "hhnd" },
    { pos: "34 36", name: "trinh dao", group: "hhnd" },
    { pos: "67 20", name: "vo minh", group: "hhnd" },
    { pos: "65 30", name: "phan long11", group: "hhnd" },
    { pos: "67 8", name: "bui sam5", group: "hhnd" },

    // dts
    { pos: "63 79", name: "na linh", group: "dts" },
    { pos: "35 69", name: "che hong22", group: "dts" },
    { pos: "194 61", name: "le dang", group: "dts" },
    { pos: "206 41", name: "phan hieu", group: "dts" },
    { pos: "83 96", name: "doan vinh", group: "dts" },
    { pos: "19 71", name: "lai tu23", group: "dts" },
];

async function captureAndMatch({ deviceId, region, templateImages, matchThreshold = 0.95 }) {
    const buffer = await runAdb(["-s", deviceId, "exec-out", "screencap", "-p"]);
    const pngBuffer = await sharp(buffer)
        .extract(region)
        .toBuffer();

    const { matchedPoints } = await findMatchingRegionsAndroids({
        buffer: pngBuffer,
        templateImages,
        matchThreshold,
    });

    return matchedPoints;
}

let nhan_tra_nv_bst = async (host) => {
    await tap(host, 190, 157)  // to doi
    await sleep(500);
    await tap(host, 190, 157)  // to doi
    await sleep(500);

    await tap(host, 184, 111)  // huy? hien thong tin chu pt
    await sleep(500);
    await tap(host, 400, 440)  // roi doi
    await sleep(500);
    await tap(host, 820, 270)  // nc npc
    await sleep(500);
    await tap(host, 180, 295)  // click tham gia nv

    await tap(host, 730, 460)  // nhan thuong
    await tap(host, 730, 460)  // nhan nv
}

let logout_and_login = async (host) => {
    await tap(host, 946, 257)
    await sleep(500);
    await tap(host, 946, 337)
    await sleep(500);
    await tap(host, 153, 115)
    await sleep(500);
    await tap(host, 800, 250)
    await sleep(500);

    await tap(host, 490, 395)
    await sleep(800);
    await tap(host, 585, 360)
}


(async () => {
    try {
        setupKeyboard();
        await connectAll();
        const worker_get_number = await Tesseract.createWorker("eng");
        await worker_get_number.setParameters({ tessedit_char_whitelist: "0123456789(),./", });

        const templateImagesPos = data.map(item => `C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-lam_bst\\z-output\\${item.pos}.png`);
        const templateImagesTodoi = data.map(item => `C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-lam_bst\\z-output\\todoi\\${item.pos}.png`);
        const pathMatchforB = "C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-lam_bst\\"

        const workerPromises = [];

        for (const [index, port] of ports.entries()) {
            await sleep(500);

            const p = (async () => {
                const host = `127.0.0.1:${port}`;

                try {
                    while (!isKilled) {
                        while (isPaused && !isKilled) {
                            await sleep(300);
                        }

                        if (isKilled) break;

                        const matchedPoints = await captureAndMatch({
                            deviceId: host,
                            region: { left: 600, top: 120, width: 120, height: 40 },
                            templateImages: templateImagesPos,
                        });

                        for (const { x, y, mathImagePath } of matchedPoints) {
                            const found = data.find(item => {
                                const expectedPath = `C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-lam_bst\\z-output\\${item.pos}.png`;
                                return mathImagePath === expectedPath;
                            });

                            if (found) {
                                await tap(host, 730, 460); // khiêu chiến bst

                                let TARGET_IMAGE = `C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-lam_bst\\z-output\\todoi\\${found.pos}.png`;

                                let loop1 = true;
                                while (loop1) {
                                    await sleep(8000);
                                    console.log("loop1");
                                    await tap(host, 100, 200) // tap nv
                                    await tap(host, 100, 200) // tap nv

                                    await tap(host, 190, 157)  // to doi
                                    await tap(host, 190, 157)  // to doi
                                    await tap(host, 140, 250)  // doi xung quanh

                                    await sleep(1500);

                                    let matchedPoints = await captureAndMatch({
                                        deviceId: host,
                                        region: { left: 220, top: 80, width: 120, height: 380 },
                                        templateImages: templateImagesTodoi,
                                    });

                                    let target = matchedPoints.find(p => p.mathImagePath === TARGET_IMAGE);

                                    if (!target) {
                                        await swipe(host, 475, 265, 475, 155, 1250);
                                        await sleep(2000);
                                        matchedPoints = await captureAndMatch({
                                            deviceId: host,
                                            region: { left: 220, top: 80, width: 120, height: 380 },
                                            templateImages: templateImagesTodoi,
                                        });
                                        target = matchedPoints.find(p => p.mathImagePath === TARGET_IMAGE);
                                    }

                                    if (target) {
                                        await tap(host, target.x + 540 + 220, target.y + 85);
                                        await tap(host, 925, 200)   // click ra ngoai
                                    }

                                    await sleep(3000);

                                    await tap(host, 190, 157)  // to doi
                                    await tap(host, 190, 157)  // to doi
                                    await tap(host, 190, 157)  // to doi

                                    let matchedPoints2 = await captureAndMatch({
                                        deviceId: host,
                                        region: { left: 0, top: 70, width: 530, height: 270 },
                                        templateImages: [
                                            // `${pathMatchforB}\\b1.png`,
                                            `${pathMatchforB}\\b4.png`,
                                        ],
                                        matchThreshold: 0.8,
                                    });

                                    if (matchedPoints2.length > 0) {
                                        for (const { x, y, mathImagePath } of matchedPoints2) {
                                            if (mathImagePath == `${pathMatchforB}\\b4.png`) {
                                                await tap(host, 925, 200);   // click ra ngoai
                                                loop1 = false;
                                                await logout_and_login(host);
                                            }
                                        }
                                    } else {
                                        await tap(host, 925, 200)   // click ra ngoai
                                        await tap(host, 925, 200)   // click ra ngoai
                                    }
                                }

                                let loop2 = true;
                                while (loop2) {
                                    const buffer = await runAdb(["-s", host, "exec-out", "screencap", "-p"]);
                                    const pngBuffer = await sharp(buffer)
                                        .extract({ left: 10, top: 240, width: 90, height: 40 })
                                        .resize({
                                            width: 90 * 4,
                                            height: 40 * 4,
                                            kernel: sharp.kernel.lanczos3, // giữ nét khi phóng to
                                        })
                                        .grayscale()
                                        .normalize()          // tăng tương phản tự động
                                        .threshold(150)        // nhị phân hóa: 150 tùy vào độ sáng chữ, chỉnh nếu cần
                                        .sharpen()             // làm nét thêm biên chữ/dấu /
                                        .toBuffer();

                                    let { data: ocrToDoi } = await worker_get_number.recognize(pngBuffer)
                                    const ocrTextToDoi = ocrToDoi.text.toLowerCase();

                                    if (/1\s*\/\s*1/.test(ocrTextToDoi)) {
                                        await tap(host, 100, 200)
                                        await sleep(8000)
                                        await nhan_tra_nv_bst(host)
                                        loop2 = false;
                                    } else {
                                        await tap(host, 100, 200)
                                    }
                                }
                            } else {
                                // nếu không tìm thấy vị trí thì kiểm tra xem end chưa
                                const pngBuffer = await runAdb(["-s", host, "exec-out", "screencap", "-p"]);
                                const { matchedPoints } = await findMatchingRegionsAndroids({
                                    buffer: pngBuffer,
                                    templateImages: [
                                        `${pathMatchforB}\\b2.png`,
                                        `${pathMatchforB}\\b3.png`,
                                    ],
                                    matchThreshold: 0.8,
                                });

                                if (matchedPoints.length > 0) {
                                    for (const { x, y, mathImagePath } of matchedPoints) {
                                        if (mathImagePath == `${pathMatchforB}\\b2.png` || mathImagePath == `${pathMatchforB}\\b3.png`) {
                                            await tap(host, 925, 200)   // click ra ngoai
                                            await tap(host, 925, 200)   // click ra ngoai
                                            await logout_and_login(host)
                                            return;
                                        }
                                    }
                                }
                            }
                        }


                        await sleep(3000)
                    }
                } catch (e) {
                    console.error(`[${host}] Error:`, e.toString());
                }

                console.log(`[${host}] Stopped`);
            })();
            workerPromises.push(p);
        }

        while (!isKilled) {
            await sleep(500);
        }

        await Promise.all(workerPromises);
        await worker_get_number.terminate();

        console.log("Tất cả đã dừng!");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
})();