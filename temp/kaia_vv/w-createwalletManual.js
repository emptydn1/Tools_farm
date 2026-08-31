import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import CDP from 'chrome-remote-interface';

import { runChrome } from './core/runChrome.mjs';

import { processTasks } from './utils/constant.js';
import { waitForInput, sleep, writeTimeToFile } from './utils/utils.js';
import { resetAll } from './utils/mouseSync.js';

import { MouseSyncController, get_start_click, get_click_fish } from './utils/mouseSync.js';
import { createCursor } from './core/custom-module/ghost-cursor/spoof.cjs';
import { CursorActions } from './utils/ghost-cursor.js';



const MainBrowser = async ({ userProfileIndex, proxy, positionX, positionY }) => {
    try {
        let { chrome, cursor, cursorSession, client, cursorActionClient, sessionIframe, cursorActionIframe, iframes, workers, mouseControler } = await runChrome({
            userProfileIndex,
            // proxy,
            proxy: null,
            args: [
                `--window-position=${positionX},${positionY}`,
                // '--window-size=2000,980',
                '--window-size=400,780',
                '--force-device-scale-factor=0.5',
                // '--force-device-scale-factor=0.7',
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
        const jsInjection = fs.readFileSync('./utils/injection/JS_injection.js', 'utf8');
        const emulatorTouch = fs.readFileSync('./utils/injection/emulator_touch.js', 'utf8');
        await client.Runtime.evaluate({ expression: jsInjection });
        await client.Runtime.evaluate({ expression: emulatorTouch });

        let checkExist = false;
        while (!checkExist) {
            await cursorActionClient.moveToSelector({ selector: "#app > div > div.main-container-wrapper > div > div._content_1ttdc_26 > form > div.okui-form-item-md.okui-form-item.okui-form-item-no-label._password_11p2x_1 > div > div > div > div > div > input" });
            await cursorActionClient.moveToSelector({ selector: "#app > div > div.main-container-wrapper > div > div._content_1ttdc_26 > form > div.okui-form-item-md.okui-form-item.okui-form-item-no-label._password_11p2x_1 > div > div > div > div > div > input" });
            await client.Input.insertText({ text: "Hoang123@" });
            await cursorActionClient.moveToSelector({ selector: "#app > div > div._affix_oe51y_42._footer_11p2x_17 > button" });

            const { result } = await client.Runtime.evaluate({ expression: `document.querySelector("#app > div > div.main-container-wrapper > div > div._content_1ttdc_26 > form > div.okui-form-item-md.okui-form-item.okui-form-item-no-label._password_11p2x_1 > div > div > div > div > div > input")?.value !== ''` });
            if (result?.value) checkExist = true;
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
            if (tab.url === 'https://www.google.com/') {
                // const tabRemove = await CDP({ target: tab.webSocketDebuggerUrl, port });
                // await tabRemove.Target.closeTarget({ targetId: tab.id });
                targetTab = tab;
            }
            // if (validUrls.includes(tab.url)) {
            //     targetTab = tab;
            // }
            if (tab.url.includes('chrome-extension://mcohilncbfahbmgdjkbpemcciiolgcge/popup.html')) targetTabPopup = tab;
        }

        // xu ly xoa popup
        if (targetTabPopup) {
            const tabPopup = await CDP({ target: targetTabPopup?.webSocketDebuggerUrl, port });
            await tabPopup.Target.closeTarget({ targetId: targetTabPopup?.id });
        }

        await sleep(3000)
        const tab = await CDP({ target: targetTab.webSocketDebuggerUrl, port });
        const { Page, Network, Runtime, Input } = tab;
        await Promise.all([Page.enable(), Network.enable(), Runtime.enable()]);


        await tab.Runtime.evaluate({ expression: jsInjection });
        await tab.Runtime.evaluate({ expression: emulatorTouch });
        let mouseControler2 = new MouseSyncController({ client: tab, userProfileIndex });
        await mouseControler2.init(tab);




        await Page.navigate({ url: "chrome-extension://mcohilncbfahbmgdjkbpemcciiolgcge/fullscreen.html#/batch-add-account/home" });

        const cursorTab = createCursor(Input);
        const cursorActionTab = new CursorActions(tab, cursorTab, false, Input);

        await cursorActionTab.moveToSelector({ selector: "#app > div > div > div > div._root_5jwcg_1 > div._root_1umy7_2 > form > div:nth-child(2) > div.okui-form-item-control > div > div > div > div > input.okui-input-input" });

        await tab.Input.insertText({ text: "10" });

        await cursorActionTab.moveToSelector({ selector: "#app > div > div > div > div._root_5jwcg_1 > div._root_1umy7_2 > form > div._affix_oe51y_42 > div > div > div > div > div > button" });



        await waitForInput();
        await client.close();
        await chrome.kill();
    } catch (error) {
        console.log(error);
        console.error("Error:", error.message);
        // await waitForInput();
    }
}

// 2 lan 19s
(async () => {
    await processTasks(MainBrowser, {
        totalElements: 2192,
        stop: 2000,

        // totalElements: 3168,
        // stop: 3024,

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




