import fs from "fs-extra";
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from "child_process";


export const getFileInfo = (metaUrl) => {
    const __filename = fileURLToPath(metaUrl);
    const __dirname = path.dirname(__filename);
    return { __filename, __dirname };
};

let { __filename, __dirname } = getFileInfo(import.meta.url);

export const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export const readLinesToArray = () => {
    const lines = fs.readFileSync(`${__dirname}/../data/localStorage.txt`, 'utf-8').trim().split('\n');
    const array = [];
    lines.forEach(line => {
        const obj = {};
        const keyValuePairs = line.split('\t');
        keyValuePairs.forEach(pair => {
            if (pair) {
                const [key, value] = pair.split(': ');
                obj[key] = value;
            }
        });
        array.push(obj);
    });
    return array;
};

////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////

export const waitForInput = (keyword = "") => {
    let pathPython = path.join(__dirname, 'waitForInput.py')
    return new Promise(async (resolve) => {
        exec(`py ${pathPython} ${keyword}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Lỗi khi chạy file Python: ${error.message}`);
                resolve()
            }
            if (stderr) {
                console.error(`Lỗi từ file Python: ${stderr}`);
                resolve()
            }
            resolve()
        });
    });

}
////////////////////////////////////////////////////////////////////////////////////////////////
//                                       log color                                            //                                  
////////////////////////////////////////////////////////////////////////////////////////////////
const colors = {
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    brightRed: "\x1b[91m",
    brightGreen: "\x1b[92m",
    brightYellow: "\x1b[93m",
    brightBlue: "\x1b[94m",
    brightMagenta: "\x1b[95m",
    brightCyan: "\x1b[96m",
    white: "\x1b[97m",
    black: "\x1b[30m",
    gray: "\x1b[90m",
    brightGray: "\x1b[37m"
};

const reset = "\x1b[0m";

export function printFormattedTitle(title, colorName = "blue") {
    const color = colors[colorName] || colors.blue;

    const lineLength = 40; // Độ dài của dòng kẻ
    const paddingLength = Math.max(0, Math.floor((lineLength - title.length) / 2));
    const padding = ' '.repeat(paddingLength);

    console.log(color + "=".repeat(lineLength) + reset);
    console.log(color + padding + title + padding + reset);
    console.log(color + "=".repeat(lineLength) + reset);
}

export function log(message, colorName = 'red') {
    const color = colors[colorName] || colors.blue;

    // Tìm các chuỗi trong ngoặc vuông và tô màu chúng
    const regex = /\[(.*?)\]/g;
    let formattedMessage = message.replace(regex, (_, group) => {
        // Tô màu cho nội dung trong ngoặc vuông và bỏ ngoặc
        return `${color}${group}${reset}`;
    });

    console.log(formattedMessage);
}

////////////////////////////////////////////////////////////////////////////////////////////////
//                                      format time                                           //                                  
////////////////////////////////////////////////////////////////////////////////////////////////
export function formatTime(isoString) {
    const date = new Date(isoString);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Tháng bắt đầu từ 0
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    // Trả về định dạng "DD/MM/YYYY HH:MM:SS"
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

export const takeTimeEnd = (timeStart, addTime = 4 * 60 * 60 * 1000) => {
    const startTime = new Date(timeStart);
    const endTime = new Date(startTime.getTime() + addTime);
    const endTimeTimestamp = endTime.getTime();
    let now = Date.now()

    return [now, endTimeTimestamp]
}
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////

export const writeTimeToFile = async (name, time = 4) => {
    const startTime = new Date(Date.now());
    const endTime = new Date(startTime.getTime() + time * 61 * 60 * 1000);
    const endTimeTimestamp = endTime.getTime();

    log(`tiếp tục chạy lúc: [${formatTime(endTimeTimestamp)}]`, 'blue');

    let filePath = path.join(__dirname, '..', 'data', 'time.json');
    let data = (await fs.pathExists(filePath)) ? await fs.readJson(filePath) : [];
    data = data.filter(item => item.name !== name);
    data.push({ name, time: endTimeTimestamp, formatTime: formatTime(endTimeTimestamp) });
    await fs.writeJson(filePath, data, { spaces: 2 });
}