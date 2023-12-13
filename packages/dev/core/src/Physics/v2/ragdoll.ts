import type { Skeleton } from "../../Bones/skeleton";
import { MeshBuilder } from "../..//Meshes/meshBuilder";
import { Vector3, Matrix } from "../../Maths/math.vector";
import type { Quaternion } from "../../Maths/math.vector";
import type { Scene } from "../../scene";
import { PhysicsAggregate } from "./physicsAggregate";
import { BallAndSocketConstraint } from "./physicsConstraint";
import type { Mesh } from "../../Meshes/mesh";
import { Axis, Space } from "core/Maths/math.axis";
import { PhysicsShapeType, PhysicsConstraintType } from "./IPhysicsEnginePlugin";
import type { Nullable } from "../../types";
import type { Bone } from "../../Bones/bone";

/**
 * Ragdoll bone properties
 * @experimental
 */
export class RagdollBoneProperties {
    /**
     *
     */
    width?: number;
    /**
     *
     */
    depth?: number;
    /**
     *
     */
    height?: number;
    /**
     *
     */
    size?: number;
    /**
     *
     */
    joint?: number | undefined;
    /**
     *
     */
    rotationAxis?: Vector3;
    /**
     *
     */
    min?: number;
    /**
     *
     */
    max?: number;
    /**
     *
     */
    boxOffset?: number;
    /**
     *
     */
    boneOffsetAxis?: Vector3;
}

/**
 * Ragdoll for Physics V2
 * @experimental
 */
export class Ragdoll {
    /**
     * Opacity of debug boxes
     */
    public boxVisibility: number = 0.6;

    private _skeleton: Skeleton;
    private _scene: Scene;
    private _mesh: Mesh;
    private _config: any;
    private _boxConfigs: Array<RagdollBoneProperties> = new Array<RagdollBoneProperties>();

    private _bones: Array<Bone> = new Array<Bone>();
    private _initialRotation: Array<Quaternion> = new Array<Quaternion>();
    private _boneNames: string[] = [];
    private _boxes: Array<Mesh> = new Array<Mesh>();
    private _aggregates: Array<PhysicsAggregate> = new Array<PhysicsAggregate>();
    private _mainPivotSphereSize: number;
    private _ragdollMode: boolean = false;
    private _rootBoneName: string = "";
    private _rootBoneIndex: number = -1;
    private _mass: number = 10;
    private _restitution: number = 0;
    private _pauseSync: boolean = false;

    private _putBoxesInBoneCenter: boolean;
    private _defaultJoint: number = PhysicsConstraintType.HINGE;
    private _defaultJointMin: number = -90;
    private _defaultJointMax: number = 90;

    private _boneOffsetAxis: Vector3;

    /**
     *
     * @param skeleton
     * @param mesh
     * @param config
     * @param showBoxes
     * @param mainPivotSphereSize
     */
    constructor(skeleton: Skeleton, mesh: Mesh, config: RagdollBoneProperties[], mainPivotSphereSize = 0) {
        this._skeleton = skeleton;
        this._scene = skeleton.getScene();
        this._mesh = mesh;
        this._config = config; // initial, user defined box configs. May have several box configs jammed into 1 index.
        this._boxConfigs = []; // final box configs. Every element is a separate box config (this.config may have several configs jammed into 1 index).
        this._mainPivotSphereSize = mainPivotSphereSize;
        this._putBoxesInBoneCenter = false;
        this._defaultJoint = PhysicsConstraintType.HINGE;
        this._boneOffsetAxis = Axis.Y;
        this._init();
    }

    /**
     * Set the debug boxes visibility
     */
    public set boxesVisibility(visible: boolean) {
        for (const box of this._boxes) {
            box.visibility = visible ? this.boxVisibility : 0;
        }
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

                const box = MeshBuilder.CreateBox(boneNames[ii] + "_box", currentRagdollBoneProperties, this._scene);

                box.visibility = 0;

                // Define the rest of the box properties.
                currentRagdollBoneProperties.joint = config[i].joint !== undefined ? config[i].joint : this._defaultJoint;
                currentRagdollBoneProperties.rotationAxis = config[i].rotationAxis !== undefined ? config[i].rotationAxis : Axis.X;
                currentRagdollBoneProperties.min = config[i].min !== undefined ? config[i].min : this._defaultJointMin;
                currentRagdollBoneProperties.max = config[i].max !== undefined ? config[i].max : this._defaultJointMax;

                // Offset value.
                let boxOffset = 0;
                if ((config[i].putBoxInBoneCenter !== undefined && config[i].putBoxInBoneCenter) || this._putBoxesInBoneCenter) {
                    // If the current box has the putBoxInBoneCenter config set to true, we will use the bone length to determine the bone position.
                    // NOTE: Some bones don't have the .length property defined, so this may not work.
                    if (currentBone.length === undefined) {
                        console.log("The length property is not defined for bone", currentBone.name, ". putBox(es)InBoneCenter will not work :(");
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

                box.position = currentBone.getAbsolutePosition(this._mesh).add(boneDir.scale(boxOffset));

                const mass = config[i].mass !== undefined ? config[i].mass : this._mass;
                const restitution = config[i].restitution !== undefined ? config[i].restitution : this._restitution;
                const aggregate = new PhysicsAggregate(
                    box,
                    PhysicsShapeType.BOX,
                    {
                        mass: mass,
                        restitution: restitution,
                        friction: 0.6,
                    },
                    this._scene
                );
                aggregate.body.setCollisionCallbackEnabled(true);
                aggregate.body.disablePreStep = false;
                (aggregate.body as any).collisionArray = new Array<number>(1);
                this._aggregates.push(aggregate);
                this._bones.push(currentBone);
                this._boneNames.push(currentBone.name);
                this._boxes.push(box);
                this._boxConfigs.push(currentRagdollBoneProperties);
                this._initialRotation.push(currentBone.getRotationQuaternion(Space.WORLD, this._mesh));
            }
        }
    }

