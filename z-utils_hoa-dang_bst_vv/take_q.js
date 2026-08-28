import fs from "fs";
import { spawn } from "child_process";
import sharp from "sharp";
// import { sleep } from './utils/utils.js';
// import { findMatchingRegionsAndroids } from './utils/opencvNodejs.js';
import Tesseract from "tesseract.js";



const arg = process.argv[2];

(async () => {
    if (arg == "1") {
        const worker = await Tesseract.createWorker("vie");
        await worker.setParameters({ tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE });

        const arrTexts = [];
        for (let i = 202; i <= 312; i++) {
            const filePath = `C:\\Users\\huy\\Desktop\\tools_cdp\\file11\\${i}.png`;
            const buffer = fs.readFileSync(filePath);
            const croppedBuffer = await sharp(buffer)
                .extract({ left: 100, top: 310, width: 595, height: 40 })
                .resize({ width: 595 * 4, height: 40 * 4 })
                .toBuffer();
            // fs.writeFileSync("screenshot.png", croppedBuffer);

            const { data: ocrData } = await worker.recognize(croppedBuffer);

            if (ocrData.text) {
                arrTexts.push({ question: ocrData.text, answer: 0 });
            } else {
                console.log("khong có : " + i);
            }
        }
        await worker.terminate();
        fs.writeFileSync('questions.json', JSON.stringify(arrTexts), 'utf8');
    } else if (arg == "2") {    // besst
        const data = JSON.parse(fs.readFileSync("z.json", "utf8"));

        const map = new Map();

        for (const item of data) {
            map.set(item.question, item);
        }

        const result = Array.from(map.values());

        fs.writeFileSync("result.json", JSON.stringify(result, null, 4), "utf8");
    }
})();