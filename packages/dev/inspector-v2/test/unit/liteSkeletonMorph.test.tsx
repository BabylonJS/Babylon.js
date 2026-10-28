/**
 * @vitest-environment jsdom
 */
import { type Bone, type Mesh, type MorphTargetData, type SceneContext, type Skeleton } from "@babylonjs/lite";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { MeshSkeletons, Scenes, SetWeights } = vi.hoisted(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    );
    vi.stubGlobal(
        "ResizeObserver",
        class {
            public observe() {}
            public unobserve() {}
            public disconnect() {}
        }
    );
    return {
        MeshSkeletons: new Map<Mesh, Skeleton>(),
        Scenes: [] as SceneContext[],
        SetWeights: vi.fn(),
    };
});

vi.mock("@babylonjs/lite", async (importOriginal) => ({
    ...(await importOriginal<typeof import("@babylonjs/lite")>()),
    getMeshSkeleton: (mesh: Mesh) => MeshSkeletons.get(mesh),
    getRenderingContexts: () => Scenes,
    getRenderingContextKind: () => "scene",
    setMorphTargetWeights: SetWeights,
}));

import { BuildExplorerTree } from "../../src/components/explorer/explorerModel";
import { type IPropertiesService } from "../../src/services/panes/properties/propertiesService";
import { type IEngineExplorerService, type RenderingContextNodeProvider } from "../../src/lite/engineExplorerService";
import { MeshMorphTargetProperties } from "../../src/lite/components/properties/morphTargetProperties";
import { BoneGeneralProperties, MeshSkinningProperties, SkeletonGeneralProperties, SkeletonMeshProperties } from "../../src/lite/components/properties/skeletonProperties";
import { GetMeshMorphTargets, GetMorphTargetDisplayName, SetMorphTargetWeight } from "../../src/lite/morphTargetUtils";
import { SkeletonPropertiesServiceDefinition } from "../../src/lite/services/panes/properties/skeletonPropertiesService";
import { SkeletonExplorerServiceDefinition } from "../../src/lite/services/panes/scene/skeletonExplorerService";
import { GetBoneChildren, GetBoneDisplayName, GetBoneIndex, GetSceneSkeletons, GetSkeletonDisplayName, GetSkeletonMeshes, IsBone, IsSkeleton } from "../../src/lite/skeletonUtils";
import { CreateP9Engine, CreateP9Mesh, CreateP9Selection, CreateP9Watcher, RenderP9Properties } from "./liteP9TestUtils";

function SkeletonFixture() {
    const root = { name: "Root", parent: null } as Bone;
    const child = { name: "Child", parent: root } as Bone;
    const skeleton = { bones: [root, child] } as Skeleton;
    const mesh = CreateP9Mesh();
    MeshSkeletons.set(mesh, skeleton);
    const h = CreateP9Engine([mesh]);
    Scenes.push(h.scene);
    return { ...h, mesh, root, child, skeleton };
}

const Renders: ReturnType<typeof RenderP9Properties>[] = [];
beforeEach(() => {
    MeshSkeletons.clear();
    Scenes.length = 0;
    SetWeights.mockReset();
});
afterEach(() => Renders.splice(0).forEach((render) => render.dispose()));

