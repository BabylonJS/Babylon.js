import { DeepImmutable } from "../types";
import { serialize, serializeAsVector3, serializeAsQuaternion, SerializationHelper } from "../Misc/decorators";
import { Observable } from "../Misc/observable";

import { Nullable } from "../types";
import { Camera } from "../Cameras/camera";
import { Scene } from "../scene";
import { Quaternion, Matrix, Vector3, TmpVectors } from "../Maths/math.vector";
import { Node } from "../node";
import { Bone } from "../Bones/bone";
import { AbstractMesh } from '../Meshes/abstractMesh';
import { Space } from '../Maths/math.axis';
/**
 * A TransformNode is an object that is not rendered but can be used as a center of transformation. This can decrease memory usage and increase rendering speed compared to using an empty mesh as a parent and is less complicated than using a pivot matrix.
 * @see https://doc.babylonjs.com/how_to/transformnode
 */
export class TransformNode extends Node {
    // Statics
    /**
     * Object will not rotate to face the camera
     */
    public static BILLBOARDMODE_NONE = 0;
    /**
     * Object will rotate to face the camera but only on the x axis
     */
    public static BILLBOARDMODE_X = 1;
    /**
     * Object will rotate to face the camera but only on the y axis
     */
    public static BILLBOARDMODE_Y = 2;
    /**
     * Object will rotate to face the camera but only on the z axis
     */
    public static BILLBOARDMODE_Z = 4;
    /**
     * Object will rotate to face the camera
     */
    public static BILLBOARDMODE_ALL = 7;
    /**
     * Object will rotate to face the camera's position instead of orientation
     */
    public static BILLBOARDMODE_USE_POSITION = 128;

    private _forward = new Vector3(0, 0, 1);
    private _forwardInverted = new Vector3(0, 0, -1);
    private _up = new Vector3(0, 1, 0);
    private _right = new Vector3(1, 0, 0);
    private _rightInverted = new Vector3(-1, 0, 0);
    private _tmpRotation = Quaternion.Zero();

    // Properties
    @serializeAsVector3("position")
    private _position = Vector3.Zero();

    @serializeAsVector3("rotation")
    private _rotation = Vector3.Zero();

    @serializeAsQuaternion("rotationQuaternion")
    private _rotationQuaternion: Nullable<Quaternion> = null;

    @serializeAsVector3("scaling")
    protected _scaling = Vector3.One();
    protected _isDirty = false;
    private _transformToBoneReferal: Nullable<TransformNode> = null;
    private _isAbsoluteSynced = false;

    @serialize("billboardMode")
    private _billboardMode = TransformNode.BILLBOARDMODE_NONE;

    /**
    * Gets or sets the billboard mode. Default is 0.
    *
    * | Value | Type | Description |
    * | --- | --- | --- |
    * | 0 | BILLBOARDMODE_NONE |  |
    * | 1 | BILLBOARDMODE_X |  |
    * | 2 | BILLBOARDMODE_Y |  |
    * | 4 | BILLBOARDMODE_Z |  |
    * | 7 | BILLBOARDMODE_ALL |  |
    *
    */
    public get billboardMode() {
        return this._billboardMode;
    }

    public set billboardMode(value: number) {
        if (this._billboardMode === value) {
            return;
        }
        this._billboardMode = value;
    }

    private _preserveParentRotationForBillboard = false;
    /**
     * Gets or sets a boolean indicating that parent rotation should be preserved when using billboards.
     * This could be useful for glTF objects where parent rotation helps converting from right handed to left handed
     */
    public get preserveParentRotationForBillboard() {
        return this._preserveParentRotationForBillboard;
    }

    public set preserveParentRotationForBillboard(value: boolean) {
        if (value === this._preserveParentRotationForBillboard) {
            return;
        }
        this._preserveParentRotationForBillboard = value;
    }

    /**
     * Multiplication factor on scale x/y/z when computing the world matrix. Eg. for a 1x1x1 cube setting this to 2 will make it a 2x2x2 cube
     */
    @serialize()
    public scalingDeterminant = 1;

    @serialize("infiniteDistance")
    private _infiniteDistance = false;

    /**
     * Gets or sets the distance of the object to max, often used by skybox
     */
    public get infiniteDistance() {
        return this._infiniteDistance;
    }

    public set infiniteDistance(value: boolean) {
        if (this._infiniteDistance === value) {
            return;
        }

        this._infiniteDistance = value;
    }

    /**
     * Gets or sets a boolean indicating that non uniform scaling (when at least one component is different from others) should be ignored.
     * By default the system will update normals to compensate
     */
    @serialize()
    public ignoreNonUniformScaling = false;

    /**
     * Gets or sets a boolean indicating that even if rotationQuaternion is defined, you can keep updating rotation property and Babylon.js will just mix both
     */
    @serialize()
    public reIntegrateRotationIntoRotationQuaternion = false;

    // Cache
    /** @hidden */
    public _poseMatrix: Nullable<Matrix> = null;
    /** @hidden */
    public _localMatrix = Matrix.Zero();

    private _usePivotMatrix = false;
    private _absolutePosition = Vector3.Zero();
    private _absoluteScaling = Vector3.Zero();
    private _absoluteRotationQuaternion = Quaternion.Identity();
    private _pivotMatrix = Matrix.Identity();
    private _pivotMatrixInverse: Matrix;
    protected _postMultiplyPivotMatrix = false;

    protected _isWorldMatrixFrozen = false;

    /** @hidden */
    public _indexInSceneTransformNodesArray = -1;

    /**
    * An event triggered after the world matrix is updated
    */
    public onAfterWorldMatrixUpdateObservable = new Observable<TransformNode>();

    constructor(name: string, scene: Nullable<Scene> = null, isPure = true) {
        super(name, scene);

        if (isPure) {
            this.getScene().addTransformNode(this);
        }

        let bind = this._markAsDirty.bind(this);
        this._position.onUpdateCallback = bind;        
        this._rotation.onUpdateCallback = bind;
        this._scaling.onUpdateCallback = bind;
    }

    /**
     * Gets a string identifying the name of the class
     * @returns "TransformNode" string
     */
    public getClassName(): string {
        return "TransformNode";
    }

    public _markAsDirty() {
        this._isDirty = true;
    }

    /**
      * Gets or set the node position (default is (0.0, 0.0, 0.0))
      */
    public get position(): Vector3 {
        return this._position;
    }

    public set position(newPosition: Vector3) {
        this._position.onUpdateCallback = null;

        this._position = newPosition;
        this._isDirty = true;

        this._position.onUpdateCallback = this._markAsDirty.bind(this);
    }

