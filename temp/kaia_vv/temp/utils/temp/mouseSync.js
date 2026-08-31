
import fs from 'fs-extra';
import CDP from 'chrome-remote-interface';

import { sleep } from './utils.js';
import { checkPageLoad } from './cdp.js';

export let parentClient;
export let childClient;
export let runCore;

let isRunning = false;
let reConnect;

// các biến check cần thiết
let start_click = false;
let start_click2 = false;

let click_fish = false;

export const get_start_click = () => {
    return start_click;
}
export const set_start_click = (value) => {
    start_click = value;
}


export const get_start_click2 = () => {
    return start_click2;
}
export const get_click_fish = () => {
    return click_fish;
}

export const getRunCore = () => {
    return runCore;
}

export const resetAll = () => {
    runCore = undefined;
    isRunning = false;
    parentClient = undefined;
    childClient = undefined;
    reConnect = undefined;

    start_click = false;
    start_click2 = false;

    click_fish = false;
}

export class MouseSyncController {
    constructor({ client, userProfileIndex = null, index = 0 }) {
        this.client = client;
        this.userProfileIndex = userProfileIndex;
        this.index = index;

        this.jsInjection = fs.readFileSync('C:\\Users\\huy\\Desktop\\Tools_Farm\\utils\\injection\\JS_injection.js', 'utf8');
        this.emulatorTouch = fs.readFileSync('C:\\Users\\huy\\Desktop\\Tools_Farm\\utils\\injection\\emulator_touch.js', 'utf8');
    }

    async addNewIframes(targetId, chrome) {
        if ([runCore, reConnect].every(n => Number.isFinite(n)) && reConnect === this.userProfileIndex && targetId) {
            let sessionIframeNew = await CDP({ target: targetId, port: chrome.port });
            const { Page, Runtime, Input, DOM, Target, Network, Emulation } = sessionIframeNew;
            await Promise.all([Page.enable(), Network.enable(), Runtime.enable()]);
            this.syncMouse(sessionIframeNew, false, false);
            reConnect = undefined;
        }
    }

    async init(newClient, isClient = true, isMobile = false) {
        const script = `
            document.addEventListener('keydown', (e) => {
                if (e.key === ']') console.log("runMouseSync");
                else if (e.key === '[') console.log("stopMouseSync");
                else if (e.key === 'n') console.log("reConnect");
                else if (e.key === 'i') console.log("start_click");
                else if (e.key === 'o') console.log("stop_click");

                else if (e.key === 'y') console.log("start_click2");
                else if (e.key === 'u') console.log("stop_click2");
                
                else if (e.key === 'f') console.log("start_fish");
                else if (e.key === 'g') console.log("stop_fish");


                else if (e.key === 'm') console.log("user");
            });
        `;

        if (isClient) {
            await newClient.Page.addScriptToEvaluateOnNewDocument({ source: script });
            await newClient.Page.reload();
            await checkPageLoad({ client: newClient });
        } else {
            await newClient.Runtime.evaluate({ expression: script });
        }

        newClient.on('Runtime.consoleAPICalled', async ({ args }) => {
            const message = args[0]?.value;
            if (!message) return;

            if (message === 'runMouseSync') {
                runCore = this.userProfileIndex;
                isRunning = true;
                console.log(isRunning);
            } else if (message === 'stopMouseSync') {
                isRunning = false;
                console.log(isRunning);
            } else if (message === 'reConnect') {
                reConnect = this.userProfileIndex;
                console.log(reConnect, 'reConnect');
            } else if (message === 'start_click') {
                start_click = true;
                console.log(start_click, 'start_click');
            } else if (message === 'stop_click') {
                start_click = false;
                console.log(start_click, 'stop_click');
            } else if (message === 'start_click2') {
                start_click2 = true;
                console.log(start_click, 'start_click2');
            } else if (message === 'stop_click2') {
                start_click2 = false;
                console.log(start_click, 'stop_click2');
            } else if (message === 'start_fish') {
                click_fish = true;
                console.log(click_fish, 'start_fish');
            } else if (message === 'stop_fish') {
                click_fish = false;
                console.log(click_fish, 'stop_fish');
            } else if (message === 'user') {
                console.log(this.userProfileIndex, 'user');
            }
        });

        this.syncMouse(newClient, isClient, isMobile);
    }