describe("Babylon Lite skeleton and morph discovery", () => {
    it("deduplicates clones, follows mesh order and descendants, and rejects look-alikes", () => {
        const h = SkeletonFixture();
        const clone = CreateP9Mesh("Clone");
        const other = { bones: [] } as unknown as Skeleton;
        const otherMesh = CreateP9Mesh("Other");
        MeshSkeletons.set(clone, h.skeleton);
        MeshSkeletons.set(otherMesh, other);
        h.mesh.children.push(clone);
        clone.parent = h.mesh;
        h.scene.meshes.push(otherMesh, CreateP9Mesh("Unskinned"));
        expect(GetSceneSkeletons(h.scene)).toEqual([h.skeleton, other]);
        expect(GetSkeletonMeshes(h.scene, h.skeleton)).toEqual([h.mesh, clone]);
        expect(GetBoneChildren(h.skeleton, null)).toEqual([h.root]);
        expect(GetBoneChildren(h.skeleton, h.root)).toEqual([h.child]);
        expect(GetBoneIndex(h.skeleton, h.child)).toBe(1);
        expect(IsSkeleton(h.engine, h.skeleton)).toBe(true);
        expect(IsBone(h.engine, h.child)).toBe(true);
        expect(IsSkeleton(h.engine, { ...h.skeleton })).toBe(false);
        expect(IsBone(h.engine, { ...h.child })).toBe(false);
        expect(IsBone(h.engine, null)).toBe(false);
        expect(GetSkeletonDisplayName(h.scene, h.skeleton)).toBe("Skeleton: Skinned Mesh");
        h.mesh.name = "";
        expect(GetSkeletonDisplayName(h.scene, h.skeleton)).toBe("Skeleton 1");
        Object.assign(h.root, { name: "" });
        expect(GetBoneDisplayName(h.skeleton, h.root)).toBe("Bone 0");
    });

    it("keeps skeleton and bone identities stable and clears selection only after last reachability is removed", () => {
        const h = SkeletonFixture();
        const { watcher, checks } = CreateP9Watcher();
        const selection = CreateP9Selection();
        let provider: RenderingContextNodeProvider<SceneContext> | undefined;
        const dispose = vi.fn();
        const explorer = {
            addRenderingContextNodeProvider: (registration: RenderingContextNodeProvider<SceneContext>) => {
                provider = registration;
                return { dispose };
            },
        } as unknown as IEngineExplorerService;
        const service = SkeletonExplorerServiceDefinition.factory(explorer, watcher, { engine: h.engine }, selection)!;
        expect(provider!.order).toBe(320);
        const tree = BuildExplorerTree(provider!.getNodes(h.scene));
        const skeletonNode = tree.nodes[0].children![0];
        expect(skeletonNode.entity).toBe(h.skeleton);
        expect(skeletonNode.children![0].entity).toBe(h.root);
        expect(skeletonNode.children![0].children![0].entity).toBe(h.child);
        expect(provider!.getSnapshot(h.scene)).toEqual([h.skeleton, h.root, h.child]);
        expect(BuildExplorerTree(provider!.getNodes(h.scene)).nodes[0].children![0].value).toBe(skeletonNode.value);
        const clone = CreateP9Mesh("Clone");
        MeshSkeletons.set(clone, h.skeleton);
        const otherScene = { meshes: [clone] } as unknown as SceneContext;
        Scenes.push(otherScene);
        watcher.refresh();
        selection.selectedEntity = h.child;
        h.scene.meshes.length = 0;
        watcher.refresh();
        expect(selection.selectedEntity).toBe(h.child);
        otherScene.meshes.length = 0;
        watcher.refresh();
        expect(selection.selectedEntity).toBeNull();
        expect(provider!.getNodes(h.scene)).toEqual([]);
        service.dispose?.();
        expect(dispose).toHaveBeenCalledOnce();
        expect(checks.size).toBe(0);
    });

    it("refreshes the derived skeleton label when the first mesh is removed but a clone remains", () => {
        const h = SkeletonFixture();
        const clone = CreateP9Mesh("Clone");
        MeshSkeletons.set(clone, h.skeleton);
        h.scene.meshes.push(clone);
        const { watcher, checks } = CreateP9Watcher();
        let provider: RenderingContextNodeProvider<SceneContext> | undefined;
        const explorer = {
            addRenderingContextNodeProvider: (registration: RenderingContextNodeProvider<SceneContext>) => {
                provider = registration;
                return { dispose: vi.fn() };
            },
        } as unknown as IEngineExplorerService;
        const service = SkeletonExplorerServiceDefinition.factory(explorer, watcher, { engine: h.engine }, CreateP9Selection())!;
        const node = BuildExplorerTree(provider!.getNodes(h.scene)).nodes[0].children![0];
        const display = node.getDisplayInfo();
        const changed = vi.fn();
        display.onChange!.add(changed);
        const before = provider!.getSnapshot(h.scene);
        h.scene.meshes.splice(0, 1);
        watcher.refresh();
        expect(provider!.getSnapshot(h.scene)).toEqual(before);
        expect(display.name).toBe("Skeleton: Clone");
        expect(changed).toHaveBeenCalledOnce();
        display.dispose?.();
        service.dispose?.();
        expect(checks.size).toBe(0);
    });

    it("registers four lazy property sections with reachability and nonempty morph predicates, and disposes each", () => {
        const h = SkeletonFixture();
        type Content = Parameters<IPropertiesService["addSectionContent"]>[0];
        const contents: Content[] = [];
        const disposals: ReturnType<typeof vi.fn>[] = [];
        const properties = {
            addSectionContent: (content: Content) => {
                contents.push(content);
                const dispose = vi.fn();
                disposals.push(dispose);
                return { dispose };
            },
        } as unknown as IPropertiesService;
        const service = SkeletonPropertiesServiceDefinition.factory(properties, { engine: h.engine }, CreateP9Selection())!;
        expect(contents.map((content) => content.content.map((section) => section.section))).toEqual([["General", "Meshes"], ["General"], ["Skinning"], ["Morph Targets"]]);
        expect(contents[0].predicate(h.skeleton)).toBe(true);
        expect(contents[1].predicate(h.child)).toBe(true);
        expect(contents[2].predicate(h.mesh)).toBe(true);
        expect(contents[2].predicate(CreateP9Mesh())).toBe(false);
        expect(contents[3].predicate(h.mesh)).toBe(false);
        Object.assign(h.mesh, { morphTargets: { count: 0 } });
        expect(contents[3].predicate(h.mesh)).toBe(false);
        Object.assign(h.mesh, { morphTargets: { count: 2 } });
        expect(contents[3].predicate(h.mesh)).toBe(true);
        h.scene.meshes.length = 0;
        expect(contents.every((content) => !content.predicate(h.mesh))).toBe(true);
        service.dispose?.();
        expect(disposals.every((dispose) => dispose.mock.calls.length === 1)).toBe(true);
    });

    it("uses named/fallback targets and sends a full independent weights copy to the owning engine", () => {
        const h = SkeletonFixture();
        const data = { count: 2, weights: new Float32Array([0.25, 0.75]), names: ["Smile", ""] } as unknown as MorphTargetData;
        Object.assign(h.mesh, { morphTargets: data });
        expect(GetMeshMorphTargets(h.mesh)).toBe(data);
        expect(GetMorphTargetDisplayName(data, 0)).toBe("Smile");
        expect(GetMorphTargetDisplayName(data, 1)).toBe("Target 1");
        expect(GetMorphTargetDisplayName({ ...data, names: undefined }, 0)).toBe("Target 0");
        SetMorphTargetWeight(h.scene, data, 1, 0.5);
        const [engine, targets, copy] = SetWeights.mock.calls[0];
        expect(engine).toBe(h.engine);
        expect(targets).toBe(data);
        expect(copy).not.toBe(data.weights);
        expect([...copy]).toEqual([0.25, 0.5]);
        expect([...data.weights]).toEqual([0.25, 0.75]);
        SetWeights.mockImplementation(() => {
            throw new Error("disposed");
        });
        expect(() => SetMorphTargetWeight(h.scene, data, 0, 0)).toThrow("disposed");
    });
});

