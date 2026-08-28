import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import CDP from 'chrome-remote-interface';

import { runChrome } from './core/runChrome.mjs';

import { processTasks, processTasks2 } from './utils/constant.js';
import { waitForInput, sleep, writeTimeToFile } from './utils/utils.js';
import { resetAll } from './utils/mouseSync.js';

import { MouseSyncController, get_start_click, set_start_click, get_click_fish } from './utils/mouseSync.js';
import { findMatchingRegions, monitorFPSAndCapture } from './utils/opencvNodejs.js';

// Hàm click chuột tại một điểm
async function clickPoint(tab, x, y, delay = 50) {
    try {
        await sleep(delay);
        await tab.Input.dispatchMouseEvent({ type: 'mouseMoved', x, y });
        await tab.Input.dispatchMouseEvent({ type: 'mousePressed', x, y, button: 'left' });
        await tab.Input.dispatchMouseEvent({ type: 'mouseReleased', x, y, button: 'left' });
    } catch (error) {
    }
}

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
            clearDataForOrigin: 'https://bngo.gg/',

            // closeTabs: false,

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
            await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div._root_1p8xt_1 > div._root_1k0l3_1 > div > div > div > i", maxWaitTime: 500 });
            await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div._root_1p8xt_1 > div._root_1k0l3_1 > div > div > input.okui-input-input", maxWaitTime: 1000 });
            await client.Input.insertText({ text: walletAccount });
            await sleep(2000);
            await cursorActionClient.moveToSelector({ selector: `#app > div > div > div > div._root_1p8xt_1 > div._walletList_1p8xt_6 > div > div > div > div:nth-child(2)`, maxWaitTime: 500 });
            nameWallet = await checkNameAccount(client);
            // console.log(nameWallet)
        }


        const response = await axios.get(`http://localhost:${chrome.port}/json`);
        const tabs = response.data;

        const port = chrome.port;
        let targetTab = null;
        let targetTabPopup = null;

        for (const tab of tabs) {
            if (tab.url === 'https://www.google.com/') {
                // const tabRemove = await CDP({ target: tab.webSocketDebuggerUrl, port });
                // await tabRemove.Target.closeTarget({ targetId: tab.id });
            }
            if (tab.url === 'https://www.okx.com/web3/extension/welcome' || tab.url === 'https://web3.okx.com/extension/welcome') {
                targetTab = tab;
            }
            if (tab.url.includes('chrome-extension://mcohilncbfahbmgdjkbpemcciiolgcge/popup.html')) targetTabPopup = tab;
        }

        const tab = await CDP({ target: targetTab.webSocketDebuggerUrl, port });
        const { Page, Network, Target, Runtime } = tab;
        await Promise.all([Page.enable(), Network.enable(), Runtime.enable()]);


        await Page.navigate({ url: linkRef });
        await tab.Page.bringToFront();



        let exclude = [];
        let checkvar = false;
        let next = false;
        let checkRunClick = false;
        // let isRunning = false;
        setInterval(async () => {
            // if (isRunning) return;
            // isRunning = true;
            try {
                const { matchedPoints } = await findMatchingRegions({
                    client: tab,
                    templateImages: [
                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\bigo\\okx.jpeg',
                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\bigo\\start.jpeg',
                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\bigo\\again.jpeg',
                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\bigo\\ready.jpeg'
                    ].filter(item => !exclude.includes(item)),
                    matchThreshold: 0.8,
                    scale,
                });

                if (matchedPoints.length > 0) {
                    for (const { x, y, mathImagePath } of matchedPoints) {
                        if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\bigo\\okx.jpeg') {
                            await sleep(1000);
                            exclude.push(mathImagePath);
                            await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x: x - 70, y: y + 10 }] });
                            await sleep(50);
                            await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                        }
                        else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\bigo\\start.jpeg') {
                            if (checkvar == true || next == true) return;
                            checkvar = true;
                            next = true;
                            console.log("xx")
                            setTimeout(async () => {
                                const positions = [
                                    // Cột 1 (Block trái)
                                    { x: 80, y: 450 }, { x: 120, y: 450 }, { x: 160, y: 450 }, { x: 200, y: 450 }, { x: 240, y: 450 },
                                    { x: 80, y: 485 }, { x: 120, y: 485 }, { x: 160, y: 485 }, { x: 200, y: 485 }, { x: 240, y: 485 },


                                    // Cột 2 (Block phải)
                                    { x: 270, y: 450 }, { x: 305, y: 450 }, { x: 345, y: 450 }, { x: 380, y: 450 }, { x: 420, y: 450 },
                                    { x: 270, y: 485 }, { x: 305, y: 485 }, { x: 345, y: 485 }, { x: 380, y: 485 }, { x: 420, y: 485 },


                                    { x: 80, y: 555 }, { x: 120, y: 555 }, { x: 160, y: 555 }, { x: 200, y: 555 }, { x: 240, y: 555 },
                                    { x: 80, y: 595 }, { x: 120, y: 595 }, { x: 160, y: 595 }, { x: 200, y: 595 }, { x: 240, y: 595 },
                                    { x: 80, y: 515 }, { x: 120, y: 515 }, { x: 160, y: 515 }, { x: 200, y: 515 }, { x: 240, y: 515 },


                                    { x: 270, y: 555 }, { x: 305, y: 555 }, { x: 345, y: 555 }, { x: 380, y: 555 }, { x: 420, y: 555 },
                                    { x: 270, y: 595 }, { x: 305, y: 595 }, { x: 345, y: 595 }, { x: 380, y: 595 }, { x: 420, y: 595 },
                                    { x: 270, y: 515 }, { x: 305, y: 515 }, { x: 345, y: 515 }, { x: 380, y: 515 }, { x: 420, y: 515 },


                                    // // Cột 1 (Block trái)
                                    // { x: 80, y: 450 }, { x: 120, y: 450 }, { x: 160, y: 450 }, { x: 200, y: 450 }, { x: 240, y: 450 },
                                    // { x: 80, y: 485 }, { x: 120, y: 485 }, { x: 160, y: 485 }, { x: 200, y: 485 }, { x: 240, y: 485 },
                                    // { x: 80, y: 515 }, { x: 120, y: 515 }, { x: 160, y: 515 }, { x: 200, y: 515 }, { x: 240, y: 515 },
                                    // { x: 80, y: 555 }, { x: 120, y: 555 }, { x: 160, y: 555 }, { x: 200, y: 555 }, { x: 240, y: 555 },
                                    // { x: 80, y: 595 }, { x: 120, y: 595 }, { x: 160, y: 595 }, { x: 200, y: 595 }, { x: 240, y: 595 },


                                    // // Cột 2 (Block phải)
                                    // { x: 270, y: 450 }, { x: 305, y: 450 }, { x: 345, y: 450 }, { x: 380, y: 450 }, { x: 420, y: 450 },
                                    // { x: 270, y: 485 }, { x: 305, y: 485 }, { x: 345, y: 485 }, { x: 380, y: 485 }, { x: 420, y: 485 },
                                    // { x: 270, y: 515 }, { x: 305, y: 515 }, { x: 345, y: 515 }, { x: 380, y: 515 }, { x: 420, y: 515 },
                                    // { x: 270, y: 555 }, { x: 305, y: 555 }, { x: 345, y: 555 }, { x: 380, y: 555 }, { x: 420, y: 555 },
                                    // { x: 270, y: 595 }, { x: 305, y: 595 }, { x: 345, y: 595 }, { x: 380, y: 595 }, { x: 420, y: 595 },

                                ];


                                for (const { x, y } of positions) {
                                    await clickPoint(tab, x, y, 500)
                                }
                                checkvar = false;
                            }, 140000);
                            // }, 100000);
                        }
                        else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\bigo\\again.jpeg') {
                            next = false;

                            await clickPoint(tab, 250, 450, 500)
                        }
                        else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\bigo\\ready.jpeg') {
                            if (checkRunClick) return;
                            checkRunClick = true;
                            await clickPoint(tab, 333, 26, 500)
                            await clickPoint(tab, 315, 625, 500)
                            await clickPoint(tab, 355, 70, 500)
                            await sleep(500);
                            await clickPoint(tab, 333, 26, 500)
                            await sleep(500);
                            await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x, y }] });
                            await sleep(50);
                            await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });

                            await sleep(500);

                            const positions = [
                                { x: 190, y: 270 },
                                // { x: 325, y: 270 },
                                { x: 250, y: 500 },
                            ]
                            for (const { x, y } of positions) {
                                await clickPoint(tab, x, y, 500)
                            }
                            await sleep(1000);
                            checkRunClick = false;
                        }
                    }
                }
            } catch (error) {
            }
        }, 500);


        await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div > div._affix_oe51y_42._borderTop_oe51y_48 > div._action-buttons_j3bvq_1 > button.okui-btn.btn-lg.btn-fill-highlight.mobile._action-button_j3bvq_1" });
        await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div > div > div._affix_oe51y_42._borderTop_oe51y_48 > div > button.okui-btn.btn-lg.btn-fill-highlight.mobile._action-button_j3bvq_1" });

        await sleep(6000);
        // xu ly xoa popup
        if (targetTabPopup) {
            const tabPopup = await CDP({ target: targetTabPopup?.webSocketDebuggerUrl, port });
            await tabPopup.Target.closeTarget({ targetId: targetTabPopup?.id });
        }
        // await tab.Runtime.evaluate({
        //     expression: `(() => {
        //     console.log("runMouseSync");
        //     })()` });

        // await monitorFPSAndCapture({ client: tab, captureImg: true, sleep: 3000 });

        let xxxx = true;
        while (xxxx) {
            await sleep(4000);
            await tab.Runtime.evaluate({ expression: `console.log(1)` });
        }
        // await waitForInput();
        await client.close();
        await chrome.kill();
    } catch (error) {
        console.log(error);
        console.error("Error:", error.message);
        // await waitForInput();
    }
}









let scale = 0.5;
// scale = 1;
let linkRef = "https://bngo.gg/"
// let linkRef = "https://petpop.fun/game"

let walletAccount = `Account 03`;


(async () => {
    await processTasks2(MainBrowser, {
        totalElements: 2301,
        stop: 2000,
        numTasksPerRun: 15,
        columns: 8,
        delayDuration: 1000,
        xStep: 480,
        yStep: 700,
        callback: async () => {
            resetAll();
        },
    })
})();


