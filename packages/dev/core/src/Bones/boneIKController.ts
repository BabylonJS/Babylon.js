import type { Bone } from "./bone";
import { Vector3, Quaternion, Matrix } from "../Maths/math.vector";
import type { TransformNode } from "../Meshes/transformNode";
import type { Nullable } from "../types";
import { Space } from "../Maths/math.axis";

/**
 * Class used to apply inverse kinematics to bones
 * @see https://doc.babylonjs.com/how_to/how_to_use_bones_and_skeletons#boneikcontroller
 */
export class BoneIKController {
    private static _TmpVecs: Vector3[] = [Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero()];
    private static _TmpQuat = Quaternion.Identity();
    private static _TmpMats: Matrix[] = [Matrix.Identity(), Matrix.Identity()];

    /**
     * Gets or sets the target TransformNode
     * Name kept as mesh for back compatibility
     */
    public targetMesh: TransformNode;

    /** Gets or sets the mesh used as pole */
    public poleTargetMesh: TransformNode;

    /**
     * Gets or sets the bone used as pole
     */
    public poleTargetBone: Nullable<Bone>;

    /**
     * Gets or sets the target position
     */
    public targetPosition = Vector3.Zero();

    /**
     * Gets or sets the pole target position
     */
    public poleTargetPosition = Vector3.Zero();

    /**
     * Gets or sets the pole target local offset
     */
    public poleTargetLocalOffset = Vector3.Zero();

    /**
     * Gets or sets the pole angle
     */
    public poleAngle = 0;

    /**
     * Gets or sets the TransformNode associated with the controller
     * Name kept as mesh for back compatibility
     */
    public mesh: TransformNode;

    /**
     * The amount to slerp (spherical linear interpolation) to the target.  Set this to a value between 0 and 1 (a value of 1 disables slerp)
     */
    public slerpAmount = 1;

    private _bone1Quat = Quaternion.Identity();
    private _bone1Mat = Matrix.Identity();
    private _bone2Ang = Math.PI;

    private _bone1: Nullable<Bone>;
    private _bone2: Bone;
    private _bone1Length: number;
    private _bone2Length: number;
    private _maxAngle = Math.PI;
    private _maxReach: number;

    private _rightHandedSystem = false;

    private _bendAxis = Vector3.Right();
    private _slerping = false;

    private _adjustRoll = 0;

    /**
     * Gets or sets maximum allowed angle
     */
    public get maxAngle(): number {
        return this._maxAngle;
    }

    public set maxAngle(value: number) {
        this._setMaxAngle(value);
    }

    /**
     * Creates a new BoneIKController
     * @param mesh defines the TransformNode to control
     * @param bone defines the bone to control
     * @param options defines options to set up the controller
     * @param options.targetMesh
     * @param options.poleTargetMesh
     * @param options.poleTargetBone
     * @param options.poleTargetLocalOffset
     * @param options.poleAngle
     * @param options.bendAxis
     * @param options.maxAngle
     * @param options.slerpAmount
     */
    constructor(
        mesh: TransformNode,
        bone: Bone,
        options?: {
            targetMesh?: TransformNode;
            poleTargetMesh?: TransformNode;
            poleTargetBone?: Bone;
            poleTargetLocalOffset?: Vector3;
            poleAngle?: number;
            bendAxis?: Vector3;
            maxAngle?: number;
            slerpAmount?: number;
        }
    ) {
        this._bone2 = bone;
        this._bone1 = bone.getParent();

        if (!this._bone1) {
            return;
        }

        this.mesh = mesh;

        const bonePos = bone.getPosition();

        if (bone.getAbsoluteTransform().determinant() > 0) {
            this._rightHandedSystem = true;
            this._bendAxis.x = 0;
            this._bendAxis.y = 0;
            this._bendAxis.z = -1;

            if (bonePos.x > bonePos.y && bonePos.x > bonePos.z) {
                this._adjustRoll = Math.PI * 0.5;
                this._bendAxis.z = 1;
            }
        }

        if (this._bone1.length) {
            const boneScale1 = this._bone1.getScale();
            const boneScale2 = this._bone2.getScale();

            this._bone1Length = this._bone1.length * boneScale1.y * this.mesh.scaling.y;
            this._bone2Length = this._bone2.length * boneScale2.y * this.mesh.scaling.y;
        } else if (this._bone1.children[0]) {
            mesh.computeWorldMatrix(true);

            const pos1 = this._bone2.children[0].getAbsolutePosition(mesh);
            const pos2 = this._bone2.getAbsolutePosition(mesh);
            const pos3 = this._bone1.getAbsolutePosition(mesh);

            this._bone1Length = Vector3.Distance(pos1, pos2);
            this._bone2Length = Vector3.Distance(pos2, pos3);
        }

        this._bone1.getRotationMatrixToRef(Space.WORLD, mesh, this._bone1Mat);
        this.maxAngle = Math.PI;

        if (options) {
            if (options.targetMesh) {
                this.targetMesh = options.targetMesh;
                this.targetMesh.computeWorldMatrix(true);
            }

            if (options.poleTargetMesh) {
                this.poleTargetMesh = options.poleTargetMesh;
                this.poleTargetMesh.computeWorldMatrix(true);
            } else if (options.poleTargetBone) {
                this.poleTargetBone = options.poleTargetBone;
            } else if (this._bone1.getParent()) {
                this.poleTargetBone = this._bone1.getParent();
            }

            if (options.poleTargetLocalOffset) {
                this.poleTargetLocalOffset.copyFrom(options.poleTargetLocalOffset);
            }

            if (options.poleAngle) {
                this.poleAngle = options.poleAngle;
            }

            if (options.bendAxis) {
                this._bendAxis.copyFrom(options.bendAxis);
            }

            if (options.maxAngle) {
                this.maxAngle = options.maxAngle;
            }

            if (options.slerpAmount) {
                this.slerpAmount = options.slerpAmount;
            }
        }
    }