    /**
      * Gets or sets the rotation property : a Vector3 defining the rotation value in radians around each local axis X, Y, Z  (default is (0.0, 0.0, 0.0)).
      * If rotation quaternion is set, this Vector3 will be ignored and copy from the quaternion
      */
    public get rotation(): Vector3 {
        return this._rotation;
    }

    public set rotation(newRotation: Vector3) {        
        this._rotation.onUpdateCallback = null;

        this._rotation = newRotation;
        this._rotationQuaternion = null;
        this._isDirty = true;

        this._rotation.onUpdateCallback = this._markAsDirty.bind(this);
    }

    /**
     * Gets or sets the scaling property : a Vector3 defining the node scaling along each local axis X, Y, Z (default is (0.0, 0.0, 0.0)).
     */
    public get scaling(): Vector3 {
        return this._scaling;
    }

    public set scaling(newScaling: Vector3) {
        this._scaling.onUpdateCallback = null;

        this._scaling = newScaling;
        this._isDirty = true;
        
        this._scaling.onUpdateCallback = this._markAsDirty.bind(this);
    }

    /**
     * Gets or sets the rotation Quaternion property : this a Quaternion object defining the node rotation by using a unit quaternion (undefined by default, but can be null).
     * If set, only the rotationQuaternion is then used to compute the node rotation (ie. node.rotation will be ignored)
     */
    public get rotationQuaternion(): Nullable<Quaternion> {
        return this._rotationQuaternion;
    }

    public set rotationQuaternion(quaternion: Nullable<Quaternion>) {
        this._rotationQuaternion = quaternion;
        //reset the rotation vector.
        if (quaternion) {
            this._rotation.setAll(0.0);
        }
        this._isDirty = true;
    }

    /**
     * The forward direction of that transform in world space.
     */
    public get forward(): Vector3 {
        return Vector3.Normalize(Vector3.TransformNormal(
            this.getScene().useRightHandedSystem ? this._forwardInverted : this._forward,
            this.getWorldMatrix()
        ));
    }

    /**
     * The up direction of that transform in world space.
     */
    public get up(): Vector3 {
        return Vector3.Normalize(Vector3.TransformNormal(
            this._up,
            this.getWorldMatrix()
        ));
    }

    /**
     * The right direction of that transform in world space.
     */
    public get right(): Vector3 {
        return Vector3.Normalize(Vector3.TransformNormal(
            this.getScene().useRightHandedSystem ? this._rightInverted : this._right,
            this.getWorldMatrix()
        ));
    }

    /**
     * Copies the parameter passed Matrix into the mesh Pose matrix.
     * @param matrix the matrix to copy the pose from
     * @returns this TransformNode.
     */
    public updatePoseMatrix(matrix: Matrix): TransformNode {
        if (!this._poseMatrix) {
            this._poseMatrix = matrix.clone();
            return this;
        }
        this._poseMatrix.copyFrom(matrix);
        return this;
    }

    /**
     * Returns the mesh Pose matrix.
     * @returns the pose matrix
     */
    public getPoseMatrix(): Matrix {
        if (!this._poseMatrix) {
            this._poseMatrix = Matrix.Identity();
        }
        return this._poseMatrix;
    }

    /** @hidden */
    public _isSynchronized(): boolean {
        let cache = this._cache;

        if (this.billboardMode !== cache.billboardMode || this.billboardMode !== TransformNode.BILLBOARDMODE_NONE) {
            return false;
        }

        if (cache.pivotMatrixUpdated) {
            return false;
        }

        if (this.infiniteDistance) {
            return false;
        }

        // if (this._rotationQuaternion) {
        //     if (!cache.rotationQuaternion.equals(this._rotationQuaternion)) {
        //         return false;
        //     }
        // } 

        return true;
    }

    /** @hidden */
    public _initCache() {
        super._initCache();

        let cache = this._cache;
        cache.localMatrixUpdated = false;
       // cache.rotationQuaternion = new Quaternion(0, 0, 0, 0);
        cache.billboardMode = -1;
        cache.infiniteDistance = false;
    }

    /**
    * Flag the transform node as dirty (Forcing it to update everything)
    * @param property if set to "rotation" the objects rotationQuaternion will be set to null
    * @returns this transform node
    */
    public markAsDirty(property: string): TransformNode {
        this._currentRenderId = Number.MAX_VALUE;
        this._isDirty = true;
        return this;
    }

    /**
     * Returns the current mesh absolute position.
     * Returns a Vector3.
     */
    public get absolutePosition(): Vector3 {
        return this._absolutePosition;
    }

    /**
     * Returns the current mesh absolute scaling.
     * Returns a Vector3.
     */
    public get absoluteScaling(): Vector3 {
        this._syncAbsoluteScalingAndRotation();
        return this._absoluteScaling;
    }

    /**
     * Returns the current mesh absolute rotation.
     * Returns a Quaternion.
     */
    public get absoluteRotationQuaternion(): Quaternion {
        this._syncAbsoluteScalingAndRotation();
        return this._absoluteRotationQuaternion;
    }

    /**
     * Sets a new matrix to apply before all other transformation
     * @param matrix defines the transform matrix
     * @returns the current TransformNode
     */
    public setPreTransformMatrix(matrix: Matrix): TransformNode {
        return this.setPivotMatrix(matrix, false);
    }

    /**
     * Sets a new pivot matrix to the current node
     * @param matrix defines the new pivot matrix to use
     * @param postMultiplyPivotMatrix defines if the pivot matrix must be cancelled in the world matrix. When this parameter is set to true (default), the inverse of the pivot matrix is also applied at the end to cancel the transformation effect
     * @returns the current TransformNode
    */
    public setPivotMatrix(matrix: DeepImmutable<Matrix>, postMultiplyPivotMatrix = true): TransformNode {
        this._pivotMatrix.copyFrom(matrix);
        this._usePivotMatrix = !this._pivotMatrix.isIdentity();

        this._cache.pivotMatrixUpdated = true;
        this._postMultiplyPivotMatrix = postMultiplyPivotMatrix;

        if (this._postMultiplyPivotMatrix) {
            if (!this._pivotMatrixInverse) {
                this._pivotMatrixInverse = Matrix.Invert(this._pivotMatrix);
            } else {
                this._pivotMatrix.invertToRef(this._pivotMatrixInverse);
            }
        }

        return this;
    }

