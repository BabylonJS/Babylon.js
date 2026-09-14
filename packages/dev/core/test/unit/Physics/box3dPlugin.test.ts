import { Quaternion, Vector3 } from "core/Maths/math.vector";
import { type TransformNode } from "core/Meshes/transformNode";
import {
    type IPhysicsCollisionEvent,
    PhysicsConstraintType,
    PhysicsEventType,
    PhysicsMotionType,
    PhysicsPrestepType,
    PhysicsShapeType,
} from "core/Physics/v2/IPhysicsEnginePlugin";
import { Box3DPlugin } from "core/Physics/v2/Plugins/box3dPlugin";
import { type PhysicsBody } from "core/Physics/v2/physicsBody";
import { type PhysicsConstraint } from "core/Physics/v2/physicsConstraint";
import { type PhysicsShape } from "core/Physics/v2/physicsShape";
import { PhysicsRaycastResult } from "core/Physics/physicsRaycastResult";
import { describe, expect, it, vi } from "vitest";

// Layout of the fake wasm heap (float indices): scratch at 0, move events at 256, contact events at 512, ray hits at 768.
const ScratchOffset = 0;
const MoveEventsOffset = 256;
const ContactEventsOffset = 512;
const RayHitsOffset = 768;

// Builds a fake Box3D module: a shared heap, a scratch buffer and vi.fn stubs for every shim call the tests exercise.
// Slots are handed out sequentially so the tests can assert on them.
function createModule() {
    const heap = new Float32Array(2048);
    const heapBytes = new Uint8Array(heap.buffer);
    const scratch = heap.subarray(ScratchOffset, ScratchOffset + 64);
    let nextBody = 10;
    let nextDesc = 100;
    let nextJoint = 200;
    let nextAlloc = 4096;
    let moveEventCount = 0;
    let contactEventCount = 0;
    let rayHitCount = 0;
    const massData = new Map<number, number[]>();

    const b3: any = {
        HEAPF32: heap,
        HEAP32: new Int32Array(heap.buffer),
        HEAPU32: new Uint32Array(heap.buffer),
        HEAPU8: heapBytes,
        _malloc: vi.fn(() => (nextAlloc += 256)),
        _free: vi.fn(),
        _bx_Scratch: vi.fn(() => ScratchOffset * 4),
        _bx_CreateWorld: vi.fn(() => 1),
        _bx_DestroyWorld: vi.fn(),
        _bx_World_SetGravity: vi.fn(),
        _bx_World_Step: vi.fn(),
        _bx_World_GetMoveEvents: vi.fn(() => moveEventCount),
        _bx_MoveEventsPtr: vi.fn(() => MoveEventsOffset * 4),
        _bx_World_GetContactEvents: vi.fn(() => contactEventCount),
        _bx_ContactEventsPtr: vi.fn(() => ContactEventsOffset * 4),
        _bx_World_GetSensorEvents: vi.fn(() => 0),
        _bx_SensorEventsPtr: vi.fn(() => 0),
        _bx_CreateBody: vi.fn(() => nextBody++),
        _bx_DestroyBody: vi.fn(),
        _bx_Body_SetShape: vi.fn(),
        _bx_Body_EnableContactEvents: vi.fn(),
        _bx_Body_ApplyMassFromShapes: vi.fn(),
        _bx_Body_GetMassData: vi.fn((slot: number) => {
            scratch.set(massData.get(slot) ?? [10, 0, 0, 0, 2, 2, 2]);
        }),
        _bx_Body_SetMassData: vi.fn(),
        _bx_Body_GetTransform: vi.fn(() => scratch.set([1, 2, 3, 0, 0, 0, 1])),
        _bx_Body_SetTransform: vi.fn(),
        _bx_ShapeDesc_CreateSphere: vi.fn(() => nextDesc++),
        _bx_ShapeDesc_CreateBox: vi.fn(() => nextDesc++),
        _bx_ShapeDesc_Destroy: vi.fn(),
        _bx_ShapeDesc_SetMaterial: vi.fn(),
        _bx_CreateJoint: vi.fn(() => nextJoint++),
        _bx_Joint_EnableLimit: vi.fn(),
        _bx_Joint_SetLimits: vi.fn(),
        _bx_Joint_EnableMotor: vi.fn(),
        _bx_Joint_EnableSpring: vi.fn(),
        _bx_Joint_SetMotorSpeed: vi.fn(),
        _bx_Joint_SetMaxMotorForce: vi.fn(),
        _bx_Joint_WakeBodies: vi.fn(),
        _bx_World_CastRay: vi.fn(() => rayHitCount),
        _bx_RayHitsPtr: vi.fn(() => RayHitsOffset * 4),
    };

    return {
        b3,
        scratch,
        setMassData(slot: number, data: number[]) {
            massData.set(slot, data);
        },
        // records: [bodySlot, px, py, pz, qx, qy, qz, qw, fellAsleep]
        setMoveEvents(records: number[][]) {
            moveEventCount = records.length;
            heap.set(records.flat(), MoveEventsOffset);
        },
        // records: [kind, shapeA, shapeB, bodyA, bodyB, px, py, pz, nx, ny, nz, approachSpeed]
        setContactEvents(records: number[][]) {
            contactEventCount = records.length;
            heap.set(records.flat(), ContactEventsOffset);
        },
        // hits: [px, py, pz, nx, ny, nz, fraction, bodySlot, shapeDesc, triangleIndex, reserved]
        setRayHits(hits: number[][]) {
            rayHitCount = hits.length;
            heap.set(hits.flat(), RayHitsOffset);
        },
    };
}

