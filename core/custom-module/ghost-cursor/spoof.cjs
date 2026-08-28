"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCursor = void 0;
exports.path = path;
const debug_1 = __importDefault(require("debug"));
const math_1 = require("./math.cjs");
const log = (0, debug_1.default)('ghost-cursor');
/** Helper function to wait a specified number of milliseconds  */
const delay = async (ms) => {
    if (ms < 1)
        return;
    return await new Promise((resolve) => setTimeout(resolve, ms));
};
/**
 * Calculate the amount of time needed to move from (x1, y1) to (x2, y2)
 * given the width of the element being clicked on
 * https://en.wikipedia.org/wiki/Fitts%27s_law
 */
const fitts = (distance, width) => {
    const a = 0;
    const b = 2;
    const id = Math.log2(distance / width + 1);
    return a + b * id;
};
/** Get a random point on a box */
// const getRandomBoxPoint = (
//     { x, y, width, height }: BoundingBox,
//     options?: BoxOptions
// ): Vector => {
//     let paddingWidth = 0
//     let paddingHeight = 0
//     if (
//         options?.paddingPercentage !== undefined &&
//         options?.paddingPercentage > 0 &&
//         options?.paddingPercentage <= 100
//     ) {
//         paddingWidth = (width * options.paddingPercentage) / 100
//         paddingHeight = (height * options.paddingPercentage) / 100
//     }
//     return {
//         x: x + paddingWidth / 2 + Math.random() * (width - paddingWidth),
//         y: y + paddingHeight / 2 + Math.random() * (height - paddingHeight)
//     }
// }
/** The function signature to access the internal CDP client changed in puppeteer 14.4.1 */
const getCDPClient = (page) => typeof page._client === 'function' ? page._client() : page._client;
/** Get a random point on a browser window */
// export const getRandomPagePoint = async (page: Page): Promise<Vector> => {
//     const targetId: string = (page.target() as any)._targetId
//     const window = await getCDPClient(page).send(
//         'Browser.getWindowForTarget',
//         { targetId }
//     )
//     return getRandomBoxPoint({
//         x: origin.x,
//         y: origin.y,
//         width: window.bounds.width ?? 0,
//         height: window.bounds.height ?? 0
//     })
// }
/** Using this method to get correct position of Inline elements (elements like `<a>`) */
// const getElementBox = async (
//     page: Page,
//     element: ElementHandle,
//     relativeToMainFrame: boolean = true
// ): Promise<BoundingBox | null> => {
//     const objectId = element.remoteObject().objectId
//     if (objectId === undefined) {
//         return null
//     }
//     try {
//         const quads = await getCDPClient(page).send('DOM.getContentQuads', {
//             objectId
//         })
//         const elementBox = {
//             x: quads.quads[0][0],
//             y: quads.quads[0][1],
//             width: quads.quads[0][4] - quads.quads[0][0],
//             height: quads.quads[0][5] - quads.quads[0][1]
//         }
//         if (!relativeToMainFrame) {
//             const elementFrame = await element.contentFrame()
//             const iframes =
//                 elementFrame != null
//                     ? await elementFrame.parentFrame()?.$$('xpath/.//iframe')
//                     : null
//             let frame: ElementHandle<Node> | undefined
//             if (iframes != null) {
//                 for (const iframe of iframes) {
//                     if ((await iframe.contentFrame()) === elementFrame) frame = iframe
//                 }
//             }
//             if (frame != null) {
//                 const boundingBox = await frame.boundingBox()
//                 elementBox.x =
//                     boundingBox !== null ? elementBox.x - boundingBox.x : elementBox.x
//                 elementBox.y =
//                     boundingBox !== null ? elementBox.y - boundingBox.y : elementBox.y
//             }
//         }
//         return elementBox
//     } catch (_) {
//         log('Quads not found, trying regular boundingBox')
//         return await element.boundingBox()
//     }
// }
// export function path(point: Vector, target: Vector, options?: number | PathOptions)
// export function path(point: Vector, target: BoundingBox, options?: number | PathOptions)
function path(start, end, options) {
    const optionsResolved = typeof options === 'number'
        ? { spreadOverride: options }
        : Object.assign({}, options);
    const DEFAULT_WIDTH = 100;
    const MIN_STEPS = 25;
    const width = 'width' in end && end.width !== 0 ? end.width : DEFAULT_WIDTH;
    const curve = (0, math_1.bezierCurve)(start, end, optionsResolved.spreadOverride);
    const length = curve.length() * 0.8;
    const speed = optionsResolved.moveSpeed !== undefined && optionsResolved.moveSpeed > 0
        ? (25 / optionsResolved.moveSpeed)
        : Math.random();
    const baseTime = speed * MIN_STEPS;
    const steps = Math.ceil((Math.log2(fitts(length, width) + 1) + baseTime) * 3);
    const re = curve.getLUT(steps);
    return clampPositive(re, optionsResolved);
}
const clampPositive = (vectors, options) => {
    const clampedVectors = vectors.map((vector) => ({
        x: Math.max(0, vector.x),
        y: Math.max(0, vector.y)
    }));
    return (options === null || options === void 0 ? void 0 : options.useTimestamps) === true ? generateTimestamps(clampedVectors, options) : clampedVectors;
};
const generateTimestamps = (vectors, options) => {
    var _a;
    const speed = (_a = options === null || options === void 0 ? void 0 : options.moveSpeed) !== null && _a !== void 0 ? _a : (Math.random() * 0.5 + 0.5);
    const timeToMove = (P0, P1, P2, P3, samples) => {
        let total = 0;
        const dt = 1 / samples;
        for (let t = 0; t < 1; t += dt) {
            const v1 = (0, math_1.bezierCurveSpeed)(t * dt, P0, P1, P2, P3);
            const v2 = (0, math_1.bezierCurveSpeed)(t, P0, P1, P2, P3);
            total += (v1 + v2) * dt / 2;
        }
        return Math.round(total / speed);
    };
    const timedVectors = vectors.map((vector) => (Object.assign(Object.assign({}, vector), { timestamp: 0 })));
    for (let i = 0; i < timedVectors.length; i++) {
        const P0 = i === 0 ? timedVectors[i] : timedVectors[i - 1];
        const P1 = timedVectors[i];
        const P2 = i === timedVectors.length - 1 ? timedVectors[i] : timedVectors[i + 1];
        const P3 = i === timedVectors.length - 1 ? timedVectors[i] : timedVectors[i + 1];
        const time = timeToMove(P0, P1, P2, P3, timedVectors.length);
        timedVectors[i] = Object.assign(Object.assign({}, timedVectors[i]), { timestamp: i === 0 ? Date.now() : timedVectors[i - 1].timestamp + time });
    }
    return timedVectors;
};
// const shouldOvershoot = (a: Vector, b: Vector, threshold: number): boolean =>
//     magnitude(direction(a, b)) > threshold
// const intersectsElement = (vec: Vector, box: BoundingBox): boolean => {
//     return (
//         vec.x > box.x &&
//         vec.x <= box.x + box.width &&
//         vec.y > box.y &&
//         vec.y <= box.y + box.height
//     )
// }
// const boundingBoxWithFallback = async (
//     page: Page,
//     elem: ElementHandle<Element>
// ): Promise<BoundingBox> => {
//     let box = await getElementBox(page, elem)
//     if (box == null) {
//         box = (await elem.evaluate((el: Element) =>
//             el.getBoundingClientRect()
//         )) as BoundingBox
//     }
//     return box
// }
const createCursor = (page, 
/**
 * Cursor start position.
 * @default { x: 0, y: 0 }
 */
start = math_1.origin, 
/**
 * Initially perform random movements.
 * If `move`,`click`, etc. is performed, these random movements end.
 * @default false
 */
performRandomMoves = false, defaultOptions = {}) => {
    // this is kind of arbitrary, not a big fan but it seems to work
    const OVERSHOOT_SPREAD = 10;
    const OVERSHOOT_RADIUS = 120;
    let previous = start;
    // Initial state: mouse is not moving
    let moving = false;
    // Move the mouse over a number of vectors
    const tracePath = async (vectors, moveDelay, abortOnMove = false) => {
        // const cdpClient = getCDPClient(page)
        const vectorsArray = Array.from(vectors);
        for (const v of vectorsArray) {
            try {
                // In case this is called from random mouse movements and the users wants to move the mouse, abort
                if (abortOnMove && moving) {
                    return;
                }
                //phan duoc them vao
                await page.dispatchMouseEvent({
                    type: 'mouseMoved',
                    x: v.x,
                    y: v.y,
                });
                // const dispatchParams: Protocol.Input.DispatchMouseEventRequest = {
                //     type: 'mouseMoved',
                //     x: v.x,
                //     y: v.y
                // }
                // if ('timestamp' in v) dispatchParams.timestamp = v.timestamp
                // await cdpClient.send('Input.dispatchMouseEvent', dispatchParams)
                await delay(moveDelay);
                previous = v;
            }
            catch (error) {
                // Exit function if the browser is no longer connected
                // if (!page.browser().isConnected()) return
                log('Warning: could not move mouse, error message:', error);
            }
        }
    };
    // Start random mouse movements. Function recursively calls itself
    // const randomMove = async (options?: RandomMoveOptions): Promise<void> => {
    //     const optionsResolved = {
    //         moveDelay: 2000,
    //         randomizeMoveDelay: true,
    //         ...defaultOptions?.randomMove,
    //         ...options
    //     } satisfies RandomMoveOptions
    //     try {
    //         if (!moving) {
    //             const rand = await getRandomPagePoint(page)
    //             await tracePath(path(previous, rand, optionsResolved), true)
    //             previous = rand
    //         }
    //         await delay(optionsResolved.moveDelay * (optionsResolved.randomizeMoveDelay ? Math.random() : 1))
    //         randomMove(options).then(
    //             (_) => { },
    //             (_) => { }
    //         ) // fire and forget, recursive function
    //     } catch (_) {
    //         log('Warning: stopping random mouse movements')
    //     }
    // }
    const actions = {
        toggleRandomMove(random) {
            moving = !random;
        },
        // getLocation(): Vector {
        //     return previous
        // },
        async click(selector, isMobile = false, options) {
            const optionsResolved = Object.assign(Object.assign({ moveDelay: 2000, hesitate: 0, waitForClick: 0, randomizeMoveDelay: true }, defaultOptions === null || defaultOptions === void 0 ? void 0 : defaultOptions.click), options);
            const wasRandom = !moving;
            actions.toggleRandomMove(false);
            // if (selector !== undefined) {
            //     await actions.move(selector, {
            //         ...optionsResolved,
            //         // apply moveDelay after click, but not after actual move
            //         moveDelay: 0
            //     })
            // }
            try {
                await delay(optionsResolved.hesitate);
                if (isMobile) {
                    if (typeof selector === 'object' && selector !== null && 'x' in selector && 'y' in selector) {
                        await page.dispatchTouchEvent({
                            type: 'touchStart',
                            touchPoints: [{
                                    x: selector.x,
                                    y: selector.y,
                                    radiusX: 6,
                                    radiusY: 6,
                                }],
                        });
                        await delay(optionsResolved.waitForClick);
                        await page.dispatchTouchEvent({
                            type: 'touchEnd',
                            touchPoints: [],
                        });
                    }
                }
                else {
                    // phan duoc them vao
                    if (typeof selector === 'object' && selector !== null && 'x' in selector && 'y' in selector) {
                        await page.dispatchMouseEvent({
                            type: 'mousePressed',
                            x: selector.x,
                            y: selector.y,
                            button: 'left',
                            clickCount: 1
                        });
                    }
                    // await page.mouse.down()
                    await delay(optionsResolved.waitForClick);
                    if (typeof selector === 'object' && selector !== null && 'x' in selector && 'y' in selector) {
                        await page.dispatchMouseEvent({
                            type: 'mouseReleased',
                            x: selector.x,
                            y: selector.y,
                            button: 'left',
                            clickCount: 1
                        });
                    }
                }
                // await page.mouse.up()
            }
            catch (error) {
                log('Warning: could not click mouse, error message:', error);
            }
            await delay(optionsResolved.moveDelay * (optionsResolved.randomizeMoveDelay ? Math.random() : 1));
            actions.toggleRandomMove(wasRandom);
        },
        // async move(
        //     selector: string | ElementHandle,
        //     options?: MoveOptions
        // ): Promise<void> {
        //     const optionsResolved = {
        //         moveDelay: 0,
        //         maxTries: 10,
        //         overshootThreshold: 500,
        //         randomizeMoveDelay: true,
        //         ...defaultOptions?.move,
        //         ...options
        //     } satisfies MoveOptions
        //     const wasRandom = !moving
        //     const go = async (iteration: number): Promise<void> => {
        //         if (iteration > (optionsResolved.maxTries)) {
        //             throw Error('Could not mouse-over element within enough tries')
        //         }
        //         actions.toggleRandomMove(false)
        //         let elem: ElementHandle<Element> | null = null
        //         if (typeof selector === 'string') {
        //             if (selector.startsWith('//') || selector.startsWith('(//')) {
        //                 selector = `xpath/.${selector}`
        //                 if (optionsResolved.waitForSelector !== undefined) {
        //                     await page.waitForSelector(selector, {
        //                         timeout: optionsResolved.waitForSelector
        //                     })
        //                 }
        //                 const [handle] = await page.$$(selector)
        //                 elem = handle.asElement() as ElementHandle<Element>
        //             } else {
        //                 if (optionsResolved.waitForSelector !== undefined) {
        //                     await page.waitForSelector(selector, {
        //                         timeout: optionsResolved.waitForSelector
        //                     })
        //                 }
        //                 elem = await page.$(selector)
        //             }
        //             if (elem === null) {
        //                 throw new Error(
        //                     `Could not find element with selector "${selector}", make sure you're waiting for the elements by specifying "waitForSelector"`
        //                 )
        //             }
        //         } else {
        //             // ElementHandle
        //             elem = selector
        //         }
        //         // Make sure the object is in view
        //         const objectId = elem.remoteObject().objectId
        //         if (objectId !== undefined) {
        //             try {
        //                 await getCDPClient(page).send('DOM.scrollIntoViewIfNeeded', {
        //                     objectId
        //                 })
        //             } catch (e) {
        //                 // use regular JS scroll method as a fallback
        //                 log('Falling back to JS scroll method', e)
        //                 await elem.evaluate((e) => e.scrollIntoView({ block: 'center' }))
        //                 await new Promise((resolve) => setTimeout(resolve, 2000)) // Wait a bit until the scroll has finished
        //             }
        //         }
        //         const box = await boundingBoxWithFallback(page, elem)
        //         const { height, width } = box
        //         const destination = getRandomBoxPoint(box, optionsResolved)
        //         const dimensions = { height, width }
        //         const overshooting = shouldOvershoot(
        //             previous,
        //             destination,
        //             optionsResolved.overshootThreshold
        //         )
        //         const to = overshooting
        //             ? overshoot(destination, OVERSHOOT_RADIUS)
        //             : destination
        //         await tracePath(path(previous, to, optionsResolved))
        //         if (overshooting) {
        //             const correction = path(to, { ...dimensions, ...destination }, {
        //                 ...optionsResolved,
        //                 spreadOverride: OVERSHOOT_SPREAD
        //             })
        //             await tracePath(correction)
        //         }
        //         previous = destination
        //         actions.toggleRandomMove(true)
        //         const newBoundingBox = await boundingBoxWithFallback(page, elem)
        //         // It's possible that the element that is being moved towards
        //         // has moved to a different location by the time
        //         // the the time the mouseover animation finishes
        //         if (!intersectsElement(to, newBoundingBox)) {
        //             return await go(iteration + 1)
        //         }
        //     }
        //     await go(0)
        //     actions.toggleRandomMove(wasRandom)
        //     await delay(optionsResolved.moveDelay * (optionsResolved.randomizeMoveDelay ? Math.random() : 1))
        // },
        async moveTo(destination, options) {
            const optionsResolved = Object.assign(Object.assign({ moveDelay: 0, randomizeMoveDelay: true }, defaultOptions === null || defaultOptions === void 0 ? void 0 : defaultOptions.moveTo), options);
            const wasRandom = !moving;
            actions.toggleRandomMove(false);
            await tracePath(path(previous, destination, optionsResolved), optionsResolved.moveDelay);
            actions.toggleRandomMove(wasRandom);
            await delay(optionsResolved.moveDelay * (optionsResolved.randomizeMoveDelay ? Math.random() : 1));
        }
    };
    // Start random mouse movements. Do not await the promise but return immediately
    // if (performRandomMoves) {
    //     randomMove().then(
    //         (_) => { },
    //         (_) => { }
    //     )
    // }
    return actions;
};
exports.createCursor = createCursor;
