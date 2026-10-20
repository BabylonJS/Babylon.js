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
    for (const floatRender of [true, false]) {
        test(`ThinWalledScatterWeightsAsync keeps T * S from a scaled alpha texture near T = 1 (float render ${floatRender})`, async () => {
            const result = await page.evaluate(async (floatRender) => {
                const scene = window.scene!;
                const caps = scene.getEngine().getCaps();
                if (!floatRender) {
                    // Without float render targets, any intermediate pass would be quantized to 8 bits.
                    caps.textureFloatRender = false;
                    caps.textureHalfFloatRender = false;
                }
                const width = 2;
                const createTexture = (name: string, rgb: number) => {
                    const data = new Uint8Array(width * 4);
                    for (let i = 0; i < width; i++) {
                        data.set([rgb, rgb, rgb, 255], i * 4);
                    }
                    const texture = BABYLON.RawTexture.CreateRGBATexture(data, width, 1, scene, false, false, BABYLON.Constants.TEXTURE_NEAREST_SAMPLINGMODE);
                    texture.name = name;
                    return texture;
                };
                const readRed = async (texture: InstanceType<typeof BABYLON.BaseTexture>) => {
                    const pixels = (await texture.readPixels()) as ArrayBufferView;
                    const scale = pixels instanceof Uint8Array ? 1 / 255 : 1;
                    return (pixels as unknown as ArrayLike<number>)[0] * scale;
                };

                const scatterStrength = 0.001;
                const transmissionTexture = createTexture("T", 255);
                // S comes from an alpha-one texture scaled by a scalar factor, as the loader stages it.
                const scatterTexture = createTexture("S", 0);
                const textured = await BABYLON.ThinWalledScatterWeightsAsync(
                    "textured",
                    BABYLON.CreateTextureOperand(transmissionTexture, BABYLON.TextureChannel.R),
                    BABYLON.CreateTextureWithFactorOperand(
                        scatterTexture,
                        new BABYLON.Color4(scatterStrength, scatterStrength, scatterStrength, scatterStrength),
                        BABYLON.TextureChannel.A
                    ),
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

                const constant = await BABYLON.ThinWalledScatterWeightsAsync(
                    "constant",
                    BABYLON.CreateFactorOperand(new BABYLON.Color4(1, 1, 1, 1)),
                    BABYLON.CreateFactorOperand(new BABYLON.Color4(scatterStrength, scatterStrength, scatterStrength, 1)),
                    scene
                );
                return { gpu, cpu: { transmission: constant.transmission.factor!.r, subsurface: constant.subsurface.factor!.r } };
            }, floatRender);

            const tolerance = 1.5 / 255;
            expect(result.cpu.subsurface).toBeCloseTo(1, 5);
            expect(Math.abs(result.gpu.transmission - result.cpu.transmission), "transmission weight").toBeLessThanOrEqual(tolerance);
            expect(Math.abs(result.gpu.subsurface - result.cpu.subsurface), "subsurface weight").toBeLessThanOrEqual(tolerance);
        });
    }
    // Zero multi-scatter albedo must convert to exactly zero single-scatter albedo at any anisotropy, whether it comes
    // from a black color texel or a zero scatter strength texel. Runs the GLSL shader on WebGL2 and the WGSL shader
    // on WebGPU.
    for (const engineName of ["webgl2", "webgpu"]) {
        for (const aniso of [0, 1]) {
            test(`MultiScatterToSingleScatterAlbedoAsync keeps zero endpoints at zero (${engineName}, anisotropy ${aniso})`, async () => {
                if (engineName === "webgpu") {
                    const hasWebGPU = await page.evaluate(async () => !!(await (navigator as any).gpu?.requestAdapter()));
                    test.skip(!hasWebGPU, "WebGPU is not available");
                    // The canvas already has a WebGL context, so start over on a fresh page.
                    await page.goto(getGlobalConfig().baseUrl + `/empty.html`, { waitUntil: "load", timeout: 0 });
                    await page.evaluate(evaluateInitEngine, { engineName });
                    await page.evaluate(evaluateCreateScene);
                }
                const result = await page.evaluate(async (aniso) => {
                    const scene = window.scene!;
                    const createTexture = (texels: number[][]) => {
                        const data = new Uint8Array(texels.flat());
                        return BABYLON.RawTexture.CreateRGBATexture(data, texels.length, 1, scene, false, false, BABYLON.Constants.TEXTURE_NEAREST_SAMPLINGMODE);
                    };
                    // Texel 0: black color, full strength. Texel 1: gray color, zero strength. Texel 2: nonzero reference.
                    const colorTexture = createTexture([
                        [0, 0, 0, 255],
                        [128, 128, 128, 255],
                        [128, 64, 200, 255],
                    ]);
                    const strengthTexture = createTexture([
                        [0, 0, 0, 255],
                        [0, 0, 0, 0],
                        [0, 0, 0, 255],
                    ]);
                    const multiScatter = await BABYLON.MultiplyTexturesAsync(
                        "multi-scatter",
                        BABYLON.CreateTextureOperand(strengthTexture, BABYLON.TextureChannel.A),
                        BABYLON.CreateTextureOperand(colorTexture),
                        scene
                    );
                    const singleScatter = await BABYLON.MultiScatterToSingleScatterAlbedoAsync("single-scatter", multiScatter, scene, aniso);
                    const pixels = Array.from((await singleScatter.texture!.readPixels()) as Uint8Array);
                    singleScatter.dispose?.();
                    colorTexture.dispose();
                    strengthTexture.dispose();

                    const constants: number[][] = [];
                    for (const color of [
                        [0, 0, 0],
                        [128 / 255, 64 / 255, 200 / 255],
                    ]) {
                        const constant = await BABYLON.MultiScatterToSingleScatterAlbedoAsync(
                            "constant",
                            BABYLON.CreateFactorOperand(new BABYLON.Color4(color[0], color[1], color[2], 1)),
                            scene,
                            aniso
                        );
                        constants.push([constant.factor!.r, constant.factor!.g, constant.factor!.b]);
                    }
                    return { isWebGPU: scene.getEngine().isWebGPU, pixels, constants };
                }, aniso);

                expect(result.isWebGPU).toBe(engineName === "webgpu");
                expect(result.constants[0]).toEqual([0, 0, 0]);
                expect(result.pixels.slice(0, 3), "black color texel").toEqual([0, 0, 0]);
                expect(result.pixels.slice(4, 7), "zero strength texel").toEqual([0, 0, 0]);
                for (let i = 0; i < 3; i++) {
                    expect(Math.abs(result.pixels[8 + i] - result.constants[1][i] * 255), `reference channel ${i}`).toBeLessThanOrEqual(1.5);
                }
            });
        }
    }
});