function createNode(): TransformNode {
    return {
        position: new Vector3(),
        rotationQuaternion: new Quaternion(),
        rotation: new Vector3(),
        scaling: new Vector3(1, 1, 1),
        parent: null,
    } as unknown as TransformNode;
}

function createBody(plugin: Box3DPlugin, motionType = PhysicsMotionType.DYNAMIC, position = new Vector3(), orientation = Quaternion.Identity()): PhysicsBody {
    const body = {
        _pluginData: undefined,
        _pluginDataInstances: [],
        startAsleep: false,
        disablePreStep: true,
        disableSync: false,
        transformNode: createNode(),
        shape: null,
        getPrestepType: () => PhysicsPrestepType.DISABLED,
        getMotionType: () => motionType,
    } as unknown as PhysicsBody;
    plugin.initBody(body, motionType, position, orientation);
    return body;
}

function createShape(plugin: Box3DPlugin, type: PhysicsShapeType, parameters: any): PhysicsShape {
    const shape = { _pluginData: undefined, type } as unknown as PhysicsShape;
    plugin.initShape(shape, type, parameters);
    return shape;
}

describe("Box3DPlugin bodies and shapes", () => {
    it("creates a dynamic body at the requested pose", () => {
        const { b3 } = createModule();
        const plugin = new Box3DPlugin(true, b3);
        const q = Quaternion.RotationAxis(Vector3.Up(), Math.PI / 2);
        createBody(plugin, PhysicsMotionType.DYNAMIC, new Vector3(1, 2, 3), q);
        expect(b3._bx_CreateBody).toHaveBeenCalledExactlyOnceWith(1, 2, 1, 2, 3, q.x, q.y, q.z, q.w, 1);
    });

    it("instantiates a shape description on the body and scales the inertia with a mass override", () => {
        const mod = createModule();
        const plugin = new Box3DPlugin(true, mod.b3);
        const body = createBody(plugin);
        const slot = body._pluginData.slot;
        const shape = createShape(plugin, PhysicsShapeType.SPHERE, { radius: 0.5 });
        expect(mod.b3._bx_ShapeDesc_CreateSphere).toHaveBeenCalledExactlyOnceWith(0, 0, 0, 0.5);
        plugin.setShape(body, shape);
        expect(mod.b3._bx_Body_SetShape).toHaveBeenCalledExactlyOnceWith(slot, shape._pluginData.slot);

        // the shape derived mass is 10 with a diagonal inertia of 2, asking for 5 halves the inertia
        mod.setMassData(slot, [10, 0, 0, 0, 2, 2, 2]);
        plugin.setMassProperties(body, { mass: 5 });
        expect(mod.b3._bx_Body_SetMassData).toHaveBeenLastCalledWith(slot, 5, 0, 0, 0, 1, 1, 1);
    });

    it("destroys the native body and forgets it on dispose", () => {
        const { b3 } = createModule();
        const plugin = new Box3DPlugin(true, b3);
        const body = createBody(plugin);
        const slot = body._pluginData.slot;
        plugin.disposeBody(body);
        expect(b3._bx_DestroyBody).toHaveBeenCalledExactlyOnceWith(slot);
        expect(body._pluginData).toBeUndefined();
    });
});

