import { Browser, expect, Page, test } from "@playwright/test";

import { getGlobalConfig } from "@tools/test-tools";

const ClickWaitTime = 5000;
const DefaultResumeOnPauseRetryInterval = 1000;
const StateChangeWaitTime = 500;
const StateWaitTime = 5000;

/**
 * Evaluates the given script in a page's `onLoad` event handler and returns the audio engine's state.
 * - The script should set the `window.audioEngineState` variable to the desired state.
 * @param browser the browser instance
 * @param onLoadScript the script to evaluate in the page's `onLoad` event handler
 * @param click set to `true` to simulate a user gesture by clicking on the page, or set to a function that takes the page as an argument and performs the click(s)
 * @returns a promise that resolves to the audio engine's state set on `window.audioEngineState` by the given onLoadScript
 */
async function evaluateStateTestScript(browser: Browser, onLoadScript: string, click: boolean | ((page: Page) => Promise<void>) = true): Promise<string> {
    const context = await browser.newContext();

    const page = await context.newPage();

    await page.route("http://run.test/script.html", async (route) => {
        route.fulfill({
            status: 200,
            contentType: "text/html",
            body: `
            <script src="${getGlobalConfig().baseUrl}/babylon.js"></script>
            <script>
                const onLoad = async () => {
                    ${onLoadScript}
                }
            </script>
            <body onLoad="onLoad()">
                <div id="content" style="height: 100%"></div>
            </body>
        `,
        });
    });

    await page.goto("http://run.test/script.html");

    if (typeof click === "boolean") {
        if (click) {
            await page.click("#content");
        }
    } else if (typeof click === "function") {
        await click(page);
    }

    await page.waitForFunction(() => (window as any).audioEngineState, { timeout: StateWaitTime });

    const state = await page.evaluate(() => {
        return (window as any).audioEngineState;
    });

    await page.close();

    return state;
}

/**
 * Notes:
 * - Calls to `page.evaluate(...)` are considered a user gesture that unlocks the web audio context.
 * - Firefox requires the `page.click` selector arg to have a leading `#` for id selectors.
 * - Firefox requires the element selected for `page.click` to have a non-zero width and height.
 */

