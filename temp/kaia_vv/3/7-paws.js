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
                '--force-device-scale-factor=0.7',
            ],
            url: "https://web.telegram.org/k/#@PAWSOG_bot",
            isMobile: true,
        });

        // await cursorActionIframe.moveToSelector({ selector: "#next-app > div.main-page-con > div.main-content-container.is-show > div.nav-bar-con > div:nth-child(5)", iframe: client });

        // // // chưa có nhiệm vụ ở mục 2 và 3 nên để giá trị 1, và bỏ click từng mục item
        // for (let i = 0; i < 1; i++) {
        //     await sessionIframe.Runtime.evaluate({
        //         expression: `(async ()=>{
        //             const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
        //             let a = document.querySelector("#next-app > div.main-page-con > div.main-content-container.is-show > div.main-content-wrapper > div.quests-tab-con.is-show > div > div.type-select > div");

        //             a?.scrollIntoView({ behavior: "smooth", block: "start" });
        //             await sleep(1000)
        //             a?.scrollIntoView({ behavior: "smooth", block: "start" });
        //             await sleep(1000)
        //                                 })()`,
        //         awaitPromise: true,
        //     });
        //     await cursorActionIframe.moveToSelector({ selector: `#next-app > div.main-page-con > div.main-content-container.is-show > div.main-content-wrapper > div.quests-tab-con.is-show > div > div.type-select > div:nth-child(${i + 1})`, maxWaitTime: 2000, iframe: client });

        //     // take list tasks
        //     await sleep(1000);
        //     let { result: takeTasks } = await sessionIframe.Runtime.evaluate({
        //         expression: `(()=>{
        // let root = document.querySelector("#next-app > div.main-page-con > div.main-content-container.is-show > div.main-content-wrapper > div.quests-tab-con.is-show > div > div.section-items-con.quests").children;
        // const strings = [
        //     "Boost PAWS channel",
        //     "Invite 10 friends",
        //     "Go vote",
        // ];

        // let arr = [];
        // for (let i = 0; i < root.length; i++) {
        //     let check = strings.some(str => root[i].textContent.toLowerCase().includes(str.toLowerCase()));
        //     let pointsText = root[i].querySelector('div.points > div').textContent.toLowerCase();
        //     let check2 = pointsText.includes('start') || pointsText.includes('claim');
        //     if(!check && check2){
        //         arr.push(i)
        //     } 
        // }
        // return arr;
        //                 })()`,
        //         returnByValue: true,
        //     });

        //     for (let e of takeTasks.value) {
        //         await sessionIframe.Runtime.evaluate({
        //             expression: `(async ()=>{
        //         const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
        //         let a = document.querySelector("#next-app > div.main-page-con > div.main-content-container.is-show > div.main-content-wrapper > div.quests-tab-con.is-show > div > div.section-items-con.quests").children[${e}];

        //         a?.scrollIntoView({ behavior: "smooth", block: "start" });
        //         await sleep(1000)
        //         a?.scrollIntoView({ behavior: "smooth", block: "start" });
        //         await sleep(1000)
        //                             })()`,
        //             awaitPromise: true,
        //         });
        //         await sleep(2000);
        //         await cursorActionIframe.moveToSelector({
        //             selector: {
        //                 script: `(() => {
        //                     let rect = document.querySelector("#next-app > div.main-page-con > div.main-content-container.is-show > div.main-content-wrapper > div.quests-tab-con.is-show > div > div.section-items-con.quests").children[${e}].querySelector('div.points > div')?.getBoundingClientRect();
        //                     if (rect && rect.width > 0) return JSON.parse(JSON.stringify(rect));
        //                     throw "error";
        //                 })()`
        //             },
        //             maxWaitTime: 2000, iframe: client
        //         });

        //         await client.Page.bringToFront()
        //         await sleep(1000);
        //         await cursorActionIframe.moveToSelector({
        //             selector: {
        //                 script: `(() => {
        //                     let rect = document.querySelector("#next-app > div.main-page-con > div.main-content-container.is-show > div.main-content-wrapper > div.quests-tab-con.is-show > div > div.section-items-con.quests").children[${e}].querySelector('div.points > div')?.getBoundingClientRect();
        //                     if (rect && rect.width > 0) return JSON.parse(JSON.stringify(rect));
        //                     throw "error";
        //                 })()`
        //             },
        //             maxWaitTime: 2000, iframe: true
        //         });
        //     }
        // }
        // await sleep(2000);

        await waitForInput();
        await client.close();
        await chrome.kill();
    } catch (error) {
        console.error("Error:", error.message);
        await waitForInput();
    }
}

(async () => {
    await processTasks(MainBrowser, {
        columns: 5,
        delayDuration: 2000,
    })
    process.exit(0);
})();
