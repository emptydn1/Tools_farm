import fs from 'fs-extra';
import path from 'path';
import CDP from 'chrome-remote-interface';

import { runChrome } from '../../core/runChrome.mjs';
import { fetchData } from "../../utils/axios.js";

import { processTasks } from '../../utils/constant.js';
import { waitForInput, sleep } from '../../utils/utils.js';

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


const MainBrowser = async (userProfileIndex, proxy, positionX, positionY) => {
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
                '--force-device-scale-factor=0.67',
            ],
            url: "https://sosovalue.com/",
            accessIframe: false,
            clearCache: true,
            isMobile: true,
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
        // stop: 32,
        // exclude: [],
        numTasksPerRun: 3,
        // columns: 9,
        delayDuration: 2000,
        callback: async () => {
            runCore = undefined;
        },
    })
    process.exit(0);
})();