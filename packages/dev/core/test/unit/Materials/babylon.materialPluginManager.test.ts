import { NullEngine } from "core/Engines/nullEngine";
import { FreeCamera } from "core/Cameras/freeCamera";
import { Vector3 } from "core/Maths/math.vector";
import { type Material } from "core/Materials/material";
import { MaterialPluginBase } from "core/Materials/materialPluginBase";
import { MaterialPluginManager } from "core/Materials/materialPluginManager";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { type Mesh } from "core/Meshes/mesh";
import { Scene } from "core/scene";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

class PluginA extends MaterialPluginBase {
    constructor(material: Material) {
        super(material, "PluginA", 200, { PLUGIN_A: false });
    }

    public override getClassName(): string {
        return "MarkerTestPluginA";
    }

    public override getUniforms() {
        return { ubo: [{ name: "pluginAColor", size: 4, type: "vec4" }] };
    }
}

class PluginB extends MaterialPluginBase {
    constructor(material: Material) {
        super(material, "PluginB", 300, { PLUGIN_B: false }, true, true);
    }

    public override getClassName(): string {
        return "MarkerTestPluginB";
    }

    public override getUniforms() {
        return { ubo: [{ name: "pluginBColor", size: 4, type: "vec4" }] };
    }
}

function GetMarker(className: string): string {
    return (MaterialPluginManager as any)._MaterialPluginClassToMainDefine[className];
}

describe("MaterialPluginManager", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 64,
            renderWidth: 64,
            textureSize: 64,
        });
        scene = new Scene(engine);
        new FreeCamera("camera", new Vector3(0, 0, -5), scene);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    function getDefines(material: StandardMaterial, mesh: Mesh): string {
        const subMesh = mesh.subMeshes[0];
        material.isReadyForSubMesh(mesh, subMesh);
        return subMesh.materialDefines!.toString();
    }

    it("adds the marker define of every registered plugin", () => {
        const material = new StandardMaterial("material", scene);
        new PluginA(material);
        new PluginB(material);
        const mesh = MeshBuilder.CreateBox("mesh", {}, scene);
        mesh.material = material;

        const defines = getDefines(material, mesh);

        expect(defines).toContain(`#define ${GetMarker("MarkerTestPluginA")}\n`);
        expect(defines).toContain(`#define ${GetMarker("MarkerTestPluginB")}\n`);
        // The built-in DetailMap plugin of the StandardMaterial keeps its marker too
        expect(defines).toContain(`#define ${GetMarker("DetailMapConfiguration")}\n`);
    });

    it("gives different effects to materials whose plugin sets differ only by a disabled plugin", () => {
        const materialWithDisabledPlugin = new StandardMaterial("withDisabledPlugin", scene);
        // PluginA is never enabled, but its uniforms are still part of the material's UBO layout
        new PluginA(materialWithDisabledPlugin);
        new PluginB(materialWithDisabledPlugin);
        const meshWithDisabledPlugin = MeshBuilder.CreateBox("meshWithDisabledPlugin", {}, scene);
        meshWithDisabledPlugin.material = materialWithDisabledPlugin;

        const materialWithoutPlugin = new StandardMaterial("withoutPlugin", scene);
        new PluginB(materialWithoutPlugin);
        const meshWithoutPlugin = MeshBuilder.CreateBox("meshWithoutPlugin", {}, scene);
        meshWithoutPlugin.material = materialWithoutPlugin;

        const definesWithDisabledPlugin = getDefines(materialWithDisabledPlugin, meshWithDisabledPlugin);
        const definesWithoutPlugin = getDefines(materialWithoutPlugin, meshWithoutPlugin);

        expect(definesWithDisabledPlugin).not.toEqual(definesWithoutPlugin);
        expect(definesWithDisabledPlugin).toContain(`#define ${GetMarker("MarkerTestPluginA")}\n`);
        expect(definesWithoutPlugin).not.toContain(`#define ${GetMarker("MarkerTestPluginA")}\n`);
        expect(meshWithDisabledPlugin.subMeshes[0].effect).not.toBe(meshWithoutPlugin.subMeshes[0].effect);
    });
});
