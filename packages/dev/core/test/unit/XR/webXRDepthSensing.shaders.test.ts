/**
 * @vitest-environment jsdom
 */

import { createHash } from "node:crypto";
import { NullEngine } from "core/Engines/nullEngine";
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
        expect(uniforms.ubo?.map(({ name }) => name)).toEqual(["ds_invScreenSize", "ds_rawValueToMeters", "ds_viewIndex", "ds_shaderViewport", "ds_uvTransform"]);
        expect(vertex.CUSTOM_VERTEX_DEFINITIONS).toContain("varying ds_viewIndexMultiview: f32;");
        expect(vertex.CUSTOM_VERTEX_MAIN_BEGIN).toContain("vertexOutputs.ds_viewIndexMultiview = f32(gl_ViewID_OVR);");
        expect(fragment.CUSTOM_FRAGMENT_DEFINITIONS).toContain("var ds_depthSampler: texture_2d<f32>;");
        expect(fragment.CUSTOM_FRAGMENT_DEFINITIONS).toContain("var ds_depthSampler: texture_2d_array<f32>;");
        expect(fragment.CUSTOM_FRAGMENT_DEFINITIONS).toContain("var ds_depthSamplerSampler: sampler;");
        expect(fragment.CUSTOM_FRAGMENT_MAIN_BEGIN).toContain("fragmentInputs.position.xy * uniforms.ds_invScreenSize");
        expect(fragment.CUSTOM_FRAGMENT_MAIN_BEGIN).toContain("uniforms.ds_uvTransform * vec4f");
        expect(fragment.CUSTOM_FRAGMENT_MAIN_BEGIN).toContain("textureSample(ds_depthSampler, ds_depthSamplerSampler, ds_depthUv, i32(ds_viewIndexSet))");
        expect(fragment.CUSTOM_FRAGMENT_MAIN_BEGIN).toContain("textureSample(ds_depthSampler, ds_depthSamplerSampler, ds_depthUv)");
        expect(fragment.CUSTOM_FRAGMENT_MAIN_BEGIN).toContain("ds_cameraDepth = ds_cameraDepth * uniforms.ds_rawValueToMeters;");
        expect(fragment.CUSTOM_FRAGMENT_MAIN_BEGIN).toContain("let ds_assetDepth: f32 = fragmentInputs.position.z;");
        expect(fragment.CUSTOM_FRAGMENT_MAIN_BEGIN).toContain("discard;");
        expect(fragment.CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR).toContain("let ds_depthTolerancePerM: f32 = 0.005;");
        expect(fragment.CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR).toContain("color *= (1.0 - ds_occlusion);");
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
