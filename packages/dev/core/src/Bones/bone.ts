import type { Skeleton } from "./skeleton";
import { Vector3, Quaternion, Matrix, TmpVectors } from "../Maths/math.vector";
import { ArrayTools } from "../Misc/arrayTools";
import type { Nullable } from "../types";
import type { TransformNode } from "../Meshes/transformNode";
import { Node } from "../node";
import { Space } from "../Maths/math.axis";

import type { Animation } from "../Animations/animation";
import type { AnimationPropertiesOverride } from "../Animations/animationPropertiesOverride";

/**
 * Class used to store bone information
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/bonesSkeletons
 */
export class Bone extends Node {
    private static _TmpVecs: Vector3[] = ArrayTools.BuildArray(2, Vector3.Zero);
    private static _TmpQuat = Quaternion.Identity();
    private static _TmpMats: Matrix[] = ArrayTools.BuildArray(5, Matrix.Identity);

    /**
     * Gets the list of child bones
     */
    public children: Bone[] = [];

    /** Gets the animations associated with this bone */
    public animations: Animation[] = [];

    /**
     * Gets or sets bone length
     */
    public length: number;

    /**
     * @internal Internal only
     * Set this value to map this bone to a different index in the transform matrices
     * Set this value to -1 to exclude the bone from the transform matrices
     */
    public _index: Nullable<number> = null;

    private _skeleton: Skeleton;
    private _localMatrix: Matrix; // transformation of the bone, in local space
    private _absoluteMatrix: Matrix; // transformation of the bone, in world space (relative to the skeleton root)
    private _bindMatrix: Matrix; // the bind matrix, in local space
    private _absoluteBindMatrix: Matrix; // the bind matrix, in world space (relative to the skeleton root)
    private _absoluteInverseBindMatrix: Matrix; // the inverse of the bind matrix, in world space (relative to the skeleton root)
    private _finalMatrix: Matrix; // the final matrix used to transform vertices of the mesh according to the bone, in world space (relative to the skeleton root). It is the multiplication of _absoluteInverseBindMatrix with _absoluteMatrix.
    private _restMatrix: Matrix; // a matrix for the exclusive use of the end user (not used internally by the framework), in local space
    private _scalingDeterminant = 1;

    private _localScaling: Vector3;
    private _localRotation: Quaternion;
    private _localPosition: Vector3;
    private _needToDecompose = true;
    private _needToCompose = false;

    /** @internal */
    public _linkedTransformNode: Nullable<TransformNode> = null;

    /** @internal */
    public _waitingTransformNodeId: Nullable<string> = null;

    /** @internal */
    get _matrix(): Matrix {
        this._compose();
        return this._localMatrix;
    }

    /** @internal */
    set _matrix(value: Matrix) {
        // skip if the matrices are the same
        if (value.updateFlag === this._localMatrix.updateFlag && !this._needToCompose) {
            return;
        }

        this._needToCompose = false; // in case there was a pending compose

        this._localMatrix.copyFrom(value);
        this._markAsDirtyAndDecompose();
    }

    /**
     * Create a new bone
     * @param name defines the bone name
     * @param skeleton defines the parent skeleton
     * @param parentBone defines the parent (can be null if the bone is the root)
     * @param localMatrix defines the local matrix (default: identity)
     * @param restMatrix defines the rest matrix (default: localMatrix)
     * @param bindMatrix defines the bind matrix (default: localMatrix)
     * @param index defines index of the bone in the hierarchy (default: null)
     */
    constructor(
        /**
         * defines the bone name
         */
        public name: string,
        skeleton: Skeleton,
        parentBone: Nullable<Bone> = null,
        localMatrix: Nullable<Matrix> = null,
        restMatrix: Nullable<Matrix> = null,
        bindMatrix: Nullable<Matrix> = null,
        index: Nullable<number> = null
    ) {
        super(name, skeleton.getScene());
        this._skeleton = skeleton;
        this._localMatrix = localMatrix?.clone() ?? Matrix.Identity();
        this._restMatrix = restMatrix ?? this._localMatrix.clone();
        this._bindMatrix = bindMatrix ?? this._localMatrix.clone();
        this._index = index;

        this._absoluteMatrix = new Matrix();
        this._absoluteBindMatrix = new Matrix();
        this._absoluteInverseBindMatrix = new Matrix();
        this._finalMatrix = new Matrix();

        skeleton.bones.push(this);

        this.setParent(parentBone, false);

        this._updateAbsoluteBindMatrices();
    }

    /**
     * Gets the current object class name.
     * @returns the class name
     */
    public getClassName(): string {
        return "Bone";
    }

    // Members

    /**
     * Gets the parent skeleton
     * @returns a skeleton
     */
    public getSkeleton(): Skeleton {
        return this._skeleton;
    }

