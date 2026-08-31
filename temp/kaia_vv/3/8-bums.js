import fs from 'fs-extra';
// import path from 'path';
// import CDP from 'chrome-remote-interface';

import { runChrome } from '../../core/runChrome.mjs';

import { processTasks } from '../../utils/constant.js';
import { waitForInput, sleep } from '../../utils/utils.js';

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
            ],
            url: "https://web.telegram.org/k/#@bums",
            isMobile: true,
        });
        // const jsContent = fs.readFileSync('./utils/injection/emulator_touch.js', 'utf8');
        // await sessionIframe.Runtime.evaluate({ expression: jsContent });

        await sessionIframe.Runtime.evaluate({
            expression: `(()=>{
setInterval(()=>{
    document.querySelector("#app > div.page-container.show-bottomTabBar > div > div.tap-container > div:nth-child(20) > div.van-popup.van-popup--round.van-popup--center.popp-tip > div > div.head > img")?.click()
    document.querySelector("#app > div.page-container.show-bottomTabBar > div > div.tap-container > div.notify-decorate > div.van-popup.van-popup--round.van-popup--center.popp-tip > div > div.head > img")?.click()
    document.querySelector("#app > div.page-container.show-bottomTabBar > div > div:nth-child(10) > div.van-popup.van-popup--round.van-popup--center.popp-tip > div > div.head > img")?.click()
    document.querySelector("#app > div.page-container.show-bottomTabBar > div > div.tap-container > div.max-decorate > div.van-popup.van-popup--round.van-popup--center.popp-tip > div > div.head > img")?.click()
    document.querySelector("#app > div:nth-child(5) > div.van-popup.van-popup--round.van-popup--center.popp-tip > div > div.head > img")?.click();
    document.querySelector("body > div.van-popup.van-popup--bottom.mine-offline-popup.van-safe-area-bottom > div > button")?.click();
},3000)
            })()`,
            returnByValue: true,
        });

        // skip Offline bonus
        // nice
        await cursorActionIframe.moveToSelector({ selector: "body > div.van-popup.van-popup--bottom.mine-offline-popup.van-safe-area-bottom > div > button", maxWaitTime: 2000, iframe: client });
        await cursorActionIframe.moveToSelector({ selector: "body > div.van-popup.van-popup--bottom.mine-offline-popup.van-safe-area-bottom > div > button", maxWaitTime: 2000, iframe: true });
        await cursorActionIframe.moveToSelector({ selector: "#app > div.page-container.show-bottomTabBar > div > div.tap-container > div:nth-child(4) > div > div.van-popup.van-popup--round.van-popup--center.pop > div > div.history-content > div:nth-child(5) > button", maxWaitTime: 2000, iframe: client });
        await cursorActionIframe.moveToSelector({ selector: "#app > div:nth-child(5) > div.van-popup.van-popup--round.van-popup--center.popp-tip > div > div.head > img", maxWaitTime: 2000, iframe: true });

        // await waitForInput();
        // touch
        let { result: block } = await client.Runtime.evaluate({
            expression: `(()=>{
                // let rect = document.querySelector('iframe')?.getBoundingClientRect();
                // let width = window.innerWidth - (rect.x * 2);
                // let height = window.innerHeight - (rect.y * 2);
                let width = window.innerWidth;
                let height = window.innerHeight;
                return {width, height};
            })()`,
            returnByValue: true,
        });

        const square = { width: 250, height: 200 };
        const squareX = (block.value.width - square.width) / 2;
        const squareY = (block.value.height - square.height) / 2;

        function generateRandomPoints(numPoints) {
            const points = [];
            for (let i = 0; i < numPoints; i++) {
                const x = squareX + Math.random() * square.width;
                const y = squareY + Math.random() * square.height;
                points.push({ x, y });
            }
            return points;
        }

        const getEnergy = async () => {
            const { result: energy } = await sessionIframe.Runtime.evaluate({
                expression: `+document.querySelector("#app > div.page-container.show-bottomTabBar > div > div.tap-container > div.footer-view.power-value > span > div > div > div.tap_power_val.text_bold").textContent.match(/\\d+/);`,
            });
            return energy.value;
        }

        function getRandomNumber(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        let countEnergy = await getEnergy();

        while (countEnergy > 100) {
            const touchPoints = generateRandomPoints(4);
            await client.Input.dispatchTouchEvent({
                type: 'touchStart',
                touchPoints: touchPoints,
            });

            await sleep(50);

            await client.Input.dispatchTouchEvent({
                type: 'touchEnd',
                touchPoints: [],
            });
            await sleep(getRandomNumber(200, 500));
            countEnergy = await getEnergy();
        }
        await cursorActionIframe.moveToSelector({ selector: "#app > div.van-tabbar.van-tabbar--fixed.van-hairline--top-bottom.van-safe-area-bottom.root-footer > div:nth-child(2)", maxWaitTime: 2000, iframe: client });
        await sleep(8000);

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
        // numTasksPerRun: 1,
        // stop: 42,
        numTasksPerRun: 20,
        columns: 9,
        delayDuration: 2000,
    })
    process.exit(0);
})();