describe("Box3DPlugin stepping and events", () => {
    it("steps the world and syncs only the bodies reported by move events", () => {
        const mod = createModule();
        const plugin = new Box3DPlugin(true, mod.b3);
        const moved = createBody(plugin);
        const still = createBody(plugin);
        const q = Quaternion.RotationAxis(Vector3.Right(), 0.3);
        mod.setMoveEvents([[moved._pluginData.slot, 4, 5, 6, q.x, q.y, q.z, q.w, 0]]);

        plugin.executeStep(1 / 60, [moved, still]);

        expect(mod.b3._bx_World_Step).toHaveBeenCalledExactlyOnceWith(1, 1 / 60, plugin.subStepCount);
        expect(moved.transformNode.position.asArray()).toEqual([4, 5, 6]);
        expect(moved.transformNode.rotationQuaternion!.equalsWithEpsilon(q)).toBe(true);
        expect(still.transformNode.position.asArray()).toEqual([0, 0, 0]);
        // bodies with the pre step disabled must not be teleported
        expect(mod.b3._bx_Body_SetTransform).not.toHaveBeenCalled();
    });

    it("maps contact begin, hit and end events to Babylon collision events", () => {
        const mod = createModule();
        const plugin = new Box3DPlugin(true, mod.b3);
        const a = createBody(plugin);
        const b = createBody(plugin);
        plugin.setCollisionCallbackEnabled(a, true);
        expect(mod.b3._bx_Body_EnableContactEvents).toHaveBeenLastCalledWith(a._pluginData.slot, 1);

        const sa = a._pluginData.slot;
        const sb = b._pluginData.slot;
        mod.setContactEvents([
            [0, 0, 0, sa, sb, 0, 0, 0, 0, 0, 0, 0],
            [2, 0, 0, sa, sb, 1, 2, 3, 0, 1, 0, 7],
            [1, 0, 0, sa, sb, 0, 0, 0, 0, 0, 0, 0],
        ]);
        const collisions: IPhysicsCollisionEvent[] = [];
        const ended: PhysicsEventType[] = [];
        plugin.onCollisionObservable.add((e) => collisions.push(e));
        plugin.onCollisionEndedObservable.add((e) => ended.push(e.type));

        plugin.executeStep(1 / 60, [a, b]);

        expect(collisions.map((e) => e.type)).toEqual([PhysicsEventType.COLLISION_STARTED, PhysicsEventType.COLLISION_CONTINUED]);
        expect(collisions.every((e) => e.collider === a && e.collidedAgainst === b)).toBe(true);
        const hit = collisions[1];
        expect(hit.point!.asArray()).toEqual([1, 2, 3]);
        expect(hit.normal!.asArray()).toEqual([0, 1, 0]);
        expect(hit.impulse).toBe(7);
        expect(ended).toEqual([PhysicsEventType.COLLISION_FINISHED]);
    });

    it("ignores contact events when neither body asked for them", () => {
        const mod = createModule();
        const plugin = new Box3DPlugin(true, mod.b3);
        const a = createBody(plugin);
        const b = createBody(plugin);
        mod.setContactEvents([[0, 0, 0, a._pluginData.slot, b._pluginData.slot, 0, 0, 0, 0, 0, 0, 0]]);
        const spy = vi.fn();
        plugin.onCollisionObservable.add(spy);
        plugin.executeStep(1 / 60, [a, b]);
        expect(spy).not.toHaveBeenCalled();
    });
});