    public get parent(): Bone {
        return this._parentNode as Bone;
    }

    /**
     * Gets parent bone
     * @returns a bone or null if the bone is the root of the bone hierarchy
     */
    public getParent(): Nullable<Bone> {
        return this.parent;
    }

    /**
     * Returns an array containing the children of the bone
     * @returns an array containing the children of the bone (can be empty if the bone has no children)
     */
    public getChildren(): Array<Bone> {
        return this.children;
    }

    /**
     * Gets the node index in matrix array generated for rendering
     * @returns the node index
     */
    public getIndex(): number {
        return this._index === null ? this.getSkeleton().bones.indexOf(this) : this._index;
    }

    public set parent(newParent: Nullable<Bone>) {
        this.setParent(newParent);
    }

    /**
     * Sets the parent bone
     * @param parent defines the parent (can be null if the bone is the root)
     * @param updateAbsoluteBindMatrices defines if the absolute bind and absolute inverse bind matrices must be updated
     */
    public setParent(parent: Nullable<Bone>, updateAbsoluteBindMatrices: boolean = true): void {
        if (this.parent === parent) {
            return;
        }

        if (this.parent) {
            const index = this.parent.children.indexOf(this);
            if (index !== -1) {
                this.parent.children.splice(index, 1);
            }
        }

        this._parentNode = parent;

        if (this.parent) {
            this.parent.children.push(this);
        }

        if (updateAbsoluteBindMatrices) {
            this._updateAbsoluteBindMatrices();
        }

        this.markAsDirty();
    }

    /**
     * Gets the local matrix
     * @returns the local matrix
     */
    public getLocalMatrix(): Matrix {
        this._compose();
        return this._localMatrix;
    }

    /**
     * Gets the bind matrix
     * @returns the bind matrix
     */
    public getBindMatrix(): Matrix {
        return this._bindMatrix;
    }

    /**
     * Gets the bind matrix.
     * @returns the bind matrix
     * @deprecated Please use getBindMatrix instead
     */
    public getBaseMatrix(): Matrix {
        return this.getBindMatrix();
    }

    /**
     * Gets the rest matrix
     * @returns the rest matrix
     */
    public getRestMatrix(): Matrix {
        return this._restMatrix;
    }

    /**
     * Gets the rest matrix
     * @returns the rest matrix
     * @deprecated Please use getRestMatrix instead
     */
    public getRestPose(): Matrix {
        return this.getRestMatrix();
    }

    /**
     * Sets the rest matrix
     * @param matrix the local-space rest matrix to set for this bone
     */
    public setRestMatrix(matrix: Matrix): void {
        this._restMatrix.copyFrom(matrix);
    }

    /**
     * Sets the rest matrix
     * @param matrix the local-space rest to set for this bone
     * @deprecated Please use setRestMatrix instead
     */
    public setRestPose(matrix: Matrix): void {
        this.setRestMatrix(matrix);
    }

    /**
     * Gets the bind matrix
     * @returns the bind matrix
     * @deprecated Please use getBindMatrix instead
     */
    public getBindPose(): Matrix {
        return this.getBindMatrix();
    }

    /**
     * Sets the bind matrix
     * This will trigger a recomputation of the absolute bind and absolute inverse bind matrices for this bone and its children
     * Note that the local matrix will also be set with the matrix passed in parameter!
     * @param matrix the local-space bind matrix to set for this bone
     */
    public setBindMatrix(matrix: Matrix): void {
        this.updateMatrix(matrix);
    }

    /**
     * Sets the bind matrix
     * @param matrix the local-space bind to set for this bone
     * @deprecated Please use setBindMatrix instead
     */
    public setBindPose(matrix: Matrix): void {
        this.setBindMatrix(matrix);
    }

    /**
     * Gets the matrix used to store the final world transformation of the bone (ie. the matrix sent to shaders)
     * @returns the final world matrix
     */
    public getFinalMatrix(): Matrix {
        return this._finalMatrix;
    }

    /**
     * Gets the matrix used to store the final world transformation of the bone (ie. the matrix sent to shaders)
     * @deprecated Please use getFinalMatrix instead
     * @returns the final world matrix
     */
    public getWorldMatrix(): Matrix {
        return this.getFinalMatrix();
    }

    /**
     * Sets the local matrix to the rest matrix
     */
    public returnToRest(): void {
        if (this._linkedTransformNode) {
            const localScaling = TmpVectors.Vector3[0];
            const localRotation = TmpVectors.Quaternion[0];
            const localPosition = TmpVectors.Vector3[1];

            this.getRestMatrix().decompose(localScaling, localRotation, localPosition);

            this._linkedTransformNode.position.copyFrom(localPosition);
            this._linkedTransformNode.rotationQuaternion = this._linkedTransformNode.rotationQuaternion ?? Quaternion.Identity();
            this._linkedTransformNode.rotationQuaternion.copyFrom(localRotation);
            this._linkedTransformNode.scaling.copyFrom(localScaling);
        } else {
            this._matrix = this._restMatrix;
        }
    }

