import { expect, test } from "@playwright/test";
import { getGlobalConfig, evaluateInitEngine, evaluateDisposeEngine } from "@tools/test-tools";
import { type WebGPUEngine } from "core/Engines/webgpuEngine";
import { type InternalTexture } from "core/Materials/Textures/internalTexture";

test("WebGPU raw 3D textures generate and update mipmaps across depth slices", async ({ page }) => {
    await page.goto(getGlobalConfig().baseUrl + "/empty.html", { waitUntil: "load" });
    await page.waitForSelector("#babylon-canvas");
    await page.waitForFunction(() => !!window.BABYLON?.WebGPUEngine);
    await page.evaluate(evaluateInitEngine, { engineName: "webgpu" });

    try {
        const result = await page.evaluate(async () => {
            const engine = window.engine as WebGPUEngine;
            const device = engine._device;
            const format = window.BABYLON.Constants.TEXTUREFORMAT_RGBA;
            const samplingMode = window.BABYLON.Constants.TEXTURE_TRILINEAR_SAMPLINGMODE;

            const readSlice = async (texture: InternalTexture, level: number, slice: number) => {
                const gpuTexture = texture._hardwareTexture?.underlyingResource;
                if (!gpuTexture) {
                    throw new Error("Raw 3D texture has no GPU resource");
                }
                const data = await engine._textureHelper.readPixels(
                    gpuTexture,
                    0,
                    0,
                    Math.max(1, texture.width >> level),
                    Math.max(1, texture.height >> level),
                    gpuTexture.format,
                    slice,
                    level,
                    null,
                    true
                );
                return Array.from(new Uint8Array(data.buffer, data.byteOffset, 4));
            };

            const data = new Uint8Array(4 * 4 * 4 * 4);
            const writeVolume = (offset: number) => {
                for (let z = 0; z < 4; z++) {
                    for (let y = 0; y < 4; y++) {
                        for (let x = 0; x < 4; x++) {
                            data.set([z * 40 + offset, x * 40, y * 40, 255], (z * 16 + y * 4 + x) * 4);
                        }
                    }
                }
            };

            device.pushErrorScope("validation");
            writeVolume(0);
            const volume = engine.createRawTexture3D(data, 4, 4, 4, format, true, false, samplingMode);
            engine.flushFramebuffer();
            const initial = [await readSlice(volume, 1, 0), await readSlice(volume, 1, 1), await readSlice(volume, 2, 0)];

            writeVolume(20);
            engine.updateRawTexture3D(volume, data, format, false);
            engine.flushFramebuffer();
            const updated = [await readSlice(volume, 1, 0), await readSlice(volume, 2, 0)];

            const previousResource = volume._hardwareTexture?.underlyingResource;
            writeVolume(40);
            engine._textureHelper.createGPUTextureForInternalTexture(volume);
            previousResource?.destroy();
            engine.updateRawTexture3D(volume, data, format, false);
            engine.flushFramebuffer();
            const recreated = await readSlice(volume, 1, 0);

            const depthData = new Uint8Array(8 * 4);
            for (let z = 0; z < 8; z++) {
                depthData.set([z * 32, 0, 0, 255], z * 4);
            }
            const depthVolume = engine.createRawTexture3D(depthData, 1, 1, 8, format, true, false, samplingMode);
            engine.flushFramebuffer();
            const depthOnly = [await readSlice(depthVolume, 1, 0), await readSlice(depthVolume, 1, 3), await readSlice(depthVolume, 2, 1), await readSlice(depthVolume, 3, 0)];

            const unfiltered = engine.createRawTexture3D(depthData, 1, 1, 8, format, false, false, samplingMode);
            const volumeMipLevels = volume.mipLevelCount;
            volume.updateSize(1, 1, 8);
            engine.updateRawTexture3D(volume, depthData, format, false);
            engine.flushFramebuffer();
            const resized = await readSlice(volume, 3, 0);
            const resizedMipLevels = volume.mipLevelCount;

            const oddData = new Uint8Array(5 * 4);
            for (let z = 0; z < 5; z++) {
                oddData.set([z * 40, 0, 0, 255], z * 4);
            }
            const oddVolume = engine.createRawTexture3D(oddData, 1, 1, 5, format, true, false, samplingMode);
            engine.flushFramebuffer();
            const oddDepth = [await readSlice(oddVolume, 1, 0), await readSlice(oddVolume, 1, 1), await readSlice(oddVolume, 2, 0)];

            engine.flushFramebuffer();
            await device.queue.onSubmittedWorkDone();
            const validationError = await device.popErrorScope();

            return {
                initial,
                updated,
                recreated,
                depthOnly,
                resized,
                oddDepth,
                volumeMipLevels,
                resizedMipLevels,
                depthMipLevels: depthVolume.mipLevelCount,
                unfilteredMipLevels: unfiltered.mipLevelCount,
                oddMipLevels: oddVolume.mipLevelCount,
                validationError: validationError?.message ?? null,
            };
        });

        expect(result.validationError).toBeNull();
        expect([result.volumeMipLevels, result.resizedMipLevels, result.depthMipLevels, result.unfilteredMipLevels, result.oddMipLevels]).toEqual([3, 4, 4, 1, 3]);
        const expected = [
            [20, 20, 20, 255],
            [100, 20, 20, 255],
            [60, 60, 60, 255],
            [40, 20, 20, 255],
            [80, 60, 60, 255],
            [60, 20, 20, 255],
            [16, 0, 0, 255],
            [208, 0, 0, 255],
            [176, 0, 0, 255],
            [112, 0, 0, 255],
            [112, 0, 0, 255],
            [30, 0, 0, 255],
            [130, 0, 0, 255],
            [80, 0, 0, 255],
        ];
        for (const [index, actual] of [...result.initial, ...result.updated, result.recreated, ...result.depthOnly, result.resized, ...result.oddDepth].entries()) {
            for (let channel = 0; channel < 4; channel++) {
                expect(Math.abs(actual[channel] - expected[index][channel]), `sample ${index}, channel ${channel}`).toBeLessThanOrEqual(2);
            }
        }
    } finally {
        await page.evaluate(evaluateDisposeEngine);
    }
});

