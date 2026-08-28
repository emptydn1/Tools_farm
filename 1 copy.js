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


// const ports = [16448, 16480, 16512, 16544, 16576, 16608, 16640, 16672, 16704, 16736, 16768, 16800, 16832, 16864, 16896, 16928]
const ports = [16448];

(async () => {
    await connectAll();

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

    let pathMatch1 = "C:\\Users\\huy\\Desktop\\Tools_farm\\z-output\\z-dts"
    let pathMatch2 = "C:\\Users\\huy\\Desktop\\Tools_farm\\z-output\\z-hhnd"
    let pathMatch3 = "C:\\Users\\huy\\Desktop\\Tools_farm\\z-output\\z-pnst"

    const groupPaths = {
        dts: pathMatch1,
        hhnd: pathMatch2,
        pnst: pathMatch3,
    };

    const dts = [
        `${pathMatch1}\\19 71 dts.png`,
        `${pathMatch1}\\35 69 dts.png`,
        `${pathMatch1}\\63 79 dts.png`,
        `${pathMatch1}\\83 96 dts.png`,
        `${pathMatch1}\\194 61 dts.png`,
        `${pathMatch1}\\206 41 dts.png`,
    ];

    const hhnd = [
        `${pathMatch2}\\8 9 hhnd.png`,
        `${pathMatch2}\\9 29 hhnd.png`,
        `${pathMatch2}\\34 36 hhnd.png`,
        `${pathMatch2}\\46 11 hhnd.png`,
        `${pathMatch2}\\65 30 hhnd.png`,
        `${pathMatch2}\\67 8 hhnd.png`,
        `${pathMatch2}\\67 20 hhnd.png`,
    ];

    const pnst = [
        `${pathMatch3}\\14 35 pnst.png`,
        `${pathMatch3}\\15 14 pnst.png`,
        `${pathMatch3}\\52 46 pnst.png`,
        `${pathMatch3}\\100 74 pnst.png`,
        `${pathMatch3}\\135 65 pnst.png`,
        `${pathMatch3}\\148 68 pnst.png`,
        `${pathMatch3}\\168 65 pnst.png`,
    ];

    // await chuyen_anh_sang_stt()

    while (true) {
        const buffer = await runAdb(["-s", "127.0.0.1:16448", "exec-out", "screencap", "-p"]);
        const pngBuffer = await sharp(buffer)
            .extract({ left: 600, top: 120, width: 120, height: 40 })
            .toBuffer();
        // fs.writeFileSync("1.png", pngBuffer)

        console.log("xxxxx");

        const { matchedPoints } = await findMatchingRegionsAndroids({
            buffer: pngBuffer,
            templateImages: [
                ...dts,
                ...hhnd,
                ...pnst,
            ],
            matchThreshold: 0.95,
        });

        for (const { x, y, mathImagePath } of matchedPoints) {


            // dts

            if (mathImagePath == `${pathMatch1}\\19 71 dts.png`) {
            }

            else if (mathImagePath == `${pathMatch1}\\35 69 dts.png`) {
            }

            else if (mathImagePath == `${pathMatch1}\\63 79 dts.png`) {
            }

            else if (mathImagePath == `${pathMatch1}\\83 96 dts.png`) {
            }

            else if (mathImagePath == `${pathMatch1}\\194 61 dts.png`) {
            }

            else if (mathImagePath == `${pathMatch1}\\206 41 dts.png`) {
            }


            // hhnd
            if (mathImagePath == `${pathMatch2}\\8 9 hhnd.png`) {
            }

            else if (mathImagePath == `${pathMatch2}\\9 29 hhnd.png`) {
            }

            else if (mathImagePath == `${pathMatch2}\\34 36 hhnd.png`) {
            }

            else if (mathImagePath == `${pathMatch2}\\46 11 hhnd.png`) {
            }

            else if (mathImagePath == `${pathMatch2}\\65 30 hhnd.png`) {
            }

            else if (mathImagePath == `${pathMatch2}\\67 8 hhnd.png`) {
            }

            else if (mathImagePath == `${pathMatch2}\\67 20 hhnd.png`) {
            }


            // pnst
            if (mathImagePath == `${pathMatch3}\\14 35 pnst.png`) {
            }

            else if (mathImagePath == `${pathMatch3}\\15 14 pnst.png`) {
            }

            else if (mathImagePath == `${pathMatch3}\\52 46 pnst.png`) {
            }

            else if (mathImagePath == `${pathMatch3}\\100 74 pnst.png`) {
            }

            else if (mathImagePath == `${pathMatch3}\\135 65 pnst.png`) {
            }

            else if (mathImagePath == `${pathMatch3}\\148 68 pnst.png`) {
            }

            else if (mathImagePath == `${pathMatch3}\\168 65 pnst.png`) {
            }
        }
        await sleep(5000)
    }
})()