    /**
     * Gets the inverse of the bind matrix, in world space (relative to the skeleton root)
     * @returns the inverse bind matrix, in world space
     */
    public getAbsoluteInverseBindMatrix(): Matrix {
        return this._absoluteInverseBindMatrix;
    }

    /**
     * Gets the inverse of the bind matrix, in world space (relative to the skeleton root)
     * @returns the inverse bind matrix, in world space
     * @deprecated Please use getAbsoluteInverseBindMatrix instead
     */
    public getInvertedAbsoluteTransform(): Matrix {
        return this.getAbsoluteInverseBindMatrix();
    }

    /**
     * Gets the bone matrix, in world space (relative to the skeleton root)
     * @returns the bone matrix, in world space
     */
    public getAbsoluteMatrix(): Matrix {
        return this._absoluteMatrix;
    }

    /**
     * Gets the bone matrix, in world space (relative to the skeleton root)
     * @returns the bone matrix, in world space
     * @deprecated Please use getAbsoluteMatrix instead
     */
    public getAbsoluteTransform(): Matrix {
        return this._absoluteMatrix;
    }

    /**
     * Links with the given transform node.
     * The local matrix of this bone is overwritten by the transform of the node every frame.
     * @param transformNode defines the transform node to link to
     */
    public linkTransformNode(transformNode: Nullable<TransformNode>): void {
        if (this._linkedTransformNode) {
            this._skeleton._numBonesWithLinkedTransformNode--;
        }

        this._linkedTransformNode = transformNode;

        if (this._linkedTransformNode) {
            this._skeleton._numBonesWithLinkedTransformNode++;
        }
    }

    // Properties (matches TransformNode properties)

    /**
     * Gets the node used to drive the bone's transformation
     * @returns a transform node or null
     */
    public getTransformNode() {
        return this._linkedTransformNode;
    }

    /** Gets or sets current position (in local space) */
    public get position(): Vector3 {
        this._decompose();
        return this._localPosition;
    }

    public set position(newPosition: Vector3) {
        this._decompose();
        this._localPosition.copyFrom(newPosition);

        this._markAsDirtyAndCompose();
    }

    /** Gets or sets current rotation (in local space) */
    public get rotation(): Vector3 {
        return this.getRotation();
    }

    public set rotation(newRotation: Vector3) {
        this.setRotation(newRotation);
    }

    /** Gets or sets current rotation quaternion (in local space) */
    public get rotationQuaternion() {
        this._decompose();
        return this._localRotation;
    }

    public set rotationQuaternion(newRotation: Quaternion) {
        this.setRotationQuaternion(newRotation);
    }

    /** Gets or sets current scaling (in local space) */
    public get scaling(): Vector3 {
        return this.getScale();
    }

    public set scaling(newScaling: Vector3) {
        this.setScale(newScaling);
    }

    /**
     * Gets the animation properties override
     */
    public get animationPropertiesOverride(): Nullable<AnimationPropertiesOverride> {
        return this._skeleton.animationPropertiesOverride;
    }

    // Methods
    private _decompose() {
        if (!this._needToDecompose) {
            return;
        }

        this._needToDecompose = false;

        if (!this._localScaling) {
            this._localScaling = Vector3.Zero();
            this._localRotation = Quaternion.Zero();
            this._localPosition = Vector3.Zero();
        }
        this._localMatrix.decompose(this._localScaling, this._localRotation, this._localPosition);
    }

    private _compose() {
        if (!this._needToCompose) {
            return;
        }

        if (!this._localScaling) {
            this._needToCompose = false;
            return;
        }

        this._needToCompose = false;
        Matrix.ComposeToRef(this._localScaling, this._localRotation, this._localPosition, this._localMatrix);
    }

    /**
     * Update the bind (and optionally the local) matrix
     * @param bindMatrix defines the new matrix to set to the bind/local matrix, in local space
     * @param updateAbsoluteBindMatrices defines if the absolute bind and absolute inverse bind matrices must be recomputed (default: true)
     * @param updateLocalMatrix defines if the local matrix should also be updated with the matrix passed in parameter (default: true)
     */
    public updateMatrix(bindMatrix: Matrix, updateAbsoluteBindMatrices = true, updateLocalMatrix = true): void {
        this._bindMatrix.copyFrom(bindMatrix);

        if (updateAbsoluteBindMatrices) {
            this._updateAbsoluteBindMatrices();
        }

        if (updateLocalMatrix) {
            this._matrix = bindMatrix;
        } else {
            this.markAsDirty();
        }
    }

