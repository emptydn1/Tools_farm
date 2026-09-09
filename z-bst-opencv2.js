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
    await runAdb(["-s", host, "shell", "input", "swipe", String(x1), String(y1), String(x2), String(y2), String(duration)]);
    await sleep(200)
}

async function input_text(host, text) {
    await runAdb(["-s", host, "shell", "input", "text", text]);
}

// ────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────


// const ports = [16448]
const ports = [16448, 16480, 16512, 16544, 16576, 16608, 16640, 16672, 16704, 16736, 16768, 16800, 16832, 16864, 16896, 16928]






let isPaused = false; // o = dừng, i = tiếp tục
let isKilled = false; // k = kill all

function setupKeyboard() {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);

    process.stdin.on('keypress', (str, key) => {
        // if (key.name === 'i') {
        //     isPaused = false;
        //     console.log('\n[CONTROL] ▶ Tiếp tục chạy');
        // } else if (key.name === 'o') {
        //     isPaused = true;
        //     console.log('\n[CONTROL] ⏸ Tạm dừng');
        // } else
        if (key.name === 'k') {
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


let nhan_tra_nv_bst = async (host) => {
    await sleep(1000);
    await tap(host, 190, 157)  // to doi
    await sleep(500);
    await tap(host, 190, 157)  // to doi
    await sleep(500);
    await tap(host, 184, 111)  // huy? hien thong tin chu pt
    await sleep(500);
    await tap(host, 400, 440)  // roi doi
    await sleep(500);
    await tap(host, 820, 270)  // nc npc
    await sleep(100);
    await tap(host, 820, 270)  // nc npc
    await sleep(100);
    await tap(host, 820, 270)  // nc npc
    await sleep(100);
    await tap(host, 820, 270)  // nc npc
    await sleep(100);
    await tap(host, 820, 270)  // nc npc
    await sleep(1000);
    await tap(host, 180, 295)  // click tham gia nv
    await sleep(1000);
    await tap(host, 730, 460)  // nhan thuong
    await sleep(1000);
    await tap(host, 730, 460)  // tắt thông báo thưởng
    await sleep(500);
    await tap(host, 730, 460)  // nhan nv
}


let logout = async (host) => {
    await sleep(500)
    await tap(host, 60, 385);   // click ra ngoai goc 8h
    await sleep(500)
    await tap(host, 60, 385);   // click ra ngoai goc 8h
    await sleep(500)
    await tap(host, 946, 257)
    await sleep(800);
    await tap(host, 946, 337)
    await sleep(800);
    await tap(host, 153, 115)
    await sleep(500);
    await tap(host, 800, 250)
    await sleep(500);
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


async function runToDoiUntilCheck({ host, TARGET_IMAGE, templateImagesTodoi, pathMatchforB, checkFirst = false }) {
    let done = false; // true nếu check_to_doi thành công (match b4)

    while (!done) {
        // chờ login hoặc đã lên trên map đánh bst
        await waitUntilMatch({
            deviceId: host,
            region: { left: 150, top: 50, width: 180, height: 50 },
            templateImages: [`C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-lam_bst\\login\\b2.png`],
            matchThreshold: 0.8,
        });

        // if (!checkFirst) await sleep(8000);
        await tap(host, 190, 157)  // to doi
        await sleep(500);
        await tap(host, 190, 157)  // to doi
        await sleep(500);
        await tap(host, 140, 250)  // doi xung quanh
        await sleep(1000);

        let matchedPoints = await captureAndMatch({
            deviceId: host,
            region: { left: 220, top: 80, width: 120, height: 380 },
            templateImages: templateImagesTodoi,
        });
        let target = matchedPoints.find(p => p.mathImagePath === TARGET_IMAGE);

        if (!target) {
            await swipe(host, 475, 365, 475, 155, 750);
            await sleep(3000);
            matchedPoints = await captureAndMatch({
                deviceId: host,
                region: { left: 220, top: 80, width: 120, height: 380 },
                templateImages: templateImagesTodoi,
            });
            target = matchedPoints.find(p => p.mathImagePath === TARGET_IMAGE);
        }

        if (target) {
            await tap(host, target.x + 540 + 220, target.y + 85);
            await sleep(500)
            await tap(host, 60, 385);   // click ra ngoai goc 8h
            await sleep(500)
            await tap(host, 60, 385);   // click ra ngoai goc 8h
        }

        await sleep(1000);
        await tap(host, 190, 157); // to doi
        await sleep(1000);

        const matchedPoints2 = await captureAndMatch({
            deviceId: host,
            region: { left: 0, top: 70, width: 530, height: 270 },
            templateImages: [`${pathMatchforB}\\b4.png`],
            matchThreshold: 0.8,
        });

        if (matchedPoints2.length > 0) {
            await tap(host, 60, 385);   // click ra ngoai goc 8h
            await tap(host, 60, 385);   // click ra ngoai goc 8h
            await sleep(500);
            await tap(host, 60, 155);   // tab nv
            done = true; // check_to_doi thành công
        } else {
            await tap(host, 60, 385);   // click ra ngoai goc 8h
            await tap(host, 60, 385);   // click ra ngoai goc 8h
        }
    }
    return done;
}








const actionsNhanVat = {
    1: (host) => tap(host, 75, 130),
    2: (host) => tap(host, 75, 230),
    3: (host) => tap(host, 75, 330),
};


async function runPort(indexPort, port, accounts, templatePath) {
    const host = `127.0.0.1:${port}`;
    const { templateImagesPos, templateImagesTodoi, templateImagesCitys, pathMatchforB, path_giao_dich, path_cam_nang } = templatePath
    let countLogin = 4;

    for (let i = 0; i < accounts.length; i++) {
        for (let round = 0; round < 3; round++) {
            console.log(accounts[i][indexPort]);


            while (true) {
                await tap(host, 860, 85) // nút hủy
                await sleep(300);

                const result3 = await captureAndMatch({
                    deviceId: host,
                    region: { left: 340, top: 415, width: 260, height: 70 },
                    templateImages: [`${path_giao_dich}\\b2.png`],
                });
                if (result3.length > 0) {
                    await tap(host, 490, 445) // nhấn đăng nhập vào chọn nhân vật
                    continue;
                }

                const result4 = await captureAndMatch({
                    deviceId: host,
                    region: { left: 750, top: 420, width: 210, height: 80 },
                    templateImages: [`${path_giao_dich}\\vao_game.png`],
                });
                if (result4.length > 0) break;


                const result1 = await captureAndMatch({
                    deviceId: host,
                    region: { left: 330, top: 340, width: 300, height: 100 },
                    templateImages: [`${path_giao_dich}\\b1.png`],
                });
                if (result1.length > 0) {
                    await tap(host, 490, 425)// bấm đăng nhập để nhập tài khoản
                    await sleep(1000);
                }


                const result2 = await captureAndMatch({
                    deviceId: host,
                    region: { left: 400, top: 120, width: 170, height: 60 },
                    templateImages: [`${path_giao_dich}\\form_login.png`],
                });
                if (result2.length > 0) {
                    if (countLogin == 4) {
                        await tap(host, 480, 200) // chỗ nhập tài khoản
                        await sleep(1000);
                        await input_text(host, accounts[i][indexPort]);
                        await sleep(500);
                    }

                    await tap(host, 585, 360) // nhấn đăng nhập
                    await sleep(500);
                    await tap(host, 490, 445) // nhấn đăng nhập vào chọn nhân vật
                    await sleep(500);
                }
            }

            if (countLogin == 4) countLogin = 1;

            await actionsNhanVat[countLogin](host);
            await sleep(100);
            await actionsNhanVat[countLogin](host);
            await sleep(100);
            await actionsNhanVat[countLogin](host);
            await sleep(1000);
            await tap(host, 864, 453);

            countLogin++


            let takeTask = false
            while (!takeTask) {
                // đã login xong
                await waitUntilMatch({
                    deviceId: host,
                    region: { left: 150, top: 50, width: 180, height: 50 },
                    templateImages: [`C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-lam_bst\\login\\b2.png`],
                    matchThreshold: 0.8,
                });

                await sleep(1000);

                // is citys and bst_cam_nang
                const result = await captureAndMatch({
                    deviceId: host,
                    region: { left: 830, top: 80, width: 100, height: 50 },
                    templateImages: [
                        ...templateImagesCitys,
                        `${path_cam_nang}\\bien_kinh.png`,
                        `${path_cam_nang}\\lam_an.png`,
                        `${path_cam_nang}\\phuong_tuong.png`,
                        `${path_cam_nang}\\tuong_duong.png`,
                    ],
                    matchThreshold: 0.95,
                });
                if (result.length > 0) {
                    await tap(host, 820, 270)  // nc npc
                    await sleep(100);
                    await tap(host, 820, 270)  // nc npc
                    await sleep(100);
                    await tap(host, 820, 270)  // nc npc
                    await sleep(1000);

                    // kiểm tra đã nc với npc nv bst chưa
                    const buffer = await runAdb(["-s", host, "exec-out", "screencap", "-p"]);
                    const pngBuffer1 = await sharp(buffer)
                        .extract({ left: 40, top: 280, width: 300, height: 50 })
                        .toBuffer();
                    const { matchedPoints: joinBST } = await findMatchingRegionsAndroids({
                        buffer: pngBuffer1,
                        templateImages: [`C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-lam_bst\\login\\tham-gia-nv-bst.png`],
                        matchThreshold: 0.8,
                    });

                    if (joinBST.length > 0) {
                        await tap(host, 180, 295)  // click tham gia nv

                        LoopCheck1:
                        while (true) {
                            // kiểm tra có phải nút hủy + khiêu chiến bst không
                            const buffer = await runAdb(["-s", host, "exec-out", "screencap", "-p"]);
                            const pngBuffer1 = await sharp(buffer)
                                .extract({ left: 480, top: 430, width: 320, height: 70 })
                                .toBuffer();
                            const { matchedPoints: buttonBST } = await findMatchingRegionsAndroids({
                                buffer: pngBuffer1,
                                templateImages: [
                                    `C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-lam_bst\\login\\b4.png`,
                                    `C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-lam_bst\\login\\nhan-nv.png`,
                                    `C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-lam_bst\\login\\het-luot.png`,
                                ],
                                matchThreshold: 0.8,
                            });
                            if (buttonBST.length > 0) {
                                for (const { x, y, mathImagePath } of buttonBST) {
                                    if (mathImagePath == `C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-lam_bst\\login\\nhan-nv.png`) {
                                        await tap(host, 730, 460)  // nhan nhiem vu
                                    } else if (mathImagePath == `C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-lam_bst\\login\\b4.png`) {
                                        takeTask = true;
                                        break LoopCheck1;
                                    } else if (mathImagePath == `C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-lam_bst\\login\\het-luot.png`) {
                                        await tap(host, 730, 460)  // nhan nhiem vu
                                        takeTask = true;
                                        break LoopCheck1;
                                    }
                                }
                            }

                            await sleep(500);
                        }
                    }
                } else {
                    // click cam nang de toi lai diem boss sat thu
                    await tap(host, 790, 30)  // click mũi tên ra
                    await sleep(1000);

                    // kiểm tra hiển thị cẩm nang chưa
                    const buffer = await runAdb(["-s", host, "exec-out", "screencap", "-p"]);
                    const pngBuffer1 = await sharp(buffer)
                        .extract({ left: 455, top: 0, width: 320, height: 60 })
                        .toBuffer();
                    const { matchedPoints: camnang } = await findMatchingRegionsAndroids({
                        buffer: pngBuffer1,
                        templateImages: [`${path_cam_nang}\\b1_cam_nang.png`],
                        matchThreshold: 0.8,
                    });

                    if (camnang.length > 0) {
                        for (const { x, y, mathImagePath } of camnang) {
                            await tap(host, x + 455, y + 10);
                        }
                        await sleep(300);
                        await tap(host, 260, 275);
                        await sleep(300);
                        await tap(host, 855, 450);
                    }
                }
                await sleep(300);
            }












            outerLoop:
            while (true) {
                // phát hiện đã mở bảng nhiệm vụ tại nhiếp thí trần
                while (true) {
                    const buffer = await runAdb(["-s", host, "exec-out", "screencap", "-p"]);

                    // nút hủy và khiêu chiến bst
                    const pngBuffer1 = await sharp(buffer)
                        .extract({ left: 480, top: 430, width: 320, height: 70 })
                        .toBuffer();
                    const { matchedPoints: matchedPoints1 } = await findMatchingRegionsAndroids({
                        buffer: pngBuffer1,
                        templateImages: [`C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-lam_bst\\login\\b4.png`],
                        matchThreshold: 0.8,
                    });

                    if (matchedPoints1.length > 0) break;


                    // nếu không tìm thấy vị trí thì kiểm tra xem end chưa
                    const pngBuffer2 = await sharp(buffer)
                        .extract({ left: 240, top: 170, width: 480, height: 200 })
                        .toBuffer();
                    const { matchedPoints } = await findMatchingRegionsAndroids({
                        buffer: pngBuffer2,
                        templateImages: [`${pathMatchforB}\\b2.png`, `${pathMatchforB}\\b3.png`],
                        matchThreshold: 0.8,
                    });

                    if (matchedPoints.length > 0) {
                        await logout(host)
                        break outerLoop;
                    }
                    await sleep(500);
                }


                const matchedPoints = await captureAndMatch({
                    deviceId: host,
                    region: { left: 600, top: 120, width: 120, height: 40 },
                    templateImages: templateImagesPos,
                });

                if (matchedPoints.length > 0) {
                    for (const { x, y, mathImagePath } of matchedPoints) {
                        const found = data.find(item => {
                            const expectedPath = `C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-lam_bst\\z-output\\${item.pos}.png`;
                            return mathImagePath === expectedPath;
                        });

                        if (found) {
                            // bảng nhiêm vụ sat thủ
                            await waitUntilMatch({
                                deviceId: host,
                                region: { left: 350, top: 40, width: 300, height: 60 },
                                templateImages: [`C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-lam_bst\\login\\b3.png`],
                                matchThreshold: 0.8,
                            });

                            await tap(host, 730, 460); // khiêu chiến bst

                            let TARGET_IMAGE = `C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-lam_bst\\z-output\\todoi\\${found.pos}.png`;

                            // Bước 1: vào tổ đội -> check cho tới khi thành công lần đầu
                            await runToDoiUntilCheck({ host, TARGET_IMAGE, templateImagesTodoi, pathMatchforB });
                            await sleep(1000)


                            // Bước 2
                            let isScrollDown = true;
                            let pairCount = 0;        // đếm số lần đã cuộn xuống-lên hoàn chỉnh
                            let useAltTarget = false; // false: cuộn xuống tới y=0, true: cuộn xuống tới y=54

                            while (true) {
                                if (isScrollDown) {
                                    // cuộn xuống
                                    const targetY = useAltTarget ? 54 : 0;
                                    await swipe(host, 115, 295, 115, targetY, 2000);
                                    isScrollDown = false;
                                } else {
                                    // cuộn lên
                                    await swipe(host, 115, 200, 115, 700, 500);
                                    isScrollDown = true;

                                    pairCount++;
                                    if (pairCount % 3 === 0) {
                                        useAltTarget = !useAltTarget; // sau mỗi 3 lần xuống-lên thì đổi target
                                    }
                                }

                                await sleep(1000);

                                // check cuộn xuống nhiêm vụ sat thủ thành công
                                const result = await captureAndMatch({
                                    deviceId: host,
                                    region: { left: 0, top: 170, width: 180, height: 80 },
                                    templateImages: [`C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-lam_bst\\login\\check-table-bst.png`],
                                    matchThreshold: 0.8,
                                });

                                if (result.length > 0) break
                            }


                            // Bước 3:
                            while (true) {
                                await tap(host, 100, 220);
                                await sleep(5000);

                                // là citys
                                const result = await captureAndMatch({
                                    deviceId: host,
                                    region: { left: 830, top: 80, width: 100, height: 50 },
                                    templateImages: templateImagesCitys,
                                    matchThreshold: 0.95,
                                });

                                if (result.length > 0) {
                                    await nhan_tra_nv_bst(host)
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

const arg = process.argv[2];

(async () => {
    try {
        setupKeyboard();
        await connectAll();
        let accounts = await init();

        const templateImagesPos = data.map(item => `C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-lam_bst\\z-output\\${item.pos}.png`);
        const templateImagesTodoi = data.map(item => `C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-lam_bst\\z-output\\todoi\\${arg == "2" ? "s2\\" : ""}${item.pos}.png`);
        const templateImagesCitys = Array.from({ length: 7 }, (_, i) => `C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-lam_bst\\city\\${i + 1}.png`);
        const pathMatchforB = "C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-lam_bst\\"
        const path_cam_nang = `C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-lam_bst\\cam_nang`;
        const path_giao_dich = `C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-giao-dich\\gom-van\\huy`;


        const workerPromises = [];

        for (const [index, port] of ports.entries()) {
            await sleep(500);
            const p = runPort(index, port, accounts, { templateImagesPos, templateImagesTodoi, templateImagesCitys, pathMatchforB, path_giao_dich, path_cam_nang });
            workerPromises.push(p);
        }

        while (!isKilled) await sleep(500);
        await Promise.all(workerPromises);

        console.log("Tất cả đã dừng!");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
})();