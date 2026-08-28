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
            proxy: null,
            args: [
                `--window-position=${positionX},${positionY}`,
                '--window-size=400,780',
                `--force-device-scale-factor=${scale}`,
            ],
            url: "chrome-extension://mcohilncbfahbmgdjkbpemcciiolgcge/popup.html#/initialize",
            accessIframe: false,

            // clearCookies: true,
            // clearCache: true,
            // clearDataForOrigin: "https://kyuzosfriends.com/",

            okx: true,
        });


        const response = await axios.get(`http://localhost:${chrome.port}/json`);
        const tabs = response.data;

        const port = chrome.port;
        let targetTab = null;
        let targetTabPopup = null;


        for (const tab of tabs) {
            if (tab.url === 'https://www.google.com/') {
                // const tabRemove = await CDP({ target: tab.webSocketDebuggerUrl, port });
                // await tabRemove.Target.closeTarget({ targetId: tab.id });
                targetTab = tab;
            }

            if (tab.url.includes('chrome-extension://mcohilncbfahbmgdjkbpemcciiolgcge/popup.html')) targetTabPopup = tab;
        }
        // xu ly xoa popup
        if (targetTab) {
            const tabPopup = await CDP({ target: targetTab?.webSocketDebuggerUrl, port });
            await tabPopup.Target.closeTarget({ targetId: targetTab?.id });
        }




        const jsInjection = fs.readFileSync('./utils/injection/JS_injection.js', 'utf8');
        const emulatorTouch = fs.readFileSync('./utils/injection/emulator_touch.js', 'utf8');
        await client.Runtime.evaluate({ expression: jsInjection });
        await client.Runtime.evaluate({ expression: emulatorTouch });


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

        // let pageLoaded = false;
        // while (!pageLoaded) {
        //     const { result } = await client.Runtime.evaluate({ expression: 'document.readyState' });
        //     if (result.value === 'complete') pageLoaded = true;
        //     await sleep(500);
        // }

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


        let mouseControler2 = new MouseSyncController({ client: client, userProfileIndex, index });
        await mouseControler2.init(client);



        // choose network
        // await client.Runtime.evaluate({
        //     expression: `
        //         (() => {
        //             const target = document.querySelector("#home-page-root-element-id > div._main_bbmgq_1 > div:nth-child(2) > div._coinList_blxw2_13 > div > div > div:nth-child(9)");
        //             target.scrollIntoView({ behavior: "smooth" });
        //         })()
        //     `
        // });
        // await cursorActionClient.moveToSelector({ selector: `#home-page-root-element-id > div > div:nth-child(3) > div:nth-child(3) > div > div` });
        // await cursorActionClient.moveToSelector({ selector: `#app > div > div > div > div.okui-input.okui-input-md.okui-input-search._search-input_6izyw_1 > div > input.okui-input-input` });
        // await client.Input.insertText({ text: `kaia` });
        // await cursorActionClient.moveToSelector({ selector: `#app > div > div > div > div._search-container_1nee9_6 > div._list-container_1dyrv_7._search-mode_1dyrv_11 > div > div > div:nth-child(2)` });




        // // add crypto
        // // document.querySelector("#home-page-root-element-id > div:nth-child(6) > div > button")
        // await cursorActionClient.moveToSelector({ selector: "#home-page-root-element-id > div:nth-child(6) > div > button" });
        // await cursorActionClient.moveToSelector({ selector: `[data-testid="okd-input"]` });
        // await client.Input.insertText({ text: `kaia` });
        // // document.querySelector("#app > div > div > div > div._wallet-spin_1px67_19._wallet-coin__manage__spin_1imve_8._wallet-coin__manage__spin__auto_1imve_14 > div > div > div > div._wallet-icon_5gayk_1._wallet-icon__radius_5gayk_22._wallet-icon__md_5gayk_44._wallet-icon__icon_5gayk_64.undefined._wallet-icon-button_5gayk_108._wallet-icon-button__hovered_5gayk_119 > i")

        // await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div._wallet-spin_1px67_19._wallet-coin__manage__spin_1imve_8._wallet-coin__manage__spin__auto_1imve_14 > div > div > div > div._wallet-icon_5gayk_1._wallet-icon__radius_5gayk_22._wallet-icon__md_5gayk_44._wallet-icon__icon_5gayk_64.undefined._wallet-icon-button_5gayk_108._wallet-icon-button__hovered_5gayk_119 > i" });

        // // document.querySelector("#app > div > div > div > div.okui-input.okui-input-md.okui-input-search > div > div > i")
        // await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div.okui-input.okui-input-md.okui-input-search > div > div > i" });

        // // all network button
        // // document.querySelector("#app > div > div > div > div.okui-tabs > div.okui-tabs-panel-list > div.okui-tabs-panel.okui-tabs-panel-show > div > div > div > div:nth-child(1)")
        // await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div.okui-tabs > div.okui-tabs-panel-list > div.okui-tabs-panel.okui-tabs-panel-show > div > div > div > div:nth-child(1)" });








        //mo list crypto
        await cursorActionClient.moveToSelector({ selector: "#home-page-root-element-id > div._coinList_17b2u_5 > div._container_kkyjs_1._container--sticky_kkyjs_9 > div:nth-child(2) > div > div > i" });

        //click input
        await cursorActionClient.moveToSelector({ selector: `[data-testid="okd-input"]` });
        await client.Input.insertText({ text: `kaia` });

        await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div._wallet-spin_1px67_19._wallet-coin__manage__spin_1imve_8._wallet-coin__manage__spin__auto_1imve_14 > div > div > div > div._wallet-icon_5gayk_1._wallet-icon__radius_5gayk_22._wallet-icon__md_5gayk_44._wallet-icon__icon_5gayk_64.undefined._wallet-icon-button_5gayk_108._wallet-icon-button__hovered_5gayk_119 > i" });

        await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div._affix_oe51y_42 > div._wallet-navigator__bordered_1bx5y_46 > div:nth-child(1) > div > i" });

        await waitForInput("v");
        await client.close();
        await chrome.kill();
    } catch (error) {
        console.log(error);
        console.error("Error:", error.message);
    }
}


let scale = 0.5;
// scale = 1;

let walletAccount = `Account 05`;

(async () => {
    await processTasks(MainBrowser, {
        totalElements: 2192,
        stop: 2000,
        numTasksPerRun: 24,
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





