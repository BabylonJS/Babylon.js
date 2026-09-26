import { NullEngine } from "core/Engines/nullEngine";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { Scene } from "core/scene";
import { RestoreKhrNodeVisibility } from "flow-graph-editor/khrSceneReset";
import { describe, expect, it } from "vitest";

describe("KHR_node_visibility scene reset", () => {
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

        RestoreKhrNodeVisibility({ glTF: { nodes: [{ extensions: { KHR_node_visibility: {} }, _babylonTransformNode: transform, _primitiveBabylonMeshes: [primitive] }] } } as any);

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

        RestoreKhrNodeVisibility({
            glTF: { nodes: [{ extensions: { KHR_node_visibility: { visible: false } }, _babylonTransformNode: explicitlyHidden }, { _babylonTransformNode: unrelated }] },
        } as any);

        expect(explicitlyHidden.isVisible).toBe(false);
        expect(unrelated.isVisible).toBe(false);
        scene.dispose();
        engine.dispose();
    });
});
