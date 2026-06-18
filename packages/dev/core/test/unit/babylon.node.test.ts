import { Engine } from "core/Engines/engine";
import { Scene } from "core/scene";
import { Node } from "core/node";
import { TransformNode } from "core/Meshes/transformNode";
import { Mesh } from "core/Meshes/mesh";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { NullEngine } from "core/Engines/nullEngine";
import type { Behavior } from "core/Behaviors/behavior";
import type { Nullable } from "core/types";

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

    it("removeBehavior handles reentrant removeBehavior calls from detach (issue #18537)", () => {
        const scene = new Scene(subject);
        const node = new TransformNode("node", scene);

        class ChildBehavior implements Behavior<Node> {
            public name = "Child";
            public attachedNode: Nullable<Node> = null;
            public init() {}
            public attach(target: Node) {
                this.attachedNode = target;
            }
            public detach() {
                this.attachedNode = null;
            }
        }

        // Parent behavior that owns and registers two child behaviors on its target node, then
        // removes them again in detach(). This mirrors the pattern used by MultiPointerScaleBehavior.
        class ParentBehavior implements Behavior<Node> {
            public name = "Parent";
            public attachedNode: Nullable<Node> = null;
            public childA = new ChildBehavior();
            public childB = new ChildBehavior();
            public init() {}
            public attach(target: Node) {
                this.attachedNode = target;
                target.addBehavior(this.childA);
                target.addBehavior(this.childB);
            }
            public detach() {
                this.attachedNode!.removeBehavior(this.childA);
                this.attachedNode!.removeBehavior(this.childB);
                this.attachedNode = null;
            }
        }

        const parent = new ParentBehavior();
        node.addBehavior(parent);

        expect(node.behaviors).toHaveLength(3);

        node.removeBehavior(parent);

        // The parent behavior must be fully removed along with its children, regardless of the
        // child removals happening reentrantly inside the parent's detach() call.
        expect(node.behaviors).toHaveLength(0);
        expect(node.getBehaviorByName("Parent")).toBeNull();
        expect(node.getBehaviorByName("Child")).toBeNull();
    });
});
