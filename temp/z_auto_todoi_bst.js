import fs from "fs";
import { sleep } from './utils/utils.js';
import { spawn } from "child_process";
import sharp from "sharp";
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


async function swipe(host, x1, y1, x2, y2, duration = 300) {
    await runAdb(["-s", host, "shell", "input", "swipe", String(x1), String(y1), String(x2), String(y2), String(duration)]);
    await sleep(200)
}


const actions = {
    1: (host) => tap(host, 815, 130),
    2: (host) => tap(host, 815, 200),
    3: (host) => tap(host, 815, 270),
    4: (host) => tap(host, 815, 340),
    5: (host) => tap(host, 815, 410),
};

// const ports = [16448];
const ports = [16448, 16480, 16512, 16544, 16576, 16608, 16640, 16672, 16704, 16736, 16768, 16800, 16832, 16864, 16896, 16928]
// const arr = [
//   16448, 16480, 16512, 16544, 16576,
//   16608, 16640, 16672, 16704, 16736,
//   16768, 16800, 16832, 16864, 16896,
//   16928, 16960, 16992, 17024,
// ];

function setupKeyboard() {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);

    process.stdin.on("keypress", async (str, key) => {
        if (key.name === "i") {
            console.log("▶ Running...");
            processOnce();
        }
        if (key.ctrl && key.name === "c") {
            process.exit();
        }
    });

    console.log('Phím điều khiển: [m] để chạy\n');
}


let isRunning = false;
async function processOnce() {
    if (isRunning) return;
    isRunning = true;

    try {
        const locations = eval(fs.readFileSync("C:\\Users\\huy\\Desktop\\todoi.txt", "utf8"));

        const lookup = {};
        const counter = {};
        for (const { pos, name, group } of locations) {
            counter[group] = (counter[group] || 0) + 1;

            lookup[pos] = { name, group, index: counter[group] };
        }

        const all_results = {};
        await Promise.all(
            ports.map(async (port) => {
                const host = `127.0.0.1:${port}`;
                const pngBuffer = await runAdb(["-s", host, "exec-out", "screencap", "-p"]);
                const buffer = await sharp(pngBuffer)
                    .extract({
                        left: 10,
                        top: 210,
                        width: 220,
                        height: 70,
                    })
                    .resize({ width: 220 * 4, height: 70 * 4 })
                    .toBuffer();
                const { data } = await Tesseract.recognize(buffer, "eng");
                all_results[port] = data.text;
            })
        );

        // const all_results = {};
        // const BATCH_SIZE = 4;
        // for (let i = 0; i < ports.length; i += BATCH_SIZE) {
        //     const batch = ports.slice(i, i + BATCH_SIZE);

        //     await Promise.all(
        //         batch.map(async (port) => {
        //             const host = `127.0.0.1:${port}`;
        //             const pngBuffer = await runAdb(["-s", host, "exec-out", "screencap", "-p"]);
        //             const buffer = await sharp(pngBuffer)
        //                 .extract({
        //                     left: 10,
        //                     top: 210,
        //                     width: 220,
        //                     height: 70,
        //                 })
        //                 .resize({ width: 220 * 4, height: 70 * 4 })
        //                 .toBuffer();
        //             const { data } = await Tesseract.recognize(buffer, "eng");
        //             all_results[port] = data.text;
        //         })
        //     );
        // }









        const arrAddTeam = {};
        for (const [key, value] of Object.entries(all_results)) {
            const matches = value.match(/\d{1,3}(?:\s*[,.]\s*|\s+)\d{1,3}/g) || [];

            for (const match of matches) {
                const coord = match.replace(/\s*[,.]\s*|\s+/g, " ").trim();

                if (lookup[coord]) {
                    arrAddTeam[key] = lookup[coord].index;
                }
            }
        }



        let pointsOpenAddteam = [
            [190, 157],
            [190, 157],
            [140, 250],
        ];

        for (const [x, y] of pointsOpenAddteam) {
            await Promise.all(ports.map(port => tap(`127.0.0.1:${port}`, x, y)));
            await sleep(300);
        }



        await sleep(1000);

        const entriesArrAddTeam = Object.entries(arrAddTeam);
        const batchSizeArrAddTeam = 4;

        for (let i = 0; i < entriesArrAddTeam.length; i += batchSizeArrAddTeam) {
            const batch = entriesArrAddTeam.slice(i, i + batchSizeArrAddTeam);

            await Promise.all(
                batch.map(async ([key, value]) => {
                    let host = `127.0.0.1:${key}`;

                    if (value <= 5) {
                        await actions[value](host);
                        await sleep(1000);
                        return tap(host, 925, 200)
                    } else if (value == 6) {
                        await swipe(host, 475, 265, 475, 155, 1250);
                        await sleep(1000);
                        await actions[4](host);
                        await sleep(1000);
                        return tap(host, 925, 200)
                    } else if (value == 7) {
                        await swipe(host, 475, 265, 475, 155, 1250);
                        await sleep(1000);
                        await actions[5](host);
                        await sleep(1000);
                        return tap(host, 925, 200)
                    } else if (value == 8) {
                        await swipe(host, 475, 265, 475, 155, 1250);
                        await sleep(1000);
                        await swipe(host, 475, 265, 475, 155, 1250);
                        await sleep(1000);
                        await actions[4](host);
                        await sleep(1000);
                        return tap(host, 925, 200)
                    }
                })
            );
        }

        async function countRun() {
            const totalSeconds = 2 * 60 + 40; // 2 phút 40 giây

            for (let remaining = totalSeconds; remaining > 0; remaining--) {
                const minutes = Math.floor(remaining / 60);
                const seconds = remaining % 60;

                process.stdout.write(
                    `\rThời gian còn lại: ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
                );

                await sleep(1000);
            }

            await Promise.all(
                ports.map(async (port) => {
                    const host = `127.0.0.1:${port}`;
                    return tap(host, 100, 200)
                })
            );
        }

        await countRun();


        // console.log(all_results);
        // console.log(arrAddTeam);
        console.log("Xong");
    } finally {
        isRunning = false;
    }
}

(async () => {
    try {
        setupKeyboard();
        await connectAll();

        console.log("Nhấn m để chạy...");
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
})();