    /**
     * Returns the mesh pivot matrix.
     * Default : Identity.
     * @returns the matrix
     */
    public getPivotMatrix(): Matrix {
        return this._pivotMatrix;
    }

    /**
     * Instantiate (when possible) or clone that node with its hierarchy
     * @param newParent defines the new parent to use for the instance (or clone)
     * @param options defines options to configure how copy is done
     * @param onNewNodeCreated defines an option callback to call when a clone or an instance is created
     * @returns an instance (or a clone) of the current node with its hiearchy
     */
    public instantiateHierarchy(newParent: Nullable<TransformNode> = null, options?: { doNotInstantiate: boolean}, onNewNodeCreated?: (source: TransformNode, clone: TransformNode) => void): Nullable<TransformNode> {
        let clone = this.clone("Clone of " +  (this.name || this.id), newParent || this.parent, true);

        if (clone) {
            if (onNewNodeCreated) {
                onNewNodeCreated(this, clone);
            }
        }

        for (var child of this.getChildTransformNodes(true)) {
            child.instantiateHierarchy(clone, options, onNewNodeCreated);
        }

        return clone;
    }

    /**
     * Prevents the World matrix to be computed any longer
     * @param newWorldMatrix defines an optional matrix to use as world matrix
     * @returns the TransformNode.
     */
    public freezeWorldMatrix(newWorldMatrix: Nullable<Matrix> = null): TransformNode {
        if (newWorldMatrix) {
            this._worldMatrix = newWorldMatrix;
        } else {
            this._isWorldMatrixFrozen = false;  // no guarantee world is not already frozen, switch off temporarily
            this.computeWorldMatrix(true);
        }
        this._isDirty = false;
        this._isWorldMatrixFrozen = true;
        return this;
    }

    /**
     * Allows back the World matrix computation.
     * @returns the TransformNode.
     */
    public unfreezeWorldMatrix() {
        this._isWorldMatrixFrozen = false;
        this.computeWorldMatrix(true);
        return this;
    }

    /**
     * True if the World matrix has been frozen.
     */
    public get isWorldMatrixFrozen(): boolean {
        return this._isWorldMatrixFrozen;
    }

    /**
    * Retuns the mesh absolute position in the World.
    * @returns a Vector3.
    */
    public getAbsolutePosition(): Vector3 {
        this.computeWorldMatrix();
        return this._absolutePosition;
    }

    /**
     * Sets the mesh absolute position in the World from a Vector3 or an Array(3).
     * @param absolutePosition the absolute position to set
     * @returns the TransformNode.
     */
    public setAbsolutePosition(absolutePosition: Vector3): TransformNode {
        if (!absolutePosition) {
            return this;
        }
        var absolutePositionX;
        var absolutePositionY;
        var absolutePositionZ;
        if (absolutePosition.x === undefined) {
            if (arguments.length < 3) {
                return this;
            }
            absolutePositionX = arguments[0];
            absolutePositionY = arguments[1];
            absolutePositionZ = arguments[2];
        }
        else {
            absolutePositionX = absolutePosition.x;
            absolutePositionY = absolutePosition.y;
            absolutePositionZ = absolutePosition.z;
        }
        if (this.parent) {
            const invertParentWorldMatrix = TmpVectors.Matrix[0];
            this.parent.getWorldMatrix().invertToRef(invertParentWorldMatrix);
            Vector3.TransformCoordinatesFromFloatsToRef(absolutePositionX, absolutePositionY, absolutePositionZ, invertParentWorldMatrix, this.position);
        } else {
            this.position.x = absolutePositionX;
            this.position.y = absolutePositionY;
            this.position.z = absolutePositionZ;
        }

        this._absolutePosition.copyFrom(absolutePosition);
        return this;
    }

    /**
     * Sets the mesh position in its local space.
     * @param vector3 the position to set in localspace
     * @returns the TransformNode.
     */
    public setPositionWithLocalVector(vector3: Vector3): TransformNode {
        this.computeWorldMatrix();
        this.position = Vector3.TransformNormal(vector3, this._localMatrix);
        return this;
    }

    /**
     * Returns the mesh position in the local space from the current World matrix values.
     * @returns a new Vector3.
     */
    public getPositionExpressedInLocalSpace(): Vector3 {
        this.computeWorldMatrix();
        const invLocalWorldMatrix = TmpVectors.Matrix[0];
        this._localMatrix.invertToRef(invLocalWorldMatrix);
        return Vector3.TransformNormal(this.position, invLocalWorldMatrix);
    }

    /**
     * Translates the mesh along the passed Vector3 in its local space.
     * @param vector3 the distance to translate in localspace
     * @returns the TransformNode.
     */
    public locallyTranslate(vector3: Vector3): TransformNode {
        this.computeWorldMatrix(true);
        this.position = Vector3.TransformCoordinates(vector3, this._localMatrix);
        return this;
    }

    private static _lookAtVectorCache = new Vector3(0, 0, 0);

    /**
     * Orients a mesh towards a target point. Mesh must be drawn facing user.
     * @param targetPoint the position (must be in same space as current mesh) to look at
     * @param yawCor optional yaw (y-axis) correction in radians
     * @param pitchCor optional pitch (x-axis) correction in radians
     * @param rollCor optional roll (z-axis) correction in radians
     * @param space the choosen space of the target
     * @returns the TransformNode.
     */
    public lookAt(targetPoint: Vector3, yawCor: number = 0, pitchCor: number = 0, rollCor: number = 0, space: Space = Space.LOCAL): TransformNode {
        var dv = TransformNode._lookAtVectorCache;
        var pos = space === Space.LOCAL ? this.position : this.getAbsolutePosition();
        targetPoint.subtractToRef(pos, dv);
        this.setDirection(dv, yawCor, pitchCor, rollCor);

        // Correct for parent's rotation offset
        if (space === Space.WORLD && this.parent) {
            if (this.rotationQuaternion) {
                // Get local rotation matrix of the looking object
                var rotationMatrix = TmpVectors.Matrix[0];
                this.rotationQuaternion.toRotationMatrix(rotationMatrix);

                // Offset rotation by parent's inverted rotation matrix to correct in world space
                var parentRotationMatrix = TmpVectors.Matrix[1];
                this.parent.getWorldMatrix().getRotationMatrixToRef(parentRotationMatrix);
                parentRotationMatrix.invert();
                rotationMatrix.multiplyToRef(parentRotationMatrix, rotationMatrix);
                this.rotationQuaternion.fromRotationMatrix(rotationMatrix);
            } else {
                // Get local rotation matrix of the looking object
                var quaternionRotation = TmpVectors.Quaternion[0];
                Quaternion.FromEulerVectorToRef(this.rotation, quaternionRotation);
                var rotationMatrix = TmpVectors.Matrix[0];
                quaternionRotation.toRotationMatrix(rotationMatrix);

                // Offset rotation by parent's inverted rotation matrix to correct in world space
                var parentRotationMatrix = TmpVectors.Matrix[1];
                this.parent.getWorldMatrix().getRotationMatrixToRef(parentRotationMatrix);
                parentRotationMatrix.invert();
                rotationMatrix.multiplyToRef(parentRotationMatrix, rotationMatrix);
                quaternionRotation.fromRotationMatrix(rotationMatrix);
                quaternionRotation.toEulerAnglesToRef(this.rotation);
            }
        }

        return this;
    }

