import { evaluatePlaywrightVisTests } from "./visualizationPlaywright.utils";

evaluatePlaywrightVisTests(
    "webgl2",
    false,
    "webxr",
    false,
    false,
    true,
    false,
    {
        beforeScene: async (page) => {
            // add the IWER using a script tag
            await page.addScriptTag({
                url: "https://unpkg.com/iwer/build/iwer.min.js",
            });
            await page.evaluate(() => {
                const xrDevice = new (window as any).IWER.XRDevice((window as any).IWER.metaQuest3);
                xrDevice.installRuntime();
                xrDevice.stereoEnabled = true;
            });
        },
        beforeRender: async (page) => {
            console.log("beforeRender");
            await page.evaluate(() => {
                (window as any).onRenderCallback = () => {
                    // find the vr button
                    const vrButton = document.querySelector(".babylonVRicon");
                    if (vrButton) {
                        console.log("vrButton found");
                        // click the vr button
                        (vrButton as HTMLButtonElement).click();
                        (window as any).onRenderCallback = null;
                    }
                };
            });
        },
    },
    {
        width: 800,
        height: 400,
    }
);
