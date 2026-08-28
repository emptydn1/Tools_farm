import fs from "fs";
import { spawn } from "child_process";
import sharp from "sharp";
import { sleep } from './utils/utils.js';
import { findMatchingRegionsAndroids } from './utils/opencvNodejs.js';
import readline from "readline";
import Tesseract from "tesseract.js";
import { distance } from "fastest-levenshtein";


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

function generateUniqueFileName(prefix = 'file') {
    const [seconds, nanoseconds] = process.hrtime();
    const random = Math.random().toString(36).slice(2, 8);
    return `${prefix}_${seconds}${nanoseconds}_${random}.png`;
}

const actions = {
    1: (host) => tap(host, 815, 130),
    2: (host) => tap(host, 815, 200),
    3: (host) => tap(host, 815, 270),
    4: (host) => tap(host, 815, 340),
    5: (host) => tap(host, 815, 410),
};
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

////////////////////////////////////////////////////////
////////////////////////////////////////////////////////
////////////////////////////////////////////////////////
function findLocation(ocrText, isCity = 0) {
    const cityList = ["phuong tuong", "lam an", "bien kinh", "tuong duong", "thanh do", "dai ly", "duong chau"];
    const campList = ["ang ha nguyen da", "uc nguu", "diem thuong son"]
    const other = ["lap doi", "boss sat thu"]
    console.log("findLocation");

    let locationList;
    if (isCity == 0) {
        locationList = cityList;
    } else if (isCity == 1) {
        locationList = campList;
    } else if (isCity == 2) {
        locationList = other;
    }

    function normalize(text) {
        return text
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D")
            .replace(/[^a-zA-Z0-9\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
    }

    const text = normalize(ocrText);

    // OCR không đọc được gì
    if (!text) return null;

    let bestCity = null;
    let bestDistance = Infinity;
    let bestSimilarity = 0;

    for (const city of locationList) {
        // Nếu OCR có chứa tên thành phố thì trả về luôn
        if (text.includes(city)) return { city, similarity: 1, distance: 0 };

        const d = distance(text, city);
        const similarity = 1 - d / Math.max(text.length, city.length);

        if (similarity > bestSimilarity) {
            bestSimilarity = similarity;
            bestDistance = d;
            bestCity = city;
        }
    }

    // Dưới 60% thì coi như OCR sai
    if (bestSimilarity < 0.6) {
        return null;
    }

    return {
        city: bestCity,
        similarity: Number(bestSimilarity.toFixed(2)),
        distance: bestDistance
    };
}


let to_doi = async (host, ocrText) => {
    console.log("to_doi");
    // const locations = eval(fs.readFileSync("C:\\Users\\huy\\Desktop\\Tools_CDP\\1.txt", "utf8"));
    const locations = eval(fs.readFileSync("C:\\Users\\huy\\Desktop\\todoi.txt", "utf8"));

    const lookup = {};
    const counter = {};
    for (const { pos, name, group } of locations) {
        counter[group] = (counter[group] || 0) + 1;
        lookup[pos] = { name, group, index: counter[group] };
    }

    const matches = ocrText.match(/\d{1,3}(?:\s*[,./]\s*|\s+)\d{1,3}/g) || [];

    for (const match of matches) {
        if (/^\s*[01]\s*\/\s*1\s*$/.test(match)) continue; // bỏ qua 0/1 và 1/1
        const coord = match.replace(/\s*[,./]\s*|\s+/g, " ").trim();

        if (lookup[coord]) {
            let pointsOpenAddteam = [
                [190, 157],
                [190, 157],
                [140, 250],
                [140, 250],
            ];

            for (const [x, y] of pointsOpenAddteam) {
                await tap(host, x, y);
                await sleep(300);
            }

            await sleep(1000);

            let value = lookup[coord].index;

            if (value <= 5) {
                await actions[value](host);
                await sleep(1000);
                await tap(host, 925, 200)
            } else if (value == 6) {
                await swipe(host, 475, 265, 475, 155, 1250);
                await sleep(1000);
                await actions[4](host);
                await sleep(1000);
                await tap(host, 925, 200)
            } else if (value == 7) {
                await swipe(host, 475, 265, 475, 155, 1250);
                await sleep(1000);
                await actions[5](host);
                await sleep(1000);
                await tap(host, 925, 200)   // click ra ngoai
            }
        }
    }
}

let nhan_tra_nv_bst = async (host) => {
    tap(host, 190, 157)  // to doi
    await sleep(500);
    tap(host, 190, 157)  // to doi
    await sleep(500);

    tap(host, 184, 111)  // huy? hien thong tin chu pt
    await sleep(1000);
    tap(host, 400, 440)  // roi doi
    await sleep(1000);
    tap(host, 820, 270)  // nc npc
    await sleep(1000);
    tap(host, 180, 295)  // click tham gia nv
    await sleep(1000);

    for (let i = 0; i < 6; i++) {
        tap(host, 730, 460)
        await sleep(500);
    }
}

let logout_and_login = async (host) => {
    tap(host, 925, 200)
    await sleep(500);
    tap(host, 925, 200)
    await sleep(500);
    tap(host, 946, 257)
    await sleep(800);
    tap(host, 946, 337)
    await sleep(800);
    tap(host, 153, 115)
    await sleep(800);
    tap(host, 800, 250)
    await sleep(500);

    tap(host, 490, 395)
    await sleep(800);
    tap(host, 585, 360)
}


(async () => {
    try {
        setupKeyboard();
        await connectAll();
        let pathMatch = "C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-lam_bst"

        const worker = await Tesseract.createWorker("vie");
        await worker.setParameters({ tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE });
        const worker_get_number = await Tesseract.createWorker("vie");
        await worker_get_number.setParameters({ tessedit_char_whitelist: "0123456789(),./", });

        const workerPromises = [];

        for (const [index, port] of ports.entries()) {
            await sleep(500);

            const p = (async () => {
                const host = `127.0.0.1:${port}`;
                let exclude = [];
                let task1 = false;
                let toDoi = false;

                try {
                    while (!isKilled) {
                        while (isPaused && !isKilled) {
                            await sleep(300);
                        }

                        if (isKilled) break;

                        const pngBuffer = await runAdb(["-s", host, "exec-out", "screencap", "-p"]);
                        const base = sharp(pngBuffer);
                        const [buffer, buffer_to_doi] = await Promise.all([
                            base.clone()
                                .extract({ left: 830, top: 0, width: 110, height: 25 })
                                // .resize({ width: 110 * 5, height: 25 * 5 })
                                .toBuffer(),
                            base.clone()
                                .extract({ left: 10, top: 210, width: 220, height: 70 })
                                // .resize({ width: 220 * 10, height: 70 * 10 })
                                .toBuffer(),
                        ]);

                        const [{ data: ocrData }, { data: ocrToDoi }] = await Promise.all([
                            worker.recognize(buffer),
                            worker_get_number.recognize(buffer_to_doi),
                        ]);

                        const ocrText = ocrData.text.toLowerCase();
                        const ocrTextToDoi = ocrToDoi.text.toLowerCase();

                        // const campList = ["ang ha nguyen da", "uc nguu", "diem thuong son"]
                        if (findLocation(ocrText, 1)?.city && task1 == false) {
                            await tap(host, 100, 200)
                            await tap(host, 100, 200)
                            await tap(host, 100, 200)
                            await sleep(1000)
                            if (findLocation(ocrText, 1)?.city == "uc nguu") {

                            }

                            await to_doi(host, ocrTextToDoi)
                            task1 = true;
                            console.log("nhiem vu 2")

                            toDoi = true;
                        } else if (/1\s*\/\s*1/.test(ocrTextToDoi) && task1 == true) {
                            toDoi = false;
                            await tap(host, 100, 200)
                            await tap(host, 100, 200)
                            await tap(host, 100, 200)

                            await sleep(8000)
                            await nhan_tra_nv_bst(host)

                            const pngBuffer = await runAdb(["-s", host, "exec-out", "screencap", "-p"]);
                            const { matchedPoints } = await findMatchingRegionsAndroids({
                                buffer: pngBuffer,
                                templateImages: [
                                    `${pathMatch}\\b2.png`,
                                    `${pathMatch}\\b3.png`,
                                ],
                                matchThreshold: 0.8,
                            });

                            if (matchedPoints.length > 0) {
                                for (const { x, y, mathImagePath } of matchedPoints) {
                                    if (mathImagePath == `${pathMatch}\\b2.png`) {
                                        await logout_and_login(host)
                                        return;
                                    } else if (mathImagePath == `${pathMatch}\\b3.png`) {
                                        await logout_and_login(host)
                                        return;
                                    }
                                }
                            }

                            await sleep(5000)
                            await tap(host, 100, 200)
                            await tap(host, 100, 200)
                            await tap(host, 100, 200)
                            task1 = false;
                        } else if (toDoi == true) {
                            await tap(host, 100, 200)
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
        await worker.terminate();
        await worker_get_number.terminate();

        console.log("Tất cả đã dừng!");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
})();