// const buildTools = require("@dev/build-tools");

// const engine = buildTools.checkArgs("--engine", false, true) || "webgl2";
// const headless = buildTools.checkArgs("--headless", true);
// const browser = buildTools.checkArgs("--browser", false, true) || "chrome";

// const puppeteer = require("puppeteer");

// jest has no support for CLI

const headless = process.env.HEADLESS === "true";
const browser = process.env.BROWSER || "chrome";
const engineType = process.env.TEST_ENGINE || "webgl2";
const gpuType = process.env.TEST_GPU || ""; // egl, desktop or nothing
const costumeFlags = engineType === "webgpu" ? ["--enable-unsafe-webgpu"] : [];
const browserPath = process.env.BROWSER_PATH || "";

// console.log(process.env, headless, gpuType);

const chromeFlags = [
    "--js-flags=--expose-gc",
    "--enable-unsafe-webgpu",
    // "--no-sandbox",
    // "--disable-setuid-sandbox",
    // // "--gpu",
    // "--enable-webgl2-compute-context",
    // "--enable-webgl-image-chromium",
    // // "--ignore-gpu-blocklist",
    // // "--enable-gpu-rasterization",
    // "--enable-zero-copy",
    // // "--disable-gpu-driver-bug-workarounds",
    // "--enable-gpu-compositing",
    // "--use-gl=egl",
    // "--use-gl=desktop",
    /*"--window-size=600x400",*/
    ...costumeFlags,
];

if(gpuType) {
    chromeFlags.push(`--use-gl=${gpuType}`);
}

// if(headless) {
    // chromeFlags.push("--use-gl=egl");
// }

const firefoxFlags = ["-wait-for-browser"];

module.exports = {
    launch: {
        dumpio: false, // should we see logs?
        timeout: 30000, // 30 seconds
        headless: headless, // false to open a browser
        product: browser,
        ignoreHTTPSErrors: true,
        // devtools: true,
        // channel: "chrome-canary",
        args: browser === "chrome" ? chromeFlags : firefoxFlags, // additional arguments for Chrome
        executablePath: browserPath,
    },
    browserContext: "default",
};