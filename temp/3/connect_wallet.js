import fs from "fs-extra";
import readline from "readline";
import { fetchData } from "./utils/axios.js";

// (async () => {
//     let proxy = 'http://randomm:randomm@160.22.173.86:32454';
//     await fetchData("https://api.chillguyxmas.com/api/wallet-connect", "OPTIONS", {
//         headers: {
//             "accept": "*/*",
//             "accept-language": "en-US,en;q=0.9",
//             "access-control-request-headers": "content-type",
//             "access-control-request-method": "POST",
//             "priority": "u=1, i",
//             "sec-fetch-dest": "empty",
//             "sec-fetch-mode": "cors",
//             "sec-fetch-site": "same-site",
//             "origin": "https://chillguyxmas.com",
//             "Referer": "https://chillguyxmas.com/",
//             "Referrer-Policy": "strict-origin-when-cross-origin"
//         },
//         proxy,
//     })
//     let response = await fetchData("https://api.chillguyxmas.com/api/wallet-connect", "POST", {
//         headers: {
//             "accept": "application/json, text/plain, */*",
//             "accept-language": "en-US,en;q=0.9",
//             "content-type": "application/json",
//             "priority": "u=1, i",
//             "sec-ch-ua": "\"Apple WebKit\";v=\"604.1\"",
//             "sec-ch-ua-mobile": "?1",
//             "sec-ch-ua-platform": "\"iOS\"",
//             "sec-fetch-dest": "empty",
//             "sec-fetch-mode": "cors",
//             "sec-fetch-site": "same-site",
//             "Referer": "https://chillguyxmas.com/",
//             "Referrer-Policy": "strict-origin-when-cross-origin"
//         },
//         body: {
//             "telegramId": "8163054278",
//             "solAddress": "8VScLLpp3Xz19qZxZZvNct7GZYEQfTKzNaiFqN28kLfh"
//         },
//         proxy,
//     })

//     console.log(response)
// })()

// // let filePath = '1.json'
// // let data = [];

// // for (let i = 0; i < tasks.length; i++) {
// //     const element = tasks[i];
// //     data.push({ index: element, account: i + 2, address: '' });
// //     await fs.writeJson(filePath, data, { spaces: 2 });
// // }



// (async () => {
//     let dataJson = await fs.readJson('./2.json');
//     const data = await fs.readFile('./1.txt', 'utf8');
//     const lines = data.split('\n').map(line => line.trim().replace(/\r/g, ''));
    
//     let arr = [];

//     for (let i = 0; i < lines.length; i++) {
//         arr.push({ idPaw: lines[i], ...dataJson[i] })
//     }
//     await fs.writeJson('3.json', arr, { spaces: 2 });
// })()



// let wallet = dataJson.find(v => v.index == userProfileIndex)
// console.log(wallet)
// console.log(proxy)
// await fetchData(`https://api.paws.community/bridge/phantom/${wallet.idPaw}?address=${wallet.address}`, "OPTIONS", {
//     headers: {
//         "accept": "*/*",
//         "accept-language": "en-US,en;q=0.9",
//         "access-control-request-headers": "content-type",
//         "access-control-request-method": "GET",
//         "priority": "u=1, i",
//         "sec-fetch-dest": "empty",
//         "sec-fetch-mode": "cors",
//         "sec-fetch-site": "same-site",
//         "origin": "https://app.paws.community",
//         "referer": "https://app.paws.community/",
//         "Referrer-Policy": "strict-origin-when-cross-origin",
//         "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
//     },
//     proxy,
// })
// await fetchData(`https://api.paws.community/bridge/phantom/${wallet.idPaw}?address=${wallet.address}`, "GET", {
//     headers: {
//         "accept": "application/json",
//         "accept-encoding": "gzip, deflate, br, zstd",
//         "accept-language": "en-US,en;q=0.9",
//         "origin": "https://app.paws.community",
//         "priority": "u=1, i",
//         "referer": "https://app.paws.community/",
//         "sec-ch-ua": "\"Google Chrome\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
//         "sec-ch-ua-mobile": "?0",
//         "sec-ch-ua-platform": "\"Windows\"",
//         "sec-fetch-dest": "empty",
//         "sec-fetch-mode": "cors",
//         "sec-fetch-site": "same-site",
//         "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
//     },
//     proxy,
// })

