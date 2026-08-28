import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import CDP from 'chrome-remote-interface';

import { runChrome } from '../../core/runChrome.mjs';
import { makeMetadata } from '../../core/parseUa.js';

import { processTasks, processTasks2 } from '../../utils/constant.js';
import { waitForInput, sleep, writeTimeToFile } from '../../utils/utils.js';
import { resetAll } from '../../utils/mouseSync.js';

import { MouseSyncController, get_start_click, set_start_click, get_click_fish, get_start_click2 } from '../../utils/mouseSync.js';
import { findMatchingRegions, monitorFPSAndCapture } from '../../utils/opencvNodejs.js';

import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


let rootEmpty = [];

const MainBrowser = async ({ userProfileIndex, proxy, positionX, positionY, index }) => {
    try {
        let { chrome, cursor, cursorSession, client, cursorActionClient, sessionIframe, cursorActionIframe, iframes, workers, mouseControler } = await runChrome({
            userProfileIndex,
            proxy,
            // proxy: null,
            args: [
                `--window-position=${positionX},${positionY}`,
                '--window-size=400,780',
                `--force-device-scale-factor=${scale}`,
            ],
            url: "chrome-extension://mcohilncbfahbmgdjkbpemcciiolgcge/popup.html#/initialize",
            accessIframe: false,

            clearCookies: true,
            clearCache: true,
            clearDataForOrigin: 'https://lineh5.mobirix.com',

            closeTabs: false,
            okx: true,
        });

        // await sleep(3000);
        let checkExist = false;
        while (!checkExist) {
            await cursorActionClient.moveToSelector({ selector: "#app > div > div.main-container-wrapper > div > div._content_1ttdc_26 > form > div.okui-form-item-md.okui-form-item.okui-form-item-no-label._password_11p2x_1 > div > div > div > div > div > input" });
            await cursorActionClient.moveToSelector({ selector: "#app > div > div.main-container-wrapper > div > div._content_1ttdc_26 > form > div.okui-form-item-md.okui-form-item.okui-form-item-no-label._password_11p2x_1 > div > div > div > div > div > input" });
            await client.Input.insertText({ text: "Hoang123@" });
            await cursorActionClient.moveToSelector({ selector: "#app > div > div._affix_oe51y_42._footer_11p2x_17 > button" });

            const { result } = await client.Runtime.evaluate({ expression: `document.querySelector("#app > div > div.main-container-wrapper > div > div._content_1ttdc_26 > form > div.okui-form-item-md.okui-form-item.okui-form-item-no-label._password_11p2x_1 > div > div > div > div > div > input")?.value !== ''` });
            if (result?.value) checkExist = true;
        }

        let pageLoaded = false;
        while (!pageLoaded) {
            const { result } = await client.Runtime.evaluate({ expression: 'document.readyState' });
            if (result.value === 'complete') pageLoaded = true;
            await sleep(500);
        }

        // vi con
        async function checkNameAccount(client) {
            const { result } = await client.Runtime.evaluate({ expression: 'document.querySelector("#home-page-root-element-id > div").textContent' });
            return result.value;
        }

        let nameWallet = await checkNameAccount(client);
        // console.log(nameWallet)
        while (!nameWallet?.includes(walletAccount)) {
            await cursorActionClient.moveToSelector({ selector: "#home-page-root-element-id > div > div > div > img", maxWaitTime: 500 });
            await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div > div > div._root_1k0l3_1 > div > div > div > i", maxWaitTime: 500 });
            await cursorActionClient.moveToSelector({ selector: `[data-testid="okd-input"]`, maxWaitTime: 500 });
            await client.Input.insertText({ text: walletAccount });
            await sleep(2000);
            await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div > div._walletList_qch1e_7 > div > div > div > div:nth-child(2)", maxWaitTime: 500 });
            nameWallet = await checkNameAccount(client);
            // console.log(nameWallet)
        }



        const response = await axios.get(`http://localhost:${chrome.port}/json`);
        const tabs = response.data;

        const port = chrome.port;
        let targetTab = null;
        let targetTabPopup = null;

        for (const tab of tabs) {
            if (tab.url.includes('google.com')) {
                targetTab = tab;
            }
            if (tab.url.includes('chrome-extension://mcohilncbfahbmgdjkbpemcciiolgcge/popup.html')) targetTabPopup = tab;
        }


        // const UA_LIST = fs
        // _FAKE?.includes('Firefox');

        const tab = await CDP({ target: targetTab.webSocketDebuggerUrl, port });
        const { Page, Network, Target, Runtime, Input } = tab;
        await Promise.all([Page.enable(), Network.enable(), Runtime.enable()]);
        rootEmpty.push(tab);


        // if (isFirefoxUA) {
        //     await Network.setUserAgentOverride({ userAgent: UA_FAKE });
        // } else {
        //     await Network.setUserAgentOverride({
        //         userAgent: UA_FAKE,
        //         userAgentMetadata: makeMetadata(UA_FAKE)
        //     });
        // }


        await Page.navigate({ url: "https://lineh5.mobirix.com/futurewar/index.html?dp_tracking_id=LdLYbC6ZV2r9B4et" });
        await sleep(index * 1000);
        let mouseControler2 = new MouseSyncController({ client: tab, userProfileIndex, index });
        await mouseControler2.init(tab);
        await tab.Page.bringToFront();


        await Target.setDiscoverTargets({ discover: true });
        Target.targetCreated(async ({ targetInfo }) => {
            const { type, targetId } = targetInfo;
            try {
                if (type === 'iframe') {
                    await sleep(5000)
                    sessionIframe = await CDP({ target: targetInfo.targetId, port: chrome.port });
                    const { Runtime } = sessionIframe;
                    await Promise.all([Page.enable(), Runtime.enable()]);
                    await sessionIframe.Runtime.evaluate({
                        expression: `(()=>{
                        let a = document.querySelectorAll("#root > div > div > div > div > button")
                        for (const btn of a){
                            if (btn.textContent.includes('Connect with OKX Wal')) {
                                btn.click()
                                break; // Dừng nếu chỉ cần log 1 lần
                            }
                        }
                    })()`
                    });

                }

                if (type === 'page') {
                    await tab.Target.closeTarget({ targetId });
                }
            } catch (error) {
            }
        });

        // await monitorFPSAndCapture({ client: tab, captureImg: true, sleep: 3000 });


        setInterval(async () => {
            try {
                await tab.Runtime.evaluate({ expression: 'console.log(1)' });
            } catch (error) {
                process.exit(0)
            }
        }, 5000);

        const bot = new GameBot(tab);

        let exclude = [];
        let checkIntervalVC = setInterval(async () => {
            try {
                const { matchedPoints } = await findMatchingRegions({
                    client: tab,
                    templateImages: [
                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\lin\\connect.jpeg',
                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\lin\\end.jpeg',
                    ].filter(item => !exclude.includes(item)),
                    matchThreshold: 0.8,
                    scale,
                });

                if (matchedPoints.length > 0) {
                    for (const { x, y, mathImagePath } of matchedPoints) {
                        if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\lin\\connect.jpeg') {
                            await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x: x - 70, y: y - 10 }] });
                            await sleep(50);
                            await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                        }
                        else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\lin\\end.jpeg') {
                            await bot.clickPoint(193, 429, 1000)
                            await bot.clickPoint(193, 429, 1000)
                            await bot.clickPoint(144, 431, 1000)
                            await bot.clickPoint(255, 399, 1000)
                        }
                    }
                }
            } catch (error) {
            }
        }, 2000);



        await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div > div._affix_oe51y_42._borderTop_oe51y_48 > div._action-buttons_j3bvq_1 > button.okui-btn.btn-lg.btn-fill-highlight.mobile._action-button_j3bvq_1" });

        await sleep(10000);
        // xu ly xoa popup
        if (targetTabPopup) {
            const tabPopup = await CDP({ target: targetTabPopup?.webSocketDebuggerUrl, port });
            await tabPopup.Target.closeTarget({ targetId: targetTabPopup?.id });
        }



        console.log("start")
        while (index !== checkIndex) await sleep(1000)
        checkIndex = null;

        await bot.readFile(`hdan.js`);
        await bot.readFile(`2.js`);
        await bot.readFile(`2-1.js`);

        await sleep(5000)

        await bot.readFile(`3.js`);
        await bot.readFile(`3-1.js`);

        await sleep(30000)
        await sleep(30000)

        await bot.readFile(`4.js`);
        await bot.readFile(`4-1.js`);

        await sleep(30000)
        await sleep(30000)


        await bot.readFile(`5.js`);
        await bot.readFile(`5-1.js`);

        await sleep(30000)

        await bot.readFile(`6.js`);
        await bot.readFile(`6-1.js`);

        await sleep(20000)

        await bot.readFile(`7.js`);
        await bot.readFile(`7-1.js`);

        await sleep(30000)
        await sleep(20000)

        await bot.readFile(`8.js`);
        await bot.readFile(`8-1.js`);

        await sleep(30000)
        await bot.readFile(`9.js`);
        await bot.readFile(`9-1.js`);


        await bot.readFile(`10.js`);
        await bot.readFile(`10-1.js`);

        await sleep(30000)
        await bot.readFile(`11.js`);
        await bot.readFile(`11-1.js`);

        await sleep(30000)
        await bot.readFile(`free.js`);
        await bot.readFile(`mua.js`);

        await bot.readFile(`12.js`);
        await bot.readFile(`12-1.js`);

        while (index !== checkIndex) await sleep(1000)
        checkIndex = null;
        await bot.readFile(`13.js`);
        await bot.readFile(`13-1.js`);

        while (index !== checkIndex) await sleep(1000)
        checkIndex = null;

        await bot.readFile(`14.js`);
        await bot.readFile(`14-1.js`);

        while (index !== checkIndex) await sleep(1000)
        checkIndex = null;

        await bot.readFile(`15.js`);
        await bot.readFile(`15-1.js`);

        await waitForInput("v");
        await client.close();
        await chrome.kill();
    } catch (error) {
        console.log(error);
        console.error("Error:", error.message);
        await waitForInput();
    }
}

