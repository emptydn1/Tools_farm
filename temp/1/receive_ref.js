import fs from 'fs-extra';
// import path from 'path';
// import CDP from 'chrome-remote-interface';

import { runChrome } from '../../core/runChrome.mjs';

import { processTasks } from '../../utils/constant.js';
import { waitForInput, sleep } from '../../utils/utils.js';

// const pathExtensionProxy = path.join(__dirname, 'core', 'extensions', 'omaabbefbmiijedngplfjmnooppbclkk', '3.24.7_0');
// const bypassMobile = path.join(__dirname, 'core', 'extensions', 'BypassTelegram');
// const Bypass_DejenDogBot = path.join(__dirname, 'core', 'extensions', 'Bypass_DejenDogBot');

const MainBrowser = async (userProfileIndex, proxy, positionX, positionY) => {
    try {
        let { chrome, cursor, cursorSession, client, cursorActionClient, sessionIframe, cursorActionIframe, iframes, workers } = await runChrome({
            userProfileIndex,
            proxy,
            args: [
                `--window-position=${positionX},${positionY}`,
                '--window-size=400,780',
                // '--window-size=1800,780',
                '--force-device-scale-factor=0.6',
                // `--disable-extensions-except=${bypassMobile}`,
                // `--load-extension=${Bypass_DejenDogBot}`,
                // '--auto-open-devtools-for-tabs',
            ],
            url: "https://web.telegram.org/k/",
            // url: "https://web.telegram.org/k/#@memefi_coin_bot",
            // url: "https://web.telegram.org/k/#-4585491153",
            // url: "https://web.telegram.org/k/#@battle_games_com_bot",
            // https://t.me/notpixel/app?startapp=f7319890725_t
            // disableGpu: false,
            accessIframe: false,
            waitIframe: false,
            isMobile: true,
        });

        const { Page, Runtime, Input, DOM, Target, Network, Emulation } = client;
        const jsContent = fs.readFileSync('./utils/injection/JS_injection.js', 'utf8');
        await Runtime.evaluate({ expression: jsContent });

        // open menu
        await sleep(2000);
        await cursorActionClient.moveToSelector({ selector: "#column-left > div > div > div.sidebar-header.can-have-forum > div.sidebar-header__btn-container > button" });

        // find and click Saved Messages
        await sleep(1000);
        let { result: settingsPosition } = await Runtime.evaluate({
            expression: `(()=>{
                const main = document.querySelectorAll("#column-left > div > div > div.sidebar-header.can-have-forum > div.sidebar-header__btn-container > button > div.btn-menu.bottom-right.has-footer.active.was-open > div");
                const a = Array.from(main).findIndex(element => element.textContent.includes('Saved Messages'));
                return a;
            })()`
        });
        await cursorActionClient.moveToSelector({ selector: `#column-left > div > div > div.sidebar-header.can-have-forum > div.sidebar-header__btn-container > button > div.btn-menu.bottom-right.has-footer.active.was-open > div:nth-child(${settingsPosition.value + 1})` });

        // ref
        await sleep(2000);
        await cursorActionClient.moveToSelector({ selector: "#column-center > div > div > div > div > div > div > div > div.input-message-container > div:nth-child(1)" });
        let ref = 'https://t.me/catizenbot/bombie?startapp=g_1002_41546147_1068';
        await Input.insertText({ text: ref });
        await cursorActionClient.moveToSelector({ selector: "#column-center > div > div > div > div > div.btn-send-container > button > div" });

        // click link
        await sleep(1000);
        await cursorActionClient.moveToSelector({ selector: "#column-center > div.chats-container.tabs-container > div > div > div > div > section > div.bubbles-group.bubbles-group-last > div > div > div > div > a.anchor-url", maxWaitTime: 2000 });

        ///////////////////////////////////////////////////////////////////////////
        //                              choose 1                                 //
        ///////////////////////////////////////////////////////////////////////////

        // click start
        // await sleep(1000);
        // await cursorActionClient.moveToSelector({ selector: "#column-center > div.chats-container.tabs-container > div.chat.tabs-tab.can-click-date.active > div.chat-input.chat-input-main > div > div.chat-input-control.chat-input-wrapper > button:nth-child(1) > div", maxWaitTime: 2000 });

        // // click run game
        await cursorActionClient.moveToSelector({ selector: "body > div.popup.popup-peer.popup-confirmation.active > div > div > button:nth-child(1) > div", maxWaitTime: 2000 })

        // /////////////////////////////////////////////////////////////////////////
        //                              choose 1                                 //
        // /////////////////////////////////////////////////////////////////////////

        // let checkIframe = false;
        // while (!checkIframe) {
        //     const { result } = await Runtime.evaluate({ expression: `document.querySelectorAll("iframe").length > 0` });
        //     if (result.value) {
        //         checkIframe = true;
        //     } else {
        //         await cursorActionClient.moveToSelector({ selector: '#column-center .new-message-bot-commands.is-view' })
        //         await cursorActionClient.moveToSelector({ selector: "body > div.popup.popup-peer.popup-confirmation.active > div > div > button:nth-child(1) > div", maxWaitTime: 2000 })
        //     }
        //     await sleep(1000);
        // }

        ///////////////////////////////////////////////////////////////////////////
        //               khu vực code tùy chỉnh                                  //
        ///////////////////////////////////////////////////////////////////////////


        await waitForInput();
        await client.close();
        await chrome.kill();
    } catch (error) {
        console.error("Error:", error.message);
        await waitForInput();
    }
}
// https://web.telegram.org/k/#@DejenDogBot
// 33 redbull

(async () => {
    await processTasks(MainBrowser, {
        columns: 5,
        delayDuration: 2000,
    })
    process.exit(0);
})();
