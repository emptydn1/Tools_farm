import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import CDP from 'chrome-remote-interface';

import { runChrome } from './core/runChrome.mjs';

import { processTasks } from './utils/constant.js';
import { waitForInput, sleep, writeTimeToFile } from './utils/utils.js';
import { resetAll } from './utils/mouseSync.js';

import { MouseSyncController, get_start_click, get_click_fish } from './utils/mouseSync.js';
import { monitorFPSAndCapture, findMatchingRegions } from './utils/opencvNodejs.js';

import { createCursor } from './core/custom-module/ghost-cursor/spoof.cjs';
import { CursorActions } from './utils/ghost-cursor.js';

const MainBrowser = async ({ userProfileIndex, proxy, positionX, positionY }) => {
    try {
        let { chrome, cursor, cursorSession, client, cursorActionClient, sessionIframe, cursorActionIframe, iframes, workers, mouseControler } = await runChrome({
            userProfileIndex,
            proxy,
            args: [
                `--window-position=${positionX},${positionY}`,
                // '--window-size=2000,980',
                '--window-size=400,780',
                // '--force-device-scale-factor=0.4',
                '--force-device-scale-factor=0.5',
                // '--force-device-scale-factor=0.9',
                // '--auto-open-devtools-for-tabs',
                // '--disable-popup-blocking',
                // '--disable-component-extensions-with-background-pages',
            ],
            url: "chrome-extension://mcohilncbfahbmgdjkbpemcciiolgcge/popup.html#/initialize",
            // url: "https://example.com",
            accessIframe: false,
            closeTabs: false,

            clearCookies: true,
            clearCache: true,
            clearDataForOrigin: "https://line-mini.lastmemories.io/",

            okx: true,
        });
        const jsInjection = fs.readFileSync('./utils/injection/JS_injection.js', 'utf8');
        const emulatorTouch = fs.readFileSync('./utils/injection/emulator_touch.js', 'utf8');
        await client.Runtime.evaluate({ expression: jsInjection });
        await client.Runtime.evaluate({ expression: emulatorTouch });


        await sleep(3000);
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
            if (tab.url.includes('chrome-extension://mcohilncbfahbmgdjkbpemcciiolgcge/popup.html#/unlock')) targetTabPopup = tab;
        }

        let checkExist = false;
        while (!checkExist) {
            await cursorActionClient.moveToSelector({ selector: "#app > div > div.main-container-wrapper > div > div._content_1ttdc_26 > form > div.okui-form-item-md.okui-form-item.okui-form-item-no-label._password_11p2x_1 > div > div > div > div > div > input" });
            await cursorActionClient.moveToSelector({ selector: "#app > div > div.main-container-wrapper > div > div._content_1ttdc_26 > form > div.okui-form-item-md.okui-form-item.okui-form-item-no-label._password_11p2x_1 > div > div > div > div > div > input" });
            await client.Input.insertText({ text: "Hoang123@" });
            await cursorActionClient.moveToSelector({ selector: "#app > div > div._affix_oe51y_42._footer_11p2x_17 > button" });

            const { result } = await client.Runtime.evaluate({ expression: `document.querySelector("#app > div > div.main-container-wrapper > div > div._content_1ttdc_26 > form > div.okui-form-item-md.okui-form-item.okui-form-item-no-label._password_11p2x_1 > div > div > div > div > div > input")?.value !== ''` });
            if (result?.value) checkExist = true;
        }
        // vi con
        await sleep(1000);
        await cursorActionClient.moveToSelector({ selector: "#home-page-root-element-id > div > div > div > img" });
        await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div._root_1p8xt_1 > div._root_1k0l3_1 > div > div > input.okui-input-input" });
        await client.Input.insertText({ text: `Account 08` });
        await sleep(2000);
        await cursorActionClient.moveToSelector({ selector: `#app > div > div > div > div._root_1p8xt_1 > div._walletList_1p8xt_6 > div > div > div > div:nth-child(2)` });


        const tab = await CDP({ target: targetTab.webSocketDebuggerUrl, port });
        const { Page, Network, Runtime } = tab;
        await Promise.all([Page.enable(), Network.enable(), Runtime.enable()]);
        await Page.navigate({ url: "https://line-mini.lastmemories.io/" });

        // await tab.Runtime.evaluate({ expression: jsInjection });
        // await tab.Runtime.evaluate({ expression: emulatorTouch });
        // let mouseControler2 = new MouseSyncController({ client: tab, userProfileIndex });
        // await mouseControler2.init(tab);




        // xu ly click match
        let abc = 0;
        let isRunning2 = false;
        let matchImgFunc = setInterval(async () => {
            if (isRunning2) return;
            isRunning2 = true;


            try {
                const { matchedPoints } = await findMatchingRegions({
                    client: tab,
                    templateImages: [
                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\1.jpeg',
                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\score.jpeg',
                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\fight.jpeg',
                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\easy.jpeg'
                    ],
                    matchThreshold: 0.8,
                    scale: 0.5,
                    // drawType: 'rectangle',
                });

                if (matchedPoints.length > 0) {
                    for (const { x, y, mathImagePath } of matchedPoints) {
                        if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\easy.jpeg') {
                            await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x: 230, y: 100 }] });
                            await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                            await sleep(500);
                            await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x: 120, y: 440 }] });
                            await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                            await sleep(200);
                            await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x: 230, y: 470 }] });
                            await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                        } else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\1.jpeg') {
                            await sleep(700);
                            await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x, y }] });
                            await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                            await sleep(500);
                            await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x: 250, y: 310 }] });
                            await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                            await sleep(500);
                            await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x: 230, y: 470 }] });
                            await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                            abc = 0;
                        } else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\score.jpeg') {
                            await sleep(700);
                            await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x, y }] });
                            await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                            await sleep(500);
                            await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x: 250, y: 310 }] });
                            await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                            await sleep(500);
                            await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x: 230, y: 470 }] });
                            await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                        } else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\fight.jpeg' && abc < 3) {
                            await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x: 160, y: 530 }] });
                            await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                            await sleep(100);
                            await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x: 160, y: 530 }] });
                            await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                            await sleep(100);
                            await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x: 250, y: 600 }] });
                            await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                            await sleep(100);
                            await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x: 250, y: 600 }] });
                            await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                            await sleep(100);
                            abc++;
                        }
                    }
                }
            } catch (error) {
                console.log("exxx2--", error);
                clearInterval(matchImgFunc);
            }
            isRunning2 = false;
        }, 2000);









        const checkIframeExist = async (tab) => {
            let { result } = await tab.Runtime.evaluate({
                expression: `(()=>{
                    let a = document.querySelector("#iframeDiv");
                    return a ? true : false;
                })()`,
            });
            return result.value;
        }

        let valueCheck = await checkIframeExist(tab);

        while (!valueCheck) {
            await tab.Input.dispatchMouseEvent({ type: 'mouseMoved', x: 10, y: 20 });
            await tab.Input.dispatchMouseEvent({ type: 'mousePressed', x: 10, y: 20, button: 'left', clickCount: 1 });
            await sleep(50);
            await tab.Input.dispatchMouseEvent({ type: 'mouseReleased', x: 10, y: 20, button: 'left', clickCount: 1 });

            await sleep(1000)
            await tab.Input.dispatchMouseEvent({ type: 'mouseMoved', x: 250, y: 637 });
            await tab.Input.dispatchMouseEvent({ type: 'mousePressed', x: 250, y: 637, button: 'left', clickCount: 1 });
            await sleep(50);
            await tab.Input.dispatchMouseEvent({ type: 'mouseReleased', x: 250, y: 637, button: 'left', clickCount: 1 });

            valueCheck = await checkIframeExist(tab);

            if (valueCheck) {
                await sleep(2000);
                // tạo session thao tác với sub_frame
                let iframeWallet = await CDP({ target: iframes[iframes.length - 1].targetId, port: chrome.port });
                const { Runtime, Input, Network } = iframeWallet;
                await Promise.all([Page.enable(), Network.enable(), Runtime.enable()]);

                let checkExistOkx = false;
                let i = 0;
                while (!checkExistOkx) {
                    let { result } = await iframeWallet.Runtime.evaluate({
                        expression: `(()=>{
                            let a = document.querySelector("#root > div > div.sc-dprtRQ.jQrMuE > div.sc-bbQqnZ.lkQNVd > div");
                            return a ? true : false;
                        })()`,
                    });

                    checkExistOkx = result.value;

                    if (i > 10) break;
                    i++;
                    await sleep(1000);
                }

                let { result } = await tab.Runtime.evaluate({
                    expression: `(()=>{
                        return window.innerHeight;
                    })()`,
                });


                await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x: 230, y: result.value - 20 }] });
                await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });


                await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div > div._affix_oe51y_42._borderTop_oe51y_48 > div._action-buttons_j3bvq_1 > button.okui-btn.btn-lg.btn-fill-highlight.mobile._action-button_j3bvq_1" });
                await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div > div > div._affix_oe51y_42._borderTop_oe51y_48 > div > button.okui-btn.btn-lg.btn-fill-highlight.mobile._action-button_j3bvq_1" });


                await sleep(5000);
                // xu ly xoa popup
                if (targetTabPopup) {
                    const tabPopup = await CDP({ target: targetTabPopup?.webSocketDebuggerUrl, port });
                    await tabPopup.Target.closeTarget({ targetId: targetTabPopup?.id });
                }
            }
        }






        await waitForInput();
        await client.close();
        await chrome.kill();
    } catch (error) {
        console.log(error);
        console.error("Error:", error.message);
        await waitForInput();
    }
}

// ref tu acc 90
(async () => {
    await processTasks(MainBrowser, {
        totalElements: 2444,
        stop: 2000,
        numTasksPerRun: 15,
        columns: 7,
        // xStep: 400,
        // yStep: 690,
        delayDuration: 1000,
        callback: async () => {
            resetAll();
        },
    })
})();




