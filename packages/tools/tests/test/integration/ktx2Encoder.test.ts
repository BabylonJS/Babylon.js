import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import { evaluateInitEngineForVisualization } from "../playwright/visualizationPlaywright.utils";
import { type KTX2Encoder } from "../../../ktx2Encoder/src/ktx2Encoder";

for (const engineName of ["webgl2", "webgpu"] as const) {
    test(`KTX2 texture readback preserves R and RG channels on ${engineName}`, async ({ page }) => {
        const { baseUrl } = getGlobalConfig();
        await page.goto(baseUrl + "/empty.html");
        await page.evaluate(evaluateInitEngineForVisualization, {
            engineName,
            useLargeWorldRendering: false,
            useReverseDepthBuffer: "false",
            useNonCompatibilityMode: "false",
            baseUrl,
        });
        await page.addScriptTag({ url: baseUrl + "/babylon.ktx2Encoder.js" });
        const result = await page.evaluate(async (baseUrl) => {
            const B = window.BABYLON;
            const scene = new B.Scene(window.engine!);
            B.KhronosTextureContainer2Encoder.URLConfig = {
                jsEncoderModule: baseUrl + "/babylon.ktx2Encoder.js",
                jsBasisEncoder: baseUrl + "/basisEncoder/v2_50/basis_encoder.js",
                wasmBasisEncoder: baseUrl + "/basisEncoder/v2_50/basis_encoder.wasm",
            };
            const encoder = new B.KhronosTextureContainer2Encoder(0);
            const inputs: number[][] = [];
            const prototype = (window as typeof window & { KTX2ENCODER: { KTX2Encoder: typeof KTX2Encoder } }).KTX2ENCODER.KTX2Encoder.prototype;
            const encode = prototype.encode;
            prototype.encode = async function (this: KTX2Encoder, rgba, width, height, options) {
                inputs.push(Array.from(rgba.slice(0, 4)));
                return await encode.call(this, rgba, width, height, options);
            };
            const urls: string[] = [];
            try {
                const results: number[][] = [];
                for (const [format, channels] of [
                    [B.Constants.TEXTUREFORMAT_R, [80]],
                    [B.Constants.TEXTUREFORMAT_RG, [80, 120]],
                ] as const) {
                    const texture = new B.RawTexture(Uint8Array.from(Array.from({ length: 16 }, () => channels).flat()), 4, 4, format, scene, false, false);
                    const encoded = await encoder._encodeAsync(texture, { usage: "data" });
                    const url = URL.createObjectURL(new Blob([encoded.slice().buffer]));
                    urls.push(url);
                    const decoded = new B.Texture(url, scene, { noMipmap: true, invertY: false, forcedExtension: ".ktx2" });
                    const pixels = await B.GetTextureDataAsync(decoded, 4, 4, 0, 0, false, 0, false);
                    results.push(Array.from(pixels.slice(0, 4)));
                }
                return { inputs, decoded: results };
            } finally {
                scene.dispose();
                window.engine!.dispose();
                window.engine = null;
                for (const url of urls) {
                    URL.revokeObjectURL(url);
                }
            }
        }, baseUrl);
        const expected = [
            [80, 0, 0, 255],
            [80, 120, 0, 255],
        ];
        expect(result.inputs).toEqual(expected);
        for (let index = 0; index < expected.length; index++) {
            expect(Math.max(...result.decoded[index].map((value, channel) => Math.abs(value - expected[index][channel])))).toBeLessThanOrEqual(8);
        }
    });
}

test("KTX2 texture encoding rejects integer textures before WebGL2 readback", async ({ page }) => {
    const { baseUrl } = getGlobalConfig();
    await page.goto(baseUrl + "/empty.html");
    await page.evaluate(evaluateInitEngineForVisualization, {
        engineName: "webgl2",
        useLargeWorldRendering: false,
        useReverseDepthBuffer: "false",
        useNonCompatibilityMode: "false",
        baseUrl,
    });
    const result = await page.evaluate(async () => {
        const B = window.BABYLON;
        const scene = new B.Scene(window.engine!);
        const texture = new B.RawTexture(new Uint8Array(64).fill(80), 4, 4, B.Constants.TEXTUREFORMAT_RGBA_INTEGER, scene, false, false, B.Texture.NEAREST_SAMPLINGMODE);
        const gl = window.canvas!.getContext("webgl2")!;
        try {
            const ready = texture.isReady();
            await new B.KhronosTextureContainer2Encoder(0)._encodeAsync(texture, { usage: "data" });
            return { ready, error: "Encoding unexpectedly succeeded", glError: gl.getError() };
        } catch (error) {
            return { ready: texture.isReady(), error: String(error), glError: gl.getError() };
        } finally {
            scene.dispose();
            window.engine!.dispose();
            window.engine = null;
        }
    });
    expect(result).toEqual({ ready: true, error: expect.stringContaining("integer texture formats"), glError: 0 });
});

