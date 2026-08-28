import fs from 'fs-extra';
import path from 'path';
import CDP from 'chrome-remote-interface';

import { runChrome } from './core/runChrome.mjs';
import { fetchData } from "./utils/axios.js";

import { processTasks } from './utils/constant.js';
import { waitForInput, sleep } from './utils/utils.js';

let runCore;
let parentClient;
let childClient;

const handleEvent = async (client, iframeSize, event) => {
    const { type, x, y, button, deltaX = 0, deltaY = 0, iframe } = event;
    let isDragging;
    try {
        if (iframe) {
            if (type === 'mousedown') {
                isDragging = true;
                await client.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x: x + iframeSize.x, y: y + iframeSize.y, radiusX: 5, radiusY: 5 }] });
            } else if (type === 'mouseup') {
                isDragging = false;
                await client.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
            } else if (type === 'mousemove' && isDragging) {
                await client.Input.dispatchTouchEvent({ type: 'touchMove', touchPoints: [{ x, y, radiusX: 5, radiusY: 5 }] });
            } else if (type === 'wheel') {
                await client.Input.dispatchMouseEvent({ type: 'mouseWheel', x, y, deltaX, deltaY });
            }
        } else {
            if (type === 'mousedown') {
                await client.Input.dispatchMouseEvent({ type: 'mousePressed', x, y, button, clickCount: 1 });
            } else if (type === 'mouseup') {
                await client.Input.dispatchMouseEvent({ type: 'mouseReleased', x, y, button, clickCount: 1 });
            } else if (type === 'mousemove') {
                await client.Input.dispatchMouseEvent({ type: 'mouseMoved', x, y });
            } else if (type === 'wheel') {
                await client.Input.dispatchMouseEvent({ type: 'mouseWheel', x, y, deltaX, deltaY });
            }
        }
    } catch (error) {
        console.error('Error processing event:', error.message);
    }
}

const eventScript = (isIframe) => {
    return `
        // Hàm gửi sự kiện
        const sendEvent = ({ type, clientX: x = 0, clientY: y = 0, button, deltaX = 0, deltaY = 0 }, iframe = false) => {
            const buttonMap = ['left', 'middle', 'right'];
            console.log(JSON.stringify({
                type,
                x,
                y,
                button: button !== undefined ? buttonMap[button] || 'none' : 'none',
                deltaX,
                deltaY,
                iframe,
            }));
        };

        const getTouchCoordinates = (touchEvent) => {
            const touch = touchEvent.touches[0] || touchEvent.changedTouches[0];
            return { type: touchEvent.type, clientX: touch?.clientX || 0, clientY: touch?.clientY || 0 };
        };

        if (${isIframe}) {
            // Xử lý đặc biệt cho iframe
            const preventDefaultAndStopPropagation = (e) => {
                sendEvent(e, true);
                // e.preventDefault();
                // e.stopImmediatePropagation();
                // return false;
            };

            ['mousedown', 'mouseup', 'mousemove', 'click', 'wheel'].forEach((event) => {
                document.addEventListener(event, preventDefaultAndStopPropagation, true);
            });
        } else {
            // Xử lý mặc định cho client
            const eventMapping = {
                mousedown: sendEvent,
                mouseup: sendEvent,
                mousemove: sendEvent,
                wheel: sendEvent,

                // touchstart: (e) => sendEvent(getTouchCoordinates(e)),
                // touchmove: (e) => sendEvent(getTouchCoordinates(e)),
                // touchend: (e) => sendEvent(getTouchCoordinates(e)),
                // touchcancel: (e) => sendEvent(getTouchCoordinates(e))
            };

            Object.entries(eventMapping).forEach(([eventType, handler]) => {
                document.addEventListener(eventType, handler);
            });
        }
    `;
}



