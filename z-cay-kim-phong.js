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
    16480,
    16512, 16544, 16576,
    16608, 16640, 16672, 16704, 16736,
    16768, 16800, 16832, 16864, 16896,
    16928, 16960, 16992, 17024, 17056
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


let nvSuphu = async (host) => {
    console.log("nvSuphu");
    await tap(host, 60, 190)
    await sleep(500);
    await tap(host, 180, 175)   //2
    await sleep(500);
    await tap(host, 815, 460)
}

let nv1 = async (host) => {
    console.log("nv1");
    await tap(host, 60, 190)
    await sleep(500);
    await tap(host, 180, 210)
    await sleep(500);
    await tap(host, 815, 460)
}

let nv2 = async (host) => {
    console.log("nv2");
    await tap(host, 60, 190)
    await sleep(500);
    await tap(host, 180, 245)
    await sleep(500);
    await tap(host, 815, 460)
}

let nv3 = async (host) => {
    console.log("nv3");
    await tap(host, 60, 190)
    await sleep(500);
    await tap(host, 185, 280)
    await sleep(500);
    await tap(host, 815, 460)
}


let tangSucManhSinhKhi = async (host) => {
    console.log("tangSucManhSinhKhi");
    await tap(host, 60, 60);
    await sleep(500);
    await tap(host, 455, 440);
    await sleep(500);
    await tap(host, 680, 195);
    await sleep(500);

    await input_text(host, "80");
    await sleep(500);
    await tap(host, 680, 223);
    await sleep(500);
    await input_text(host, "9999");
    await sleep(500);
    await tap(host, 710, 420);
    await sleep(500);
    await tap(host, 870, 95);
}

let autoSkill = async (host) => {
    // nang skill
    await tap(host, 946, 257)
    await sleep(1000);
    await tap(host, 757, 315)
    await sleep(800);

    //click skill
    await tap(host, 250, 135)
    await sleep(500);
    await tap(host, 525, 440)
    await sleep(500);
    await input_text(host, "9999");
    await sleep(500);
    await tap(host, 517, 295)   //click ra ngoài
    await sleep(500);
    await tap(host, 635, 445)   // tăng cấp
    await sleep(500);
    await tap(host, 867, 90)    // hủy bảng nâng skill
    await sleep(1000);


    // auto
    await swipe(host, 690, 455, 690, 455, 2000);
    await sleep(2000);
    await tap(host, 130, 255)
    await sleep(500);
    await tap(host, 205, 380)

    // thêm skill
    await tap(host, 214, 215)
    await sleep(500);
    await tap(host, 214, 215)
    await sleep(500);

    // thêm skill auto 2
    await tap(host, 270, 215)
    await sleep(500);
    await tap(host, 270, 290)
    await sleep(500);
    await tap(host, 867, 90)    // hủy bảng nâng skill
}

let loopClick = async (host, checkGameStartPath) => {
    await waitUntilMatch({
        deviceId: host,
        region: { left: 150, top: 50, width: 180, height: 50 },
        templateImages: [`${checkGameStartPath}\\luyen-cong.png`],
        matchThreshold: 0.8,
    });
    for (let index = 0; index < 40; index++) {
        await tap(host, 310, 290)
    }
    await sleep(1000);
}


let logout = async (host) => {
    await tap(host, 946, 337)
    await sleep(800);
    await tap(host, 153, 115)
    await sleep(500);
    await tap(host, 800, 250)
    await sleep(500);
}


let phu_ban_do_kim_phong = async (host, templatePath) => {
    let { checkGameStartPath, basePath } = templatePath;

    await tap(host, 38, 125)
    await sleep(500);
    await tap(host, 250, 370)  // click câu cá
    await sleep(500);
    await tap(host, 860, 470)  // click tham gia

    await waitUntilMatch({
        deviceId: host,
        region: { left: 150, top: 50, width: 180, height: 50 },
        templateImages: [`${checkGameStartPath}\\luyen-cong.png`],
        matchThreshold: 0.8,
    });

    await tap(host, 855, 60);   // click bản đồ
    await sleep(500);

    while (true) {
        await tap(host, 190, 340);  // click được điểm

        const result3 = await captureAndMatch({
            deviceId: host,
            region: { left: 80, top: 80, width: 200, height: 40 },
            templateImages: [`${basePath}\\kim_phong\\duoc-diem.png`],
        });
        if (result3.length > 0) break;

        await sleep(500);
    }

    await tap(host, 320, 295);  // nhấn nút giao dịch
    await sleep(500);

    await tap(host, 775, 480);  // bấm nút bán nhanh
    await sleep(500);

    await tap(host, 215, 160);  // tick
    await tap(host, 275, 160);
    await tap(host, 335, 160);
    await tap(host, 395, 160);
    await tap(host, 455, 160);
    await tap(host, 515, 160);
    await tap(host, 575, 160);

    await tap(host, 215, 255);  // tick
    await tap(host, 275, 255);
    await tap(host, 335, 255);
    await tap(host, 395, 255);
    await tap(host, 455, 255);
    await tap(host, 515, 255);
    await tap(host, 575, 255);

    await waitForInput();
    await tap(host, 700, 410);   // bán   
    await sleep(500);
    await tap(host, 855, 60);   // click bản đồ, hủy mở bản đồ
    await sleep(500);
    await tap(host, 855, 60);   // click bản đồ, hủy mở bản đồ
}