    syncMouse(newClient, isClient, isMobile) {
        let checkRunCore = setInterval(async () => {
            if (Number.isFinite(runCore)) {
                clearInterval(checkRunCore);

                try {
                    await newClient.Runtime.evaluate({ expression: this.jsInjection });
                    await newClient.Runtime.evaluate({ expression: this.emulatorTouch });

                    if (runCore === this.userProfileIndex) {
                        if (isClient) parentClient = newClient;
                        else childClient = newClient;

                        await newClient.Runtime.evaluate({ expression: this.eventScript(isMobile) });
                    } else {
                        let iframeSize;

                        if (!isClient) {
                            let { result } = await this.client.Runtime.evaluate({
                                expression: `
                                     (() => {
                                         let rect = document.querySelector('iframe')?.getBoundingClientRect();
                                         return JSON.parse(JSON.stringify(rect));
                                     })()    
                                 `,
                                returnByValue: true,
                            });

                            iframeSize = result.value;
                        }

                        await this.setupEventListeners(isClient, newClient, iframeSize);
                    }
                } catch (evalError) {
                    console.error("Error evaluating scripts:", evalError);
                }
            }
        }, 2000);
    }

    eventScript(isIframe) {
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

                // lưu ý, khi chơi trên mobile thì chức năng của canvas sẽ bị thay đổi, vì vậy ta có thể dùng lắng nghe document mà k cần lắng nghe cụ thể canvas
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
                
                /////////////////////////////////// theo dõi sự kiện chuột trong canvas /////////////////////////////////////////
                // Hàm gán event cho một canvas
                function attachEventsToCanvas(canvas) {
                    Object.entries(eventMapping).forEach(([eventType, handler]) => {
                        canvas.addEventListener(eventType, handler);

                        // sung web, se xoa khi k can nua
                        canvas.addEventListener('keydown', (e) => {
                            if (e.key === ']') console.log("runMouseSync");
                            else if (e.key === '[') console.log("stopMouseSync");
                            else if (e.key === 'n') console.log("reConnect");
                            else if (e.key === 'i') console.log("start_click");
                            else if (e.key === 'o') console.log("stop_click");
                            
                            else if (e.key === 'y') console.log("start_click2");
                            else if (e.key === 'u') console.log("stop_click2");
                        });
                    });
                }

                // Gán event cho tất cả canvas có sẵn ngay khi script chạy
                document.querySelectorAll('canvas').forEach(attachEventsToCanvas);

                // Theo dõi khi có canvas mới xuất hiện trên trang để tự động gán event
                const observer = new MutationObserver(mutations => {
                    mutations.forEach(mutation => {
                        mutation.addedNodes.forEach(node => {
                            if (node.tagName === 'CANVAS') {
                                attachEventsToCanvas(node);
                            }
                        });
                    });
                });
                
                // Bắt đầu theo dõi toàn bộ document
                observer.observe(document.body, { childList: true, subtree: true });
            }
        `;
    }


    async handleEvent(client, iframeSize = { x: 0, y: 0 }, event) {
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
            // console.error('Error processing event:', error.message);
        }
    }

    async setupEventListeners(isClient, newClient, iframeSize) {
        let listener;
        while (!listener || typeof listener.on !== 'function') {
            listener = isClient ? parentClient : childClient;
            await sleep(1000);
        }

        listener.on('Runtime.consoleAPICalled', async ({ args }) => {
            const message = args[0]?.value;
            if (!message || !isRunning) return;

            // await sleep(this.index * 200);

            try {
                const event = JSON.parse(message);
                await this.handleEvent(newClient, iframeSize, event);
            } catch (error) {
                // console.error('Error parsing event:', error.message);
            }
        });
    }
}