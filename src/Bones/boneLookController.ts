import { Nullable } from "../types";
import { ArrayTools } from "../Misc/arrayTools";
import { Vector3, Quaternion, Matrix } from "../Maths/math.vector";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Bone } from "./bone";
import { Space, Axis } from '../Maths/math.axis';

/**
 * Class used to make a bone look toward a point in space
 * @see https://doc.babylonjs.com/how_to/how_to_use_bones_and_skeletons#bonelookcontroller
 */
export class BoneLookController {

    private static _tmpVecs: Vector3[] = ArrayTools.BuildArray(10, Vector3.Zero);
    private static _tmpQuat = Quaternion.Identity();
    private static _tmpMats: Matrix[] = ArrayTools.BuildArray(5, Matrix.Identity);

    /**
     * The target Vector3 that the bone will look at
     */
    public target: Vector3;

    /**
     * The mesh that the bone is attached to
     */
    public mesh: AbstractMesh;

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
            this._midYawConstraint = this._getAngleDiff(this._minYaw, this._maxYaw) * .5 + this._minYaw;
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
            this._midYawConstraint = this._getAngleDiff(this._minYaw, this._maxYaw) * .5 + this._minYaw;
            this._yawRange = this._maxYaw - this._minYaw;
        }
    }

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
     * @param mesh the mesh that the bone belongs to
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
     **/
    constructor(mesh: AbstractMesh,
        bone: Bone,
        target: Vector3,
        options?: {
            maxYaw?: number,
            minYaw?: number,
            maxPitch?: number,
            minPitch?: number,
            slerpAmount?: number,
            upAxis?: Vector3,
            upAxisSpace?: Space,
            yawAxis?: Vector3,
            pitchAxis?: Vector3,
            adjustYaw?: number,
            adjustPitch?: number,
            adjustRoll?: number,
        }) {

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

                var newYawAxis = Axis.Y;
                var newPitchAxis = Axis.X;

                if (options.yawAxis != null) {
                    newYawAxis = options.yawAxis.clone();
                    newYawAxis.normalize();
                }

                if (options.pitchAxis != null) {
                    newPitchAxis = options.pitchAxis.clone();
                    newPitchAxis.normalize();
                }

                var newRollAxis = Vector3.Cross(newPitchAxis, newYawAxis);

                this._transformYawPitch = Matrix.Identity();
                Matrix.FromXYZAxesToRef(newPitchAxis, newYawAxis, newRollAxis, this._transformYawPitch);

                this._transformYawPitchInv = this._transformYawPitch.clone();
                this._transformYawPitch.invert();

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

        //skip the first frame when slerping so that the mesh rotation is correct
        if (this.slerpAmount < 1 && !this._firstFrameSkipped) {
            this._firstFrameSkipped = true;
            return;
        }

        var bone = this.bone;
        var bonePos = BoneLookController._tmpVecs[0];
        bone.getAbsolutePositionToRef(this.mesh, bonePos);

        var target = this.target;
        var _tmpMat1 = BoneLookController._tmpMats[0];
        var _tmpMat2 = BoneLookController._tmpMats[1];

        var mesh = this.mesh;
        var parentBone = bone.getParent();

        var upAxis = BoneLookController._tmpVecs[1];
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

        var checkYaw = false;
        var checkPitch = false;

        if (this._maxYaw != Math.PI || this._minYaw != -Math.PI) {
            checkYaw = true;
        }
        if (this._maxPitch != Math.PI || this._minPitch != -Math.PI) {
            checkPitch = true;
        }

        if (checkYaw || checkPitch) {

            var spaceMat = BoneLookController._tmpMats[2];
            var spaceMatInv = BoneLookController._tmpMats[3];

            if (this.upAxisSpace == Space.BONE && upAxis.y == 1 && parentBone) {

                parentBone.getRotationMatrixToRef(Space.WORLD, this.mesh, spaceMat);

            } else if (this.upAxisSpace == Space.LOCAL && upAxis.y == 1 && !parentBone) {

                spaceMat.copyFrom(mesh.getWorldMatrix());

            } else {

                var forwardAxis = BoneLookController._tmpVecs[2];
                forwardAxis.copyFrom(this._fowardAxis);

                if (this._transformYawPitch) {
                    Vector3.TransformCoordinatesToRef(forwardAxis, this._transformYawPitchInv, forwardAxis);
                }

                if (parentBone) {
                    parentBone.getDirectionToRef(forwardAxis, this.mesh, forwardAxis);
                } else {
                    mesh.getDirectionToRef(forwardAxis, forwardAxis);
                }

                var rightAxis = Vector3.Cross(upAxis, forwardAxis);
                rightAxis.normalize();
                var forwardAxis = Vector3.Cross(rightAxis, upAxis);

                Matrix.FromXYZAxesToRef(rightAxis, upAxis, forwardAxis, spaceMat);

            }

            spaceMat.invertToRef(spaceMatInv);

            var xzlen: Nullable<number> = null;

            if (checkPitch) {
                var localTarget = BoneLookController._tmpVecs[3];
                target.subtractToRef(bonePos, localTarget);
                Vector3.TransformCoordinatesToRef(localTarget, spaceMatInv, localTarget);

                xzlen = Math.sqrt(localTarget.x * localTarget.x + localTarget.z * localTarget.z);
                var pitch = Math.atan2(localTarget.y, xzlen);
                var newPitch = pitch;

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
                var localTarget = BoneLookController._tmpVecs[4];
                target.subtractToRef(bonePos, localTarget);
                Vector3.TransformCoordinatesToRef(localTarget, spaceMatInv, localTarget);

                var yaw = Math.atan2(localTarget.x, localTarget.z);
                var newYaw = yaw;

                if (yaw > this._maxYaw || yaw < this._minYaw) {

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
                        if (yaw > this._maxYaw) {
                            localTarget.z = this._maxYawCos * xzlen;
                            localTarget.x = this._maxYawSin * xzlen;
                            newYaw = this._maxYaw;
                        } else if (yaw < this._minYaw) {
                            localTarget.z = this._minYawCos * xzlen;
                            localTarget.x = this._minYawSin * xzlen;
                            newYaw = this._minYaw;
                        }
                    }
                }

                if (this._slerping && this._yawRange > Math.PI) {
                    //are we going to be crossing into the min/max region?
                    var boneFwd = BoneLookController._tmpVecs[8];
                    boneFwd.copyFrom(Axis.Z);
                    if (this._transformYawPitch) {
                        Vector3.TransformCoordinatesToRef(boneFwd, this._transformYawPitchInv, boneFwd);
                    }

                    var boneRotMat = BoneLookController._tmpMats[4];
                    this._boneQuat.toRotationMatrix(boneRotMat);
                    this.mesh.getWorldMatrix().multiplyToRef(boneRotMat, boneRotMat);
                    Vector3.TransformCoordinatesToRef(boneFwd, boneRotMat, boneFwd);
                    Vector3.TransformCoordinatesToRef(boneFwd, spaceMatInv, boneFwd);

                    var boneYaw = Math.atan2(boneFwd.x, boneFwd.z);
                    var angBtwTar = this._getAngleBetween(boneYaw, yaw);
                    var angBtwMidYaw = this._getAngleBetween(boneYaw, this._midYawConstraint);

                    if (angBtwTar > angBtwMidYaw) {

                        if (xzlen == null) {
                            xzlen = Math.sqrt(localTarget.x * localTarget.x + localTarget.z * localTarget.z);
                        }

                        var angBtwMax = this._getAngleBetween(boneYaw, this._maxYaw);
                        var angBtwMin = this._getAngleBetween(boneYaw, this._minYaw);

                        if (angBtwMin < angBtwMax) {
                            newYaw = boneYaw + Math.PI * .75;
                            localTarget.z = Math.cos(newYaw) * xzlen;
                            localTarget.x = Math.sin(newYaw) * xzlen;
                        } else {
                            newYaw = boneYaw - Math.PI * .75;
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

        var zaxis = BoneLookController._tmpVecs[5];
        var xaxis = BoneLookController._tmpVecs[6];
        var yaxis = BoneLookController._tmpVecs[7];
        var _tmpQuat = BoneLookController._tmpQuat;

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

        if (this.slerpAmount < 1) {
            if (!this._slerping) {
                this.bone.getRotationQuaternionToRef(Space.WORLD, this.mesh, this._boneQuat);
            }
            if (this._transformYawPitch) {
                this._transformYawPitch.multiplyToRef(_tmpMat1, _tmpMat1);
            }
            Quaternion.FromRotationMatrixToRef(_tmpMat1, _tmpQuat);
            Quaternion.SlerpToRef(this._boneQuat, _tmpQuat, this.slerpAmount, this._boneQuat);

            this.bone.setRotationQuaternion(this._boneQuat, Space.WORLD, this.mesh);
            this._slerping = true;
        } else {
            if (this._transformYawPitch) {
                this._transformYawPitch.multiplyToRef(_tmpMat1, _tmpMat1);
            }
            this.bone.setRotationMatrix(_tmpMat1, Space.WORLD, this.mesh);
            this._slerping = false;
        }

    }

    private _getAngleDiff(ang1: number, ang2: number): number {

        var angDiff = ang2 - ang1;
        angDiff %= Math.PI * 2;

        if (angDiff > Math.PI) {
            angDiff -= Math.PI * 2;
        } else if (angDiff < -Math.PI) {
            angDiff += Math.PI * 2;
        }

        return angDiff;
    }

    private _getAngleBetween(ang1: number, ang2: number): number {

        ang1 %= (2 * Math.PI);
        ang1 = (ang1 < 0) ? ang1 + (2 * Math.PI) : ang1;

        ang2 %= (2 * Math.PI);
        ang2 = (ang2 < 0) ? ang2 + (2 * Math.PI) : ang2;

        var ab = 0;

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

        ang %= (2 * Math.PI);
        ang = (ang < 0) ? ang + (2 * Math.PI) : ang;
        ang1 %= (2 * Math.PI);
        ang1 = (ang1 < 0) ? ang1 + (2 * Math.PI) : ang1;
        ang2 %= (2 * Math.PI);
        ang2 = (ang2 < 0) ? ang2 + (2 * Math.PI) : ang2;

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

}
