import fs from "fs";
import path from "path";
import sharp from "sharp";

const inputFolder = "C:\\Users\\huy\\Desktop\\Tools_farm\\z-match-img\\z-lam_bst\\5x\\todoi\\temp";

const outputFolder = path.join(inputFolder, "cut");

async function main() {
    if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder, { recursive: true });
    }

    const files = fs.readdirSync(inputFolder);

    const imageFiles = files.filter(file =>
        /\.(png|jpg|jpeg|webp)$/i.test(file)
    );

    console.log(`Tìm thấy ${imageFiles.length} ảnh`);

    for (const file of imageFiles) {
        try {
            const inputPath = path.join(inputFolder, file);
            const outputPath = path.join(outputFolder, file);

            await sharp(inputPath)
                .extract({
                    left: 580,
                    top: 125,
                    width: 145,
                    height: 30
                })
                .png()
                .toFile(outputPath);

            console.log(`OK: ${file}`);
        } catch (error) {
            console.log(`LỖI: ${file} -> ${error.message}`);
        }
    }

    console.log("Đã xử lý xong!");
}

main();