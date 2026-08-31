import fs from 'fs-extra';
// import path from 'path';
// import CDP from 'chrome-remote-interface';

import { runChrome } from './core/runChrome.mjs';

import { processTasks } from './utils/constant.js';
import { waitForInput, sleep } from './utils/utils.js';

const args = process.argv.slice(2);

const MainBrowser = async (userProfileIndex, proxy, positionX, positionY) => {
    try {
        let { chrome, cursor, cursorSession, client, cursorActionClient, sessionIframe, cursorActionIframe, iframes, workers } = await runChrome({
            userProfileIndex,
            proxy,
            args: [
                `--window-position=${positionX},${positionY}`,
                '--window-size=400,780',
                '--force-device-scale-factor=0.4',
                // '--force-device-scale-factor=0.67',
            ],
            url: "https://web.telegram.org/k/#@Snakeshouselive_bot",
            isMobile: true,
        });

        // tu dong dang ky kenh
        await client.Runtime.evaluate({
            expression: `
            setInterval(() => {
                document.querySelector("#column-center > div > div.chat.tabs-tab.can-click-date.active > div.sidebar-header.topbar.has-avatar > div.chat-info-container > div.chat-utils > button.btn-primary.btn-color-primary.chat-join.rp")?.click()
                document.querySelector("#column-center > div > div.chat.tabs-tab.can-click-date.active > div.sidebar-header.topbar.has-avatar.is-pinned-message-shown > div.chat-info-container > div.chat-utils > button.btn-primary.btn-color-primary.chat-join.rp")?.click()
                document.querySelector("#column-center > div > div > div.sidebar-header.topbar.has-avatar > div.chat-info-container > div.chat-utils > button.btn-primary.btn-color-primary.chat-join.rp")?.click()
            }, 1000);`
        });
        // like solana
        await client.Runtime.evaluate({
            expression: `
            setInterval(() => {
                let main = document.querySelectorAll("section");
                for(let x of main){
                    x.querySelector('div > div > div.bubble-content > div.message.spoilers-container.mt-shorter > reactions-element > reaction-element:nth-child(1):not(.is-chosen)')?.click()
                }
            }, 500);`
        })

        await cursorActionIframe.moveToSelector({ selector: '#__next > div > div > div > div > div > div > img', iframe: client });
        await cursorActionIframe.moveToSelector({ selector: '#__next > div > div > div > div > div > div > img', maxWaitTime: 2000, iframe: client });
        await cursorActionIframe.moveToSelector({ selector: '#__next > div > div > div > div > div > div > img', maxWaitTime: 2000, iframe: client });
        await cursorActionIframe.moveToSelector({ selector: '#__next > div > div > div > div > div > div > button', maxWaitTime: 2000, iframe: true });
        await cursorActionIframe.moveToSelector({ selector: '#__next > div > div > div > div > div > div > button', maxWaitTime: 2000, iframe: true });
        await cursorActionIframe.moveToSelector({ selector: '#__next > div > div > div > div > div > div > button', maxWaitTime: 2000, iframe: true });
        await cursorActionIframe.moveToSelector({ selector: '#__next > div > div > div > div > div > div > button', maxWaitTime: 2000, iframe: true });
        await cursorActionIframe.moveToSelector({ selector: '#__next > div > div > div > div > div > div > button', maxWaitTime: 2000, iframe: true });
        await cursorActionIframe.moveToSelector({ selector: '#__next > div > div > div > div > div > div > button', maxWaitTime: 2000, iframe: true });

        // const extractTasksFromDOM = async () => {
        //     let { result } = await sessionIframe.Runtime.evaluate({
        //         expression: `(()=>{
        // const rootChildren = document.querySelector("#__next > div > div > div > div > div > div > div > div.w-full.h-auto.flex.flex-col.items-center.px-4 > ul.w-full.mb-4")?.children;

        // const results = [];
        // for (let i = 0; i < rootChildren.length; i++) {
        //     let task = rootChildren[i]?.querySelector('button');
        //     let title = rootChildren[i]?.querySelector('div.flex-col.justify-start.items-start > div');

        //     let takeStr = ['join', 'open', 'check'];
        //     const isIgnore = takeStr.some(str =>
        //         task?.textContent.toLowerCase().includes(str.toLowerCase())
        //     );


        //     let ignoreTitle = [
        //         'Invite 15 friends to Snakes',
        //         'Invite 7 friends to Snakes', 
        //         'Invite 3 friends to Snakes', 
        //         'Snake loves TON',
        //         'Connect with Bitget Wallet',
        //     ]
        //     const isIgnoreTitle = ignoreTitle.some(str =>
        //         title?.textContent.toLowerCase().includes(str.toLowerCase())
        //     );

        //     if (isIgnore && !isIgnoreTitle) {
        //         results.push({ rootIndex: i });
        //     }
        // }
        // return results;
        //             })()`,
        //         returnByValue: true,
        //     });
        //     console.log(result)
        //     return result.value
        // }

        // let tasks = await extractTasksFromDOM();


        // while (tasks.length > 0) {
        //     await sessionIframe.Runtime.evaluate({
        //         expression: `(async ()=>{
        //     const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
        //     let a = document.querySelector("#__next > div > div > div > div > div > div > div > div.w-full.h-auto.flex.flex-col.items-center.px-4 > ul.w-full.mb-4")?.children[${tasks[0].rootIndex}];

        //     a?.scrollIntoView({ behavior: "smooth", block: "start" });
        //     await sleep(1000)
        //     a?.scrollIntoView({ behavior: "smooth", block: "start" });
        //     await sleep(1000)
        //                     })()`,
        //         awaitPromise: true,
        //     });
        //     await sleep(2000);
        //     await cursorActionIframe.moveToSelector({
        //         selector: {
        //             script: `(() => {
        //                     let rect = document.querySelector("#__next > div > div > div > div > div > div > div > div.w-full.h-auto.flex.flex-col.items-center.px-4 > ul.w-full.mb-4")?.children[${tasks[0].rootIndex}].querySelector('button')?.getBoundingClientRect();
        //                     if (rect && rect.width > 0) return JSON.parse(JSON.stringify(rect));
        //                     throw "error";
        //                 })()`
        //         }, maxWaitTime: 2000, iframe: client
        //     });

        //     await client.Page.bringToFront()
        //     tasks = await extractTasksFromDOM();
        // }

        await sleep(3000);

        // await waitForInput();
        await client.close();
        await chrome.kill();
    } catch (error) {
        console.error("Error:", error.message);
        await waitForInput();
    }
}

(async () => {
    await processTasks(MainBrowser, {
        // stop: 31,
        numTasksPerRun: 20,
        columns: 9,
        delayDuration: 2000,
    })
    process.exit(0);
})();