    /**
     * @internal
     */
    public _updateAbsoluteBindMatrices(bindMatrix?: Matrix, updateChildren = true): void {
        if (!bindMatrix) {
            bindMatrix = this._bindMatrix;
        }

        if (this.parent) {
            bindMatrix.multiplyToRef(this.parent._absoluteBindMatrix, this._absoluteBindMatrix);
        } else {
            this._absoluteBindMatrix.copyFrom(bindMatrix);
        }

        this._absoluteBindMatrix.invertToRef(this._absoluteInverseBindMatrix);

        if (updateChildren) {
            for (let index = 0; index < this.children.length; index++) {
                this.children[index]._updateAbsoluteBindMatrices();
            }
        }

        this._scalingDeterminant = this._absoluteBindMatrix.determinant() < 0 ? -1 : 1;
    }

    /**
     * Flag the bone as dirty (Forcing it to update everything)
     * @returns this bone
     */
    public markAsDirty(): Bone {
        this._currentRenderId++;
        this._childUpdateId++;
        this._skeleton._markAsDirty();
        return this;
    }

    /** @internal */
    public _markAsDirtyAndCompose() {
        this.markAsDirty();
        this._needToCompose = true;
    }

    private _markAsDirtyAndDecompose() {
        this.markAsDirty();
        this._needToDecompose = true;
    }

    private _updatePosition(vec: Vector3, space = Space.LOCAL, tNode?: TransformNode, translationMode = true): void {
        const lm = this.getLocalMatrix();

        if (space == Space.LOCAL) {
            if (translationMode) {
                lm.addAtIndex(12, vec.x);
                lm.addAtIndex(13, vec.y);
                lm.addAtIndex(14, vec.z);
            } else {
                lm.setTranslationFromFloats(vec.x, vec.y, vec.z);
            }
        } else {
            let wm: Nullable<Matrix> = null;

            //tNode.getWorldMatrix() needs to be called before skeleton.computeAbsoluteMatrices()
            if (tNode) {
                wm = tNode.getWorldMatrix();
            }

            this._skeleton.computeAbsoluteMatrices();

            const tmat = Bone._TmpMats[0];
            const tvec = Bone._TmpVecs[0];

            if (this.parent) {
                if (tNode && wm) {
                    tmat.copyFrom(this.parent.getAbsoluteMatrix());
                    tmat.multiplyToRef(wm, tmat);
                } else {
                    tmat.copyFrom(this.parent.getAbsoluteMatrix());
                }
            } else {
                Matrix.IdentityToRef(tmat);
            }

            if (translationMode) {
                tmat.setTranslationFromFloats(0, 0, 0);
            }
            tmat.invert();
            Vector3.TransformCoordinatesToRef(vec, tmat, tvec);

            if (translationMode) {
                lm.addAtIndex(12, tvec.x);
                lm.addAtIndex(13, tvec.y);
                lm.addAtIndex(14, tvec.z);
            } else {
                lm.setTranslationFromFloats(tvec.x, tvec.y, tvec.z);
            }
        }

        this._markAsDirtyAndDecompose();
    }

    /**
     * Translate the bone in local or world space
     * @param vec The amount to translate the bone
     * @param space The space that the translation is in (default: Space.LOCAL)
     * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
     */
    public translate(vec: Vector3, space = Space.LOCAL, tNode?: TransformNode): void {
        this._updatePosition(vec, space, tNode, true);
    }

    /**
     * Set the position of the bone in local or world space
     * @param position The position to set the bone
     * @param space The space that the position is in (default: Space.LOCAL)
     * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
     */
    public setPosition(position: Vector3, space = Space.LOCAL, tNode?: TransformNode): void {
        this._updatePosition(position, space, tNode, false);
    }

    /**
     * Set the absolute position of the bone (world space)
     * @param position The position to set the bone
     * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
     */
    public setAbsolutePosition(position: Vector3, tNode?: TransformNode) {
        this.setPosition(position, Space.WORLD, tNode);
    }

    /**
     * Scale the bone on the x, y and z axes (in local space)
     * @param x The amount to scale the bone on the x axis
     * @param y The amount to scale the bone on the y axis
     * @param z The amount to scale the bone on the z axis
     * @param scaleChildren sets this to true if children of the bone should be scaled as well (false by default)
     */
    public scale(x: number, y: number, z: number, scaleChildren = false): void {
        const locMat = this.getLocalMatrix();

        // Apply new scaling on top of current local matrix
        const scaleMat = Bone._TmpMats[0];
        Matrix.ScalingToRef(x, y, z, scaleMat);
        scaleMat.multiplyToRef(locMat, locMat);

        // Invert scaling matrix and apply the inverse to all children
        scaleMat.invert();

        for (const child of this.children) {
            const cm = child.getLocalMatrix();
            cm.multiplyToRef(scaleMat, cm);
            cm.multiplyAtIndex(12, x);
            cm.multiplyAtIndex(13, y);
            cm.multiplyAtIndex(14, z);

            child._markAsDirtyAndDecompose();
        }

        this._markAsDirtyAndDecompose();

        if (scaleChildren) {
            for (const child of this.children) {
                child.scale(x, y, z, scaleChildren);
            }
        }
    }

