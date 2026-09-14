/* eslint-disable @typescript-eslint/naming-convention */
import { Matrix, Quaternion, TmpVectors, Vector3 } from "../../../Maths/math.vector.pure";
import {
    type IPhysicsEnginePluginV2,
    type PhysicsMassProperties,
    type PhysicsShapeParameters,
    type ConstrainedBodyPair,
    type IPhysicsCollisionEvent,
    type IBasePhysicsCollisionEvent,
    PhysicsShapeType,
    PhysicsConstraintType,
    PhysicsMotionType,
    PhysicsConstraintAxis,
    PhysicsConstraintAxisLimitMode,
    PhysicsConstraintMotorType,
    PhysicsEventType,
    PhysicsPrestepType,
} from "../IPhysicsEnginePlugin";
import { type IRaycastQuery, PhysicsRaycastResult } from "../../physicsRaycastResult";
import { Logger } from "../../../Misc/logger";
import { type PhysicsBody } from "../physicsBody";
import { type PhysicsConstraint } from "../physicsConstraint";
import { type PhysicsMaterial } from "../physicsMaterial";
import { type PhysicsShape } from "../physicsShape";
import { BoundingBox } from "../../../Culling/boundingBox";
import { type TransformNode } from "../../../Meshes/transformNode";
import { Mesh } from "../../../Meshes/mesh.pure";
import { InstancedMesh } from "../../../Meshes/instancedMesh.pure";
import { VertexBuffer } from "../../../Buffers/buffer.pure";
import { Observable } from "../../../Misc/observable";
import { type Nullable, type FloatArray } from "../../../types";

/**
 * Per body plugin data. One instance per Box3D body (thin instances get one each).
 */
class Box3DBodyData {
    public constructor(
        /** slot handle inside the WASM shim */
        public slot: number
    ) {}
    public userMassProps: PhysicsMassProperties = {};
    public eventMask = 0;
    public collisionEnded = false;
    public motionType = PhysicsMotionType.STATIC;
}

/**
 * Per shape plugin data. A Babylon shape is a description that gets instantiated on each body it is set on.
 */
class Box3DShapeData {
    public constructor(
        public slot: number,
        public type: PhysicsShapeType
    ) {}
    public material: PhysicsMaterial = {};
    /** bodies currently instantiating this shape, refreshed when the description changes */
    public users = new Set<Box3DBodyData>();
    /** for containers: child shapes, so changes propagate to users */
    public children: Box3DShapeData[] = [];
    public parents = new Set<Box3DShapeData>();
}

/** Axis state kept on the JS side because box3d has no generic axis API. */
interface IAxisState {
    mode: PhysicsConstraintAxisLimitMode;
    min: number;
    max: number;
    motor: PhysicsConstraintMotorType;
    target: number;
    maxForce: number;
    friction: number;
}

class Box3DConstraintData {
    public joints: number[] = [];
    public pairs: Array<{ parent: PhysicsBody; parentIndex: number; child: PhysicsBody; childIndex: number; parentData: Box3DBodyData; childData: Box3DBodyData }> = [];
    public type: PhysicsConstraintType = PhysicsConstraintType.LOCK;
    public jointType = 0;
    public enabled = true;
    public collisions = false;
    public frames = new Float32Array(14);
    public length = 0;
    public axes = new Map<PhysicsConstraintAxis, IAxisState>();
}

// shim joint types
const enum Box3DJointType {
    WELD = 0,
    SPHERICAL = 1,
    REVOLUTE = 2,
    PRISMATIC = 3,
    DISTANCE = 4,
    FILTER = 5,
    WHEEL = 6,
    PARALLEL = 7,
}

/**
 * Options for a Box3D wheel joint (Box3D specific, no Babylon equivalent).
 * The suspension travels along axisA (chassis space), the wheel spins about spinAxisB (wheel space)
 * and steers about the suspension axis.
 */
export interface IBox3DWheelJointOptions {
    /** anchor on the chassis, chassis local space */
    pivotA: Vector3;
    /** suspension axis in chassis local space (usually up) */
    axisA?: Vector3;
    /** axle direction in chassis local space, the wheel spins about it (default +z) */
    axleA?: Vector3;
    /** anchor on the wheel, wheel local space */
    pivotB?: Vector3;
    /** suspension spring stiffness in hertz */
    suspensionHertz?: number;
    /** suspension spring damping ratio */
    suspensionDampingRatio?: number;
    /** suspension travel limits along axisA */
    suspensionLimits?: [number, number];
    /** whether the wheel is driven */
    enableSpinMotor?: boolean;
    /** maximum drive torque */
    maxSpinTorque?: number;
    /** whether the wheel steers */
    enableSteering?: boolean;
    /** steering spring stiffness in hertz */
    steeringHertz?: number;
    /** steering spring damping ratio */
    steeringDampingRatio?: number;
    /** maximum steering torque */
    maxSteeringTorque?: number;
    /** steering angle limits in radians */
    steeringLimits?: [number, number];
}

/**
 * Handle to a Box3D wheel joint created with Box3DPlugin.createWheelJoint.
 */
export class Box3DWheelJoint {
    /**
     * @internal
     */
    public constructor(
        private _plugin: Box3DPlugin,
        /** @internal */
        public _slot: number
    ) {}

    /**
     * Sets the target angular speed of the spin motor.
     * @param speed radians per second
     */
    public setSpinSpeed(speed: number): void {
        this._plugin._wheelCall("_bx_WheelJoint_SetSpinMotorSpeed", this._slot, speed);
    }

    /**
     * Sets the maximum torque the spin motor can apply.
     * @param torque newton meters
     */
    public setMaxSpinTorque(torque: number): void {
        this._plugin._wheelCall("_bx_WheelJoint_SetMaxSpinTorque", this._slot, torque);
    }

    /**
     * Enables or disables the spin motor (disabled wheels roll freely).
     * @param enabled true to enable
     */
    public enableSpinMotor(enabled: boolean): void {
        this._plugin._wheelCall("_bx_WheelJoint_EnableSpinMotor", this._slot, enabled ? 1 : 0);
    }

    /**
     * Sets the target steering angle.
     * @param radians steering angle
     */
    public setSteeringAngle(radians: number): void {
        this._plugin._wheelCall("_bx_WheelJoint_SetTargetSteeringAngle", this._slot, radians);
    }

    /**
     * Tunes the suspension spring.
     * @param hertz stiffness
     * @param dampingRatio damping ratio
     */
    public setSuspension(hertz: number, dampingRatio: number): void {
        this._plugin._wheelCall("_bx_WheelJoint_SetSuspension", this._slot, hertz, dampingRatio);
    }

    /**
     * Removes the joint.
     */
    public dispose(): void {
        this._plugin._destroyExtraJoint(this._slot);
        this._slot = 0;
    }
}

const MOVE_STRIDE = 9;
const CONTACT_STRIDE = 12;
const SENSOR_STRIDE = 5;
const RAY_STRIDE = 11;

/**
 * Collects mesh geometry in the physics body's local space (scaling baked in).
 */
class MeshGeometryAccumulator {
    private _vertices: number[] = [];
    private _indices: number[] = [];

    public constructor(
        private _collectIndices: boolean,
        private _flipWinding: boolean
    ) {}

    public addNodeMeshes(mesh: TransformNode, includeChildren: boolean): void {
        mesh.computeWorldMatrix(true);
        const rootScaled = TmpVectors.Matrix[0];
        Matrix.ScalingToRef(mesh.absoluteScaling.x, mesh.absoluteScaling.y, mesh.absoluteScaling.z, rootScaled);
        if (mesh instanceof Mesh) {
            this._addMesh(mesh, rootScaled);
        } else if (mesh instanceof InstancedMesh) {
            this._addMesh(mesh.sourceMesh, rootScaled);
        }
        if (includeChildren) {
            const worldToRoot = TmpVectors.Matrix[1];
            mesh.computeWorldMatrix().invertToRef(worldToRoot);
            const worldToRootScaled = TmpVectors.Matrix[2];
            worldToRoot.multiplyToRef(rootScaled, worldToRootScaled);
            const children = mesh.getChildMeshes(false).filter((m: any) => !m.physicsBody);
            for (const m of children) {
                const childToWorld = m.computeWorldMatrix();
                const childToRootScaled = TmpVectors.Matrix[3];
                childToWorld.multiplyToRef(worldToRootScaled, childToRootScaled);
                if (m instanceof Mesh) {
                    this._addMesh(m, childToRootScaled);
                } else if (m instanceof InstancedMesh) {
                    this._addMesh(m.sourceMesh, childToRootScaled);
                }
            }
        }
    }

    private _addMesh(mesh: Mesh, meshToRoot: Matrix): void {
        const vertexData = mesh.getVerticesData(VertexBuffer.PositionKind) || [];
        const numVerts = vertexData.length / 3;
        const indexOffset = this._vertices.length / 3;
        const p = TmpVectors.Vector3[0];
        for (let v = 0; v < numVerts; v++) {
            p.set(vertexData[v * 3 + 0], vertexData[v * 3 + 1], vertexData[v * 3 + 2]);
            Vector3.TransformCoordinatesToRef(p, meshToRoot, p);
            this._vertices.push(p.x, p.y, p.z);
        }
        if (this._collectIndices) {
            const meshIndices = mesh.getIndices();
            if (meshIndices) {
                for (let i = 0; i < meshIndices.length; i += 3) {
                    if (this._flipWinding) {
                        this._indices.push(meshIndices[i + 2] + indexOffset, meshIndices[i + 1] + indexOffset, meshIndices[i + 0] + indexOffset);
                    } else {
                        this._indices.push(meshIndices[i + 0] + indexOffset, meshIndices[i + 1] + indexOffset, meshIndices[i + 2] + indexOffset);
                    }
                }
            }
        }
    }

    public get vertexCount(): number {
        return this._vertices.length / 3;
    }

    public get triangleCount(): number {
        return this._indices.length / 3;
    }

    public get vertices(): number[] {
        return this._vertices;
    }

    public get indices(): number[] {
        return this._indices;
    }
}

/**
 * Box3D physics plugin for Babylon.js physics v2.
 * Box3D is Erin Catto's 3D rigid body engine (https://github.com/erincatto/box3d). This plugin drives the
 * WebAssembly build published as the `babylon-box3d` npm package, which wraps box3d in a flat, handle based C API.
 * Usage mirrors the Havok plugin:
 * ```ts
 * import Box3D from "babylon-box3d";
 * const box3d = await Box3D();
 * scene.enablePhysics(new Vector3(0, -9.81, 0), new Box3DPlugin(true, box3d));
 * ```
 */
export class Box3DPlugin implements IPhysicsEnginePluginV2 {
    /** Reference to the WASM module (the value resolved by the module factory). */
    public world: any;
    /** Name of the plugin */
    public name = "Box3DPlugin";
    /** Number of solver sub steps per world step. Box3D recommends 4. */
    public subStepCount = 4;
    /** Wall clock time of the last world step in milliseconds (JavaScript side, includes the event sync). */
    public lastStepTimeMs = 0;

