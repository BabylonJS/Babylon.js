import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "fs";
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

    describe("cascaded shadow vertex include", () => {
        it("should use uniforms.view when the scene uniform buffer is not declared", () => {
            const shadowsVertex = readFileSync(new URL("../../../../src/ShadersWGSL/ShadersInclude/shadowsVertex.fx", import.meta.url), "utf8");

            expect(shadowsVertex).toContain("#ifdef SCENE_UBO");
            expect(shadowsVertex).toContain("vertexOutputs.vPositionFromCamera{X} = scene.view * worldPos;");
            expect(shadowsVertex).toContain("#else");
            expect(shadowsVertex).toContain("vertexOutputs.vPositionFromCamera{X} = uniforms.view * worldPos;");
        });
    });

    describe("integer fragData outputs (render-to-integer-texture)", () => {
        const vtx = "@vertex\nfn main(input : VertexInputs) -> FragmentInputs {\n  vertexOutputs.position = vec4<f32>(0.0);\n}\n";

        it("defaults a fragData location to vec4<f32> (backward compatible)", () => {
            const frag = "@fragment\nfn main(input : FragmentInputs) -> FragmentOutputs {\n  fragmentOutputs.fragData0 = vec4<f32>(1.0);\n}\n";
            const { fragmentCode } = processor.finalizeShaders(vtx, frag);
            expect(fragmentCode).toContain("@location(0) fragData0 : vec4<f32>");
            expect(fragmentCode).not.toContain("vec4<u32>");
        });

        it("emits vec4<u32> for a fragData location assigned a uint vector (RGBA_INTEGER target)", () => {
            const frag =
                "@fragment\nfn main(input : FragmentInputs) -> FragmentOutputs {\n" +
                "  fragmentOutputs.fragData0 = vec4<u32>(1u, 2u, 3u, 4u);\n" +
                "  fragmentOutputs.fragData1 = vec4<f32>(0.5);\n" +
                "}\n";
            const { fragmentCode } = processor.finalizeShaders(vtx, frag);
            expect(fragmentCode).toContain("@location(0) fragData0 : vec4<u32>");
            expect(fragmentCode).toContain("@location(1) fragData1 : vec4<f32>");
        });

        it("emits vec4<i32> for a vec4i(...) assignment and vec4<u32> for vec4u(...)", () => {
            const frag =
                "@fragment\nfn main(input : FragmentInputs) -> FragmentOutputs {\n" +
                "  fragmentOutputs.fragData0 = vec4i(1);\n" +
                "  fragmentOutputs.fragData1 = vec4u(2u);\n" +
                "}\n";
            const { fragmentCode } = processor.finalizeShaders(vtx, frag);
            expect(fragmentCode).toContain("@location(0) fragData0 : vec4<i32>");
            expect(fragmentCode).toContain("@location(1) fragData1 : vec4<u32>");
        });

        it("emits vec4<u32> when the fragData RHS is an identifier with a typed integer declaration", () => {
            const frag =
                "@fragment\nfn main(input : FragmentInputs) -> FragmentOutputs {\n" +
                "  var computedUintColor : vec4<u32> = vec4<u32>(1u);\n" +
                "  fragmentOutputs.fragData0 = computedUintColor;\n" +
                "}\n";
            const { fragmentCode } = processor.finalizeShaders(vtx, frag);
            expect(fragmentCode).toContain("@location(0) fragData0 : vec4<u32>");
        });

        it("emits vec4<u32> when the fragData RHS is an identifier initialized from a uint constructor", () => {
            const frag =
                "@fragment\nfn main(input : FragmentInputs) -> FragmentOutputs {\n" +
                "  let packed = vec4<u32>(1u, 2u, 3u, 4u);\n" +
                "  fragmentOutputs.fragData0 = packed;\n" +
                "}\n";
            const { fragmentCode } = processor.finalizeShaders(vtx, frag);
            expect(fragmentCode).toContain("@location(0) fragData0 : vec4<u32>");
        });

        it("still defaults to vec4<f32> for a float identifier RHS", () => {
            const frag = "@fragment\nfn main(input : FragmentInputs) -> FragmentOutputs {\n" + "  let color = vec4<f32>(0.5);\n" + "  fragmentOutputs.fragData0 = color;\n" + "}\n";
            const { fragmentCode } = processor.finalizeShaders(vtx, frag);
            expect(fragmentCode).toContain("@location(0) fragData0 : vec4<f32>");
        });

        it("ignores a commented-out integer fragData write above the real float write", () => {
            // A stale commented-out `= vec4<u32>(...)` above a real float write must not flip the output to integer.
            const frag =
                "@fragment\nfn main(input : FragmentInputs) -> FragmentOutputs {\n" +
                "  // fragmentOutputs.fragData0 = vec4<u32>(1u);\n" +
                "  /* fragmentOutputs.fragData0 = vec4<u32>(2u); */\n" +
                "  fragmentOutputs.fragData0 = vec4<f32>(1.0);\n" +
                "}\n";
            const { fragmentCode } = processor.finalizeShaders(vtx, frag);
            expect(fragmentCode).toContain("@location(0) fragData0 : vec4<f32>");
            // The retained comment still contains "vec4<u32>", so assert on the emitted struct declaration.
            expect(fragmentCode).not.toContain("fragData0 : vec4<u32>");
        });

        it("does not let a same-named integer local in a helper function flip a float fragData output", () => {
            // An integer `color` local in a helper must not resolve the type of main's float `color` RHS.
            const frag =
                "fn helper() -> vec4<u32> {\n  var color : vec4<u32> = vec4<u32>(1u);\n  return color;\n}\n" +
                "@fragment\nfn main(input : FragmentInputs) -> FragmentOutputs {\n" +
                "  let color = vec4<f32>(0.5);\n" +
                "  fragmentOutputs.fragData0 = color;\n" +
                "}\n";
            const { fragmentCode } = processor.finalizeShaders(vtx, frag);
            expect(fragmentCode).toContain("@location(0) fragData0 : vec4<f32>");
        });
    });
});
