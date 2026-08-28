(async () => {
    if (window.emulator_touch) return;
    window.emulator_touch = true;

    const attachListener = () => {
        const box = document.createElement('p-touch-pointer');
        const styleElement = document.createElement('style');
        styleElement.innerHTML = `
        p-touch-pointer {
          pointer-events: none;
          position: absolute;
          top: 0;
          z-index: 10000;
          left: 0;
          width: 20px;
          height: 20px;
          background: rgba(0,0,0,.4);
          border: 1px solid white;
          border-radius: 10px;
          box-sizing: border-box;
          margin: -10px 0 0 -10px;
          padding: 0;
          transition: background .2s, border-radius .2s, border-color .2s;
        }
        p-touch-pointer-active {
          background: rgba(0,0,0,0.9);
        }
        p-touch-pointer-hide {
          display: none;
        }
      `;
        document.head.appendChild(styleElement);
        document.body.appendChild(box);

        const updatePosition = (touch) => {
            box.style.left = `${touch.pageX}px`;
            box.style.top = `${touch.pageY}px`;
        };

        document.addEventListener(
            'touchstart',
            (event) => {
                const touch = event.touches[0];
                updatePosition(touch);
                box.classList.add('p-touch-pointer-active');
                box.classList.remove('p-touch-pointer-hide');
            },
            true
        );

        document.addEventListener(
            'touchmove',
            (event) => {
                const touch = event.touches[0];
                updatePosition(touch);
                box.classList.remove('p-touch-pointer-hide');
            },
            true
        );

        document.addEventListener(
            'touchend',
            (event) => {
                box.classList.add('p-touch-pointer-hide');
                box.classList.remove('p-touch-pointer-active');
            },
            true
        );

        document.addEventListener(
            'touchcancel',
            (event) => {
                box.classList.add('p-touch-pointer-hide');
                box.classList.remove('p-touch-pointer-active');
            },
            true
        );
    };

    if (document.readyState !== 'loading') {
        attachListener();
    } else {
        window.addEventListener('DOMContentLoaded', attachListener, false);
    }






    // document.addEventListener('mousedown', (e) => {
    //     const touchEvent = new TouchEvent('touchstart', {
    //         touches: [createTouch(e)],
    //         targetTouches: [createTouch(e)],
    //         changedTouches: [createTouch(e)],
    //         bubbles: true,
    //         cancelable: true,
    //     });
    //     e.target.dispatchEvent(touchEvent);
    // });

    // document.addEventListener('mousemove', (e) => {
    //     const touchEvent = new TouchEvent('touchmove', {
    //         touches: [createTouch(e)],
    //         targetTouches: [createTouch(e)],
    //         changedTouches: [createTouch(e)],
    //         bubbles: true,
    //         cancelable: true,
    //     });
    //     e.target.dispatchEvent(touchEvent);
    // });

    // document.addEventListener('mouseup', (e) => {
    //     const touchEvent = new TouchEvent('touchend', {
    //         touches: [],
    //         targetTouches: [],
    //         changedTouches: [createTouch(e)],
    //         bubbles: true,
    //         cancelable: true,
    //     });
    //     e.target.dispatchEvent(touchEvent);
    // });

    // function createTouch(e) {
    //     return new Touch({
    //         identifier: Date.now(),
    //         target: e.target,
    //         clientX: e.clientX,
    //         clientY: e.clientY,
    //         screenX: e.screenX,
    //         screenY: e.screenY,
    //         pageX: e.pageX,
    //         pageY: e.pageY,
    //         radiusX: 1,
    //         radiusY: 1,
    //         rotationAngle: 0,
    //         force: 0.5,
    //     });
    // }
})();

// (async () => {
//     const attachListener = () => {
//         const pointers = [];
//         const styleElement = document.createElement('style');
//         styleElement.innerHTML = `
//         p-touch-pointer {
//           pointer-events: none;
//           position: absolute;
//           top: 0;
//           z-index: 10000;
//           left: 0;
//           width: 20px;
//           height: 20px;
//           background: rgba(0,0,0,.4);
//           border: 1px solid white;
//           border-radius: 10px;
//           box-sizing: border-box;
//           margin: -10px 0 0 -10px;
//           padding: 0;
//           transition: background .2s, border-radius .2s, border-color .2s;
//         }
//         p-touch-pointer-active {
//           background: rgba(0,0,0,0.9);
//         }
//         p-touch-pointer-hide {
//           display: none;
//         }
//       `;

//         document.head.appendChild(styleElement);

//         // Create 5 pointers and append them to the body
//         for (let i = 0; i < 5; i++) {
//             const box = document.createElement('p-touch-pointer');
//             document.body.appendChild(box);
//             pointers.push(box);
//         }

//         const updatePosition = (touch, index) => {
//             const box = pointers[index];
//             if (box) {
//                 box.style.left = `${touch.pageX}px`;
//                 box.style.top = `${touch.pageY}px`;
//             }
//         };

//         document.addEventListener(
//             'touchstart',
//             (event) => {
//                 Array.from(event.touches).forEach((touch, index) => {
//                     if (pointers[index]) {
//                         updatePosition(touch, index);
//                         pointers[index].classList.add('p-touch-pointer-active');
//                         pointers[index].classList.remove('p-touch-pointer-hide');
//                     }
//                 });
//             },
//             true
//         );

//         document.addEventListener(
//             'touchmove',
//             (event) => {
//                 Array.from(event.touches).forEach((touch, index) => {
//                     if (pointers[index]) {
//                         updatePosition(touch, index);
//                         pointers[index].classList.remove('p-touch-pointer-hide');
//                     }
//                 });
//             },
//             true
//         );

//         document.addEventListener(
//             'touchend',
//             (event) => {
//                 Array.from(event.changedTouches).forEach((touch, index) => {
//                     if (pointers[index]) {
//                         pointers[index].classList.add('p-touch-pointer-hide');
//                         pointers[index].classList.remove('p-touch-pointer-active');
//                     }
//                 });
//             },
//             true
//         );

//         document.addEventListener(
//             'touchcancel',
//             (event) => {
//                 Array.from(event.changedTouches).forEach((touch, index) => {
//                     if (pointers[index]) {
//                         pointers[index].classList.add('p-touch-pointer-hide');
//                         pointers[index].classList.remove('p-touch-pointer-active');
//                     }
//                 });
//             },
//             true
//         );
//     };

//     if (document.readyState !== 'loading') {
//         attachListener();
//     } else {
//         window.addEventListener('DOMContentLoaded', attachListener, false);
//     }
// })();
