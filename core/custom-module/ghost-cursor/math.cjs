"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bezierCurveSpeed = exports.bezierCurve = exports.overshoot = exports.generateBezierAnchors = exports.randomVectorOnLine = exports.randomNumberRange = exports.setMagnitude = exports.unit = exports.magnitude = exports.perpendicular = exports.direction = exports.add = exports.mult = exports.div = exports.sub = exports.origin = void 0;
const bezier_js_1 = require("bezier-js");
exports.origin = { x: 0, y: 0 };
// maybe i should've just imported a vector library lol
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
exports.sub = sub;
const div = (a, b) => ({ x: a.x / b, y: a.y / b });
exports.div = div;
const mult = (a, b) => ({ x: a.x * b, y: a.y * b });
exports.mult = mult;
const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
exports.add = add;
const direction = (a, b) => (0, exports.sub)(b, a);
exports.direction = direction;
const perpendicular = (a) => ({ x: a.y, y: -1 * a.x });
exports.perpendicular = perpendicular;
const magnitude = (a) => Math.sqrt(Math.pow(a.x, 2) + Math.pow(a.y, 2));
exports.magnitude = magnitude;
const unit = (a) => (0, exports.div)(a, (0, exports.magnitude)(a));
exports.unit = unit;
const setMagnitude = (a, amount) => (0, exports.mult)((0, exports.unit)(a), amount);
exports.setMagnitude = setMagnitude;
const randomNumberRange = (min, max) => Math.random() * (max - min) + min;
exports.randomNumberRange = randomNumberRange;
const randomVectorOnLine = (a, b) => {
    const vec = (0, exports.direction)(a, b);
    const multiplier = Math.random();
    return (0, exports.add)(a, (0, exports.mult)(vec, multiplier));
};
exports.randomVectorOnLine = randomVectorOnLine;
const randomNormalLine = (a, b, range) => {
    const randMid = (0, exports.randomVectorOnLine)(a, b);
    const normalV = (0, exports.setMagnitude)((0, exports.perpendicular)((0, exports.direction)(a, randMid)), range);
    return [randMid, normalV];
};
const generateBezierAnchors = (a, b, spread) => {
    const side = Math.round(Math.random()) === 1 ? 1 : -1;
    const calc = () => {
        const [randMid, normalV] = randomNormalLine(a, b, spread);
        const choice = (0, exports.mult)(normalV, side);
        return (0, exports.randomVectorOnLine)(randMid, (0, exports.add)(randMid, choice));
    };
    return [calc(), calc()].sort((a, b) => a.x - b.x);
};
exports.generateBezierAnchors = generateBezierAnchors;
const clamp = (target, min, max) => Math.min(max, Math.max(min, target));
const overshoot = (coordinate, radius) => {
    const a = Math.random() * 2 * Math.PI;
    const rad = radius * Math.sqrt(Math.random());
    const vector = { x: rad * Math.cos(a), y: rad * Math.sin(a) };
    return (0, exports.add)(coordinate, vector);
};
exports.overshoot = overshoot;
const bezierCurve = (start, finish, 
/**
 * Default is length from start to finish, clamped to 2 < x < 200
 */
spreadOverride) => {
    // could be played around with
    const MIN_SPREAD = 2;
    const MAX_SPREAD = 200;
    const vec = (0, exports.direction)(start, finish);
    const length = (0, exports.magnitude)(vec);
    const spread = spreadOverride !== null && spreadOverride !== void 0 ? spreadOverride : clamp(length, MIN_SPREAD, MAX_SPREAD);
    const anchors = (0, exports.generateBezierAnchors)(start, finish, spread);
    return new bezier_js_1.Bezier(start, ...anchors, finish);
};
exports.bezierCurve = bezierCurve;
const bezierCurveSpeed = (t, P0, P1, P2, P3) => {
    const B1 = 3 * (1 - t) ** 2 * (P1.x - P0.x) + 6 * (1 - t) * t * (P2.x - P1.x) + 3 * t ** 2 * (P3.x - P2.x);
    const B2 = 3 * (1 - t) ** 2 * (P1.y - P0.y) + 6 * (1 - t) * t * (P2.y - P1.y) + 3 * t ** 2 * (P3.y - P2.y);
    return Math.sqrt(B1 ** 2 + B2 ** 2);
};
exports.bezierCurveSpeed = bezierCurveSpeed;
// console.log(bezierCurveSpeed(1, { x: 1, y: 2 }, { x: 1, y: 2 }, { x: 1, y: 2 }, { x: 1, y: 2 }));
