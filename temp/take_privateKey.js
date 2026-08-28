import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import CDP from 'chrome-remote-interface';
import clipboardy from 'clipboardy';

import { runChrome } from './core/runChrome.mjs';

import { processTasks, processTasks2 } from './utils/constant.js';
import { waitForInput, sleep, writeTimeToFile } from './utils/utils.js';
import { resetAll } from './utils/mouseSync.js';

import { MouseSyncController, get_start_click, set_start_click, get_click_fish } from './utils/mouseSync.js';
// import { findMatchingRegions, monitorFPSAndCapture } from './utils/opencvNodejs.js';


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
            proxy: null,
            args: [
                `--window-position=${positionX},${positionY}`,
                '--window-size=400,780',
                `--force-device-scale-factor=${scale}`,
            ],
            url: "chrome-extension://mcohilncbfahbmgdjkbpemcciiolgcge/popup.html#/initialize",
            accessIframe: false,

            closeTabs: false,

            okx: true,
        });

        const response = await axios.get(`http://localhost:${chrome.port}/json`);
        const tabs = response.data;

        const port = chrome.port;


        const validUrls = [
            'https://www.okx.com/web3/extension/welcome',
            'https://web3.okx.com/extension/welcome',
            'https://web3.okx.com/'
        ];
        for (const tab of tabs) {
            if (tab.url === 'https://www.google.com/') {
                const tabPopup = await CDP({ target: tab?.webSocketDebuggerUrl, port });
                await tabPopup.Target.closeTarget({ targetId: tab?.id });
            }
            if (validUrls.includes(tab.url)) {
                const tabPopup = await CDP({ target: tab?.webSocketDebuggerUrl, port });
                await tabPopup.Target.closeTarget({ targetId: tab?.id });
            }
        }


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



        await client.Page.navigate({ url: "chrome-extension://mcohilncbfahbmgdjkbpemcciiolgcge/popup.html#/new-settings-wallet-backup" });


        await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div._wallet-spin_1px67_19._wallet-list_1kyzd_1._wrapper_1dhfc_1" });
        // click input va paste
        await cursorActionClient.moveToSelector({ selector: "#app > div > div.main-container-wrapper > div > div.verify-password-page > div.verify-password-page__input._inputClass_k59wc_15._guardInputClass_k59wc_19 > div > div > input" });
        await client.Input.insertText({ text: "Hoang123@" });


        // confirm
        await cursorActionClient.moveToSelector({ selector: "#app > div > div._affix_oe51y_42 > div > button" });

        // button ok
        await cursorActionClient.moveToSelector({ selector: "#app > div > div.main-container-wrapper > div.okui-transition-fade.okui-dialog.okui-tip-dialog.okui-dialog-float.okui-transition-fade-entered > div > div.okui-dialog-footer-box" });


        // private
        await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div.okui-tabs._tabs_12r79_16 > div.okui-tabs-pane-list.okui-tabs-pane-list-sm.okui-tabs-pane-list-grey.okui-tabs-pane-list-segmented._tabs-header_12r79_19 > div > div.okui-tabs-pane-list-container.okui-tabs-pane-list-average > div > div:nth-child(2)" });


        // lay key wallet n
        await client.Runtime.evaluate({ expression: `document.querySelector("#app > div > div > div > div.okui-tabs._tabs_12r79_16 > div.okui-tabs-panel-list > div.okui-tabs-panel.okui-tabs-panel-show > div > div > a:nth-child(${STTWallet})").click()` });

        await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div.okui-input.okui-input-md.okui-input-search._search_s8m97_31 > div > input.okui-input-input" });
        await client.Input.insertText({ text: "kaia" });

        await client.Runtime.evaluate({
            expression: ` Array.from(document.querySelectorAll("#app > div > div > div > div._container_s8m97_26 > div > div"))
                .filter(div => div.textContent.toLowerCase().includes("kaia"))[0].querySelector('div').click()` });


        await cursorActionClient.moveToSelector({ selector: "div.copy-private-key__copy-button" });

        await waitForInput();
        await sleep(index * 3000);
        await cursorActionClient.moveToSelector({ selector: "#app > div > div > div.okui-transition-fade.okui-dialog.okui-dialog-float.okui-transition-fade-entered > div > div.okui-dialog-footer-box > div > button.okui-btn.btn-md.btn-fill-highlight.mobile.dialog-btn.double-btn" });

        const privateKey = await clipboardy.read();
        fs.appendFileSync('1.txt', privateKey + '\n', 'utf8');


        // await waitForInput();
        await client.close();
        await chrome.kill();
    } catch (error) {
        console.log(error);
        console.error("Error:", error.message);
        // await waitForInput();
    }
}

// ^(.*)\n\1$





let scale = 0.5;
// scale = 1;

let STTWallet = 13;
let walletAccount = `Account 06`;


(async () => {
    await processTasks(MainBrowser, {
        totalElements: 2180,
        stop: 2000,
        numTasksPerRun: 24,
        columns: 8,
        delayDuration: 500,
        xStep: 480,
        yStep: 700,
        callback: async () => {
            resetAll();
        },
    })
})();