class GameBot {
    constructor(client) {
        this.client = client;
    }

    // Delay helper
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Gửi sự kiện chuột
    async mouse(type, x, y, opts = {}) {
        try {
            await this.client.Input.dispatchMouseEvent({
                type,
                x,
                y,
                button: 'left',
                clickCount: 1,
                ...opts
            });
        } catch (err) { }
    }

    // Click vào 1 điểm
    async clickPoint(x, y, delay = 500) {
        try {
            await this.sleep(delay);
            await this.mouse('mouseMoved', x, y);
            await this.mouse('mousePressed', x, y);
            await this.mouse('mouseReleased', x, y);
        } catch (err) { }
    }

    // Kéo thả chuột
    async dragAndDrop(x1, y1, x2, y2) {
        try {
            await this.mouse('mouseMoved', x1, y1);
            await this.mouse('mousePressed', x1, y1);

            const steps = 10;
            for (let i = 1; i <= steps; i++) {
                const nx = x1 + ((x2 - x1) / steps) * i;
                const ny = y1 + ((y2 - y1) / steps) * i;
                await this.mouse('mouseMoved', nx, ny);
                await this.sleep(50);
            }

            await this.mouse('mouseReleased', x2, y2);
        } catch (err) { }
    }

    async readFile(path) {
        try {
            const scriptContent = fs.readFileSync(
                `C:\\Users\\huy\\Desktop\\tools_farm\\folder_lin\\${path}`,
                'utf8'
            );

            const { clickPoint, dragAndDrop, clickUpgrade, startGame } = this; // Lấy đủ method

            const runScript = new Function(
                'clickPoint',
                'dragAndDrop',
                'clickUpgrade',
                'startGame',
                'sleep',
                `
            return (async () => {
                ${scriptContent}
            })();
        `);

            await runScript(
                clickPoint.bind(this),
                dragAndDrop.bind(this),
                clickUpgrade.bind(this),
                startGame.bind(this),
                sleep.bind(this)
            );
        } catch (err) {
            console.error(err);
        }
    }

