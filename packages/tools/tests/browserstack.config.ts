import cp from "child_process";
import BrowserStackLocal from "browserstack-local";
const clientPlaywrightVersion = cp.execSync("npx playwright --version").toString().trim().split(" ")[1];

// BrowserStack Specific Capabilities.
// Set 'browserstack.local:true For Local testing
const caps = {
    browser: "chrome",
    os: "osx",
    os_version: "catalina",
    name: "My first playwright test",
    build: "playwright-build",
    browser_version: "latest",
    "browserstack.username": process.env.BROWSERSTACK_USERNAME,
    "browserstack.accessKey": process.env.BROWSERSTACK_ACCESS_KEY,
    "browserstack.local": process.env.BROWSERSTACK_LOCAL || false,
    "client.playwrightVersion": clientPlaywrightVersion,
};

// replace YOUR_ACCESS_KEY with your key. You can also set an environment variable - "BROWSERSTACK_ACCESS_KEY".
export const BS_LOCAL_ARGS = {
    key: process.env.BROWSERSTACK_ACCESS_KEY,
};

export const bsLocal = new BrowserStackLocal.Local();

// Patching the capabilities dynamically according to the project name.
const patchCaps = (name: string, title: string) => {
    let combination = name.split(/@browserstack/)[0];
    let [browserCaps, osCaps] = combination.split(/:/);
    let [browser, browser_version] = browserCaps.split(/@/);
    let osCapsSplit = osCaps.split(/ /);
    let os = osCapsSplit.shift();
    let os_version = osCapsSplit.join(" ");
    caps.browser = browser ? browser : "chrome";
    caps.browser_version = browser_version ? browser_version : "latest";
    caps.os = os ? os : "osx";
    caps.os_version = os_version ? os_version : "catalina";
    caps.name = title;
};

export const getCdpEndpoint = (name: string, title: string) => {
    patchCaps(name, title);
    const cdpUrl = `wss://cdp.browserstack.com/playwright?caps=${encodeURIComponent(JSON.stringify(caps))}`;
    return cdpUrl;
};
