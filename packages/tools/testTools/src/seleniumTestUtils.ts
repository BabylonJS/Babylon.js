import type { ThenableWebDriver } from "selenium-webdriver";
import "selenium-webdriver/safari";
import { evaluateDisposeSceneForVisualization, evaluateInitEngineForVisualization, evaluatePrepareScene, evaluateRenderSceneForVisualization } from "./visualizationUtils";

export const macOSSafariCapabilities = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "bstack:options": {
        os: "OS X",
        osVersion: "Monterey",
        local: "false",
        seleniumVersion: "4.3.0",
        userName: process.env["BROWSERSTACK_USERNAME"],
        accessKey: process.env["BROWSERSTACK_ACCESS_KEY"],
    },
    browserName: "Safari",
    browserVersion: "latest",
};

// Take Playgorund Id and Selenium webdriver and load snippet info into test page
export const LoadPlayground = async (
    driver: ThenableWebDriver,
    pgId: string,
    globalConfig: { root: string; baseUrl: string; snippetUrl: string; pgRoot: string },
    framesToRender: number = 500
): Promise<void> => {
    await driver.executeScript(
        `
                var _globalConfig = {
                    'root': '${globalConfig.root}',
                    'baseUrl': '${globalConfig.baseUrl}',
                    'snippetUrl': '${globalConfig.snippetUrl}',
                    'pgRoot': '${globalConfig.pgRoot}}',
                };

                const evaluateInitEngineForVisualization = ${evaluateInitEngineForVisualization.toString()}
                const evaluatePrepareScene = ${evaluatePrepareScene.toString()}
                const evaluateRenderSceneForVisualization = ${evaluateRenderSceneForVisualization.toString()}

                globalThis.testSuccessful = false;

                await evaluateInitEngineForVisualization("webgl1", false, false, "${globalConfig.baseUrl}");
                await evaluatePrepareScene({playgroundId: "${pgId}"}, _globalConfig);
                evaluateRenderSceneForVisualization(${framesToRender});
            `
    );
};

// Given a test page with snippet information, check if globalThis.testSuccessful is true
export const CheckTestSuccessStatus = async (driver: ThenableWebDriver): Promise<boolean> => {
    return (await driver.executeScript(`
            const evaluateDisposeSceneForVisualization = ${evaluateDisposeSceneForVisualization.toString()}
            await evaluateDisposeSceneForVisualization({ forceUseReverseDepthBuffer: false, forceUseNonCompatibilityMode: false })

            return globalThis.testSuccessful;
        `)) as boolean;
};
