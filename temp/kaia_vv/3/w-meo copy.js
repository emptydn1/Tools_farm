import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import CDP from 'chrome-remote-interface';

import { runChrome } from './core/runChrome.mjs';

import { processTasks } from './utils/constant.js';
import { waitForInput, sleep, writeTimeToFile } from './utils/utils.js';
import { resetAll } from './utils/mouseSync.js';

import { MouseSyncController, get_start_click, set_start_click, get_click_fish } from './utils/mouseSync.js';
import { findMatchingRegions, monitorFPSAndCapture } from './utils/opencvNodejs.js';

const MainBrowser = async (userProfileIndex, proxy, positionX, positionY) => {
    try {
        let { chrome, cursor, cursorSession, client, cursorActionClient, sessionIframe, cursorActionIframe, iframes, workers, mouseControler } = await runChrome({
            userProfileIndex,
            proxy,
            // proxy: null,
            args: [
                `--window-position=${positionX},${positionY}`,
                // '--window-size=2000,980',
                '--window-size=400,780',
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
            okx: true,
        });
        const jsInjection = fs.readFileSync('C:\\Users\\huy\\Desktop\\Tools_Farm\\utils\\injection\\JS_injection.js', 'utf8');
        const emulatorTouch = fs.readFileSync('C:\\Users\\huy\\Desktop\\Tools_Farm\\utils\\injection\\emulator_touch.js', 'utf8');
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
        await client.Input.insertText({ text: `Account 02` });
        await sleep(2000);
        await cursorActionClient.moveToSelector({ selector: `#app > div > div > div > div._root_1p8xt_1 > div._walletList_1p8xt_6 > div > div > div > div:nth-child(2)` });



        const tab = await CDP({ target: targetTab.webSocketDebuggerUrl, port });
        const { Page, Network, Runtime } = tab;
        await Promise.all([Page.enable(), Network.enable(), Runtime.enable()]);

        await Page.navigate({ url: "https://liff.line.me/2006735172-BQPlyKOZ?loginUUID=11549569&fromUUID=756912553985" });

        let mouseControler2 = new MouseSyncController({ client: tab, userProfileIndex });
        await mouseControler2.init(tab);


        // await tab.Runtime.evaluate({ expression: jsInjection });
        // await tab.Runtime.evaluate({ expression: emulatorTouch });
        // const script = `
        //     document.addEventListener('keydown', (e) => {
        //         if (e.key === ']') console.log("runMouseSync");
        //         else if (e.key === '[') console.log("stopMouseSync");
        //         else if (e.key === 'n') console.log("reConnect");
        //         else if (e.key === 'i') console.log("start_click");
        //         else if (e.key === 'o') console.log("stop_click");

        //         else if (e.key === 'y') console.log("start_click2");
        //         else if (e.key === 'u') console.log("stop_click2");

        //         else if (e.key === 'f') console.log("start_fish");
        //         else if (e.key === 'g') console.log("stop_fish");
        //     });
        // `;
        // await tab.Runtime.evaluate({ expression: script });

        let isClick = false;
        let isClicklottery = false;

        tab.on('Runtime.consoleAPICalled', async ({ args }) => {
            const message = args[0]?.value;
            if (!message) return;

            if (message === 'start_click') {
                isClick = true;
            } else if (message === 'stop_click') {
                isClick = false;
            } else if (message === 'start_fish') {
                isClicklottery = true;
            } else if (message === 'stop_fish') {
                isClicklottery = false;
            }
        });







        // async function performTouchSequence(points) {
        //     for (const { x, y } of points) {
        //         await sleep(100);
        //         await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x, y }] });
        //         await sleep(50);
        //         await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
        //     }
        // }


        let clickTemp = setInterval(async () => {
            try {
                const points = [
                    { x: 162, y: 248 },
                    { x: 327, y: 250 },
                    { x: 240, y: 315 },
                    { x: 161, y: 380 },
                    { x: 328, y: 370 },

                    { x: 10, y: 58 },  // back

                    { x: 340, y: 278 },  // click steal
                    { x: 340, y: 309 },  // click steal
                    { x: 340, y: 340 },  // click steal


                    // { x: 235, y: 243 },
                ];

                if (isClick) {
                    const { result: iframeResult } = await tab?.Runtime?.evaluate({
                        expression: `(() => {
                            return { width: window.innerWidth, height: window.innerHeight };
                        })()`,
                        returnByValue: true,
                    });

                    const { height, width } = iframeResult?.value;
                    let x = width / 2;
                    let y = height - 85;

                    await tab.Input.dispatchMouseEvent({ type: 'mouseMoved', x, y });

                    await tab.Input.dispatchMouseEvent({ type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
                    await sleep(50);
                    await tab.Input.dispatchMouseEvent({ type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });

                    for (const { x, y } of points) {
                        await sleep(50);
                        await tab.Input.dispatchMouseEvent({ type: 'mouseMoved', x, y });
                        await tab.Input.dispatchMouseEvent({ type: 'mousePressed', x, y, button: 'left' });
                        await tab.Input.dispatchMouseEvent({ type: 'mouseReleased', x, y, button: 'left' });
                    }
                }
            } catch (error) {
                // console.log("exxx2--", error)
            }
        }, 2000);




        // xu ly click match
        let isRunning2 = false;
        let exclude = [];
        let matchImgFunc = setInterval(async () => {
            if (isRunning2) return;
            isRunning2 = true;

            try {
                const { matchedPoints } = await findMatchingRegions({
                    client: tab,
                    templateImages: [
                        // 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\connect_failed.jpeg',
                        // 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\connect_okx.jpeg',
                        // 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\connect.jpeg',
                        // 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\enter_the_game.jpeg',
                        // 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\fish.jpeg',
                        // 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\money.jpeg',
                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\game_click.jpeg',
                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\tho.jpeg',
                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\tho2.jpeg',
                        // 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\lottery.jpeg',
                    ].filter(item => !exclude.includes(item)),
                    matchThreshold: 0.8,
                    scale: 0.5,
                    // drawType: 'rectangle',
                });



                if (matchedPoints.length > 0) {
                    isClick = false;
                    for (const { x, y, mathImagePath } of matchedPoints) {
                        // if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\fish.jpeg') {
                        //     const points = [
                        //         { x: 163, y: 242 },
                        //         { x: 320, y: 236 },
                        //         { x: 240, y: 315 },
                        //         { x: 161, y: 380 },
                        //         { x: 328, y: 370 },
                        //     ];

                        //     await performTouchSequence(points);
                        //     await performTouchSequence(points);
                        //     isClick = true;
                        // } else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\money.jpeg') {
                        //     const points = [
                        //         { x: 168, y: 286 },
                        //         { x: 261, y: 295 },
                        //         { x: 360, y: 300 },
                        //         { x: 318, y: 403 },
                        //         { x: 186, y: 408 },
                        //     ];

                        //     await performTouchSequence(points);
                        //     await performTouchSequence(points);
                        //     isClick = true;
                        // } 
                        if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\tho.jpeg') {
                            await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x, y }] });
                            await sleep(50);
                            await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                            isClick = true;
                        } else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\tho2.jpeg') {
                            await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x, y }] });
                            await sleep(50);
                            await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                            isClick = true;
                        } else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\game_click.jpeg') {
                            const points = [
                                { x: 160, y: 495 },
                                { x: 250, y: 495 },
                                { x: 340, y: 495 },
                            ];

                            let i = 0;
                            while (i < 30) {
                                for (const { x, y } of points) {
                                    await sleep(50);
                                    await tab.Input.dispatchMouseEvent({ type: 'mouseMoved', x, y });
                                    await tab.Input.dispatchMouseEvent({ type: 'mousePressed', x, y, button: 'left' });
                                    await tab.Input.dispatchMouseEvent({ type: 'mouseReleased', x, y, button: 'left' });
                                }
                                i++;
                            }
                            isClick = true;
                        }
                        //  else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\connect_failed.jpeg') {
                        //     exclude.push(mathImagePath);
                        //     const points = [
                        //         { x: 424, y: 213 },
                        //         // { x: 250, y: 570 },
                        //     ];

                        //     for (const { x, y } of points) {
                        //         await sleep(500);
                        //         await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x, y }] });
                        //         await sleep(50);
                        //         await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                        //     }
                        // } else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\connect.jpeg') {
                        //     exclude.push(mathImagePath);
                        //     await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x, y: y - 20 }] });
                        //     await sleep(50);
                        //     await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                        // } else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\enter_the_game.jpeg') {
                        //     exclude.push(mathImagePath);
                        //     await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x, y }] });
                        //     await sleep(50);
                        //     await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                        //     isClick = true;
                        // } else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\connect_okx.jpeg') {
                        //     exclude.push(mathImagePath);
                        //     await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x, y: y + 60 }] });
                        //     await sleep(50);
                        //     await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                        // } else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\lottery.jpeg') {
                        //     while (!isClicklottery) {
                        //         await sleep(5000);
                        //     }
                        //     await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x: 10, y: 58 }] });
                        //     await sleep(50);
                        //     await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                        //     isClick = true;
                        // }
                    }
                }
                isRunning2 = false;
            } catch (error) {
                isRunning2 = false;
                // console.log("exxx3333333333--", error);
            }
        }, 600);


        await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div > div._affix_oe51y_42._borderTop_oe51y_48 > div._action-buttons_j3bvq_1 > button.okui-btn.btn-lg.btn-fill-highlight.mobile._action-button_j3bvq_1" });
        await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div > div > div._affix_oe51y_42._borderTop_oe51y_48 > div > button.okui-btn.btn-lg.btn-fill-highlight.mobile._action-button_j3bvq_1" });

        await sleep(3000);
        // xu ly xoa popup
        if (targetTabPopup) {
            const tabPopup = await CDP({ target: targetTabPopup?.webSocketDebuggerUrl, port });
            await tabPopup.Target.closeTarget({ targetId: targetTabPopup?.id });
        }
        // await monitorFPSAndCapture({ client: tab, captureImg: true, sleep: 3000 });


        await waitForInput();
        clearInterval(clickTemp);
        await client.close();
        await chrome.kill();
    } catch (error) {
        clearInterval(clickTemp);
        console.log(error);
        console.error("Error:", error.message);
        await waitForInput();
    }
}

// 2050
// ref tu acc 90
(async () => {
    await processTasks(MainBrowser, {
        // stop: 3,
        totalElements: 2444,
        // stop: 2027,
        stop: 2000,
        numTasksPerRun: 13,
        exclude: [],
        columns: 8,
        delayDuration: 1000,
        xStep: 480,
        yStep: 700,
        callback: async () => {
            resetAll();
        },
    })
})();




