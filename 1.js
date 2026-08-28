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

// const ports = [16448, 16480, 16512, 16544, 16576, 16608, 16640, 16672, 16704, 16736, 16768, 16800, 16832, 16864, 16896, 16928]
const ports = [16448];

(async () => {
    // await connectAll();

    const groupPaths = {
        dts: "C:\\Users\\huy\\Desktop\\Tools_farm\\z-output\\z-dts",
        hhnd: "C:\\Users\\huy\\Desktop\\Tools_farm\\z-output\\z-hhnd",
        pnst: "C:\\Users\\huy\\Desktop\\Tools_farm\\z-output\\z-pnst",
    };

    const templateImages = data.map(item =>
        `${groupPaths[item.group]}\\${item.pos} ${item.group}.png`
    );

    // await chuyen_anh_sang_stt()

    while (true) {
        // const buffer = await runAdb(["-s", "127.0.0.1:16448", "exec-out", "screencap", "-p"]);
        let buffer = fs.readFileSync("1.png")
        const pngBuffer = await sharp(buffer)
            .extract({ left: 600, top: 120, width: 120, height: 40 })
            .toBuffer();
        // fs.writeFileSync("2.png", pngBuffer)

        console.log("xxxxx");

        const { matchedPoints } = await findMatchingRegionsAndroids({
            buffer: pngBuffer,
            templateImages,
            matchThreshold: 0.95,
        });

        for (const { x, y, mathImagePath } of matchedPoints) {
            const found = data.find(item => {
                const expectedPath =
                    `${groupPaths[item.group]}\\${item.pos} ${item.group}.png`;

                return mathImagePath === expectedPath;
            });

            if (found) {
                console.log(found);
            }
        }
        await sleep(5000)
    }
})()





export const loadTemplates = (templateImages = []) => {
    return templateImages.map(path => {
        const templateMat = cv.imread(path).bgrToGray();

        return {
            path,
            templateMat,
            width: templateMat.cols,
            height: templateMat.rows,
        };
    });
};


