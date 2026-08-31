import fs from "fs-extra";
import path from 'path';
import { sleep, printFormattedTitle, getFileInfo } from './utils.js';

export let chromeFlags = [
    '--disable-features=Translate,OptimizationHints,MediaRouter,DialMediaRouteProvider,CalculateNativeWinOcclusion,InterestFeedContentSuggestions,CertificateTransparencyComponentUpdater,AutofillServerCommunication,PrivacySandboxSettings4,AutomationControlled',
    // '--disable-blink-features=BlockCredentialedSubresources',

    '--test-type',
    '--no-sandbox',
    '--disable-setuid-sandbox',

    // //moi them
    '--disable-client-side-phishing-detection',     //Tắt tính năng phát hiện lừa đảo
    '--disable-crash-reporter',         //Tắt báo cáo lỗi của Chrome
    '--disable-client-side-cert-check',
    // '--disable-web-security',
    '--metrics-recording-only',         //Bật chế độ chỉ ghi lại dữ liệu hệ thống, vô hiệu hóa các báo cáo chi tiết từ Chrome. Điều này có thể hữu ích nếu bạn không cần dữ liệu chi tiết về hoạt động.
    '--disable-logging',

    //tat restore pages nhung khong nen dung, vì khi tắt nó, chrome sẽ biết là tính năng này bị tắt và sẽ chạy các tiến trình nền cho chrome, còn khi bật thì nó chờ cho đến khi người dùng muốn khôi phục hay k, nên là không nên bật nó
    // '--hide-crash-restore-bubble',

    // "--disable-infobars",
    // '--disable-notifications',   //khong duoc tick cai nay
    '--mute-audio',

    '--no-default-browser-check',
    '--no-first-run',
    '--disable-default-apps',

    '--disable-dev-shm-usage',
    '--disable-sync',
    '--disable-sync-preferences',
    // '--ignore-certificate-errors',

    '--window-position=0,0',
    '--start-maximized',

    // '--window-size=400,780',
]

let { __filename, __dirname } = getFileInfo(import.meta.url);

export const proxies = fs.readFileSync(path.join(__dirname, '..', 'data', 'proxy.txt'), 'utf8').split('\n').map(line => line.trim()).filter(line => line.length > 0);
export const distance = 5;

export const processTasks = async (MainBrowser, {
    numTasksPerRun = 10,
    delayDuration = 3000,
    stop = 0,
    tasks = [],
    exclude = [4, 9, 41],
    columns = 5,    // Số cột (các giá trị positionX trong một hàng)
    xStep = 500,    // Bước nhảy của positionX
    yStep = 780,    // Bước nhảy của positionY
    callback = null,
    totalElements = 51,
}) => {
    tasks = tasks.length > 0 ? tasks : [...Array(totalElements).keys()].filter(i => !exclude.includes(i) && i >= stop);

    while (tasks.length) {
        const currentBatch = tasks.splice(0, numTasksPerRun);
        await Promise.all(currentBatch.map(async (e, index) => {
            const positionX = xStep * (index % columns);
            const positionY = yStep * Math.floor(index / columns);

            await sleep(index * delayDuration);
            const proxy = proxies[e] === 'null' ? null : proxies[e];
            printFormattedTitle(`account ${e} - Profile ${e + 100} - proxy ${proxy}`, "red");
            await MainBrowser({ userProfileIndex: e, proxy, positionX, positionY, index });
        }));
        await callback?.();
    }
};



export const processTasks2 = async (MainBrowser, {
    numTasksPerRun = 10,
    delayDuration = 3000,
    stop = 0,
    tasks = [],
    exclude = [4, 9],
    columns = 5,
    xStep = 500,
    yStep = 780,
    callback = null,
    totalElements = 51,
}) => {
    tasks = tasks.length > 0 ? tasks : [...Array(totalElements).keys()].filter(i => !exclude.includes(i) && i >= stop);

    let taskIndex = 0;

    const runTask = async (index) => {
        if (taskIndex >= tasks.length) return;

        const e = tasks[taskIndex++];
        const positionX = xStep * (index % columns);
        const positionY = yStep * Math.floor(index / columns);

        await sleep(index * delayDuration); // delay theo thứ tự index để tránh trùng thời điểm

        const proxy = proxies[e] === 'null' ? null : proxies[e];

        printFormattedTitle(`account ${e} - Profile ${e + 100} - proxy ${proxy}`, "red");
        await MainBrowser({ userProfileIndex: e, proxy, positionX, positionY, index });
        await callback?.();
        await runTask(index); // sau khi xong thì gọi tiếp task mới với cùng index (slot đó)
    };

    // Khởi tạo numTasksPerRun "slot" chạy song song
    const runningSlots = Array.from({ length: numTasksPerRun }, (_, index) => runTask(index));
    await Promise.all(runningSlots);
};

