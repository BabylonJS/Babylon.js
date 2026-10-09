import { test, expect, Page } from "@playwright/test";
import { evaluateDisposeEngine, evaluateCreateScene, evaluateInitEngine, getGlobalConfig, logPageErrors } from "@tools/test-tools";

declare const BABYLON: typeof import("core/index");

interface Window {
    BABYLON: typeof BABYLON;
    scene: InstanceType<typeof BABYLON.Scene> | null;
}
declare const window: Window & typeof globalThis;

const debug = process.env.DEBUG === "true";
let page: Page;

test.describe("textureProcessor GPU numerics", () => {
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await page.goto(getGlobalConfig().baseUrl + `/empty.html`, { waitUntil: "load", timeout: 0 });
        await page.waitForSelector("#babylon-canvas", { timeout: 20000 });
        await page.waitForFunction(() => window.BABYLON);
        page.setDefaultTimeout(0);
        await logPageErrors(page, debug);
    });
    test.setTimeout(debug ? 1000000 : 30000);

    test.beforeEach(async () => {
        await page.goto(getGlobalConfig().baseUrl + `/empty.html`, { waitUntil: "load", timeout: 0 });
        await page.evaluate(evaluateInitEngine, {});
        await page.evaluate(evaluateCreateScene);
    });

    test.afterEach(async () => {
        await page.evaluate(evaluateDisposeEngine);
    });

    test.afterAll(async () => {
        await page.close();
    });

    // Byte-encoded (T, S) pairs close to full transmission. Quantizing the intermediate passes to
    // 8 bits puts the subsurface weight up to 4/255 off for these inputs, because the final
    // division by 1 - T(1 - S) amplifies the rounding.
    const transmissionBytes = [234, 232, 233, 239, 236, 240, 241, 255];
    const scatterBytes = [6, 5, 6, 7, 7, 8, 9, 13];

    test("ThinWalledScatterWeightsAsync textured results match constant results near T = 1", async () => {
        const result = await page.evaluate(
            async ({ transmissionBytes, scatterBytes }) => {
                const scene = window.scene!;
                const width = transmissionBytes.length;
                const createTexture = (name: string, bytes: number[]) => {
                    const data = new Uint8Array(width * 4);
                    bytes.forEach((v, i) => data.set([v, v, v, 255], i * 4));
                    const texture = BABYLON.RawTexture.CreateRGBATexture(data, width, 1, scene, false, false, BABYLON.Constants.TEXTURE_NEAREST_SAMPLINGMODE);
                    texture.name = name;
                    return texture;
                };
                const readRed = async (texture: InstanceType<typeof BABYLON.BaseTexture>) => {
                    const pixels = (await texture.readPixels()) as ArrayBufferView;
                    const scale = pixels instanceof Uint8Array ? 1 / 255 : 1;
                    const values = pixels as unknown as ArrayLike<number>;
                    return Array.from({ length: width }, (_, i) => values[i * 4] * scale);
                };

                const transmissionTexture = createTexture("T", transmissionBytes);
                const scatterTexture = createTexture("S", scatterBytes);
                const textured = await BABYLON.ThinWalledScatterWeightsAsync(
                    "textured",
                    BABYLON.CreateTextureOperand(transmissionTexture, BABYLON.TextureChannel.R),
                    BABYLON.CreateTextureOperand(scatterTexture, BABYLON.TextureChannel.R),
                    scene
                );
                const gpu = {
                    transmission: await readRed(textured.transmission.texture!),
                    subsurface: await readRed(textured.subsurface.texture!),
                };
                textured.transmission.dispose?.();
                textured.subsurface.dispose?.();
                transmissionTexture.dispose();
                scatterTexture.dispose();

                const cpu = { transmission: [] as number[], subsurface: [] as number[] };
                for (let i = 0; i < width; i++) {
                    const t = transmissionBytes[i] / 255;
                    const s = scatterBytes[i] / 255;
                    const constant = await BABYLON.ThinWalledScatterWeightsAsync(
                        "constant",
                        BABYLON.CreateFactorOperand(new BABYLON.Color4(t, t, t, 1)),
                        BABYLON.CreateFactorOperand(new BABYLON.Color4(s, s, s, 1)),
                        scene
                    );
                    cpu.transmission.push(constant.transmission.factor!.r);
                    cpu.subsurface.push(constant.subsurface.factor!.r);
                }
                return { gpu, cpu };
            },
            { transmissionBytes, scatterBytes }
        );

        // The outputs are 8-bit, so allow just over half a step of rounding in the final pass.
        const tolerance = 1.5 / 255;
        for (let i = 0; i < transmissionBytes.length; i++) {
            expect(Math.abs(result.gpu.transmission[i] - result.cpu.transmission[i]), `transmission weight at pixel ${i}`).toBeLessThanOrEqual(tolerance);
            expect(Math.abs(result.gpu.subsurface[i] - result.cpu.subsurface[i]), `subsurface weight at pixel ${i}`).toBeLessThanOrEqual(tolerance);
        }
    });
});
