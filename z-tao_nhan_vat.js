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



const ports = [16448]
// const ports = [16448, 16480, 16512, 16544, 16576, 16608, 16640, 16672, 16704, 16736, 16768, 16800, 16832, 16864, 16896, 16928]



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
    const pngBuffer = await runAdb(["-s", host, "exec-out", "screencap", "-p"]);
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

function generateId() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    let part1 = "";

    for (let i = 0; i < 5; i++) {
        part1 += letters[Math.floor(Math.random() * letters.length)];
    }

    const now = new Date();

    const time =
        String(now.getMinutes()).padStart(2, "0") +
        String(now.getSeconds()).padStart(2, "0") +
        String(now.getMilliseconds()).padStart(3, "0");

    return `${part1}${time}`;
}


(async () => {
    try {
        await connectAll();
        const accounts = await init()
        setupKeyboard();
        let pathMatch = "C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-tai_khoan\\tao_nhan_vat"

        const hosts = ports.map(port => `127.0.0.1:${port}`);
        let count = 0;
        while (!isKilled) {
            while (isPaused && !isKilled) {
                await sleep(300);
            }

            if (isKilled) break;


            // B1
            await waitUntilAllMatch(hosts, `${pathMatch}\\b1.png`);
            // nhan login
            await Promise.all(hosts.map(host => tap(host, 490, 395))); // mở form đăng nhập
            await sleep(800)
            await Promise.all(hosts.map(host => tap(host, 495, 205))); // click input
            await sleep(800)
            await Promise.all(hosts.map((host, index) => input_text(host, accounts[count][index])));
            count++
            await sleep(300)
            await Promise.all(hosts.map(host => tap(host, 585, 360))); // đăng nhập

            //B3
            function chunkArray(arr, size) {
                const chunks = [];
                for (let i = 0; i < arr.length; i += size) {
                    chunks.push(arr.slice(i, i + size));
                }
                return chunks;
            }

            const BATCH_SIZE = 16;
            const batches = chunkArray(hosts, BATCH_SIZE);

            for (const batch of batches) {
                const workerPromises = batch.map((host, idx) => (async () => {
                    try {
                        let isDone = false;
                        while (!isDone) {
                            const pngBuffer = await runAdb(["-s", host, "exec-out", "screencap", "-p"]);
                            const { matchedPoints } = await findMatchingRegionsAndroids({
                                buffer: pngBuffer,
                                templateImages: [
                                    `${pathMatch}\\b2.png`,
                                    `${pathMatch}\\b3.png`,
                                    `${pathMatch}\\b4.png`,
                                    `${pathMatch}\\b5.png`,
                                ],
                                matchThreshold: 0.8,
                            });

                            if (matchedPoints.length > 0) {
                                for (const { x, y, mathImagePath } of matchedPoints) {
                                    if (mathImagePath == `${pathMatch}\\b2.png`) {
                                        await tap(host, 485, 365);
                                        await sleep(1000);
                                        // await tap(host, 130, 275); // chọn mục cụm 1
                                        // await sleep(1000);
                                        // await tap(host, 630, 145); // chọn hoa sơn

                                        await tap(host, 130, 335); // chọn mục cụm 2
                                        await sleep(1000);
                                        await tap(host, 630, 145); // chọn châu giang

                                        await sleep(800);
                                        await tap(host, 485, 445); // nhấn nút bắt đầu
                                    } else if (mathImagePath == `${pathMatch}\\b3.png`) {
                                        await tap(host, 75, 130);
                                        await tap(host, 75, 230);
                                        await tap(host, 75, 330);
                                    } else if (mathImagePath == `${pathMatch}\\b4.png`) {
                                        await tap(host, 480, 480);
                                        await sleep(500);
                                        await input_text(host, generateId());
                                        await sleep(500);
                                        await tap(host, 500, 275);
                                        await sleep(500);
                                        await tap(host, 860, 455);
                                    }
                                    const count = matchedPoints.filter(item => item.mathImagePath.includes('b5.png')).length;
                                    if (count >= 3) {
                                        await tap(host, 75, 30);
                                        await sleep(1000);
                                        await tap(host, 65, 470);
                                        return;
                                    }
                                }
                            }
                            await sleep(1000);
                        }
                    } catch (e) {
                        console.error(`[${host}] Error:`, e.toString());
                    }
                })());
                await Promise.all(workerPromises);
            }
            console.log("done");
        }

        console.log("Tất cả đã dừng!");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
})();