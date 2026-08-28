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

const MainBrowser = async ({ userProfileIndex, proxy, positionX, positionY, index }) => {
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
                // '--force-device-scale-factor=0.7',
                // '--auto-open-devtools-for-tabs',
                // '--disable-popup-blocking',
                // '--disable-component-extensions-with-background-pages',
            ],
            url: "chrome-extension://mcohilncbfahbmgdjkbpemcciiolgcge/popup.html#/initialize",
            // url: "https://example.com",
            accessIframe: false,
            // closeTabs: false,
            okx: true,
        });
        const jsInjection = fs.readFileSync('C:\\Users\\huy\\Desktop\\Tools_Farm\\utils\\injection\\JS_injection.js', 'utf8');
        const emulatorTouch = fs.readFileSync('C:\\Users\\huy\\Desktop\\Tools_Farm\\utils\\injection\\emulator_touch.js', 'utf8');
        await client.Runtime.evaluate({ expression: jsInjection });
        await client.Runtime.evaluate({ expression: emulatorTouch });

        await sleep(3000);

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

        await Target.setDiscoverTargets({ discover: true });
        Target.targetCreated(async ({ targetInfo }) => {
            const { type, targetId } = targetInfo;

            if (type === 'page') {
                console.log('New tab detected:', targetId);
                //await sleep(200);
                await tab.Target.closeTarget({ targetId });
            }
        });


        await Page.navigate({ url: "https://liff.line.me/2006735172-BQPlyKOZ?loginUUID=11549569&fromUUID=756912553985" });

        let mouseControler2 = new MouseSyncController({ client: tab, userProfileIndex, index });
        await mouseControler2.init(tab);

        await tab.Page.bringToFront();
        // let isClick = false;
        // let isClicklottery = false;

        // tab.on('Runtime.consoleAPICalled', async ({ args }) => {
        //     const message = args[0]?.value;
        //     if (!message) return;

        //     if (message === 'start_click') {
        //         isClick = true;
        //     } else if (message === 'stop_click') {
        //         isClick = false;
        //     } else if (message === 'start_fish') {
        //         isClicklottery = true;
        //     } else if (message === 'stop_fish') {
        //         isClicklottery = false;
        //     }
        // });

        set_start_click(true);

        const { result: iframeResult } = await tab?.Runtime?.evaluate({
            expression: `(() => {
                return { width: window.innerWidth, height: window.innerHeight };
            })()`,
            returnByValue: true,
        });

        const { height, width } = iframeResult?.value;
        let xx = width / 2;
        let yy = height - 85;



        let optionsClick = null;
        let isRunning = false;
        setInterval(async () => {
            if (isRunning) return;
            isRunning = true;
            try {
                // click tho
                if (optionsClick == 1) {
                    const points = [
                        { x: 140, y: 275 },
                        { x: 210, y: 255 },
                        { x: 305, y: 230 },

                        { x: 145, y: 350 },
                        { x: 207, y: 330 },
                        { x: 275, y: 290 },
                        { x: 365, y: 265 },

                        { x: 170, y: 405 },
                        { x: 245, y: 395 },
                        { x: 330, y: 345 },

                        { x: 240, y: 465 },
                        { x: 350, y: 420 },

                        { x: 325, y: 480 }
                    ];
                    for (const { x, y } of points) {
                        await sleep(50);
                        await tab.Input.dispatchMouseEvent({ type: 'mouseMoved', x, y });
                        await tab.Input.dispatchMouseEvent({ type: 'mousePressed', x, y, button: 'left' });
                        await tab.Input.dispatchMouseEvent({ type: 'mouseReleased', x, y, button: 'left' });
                    }
                } else if (optionsClick == 2) {
                    const points = [
                        { x: 150, y: 480 },
                        { x: 250, y: 480 },
                        { x: 350, y: 480 },
                    ];
                    for (const { x, y } of points) {
                        await sleep(50);
                        await tab.Input.dispatchMouseEvent({ type: 'mouseMoved', x, y });
                        await tab.Input.dispatchMouseEvent({ type: 'mousePressed', x, y, button: 'left' });
                        await tab.Input.dispatchMouseEvent({ type: 'mouseReleased', x, y, button: 'left' });
                    }
                } else if (optionsClick == 3) {
                    // await waitForInput("v");
                    optionsClick = 10;
                    const points = [
                        { x: 200, y: 485 },
                        { x: 200, y: 485 },
                        { x: 325, y: 315 },
                    ];

                    for (let i = 0; i < 1; i++) {
                        for (const { x, y } of points) {
                            await tab.Input.dispatchMouseEvent({ type: 'mouseMoved', x, y });
                            await tab.Input.dispatchMouseEvent({ type: 'mousePressed', x, y, button: 'left' });
                            await tab.Input.dispatchMouseEvent({ type: 'mouseReleased', x, y, button: 'left' });
                            await sleep(500);
                        }
                        await sleep(3000);
                    }

                    for (let i = 0; i < 5; i++) {
                        await tab.Input.dispatchMouseEvent({ type: 'mouseMoved', x: 10, y: 58 });
                        await tab.Input.dispatchMouseEvent({ type: 'mousePressed', x: 10, y: 58, button: 'left' });
                        await tab.Input.dispatchMouseEvent({ type: 'mouseReleased', x: 10, y: 58, button: 'left' });
                        await sleep(50);
                    }
                } else {
                    const points = [
                        { x: 162, y: 248 },
                        { x: 327, y: 250 },
                        { x: 240, y: 315 },
                        { x: 161, y: 380 },
                        { x: 328, y: 370 },


                        { x: 340, y: 278 },  // click steal
                        { x: 340, y: 309 },  // click steal
                        { x: 340, y: 340 },  // click steal

                        // { x: 10, y: 58 },  // back
                        { x: 150, y: 20 },  // back
                    ];

                    if (get_start_click()) {
                        for (const { x, y } of points) {
                            await sleep(50);
                            await tab.Input.dispatchMouseEvent({ type: 'mouseMoved', x, y });
                            await tab.Input.dispatchMouseEvent({ type: 'mousePressed', x, y, button: 'left' });
                            await tab.Input.dispatchMouseEvent({ type: 'mouseReleased', x, y, button: 'left' });
                        }

                        await sleep(50);
                        await tab.Input.dispatchMouseEvent({ type: 'mouseMoved', x: xx, y: yy });
                        await tab.Input.dispatchMouseEvent({ type: 'mousePressed', x: xx, y: yy, button: 'left' });
                        await tab.Input.dispatchMouseEvent({ type: 'mouseReleased', x: xx, y: yy, button: 'left' });
                    }
                }
                isRunning = false;
            } catch (error) {
                isRunning = false;
                // console.log("exxx2--", error)
            }
        }, 300);





        // xu ly click match
        // let isRunning2 = false;
        let exclude = [];
        let matchImgFunc = setInterval(async () => {
            // if (isRunning2) return;
            // isRunning2 = true;

            try {
                const { matchedPoints } = await findMatchingRegions({
                    client: tab,
                    templateImages: [
                        // 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\connect_failed.jpeg',
                        // 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\connect_okx.jpeg',
                        // 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\fish.jpeg',
                        // 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\money.jpeg',
                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\enter_the_game.jpeg',
                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\connect.jpeg',

                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\game_click.jpeg',
                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\land.jpeg',
                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\dice.jpeg',
                        // 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\tho.jpeg',
                        // 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\tho2.jpeg',
                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\lottery.jpeg',
                    ].filter(item => !exclude.includes(item)),
                    matchThreshold: 0.8,
                    scale: 0.5,
                    // drawType: 'rectangle',
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
                            await sleep(2000);
                            exclude.push(mathImagePath);
                            await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x, y: y - 20 }] });
                            await sleep(50);
                            await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                        } else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\meo\\enter_the_game.jpeg') {
                            await sleep(2000);
                            exclude.push(mathImagePath);
                            await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x, y }] });
                            await sleep(50);
                            await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                        }
                    }
                }
                //     isRunning2 = false;
            } catch (error) {
                //     isRunning2 = false;
            }
        }, 2000);


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
        await client.close();
        await chrome.kill();
    } catch (error) {
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
        numTasksPerRun: 24,
        exclude: [],
        columns: 8,
        // columns: 5,
        delayDuration: 1500,
        xStep: 480,
        yStep: 700,
        callback: async () => {
            resetAll();
        },
    })
})();




