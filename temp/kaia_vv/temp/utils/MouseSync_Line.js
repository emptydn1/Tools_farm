
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

        this.jsInjection = fs.readFileSync('./utils/injection/JS_injection.js', 'utf8');
        this.emulatorTouch = fs.readFileSync('./utils/injection/emulator_touch.js', 'utf8');
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
            let iframe1 = document.querySelector('iframe');
            let iframeDoc1 = iframe1.contentDocument || iframe1.contentWindow.document;
            
            iframeDoc1.addEventListener('keydown', (e) => {
                if (e.key === ']') console.log("runMouseSync");
                else if (e.key === '[') console.log("stopMouseSync");
                else if (e.key === 'n') console.log("reConnect");
                else if (e.key === 'i') console.log("start_click");
                else if (e.key === 'o') console.log("stop_click");

                else if (e.key === 'y') console.log("start_click2");
                else if (e.key === 'u') console.log("stop_click2");
                
                else if (e.key === 'f') console.log("start_fish");
                else if (e.key === 'g') console.log("stop_fish");
            });
        `;


        await newClient.Runtime.evaluate({ expression: script });

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
            }
        });

        this.syncMouse(newClient, isClient, isMobile);
    }

    syncMouse(newClient, isClient, isMobile) {
        let checkRunCore = setInterval(async () => {
            if (Number.isFinite(runCore)) {
                clearInterval(checkRunCore);
                console.log(runCore);


                try {
                    // await newClient.Runtime.evaluate({ expression: this.jsInjection });
                    // await newClient.Runtime.evaluate({ expression: this.emulatorTouch });

                    if (runCore === this.userProfileIndex) {
                        if (isClient) parentClient = newClient;
                        else childClient = newClient;

                        await newClient.Runtime.evaluate({ expression: this.eventScript() });
                    } else {
                        let iframeSize;

                        await this.setupEventListeners(isClient, newClient, iframeSize);
                    }
                } catch (evalError) {
                    console.error("Error evaluating scripts:", evalError);
                }
            }
        }, 2000);
    }

    eventScript() {
        return `
            let iframe = document.querySelector('iframe');
            let iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
             
        
            // Hàm gửi sự kiện
            const sendEvent = ({ type, clientX: x = 0, clientY: y = 0, button, deltaX = 0, deltaY = 0 }, keyEven = false) => {
                const buttonMap = ['left', 'middle', 'right'];
                console.log(JSON.stringify({
                    type,
                    x,
                    y,
                    button: button !== undefined ? buttonMap[button] || 'none' : 'none',
                    deltaX,
                    deltaY,
                    keyEven,
                }));
            };

            const eventMapping = {
                mousedown: sendEvent,
                mouseup: sendEvent,
                mousemove: sendEvent,
                wheel: sendEvent,

            };

            Object.entries(eventMapping).forEach(([eventType, handler]) => {
                iframeDoc.addEventListener(eventType, handler);
            });





            // Hàm gửi sự kiện phím
            const sendKeyEvent = ({ type, key, code, altKey, ctrlKey, shiftKey, metaKey }, keyEven = false) => {
                console.log(JSON.stringify({
                    type,
                    key,
                    code,
                    altKey,
                    ctrlKey,
                    shiftKey,
                    metaKey,
                    keyEven,
                }));
            };

            // Mapping các sự kiện phím
            const keyEventMapping = {
                keydown: sendKeyEvent,
                keyup: sendKeyEvent,
                // keypress: sendKeyEvent, // có thể không cần dùng, phụ thuộc use-case
            };

            Object.entries(keyEventMapping).forEach(([eventType, handler]) => {
                iframeDoc.addEventListener(eventType, (e) => handler(e, true));
            });
        `;
    }
    getSpecialKeyCode(key) {
        const map = {
            Enter: 13,
            Tab: 9,
            Escape: 27,
            Backspace: 8,
            ArrowLeft: 37,
            ArrowUp: 38,
            ArrowRight: 39,
            ArrowDown: 40,
            Delete: 46,
            Space: 32,
            Control: 17,
            Shift: 16,
            Alt: 18,
            Meta: 91,
        };
        return map[key] || 0;
    }

    async handleKeyboardEvent(client, event) {
        try {
            const { type, key, code, altKey, ctrlKey, shiftKey, metaKey } = event;

            const cdpType = type === 'keydown' ? 'keyDown'
                : type === 'keyup' ? 'keyUp'
                    : null;

            if (!cdpType) return console.warn("Unsupported key event type:", type);

            const windowsVirtualKeyCode = key.length === 1
                ? key.toUpperCase().charCodeAt(0)
                : this.getSpecialKeyCode(key);

            const modifiers = (altKey ? 1 : 0)
                | (ctrlKey ? 2 : 0)
                | (metaKey ? 4 : 0)
                | (shiftKey ? 8 : 0);

            await this.client.Input.dispatchKeyEvent({
                type: cdpType,
                key,
                code,
                windowsVirtualKeyCode,
                text: cdpType === 'keyDown' && key.length === 1 ? key : undefined,
                modifiers,
            });
        } catch (error) {
            console.error('Error processing event:', error.message);
        }
    }

    async handleMouseEvent(client, iframeSize = { x: 0, y: 0 }, event) {
        try {
            const { type, x, y, button, deltaX = 0, deltaY = 0 } = event;

            if (type === 'mousedown') {
                await client.Input.dispatchMouseEvent({ type: 'mousePressed', x, y, button, clickCount: 1 });
            } else if (type === 'mouseup') {
                await client.Input.dispatchMouseEvent({ type: 'mouseReleased', x, y, button, clickCount: 1 });
            } else if (type === 'mousemove') {
                await client.Input.dispatchMouseEvent({ type: 'mouseMoved', x, y });
            } else if (type === 'wheel') {
                await client.Input.dispatchMouseEvent({ type: 'mouseWheel', x, y, deltaX, deltaY });
            }
        } catch (error) {
            console.error('Error processing event:', error.message);
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

            try {
                const event = JSON.parse(message);
                if (event.keyEven) {
                    await this.handleKeyboardEvent(newClient, event);
                } else {
                    await this.handleMouseEvent(newClient, iframeSize, event);
                }
            } catch (error) {
                console.error('Error parsing event:', error.message);
            }
        });
    }
}