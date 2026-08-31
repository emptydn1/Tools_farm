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
            url: "https://web.telegram.org/k/#@zoo_story_bot",
            isMobile: true,
        });

        // await client.Runtime.evaluate({
        //     expression: `
        //     setInterval(() => {
        //         // tu dong dang ky kenh
        //         document.querySelector("#column-center > div > div.chat.tabs-tab.can-click-date.active > div.sidebar-header.topbar.has-avatar > div.chat-info-container > div.chat-utils > button.btn-primary.btn-color-primary.chat-join.rp")?.click()
        //         document.querySelector("#column-center > div > div.chat.tabs-tab.can-click-date.active > div.sidebar-header.topbar.has-avatar.is-pinned-message-shown > div.chat-info-container > div.chat-utils > button.btn-primary.btn-color-primary.chat-join.rp")?.click()
        //         document.querySelector("#column-center > div > div > div.sidebar-header.topbar.has-avatar > div.chat-info-container > div.chat-utils > button.btn-primary.btn-color-primary.chat-join.rp")?.click()
            
        //         // tu dong like
        //         let main = document.querySelectorAll("section");
        //         for(let x of main){
        //             x.querySelector('div > div > div.bubble-content > div.message.spoilers-container.mt-shorter > reactions-element > reaction-element:nth-child(1):not(.is-chosen)')?.click()
        //         }    
        //     }, 1000);`
        // });


        await cursorActionIframe.moveToSelector({ selector: "#app > div > div > div:nth-child(3) > div", iframe: client });
        await sleep(2000)
        await cursorActionIframe.moveToSelector({ selector: "#app > div > div > div.van-popup.van-popup--round.van-popup--bottom.popup > i", maxWaitTime: 2000, iframe: true });

        await sleep(3000);

        //feed
        let { result: feed } = await sessionIframe.Runtime.evaluate({
            expression: `(()=>{
        let a = document.querySelector("#scrollable > div > div.boostBtns > div:nth-child(3) > div > div > div").getAttribute('style');
        if (a == 'background-image: url("/assets/img/decor/icon_feed_need.png");') {
            return true;
        }else{
            return false;
        }
    })()` });

        if (feed.value) {
            await cursorActionIframe.moveToSelector({ selector: "#scrollable > div > div.boostBtns > div:nth-child(3) > div > div > div", iframe: client });
            await sleep(2000)
            await cursorActionIframe.moveToSelector({ selector: "#scrollable > div > div.van-popup.van-popup--round.van-popup--right > div > div.panelRed.center > button", iframe: client });
            await sleep(2000)
            await cursorActionIframe.moveToSelector({ selector: "#scrollable > div > div.van-popup.van-popup--round.van-popup--right > i", maxWaitTime: 2000, iframe: true });
        }








        await sleep(2000);
        //click view tasks
        await cursorActionIframe.moveToSelector({ selector: "#app > div > div > div:nth-child(3) > div", maxWaitTime: 2000, iframe: true });
        await sleep(2000);

        //get tasks
        const getTasks = async () => {
            let { result: tasks } = await sessionIframe.Runtime.evaluate({
                expression: `(()=>{
    let tasks = [];
    let checkDaily = document.querySelector("#app > div > div > div.van-popup.van-popup--round.van-popup--bottom.popup > div > div > div.container > div.dailyReward.clicked");
    if (checkDaily && !checkDaily.classList.contains('grayscale')) {
        tasks.push({ index: 999, text: "" });
    }
    let run = false;
    if (run) {
        let list = document.querySelector("#app > div > div > div.van-popup.van-popup--round.van-popup--bottom.popup > div > div > div.questChallenge > div:nth-child(1)").children
        for (let i = 0; i < list.length; i++) {
            if (['Riddle of the Day', 'Rebus of the Day'].some(text => list[i].textContent.includes(text))) {
                let a = ['Rebus of the Day'].some(text => list[i].textContent.includes(text));
                tasks.push({ index: i, text: a});
            }
        }
    }
    return tasks;
        })()`,
                returnByValue: true,
            });
            return tasks.value;
        }

        let tasks = await getTasks();
        console.log(tasks)
        while (tasks.length > 0) {
            if (tasks[0].index == 999) {
                //check daily, claim, close
                await cursorActionIframe.moveToSelector({ selector: "#app > div > div > div.van-popup.van-popup--round.van-popup--bottom.popup > div > div > div.container > div.dailyReward.clicked", maxWaitTime: 2000, iframe: true });
                await cursorActionIframe.moveToSelector({ selector: "#app > div > div > div.van-popup.van-popup--round.van-popup--bottom.popup > div > div > div.container > div.van-popup.van-popup--round.van-popup--bottom.container > div.dailyRewardPopupBottomClaim > button", maxWaitTime: 2000, iframe: true });
                await sleep(2000);
                await cursorActionIframe.moveToSelector({ selector: "#app > div > div > div.van-popup.van-popup--round.van-popup--bottom.popup > div > div > div.container > div.van-popup.van-popup--round.van-popup--bottom.container > i", maxWaitTime: 2000, iframe: true });
            } else {
                await sessionIframe.Runtime.evaluate({
                    expression: `(async ()=>{
            const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
            let a = document.querySelector("#app > div > div > div.van-popup.van-popup--round.van-popup--bottom.popup > div > div > div.questChallenge > div:nth-child(1)").children[${tasks[0].index}];

            a?.scrollIntoView({ behavior: "smooth", block: "start" });
            await sleep(1000)
            a?.scrollIntoView({ behavior: "smooth", block: "start" });
            await sleep(1000)
                                })()`,
                    awaitPromise: true,
                });


                await cursorActionIframe.moveToSelector({
                    selector: {
                        script: `(() => {
            let rect = document.querySelector("#app > div > div > div.van-popup.van-popup--round.van-popup--bottom.popup > div > div > div.questChallenge > div:nth-child(1)").children[${tasks[0].index}]?.getBoundingClientRect();
            if (rect && rect.width > 0) return JSON.parse(JSON.stringify(rect));
            throw "error";
        })()`
                    },
                    maxWaitTime: 2000, iframe: client
                });
                await sleep(2000);
                await cursorActionIframe.moveToSelector({ selector: "#app > div > div > div.van-popup.van-popup--round.van-popup--bottom.popup > div > div > div.questChallenge > div.van-popup.van-popup--round.van-popup--bottom > div > div:nth-child(4) > div.van-cell.van-cell--center.van-cell--borderless.van-field.questCheckInput", maxWaitTime: 2000, iframe: client });
                if (tasks[0].text) {
                    await client.Input.insertText({ text: 'koala' });
                } else {
                    await client.Input.insertText({ text: 'arapaima' });
                }
                await sleep(2000);
                await cursorActionIframe.moveToSelector({ selector: "#app > div > div > div.van-popup.van-popup--round.van-popup--bottom.popup > div > div > div.questChallenge > div.van-popup.van-popup--round.van-popup--bottom > div > div:nth-child(5) > button", maxWaitTime: 2000, iframe: true });
                await sleep(2000);
                await cursorActionIframe.moveToSelector({ selector: "#app > div > div > div.van-popup.van-popup--round.van-popup--bottom.popup > div > div > div.questChallenge > div.van-popup.van-popup--round.van-popup--bottom > div > button", maxWaitTime: 2000, iframe: true });
                await cursorActionIframe.moveToSelector({ selector: "#app > div > div > div.van-popup.van-popup--round.van-popup--bottom.popup > div > div > div.questChallenge > div.van-popup.van-popup--round.van-popup--bottom > i", maxWaitTime: 2000, iframe: true });
            }
            tasks = await getTasks();
        }

        await sleep(3000);

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
        // stop: 42,
        numTasksPerRun: 20,
        columns: 9,
        delayDuration: 2000,
    })
    process.exit(0);
})();
