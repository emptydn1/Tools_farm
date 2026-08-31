import { fetchData } from '../utils/axios.js'


let proxies = [
"http://1209x63:x1140@160.250.47.53:37681		",
"http://1409d63:d1085@160.250.167.212:27780",
"http://1209x63:x1140@160.191.240.208:39550",
"http://1209x63:x1140@160.191.240.42:23737		",


];







(async () => {
    for (let x of proxies) {
        let data = await fetchData("https://api.ipify.org?format=json", "GET", { proxy: x });
        console.log(data, x);
    }
})()