    /**
      * Returns a new Vector3 that is the localAxis, expressed in the mesh local space, rotated like the mesh.
      * This Vector3 is expressed in the World space.
      * @param localAxis axis to rotate
      * @returns a new Vector3 that is the localAxis, expressed in the mesh local space, rotated like the mesh.
      */
    public getDirection(localAxis: Vector3): Vector3 {
        var result = Vector3.Zero();

        this.getDirectionToRef(localAxis, result);

        return result;
    }

    /**
     * Sets the Vector3 "result" as the rotated Vector3 "localAxis" in the same rotation than the mesh.
     * localAxis is expressed in the mesh local space.
     * result is computed in the Wordl space from the mesh World matrix.
     * @param localAxis axis to rotate
     * @param result the resulting transformnode
     * @returns this TransformNode.
     */
    public getDirectionToRef(localAxis: Vector3, result: Vector3): TransformNode {
        Vector3.TransformNormalToRef(localAxis, this.getWorldMatrix(), result);
        return this;
    }

    /**
     * Sets this transform node rotation to the given local axis.
     * @param localAxis the axis in local space
     * @param yawCor optional yaw (y-axis) correction in radians
     * @param pitchCor optional pitch (x-axis) correction in radians
     * @param rollCor optional roll (z-axis) correction in radians
     * @returns this TransformNode
     */
    public setDirection(localAxis: Vector3, yawCor: number = 0, pitchCor: number = 0, rollCor: number = 0): TransformNode {
        var yaw = -Math.atan2(localAxis.z, localAxis.x) + Math.PI / 2;
        var len = Math.sqrt(localAxis.x * localAxis.x + localAxis.z * localAxis.z);
        var pitch = -Math.atan2(localAxis.y, len);
        if (this.rotationQuaternion) {
            Quaternion.RotationYawPitchRollToRef(yaw + yawCor, pitch + pitchCor, rollCor, this.rotationQuaternion);
        }
        else {
            this.rotation.x = pitch + pitchCor;
            this.rotation.y = yaw + yawCor;
            this.rotation.z = rollCor;
        }
        return this;
    }

    /**
     * Sets a new pivot point to the current node
     * @param point defines the new pivot point to use
     * @param space defines if the point is in world or local space (local by default)
     * @returns the current TransformNode
    */
    public setPivotPoint(point: Vector3, space: Space = Space.LOCAL): TransformNode {
        if (this.getScene().getRenderId() == 0) {
            this.computeWorldMatrix(true);
        }

        var wm = this.getWorldMatrix();

        if (space == Space.WORLD) {
            var tmat = TmpVectors.Matrix[0];
            wm.invertToRef(tmat);
            point = Vector3.TransformCoordinates(point, tmat);
        }

        return this.setPivotMatrix(Matrix.Translation(-point.x, -point.y, -point.z), true);
    }

    /**
     * Returns a new Vector3 set with the mesh pivot point coordinates in the local space.
     * @returns the pivot point
     */
    public getPivotPoint(): Vector3 {
        var point = Vector3.Zero();
        this.getPivotPointToRef(point);
        return point;
    }

    /**
     * Sets the passed Vector3 "result" with the coordinates of the mesh pivot point in the local space.
     * @param result the vector3 to store the result
     * @returns this TransformNode.
     */
    public getPivotPointToRef(result: Vector3): TransformNode {
        result.x = -this._pivotMatrix.m[12];
        result.y = -this._pivotMatrix.m[13];
        result.z = -this._pivotMatrix.m[14];
        return this;
    }

    /**
     * Returns a new Vector3 set with the mesh pivot point World coordinates.
     * @returns a new Vector3 set with the mesh pivot point World coordinates.
     */
    public getAbsolutePivotPoint(): Vector3 {
        var point = Vector3.Zero();
        this.getAbsolutePivotPointToRef(point);
        return point;
    }

    /**
     * Sets the Vector3 "result" coordinates with the mesh pivot point World coordinates.
     * @param result vector3 to store the result
     * @returns this TransformNode.
     */
    public getAbsolutePivotPointToRef(result: Vector3): TransformNode {
        result.x = this._pivotMatrix.m[12];
        result.y = this._pivotMatrix.m[13];
        result.z = this._pivotMatrix.m[14];
        this.getPivotPointToRef(result);
        Vector3.TransformCoordinatesToRef(result, this.getWorldMatrix(), result);
        return this;
    }

    /**
     * Defines the passed node as the parent of the current node.
     * The node will remain exactly where it is and its position / rotation will be updated accordingly
     * @see https://doc.babylonjs.com/how_to/parenting
     * @param node the node ot set as the parent
     * @returns this TransformNode.
     */
    public setParent(node: Nullable<Node>): TransformNode {
        if (!node && !this.parent) {
            return this;
        }

        var quatRotation = TmpVectors.Quaternion[0];
        var position = TmpVectors.Vector3[0];
        var scale = TmpVectors.Vector3[1];

        if (!node) {
            this.computeWorldMatrix(true);
            this.getWorldMatrix().decompose(scale, quatRotation, position);
        } else {
            var diffMatrix = TmpVectors.Matrix[0];
            var invParentMatrix = TmpVectors.Matrix[1];

            this.computeWorldMatrix(true);
            node.computeWorldMatrix(true);

            node.getWorldMatrix().invertToRef(invParentMatrix);
            this.getWorldMatrix().multiplyToRef(invParentMatrix, diffMatrix);
            diffMatrix.decompose(scale, quatRotation, position);
        }

        if (this.rotationQuaternion) {
            this.rotationQuaternion.copyFrom(quatRotation);
        } else {
            quatRotation.toEulerAnglesToRef(this.rotation);
        }

        this.scaling.copyFrom(scale);
        this.position.copyFrom(position);

        this.parent = node;
        return this;
    }

