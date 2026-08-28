import fs from 'fs-extra';
import path from 'path';
import CDP from 'chrome-remote-interface';

import { runChrome } from './core/runChrome.mjs';

import { proxies, totalElements, distance, taskDelayTime } from './utils/constant.js';
import { checkPageLoad } from './utils/cdp.js';
import { printFormattedTitle, waitForInput, sleep, writeTimeToFile, getFilename } from './utils/utils.js';


const MainBrowser = async (userProfileIndex, proxy, positionX, positionY) => {
    try {
        let { chrome, cursor, cursorSession, client, cursorActionClient, sessionIframe, cursorActionIframe, iframes, workers } = await runChrome({
            userProfileIndex,
            proxy,
            args: [
                `--window-position=${positionX},${positionY}`,
                '--window-size=400,780',
                '--force-device-scale-factor=0.67',
            ],
            url: 'https://web.telegram.org/k/#@Stars_MeBot',
            // accessIframe: false,
            // isMobile: true,
        });
        // const jsContent = fs.readFileSync('./utils/injection/emulator_touch.js', 'utf8');
        // await sessionIframe.Runtime.evaluate({ expression: jsContent });

        await cursorActionIframe.moveToSelector({ selector: "#daily-reward-modal > div.mx-4.mb-6 > button", iframe: client });
        await cursorActionIframe.moveToSelector({ selector: "#daily-reward-modal > div.mx-4.mb-6 > button", maxWaitTime: 2000, iframe: true });
        await cursorActionIframe.moveToSelector({ selector: "#daily-reward-modal > div.mx-4.mb-6 > button", maxWaitTime: 2000, iframe: true });

        await sleep(5000)

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

            if (i == 50) stop = true;
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

            await sleep(index * 3000);
            const proxy = proxies[e] === 'null' ? null : proxies[e];
            printFormattedTitle(`account ${e} - Profile ${e + 100} - proxy ${proxy}`, "red");
            await MainBrowser(e, proxy, positionX, positionY);
        }));
    }
    await writeTimeToFile(getFilename(import.meta.url).split('\\').pop(), 24)
    process.exit(1);
})();
