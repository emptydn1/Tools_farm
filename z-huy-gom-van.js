import fs from "fs";
import { spawn } from "child_process";
import sharp from "sharp";
import { sleep } from './utils/utils.js';
import { findMatchingRegionsAndroids } from './utils/opencvNodejs.js';
import readline from "readline";
// import Tesseract from "tesseract.js";
// import { distance } from "fastest-levenshtein";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


function question(text) {
    return new Promise(resolve => {
        rl.question(text, resolve);
    });
}


async function init() {
    let input1;
    let input2;
    let arr1;
    let arr2;

    // Nhập lần 1
    while (true) {
        input1 = await question("Nhập lần 1: ");
        arr1 = input1.split("-");
        if (arr1.length >= 3) break;
        console.log("❌ Nhập sai! Phải có dạng: 1-hoangdnvn-10");
    }

    // Nhập lần 2
    while (true) {
        input2 = await question("Nhập lần 2: ");
        arr2 = input2.split("-");
        if (arr2.length >= 3) break;
        console.log("❌ Nhập sai! Phải có dạng: 3-hoangdnvn-13");
    }

    const start = parseInt(arr1[0]);
    const name = arr1[1];
    const end = parseInt(arr2[0]);

    const startNumber = parseInt(arr1[2]);
    const endNumber = parseInt(arr2[2]);

    const accounts = [];

    for (let i = start; i <= end; i++) {
        let temp = [];
        for (let j = startNumber; j <= endNumber; j++) {
            temp.push(`${i}${name}${j}`);
        }
        accounts.push(temp)
    }
    return accounts;
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

async function swipe(host, x1, y1, x2, y2, duration = 300) {
    await runAdb(["-s", host, "shell", "input", "swipe", String(x1), String(y1), String(x2), String(y2), String(duration)]);
    await sleep(200)
}

async function input_text(host, text) {
    await runAdb(["-s", host, "shell", "input", "text", text]);
}


// ────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────


const ports = [
    16448,
    // 16480, 16512, 16544, 16576,
    // 16608, 16640, 16672, 16704, 16736,
    // 16768, 16800, 16832, 16864, 16896,
    // 16928,
    //  16960, 16992, 17024, 17056
]


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


const CONFIGS = {
    // "1": {
    //     navTaps: [
    //         { x: 801, y: 300 }, // phù đến tây sơn thôn
    //         { x: 157, y: 335 },
    //         { x: 175, y: 380 },
    //         { x: 175, y: 380 },
    //     ],
    //     templateImage: "tay_son_thon.png",
    //     logLabel: "tay son thon",
    //     positions: [
    //         { x: 291, y: 218 },
    //         { x: 357, y: 192 },
    //         { x: 412, y: 159 },
    //         { x: 476, y: 143 },
    //         { x: 660, y: 170 },
    //         { x: 350, y: 325 },
    //         { x: 418, y: 355 },
    //         { x: 658, y: 280 },
    //         { x: 627, y: 130 },
    //         { x: 728, y: 205 },
    //     ],
    // },
    "1": {
        navTaps: [
            { x: 801, y: 300 }, // phù đến lâm an tây
            { x: 310, y: 335 },
            { x: 310, y: 335 },
            { x: 310, y: 335 },
            { x: 310, y: 335 },
        ],
        templateImage: "lam_an.png",
        logLabel: "lam an tay",
        positions: [
            { x: 403, y: 364 },
            { x: 315, y: 289 },
            { x: 281, y: 185 },
            { x: 372, y: 151 },
            { x: 430, y: 121 },
            { x: 541, y: 116 },
            { x: 592, y: 135 },
            { x: 664, y: 174 },
            { x: 762, y: 218 },
            { x: 618, y: 321 },
        ],
    },
    "2": {
        navTaps: [
            { x: 801, y: 300 }, // phù đến lâm an nam
            { x: 310, y: 335 },
            { x: 310, y: 335 },
            { x: 310, y: 335 },
            { x: 175, y: 380 },
        ],
        templateImage: "lam_an_nam.png",
        logLabel: "lam an nam",
        positions: [
            { x: 324, y: 300 },
            { x: 285, y: 191 },
            { x: 336, y: 164 },
            { x: 410, y: 132 },
            { x: 487, y: 95 },
            { x: 466, y: 336 },
            { x: 623, y: 151 },
            { x: 705, y: 205 },
            { x: 650, y: 250 },
            { x: 553, y: 100 },
        ],
    },
    "3": {
        navTaps: [
            { x: 801, y: 300 },
            { x: 310, y: 335 },
            { x: 310, y: 335 },

            { x: 175, y: 380 }, // phù đến biện kinh nam
            { x: 175, y: 420 },
        ],
        templateImage: "bien_kinh_nam.png",
        logLabel: "bien kinh nam",
        positions: [
            { x: 315, y: 215 },
            { x: 385, y: 175 },
            { x: 453, y: 135 },
            { x: 352, y: 319 },
            { x: 532, y: 320 },
            { x: 600, y: 262 },
            { x: 540, y: 151 },
            { x: 440, y: 312 },
            { x: 650, y: 374 },
            { x: 675, y: 155 },
        ],
    },
};


let isPaused = true; // o = dừng, i = tiếp tục
let isKilled = false; // k = kill all

function setupKeyboard() {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);

    process.stdin.on('keypress', (str, key) => {
        if (key.name === 'i') {
            isPaused = false;
            console.log('\n[CONTROL] ▶ Tiếp tục chạy');
        } 
        // else if (key.name === 'o') {
        //     isPaused = true;
        //     console.log('\n[CONTROL] ⏸ Tạm dừng');
        // } else if (key.name === 'k') {
        //     isKilled = true;
        //     isPaused = false; // bỏ pause để các vòng while thoát được
        //     console.log('\n[CONTROL] ✖ Kill all - đang dừng...');
        // }
        if (key.ctrl && key.name === "c") {
            process.exit();
        }
    });

    console.log('Phím điều khiển: [i] Tiếp tục  [o] Tạm dừng  [k] Kill all\n');
}

