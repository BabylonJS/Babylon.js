import { NullEngine } from "core/Engines/nullEngine";
import { FreeCamera } from "core/Cameras/freeCamera";
import { Matrix, Vector3 } from "core/Maths/math.vector";
import { BackgroundMaterial } from "core/Materials/Background/backgroundMaterial";
import { DitheredTileFadeMaterialPlugin, type IDitheredTileFadeBounds } from "core/Materials/ditheredTileFadeMaterialPlugin";
import { MultiMaterial } from "core/Materials/multiMaterial";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { SubMesh } from "core/Meshes/subMesh";
import { Scene } from "core/scene";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "core/Meshes/instancedMesh";
import "core/Meshes/thinInstanceMesh";

describe("DitheredTileFadeMaterialPlugin", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 64,
            renderWidth: 64,
            textureSize: 64,
        });
        engine.getCaps().instancedArrays = true;
        scene = new Scene(engine);
        new FreeCamera("camera", new Vector3(0, 0, -5), scene);
        scene.updateTransformMatrix(true);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it.each([
        ["StandardMaterial", (name: string) => new StandardMaterial(name, scene)],
        ["PBRMaterial", (name: string) => new PBRMaterial(name, scene)],
    ])("attaches to and reuses a %s", (_name, createMaterial) => {
        const material = createMaterial("material");
        const plugin = DitheredTileFadeMaterialPlugin.GetOrCreate(material);

        expect(DitheredTileFadeMaterialPlugin.GetOrCreate(material)).toBe(plugin);
        expect(() => new DitheredTileFadeMaterialPlugin(material)).toThrow(/GetOrCreate/);
        expect(plugin.doNotSerialize).toBe(true);
        expect(plugin.registerForExtraEvents).toBe(true);
    });

    it("rejects unsupported material families", () => {
        const material = new BackgroundMaterial("background", scene);

        expect(() => DitheredTileFadeMaterialPlugin.GetOrCreate(material as unknown as StandardMaterial)).toThrow(TypeError);
    });

    it("validates bounds and allows an intentional empty interval", () => {
        const material = new StandardMaterial("material", scene);
        const mesh = MeshBuilder.CreateBox("mesh", {}, scene);
        const plugin = new DitheredTileFadeMaterialPlugin(material);
        const bounds: IDitheredTileFadeBounds = { lowerBound: -1, upperBound: -1 };

        for (const value of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, -0.01, 1.01]) {
            expect(() => plugin.setFadeLowerBound(mesh, value)).toThrow(RangeError);
            expect(() => plugin.setFadeUpperBound(mesh, value)).toThrow(RangeError);
        }

        plugin.setFadeLowerBound(mesh, 0.8);
        plugin.setFadeUpperBound(mesh, 0.2);

        expect(plugin.getFadeBoundsToRef(mesh, bounds)).toBe(true);
        expect(bounds).toEqual({ lowerBound: 0.8, upperBound: 0.2 });
    });

    it("defaults to full coverage and resets per-mesh or all runtime state", () => {
        const material = new StandardMaterial("material", scene);
        const meshA = MeshBuilder.CreateBox("meshA", {}, scene);
        const meshB = MeshBuilder.CreateBox("meshB", {}, scene);
        const plugin = new DitheredTileFadeMaterialPlugin(material);
        const bounds: IDitheredTileFadeBounds = { lowerBound: -1, upperBound: -1 };

        expect(plugin.getFadeBoundsToRef(meshA, bounds)).toBe(false);
        expect(bounds).toEqual({ lowerBound: 0, upperBound: 1 });

        plugin.setFadeBounds(meshA, 0.25, 0.5);
        plugin.setFadeBounds(meshB, 0.5, 0.75);
        plugin.resetFade(meshA);
        expect(plugin.getFadeBoundsToRef(meshA, bounds)).toBe(false);
        expect(plugin.getFadeBoundsToRef(meshB, bounds)).toBe(true);

        plugin.reset();
        expect(plugin.getFadeBoundsToRef(meshB, bounds)).toBe(false);
    });

    it.each([
        ["StandardMaterial", (name: string) => new StandardMaterial(name, scene)],
        ["PBRMaterial", (name: string) => new PBRMaterial(name, scene)],
    ])("uploads independent values on consecutive shared and frozen %s draws", async (_name, createMaterial) => {
        const material = createMaterial("shared");
        const meshA = MeshBuilder.CreateBox("meshA", {}, scene);
        const meshB = MeshBuilder.CreateBox("meshB", {}, scene);
        const plugin = new DitheredTileFadeMaterialPlugin(material);
        meshA.material = material;
        meshB.material = material;
        plugin.setFadeBounds(meshA, 0, 0.25);
        plugin.setFadeBounds(meshB, 0.75, 1);

        await material.forceCompilationAsync(meshA);
        expect(material.isReadyForSubMesh(meshA, meshA.subMeshes[0], false)).toBe(true);
        expect(material.isReadyForSubMesh(meshB, meshB.subMeshes[0], false)).toBe(true);
        material.freeze();

        const effect = meshA.subMeshes[0].effect!;
        const setFloat4 = vi.spyOn(effect, "setFloat4");

        const bindAndGetSettings = (mesh: typeof meshA): unknown[] | undefined => {
            setFloat4.mockClear();
            material.bindForSubMesh(mesh.getWorldMatrix(), mesh, mesh.subMeshes[0]);
            return setFloat4.mock.calls.find((call) => call[0] === "ditheredFadeSettings");
        };

        expect(bindAndGetSettings(meshA)).toEqual(["ditheredFadeSettings", 0, 0.25, 1, 1]);
        expect(bindAndGetSettings(meshB)).toEqual(["ditheredFadeSettings", 0.75, 1, 1, 1]);
        expect(bindAndGetSettings(meshA)).toEqual(["ditheredFadeSettings", 0, 0.25, 1, 1]);

        plugin.isEnabled = false;
        expect(bindAndGetSettings(meshA)).toEqual(["ditheredFadeSettings", 0, 0.25, 0, 1]);
    });

    it("binds the plugin on a MultiMaterial leaf submesh", async () => {
        const mesh = MeshBuilder.CreateBox("mesh", {}, scene);
        const leafMaterial = new StandardMaterial("leaf", scene);
        const otherMaterial = new StandardMaterial("other", scene);
        const multiMaterial = new MultiMaterial("multi", scene);
        multiMaterial.subMaterials.push(leafMaterial, otherMaterial);
        mesh.material = multiMaterial;
        mesh.releaseSubMeshes();
        const subMesh = new SubMesh(0, 0, mesh.getTotalVertices(), 0, mesh.getTotalIndices(), mesh);
        const plugin = new DitheredTileFadeMaterialPlugin(leafMaterial);
        plugin.setFadeBounds(mesh, 0.125, 0.875);

        await leafMaterial.forceCompilationAsync(mesh);
        expect(subMesh.getMaterial()).toBe(leafMaterial);
        expect(leafMaterial.isReadyForSubMesh(mesh, subMesh, false)).toBe(true);
        const setFloat4 = vi.spyOn(subMesh.effect!, "setFloat4");

        leafMaterial.bindForSubMesh(mesh.getWorldMatrix(), mesh, subMesh);

        expect(setFloat4.mock.calls.find((call) => call[0] === "ditheredFadeSettings")).toEqual(["ditheredFadeSettings", 0.125, 0.875, 1, 1]);
    });

    it("injects equivalent late GLSL and WGSL Bayer interval tests with a depth-prepass guard", () => {
        const plugin = new DitheredTileFadeMaterialPlugin(new StandardMaterial("material", scene));
        const glsl = plugin.getCustomCode("fragment")!;
        const wgsl = plugin.getCustomCode("fragment", ShaderLanguage.WGSL)!;

        expect(glsl.CUSTOM_FRAGMENT_DEFINITIONS).toContain("#include<bayerDitherFunctions>");
        expect(glsl.CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR).toContain("shouldDiscardDitheredTileFragment");
        expect(glsl["!#include<depthPrePass>"]).toContain("#ifdef DEPTHPREPASS");
        expect(wgsl.CUSTOM_FRAGMENT_DEFINITIONS).toContain("#include<bayerDitherFunctions>");
        expect(wgsl.CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR).toContain("shouldDiscardDitheredTileFragment");
        expect(wgsl["!#include<depthPrePass>"]).toContain("#ifdef DEPTHPREPASS");
        expect(plugin.getCustomCode("vertex")!.CUSTOM_VERTEX_DEFINITIONS).toContain("attribute vec4 ditheredTileFade");
        expect(plugin.getCustomCode("vertex", ShaderLanguage.WGSL)!.CUSTOM_VERTEX_DEFINITIONS).toContain("attribute ditheredTileFade");
    });

    it("stores independent hardware-instance bounds in one instanced buffer", async () => {
        const material = new StandardMaterial("material", scene);
        const source = MeshBuilder.CreateBox("source", {}, scene);
        const instance = source.createInstance("instance");
        const inheritedInstance = source.createInstance("inherited");
        const plugin = new DitheredTileFadeMaterialPlugin(material);
        const attributes: string[] = [];
        const bounds: IDitheredTileFadeBounds = { lowerBound: -1, upperBound: -1 };
        source.material = material;

        plugin.setFadeBounds(source, 0, 0.25);
        plugin.setFadeBounds(instance, 0.75, 1);
        plugin.getAttributes(attributes, scene, source);
        const attributeName = attributes[0];
        await material.forceCompilationAsync(source, { useInstances: true });

        expect(source.instancedBuffers[attributeName].asArray()).toEqual([0, 0.25, 1, 1]);
        expect(instance.instancedBuffers[attributeName].asArray()).toEqual([0.75, 1, 1, 1]);
        expect(plugin.getFadeBoundsToRef(inheritedInstance, bounds)).toBe(false);
        expect(bounds).toEqual({ lowerBound: 0, upperBound: 0.25 });

        source._processInstancedBuffers([instance], true);
        expect(Array.from(source._userInstancedBuffersStorage.data[attributeName].slice(0, 8))).toEqual([0, 0.25, 1, 1, 0.75, 1, 1, 1]);

        plugin.resetFade(instance);
        expect(instance.instancedBuffers[attributeName].asArray()).toEqual([0, 1, 0, 1]);
        expect(plugin.getFadeBoundsToRef(instance, bounds)).toBe(false);
        expect(bounds).toEqual({ lowerBound: 0, upperBound: 0.25 });
    });

    it("stores individual and packed thin-instance bounds", () => {
        const material = new StandardMaterial("material", scene);
        const source = MeshBuilder.CreateBox("source", {}, scene);
        const plugin = new DitheredTileFadeMaterialPlugin(material);
        const attributes: string[] = [];
        source.thinInstanceAdd([Matrix.Identity(), Matrix.Translation(2, 0, 0)]);

        plugin.setThinInstanceFadeBounds(source, 0, 0, 0.25);
        plugin.setThinInstanceFadeBounds(source, 1, 0.75, 1);
        plugin.getAttributes(attributes, scene, source);
        const attributeName = attributes[0];

        expect(Array.from(source._userThinInstanceBuffersStorage.data[attributeName].slice(0, 8))).toEqual([0, 0.25, 1, 1, 0.75, 1, 1, 1]);

        const attributeData = source._userThinInstanceBuffersStorage.data[attributeName];
        plugin.setThinInstanceFadeBoundsBuffer(source, new Float32Array([0.1, 0.4, 0.6, 0.9]));
        expect(source._userThinInstanceBuffersStorage.data[attributeName]).toBe(attributeData);
        expect(Array.from(attributeData.slice(0, 8))).toEqual([0.10000000149011612, 0.4000000059604645, 1, 1, 0.6000000238418579, 0.8999999761581421, 1, 1]);

        const bufferUpdated = vi.spyOn(source, "thinInstanceBufferUpdated");
        plugin.resetThinInstanceFade(source, 1, false);
        expect(bufferUpdated).not.toHaveBeenCalled();
        plugin.commitThinInstanceFadeBounds(source);
        expect(bufferUpdated).toHaveBeenCalledOnce();
        expect(Array.from(attributeData.slice(4, 8))).toEqual([0, 1, 0, 1]);
    });

    it("copies material-level configuration without copying mesh bounds", () => {
        const material = new StandardMaterial("material", scene);
        const mesh = MeshBuilder.CreateBox("mesh", {}, scene);
        const plugin = new DitheredTileFadeMaterialPlugin(material);
        plugin.setFadeBounds(mesh, 0.25, 0.75);
        plugin.isEnabled = false;

        const clone = material.clone("clone");
        expect(clone.pluginManager?.getPlugin(DitheredTileFadeMaterialPlugin.Name)).toBeFalsy();

        const clonePlugin = plugin.copyToMaterial(clone);
        const bounds: IDitheredTileFadeBounds = { lowerBound: -1, upperBound: -1 };

        expect(clonePlugin.isEnabled).toBe(false);
        expect(clonePlugin.getFadeBoundsToRef(mesh, bounds)).toBe(false);
        expect(bounds).toEqual({ lowerBound: 0, upperBound: 1 });
    });

    it("resets direct disposal and remains reusable through GetOrCreate", () => {
        const material = new StandardMaterial("material", scene);
        const mesh = MeshBuilder.CreateBox("mesh", {}, scene);
        const plugin = new DitheredTileFadeMaterialPlugin(material);
        plugin.setFadeBounds(mesh, 0.25, 0.75);

        plugin.dispose();
        const reused = DitheredTileFadeMaterialPlugin.GetOrCreate(material);

        expect(reused).toBe(plugin);
        expect(reused.isEnabled).toBe(false);
        reused.setFadeBounds(mesh, 0, 1);
        reused.isEnabled = true;
        expect(reused.isEnabled).toBe(true);
    });
});
