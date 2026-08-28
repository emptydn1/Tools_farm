import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import CDP from 'chrome-remote-interface';

import { runChrome } from '../../core/runChrome.mjs';

import { processTasks, processTasks2 } from '../../utils/constant.js';
import { waitForInput, sleep, writeTimeToFile } from '../../utils/utils.js';

import { MouseSyncController, get_start_click, set_start_click, get_start_click2, resetAll } from '../../utils/mouseSync.js';
import { findMatchingRegions, monitorFPSAndCapture } from '../../utils/opencvNodejs.js';

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

        await Page.navigate({ url: "https://liff.line.me/2007235888-yMWJZZvK?startparam=lrp_1579746_1007" });
        let mouseControler2 = new MouseSyncController({ client: tab, userProfileIndex, index });
        await mouseControler2.init(tab);
        await tab.Page.bringToFront();

        let exclude = [];
        setInterval(async () => {
            try {
                const { matchedPoints } = await findMatchingRegions({
                    client: tab,
                    templateImages: [
                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\capy\\connect.jpeg',
                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\capy\\okx_new.jpeg',
                    ].filter(item => !exclude.includes(item)),
                    matchThreshold: 0.8,
                    scale,
                });

                if (matchedPoints.length > 0) {
                    for (const { x, y, mathImagePath } of matchedPoints) {
                        if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\capy\\connect.jpeg') {
                            await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x: x - 70, y: y - 20 }] });
                            await sleep(50);
                            await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                        } else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\capy\\okx_new.jpeg') {
                            exclude.push(mathImagePath);
                            exclude.push('C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\capy\\connect.jpeg');
                            await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x: x - 70, y: y - 10 }] });
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


        await tab.Runtime.evaluate({
            expression: `(()=>{
                let cnx = document.querySelector("#GameCanvas")


                // sung web, se xoa khi k can nua
                cnx.addEventListener('keydown', (e) => {
                    if (e.key === ']') console.log("runMouseSync");
                    else if (e.key === '[') console.log("stopMouseSync");
                    else if (e.key === 'i') console.log("start_click");
                    else if (e.key === 'o') console.log("stop_click");
                    
                    else if (e.key === 'u') console.log("stop_click2");
                    else if (e.key === 'p') console.log("start_click2");
                });
            })()`,
        });

        // xu ly click match
        let isRunning = false;
        setInterval(async () => {
            if (isRunning) return;
            isRunning = true;
            try {
                if (get_start_click()) {
                    if (get_start_click2()) {
                        await clickPoint(tab, 365, 620);
                    } else {
                        await clickPoint(tab, 280, 620);
                    }
                }
                isRunning = false;
            } catch (error) {
                isRunning = false;
            }
        }, 300);




        await waitForInput();
        await client.close();
        await chrome.kill();
    } catch (error) {
        console.log(error);
        console.error("Error:", error.message);
        await waitForInput();
    }
}









let scale = 0.7;
// scale = 1;
let linkRef = "https://cdn.capybomb.com/"

let removeTab = 1;

let walletAccount = `Account 01`;


(async () => {
    await processTasks(MainBrowser, {
        totalElements: 2192,
        stop: 2000,
        numTasksPerRun: 10,
        exclude: [],
        columns: 5,
        delayDuration: 1000,
        xStep: 480,
        yStep: 700,
        callback: async () => {
            resetAll();
        },
    })
})();


