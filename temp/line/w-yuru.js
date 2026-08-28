// import fs from 'fs-extra';
// import path from 'path';
// import axios from 'axios';
// import CDP from 'chrome-remote-interface';

// import { runChrome } from './core/runChrome.mjs';

// import { processTasks, processTasks2 } from './utils/constant.js';
// import { waitForInput, sleep, writeTimeToFile } from './utils/utils.js';
// import { resetAll } from './utils/mouseSync.js';

// import { MouseSyncController, get_start_click, set_start_click, get_click_fish } from './utils/mouseSync.js';
// // import { findMatchingRegions, monitorFPSAndCapture } from './utils/opencvNodejs.js';

// // Hàm click chuột tại một điểm
// async function clickPoint(tab, x, y, delay = 50) {
//     try {

//         await sleep(delay);
//         await tab.Input.dispatchMouseEvent({ type: 'mouseMoved', x, y });
//         await tab.Input.dispatchMouseEvent({ type: 'mousePressed', x, y, button: 'left' });
//         await tab.Input.dispatchMouseEvent({ type: 'mouseReleased', x, y, button: 'left' });

//     } catch (error) {

//     }
// }

// const MainBrowser = async ({ userProfileIndex, proxy, positionX, positionY, index }) => {
//     try {
//         let { chrome, cursor, cursorSession, client, cursorActionClient, sessionIframe, cursorActionIframe, iframes, workers, mouseControler } = await runChrome({
//             userProfileIndex,
//             proxy,
//             proxy: null,
//             args: [
//                 `--window-position=${positionX},${positionY}`,
//                 '--window-size=400,780',
//                 `--force-device-scale-factor=${scale}`,
//             ],
//             url: "chrome-extension://mcohilncbfahbmgdjkbpemcciiolgcge/popup.html#/initialize",
//             url: "https://play.tou.yurudora.com",
//             accessIframe: false,

//             clearCookies: true,
//             clearCache: true,
//             clearDataForOrigin: linkRef,

//             // okx: true,
//             test: true
//         });




//         // let mouseControler2 = new MouseSyncController({ client, userProfileIndex, index });
//         // await mouseControler2.init(client);



//         await waitForInput();
//         await client.close();
//         await chrome.kill();
//     } catch (error) {
//         console.log(error);
//         console.error("Error:", error.message);
//         await waitForInput();
//     }
// }









// let scale = 0.5;
// // scale = 1;
// let linkRef = "https://play.tou.yurudora.com/"

// // let removeTab = 1;

// let walletAccount = `Account 01`;

// (async () => {
//     await processTasks(MainBrowser, {
//         totalElements: 2192,
//         stop: 2000,
//         numTasksPerRun: 15,
//         exclude: [],
//         columns: 8,
//         delayDuration: 1000,
//         xStep: 480,
//         yStep: 700,
//         callback: async () => {
//             resetAll();
//         },
//     })
// })();















import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import CDP from 'chrome-remote-interface';

import { runChrome } from './core/runChrome.mjs';

import { processTasks, processTasks2 } from './utils/constant.js';
import { waitForInput, sleep, writeTimeToFile } from './utils/utils.js';
import { resetAll } from './utils/mouseSync.js';