/**
 * Chạy TOÀN BỘ pipeline giao dịch cho MỘT host duy nhất.
 * Không còn Promise.all theo từng bước dùng chung cho cả batch nữa —
 * mỗi host tự đi hết các bước của nó, độc lập hoàn toàn với các host khác.
 * Nhờ vậy, host nào xong bước nào thì đi tiếp bước đó luôn, không phải
 * đợi những host chậm hơn trong cùng batch "bắt kịp".
 */
async function runGiaoDichForHost(host, config, path_giao_dich, index, account) {
    const { navTaps, templateImage, logLabel, positions } = config;

    // chờ login hoặc đã lên trên map đánh bst
    await waitUntilMatch({
        deviceId: host,
        region: { left: 150, top: 50, width: 180, height: 50 },
        templateImages: [`${path_giao_dich}\\luyen_cong.png`],
        matchThreshold: 0.8,
    });

    await sleep(1000);

    // 1. Điều hướng
    for (const { x, y } of navTaps) {
        await tap(host, x, y);
        await sleep(500);
    }

    // 2. Chờ tới đúng khu vực
    await waitUntilMatch({
        deviceId: host,
        region: { left: 830, top: 80, width: 100, height: 50 },
        templateImages: [`${path_giao_dich}\\${templateImage}`],
        matchThreshold: 0.95,
    });
    console.log(`[${host}] ${logLabel}`);

    await sleep(1000);

    // 3. Chọn vị trí (quay vòng nếu số host > số positions)
    const pos = positions[index % positions.length];
    await tap(host, pos.x, pos.y);

    // 4. Mở bảng thông tin và nhấn nút giao dịch
    await sleep(500);
    await tap(host, 825, 145);
    await sleep(500);
    await tap(host, 770, 275);

    await waitUntilMatch({
        deviceId: host,
        region: { left: 410, top: 50, width: 150, height: 70 },
        templateImages: [`${path_giao_dich}\\form_giao_dich.png`],
        matchThreshold: 0.8,
    });

    // 5. Vòng nhập số lượng "999999" nếu khác 0
    let loopKhac0 = true;
    while (loopKhac0) {
        const buffer = await runAdb(["-s", host, "exec-out", "screencap", "-p"]);
        const pngBuffer = await sharp(buffer)
            .extract({ left: 280, top: 455, width: 100, height: 50 })
            .toBuffer();

        const { matchedPoints } = await findMatchingRegionsAndroids({
            buffer: pngBuffer,
            templateImages: [`${path_giao_dich}\\khac_0.png`],
            matchThreshold: 0.8,
        });

        if (matchedPoints.length > 0) {
            await tap(host, 318, 479);
            await sleep(500);
            await input_text(host, "999999");
            await sleep(500);
            await tap(host, 517, 300);
        } else {
            loopKhac0 = false;
        }
        await sleep(500);
    }

    // 6. Vòng lock/kiểm tra kỹ năng
    let loopKiNang = true;
    while (loopKiNang) {
        // lock
        await sleep(500);
        await tap(host, 790, 475);

        await sleep(500);
        const buffer = await runAdb(["-s", host, "exec-out", "screencap", "-p"]);
        const pngBuffer = await sharp(buffer)
            .extract({ left: 70, top: 80, width: 150, height: 70 })
            .toBuffer();

        const { matchedPoints } = await findMatchingRegionsAndroids({
            buffer: pngBuffer,
            templateImages: [`${path_giao_dich}\\ki_nang.png`],
            matchThreshold: 0.8,
        });

        if (matchedPoints.length > 0) {
            await tap(host, 865, 100);
            loopKiNang = false;

            await sleep(1000);
            await tap(host, 946, 257);
            await sleep(800);
            await tap(host, 946, 337);
            await sleep(800);
            await tap(host, 153, 115);
            await sleep(500);
            await tap(host, 800, 250);
            await sleep(500);

        }
    }


    // 7. Vòng login
    let looplogin = true;
    while (looplogin) {
        const buffer = await runAdb(["-s", host, "exec-out", "screencap", "-p"]);
        const pngBuffer = await sharp(buffer)
            .extract({ left: 270, top: 400, width: 400, height: 100 })
            .toBuffer();

        const { matchedPoints } = await findMatchingRegionsAndroids({
            buffer: pngBuffer,
            templateImages: [`${path_giao_dich}\\b2.png`],
            matchThreshold: 0.8,
        });

        if (matchedPoints.length > 0) {
            looplogin = false;
        } else {
            await tap(host, 490, 395)// bấm đăng nhập để nhập tài khoản
            await sleep(500);
            await tap(host, 480, 200) // chỗ nhập tài khoản
            await sleep(500);
            await input_text(host, account);
            await sleep(500);
            await tap(host, 585, 360) // nhấn đăng nhập
        }
    }
}