    private _nonUniformScaling = false;
    /**
     * True if the scaling property of this object is non uniform eg. (1,2,1)
     */
    public get nonUniformScaling(): boolean {
        return this._nonUniformScaling;
    }

    /** @hidden */
    public _updateNonUniformScalingState(value: boolean): boolean {
        if (this._nonUniformScaling === value) {
            return false;
        }

        this._nonUniformScaling = value;
        return true;
    }

    /**
     * Attach the current TransformNode to another TransformNode associated with a bone
     * @param bone Bone affecting the TransformNode
     * @param affectedTransformNode TransformNode associated with the bone
     * @returns this object
     */
    public attachToBone(bone: Bone, affectedTransformNode: TransformNode): TransformNode {
        this._transformToBoneReferal = affectedTransformNode;
        this.parent = bone;

        bone.getSkeleton().prepare();

        if (bone.getWorldMatrix().determinant() < 0) {
            this.scalingDeterminant *= -1;
        }
        return this;
    }

    /**
     * Detach the transform node if its associated with a bone
     * @returns this object
     */
    public detachFromBone(): TransformNode {
        if (!this.parent) {
            return this;
        }

        if (this.parent.getWorldMatrix().determinant() < 0) {
            this.scalingDeterminant *= -1;
        }
        this._transformToBoneReferal = null;
        this.parent = null;
        return this;
    }

    private static _rotationAxisCache = new Quaternion();
    /**
     * Rotates the mesh around the axis vector for the passed angle (amount) expressed in radians, in the given space.
     * space (default LOCAL) can be either Space.LOCAL, either Space.WORLD.
     * Note that the property `rotationQuaternion` is then automatically updated and the property `rotation` is set to (0,0,0) and no longer used.
     * The passed axis is also normalized.
     * @param axis the axis to rotate around
     * @param amount the amount to rotate in radians
     * @param space Space to rotate in (Default: local)
     * @returns the TransformNode.
     */
    public rotate(axis: Vector3, amount: number, space?: Space): TransformNode {
        axis.normalize();
        if (!this.rotationQuaternion) {
            this.rotationQuaternion = this.rotation.toQuaternion();
            this.rotation.setAll(0);
        }
        var rotationQuaternion: Quaternion;
        if (!space || (space as any) === Space.LOCAL) {
            rotationQuaternion = Quaternion.RotationAxisToRef(axis, amount, TransformNode._rotationAxisCache);
            this.rotationQuaternion.multiplyToRef(rotationQuaternion, this.rotationQuaternion);
        }
        else {
            if (this.parent) {
                const invertParentWorldMatrix = TmpVectors.Matrix[0];
                this.parent.getWorldMatrix().invertToRef(invertParentWorldMatrix);
                axis = Vector3.TransformNormal(axis, invertParentWorldMatrix);
            }
            rotationQuaternion = Quaternion.RotationAxisToRef(axis, amount, TransformNode._rotationAxisCache);
            rotationQuaternion.multiplyToRef(this.rotationQuaternion, this.rotationQuaternion);
        }
        return this;
    }

    /**
     * Rotates the mesh around the axis vector for the passed angle (amount) expressed in radians, in world space.
     * Note that the property `rotationQuaternion` is then automatically updated and the property `rotation` is set to (0,0,0) and no longer used.
     * The passed axis is also normalized. .
     * Method is based on http://www.euclideanspace.com/maths/geometry/affine/aroundPoint/index.htm
     * @param point the point to rotate around
     * @param axis the axis to rotate around
     * @param amount the amount to rotate in radians
     * @returns the TransformNode
     */
    public rotateAround(point: Vector3, axis: Vector3, amount: number): TransformNode {
        axis.normalize();
        if (!this.rotationQuaternion) {
            this.rotationQuaternion = Quaternion.RotationYawPitchRoll(this.rotation.y, this.rotation.x, this.rotation.z);
            this.rotation.setAll(0);
        }

        const tmpVector = TmpVectors.Vector3[0];
        const finalScale = TmpVectors.Vector3[1];
        const finalTranslation = TmpVectors.Vector3[2];

        const finalRotation = TmpVectors.Quaternion[0];

        const translationMatrix = TmpVectors.Matrix[0]; // T
        const translationMatrixInv = TmpVectors.Matrix[1]; // T'
        const rotationMatrix = TmpVectors.Matrix[2]; // R
        const finalMatrix = TmpVectors.Matrix[3]; // T' x R x T

        point.subtractToRef(this.position, tmpVector);
        Matrix.TranslationToRef(tmpVector.x, tmpVector.y, tmpVector.z, translationMatrix); // T
        Matrix.TranslationToRef(-tmpVector.x, -tmpVector.y, -tmpVector.z, translationMatrixInv); // T'
        Matrix.RotationAxisToRef(axis, amount, rotationMatrix); // R

        translationMatrixInv.multiplyToRef(rotationMatrix, finalMatrix); // T' x R
        finalMatrix.multiplyToRef(translationMatrix, finalMatrix);  // T' x R x T

        finalMatrix.decompose(finalScale, finalRotation, finalTranslation);

        this.position.addInPlace(finalTranslation);
        finalRotation.multiplyToRef(this.rotationQuaternion, this.rotationQuaternion);

        return this;
    }

    /**
     * Translates the mesh along the axis vector for the passed distance in the given space.
     * space (default LOCAL) can be either Space.LOCAL, either Space.WORLD.
     * @param axis the axis to translate in
     * @param distance the distance to translate
     * @param space Space to rotate in (Default: local)
     * @returns the TransformNode.
     */
    public translate(axis: Vector3, distance: number, space?: Space): TransformNode {
        var displacementVector = axis.scale(distance);
        if (!space || (space as any) === Space.LOCAL) {
            var tempV3 = this.getPositionExpressedInLocalSpace().add(displacementVector);
            this.setPositionWithLocalVector(tempV3);
        }
        else {
            this.setAbsolutePosition(this.getAbsolutePosition().add(displacementVector));
        }
        return this;
    }

