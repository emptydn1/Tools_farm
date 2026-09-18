import fs from "fs";
import { spawn } from "child_process";
import sharp from "sharp";
import { sleep } from './utils/utils.js';
import { findMatchingRegionsAndroids } from './utils/opencvNodejs.js';
import readline from "readline";

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


async function input_text(host, text) {
    await runAdb(["-s", host, "shell", "input", "text", text]);
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

// ────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────



// const ports = [16448]
// const ports = [16448, 16480, 16512, 16544, 16576, 16608, 16640, 16672, 16704, 16736, 16768, 16800, 16832, 16864, 16896, 16928]
const ports = [
    16448,
    16480, 16512, 16544, 16576,
    16608, 16640, 16672, 16704, 16736,
    16768, 16800, 16832, 16864, 16896,
    16928, 16960, 16992, 17024, 17056
]



let isPaused = false; // o = dừng, i = tiếp tục
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

async function captureAndMatch(host, link) {
    const buffer = await runAdb(["-s", host, "exec-out", "screencap", "-p"]);
    const pngBuffer = await sharp(buffer)
        .extract({ left: 350, top: 230, width: 250, height: 70 })
        .toBuffer();

    const { matchedPoints } = await findMatchingRegionsAndroids({
        buffer: pngBuffer,
        templateImages: [link],
        matchThreshold: 0.8,
    });

    const isOk = matchedPoints.some(p => p.mathImagePath === link);
    return { host, isOk };
}

////////////////////////////
////////////////////////////
////////////////////////////

const BATCH_SIZE = 8;
function chunkArray(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}

async function waitUntilAllMatch(hosts, templatePath) {
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
        await connectAll();
        const accounts = await init()
        setupKeyboard();

        let pathMatch = "C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-tai_khoan\\dang_ky"
        console.log(accounts);


        const hosts = ports.map(port => `127.0.0.1:${port}`);
        let count = 0;
        while (!isKilled) {
            while (isPaused && !isKilled) {
                await sleep(300);
            }

            if (isKilled) break;

            await Promise.all(hosts.map(host => tap(host, 500, 105))); // click input
            await sleep(800)
            await Promise.all(hosts.map((host, index) => input_text(host, accounts[count][index])));
            count++
            await sleep(500)
            await Promise.all(hosts.map(host => tap(host, 760, 215))); // click ở ngoài để tắt forrm thành công
            await sleep(500)
            await Promise.all(hosts.map(host => tap(host, 760, 215))); // click ở ngoài để tắt forrm thành công
            await sleep(800)
            await Promise.all(hosts.map(host => tap(host, 660, 460))); // đồng ý tạo

            // B1
            await waitUntilAllMatch(hosts, `${pathMatch}\\b1.png`);
            await Promise.all(hosts.map(host => tap(host, 760, 215))); // click ở ngoài để tắt forrm thành công
            await sleep(500)
            await Promise.all(hosts.map(host => tap(host, 760, 215))); // click ở ngoài để tắt forrm thành công
            await sleep(500)
            await Promise.all(hosts.map(host => tap(host, 760, 215))); // click ở ngoài để tắt forrm thành công
            await sleep(500)
            console.log("done");
        }

        console.log("Tất cả đã dừng!");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
})();