    /**
     * Set the bone scaling in local space
     * @param scale defines the scaling vector
     */
    public setScale(scale: Vector3): void {
        this._decompose();
        this._localScaling.copyFrom(scale);
        this._markAsDirtyAndCompose();
    }

    /**
     * Gets the current scaling in local space
     * @returns the current scaling vector
     */
    public getScale(): Vector3 {
        this._decompose();
        return this._localScaling;
    }

    /**
     * Gets the current scaling in local space and stores it in a target vector
     * @param result defines the target vector
     */
    public getScaleToRef(result: Vector3) {
        this._decompose();
        result.copyFrom(this._localScaling);
    }

    /**
     * Set the yaw, pitch, and roll of the bone in local or world space
     * @param yaw The rotation of the bone on the y axis
     * @param pitch The rotation of the bone on the x axis
     * @param roll The rotation of the bone on the z axis
     * @param space The space that the axes of rotation are in
     * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
     */
    public setYawPitchRoll(yaw: number, pitch: number, roll: number, space = Space.LOCAL, tNode?: TransformNode): void {
        if (space === Space.LOCAL) {
            const quat = Bone._TmpQuat;
            Quaternion.RotationYawPitchRollToRef(yaw, pitch, roll, quat);
            this.setRotationQuaternion(quat, space, tNode);
            return;
        }

        const rotMatInv = Bone._TmpMats[0];
        if (!this._getAbsoluteInverseMatrixUnscaledToRef(rotMatInv, tNode)) {
            return;
        }

        const rotMat = Bone._TmpMats[1];
        Matrix.RotationYawPitchRollToRef(yaw, pitch, roll, rotMat);

        rotMatInv.multiplyToRef(rotMat, rotMat);
        this._rotateWithMatrix(rotMat, space, tNode);
    }

    /**
     * Add a rotation to the bone on an axis in local or world space
     * @param axis The axis to rotate the bone on
     * @param amount The amount to rotate the bone
     * @param space The space that the axis is in
     * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
     */
    public rotate(axis: Vector3, amount: number, space = Space.LOCAL, tNode?: TransformNode): void {
        const rmat = Bone._TmpMats[0];
        rmat.setTranslationFromFloats(0, 0, 0);
        Matrix.RotationAxisToRef(axis, amount, rmat);
        this._rotateWithMatrix(rmat, space, tNode);
    }

    /**
     * Set the rotation of the bone to a particular axis angle in local or world space
     * @param axis The axis to rotate the bone on
     * @param angle The angle that the bone should be rotated to
     * @param space The space that the axis is in
     * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
     */
    public setAxisAngle(axis: Vector3, angle: number, space = Space.LOCAL, tNode?: TransformNode): void {
        if (space === Space.LOCAL) {
            const quat = Bone._TmpQuat;
            Quaternion.RotationAxisToRef(axis, angle, quat);

            this.setRotationQuaternion(quat, space, tNode);
            return;
        }

        const rotMatInv = Bone._TmpMats[0];
        if (!this._getAbsoluteInverseMatrixUnscaledToRef(rotMatInv, tNode)) {
            return;
        }

        const rotMat = Bone._TmpMats[1];
        Matrix.RotationAxisToRef(axis, angle, rotMat);

        rotMatInv.multiplyToRef(rotMat, rotMat);
        this._rotateWithMatrix(rotMat, space, tNode);
    }

    /**
     * Set the euler rotation of the bone in local or world space
     * @param rotation The euler rotation that the bone should be set to
     * @param space The space that the rotation is in
     * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
     */
    public setRotation(rotation: Vector3, space = Space.LOCAL, tNode?: TransformNode): void {
        this.setYawPitchRoll(rotation.y, rotation.x, rotation.z, space, tNode);
    }

    /**
     * Set the quaternion rotation of the bone in local or world space
     * @param quat The quaternion rotation that the bone should be set to
     * @param space The space that the rotation is in
     * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
     */
    public setRotationQuaternion(quat: Quaternion, space = Space.LOCAL, tNode?: TransformNode): void {
        if (space === Space.LOCAL) {
            this._decompose();
            this._localRotation.copyFrom(quat);

            this._markAsDirtyAndCompose();

            return;
        }

        const rotMatInv = Bone._TmpMats[0];
        if (!this._getAbsoluteInverseMatrixUnscaledToRef(rotMatInv, tNode)) {
            return;
        }

        const rotMat = Bone._TmpMats[1];
        Matrix.FromQuaternionToRef(quat, rotMat);

        rotMatInv.multiplyToRef(rotMat, rotMat);

        this._rotateWithMatrix(rotMat, space, tNode);
    }