for (const engineName of ["webgl1", "webgl2"] as const) {
    test(`KTX2 texture encoding rejects legacy alpha and luminance textures on ${engineName}`, async ({ page }) => {
        const { baseUrl } = getGlobalConfig();
        await page.goto(baseUrl + "/empty.html");
        await page.evaluate(evaluateInitEngineForVisualization, {
            engineName,
            useLargeWorldRendering: false,
            useReverseDepthBuffer: "false",
            useNonCompatibilityMode: "false",
            baseUrl,
        });
        const result = await page.evaluate(async () => {
            const B = window.BABYLON;
            const scene = new B.Scene(window.engine!);
            const gl = (window.canvas!.getContext("webgl2") ?? window.canvas!.getContext("webgl"))!;
            const encoder = new B.KhronosTextureContainer2Encoder(0);
            try {
                const results = [];
                for (const [format, channels] of [
                    [B.Constants.TEXTUREFORMAT_ALPHA, 1],
                    [B.Constants.TEXTUREFORMAT_LUMINANCE, 1],
                    [B.Constants.TEXTUREFORMAT_LUMINANCE_ALPHA, 2],
                ] as const) {
                    const texture = new B.RawTexture(new Uint8Array(16 * channels).fill(128), 4, 4, format, scene, false, false, B.Texture.NEAREST_SAMPLINGMODE);
                    try {
                        await encoder._encodeAsync(texture, { usage: "data" });
                        results.push({ ready: texture.isReady(), error: "Encoding unexpectedly succeeded", glError: gl.getError() });
                    } catch (error) {
                        results.push({ ready: texture.isReady(), error: String(error), glError: gl.getError() });
                    } finally {
                        texture.dispose();
                    }
                }
                return results;
            } finally {
                scene.dispose();
                window.engine!.dispose();
                window.engine = null;
            }
        });
        expect(result).toEqual(Array.from({ length: 3 }, () => ({ ready: true, error: expect.stringContaining("alpha or luminance texture formats on WebGL"), glError: 0 })));
    });
}

for (const shared of [false, true]) {
    test(`KTX2 texture encoding rejects a ${shared ? "shared " : ""}load failure after readiness waiting starts`, async ({ page }) => {
        const { baseUrl } = getGlobalConfig();
        let failImage!: () => void;
        const imageRequested = new Promise<void>((resolve) => {
            page.route("**/ktx2-missing-image.png", async (route) => {
                await new Promise<void>((release) => {
                    failImage = release;
                    resolve();
                });
                await route.fulfill({ status: 404, body: "Not found" });
            });
        });
        await page.goto(baseUrl + "/empty.html");
        await page.evaluate(evaluateInitEngineForVisualization, {
            engineName: "webgl2",
            useLargeWorldRendering: false,
            useReverseDepthBuffer: "false",
            useNonCompatibilityMode: "false",
            baseUrl,
        });
        const result = page.evaluate(async (shared) => {
            const B = window.BABYLON;
            const scene = new B.Scene(window.engine!);
            scene.useDelayedTextureLoading = shared;
            const texture = new B.Texture("/ktx2-missing-image.png", scene);
            scene.useDelayedTextureLoading = false;
            const original = shared ? new B.Texture("/ktx2-missing-image.png", scene) : texture;
            const internal = original.getInternalTexture()!;
            const internalObserversBefore = internal.onErrorObservable.observers.filter((observer) => !observer._willBeUnregistered).length;
            const observersBefore = B.Texture.OnTextureLoadErrorObservable.observers.filter((observer) => !observer._willBeUnregistered).length;
            try {
                await new B.KhronosTextureContainer2Encoder(0)._encodeAsync(texture, { usage: "color" });
                throw new Error("Encoding unexpectedly succeeded");
            } catch (error) {
                return {
                    error: String(error),
                    loadingError: texture.loadingError,
                    cleaned: B.Texture.OnTextureLoadErrorObservable.observers.filter((observer) => !observer._willBeUnregistered).length === observersBefore,
                    loadCleaned: !texture.onLoadObservable.hasObservers(),
                    shared: texture.getInternalTexture() === internal,
                    internalCleaned: internal.onErrorObservable.observers.filter((observer) => !observer._willBeUnregistered).length === internalObserversBefore,
                };
            } finally {
                scene.dispose();
                window.engine!.dispose();
                window.engine = null;
            }
        }, shared);
        await imageRequested;
        failImage();
        expect(await result).toMatchObject({
            error: expect.stringContaining("ktx2-missing-image.png"),
            loadingError: !shared,
            cleaned: true,
            loadCleaned: true,
            shared: true,
            internalCleaned: true,
        });
    });
}

