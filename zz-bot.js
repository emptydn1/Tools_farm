// bot.js - toàn bộ logic farm chạy trên SERVER.
// Logic giữ nguyên như bản cũ, chỉ thay:
//   - tap / swipe / input_text / screencap  -> gửi xuống client qua deviceBridge
// Chạy: node bot.js

import path from "path";
import readline from "readline";
import sharp from "sharp";
import { sleep } from "./utils/utils.js";
import { startBridge, waitForDevice, tap, swipe, input_text, screencap } from "./zz-deviceBridge.js";
import { findMatchingRegionsAndroids } from "./utils/opencvNodejs.js";

async function matchRegions({ buffer, templateImages, matchThreshold }) {
    const { matchedPoints } = await findMatchingRegionsAndroids({ buffer, templateImages, matchThreshold });
    return matchedPoints;
}

const BRIDGE_PORT = 9090;

// Thư mục ảnh mẫu NẰM TRÊN SERVER
const RESOURCE_PATH = process.env.TEMPLATE_ROOT || "C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-lam_bst";
const BASE_PATH = path.join(RESOURCE_PATH, "4x");

// Danh sách device: phải trùng với danh sách client đăng ký (client.js)
const ports = [
    16448,
    16480, 16512, 16544, 16576,
    16608, 16640, 16672, 16704, 16736,
    16768, 16800, 16832, 16864, 16896,
    16928, 16960, 16992, 17024, 17056,
];
const HOSTS = ports.map(p => `127.0.0.1:${p}`);

// ────────────────────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = text => new Promise(resolve => rl.question(text, resolve));

async function init() {
    while (true) {
        const input = await question("Nhập: ");
        const arr = input.split("-");

        if (arr.length !== 3) {
            console.log("❌ Nhập sai! Ví dụ: 1+5-huy-1+15");
            continue;
        }

        const accountRange = arr[0].split("+");
        const name = arr[1];
        const numberRange = arr[2].split("+");

        if (
            accountRange.length !== 2 || numberRange.length !== 2 ||
            isNaN(accountRange[0]) || isNaN(accountRange[1]) ||
            isNaN(numberRange[0]) || isNaN(numberRange[1]) || !name
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
            for (let j = startNumber; j <= endNumber; j++) temp.push(`${i}${name}${j}`);
            accounts.push(temp);
        }
        return accounts;
    }
}

let isKilled = false;

function setupKeyboard() {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);

    process.stdin.on("keypress", (str, key) => {
        if (key.name === "k") {
            isKilled = true;
            console.log("\n[CONTROL] ✖ Kill all - đang dừng...");
        }
        if (key.ctrl && key.name === "c") process.exit();
    });

    console.log("Phím điều khiển: [k] Kill all\n");
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

const posBstPath = item => path.join(BASE_PATH, "todoi", "posBst", `${item.pos}.png`);
const teamPath = pos => path.join(BASE_PATH, "todoi", "team", `${pos}.png`);

// ── Chụp + match ─────────────────────────────────────────────

// Client gửi nguyên màn hình, server tự cắt vùng region rồi match
async function captureAndMatch({ deviceId, region, templateImages, matchThreshold = 0.95 }) {
    const screen = await screencap(deviceId);
    const buffer = await sharp(screen).extract(region).toBuffer();
    return matchRegions({ buffer, templateImages, matchThreshold });
}

async function waitUntilMatch({ deviceId, region, templateImages, matchThreshold = 0.8, interval = 300 }) {
    while (true) {
        const result = await captureAndMatch({ deviceId, region, templateImages, matchThreshold });
        if (result.length > 0) {
            await sleep(500);
            return result;
        }
        await sleep(interval);
    }
}

// ── Các thao tác ─────────────────────────────────────────────

async function logout(host) {
    await sleep(500);
    await tap(host, 60, 385);   // click ra ngoai goc 8h
    await sleep(500);
    await tap(host, 60, 385);
    await sleep(500);
    await tap(host, 946, 257);
    await sleep(800);
    await tap(host, 946, 337);
    await sleep(800);
    await tap(host, 153, 115);
    await sleep(500);
    await tap(host, 800, 250);
    await sleep(500);
}

async function clickNhanNv(host) {
    await tap(host, 180, 295);  // click tham gia nv
    await sleep(1000);
    await tap(host, 640, 461);
    await sleep(200);
    await tap(host, 640, 461);
    await sleep(200);
    await tap(host, 640, 461);
    await sleep(200);
    await tap(host, 640, 461);
    await sleep(200);
    await tap(host, 390, 470);
    await sleep(200);
    await tap(host, 390, 470);
    await sleep(200);
    await tap(host, 640, 461);
}