describe("Babylon Lite skeleton and morph properties", () => {
    it("renders derived bone index, immutable name and navigation links without editing controls", () => {
        const h = SkeletonFixture();
        const selection = CreateP9Selection();
        const { watcher } = CreateP9Watcher();
        const render = RenderP9Properties(<BoneGeneralProperties engine={h.engine} bone={h.child} selectionService={selection} />, watcher);
        Renders.push(render);
        expect(render.container.textContent).toContain("Index1");
        expect(render.container.textContent).toContain("NameChild");
        expect(render.container.querySelector("input")).toBeNull();
        const buttons = [...render.container.querySelectorAll("button")];
        act(() => buttons.find((button) => button.textContent === "Root")!.click());
        expect(selection.selectedEntity).toBe(h.root);
        act(() => buttons.find((button) => button.textContent === "Skeleton: Skinned Mesh")!.click());
        expect(selection.selectedEntity).toBe(h.skeleton);
    });

    it("renders skeleton count and live mesh links and the mesh's skeleton link", () => {
        const h = SkeletonFixture();
        const selection = CreateP9Selection();
        const { watcher } = CreateP9Watcher();
        const render = RenderP9Properties(
            <>
                <SkeletonGeneralProperties skeleton={h.skeleton} />
                <SkeletonMeshProperties engine={h.engine} skeleton={h.skeleton} selectionService={selection} />
                <MeshSkinningProperties engine={h.engine} mesh={h.mesh} selectionService={selection} />
            </>,
            watcher
        );
        Renders.push(render);
        expect(render.container.textContent).toContain("Bone Count2");
        act(() => [...render.container.querySelectorAll("button")].find((button) => button.textContent === "Skinned Mesh")!.click());
        expect(selection.selectedEntity).toBe(h.mesh);
        act(() => {
            h.mesh.name = "Renamed";
            watcher.refresh();
        });
        expect(render.container.textContent).toContain("Skeleton: Renamed");
    });

    it("renders named sliders, updates shared clone data, and follows external weight changes", () => {
        const h = SkeletonFixture();
        const data = { count: 2, names: ["Smile", "Frown"], weights: new Float32Array(2) } as unknown as MorphTargetData;
        const clone = CreateP9Mesh("Clone");
        Object.assign(h.mesh, { morphTargets: data });
        Object.assign(clone, { morphTargets: data });
        SetWeights.mockImplementation((_engine, targets: MorphTargetData, weights: Float32Array) => targets.weights.set(weights));
        const { watcher, checks } = CreateP9Watcher();
        const render = RenderP9Properties(
            <>
                <MeshMorphTargetProperties scene={h.scene} mesh={h.mesh} />
                <MeshMorphTargetProperties scene={h.scene} mesh={clone} />
            </>,
            watcher
        );
        Renders.push(render);
        expect(render.container.querySelectorAll('input[type="range"]')).toHaveLength(4);
        expect(render.container.textContent).toContain("Smile");
        const inputs = render.container.querySelectorAll<HTMLInputElement>('input[type="text"]');
        act(() => {
            const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
            inputs[0].focus();
            setter.call(inputs[0], "0.5");
            inputs[0].dispatchEvent(new Event("input", { bubbles: true }));
        });
        act(() => inputs[0].blur());
        expect(SetWeights).toHaveBeenCalled();
        expect(data.weights[0]).toBe(0.5);
        expect(inputs[2].value).toBe("0.5");
        act(() => {
            data.weights[1] = 0.25;
            watcher.refresh();
        });
        expect(inputs[1].value).toBe("0.25");
        expect(inputs[3].value).toBe("0.25");
        render.dispose();
        Renders.pop();
        expect(checks.size).toBe(0);
    });

    it("commits unbounded numeric weights as full copies shared by clones without clamped write-back", () => {
        const h = SkeletonFixture();
        const data = { count: 2, names: ["Smile", "Frown"], weights: new Float32Array([0.25, 0.75]) } as unknown as MorphTargetData;
        const clone = CreateP9Mesh("Clone");
        Object.assign(h.mesh, { morphTargets: data });
        Object.assign(clone, { morphTargets: data });
        SetWeights.mockImplementation((_engine, targets: MorphTargetData, weights: Float32Array) => targets.weights.set(weights));
        const { watcher } = CreateP9Watcher();
        const render = RenderP9Properties(
            <>
                <MeshMorphTargetProperties scene={h.scene} mesh={h.mesh} />
                <MeshMorphTargetProperties scene={h.scene} mesh={clone} />
            </>,
            watcher
        );
        Renders.push(render);
        const ranges = render.container.querySelectorAll<HTMLInputElement>('input[type="range"]');
        expect(ranges).toHaveLength(4);
        // Slider scales the 0..1 bounds by 0.01 and uses the native default step of 1.
        for (const range of ranges) {
            expect([range.min, range.max, range.step]).toEqual(["0", "100", ""]);
        }
        const inputs = render.container.querySelectorAll<HTMLInputElement>('input[type="text"]');
        const commit = (input: HTMLInputElement, value: string) => {
            act(() => {
                input.focus();
                Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
                input.dispatchEvent(new Event("input", { bubbles: true }));
            });
            act(() => input.blur());
        };
        commit(inputs[0], "-0.5");
        expect(SetWeights).toHaveBeenCalledTimes(1);
        expect(SetWeights.mock.calls[0][2]).not.toBe(data.weights);
        expect([...SetWeights.mock.calls[0][2]]).toEqual([-0.5, 0.75]);
        expect([...data.weights]).toEqual([-0.5, 0.75]);
        expect(inputs[0].value).toBe("-0.5");
        expect(inputs[2].value).toBe("-0.5");

        commit(inputs[1], "1.5");
        expect(SetWeights).toHaveBeenCalledTimes(2);
        expect(SetWeights.mock.calls[1][2]).not.toBe(data.weights);
        expect([...SetWeights.mock.calls[1][2]]).toEqual([-0.5, 1.5]);
        expect([...data.weights]).toEqual([-0.5, 1.5]);
        expect(inputs[1].value).toBe("1.5");
        expect(inputs[3].value).toBe("1.5");

        act(() => {
            data.weights[0] = 2;
            watcher.refresh();
        });
        expect(inputs[0].value).toBe("2");
        expect(inputs[2].value).toBe("2");
        expect([...data.weights]).toEqual([2, 1.5]);
        expect(SetWeights).toHaveBeenCalledTimes(2);
        commit(inputs[0], "abc");
        expect(inputs[0].value).toBe("2");
        expect([...data.weights]).toEqual([2, 1.5]);
        expect(SetWeights).toHaveBeenCalledTimes(2);
    });
});
