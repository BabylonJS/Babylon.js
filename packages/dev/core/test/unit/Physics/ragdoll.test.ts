import { Bone } from "core/Bones/bone";
import { Skeleton } from "core/Bones/skeleton";
import { NullEngine } from "core/Engines/nullEngine";
import { Axis } from "core/Maths/math.axis";
import { Matrix, Vector3 } from "core/Maths/math.vector";
import { TransformNode } from "core/Meshes/transformNode";
import { PhysicsConstraintAxis, PhysicsConstraintAxisLimitMode, PhysicsConstraintType, type IPhysicsEnginePluginV2 } from "core/Physics/v2/IPhysicsEnginePlugin";
import { type RagdollBoneProperties, Ragdoll } from "core/Physics/v2/ragdoll";
import "core/Physics/joinedPhysicsEngineComponent";
import { Scene } from "core/scene";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Plugin stub that accepts every call, so the ragdoll can be built without a physics backend.
function createPlugin() {
    const calls = new Map<string, ReturnType<typeof vi.fn>>();
    const target = { name: "StubPlugin", getPluginVersion: () => 2, getTimeStep: () => 1 / 60 };
    const plugin = new Proxy(target, {
        get(obj, prop: string) {
            if (prop in obj) {
                return obj[prop as keyof typeof obj];
            }
            if (!calls.has(prop)) {
                calls.set(prop, vi.fn());
            }
            return calls.get(prop);
        },
    });
    return { plugin: plugin as unknown as IPhysicsEnginePluginV2, calls };
}

describe("Ragdoll", () => {
    let engine: NullEngine;
    let scene: Scene;
    let calls: Map<string, ReturnType<typeof vi.fn>>;

    const createRagdoll = (armConfig: RagdollBoneProperties) => {
        const skeleton = new Skeleton("skeleton", "skeleton", scene);
        const root = new Bone("root", skeleton, null, Matrix.Identity());
        new Bone("arm", skeleton, root, Matrix.Translation(0.25, 0, 0));
        const config = [
            { bones: ["root"], size: 0.5 },
            { bones: ["arm"], size: 0.15, rotationAxis: Axis.Z, ...armConfig },
        ];
        return new Ragdoll(skeleton, new TransformNode("root", scene), config as RagdollBoneProperties[]);
    };

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        const stub = createPlugin();
        calls = stub.calls;
        scene.enablePhysics(new Vector3(0, -9.81, 0), stub.plugin);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it.each([
        ["hinge", PhysicsConstraintType.HINGE],
        ["ball and socket", PhysicsConstraintType.BALL_AND_SOCKET],
    ])("passes min and max to a %s joint", (_, joint) => {
        const ragdoll = createRagdoll({ joint, min: -0.3, max: 0.5 });
        const constraint = ragdoll.getConstraints()[0];

        expect(calls.get("setAxisMode")).toHaveBeenCalledWith(constraint, PhysicsConstraintAxis.ANGULAR_X, PhysicsConstraintAxisLimitMode.LIMITED);
        expect(calls.get("setAxisMinLimit")).toHaveBeenCalledWith(constraint, PhysicsConstraintAxis.ANGULAR_X, -0.3);
        expect(calls.get("setAxisMaxLimit")).toHaveBeenCalledWith(constraint, PhysicsConstraintAxis.ANGULAR_X, 0.5);
    });

    it("leaves the joint free when min and max are not set", () => {
        const ragdoll = createRagdoll({ joint: PhysicsConstraintType.HINGE });

        expect(ragdoll.getConstraints()).toHaveLength(1);
        expect(calls.get("setAxisMode")).toBeUndefined();
    });
});
