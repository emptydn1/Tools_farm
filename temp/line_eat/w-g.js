import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import CDP from 'chrome-remote-interface';

import { runChrome } from '../../core/runChrome.mjs';

import { processTasks, processTasks2 } from '../../utils/constant.js';
import { waitForInput, sleep, writeTimeToFile } from '../../utils/utils.js';
import { resetAll } from '../../utils/mouseSync.js';

import { MouseSyncController, get_start_click, set_start_click, get_click_fish, get_start_click2 } from '../../utils/mouseSync.js';
import { findMatchingRegions, monitorFPSAndCapture } from '../../utils/opencvNodejs.js';

const MainBrowser = async ({ userProfileIndex, proxy, positionX, positionY, index }) => {
    try {
        let { chrome, cursor, cursorSession, client, cursorActionClient, sessionIframe, cursorActionIframe, iframes, workers, mouseControler } = await runChrome({
            userProfileIndex,
            proxy,
            // proxy: null,
            args: [
                `--window-position=${positionX},${positionY}`,
                '--window-size=680,1350',
                `--force-device-scale-factor=${scale}`,
            ],
            url: "chrome-extension://mcohilncbfahbmgdjkbpemcciiolgcge/popup.html#/initialize",
            accessIframe: false,

            clearCookies: true,
            clearCache: true,
            clearDataForOrigin: 'https://airship.supermembers.net:444',

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

        const validUrls = [
            'https://www.okx.com/web3/extension/welcome',
            'https://web3.okx.com/extension/welcome',
            'https://web3.okx.com/'
        ];
        for (const tab of tabs) {
            if (tab.url.includes('google.com')) {
                targetTab = tab;
            }
            if (tab.url.includes('chrome-extension://mcohilncbfahbmgdjkbpemcciiolgcge/popup.html')) targetTabPopup = tab;
        }

        const tab = await CDP({ target: targetTab.webSocketDebuggerUrl, port });
        const { Page, Network, Target, Runtime, Input } = tab;
        await Promise.all([Page.enable(), Network.enable(), Runtime.enable()]);

        await Target.setDiscoverTargets({ discover: true });
        Target.targetCreated(async ({ targetInfo }) => {
            const { type, targetId } = targetInfo;
            if (type === 'iframe') {
                try {
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
                } catch (error) {
                    console.log(error)
                }
            }

            if (type === 'page') {
                try {
                    console.log('New tab detected:', targetId);
                    await tab.Target.closeTarget({ targetId });
                } catch (error) {
                }
            }
        });

        await sleep(index * 1000);
        await Page.navigate({ url: "https://airship.supermembers.net:444/?mode=ot&dp_tracking_id=LdLYbC6ZV2r9B4et" });
        let mouseControler2 = new MouseSyncController({ client: tab, userProfileIndex, index });
        await mouseControler2.init(tab);
        await tab.Page.bringToFront();

        // await monitorFPSAndCapture({ client: tab, captureImg: true, sleep: 3000 });

        let exclude = [];
        let checkIntervalVC = setInterval(async () => {
            try {
                const { matchedPoints } = await findMatchingRegions({
                    client: tab,
                    templateImages: [
                        // 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\yuru\\okx_new.jpeg',
                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\bigo\\xxxx.jpeg',
                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\bigo\\xx2.jpeg',
                    ].filter(item => !exclude.includes(item)),
                    matchThreshold: 0.8,
                    scale,
                });

                if (matchedPoints.length > 0) {
                    for (const { x, y, mathImagePath } of matchedPoints) {
                        if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\bigo\\xxxx.jpeg') {
                            await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x: x - 70, y: y - 20 }] });
                            await sleep(50);
                            await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                            clearInterval(checkIntervalVC)
                        }
                        else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\bigo\\xx2.jpeg') {
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
                        }
                    }
                }
            } catch (error) {
            }
        }, 2000);






        await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div > div._affix_oe51y_42._borderTop_oe51y_48 > div._action-buttons_j3bvq_1 > button.okui-btn.btn-lg.btn-fill-highlight.mobile._action-button_j3bvq_1" });
        await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div > div > div._affix_oe51y_42._borderTop_oe51y_48 > div > button.okui-btn.btn-lg.btn-fill-highlight.mobile._action-button_j3bvq_1" });

        await sleep(10000);
        // xu ly xoa popup
        if (targetTabPopup) {
            const tabPopup = await CDP({ target: targetTabPopup?.webSocketDebuggerUrl, port });
            await tabPopup.Target.closeTarget({ targetId: targetTabPopup?.id });
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









let scale = 0.5;
// scale = 1;

let linkRef = fs.readFileSync('C:\\Users\\huy\\Desktop\\ref.txt', 'utf8').split('\n').map(line => line.trim()).filter(line => line.length > 0);
console.log(linkRef);
console.log(linkRef.length);

let walletAccount = `Account 01`;

(async () => {
    await processTasks(MainBrowser, {
        totalElements: 2180,
        stop: 2000,
        numTasksPerRun: 16,
        exclude: [],
        columns: 8,
        delayDuration: 1000,
        xStep: 450,
        yStep: 700,
        callback: async () => {
            resetAll();
        },
    })
})();
