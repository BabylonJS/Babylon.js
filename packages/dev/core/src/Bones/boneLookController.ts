import type { Nullable } from "../types";
import { BuildArray } from "../Misc/arrayTools";
import { Vector3, Quaternion, Matrix } from "../Maths/math.vector";
import type { TransformNode } from "../Meshes/transformNode";
import type { Bone } from "./bone";
import { Space, Axis } from "../Maths/math.axis";

/**
 * Class used to make a bone look toward a point in space
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/bonesSkeletons#bonelookcontroller
 */
export class BoneLookController {
    private static _TmpVecs: Vector3[] = BuildArray(10, Vector3.Zero);
    private static _TmpQuat = Quaternion.Identity();
    private static _TmpMats: Matrix[] = BuildArray(5, Matrix.Identity);

    /**
     * The target Vector3 that the bone will look at
     */
    public target: Vector3;

    /**
     * The TransformNode that the bone is attached to
     * Name kept as mesh for back compatibility
     */
    public mesh: TransformNode;

    /**
     * The bone that will be looking to the target
     */
    public bone: Bone;

    /**
     * The up axis of the coordinate system that is used when the bone is rotated
     */
    public upAxis: Vector3 = Vector3.Up();

    /**
     * The space that the up axis is in - Space.BONE, Space.LOCAL (default), or Space.WORLD
     */
    public upAxisSpace: Space = Space.LOCAL;

    /**
     * Used to make an adjustment to the yaw of the bone
     */
    public adjustYaw = 0;

    /**
     * Used to make an adjustment to the pitch of the bone
     */
    public adjustPitch = 0;

    /**
     * Used to make an adjustment to the roll of the bone
     */
    public adjustRoll = 0;

    /**
     * The amount to slerp (spherical linear interpolation) to the target.  Set this to a value between 0 and 1 (a value of 1 disables slerp)
     */
    public slerpAmount = 1;

    private _minYaw: number;
    private _maxYaw: number;
    private _minPitch: number;
    private _maxPitch: number;
    private _minYawSin: number;
    private _minYawCos: number;
    private _maxYawSin: number;
    private _maxYawCos: number;
    private _midYawConstraint: number;
    private _minPitchTan: number;
    private _maxPitchTan: number;

    private _boneQuat: Quaternion = Quaternion.Identity();
    private _slerping = false;
    private _transformYawPitch: Matrix;
    private _transformYawPitchInv: Matrix;
    private _firstFrameSkipped = false;
    private _yawRange: number;
    private _fowardAxis: Vector3 = Vector3.Forward();

    /**
     * Gets or sets the minimum yaw angle that the bone can look to
     */
    get minYaw(): number {
        return this._minYaw;
    }

    set minYaw(value: number) {
        this._minYaw = value;
        this._minYawSin = Math.sin(value);
        this._minYawCos = Math.cos(value);
        if (this._maxYaw != null) {
            this._midYawConstraint = this._getAngleDiff(this._minYaw, this._maxYaw) * 0.5 + this._minYaw;
            this._yawRange = this._maxYaw - this._minYaw;
        }
    }

    /**
     * Gets or sets the maximum yaw angle that the bone can look to
     */
    get maxYaw(): number {
        return this._maxYaw;
    }

    set maxYaw(value: number) {
        this._maxYaw = value;
        this._maxYawSin = Math.sin(value);
        this._maxYawCos = Math.cos(value);
        if (this._minYaw != null) {
            this._midYawConstraint = this._getAngleDiff(this._minYaw, this._maxYaw) * 0.5 + this._minYaw;
            this._yawRange = this._maxYaw - this._minYaw;
        }
    }

    /**
     * Use the absolute value for yaw when checking the min/max constraints
     */
    public useAbsoluteValueForYaw = false;

    /**
     * Gets or sets the minimum pitch angle that the bone can look to
     */
    get minPitch(): number {
        return this._minPitch;
    }

    set minPitch(value: number) {
        this._minPitch = value;
        this._minPitchTan = Math.tan(value);
    }

    /**
     * Gets or sets the maximum pitch angle that the bone can look to
     */
    get maxPitch(): number {
        return this._maxPitch;
    }

    set maxPitch(value: number) {
        this._maxPitch = value;
        this._maxPitchTan = Math.tan(value);
    }

