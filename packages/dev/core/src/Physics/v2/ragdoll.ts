import type { Skeleton } from "../../Bones/skeleton";
import { Vector3, Matrix, TmpVectors } from "../../Maths/math.vector";
import { Quaternion } from "../../Maths/math.vector";
import type { Scene } from "../../scene";
import { PhysicsAggregate } from "./physicsAggregate";
import { BallAndSocketConstraint } from "./physicsConstraint";
import type { Mesh } from "../../Meshes/mesh";
import { Axis, Space } from "core/Maths/math.axis";
import { PhysicsShapeType, PhysicsConstraintType } from "./IPhysicsEnginePlugin";
import type { Nullable } from "../../types";
import type { Bone } from "../../Bones/bone";
import { Logger } from "../../Misc/logger";
import { TransformNode } from "../../Meshes/transformNode";

/**
 * Ragdoll bone properties
 * @experimental
 */
export class RagdollBoneProperties {
    /**
     * Width of the box shape
     */
    width?: number;
    /**
     * depth of the box shape
     */
    depth?: number;
    /**
     * height of the box shape
     */
    height?: number;
    /**
     * size that will be used of width, depth and height of the shape box
     */
    size?: number;
    /**
     * Type of Physics Constraint used between bones
     */
    joint?: number | undefined;
    /**
     * Main rotation axis used by the constraint, in local space
     */
    rotationAxis?: Vector3;
    /**
     * Minimum rotation angle value
     */
    min?: number;
    /**
     * Maximum rotation angle value
     */
    max?: number;
    /**
     * Offset along local axis
     */
    boxOffset?: number;
    /**
     * Axis that need an offset
     */
    boneOffsetAxis?: Vector3;
}

/**
 * Ragdoll for Physics V2
 * @experimental
 */
export class Ragdoll {
    private _skeleton: Skeleton;
    private _scene: Scene;
    private _mesh: Mesh;
    private _config: any;
    private _boxConfigs: Array<RagdollBoneProperties> = new Array<RagdollBoneProperties>();

    private _bones: Array<Bone> = new Array<Bone>();
    private _initialRotation: Array<Quaternion> = new Array<Quaternion>();
    private _boneNames: string[] = [];
    private _transforms: Array<TransformNode> = new Array<TransformNode>();
    private _aggregates: Array<PhysicsAggregate> = new Array<PhysicsAggregate>();
    private _ragdollMode: boolean = false;
    private _rootBoneName: string = "";
    private _rootBoneIndex: number = -1;
    private _mass: number = 10;
    private _restitution: number = 0;

    /**
     * Pause synchronization between physics and bone position/orientation
     */
    public pauseSync: boolean = false;

    private _putBoxesInBoneCenter: boolean;
    private _defaultJoint: number = PhysicsConstraintType.HINGE;
    private _defaultJointMin: number = -90;
    private _defaultJointMax: number = 90;

    private _boneOffsetAxis: Vector3;

    /**
     * Construct a new Ragdoll object. Once ready, it can be made dynamic by calling `Ragdoll` method
     * @param skeleton The skeleton containing bones to be physicalized
     * @param mesh The mesh used by the skeleton
     * @param config an array of `RagdollBoneProperties` corresponding to bones and their properties used to instanciate physics bodies
     */
    constructor(skeleton: Skeleton, mesh: Mesh, config: RagdollBoneProperties[]) {
        this._skeleton = skeleton;
        this._scene = skeleton.getScene();
        this._mesh = mesh;
        this._config = config; // initial, user defined box configs. May have several box configs jammed into 1 index.
        this._boxConfigs = []; // final box configs. Every element is a separate box config (this.config may have several configs jammed into 1 index).
        this._putBoxesInBoneCenter = false;
        this._defaultJoint = PhysicsConstraintType.HINGE;
        this._boneOffsetAxis = Axis.Y;
    }