import { MouseSyncController, get_start_click, set_start_click, get_click_fish, get_start_click2 } from './utils/mouseSync.js';
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
            clearDataForOrigin: linkRef,

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

        const validUrls = [
            'https://www.okx.com/web3/extension/welcome',
            'https://web3.okx.com/extension/welcome',
            'https://web3.okx.com/'
        ];
        for (const tab of tabs) {
            if (tab.url.includes('google.com')) {
                // const tabRemove = await CDP({ target: tab.webSocketDebuggerUrl, port });
                // await tabRemove.Target.closeTarget({ targetId: tab.id });
                targetTab = tab;
            }
            // if (validUrls.includes(tab.url)) {
            //     targetTab = tab;
            // }
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

        await sleep(index * 1000);

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

        let endRunLogin = false;
        let exclude = [];
        setInterval(async () => {
            try {
                const { matchedPoints } = await findMatchingRegions({
                    client: tab,
                    templateImages: [
                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\yuru\\connect.jpeg',
                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\yuru\\okx_new.jpeg',
                    ].filter(item => !exclude.includes(item)),
                    matchThreshold: 0.8,
                    scale,
                });

                if (matchedPoints.length > 0) {
                    for (const { x, y, mathImagePath } of matchedPoints) {
                        if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\yuru\\connect.jpeg') {
                            await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x: x - 70, y: y - 20 }] });
                            await sleep(50);
                            await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                        }
                        else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\yuru\\okx_new.jpeg') {
                            exclude.push(mathImagePath);
                            exclude.push('C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\yuru\\connect.jpeg');
                            await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x: x - 70, y: y - 10 }] });
                            await sleep(50);
                            await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                            endRunLogin = true;
                        }
                        else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\yuru\\claim.jpeg') {
                            if (get_start_click2()) {
                                await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x: 330, y: 450 }] });
                                await sleep(50);
                                await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                            }
                        }
                        else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\yuru\\new.jpeg') {
                            if (get_start_click2()) {
                                await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x: x + (~~(Math.random() * 11) + 10), y: y - 10 }] });
                                await sleep(50);
                                await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                            }
                        }
                    }
                }
            } catch (error) {
            }
        }, 2000);

        let isRunningStart = false;
        async function runTask() {
            if (!endRunLogin) setTimeout(runTask, 500);
            if (isRunningStart) return;
            isRunningStart = true;

            try {
                const positions = [
                    { x: 275, y: 485 },
                    { x: 325, y: 485 },
                ]
                for (const { x, y } of positions) {
                    await clickPoint(tab, x, y, 200)
                }
            } catch (err) {
                console.log(err);
            } finally {
                isRunningStart = false;
            }
        }

        runTask();



        await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div > div._affix_oe51y_42._borderTop_oe51y_48 > div._action-buttons_j3bvq_1 > button.okui-btn.btn-lg.btn-fill-highlight.mobile._action-button_j3bvq_1" });
        await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div > div > div._affix_oe51y_42._borderTop_oe51y_48 > div > button.okui-btn.btn-lg.btn-fill-highlight.mobile._action-button_j3bvq_1" });

        await sleep(10000);
        // xu ly xoa popup
        if (targetTabPopup) {
            const tabPopup = await CDP({ target: targetTabPopup?.webSocketDebuggerUrl, port });
            await tabPopup.Target.closeTarget({ targetId: targetTabPopup?.id });
        }


        // xu ly click match
        let isRunninginGame = false;
        setInterval(async () => {
            if (isRunninginGame) return;
            isRunninginGame = true;
            try {
                const points = [
                    { x: 230, y: 250 + (~~(Math.random() * 11) + 30) },
                    // { x: 230 + (~~(Math.random() * 11) + 20), y: 250 },

                    { x: 320, y: 18 },
                    { x: 330, y: 18 },
                ];

                if (get_start_click2() && !isClick) {
                    for (const { x, y } of points) {
                        await clickPoint(tab, x, y, 500);
                    }
                    await tab.Runtime.evaluate({
                        expression: `
                        (() => {
                                document.querySelector("body > div.OpenAd_Protocol_Interactive_Ad > div.InteractiveAdContent > div.photo > img").click()
                        })()
                    `});
                }

                const points2 = [
                    { x: 250, y: 595 },
                    { x: 350, y: 595 },
                ];

                if (get_start_click() && !isClick) {
                    for (const { x, y } of points2) {
                        await clickPoint(tab, x, y, 500);
                    }
                }
                isRunninginGame = false;
            } catch (error) {
                isRunninginGame = false;
            }
        }, 4000);




        // setInterval(async () => {
        //     try {
        //         if (get_start_click2()) {
        //             console.log(get_start_click2(), "click2")

        //             const response = await axios.get(`http://localhost:${chrome.port}/json`);
        //             const tabs = response.data;

        //             let targetTab = null;

        //             for (const tab of tabs) {
        //                 if (tab.url.includes('safeframe.googlesyndication.com')) {
        //                     targetTab = tab;
        //                 }
        //             }

        //             const tab = await CDP({ target: targetTab.webSocketDebuggerUrl, port: chrome.port });
        //             const { Page, Network, Target, Runtime } = tab;
        //             await Promise.all([Page.enable(), Network.enable(), Runtime.enable()]);

        //             // const { result } = await tab.Runtime.evaluate({
        //             //     expression: `
        //             //         (() => {
        //             //             let rect = document.getElementById('reward_close_button_widget')?.getBoundingClientRect();
        //             //             let el = document.getElementById('reward_close_button_widget');
        //             //             let child = el.querySelector('#count_down[style="visibility: hidden;"]');
        //             //             if(child){
        //             //                 if (rect && rect.width > 0) return JSON.parse(JSON.stringify(rect));
        //             //             }
        //             //         })()
        //             //     `,
        //             //     returnByValue: true,
        //             // });
        //             // console.log(result.value)

        //             // const caculator = (rect) => {
        //             //     let x = rect.x + (rect.width / 2) + Math.random() * 4;
        //             //     let y = rect.y + (rect.height / 2) + Math.random() * 2;
        //             //     return { x, y, rect }
        //             // }

        //             // let { x, y } = caculator(result.value);

        //             // await tab.Input.dispatchMouseEvent({ type: 'mouseMoved', x, y });
        //             // await tab.Input.dispatchMouseEvent({ type: 'mousePressed', x, y, button: 'left' });
        //             // await tab.Input.dispatchMouseEvent({ type: 'mouseReleased', x, y, button: 'left' });

        //             await tab.Runtime.evaluate({
        //                 expression: `(()=>{
        //                         let el = document.getElementById('reward_close_button_widget');
        //                         console.log(el)
        //                         let child = el.querySelector('#count_down[style="visibility: hidden;"]');
        //                         if(child){
        //                             el.click();
        //                         }

        //                         let el2 = document.getElementById('dismiss-button');
        //                         let child2 = el2.querySelector('#count-down-container[style="display: none;"]');
        //                         if(child){
        //                             el2.click();
        //                         }

        //                         // let el2 = document.querySelector("#google-rewarded-video > button > img")
        //                         // let qrVideo = el2.src == "https://googleads.g.doubleclick.net/pagead/images/gmob/close-circle-30x30.png"
        //                         // if(qrVideo){
        //                         //     el2.click();
        //                         // }
        //                     })()`
        //             });
        //         }
        //     } catch (error) {
        //         console.log("error");
        //     }
        // }, 2000);


        await waitForInput();
        await client.close();
        await chrome.kill();
    } catch (error) {
        console.log(error);
        console.error("Error:", error.message);
        await waitForInput();
    }
}









let scale = 0.5;
// scale = 1;
let linkRef = "https://play.tou.yurudora.com"

let removeTab = 1;

let walletAccount = `Account 01`;

(async () => {
    await processTasks(MainBrowser, {
        totalElements: 2180,
        stop: 2020,
        numTasksPerRun: 20,
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