// Đi tới NPC nhận nhiệm vụ BST cho tới khi nhận được.
// waitLogin = true: mỗi vòng chờ màn hình "luyện công" trước (giống vòng nhận nv đầu tiên của bản cũ)
async function ensureTakeTask(host, paths, waitLogin) {
    const { posCitys, checkGameStartPath, camNangPath } = paths;
    let takeTask = false;

    while (!takeTask) {
        if (waitLogin) {
            await waitUntilMatch({
                deviceId: host,
                region: { left: 150, top: 50, width: 180, height: 50 },
                templateImages: [path.join(checkGameStartPath, "luyen-cong.png")],
                matchThreshold: 0.8,
            });
            await sleep(1000);
        }

        // is citys and bst_cam_nang
        const result = await captureAndMatch({
            deviceId: host,
            region: { left: 830, top: 80, width: 100, height: 50 },
            templateImages: [
                ...posCitys,
                path.join(camNangPath, "bien_kinh.png"),
                path.join(camNangPath, "lam_an.png"),
                path.join(camNangPath, "phuong_tuong.png"),
                path.join(camNangPath, "tuong_duong.png"),
            ],
            matchThreshold: 0.95,
        });

        if (result.length > 0) {
            await tap(host, 820, 270);  // nc npc
            await sleep(100);
            await tap(host, 820, 270);
            await sleep(100);
            await tap(host, 820, 270);
            await sleep(1000);

            // kiểm tra đã nc với npc nv bst chưa
            const joinBST = await captureAndMatch({
                deviceId: host,
                region: { left: 40, top: 280, width: 300, height: 50 },
                templateImages: [path.join(checkGameStartPath, "tham-gia-nv-bst.png")],
                matchThreshold: 0.8,
            });

            if (joinBST.length > 0) {
                await clickNhanNv(host);
                takeTask = true;
            }
        } else {
            // click cam nang de toi lai diem boss sat thu
            await tap(host, 38, 125);
            await sleep(1000);

            // kiểm tra hiển thị cẩm nang chưa
            const camnang = await captureAndMatch({
                deviceId: host,
                region: { left: 50, top: 50, width: 200, height: 70 },
                templateImages: [path.join(camNangPath, "b1_cam_nang.png")],
                matchThreshold: 0.8,
            });

            if (camnang.length > 0) {
                await tap(host, 260, 275);
                await sleep(400);
                await tap(host, 855, 450);
            }
        }
        await sleep(300);
    }
}

async function runToDoiUntilCheck({ host, TARGET_IMAGE, todoiList, checkGameStartPath }) {
    let done = false;

    // chờ login hoặc đã lên trên map đánh bst
    await waitUntilMatch({
        deviceId: host,
        region: { left: 150, top: 50, width: 180, height: 50 },
        templateImages: [path.join(checkGameStartPath, "luyen-cong.png")],
        matchThreshold: 0.8,
    });

    while (!done) {
        await tap(host, 175, 185);  // to doi
        await sleep(500);
        await tap(host, 175, 185);
        await sleep(500);
        await tap(host, 140, 260);  // doi xung quanh
        await sleep(1000);

        let matchedPoints = await captureAndMatch({
            deviceId: host,
            region: { left: 220, top: 80, width: 120, height: 380 },
            templateImages: todoiList,
        });
        let target = matchedPoints.find(p => p.mathImagePath === TARGET_IMAGE);

        if (!target) {
            await swipe(host, 475, 365, 475, 155, 750);
            await sleep(3000);
            matchedPoints = await captureAndMatch({
                deviceId: host,
                region: { left: 220, top: 80, width: 120, height: 380 },
                templateImages: todoiList,
            });
            target = matchedPoints.find(p => p.mathImagePath === TARGET_IMAGE);
        }

        if (target) {
            await tap(host, target.x + 540 + 220, target.y + 85);
            await sleep(500);
            await tap(host, 60, 385);
            await sleep(500);
            await tap(host, 60, 385);
        }

        await sleep(1000);
        await tap(host, 175, 185); // to doi
        await sleep(1000);

        const matchedPoints2 = await captureAndMatch({
            deviceId: host,
            region: { left: 0, top: 70, width: 530, height: 270 },
            templateImages: [path.join(checkGameStartPath, "check-to-doi.png")],
            matchThreshold: 0.8,
        });

        await tap(host, 60, 385);
        await tap(host, 60, 385);
        if (matchedPoints2.length > 0) {
            await sleep(500);
            await tap(host, 60, 190);   // tab nv
            done = true;
        }
    }
    return done;
}

