import fs from "fs";
import { spawn } from "child_process";
import sharp from "sharp";
import { sleep, waitForInput } from './utils/utils.js';
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
    let input;

    // Nhập 1 lần
    while (true) {
        input = await question("Nhập: ");

        const arr = input.split("-");

        if (arr.length !== 3) {
            console.log("❌ Nhập sai! Ví dụ: 1+5-huy-1+15");
            continue;
        }

        const accountRange = arr[0].split("+");
        const name = arr[1];
        const numberRange = arr[2].split("+");

        if (
            accountRange.length !== 2 ||
            numberRange.length !== 2 ||
            isNaN(accountRange[0]) ||
            isNaN(accountRange[1]) ||
            isNaN(numberRange[0]) ||
            isNaN(numberRange[1]) ||
            !name
        ) {
            console.log("❌ Nhập sai! Ví dụ: 1+5-huy-1+15");
            continue;
        }

        const start = parseInt(accountRange[0]);
        const end = parseInt(accountRange[1]);

        const startNumber = parseInt(numberRange[0]);
        const endNumber = parseInt(numberRange[1]);

        const accounts = [];

        for (let i = start; i <= end; i++) {
            const temp = [];

            for (let j = startNumber; j <= endNumber; j++) {
                temp.push(`${i}${name}${j}`);
            }

            accounts.push(temp);
        }

        return accounts;
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

async function swipe(host, x1, y1, x2, y2, duration = 300) {
    try {
        await runAdb(["-s", host, "shell", "input", "swipe", String(x1), String(y1), String(x2), String(y2), String(duration)]);
        await sleep(200)
    } catch (error) {

    }
}

async function input_text(host, text) {
    await runAdb(["-s", host, "shell", "input", "text", text]);
}

// ────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────


// const ports = [16448]
const ports = [
    16448,
    // 16480,
    // 16512, 16544, 16576,
    // 16608, 16640, 16672, 16704, 16736,
    // 16768, 16800, 16832, 16864, 16896,
    // 16928, 16960, 16992, 17024, 17056
]


let isKilled = false; // k = kill all

async function captureAndMatch({ deviceId, region, templateImages, matchThreshold = 0.95 }) {
    const buffer = await runAdb(["-s", deviceId, "exec-out", "screencap", "-p"]);
    const pngBuffer = await sharp(buffer)
        .extract(region)
        .toBuffer();

    // fs.writeFileSync("xxxxxxxx.png", pngBuffer)
    const { matchedPoints } = await findMatchingRegionsAndroids({
        buffer: pngBuffer,
        templateImages,
        matchThreshold,
    });

    return matchedPoints;
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

const actionsNhanVat = {
    1: (host) => tap(host, 75, 130),
    2: (host) => tap(host, 75, 230),
    3: (host) => tap(host, 75, 330),
};

let logout = async (host) => {
    await tap(host, 946, 257)
    await sleep(800);
    await tap(host, 946, 337)
    await sleep(800);
    await tap(host, 153, 115)
    await sleep(500);
    await tap(host, 800, 250)
    await sleep(500);
}

let trangBiKimPhong = async (host) => {
    await tap(host, 890, 260);  // túi trang bị
    await sleep(800);

    await tap(host, 875, 258);  // mục trang bị
    await sleep(500);
    for (let i = 0; i < 7; i++) {
        await tap(host, 560, 135);
        await sleep(300);
        await tap(host, 686, 381);
        await sleep(300);
    }
    await sleep(500)

    await tap(host, 875, 359);   // mục đạo cụ
    await sleep(500);
    await tap(host, 560, 135)
    await sleep(500);
    await tap(host, 700, 435);
    await sleep(500);
    await tap(host, 678, 235);

    await sleep(500);
    await tap(host, 865, 85);
    await sleep(500);
    await tap(host, 865, 85);
    await sleep(500);
    await tap(host, 865, 85);
}

const arg = process.argv[2];

(async () => {
    try {
        // setupKeyboard();
        await connectAll();
        let accounts = await init();
        // let accounts = [["12312"]]
        // console.log(accounts);

        const basePath = `C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-cay-kim-phong`
        const resourcePath = `C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-lam_bst`;

        const loginPath = `${resourcePath}\\dang-nhap`;
        const checkGameStartPath = `${resourcePath}\\check-vao-game`;
        const khuVucPath = `${basePath}\\khu_vuc`;


        const hosts = ports.map(port => `127.0.0.1:${port}`);

        // ---- Một "tick" của vòng lặp đăng nhập cho 1 host ----
        async function loginTick(host, idx, username, countLogin) {
            await tap(host, 860, 85) // nút hủy
            await sleep(300);

            const result3 = await captureAndMatch({
                deviceId: host,
                region: { left: 340, top: 415, width: 260, height: 70 },
                templateImages: [`${loginPath}\\vao-giang-ho.png`],
            });
            if (result3.length > 0) {
                await tap(host, 490, 445) // nhấn đăng nhập vào chọn nhân vật
                return false;
            }

            const result4 = await captureAndMatch({
                deviceId: host,
                region: { left: 750, top: 420, width: 210, height: 80 },
                templateImages: [`${loginPath}\\vao_game.png`],
            });
            if (result4.length > 0) return true;

            const result1 = await captureAndMatch({
                deviceId: host,
                region: { left: 330, top: 340, width: 300, height: 100 },
                templateImages: [`${loginPath}\\dang-nhap-voi-mbox-id.png`],
            });
            if (result1.length > 0) {
                await tap(host, 490, 425)// bấm đăng nhập để nhập tài khoản
                await sleep(1000);
            }

            const result2 = await captureAndMatch({
                deviceId: host,
                region: { left: 400, top: 120, width: 170, height: 60 },
                templateImages: [`${loginPath}\\form_login.png`],
            });
            if (result2.length > 0) {
                if (countLogin[idx] == 4) {
                    await tap(host, 480, 200) // chỗ nhập tài khoản
                    await sleep(1000);
                    await input_text(host, username);
                    await sleep(500);
                }

                await tap(host, 585, 360) // nhấn đăng nhập
                await sleep(500);
                await tap(host, 490, 445) // nhấn đăng nhập vào chọn nhân vật
                await sleep(500);
            }

            return false;
        }

        // ---- Đăng nhập đồng bộ theo tick cho TẤT CẢ 20 host ----
        async function loginAllHosts(accountRow, countLogin) {
            const done = hosts.map(() => false);
            while (!done.every(d => d)) {
                await Promise.all(hosts.map(async (host, idx) => {
                    if (done[idx]) return;
                    done[idx] = await loginTick(host, idx, accountRow[idx], countLogin);
                }));
            }
        }

        // ---- Xử lý 3 round cho MỘT DÒNG account, dùng chung 20 host ----
        async function processRow(accountRow) {
            let countLogin = hosts.map(() => 4);
            if (arg) countLogin = hosts.map(() => arg);

            for (let round = 0; round < 3; round++) {
                console.log(`round ${round + 1}`, accountRow[0]);

                // Bước 1: đăng nhập - đồng bộ từng tick cho cả 20 host
                await loginAllHosts(accountRow, countLogin);

                // Bước 2: chọn nhân vật (mỗi host dùng đúng countLogin của chính nó)
                await Promise.all(hosts.map(async (host, idx) => {
                    if (countLogin[idx] == 4) countLogin[idx] = 1;
                    await actionsNhanVat[countLogin[idx]](host);
                    await sleep(100);
                    await actionsNhanVat[countLogin[idx]](host);
                    await sleep(100);
                    await actionsNhanVat[countLogin[idx]](host);
                    await sleep(1000);
                }));
                await Promise.all(hosts.map(host => tap(host, 864, 453)));
                hosts.forEach((_, idx) => countLogin[idx]++);




                await waitForInput()




                await Promise.all(hosts.map(host => trangBiKimPhong(host)));

                await Promise.all(hosts.map(host => waitUntilMatch({
                    deviceId: host,
                    region: { left: 150, top: 50, width: 180, height: 50 },
                    templateImages: [`${checkGameStartPath}\\luyen-cong.png`],
                    matchThreshold: 0.8,
                })));

                await Promise.all(hosts.map(host => logout(host)));
            }
        }

        console.log("Tất cả đã dừng!");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
})();