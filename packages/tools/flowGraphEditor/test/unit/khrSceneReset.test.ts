import { NullEngine } from "core/Engines/nullEngine";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { Scene } from "core/scene";
import { RestoreKhrNodeState } from "flow-graph-editor/khrSceneReset";
import { GetInteractivityNodeState, InitializeInteractivityNodeState, SetInteractivityNodeState } from "loaders/glTF/2.0/Extensions/KHR_interactivity/interactivityNodeState";
import { describe, expect, it } from "vitest";

function NodeStatePathConverter(nodes: any[]) {
    return {
        convert(path: string) {
            const match = /^\/nodes\/(\d+)\/extensions\/KHR_node_(selectability|hoverability)\/(selectable|hoverable)$/.exec(path);
            if (!match) {
                throw new Error(`Unexpected reset pointer: ${path}`);
            }
            return {
                object: nodes[Number(match[1])],
                info: { set: (value: boolean, node: any) => SetInteractivityNodeState(node, match[3] as "selectable" | "hoverable", value) },
            };
        },
    };
}

describe("KHR node state scene reset", () => {
    it("restores the default visible state when the extension omits visible", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const transform = CreateBox("node", {}, scene);
        const primitive = CreateBox("primitive", {}, scene);
        primitive.parent = transform;
        transform.isVisible = false;
        primitive.isVisible = false;
        transform.inheritVisibility = false;
        primitive.inheritVisibility = false;

        RestoreKhrNodeState({ glTF: { nodes: [{ extensions: { KHR_node_visibility: {} }, _babylonTransformNode: transform, _primitiveBabylonMeshes: [primitive] }] } } as any);

        expect(transform.isVisible).toBe(true);
        expect(primitive.isVisible).toBe(true);
        expect(transform.inheritVisibility).toBe(true);
        expect(primitive.inheritVisibility).toBe(true);
        scene.dispose();
        engine.dispose();
    });

    it("retains explicit false and leaves nodes without the extension alone", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const explicitlyHidden = CreateBox("hidden", {}, scene);
        const unrelated = CreateBox("unrelated", {}, scene);
        explicitlyHidden.isVisible = true;
        unrelated.isVisible = false;

        RestoreKhrNodeState({
            glTF: { nodes: [{ extensions: { KHR_node_visibility: { visible: false } }, _babylonTransformNode: explicitlyHidden }, { _babylonTransformNode: unrelated }] },
        } as any);

        expect(explicitlyHidden.isVisible).toBe(false);
        expect(unrelated.isVisible).toBe(false);
        scene.dispose();
        engine.dispose();
    });

    it("restores omitted selectability and hoverability defaults after preview mutations", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        try {
            const mesh = CreateBox("target", {}, scene);
            const node: any = {
                extensions: { KHR_node_selectability: {}, KHR_node_hoverability: {} },
                _babylonTransformNode: mesh,
                _primitiveBabylonMeshes: [mesh],
            };
            InitializeInteractivityNodeState([node], "selectable", (candidate) => candidate.extensions?.KHR_node_selectability?.selectable);
            InitializeInteractivityNodeState([node], "hoverable", (candidate) => candidate.extensions?.KHR_node_hoverability?.hoverable);
            SetInteractivityNodeState(node, "selectable", false);
            SetInteractivityNodeState(node, "hoverable", false);
            expect(mesh.isPickable).toBe(false);
            expect(mesh._isPointerMovePickable).toBe(false);

            RestoreKhrNodeState({ glTF: { nodes: [node] }, pathConverter: NodeStatePathConverter([node]) } as any);

            expect(GetInteractivityNodeState(node, "selectable")).toBe(true);
            expect(GetInteractivityNodeState(node, "hoverable")).toBe(true);
            expect(mesh.isPickable).toBe(true);
            expect(mesh._isPointerMovePickable).toBe(true);
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });

    it("restores explicit false and inherited state without changing unrelated picking", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        try {
            const parentMesh = CreateBox("parent", {}, scene);
            const childMesh = CreateBox("child", {}, scene);
            childMesh.parent = parentMesh;
            const unrelated = CreateBox("unrelated", {}, scene);
            unrelated.isPickable = false;
            unrelated._isPointerMovePickable = false;
            const parent: any = {
                extensions: { KHR_node_selectability: { selectable: false }, KHR_node_hoverability: { hoverable: false } },
                _babylonTransformNode: parentMesh,
                _primitiveBabylonMeshes: [parentMesh],
            };
            const child: any = {
                parent,
                extensions: { KHR_node_selectability: { selectable: true }, KHR_node_hoverability: { hoverable: true } },
                _babylonTransformNode: childMesh,
                _primitiveBabylonMeshes: [childMesh],
            };
            const nodes = [parent, child];
            InitializeInteractivityNodeState(nodes, "selectable", (node) => node.extensions?.KHR_node_selectability?.selectable);
            InitializeInteractivityNodeState(nodes, "hoverable", (node) => node.extensions?.KHR_node_hoverability?.hoverable);
            SetInteractivityNodeState(parent, "selectable", true);
            SetInteractivityNodeState(parent, "hoverable", true);
            expect(childMesh.isPickable).toBe(true);
            expect(childMesh._isPointerMovePickable).toBe(true);

            RestoreKhrNodeState({
                glTF: { nodes: [parent, child, { _babylonTransformNode: unrelated }] },
                pathConverter: NodeStatePathConverter([parent, child]),
            } as any);

            expect(GetInteractivityNodeState(parent, "selectable")).toBe(false);
            expect(GetInteractivityNodeState(parent, "hoverable")).toBe(false);
            expect(GetInteractivityNodeState(child, "selectable")).toBe(true);
            expect(GetInteractivityNodeState(child, "hoverable")).toBe(true);
            expect(parentMesh.isPickable).toBe(false);
            expect(childMesh.isPickable).toBe(false);
            expect(parentMesh._isPointerMovePickable).toBe(false);
            expect(childMesh._isPointerMovePickable).toBe(false);
            expect(unrelated.isPickable).toBe(false);
            expect(unrelated._isPointerMovePickable).toBe(false);
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });
});
