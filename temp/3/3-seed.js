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
                '--force-device-scale-factor=0.67',
            ],
            url: "https://web.telegram.org/k/#@seed_coin_bot",
            // isMobile: true,
        });
        // const jsContent = fs.readFileSync('./utils/injection/JS_injection.js', 'utf8');
        // await sessionIframe.Runtime.evaluate({ expression: jsContent });

        // // click claim 
        // await cursorActionIframe.moveToSelector({ selector: "#root > div.h-screen.bg-gradient-to-b.fixed.z-0.max-w-md.mx-auto > div:nth-child(1) > div.h-screen.overflow-hidden.flex.flex-col.flex-1.px-4.relative.z-60 > div.overflow-visible.relative > div", iframe: client });
        // await cursorActionIframe.moveToSelector({ selector: "#root > div.h-screen.bg-gradient-to-b.fixed.z-0.max-w-md.mx-auto > div:nth-child(1) > div.h-screen.overflow-hidden.flex.flex-col.flex-1.px-4.relative.z-60 > div.overflow-visible.relative > div", iframe: true });

        // // lay sau
        // await cursorActionIframe.moveToSelector({ selector: "#root > div.h-screen.bg-gradient-to-b.fixed.z-0.left-0.right-0.bottom-0.max-w-md.mx-auto > div:nth-child(1) > div.h-screen.overflow-hidden.flex.flex-col.flex-1.px-4.relative.z-60 > div.flex.flex-1.relative.justify-center.bg-no-repeat.bg-contain.bg-center > div.right-10 > div:nth-child(2) > img", maxWaitTime: 2000, iframe: true });
        // await cursorActionIframe.moveToSelector({ selector: "#root > div.h-screen.bg-gradient-to-b.max-w-md.mx-auto > div:nth-child(1) > div.h-screen.overflow-hidden > div.flex.flex-1.relative.justify-center.bg-no-repeat.bg-contain.bg-center > div.relative.right-10 > img", maxWaitTime: 2000, iframe: true });
        // await cursorActionIframe.moveToSelector({ selector: "#\\\\:r0\\\\:", maxWaitTime: 2000, iframe: true });
        // await cursorActionIframe.moveToSelector({ selector: "#\\\\:r0\\\\:", maxWaitTime: 2000, iframe: true });
        // await cursorActionIframe.moveToSelector({ selector: "#root > div.h-screen.bg-gradient-to-b.max-w-md.mx-auto > div:nth-child(1) > div.h-screen.overflow-hidden.flex.flex-col.flex-1.px-4.relative.z-60.dark\\\\:bg-black.bg-center.bg-cover.bg-no-repeat > div.flex.flex-1.relative.justify-center.bg-no-repeat.bg-contain.bg-center.z-10 > div.flex.items-end.pb-3.relative.z-20 > img", maxWaitTime: 2000, iframe: true });
        // await cursorActionIframe.moveToSelector({ selector: "#root > div.h-screen > div:nth-child(1) > div.fixed.z-50.flex.flex-col-reverse.items-center.w-full.h-full.top-0.left-0.bg-black.bg-opacity-70 > div > div > div > button", maxWaitTime: 2000, iframe: true });
        // await cursorActionIframe.moveToSelector({ selector: "#root > div.h-screen > div:nth-child(1) > div.fixed.z-50.flex.flex-col-reverse.items-center.w-full.h-full.top-0.left-0.bg-black.bg-opacity-70 > div > div > div > button", maxWaitTime: 2000, iframe: true });


        // // click chim
        // await cursorActionIframe.moveToSelector({ selector: "#root > div.h-screen.bg-gradient-to-b.from-\\\\[\\\\#F7FFEB\\\\].via-\\\\[\\\\#E4FFBE\\\\].to-\\\\[\\\\#79B22A\\\\].fixed.z-0.left-0.right-0.bottom-0.top-0.dark\\\\:bg-none.dark\\\\:bg-\\\\[\\\\#030C02\\\\].max-w-md.mx-auto > div:nth-child(1) > div.h-screen.overflow-hidden.flex.flex-col.flex-1.px-4.relative.z-60.dark\\\\:bg-black.bg-center.bg-cover.bg-no-repeat.pb-\\\\[110px\\\\] > div.mt-\\\\[20px\\\\].mb-\\\\[80px\\\\] > div.flex.justify-center.relative > button.btn-hover.z-20.rounded-lg.w-\\\\[50px\\\\].h-\\\\[48px\\\\].flex.justify-center.items-center.absolute.right-0.-bottom-\\\\[130px\\\\] > img", iframe: true });
        // await sleep(2000);

        // // claim
        // await cursorActionIframe.moveToSelector({ selector: "#root > div.h-screen.bg-gradient-to-b.from-\\\\[\\\\#F7FFEB\\\\].via-\\\\[\\\\#E4FFBE\\\\].to-\\\\[\\\\#79B22A\\\\].fixed.z-0.left-0.right-0.bottom-0.top-0.dark\\\\:bg-none.dark\\\\:bg-\\\\[\\\\#030C02\\\\].max-w-md.mx-auto > div > div.px-4.pb-\\\\[40px\\\\].h-screen.relative.z-30.flex.flex-col.justify-around.flex-1.item.pt-\\\\[40px\\\\] > div.w-full.flex.gap-2.justify-between > div:nth-child(4)", iframe: true });
        // await sleep(2000);
        // //confirm claim
        // await cursorActionIframe.moveToSelector({ selector: "#root > div.h-screen.bg-gradient-to-b.from-\\\\[\\\\#F7FFEB\\\\].via-\\\\[\\\\#E4FFBE\\\\].to-\\\\[\\\\#79B22A\\\\].fixed.z-0.left-0.right-0.bottom-0.top-0.dark\\\\:bg-none.dark\\\\:bg-\\\\[\\\\#030C02\\\\].max-w-md.mx-auto > div > div.bg-black\\\\/70.absolute.z-50.inset-0.flex.items-center.justify-center.px-7.visible > div > div.flex.items-center.w-full > button", maxWaitTime: 2000, iframe: true });
        // await sleep(1000);
        // // happy chim
        // await cursorActionIframe.dragSelectorTimeout({ selectorDrag: "#root > div.h-screen.bg-gradient-to-b.from-\\\\[\\\\#F7FFEB\\\\].via-\\\\[\\\\#E4FFBE\\\\].to-\\\\[\\\\#79B22A\\\\].fixed.z-0.left-0.right-0.bottom-0.top-0.dark\\\\:bg-none.dark\\\\:bg-\\\\[\\\\#030C02\\\\].max-w-md.mx-auto > div > div.px-4.pb-\\\\[40px\\\\].h-screen.relative.z-30.flex.flex-col.justify-around.flex-1.item.pt-\\\\[40px\\\\] > div.flex.flex-1.max-h-\\\\[350px\\\\].relative.z-0.justify-center.items-center > div.absolute.z-10.select-none", iframe: true });
        // // chon sau
        // await cursorActionIframe.moveToSelector({ selector: "#root > div.h-screen.bg-gradient-to-b.from-\\\\[\\\\#F7FFEB\\\\].via-\\\\[\\\\#E4FFBE\\\\].to-\\\\[\\\\#79B22A\\\\].fixed.z-0.left-0.right-0.bottom-0.top-0.dark\\\\:bg-none.dark\\\\:bg-\\\\[\\\\#030C02\\\\].max-w-md.mx-auto > div > div.px-4.pb-\\\\[40px\\\\].h-screen.relative.z-30.flex.flex-col.justify-around.flex-1.item.pt-\\\\[40px\\\\] > div.flex.justify-center.gap-3.w-full.mb-2 > div:nth-child(1)", iframe: true });
        // await sleep(3000);
        // // hunt
        // await cursorActionIframe.moveToSelector({ selector: "#root > div.h-screen.bg-gradient-to-b.from-\\\\[\\\\#F7FFEB\\\\].via-\\\\[\\\\#E4FFBE\\\\].to-\\\\[\\\\#79B22A\\\\].fixed.z-0.left-0.right-0.bottom-0.top-0.dark\\\\:bg-none.dark\\\\:bg-\\\\[\\\\#030C02\\\\].max-w-md.mx-auto > div > div.px-4.pb-\\\\[40px\\\\].h-screen.relative.z-30.flex.flex-col.justify-around.flex-1.item.pt-\\\\[40px\\\\] > div.w-full.flex.gap-2.justify-between > div:nth-child(4)", iframe: true });
        // await sleep(3000);

        // await client.Runtime.evaluate({
        //     expression: `(()=>{
        //         document.querySelector("body > div > div > div._BrowserHeader_m63td_55 > button:nth-child(1)").click()
        //     })()`
        // });

        // // task 2
        // await cursorActionIframe.moveToSelector({ selector: "#root > div.h-screen.bg-gradient-to-b.from-\\\\[\\\\#F7FFEB\\\\].via-\\\\[\\\\#E4FFBE\\\\].to-\\\\[\\\\#79B22A\\\\].fixed.z-0.left-0.right-0.bottom-0.top-0.dark\\\\:bg-none.dark\\\\:bg-\\\\[\\\\#030C02\\\\].max-w-md.mx-auto > div.fixed.left-0.right-0.bottom-0.z-50 > div > div > div:nth-child(2) > div > div:nth-child(2)", iframe: true });

        // // click login
        // await cursorActionIframe.moveToSelector({ selector: "#root > div.h-screen.bg-gradient-to-b.from-\\\\[\\\\#F7FFEB\\\\].via-\\\\[\\\\#E4FFBE\\\\].to-\\\\[\\\\#79B22A\\\\].fixed.z-0.left-0.right-0.bottom-0.top-0.dark\\\\:bg-none.dark\\\\:bg-\\\\[\\\\#030C02\\\\].max-w-md.mx-auto > div:nth-child(1) > div.pt-5.px-4.pb-\\\\[86px\\\\].relative.z-40.h-screen.bg-\\\\[\\\\#FFFFFF\\\\].bg-\\\\[\\\\#FFFFFF\\\\] > div.mt-4.overflow-auto.max-h-\\\\[calc\\\\(100\\\\%-130px\\\\)\\\\] > div.mb-3.rounded-2xl > div > div.col-span-4.flex.items-center.justify-end > button", iframe: true });

        // // click check
        // await client.Runtime.evaluate({
        //     expression: `(()=>{
        //          let a = document.querySelector("#root > div.h-screen.bg-gradient-to-b.from-\\\\[\\\\#F7FFEB\\\\].via-\\\\[\\\\#E4FFBE\\\\].to-\\\\[\\\\#79B22A\\\\].fixed.z-0.left-0.right-0.bottom-0.top-0.dark\\\\:bg-none.dark\\\\:bg-\\\\[\\\\#030C02\\\\].max-w-md.mx-auto > div > div.py-4.px-4.pb-\\\\[50px\\\\].bg-\\\\[\\\\#F2FFE0\\\\].overflow-auto.h-screen.relative.z-30 > div.grid.grid-cols-3.gap-x-4.gap-y-0.pt-10.flex-1.px-2.overflow-auto").children;
        //         const result = Array.from(a).filter(div => {
        //             return !div.querySelector('div.flex.items-center.justify-center.absolute.-right-2.-top-4.z-30');
        //         });

        //         result[0].click()
        //     })()`
        // });

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
