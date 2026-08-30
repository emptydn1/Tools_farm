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
    // let buffer = fs.readFileSync("zx.png")
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

async function swipe(host, x1, y1, x2, y2, duration = 300) {
    await runAdb(["-s", host, "shell", "input", "swipe", String(x1), String(y1), String(x2), String(y2), String(duration)]);
    await sleep(200)
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

    let host = "127.0.0.1:16448";
    // const buffer = await runAdb(["-s", "127.0.0.1:16448", "exec-out", "screencap", "-p"]);
    // fs.writeFileSync("xxx.png", buffer)

    const templateImagesCitys = Array.from(
        { length: 7 },
        (_, i) => `C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-lam_bst\\city\\${i + 1}.png`
    );


    // await swipe(host, 115, 295, 115, 0, 2000);

    // let TARGET_IMAGE = `C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-lam_bst\\z-output\\todoi\\206 41.png`;
    // let TARGET_IMAGE = `C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-lam_bst\\login\\b2.png`;
    // let TARGET_IMAGE = `C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-lam_bst\\login\\check-table-bst.png`;
    // let TARGET_IMAGE = `C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-lam_bst\\city\\2.png`;


    let buffer = fs.readFileSync("./2.png")
    // const buffer = await runAdb(["-s", deviceId, "exec-out", "screencap", "-p"]);
    const pngBuffer = await sharp(buffer)
        .extract({ left: 480, top: 430, width: 320, height: 70 })
        .toBuffer();

    fs.writeFileSync("222.png", pngBuffer)

    // let matchedPoints = await captureAndMatch({
    //     deviceId: host,
    //     region: { left: 830, top: 80, width: 100, height: 50 },
    //     templateImages: templateImagesCitys,
    // });

    // console.log(matchedPoints);

    // tuong duong
    // laman
    // pt -  day li - td

    // let target = matchedPoints.find(p => p.mathImagePath === TARGET_IMAGE);

    // console.log(target);
})()