    /**
     * Set the rotation matrix of the bone in local or world space
     * @param rotMat The rotation matrix that the bone should be set to
     * @param space The space that the rotation is in
     * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
     */
    public setRotationMatrix(rotMat: Matrix, space = Space.LOCAL, tNode?: TransformNode): void {
        if (space === Space.LOCAL) {
            const quat = Bone._TmpQuat;
            Quaternion.FromRotationMatrixToRef(rotMat, quat);
            this.setRotationQuaternion(quat, space, tNode);
            return;
        }

        const rotMatInv = Bone._TmpMats[0];
        if (!this._getAbsoluteInverseMatrixUnscaledToRef(rotMatInv, tNode)) {
            return;
        }

        const rotMat2 = Bone._TmpMats[1];
        rotMat2.copyFrom(rotMat);

        rotMatInv.multiplyToRef(rotMat, rotMat2);

        this._rotateWithMatrix(rotMat2, space, tNode);
    }

    private _rotateWithMatrix(rmat: Matrix, space = Space.LOCAL, tNode?: TransformNode): void {
        const lmat = this.getLocalMatrix();
        const lx = lmat.m[12];
        const ly = lmat.m[13];
        const lz = lmat.m[14];
        const parent = this.getParent();
        const parentScale = Bone._TmpMats[3];
        const parentScaleInv = Bone._TmpMats[4];

        if (parent && space == Space.WORLD) {
            if (tNode) {
                parentScale.copyFrom(tNode.getWorldMatrix());
                parent.getAbsoluteMatrix().multiplyToRef(parentScale, parentScale);
            } else {
                parentScale.copyFrom(parent.getAbsoluteMatrix());
            }
            parentScaleInv.copyFrom(parentScale);
            parentScaleInv.invert();
            lmat.multiplyToRef(parentScale, lmat);
            lmat.multiplyToRef(rmat, lmat);
            lmat.multiplyToRef(parentScaleInv, lmat);
        } else {
            if (space == Space.WORLD && tNode) {
                parentScale.copyFrom(tNode.getWorldMatrix());
                parentScaleInv.copyFrom(parentScale);
                parentScaleInv.invert();
                lmat.multiplyToRef(parentScale, lmat);
                lmat.multiplyToRef(rmat, lmat);
                lmat.multiplyToRef(parentScaleInv, lmat);
            } else {
                lmat.multiplyToRef(rmat, lmat);
            }
        }

        lmat.setTranslationFromFloats(lx, ly, lz);

        this.computeAbsoluteMatrices();
        this._markAsDirtyAndDecompose();
    }

    private _getAbsoluteInverseMatrixUnscaledToRef(rotMatInv: Matrix, tNode?: TransformNode): boolean {
        const scaleMatrix = Bone._TmpMats[2];
        rotMatInv.copyFrom(this.getAbsoluteMatrix());

        if (tNode) {
            rotMatInv.multiplyToRef(tNode.getWorldMatrix(), rotMatInv);
            Matrix.ScalingToRef(tNode.scaling.x, tNode.scaling.y, tNode.scaling.z, scaleMatrix);
        } else {
            Matrix.IdentityToRef(scaleMatrix);
        }

        rotMatInv.invert();
        if (isNaN(rotMatInv.m[0])) {
            // Matrix failed to invert.
            // This can happen if scale is zero for example.
            return false;
        }

        scaleMatrix.multiplyAtIndex(0, this._scalingDeterminant);
        rotMatInv.multiplyToRef(scaleMatrix, rotMatInv);

        return true;
    }

    /**
     * Get the position of the bone in local or world space
     * @param space The space that the returned position is in
     * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
     * @returns The position of the bone
     */
    public getPosition(space = Space.LOCAL, tNode: Nullable<TransformNode> = null): Vector3 {
        const pos = Vector3.Zero();

        this.getPositionToRef(space, tNode, pos);

        return pos;
    }

    /**
     * Copy the position of the bone to a vector3 in local or world space
     * @param space The space that the returned position is in
     * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
     * @param result The vector3 to copy the position to
     */
    public getPositionToRef(space = Space.LOCAL, tNode: Nullable<TransformNode>, result: Vector3): void {
        if (space == Space.LOCAL) {
            const lm = this.getLocalMatrix();

            result.x = lm.m[12];
            result.y = lm.m[13];
            result.z = lm.m[14];
        } else {
            let wm: Nullable<Matrix> = null;

            //tNode.getWorldMatrix() needs to be called before skeleton.computeAbsoluteMatrices()
            if (tNode) {
                wm = tNode.getWorldMatrix();
            }

            this._skeleton.computeAbsoluteMatrices();

            let tmat = Bone._TmpMats[0];

            if (tNode && wm) {
                tmat.copyFrom(this.getAbsoluteMatrix());
                tmat.multiplyToRef(wm, tmat);
            } else {
                tmat = this.getAbsoluteMatrix();
            }

            result.x = tmat.m[12];
            result.y = tmat.m[13];
            result.z = tmat.m[14];
        }
    }