    /**
     * Create a BoneLookController
     * @param mesh the TransformNode that the bone belongs to
     * @param bone the bone that will be looking to the target
     * @param target the target Vector3 to look at
     * @param options optional settings:
     * * maxYaw: the maximum angle the bone will yaw to
     * * minYaw: the minimum angle the bone will yaw to
     * * maxPitch: the maximum angle the bone will pitch to
     * * minPitch: the minimum angle the bone will yaw to
     * * slerpAmount: set the between 0 and 1 to make the bone slerp to the target.
     * * upAxis: the up axis of the coordinate system
     * * upAxisSpace: the space that the up axis is in - Space.BONE, Space.LOCAL (default), or Space.WORLD.
     * * yawAxis: set yawAxis if the bone does not yaw on the y axis
     * * pitchAxis: set pitchAxis if the bone does not pitch on the x axis
     * * adjustYaw: used to make an adjustment to the yaw of the bone
     * * adjustPitch: used to make an adjustment to the pitch of the bone
     * * adjustRoll: used to make an adjustment to the roll of the bone
     * @param options.maxYaw
     * @param options.minYaw
     * @param options.maxPitch
     * @param options.minPitch
     * @param options.slerpAmount
     * @param options.upAxis
     * @param options.upAxisSpace
     * @param options.yawAxis
     * @param options.pitchAxis
     * @param options.adjustYaw
     * @param options.adjustPitch
     * @param options.adjustRoll
     **/
    constructor(
        mesh: TransformNode,
        bone: Bone,
        target: Vector3,
        options?: {
            maxYaw?: number;
            minYaw?: number;
            maxPitch?: number;
            minPitch?: number;
            slerpAmount?: number;
            upAxis?: Vector3;
            upAxisSpace?: Space;
            yawAxis?: Vector3;
            pitchAxis?: Vector3;
            adjustYaw?: number;
            adjustPitch?: number;
            adjustRoll?: number;
            useAbsoluteValueForYaw?: boolean;
        }
    ) {
        this.mesh = mesh;
        this.bone = bone;
        this.target = target;

        if (options) {
            if (options.adjustYaw) {
                this.adjustYaw = options.adjustYaw;
            }

            if (options.adjustPitch) {
                this.adjustPitch = options.adjustPitch;
            }

            if (options.adjustRoll) {
                this.adjustRoll = options.adjustRoll;
            }

            if (options.maxYaw != null) {
                this.maxYaw = options.maxYaw;
            } else {
                this.maxYaw = Math.PI;
            }

            if (options.minYaw != null) {
                this.minYaw = options.minYaw;
            } else {
                this.minYaw = -Math.PI;
            }

            if (options.maxPitch != null) {
                this.maxPitch = options.maxPitch;
            } else {
                this.maxPitch = Math.PI;
            }

            if (options.minPitch != null) {
                this.minPitch = options.minPitch;
            } else {
                this.minPitch = -Math.PI;
            }

            if (options.slerpAmount != null) {
                this.slerpAmount = options.slerpAmount;
            }

            if (options.upAxis != null) {
                this.upAxis = options.upAxis;
            }

            if (options.upAxisSpace != null) {
                this.upAxisSpace = options.upAxisSpace;
            }

            if (options.yawAxis != null || options.pitchAxis != null) {
                let newYawAxis = Axis.Y;
                let newPitchAxis = Axis.X;

                if (options.yawAxis != null) {
                    newYawAxis = options.yawAxis.clone();
                    newYawAxis.normalize();
                }

                if (options.pitchAxis != null) {
                    newPitchAxis = options.pitchAxis.clone();
                    newPitchAxis.normalize();
                }

                const newRollAxis = Vector3.Cross(newPitchAxis, newYawAxis);

                this._transformYawPitch = Matrix.Identity();
                Matrix.FromXYZAxesToRef(newPitchAxis, newYawAxis, newRollAxis, this._transformYawPitch);

                this._transformYawPitchInv = this._transformYawPitch.clone();
                this._transformYawPitch.invert();
            }

            if (options.useAbsoluteValueForYaw !== undefined) {
                this.useAbsoluteValueForYaw = options.useAbsoluteValueForYaw;
            }
        }

        if (!bone.getParent() && this.upAxisSpace == Space.BONE) {
            this.upAxisSpace = Space.LOCAL;
        }
    }

