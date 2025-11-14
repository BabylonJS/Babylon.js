import * as path from "path";
import * as fs from "fs";

import { test, expect, Page } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";

type Dimensions = { width?: number; height?: number };

export const evaluateDevHostVisTests = async (testFileName = "config", logToConsole = true, logToFile = false, dimensions?: Dimensions) => {
    const timeout = process.env.TIMEOUT ? +process.env.TIMEOUT : 100000;

    if (process.env.TEST_FILENAME) {
        testFileName = process.env.TEST_FILENAME;
    }

    if (process.env.LOG_TO_CONSOLE) {
        logToConsole = process.env.LOG_TO_CONSOLE === "true";
    }

    const configPath = process.env.CONFIG_PATH || path.resolve(__dirname, "../visualization", testFileName + ".json");
    const rawJsonData = fs.readFileSync(configPath, "utf8");
    const config = JSON.parse(rawJsonData.replace(/^\uFEFF/, ""));

    const logPath = path.resolve(__dirname, `${testFileName}_devhost_log.txt`);
    const excludeRegexArray = process.env.EXCLUDE_REGEX_ARRAY ? process.env.EXCLUDE_REGEX_ARRAY.split(",") : [];

    const tests: any[] = config.tests.filter((t: any) => {
        if (!t.devHostQsps) return false;
        const externallyExcluded = excludeRegexArray.some((regex) => new RegExp(regex, "i").test(t.title));
        return !(externallyExcluded || t.excludeFromAutomaticTesting);
    });

    function log(msg: any, title?: string) {
        const titleToLog = title ? `[${title}]` : "";
        if (logToConsole) {
            // eslint-disable-next-line no-console
            console.log(titleToLog, msg);
        }
        if (logToFile) {
            fs.appendFileSync(logPath, titleToLog + " " + msg + "\n", "utf8");
        }
    }

    let page: Page;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await page.setViewportSize({ width: dimensions?.width || 600, height: dimensions?.height || 400 });
        page.setDefaultTimeout(0);
    });

    test.afterAll(async () => {
        await page.close();
    });

    test.beforeEach(async () => {
        // ensure a clean slate between tests
        await page.goto("about:blank");
    });

    for (const testCase of tests) {
        test(testCase.title, async () => {
            const { baseUrl } = getGlobalConfig({ root: config.root, usesDevHost: true });
            const url = buildUrlWithQsps(baseUrl, testCase.devHostQsps as string);

            log(`Navigating to ${url}`, testCase.title);
            test.setTimeout(timeout);

            // Navigate and wait for the page to settle. Prefer a deterministic selector if provided.
            await page.goto(url, { waitUntil: "load", timeout: 0 });

            if (testCase.readySelector) {
                await page.waitForSelector(testCase.readySelector, { state: "visible", timeout: 30000 });
            } else {
                // Fallback: network idle is a good general heuristic for pages that bootstrap themselves
                await page.waitForLoadState("networkidle", { timeout: 30000 });
            }

            // Optional small delay to allow last paints/animations to settle
            const delayMs = testCase.screenshotDelayMs ?? (process.env.SCREENSHOT_DELAY_MS ? +process.env.SCREENSHOT_DELAY_MS : 3000);
            if (delayMs > 0) {
                await page.waitForTimeout(delayMs);
            }

            await expect(page).toHaveScreenshot((testCase.referenceImage || testCase.title).replace(".png", "") + ".png", {
                timeout: 7000,
                threshold: process.env.SCREENSHOT_THRESHOLD ? +process.env.SCREENSHOT_THRESHOLD : 0.035,
                maxDiffPixelRatio: (testCase.errorRatio || (process.env.SCREENSHOT_MAX_PIXEL ? +process.env.SCREENSHOT_MAX_PIXEL : 1.1)) / 100,
            });
        });
    }
};

function buildUrlWithQsps(baseUrl: string, qsp: string): string {
    // qsp can be "?exp=...&foo=bar" or just "exp=...&foo=bar"
    const u = new URL(baseUrl.endsWith("/") ? baseUrl : baseUrl + "/");
    const q = qsp.startsWith("?") ? qsp.substring(1) : qsp;
    u.search = q;
    return u.toString();
}

// Minimal ambient declarations for the page context (optional safety)
declare global {
    interface Window {
        // Intentionally empty: page constructs its own content; no engine/scene assumptions here
    }
}
