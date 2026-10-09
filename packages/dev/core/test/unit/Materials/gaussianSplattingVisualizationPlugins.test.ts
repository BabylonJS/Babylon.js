import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Constants } from "core/Engines/constants";
import { GaussianSplattingMaterial } from "core/Materials/GaussianSplatting/gaussianSplattingMaterial";
import { GaussianSplattingSizeMaterialPlugin } from "core/Materials/GaussianSplatting/gaussianSplattingSizeMaterialPlugin";
import { GaussianSplattingOverdrawMaterialPlugin } from "core/Materials/GaussianSplatting/gaussianSplattingOverdrawMaterialPlugin";
import { GaussianSplattingSolidColorMaterialPlugin } from "core/Materials/GaussianSplatting/gaussianSplattingSolidColorMaterialPlugin";
import { GaussianSplattingGpuPickingMaterialPlugin } from "core/Materials/GaussianSplatting/gaussianSplattingGpuPickingMaterialPlugin";
import { type MaterialPluginBase } from "core/Materials/materialPluginBase";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { Scene } from "core/scene";

describe("Gaussian splat visualization plugins", () => {
    let engine: NullEngine;
    let scene: Scene;
    let material: GaussianSplattingMaterial;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        material = new GaussianSplattingMaterial("visual", scene);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("validates projected pixel scale and gates rendering without recompilation", () => {
        const size = new GaussianSplattingSizeMaterialPlugin(material);
        expect(size.sizeScale).toBe(16);
        expect(size.isEnabled).toBe(true);
        expect(() => (size.sizeScale = 0)).toThrow(RangeError);
        expect(() => (size.sizeScale = Infinity)).toThrow(RangeError);
        for (const language of [ShaderLanguage.GLSL, ShaderLanguage.WGSL]) {
            expect(size.isCompatible(language)).toBe(true);
            expect(size.getCustomCode("vertex", language)?.CUSTOM_GAUSSIAN_SPLAT_PROJECTED_SIZE).toContain("majorAxis");
            expect(size.getCustomCode("fragment", language)?.CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR).toContain("splatSizeEnabled");
        }
        size.isEnabled = false;
        expect(size.serialize().isEnabled).toBe(false);
    });

    it("uses additive RGB with no depth writes, then restores every owned material state", () => {
        material.alphaMode = Constants.ALPHA_COMBINE;
        material.forceDepthWrite = true;
        const overdraw = new GaussianSplattingOverdrawMaterialPlugin(material);
        expect(overdraw.intensity).toBe(1 / 256);
        expect(material.alphaMode).toBe(Constants.ALPHA_ONEONE);
        expect(material.disableDepthWrite).toBe(true);
        expect(material.forceDepthWrite).toBe(false);
        expect(() => (overdraw.intensity = NaN)).toThrow(RangeError);
        expect(() => (overdraw.intensity = 0)).toThrow(RangeError);
        for (const language of [ShaderLanguage.GLSL, ShaderLanguage.WGSL]) {
            expect(overdraw.isCompatible(language)).toBe(true);
            expect(overdraw.getCustomCode("fragment", language)?.CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR).toContain("finalColor.a <= 0.0");
        }
        overdraw.isEnabled = false;
        expect(material.alphaMode).toBe(Constants.ALPHA_COMBINE);
        expect(material.disableDepthWrite).toBe(false);
        expect(material.forceDepthWrite).toBe(true);
        overdraw.isEnabled = true;
        overdraw.dispose();
        expect(material.alphaMode).toBe(Constants.ALPHA_COMBINE);
    });

    it("preserves the pre-plugin blend state through clone and serialization", () => {
        material.alphaMode = Constants.ALPHA_COMBINE;
        const overdraw = new GaussianSplattingOverdrawMaterialPlugin(material);
        overdraw.intensity = 0.08;
        const cloned = material.clone("cloned");
        const clonedPlugin = cloned.pluginManager?.getPlugin(overdraw.name) as GaussianSplattingOverdrawMaterialPlugin;
        expect(clonedPlugin).toBeDefined();
        expect(cloned.alphaMode).toBe(Constants.ALPHA_ONEONE);
        clonedPlugin.isEnabled = false;
        expect(cloned.alphaMode).toBe(Constants.ALPHA_COMBINE);
        const serialized = material.serialize();
        const parsed = GaussianSplattingMaterial.Parse(serialized, scene, "");
        const parsedPlugin = parsed.pluginManager?.getPlugin(overdraw.name) as GaussianSplattingOverdrawMaterialPlugin;
        expect(parsedPlugin.intensity).toBe(0.08);
        parsedPlugin.isEnabled = false;
        expect(parsed.alphaMode).toBe(Constants.ALPHA_COMBINE);
    });

    it("preserves disabled visualization settings through clone and parse", () => {
        const size = new GaussianSplattingSizeMaterialPlugin(material);
        const overdraw = new GaussianSplattingOverdrawMaterialPlugin(material);
        size.sizeScale = 24;
        overdraw.intensity = 1 / 128;
        size.isEnabled = false;
        overdraw.isEnabled = false;

        for (const copy of [material.clone("disabledClone"), GaussianSplattingMaterial.Parse(material.serialize(), scene, "")]) {
            const copiedSize = copy.pluginManager?.getPlugin(size.name) as GaussianSplattingSizeMaterialPlugin;
            const copiedOverdraw = copy.pluginManager?.getPlugin(overdraw.name) as GaussianSplattingOverdrawMaterialPlugin;
            expect(copiedSize.sizeScale).toBe(24);
            expect(copiedSize.isEnabled).toBe(false);
            expect(copiedOverdraw.intensity).toBe(1 / 128);
            expect(copiedOverdraw.isEnabled).toBe(false);
            expect(copy.alphaMode).not.toBe(Constants.ALPHA_ONEONE);
        }
    });

    it("preserves material changes made while overdraw is disabled through clone, parse, and copyTo", () => {
        material.alphaMode = Constants.ALPHA_COMBINE;
        material.disableDepthWrite = false;
        material.forceDepthWrite = true;
        const overdraw = new GaussianSplattingOverdrawMaterialPlugin(material);
        overdraw.isEnabled = false;
        material.alphaMode = Constants.ALPHA_ONEONE;
        material.disableDepthWrite = true;
        material.forceDepthWrite = false;
        const clone = material.clone("changedWhileDisabled");
        const parsed = GaussianSplattingMaterial.Parse(material.serialize(), scene, "");
        const destination = new GaussianSplattingMaterial("copyTo", scene);
        destination.alphaMode = Constants.ALPHA_ONEONE;
        destination.disableDepthWrite = true;
        destination.forceDepthWrite = false;
        const target = new GaussianSplattingOverdrawMaterialPlugin(destination);
        target.isEnabled = false;
        overdraw.copyTo(target);
        for (const [copy, plugin] of [
            [clone, clone.pluginManager?.getPlugin(overdraw.name)],
            [parsed, parsed.pluginManager?.getPlugin(overdraw.name)],
            [destination, target],
        ] as const) {
            const copied = plugin as GaussianSplattingOverdrawMaterialPlugin;
            expect(copied.isEnabled).toBe(false);
            expect(copy.alphaMode).toBe(Constants.ALPHA_ONEONE);
            expect(copy.disableDepthWrite).toBe(true);
            expect(copy.forceDepthWrite).toBe(false);
            copied.isEnabled = true;
            copied.isEnabled = false;
            expect(copy.alphaMode).toBe(Constants.ALPHA_ONEONE);
            expect(copy.disableDepthWrite).toBe(true);
            expect(copy.forceDepthWrite).toBe(false);
        }
    });

    it("keeps the destination blend state when copying disabled overdraw into an enabled plugin", () => {
        const source = new GaussianSplattingOverdrawMaterialPlugin(material);
        source.isEnabled = false;
        material.alphaMode = Constants.ALPHA_ONEONE;
        material.disableDepthWrite = true;
        material.forceDepthWrite = false;

        const destination = new GaussianSplattingMaterial("enabledDestination", scene);
        destination.alphaMode = Constants.ALPHA_COMBINE;
        destination.disableDepthWrite = false;
        destination.forceDepthWrite = true;
        const target = new GaussianSplattingOverdrawMaterialPlugin(destination);
        source.copyTo(target);

        expect(target.isEnabled).toBe(false);
        expect(destination.alphaMode).toBe(Constants.ALPHA_COMBINE);
        expect(destination.disableDepthWrite).toBe(false);
        expect(destination.forceDepthWrite).toBe(true);
        target.isEnabled = true;
        target.isEnabled = false;
        expect(destination.alphaMode).toBe(Constants.ALPHA_COMBINE);
        expect(destination.disableDepthWrite).toBe(false);
        expect(destination.forceDepthWrite).toBe(true);
    });

    it("keeps the destination blend state when parsing disabled overdraw into existing plugins", () => {
        const source = new GaussianSplattingOverdrawMaterialPlugin(material);
        source.isEnabled = false;
        material.alphaMode = Constants.ALPHA_ONEONE;
        material.disableDepthWrite = true;
        material.forceDepthWrite = false;

        for (const initiallyEnabled of [true, false]) {
            const destination = new GaussianSplattingMaterial("parsedDestination", scene);
            destination.alphaMode = Constants.ALPHA_COMBINE;
            destination.disableDepthWrite = false;
            destination.forceDepthWrite = true;
            const target = new GaussianSplattingOverdrawMaterialPlugin(destination);
            if (!initiallyEnabled) {
                target.isEnabled = false;
            }
            target.parse(source.serialize(), scene, "");
            expect(target.isEnabled).toBe(false);
            expect(destination.alphaMode).toBe(Constants.ALPHA_COMBINE);
            expect(destination.disableDepthWrite).toBe(false);
            expect(destination.forceDepthWrite).toBe(true);
            target.isEnabled = true;
            target.isEnabled = false;
            expect(destination.alphaMode).toBe(Constants.ALPHA_COMBINE);
            expect(destination.disableDepthWrite).toBe(false);
            expect(destination.forceDepthWrite).toBe(true);
        }
    });

    it("restores the saved pre-enable settings when parsing enabled overdraw into an existing plugin", () => {
        material.alphaMode = Constants.ALPHA_COMBINE;
        material.disableDepthWrite = false;
        material.forceDepthWrite = true;
        const source = new GaussianSplattingOverdrawMaterialPlugin(material);
        const destination = new GaussianSplattingMaterial("existing", scene);
        const target = new GaussianSplattingOverdrawMaterialPlugin(destination);
        target.isEnabled = false;
        target.parse(source.serialize(), scene, "");
        expect(target.isEnabled).toBe(true);
        expect(destination.alphaMode).toBe(Constants.ALPHA_ONEONE);
        expect(destination.disableDepthWrite).toBe(true);
        expect(destination.forceDepthWrite).toBe(false);
        target.isEnabled = false;
        expect(destination.alphaMode).toBe(Constants.ALPHA_COMBINE);
        expect(destination.disableDepthWrite).toBe(false);
        expect(destination.forceDepthWrite).toBe(true);
    });

    it("applies color overrides before size and overdraw, then GPU picking last", () => {
        const picking = new GaussianSplattingGpuPickingMaterialPlugin(material);
        const overdraw = new GaussianSplattingOverdrawMaterialPlugin(material);
        const size = new GaussianSplattingSizeMaterialPlugin(material);
        const solid = new GaussianSplattingSolidColorMaterialPlugin(material, []);
        const manager = material.pluginManager as unknown as {
            _activePlugins: MaterialPluginBase[];
            _injectCustomCode: (eventData: object) => (shaderType: string, code: string) => string;
        };
        expect(manager._activePlugins).toEqual([solid, size, overdraw, picking]);
        const fragment = manager._injectCustomCode({})("fragment", "#define CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR");
        const solidIndex = fragment.indexOf("solidColorEnabled > 0.5");
        const sizeIndex = fragment.indexOf("splatSizeEnabled > 0.5");
        const overdrawIndex = fragment.indexOf("splatOverdrawEnabled > 0.5");
        const pickingIndex = fragment.indexOf("finalColor = vec4(pickingColor, 1.0)");
        expect(solidIndex).toBeGreaterThanOrEqual(0);
        expect(sizeIndex).toBeGreaterThan(solidIndex);
        expect(overdrawIndex).toBeGreaterThan(sizeIndex);
        expect(pickingIndex).toBeGreaterThan(overdrawIndex);
    });
});