    private _createColliders(): void {
        this._mesh.computeWorldMatrix();

        const config = this._config;
        for (let i = 0; i < config.length; i++) {
            const boneNames = config[i].bone !== undefined ? [config[i].bone] : config[i].bones;

            for (let ii = 0; ii < boneNames.length; ii++) {
                const currentBone = this._skeleton.bones[this._skeleton.getBoneIndexByName(boneNames[ii])];
                if (currentBone == undefined) {
                    return;
                }

                // First define the box dimensions, so we can then use them when calling CreateBox().
                const currentRagdollBoneProperties: RagdollBoneProperties = {
                    width: this._config[i].width,
                    depth: this._config[i].depth,
                    height: this._config[i].height,
                    size: this._config[i].size,
                };

                currentRagdollBoneProperties.width = currentRagdollBoneProperties.width ?? currentRagdollBoneProperties.size;
                currentRagdollBoneProperties.depth = currentRagdollBoneProperties.depth ?? currentRagdollBoneProperties.size;
                currentRagdollBoneProperties.height = currentRagdollBoneProperties.height ?? currentRagdollBoneProperties.size;
                const transform = new TransformNode(boneNames[ii] + "_transform", this._scene);

                // Define the rest of the box properties.
                currentRagdollBoneProperties.joint = config[i].joint !== undefined ? config[i].joint : this._defaultJoint;
                currentRagdollBoneProperties.rotationAxis = config[i].rotationAxis !== undefined ? config[i].rotationAxis : Axis.X;
                currentRagdollBoneProperties.min = config[i].min !== undefined ? config[i].min : this._defaultJointMin;
                currentRagdollBoneProperties.max = config[i].max !== undefined ? config[i].max : this._defaultJointMax;

                // Offset value.
                let boxOffset = 0;
                if ((config[i].putBoxInBoneCenter !== undefined && config[i].putBoxInBoneCenter) || this._putBoxesInBoneCenter) {
                    if (currentBone.length === undefined) {
                        Logger.Log("The length property is not defined for bone " + currentBone.name);
                    }
                    boxOffset = currentBone.length / 2;
                } else if (config[i].boxOffset !== undefined) {
                    boxOffset = config[i].boxOffset;
                }
                currentRagdollBoneProperties.boxOffset = boxOffset;

                // Offset axis.
                const boneOffsetAxis = config[i].boneOffsetAxis !== undefined ? config[i].boneOffsetAxis : this._boneOffsetAxis;
                const boneDir = currentBone.getDirection(boneOffsetAxis, this._mesh);
                currentRagdollBoneProperties.boneOffsetAxis = boneOffsetAxis;

                transform.position = currentBone.getAbsolutePosition(this._mesh).add(boneDir.scale(boxOffset));

                const mass = config[i].mass !== undefined ? config[i].mass : this._mass;
                const restitution = config[i].restitution !== undefined ? config[i].restitution : this._restitution;
                const aggregate = new PhysicsAggregate(
                    transform,
                    PhysicsShapeType.BOX,
                    {
                        mass: mass,
                        restitution: restitution,
                        friction: 0.6,
                        extents: new Vector3(currentRagdollBoneProperties.width, currentRagdollBoneProperties.height, currentRagdollBoneProperties.depth),
                    },
                    this._scene
                );
                aggregate.body.setCollisionCallbackEnabled(true);
                aggregate.body.disablePreStep = false;
                this._aggregates.push(aggregate);
                this._bones.push(currentBone);
                this._boneNames.push(currentBone.name);
                this._transforms.push(transform);
                this._boxConfigs.push(currentRagdollBoneProperties);
                this._initialRotation.push(currentBone.getRotationQuaternion(Space.WORLD));
            }
        }
    }

    private _initJoints(): void {
        this._mesh.computeWorldMatrix();
        for (let i = 0; i < this._bones.length; i++) {
            // The root bone has no joints.
            if (i == this._rootBoneIndex) continue;

            const nearestParent = this._findNearestParent(i);

            if (nearestParent == null) {
                Logger.Warn("Couldn't find a nearest parent bone in the configs for bone called " + this._boneNames[i]);
                return;
            }

            const boneParentIndex = this._boneNames.indexOf(nearestParent.name);

            let distanceFromParentBoxToBone = this._bones[i].getAbsolutePosition(this._mesh).subtract(this._transforms[boneParentIndex].position);

            const wmat = this._transforms[boneParentIndex].computeWorldMatrix();
            const invertedWorldMat = Matrix.Invert(wmat);
            distanceFromParentBoxToBone = Vector3.TransformCoordinates(this._bones[i].getAbsolutePosition(this._mesh), invertedWorldMat);

            const boneAbsPos = this._bones[i].getAbsolutePosition(this._mesh);
            const boxAbsPos = this._transforms[i].position.clone();
            const myConnectedPivot = boneAbsPos.subtract(boxAbsPos);

            const joint = new BallAndSocketConstraint(
                distanceFromParentBoxToBone,
                myConnectedPivot,
                this._boxConfigs[i].rotationAxis!,
                this._boxConfigs[i].rotationAxis!,
                this._scene
            );
            this._aggregates[boneParentIndex].body.addConstraint(this._aggregates[i].body, joint);
        }
    }