describe("Box3DPlugin constraints", () => {
    it("builds hinge frames with the Babylon axis along box3d's revolute z axis", () => {
        const mod = createModule();
        const plugin = new Box3DPlugin(true, mod.b3);
        const parent = createBody(plugin);
        const child = createBody(plugin);
        const constraint = {
            type: PhysicsConstraintType.HINGE,
            options: { pivotA: new Vector3(1, 0, 0), pivotB: new Vector3(-1, 0, 0), axisA: new Vector3(0, 1, 0), axisB: new Vector3(0, 1, 0) },
            _pluginData: undefined,
        } as unknown as PhysicsConstraint;
        let frames: Float32Array | undefined;
        mod.b3._bx_CreateJoint.mockImplementation(() => {
            frames = mod.scratch.slice(0, 14);
            return 200;
        });

        plugin.initConstraint(constraint, parent, child);

        expect(mod.b3._bx_CreateJoint).toHaveBeenCalledExactlyOnceWith(1, 2, parent._pluginData.slot, child._pluginData.slot, 0, 0);
        expect(Array.from(frames!.slice(0, 3))).toEqual([1, 0, 0]);
        expect(Array.from(frames!.slice(7, 10))).toEqual([-1, 0, 0]);
        const qA = new Quaternion(frames![3], frames![4], frames![5], frames![6]);
        const zAxis = Vector3.Forward().applyRotationQuaternion(qA);
        expect(zAxis.equalsWithEpsilon(new Vector3(0, 1, 0), 1e-5)).toBe(true);
        expect(plugin.getBodiesUsingConstraint(constraint)).toEqual([{ parentBody: parent, parentBodyIndex: 0, childBody: child, childBodyIndex: 0 }]);
    });

    it("re-creates the joint when a disabled constraint is enabled again", () => {
        const mod = createModule();
        const plugin = new Box3DPlugin(true, mod.b3);
        const parent = createBody(plugin);
        const child = createBody(plugin);
        const constraint = {
            type: PhysicsConstraintType.BALL_AND_SOCKET,
            options: { pivotA: Vector3.Zero(), pivotB: Vector3.Zero() },
            _pluginData: undefined,
        } as unknown as PhysicsConstraint;
        mod.b3._bx_DestroyJoint = vi.fn();
        plugin.initConstraint(constraint, parent, child);
        plugin.setEnabled(constraint, false);
        expect(mod.b3._bx_DestroyJoint).toHaveBeenCalledExactlyOnceWith(200);
        expect(plugin.getEnabled(constraint)).toBe(false);
        plugin.setEnabled(constraint, true);
        expect(mod.b3._bx_CreateJoint).toHaveBeenCalledTimes(2);
        expect(plugin.getEnabled(constraint)).toBe(true);
    });
});

describe("Box3DPlugin raycast", () => {
    it("fills the results closest first and resolves the hit body", () => {
        const mod = createModule();
        const plugin = new Box3DPlugin(true, mod.b3);
        const far = createBody(plugin);
        const near = createBody(plugin);
        mod.setRayHits([
            [0, 3, 0, 0, 1, 0, 0.7, far._pluginData.slot, 0, -1, 0],
            [0, 7, 0, 0, 1, 0, 0.3, near._pluginData.slot, 0, -1, 0],
        ]);
        const results = [new PhysicsRaycastResult(), new PhysicsRaycastResult()];

        plugin.raycast(new Vector3(0, 10, 0), new Vector3(0, 0, 0), results);

        expect(mod.b3._bx_World_CastRay).toHaveBeenCalledExactlyOnceWith(1, 0, 10, 0, 0, -10, 0, 0xffffffff, 0xffffffff, 0, 0, 0);
        expect(results[0].hasHit).toBe(true);
        expect(results[0].body).toBe(near);
        expect(results[0].hitPointWorld.y).toBe(7);
        expect(results[0].hitDistance).toBe(3);
        expect(results[1].body).toBe(far);
    });

    it("reports no hit when the world has nothing in the way", () => {
        const { b3 } = createModule();
        const plugin = new Box3DPlugin(true, b3);
        const result = new PhysicsRaycastResult();
        plugin.raycast(new Vector3(0, 10, 0), new Vector3(0, 0, 0), result);
        expect(result.hasHit).toBe(false);
    });
});