const actionsNhanVat = {
    1: (host) => tap(host, 75, 130),
    2: (host) => tap(host, 75, 230),
    3: (host) => tap(host, 75, 330),
};


(async () => {
    try {
        // setupKeyboard();
        await connectAll();
        let accounts = await init();
        // let accounts = [["12312"]]
        // console.log(accounts);

        const basePath = `C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-cay-kim-phong\\`
        const resourcePath = `C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-lam_bst`;

        const loginPath = `${resourcePath}\\dang-nhap`;
        const checkGameStartPath = `${resourcePath}\\check-vao-game`;



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

            for (let round = 0; round < 3; round++) {
                console.log(`round ${round}`, accountRow);

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










                // Bước 3: chờ vào game - đồng bộ tất cả host
                await Promise.all(hosts.map(host => waitUntilMatch({
                    deviceId: host,
                    region: { left: 150, top: 50, width: 180, height: 50 },
                    templateImages: [`${checkGameStartPath}\\luyen-cong.png`],
                    matchThreshold: 0.8,
                })));

                // nhiệm vụ vào phái
                await Promise.all(hosts.map(host => nvSuphu(host)));
                await Promise.all(hosts.map(host => loopClick(host, checkGameStartPath)));

                // nang skill và cài đặt auto
                await Promise.all(hosts.map(host => autoSkill(host)));
                await sleep(1000)

                // tăng sức mạnh sinh khí
                await Promise.all(hosts.map(host => tangSucManhSinhKhi(host)));
                await sleep(1000)

                // ---- Mỗi bước dưới đây chạy song song trên cả 20 host,
                //      chờ tất cả xong bước đó rồi mới sang bước tiếp theo ----

                await Promise.all(hosts.map(host => nv1(host)));
                await Promise.all(hosts.map(host => loopClick(host, checkGameStartPath)));
                await Promise.all(hosts.map(host => nv2(host)));
                await Promise.all(hosts.map(host => loopClick(host, checkGameStartPath)));

                await Promise.all(hosts.map(host => nv1(host)));
                await Promise.all(hosts.map(host => waitUntilMatch({
                    deviceId: host,
                    region: { left: 10, top: 205, width: 180, height: 60 },
                    templateImages: [`${basePath}\\b1.png`],
                })));
                await Promise.all(hosts.map(host => nv2(host)));
                await Promise.all(hosts.map(host => waitUntilMatch({
                    deviceId: host,
                    region: { left: 10, top: 205, width: 180, height: 60 },
                    templateImages: [`${basePath}\\b2.png`],
                })));

                await Promise.all(hosts.map(host => nv1(host)));
                await Promise.all(hosts.map(host => loopClick(host, checkGameStartPath)));
                await Promise.all(hosts.map(host => nv2(host)));
                await Promise.all(hosts.map(host => loopClick(host, checkGameStartPath)));

                await Promise.all(hosts.map(host => nv1(host)));
                await Promise.all(hosts.map(host => loopClick(host, checkGameStartPath)));
                await Promise.all(hosts.map(host => nv2(host)));
                await Promise.all(hosts.map(host => waitUntilMatch({
                    deviceId: host,
                    region: { left: 10, top: 205, width: 180, height: 60 },
                    templateImages: [`${basePath}\\b2.png`],
                })));

                await Promise.all(hosts.map(host => nv1(host)));
                await Promise.all(hosts.map(host => waitUntilMatch({
                    deviceId: host,
                    region: { left: 10, top: 205, width: 180, height: 60 },
                    templateImages: [`${basePath}\\b3.png`],
                })));
                await Promise.all(hosts.map(host => nv2(host)));
                await Promise.all(hosts.map(host => loopClick(host, checkGameStartPath)));
                await Promise.all(hosts.map(host => nv1(host)));
                await Promise.all(hosts.map(host => loopClick(host, checkGameStartPath)));
                await Promise.all(hosts.map(host => nv2(host)));
                await Promise.all(hosts.map(host => loopClick(host, checkGameStartPath)));
                await Promise.all(hosts.map(host => nv1(host)));
                await Promise.all(hosts.map(host => loopClick(host, checkGameStartPath)));

                await Promise.all(hosts.map(host => nv2(host)));
                await Promise.all(hosts.map(host => waitUntilMatch({
                    deviceId: host,
                    region: { left: 10, top: 205, width: 180, height: 60 },
                    templateImages: [`${basePath}\\b4.png`],
                })));

                await Promise.all(hosts.map(host => nv1(host)));
                await Promise.all(hosts.map(host => waitUntilMatch({
                    deviceId: host,
                    region: { left: 10, top: 205, width: 180, height: 60 },
                    templateImages: [`${basePath}\\b3.png`],
                })));

                await Promise.all(hosts.map(host => nv2(host)));
                await Promise.all(hosts.map(host => loopClick(host, checkGameStartPath)));
                await Promise.all(hosts.map(host => nv1(host)));
                await Promise.all(hosts.map(host => loopClick(host, checkGameStartPath)));
                await Promise.all(hosts.map(host => nv1(host)));
                await Promise.all(hosts.map(host => loopClick(host, checkGameStartPath)));
                await Promise.all(hosts.map(host => nv1(host)));
                await Promise.all(hosts.map(host => waitUntilMatch({
                    deviceId: host,
                    region: { left: 10, top: 205, width: 180, height: 60 },
                    templateImages: [`${basePath}\\b5.png`],
                })));

                await Promise.all(hosts.map(host => nv1(host)));
                await Promise.all(hosts.map(host => loopClick(host, checkGameStartPath)));




                // khu vực nhiệm vụ kimphong 5x
                await Promise.all(hosts.map(host => nv3(host)));
                await Promise.all(hosts.map(host => waitUntilMatch({
                    deviceId: host,
                    region: { left: 150, top: 50, width: 180, height: 50 },
                    templateImages: [`${checkGameStartPath}\\luyen-cong.png`],
                    matchThreshold: 0.8,
                })));

                await Promise.all(hosts.map(async host => {
                    for (let index = 0; index < 20; index++) {
                        await tap(host, 310, 290)
                    }
                }));
                await sleep(1000);
                await Promise.all(hosts.map(host => nv3(host)));
                await Promise.all(hosts.map(host => loopClick(host, checkGameStartPath)));
                await Promise.all(hosts.map(host => nv3(host)));
                await Promise.all(hosts.map(host => waitUntilMatch({
                    deviceId: host,
                    region: { left: 10, top: 205, width: 180, height: 60 },
                    templateImages: [`${basePath}\\5x-1.png`],
                })));
                await Promise.all(hosts.map(host => nv3(host)));
                await Promise.all(hosts.map(host => loopClick(host, checkGameStartPath)));
                await Promise.all(hosts.map(host => nv3(host)));
                await Promise.all(hosts.map(host => loopClick(host, checkGameStartPath)));
                await Promise.all(hosts.map(host => nv3(host)));
                await Promise.all(hosts.map(host => loopClick(host, checkGameStartPath)));
                await Promise.all(hosts.map(host => nv3(host)));
                await Promise.all(hosts.map(host => waitUntilMatch({
                    deviceId: host,
                    region: { left: 10, top: 205, width: 180, height: 60 },
                    templateImages: [`${basePath}\\5x-2.png`],
                })));
                await Promise.all(hosts.map(host => nv3(host)));
                await Promise.all(hosts.map(host => loopClick(host, checkGameStartPath)));

                await Promise.all(
                    hosts.map(async host => {
                        while (true) {
                            await nv3(host);

                            const results3 = await captureAndMatch({
                                deviceId: host,
                                region: { left: 80, top: 80, width: 200, height: 40 },
                                templateImages: [`${basePath}\\5x-popup.png`],
                            });

                            if (results3.length > 0) break;

                            await sleep(500);
                        }
                        return true;
                    })
                );

                await Promise.all(hosts.map(async host => {
                    for (let index = 0; index < 40; index++) {
                        await tap(host, 310, 290)
                    }
                }));
                await Promise.all(hosts.map(host => nv3(host)));
                await Promise.all(hosts.map(host => loopClick(host, checkGameStartPath)));
                await Promise.all(hosts.map(host => nv3(host)));
                await Promise.all(hosts.map(host => loopClick(host, checkGameStartPath)));
                await Promise.all(hosts.map(host => nv3(host)));
                await Promise.all(hosts.map(host => loopClick(host, checkGameStartPath)));
                // end 5x




                await Promise.all(hosts.map(host => phu_ban_do_kim_phong(host, { checkGameStartPath, basePath })));
                await Promise.all(hosts.map(host => waitUntilMatch({
                    deviceId: host,
                    region: { left: 150, top: 50, width: 180, height: 50 },
                    templateImages: [`${checkGameStartPath}\\luyen-cong.png`],
                    matchThreshold: 0.8,
                })));
                await Promise.all(hosts.map(host => logout(host)));
            }
        }

        // ---- Chạy TUẦN TỰ qua từng dòng account (vì chỉ có 20 host, phải tái sử dụng) ----
        // Trong mỗi dòng, cả 20 host chạy SONG SONG với nhau (đồng bộ theo từng bước).
        for (let i = 0; i < accounts.length; i++) {
            await processRow(accounts[i]);
        }

        while (!isKilled) await sleep(500);

        console.log("Tất cả đã dừng!");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
})();