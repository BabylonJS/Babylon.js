// const buildTools = require("@dev/build-tools");

// const engine = buildTools.checkArgs("--engine", false, true) || "webgl2";
// const headless = buildTools.checkArgs("--headless", true);
// const browser = buildTools.checkArgs("--browser", false, true) || "chrome";

// const puppeteer = require("puppeteer");

// jest has no support for CLI

const headless = process.env.HEADLESS === "true";
const browser = process.env.BROWSER || "chrome";
const gpuType = process.env.TEST_GPU || ""; // egl, desktop or nothing
const customFlags = process.env.CUSTOM_FLAGS ? process.env.CUSTOM_FLAGS.split(" ") : [];
const browserPath = process.env.BROWSER_PATH || "";
// for linux and WebGPU make sure to enable the following flags:
// --enable-unsafe-webgpu --enable-features=Vulkan,UseSkiaRenderer

const chromeFlags = [
    "--js-flags=--expose-gc",
    "--enable-unsafe-webgpu",
    ...customFlags,
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
    browserContext: process.env.BROWSER_CONTEXT || "default", // "incognito" or "default"
};