    /**
     * Update the bone to look at the target.  This should be called before the scene is rendered (use scene.registerBeforeRender())
     */
    public update(): void {
        //skip the first frame when slerping so that the TransformNode rotation is correct
        if (this.slerpAmount < 1 && !this._firstFrameSkipped) {
            this._firstFrameSkipped = true;
            return;
        }

        const bone = this.bone;
        const bonePos = BoneLookController._TmpVecs[0];
        bone.getAbsolutePositionToRef(this.mesh, bonePos);

        let target = this.target;
        const _tmpMat1 = BoneLookController._TmpMats[0];
        const _tmpMat2 = BoneLookController._TmpMats[1];

        const mesh = this.mesh;
        const parentBone = bone.getParent();

        const upAxis = BoneLookController._TmpVecs[1];
        upAxis.copyFrom(this.upAxis);

        if (this.upAxisSpace == Space.BONE && parentBone) {
            if (this._transformYawPitch) {
                Vector3.TransformCoordinatesToRef(upAxis, this._transformYawPitchInv, upAxis);
            }
            parentBone.getDirectionToRef(upAxis, this.mesh, upAxis);
        } else if (this.upAxisSpace == Space.LOCAL) {
            mesh.getDirectionToRef(upAxis, upAxis);
            if (mesh.scaling.x != 1 || mesh.scaling.y != 1 || mesh.scaling.z != 1) {
                upAxis.normalize();
            }
        }

        let checkYaw = false;
        let checkPitch = false;

        if (this._maxYaw != Math.PI || this._minYaw != -Math.PI) {
            checkYaw = true;
        }
        if (this._maxPitch != Math.PI || this._minPitch != -Math.PI) {
            checkPitch = true;
        }

        if (checkYaw || checkPitch) {
            const spaceMat = BoneLookController._TmpMats[2];
            const spaceMatInv = BoneLookController._TmpMats[3];

            if (this.upAxisSpace == Space.BONE && upAxis.y == 1 && parentBone) {
                parentBone.getRotationMatrixToRef(Space.WORLD, this.mesh, spaceMat);
            } else if (this.upAxisSpace == Space.LOCAL && upAxis.y == 1 && !parentBone) {
                spaceMat.copyFrom(mesh.getWorldMatrix());
            } else {
                let forwardAxis = BoneLookController._TmpVecs[2];
                forwardAxis.copyFrom(this._fowardAxis);

                if (this._transformYawPitch) {
                    Vector3.TransformCoordinatesToRef(forwardAxis, this._transformYawPitchInv, forwardAxis);
                }

                if (parentBone) {
                    parentBone.getDirectionToRef(forwardAxis, this.mesh, forwardAxis);
                } else {
                    mesh.getDirectionToRef(forwardAxis, forwardAxis);
                }

                const rightAxis = Vector3.Cross(upAxis, forwardAxis);
                rightAxis.normalize();
                forwardAxis = Vector3.Cross(rightAxis, upAxis);

                Matrix.FromXYZAxesToRef(rightAxis, upAxis, forwardAxis, spaceMat);
            }

            spaceMat.invertToRef(spaceMatInv);

            let xzlen: Nullable<number> = null;

            if (checkPitch) {
                const localTarget = BoneLookController._TmpVecs[3];
                target.subtractToRef(bonePos, localTarget);
                Vector3.TransformCoordinatesToRef(localTarget, spaceMatInv, localTarget);

                xzlen = Math.sqrt(localTarget.x * localTarget.x + localTarget.z * localTarget.z);
                const pitch = Math.atan2(localTarget.y, xzlen);
                let newPitch = pitch;

                if (pitch > this._maxPitch) {
                    localTarget.y = this._maxPitchTan * xzlen;
                    newPitch = this._maxPitch;
                } else if (pitch < this._minPitch) {
                    localTarget.y = this._minPitchTan * xzlen;
                    newPitch = this._minPitch;
                }

                if (pitch != newPitch) {
                    Vector3.TransformCoordinatesToRef(localTarget, spaceMat, localTarget);
                    localTarget.addInPlace(bonePos);
                    target = localTarget;
                }
            }

            if (checkYaw) {
                const localTarget = BoneLookController._TmpVecs[4];
                target.subtractToRef(bonePos, localTarget);
                Vector3.TransformCoordinatesToRef(localTarget, spaceMatInv, localTarget);

                const yaw = Math.atan2(localTarget.x, localTarget.z);
                const yawCheck = this.useAbsoluteValueForYaw ? Math.abs(yaw) : yaw;
                let newYaw = yaw;

                if (yawCheck > this._maxYaw || yawCheck < this._minYaw) {
                    if (xzlen == null) {
                        xzlen = Math.sqrt(localTarget.x * localTarget.x + localTarget.z * localTarget.z);
                    }

                    if (this._yawRange > Math.PI) {
                        if (this._isAngleBetween(yaw, this._maxYaw, this._midYawConstraint)) {
                            localTarget.z = this._maxYawCos * xzlen;
                            localTarget.x = this._maxYawSin * xzlen;
                            newYaw = this._maxYaw;
                        } else if (this._isAngleBetween(yaw, this._midYawConstraint, this._minYaw)) {
                            localTarget.z = this._minYawCos * xzlen;
                            localTarget.x = this._minYawSin * xzlen;
                            newYaw = this._minYaw;
                        }
                    } else {
                        if (yawCheck > this._maxYaw) {
                            localTarget.z = this._maxYawCos * xzlen;
                            localTarget.x = this._maxYawSin * xzlen;
                            if (yaw < 0 && this.useAbsoluteValueForYaw) {
                                localTarget.x *= -1;
                            }
                            newYaw = this._maxYaw;
                        } else if (yawCheck < this._minYaw) {
                            localTarget.z = this._minYawCos * xzlen;
                            localTarget.x = this._minYawSin * xzlen;
                            if (yaw < 0 && this.useAbsoluteValueForYaw) {
                                localTarget.x *= -1;
                            }
                            newYaw = this._minYaw;
                        }
                    }
                }

                if (this._slerping && this._yawRange > Math.PI) {
                    //are we going to be crossing into the min/max region?
                    const boneFwd = BoneLookController._TmpVecs[8];
                    boneFwd.copyFrom(Axis.Z);
                    if (this._transformYawPitch) {
                        Vector3.TransformCoordinatesToRef(boneFwd, this._transformYawPitchInv, boneFwd);
                    }

                    const boneRotMat = BoneLookController._TmpMats[4];
                    this._boneQuat.toRotationMatrix(boneRotMat);
                    this.mesh.getWorldMatrix().multiplyToRef(boneRotMat, boneRotMat);
                    Vector3.TransformCoordinatesToRef(boneFwd, boneRotMat, boneFwd);
                    Vector3.TransformCoordinatesToRef(boneFwd, spaceMatInv, boneFwd);

                    const boneYaw = Math.atan2(boneFwd.x, boneFwd.z);
                    const angBtwTar = this._getAngleBetween(boneYaw, yaw);
                    const angBtwMidYaw = this._getAngleBetween(boneYaw, this._midYawConstraint);

                    if (angBtwTar > angBtwMidYaw) {
                        if (xzlen == null) {
                            xzlen = Math.sqrt(localTarget.x * localTarget.x + localTarget.z * localTarget.z);
                        }

                        const angBtwMax = this._getAngleBetween(boneYaw, this._maxYaw);
                        const angBtwMin = this._getAngleBetween(boneYaw, this._minYaw);

                        if (angBtwMin < angBtwMax) {
                            newYaw = boneYaw + Math.PI * 0.75;
                            localTarget.z = Math.cos(newYaw) * xzlen;
                            localTarget.x = Math.sin(newYaw) * xzlen;
                        } else {
                            newYaw = boneYaw - Math.PI * 0.75;
                            localTarget.z = Math.cos(newYaw) * xzlen;
                            localTarget.x = Math.sin(newYaw) * xzlen;
                        }
                    }
                }

                if (yaw != newYaw) {
                    Vector3.TransformCoordinatesToRef(localTarget, spaceMat, localTarget);
                    localTarget.addInPlace(bonePos);
                    target = localTarget;
                }
            }
        }

        const zaxis = BoneLookController._TmpVecs[5];
        const xaxis = BoneLookController._TmpVecs[6];
        const yaxis = BoneLookController._TmpVecs[7];
        const tmpQuat = BoneLookController._TmpQuat;
        const boneScaling = BoneLookController._TmpVecs[9];

        target.subtractToRef(bonePos, zaxis);
        zaxis.normalize();
        Vector3.CrossToRef(upAxis, zaxis, xaxis);
        xaxis.normalize();
        Vector3.CrossToRef(zaxis, xaxis, yaxis);
        yaxis.normalize();
        Matrix.FromXYZAxesToRef(xaxis, yaxis, zaxis, _tmpMat1);

        if (xaxis.x === 0 && xaxis.y === 0 && xaxis.z === 0) {
            return;
        }

        if (yaxis.x === 0 && yaxis.y === 0 && yaxis.z === 0) {
            return;
        }

        if (zaxis.x === 0 && zaxis.y === 0 && zaxis.z === 0) {
            return;
        }

        if (this.adjustYaw || this.adjustPitch || this.adjustRoll) {
            Matrix.RotationYawPitchRollToRef(this.adjustYaw, this.adjustPitch, this.adjustRoll, _tmpMat2);
            _tmpMat2.multiplyToRef(_tmpMat1, _tmpMat1);
        }

        boneScaling.copyFrom(this.bone.getScale());

        if (this.slerpAmount < 1) {
            if (!this._slerping) {
                this.bone.getRotationQuaternionToRef(Space.WORLD, this.mesh, this._boneQuat);
            }
            if (this._transformYawPitch) {
                this._transformYawPitch.multiplyToRef(_tmpMat1, _tmpMat1);
            }
            Quaternion.FromRotationMatrixToRef(_tmpMat1, tmpQuat);
            Quaternion.SlerpToRef(this._boneQuat, tmpQuat, this.slerpAmount, this._boneQuat);

            this.bone.setRotationQuaternion(this._boneQuat, Space.WORLD, this.mesh);
            this._slerping = true;
        } else {
            if (this._transformYawPitch) {
                this._transformYawPitch.multiplyToRef(_tmpMat1, _tmpMat1);
            }
            this.bone.setRotationMatrix(_tmpMat1, Space.WORLD, this.mesh);
            this._slerping = false;
        }

        this.bone.setScale(boneScaling);

        this._updateLinkedTransformRotation();
    }

