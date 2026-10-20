import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type IGLTF } from "babylonjs-gltf2interface";
import { Animation } from "core/Animations/animation";
import { AnimationGroup } from "core/Animations/animationGroup";
import { NullEngine } from "core/Engines/nullEngine";
import { Matrix, Quaternion, Vector3 } from "core/Maths/math.vector";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { TransformNode } from "core/Meshes/transformNode";
import { Node } from "core/node";
import { Scene } from "core/scene";
import { IsNoopNode } from "serializers/exportUtils";
import { GLTF2Export, type IExportOptions } from "serializers/glTF/2.0/glTFSerializer";
import { RegisterKHR_interactivity } from "serializers/glTF/2.0/Extensions/KHR_interactivity.pure";

describe.each([true, false])("export no-op roots (RH=%s)", (rightHanded) => {
    let engine: NullEngine;
    let scene: Scene;
    let root: TransformNode;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        scene.useRightHandedSystem = rightHanded;
        root = new TransformNode("__root__", scene);
        root.rotationQuaternion = Quaternion.Identity();
        if (!rightHanded) {
            root.scaling.x = -1;
        }
        root.computeWorldMatrix(true);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    async function exportScene(options?: IExportOptions): Promise<IGLTF> {
        const data = await GLTF2Export.GLTFAsync(scene, "root", options);
        return JSON.parse(data.files["root.gltf"] as string) as IGLTF;
    }

    it("recognizes an unchanged identity or handedness-conversion root", () => {
        expect(IsNoopNode(root, rightHanded)).toBe(true);
    });

    it("rejects a root scaled after its world matrix was cached in the same frame", () => {
        const renderId = scene.getRenderId();
        root.scaling.scaleInPlace(200);

        expect(scene.getRenderId()).toBe(renderId);
        expect(IsNoopNode(root, rightHanded)).toBe(false);
    });

    it("rejects a root translated in the same frame", () => {
        root.position.x = 1;

        expect(IsNoopNode(root, rightHanded)).toBe(false);
    });

    it("rejects a root with a replacement quaternion in the same frame", () => {
        root.rotationQuaternion = Quaternion.RotationAxis(Vector3.Up(), Math.PI / 2);

        expect(IsNoopNode(root, rightHanded)).toBe(false);
    });

    it("rejects a root with an edited quaternion in the same frame", () => {
        root.rotationQuaternion!.copyFrom(Quaternion.RotationAxis(Vector3.Up(), Math.PI / 2));

        expect(IsNoopNode(root, rightHanded)).toBe(false);
    });

    it("rejects a root with an Euler rotation in the same frame", () => {
        root.rotationQuaternion = null;
        root.rotation.y = Math.PI / 2;

        expect(IsNoopNode(root, rightHanded)).toBe(false);
    });

    it("rejects a node whose ancestor changed in the same frame", () => {
        const parent = new TransformNode("parent", scene);
        root.parent = parent;
        root.computeWorldMatrix(true);
        parent.scaling.setAll(200);

        expect(IsNoopNode(root, rightHanded)).toBe(false);
        expect(parent.getWorldMatrix().m[0]).toBe(200);
    });

    it("rejects a changed pre-transform matrix", () => {
        root.setPreTransformMatrix(Matrix.Scaling(200, 200, 200));

        expect(IsNoopNode(root, rightHanded)).toBe(false);
    });

    it("refreshes a changed matrix once without repeatedly notifying observers", () => {
        const observer = vi.fn();
        root.onAfterWorldMatrixUpdateObservable.add(observer);
        root.scaling.scaleInPlace(200);

        expect(IsNoopNode(root, rightHanded)).toBe(false);
        expect(IsNoopNode(root, rightHanded)).toBe(false);
        expect(observer).toHaveBeenCalledTimes(1);
    });

    it("does not recompute a synchronized root", () => {
        const observer = vi.fn();
        root.onAfterWorldMatrixUpdateObservable.add(observer);

        expect(IsNoopNode(root, rightHanded)).toBe(true);
        expect(IsNoopNode(root, rightHanded)).toBe(true);
        expect(observer).not.toHaveBeenCalled();
    });

    it("preserves a frozen no-op matrix despite changes to local scaling", () => {
        root.freezeWorldMatrix();
        const frozenMatrix = root.getWorldMatrix().clone();
        const observer = vi.fn();
        root.onAfterWorldMatrixUpdateObservable.add(observer);
        root.scaling.scaleInPlace(200);

        expect(IsNoopNode(root, rightHanded)).toBe(true);
        expect(root.isWorldMatrixFrozen).toBe(true);
        expect(root.getWorldMatrix().equals(frozenMatrix)).toBe(true);
        expect(observer).not.toHaveBeenCalled();

        root.unfreezeWorldMatrix();
        expect(IsNoopNode(root, rightHanded)).toBe(false);
    });

    it("preserves a frozen non-no-op matrix despite restoring local scaling", () => {
        root.scaling.scaleInPlace(200);
        root.freezeWorldMatrix();
        root.scaling.scaleInPlace(1 / 200);

        expect(IsNoopNode(root, rightHanded)).toBe(false);
        expect(root.isWorldMatrixFrozen).toBe(true);
    });

    it("uses an explicitly supplied frozen world matrix", () => {
        root.freezeWorldMatrix(Matrix.Scaling(rightHanded ? 200 : -200, 200, 200));

        expect(IsNoopNode(root, rightHanded)).toBe(false);
        expect(root.isWorldMatrixFrozen).toBe(true);
    });

    it("does not classify geometry-bearing meshes as no-ops", () => {
        const box = CreateBox("box", {}, scene);
        box.scaling.x = rightHanded ? 1 : -1;
        box.computeWorldMatrix(true);

        expect(IsNoopNode(box, rightHanded)).toBe(false);
    });

    it("does not classify a plain node as a no-op transform", () => {
        expect(IsNoopNode(new Node("plain", scene), rightHanded)).toBe(false);
    });

    describe("glTF serialization", () => {
        beforeEach(() => {
            const child = new TransformNode("child", scene);
            child.parent = root;
            child.position.x = 1;
        });

        it.each(["scaling", "rotation", "both"])("preserves a root changed by %s after its matrix was cached", async (change) => {
            const renderId = scene.getRenderId();
            if (change !== "rotation") {
                root.scaling.scaleInPlace(200);
            }
            if (change !== "scaling") {
                root.rotationQuaternion = Quaternion.RotationAxis(Vector3.Up(), Math.PI / 2);
            }

            const glTF = await exportScene();
            const exportedRoot = glTF.nodes?.[0];
            const expectedScale = change === "rotation" ? (rightHanded ? undefined : [-1, 1, 1]) : [rightHanded ? 200 : -200, 200, 200];
            const expectedRotation = change === "scaling" ? undefined : [0, (rightHanded ? 1 : -1) * Math.SQRT1_2, 0, Math.SQRT1_2];

            expect(scene.getRenderId()).toBe(renderId);
            expect(glTF.scenes?.[0].nodes).toEqual([0]);
            expect(exportedRoot?.name).toBe("__root__");
            expect(exportedRoot?.children).toEqual([1]);
            expect(glTF.nodes?.[1].name).toBe("child");
            expect(glTF.nodes?.[1].translation).toEqual([rightHanded ? 1 : -1, 0, 0]);
            expect(exportedRoot?.scale).toEqual(expectedScale);
            expect(exportedRoot?.rotation).toEqual(expectedRotation?.map((value) => expect.closeTo(value)));
        });

        it("continues removing an unchanged no-op root", async () => {
            const glTF = await exportScene();

            expect(glTF.scenes?.[0].nodes).toEqual([0]);
            expect(glTF.nodes?.map((node) => node.name)).toEqual(["child"]);
            expect(glTF.nodes?.[0].translation).toEqual([1, 0, 0]);
        });

        it.each([{ removeNoopRootNodes: false }, { includeCoordinateSystemConversionNodes: true }])("preserves a no-op root with options %j", async (options) => {
            const glTF = await exportScene(options);

            expect(glTF.nodes?.[0].name).toBe("__root__");
            expect(glTF.nodes?.[0].children).toEqual([1]);
        });

        it.each(["node", "group"])("preserves a no-op root targeted by a %s animation", async (target) => {
            const animation = new Animation("scale", "scaling", 60, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
            animation.setKeys([
                { frame: 0, value: root.scaling.clone() },
                { frame: 60, value: root.scaling.scale(2) },
            ]);
            if (target === "node") {
                root.animations.push(animation);
            } else {
                const group = new AnimationGroup("root animation", scene);
                group.addTargetedAnimation(animation, root);
            }

            const glTF = await exportScene();

            expect(glTF.nodes?.[0].name).toBe("__root__");
            expect(glTF.nodes?.[0].children).toEqual([1]);
            expect(glTF.animations?.[0].channels[0].target).toEqual({ node: 0, path: "scale" });
        });

        it("preserves a no-op root referenced by KHR_interactivity", async () => {
            RegisterKHR_interactivity();
            const glTF = await exportScene({
                khrInteractivity: {
                    required: false,
                    additionalExtensionsUsed: [],
                    additionalExtensionsRequired: [],
                    build: (context) => {
                        expect(context.getNodeIndex(root)).toBe(0);
                        return { graphs: [{}] };
                    },
                },
            });

            expect(glTF.nodes?.[0].name).toBe("__root__");
            expect(glTF.nodes?.[0].children).toEqual([1]);
            expect(glTF.extensionsUsed).toContain("KHR_interactivity");
        });
    });
});
