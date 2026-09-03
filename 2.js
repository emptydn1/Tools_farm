import fs from "fs";
import { spawn } from "child_process";
import sharp from "sharp";
import { sleep } from './utils/utils.js';
import { findMatchingRegionsAndroids } from './utils/opencvNodejs.js';
import readline from "readline";


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


function question(text) {
    return new Promise(resolve => {
        rl.question(text, resolve);
    });
}


async function init() {
    let input1;
    let input2;
    let arr1;
    let arr2;

    // Nhập lần 1
    while (true) {
        input1 = await question("Nhập lần 1: ");
        arr1 = input1.split("-");
        if (arr1.length >= 3) break;
        console.log("❌ Nhập sai! Phải có dạng: 1-hoangdnvn-10");
    }

    // Nhập lần 2
    while (true) {
        input2 = await question("Nhập lần 2: ");
        arr2 = input2.split("-");
        if (arr2.length >= 3) break;
        console.log("❌ Nhập sai! Phải có dạng: 3-hoangdnvn-13");
    }

    const start = parseInt(arr1[0]);
    const name = arr1[1];
    const end = parseInt(arr2[0]);

    const startNumber = parseInt(arr1[2]);
    const endNumber = parseInt(arr2[2]);

    const accounts = [];

    for (let i = start; i <= end; i++) {
        let temp = [];
        for (let j = startNumber; j <= endNumber; j++) {
            temp.push(`${i}${name}${j}`);
        }
        accounts.push(temp)
    }
    return accounts;
}
let a = await init()
console.log(a);
