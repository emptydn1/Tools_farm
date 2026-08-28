import type { ElementHandle, Page, BoundingBox } from 'puppeteer';
import { type Vector } from './math';
export interface BoxOptions {
    /**
     * Percentage of padding to be added inside the element.
     * Example:
     * - `0` = may be anywhere within the element.
     * - `100` = will always be center of element.
     * @default 0
     */
    readonly paddingPercentage?: number;
}
export interface MoveOptions extends BoxOptions, Pick<PathOptions, 'moveSpeed'> {
    /**
     * Time to wait for the selector to appear in milliseconds.
     * Default is to not wait for selector.
     */
    readonly waitForSelector?: number;
    /**
     * Delay after moving the mouse in milliseconds. If `randomizeMoveDelay=true`, delay is randomized from 0 to `moveDelay`.
     * @default 0
     */
    readonly moveDelay?: number;
    /**
     * Randomize delay between actions from `0` to `moveDelay`. See `moveDelay` docs.
     * @default true
     */
    readonly randomizeMoveDelay?: boolean;
    /**
     * Maximum number of attempts to mouse-over the element.
     * @default 10
     */
    readonly maxTries?: number;
    /**
     * Distance from current location to destination that triggers overshoot to
     * occur. (Below this distance, no overshoot will occur).
     * @default 500
     */
    readonly overshootThreshold?: number;
}
export interface ClickOptions extends MoveOptions {
    /**
     * Delay before initiating the click action in milliseconds.
     * @default 0
     */
    readonly hesitate?: number;
    /**
     * Delay between mousedown and mouseup in milliseconds.
     * @default 0
     */
    readonly waitForClick?: number;
    /**
     * @default 2000
     */
    readonly moveDelay?: number;
}
export interface PathOptions {
    /**
     * Override the spread of the generated path.
     */
    readonly spreadOverride?: number;
    /**
     * Speed of mouse movement.
     * Default is random.
     */
    readonly moveSpeed?: number;
    /**
     * Generate timestamps for each point in the path.
     */
    readonly useTimestamps?: boolean;
}
export interface RandomMoveOptions extends Pick<MoveOptions, 'moveDelay' | 'randomizeMoveDelay' | 'moveSpeed'> {
    /**
     * @default 2000
     */
    readonly moveDelay?: number;
}
export interface MoveToOptions extends PathOptions, Pick<MoveOptions, 'moveDelay' | 'randomizeMoveDelay'> {
    /**
     * @default 0
     */
    readonly moveDelay?: number;
}
export interface GhostCursor {
    toggleRandomMove: (random: boolean) => void;
    click: (selector?: string | ElementHandle, options?: ClickOptions) => Promise<void>;
    moveTo: (destination: Vector, options?: MoveToOptions) => Promise<void>;
}
/** Get a random point on a browser window */
export declare const getRandomPagePoint: (page: Page) => Promise<Vector>;
/** Using this method to get correct position of Inline elements (elements like `<a>`) */
export declare function path(point: Vector, target: Vector, options?: number | PathOptions): any;
export declare function path(point: Vector, target: BoundingBox, options?: number | PathOptions): any;
export declare const createCursor: (page: Page, start?: Vector, performRandomMoves?: boolean, defaultOptions?: {
    /**
     * Default options for the `randomMove` function that occurs when `performRandomMoves=true`
     * @default RandomMoveOptions
     */
    randomMove?: RandomMoveOptions;
    /**
     * Default options for the `move` function
     * @default MoveOptions
     */
    move?: MoveOptions;
    /**
     * Default options for the `moveTo` function
     * @default MoveToOptions
     */
    moveTo?: MoveToOptions;
    /**
     * Default options for the `click` function
     * @default ClickOptions
     */
    click?: ClickOptions;
}) => GhostCursor;