    private _initJoints(): void {
        this._mesh.computeWorldMatrix();
        for (let i = 0; i < this._bones.length; i++) {
            // The root bone has no joints.
            if (i == this._rootBoneIndex) continue;

            const nearestParent = this._findNearestParent(i);

            // Sanity check. This honestly can never be null, because if the rootBone is defined, the rootBone will act as a last resort nearest parent.
            if (nearestParent == null) {
                console.warn("Couldn't find a nearest parent bone in the configs for bone called", this._boneNames[i]);
                return;
            }

            const boneParentIndex = this._boneNames.indexOf(nearestParent.name);

            let distanceFromParentBoxToBone = this._bones[i].getAbsolutePosition(this._mesh).subtract(this._boxes[boneParentIndex].position);

            const wmat = this._boxes[boneParentIndex].computeWorldMatrix();
            const invertedWorldMat = Matrix.Invert(wmat);
            distanceFromParentBoxToBone = Vector3.TransformCoordinates(this._bones[i].getAbsolutePosition(this._mesh), invertedWorldMat);

            const boneAbsPos = this._bones[i].getAbsolutePosition(this._mesh);
            const boxAbsPos = this._boxes[i].position.clone();
            const myConnectedPivot = boneAbsPos.subtract(boxAbsPos);

            const joint = new BallAndSocketConstraint(
                distanceFromParentBoxToBone,
                myConnectedPivot,
                this._boxConfigs[i].rotationAxis!,
                this._boxConfigs[i].rotationAxis!,
                this._scene
            );
            this._aggregates[boneParentIndex].body.addConstraint(this._aggregates[i].body, joint);

            // Show the main pivots for the joints. For debugging purposes.
            if (this._mainPivotSphereSize != 0) {
                const mainPivotSphere = MeshBuilder.CreateSphere("mainPivot", { diameter: this._mainPivotSphereSize }, this._scene);
                mainPivotSphere.position = this._bones[i].getAbsolutePosition(this._mesh);
                this._boxes[boneParentIndex].addChild(mainPivotSphere);
            }
        }
    }

    private _syncBonesAndBoxes(): void {
        if (this._pauseSync) {
            return;
        }

        if (this._ragdollMode) {
            const rootBoneDirection = this._bones[this._rootBoneIndex].getDirection(this._boxConfigs[this._rootBoneIndex].boneOffsetAxis as any, this._mesh);
            const rootBoneOffsetPosition = this._bones[this._rootBoneIndex]
                .getAbsolutePosition(this._mesh)
                .add(rootBoneDirection.scale(this._boxConfigs[this._rootBoneIndex].boxOffset as any));

            this._bones[this._rootBoneIndex].setAbsolutePosition(this._boxes[this._rootBoneIndex].position, this._mesh);
            this._addImpostorRotationToBone(this._rootBoneIndex);

            const rootPos = this._aggregates[this._rootBoneIndex].body.transformNode.position;

            // Move the mesh, to guarantee alignment between root bone and impostor box position
            const dist = rootBoneOffsetPosition.subtract(rootPos);
            this._mesh.position = this._mesh.position.subtract(dist);

            for (let i = 0; i < this._bones.length; i++) {
                if (i == this._rootBoneIndex) continue;
                this._addImpostorRotationToBone(i);
            }
        }
    }

    private _addImpostorRotationToBone(boneIndex: number): void {
        const newRotQuat = this._aggregates[boneIndex].body?.transformNode?.rotationQuaternion?.multiply(this._initialRotation[boneIndex]);
        if (newRotQuat) {
            this._bones[boneIndex].setRotationQuaternion(newRotQuat, Space.WORLD, this._mesh);
        }
    }

    // Return true if root bone is valid/exists in this.bonesNames. false otherwise.
    private _defineRootBone(): boolean {
        const skeletonRoots = this._skeleton.getChildren();
        if (skeletonRoots.length != 1) {
            console.log("Ragdoll creation failed: there can only be 1 root in the skeleton :(");
            return false;
        }

        this._rootBoneName = skeletonRoots[0].name;
        this._rootBoneIndex = this._boneNames.indexOf(this._rootBoneName);
        if (this._rootBoneIndex == -1) {
            console.log("Ragdoll creation failed: the array boneNames doesn't have the root bone in it :( - the root bone is", this._skeleton.getChildren());
            return false;
        }

        return true;
    }

    private _findNearestParent(boneIndex: number): any {
        let nearestParent: Nullable<Bone> | undefined = this._bones[boneIndex].getParent();
        do {
            if (nearestParent != null && (this._boneNames as any).includes(nearestParent.name)) {
                break;
            }

            nearestParent = nearestParent?.getParent();
        } while (nearestParent != null);

        return nearestParent;
    }

    private _init() {
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
     * isRagdoll
     * retusn
     */
    public ragdoll(): void {
        this._ragdollMode = true;
    }

    /**
     *
     */
    dispose(): void {
        this._aggregates.forEach((aggregate: PhysicsAggregate) => {
            aggregate.dispose();
        });
    }
}
