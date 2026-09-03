import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { FrameGraph } from "core/FrameGraph/frameGraph";
import { FrameGraphIblShadowsRendererTask } from "core/FrameGraph/Tasks/Rendering/iblShadowsRendererTask.pure";
import { IBLShadowsPluginMaterial } from "core/Rendering/IBLShadows/iblShadowsPluginMaterial.pure";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { ShadowOnlyMaterial } from "materials/shadowOnly/shadowOnlyMaterial";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("ShadowOnlyMaterial + IBL shadows", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    describe("Frame Graph task registration", () => {
        // Guards the Frame Graph / NRGE path (FrameGraphIblShadowsRendererTask), which the shared
        // IsIBLShadowsReceiverCompatible predicate feeds — the visualization test only exercises the
        // legacy IblShadowsRenderPipeline.
        it("installs the IBL shadows plugin on a ShadowOnlyMaterial through addShadowReceivingMaterial", () => {
            const frameGraph = new FrameGraph(scene);
            const task = new FrameGraphIblShadowsRendererTask("ibl", frameGraph);
            const material = new ShadowOnlyMaterial("shadowOnly", scene);

            expect(material.pluginManager?.getPlugin(IBLShadowsPluginMaterial.Name)).toBeFalsy();

            task.addShadowReceivingMaterial(material);

            expect(material.pluginManager?.getPlugin(IBLShadowsPluginMaterial.Name)).toBeTruthy();

            task.dispose();
            frameGraph.dispose();
        });

        it("still installs the plugin on supported core materials (StandardMaterial) through the task", () => {
            const frameGraph = new FrameGraph(scene);
            const task = new FrameGraphIblShadowsRendererTask("ibl", frameGraph);
            const material = new StandardMaterial("std", scene);

            task.addShadowReceivingMaterial(material);

            expect(material.pluginManager?.getPlugin(IBLShadowsPluginMaterial.Name)).toBeTruthy();

            task.dispose();
            frameGraph.dispose();
        });
    });

    describe("Colored shadows contract (monochrome, Rec.709)", () => {
        // The colored branch reduces the RGB shadow to Rec.709 luminance and modulates alpha; assert the
        // exact weights are injected (the visualization snippet does not enable coloredShadows).
        it.each([
            { language: "GLSL", shaderLanguage: ShaderLanguage.GLSL },
            { language: "WGSL", shaderLanguage: ShaderLanguage.WGSL },
        ])("injects Rec.709 luminance weights in the $language shadow composition", ({ shaderLanguage }) => {
            const material = new ShadowOnlyMaterial("shadowOnly", scene);
            const plugin = new IBLShadowsPluginMaterial(material);
            plugin.isColored = true;

            const code = plugin.getCustomCode("fragment", shaderLanguage);
            const injection = code?.["CUSTOM_FRAGMENT_BEFORE_LIGHT_COMPOSITION"] ?? "";

            // Rec.709 luma weights, and modulation of the scalar `shadow` (alpha), not color.rgb.
            expect(injection).toContain("0.2126");
            expect(injection).toContain("0.7152");
            expect(injection).toContain("0.0722");
            expect(injection).toMatch(/shadow\s*\*=/);
        });
    });
});