const setupClientKeydownListener = (client, sessionIframe, userProfileIndex) => {
    client.Runtime.evaluate({
        expression: `
            document.addEventListener('keydown', (e) => {
                if (e.key === ']') {
                    console.log("runMouseSync");
                } else if (e.key === '[') {
                    console.log("stopMouseSync");
                }
            });    
        `
    });
    client.on('Runtime.consoleAPICalled', async ({ args }) => {
        const message = args[0]?.value;
        if (!message) return;

        if (message === 'runMouseSync') {
            parentClient = client;
            childClient = sessionIframe;
            runCore = userProfileIndex;
        } else if (message === 'stopMouseSync') {
            parentClient = null;
            childClient = null;
        }
    });

    if (sessionIframe) {
        sessionIframe.Runtime.evaluate({
            expression: `
            document.addEventListener('keydown', (e) => {
                if (e.key === ']') {
                    console.log("runMouseSync");
                } else if (e.key === 'xxxxx') {
                    console.log("stopMouseSync");
                }
            });    
        `
        });
        sessionIframe.on('Runtime.consoleAPICalled', async ({ args }) => {
            const message = args[0]?.value;
            if (!message) return;

            if (message === 'runMouseSync') {
                parentClient = client;
                childClient = sessionIframe;
                runCore = userProfileIndex;
            } else if (message === 'stopMouseSync') {
                parentClient = null;
                childClient = null;
            }
        });
    }
};

const setupEventListeners = (listener, client, iframeSize) => {
    listener.on('Runtime.consoleAPICalled', async ({ args }) => {
        const message = args[0]?.value;
        if (!message) return;

        try {
            const event = JSON.parse(message);
            await handleEvent(client, iframeSize, event);
        } catch (error) {
            console.error('Error parsing event:', error.message);
        }
    });
}
let suiWallet = 'C:\\Users\\huy\\Desktop\\Tools_Farm\\core\\extensions\\sui\\24.12.99.32_0';