    private _setMaxAngle(ang: number): void {
        if (ang < 0) {
            ang = 0;
        }

        if (ang > Math.PI || ang == undefined) {
            ang = Math.PI;
        }

        this._maxAngle = ang;

        const a = this._bone1Length;
        const b = this._bone2Length;

        this._maxReach = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(ang));
    }

    /**
     * Force the controller to update the bones
     */
    public update(): void {
        const bone1 = this._bone1;

        if (!bone1) {
            return;
        }

        const target = this.targetPosition;
        const poleTarget = this.poleTargetPosition;

        const mat1 = BoneIKController._TmpMats[0];
        const mat2 = BoneIKController._TmpMats[1];

        if (this.targetMesh) {
            target.copyFrom(this.targetMesh.getAbsolutePosition());
        }

        if (this.poleTargetBone) {
            this.poleTargetBone.getAbsolutePositionFromLocalToRef(this.poleTargetLocalOffset, this.mesh, poleTarget);
        } else if (this.poleTargetMesh) {
            Vector3.TransformCoordinatesToRef(this.poleTargetLocalOffset, this.poleTargetMesh.getWorldMatrix(), poleTarget);
        }

        const bonePos = BoneIKController._TmpVecs[0];
        const zaxis = BoneIKController._TmpVecs[1];
        const xaxis = BoneIKController._TmpVecs[2];
        const yaxis = BoneIKController._TmpVecs[3];
        const upAxis = BoneIKController._TmpVecs[4];

        const tmpQuat = BoneIKController._TmpQuat;

        bone1.getAbsolutePositionToRef(this.mesh, bonePos);

        poleTarget.subtractToRef(bonePos, upAxis);

        if (upAxis.x == 0 && upAxis.y == 0 && upAxis.z == 0) {
            upAxis.y = 1;
        } else {
            upAxis.normalize();
        }

        target.subtractToRef(bonePos, yaxis);
        yaxis.normalize();

        Vector3.CrossToRef(yaxis, upAxis, zaxis);
        zaxis.normalize();

        Vector3.CrossToRef(yaxis, zaxis, xaxis);
        xaxis.normalize();

        Matrix.FromXYZAxesToRef(xaxis, yaxis, zaxis, mat1);

        const a = this._bone1Length;
        const b = this._bone2Length;

        let c = Vector3.Distance(bonePos, target);

        if (this._maxReach > 0) {
            c = Math.min(this._maxReach, c);
        }

        let acosa = (b * b + c * c - a * a) / (2 * b * c);
        let acosb = (c * c + a * a - b * b) / (2 * c * a);

        if (acosa > 1) {
            acosa = 1;
        }

        if (acosb > 1) {
            acosb = 1;
        }

        if (acosa < -1) {
            acosa = -1;
        }

        if (acosb < -1) {
            acosb = -1;
        }

        const angA = Math.acos(acosa);
        const angB = Math.acos(acosb);

        let angC = -angA - angB;

        if (this._rightHandedSystem) {
            Matrix.RotationYawPitchRollToRef(0, 0, this._adjustRoll, mat2);
            mat2.multiplyToRef(mat1, mat1);

            Matrix.RotationAxisToRef(this._bendAxis, angB, mat2);
            mat2.multiplyToRef(mat1, mat1);
        } else {
            const _tmpVec = BoneIKController._TmpVecs[5];

            _tmpVec.copyFrom(this._bendAxis);
            _tmpVec.x *= -1;

            Matrix.RotationAxisToRef(_tmpVec, -angB, mat2);
            mat2.multiplyToRef(mat1, mat1);
        }

        if (this.poleAngle) {
            Matrix.RotationAxisToRef(yaxis, this.poleAngle, mat2);
            mat1.multiplyToRef(mat2, mat1);
        }

        if (this._bone1) {
            if (this.slerpAmount < 1) {
                if (!this._slerping) {
                    Quaternion.FromRotationMatrixToRef(this._bone1Mat, this._bone1Quat);
                }
                Quaternion.FromRotationMatrixToRef(mat1, tmpQuat);
                Quaternion.SlerpToRef(this._bone1Quat, tmpQuat, this.slerpAmount, this._bone1Quat);
                angC = this._bone2Ang * (1.0 - this.slerpAmount) + angC * this.slerpAmount;

                this._bone1.setRotationQuaternion(this._bone1Quat, Space.WORLD, this.mesh);
                this._slerping = true;
            } else {
                this._bone1.setRotationMatrix(mat1, Space.WORLD, this.mesh);
                this._bone1Mat.copyFrom(mat1);
                this._slerping = false;
            }
            this._updateLinkedTransformRotation(this._bone1);
        }

        this._bone2.setAxisAngle(this._bendAxis, angC, Space.LOCAL);
        this._updateLinkedTransformRotation(this._bone2);
        this._bone2Ang = angC;
    }

    private _updateLinkedTransformRotation(bone: Bone): void {
        if (bone._linkedTransformNode) {
            if (!bone._linkedTransformNode.rotationQuaternion) {
                bone._linkedTransformNode.rotationQuaternion = new Quaternion();
            }
            bone.getRotationQuaternionToRef(Space.LOCAL, null, bone._linkedTransformNode.rotationQuaternion);
        }
    }
}
