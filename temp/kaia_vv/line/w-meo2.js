import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import CDP from 'chrome-remote-interface';

import { runChrome } from '../../core/runChrome.mjs';

import { processTasks, processTasks2 } from '../../utils/constant.js';
import { waitForInput, sleep, writeTimeToFile } from '../../utils/utils.js';
import { resetAll } from '../../utils/mouseSync.js';

import { MouseSyncController, get_start_click, set_start_click, get_click_fish } from '../../utils/mouseSync.js';
import { findMatchingRegions, monitorFPSAndCapture } from '../../utils/opencvNodejs.js';

// Hàm click chuột tại một điểm
async function clickPoint(tab, x, y, delay = 50) {
    await sleep(delay);
    await tab.Input.dispatchMouseEvent({ type: 'mouseMoved', x, y });
    await tab.Input.dispatchMouseEvent({ type: 'mousePressed', x, y, button: 'left' });
    await tab.Input.dispatchMouseEvent({ type: 'mouseReleased', x, y, button: 'left' });
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

            // clearCookies: true,
            // clearCache: true,
            clearDataForOrigin: "https://kyuzosfriends.com/",

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


        if (removeTab == 1) {
            await Target.setDiscoverTargets({ discover: true });
            Target.targetCreated(async ({ targetInfo }) => {
                const { type, targetId } = targetInfo;

                if (type === 'page') {
                    console.log('New tab detected:', targetId);
                    await tab.Target.closeTarget({ targetId });
                }
            });
        }

        await Page.navigate({ url: linkRef });
        let mouseControler2 = new MouseSyncController({ client: tab, userProfileIndex, index });
        await mouseControler2.init(tab);
        await tab.Page.bringToFront();


        let isClick = false;
        tab.on('Runtime.consoleAPICalled', async ({ args }) => {
            const message = args[0]?.value;
            if (!message) return;
            if (message === 'start_fish') {
                isClick = true;
            } else if (message === 'stop_fish') {
                isClick = false;
            }
        });


        let optionsClick = null;
        let countReloadPage = 0;
        let exclude = [];
        let matchImgFunc = setInterval(async () => {
            try {
                const { matchedPoints } = await findMatchingRegions({
                    client: tab,
                    templateImages: [
                        // 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\connect_failed.jpeg',
                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\connect_okx.jpeg',
                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\enter_the_game.jpeg',
                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\connect.jpeg',
                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\okx_new.jpeg',

                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\game_click.jpeg',
                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\land.jpeg',
                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\dice.jpeg',

                        // 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\lottery.jpeg',
                    ].filter(item => !exclude.includes(item)),
                    matchThreshold: 0.8,
                    scale,
                });

                if (matchedPoints.length > 0) {
                    for (const { x, y, mathImagePath } of matchedPoints) {
                        if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\land.jpeg') {
                            optionsClick = 1;
                        } else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\game_click.jpeg') {
                            optionsClick = 2;
                        } else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\dice.jpeg') {
                            optionsClick = 10;
                        } else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\lottery.jpeg') {
                            optionsClick = 3;
                        } else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\connect.jpeg') {
                            if (countReloadPage >= 9) {
                                await tab.Page.reload();
                                await sleep(2000);
                                countReloadPage = 0;
                            } else {
                                countReloadPage++;
                            }
                            // await sleep(1000);
                            // exclude.push(mathImagePath);
                            await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x: x - 80, y: y - 20 }] });
                            await sleep(50);
                            await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                        } else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\connect_okx.jpeg') {
                            // await sleep(1000);
                            // exclude.push(mathImagePath);
                            await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x: x - 80, y: y - 10 }] });
                            await sleep(50);
                            await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                        } else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\okx_new.jpeg') {
                            // await sleep(1000);
                            // exclude.push(mathImagePath);
                            await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x: x - 80, y: y - 10 }] });
                            await sleep(50);
                            await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });

                            await sleep(1000);
                            await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x: x - 80, y: y - 10 }] });
                            await sleep(50);
                            await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                        } else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\enter_the_game.jpeg') {
                            await sleep(1000);
                            exclude.push(mathImagePath);
                            exclude.push('C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\connect.jpeg');
                            exclude.push('C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\connect_okx.jpeg');
                            exclude.push('C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\okx_new.jpeg');
                            await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x: x - 80, y }] });
                            await sleep(50);
                            await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                        }
                    }
                }
            } catch (error) {
            }
        }, 2000);








        await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div > div._affix_oe51y_42._borderTop_oe51y_48 > div._action-buttons_j3bvq_1 > button.okui-btn.btn-lg.btn-fill-highlight.mobile._action-button_j3bvq_1" });
        await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div > div > div._affix_oe51y_42._borderTop_oe51y_48 > div > button.okui-btn.btn-lg.btn-fill-highlight.mobile._action-button_j3bvq_1" });

        await sleep(6000);
        // xu ly xoa popup
        if (targetTabPopup) {
            const tabPopup = await CDP({ target: targetTabPopup?.webSocketDebuggerUrl, port });
            await tabPopup.Target.closeTarget({ targetId: targetTabPopup?.id });
        }


        if (runTaskDailyTest == 1) {
            let ttt1 = false;
            while (!ttt1) {
                await sleep(1000);
                const { matchedPoints } = await findMatchingRegions({
                    client: tab,
                    templateImages: [
                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\cat.jpeg',
                    ],
                    matchThreshold: 0.8,
                    scale,
                });

                for (const { x, y, mathImagePath } of matchedPoints) {
                    if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\cat.jpeg') {
                        await clickPoint(tab, 10, 58);
                        await sleep(2000);
                        await clickPoint(tab, 50, 170);
                        await sleep(800);
                        // diem danh daily
                        await clickPoint(tab, 250, 400);
                        await sleep(1000);

                        const { matchedPoints: matchedPointsObtain } = await findMatchingRegions({
                            client: tab,
                            templateImages: ['C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\obtain.jpeg'],
                            matchThreshold: 0.8,
                            scale,
                        });
                        for (const { x, y, mathImagePath } of matchedPointsObtain) {
                            if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\obtain.jpeg') {
                                ttt1 = true;
                                for (let i = 0; i < 5; i++) {
                                    await clickPoint(tab, 10, 58);
                                }

                                // nhan 3 suc xac
                                await sleep(500);
                                await clickPoint(tab, 455, 200);
                                await sleep(500);
                                for (let i = 0; i < 5; i++) {
                                    await clickPoint(tab, 355, 275, 200);
                                }
                            }
                        }
                    }
                }
            }
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
let linkRef = "https://kyuzosfriends.com/game"



let removeTab = 2;


let runTaskDailyTest = 1;
let walletAccount = `Account 10`;


(async () => {
    await processTasks2(MainBrowser, {
        totalElements: 2444,
        stop: 2000,
        numTasksPerRun: 18,
        exclude: [],
        columns: 8,
        delayDuration: 500,
        xStep: 480,
        yStep: 700,
        callback: async () => {
            resetAll();
        },
    })
})();