const MainBrowser = async ({ userProfileIndex, proxy, positionX, positionY }) => {
    try {
        let { chrome, cursor, cursorSession, client, cursorActionClient, sessionIframe, cursorActionIframe, iframes, workers } = await runChrome({
            userProfileIndex,
            proxy,
            args: [
                `--window-position=${positionX},${positionY}`,
                '--window-size=1400,800',
                // '--auto-open-devtools-for-tabs',
                // '--force-device-scale-factor=0.9',
                '--window-size=400,780',
                // '--force-device-scale-factor=0.4',
                // '--force-device-scale-factor=0.67',
                `--disable-extensions-except=${suiWallet}`,
                `--load-extension=${suiWallet}`,
            ],
            // url: "https://example.com",
            // url: 'https://web.telegram.org/k/#@coub',
            // url: "https://web.telegram.org/k/#@boinker_bot",
            // url: "https://web.telegram.org/k/#@bombieapp_bot",
            // url: "https://web.telegram.org/k/#@katknight_bot",
            // url: "https://web.telegram.org/k/#@BlumCryptoBot",
            // url: "https://web.telegram.org/k/#@moonbergai_bot",


            url: "https://web.telegram.org/k/",
            // url: "https://web.telegram.org/k/#@money_dogs_bot",
            // url: 'https://web.telegram.org/k/#@Stars_MeBot',
            // url: "https://web.telegram.org/k/#-4585491153",
            // url: "https://web.telegram.org/k/#@tapps_bot",
            // url: 'https://web.telegram.org/k/#@birdx2_bot',

            url: "https://web.telegram.org/k/#@seed_coin_bot",
            url: "https://playseedgo.com/dashboard",
            // url: "https://web.telegram.org/k/#@PAWSOG_bot",
            // url: "https://www.geodatatool.com/",
            // url: "https://www.iplocation.net/",
            // url: "https://web.telegram.org/k/#@bums",
            // url: "https://web.telegram.org/k/#@tverse",
            // url: "https://web.telegram.org/k/#@BlumCryptoBot",
            // url: "https://web.telegram.org/k/#@chillguyxmas_bot",
            // url: 'https://web.telegram.org/k/#@CryptoRank_app_bot',
            // url: "https://web.telegram.org/k/#@TelgatherMinigamesBot",
            // url: "https://web.telegram.org/k/#@MidasRWA_bot",
            // url: "https://web.telegram.org/k/#@WontonOrgBot",
            // url: "https://web.telegram.org/k/#@mousehous_bot",
            // url: "https://web.telegram.org/k/#@XyroPortalBot",
            // url: "https://web.telegram.org/k/#@Stars_MeBot",
            // url: "https://web.telegram.org/k/#@UXUYbot",
            // url: "https://web.telegram.org/k/#@Snakeshouselive_bot",
            // url: "chrome-extension://bfnaelmomeimhlpmgjnjophhpkkoljpa/onboarding.html",
            // url: "https://web.telegram.org/k/#@zoo_story_bot",
            // url: "https://web.telegram.org/k/#@y_nation_bot",
            // url: "https://web.telegram.org/k/#@money_dogs_bot",
            // url: "https://web.telegram.org/k/#@DurovCapsBot",
            // url: "https://www.iplocation.net/",
            // url: "https://web.telegram.org/k/#@TassbeehBot",
            // url: "https://line-mini.lastmemories.io/?ref=kaiaclearnormal",
            accessIframe: false,
            closeTabs: false,
            // isMobile: true,
        });

        // setupClientKeydownListener(client, sessionIframe, userProfileIndex);

        // const jsInjection = fs.readFileSync('./utils/injection/JS_injection.js', 'utf8');
        // const emulatorTouch = fs.readFileSync('./utils/injection/emulator_touch.js', 'utf8');
        // await client.Runtime.evaluate({ expression: jsInjection });
        // await client.Runtime.evaluate({ expression: emulatorTouch });
        // if (sessionIframe) {
        //     await sessionIframe.Runtime.evaluate({ expression: jsInjection });
        //     await sessionIframe.Runtime.evaluate({ expression: emulatorTouch });
        // }

        // let { result } = await client.Runtime.evaluate({
        //     expression: `
        //         (() => {
        //             let rect = document.querySelector('iframe')?.getBoundingClientRect();
        //             return JSON.parse(JSON.stringify(rect));
        //         })()    
        //     `,
        //     returnByValue: true,
        // })

        // let iframeSize = result.value;

        // let checkIsRun = setInterval(() => {
        //     if (runCore) {
        //         clearInterval(checkIsRun);
        //         if (runCore == userProfileIndex) {
        //             parentClient = client;
        //             client.Runtime.evaluate({ expression: eventScript(false) });
        //             if (sessionIframe) {
        //                 childClient = sessionIframe;
        //                 sessionIframe.Runtime.evaluate({ expression: eventScript(true) });
        //             }
        //         } else {
        //             setupEventListeners(parentClient, client, iframeSize);
        //             if (sessionIframe) {
        //                 setupEventListeners(childClient, sessionIframe, iframeSize);
        //             }
        //         }
        //     }
        // }, 1000);

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



        // await sessionIframe.Runtime.evaluate({
        //     expression: `(async ()=>{
        // setInterval(() => {
        //     document.querySelector("div > div > app-air-drop-bonus > div > div > div.buttons-container.flex-row.align-center > button:nth-child(1)")?.click();
        //     document.querySelector("div > div > app-air-drop-bonus > div > div > div.top-close-button-container > button")?.click();
        //     document.querySelector("div > div > app-air-drop-bonus > div > div > div.top-close-button-container > button")?.click();
        //     document.querySelector("div > div > booster-upgrade > div > div > div.top-close-button-container > button")?.click();
        //     document.querySelector("div > div > app-invite-friends-for-gold > div > button")?.click();
        //     document.querySelector("div > div > app-install-aac-offer > div > button")?.click();
        //     document.querySelector("div > div > app-buy-spins > div > button")?.click();
        //     document.querySelector("div > div > app-invite-friends-personal-offer > div > button")?.click();
        //     document.querySelector("div > div > app-invite-friends-personal-offer > div > button")?.click();
        //     document.querySelector("div > div > app-buy-spins > div > button")?.click();
        //     document.querySelector("div > div > app-event-milestones > div > div > div.top-close-button-container > button")?.click();
        //     document.querySelector("div > div > app-buy-gold > div > button")?.click();
        // }, 1000); 
        //             })()`,
        // });






        // find and click settings

        // const jsInjection = fs.readFileSync('./utils/injection/JS_injection.js', 'utf8');
        // await client.Runtime.evaluate({ expression: jsInjection });
        // await sessionIframe.Runtime.evaluate({ expression: jsInjection });


        // await sleep(2000);
        // await sleep(2000);
        // await sleep(2000);
        // await cursorActionClient.moveToSelector({ selector: "#column-left > div > div > div.sidebar-header.can-have-forum > div.sidebar-header__btn-container > button" });

        // let { result: settingsPosition } = await Runtime.evaluate({
        //     expression: `(()=>{
        //         const main = document.querySelectorAll("#column-left > div > div > div.sidebar-header.can-have-forum > div.sidebar-header__btn-container > button > div.btn-menu.bottom-right.has-footer.active.was-open > div");
        //         const a = Array.from(main).findIndex(element => element.textContent.includes('Saved Message'));
        //         return a;
        //     })()`
        // });
        // await cursorActionClient.moveToSelector({ selector: `#column-left > div > div > div.sidebar-header.can-have-forum > div.sidebar-header__btn-container > button > div.btn-menu.bottom-right.has-footer.active.was-open > div:nth-child(${settingsPosition.value + 1})` });


        // await waitForInput()


        // const { result: iframeResult } = await client.Runtime.evaluate({
        //     expression: `(() => {
        //         let rect = document.querySelector('iframe')?.getBoundingClientRect();
        //         if (rect && rect.width > 0) return JSON.parse(JSON.stringify(rect));
        //         throw "error";
        //     })()`,
        //     returnByValue: true,
        // });
        // const { height, width } = iframeResult.value;
        // let x = width / 2;
        // let y = height;
        // let i = 10

        // let count = 0;
        // while (i > 1) {
        //     await cursorActionIframe.moveTo({ x: x - 100, y: y - 40 });
        //     // await cursorActionIframe.moveTo({ x, y: y - 15 });
        //     // await cursorActionIframe.moveTo({ x: x + 80, y: y - 30 });
        //     await sleep(5000);
        //     // count++;
        //     // if (count > 20) {
        //     //     await waitForInput()
        //     //     count = 0;
        //     // }
        // }












        // //     // nang cap bums
        // await waitForInput();
        // await sessionIframe.Runtime.evaluate({
        //     expression: `
        // (async ()=>{
        //     const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

        //     while (true) {
        //         let list = document.querySelectorAll('#van-tab-3 > div > .Item:not(.upgrade-item-active)');
        //         // let list = document.querySelectorAll('#van-tab-4 > div > .Item:not(.upgrade-item-active)');
        //         // let list = [...document.querySelectorAll('#van-tab-4 > div > .Item:not(.upgrade-item-active)'), ...document.querySelectorAll('#van-tab-5 > div > .Item:not(.upgrade-item-active)')];
        //         console.log(list)
        //         for(x of list){
        //             x.click();
        //             await sleep(1000);
        //             document.querySelector("#app > div.page-container.show-bottomTabBar > div > div.van-popup.van-popup--round.van-popup--center.popp > div > div.content > div.btn > button")?.click()
        //             await sleep(1000);
        //             document.querySelector("#app > div.page-container.show-bottomTabBar > div > div.van-popup.van-popup--round.van-popup--center.popp > div > div.head > img")?.click()
        //             await sleep(1000);
        //         }        
        //         await sleep(1000);
        //     }
        // })() `
        // });



        await waitForInput();
        await client.close();
        await chrome.kill();
    } catch (error) {
        console.log(error);

        console.error("Error:", error.message);
        await waitForInput();
    }
}


(async () => {
    await processTasks(MainBrowser, {
        // stop: 15,
        // exclude: [],
        numTasksPerRun: 1,
        // columns: 9,
        delayDuration: 2000,
        callback: async () => {
            runCore = undefined;
        },
    })
    process.exit(0);
})();