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
            engine.flushFramebuffer();
            await device.queue.onSubmittedWorkDone();
            const validationError = await device.popErrorScope();

            return {
                initial,
                updated,
                recreated,
                depthOnly,
                volumeMipLevels: volume.mipLevelCount,
                depthMipLevels: depthVolume.mipLevelCount,
                unfilteredMipLevels: unfiltered.mipLevelCount,
                validationError: validationError?.message ?? null,
            };
        });

        expect(result.validationError).toBeNull();
        expect([result.volumeMipLevels, result.depthMipLevels, result.unfilteredMipLevels]).toEqual([3, 4, 1]);
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
        ];
        for (const [index, actual] of [...result.initial, ...result.updated, result.recreated, ...result.depthOnly].entries()) {
            for (let channel = 0; channel < 4; channel++) {
                expect(Math.abs(actual[channel] - expected[index][channel]), `sample ${index}, channel ${channel}`).toBeLessThanOrEqual(2);
            }
        }
    } finally {
        await page.evaluate(evaluateDisposeEngine);
    }
});
