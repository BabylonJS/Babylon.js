/**
 * @vitest-environment jsdom
 */

import { createHash } from "node:crypto";
import { NullEngine } from "core/Engines/nullEngine";
import { WebGPUShaderProcessingContext } from "core/Engines/WebGPU/webgpuShaderProcessingContext";
import { WebGPUShaderProcessorWGSL } from "core/Engines/WebGPU/webgpuShaderProcessorsWGSL";
import { MaterialPluginBase } from "core/Materials/materialPluginBase";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { Scene } from "core/scene";
import { WebXRDepthSensing } from "core/XR/features/WebXRDepthSensing";
import { WebXRSessionManager } from "core/XR/webXRSessionManager";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("WebXRDepthSensing material shaders", () => {
    let engine: NullEngine;
    let scene: Scene;
    let sessionManager: WebXRSessionManager;
    let feature: WebXRDepthSensing | undefined;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        sessionManager = new WebXRSessionManager(scene);
        (sessionManager as any)._xrNavigator = { xr: { native: false } };
        feature = new WebXRDepthSensing(sessionManager, {
            dataFormatPreference: ["float"],
            usagePreference: ["cpu"],
        });
    });

    afterEach(() => {
        feature?.dispose();
        scene.dispose();
        engine.dispose();
    });

    function createPlugin(shaderLanguage: ShaderLanguage): MaterialPluginBase {
        (engine as any)._isWebGPU = shaderLanguage === ShaderLanguage.WGSL;
        const material = new StandardMaterial(`depth-${shaderLanguage}`, scene);
        const plugin = material.pluginManager?.getPlugin("DepthSensing");
        expect(material.shaderLanguage).toBe(shaderLanguage);
        expect(plugin).not.toBeNull();
        return plugin!;
    }

    it("generates WGSL for uniforms, multiview, texture sampling, UV transforms, discard, and tolerance", () => {
        const plugin = createPlugin(ShaderLanguage.WGSL);
        const uniforms = plugin.getUniforms(ShaderLanguage.WGSL);
        const vertex = plugin.getCustomCode("vertex", ShaderLanguage.WGSL)!;
        const fragment = plugin.getCustomCode("fragment", ShaderLanguage.WGSL)!;

        expect(plugin.isCompatible(ShaderLanguage.WGSL)).toBe(true);
        expect(uniforms.fragment).toBe("");
        expect(uniforms.ubo?.map(({ name }) => name)).toEqual([
            "ds_invScreenSize",
            "ds_rawValueToMeters",
            "ds_viewIndex",
            "ds_shaderViewport",
            "ds_uvTransform",
            "ds_rawValueToMetersRight",
            "ds_depthAvailableLeft",
            "ds_depthAvailableRight",
            "ds_worldScale",
            "ds_viewDepthSign",
            "ds_uvTransformRight",
            "ds_viewRight",
        ]);
        expect(vertex.CUSTOM_VERTEX_DEFINITIONS).toContain("varying ds_viewIndexMultiview: f32;");
        expect(vertex.CUSTOM_VERTEX_MAIN_BEGIN).toContain("vertexOutputs.ds_viewIndexMultiview = f32(gl_ViewID_OVR);");
        expect(fragment.CUSTOM_FRAGMENT_DEFINITIONS).toContain("var ds_depthSampler: texture_2d<f32>;");
        expect(fragment.CUSTOM_FRAGMENT_DEFINITIONS).toContain("var ds_depthSampler: texture_2d_array<f32>;");
        expect(fragment.CUSTOM_FRAGMENT_DEFINITIONS).toContain("var ds_depthSamplerSampler: sampler;");
        expect(fragment.CUSTOM_FRAGMENT_DEFINITIONS).toContain("var ds_depthSamplerRight: texture_2d<f32>;");
        expect(fragment.CUSTOM_FRAGMENT_MAIN_BEGIN).toContain("var ds_depthAvailable: f32 = uniforms.ds_depthAvailableLeft;");
        expect(fragment.CUSTOM_FRAGMENT_MAIN_BEGIN).toContain("ds_depthAvailable = uniforms.ds_depthAvailableRight;");
        expect(fragment.CUSTOM_FRAGMENT_MAIN_BEGIN).toContain("if (ds_depthAvailable > 0.5)");
        expect(fragment.CUSTOM_FRAGMENT_MAIN_BEGIN).toContain(
            "(fragmentInputs.position.xy * uniforms.ds_invScreenSize - uniforms.ds_shaderViewport.xy) / uniforms.ds_shaderViewport.zw"
        );
        expect(fragment.CUSTOM_FRAGMENT_MAIN_BEGIN).toContain("vec2f(ds_baseUvBottomLeft.x, 1.0 - ds_baseUvBottomLeft.y)");
        expect(fragment.CUSTOM_FRAGMENT_MAIN_BEGIN).toContain("uniforms.ds_uvTransform * vec4f");
        expect(fragment.CUSTOM_FRAGMENT_MAIN_BEGIN).toContain("uniforms.ds_uvTransformRight * vec4f");
        expect(fragment.CUSTOM_FRAGMENT_MAIN_BEGIN).toContain("textureSample(ds_depthSampler, ds_depthSamplerSampler, ds_depthUv, i32(ds_viewIndexSet))");
        expect(fragment.CUSTOM_FRAGMENT_MAIN_BEGIN).toContain("textureSample(ds_depthSampler, ds_depthSamplerSampler, ds_depthUv)");
        expect(fragment.CUSTOM_FRAGMENT_MAIN_BEGIN).toContain("textureSampleLevel(ds_depthSampler, ds_depthSamplerSampler, ds_depthUv, 0.0)");
        expect(fragment.CUSTOM_FRAGMENT_MAIN_BEGIN).toContain("textureSampleLevel(ds_depthSamplerRight, ds_depthSamplerRightSampler, ds_depthUv, 0.0)");
        expect(fragment.CUSTOM_FRAGMENT_MAIN_BEGIN).toContain("ds_cameraDepth = ds_cameraDepth * ds_rawValueToMetersSet;");
        expect(fragment.CUSTOM_FRAGMENT_MAIN_BEGIN).toContain("scene.view * vec4f(fragmentInputs.vPositionW, 1.0)");
        expect(fragment.CUSTOM_FRAGMENT_MAIN_BEGIN).toContain("uniforms.ds_viewRight * vec4f(fragmentInputs.vPositionW, 1.0)");
        expect(fragment.CUSTOM_FRAGMENT_MAIN_BEGIN).toContain("let ds_assetDepth: f32 = (ds_viewPosition.z * uniforms.ds_viewDepthSign) / uniforms.ds_worldScale;");
        expect(fragment.CUSTOM_FRAGMENT_MAIN_BEGIN).toContain(
            "if (ds_depthAvailable > 0.5 && ds_cameraDepth > 0.0 && ds_cameraDepth < ds_assetDepth)"
        );
        expect(fragment.CUSTOM_FRAGMENT_MAIN_BEGIN).toContain("discard;");
        expect(fragment.CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR).toContain("let ds_depthTolerancePerM: f32 = 0.005;");
        expect(fragment.CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR).toContain("color *= (1.0 - ds_occlusion);");
    });

    it("compares meter depth against handedness-correct linear view-space depth instead of nonlinear device depth", () => {
        const plugin = createPlugin(ShaderLanguage.WGSL);
        const fragment = plugin.getCustomCode("fragment", ShaderLanguage.WGSL)!;
        const near = 0.1;
        const far = 10;
        const viewDepthMeters = 2;
        const environmentDepthMeters = 1;
        const clipZ = (far / (far - near)) * viewDepthMeters - (near * far) / (far - near);
        const deviceDepth = clipZ / viewDepthMeters;
        const leftHandedViewZ = viewDepthMeters;
        const rightHandedViewZ = -viewDepthMeters;

        expect(environmentDepthMeters < deviceDepth).toBe(false);
        expect(environmentDepthMeters < leftHandedViewZ).toBe(true);
        expect(environmentDepthMeters < -rightHandedViewZ).toBe(true);
        expect(fragment.CUSTOM_FRAGMENT_MAIN_BEGIN).toContain("fragmentInputs.vPositionW");
        expect(fragment.CUSTOM_FRAGMENT_MAIN_BEGIN).toContain("uniforms.ds_viewDepthSign");
        expect(fragment.CUSTOM_FRAGMENT_MAIN_BEGIN).not.toContain("1.0 / fragmentInputs.position.w");
        expect(fragment.CUSTOM_FRAGMENT_MAIN_BEGIN).not.toContain("fragmentInputs.position.z;");
    });

    it("treats zero-valued CPU depth as unavailable in both WGSL occlusion modes", () => {
        const plugin = createPlugin(ShaderLanguage.WGSL);
        const fragment = plugin.getCustomCode("fragment", ShaderLanguage.WGSL)!;

        expect(fragment.CUSTOM_FRAGMENT_MAIN_BEGIN).toContain(
            "if (ds_depthAvailable > 0.5 && ds_cameraDepth > 0.0 && ds_cameraDepth < ds_assetDepth)"
        );
        expect(fragment.CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR).toContain("if (ds_depthAvailable > 0.5 && ds_cameraDepth > 0.0)");
    });

    it("compensates for Babylon's assembled fragment-coordinate flip to address top-left CPU depth rows", () => {
        const plugin = createPlugin(ShaderLanguage.WGSL);
        const fragment = plugin.getCustomCode("fragment", ShaderLanguage.WGSL)!;
        const uvCode = fragment.CUSTOM_FRAGMENT_MAIN_BEGIN.match(
            /let ds_baseUvBottomLeft:[\s\S]+?let ds_baseUv: vec2f = vec2f\(ds_baseUvBottomLeft\.x, 1\.0 - ds_baseUvBottomLeft\.y\);/
        )?.[0];
        expect(uvCode).toBeDefined();

        const processor = new WebGPUShaderProcessorWGSL();
        processor.pureMode = false;
        processor.initializeShaders(new WebGPUShaderProcessingContext(ShaderLanguage.WGSL, true));
        const processed = processor.finalizeShaders(
            `@vertex fn main(input: VertexInputs) -> FragmentInputs {
                vertexOutputs.position = vec4f(0.0);
            }`,
            `@fragment fn main(input: FragmentInputs) -> FragmentOutputs {
                ${uvCode}
                fragmentOutputs.color = vec4f(ds_baseUv, 0.0, 1.0);
            }`
        ).fragmentCode;

        const processorFlip = "fragmentInputs.position.y = internals.textureOutputHeight_ - fragmentInputs.position.y;";
        const depthRowCorrection = "let ds_baseUv: vec2f = vec2f(ds_baseUvBottomLeft.x, 1.0 - ds_baseUvBottomLeft.y);";
        expect(processed).toContain(processorFlip);
        expect(processed.indexOf(processorFlip)).toBeLessThan(processed.indexOf(depthRowCorrection));
    });

    it("preserves the GLSL injection strings byte for byte", () => {
        const plugin = createPlugin(ShaderLanguage.GLSL);
        const shaderSource = JSON.stringify({
            fragment: plugin.getCustomCode("fragment", ShaderLanguage.GLSL),
            uniforms: plugin.getUniforms(ShaderLanguage.GLSL),
            vertex: plugin.getCustomCode("vertex", ShaderLanguage.GLSL),
        });

        expect(createHash("sha256").update(shaderSource).digest("hex")).toBe("04512bdd67e7ff7ecb513ba4168874a5bf2bb76266daf21b783521d622fa9e03");
    });
});
