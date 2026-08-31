import fs from 'fs-extra';
import path from 'path';
import CDP from 'chrome-remote-interface';

import { runChrome } from '../../core/runChrome.mjs';

import { processTasks } from '../../utils/constant.js';
import { waitForInput, sleep } from '../../utils/utils.js';

const args = process.argv.slice(2);

const MainBrowser = async (userProfileIndex, proxy, positionX, positionY) => {
  try {
    let { chrome, cursor, cursorSession, client, cursorActionClient, sessionIframe, cursorActionIframe, iframes, workers } = await runChrome({
      userProfileIndex,
      proxy,
      args: [
        `--window-position=${positionX},${positionY}`,
        // '--window-size=2000,980',
        '--window-size=400,780',
        '--force-device-scale-factor=0.67',
        // '--auto-open-devtools-for-tabs',
      ],
      url: "https://web.telegram.org/k/#@BlumCryptoBot",
      // accessIframe: false,
      // waitIframe: false,
      isMobile: true,
    });

    await cursorActionIframe.moveToSelector({ selector: '#app > div.layout-tabs.tabs > a:nth-child(1)', iframe: client });
    await cursorActionIframe.moveToSelector({ selector: '#app > div.layout-tabs.tabs > a:nth-child(1)', maxWaitTime: 2000, iframe: true });

    //     await sessionIframe.Runtime.evaluate({
    //       expression: `(() => {

    //   if (window.BlumAC) return;
    //   window.BlumAC = true;

    //   const autoPlay = true;
    //   const gc = [208, 216, 0];
    //   const t = 5;

    //   if (autoPlay) {
    //     setInterval(() => {
    //       const playButton = document.querySelector("button.is-primary, .play-btn");
    //       if (!playButton) return;
    //       if (!playButton.textContent.toLowerCase().includes("play")) return;
    //       playButton.click();
    //     }, 5000)
    //   }

    //   setInterval(() => {
    //     const canvas = document.querySelector("canvas");
    //     if (canvas) findAndClickObjects(canvas);
    //   }, 100);

    //   function findAndClickObjects(screenCanvas) {
    //     const context = screenCanvas.getContext('2d');
    //     const width = screenCanvas.width;
    //     const height = screenCanvas.height;
    //     const imageData = context.getImageData(0, 0, width, height);
    //     const pixels = imageData.data;

    //     for (let x = 0; x < width; x += 1) {
    //       for (let y = 0; y < height; y += 1) {
    //         if (y < 70) continue;

    //         const index = (y * width + x) * 4;
    //         const r = pixels[index];
    //         const g = pixels[index + 1];
    //         const b = pixels[index + 2];

    //         const greenRange = (gc[0] - t < r && r < gc[0] + t) && (gc[1] - t < g && g < gc[1] + t) && (gc[2] - t < b && b < gc[2] + t);

    //         if (greenRange) {
    //           simulateClick(screenCanvas, x, y);
    //         }
    //       }
    //     }
    //   }

    //   function simulateClick(canvas, x, y) {
    //     const prop = {
    //       clientX: x,
    //       clientY: y,
    //       bubbles: true
    //     };
    //     canvas.dispatchEvent(new MouseEvent('click', prop));
    //     canvas.dispatchEvent(new MouseEvent('mousedown', prop));
    //     canvas.dispatchEvent(new MouseEvent('mouseup', prop));
    //   }

    // })();`,
    //     });




    await sessionIframe.Runtime.evaluate({
      expression: `(() => {
          if (window.BlumAC) return;
          window.BlumAC = true;

          const autoPlay = true;
          const targetColors = [
              { rgb: [208, 216, 0], tolerance: 5 },
              { rgb: [255, 255, 255], tolerance: 5 },
              { rgb: [253, 63, 204], tolerance: 5 },
              { rgb: [160, 103, 64], tolerance: 5 },
              { rgb: [52, 112, 31], tolerance: 5 },
          ];

          if (autoPlay) {
              setInterval(() => {
                  const playButton = document.querySelector("button.is-primary, .play-btn");
                  if (!playButton) return;
                  if (!playButton.textContent.toLowerCase().includes("play")) return;
                  playButton.click();
              }, 5000);
          }

          setInterval(() => {
              const canvas = document.querySelector("canvas");
              if (canvas) findAndClickObjects(canvas);
          }, 100);

          function findAndClickObjects(screenCanvas) {
              const context = screenCanvas.getContext('2d');
              const width = screenCanvas.width;
              const height = screenCanvas.height;
              const imageData = context.getImageData(0, 0, width, height);
              const pixels = imageData.data;

              for (let x = 0; x < width; x += 1) {
                  for (let y = 0; y < height; y += 1) {
                      if (y < 70) continue;

                      const index = (y * width + x) * 4;
                      const r = pixels[index];
                      const g = pixels[index + 1];
                      const b = pixels[index + 2];

                      for (const { rgb, tolerance } of targetColors) {
                          const [tr, tg, tb] = rgb;
                          if (
                              (tr - tolerance < r && r < tr + tolerance) &&
                              (tg - tolerance < g && g < tg + tolerance) &&
                              (tb - tolerance < b && b < tb + tolerance)
                          ) {
                              simulateClick(screenCanvas, x, y);
                              break;
                          }
                      }
                  }
              }
          }

          function simulateClick(canvas, x, y) {
              const prop = {
                  clientX: x,
                  clientY: y,
                  bubbles: true
              };
              canvas.dispatchEvent(new MouseEvent('click', prop));
              canvas.dispatchEvent(new MouseEvent('mousedown', prop));
              canvas.dispatchEvent(new MouseEvent('mouseup', prop));
          }
    })();`,
    });

    await waitForInput();
    await client.close();
    await chrome.kill();
  } catch (error) {
    console.log(error);

    console.error("Error:", error.message);
    await waitForInput();
  }
}

(async () => {
  await processTasks(MainBrowser, {
    columns: 5,
    delayDuration: 2000,
  })
  process.exit(0);
})();