    // Click nâng cấp
    async clickUpgrade() {
        for (let i = 0; i < 6; i++) {
            await this.clickPoint(443, 455);
        }
    }

    // Bắt đầu game
    async startGame() {
        try {
            await this.clickPoint(40, 345);
            await this.clickPoint(40, 263);

            await this.clickPoint(187, 464);
            await this.clickPoint(187, 464, 1000);

            await this.clickPoint(28, 457, 3500);

            for (let i = 0; i < 3; i++) {
                await this.clickPoint(24, 342, 1500);
                await this.clickPoint(258, 404);
                await this.clickPoint(258, 404, 4500);
            }

            await this.clickPoint(21, 364);
            await this.clickPoint(241, 396, 1500);
            await this.clickPoint(241, 396, 4500);
        } catch (err) { }
    }
}



let checkRunClick = false;
let startTime = Date.now();

let checkIndex = null;




// setInterval(() => {
//     const elapsed = (Date.now() - startTime) / 1000;
//     console.log(`Đã trôi qua: ${elapsed.toFixed(1)} giây`);
// }, 1000);


async function runTask(a, b) {
    const mouse = async (type, x, y, opts = {}) => await rootEmpty[a].Input.dispatchMouseEvent({ type, x, y, button: 'left', clickCount: 1, ...opts });

    const clickUpgrade = async () => { for (let i = 0; i < 6; i++) await clickPoint(443, 455); };

    async function clickPoint(x, y, delay = 500) {
        try {
            await sleep(delay);
            await mouse('mouseMoved', x, y);
            await mouse('mousePressed', x, y);
            await mouse('mouseReleased', x, y);
        } catch (error) { }
    }

    async function dragAndDrop(x1, y1, x2, y2) {
        try {
            await mouse('mouseMoved', x1, y1);
            await mouse('mousePressed', x1, y1);

            const steps = 10;
            for (let i = 1; i <= steps; i++) {
                const nx = x1 + ((x2 - x1) / steps) * i;
                const ny = y1 + ((y2 - y1) / steps) * i;
                await mouse('mouseMoved', nx, ny);
                await sleep(50);
            }

            await mouse('mouseReleased', x2, y2);
        } catch (error) { }
    }

    const readFile = async (path) => {
        try {
            const scriptContent = fs.readFileSync("C:\\Users\\huy\\Desktop\\tools_farm\\folder_lin\\" + path, 'utf8')
            const asyncWrapper = `(async () => {
                                ${scriptContent}
                })()`;
            await eval(asyncWrapper);
        } catch (err) { }
    }

    const startGame = async () => {
        // upgrade
        await clickPoint(40, 345)
        await clickPoint(40, 263)

        await clickPoint(187, 464)
        await clickPoint(187, 464, 1000)
        // pause
        await clickPoint(28, 457, 3500)

        for (let i = 0; i < 3; i++) {
            await clickPoint(24, 342, 1500)
            await clickPoint(258, 404)
            await clickPoint(258, 404, 4500)
        }

        // AD chat cay
        await clickPoint(21, 364)
        await clickPoint(241, 396, 1500)
        await clickPoint(241, 396, 4500)
    }

    await readFile(`${b}.js`);
    await readFile(`${b}-1.js`);
}


rl.on('line', async (input) => {
    // if (checkRunClick == true) return;
    // checkRunClick = true;
    // checkRunClick = false;
    if (!input.trim()) return;

    checkIndex = Number(input);

    const parts = input.split('-');
    if (parts.length !== 2) return;

    const a = parseInt(parts[0], 10);
    const b = parseInt(parts[1], 10);

    await runTask(a, b); // Không await ở đây nếu muốn song song
});




let scale = 0.5;
scale = 1;

let walletAccount = `Account 06`;

// vi 1, cac so bi loi < 2029
(async () => {
    await processTasks(MainBrowser, {
        totalElements: 2180,
        stop: 2070,
        numTasksPerRun: 1,
        exclude: [],
        columns: 8,
        // columns: 4,
        delayDuration: 4 * 60000,
        xStep: 480,
        yStep: 700,
        callback: async () => {
            rootEmpty = [];
            resetAll();
        },
    })
})();