    /**
     * Get the absolute position of the bone (world space)
     * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
     * @returns The absolute position of the bone
     */
    public getAbsolutePosition(tNode: Nullable<TransformNode> = null): Vector3 {
        const pos = Vector3.Zero();

        this.getPositionToRef(Space.WORLD, tNode, pos);

        return pos;
    }

    /**
     * Copy the absolute position of the bone (world space) to the result param
     * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
     * @param result The vector3 to copy the absolute position to
     */
    public getAbsolutePositionToRef(tNode: TransformNode, result: Vector3) {
        this.getPositionToRef(Space.WORLD, tNode, result);
    }

    /**
     * Compute the absolute matrices of this bone and its children
     */
    public computeAbsoluteMatrices(): void {
        this._compose();

        if (this.parent) {
            this._localMatrix.multiplyToRef(this.parent._absoluteMatrix, this._absoluteMatrix);
        } else {
            this._absoluteMatrix.copyFrom(this._localMatrix);

            const poseMatrix = this._skeleton.getPoseMatrix();

            if (poseMatrix) {
                this._absoluteMatrix.multiplyToRef(poseMatrix, this._absoluteMatrix);
            }
        }

        const children = this.children;
        const len = children.length;

        for (let i = 0; i < len; i++) {
            children[i].computeAbsoluteMatrices();
        }
    }

    /**
     * Compute the absolute matrices of this bone and its children
     * @deprecated Please use computeAbsoluteMatrices instead
     */
    public computeAbsoluteTransforms(): void {
        this.computeAbsoluteMatrices();
    }

    /**
     * Get the world direction from an axis that is in the local space of the bone
     * @param localAxis The local direction that is used to compute the world direction
     * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
     * @returns The world direction
     */
    public getDirection(localAxis: Vector3, tNode: Nullable<TransformNode> = null): Vector3 {
        const result = Vector3.Zero();

        this.getDirectionToRef(localAxis, tNode, result);

        return result;
    }

    /**
     * Copy the world direction to a vector3 from an axis that is in the local space of the bone
     * @param localAxis The local direction that is used to compute the world direction
     * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
     * @param result The vector3 that the world direction will be copied to
     */
    public getDirectionToRef(localAxis: Vector3, tNode: Nullable<TransformNode> = null, result: Vector3): void {
        let wm: Nullable<Matrix> = null;

        //tNode.getWorldMatrix() needs to be called before skeleton.computeAbsoluteMatrices()
        if (tNode) {
            wm = tNode.getWorldMatrix();
        }

        this._skeleton.computeAbsoluteMatrices();

        const mat = Bone._TmpMats[0];

        mat.copyFrom(this.getAbsoluteMatrix());

        if (tNode && wm) {
            mat.multiplyToRef(wm, mat);
        }

        Vector3.TransformNormalToRef(localAxis, mat, result);

        result.normalize();
    }

    /**
     * Get the euler rotation of the bone in local or world space
     * @param space The space that the rotation should be in
     * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
     * @returns The euler rotation
     */
    public getRotation(space = Space.LOCAL, tNode: Nullable<TransformNode> = null): Vector3 {
        const result = Vector3.Zero();

        this.getRotationToRef(space, tNode, result);

        return result;
    }

    /**
     * Copy the euler rotation of the bone to a vector3.  The rotation can be in either local or world space
     * @param space The space that the rotation should be in
     * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
     * @param result The vector3 that the rotation should be copied to
     */
    public getRotationToRef(space = Space.LOCAL, tNode: Nullable<TransformNode> = null, result: Vector3): void {
        const quat = Bone._TmpQuat;

        this.getRotationQuaternionToRef(space, tNode, quat);

        quat.toEulerAnglesToRef(result);
    }

    /**
     * Get the quaternion rotation of the bone in either local or world space
     * @param space The space that the rotation should be in
     * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
     * @returns The quaternion rotation
     */
    public getRotationQuaternion(space = Space.LOCAL, tNode: Nullable<TransformNode> = null): Quaternion {
        const result = Quaternion.Identity();

        this.getRotationQuaternionToRef(space, tNode, result);

        return result;
    }

