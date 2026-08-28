import fs from 'fs-extra';
// import path from 'path';
// import CDP from 'chrome-remote-interface';

import { runChrome } from './core/runChrome.mjs';

import { processTasks } from './utils/constant.js';
import { checkSelectorExists } from './utils/cdp.js';
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
                '--force-device-scale-factor=0.67',
                // '--disable-images',
            ],
            url: 'https://web.telegram.org/k/#@birdx2_bot',
            // disableGpu: true,
            isMobile: true,
        });
        // const jsContent2 = fs.readFileSync('./utils/injection/emulator_touch.js', 'utf8');
        // await sessionIframe.Runtime.evaluate({ expression: jsContent2 });
        // const jsContent3 = fs.readFileSync('./utils/injection/JS_injection.js', 'utf8');
        // await sessionIframe.Runtime.evaluate({ expression: jsContent3 });
        // const jsContent = fs.readFileSync('./utils/injection/disable_animation.js', 'utf8');
        // await sessionIframe.Runtime.evaluate({ expression: jsContent });

        // await cursorActionIframe.moveToSelector({ selector: "#root > div > div > main > div > div > div > button", iframe: client });
        // await cursorActionIframe.moveToSelector({ selector: "#root > div > div > main > div > div.relative.flex.flex-col.gap-4.w-full.max-sm\\\\:pt-6.items-center.px-4 > div.main-grid.h-\\\\[716px\\\\].max-lg\\\\:h-\\\\[600px\\\\].max-md\\\\:h-\\\\[450px\\\\].max-sm\\\\:h-\\\\[300px\\\\].relative.z-10.p-\\\\[4rem\\\\].max-lg\\\\:p-\\\\[3rem\\\\].max-md\\\\:p-\\\\[2rem\\\\].max-sm\\\\:p-\\\\[0\\\\.5rem\\\\] > a > div > div", iframe: true });
        // // await cursorActionIframe.moveToSelector({ selector: "#root > div > div.bg-black.w-full.sticky.top-0.px-4.gap-2.py-1.flex.items-center > button.bg-transparent.font-bold", maxWaitTime: 5000, iframe: true });

        // //worm
        // await checkSelectorExists({
        //     client: sessionIframe,
        //     selector: '#worm',
        //     callback: async () => {
        //         await sleep(2000)
        //         await cursorActionIframe.moveToSelector({ selector: '#worm', maxWaitTime: 2000, iframe: true });
        //         await sleep(5000)
        //         await sleep(5000)
        //         await sleep(5000)
        //         await cursorActionIframe.moveToSelector({ selector: "#\\\\:rl\\\\: > footer > div > button", maxWaitTime: 2000, iframe: true });
        //         await cursorActionIframe.moveToSelector({ selector: "#\\\\:rl\\\\: > footer > div > button", maxWaitTime: 2000, iframe: true });
        //     },
        //     maxWaitTime: 4000
        // })

        // // click view egg
        // await checkSelectorExists({
        //     client: sessionIframe,
        //     selector: "#root > div > div > main > div > div > div.flex.flex-col.items-center.mt-4.mb-4 > a:nth-child(2) > img",
        //     callback: async () => {
        //         await cursorActionIframe.moveToSelector({ selector: "#root > div > div > main > div > div > div.flex.flex-col.items-center.mt-4.mb-4 > a:nth-child(2) > img", iframe: true });
        //         await cursorActionIframe.moveToSelector({ selector: "#root > div > div > main > div > div > a:nth-child(2)", iframe: true });
        //     },
        //     maxWaitTime: 4000
        // })

        // await checkSelectorExists({
        //     client: sessionIframe,
        //     selector: "#root > div > div > main > div > div > div > a:nth-child(1) > img",
        //     callback: async () => {
        //         await cursorActionIframe.moveToSelector({ selector: "#root > div > div > main > div > div > div > a:nth-child(1) > img", iframe: true });
        //         await cursorActionIframe.moveToSelector({ selector: "#root > div > div > main > div > div > a:nth-child(2)", iframe: true });

        //     },
        //     maxWaitTime: 4000
        // })


        // //egg
        // await sleep(2000);
        // const { result } = await sessionIframe.Runtime.evaluate({ expression: `document.querySelector("#root > div > div > main > div > div > div > div > div").textContent`, iframe: true });
        // let count = parseInt(result.value?.match(/\d+/)[0]);
        // while (count > 0) {
        //     await cursorActionIframe.moveToSelector({ selector: "#root > div > div > main > div > div > div > div.origin-bottom", maxWaitTime: 4000, iframe: true });
        //     await cursorActionIframe.moveToSelector({ selector: "#root > div > div > main > div:nth-child(1) > div > button", maxWaitTime: 4000, iframe: true });
        //     count--;
        // }
        // await cursorActionIframe.moveToSelector({ selector: "#root > div > div > main > div > div:nth-child(3) > button", maxWaitTime: 2000, iframe: true });
        // await sleep(1000);

        // await waitForInput();
        if (args[0] == 'manual') await waitForInput();
        await client.close();
        await chrome.kill();
    } catch (error) {
        console.error("Error:", error);
        await waitForInput();
    }
}

(async () => {
    await processTasks(MainBrowser, {
        stop: 50,
        // numTasksPerRun: 20,
        // columns: 9,
        numTasksPerRun: 1,
        delayDuration: 3000,
    })
    process.exit(0);
})();











