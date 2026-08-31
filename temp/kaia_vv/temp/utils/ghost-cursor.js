import { sleep } from './utils.js';

const caculator = (rect) => {
    let x = rect.x + (rect.width / 2) + Math.random() * 4;
    let y = rect.y + (rect.height / 2) + Math.random() * 2;
    return { x, y, rect }
}

export class CursorActions {
    constructor(client, cursor, isMobile = false, input_main_frame) {
        this.client = client;
        this.cursor = cursor;
        this.isMobile = isMobile;
        this.input_main_frame = input_main_frame;
        this.valueOfIframeClient = { x: 10, y: 48 };
    }

    async evaluateSelector(selector, iframe) {
        const isObject = typeof selector === "object";
        const evaluateScript = (sel) => `
            (() => {
                let rect = document.querySelector('${sel}')?.getBoundingClientRect();
                if (rect && rect.width > 0) return JSON.parse(JSON.stringify(rect));
                throw "error";
            })()
        `;

        const { result } = await this.client.Runtime.evaluate({
            expression: isObject ? selector.script : evaluateScript(selector),
            returnByValue: true,
            ...(isObject && selector.additionalOptions),
        });

        if (!result || result.subtype === 'error' || result.value === 'error') return null;

        let iframeOffset = { x: 0, y: 0 };
        if (iframe) {
            // mục đích của biến này giúp ta xác định đc vị trí của iframe trên browser
            // đôi khi browser sẽ thay đổi vì vậy ta cần lấy lại giá trị của iframe để tính hướng đi của chuột
            // đã tối ưu cache giá trị, nên k cần phải luôn luôn khai báo client
            iframeOffset = this.valueOfIframeClient;
            if (typeof iframe === "object") {
                const { result: iframeResult } = await iframe.Runtime.evaluate({
                    expression: evaluateScript('iframe'),
                    returnByValue: true,
                });

                if (!iframeResult || iframeResult.subtype === 'error' || iframeResult.value === 'error') return null;

                this.valueOfIframeClient = caculator(iframeResult.value).rect;
                iframeOffset = this.valueOfIframeClient;
            }
        }

        let { x, y } = caculator(result.value);

        x += iframeOffset.x;
        y += iframeOffset.y;
        return { x, y };
    }

    async moveToSelector({ selector, maxWaitTime = null, iframe = null }) {
        const startTime = Date.now();
        while (true) {
            if (maxWaitTime !== null && (Date.now() - startTime) >= maxWaitTime) {
                console.log("Max wait time reached, stopping check.");
                break;
            }

            const position = await this.evaluateSelector(selector, iframe);
            if (!position) {
                await sleep(1000);
                continue;
            }

            if (this.isMobile) {
                await this.cursor.click(position, this.isMobile);
            } else {
                await this.cursor.moveTo(position);
                await this.cursor.click(position);
            }
            break;
        }
    }

    async dragAndDropToSelector({ selectorDrag, selectorDrop, maxWaitTime = null, iframe = null }) {
        const startTime = Date.now();
        while (true) {
            if (maxWaitTime !== null && (Date.now() - startTime) >= maxWaitTime) {
                console.log("Max wait time reached, stopping check.");
                break;
            }

            const dragPosition = await this.evaluateSelector(selectorDrag, iframe);
            const dropPosition = await this.evaluateSelector(selectorDrop, iframe);
            if (!dragPosition || !dropPosition) {
                await sleep(1000);
                continue;
            }

            await this.cursor.moveTo(dragPosition);
            await this.input_main_frame.dispatchMouseEvent({
                type: 'mousePressed',
                button: 'left',
                x: dragPosition.x,
                y: dragPosition.y,
                clickCount: 1,
            });
            await sleep(50);
            await this.cursor.moveTo(dropPosition);
            await this.input_main_frame.dispatchMouseEvent({
                type: 'mouseReleased',
                button: 'left',
                x: dropPosition.x,
                y: dropPosition.y,
                clickCount: 1,
            });

            // mobile
            // await this.client.dispatchTouchEvent({
            //     type: 'touchStart',
            //     touchPoints: [{
            //         x: selector.x,
            //         y: selector.y,
            //         radiusX: 6,
            //         radiusY: 6,
            //     }],
            // });
            // await this.cursor.moveTo(dropPosition);
            // await page.dispatchTouchEvent({
            //     type: 'touchEnd',
            //     touchPoints: [],
            // });
            break;
        }
    }




    async dragSelectorTimeout({ selectorDrag, maxWaitTime = 7000, iframe = null }) {
        const startTime = Date.now();
        while (true) {
            if (maxWaitTime !== null && (Date.now() - startTime) >= maxWaitTime) {
                console.log("Max wait time reached, stopping check.");
                break;
            }

            const dragPosition = await this.evaluateSelector(selectorDrag, iframe);
            if (!dragPosition) {
                await sleep(1000);
                continue;
            }

            await this.cursor.moveTo(dragPosition);
            await this.input_main_frame.dispatchMouseEvent({
                type: 'mousePressed',
                button: 'left',
                x: dragPosition.x,
                y: dragPosition.y,
                clickCount: 1,
            });

            // mobile

            await sleep(maxWaitTime);
            await this.input_main_frame.dispatchMouseEvent({
                type: 'mouseReleased',
                button: 'left',
                x: dragPosition.x,
                y: dragPosition.y,
                clickCount: 1,
            });
            break;
        }
    }




    async moveTo(rect) {
        let x = rect.x + (Math.random() * 2);
        let y = rect.y + (Math.random() * 2);
        await this.cursor.moveTo({ x, y });
        await this.cursor.click({ x, y });
    }
}









