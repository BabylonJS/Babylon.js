import { Engine } from "core/Engines/engine";
import { Scene } from "core/scene";
import { Node } from "core/node";
import { TransformNode } from "core/Meshes/transformNode";
import { Mesh } from "core/Meshes/mesh";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { NullEngine } from "core/Engines/nullEngine";

/**
 * Describes the test suite.
 */
describe("Babylon Node", () => {
    console.log("Babylon Node Tests");
    let subject: Engine;

    /**
     * Create a new engine subject before each test.
     */
    beforeEach(function () {
        subject = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
    });

    it("dispose", () => {
        const scene = new Scene(subject);
        const node = new Node("node", scene);
        const transformNode = new TransformNode("transformNode", scene);
        transformNode.parent = node;
        const mesh = new Mesh("node2", scene);
        mesh.parent = node;
        mesh.material = new PBRMaterial("material", scene);

        node.dispose();

        expect(node.isDisposed()).toBeTruthy();
        expect(transformNode.isDisposed()).toBeTruthy();
        expect(mesh.isDisposed()).toBeTruthy();
        expect(scene.materials).toHaveLength(1);
    });

    it("dispose with doNotRecurse", () => {
        const scene = new Scene(subject);
        const node = new Node("node", scene);
        const transformNode = new TransformNode("transformNode", scene);
        transformNode.parent = node;
        const mesh = new Mesh("node2", scene);
        mesh.parent = node;
        mesh.material = new PBRMaterial("material", scene);

        node.dispose(true);

        expect(node.isDisposed()).toBeTruthy();
        expect(transformNode.isDisposed()).toBeFalsy();
        expect(mesh.isDisposed()).toBeFalsy();
        expect(scene.materials).toHaveLength(1);
    });

    it("dispose with disposeMaterialAndTextures", () => {
        const scene = new Scene(subject);
        const transformNode = new TransformNode("transformNode", scene);
        const mesh = new Mesh("mesh", scene);
        mesh.parent = transformNode;
        mesh.material = new PBRMaterial("material", scene);

        transformNode.dispose(false, true);

        expect(transformNode.isDisposed()).toBeTruthy();
        expect(mesh.isDisposed()).toBeTruthy();
        expect(scene.materials).toHaveLength(0);
        expect(scene.meshes).toHaveLength(0);
    });
});