    private _b3: any;
    private _worldSlot = 0;
    private _fixedTimeStep = 1 / 60;
    private _timeStep = 1 / 60;
    private _maxAngularVelocity = 4 * Math.PI * 10;
    private _bodies: Array<{ body: PhysicsBody; index: number; data: Box3DBodyData } | undefined> = [];
    private _shapes: Array<Box3DShapeData | undefined> = [];
    private _bodyCollisionObservable = new Map<number, Observable<IPhysicsCollisionEvent>>();
    private _bodyCollisionEndedObservable = new Map<number, Observable<IBasePhysicsCollisionEvent>>();
    private _touchedInstanceMeshes = new Set<Mesh>();
    private _tmpVec3 = [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
    private _tmpQuat = [new Quaternion(), new Quaternion(), new Quaternion()];
    private _warned = new Set<string>();

    /** Observable for collision started and continued events */
    public onCollisionObservable = new Observable<IPhysicsCollisionEvent>();
    /** Observable for collision ended events */
    public onCollisionEndedObservable = new Observable<IBasePhysicsCollisionEvent>();
    /** Observable for trigger entered and exited events */
    public onTriggerCollisionObservable = new Observable<IBasePhysicsCollisionEvent>();

    /**
     * Creates a Box3D plugin.
     * @param _useDeltaForWorldStep step the world with the frame delta (true) or a fixed time step (false)
     * @param box3dModule the resolved Box3D WASM module (await Box3DModule())
     */
    public constructor(
        private _useDeltaForWorldStep = true,
        box3dModule: any
    ) {
        if (!box3dModule) {
            throw new Error("Box3D module is required: pass the awaited result of the Box3D module factory.");
        }
        this._b3 = box3dModule;
        this.world = box3dModule;
        this._worldSlot = this._b3._bx_CreateWorld(0, -9.81, 0);
        if (!this._worldSlot) {
            throw new Error("Box3D: could not create a world (max worlds reached?)");
        }
    }

    // ----------------------------------------------------------------------------------------
    // helpers
    // ----------------------------------------------------------------------------------------

    private _scratch(): Float32Array {
        return new Float32Array(this._b3.HEAPF32.buffer, this._b3._bx_Scratch(), 64);
    }

    private _warnOnce(key: string, message: string): void {
        if (!this._warned.has(key)) {
            this._warned.add(key);
            Logger.Warn(`Box3DPlugin: ${message}`);
        }
    }

    private _getPluginReference(body: PhysicsBody, instanceIndex?: number): Box3DBodyData {
        return body._pluginDataInstances?.length ? body._pluginDataInstances[instanceIndex ?? 0] : body._pluginData;
    }

    private _applyToBodyOrInstances(body: PhysicsBody, fn: (data: Box3DBodyData) => void, instanceIndex?: number): void {
        if (body._pluginDataInstances?.length > 0 && instanceIndex === undefined) {
            for (const data of body._pluginDataInstances) {
                fn(data);
            }
        } else {
            fn(this._getPluginReference(body, instanceIndex));
        }
    }

    private _motionTypeToNative(motionType: PhysicsMotionType): number {
        switch (motionType) {
            case PhysicsMotionType.STATIC:
                return 0;
            case PhysicsMotionType.ANIMATED:
                return 1;
            default:
                return 2;
        }
    }

    private _nodeTransformToRef(node: TransformNode, position: Vector3, orientation: Quaternion): void {
        if (node.parent) {
            node.computeWorldMatrix(true);
            position.copyFrom(node.absolutePosition);
            orientation.copyFrom(node.absoluteRotationQuaternion);
            return;
        }
        position.copyFrom(node.position);
        if (node.rotationQuaternion) {
            orientation.copyFrom(node.rotationQuaternion);
        } else {
            Quaternion.FromEulerAnglesToRef(node.rotation.x, node.rotation.y, node.rotation.z, orientation);
        }
    }

    // ----------------------------------------------------------------------------------------
    // world
    // ----------------------------------------------------------------------------------------

    public setGravity(gravity: Vector3): void {
        this._b3._bx_World_SetGravity(this._worldSlot, gravity.x, gravity.y, gravity.z);
    }

    public setTimeStep(timeStep: number): void {
        this._fixedTimeStep = timeStep;
    }

    public getTimeStep(): number {
        return this._fixedTimeStep;
    }

    public executeStep(delta: number, physicsBodies: Array<PhysicsBody>): void {
        for (const physicsBody of physicsBodies) {
            if (physicsBody.disablePreStep) {
                continue;
            }
            this.setPhysicsBodyTransformation(physicsBody, physicsBody.transformNode);
        }

        const deltaTime = this._useDeltaForWorldStep ? delta : this._fixedTimeStep;
        this._timeStep = deltaTime;
        const start = performance.now();
        this._b3._bx_World_Step(this._worldSlot, deltaTime, this.subStepCount);

        // Only bodies that moved report an event, so sync those instead of iterating every body.
        const moveCount = this._b3._bx_World_GetMoveEvents(this._worldSlot);
        if (moveCount > 0) {
            const buffer = new Float32Array(this._b3.HEAPF32.buffer, this._b3._bx_MoveEventsPtr(), moveCount * MOVE_STRIDE);
            for (let i = 0; i < moveCount; i++) {
                const offset = i * MOVE_STRIDE;
                const ref = this._bodies[buffer[offset]];
                if (!ref || ref.body.disableSync) {
                    continue;
                }
                this._syncBodyFromBuffer(ref.body, ref.index, buffer, offset + 1);
            }
            for (const mesh of this._touchedInstanceMeshes) {
                mesh.thinInstanceBufferUpdated("matrix");
            }
            this._touchedInstanceMeshes.clear();
        }

        this._notifyCollisions();
        this._notifyTriggers();
        this.lastStepTimeMs = performance.now() - start;
    }

    public getPluginVersion(): number {
        return 2;
    }

    public setVelocityLimits(maxLinearVelocity: number, maxAngularVelocity: number): void {
        this._b3._bx_World_SetMaximumLinearSpeed(this._worldSlot, maxLinearVelocity);
        this._maxAngularVelocity = maxAngularVelocity;
    }

    public getMaxLinearVelocity(): number {
        return this._b3._bx_World_GetMaximumLinearSpeed(this._worldSlot);
    }

    public getMaxAngularVelocity(): number {
        return this._maxAngularVelocity;
    }

    /**
     * Box3D counters and timings for the current world.
     * @returns body, shape, contact, joint and island counts plus the last step time in milliseconds
     */
    public getStats(): { bodies: number; shapes: number; contacts: number; joints: number; islands: number; stepMs: number; collideMs: number; solveMs: number } {
        this._b3._bx_World_GetStats(this._worldSlot);
        const s = this._scratch();
        return { bodies: s[0], shapes: s[1], contacts: s[2], joints: s[3], islands: s[4], stepMs: s[5], collideMs: s[6], solveMs: s[7] };
    }

    /**
     * Enables or disables island sleeping.
     * @param enabled true to let resting bodies sleep
     */
    public setSleepingEnabled(enabled: boolean): void {
        this._b3._bx_World_EnableSleeping(this._worldSlot, enabled ? 1 : 0);
    }

    /**
     * Enables or disables continuous collision against static geometry.
     * @param enabled true to enable continuous collision
     */
    public setContinuousEnabled(enabled: boolean): void {
        this._b3._bx_World_EnableContinuous(this._worldSlot, enabled ? 1 : 0);
    }

    // ----------------------------------------------------------------------------------------
    // bodies
    // ----------------------------------------------------------------------------------------

    private _createNativeBody(motionType: PhysicsMotionType, position: Vector3, orientation: Quaternion, startAsleep: boolean): Box3DBodyData {
        const slot = this._b3._bx_CreateBody(
            this._worldSlot,
            this._motionTypeToNative(motionType),
            position.x,
            position.y,
            position.z,
            orientation.x,
            orientation.y,
            orientation.z,
            orientation.w,
            startAsleep ? 0 : 1
        );
        const data = new Box3DBodyData(slot);
        data.motionType = motionType;
        return data;
    }

    public initBody(body: PhysicsBody, motionType: PhysicsMotionType, position: Vector3, orientation: Quaternion): void {
        const data = this._createNativeBody(motionType, position, orientation, body.startAsleep);
        body._pluginData = data;
        this._bodies[data.slot] = { body, index: 0, data };
    }

    public initBodyInstances(body: PhysicsBody, motionType: PhysicsMotionType, mesh: Mesh): void {
        const instancesCount = mesh._thinInstanceDataStorage?.instancesCount ?? 0;
        const matrixData = mesh._thinInstanceDataStorage?.matrixData;
        if (!matrixData) {
            return;
        }
        this._createOrUpdateBodyInstances(body, motionType, matrixData, 0, instancesCount, false);
    }

    private _createOrUpdateBodyInstances(body: PhysicsBody, motionType: PhysicsMotionType, matrixData: Float32Array, startIndex: number, endIndex: number, update: boolean): void {
        const rotation = TmpVectors.Quaternion[0];
        const rotationMatrix = TmpVectors.Matrix[0];
        const position = TmpVectors.Vector3[0];
        for (let i = startIndex; i < endIndex; i++) {
            position.set(matrixData[i * 16 + 12], matrixData[i * 16 + 13], matrixData[i * 16 + 14]);
            Matrix.FromArrayToRef(matrixData, i * 16, rotationMatrix);
            rotationMatrix.decompose(undefined, rotation, undefined);
            if (update) {
                const data = body._pluginDataInstances[i];
                this._b3._bx_Body_SetTransform(data.slot, position.x, position.y, position.z, rotation.x, rotation.y, rotation.z, rotation.w);
            } else {
                const data = this._createNativeBody(motionType, position, rotation, body.startAsleep);
                if (body._pluginDataInstances.length) {
                    data.userMassProps = body._pluginDataInstances[0].userMassProps;
                }
                body._pluginDataInstances.push(data);
                this._bodies[data.slot] = { body, index: i, data };
            }
        }
    }

    public updateBodyInstances(body: PhysicsBody, mesh: Mesh): void {
        const instancesCount = mesh._thinInstanceDataStorage?.instancesCount ?? 0;
        const matrixData = mesh._thinInstanceDataStorage?.matrixData;
        if (!matrixData) {
            return;
        }
        const pluginInstancesCount = body._pluginDataInstances.length;
        const motionType = this.getMotionType(body);
        if (instancesCount > pluginInstancesCount) {
            this._createOrUpdateBodyInstances(body, motionType, matrixData, pluginInstancesCount, instancesCount, false);
            const shape = body.shape;
            if (shape && shape._pluginData) {
                for (let i = pluginInstancesCount; i < instancesCount; i++) {
                    this._setBodyShape(body._pluginDataInstances[i], shape._pluginData as Box3DShapeData);
                }
            }
        } else if (instancesCount < pluginInstancesCount) {
            const instancesToRemove = pluginInstancesCount - instancesCount;
            for (let i = 0; i < instancesToRemove; i++) {
                const data = body._pluginDataInstances.pop() as Box3DBodyData;
                this._destroyBodyData(data);
            }
            this._createOrUpdateBodyInstances(body, motionType, matrixData, 0, instancesCount, true);
        }
    }

    private _destroyBodyData(data: Box3DBodyData): void {
        if (!data) {
            return;
        }
        for (const shape of this._shapes) {
            shape?.users.delete(data);
        }
        this._bodyCollisionObservable.delete(data.slot);
        this._bodyCollisionEndedObservable.delete(data.slot);
        this._bodies[data.slot] = undefined;
        this._b3._bx_DestroyBody(data.slot);
        data.slot = 0;
    }

    public removeBody(body: PhysicsBody): void {
        // Box3D has no add/remove without destroying. The body is destroyed and re-created by initBody if needed.
        if (body._pluginDataInstances?.length) {
            for (const data of body._pluginDataInstances) {
                this._destroyBodyData(data);
            }
        }
        if (body._pluginData) {
            this._destroyBodyData(body._pluginData);
        }
    }

    public sync(body: PhysicsBody): void {
        this.syncTransform(body, body.transformNode);
    }

    private _syncBodyFromBuffer(body: PhysicsBody, index: number, buffer: Float32Array, offset: number): void {
        const node = body.transformNode;
        if (body._pluginDataInstances.length) {
            const m = node as Mesh;
            const matrixData = m._thinInstanceDataStorage?.matrixData;
            if (!matrixData) {
                return;
            }
            const scale = this._tmpVec3[0];
            const base = index * 16;
            scale.set(
                Math.hypot(matrixData[base], matrixData[base + 1], matrixData[base + 2]),
                Math.hypot(matrixData[base + 4], matrixData[base + 5], matrixData[base + 6]),
                Math.hypot(matrixData[base + 8], matrixData[base + 9], matrixData[base + 10])
            );
            const quat = this._tmpQuat[0];
            quat.set(buffer[offset + 3], buffer[offset + 4], buffer[offset + 5], buffer[offset + 6]);
            const position = this._tmpVec3[1];
            position.set(buffer[offset], buffer[offset + 1], buffer[offset + 2]);
            const matrix = TmpVectors.Matrix[0];
            Matrix.ComposeToRef(scale, quat, position, matrix);
            matrix.copyToArray(matrixData, base);
            this._touchedInstanceMeshes.add(m);
            return;
        }
        this._applyTransformToNode(node, buffer[offset], buffer[offset + 1], buffer[offset + 2], buffer[offset + 3], buffer[offset + 4], buffer[offset + 5], buffer[offset + 6]);
    }

    private _applyTransformToNode(node: TransformNode, px: number, py: number, pz: number, qx: number, qy: number, qz: number, qw: number): void {
        const quat = this._tmpQuat[0];
        quat.set(qx, qy, qz, qw);
        const parent = node.parent as TransformNode;
        if (parent && !parent.getWorldMatrix().isIdentity()) {
            parent.computeWorldMatrix(true);
            const savedScaling = this._tmpVec3[2];
            savedScaling.copyFrom(node.scaling);
            const finalTransform = TmpVectors.Matrix[0];
            const finalTranslation = this._tmpVec3[3];
            finalTranslation.set(px, py, pz);
            Matrix.ComposeToRef(node.absoluteScaling, quat, finalTranslation, finalTransform);
            const parentInverse = TmpVectors.Matrix[1];
            parent.getWorldMatrix().invertToRef(parentInverse);
            const localTransform = TmpVectors.Matrix[2];
            finalTransform.multiplyToRef(parentInverse, localTransform);
            localTransform.decomposeToTransformNode(node);
            node.rotationQuaternion?.normalize();
            node.scaling.copyFrom(savedScaling);
        } else {
            node.position.set(px, py, pz);
            if (node.rotationQuaternion) {
                node.rotationQuaternion.copyFrom(quat);
            } else {
                quat.toEulerAnglesToRef(node.rotation);
            }
        }
    }

    public syncTransform(body: PhysicsBody, transformNode: TransformNode): void {
        if (body._pluginDataInstances.length) {
            const m = transformNode as Mesh;
            const matrixData = m._thinInstanceDataStorage?.matrixData;
            if (!matrixData) {
                return;
            }
            for (let i = 0; i < body._pluginDataInstances.length; i++) {
                const data = body._pluginDataInstances[i] as Box3DBodyData;
                this._b3._bx_Body_GetTransform(data.slot);
                this._syncBodyFromBuffer(body, i, this._scratch(), 0);
            }
            m.thinInstanceBufferUpdated("matrix");
            this._touchedInstanceMeshes.delete(m);
            return;
        }
        const data = body._pluginData as Box3DBodyData;
        if (!data || !data.slot) {
            return;
        }
        this._b3._bx_Body_GetTransform(data.slot);
        const s = this._scratch();
        this._applyTransformToNode(transformNode, s[0], s[1], s[2], s[3], s[4], s[5], s[6]);
    }

    /**
     * Pushes the transform node's pose into the physics body (called during the pre step).
     * @param body the physics body
     * @param node the transform node to read from
     */
    public setPhysicsBodyTransformation(body: PhysicsBody, node: TransformNode): void {
        const prestep = body.getPrestepType();
        if (prestep == PhysicsPrestepType.TELEPORT) {
            if (body._pluginDataInstances.length > 0) {
                const m = node as Mesh;
                const matrixData = m._thinInstanceDataStorage?.matrixData;
                if (!matrixData) {
                    return;
                }
                this._createOrUpdateBodyInstances(body, body.getMotionType(), matrixData, 0, body._pluginDataInstances.length, true);
                return;
            }
            const data = body._pluginData as Box3DBodyData;
            const position = this._tmpVec3[0];
            const orientation = this._tmpQuat[0];
            this._nodeTransformToRef(node, position, orientation);
            this._b3._bx_Body_SetTransform(data.slot, position.x, position.y, position.z, orientation.x, orientation.y, orientation.z, orientation.w);
        } else if (prestep == PhysicsPrestepType.ACTION) {
            this.setTargetTransform(body, node.absolutePosition, node.absoluteRotationQuaternion);
        } else if (prestep == PhysicsPrestepType.DISABLED) {
            Logger.Warn("Prestep type is set to DISABLED. Unable to set physics body transformation.");
        }
    }

    public setTargetTransform(body: PhysicsBody, position: Vector3, rotation: Quaternion, instanceIndex?: number): void {
        this._applyToBodyOrInstances(
            body,
            (data) => {
                this._b3._bx_Body_SetTargetTransform(data.slot, position.x, position.y, position.z, rotation.x, rotation.y, rotation.z, rotation.w, this._timeStep);
            },
            instanceIndex
        );
    }

    private _setBodyShape(data: Box3DBodyData, shape: Nullable<Box3DShapeData>): void {
        for (const existing of this._shapes) {
            existing?.users.delete(data);
        }
        this._b3._bx_Body_SetShape(data.slot, shape ? shape.slot : 0);
        if (shape) {
            shape.users.add(data);
        }
        this._b3._bx_Body_EnableContactEvents(data.slot, data.eventMask ? 1 : 0);
        this._internalUpdateMassProperties(data);
    }

    public setShape(body: PhysicsBody, shape: Nullable<PhysicsShape>): void {
        const shapeData = shape && shape._pluginData ? (shape._pluginData as Box3DShapeData) : null;
        this._applyToBodyOrInstances(body, (data) => this._setBodyShape(data, shapeData));
    }

    public getShape(body: PhysicsBody): Nullable<PhysicsShape> {
        return body.shape ?? null;
    }

    public getShapeType(shape: PhysicsShape): PhysicsShapeType {
        return shape.type ?? (shape._pluginData as Box3DShapeData)?.type ?? PhysicsShapeType.CONTAINER;
    }

    public setEventMask(body: PhysicsBody, eventMask: number, instanceIndex?: number): void {
        this._applyToBodyOrInstances(
            body,
            (data) => {
                data.eventMask = eventMask;
                this._b3._bx_Body_EnableContactEvents(data.slot, eventMask ? 1 : 0);
            },
            instanceIndex
        );
    }

    public getEventMask(body: PhysicsBody, instanceIndex?: number): number {
        return this._getPluginReference(body, instanceIndex).eventMask;
    }

    public setMotionType(body: PhysicsBody, motionType: PhysicsMotionType, instanceIndex?: number): void {
        this._applyToBodyOrInstances(
            body,
            (data) => {
                data.motionType = motionType;
                this._b3._bx_Body_SetType(data.slot, this._motionTypeToNative(motionType));
                this._internalUpdateMassProperties(data);
            },
            instanceIndex
        );
    }

    public getMotionType(body: PhysicsBody, instanceIndex?: number): PhysicsMotionType {
        return this._getPluginReference(body, instanceIndex).motionType;
    }

    private _readMassData(data: Box3DBodyData): PhysicsMassProperties {
        this._b3._bx_Body_GetMassData(data.slot);
        const s = this._scratch();
        return {
            mass: s[0],
            centerOfMass: new Vector3(s[1], s[2], s[3]),
            inertia: new Vector3(s[4], s[5], s[6]),
            inertiaOrientation: Quaternion.Identity(),
        };
    }

    private _internalUpdateMassProperties(data: Box3DBodyData): void {
        if (data.motionType !== PhysicsMotionType.DYNAMIC) {
            return;
        }
        this._b3._bx_Body_ApplyMassFromShapes(data.slot);
        const user = data.userMassProps;
        if (!user || (user.mass === undefined && !user.centerOfMass && !user.inertia)) {
            return;
        }
        const computed = this._readMassData(data);
        let mass = computed.mass!;
        const inertia = computed.inertia!.clone();
        const center = computed.centerOfMass!.clone();
        if (user.mass !== undefined && user.mass > 0) {
            // keep the inertia consistent with the requested mass
            const ratio = mass > 0 ? user.mass / mass : 1;
            inertia.scaleInPlace(ratio);
            mass = user.mass;
        }
        if (user.inertia) {
            inertia.copyFrom(user.inertia);
        }
        if (user.centerOfMass) {
            center.copyFrom(user.centerOfMass);
        }
        if (mass <= 0) {
            mass = 1;
        }
        if (inertia.x <= 0 || inertia.y <= 0 || inertia.z <= 0) {
            inertia.set(Math.max(inertia.x, 0.01 * mass), Math.max(inertia.y, 0.01 * mass), Math.max(inertia.z, 0.01 * mass));
        }
        this._b3._bx_Body_SetMassData(data.slot, mass, center.x, center.y, center.z, inertia.x, inertia.y, inertia.z);
    }

    public computeMassProperties(body: PhysicsBody, instanceIndex?: number): PhysicsMassProperties {
        const data = this._getPluginReference(body, instanceIndex);
        this._b3._bx_Body_ApplyMassFromShapes(data.slot);
        const computed = this._readMassData(data);
        this._internalUpdateMassProperties(data);
        return computed;
    }

    public setMassProperties(body: PhysicsBody, massProps: PhysicsMassProperties, instanceIndex?: number): void {
        this._applyToBodyOrInstances(
            body,
            (data) => {
                data.userMassProps = massProps;
                this._internalUpdateMassProperties(data);
            },
            instanceIndex
        );
    }

    public getMassProperties(body: PhysicsBody, instanceIndex?: number): PhysicsMassProperties {
        return this._readMassData(this._getPluginReference(body, instanceIndex));
    }

    public setLinearDamping(body: PhysicsBody, damping: number, instanceIndex?: number): void {
        this._applyToBodyOrInstances(body, (data) => this._b3._bx_Body_SetLinearDamping(data.slot, damping), instanceIndex);
    }

    public getLinearDamping(body: PhysicsBody, instanceIndex?: number): number {
        return this._b3._bx_Body_GetLinearDamping(this._getPluginReference(body, instanceIndex).slot);
    }

    public setAngularDamping(body: PhysicsBody, damping: number, instanceIndex?: number): void {
        this._applyToBodyOrInstances(body, (data) => this._b3._bx_Body_SetAngularDamping(data.slot, damping), instanceIndex);
    }

    public getAngularDamping(body: PhysicsBody, instanceIndex?: number): number {
        return this._b3._bx_Body_GetAngularDamping(this._getPluginReference(body, instanceIndex).slot);
    }

    public setLinearVelocity(body: PhysicsBody, linVel: Vector3, instanceIndex?: number): void {
        this._applyToBodyOrInstances(body, (data) => this._b3._bx_Body_SetLinearVelocity(data.slot, linVel.x, linVel.y, linVel.z), instanceIndex);
    }

    public getLinearVelocityToRef(body: PhysicsBody, linVel: Vector3, instanceIndex?: number): void {
        this._b3._bx_Body_GetLinearVelocity(this._getPluginReference(body, instanceIndex).slot);
        const s = this._scratch();
        linVel.set(s[0], s[1], s[2]);
    }

    public applyImpulse(body: PhysicsBody, impulse: Vector3, location: Vector3, instanceIndex?: number): void {
        this._applyToBodyOrInstances(
            body,
            (data) => this._b3._bx_Body_ApplyLinearImpulse(data.slot, impulse.x, impulse.y, impulse.z, location.x, location.y, location.z),
            instanceIndex
        );
    }

    public applyAngularImpulse(body: PhysicsBody, angularImpulse: Vector3, instanceIndex?: number): void {
        this._applyToBodyOrInstances(body, (data) => this._b3._bx_Body_ApplyAngularImpulse(data.slot, angularImpulse.x, angularImpulse.y, angularImpulse.z), instanceIndex);
    }

    public applyForce(body: PhysicsBody, force: Vector3, location: Vector3, instanceIndex?: number): void {
        this._applyToBodyOrInstances(body, (data) => this._b3._bx_Body_ApplyForce(data.slot, force.x, force.y, force.z, location.x, location.y, location.z), instanceIndex);
    }

    public applyTorque(body: PhysicsBody, torque: Vector3, instanceIndex?: number): void {
        this._applyToBodyOrInstances(body, (data) => this._b3._bx_Body_ApplyTorque(data.slot, torque.x, torque.y, torque.z), instanceIndex);
    }

    public setAngularVelocity(body: PhysicsBody, angVel: Vector3, instanceIndex?: number): void {
        this._applyToBodyOrInstances(body, (data) => this._b3._bx_Body_SetAngularVelocity(data.slot, angVel.x, angVel.y, angVel.z), instanceIndex);
    }

    public getAngularVelocityToRef(body: PhysicsBody, angVel: Vector3, instanceIndex?: number): void {
        this._b3._bx_Body_GetAngularVelocity(this._getPluginReference(body, instanceIndex).slot);
        const s = this._scratch();
        angVel.set(s[0], s[1], s[2]);
    }

    public getBodyGeometry(body: PhysicsBody): { positions: Float32Array | number[]; indices: Uint32Array | number[] } {
        const shape = body.shape?._pluginData as Box3DShapeData | undefined;
        if (!shape) {
            return { positions: [], indices: [] };
        }
        const vertexCount = this._b3._bx_ShapeDesc_BuildDebugGeometry(shape.slot);
        const indexCount = this._b3._bx_DebugIndexCount();
        if (!vertexCount || !indexCount) {
            return { positions: [], indices: [] };
        }
        const positions = new Float32Array(this._b3.HEAPF32.buffer, this._b3._bx_DebugPositionsPtr(), vertexCount * 3).slice();
        const indices = new Uint32Array(this._b3.HEAPU32.buffer, this._b3._bx_DebugIndicesPtr(), indexCount).slice();
        return { positions, indices };
    }

    public disposeBody(body: PhysicsBody): void {
        this.removeBody(body);
        body._pluginData = undefined;
        body._pluginDataInstances.length = 0;
    }

    public setCollisionCallbackEnabled(body: PhysicsBody, enabled: boolean, instanceIndex?: number): void {
        this.setEventMask(body, enabled ? 1 : 0, instanceIndex);
    }

    public setCollisionEndedCallbackEnabled(body: PhysicsBody, enabled: boolean, instanceIndex?: number): void {
        this._applyToBodyOrInstances(
            body,
            (data) => {
                data.collisionEnded = enabled;
                if (enabled && !data.eventMask) {
                    data.eventMask = 1;
                    this._b3._bx_Body_EnableContactEvents(data.slot, 1);
                }
            },
            instanceIndex
        );
    }

    public getCollisionObservable(body: PhysicsBody, instanceIndex?: number): Observable<IPhysicsCollisionEvent> {
        const slot = this._getPluginReference(body, instanceIndex).slot;
        let observable = this._bodyCollisionObservable.get(slot);
        if (!observable) {
            observable = new Observable<IPhysicsCollisionEvent>();
            this._bodyCollisionObservable.set(slot, observable);
        }
        return observable;
    }

    public getCollisionEndedObservable(body: PhysicsBody, instanceIndex?: number): Observable<IBasePhysicsCollisionEvent> {
        const slot = this._getPluginReference(body, instanceIndex).slot;
        let observable = this._bodyCollisionEndedObservable.get(slot);
        if (!observable) {
            observable = new Observable<IBasePhysicsCollisionEvent>();
            this._bodyCollisionEndedObservable.set(slot, observable);
        }
        return observable;
    }

    public setGravityFactor(body: PhysicsBody, factor: number, instanceIndex?: number): void {
        this._applyToBodyOrInstances(body, (data) => this._b3._bx_Body_SetGravityScale(data.slot, factor), instanceIndex);
    }

    public getGravityFactor(body: PhysicsBody, instanceIndex?: number): number {
        return this._b3._bx_Body_GetGravityScale(this._getPluginReference(body, instanceIndex).slot);
    }

    // ----------------------------------------------------------------------------------------
    // shapes
    // ----------------------------------------------------------------------------------------

    private _registerShape(shape: PhysicsShape, slot: number, type: PhysicsShapeType): Box3DShapeData {
        if (!slot) {
            throw new Error("Box3DPlugin: shape creation failed (degenerate geometry?)");
        }
        const data = new Box3DShapeData(slot, type);
        shape._pluginData = data;
        this._shapes[slot] = data;
        return data;
    }

    private _withFloatBuffer<T>(values: ArrayLike<number>, fn: (ptr: number) => T): T {
        const ptr = this._b3._malloc(values.length * 4);
        new Float32Array(this._b3.HEAPF32.buffer, ptr, values.length).set(values);
        try {
            return fn(ptr);
        } finally {
            this._b3._free(ptr);
        }
    }

    private _withIntBuffer<T>(values: ArrayLike<number>, fn: (ptr: number) => T): T {
        const ptr = this._b3._malloc(values.length * 4);
        new Int32Array(this._b3.HEAP32.buffer, ptr, values.length).set(values);
        try {
            return fn(ptr);
        } finally {
            this._b3._free(ptr);
        }
    }

    private _createOptionsFromGroundMesh(options: PhysicsShapeParameters): void {
        const mesh = options.groundMesh;
        if (!mesh) {
            return;
        }
        const pos = mesh.getVerticesData(VertexBuffer.PositionKind) as FloatArray;
        const transform = mesh.computeWorldMatrix(true);
        const transformed: number[] = [];
        const p = TmpVectors.Vector3[0];
        for (let i = 0; i < pos.length; i += 3) {
            Vector3.FromArrayToRef(pos, i, p);
            Vector3.TransformCoordinatesToRef(p, transform, p);
            p.toArray(transformed, i);
        }
        const arraySize = ~~(Math.sqrt(transformed.length / 3) - 1);
        const boundingInfo = mesh.getBoundingInfo();
        const dim = Math.min(boundingInfo.boundingBox.extendSizeWorld.x, boundingInfo.boundingBox.extendSizeWorld.z);
        const minX = boundingInfo.boundingBox.minimumWorld.x;
        const minY = boundingInfo.boundingBox.minimumWorld.y;
        const minZ = boundingInfo.boundingBox.minimumWorld.z;
        const matrix = new Float32Array((arraySize + 1) * (arraySize + 1));
        const elementSize = (dim * 2) / arraySize;
        matrix.fill(minY);
        for (let i = 0; i < transformed.length; i += 3) {
            const x = Math.round((transformed[i + 0] - minX) / elementSize);
            const z = arraySize - Math.round((transformed[i + 2] - minZ) / elementSize);
            matrix[z * (arraySize + 1) + x] = transformed[i + 1] - minY;
        }
        options.numHeightFieldSamplesX = arraySize + 1;
        options.numHeightFieldSamplesZ = arraySize + 1;
        options.heightFieldSizeX = boundingInfo.boundingBox.extendSizeWorld.x * 2;
        options.heightFieldSizeZ = boundingInfo.boundingBox.extendSizeWorld.z * 2;
        options.heightFieldData = matrix;
    }

    public initShape(shape: PhysicsShape, type: PhysicsShapeType, options: PhysicsShapeParameters): void {
        const b3 = this._b3;
        const center = options.center ?? Vector3.ZeroReadOnly;
        const rotation = options.rotation ?? Quaternion.Identity();
        switch (type) {
            case PhysicsShapeType.SPHERE: {
                const radius = options.radius ?? 1;
                this._registerShape(shape, b3._bx_ShapeDesc_CreateSphere(center.x, center.y, center.z, radius), type);
                break;
            }
            case PhysicsShapeType.CAPSULE: {
                const a = options.pointA ?? Vector3.ZeroReadOnly;
                const b = options.pointB ?? Vector3.UpReadOnly;
                this._registerShape(shape, b3._bx_ShapeDesc_CreateCapsule(a.x, a.y, a.z, b.x, b.y, b.z, options.radius ?? 0), type);
                break;
            }
            case PhysicsShapeType.BOX: {
                const extents = options.extents ?? Vector3.OneReadOnly;
                this._registerShape(
                    shape,
                    b3._bx_ShapeDesc_CreateBox(extents.x * 0.5, extents.y * 0.5, extents.z * 0.5, center.x, center.y, center.z, rotation.x, rotation.y, rotation.z, rotation.w),
                    type
                );
                break;
            }
            case PhysicsShapeType.CYLINDER: {
                const a = options.pointA ?? Vector3.ZeroReadOnly;
                const b = options.pointB ?? Vector3.UpReadOnly;
                const axis = b.subtract(a);
                const height = axis.length();
                const mid = a.add(b).scaleInPlace(0.5);
                const q = this._tmpQuat[0];
                if (height > 1e-6) {
                    axis.scaleInPlace(1 / height);
                    Quaternion.FromUnitVectorsToRef(Vector3.UpReadOnly, axis, q);
                } else {
                    q.set(0, 0, 0, 1);
                }
                this._registerShape(shape, b3._bx_ShapeDesc_CreateCylinder(height, options.radius ?? 0, 16, mid.x, mid.y, mid.z, q.x, q.y, q.z, q.w), type);
                break;
            }
            case PhysicsShapeType.CONVEX_HULL:
            case PhysicsShapeType.MESH: {
                const mesh = options.mesh;
                if (!mesh) {
                    throw new Error("No mesh provided to create physics shape.");
                }
                const needIndices = type === PhysicsShapeType.MESH;
                const flipWinding = !mesh.getScene().useRightHandedSystem;
                const accum = new MeshGeometryAccumulator(needIndices, flipWinding);
                accum.addNodeMeshes(mesh, !!options.includeChildMeshes);
                if (type === PhysicsShapeType.CONVEX_HULL) {
                    const slot = this._withFloatBuffer(accum.vertices, (ptr) => b3._bx_ShapeDesc_CreateHull(ptr, accum.vertexCount));
                    this._registerShape(shape, slot, type);
                } else {
                    const slot = this._withFloatBuffer(accum.vertices, (vptr) =>
                        this._withIntBuffer(accum.indices, (iptr) => b3._bx_ShapeDesc_CreateMesh(vptr, accum.vertexCount, iptr, accum.triangleCount, 1, 1, 1, 0, 0))
                    );
                    this._registerShape(shape, slot, type);
                }
                break;
            }
            case PhysicsShapeType.HEIGHTFIELD: {
                if (options.groundMesh) {
                    this._createOptionsFromGroundMesh(options);
                }
                const nx = options.numHeightFieldSamplesX;
                const nz = options.numHeightFieldSamplesZ;
                if (!nx || !nz || !options.heightFieldSizeX || !options.heightFieldSizeZ || !options.heightFieldData) {
                    throw new Error("Missing required heightfield parameters");
                }
                const heights = new Float32Array(nx * nz);
                for (let x = 0; x < nx; x++) {
                    for (let z = 0; z < nz; z++) {
                        // box3d rows run along z (index z * countX + x); Babylon data rows are flipped along z
                        heights[z * nx + x] = options.heightFieldData[(nz - 1 - z) * nx + x];
                    }
                }
                const scaleX = options.heightFieldSizeX / (nx - 1);
                const scaleZ = options.heightFieldSizeZ / (nz - 1);
                const slot = this._withFloatBuffer(heights, (ptr) =>
                    b3._bx_ShapeDesc_CreateHeightField(ptr, nx, nz, scaleX, 1, scaleZ, 0, -options.heightFieldSizeX! * 0.5, 0, -options.heightFieldSizeZ! * 0.5)
                );
                this._registerShape(shape, slot, type);
                break;
            }
            case PhysicsShapeType.CONTAINER: {
                this._registerShape(shape, b3._bx_ShapeDesc_CreateContainer(), type);
                break;
            }
            default:
                throw new Error("Unsupported Shape Type.");
        }
    }

    // Re-instantiates the shape on every body that uses it (or uses a container holding it).
    private _refreshShapeUsers(data: Box3DShapeData, visited = new Set<Box3DShapeData>()): void {
        if (visited.has(data)) {
            return;
        }
        visited.add(data);
        for (const body of data.users) {
            this._b3._bx_Body_SetShape(body.slot, data.slot);
            this._b3._bx_Body_EnableContactEvents(body.slot, body.eventMask ? 1 : 0);
            this._internalUpdateMassProperties(body);
        }
        for (const parent of data.parents) {
            this._refreshShapeUsers(parent, visited);
        }
    }

    public setShapeFilterMembershipMask(shape: PhysicsShape, membershipMask: number): void {
        const data = shape._pluginData as Box3DShapeData;
        const collide = this._b3._bx_ShapeDesc_GetMaskBits(data.slot);
        this._b3._bx_ShapeDesc_SetFilter(data.slot, membershipMask >>> 0, collide >>> 0);
        this._refreshShapeUsers(data);
    }

    public getShapeFilterMembershipMask(shape: PhysicsShape): number {
        return this._b3._bx_ShapeDesc_GetCategoryBits((shape._pluginData as Box3DShapeData).slot);
    }

    public setShapeFilterCollideMask(shape: PhysicsShape, collideMask: number): void {
        const data = shape._pluginData as Box3DShapeData;
        const membership = this._b3._bx_ShapeDesc_GetCategoryBits(data.slot);
        this._b3._bx_ShapeDesc_SetFilter(data.slot, membership >>> 0, collideMask >>> 0);
        this._refreshShapeUsers(data);
    }

    public getShapeFilterCollideMask(shape: PhysicsShape): number {
        return this._b3._bx_ShapeDesc_GetMaskBits((shape._pluginData as Box3DShapeData).slot);
    }

    public setMaterial(shape: PhysicsShape, material: PhysicsMaterial): void {
        const data = shape._pluginData as Box3DShapeData;
        data.material = material;
        this._b3._bx_ShapeDesc_SetMaterial(data.slot, material.friction ?? 0.5, material.restitution ?? 0);
        this._refreshShapeUsers(data);
    }

    public getMaterial(shape: PhysicsShape): PhysicsMaterial {
        const data = shape._pluginData as Box3DShapeData;
        return {
            friction: this._b3._bx_ShapeDesc_GetFriction(data.slot),
            staticFriction: data.material.staticFriction,
            restitution: this._b3._bx_ShapeDesc_GetRestitution(data.slot),
            frictionCombine: data.material.frictionCombine,
            restitutionCombine: data.material.restitutionCombine,
        };
    }

    public setDensity(shape: PhysicsShape, density: number): void {
        const data = shape._pluginData as Box3DShapeData;
        this._b3._bx_ShapeDesc_SetDensity(data.slot, density);
        this._refreshShapeUsers(data);
    }

    public getDensity(shape: PhysicsShape): number {
        return this._b3._bx_ShapeDesc_GetDensity((shape._pluginData as Box3DShapeData).slot);
    }

    public addChild(shape: PhysicsShape, newChild: PhysicsShape, translation?: Vector3, rotation?: Quaternion, scale?: Vector3): void {
        const parent = shape._pluginData as Box3DShapeData;
        const child = newChild._pluginData as Box3DShapeData;
        const t = translation ?? Vector3.ZeroReadOnly;
        const r = rotation ?? Quaternion.Identity();
        const s = scale ?? Vector3.OneReadOnly;
        this._b3._bx_ShapeDesc_AddChild(parent.slot, child.slot, t.x, t.y, t.z, r.x, r.y, r.z, r.w, s.x, s.y, s.z);
        parent.children.push(child);
        child.parents.add(parent);
        this._refreshShapeUsers(parent);
    }

    public removeChild(shape: PhysicsShape, childIndex: number): void {
        const parent = shape._pluginData as Box3DShapeData;
        this._b3._bx_ShapeDesc_RemoveChild(parent.slot, childIndex);
        const [child] = parent.children.splice(childIndex, 1);
        if (child && !parent.children.includes(child)) {
            child.parents.delete(parent);
        }
        this._refreshShapeUsers(parent);
    }

    public getNumChildren(shape: PhysicsShape): number {
        return this._b3._bx_ShapeDesc_GetChildCount((shape._pluginData as Box3DShapeData).slot);
    }

    public getBoundingBox(shape: PhysicsShape): BoundingBox {
        this._b3._bx_ShapeDesc_GetAABB((shape._pluginData as Box3DShapeData).slot);
        const s = this._scratch();
        TmpVectors.Vector3[0].set(s[0], s[1], s[2]);
        TmpVectors.Vector3[1].set(s[3], s[4], s[5]);
        return new BoundingBox(TmpVectors.Vector3[0], TmpVectors.Vector3[1], Matrix.IdentityReadOnly);
    }

    public getBodyBoundingBox(body: PhysicsBody): BoundingBox {
        const data = this._getPluginReference(body);
        this._b3._bx_Body_GetAABB(data.slot);
        const s = this._scratch();
        TmpVectors.Vector3[0].set(s[0], s[1], s[2]);
        TmpVectors.Vector3[1].set(s[3], s[4], s[5]);
        return new BoundingBox(TmpVectors.Vector3[0], TmpVectors.Vector3[1], Matrix.IdentityReadOnly);
    }

    public disposeShape(shape: PhysicsShape): void {
        const data = shape._pluginData as Box3DShapeData;
        if (!data) {
            return;
        }
        for (const parent of data.parents) {
            const index = parent.children.indexOf(data);
            if (index >= 0) {
                parent.children.splice(index, 1);
                this._b3._bx_ShapeDesc_RemoveChild(parent.slot, index);
            }
        }
        for (const child of data.children) {
            child.parents.delete(data);
        }
        this._shapes[data.slot] = undefined;
        this._b3._bx_ShapeDesc_Destroy(data.slot);
        shape._pluginData = undefined;
    }

    public setTrigger(shape: PhysicsShape, isTrigger: boolean): void {
        const data = shape._pluginData as Box3DShapeData;
        this._b3._bx_ShapeDesc_SetSensor(data.slot, isTrigger ? 1 : 0);
        this._refreshShapeUsers(data);
    }

    // ----------------------------------------------------------------------------------------
    // constraints
    // ----------------------------------------------------------------------------------------

    private _frameToBuffer(buffer: Float32Array, offset: number, pivot: Vector3, xAxis: Vector3, yAxis: Vector3, zAxis: Vector3): void {
        const m = TmpVectors.Matrix[0];
        Matrix.FromValuesToRef(xAxis.x, xAxis.y, xAxis.z, 0, yAxis.x, yAxis.y, yAxis.z, 0, zAxis.x, zAxis.y, zAxis.z, 0, 0, 0, 0, 1, m);
        const q = this._tmpQuat[2];
        Quaternion.FromRotationMatrixToRef(m, q);
        q.normalize();
        buffer[offset] = pivot.x;
        buffer[offset + 1] = pivot.y;
        buffer[offset + 2] = pivot.z;
        buffer[offset + 3] = q.x;
        buffer[offset + 4] = q.y;
        buffer[offset + 5] = q.z;
        buffer[offset + 6] = q.w;
    }

    private _buildFrames(cdata: Box3DConstraintData, constraint: PhysicsConstraint, bodyA: Box3DBodyData, bodyB: Box3DBodyData): void {
        const options = constraint.options;
        const pivotA = options.pivotA ?? Vector3.ZeroReadOnly;
        const pivotB = options.pivotB ?? Vector3.ZeroReadOnly;
        const axisA = (options.axisA ?? Vector3.RightReadOnly).normalizeToNew();
        const axisB = (options.axisB ?? Vector3.RightReadOnly).normalizeToNew();
        const perpA = options.perpAxisA ? options.perpAxisA.normalizeToNew() : axisA.getNormalToRef(new Vector3());
        const perpB = options.perpAxisB ? options.perpAxisB.normalizeToNew() : axisB.getNormalToRef(new Vector3());
        // Gram-Schmidt in case the user's perp axis is not exactly perpendicular
        perpA.subtractInPlace(axisA.scale(Vector3.Dot(axisA, perpA))).normalize();
        perpB.subtractInPlace(axisB.scale(Vector3.Dot(axisB, perpB))).normalize();
        const thirdA = Vector3.Cross(axisA, perpA);
        const thirdB = Vector3.Cross(axisB, perpB);

        if (!constraint._initOptions) {
            constraint._initOptions = {
                axisA: axisA.clone(),
                axisB: axisB.clone(),
                perpAxisA: perpA.clone(),
                perpAxisB: perpB.clone(),
                pivotA: pivotA.clone(),
                pivotB: pivotB.clone(),
            };
        }

        const frames = cdata.frames;
        switch (cdata.type) {
            case PhysicsConstraintType.HINGE:
            case PhysicsConstraintType.BALL_AND_SOCKET:
                // box3d: revolute rotates about the frame z axis, spherical cone is centered on frame A z
                this._frameToBuffer(frames, 0, pivotA, perpA, Vector3.Cross(axisA, perpA), axisA);
                this._frameToBuffer(frames, 7, pivotB, perpB, Vector3.Cross(axisB, perpB), axisB);
                break;
            case PhysicsConstraintType.PRISMATIC:
            case PhysicsConstraintType.SLIDER:
                // box3d: prismatic slides along the frame A x axis
                this._frameToBuffer(frames, 0, pivotA, axisA, perpA, thirdA);
                this._frameToBuffer(frames, 7, pivotB, axisB, perpB, thirdB);
                break;
            case PhysicsConstraintType.LOCK: {
                // weld the bodies in their current relative pose
                this._b3._bx_Body_GetTransform(bodyA.slot);
                let s = this._scratch();
                const qA = this._tmpQuat[0];
                qA.set(s[3], s[4], s[5], s[6]);
                this._b3._bx_Body_GetTransform(bodyB.slot);
                s = this._scratch();
                const qB = this._tmpQuat[1];
                qB.set(s[3], s[4], s[5], s[6]);
                // frameB rotation = inv(qB) * qA so both frames coincide in world space now
                const rel = qB.invert().multiply(qA).normalize();
                frames.set([pivotA.x, pivotA.y, pivotA.z, 0, 0, 0, 1, pivotB.x, pivotB.y, pivotB.z, rel.x, rel.y, rel.z, rel.w]);
                break;
            }
            default:
                frames.set([pivotA.x, pivotA.y, pivotA.z, 0, 0, 0, 1, pivotB.x, pivotB.y, pivotB.z, 0, 0, 0, 1]);
                break;
        }
    }

    private _createJoint(cdata: Box3DConstraintData, bodyA: Box3DBodyData, bodyB: Box3DBodyData): number {
        this._scratch().set(cdata.frames);
        const joint = this._b3._bx_CreateJoint(this._worldSlot, cdata.jointType, bodyA.slot, bodyB.slot, cdata.collisions ? 1 : 0, cdata.length);
        if (!joint) {
            Logger.Warn("Box3DPlugin: joint creation failed.");
            return 0;
        }
        if (cdata.type === PhysicsConstraintType.SLIDER) {
            // A slider allows rotation about the axis in Havok. Box3D's prismatic locks it; nothing to do here.
        }
        this._applyAxisState(cdata, joint);
        return joint;
    }

    public initConstraint(constraint: PhysicsConstraint, body: PhysicsBody, childBody: PhysicsBody, instanceIndex?: number, childInstanceIndex?: number): void {
        const type = constraint.type;
        const options = constraint.options;
        if (!type || !options) {
            Logger.Warn("No constraint type or options. Constraint is invalid.");
            return;
        }
        if ((body._pluginDataInstances.length > 0 && instanceIndex === undefined) || (childBody._pluginDataInstances.length > 0 && childInstanceIndex === undefined)) {
            Logger.Warn("Body is instanced but no instance index was specified. Constraint will not be applied.");
            return;
        }
        const cdata: Box3DConstraintData = constraint._pluginData ?? new Box3DConstraintData();
        constraint._pluginData = cdata;
        cdata.type = type;
        cdata.collisions = !!options.collision;
        switch (type) {
            case PhysicsConstraintType.BALL_AND_SOCKET:
                cdata.jointType = Box3DJointType.SPHERICAL;
                break;
            case PhysicsConstraintType.HINGE:
                cdata.jointType = Box3DJointType.REVOLUTE;
                break;
            case PhysicsConstraintType.PRISMATIC:
            case PhysicsConstraintType.SLIDER:
                cdata.jointType = Box3DJointType.PRISMATIC;
                break;
            case PhysicsConstraintType.LOCK:
                cdata.jointType = Box3DJointType.WELD;
                break;
            case PhysicsConstraintType.DISTANCE:
                cdata.jointType = Box3DJointType.DISTANCE;
                break;
            case PhysicsConstraintType.SIX_DOF:
                this._warnOnce("sixdof", "SIX_DOF constraints are not supported yet, using a spherical joint.");
                cdata.jointType = Box3DJointType.SPHERICAL;
                break;
            default:
                Logger.Warn("Box3DPlugin: unknown constraint type " + type);
                return;
        }

        const bodyA = this._getPluginReference(body, instanceIndex);
        const bodyB = this._getPluginReference(childBody, childInstanceIndex);
        this._buildFrames(cdata, constraint, bodyA, bodyB);
        if (type === PhysicsConstraintType.DISTANCE) {
            cdata.length = options.maxDistance ?? 0;
            if (cdata.length <= 0) {
                // use the current distance between the world space pivots
                cdata.length = Math.max(0.01, this._currentPivotDistance(cdata, bodyA, bodyB));
            }
        }
        const joint = this._createJoint(cdata, bodyA, bodyB);
        if (joint) {
            cdata.joints.push(joint);
            cdata.pairs.push({ parent: body, parentIndex: instanceIndex ?? 0, child: childBody, childIndex: childInstanceIndex ?? 0, parentData: bodyA, childData: bodyB });
        }
    }

    private _currentPivotDistance(cdata: Box3DConstraintData, bodyA: Box3DBodyData, bodyB: Box3DBodyData): number {
        const f = cdata.frames;
        const worldA = this._tmpVec3[0];
        const worldB = this._tmpVec3[1];
        this._b3._bx_Body_GetTransform(bodyA.slot);
        let s = this._scratch();
        this._tmpQuat[0].set(s[3], s[4], s[5], s[6]);
        worldA.set(f[0], f[1], f[2]).applyRotationQuaternionInPlace(this._tmpQuat[0]).addInPlaceFromFloats(s[0], s[1], s[2]);
        this._b3._bx_Body_GetTransform(bodyB.slot);
        s = this._scratch();
        this._tmpQuat[0].set(s[3], s[4], s[5], s[6]);
        worldB.set(f[7], f[8], f[9]).applyRotationQuaternionInPlace(this._tmpQuat[0]).addInPlaceFromFloats(s[0], s[1], s[2]);
        return Vector3.Distance(worldA, worldB);
    }

    public setEnabled(constraint: PhysicsConstraint, isEnabled: boolean): void {
        const cdata = constraint._pluginData as Box3DConstraintData;
        if (!cdata || cdata.enabled === isEnabled) {
            return;
        }
        cdata.enabled = isEnabled;
        // Box3D has no enable flag on joints: destroy them, or re-create them from the saved definition.
        for (const joint of cdata.joints) {
            this._b3._bx_DestroyJoint(joint);
        }
        cdata.joints.length = 0;
        if (isEnabled) {
            for (const pair of cdata.pairs) {
                const joint = this._createJoint(cdata, pair.parentData, pair.childData);
                if (joint) {
                    cdata.joints.push(joint);
                }
            }
        }
    }

    public getEnabled(constraint: PhysicsConstraint): boolean {
        return (constraint._pluginData as Box3DConstraintData)?.enabled ?? false;
    }

    public setCollisionsEnabled(constraint: PhysicsConstraint, isEnabled: boolean): void {
        const cdata = constraint._pluginData as Box3DConstraintData;
        cdata.collisions = isEnabled;
        for (const joint of cdata.joints) {
            this._b3._bx_Joint_SetCollideConnected(joint, isEnabled ? 1 : 0);
        }
    }

    public getCollisionsEnabled(constraint: PhysicsConstraint): boolean {
        return (constraint._pluginData as Box3DConstraintData)?.collisions ?? false;
    }

    // The one axis box3d exposes for this constraint type.
    private _primaryAxis(cdata: Box3DConstraintData): Nullable<PhysicsConstraintAxis> {
        switch (cdata.type) {
            case PhysicsConstraintType.HINGE:
                return PhysicsConstraintAxis.ANGULAR_X;
            case PhysicsConstraintType.PRISMATIC:
            case PhysicsConstraintType.SLIDER:
                return PhysicsConstraintAxis.LINEAR_X;
            case PhysicsConstraintType.DISTANCE:
                return PhysicsConstraintAxis.LINEAR_DISTANCE;
            case PhysicsConstraintType.BALL_AND_SOCKET:
            case PhysicsConstraintType.SIX_DOF:
                return PhysicsConstraintAxis.ANGULAR_Y;
            default:
                return null;
        }
    }

    private _isPrimaryAxis(cdata: Box3DConstraintData, axis: PhysicsConstraintAxis): boolean {
        if (cdata.type === PhysicsConstraintType.BALL_AND_SOCKET || cdata.type === PhysicsConstraintType.SIX_DOF) {
            return axis === PhysicsConstraintAxis.ANGULAR_X || axis === PhysicsConstraintAxis.ANGULAR_Y || axis === PhysicsConstraintAxis.ANGULAR_Z;
        }
        return axis === this._primaryAxis(cdata);
    }

    private _axisState(cdata: Box3DConstraintData, axis: PhysicsConstraintAxis): IAxisState {
        let state = cdata.axes.get(axis);
        if (!state) {
            state = { mode: PhysicsConstraintAxisLimitMode.FREE, min: 0, max: 0, motor: PhysicsConstraintMotorType.NONE, target: 0, maxForce: 0, friction: 0 };
            cdata.axes.set(axis, state);
        }
        return state;
    }

    private _applyAxisState(cdata: Box3DConstraintData, joint: number): void {
        const b3 = this._b3;
        const primary = this._primaryAxis(cdata);
        if (primary === null) {
            return;
        }
        for (const [axis, state] of cdata.axes) {
            if (!this._isPrimaryAxis(cdata, axis)) {
                continue;
            }
            if (cdata.type === PhysicsConstraintType.BALL_AND_SOCKET || cdata.type === PhysicsConstraintType.SIX_DOF) {
                if (axis === PhysicsConstraintAxis.ANGULAR_X) {
                    // twist about the primary axis (frame z in box3d)
                    b3._bx_Joint_SetTwistLimits(joint, state.mode === PhysicsConstraintAxisLimitMode.FREE ? 0 : 1, state.min, state.max);
                    continue;
                }
            }
            const limited = state.mode !== PhysicsConstraintAxisLimitMode.FREE;
            if (limited) {
                const min = state.mode === PhysicsConstraintAxisLimitMode.LOCKED ? 0 : state.min;
                const max = state.mode === PhysicsConstraintAxisLimitMode.LOCKED ? 0 : state.max;
                b3._bx_Joint_SetLimits(joint, min, max);
            }
            b3._bx_Joint_EnableLimit(joint, limited ? 1 : 0);
            switch (state.motor) {
                case PhysicsConstraintMotorType.VELOCITY:
                    b3._bx_Joint_EnableSpring(joint, 0);
                    b3._bx_Joint_EnableMotor(joint, 1);
                    b3._bx_Joint_SetMotorSpeed(joint, state.target);
                    b3._bx_Joint_SetMaxMotorForce(joint, state.maxForce);
                    break;
                case PhysicsConstraintMotorType.POSITION:
                    b3._bx_Joint_EnableMotor(joint, 0);
                    b3._bx_Joint_EnableSpring(joint, 1);
                    b3._bx_Joint_SetSpring(joint, 5, 1);
                    b3._bx_Joint_SetTarget(joint, state.target);
                    break;
                default:
                    b3._bx_Joint_EnableMotor(joint, 0);
                    b3._bx_Joint_EnableSpring(joint, 0);
                    break;
            }
        }
        for (const joint2 of [joint]) {
            b3._bx_Joint_WakeBodies(joint2);
        }
    }

    private _setAxis(constraint: PhysicsConstraint, axis: PhysicsConstraintAxis, apply: (state: IAxisState) => void): void {
        const cdata = constraint._pluginData as Box3DConstraintData;
        if (!cdata) {
            return;
        }
        apply(this._axisState(cdata, axis));
        if (!this._isPrimaryAxis(cdata, axis)) {
            this._warnOnce(`axis-${cdata.type}-${axis}`, `axis ${axis} is not configurable on constraint type ${cdata.type} with Box3D; the value is stored but has no effect.`);
            return;
        }
        for (const joint of cdata.joints) {
            this._applyAxisState(cdata, joint);
        }
    }

    public setAxisFriction(constraint: PhysicsConstraint, axis: PhysicsConstraintAxis, friction: number): void {
        const cdata = constraint._pluginData as Box3DConstraintData;
        if (cdata) {
            this._axisState(cdata, axis).friction = friction;
        }
    }

    public getAxisFriction(constraint: PhysicsConstraint, axis: PhysicsConstraintAxis): Nullable<number> {
        return (constraint._pluginData as Box3DConstraintData)?.axes.get(axis)?.friction ?? null;
    }

    public setAxisMode(constraint: PhysicsConstraint, axis: PhysicsConstraintAxis, limitMode: PhysicsConstraintAxisLimitMode): void {
        this._setAxis(constraint, axis, (state) => (state.mode = limitMode));
    }

    public getAxisMode(constraint: PhysicsConstraint, axis: PhysicsConstraintAxis): Nullable<PhysicsConstraintAxisLimitMode> {
        return (constraint._pluginData as Box3DConstraintData)?.axes.get(axis)?.mode ?? null;
    }

    public setAxisMinLimit(constraint: PhysicsConstraint, axis: PhysicsConstraintAxis, minLimit: number): void {
        this._setAxis(constraint, axis, (state) => {
            state.min = minLimit;
            if (state.mode === PhysicsConstraintAxisLimitMode.FREE) {
                state.mode = PhysicsConstraintAxisLimitMode.LIMITED;
            }
        });
    }

    public getAxisMinLimit(constraint: PhysicsConstraint, axis: PhysicsConstraintAxis): Nullable<number> {
        return (constraint._pluginData as Box3DConstraintData)?.axes.get(axis)?.min ?? null;
    }

    public setAxisMaxLimit(constraint: PhysicsConstraint, axis: PhysicsConstraintAxis, limit: number): void {
        this._setAxis(constraint, axis, (state) => {
            state.max = limit;
            if (state.mode === PhysicsConstraintAxisLimitMode.FREE) {
                state.mode = PhysicsConstraintAxisLimitMode.LIMITED;
            }
        });
    }

    public getAxisMaxLimit(constraint: PhysicsConstraint, axis: PhysicsConstraintAxis): Nullable<number> {
        return (constraint._pluginData as Box3DConstraintData)?.axes.get(axis)?.max ?? null;
    }

    public setAxisMotorType(constraint: PhysicsConstraint, axis: PhysicsConstraintAxis, motorType: PhysicsConstraintMotorType): void {
        this._setAxis(constraint, axis, (state) => (state.motor = motorType));
    }

    public getAxisMotorType(constraint: PhysicsConstraint, axis: PhysicsConstraintAxis): Nullable<PhysicsConstraintMotorType> {
        return (constraint._pluginData as Box3DConstraintData)?.axes.get(axis)?.motor ?? null;
    }

    public setAxisMotorTarget(constraint: PhysicsConstraint, axis: PhysicsConstraintAxis, target: number): void {
        this._setAxis(constraint, axis, (state) => (state.target = target));
    }

    public getAxisMotorTarget(constraint: PhysicsConstraint, axis: PhysicsConstraintAxis): Nullable<number> {
        return (constraint._pluginData as Box3DConstraintData)?.axes.get(axis)?.target ?? null;
    }

    public setAxisMotorMaxForce(constraint: PhysicsConstraint, axis: PhysicsConstraintAxis, maxForce: number): void {
        this._setAxis(constraint, axis, (state) => (state.maxForce = maxForce));
    }

    public getAxisMotorMaxForce(constraint: PhysicsConstraint, axis: PhysicsConstraintAxis): Nullable<number> {
        return (constraint._pluginData as Box3DConstraintData)?.axes.get(axis)?.maxForce ?? null;
    }

    public disposeConstraint(constraint: PhysicsConstraint): void {
        const cdata = constraint._pluginData as Box3DConstraintData;
        if (!cdata) {
            return;
        }
        for (const joint of cdata.joints) {
            this._b3._bx_DestroyJoint(joint);
        }
        cdata.joints.length = 0;
        cdata.pairs.length = 0;
    }

    public getBodiesUsingConstraint(constraint: PhysicsConstraint): ConstrainedBodyPair[] {
        const cdata = constraint._pluginData as Box3DConstraintData;
        if (!cdata) {
            return [];
        }
        return cdata.pairs.map((p) => ({ parentBody: p.parent, parentBodyIndex: p.parentIndex, childBody: p.child, childBodyIndex: p.childIndex }));
    }

    public addConstraint(body: PhysicsBody, childBody: PhysicsBody, constraint: PhysicsConstraint, instanceIndex?: number, childInstanceIndex?: number): void {
        this.initConstraint(constraint, body, childBody, instanceIndex, childInstanceIndex);
    }

    // ----------------------------------------------------------------------------------------
    // Box3D specific extras
    // ----------------------------------------------------------------------------------------

    /**
     * Applies a radial impulse to every shape within the radius, like a grenade.
     * @param position world position of the explosion
     * @param radius radius of the explosion
     * @param impulsePerArea impulse per surface area of the affected shapes
     * @param falloff distance beyond the radius over which the impulse fades to zero
     */
    public explode(position: Vector3, radius: number, impulsePerArea: number, falloff = 0): void {
        this._b3._bx_World_Explode(this._worldSlot, position.x, position.y, position.z, radius, falloff, impulsePerArea);
    }

    /**
     * Box2D style collision group. Shapes sharing a negative group never collide with each other,
     * shapes sharing a positive group always collide. Zero means no group.
     * @param shape the shape
     * @param groupIndex the group index
     */
    public setShapeFilterGroup(shape: PhysicsShape, groupIndex: number): void {
        const data = shape._pluginData as Box3DShapeData;
        this._b3._bx_ShapeDesc_SetGroup(data.slot, groupIndex | 0);
        this._refreshShapeUsers(data);
    }

    /**
     * Rolling resistance for spheres and capsules (Babylon materials have no equivalent).
     * @param shape the shape
     * @param value resistance, typically in [0, 1]
     */
    public setShapeRollingResistance(shape: PhysicsShape, value: number): void {
        const data = shape._pluginData as Box3DShapeData;
        this._b3._bx_ShapeDesc_SetRollingResistance(data.slot, value);
        this._refreshShapeUsers(data);
    }

    /**
     * Lets a body spin faster than the default angular speed cap (wheels).
     * @param body the body
     * @param allow true to allow fast rotation
     * @param instanceIndex optional thin instance index
     */
    public setAllowFastRotation(body: PhysicsBody, allow: boolean, instanceIndex?: number): void {
        this._applyToBodyOrInstances(body, (data) => this._b3._bx_Body_AllowFastRotation(data.slot, allow ? 1 : 0), instanceIndex);
    }

    /**
     * Creates a Box3D wheel joint between a chassis and a wheel body.
     * @param chassis the chassis body
     * @param wheel the wheel body
     * @param options wheel joint options
     * @returns a handle used to drive and steer the wheel
     */
    public createWheelJoint(chassis: PhysicsBody, wheel: PhysicsBody, options: IBox3DWheelJointOptions): Box3DWheelJoint {
        const s = this._scratch();
        const axisA = (options.axisA ?? Vector3.UpReadOnly).normalizeToNew();
        const axleA = (options.axleA ?? Vector3.Forward()).normalizeToNew();
        // suspension travels along frame A x, the wheel spins about frame z
        axleA.subtractInPlace(axisA.scale(Vector3.Dot(axisA, axleA))).normalize();
        this._frameToBuffer(s, 0, options.pivotA, axisA, Vector3.Cross(axleA, axisA), axleA);
        // frame B must coincide with frame A in world space at creation, compute it from the current poses
        const pivotB = options.pivotB ?? Vector3.ZeroReadOnly;
        s[7] = pivotB.x;
        s[8] = pivotB.y;
        s[9] = pivotB.z;
        const chassisData = this._getPluginReference(chassis);
        const wheelData = this._getPluginReference(wheel);
        this._b3._bx_ComputeAlignedFrameB(chassisData.slot, wheelData.slot);
        const susp = options.suspensionLimits ?? [-0.2, 0.2];
        const steer = options.steeringLimits ?? [-Math.PI / 4, Math.PI / 4];
        s.set(
            [
                1,
                options.suspensionHertz ?? 4,
                options.suspensionDampingRatio ?? 0.7,
                1,
                susp[0],
                susp[1],
                options.enableSpinMotor ? 1 : 0,
                options.maxSpinTorque ?? 5,
                0,
                options.enableSteering ? 1 : 0,
                options.steeringHertz ?? 10,
                options.steeringDampingRatio ?? 0.7,
                0,
                options.maxSteeringTorque ?? 5,
                1,
                steer[0],
                steer[1],
            ],
            14
        );
        const slot = this._b3._bx_CreateJoint(this._worldSlot, Box3DJointType.WHEEL, chassisData.slot, wheelData.slot, 0, 0);
        if (!slot) {
            throw new Error("Box3DPlugin: wheel joint creation failed");
        }
        return new Box3DWheelJoint(this, slot);
    }

    /**
     * Creates a Box3D parallel joint: a spring that keeps a local axis of bodyB parallel to an axis
     * of bodyA, for example to keep a vehicle upright without locking its motion.
     * @param bodyA first body (often a static body)
     * @param bodyB body to align
     * @param axisA axis in bodyA local space
     * @param axisB axis in bodyB local space
     * @param hertz spring stiffness
     * @param dampingRatio spring damping
     * @param maxTorque maximum spring torque
     * @returns a joint slot that can be passed to disposeExtraJoint
     */
    public createParallelJoint(bodyA: PhysicsBody, bodyB: PhysicsBody, axisA: Vector3, axisB: Vector3, hertz = 1, dampingRatio = 1, maxTorque = 3.4e38): number {
        const s = this._scratch();
        const a = axisA.normalizeToNew();
        const pa = a.getNormalToRef(new Vector3());
        this._frameToBuffer(s, 0, Vector3.ZeroReadOnly, pa, Vector3.Cross(a, pa), a);
        const b = axisB.normalizeToNew();
        const pb = b.getNormalToRef(new Vector3());
        this._frameToBuffer(s, 7, Vector3.ZeroReadOnly, pb, Vector3.Cross(b, pb), b);
        s.set([hertz, dampingRatio, maxTorque], 14);
        return this._b3._bx_CreateJoint(this._worldSlot, Box3DJointType.PARALLEL, this._getPluginReference(bodyA).slot, this._getPluginReference(bodyB).slot, 1, 0);
    }

    /**
     * Destroys a joint created by createParallelJoint.
     * @param slot the joint slot
     */
    public disposeExtraJoint(slot: number): void {
        this._destroyExtraJoint(slot);
    }

    /**
     * @internal
     */
    public _destroyExtraJoint(slot: number): void {
        if (slot) {
            this._b3._bx_DestroyJoint(slot);
        }
    }

    /**
     * @internal
     */
    public _wheelCall(fn: string, slot: number, ...args: number[]): void {
        if (slot) {
            this._b3[fn](slot, ...args);
        }
    }

    // ----------------------------------------------------------------------------------------
    // queries
    // ----------------------------------------------------------------------------------------

    public raycast(from: Vector3, to: Vector3, result: PhysicsRaycastResult | Array<PhysicsRaycastResult>, query?: IRaycastQuery): void {
        const results = Array.isArray(result) ? result : [result];
        for (const r of results) {
            r.reset(from, to);
        }
        const membership = (query?.membership ?? ~0) >>> 0;
        const collideWith = (query?.collideWith ?? ~0) >>> 0;
        const ignore = query?.ignoreBody ? ((query.ignoreBody._pluginData as Box3DBodyData)?.slot ?? 0) : 0;
        const closestOnly = results.length === 1;
        const count = this._b3._bx_World_CastRay(
            this._worldSlot,
            from.x,
            from.y,
            from.z,
            to.x - from.x,
            to.y - from.y,
            to.z - from.z,
            membership,
            collideWith,
            ignore,
            query?.shouldHitTriggers ? 1 : 0,
            closestOnly ? 1 : 0
        );
        if (count <= 0) {
            return;
        }
        const buffer = new Float32Array(this._b3.HEAPF32.buffer, this._b3._bx_RayHitsPtr(), count * RAY_STRIDE);
        const hits: number[] = [];
        for (let i = 0; i < count; i++) {
            hits.push(i);
        }
        hits.sort((a, b) => buffer[a * RAY_STRIDE + 6] - buffer[b * RAY_STRIDE + 6]);
        if (!results.length) {
            for (let i = 0; i < count; i++) {
                const r = new PhysicsRaycastResult();
                r.reset(from, to);
                results.push(r);
            }
        }
        const n = Math.min(count, results.length);
        for (let i = 0; i < n; i++) {
            const o = hits[i] * RAY_STRIDE;
            const r = results[i];
            const bodyRef = this._bodies[buffer[o + 7]];
            r.body = bodyRef?.body;
            r.bodyIndex = bodyRef?.index;
            r.shape = bodyRef?.body.shape ?? undefined;
            r.setHitData({ x: buffer[o + 3], y: buffer[o + 4], z: buffer[o + 5] }, { x: buffer[o], y: buffer[o + 1], z: buffer[o + 2] }, buffer[o + 9]);
            r.calculateHitDistance();
        }
    }

    // ----------------------------------------------------------------------------------------
    // events
    // ----------------------------------------------------------------------------------------

    private _notifyCollisions(): void {
        const count = this._b3._bx_World_GetContactEvents(this._worldSlot);
        if (!count) {
            return;
        }
        const buffer = new Float32Array(this._b3.HEAPF32.buffer, this._b3._bx_ContactEventsPtr(), count * CONTACT_STRIDE);
        for (let i = 0; i < count; i++) {
            const o = i * CONTACT_STRIDE;
            const kind = buffer[o];
            const refA = this._bodies[buffer[o + 3]];
            const refB = this._bodies[buffer[o + 4]];
            if (!refA || !refB) {
                continue;
            }
            const aWants = refA.data.eventMask !== 0;
            const bWants = refB.data.eventMask !== 0;
            if (!aWants && !bWants) {
                continue;
            }
            if (kind === 1) {
                if (!refA.data.collisionEnded && !refB.data.collisionEnded && !this.onCollisionEndedObservable.hasObservers()) {
                    continue;
                }
                const ended: IBasePhysicsCollisionEvent = {
                    collider: refA.body,
                    colliderIndex: refA.index,
                    collidedAgainst: refB.body,
                    collidedAgainstIndex: refB.index,
                    type: PhysicsEventType.COLLISION_FINISHED,
                };
                this.onCollisionEndedObservable.notifyObservers(ended);
                this._bodyCollisionEndedObservable.get(refA.data.slot)?.notifyObservers(ended);
                const endedB = this._bodyCollisionEndedObservable.get(refB.data.slot);
                if (endedB) {
                    endedB.notifyObservers({ ...ended, collider: refB.body, colliderIndex: refB.index, collidedAgainst: refA.body, collidedAgainstIndex: refA.index });
                }
                continue;
            }
            const hasPoint = kind === 2;
            const type = kind === 0 ? PhysicsEventType.COLLISION_STARTED : PhysicsEventType.COLLISION_CONTINUED;
            const point = hasPoint ? new Vector3(buffer[o + 5], buffer[o + 6], buffer[o + 7]) : null;
            const normal = hasPoint ? new Vector3(buffer[o + 8], buffer[o + 9], buffer[o + 10]) : null;
            const info: IPhysicsCollisionEvent = {
                collider: refA.body,
                colliderIndex: refA.index,
                collidedAgainst: refB.body,
                collidedAgainstIndex: refB.index,
                type,
                point,
                normal,
                distance: 0,
                impulse: hasPoint ? buffer[o + 11] : 0,
            };
            this.onCollisionObservable.notifyObservers(info);
            if (this._bodyCollisionObservable.size) {
                this._bodyCollisionObservable.get(refA.data.slot)?.notifyObservers(info);
                const obsB = this._bodyCollisionObservable.get(refB.data.slot);
                if (obsB) {
                    obsB.notifyObservers({
                        ...info,
                        collider: refB.body,
                        colliderIndex: refB.index,
                        collidedAgainst: refA.body,
                        collidedAgainstIndex: refA.index,
                        normal: normal ? normal.negate() : null,
                    });
                }
            }
        }
    }

    private _notifyTriggers(): void {
        const count = this._b3._bx_World_GetSensorEvents(this._worldSlot);
        if (!count || !this.onTriggerCollisionObservable.hasObservers()) {
            return;
        }
        const buffer = new Float32Array(this._b3.HEAPF32.buffer, this._b3._bx_SensorEventsPtr(), count * SENSOR_STRIDE);
        for (let i = 0; i < count; i++) {
            const o = i * SENSOR_STRIDE;
            const refA = this._bodies[buffer[o + 3]];
            const refB = this._bodies[buffer[o + 4]];
            if (!refA || !refB) {
                continue;
            }
            this.onTriggerCollisionObservable.notifyObservers({
                collider: refA.body,
                colliderIndex: refA.index,
                collidedAgainst: refB.body,
                collidedAgainstIndex: refB.index,
                type: buffer[o] === 0 ? PhysicsEventType.TRIGGER_ENTERED : PhysicsEventType.TRIGGER_EXITED,
            });
        }
    }

    public dispose(): void {
        this.onCollisionObservable.clear();
        this.onCollisionEndedObservable.clear();
        this.onTriggerCollisionObservable.clear();
        this._bodyCollisionObservable.clear();
        this._bodyCollisionEndedObservable.clear();
        for (const shape of this._shapes) {
            if (shape) {
                this._b3._bx_ShapeDesc_Destroy(shape.slot);
            }
        }
        this._shapes.length = 0;
        this._bodies.length = 0;
        if (this._worldSlot) {
            this._b3._bx_DestroyWorld(this._worldSlot);
            this._worldSlot = 0;
        }
    }
}