    /**
     * Copy the quaternion rotation of the bone to a quaternion.  The rotation can be in either local or world space
     * @param space The space that the rotation should be in
     * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
     * @param result The quaternion that the rotation should be copied to
     */
    public getRotationQuaternionToRef(space = Space.LOCAL, tNode: Nullable<TransformNode> = null, result: Quaternion): void {
        if (space == Space.LOCAL) {
            this._decompose();
            result.copyFrom(this._localRotation);
        } else {
            const mat = Bone._TmpMats[0];
            const amat = this.getAbsoluteMatrix();

            if (tNode) {
                amat.multiplyToRef(tNode.getWorldMatrix(), mat);
            } else {
                mat.copyFrom(amat);
            }

            mat.multiplyAtIndex(0, this._scalingDeterminant);
            mat.multiplyAtIndex(1, this._scalingDeterminant);
            mat.multiplyAtIndex(2, this._scalingDeterminant);

            mat.decompose(undefined, result, undefined);
        }
    }

    /**
     * Get the rotation matrix of the bone in local or world space
     * @param space The space that the rotation should be in
     * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
     * @returns The rotation matrix
     */
    public getRotationMatrix(space = Space.LOCAL, tNode: TransformNode): Matrix {
        const result = Matrix.Identity();

        this.getRotationMatrixToRef(space, tNode, result);

        return result;
    }

    /**
     * Copy the rotation matrix of the bone to a matrix.  The rotation can be in either local or world space
     * @param space The space that the rotation should be in
     * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
     * @param result The quaternion that the rotation should be copied to
     */
    public getRotationMatrixToRef(space = Space.LOCAL, tNode: TransformNode, result: Matrix): void {
        if (space == Space.LOCAL) {
            this.getLocalMatrix().getRotationMatrixToRef(result);
        } else {
            const mat = Bone._TmpMats[0];
            const amat = this.getAbsoluteMatrix();

            if (tNode) {
                amat.multiplyToRef(tNode.getWorldMatrix(), mat);
            } else {
                mat.copyFrom(amat);
            }

            mat.multiplyAtIndex(0, this._scalingDeterminant);
            mat.multiplyAtIndex(1, this._scalingDeterminant);
            mat.multiplyAtIndex(2, this._scalingDeterminant);

            mat.getRotationMatrixToRef(result);
        }
    }

    /**
     * Get the world position of a point that is in the local space of the bone
     * @param position The local position
     * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
     * @returns The world position
     */
    public getAbsolutePositionFromLocal(position: Vector3, tNode: Nullable<TransformNode> = null): Vector3 {
        const result = Vector3.Zero();

        this.getAbsolutePositionFromLocalToRef(position, tNode, result);

        return result;
    }

    /**
     * Get the world position of a point that is in the local space of the bone and copy it to the result param
     * @param position The local position
     * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
     * @param result The vector3 that the world position should be copied to
     */
    public getAbsolutePositionFromLocalToRef(position: Vector3, tNode: Nullable<TransformNode> = null, result: Vector3): void {
        let wm: Nullable<Matrix> = null;

        //tNode.getWorldMatrix() needs to be called before skeleton.computeAbsoluteMatrices()
        if (tNode) {
            wm = tNode.getWorldMatrix();
        }

        this._skeleton.computeAbsoluteMatrices();

        const tmat = Bone._TmpMats[0];

        tmat.copyFrom(this.getAbsoluteMatrix());

        if (tNode && wm) {
            tmat.multiplyToRef(wm, tmat);
        }

        Vector3.TransformCoordinatesToRef(position, tmat, result);
    }

    /**
     * Get the local position of a point that is in world space
     * @param position The world position
     * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
     * @returns The local position
     */
    public getLocalPositionFromAbsolute(position: Vector3, tNode: Nullable<TransformNode> = null): Vector3 {
        const result = Vector3.Zero();

        this.getLocalPositionFromAbsoluteToRef(position, tNode, result);

        return result;
    }

    /**
     * Get the local position of a point that is in world space and copy it to the result param
     * @param position The world position
     * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
     * @param result The vector3 that the local position should be copied to
     */
    public getLocalPositionFromAbsoluteToRef(position: Vector3, tNode: Nullable<TransformNode> = null, result: Vector3): void {
        let wm: Nullable<Matrix> = null;

        //tNode.getWorldMatrix() needs to be called before skeleton.computeAbsoluteMatrices()
        if (tNode) {
            wm = tNode.getWorldMatrix();
        }

        this._skeleton.computeAbsoluteMatrices();

        const tmat = Bone._TmpMats[0];

        tmat.copyFrom(this.getAbsoluteMatrix());

        if (tNode && wm) {
            tmat.multiplyToRef(wm, tmat);
        }

        tmat.invert();

        Vector3.TransformCoordinatesToRef(position, tmat, result);
    }

    /**
     * Set the current local matrix as the restMatrix for this bone.
     */
    public setCurrentPoseAsRest(): void {
        this.setRestMatrix(this.getLocalMatrix());
    }
}