    private _syncBonesAndBoxes(): void {
        if (this.pauseSync) {
            return;
        }

        if (this._ragdollMode) {
            this._bones[this._rootBoneIndex].getDirectionToRef(this._boxConfigs[this._rootBoneIndex].boneOffsetAxis!, this._mesh, TmpVectors.Vector3[0]);
            TmpVectors.Vector3[0].scaleInPlace(this._boxConfigs[this._rootBoneIndex].boxOffset!);
            this._bones[this._rootBoneIndex].getAbsolutePositionToRef(this._mesh, TmpVectors.Vector3[1]);
            TmpVectors.Vector3[1].addInPlace(TmpVectors.Vector3[0]);

            this._bones[this._rootBoneIndex].setAbsolutePosition(this._transforms[this._rootBoneIndex].position, this._mesh);
            this._addImpostorRotationToBone(this._rootBoneIndex);

            const rootPos = this._aggregates[this._rootBoneIndex].body.transformNode.position;

            // Move the mesh, to guarantee alignment between root bone and impostor box position
            TmpVectors.Vector3[1].subtractToRef(rootPos, TmpVectors.Vector3[0]);
            this._mesh.position.subtractToRef(TmpVectors.Vector3[0], this._mesh.position);

            for (let i = 0; i < this._bones.length; i++) {
                if (i == this._rootBoneIndex) continue;
                this._addImpostorRotationToBone(i);
            }
        }
    }

    private _addImpostorRotationToBone(boneIndex: number): void {
        const qmesh = this._mesh.rotationQuaternion ?? Quaternion.FromEulerAngles(this._mesh.rotation.x, this._mesh.rotation.y, this._mesh.rotation.z);
        const qbind = this._initialRotation[boneIndex];
        const qphys = this._aggregates[boneIndex].body?.transformNode?.rotationQuaternion!;

        // TmpVectors.Quaternion[1] = mesh.rotation * this._initialRotation[boneIndex]
        // TmpVectors.Quaternion[0] = body.rotation *  TmpVectors.Quaternion[1]
        qmesh.multiplyToRef(qbind, TmpVectors.Quaternion[1]);
        qphys.multiplyToRef(TmpVectors.Quaternion[1], TmpVectors.Quaternion[0]);

        this._bones[boneIndex].setRotationQuaternion(TmpVectors.Quaternion[0], Space.WORLD, this._mesh);
    }

    // Return true if root bone is valid/exists in this.bonesNames. false otherwise.
    private _defineRootBone(): boolean {
        const skeletonRoots = this._skeleton.getChildren();
        if (skeletonRoots.length != 1) {
            Logger.Log("Ragdoll creation failed: there can only be one root in the skeleton.");
            return false;
        }

        this._rootBoneName = skeletonRoots[0].name;
        this._rootBoneIndex = this._boneNames.indexOf(this._rootBoneName);
        if (this._rootBoneIndex == -1) {
            Logger.Log("Ragdoll creation failed: the array boneNames doesn't have the root bone. The root bone is " + this._skeleton.getChildren());
            return false;
        }

        return true;
    }

    private _findNearestParent(boneIndex: number): any {
        let nearestParent: Nullable<Bone> | undefined = this._bones[boneIndex].getParent();
        do {
            if (nearestParent != null && this._boneNames.includes(nearestParent.name)) {
                break;
            }

            nearestParent = nearestParent?.getParent();
        } while (nearestParent != null);

        return nearestParent;
    }

    private _init() {
        // detach bones with link transform to let physics have control
        this._skeleton.bones.forEach((bone) => {
            bone.linkTransformNode(null);
        });

        this._createColliders();

        // If this.defineRootBone() returns false... there is not root bone.
        if (!this._defineRootBone()) {
            return;
        }

        this._initJoints();
        this._scene.registerBeforeRender(() => {
            this._syncBonesAndBoxes();
        });
    }

    /**
     * Enable ragdoll mode. Create physics objects and make them dynamic.
     */
    public ragdoll(): void {
        if (!this._ragdollMode) {
            this._ragdollMode = true;
            this._init();
        }
    }

    /**
     * Dispose resources and remove physics objects
     */
    dispose(): void {
        this._aggregates.forEach((aggregate: PhysicsAggregate) => {
            aggregate.dispose();
        });
    }
}