async function loopScrollBst(host, checkGameStartPath) {
    let isScrollDown = true;
    let pairCount = 0;
    let useAltTarget = false;

    while (true) {
        // check cuộn xuống nhiêm vụ sat thủ thành công
        const result = await captureAndMatch({
            deviceId: host,
            region: { left: 10, top: 205, width: 180, height: 80 },
            templateImages: [path.join(checkGameStartPath, "check-table-bst.png")],
            matchThreshold: 0.8,
        });

        if (result.length > 0) {
            await tap(host, 100, 265);
            await sleep(500);
            await tap(host, 100, 265);
            break;
        }

        if (isScrollDown) {
            const targetY = useAltTarget ? 54 : 0;
            await swipe(host, 115, 295, 115, targetY, 2000);
            isScrollDown = false;
        } else {
            await swipe(host, 115, 215, 115, 700, 500);
            isScrollDown = true;
            pairCount++;
            if (pairCount % 3 === 0) useAltTarget = !useAltTarget;
        }
        await sleep(400);
    }
}

const actionsNhanVat = {
    1: host => tap(host, 75, 130),
    2: host => tap(host, 75, 230),
    3: host => tap(host, 75, 330),
};

// ── Luồng chính cho 1 device ─────────────────────────────────

async function runPort(indexPort, host, accounts, paths) {
    const { posBST, todoiList, posCitys, loginPath, checkGameStartPath } = paths;
    let countLogin = 4;

    for (let i = 0; i < accounts.length; i++) {
        for (let round = 0; round < 3; round++) {
            console.log(`[${host}]`, accounts[i][indexPort]);

            // ── Đăng nhập ──
            while (true) {
                await tap(host, 860, 85); // nút hủy
                await sleep(300);

                const result3 = await captureAndMatch({
                    deviceId: host,
                    region: { left: 340, top: 415, width: 260, height: 70 },
                    templateImages: [path.join(loginPath, "vao-giang-ho.png")],
                });
                if (result3.length > 0) {
                    await tap(host, 490, 445);
                    continue;
                }

                const result4 = await captureAndMatch({
                    deviceId: host,
                    region: { left: 750, top: 420, width: 210, height: 80 },
                    templateImages: [path.join(loginPath, "vao_game.png")],
                });
                if (result4.length > 0) break;

                const result1 = await captureAndMatch({
                    deviceId: host,
                    region: { left: 330, top: 340, width: 300, height: 100 },
                    templateImages: [path.join(loginPath, "dang-nhap-voi-mbox-id.png")],
                });
                if (result1.length > 0) {
                    await tap(host, 490, 425);
                    await sleep(1000);
                }

                const result2 = await captureAndMatch({
                    deviceId: host,
                    region: { left: 400, top: 120, width: 170, height: 60 },
                    templateImages: [path.join(loginPath, "form_login.png")],
                });
                if (result2.length > 0) {
                    if (countLogin == 4) {
                        await tap(host, 480, 200);
                        await sleep(1000);
                        await input_text(host, accounts[i][indexPort]);
                        await sleep(500);
                    }
                    await tap(host, 585, 360);
                    await sleep(500);
                    await tap(host, 490, 445);
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

            countLogin++;

            // ── Nhận nhiệm vụ ──
            await ensureTakeTask(host, paths, true);

            outerLoop:
            while (true) {
                // phát hiện đã mở bảng nhiệm vụ tại nhiếp thí trần
                while (true) {
                    // 2 vùng cắt từ CÙNG 1 khung hình
                    const buffer = await screencap(host);

                    const pngBuffer1 = await sharp(buffer)
                        .extract({ left: 480, top: 430, width: 320, height: 70 })
                        .toBuffer();
                    const matchedPoints1 = await matchRegions({
                        buffer: pngBuffer1,
                        templateImages: [path.join(checkGameStartPath, "nv-khieu-chien.png")],
                        matchThreshold: 0.8,
                    });
                    if (matchedPoints1.length > 0) break;

                    const pngBuffer2 = await sharp(buffer)
                        .extract({ left: 240, top: 170, width: 480, height: 200 })
                        .toBuffer();
                    const endPoints = await matchRegions({
                        buffer: pngBuffer2,
                        templateImages: [
                            path.join(checkGameStartPath, "end-bst-1.png"),
                            path.join(checkGameStartPath, "end-bst-2.png"),
                        ],
                        matchThreshold: 0.8,
                    });
                    if (endPoints.length > 0) {
                        await logout(host);
                        break outerLoop;
                    }

                    await ensureTakeTask(host, paths, false);
                    await sleep(500);
                }

                const matchedPoints = await captureAndMatch({
                    deviceId: host,
                    region: { left: 600, top: 120, width: 120, height: 40 },
                    templateImages: posBST,
                });

                for (const { mathImagePath } of matchedPoints) {
                    const found = data.find(item => mathImagePath === posBstPath(item));
                    if (!found) continue;

                    // bảng nhiêm vụ sat thủ
                    await waitUntilMatch({
                        deviceId: host,
                        region: { left: 350, top: 40, width: 300, height: 60 },
                        templateImages: [path.join(checkGameStartPath, "bang-nv-bst.png")],
                        matchThreshold: 0.8,
                    });

                    await tap(host, 730, 460); // khiêu chiến bst

                    await waitUntilMatch({
                        deviceId: host,
                        region: { left: 150, top: 50, width: 180, height: 50 },
                        templateImages: [path.join(checkGameStartPath, "luyen-cong.png")],
                        matchThreshold: 0.8,
                    });

                    await loopScrollBst(host, checkGameStartPath);

                    if (found.pos == "100 74") {
                        await sleep(1000);
                        // phù đến phục ngưu sơn tây
                        await tap(host, 801, 300);
                        await sleep(500);
                        await tap(host, 310, 380);
                        await sleep(500);
                        await tap(host, 310, 420);
                        await sleep(500);
                        await tap(host, 310, 285);
                        await sleep(3000);
                        await tap(host, 100, 265);  // đi tới boss
                        await sleep(500);
                        await tap(host, 100, 265);
                        await sleep(1000);
                    }

                    // Bước 2: vào tổ đội
                    await runToDoiUntilCheck({ host, TARGET_IMAGE: teamPath(found.pos), todoiList, checkGameStartPath });
                    await sleep(1000);

                    await loopScrollBst(host, checkGameStartPath);

                    // Bước 3
                    while (true) {
                        await tap(host, 100, 265);
                        await sleep(800);
                        await tap(host, 100, 265);
                        await sleep(4000);

                        const result = await captureAndMatch({
                            deviceId: host,
                            region: { left: 830, top: 80, width: 100, height: 50 },
                            templateImages: posCitys,
                            matchThreshold: 0.95,
                        });

                        if (result.length > 0) {
                            await sleep(1800);

                            let roiDoi = false;
                            while (!roiDoi) {
                                await tap(host, 175, 185);  // to doi
                                await sleep(500);
                                await tap(host, 175, 185);
                                await sleep(500);
                                await tap(host, 184, 111);  // huy? hien thong tin chu pt
                                await sleep(500);
                                await tap(host, 400, 440);  // roi doi
                                await sleep(500);

                                const r = await captureAndMatch({
                                    deviceId: host,
                                    region: { top: 240, left: 65, width: 100, height: 60 },
                                    templateImages: [path.join(checkGameStartPath, "todoi.png")],
                                    matchThreshold: 0.8,
                                });
                                if (r.length > 0) roiDoi = true;
                            }

                            await tap(host, 820, 270);  // nc npc
                            await sleep(100);
                            await tap(host, 820, 270);
                            await sleep(100);
                            await tap(host, 820, 270);
                            await sleep(1000);
                            await clickNhanNv(host);  // tham gia nv + xác nhận
                            break;
                        }
                    }
                }
            }
        }
    }
}

// ── Main ─────────────────────────────────────────────────────

(async () => {
    try {
        setupKeyboard();
        startBridge(BRIDGE_PORT);
        const accounts = await init();

        const paths = {
            posBST: data.map(posBstPath),
            todoiList: data.map(item => teamPath(item.pos)),
            posCitys: Array.from({ length: 7 }, (_, i) => path.join(RESOURCE_PATH, "citys", `${i + 1}.png`)),
            loginPath: path.join(RESOURCE_PATH, "dang-nhap"),
            checkGameStartPath: path.join(RESOURCE_PATH, "check-vao-game"),
            camNangPath: path.join(RESOURCE_PATH, "cam-nang"),
        };

        const workerPromises = [];
        for (const [index, host] of HOSTS.entries()) {
            const p = (async () => {
                await waitForDevice(host);
                console.log(`[${host}] online, bắt đầu chạy`);
                await sleep(1500 * index); // giãn thời gian khởi động như bản cũ
                await runPort(index, host, accounts, paths);
            })().catch(err => console.error(`[${host}] dừng do lỗi:`, err.message || err));
            workerPromises.push(p);
        }

        while (!isKilled) await sleep(500);
        console.log("Tất cả đã dừng!");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
})();