async function runGiaoDichBatch(hosts, config, path_giao_dich, account) {
    await Promise.all(
        hosts.map((host, index) =>
            runGiaoDichForHost(host, config, path_giao_dich, index, account[index])
        )
    );
}

const BATCH_SIZE = 8;

// Chia mảng thành từng nhóm nhỏ kích thước `size`
function chunkArray(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}

const arg = process.argv[2];
const skipFirstBatchFlag = process.argv[3];
const shouldSkipFirstBatch = skipFirstBatchFlag === "e";

(async () => {
    try {
        setupKeyboard();
        await connectAll();
        let accounts = await init();

        let path_giao_dich = `C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-giao-dich\\gom-van\\huy`;
        const hosts = ports.map(port => `127.0.0.1:${port}`);

        let batches = chunkArray(hosts, BATCH_SIZE);

        if (shouldSkipFirstBatch) {
            const skipped = batches[0] ?? [];
            batches = batches.slice(1);
            console.log(`[SKIP] Bỏ qua batch đầu tiên (${skipped.length} máy):`, skipped.join(", "));
        }

        if (!CONFIGS[arg]) {
            console.error(`Không tìm thấy CONFIG cho arg="${arg}"`);
            return;
        }

        while (isPaused) {
            console.log("nhấn i để tiếp tục");
            await sleep(500);
        }

        for (const account of accounts) {
            for (const [batchIndex, batchHosts] of batches.entries()) {
                await runGiaoDichBatch(batchHosts, CONFIGS[arg], path_giao_dich, account);
            }
        }
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
})();