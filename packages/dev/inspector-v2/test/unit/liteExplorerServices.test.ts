import { type Material, type Mesh, type RenderingContext, type SceneContext, type Texture2D } from "@babylonjs/lite";
import { describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
    vi.stubGlobal("window", globalThis);
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: false }))
    );
});

import { BuildExplorerTree, type ExplorerNode } from "../../src/components/explorer/explorerModel";
import {
    type IEngineExplorerService,
    EngineExplorerServiceDefinition,
    EngineExplorerServiceIdentity,
    type RenderingContextNodeProvider,
} from "../../src/lite/engineExplorerService";
import { MaterialExplorerServiceDefinition } from "../../src/lite/services/panes/scene/materialExplorerService";
import { MeshExplorerServiceDefinition } from "../../src/lite/services/panes/scene/meshExplorerService";
import { TextureExplorerServiceDefinition } from "../../src/lite/services/panes/scene/textureExplorerService";

function CreateMaterial(family: string, name: string, texture?: Texture2D): Material {
    return Object.assign(
        {
            name,
            ...(family === "standard" ? { diffuseTexture: texture ?? null } : { baseColorTexture: texture }),
        } as Material,
        {
            _buildGroup: { _materialFamily: family },
            _uboVersion: 0,
        }
    );
}

function CreateMesh(name: string, material: Material): Mesh {
    return { name, material } as Mesh;
}

function GetNames(nodes: readonly ExplorerNode[]): string[] {
    return nodes.map((node) => node.getDisplayInfo().name);
}

describe("Babylon Lite scene resource explorer services", () => {
    it("registers product-specific providers with the engine explorer", () => {
        expect(EngineExplorerServiceDefinition.produces).toEqual([EngineExplorerServiceIdentity]);
        expect(MeshExplorerServiceDefinition.consumes).toEqual([EngineExplorerServiceIdentity]);
        expect(MaterialExplorerServiceDefinition.consumes).toEqual([EngineExplorerServiceIdentity]);
        expect(TextureExplorerServiceDefinition.consumes).toEqual([EngineExplorerServiceIdentity]);
    });

    it("contributes selectable mesh, material, and texture sections beneath scene contexts", () => {
        const providers: RenderingContextNodeProvider<RenderingContext>[] = [];
        const dispose = vi.fn();
        const engineExplorerService = {
            addRenderingContextNodeProvider: (provider: RenderingContextNodeProvider<RenderingContext>) => {
                providers.push(provider);
                return { dispose };
            },
        } as IEngineExplorerService;

        const registrations = [
            MeshExplorerServiceDefinition.factory(engineExplorerService),
            MaterialExplorerServiceDefinition.factory(engineExplorerService),
            TextureExplorerServiceDefinition.factory(engineExplorerService),
        ];

        const redTexture = { width: 1, height: 1 } as Texture2D;
        const blueTexture = { width: 2, height: 2 } as Texture2D;
        const standardMaterial = CreateMaterial("standard", "Red Material", redTexture);
        const pbrMaterial = CreateMaterial("pbr", "Blue Material", blueTexture);
        const redMesh = CreateMesh("Red Box", standardMaterial);
        const blueMesh = CreateMesh("Blue Sphere", pbrMaterial);
        const scene = {
            _kind: "scene",
            meshes: [redMesh, blueMesh, CreateMesh("Small Red Box", standardMaterial)],
        } as SceneContext;

        const descriptions = providers
            .filter((provider) => provider.predicate(scene))
            .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
            .flatMap((provider) => provider.getNodes(scene));
        const tree = BuildExplorerTree(descriptions);

        expect(GetNames(tree.nodes)).toEqual(["Meshes", "Materials", "Textures"]);
        expect(GetNames(tree.nodes[0].children)).toEqual(["Red Box", "Blue Sphere", "Small Red Box"]);
        expect(GetNames(tree.nodes[1].children)).toEqual(["Red Material", "Blue Material"]);
        expect(GetNames(tree.nodes[2].children)).toEqual(["Texture 1 (1 x 1)", "Texture 2 (2 x 2)"]);
        expect(tree.nodes[0].children[0].entity).toBe(redMesh);
        expect(tree.nodes[1].children[0].entity).toBe(standardMaterial);
        expect(tree.nodes[2].children[0].entity).toBe(redTexture);

        registrations.forEach((registration) => registration?.dispose?.());
        expect(dispose).toHaveBeenCalledTimes(3);
    });

    it("does not contribute scene resources beneath other rendering contexts", () => {
        const providers: RenderingContextNodeProvider<RenderingContext>[] = [];
        const engineExplorerService = {
            addRenderingContextNodeProvider: (provider: RenderingContextNodeProvider<RenderingContext>) => {
                providers.push(provider);
                return { dispose: () => {} };
            },
        } as IEngineExplorerService;

        MeshExplorerServiceDefinition.factory(engineExplorerService);
        const effectRenderer = { _kind: "effect-renderer" } as RenderingContext;

        expect(providers[0].predicate(effectRenderer)).toBe(false);
    });
});
