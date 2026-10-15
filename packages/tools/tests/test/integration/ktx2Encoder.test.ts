import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import { evaluateInitEngineForVisualization } from "../playwright/visualizationPlaywright.utils";

test("KTX2 color encoding preserves compressed sRGB channels through a round trip", async ({ page }) => {
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
    const result = await page.evaluate(async (baseUrl) => {
        const B = window.BABYLON;
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
            const source = await load(await encoder.encodeAsync(pixels.slice(), 8, 8, { usage: "color", generateMipmaps: false }));
            const first = await B.GetTextureDataAsync(source, 8, 8, 0, 0, false, 0, false);
            const encoded = await B.EncodeTextureToKTX2Async(source, { usage: "color", generateMipmaps: false }, encoder);
            const roundTrip = await load(encoded);
            const second = await B.GetTextureDataAsync(roundTrip, 8, 8, 0, 0, false, 0, false);
            return {
                compressed: B.IsCompressedTextureFormat(source.textureFormat),
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
    expect(result.compressed).toBe(true);
    expect(result.hardwareSRGB).toBe(true);
    expect(result.firstDifference).toBeLessThanOrEqual(8);
    expect(result.roundTripDifference).toBeLessThanOrEqual(8);
});
