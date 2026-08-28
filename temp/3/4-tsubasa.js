import fs from 'fs-extra';
// import path from 'path';
// import CDP from 'chrome-remote-interface';

import { runChrome } from './core/runChrome.mjs';
import { checkSelectorExists } from './utils/cdp.js';
import { proxies, totalElements, distance, taskDelayTime } from './utils/constant.js';
import { printFormattedTitle, waitForInput, sleep, writeTimeToFile, getFilename } from './utils/utils.js';

const MainBrowser = async (userProfileIndex, proxy, positionX, positionY) => {
    try {
        let { chrome, client, cursorActionClient, sessionIframe, cursorAction, targetInfoIframe } = await runChrome({
            userProfileIndex,
            proxy,
            args: [
                `--window-position=${positionX},${positionY}`,
                '--window-size=400,780',
                '--force-device-scale-factor=0.4',
            ],
            url: "https://web.telegram.org/k/#@TsubasaRivalsBot",
            isMobile: true,
        });
        // const jsContent = fs.readFileSync('./utils/injection/emulator_touch.js', 'utf8');
        // await sessionIframe.Runtime.evaluate({ expression: jsContent });

        await checkSelectorExists({
            client: sessionIframe,
            selector: "body > div.MuiModal-root > div.show.animate__slideInUp > div > div > button",
            callback: async () => {
                await cursorAction.moveToSelector({ selector: "body > div.MuiModal-root > div.show.animate__slideInUp > div > div > button", iframe: client });
                await cursorAction.moveToSelector({ selector: "body > div.MuiModal-root > div.show.animate__slideInUp > div > div > button", maxWaitTime: 2000, iframe: true });
            },
            maxWaitTime: 10000
        })

        // skip info
        await cursorAction.moveToSelector({ selector: "body > div.MuiModal-root > div.show.animate__slideInUp > div > div > div:nth-child(3) > button", maxWaitTime: 2000, iframe: client });
        await cursorAction.moveToSelector({ selector: "body > div.MuiModal-root > div.show.animate__slideInUp > div > div > div:nth-child(3) > button", maxWaitTime: 2000, iframe: true });

        //         // trang click
        //         await cursorAction.moveToSelector({ selector: "#root > div > div > div > footer > div:nth-child(1)", iframe: true });
        //         await cursorAction.moveToSelector({ selector: "#root > div > div > div > footer > div:nth-child(1)", iframe: true });
        //         await sessionIframe.Runtime.evaluate({
        //             expression: `(async ()=>{
        // const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
        // let a = document.querySelector("#root > div > div > main > div > div.sc-epzHnm.gwTokA > div > div.sc-loAbOW.kFRpmV > div.sc-irEpRR.cheyOx.sc-fmRmGN.lbiHnC > div > div.sc-eteQWc.eBNVZB > div");

        // a?.scrollIntoView({ behavior: "smooth", block: "start" });
        // await sleep(1000)
        // a?.scrollIntoView({ behavior: "smooth", block: "start" });
        //                     })()`,
        //             awaitPromise: true,
        //         });


        //         // touch
        //         let { result: block } = await client.Runtime.evaluate({
        //             expression: `(()=>{
        //                 // let rect = document.querySelector('iframe')?.getBoundingClientRect();
        //                 // let width = window.innerWidth - (rect.x * 2);
        //                 // let height = window.innerHeight - (rect.y * 2);
        //                 let width = window.innerWidth;
        //                 let height = window.innerHeight;
        //                 return {width, height};
        //             })()`,
        //             returnByValue: true,
        //         });

        //         const square = { width: 300, height: 200 };
        //         const squareX = (block.value.width - square.width) / 2;
        //         const squareY = (block.value.height - square.height) / 2;

        //         function generateRandomPoints(numPoints) {
        //             const points = [];
        //             for (let i = 0; i < numPoints; i++) {
        //                 const x = squareX + Math.random() * square.width;
        //                 const y = squareY + Math.random() * square.height;
        //                 points.push({ x, y });
        //             }
        //             return points;
        //         }

        //         let { result: energy } = await sessionIframe.Runtime.evaluate({
        //             expression: `+document.querySelector("#root > div > div > main > div > div.sc-epzHnm.gwTokA > div > div.sc-loAbOW.kFRpmV > div.sc-bTwLay.kSRNur > div.sc-dKsqdn.gkaTjO > div:nth-child(1) > div:nth-child(2) > span").textContent.match(/\\d+/);`,
        //         });

        //         let countEnergy = energy.value;
        //         while (countEnergy > 10) {
        //             const touchPoints = generateRandomPoints(5);
        //             await client.Input.dispatchTouchEvent({
        //                 type: 'touchStart',
        //                 touchPoints: touchPoints,
        //             });

        //             await sleep(50);

        //             await client.Input.dispatchTouchEvent({
        //                 type: 'touchEnd',
        //                 touchPoints: [],
        //             });
        //             countEnergy -= 5;
        //             // await sleep(Math.floor(Math.random() * (500 - 50)) + 50);
        //             await sleep(50);
        //         }

        //         await cursorAction.moveToSelector({ selector: "#root > div > div > div > footer > div:nth-child(2)", iframe: client });
        await sleep(6000);
        // await waitForInput();
        await client.close();
        await chrome.kill();
    } catch (error) {
        console.error("Error:", error.message);
        await waitForInput();
    }
}


(async () => {
    let stop = true;
    let tasks = [];
    for (let offset = 0; offset < distance; offset++) {
        for (let i = offset; i < totalElements; i += distance) {
            if (i == 4) continue

            if (i == 46) stop = true;
            if (stop) tasks.push(i);
        }
    }

    const columns = 5; // Số cột (các giá trị positionX trong một hàng)
    const xStep = 500; // Bước nhảy của positionX
    const yStep = 780; // Bước nhảy của positionY

    while (tasks.length > 0) {
        // lấy 5 task
        const currentBatch = tasks.splice(0, 10);
        await Promise.all(currentBatch.map(async (e, index) => {
            const positionX = xStep * (index % columns);
            const positionY = yStep * Math.floor(index / columns);

            await sleep(index * taskDelayTime);
            const proxy = proxies[e] === 'null' ? null : proxies[e];
            printFormattedTitle(`account ${e} - Profile ${e + 100} - proxy ${proxy}`, "red");
            await MainBrowser(e, proxy, positionX, positionY);
        }));
    }
    await writeTimeToFile(getFilename(import.meta.url).split('\\').pop(), 3)
    process.exit(1);
})();