test("KTX2 encoder lazily loads default assets and matches main-thread texture encoding", async ({ page }) => {
    const { baseUrl } = getGlobalConfig();
    const requests: string[] = [];
    await page.route("https://cdn.babylonjs.com/basisEncoder/v2_50/*", async (route) => {
        const pathname = new URL(route.request().url()).pathname;
        requests.push(pathname);
        const response = await page.request.get(baseUrl + pathname);
        await route.fulfill({ response, headers: { ...response.headers(), "access-control-allow-origin": "*" } });
    });
    await page.goto(baseUrl + "/empty.html");
    await page.evaluate(evaluateInitEngineForVisualization, {
        engineName: "webgl2",
        useLargeWorldRendering: false,
        useReverseDepthBuffer: "false",
        useNonCompatibilityMode: "false",
        baseUrl,
    });
    await page.addScriptTag({ url: baseUrl + "/babylon.ktx2Encoder.js" });
    const result = await page.evaluate(async (baseUrl) => {
        const B = window.BABYLON;
        const module = (window as typeof window & { KTX2ENCODER: { KTX2Encoder: new () => KTX2Encoder } }).KTX2ENCODER;
        const encoder = new module.KTX2Encoder();
        const pixels = new Uint8Array(64).fill(128);
        const options = { usage: "color", generateMipmaps: false } as const;
        const output = await encoder.encode(pixels, 4, 4, options);
        B.KhronosTextureContainer2Encoder.URLConfig = {
            jsEncoderModule: baseUrl + "/babylon.ktx2Encoder.js",
            jsBasisEncoder: baseUrl + "/basisEncoder/v2_50/basis_encoder.js",
            wasmBasisEncoder: baseUrl + "/basisEncoder/v2_50/basis_encoder.wasm",
        };
        const scene = new B.Scene(window.engine!);
        try {
            const texture = new B.RawTexture(pixels, 4, 4, B.Constants.TEXTUREFORMAT_RGBA, scene, false, false);
            const adapted = await new B.KhronosTextureContainer2Encoder(0)._encodeAsync(texture, { usage: "color" });
            return { identical: output.every((value, index) => adapted[index] === value) && output.length === adapted.length, signature: Array.from(output.slice(0, 4)) };
        } finally {
            scene.dispose();
            window.engine!.dispose();
            window.engine = null;
        }
    }, baseUrl);
    expect(result.signature).toEqual([0xab, 0x4b, 0x54, 0x58]);
    expect(result.identical).toBe(true);
    expect(requests).toEqual(expect.arrayContaining(["/basisEncoder/v2_50/basis_encoder.js", "/basisEncoder/v2_50/basis_encoder.wasm"]));
    expect(requests).toHaveLength(2);
});

test("KTX2 workers preserve compressed sRGB with exact conversions", async ({ page }) => {
    const { baseUrl } = getGlobalConfig();
    await page.route("**/empty.html", async (route) => {
        const response = await route.fetch();
        await route.fulfill({
            response,
            headers: {
                ...response.headers(),
                "Content-Security-Policy": "script-src 'self' 'unsafe-inline' 'unsafe-eval'; worker-src 'self' blob:",
            },
        });
    });
    await page.goto(baseUrl + "/empty.html");
    await page.waitForFunction(() => window.BABYLON);
    await page.evaluate(evaluateInitEngineForVisualization, {
        engineName: "webgl2",
        useLargeWorldRendering: false,
        useReverseDepthBuffer: "false",
        useNonCompatibilityMode: "false",
        baseUrl,
    });
    const result = await page.evaluate(async (baseUrl) => {
        const B = window.BABYLON;
        window.engine!.dispose();
        window.engine = new B.Engine(window.canvas!, false, { forceSRGBBufferSupportState: true, useExactSrgbConversions: true });
        const scene = new B.Scene(window.engine!);
        B.KhronosTextureContainer2Encoder.URLConfig = {
            jsEncoderModule: baseUrl + "/babylon.ktx2Encoder.js",
            jsBasisEncoder: baseUrl + "/basisEncoder/v2_50/basis_encoder.js",
            wasmBasisEncoder: baseUrl + "/basisEncoder/v2_50/basis_encoder.wasm",
        };
        const encoder = new B.KhronosTextureContainer2Encoder(1);
        const pixels = new Uint8Array(8 * 8 * 4);
        for (let index = 0; index < pixels.length; index += 4) {
            pixels.set([64, 128, 192, 255], index);
        }
        const urls: string[] = [];
        const load = async (data: Uint8Array) => {
            const url = URL.createObjectURL(new Blob([data.slice().buffer]));
            urls.push(url);
            const texture = new B.Texture(url, scene, { noMipmap: true, invertY: false, forcedExtension: ".ktx2", useSRGBBuffer: true });
            await B.WhenTextureReadyAsync(texture);
            return texture;
        };
        try {
            const raw = new B.RawTexture(pixels, 8, 8, B.Constants.TEXTUREFORMAT_RGBA, scene, false, false);
            B.KhronosTextureContainer2Encoder.DefaultEncoderOptions.etc1sQualityLevel = 128;
            const source = await load(await encoder._encodeAsync(raw, { usage: "color", etc1sQualityLevel: 0, zstandard: false }));
            B.KhronosTextureContainer2Encoder.DefaultEncoderOptions.etc1sQualityLevel = undefined;
            const first = await B.GetTextureDataAsync(source, 8, 8, 0, 0, false, 0, false);
            const encoded = await encoder._encodeAsync(source, { usage: "color" });
            const roundTrip = await load(encoded);
            const second = await B.GetTextureDataAsync(roundTrip, 8, 8, 0, 0, false, 0, false);
            return {
                exactConversions: window.engine!.useExactSrgbConversions,
                compressed: B._IsCompressedTextureFormat(source.textureFormat),
                hardwareSRGB: source.getInternalTexture()!._useSRGBBuffer,
                firstDifference: Math.max(...first.map((value, index) => Math.abs(value - pixels[index]))),
                roundTripDifference: Math.max(...second.map((value, index) => Math.abs(value - first[index]))),
            };
        } finally {
            scene.dispose();
            window.engine!.dispose();
            window.engine = null;
            for (const url of urls) {
                URL.revokeObjectURL(url);
            }
        }
    }, baseUrl);
    expect(result.exactConversions).toBe(true);
    expect(result.compressed).toBe(true);
    expect(result.hardwareSRGB).toBe(true);
    expect(result.firstDifference).toBeLessThanOrEqual(8);
    expect(result.roundTripDifference).toBeLessThanOrEqual(8);
});

