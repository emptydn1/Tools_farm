import fs from "fs";
import { spawn } from "child_process";
import sharp from "sharp";
import path from "path";
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

async function chuyen_anh_sang_stt() {
    const rootFolder = "./z-chuc-nang-sap-viet/zzzz-bst-new2";
    const outputFolder = "./z-output";

    // Tạo folder output nếu chưa có
    if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder);
    }

    // Lấy các folder con
    const folders = fs.readdirSync(rootFolder);

    for (const folder of folders) {
        const folderPath = path.join(rootFolder, folder);

        // Bỏ qua nếu không phải folder
        if (!fs.statSync(folderPath).isDirectory()) {
            continue;
        }

        console.log(`Đang xử lý folder: ${folder}`);

        const folderOutput = path.join(outputFolder, folder);
        if (!fs.existsSync(folderOutput)) {
            fs.mkdirSync(folderOutput);
        }

        // Lấy file PNG
        const files = fs.readdirSync(folderPath)
            .filter(file => file.toLowerCase().endsWith(".png"))
            .sort((a, b) => {
                return parseInt(a) - parseInt(b);
            });

        for (const file of files) {
            const filePath = path.join(folderPath, file);

            // Đọc file PNG
            const pngBuffer = fs.readFileSync(filePath);

            // Cắt ảnh
            const buffer = await sharp(pngBuffer)
                .extract({ left: 610, top: 120, width: 120, height: 40 })
                .toBuffer();
            // const buffer = await sharp(pngBuffer)
            //     .extract({ left: 500, top: 120, width: 240, height: 40 })
            //     .toBuffer();

            // Lấy tên file không có .png
            const fileName = path.parse(file).name;

            // Ví dụ: 1.png -> 1-1.png
            const outputPath = path.join(folderOutput, `${fileName}.png`);

            // Ghi file
            fs.writeFileSync(outputPath, buffer);
            console.log(`Đã lưu: ${outputPath}`);
        }
    }

    console.log("Hoàn thành!");
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

async function tap(host, x, y) {
    await runAdb(["-s", host, "shell", "input", "tap", String(x), String(y)]);
}

// const ports = [16448, 16480, 16512, 16544, 16576, 16608, 16640, 16672, 16704, 16736, 16768, 16800, 16832, 16864, 16896, 16928]
const ports = [16448];


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

(async () => {
    // const worker_get_number = await Tesseract.createWorker("eng");
    // await worker_get_number.setParameters({ tessedit_char_whitelist: "0123456789(),./", });

    // await connectAll();
    // const buffer = await runAdb(["-s", "127.0.0.1:16448", "exec-out", "screencap", "-p"]);

    // // let buffer = fs.readFileSync("xxx.png")

    // const pngBuffer = await sharp(buffer)
    //     .extract({ left: 10, top: 240, width: 90, height: 40 })
    //     .resize({
    //         width: 90 * 4,
    //         height: 40 * 4,
    //         kernel: sharp.kernel.lanczos3, // giữ nét khi phóng to
    //     })
    //     .grayscale()
    //     .normalize()          // tăng tương phản tự động
    //     .threshold(150)        // nhị phân hóa: 150 tùy vào độ sáng chữ, chỉnh nếu cần
    //     .sharpen()             // làm nét thêm biên chữ/dấu /
    //     .toBuffer();
    // fs.writeFileSync("xxxxxxxx.png", pngBuffer)

    // let { data: ocrToDoi } = await worker_get_number.recognize(pngBuffer)
    // const ocrTextToDoi = ocrToDoi.text.toLowerCase();
    // console.log(ocrTextToDoi);

    // const pngBuffer = await sharp(buffer)
    //     .extract({ left: 10, top: 240, width: 90, height: 40 })
    //     .toBuffer();
    // fs.writeFileSync("xxx.png", pngBuffer)
    // const { matchedPoints } = await findMatchingRegionsAndroids({
    //     buffer: pngBuffer,
    //     templateImages: [
    //         `C:\\Users\\huy\\Desktop\\Tools_farm\\t2.png`
    //     ],
    //     matchThreshold: 0.8,
    // });
    // for (const { x, y, mathImagePath } of matchedPoints) {
    //     if (matchedPoints == `C:\\Users\\huy\\Desktop\\Tools_farm\\t2.png`) {
    //         console.log("xxxxxxxxxxxxx");
    //     }
    // }
    // let buffer = fs.readFileSync("1.png")
    // fs.writeFileSync("xxx.png", pngBuffer)


















    await connectAll();
    const templateImagesPos = data.map(item => `C:\\Users\\huy\\Desktop\\Tools_farm\\z-output\\${item.pos}.png`);
    const templateImagesTodoi = data.map(item => `C:\\Users\\huy\\Desktop\\Tools_farm\\z-output\\todoi\\${item.pos}.png`);
    let host = "127.0.0.1:16448";
    const worker_get_number = await Tesseract.createWorker("vie");
    await worker_get_number.setParameters({ tessedit_char_whitelist: "0123456789(),./", });

    while (true) {
        const matchedPoints = await captureAndMatch({
            deviceId: host,
            region: { left: 600, top: 120, width: 120, height: 40 },
            templateImages: templateImagesPos,
        });

        for (const { x, y, mathImagePath } of matchedPoints) {
            const found = data.find(item => {
                const expectedPath = `C:\\Users\\huy\\Desktop\\Tools_farm\\z-output\\${item.pos}.png`;
                return mathImagePath === expectedPath;
            });

            if (found) {
                await tap(host, 730, 460);

                let pathMatchforB = "C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-lam_bst\\"
                let TARGET_IMAGE = `C:\\Users\\huy\\Desktop\\Tools_farm\\tt.png`;
                // let TARGET_IMAGE = `C:\\Users\\huy\\Desktop\\Tools_farm\\z-output\\todoi\\${found.pos}.png`;

                let loop1 = true;
                while (loop1) {
                    await sleep(8000);
                    console.log("loop1");
                    await tap(host, 100, 200) // tap nv
                    await tap(host, 100, 200) // tap nv

                    await tap(host, 190, 157)  // to doi
                    await tap(host, 190, 157)  // to doi
                    await tap(host, 140, 250)  // doi xung quanh

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

                    let matchedPoints2 = await captureAndMatch({
                        deviceId: host,
                        region: { left: 0, top: 70, width: 530, height: 270 },
                        templateImages: [
                            // `${pathMatchforB}\\b1.png`,
                            `${pathMatchforB}\\b4.png`,
                        ],
                    });

                    for (const { x, y, mathImagePath } of matchedPoints2) {
                        if (mathImagePath == `${pathMatchforB}\\b4.png`) {
                            await tap(host, 925, 200);   // click ra ngoai
                            loop1 = false;
                            // logout and login
                        } else {
                            await tap(host, 925, 200)   // click ra ngoai
                            await tap(host, 925, 200)   // click ra ngoai
                        }
                    }
                }

                let loop2 = true;
                while (loop2) {
                    const buffer = await runAdb(["-s", deviceId, "exec-out", "screencap", "-p"]);
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
                    }
                    await sleep(3000)
                }
            }
        }
        await sleep(3000)
    }
})()





