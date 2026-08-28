import { exec } from 'child_process';


// const ports = [16808, 16840, 16904, 16968, 17000];
// const ports = [17064, 17128, 17160, 17224, 17256];
// const ports = [17288, 17320, 17352, 17384, 16396];

// const ports = [16808, 16840, 16904, 16968, 17064, 17160 , 17160,];
// const ports = [16904, 16968, 17160, 17000, 17064, 17128];
const ports = [17064, 17128, 16768, 17224, 17256, 17288, 17320,]

const baseIP = '127.0.0.1';
let x = 315, y = 885;
let checkAuo = false;
let timeClick = 500;

let isRunningTap1 = false;
let isRunningTap2 = false;
let intervalId1 = null;
let intervalId2 = null;

function connectDevice(port, callback) {
    const device = `${baseIP}:${port}`;
    exec(`adb connect ${device}`, (err, stdout, stderr) => {
        if (err || stderr) {
            console.error(`Không thể kết nối tới ${device}:`, err?.message || stderr);
            return;
        }
        console.log(`✅ Đã kết nối tới ${device}`);
        callback(port);
    });
}

function sendTapGeneric(port, x, y, label = '') {
    const device = `${baseIP}:${port}`;
    exec(`adb -s ${device} shell input tap ${x} ${y}`, (e, so, se) => {
        if (e) return console.error(`❌ ${label}${device} lỗi:`, e.message);
        if (se) return console.error(`⚠️ ${label}${device} stderr:`, se);
        console.log(`👆${label} ${device} đã click tại (${x},${y})`);
    });
}

function startTap1() {
    if (intervalId1) clearInterval(intervalId1);
    intervalId1 = setInterval(() => {
        if (isRunningTap1) ports.forEach(e => sendTapGeneric(e, x, y, `Tap1: ${timeClick} `));
    }, timeClick);
    console.log(`▶️ Bắt đầu Tap1 mỗi ${timeClick}ms`);
}

function startTap2() {
    if (intervalId2) clearInterval(intervalId2);
    intervalId2 = setInterval(() => {
        if (isRunningTap2) ports.forEach(e => sendTapGeneric(e, 85, 625, 'Tap2: '));
    }, 1500);
    console.log(`▶️ Bắt đầu Tap2 mỗi 3000ms`);
}



process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', key => {
    if (key === 'o') {
        isRunningTap1 = false;
        console.log('⏸️ Đã tạm dừng Tap1.');
    } else if (key === 'i') {
        if (!isRunningTap1) {
            isRunningTap1 = true;
            console.log('▶️ Đã tiếp tục Tap1.');
        }
    } else if (key === 'n') {
        isRunningTap2 = !isRunningTap2;
        console.log(`click nv ${isRunningTap2}`);
    } else if (key === 'm') {
        ports.forEach(e => sendTapGeneric(e, 180, 555));
        // ports.forEach(e => sendTapGeneric(e, 370, 605));
    } else if (key === 'p') {
        checkAuo = !checkAuo;

        if (checkAuo) {
            timeClick = 1500;
            x = 415, y = 870;
            console.log('▶️ Tap1 click trên lv15');
        } else {
            timeClick = 500;
            x = 315, y = 885;
            console.log('▶️ Tap1 click duoi lv15');
        }
    } else if (key === '\u0003') { // Ctrl + C
        clearInterval(intervalId1);
        intervalId1 = null;
        isRunningTap1 = false;

        clearInterval(intervalId2);
        intervalId2 = null;
        isRunningTap2 = false;

        console.log('⛔ Đã dừng Tap.');
        process.exit();
    }
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
    exec(`adb disconnect`, () => { });

    await sleep(1000);
    ports.forEach(port => connectDevice(port, () => { }));

    await sleep(3000);

    startTap1();
    startTap2();
})();



















// import { exec } from 'child_process';



// // const ports = [16808, 16840, 16904, 16968, 17000];
// // const ports = [17064, 17128, 17160, 17224, 17256];
// // const ports = [17288, 17320, 17352, 17384, 16396];

// // const ports = [16808, 16840, 16904, 16968, 17064, 17160 , 17160,];
// // const ports = [16904, 16968, 17160, 17000, 17064, 17128];
// const ports = [16768, 16808, 16840, 16904, 16968, 17000, 16416,]









// const baseIP = '127.0.0.1';
// let x = 315, y = 885;
// let checkAuo = false;
// let timeClick = 500;

// let isRunning = false;
// let intervalId = null;

// function connectDevice(port, callback) {
//     const device = `${baseIP}:${port}`;
//     exec(`adb connect ${device}`, (err, stdout, stderr) => {
//         if (err || stderr) {
//             console.error(`Không thể kết nối tới ${device}:`, err?.message || stderr);
//             return;
//         }
//         console.log(`✅ Đã kết nối tới ${device}`);
//         callback(port);
//     });
// }

// function sendTap(port) {
//     const device = `${baseIP}:${port}`;
//     exec(`adb -s ${device} shell input tap ${x} ${y}`, (e, so, se) => {
//         if (e) return console.error(`❌ ${device} lỗi:`, e.message);
//         if (se) return console.error(`⚠️ ${device} stderr:`, se);
//         console.log(`👆${timeClick}, ${device} đã click tại (${x},${y})`);
//     });
// }

// function startTapping() {
//     if (intervalId) clearInterval(intervalId);
//     intervalId = setInterval(() => {
//         if (isRunning) ports.forEach(sendTap);
//     }, timeClick);
//     console.log(`▶️ Bắt đầu gửi tap mỗi ${timeClick}ms trên tất cả devices...`);
// }

// function stopTapping() {
//     clearInterval(intervalId);
//     intervalId = null;
//     console.log('⛔ Đã dừng gửi tap.');
// }

// // Lắng nghe phím nhấn
// process.stdin.setRawMode(true);
// process.stdin.resume();
// process.stdin.setEncoding('utf8');
// process.stdin.on('data', key => {
//     if (key === 'o') {
//         isRunning = false;
//         console.log('⏸️ Đã tạm dừng gửi tap.');
//     } else if (key === 'i') {
//         if (!isRunning) {
//             isRunning = true;
//             console.log('▶️ Đã tiếp tục gửi tap.');
//         }
//     } else if (key === 'p') {
//         checkAuo = !checkAuo;

//         if (checkAuo) {
//             timeClick = 1500;
//             x = 415, y = 870;
//             console.log('chay click tren lv15');
//         } else {
//             timeClick = 500;
//             x = 315, y = 885;
//             console.log('chay click duoi lv15');
//         }
//     } else if (key === '\u0003') { // Ctrl + C
//         stopTapping();
//         process.exit();
//     }
// });


// const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

// (async () => {

//     exec(`adb disconnect`, (err, stdout, stderr) => { });

//     await sleep(1000);
//     // Kết nối thiết bị và bắt đầu
//     ports.forEach(port => connectDevice(port, () => { }));

//     await sleep(3000);

//     startTapping()
// })()

