    /**
     * Adds a rotation step to the mesh current rotation.
     * x, y, z are Euler angles expressed in radians.
     * This methods updates the current mesh rotation, either mesh.rotation, either mesh.rotationQuaternion if it's set.
     * This means this rotation is made in the mesh local space only.
     * It's useful to set a custom rotation order different from the BJS standard one YXZ.
     * Example : this rotates the mesh first around its local X axis, then around its local Z axis, finally around its local Y axis.
     * ```javascript
     * mesh.addRotation(x1, 0, 0).addRotation(0, 0, z2).addRotation(0, 0, y3);
     * ```
     * Note that `addRotation()` accumulates the passed rotation values to the current ones and computes the .rotation or .rotationQuaternion updated values.
     * Under the hood, only quaternions are used. So it's a little faster is you use .rotationQuaternion because it doesn't need to translate them back to Euler angles.
     * @param x Rotation to add
     * @param y Rotation to add
     * @param z Rotation to add
     * @returns the TransformNode.
     */
    public addRotation(x: number, y: number, z: number): TransformNode {
        var rotationQuaternion;
        if (this.rotationQuaternion) {
            rotationQuaternion = this.rotationQuaternion;
        }
        else {
            rotationQuaternion = TmpVectors.Quaternion[1];
            Quaternion.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, this.rotation.z, rotationQuaternion);
        }
        var accumulation = TmpVectors.Quaternion[0];
        Quaternion.RotationYawPitchRollToRef(y, x, z, accumulation);
        rotationQuaternion.multiplyInPlace(accumulation);
        if (!this.rotationQuaternion) {
            rotationQuaternion.toEulerAnglesToRef(this.rotation);
        }
        return this;
    }

    /**
     * @hidden
     */
    protected _getEffectiveParent(): Nullable<Node> {
        return this.parent;
    }

    /**
     * Computes the world matrix of the node
     * @param force defines if the cache version should be invalidated forcing the world matrix to be created from scratch
     * @returns the world matrix
     */
    public computeWorldMatrix(force?: boolean): Matrix {
        if (this._isWorldMatrixFrozen && !this._isDirty) {
            return this._worldMatrix;
        }

        let currentRenderId = this.getScene().getRenderId();
        if (!this._isDirty && !force && this.isSynchronized()) {
            this._currentRenderId = currentRenderId;
            return this._worldMatrix;
        }

        let camera = (<Camera>this.getScene().activeCamera);
        const useBillboardPosition = (this._billboardMode & TransformNode.BILLBOARDMODE_USE_POSITION) !== 0;
        const useBillboardPath = this._billboardMode !== TransformNode.BILLBOARDMODE_NONE && !this.preserveParentRotationForBillboard;

        // Billboarding based on camera position
        if (useBillboardPath && camera && useBillboardPosition) {
            this.lookAt(camera.position);

            if ((this.billboardMode & TransformNode.BILLBOARDMODE_X) !== TransformNode.BILLBOARDMODE_X) {
                this.rotation.x = 0;
            }

            if ((this.billboardMode & TransformNode.BILLBOARDMODE_Y) !== TransformNode.BILLBOARDMODE_Y) {
                this.rotation.y = 0;
            }

            if ((this.billboardMode & TransformNode.BILLBOARDMODE_Z) !== TransformNode.BILLBOARDMODE_Z) {
                this.rotation.z = 0;
            }
        }

        this._updateCache();
        // let cache = this._cache;
        // cache.pivotMatrixUpdated = false;
        // cache.billboardMode = this.billboardMode;
        // cache.infiniteDistance = this.infiniteDistance;

        this._currentRenderId = currentRenderId;
        this._childUpdateId++;
        this._isDirty = false;
        let parent = this._getEffectiveParent();

        // Scaling
        let scaling: Vector3 = this.scaling;
        let translation: Vector3 = this.position;

        // Translation
        if (this._infiniteDistance) {
            if (!this.parent && camera) {
                var cameraWorldMatrix = camera.getWorldMatrix();
                var cameraGlobalPosition = new Vector3(cameraWorldMatrix.m[12], cameraWorldMatrix.m[13], cameraWorldMatrix.m[14]);

                translation.copyFromFloats(this._position.x + cameraGlobalPosition.x, this._position.y + cameraGlobalPosition.y, this._position.z + cameraGlobalPosition.z);
            } else {
                translation.copyFrom(this._position);
            }
        } else {
            translation.copyFrom(this._position);
        }

        // Scaling
        scaling.copyFromFloats(this._scaling.x * this.scalingDeterminant, this._scaling.y * this.scalingDeterminant, this._scaling.z * this.scalingDeterminant);

        // Rotation
        let rotation: Quaternion = this._tmpRotation;
        if (this._rotationQuaternion) {
            if (this.reIntegrateRotationIntoRotationQuaternion) {
                var len = this.rotation.lengthSquared();
                if (len) {
                    this._rotationQuaternion.multiplyInPlace(Quaternion.RotationYawPitchRoll(this._rotation.y, this._rotation.x, this._rotation.z));
                    this._rotation.copyFromFloats(0, 0, 0);
                }
            }
            rotation.copyFrom(this._rotationQuaternion);
        } else {
            Quaternion.RotationYawPitchRollToRef(this._rotation.y, this._rotation.x, this._rotation.z, rotation);
        }

        // Compose
        if (this._usePivotMatrix) {
            let scaleMatrix = TmpVectors.Matrix[1];
            Matrix.ScalingToRef(scaling.x, scaling.y, scaling.z, scaleMatrix);

            // Rotation
            let rotationMatrix = TmpVectors.Matrix[0];
            rotation.toRotationMatrix(rotationMatrix);

            // Composing transformations
            this._pivotMatrix.multiplyToRef(scaleMatrix, TmpVectors.Matrix[4]);
            TmpVectors.Matrix[4].multiplyToRef(rotationMatrix, this._localMatrix);

            // Post multiply inverse of pivotMatrix
            if (this._postMultiplyPivotMatrix) {
                this._localMatrix.multiplyToRef(this._pivotMatrixInverse, this._localMatrix);
            }

            this._localMatrix.addTranslationFromFloats(translation.x, translation.y, translation.z);
        } else {
            Matrix.ComposeToRef(scaling, rotation, translation, this._localMatrix);
        }

        // Parent
        if (parent && parent.getWorldMatrix) {
            if (force) {
                parent.computeWorldMatrix();
            }
            if (useBillboardPath) {
                if (this._transformToBoneReferal) {
                    parent.getWorldMatrix().multiplyToRef(this._transformToBoneReferal.getWorldMatrix(), TmpVectors.Matrix[7]);
                } else {
                    TmpVectors.Matrix[7].copyFrom(parent.getWorldMatrix());
                }

                // Extract scaling and translation from parent
                let translation = TmpVectors.Vector3[5];
                let scale = TmpVectors.Vector3[6];
                TmpVectors.Matrix[7].decompose(scale, undefined, translation);
                Matrix.ScalingToRef(scale.x, scale.y, scale.z, TmpVectors.Matrix[7]);
                TmpVectors.Matrix[7].setTranslation(translation);

                this._localMatrix.multiplyToRef(TmpVectors.Matrix[7], this._worldMatrix);
            } else {
                if (this._transformToBoneReferal) {
                    this._localMatrix.multiplyToRef(parent.getWorldMatrix(), TmpVectors.Matrix[6]);
                    TmpVectors.Matrix[6].multiplyToRef(this._transformToBoneReferal.getWorldMatrix(), this._worldMatrix);
                } else {
                    this._localMatrix.multiplyToRef(parent.getWorldMatrix(), this._worldMatrix);
                }
            }
            this._markSyncedWithParent();
        } else {
            this._worldMatrix.copyFrom(this._localMatrix);
        }

        // Billboarding based on camera orientation (testing PG:http://www.babylonjs-playground.com/#UJEIL#13)
        if (useBillboardPath && camera && this.billboardMode && !useBillboardPosition) {
            let storedTranslation = TmpVectors.Vector3[0];
                this._worldMatrix.getTranslationToRef(storedTranslation); // Save translation

                // Cancel camera rotation
                TmpVectors.Matrix[1].copyFrom(camera.getViewMatrix());
                TmpVectors.Matrix[1].setTranslationFromFloats(0, 0, 0);
                TmpVectors.Matrix[1].invertToRef(TmpVectors.Matrix[0]);

                if ((this.billboardMode & TransformNode.BILLBOARDMODE_ALL) !== TransformNode.BILLBOARDMODE_ALL) {
                    TmpVectors.Matrix[0].decompose(undefined, TmpVectors.Quaternion[0], undefined);
                    let eulerAngles = TmpVectors.Vector3[1];
                    TmpVectors.Quaternion[0].toEulerAnglesToRef(eulerAngles);

                    if ((this.billboardMode & TransformNode.BILLBOARDMODE_X) !== TransformNode.BILLBOARDMODE_X) {
                        eulerAngles.x = 0;
                    }

                    if ((this.billboardMode & TransformNode.BILLBOARDMODE_Y) !== TransformNode.BILLBOARDMODE_Y) {
                        eulerAngles.y = 0;
                    }

                    if ((this.billboardMode & TransformNode.BILLBOARDMODE_Z) !== TransformNode.BILLBOARDMODE_Z) {
                        eulerAngles.z = 0;
                    }

                    Matrix.RotationYawPitchRollToRef(eulerAngles.y, eulerAngles.x, eulerAngles.z, TmpVectors.Matrix[0]);
                }
                this._worldMatrix.setTranslationFromFloats(0, 0, 0);
                this._worldMatrix.multiplyToRef(TmpVectors.Matrix[0], this._worldMatrix);

                // Restore translation
                this._worldMatrix.setTranslation(TmpVectors.Vector3[0]);
        }

        // Normal matrix
        if (!this.ignoreNonUniformScaling) {
            if (this._scaling.isNonUniformWithinEpsilon(0.000001)) {
                this._updateNonUniformScalingState(true);
            } else if (parent && (<TransformNode>parent)._nonUniformScaling) {
                this._updateNonUniformScalingState((<TransformNode>parent)._nonUniformScaling);
            } else {
                this._updateNonUniformScalingState(false);
            }
        } else {
            this._updateNonUniformScalingState(false);
        }

        this._afterComputeWorldMatrix();

        // Absolute position
        this._absolutePosition.copyFromFloats(this._worldMatrix.m[12], this._worldMatrix.m[13], this._worldMatrix.m[14]);
        this._isAbsoluteSynced = false;

        // Callbacks
        this.onAfterWorldMatrixUpdateObservable.notifyObservers(this);

        if (!this._poseMatrix) {
            this._poseMatrix = Matrix.Invert(this._worldMatrix);
        }

        // Cache the determinant
        this._worldMatrixDeterminantIsDirty = true;

        return this._worldMatrix;
    }

    /**
     * Resets this nodeTransform's local matrix to Matrix.Identity().
     * @param independentOfChildren indicates if all child nodeTransform's world-space transform should be preserved.
     */
    public resetLocalMatrix(independentOfChildren : boolean = true): void
    {
        this.computeWorldMatrix();
        if (independentOfChildren) {
            let children = this.getChildren();
            for (let i = 0; i < children.length; ++i) {
                let child = children[i] as TransformNode;
                if (child) {
                    child.computeWorldMatrix();
                    let bakedMatrix = TmpVectors.Matrix[0];
                    child._localMatrix.multiplyToRef(this._localMatrix, bakedMatrix);
                    let tmpRotationQuaternion = TmpVectors.Quaternion[0];
                    bakedMatrix.decompose(child.scaling, tmpRotationQuaternion, child.position);
                    if (child.rotationQuaternion) {
                        child.rotationQuaternion = tmpRotationQuaternion;
                    } else {
                        tmpRotationQuaternion.toEulerAnglesToRef(child.rotation);
                    }
                }
            }
        }
        this.scaling.copyFromFloats(1, 1, 1);
        this.position.copyFromFloats(0, 0, 0);
        this.rotation.copyFromFloats(0, 0, 0);

        //only if quaternion is already set
        if (this.rotationQuaternion) {
            this.rotationQuaternion = Quaternion.Identity();
        }
        this._worldMatrix = Matrix.Identity();
    }

    protected _afterComputeWorldMatrix(): void {
    }

    /**
    * If you'd like to be called back after the mesh position, rotation or scaling has been updated.
    * @param func callback function to add
    *
    * @returns the TransformNode.
    */
    public registerAfterWorldMatrixUpdate(func: (mesh: TransformNode) => void): TransformNode {
        this.onAfterWorldMatrixUpdateObservable.add(func);
        return this;
    }

    /**
     * Removes a registered callback function.
     * @param func callback function to remove
     * @returns the TransformNode.
     */
    public unregisterAfterWorldMatrixUpdate(func: (mesh: TransformNode) => void): TransformNode {
        this.onAfterWorldMatrixUpdateObservable.removeCallback(func);
        return this;
    }

    /**
     * Gets the position of the current mesh in camera space
     * @param camera defines the camera to use
     * @returns a position
     */
    public getPositionInCameraSpace(camera: Nullable<Camera> = null): Vector3 {
        if (!camera) {
            camera = (<Camera>this.getScene().activeCamera);
        }

        return Vector3.TransformCoordinates(this.getAbsolutePosition(), camera.getViewMatrix());
    }

    /**
     * Returns the distance from the mesh to the active camera
     * @param camera defines the camera to use
     * @returns the distance
     */
    public getDistanceToCamera(camera: Nullable<Camera> = null): number {
        if (!camera) {
            camera = (<Camera>this.getScene().activeCamera);
        }
        return this.getAbsolutePosition().subtract(camera.globalPosition).length();
    }

    /**
     * Clone the current transform node
     * @param name Name of the new clone
     * @param newParent New parent for the clone
     * @param doNotCloneChildren Do not clone children hierarchy
     * @returns the new transform node
     */
    public clone(name: string, newParent: Nullable<Node>, doNotCloneChildren?: boolean) : Nullable<TransformNode> {
        var result = SerializationHelper.Clone(() => new TransformNode(name, this.getScene()), this);

        result.name = name;
        result.id = name;

        if (newParent) {
            result.parent = newParent;
        }

        if (!doNotCloneChildren) {
            // Children
            let directDescendants = this.getDescendants(true);
            for (let index = 0; index < directDescendants.length; index++) {
                var child = directDescendants[index];

                if ((<any>child).clone) {
                    (<any>child).clone(name + "." + child.name, result);
                }
            }
        }

        return result;
    }

    /**
     * Serializes the objects information.
     * @param currentSerializationObject defines the object to serialize in
     * @returns the serialized object
     */
    public serialize(currentSerializationObject?: any): any {
        let serializationObject = SerializationHelper.Serialize(this, currentSerializationObject);
        serializationObject.type = this.getClassName();

        // Parent
        if (this.parent) {
            serializationObject.parentId = this.parent.id;
        }

        serializationObject.localMatrix = this.getPivotMatrix().asArray();

        serializationObject.isEnabled = this.isEnabled();

        // Parent
        if (this.parent) {
            serializationObject.parentId = this.parent.id;
        }

        return serializationObject;
    }

    // Statics
    /**
     * Returns a new TransformNode object parsed from the source provided.
     * @param parsedTransformNode is the source.
     * @param scene the scne the object belongs to
     * @param rootUrl is a string, it's the root URL to prefix the `delayLoadingFile` property with
     * @returns a new TransformNode object parsed from the source provided.
     */
    public static Parse(parsedTransformNode: any, scene: Scene, rootUrl: string): TransformNode {
        var transformNode = SerializationHelper.Parse(() => new TransformNode(parsedTransformNode.name, scene), parsedTransformNode, scene, rootUrl);

        if (parsedTransformNode.localMatrix) {
            transformNode.setPreTransformMatrix(Matrix.FromArray(parsedTransformNode.localMatrix));
        } else if (parsedTransformNode.pivotMatrix) {
            transformNode.setPivotMatrix(Matrix.FromArray(parsedTransformNode.pivotMatrix));
        }

        transformNode.setEnabled(parsedTransformNode.isEnabled);

        // Parent
        if (parsedTransformNode.parentId) {
            transformNode._waitingParentId = parsedTransformNode.parentId;
        }

        return transformNode;
    }

    /**
     * Get all child-transformNodes of this node
     * @param directDescendantsOnly defines if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered
     * @param predicate defines an optional predicate that will be called on every evaluated child, the predicate must return true for a given child to be part of the result, otherwise it will be ignored
     * @returns an array of TransformNode
     */
    public getChildTransformNodes(directDescendantsOnly?: boolean, predicate?: (node: Node) => boolean): TransformNode[] {
        var results: Array<TransformNode> = [];
        this._getDescendants(results, directDescendantsOnly, (node: Node) => {
            return ((!predicate || predicate(node)) && (node instanceof TransformNode));
        });
        return results;
    }

    /**
     * Releases resources associated with this transform node.
     * @param doNotRecurse Set to true to not recurse into each children (recurse into each children by default)
     * @param disposeMaterialAndTextures Set to true to also dispose referenced materials and textures (false by default)
     */
    public dispose(doNotRecurse?: boolean, disposeMaterialAndTextures = false): void {
        // Animations
        this.getScene().stopAnimation(this);

        // Remove from scene
        this.getScene().removeTransformNode(this);

        this.onAfterWorldMatrixUpdateObservable.clear();

        if (doNotRecurse) {
            const transformNodes = this.getChildTransformNodes(true);
            for (const transformNode of transformNodes) {
                transformNode.parent = null;
                transformNode.computeWorldMatrix(true);
            }
        }

        super.dispose(doNotRecurse, disposeMaterialAndTextures);
    }

    /**
     * Uniformly scales the mesh to fit inside of a unit cube (1 X 1 X 1 units)
     * @param includeDescendants Use the hierarchy's bounding box instead of the mesh's bounding box. Default is false
     * @param ignoreRotation ignore rotation when computing the scale (ie. object will be axis aligned). Default is false
     * @param predicate predicate that is passed in to getHierarchyBoundingVectors when selecting which object should be included when scaling
     * @returns the current mesh
     */
    public normalizeToUnitCube(includeDescendants = true, ignoreRotation = false, predicate?: Nullable<(node: AbstractMesh) => boolean>): TransformNode {
        let storedRotation: Nullable<Vector3> = null;
        let storedRotationQuaternion: Nullable<Quaternion> = null;

        if (ignoreRotation) {
            if (this.rotationQuaternion) {
                storedRotationQuaternion = this.rotationQuaternion.clone();
                this.rotationQuaternion.copyFromFloats(0, 0, 0, 1);
            } else if (this.rotation) {
                storedRotation = this.rotation.clone();
                this.rotation.copyFromFloats(0, 0, 0);
            }
        }

        let boundingVectors = this.getHierarchyBoundingVectors(includeDescendants, predicate);
        let sizeVec = boundingVectors.max.subtract(boundingVectors.min);
        let maxDimension = Math.max(sizeVec.x, sizeVec.y, sizeVec.z);

        if (maxDimension === 0) {
            return this;
        }

        let scale = 1 / maxDimension;

        this.scaling.scaleInPlace(scale);

        if (ignoreRotation) {
            if (this.rotationQuaternion && storedRotationQuaternion) {
                this.rotationQuaternion.copyFrom(storedRotationQuaternion);
            } else if (this.rotation && storedRotation) {
                this.rotation.copyFrom(storedRotation);
            }
        }

        return this;
    }

    private _syncAbsoluteScalingAndRotation(): void {
        if (!this._isAbsoluteSynced) {
            this._worldMatrix.decompose(this._absoluteScaling, this._absoluteRotationQuaternion);
            this._isAbsoluteSynced = true;
        }
    }
}
