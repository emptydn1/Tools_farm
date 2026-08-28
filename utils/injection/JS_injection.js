(async () => {
    // // // Hàm gửi sự kiện
    // const sendEvent = ({ type, clientX: x = 0, clientY: y = 0, button, deltaX = 0, deltaY = 0 }, iframe = false) => {
    //     const buttonMap = ['left', 'middle', 'right'];
    //     console.log(JSON.stringify({
    //         type,
    //         x,
    //         y,
    //         button: button !== undefined ? buttonMap[button] || 'none' : 'none',
    //         deltaX,
    //         deltaY,
    //         iframe,
    //     }));
    // };

    // // Xử lý mặc định cho client
    // const eventMapping = {
    //     mousedown: sendEvent,
    //     mouseup: sendEvent,
    //     mousemove: sendEvent,
    //     wheel: sendEvent,

    //     // touchstart: (e) => sendEvent(getTouchCoordinates(e)),
    //     // touchmove: (e) => sendEvent(getTouchCoordinates(e)),
    //     // touchend: (e) => sendEvent(getTouchCoordinates(e)),
    //     // touchcancel: (e) => sendEvent(getTouchCoordinates(e))
    // };

    // Object.entries(eventMapping).forEach(([eventType, handler]) => {
    //     document.addEventListener(eventType, handler);
    // });

    // const canvas = document.querySelector('canvas');
    // Object.entries(eventMapping).forEach(([eventType, handler]) => {
    //     canvas.addEventListener(eventType, handler);
    // });








    // a.scrollIntoView({ behavior: "smooth", block: "start" });
    // let size = a.getBoundingClientRect();
    // window.scrollTo({
    //     top: size.top + 200,
    //     behavior: "smooth"
    // });

    // 2 hàm xác đinh lại property này dùng để xác định vị trí chuột khi khi thu nhỏ và di chuyển browser
    // ví dụ chuột trong viewport là clientX còn window.screenX là phần browser đc kéo sang 1 góc tính từ trái sang từ đó ta xác định đc vị trí chuột chính xác
    // window.screenX là vị trí của trình duyệt (cứ thu nhỏ rồi di chuyển để biết)

    if (window.JS_injection) return;
    window.JS_injection = true;

    Object.defineProperty(MouseEvent.prototype, 'screenX', {
        get: function () {
            return this.clientX + window.screenX;
        }
    });
    Object.defineProperty(MouseEvent.prototype, 'screenY', {
        get: function () {
            return this.clientY + window.screenY;
        }
    });

    // mô phỏng con trỏ chuột
    const attachListener = () => {
        const box = document.createElement('p-mouse-pointer')
        const styleElement = document.createElement('style')
        styleElement.innerHTML = `
        p-mouse-pointer {
          pointer-events: none;
          position: absolute;
          top: 0;
          z-index: 10000;
          left: 0;
          width: 20px;
          height: 20px;
          background: rgba(0,0,0,.4);
          border: 1px solid red;
          border-radius: 10px;
          box-sizing: border-box;
          margin: -10px 0 0 -10px;
          padding: 0;
          transition: background .2s, border-radius .2s, border-color .2s;
        }
        p-mouse-pointer.button-1 {
          transition: none;
          background: rgba(0,0,0,0.9);
        }
        p-mouse-pointer.button-2 {
          transition: none;
          border-color: rgba(0,0,255,0.9);
        }
        p-mouse-pointer.button-3 {
          transition: none;
          border-radius: 4px;
        }
        p-mouse-pointer.button-4 {
          transition: none;
          border-color: rgba(255,0,0,0.9);
        }
        p-mouse-pointer.button-5 {
          transition: none;
          border-color: rgba(0,255,0,0.9);
        }
        p-mouse-pointer-hide {
          display: none
        }
      `
        document.head.appendChild(styleElement)
        document.body.appendChild(box)
        document.addEventListener(
            'mousemove',
            (event) => {
                // console.log("isTrusted: ", event.isTrusted);
                // console.log("x:" + String(event.pageX) + 'px')
                // console.log("y:" + String(event.pageY) + 'px')
                box.style.left = String(event.pageX) + 'px'
                box.style.top = String(event.pageY) + 'px'
                box.classList.remove('p-mouse-pointer-hide')
                updateButtons(event.buttons)
            },
            true
        )
        document.addEventListener(
            'mousedown',
            (event) => {
                updateButtons(event.buttons)
                box.classList.add('button-' + String(event.which))
                box.classList.remove('p-mouse-pointer-hide')
            },
            true
        )
        document.addEventListener(
            'mouseup',
            (event) => {
                updateButtons(event.buttons)
                box.classList.remove('button-' + String(event.which))
                box.classList.remove('p-mouse-pointer-hide')
            },
            true
        )
        document.addEventListener(
            'mouseleave',
            (event) => {
                updateButtons(event.buttons)
                box.classList.add('p-mouse-pointer-hide')
            },
            true
        )
        document.addEventListener(
            'mouseenter',
            (event) => {
                updateButtons(event.buttons)
                box.classList.remove('p-mouse-pointer-hide')
            },
            true
        )
        function updateButtons(buttons) {
            for (let i = 0; i < 5; i++) {
                box.classList.toggle('button-' + String(i), Boolean(buttons & (1 << i)))
            }
        }
    }
    if (document.readyState !== 'loading') {
        attachListener()
    } else {
        window.addEventListener('DOMContentLoaded', attachListener, false)
    }
})();