test.describe("AudioEngineV2 state", () => {
    test('State should be "suspended" if no user gesture occurs', async ({ browser }) => {
        const state = await evaluateStateTestScript(
            browser,
            `
            const audioEngine = await BABYLON.CreateAudioEngineAsync();

            audioEngine.unlockAsync();

            setTimeout(() => {
                window.audioEngineState = audioEngine.state;
            }, ${StateChangeWaitTime});
            `,
            false
        );

        expect(state).toBe("suspended");
    });

    test('State should change to "running" on user gesture', async ({ browser }) => {
        const state = await evaluateStateTestScript(
            browser,
            `
            const audioEngine = await BABYLON.CreateAudioEngineAsync();

            document.addEventListener('click', async () => {
                setTimeout(() => {
                    window.audioEngineState = audioEngine.state;
                }, 500);
            });
        `
        );

        expect(state).toBe("running");
    });

    test('State should change to "running" on user gesture after engine is paused', async ({ browser }) => {
        const state = await evaluateStateTestScript(
            browser,
            `
            const audioEngine = await BABYLON.CreateAudioEngineAsync();

            audioEngine.unlockAsync();

            window.clickCount = 0;
            document.addEventListener('click', async () => {
                if (window.clickCount === 0) {
                    setTimeout(() => {
                        audioEngine.pauseAsync();
                        window.clickCount++;
                    }, ${StateChangeWaitTime});
                } else {
                    setTimeout(() => {
                        window.audioEngineState = audioEngine.state;
                    }, ${StateChangeWaitTime});
                }
            });
        `,
            async (page) => {
                await page.click("#content");
                await page.waitForFunction(() => (window as any).clickCount, { timeout: ClickWaitTime });

                await page.click("#content");
                await page.waitForFunction(() => (window as any).audioEngineState, { timeout: StateWaitTime });
            }
        );

        expect(state).toBe("running");
    });

    test('State should be "suspended" if `resumeOnInteraction` option is `false` and user gesture occurs', async ({ browser }) => {
        const state = await evaluateStateTestScript(
            browser,
            `
            const audioEngine = await BABYLON.CreateAudioEngineAsync({ resumeOnInteraction: false });

            audioEngine.unlockAsync();

            document.addEventListener('click', async () => {
                setTimeout(() => {
                    window.audioEngineState = audioEngine.state;
                }, ${StateChangeWaitTime});
            });
        `
        );

        expect(state).toBe("suspended");
    });

    test('State should be "suspended" if `resumeOnInteraction` option is `false` and user gesture occurs after engine is paused', async ({ browser, browserName }) => {
        const state = await evaluateStateTestScript(
            browser,
            `
            const audioEngine = await BABYLON.CreateAudioEngineAsync({ resumeOnInteraction: false });

            audioEngine.unlockAsync();

            window.clickCount = 0;
            document.addEventListener('click', async () => {
                if (window.clickCount === 0) {
                    setTimeout(() => {
                        audioEngine.pauseAsync();
                        window.clickCount++;
                    }, ${StateChangeWaitTime});
                } else {
                    setTimeout(() => {
                        window.audioEngineState = audioEngine.state;
                    }, ${StateChangeWaitTime});
                }
            });
        `,
            async (page) => {
                await page.click("#content");
                await page.waitForFunction(() => (window as any).clickCount, { timeout: ClickWaitTime });

                await page.click("#content");
                await page.waitForFunction(() => (window as any).audioEngineState, { timeout: StateWaitTime });
            }
        );

        expect(state).toBe("suspended");
    });

    test("State should stay paused before default resume interval has elapsed when engine is unlocked then paused", async ({ browser }) => {
        const state = await evaluateStateTestScript(
            browser,
            `
            const audioEngine = await BABYLON.CreateAudioEngineAsync();

            audioEngine.unlockAsync();

            document.addEventListener('click', async () => {
                setTimeout(() => {
                    audioEngine.pauseAsync();

                    setTimeout(() => {
                        window.audioEngineState = audioEngine.state;
                    }, ${StateChangeWaitTime});
                }, ${StateChangeWaitTime});
            });
        `
        );

        expect(state).toBe("suspended");
    });

    test("State should automatically resume after default resume interval has elapsed when engine is unlocked then paused", async ({ browser }) => {
        const state = await evaluateStateTestScript(
            browser,
            `
            const audioEngine = await BABYLON.CreateAudioEngineAsync();

            audioEngine.unlockAsync();

            document.addEventListener('click', async () => {
                setTimeout(() => {
                    // Suspend the audio context directly to avoid calling AudioEngineV2.pause, which gets handled differently.
                    audioEngine._audioContext.suspend();

                    setTimeout(() => {
                        window.audioEngineState = audioEngine.state;
                    }, ${DefaultResumeOnPauseRetryInterval + StateChangeWaitTime});
                }, ${StateChangeWaitTime});
            });
        `
        );

        expect(state).toBe("running");
    });

    test("State should not automatically resume when `resumeOnPause` option is `false` after default resume interval has elapsed when engine is unlocked then paused", async ({
        browser,
    }) => {
        const state = await evaluateStateTestScript(
            browser,
            `
            const audioEngine = await BABYLON.CreateAudioEngineAsync({ resumeOnPause: false });

            audioEngine.unlockAsync();

            document.addEventListener('click', async () => {
                setTimeout(() => {
                    audioEngine.pauseAsync();

                    setTimeout(() => {
                        window.audioEngineState = audioEngine.state;
                    }, ${DefaultResumeOnPauseRetryInterval + StateChangeWaitTime});
                }, ${StateChangeWaitTime});
            });
        `
        );

        expect(state).toBe("suspended");
    });

    test("State should automatically resume when `resumeOnPauseRetryInterval` option is `2000` after 2 seconds have elapsed when engine is unlocked then paused", async ({
        browser,
    }) => {
        const resumeOnPauseRetryInterval = 2000;

        const state = await evaluateStateTestScript(
            browser,
            `
            const audioEngine = await BABYLON.CreateAudioEngineAsync({ resumeOnPauseRetryInterval: ${resumeOnPauseRetryInterval} });
            
            audioEngine.unlockAsync();

            document.addEventListener('click', async () => {
                setTimeout(() => {
                    // Suspend the audio context directly to avoid calling AudioEngineV2.pause, which gets handled differently.
                    audioEngine._audioContext.suspend();

                    setTimeout(() => {
                        window.audioEngineState = audioEngine.state;
                    }, ${resumeOnPauseRetryInterval + StateChangeWaitTime});
                }, ${StateChangeWaitTime});
            });
        `
        );

        expect(state).toBe("running");
    });

    test("State should not automatically resume when `resumeOnPauseRetryInterval` option is `2000` after default resume interval has elapsed when engine is unlocked then paused", async ({
        browser,
    }) => {
        const resumeOnPauseRetryInterval = 2000;

        const state = await evaluateStateTestScript(
            browser,
            `
            const audioEngine = await BABYLON.CreateAudioEngineAsync({ resumeOnPauseRetryInterval: ${resumeOnPauseRetryInterval} });
            
            audioEngine.unlockAsync();

            document.addEventListener('click', async () => {
                setTimeout(() => {
                    audioEngine.pauseAsync();

                    setTimeout(() => {
                        window.audioEngineState = audioEngine.state;
                    }, ${resumeOnPauseRetryInterval + StateChangeWaitTime});
                }, ${StateChangeWaitTime});
            });
        `
        );

        expect(state).toBe("suspended");
    });
});