test("WebGPU raw 3D mipmaps support integer and unfilterable float textures", async ({ page }) => {
    await page.goto(getGlobalConfig().baseUrl + "/empty.html", { waitUntil: "load" });
    await page.waitForSelector("#babylon-canvas");
    await page.waitForFunction(() => !!window.BABYLON?.WebGPUEngine);
    await page.evaluate(evaluateInitEngine, { engineName: "webgpu" });

    try {
        const result = await page.evaluate(async () => {
            const engine = window.engine as WebGPUEngine;
            const device = engine._device;
            const constants = window.BABYLON.Constants;
            const format = constants.TEXTUREFORMAT_RGBA_INTEGER;
            const samplingMode = constants.TEXTURE_TRILINEAR_SAMPLINGMODE;

            const unsignedData = new Uint8Array(2 * 2 * 2 * 4);
            const signedData = new Int8Array(unsignedData.length);
            for (let z = 0; z < 2; z++) {
                for (let y = 0; y < 2; y++) {
                    for (let x = 0; x < 2; x++) {
                        const offset = (z * 4 + y * 2 + x) * 4;
                        unsignedData.set([z * 40 + y * 10 + x * 20, 0, 0, 1], offset);
                        signedData.set([z * 40 + y * 10 + x * 20 - 70, 0, 0, 1], offset);
                    }
                }
            }
            const floatData = new Float32Array(4 * 4);
            for (let z = 0; z < 4; z++) {
                floatData.set([z * 2, 0, 0, 1], z * 4);
            }
            const oddData = new Uint8Array(5 * 4);
            for (let z = 0; z < 5; z++) {
                oddData.set([z * 40, 0, 0, 1], z * 4);
            }
            const oddXYData = new Uint8Array(5 * 5 * 4);
            oddXYData[(1 * 5 + 1) * 4] = 2;
            const oddXYZData = new Int8Array(5 * 5 * 5 * 4);
            oddXYZData[(1 * 25 + 1 * 5 + 1) * 4] = -3;
            const oddSigned32Data = new Int32Array(5 * 5 * 4);
            oddSigned32Data[(1 * 5 + 1) * 4] = 2147483647;
            oddSigned32Data[(1 * 5 + 1) * 4 + 1] = -2147483648;
            oddSigned32Data[0] = -2147483648;
            oddSigned32Data[1] = 2147483647;
            const oddUnsigned32Data = new Uint32Array(5 * 5 * 4);
            oddUnsigned32Data[(1 * 5 + 1) * 4] = 4294967295;
            const signedCases = [
                [-9, 7, 0, 0, 0, 0, 0, 0],
                [8, -1, -1, -1, -1, -1, -1, -1],
            ].map((values) => {
                const data = new Int8Array(2 * 2 * 2 * 4);
                values.forEach((value, index) => data.set([value, 0, 0, 1], index * 4));
                return data;
            });
            const signed32Data = new Int32Array(2 * 2 * 2 * 4);
            signed32Data[0] = 2147483647;
            signed32Data[4] = -2147483648;
            const unsigned32Data = new Uint32Array(2 * 2 * 2 * 4);
            for (let index = 0; index < 8; index++) {
                unsigned32Data[index * 4] = 4294967295;
            }
            const largeFloatData = new Float32Array(2 * 2 * 2 * 4);
            for (let index = 0; index < 8; index++) {
                largeFloatData.set([2 ** 126, 0, 0, 1], index * 4);
            }

            device.pushErrorScope("validation");
            const unsigned = engine.createRawTexture3D(unsignedData, 2, 2, 2, format, true, false, samplingMode);
            const signed = engine.createRawTexture3D(signedData, 2, 2, 2, format, true, false, samplingMode, null, constants.TEXTURETYPE_BYTE);
            const float = engine.createRawTexture3D(floatData, 1, 1, 4, constants.TEXTUREFORMAT_RGBA, true, false, samplingMode, null, constants.TEXTURETYPE_FLOAT);
            const odd = engine.createRawTexture3D(oddData, 1, 1, 5, format, true, false, samplingMode);
            const oddWidth = engine.createRawTexture3D(oddData, 5, 1, 1, format, true, false, samplingMode);
            const oddHeight = engine.createRawTexture3D(oddData, 1, 5, 1, format, true, false, samplingMode);
            const oddXY = engine.createRawTexture3D(oddXYData, 5, 5, 1, format, true, false, samplingMode);
            const oddXYZ = engine.createRawTexture3D(oddXYZData, 5, 5, 5, format, true, false, samplingMode, null, constants.TEXTURETYPE_BYTE);
            const oddSigned32 = engine.createRawTexture3D(oddSigned32Data, 5, 5, 1, format, true, false, samplingMode, null, constants.TEXTURETYPE_INT);
            const oddUnsigned32 = engine.createRawTexture3D(oddUnsigned32Data, 5, 5, 1, format, true, false, samplingMode, null, constants.TEXTURETYPE_UNSIGNED_INTEGER);
            const mixed = signedCases.map((data) => engine.createRawTexture3D(data, 2, 2, 2, format, true, false, samplingMode, null, constants.TEXTURETYPE_BYTE));
            const signed32 = engine.createRawTexture3D(signed32Data, 2, 2, 2, format, true, false, samplingMode, null, constants.TEXTURETYPE_INT);
            const unsigned32 = engine.createRawTexture3D(unsigned32Data, 2, 2, 2, format, true, false, samplingMode, null, constants.TEXTURETYPE_UNSIGNED_INTEGER);
            const largeFloat = engine.createRawTexture3D(largeFloatData, 2, 2, 2, constants.TEXTUREFORMAT_RGBA, true, false, samplingMode, null, constants.TEXTURETYPE_FLOAT);
            engine.flushFramebuffer();

            const read = async (texture: InternalTexture, level: number, slice: number, x = 0, y = 0) => {
                const gpuTexture = texture._hardwareTexture?.underlyingResource;
                if (!gpuTexture) {
                    throw new Error("Raw 3D texture has no GPU resource");
                }
                return await engine._textureHelper.readPixels(gpuTexture, x, y, 1, 1, gpuTexture.format, slice, level, null, true);
            };
            const unsignedPixels = await read(unsigned, 1, 0);
            const signedPixels = await read(signed, 1, 0);
            const floatPixels = [await read(float, 1, 0), await read(float, 1, 1), await read(float, 2, 0)];
            const oddPixels = [await read(odd, 1, 0), await read(odd, 1, 1), await read(odd, 2, 0)];
            const oddWidthPixels = [await read(oddWidth, 1, 0), await read(oddWidth, 1, 0, 1), await read(oddWidth, 2, 0)];
            const oddHeightPixels = [await read(oddHeight, 1, 0), await read(oddHeight, 1, 0, 0, 1), await read(oddHeight, 2, 0)];
            const oddXYPixels = await read(oddXY, 1, 0);
            const oddXYZPixels = await read(oddXYZ, 1, 0);
            const oddSigned32Pixels = await read(oddSigned32, 1, 0);
            const oddUnsigned32Pixels = await read(oddUnsigned32, 1, 0);
            const mixedPixels = await Promise.all(mixed.map((texture) => read(texture, 1, 0)));
            const signed32Pixels = await read(signed32, 1, 0);
            const unsigned32Pixels = await read(unsigned32, 1, 0);
            const largeFloatPixels = await read(largeFloat, 1, 0);

            const bitmap = await createImageBitmap(document.createElement("canvas"));
            let imageBitmapError = "";
            try {
                engine._textureHelper.createTexture(bitmap, true, true, false, false, true);
            } catch (error) {
                imageBitmapError = (error as Error).message;
            } finally {
                bitmap.close();
            }

            await device.queue.onSubmittedWorkDone();
            const validationError = await device.popErrorScope();
            return {
                unsigned: new Uint8Array(unsignedPixels.buffer, unsignedPixels.byteOffset, 4)[0],
                signed: new Int8Array(signedPixels.buffer, signedPixels.byteOffset, 4)[0],
                float: floatPixels.map((pixels) => new Float32Array(pixels.buffer, pixels.byteOffset, 4)[0]),
                odd: oddPixels.map((pixels) => new Uint8Array(pixels.buffer, pixels.byteOffset, 4)[0]),
                oddWidth: oddWidthPixels.map((pixels) => new Uint8Array(pixels.buffer, pixels.byteOffset, 4)[0]),
                oddHeight: oddHeightPixels.map((pixels) => new Uint8Array(pixels.buffer, pixels.byteOffset, 4)[0]),
                oddXY: new Uint8Array(oddXYPixels.buffer, oddXYPixels.byteOffset, 4)[0],
                oddXYZ: new Int8Array(oddXYZPixels.buffer, oddXYZPixels.byteOffset, 4)[0],
                oddSigned32: Array.from(new Int32Array(oddSigned32Pixels.buffer, oddSigned32Pixels.byteOffset, 4).slice(0, 2)),
                oddUnsigned32: new Uint32Array(oddUnsigned32Pixels.buffer, oddUnsigned32Pixels.byteOffset, 4)[0],
                mixed: mixedPixels.map((pixels) => new Int8Array(pixels.buffer, pixels.byteOffset, 4)[0]),
                signed32: new Int32Array(signed32Pixels.buffer, signed32Pixels.byteOffset, 4)[0],
                unsigned32: new Uint32Array(unsigned32Pixels.buffer, unsigned32Pixels.byteOffset, 4)[0],
                largeFloat: new Float32Array(largeFloatPixels.buffer, largeFloatPixels.byteOffset, 4)[0],
                imageBitmapError,
                validationError: validationError?.message ?? null,
            };
        });

        expect(result.validationError).toBeNull();
        expect(result.unsigned).toBe(35);
        expect(result.signed).toBe(-35);
        expect(result.float).toEqual([1, 5, 3]);
        expect(result.odd).toEqual([30, 130, 80]);
        expect(result.oddWidth).toEqual([30, 130, 80]);
        expect(result.oddHeight).toEqual([30, 130, 80]);
        expect(result.oddXY).toBe(1);
        expect(result.oddXYZ).toBe(-1);
        expect(result.oddSigned32).toEqual([1073741823, -1073741824]);
        expect(result.oddUnsigned32).toBe(2415919103);
        expect(result.mixed).toEqual([0, 0]);
        expect(result.signed32).toBe(0);
        expect(result.unsigned32).toBe(4294967295);
        expect(result.largeFloat).toBe(2 ** 126);
        expect(result.imageBitmapError).toMatch(/ImageBitmap.*3D texture.*not supported/);
    } finally {
        await page.evaluate(evaluateDisposeEngine);
    }
});
