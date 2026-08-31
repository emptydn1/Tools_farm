// await sessionIframe.Runtime.evaluate({
//     expression: `
//             (function() {
//                 const style = document.createElement('style');
//                 style.type = 'text/css';
//                 style.id = 'disable-animation-style';  // Thêm ID để dễ kiểm tra
//                 style.innerHTML = \`
//                     *, *::before, *::after {
//                         animation: none !important;
//                         transition: none !important;
//                     }
//                 \`;
//                 document.head.appendChild(style);
//                 console.log('CSS disable animation style added');
//             })();
//     `
// });
(function () {
    const style = document.createElement('style');
    style.type = 'text/css';
    style.id = 'disable-animation-style';
    style.innerHTML = `
        *, *::before, *::after {
            animation: none !important;
            transition: none !important;
        }
    `;
    document.head.appendChild(style);
    console.log('CSS disable animation style added');
})();

