import { describe, it, expect, beforeEach } from "vitest";
import { WebGPUShaderProcessorWGSL } from "core/Engines/WebGPU/webgpuShaderProcessorsWGSL";
import { WebGPUShaderProcessingContext } from "core/Engines/WebGPU/webgpuShaderProcessingContext";
import { ShaderLanguage } from "core/Materials/shaderLanguage";

describe("WebGPUShaderProcessorWGSL", () => {
    let processor: WebGPUShaderProcessorWGSL;
    let context: WebGPUShaderProcessingContext;

    beforeEach(() => {
        processor = new WebGPUShaderProcessorWGSL();
        context = new WebGPUShaderProcessingContext(ShaderLanguage.WGSL, true);
        processor.pureMode = true;
        processor.initializeShaders(context);
    });

    describe("storage texture access mode parsing", () => {
        it("should parse write-only storage texture", () => {
            const line = "var outputTex : texture_storage_2d<rgba8unorm, write>;";
            processor.textureProcessor(line, true, {});

            const textureInfo = context.availableTextures["outputTex"];
            expect(textureInfo).toBeDefined();
            expect(textureInfo.isStorageTexture).toBe(true);
            expect(textureInfo.storageTextureAccess).toBe("write-only");

            const layoutEntry = context.bindGroupLayoutEntries[0][0];
            expect(layoutEntry.storageTexture).toBeDefined();
            expect(layoutEntry.storageTexture!.access).toBe("write-only");
            expect(layoutEntry.storageTexture!.format).toBe("rgba8unorm");
            expect(layoutEntry.storageTexture!.viewDimension).toBe("2d");
        });

        it("should parse read-only storage texture", () => {
            const line = "var inputTex : texture_storage_2d<rgba8unorm, read>;";
            processor.textureProcessor(line, true, {});

            const textureInfo = context.availableTextures["inputTex"];
            expect(textureInfo).toBeDefined();
            expect(textureInfo.isStorageTexture).toBe(true);
            expect(textureInfo.storageTextureAccess).toBe("read-only");

            const layoutEntry = context.bindGroupLayoutEntries[0][0];
            expect(layoutEntry.storageTexture).toBeDefined();
            expect(layoutEntry.storageTexture!.access).toBe("read-only");
            expect(layoutEntry.storageTexture!.format).toBe("rgba8unorm");
        });

        it("should parse read_write storage texture", () => {
            const line = "var rwTex : texture_storage_2d<r32float, read_write>;";
            processor.textureProcessor(line, true, {});

            const textureInfo = context.availableTextures["rwTex"];
            expect(textureInfo).toBeDefined();
            expect(textureInfo.isStorageTexture).toBe(true);
            expect(textureInfo.storageTextureAccess).toBe("read-write");

            const layoutEntry = context.bindGroupLayoutEntries[0][0];
            expect(layoutEntry.storageTexture).toBeDefined();
            expect(layoutEntry.storageTexture!.access).toBe("read-write");
            expect(layoutEntry.storageTexture!.format).toBe("r32float");
        });

        it("should parse read_write with r32uint format", () => {
            const line = "var rwTex : texture_storage_2d<r32uint, read_write>;";
            processor.textureProcessor(line, true, {});

            const textureInfo = context.availableTextures["rwTex"];
            expect(textureInfo.storageTextureAccess).toBe("read-write");

            const layoutEntry = context.bindGroupLayoutEntries[0][0];
            expect(layoutEntry.storageTexture!.format).toBe("r32uint");
        });

        it("should parse read_write with r32sint format", () => {
            const line = "var rwTex : texture_storage_2d<r32sint, read_write>;";
            processor.textureProcessor(line, true, {});

            const textureInfo = context.availableTextures["rwTex"];
            expect(textureInfo.storageTextureAccess).toBe("read-write");

            const layoutEntry = context.bindGroupLayoutEntries[0][0];
            expect(layoutEntry.storageTexture!.format).toBe("r32sint");
        });

        it("should parse 3d storage texture with write access", () => {
            const line = "var voxelTex : texture_storage_3d<rgba8unorm, write>;";
            processor.textureProcessor(line, true, {});

            const textureInfo = context.availableTextures["voxelTex"];
            expect(textureInfo.isStorageTexture).toBe(true);
            expect(textureInfo.storageTextureAccess).toBe("write-only");

            const layoutEntry = context.bindGroupLayoutEntries[0][0];
            expect(layoutEntry.storageTexture!.viewDimension).toBe("3d");
        });

        it("should parse 1d storage texture", () => {
            const line = "var lineTex : texture_storage_1d<rgba8unorm, write>;";
            processor.textureProcessor(line, true, {});

            const textureInfo = context.availableTextures["lineTex"];
            expect(textureInfo.isStorageTexture).toBe(true);

            const layoutEntry = context.bindGroupLayoutEntries[0][0];
            expect(layoutEntry.storageTexture!.viewDimension).toBe("1d");
        });

        it("should parse 2d_array storage texture", () => {
            const line = "var arrayTex : texture_storage_2d_array<rgba8unorm, write>;";
            processor.textureProcessor(line, true, {});

            const textureInfo = context.availableTextures["arrayTex"];
            expect(textureInfo.isStorageTexture).toBe(true);

            const layoutEntry = context.bindGroupLayoutEntries[0][0];
            expect(layoutEntry.storageTexture!.viewDimension).toBe("2d-array");
        });

        it("should not set storageTextureAccess for non-storage textures", () => {
            const line = "var myTex : texture_2d<f32>;";
            processor.textureProcessor(line, true, {});

            const textureInfo = context.availableTextures["myTex"];
            expect(textureInfo).toBeDefined();
            expect(textureInfo.isStorageTexture).toBe(false);
            expect(textureInfo.storageTextureAccess).toBeUndefined();

            const layoutEntry = context.bindGroupLayoutEntries[0][0];
            expect(layoutEntry.storageTexture).toBeUndefined();
            expect(layoutEntry.texture).toBeDefined();
        });

        it("should assign different bindings to multiple storage textures", () => {
            processor.textureProcessor("var texA : texture_storage_2d<rgba8unorm, write>;", true, {});
            processor.textureProcessor("var texB : texture_storage_2d<rgba8unorm, read>;", true, {});
            processor.textureProcessor("var texC : texture_storage_2d<r32float, read_write>;", true, {});

            expect(context.availableTextures["texA"].storageTextureAccess).toBe("write-only");
            expect(context.availableTextures["texB"].storageTextureAccess).toBe("read-only");
            expect(context.availableTextures["texC"].storageTextureAccess).toBe("read-write");

            // Each texture should have a unique binding
            const entryA = context.bindGroupLayoutEntries[0][0];
            const entryB = context.bindGroupLayoutEntries[0][1];
            const entryC = context.bindGroupLayoutEntries[0][2];

            expect(entryA.storageTexture!.access).toBe("write-only");
            expect(entryB.storageTexture!.access).toBe("read-only");
            expect(entryC.storageTexture!.access).toBe("read-write");

            expect(entryA.binding).not.toBe(entryB.binding);
            expect(entryB.binding).not.toBe(entryC.binding);
        });

        it("should set fragment visibility when isFragment is true", () => {
            processor.textureProcessor("var tex : texture_storage_2d<rgba8unorm, write>;", true, {});

            const layoutEntry = context.bindGroupLayoutEntries[0][0];
            // isFragment=true means isVertex is false, so Fragment visibility should be set
            expect(layoutEntry.visibility & 0x2).toBe(0x2); // GPUShaderStage.FRAGMENT = 0x2
        });

        it("should set vertex visibility when isFragment is false", () => {
            processor.textureProcessor("var tex : texture_storage_2d<rgba8unorm, read>;", false, {});

            const layoutEntry = context.bindGroupLayoutEntries[0][0];
            // isFragment=false means isVertex is true, so Vertex visibility should be set
            expect(layoutEntry.visibility & 0x1).toBe(0x1); // GPUShaderStage.VERTEX = 0x1
        });

        it("should inject @group and @binding attributes into the output", () => {
            const result = processor.textureProcessor("var outputTex : texture_storage_2d<rgba8unorm, write>;", true, {});

            expect(result).toContain("@group(");
            expect(result).toContain("@binding(");
        });

        it("should handle rgba32float format with read access", () => {
            const line = "var hdrTex : texture_storage_2d<rgba32float, read>;";
            processor.textureProcessor(line, true, {});

            const layoutEntry = context.bindGroupLayoutEntries[0][0];
            expect(layoutEntry.storageTexture!.access).toBe("read-only");
            expect(layoutEntry.storageTexture!.format).toBe("rgba32float");
        });
    });
});