    private _getAngleDiff(ang1: number, ang2: number): number {
        let angDiff = ang2 - ang1;
        angDiff %= Math.PI * 2;

        if (angDiff > Math.PI) {
            angDiff -= Math.PI * 2;
        } else if (angDiff < -Math.PI) {
            angDiff += Math.PI * 2;
        }

        return angDiff;
    }

    private _getAngleBetween(ang1: number, ang2: number): number {
        ang1 %= 2 * Math.PI;
        ang1 = ang1 < 0 ? ang1 + 2 * Math.PI : ang1;

        ang2 %= 2 * Math.PI;
        ang2 = ang2 < 0 ? ang2 + 2 * Math.PI : ang2;

        let ab = 0;

        if (ang1 < ang2) {
            ab = ang2 - ang1;
        } else {
            ab = ang1 - ang2;
        }

        if (ab > Math.PI) {
            ab = Math.PI * 2 - ab;
        }

        return ab;
    }

    private _isAngleBetween(ang: number, ang1: number, ang2: number): boolean {
        ang %= 2 * Math.PI;
        ang = ang < 0 ? ang + 2 * Math.PI : ang;
        ang1 %= 2 * Math.PI;
        ang1 = ang1 < 0 ? ang1 + 2 * Math.PI : ang1;
        ang2 %= 2 * Math.PI;
        ang2 = ang2 < 0 ? ang2 + 2 * Math.PI : ang2;

        if (ang1 < ang2) {
            if (ang > ang1 && ang < ang2) {
                return true;
            }
        } else {
            if (ang > ang2 && ang < ang1) {
                return true;
            }
        }
        return false;
    }

    private _updateLinkedTransformRotation(): void {
        const bone = this.bone;
        if (bone._linkedTransformNode) {
            if (!bone._linkedTransformNode.rotationQuaternion) {
                bone._linkedTransformNode.rotationQuaternion = new Quaternion();
            }
            bone.getRotationQuaternionToRef(Space.LOCAL, null, bone._linkedTransformNode.rotationQuaternion);
        }
    }
}
