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
        const result = await page.evaluate(async (baseUrl) => {
            const B = window.BABYLON;
            const scene = new B.Scene(window.engine!);
            const encoder = new B.KhronosTextureContainer2Encoder({
                numWorkers: 0,
                jsEncoderModuleUrl: baseUrl + "/babylon.ktx2Encoder.js",
                basisJsUrl: baseUrl + "/basisEncoder/v2_50/basis_encoder.js",
                basisWasmUrl: baseUrl + "/basisEncoder/v2_50/basis_encoder.wasm",
            });
            const inputs: number[][] = [];
            const encode = encoder.encodeAsync;
            encoder.encodeAsync = async (rgba, width, height, options) => {
                inputs.push(Array.from(rgba.slice(0, 4)));
                return await encode.call(encoder, rgba, width, height, options);
            };
            const urls: string[] = [];
            try {
                const results: number[][] = [];
                for (const [format, channels] of [
                    [B.Constants.TEXTUREFORMAT_R, [80]],
                    [B.Constants.TEXTUREFORMAT_RG, [80, 120]],
                ] as const) {
                    const texture = new B.RawTexture(Uint8Array.from(Array.from({ length: 16 }, () => channels).flat()), 4, 4, format, scene, false, false);
                    const encoded = await B.EncodeTextureToKTX2Async(texture, { usage: "data", generateMipmaps: false }, encoder);
                    const url = URL.createObjectURL(new Blob([encoded.slice().buffer]));
                    urls.push(url);
                    const decoded = new B.Texture(url, scene, { noMipmap: true, invertY: false, forcedExtension: ".ktx2" });
                    const pixels = await B.GetTextureDataAsync(decoded, 4, 4, 0, 0, false, 0, false);
                    results.push(Array.from(pixels.slice(0, 4)));
                }
                return { inputs, decoded: results };
            } finally {
                encoder.dispose();
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

test("KTX2 texture encoding rejects a load failure after readiness waiting starts", async ({ page }) => {
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
    const result = page.evaluate(async () => {
        const B = window.BABYLON;
        const scene = new B.Scene(window.engine!);
        const texture = new B.Texture("/ktx2-missing-image.png", scene);
        const observersBefore = B.Texture.OnTextureLoadErrorObservable.observers.filter((observer) => !observer._willBeUnregistered).length;
        try {
            await B.EncodeTextureToKTX2Async(texture, { usage: "color" });
            throw new Error("Encoding unexpectedly succeeded");
        } catch (error) {
            return {
                error: String(error),
                loadingError: texture.loadingError,
                cleaned: B.Texture.OnTextureLoadErrorObservable.observers.filter((observer) => !observer._willBeUnregistered).length === observersBefore,
                loadCleaned: !texture.onLoadObservable.hasObservers(),
            };
        } finally {
            scene.dispose();
            window.engine!.dispose();
            window.engine = null;
        }
    });
    await imageRequested;
    failImage();
    expect(await result).toMatchObject({ error: expect.stringContaining("ktx2-missing-image.png"), loadingError: true, cleaned: true, loadCleaned: true });
});

test("KTX2 encoder lazily loads default assets and supports main-thread adapter encoding", async ({ page }) => {
    const { baseUrl } = getGlobalConfig();
    const requests: string[] = [];
    await page.route("https://cdn.babylonjs.com/basisEncoder/v2_50/*", async (route) => {
        const pathname = new URL(route.request().url()).pathname;
        requests.push(pathname);
        const response = await page.request.get(baseUrl + pathname);
        await route.fulfill({ response, headers: { ...response.headers(), "access-control-allow-origin": "*" } });
    });
    await page.goto(baseUrl + "/empty.html");
    await page.addScriptTag({ url: baseUrl + "/babylon.ktx2Encoder.js" });
    const result = await page.evaluate(async (baseUrl) => {
        const module = (window as typeof window & { KTX2ENCODER: { KTX2Encoder: new () => KTX2Encoder } }).KTX2ENCODER;
        const encoder = new module.KTX2Encoder();
        const pixels = new Uint8Array(64).fill(128);
        const options = { usage: "color", generateMipmaps: false } as const;
        const output = await encoder.encode(pixels, 4, 4, options);
        const adapter = new window.BABYLON.KhronosTextureContainer2Encoder({
            numWorkers: 0,
            jsEncoderModuleUrl: baseUrl + "/babylon.ktx2Encoder.js",
            basisJsUrl: baseUrl + "/basisEncoder/v2_50/basis_encoder.js",
            basisWasmUrl: baseUrl + "/basisEncoder/v2_50/basis_encoder.wasm",
        });
        try {
            const adapted = await adapter.encodeAsync(pixels, 4, 4, { usage: "color", generateMipmaps: false });
            return { identical: output.every((value, index) => adapted[index] === value) && output.length === adapted.length, signature: Array.from(output.slice(0, 4)) };
        } finally {
            adapter.dispose();
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
        const encoder = new B.KhronosTextureContainer2Encoder({
            jsEncoderModuleUrl: baseUrl + "/babylon.ktx2Encoder.js",
            basisJsUrl: baseUrl + "/basisEncoder/v2_50/basis_encoder.js",
            basisWasmUrl: baseUrl + "/basisEncoder/v2_50/basis_encoder.wasm",
            numWorkers: 1,
        });
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
            let invalidOptions = "";
            try {
                await encoder.encodeAsync(new Uint8Array(64), 4, 4, { usage: "color", etc1sQualityLevel: 0 });
            } catch (error) {
                invalidOptions = String(error);
            }
            const source = await load(await encoder.encodeAsync(pixels.slice(), 8, 8, { usage: "color", generateMipmaps: false }));
            const first = await B.GetTextureDataAsync(source, 8, 8, 0, 0, false, 0, false);
            const encoded = await B.EncodeTextureToKTX2Async(source, { usage: "color", generateMipmaps: false }, encoder);
            const roundTrip = await load(encoded);
            const second = await B.GetTextureDataAsync(roundTrip, 8, 8, 0, 0, false, 0, false);
            return {
                exactConversions: window.engine!.useExactSrgbConversions,
                invalidOptions,
                compressed: B._IsCompressedTextureFormat(source.textureFormat),
                hardwareSRGB: source.getInternalTexture()!._useSRGBBuffer,
                firstDifference: Math.max(...first.map((value, index) => Math.abs(value - pixels[index]))),
                roundTripDifference: Math.max(...second.map((value, index) => Math.abs(value - first[index]))),
            };
        } finally {
            encoder.dispose();
            scene.dispose();
            window.engine!.dispose();
            window.engine = null;
            for (const url of urls) {
                URL.revokeObjectURL(url);
            }
        }
    }, baseUrl);
    expect(result.exactConversions).toBe(true);
    expect(result.invalidOptions).toContain("etc1sQualityLevel");
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
        const encoder = new B.KhronosTextureContainer2Encoder({
            jsEncoderModuleUrl: baseUrl + "/babylon.ktx2Encoder.js",
            basisJsUrl: baseUrl + "/basisEncoder/v2_50/basis_encoder.js",
            basisWasmUrl: baseUrl + "/basisEncoder/v2_50/basis_encoder.wasm",
            numWorkers: 1,
        });
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
                const encoded = await B.EncodeTextureToKTX2Async(source, { usage: "data", generateMipmaps: false }, encoder);
                const decoded = await load(encoded, ".ktx2", false);
                const pixels = await B.GetTextureDataAsync(decoded, 8, 8, 0, 0, false, 0, false);
                results.push({ first: Array.from(pixels.slice(0, 4)), last: Array.from(pixels.slice(-4)) });
            }
            return results;
        } finally {
            encoder.dispose();
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
