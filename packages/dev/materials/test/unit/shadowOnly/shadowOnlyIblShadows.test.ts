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
        // `isColored` must actually drive the COLORED_IBL_SHADOWS define — otherwise the source string
        // (which always contains both preprocessor branches) would keep the Rec.709 path "present" even
        // if the define were never set. Assert the wiring, then assert the resolved (compiled) variant.
        it("wires isColored to the COLORED_IBL_SHADOWS define in both directions", () => {
            const plugin = new IBLShadowsPluginMaterial(new ShadowOnlyMaterial("shadowOnly", scene));
            const defines: Record<string, boolean> = {};

            plugin.isColored = true;
            plugin.prepareDefines(defines as never);
            expect(defines.COLORED_IBL_SHADOWS).toBe(true);

            plugin.isColored = false;
            plugin.prepareDefines(defines as never);
            expect(defines.COLORED_IBL_SHADOWS).toBe(false);
        });

        it.each([
            { language: "GLSL", shaderLanguage: ShaderLanguage.GLSL },
            { language: "WGSL", shaderLanguage: ShaderLanguage.WGSL },
        ])("resolves to the Rec.709 luminance path only when COLORED_IBL_SHADOWS is defined ($language)", ({ shaderLanguage }) => {
            const plugin = new IBLShadowsPluginMaterial(new ShadowOnlyMaterial("shadowOnly", scene));
            const injection = plugin.getCustomCode("fragment", shaderLanguage)?.["CUSTOM_FRAGMENT_BEFORE_LIGHT_COMPOSITION"] ?? "";

            const colored = resolveDefines(injection, ["RENDER_WITH_IBL_SHADOWS", "COLORED_IBL_SHADOWS"]);
            const monochrome = resolveDefines(injection, ["RENDER_WITH_IBL_SHADOWS"]);
            const disabled = resolveDefines(injection, []);

            // Colored variant: Rec.709 luma of the vec3 shadow, and NOT the monochrome `.x` scalar path.
            expect(colored).toContain("0.2126");
            expect(colored).toContain("0.7152");
            expect(colored).toContain("0.0722");
            expect(colored).not.toMatch(/shadowValue\.x/);

            // Monochrome variant: the `.x` scalar path, and NOT the Rec.709 weights.
            expect(monochrome).toMatch(/shadowValue\.x/);
            expect(monochrome).not.toContain("0.2126");

            // With IBL shadows disabled, no shadow modulation is emitted at all.
            expect(disabled).not.toContain("computeIndirectShadow");
        });
    });
});

/**
 * Minimal preprocessor: resolves nested #ifdef/#ifndef/#else/#endif for the given defined symbols and
 * returns the surviving source. The plugin's injection snippets only use these constructs.
 * @param source The shader snippet to resolve.
 * @param definedNames The preprocessor symbols that are defined.
 * @returns The source with inactive preprocessor branches removed.
 */
function resolveDefines(source: string, definedNames: string[]): string {
    const defined = new Set(definedNames);
    const stack: { parentActive: boolean; conditionMet: boolean; active: boolean }[] = [];
    const active = () => stack.every((frame) => frame.active);
    const out: string[] = [];

    for (const line of source.split("\n")) {
        const trimmed = line.trim();
        const ifdef = trimmed.match(/^#ifdef\s+(\w+)/);
        const ifndef = trimmed.match(/^#ifndef\s+(\w+)/);

        if (ifdef || ifndef) {
            const conditionMet = ifdef ? defined.has(ifdef[1]) : !defined.has(ifndef![1]);
            const parentActive = active();
            stack.push({ parentActive, conditionMet, active: parentActive && conditionMet });
        } else if (/^#else\b/.test(trimmed)) {
            const frame = stack[stack.length - 1];
            frame.active = frame.parentActive && !frame.conditionMet;
        } else if (/^#endif\b/.test(trimmed)) {
            stack.pop();
        } else if (active()) {
            out.push(line);
        }
    }

    return out.join("\n");
}