test("KTX1 compressed rows encode identically for both upload-flip settings", async ({ page }) => {
    const { baseUrl } = getGlobalConfig();
    await page.goto(baseUrl + "/empty.html");
    await page.waitForFunction(() => window.BABYLON);
    await page.evaluate(evaluateInitEngineForVisualization, {
        engineName: "webgl2",
        useLargeWorldRendering: false,
        useReverseDepthBuffer: "false",
        useNonCompatibilityMode: "false",
        baseUrl,
    });
    const rows = await page.evaluate(async (baseUrl) => {
        const B = window.BABYLON;
        const scene = new B.Scene(window.engine!);
        B.KhronosTextureContainer2Encoder.URLConfig = {
            jsEncoderModule: baseUrl + "/babylon.ktx2Encoder.js",
            jsBasisEncoder: baseUrl + "/basisEncoder/v2_50/basis_encoder.js",
            wasmBasisEncoder: baseUrl + "/basisEncoder/v2_50/basis_encoder.wasm",
        };
        const encoder = new B.KhronosTextureContainer2Encoder(1);
        const data = new Uint8Array(100);
        data.set([0xab, 0x4b, 0x54, 0x58, 0x20, 0x31, 0x31, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a]);
        new Uint32Array(data.buffer, 12, 13).set([0x04030201, 0, 1, 0, 0x83f0, 0x1907, 8, 8, 0, 0, 1, 1, 0]);
        const view = new DataView(data.buffer);
        view.setUint32(64, 32, true);
        for (let block = 0; block < 4; block++) {
            view.setUint16(68 + block * 8, block < 2 ? 0xf800 : 0x001f, true);
        }
        const urls: string[] = [];
        const load = async (data: Uint8Array, extension: string, invertY: boolean) => {
            const url = URL.createObjectURL(new Blob([data.slice().buffer]));
            urls.push(url);
            const texture = new B.Texture(url, scene, { noMipmap: true, invertY, forcedExtension: extension });
            await B.WhenTextureReadyAsync(texture);
            return texture;
        };
        try {
            const results = [];
            for (const invertY of [false, true]) {
                const source = await load(data, ".ktx", invertY);
                const encoded = await encoder._encodeAsync(source, { usage: "data" });
                const decoded = await load(encoded, ".ktx2", false);
                const pixels = await B.GetTextureDataAsync(decoded, 8, 8, 0, 0, false, 0, false);
                results.push({ first: Array.from(pixels.slice(0, 4)), last: Array.from(pixels.slice(-4)) });
            }
            return results;
        } finally {
            scene.dispose();
            window.engine!.dispose();
            window.engine = null;
            for (const url of urls) {
                URL.revokeObjectURL(url);
            }
        }
    }, baseUrl);
    for (const { first, last } of rows) {
        expect(first[0]).toBeGreaterThanOrEqual(247);
        expect(first[2]).toBeLessThanOrEqual(8);
        expect(last[0]).toBeLessThanOrEqual(8);
        expect(last[2]).toBeGreaterThanOrEqual(247);
    }
});
