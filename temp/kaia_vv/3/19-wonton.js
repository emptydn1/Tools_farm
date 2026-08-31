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
                // '--auto-open-devtools-for-tabs',
                // '--force-device-scale-factor=0.67',
            ],
            url: "https://web.telegram.org/k/#@WontonOrgBot",
            isMobile: true,
        });
        await client.Runtime.evaluate({
            expression: `(()=>{
setInterval(() => {
    document.querySelector("#column-center > div > div.chat.tabs-tab.can-click-date.active > div.sidebar-header.topbar.has-avatar > div.chat-info-container > div.chat-utils > button.btn-primary.btn-color-primary.chat-join.rp")?.click()
    document.querySelector("#column-center > div > div.chat.tabs-tab.can-click-date.active > div.sidebar-header.topbar.has-avatar.is-pinned-message-shown > div.chat-info-container > div.chat-utils > button.btn-primary.btn-color-primary.chat-join.rp")?.click()
    document.querySelector("#column-center > div > div > div.sidebar-header.topbar.has-avatar > div.chat-info-container > div.chat-utils > button.btn-primary.btn-color-primary.chat-join.rp")?.click()
    
    let main = document.querySelectorAll("section");
    for(let x of main){
        x.querySelector('div > div > div.bubble-content > div.message.spoilers-container.mt-shorter > reactions-element > reaction-element:nth-child(1):not(.is-chosen)')?.click()
    }
}, 1000);
            })()`,
        });
        await sessionIframe.Runtime.evaluate({
            expression: `(()=>{
setInterval(() => {
    document.querySelector("#app > div:nth-child(5) > div.header > img")?.click()
}, 1000);
            })()`,
        });

        let run = true;
        if (run) {
            await cursorActionIframe.moveToSelector({ selector: '#app > main > div.checkin.page.flex-column > span.title', iframe: client });
            await sleep(3000);

            await sessionIframe.Runtime.evaluate({
                expression: `(async ()=>{
                const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
                let a = document.querySelector("#app > main > div.checkin.page.flex-column > div.main-button");
                a?.scrollIntoView({ behavior: "smooth", block: "start" });
                await sleep(1000)
                a?.scrollIntoView({ behavior: "smooth", block: "start" });
                await sleep(1000)
                                    })()`,
                awaitPromise: true,
            });

            await cursorActionIframe.moveToSelector({ selector: "#app > main > div.checkin.page.flex-column > div.main-button", maxWaitTime: 2000, iframe: client });
            await cursorActionIframe.moveToSelector({ selector: "#app > main > div.checkin.page.flex-column > div.main-button", maxWaitTime: 2000, iframe: true });

            await cursorActionIframe.moveToSelector({ selector: "#home > div.main-button", iframe: true });
            await cursorActionIframe.moveToSelector({ selector: "#home > div.main-button", maxWaitTime: 2000, iframe: true });
            await cursorActionIframe.moveToSelector({ selector: "#home > div.main-button", maxWaitTime: 2000, iframe: true });
            await cursorActionIframe.moveToSelector({ selector: "#home > div.main-button", maxWaitTime: 2000, iframe: true });
            await cursorActionIframe.moveToSelector({ selector: "#home > div.main-button", maxWaitTime: 2000, iframe: true });
            await cursorActionIframe.moveToSelector({ selector: "#home > div.main-button", maxWaitTime: 2000, iframe: true });
            await cursorActionIframe.moveToSelector({ selector: "#home > div.main-button", maxWaitTime: 2000, iframe: true });

            await sleep(2000);
        } else {
            await client.Runtime.evaluate({
                expression: `(()=>{
setInterval(() => {
    // xoa popup huy game, dung dung vao o may script khac
    document.querySelector("body > div.popup.popup-peer.popup-confirmation.active > div > div.popup-buttons > button:nth-child(2)")?.click()
}, 1000);
                })()`,
            });


            const getTasks = async () => {
                let { result } = await sessionIframe.Runtime.evaluate({
                    expression: `(()=>{
const isMatchingText = (list, textContent) => {
    return list.some(str => textContent?.toLowerCase().includes(str.toLowerCase()));
}

let rootChildren = document.querySelector("#app > main > div.tasks.page.flex-column > div:nth-child(11).task-list").children;
const results = [];
for (let i = 0; i < rootChildren.length; i++) {
    let title = rootChildren[i]?.querySelector('.task-name')?.textContent;
    let button = rootChildren[i]?.querySelector('div.main-button')?.textContent;

    if (button) {
        let titleIgnoreKeywords = [
            'Connect Wallet in Shop',
            'Join WONTON Chat',
        ];
        let buttonKeywords = ['check', 'claim', 'start'];

        let isIgnoredTitle = isMatchingText(titleIgnoreKeywords, title);
        let isIgnoredButton = isMatchingText(buttonKeywords, button);

        if (isIgnoredButton && !isIgnoredTitle) {
            results.push(i);
        }
    }
}
return results;
            })()`,
                    returnByValue: true,
                });
                return result.value
            }
            await cursorActionIframe.moveToSelector({ selector: "#home > div.main-button", iframe: true });
            await cursorActionIframe.moveToSelector({ selector: "#home > div.main-button", maxWaitTime: 2000, iframe: true });
            await cursorActionIframe.moveToSelector({ selector: "#home > div.main-button", maxWaitTime: 2000, iframe: true });

            await sleep(2000);
            await cursorActionIframe.moveToSelector({ selector: "#menu-tasks", iframe: client });
            await sleep(5000);
            let tasks = await getTasks();
            console.log(tasks)
            while (tasks.length > 0) {
                await sessionIframe.Runtime.evaluate({
                    expression: `(async ()=>{
            const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
            let a = document.querySelector("#app > main > div.tasks.page.flex-column > div:nth-child(11).task-list").children[${tasks[0]}];
            
            a?.scrollIntoView({ behavior: "smooth", block: "start" });
            await sleep(1000)
            a?.scrollIntoView({ behavior: "smooth", block: "start" });
                                })()`,
                    awaitPromise: true,
                });
                await cursorActionIframe.moveToSelector({
                    selector: {
                        script: `(() => {
                        let rect = document.querySelector("#app > main > div.tasks.page.flex-column > div:nth-child(11).task-list").children[${tasks[0]}]?.querySelector('div.main-button')?.getBoundingClientRect();
                        if (rect && rect.width > 0) return JSON.parse(JSON.stringify(rect));
                        throw "error";
                    })()`
                    },
                    maxWaitTime: 2000, iframe: client
                });
                await cursorActionIframe.moveToSelector({
                    selector: {
                        script: `(() => {
                        let rect = document.querySelector("#app > main > div.tasks.page.flex-column > div:nth-child(11).task-list").children[${tasks[0]}]?.querySelector('div.main-button.task-check-button')?.getBoundingClientRect();
                        if (rect && rect.width > 0) return JSON.parse(JSON.stringify(rect));
                        throw "error";
                    })()`
                    },
                    maxWaitTime: 2000, iframe: true
                });
                await cursorActionIframe.moveToSelector({
                    selector: {
                        script: `(() => {
                        let rect = document.querySelector("#app > main > div.tasks.page.flex-column > div:nth-child(11).task-list").children[${tasks[0]}]?.querySelector('div.main-button.task-claim-button')?.getBoundingClientRect();
                        if (rect && rect.width > 0) return JSON.parse(JSON.stringify(rect));
                        throw "error";
                    })()`
                    },
                    maxWaitTime: 2000, iframe: true
                });
                tasks = await getTasks();
                await sleep(5000);
            }
        }
        await sleep(2000)
        // await waitForInput();
        if (args[0] == 'manual') await waitForInput();
        await client.close();
        await chrome.kill();
    } catch (error) {
        console.error("Error:", error.message);
        await waitForInput();
    }
}

(async () => {
    await processTasks(MainBrowser, {
        // stop: 22,
        numTasksPerRun: 20,
        columns: 9,
        delayDuration: 2000,
    })
    process.exit(0);
})();
