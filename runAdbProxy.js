// 





import { installApp, runProxyFromFile, stopVpn } from './utils/adb-proxy-utils.js';
// import Tesseract from "tesseract.js";
// import { distance } from "fastest-levenshtein";


const ports = [
    16448,
    16480,
    16512, 16544, 16576,
    16608, 16640, 16672, 16704, 16736,
    16768, 16800, 16832, 16864, 16896,
    16928, 16960, 16992, 17024, 17056
];

(async () => {
    let filePath = "C:\\Users\\huy\\Desktop\\Tools_farm\\data\\proxy.txt";
    let adbProxyPath = "C:\\Users\\huy\\Desktop\\Tools_farm\\data\\adbProxy.apk";
    // installApp(adbProxyPath, ports, true)
    runProxyFromFile(filePath, ports)

})();