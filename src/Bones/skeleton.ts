import { Bone } from "./bone";

import { Observable } from "../Misc/observable";
import { Vector3, Matrix, TmpVectors } from "../Maths/math.vector";
import { Scene } from "../scene";
import { Nullable } from "../types";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { RawTexture } from "../Materials/Textures/rawTexture";
import { Animatable } from "../Animations/animatable";
import { AnimationPropertiesOverride } from "../Animations/animationPropertiesOverride";
import { Animation } from "../Animations/animation";
import { AnimationRange } from "../Animations/animationRange";
import { EngineStore } from "../Engines/engineStore";
import { Constants } from "../Engines/constants";
import { Logger } from "../Misc/logger";
import { DeepCopier } from "../Misc/deepCopier";
import { IInspectable } from '../Misc/iInspectable';
import { IAnimatable } from '../Animations/animatable.interface';

/**
 * Class used to handle skinning animations
 * @see https://doc.babylonjs.com/how_to/how_to_use_bones_and_skeletons
 */
export class Skeleton implements IAnimatable {
    /**
     * Defines the list of child bones
     */
    public bones = new Array<Bone>();
    /**
     * Defines an estimate of the dimension of the skeleton at rest
     */
    public dimensionsAtRest: Vector3;
    /**
     * Defines a boolean indicating if the root matrix is provided by meshes or by the current skeleton (this is the default value)
     */
    public needInitialSkinMatrix = false;
    /**
     * Defines a mesh that override the matrix used to get the world matrix (null by default).
     */
    public overrideMesh: Nullable<AbstractMesh> = null;

    /**
     * Gets the list of animations attached to this skeleton
     */
    public animations: Array<Animation>;

    private _scene: Scene;
    private _isDirty = true;
    private _transformMatrices: Float32Array;
    private _transformMatrixTexture: Nullable<RawTexture>;
    private _meshesWithPoseMatrix = new Array<AbstractMesh>();
    private _animatables: IAnimatable[];
    private _identity = Matrix.Identity();
    private _synchronizedWithMesh: AbstractMesh;

    private _ranges: { [name: string]: Nullable<AnimationRange> } = {};

    private _lastAbsoluteTransformsUpdateId = -1;

    private _canUseTextureForBones = false;
    private _uniqueId = 0;

    /** @hidden */
    public _numBonesWithLinkedTransformNode = 0;

    /** @hidden */
    public _hasWaitingData: Nullable<boolean> = null;

    /** @hidden */
    public _waitingOverrideMeshId: Nullable<string> = null;

    /**
     * Specifies if the skeleton should be serialized
     */
    public doNotSerialize = false;

    private _useTextureToStoreBoneMatrices = true;
    /**
     * Gets or sets a boolean indicating that bone matrices should be stored as a texture instead of using shader uniforms (default is true).
     * Please note that this option is not available if the hardware does not support it
     */
    public get useTextureToStoreBoneMatrices(): boolean {
        return this._useTextureToStoreBoneMatrices;
    }

    public set useTextureToStoreBoneMatrices(value: boolean) {
        this._useTextureToStoreBoneMatrices = value;
        this._markAsDirty();
    }

    private _animationPropertiesOverride: Nullable<AnimationPropertiesOverride> = null;

    /**
     * Gets or sets the animation properties override
     */
    public get animationPropertiesOverride(): Nullable<AnimationPropertiesOverride> {
        if (!this._animationPropertiesOverride) {
            return this._scene.animationPropertiesOverride;
        }
        return this._animationPropertiesOverride;
    }

    public set animationPropertiesOverride(value: Nullable<AnimationPropertiesOverride>) {
        this._animationPropertiesOverride = value;
    }

    /**
     * List of inspectable custom properties (used by the Inspector)
     * @see https://doc.babylonjs.com/how_to/debug_layer#extensibility
     */
    public inspectableCustomProperties: IInspectable[];

    // Events

    /**
     * An observable triggered before computing the skeleton's matrices
     */
    public onBeforeComputeObservable = new Observable<Skeleton>();

    /**
     * Gets a boolean indicating that the skeleton effectively stores matrices into a texture
     */
    public get isUsingTextureForMatrices() {
        return this.useTextureToStoreBoneMatrices && this._canUseTextureForBones;
    }

    /**
     * Gets the unique ID of this skeleton
     */
    public get uniqueId(): number {
        return this._uniqueId;
    }

    /**
     * Creates a new skeleton
     * @param name defines the skeleton name
     * @param id defines the skeleton Id
     * @param scene defines the hosting scene
     */
    constructor(
        /** defines the skeleton name */
        public name: string,
        /** defines the skeleton Id */
        public id: string, scene: Scene) {
        this.bones = [];

        this._scene = scene || EngineStore.LastCreatedScene;
        this._uniqueId = this._scene.getUniqueId();

        this._scene.addSkeleton(this);

        //make sure it will recalculate the matrix next time prepare is called.
        this._isDirty = true;

        const engineCaps = this._scene.getEngine().getCaps();
        this._canUseTextureForBones = engineCaps.textureFloat && engineCaps.maxVertexTextureImageUnits > 0;
    }

    /**
     * Gets the current object class name.
     * @return the class name
     */
    public getClassName(): string {
        return "Skeleton";
    }

    /**
     * Returns an array containing the root bones
     * @returns an array containing the root bones
     */
    public getChildren(): Array<Bone> {
        return this.bones.filter((b) => !b.getParent());
    }

    // Members
    /**
     * Gets the list of transform matrices to send to shaders (one matrix per bone)
     * @param mesh defines the mesh to use to get the root matrix (if needInitialSkinMatrix === true)
     * @returns a Float32Array containing matrices data
     */
    public getTransformMatrices(mesh: AbstractMesh): Float32Array {
        if (this.needInitialSkinMatrix && mesh._bonesTransformMatrices) {
            return mesh._bonesTransformMatrices;
        }

        if (!this._transformMatrices) {
            this.prepare();
        }

        return this._transformMatrices;
    }

    /**
     * Gets the list of transform matrices to send to shaders inside a texture (one matrix per bone)
     * @param mesh defines the mesh to use to get the root matrix (if needInitialSkinMatrix === true)
     * @returns a raw texture containing the data
     */
    public getTransformMatrixTexture(mesh: AbstractMesh): Nullable<RawTexture> {
        if (this.needInitialSkinMatrix && mesh._transformMatrixTexture) {
            return mesh._transformMatrixTexture;
        }

        return this._transformMatrixTexture;
    }

    /**
     * Gets the current hosting scene
     * @returns a scene object
     */
    public getScene(): Scene {
        return this._scene;
    }

    // Methods

    /**
     * Gets a string representing the current skeleton data
     * @param fullDetails defines a boolean indicating if we want a verbose version
     * @returns a string representing the current skeleton data
     */
    public toString(fullDetails?: boolean): string {
        var ret = `Name: ${this.name}, nBones: ${this.bones.length}`;
        ret += `, nAnimationRanges: ${this._ranges ? Object.keys(this._ranges).length : "none"}`;
        if (fullDetails) {
            ret += ", Ranges: {";
            let first = true;
            for (let name in this._ranges) {
                if (first) {
                    ret += ", ";
                    first = false;
                }
                ret += name;
            }
            ret += "}";
        }
        return ret;
    }

    /**
    * Get bone's index searching by name
    * @param name defines bone's name to search for
    * @return the indice of the bone. Returns -1 if not found
    */
    public getBoneIndexByName(name: string): number {
        for (var boneIndex = 0, cache = this.bones.length; boneIndex < cache; boneIndex++) {
            if (this.bones[boneIndex].name === name) {
                return boneIndex;
            }
        }
        return -1;
    }

    /**
     * Creater a new animation range
     * @param name defines the name of the range
     * @param from defines the start key
     * @param to defines the end key
     */
    public createAnimationRange(name: string, from: number, to: number): void {
        // check name not already in use
        if (!this._ranges[name]) {
            this._ranges[name] = new AnimationRange(name, from, to);
            for (var i = 0, nBones = this.bones.length; i < nBones; i++) {
                if (this.bones[i].animations[0]) {
                    this.bones[i].animations[0].createRange(name, from, to);
                }
            }
        }
    }

    /**
     * Delete a specific animation range
     * @param name defines the name of the range
     * @param deleteFrames defines if frames must be removed as well
     */
    public deleteAnimationRange(name: string, deleteFrames = true): void {
        for (var i = 0, nBones = this.bones.length; i < nBones; i++) {
            if (this.bones[i].animations[0]) {
                this.bones[i].animations[0].deleteRange(name, deleteFrames);
            }
        }
        this._ranges[name] = null; // said much faster than 'delete this._range[name]'
    }

    /**
     * Gets a specific animation range
     * @param name defines the name of the range to look for
     * @returns the requested animation range or null if not found
     */
    public getAnimationRange(name: string): Nullable<AnimationRange> {
        return this._ranges[name] || null;
    }

    /**
     * Gets the list of all animation ranges defined on this skeleton
     * @returns an array
     */
    public getAnimationRanges(): Nullable<AnimationRange>[] {
        var animationRanges: Nullable<AnimationRange>[] = [];
        var name: string;
        for (name in this._ranges) {
            animationRanges.push(this._ranges[name]);
        }
        return animationRanges;
    }

    /**
     * Copy animation range from a source skeleton.
     * This is not for a complete retargeting, only between very similar skeleton's with only possible bone length differences
     * @param source defines the source skeleton
     * @param name defines the name of the range to copy
     * @param rescaleAsRequired defines if rescaling must be applied if required
     * @returns true if operation was successful
     */
    public copyAnimationRange(source: Skeleton, name: string, rescaleAsRequired = false): boolean {
        if (this._ranges[name] || !source.getAnimationRange(name)) {
            return false;
        }
        var ret = true;
        var frameOffset = this._getHighestAnimationFrame() + 1;

        // make a dictionary of source skeleton's bones, so exact same order or doublely nested loop is not required
        var boneDict: { [key: string]: Bone } = {};
        var sourceBones = source.bones;
        var nBones: number;
        var i: number;
        for (i = 0, nBones = sourceBones.length; i < nBones; i++) {
            boneDict[sourceBones[i].name] = sourceBones[i];
        }

        if (this.bones.length !== sourceBones.length) {
            Logger.Warn(`copyAnimationRange: this rig has ${this.bones.length} bones, while source as ${sourceBones.length}`);
            ret = false;
        }

        var skelDimensionsRatio = (rescaleAsRequired && this.dimensionsAtRest && source.dimensionsAtRest) ? this.dimensionsAtRest.divide(source.dimensionsAtRest) : null;

        for (i = 0, nBones = this.bones.length; i < nBones; i++) {
            var boneName = this.bones[i].name;
            var sourceBone = boneDict[boneName];
            if (sourceBone) {
                ret = ret && this.bones[i].copyAnimationRange(sourceBone, name, frameOffset, rescaleAsRequired, skelDimensionsRatio);
            } else {
                Logger.Warn("copyAnimationRange: not same rig, missing source bone " + boneName);
                ret = false;
            }
        }
        // do not call createAnimationRange(), since it also is done to bones, which was already done
        var range = source.getAnimationRange(name);
        if (range) {
            this._ranges[name] = new AnimationRange(name, range.from + frameOffset, range.to + frameOffset);
        }
        return ret;
    }

    /**
     * Forces the skeleton to go to rest pose
     */
    public returnToRest(): void {
        const _localScaling = TmpVectors.Vector3[0];
        const _localRotation = TmpVectors.Quaternion[0];
        const _localPosition = TmpVectors.Vector3[1];

        for (var index = 0; index < this.bones.length; index++) {
            const bone = this.bones[index];

            if (bone._index !== -1) {
                bone.returnToRest();
                if (bone._linkedTransformNode) {
                    bone.getRestPose().decompose(_localScaling, _localRotation, _localPosition);

                    bone._linkedTransformNode.position = _localPosition.clone();
                    bone._linkedTransformNode.rotationQuaternion = _localRotation.clone();
                    bone._linkedTransformNode.scaling = _localScaling.clone();
                }
            }
        }
    }

    private _getHighestAnimationFrame(): number {
        var ret = 0;
        for (var i = 0, nBones = this.bones.length; i < nBones; i++) {
            if (this.bones[i].animations[0]) {
                var highest = this.bones[i].animations[0].getHighestFrame();
                if (ret < highest) {
                    ret = highest;
                }
            }
        }
        return ret;
    }

    /**
     * Begin a specific animation range
     * @param name defines the name of the range to start
     * @param loop defines if looping must be turned on (false by default)
     * @param speedRatio defines the speed ratio to apply (1 by default)
     * @param onAnimationEnd defines a callback which will be called when animation will end
     * @returns a new animatable
     */
    public beginAnimation(name: string, loop?: boolean, speedRatio?: number, onAnimationEnd?: () => void): Nullable<Animatable> {
        var range = this.getAnimationRange(name);

        if (!range) {
            return null;
        }

        return this._scene.beginAnimation(this, range.from, range.to, loop, speedRatio, onAnimationEnd);
    }

    /**
     * Convert the keyframes for a range of animation on a skeleton to be relative to a given reference frame.
     * @param skeleton defines the Skeleton containing the animation range to convert
     * @param referenceFrame defines the frame that keyframes in the range will be relative to
     * @param range defines the name of the AnimationRange belonging to the Skeleton to convert
     * @returns the original skeleton
     */
    public static MakeAnimationAdditive(skeleton: Skeleton, referenceFrame = 0, range: string): Nullable<Skeleton> {
        var rangeValue = skeleton.getAnimationRange(name);

        // We can't make a range additive if it doesn't exist
        if (!rangeValue) {
            return null;
        }

        // Find any current scene-level animatable belonging to the target that matches the range
        var sceneAnimatables = skeleton._scene.getAllAnimatablesByTarget(skeleton);
        var rangeAnimatable: Nullable<Animatable> = null;

        for (let index = 0; index < sceneAnimatables.length; index++) {
            let sceneAnimatable = sceneAnimatables[index];

            if (sceneAnimatable.fromFrame === rangeValue?.from && sceneAnimatable.toFrame === rangeValue?.to) {
                rangeAnimatable = sceneAnimatable;
                break;
            }
        }

        // Convert the animations belonging to the skeleton to additive keyframes
        var animatables = skeleton.getAnimatables();

        for (let index = 0; index < animatables.length; index++) {
            let animatable = animatables[index];
            let animations = animatable.animations;

            if (!animations) {
                continue;
            }

            for (var animIndex = 0; animIndex < animations.length; animIndex++) {
                Animation.MakeAnimationAdditive(animations[animIndex], referenceFrame, range);
            }
        }

        // Mark the scene-level animatable as additive
        if (rangeAnimatable) {
            rangeAnimatable.isAdditive = true;
        }

        return skeleton;
    }

    /** @hidden */
    public _markAsDirty(): void {
        this._isDirty = true;
    }

    /** @hidden */
    public _registerMeshWithPoseMatrix(mesh: AbstractMesh): void {
        this._meshesWithPoseMatrix.push(mesh);
    }

    /** @hidden */
    public _unregisterMeshWithPoseMatrix(mesh: AbstractMesh): void {
        var index = this._meshesWithPoseMatrix.indexOf(mesh);

        if (index > -1) {
            this._meshesWithPoseMatrix.splice(index, 1);
        }
    }

    private _computeTransformMatrices(targetMatrix: Float32Array, initialSkinMatrix: Nullable<Matrix>): void {

        this.onBeforeComputeObservable.notifyObservers(this);

        for (var index = 0; index < this.bones.length; index++) {
            var bone = this.bones[index];
            bone._childUpdateId++;
            var parentBone = bone.getParent();

            if (parentBone) {
                bone.getLocalMatrix().multiplyToRef(parentBone.getWorldMatrix(), bone.getWorldMatrix());
            } else {
                if (initialSkinMatrix) {
                    bone.getLocalMatrix().multiplyToRef(initialSkinMatrix, bone.getWorldMatrix());
                } else {
                    bone.getWorldMatrix().copyFrom(bone.getLocalMatrix());
                }
            }

            if (bone._index !== -1) {
                var mappedIndex = bone._index === null ? index : bone._index;
                bone.getInvertedAbsoluteTransform().multiplyToArray(bone.getWorldMatrix(), targetMatrix, mappedIndex * 16);
            }
        }

        this._identity.copyToArray(targetMatrix, this.bones.length * 16);
    }

    /**
     * Build all resources required to render a skeleton
     */
    public prepare(): void {
        // Update the local matrix of bones with linked transform nodes.
        if (this._numBonesWithLinkedTransformNode > 0) {
            for (const bone of this.bones) {
                if (bone._linkedTransformNode) {
                    // Computing the world matrix also computes the local matrix.
                    bone._linkedTransformNode.computeWorldMatrix();
                    bone._matrix = bone._linkedTransformNode._localMatrix;
                    bone.markAsDirty();
                }
            }
        }

        if (!this._isDirty) {
            return;
        }

        if (this.needInitialSkinMatrix) {
            for (var index = 0; index < this._meshesWithPoseMatrix.length; index++) {
                var mesh = this._meshesWithPoseMatrix[index];

                var poseMatrix = mesh.getPoseMatrix();

                if (!mesh._bonesTransformMatrices || mesh._bonesTransformMatrices.length !== 16 * (this.bones.length + 1)) {
                    mesh._bonesTransformMatrices = new Float32Array(16 * (this.bones.length + 1));
                }

                if (this._synchronizedWithMesh !== mesh) {
                    this._synchronizedWithMesh = mesh;

                    // Prepare bones
                    for (var boneIndex = 0; boneIndex < this.bones.length; boneIndex++) {
                        var bone = this.bones[boneIndex];

                        if (!bone.getParent()) {
                            var matrix = bone.getBaseMatrix();
                            matrix.multiplyToRef(poseMatrix, TmpVectors.Matrix[1]);
                            bone._updateDifferenceMatrix(TmpVectors.Matrix[1]);
                        }
                    }

                    if (this.isUsingTextureForMatrices) {
                        const textureWidth = (this.bones.length + 1) * 4;
                        if (!mesh._transformMatrixTexture || mesh._transformMatrixTexture.getSize().width !== textureWidth) {

                            if (mesh._transformMatrixTexture) {
                                mesh._transformMatrixTexture.dispose();
                            }

                            mesh._transformMatrixTexture = RawTexture.CreateRGBATexture(mesh._bonesTransformMatrices, (this.bones.length + 1) * 4, 1, this._scene, false, false, Constants.TEXTURE_NEAREST_SAMPLINGMODE, Constants.TEXTURETYPE_FLOAT);
                        }
                    }
                }

                this._computeTransformMatrices(mesh._bonesTransformMatrices, poseMatrix);

                if (this.isUsingTextureForMatrices && mesh._transformMatrixTexture) {
                    mesh._transformMatrixTexture.update(mesh._bonesTransformMatrices);
                }
            }
        } else {
            if (!this._transformMatrices || this._transformMatrices.length !== 16 * (this.bones.length + 1)) {
                this._transformMatrices = new Float32Array(16 * (this.bones.length + 1));

                if (this.isUsingTextureForMatrices) {
                    if (this._transformMatrixTexture) {
                        this._transformMatrixTexture.dispose();
                    }

                    this._transformMatrixTexture = RawTexture.CreateRGBATexture(this._transformMatrices, (this.bones.length + 1) * 4, 1, this._scene, false, false, Constants.TEXTURE_NEAREST_SAMPLINGMODE, Constants.TEXTURETYPE_FLOAT);
                }
            }

            this._computeTransformMatrices(this._transformMatrices, null);

            if (this.isUsingTextureForMatrices && this._transformMatrixTexture) {
                this._transformMatrixTexture.update(this._transformMatrices);
            }
        }

        this._isDirty = false;

        this._scene._activeBones.addCount(this.bones.length, false);
    }

    /**
     * Gets the list of animatables currently running for this skeleton
     * @returns an array of animatables
     */
    public getAnimatables(): IAnimatable[] {
        if (!this._animatables || this._animatables.length !== this.bones.length) {
            this._animatables = [];

            for (var index = 0; index < this.bones.length; index++) {
                this._animatables.push(this.bones[index]);
            }
        }

        return this._animatables;
    }

    /**
     * Clone the current skeleton
     * @param name defines the name of the new skeleton
     * @param id defines the id of the new skeleton
     * @returns the new skeleton
     */
    public clone(name: string, id?: string): Skeleton {
        var result = new Skeleton(name, id || name, this._scene);

        result.needInitialSkinMatrix = this.needInitialSkinMatrix;

        result.overrideMesh = this.overrideMesh;

        for (var index = 0; index < this.bones.length; index++) {
            var source = this.bones[index];
            var parentBone = null;

            let parent = source.getParent();
            if (parent) {
                var parentIndex = this.bones.indexOf(parent);
                parentBone = result.bones[parentIndex];
            }

            var bone = new Bone(source.name, result, parentBone, source.getBaseMatrix().clone(), source.getRestPose().clone());
            bone._index = source._index;

            if (source._linkedTransformNode) {
                bone.linkTransformNode(source._linkedTransformNode);
            }

            DeepCopier.DeepCopy(source.animations, bone.animations);
        }

        if (this._ranges) {
            result._ranges = {};
            for (var rangeName in this._ranges) {
                let range = this._ranges[rangeName];

                if (range) {
                    result._ranges[rangeName] = range.clone();
                }
            }
        }

        this._isDirty = true;

        return result;
    }

    /**
     * Enable animation blending for this skeleton
     * @param blendingSpeed defines the blending speed to apply
     * @see https://doc.babylonjs.com/babylon101/animations#animation-blending
     */
    public enableBlending(blendingSpeed = 0.01) {
        this.bones.forEach((bone) => {
            bone.animations.forEach((animation: Animation) => {
                animation.enableBlending = true;
                animation.blendingSpeed = blendingSpeed;
            });
        });
    }

    /**
     * Releases all resources associated with the current skeleton
     */
    public dispose() {
        this._meshesWithPoseMatrix = [];

        // Animations
        this.getScene().stopAnimation(this);

        // Remove from scene
        this.getScene().removeSkeleton(this);

        if (this._transformMatrixTexture) {
            this._transformMatrixTexture.dispose();
            this._transformMatrixTexture = null;
        }
    }

    /**
     * Serialize the skeleton in a JSON object
     * @returns a JSON object
     */
    public serialize(): any {
        var serializationObject: any = {};

        serializationObject.name = this.name;
        serializationObject.id = this.id;

        if (this.dimensionsAtRest) {
            serializationObject.dimensionsAtRest = this.dimensionsAtRest.asArray();
        }

        serializationObject.bones = [];

        serializationObject.needInitialSkinMatrix = this.needInitialSkinMatrix;
        serializationObject.overrideMeshId = this.overrideMesh?.id;

        for (var index = 0; index < this.bones.length; index++) {
            var bone = this.bones[index];
            let parent = bone.getParent();

            var serializedBone: any = {
                parentBoneIndex: parent ? this.bones.indexOf(parent) : -1,
                index: bone.getIndex(),
                name: bone.name,
                matrix: bone.getBaseMatrix().toArray(),
                rest: bone.getRestPose().toArray(),
                linkedTransformNodeId: bone.getTransformNode()?.id
            };

            serializationObject.bones.push(serializedBone);

            if (bone.length) {
                serializedBone.length = bone.length;
            }

            if (bone.metadata) {
                serializedBone.metadata = bone.metadata;
            }

            if (bone.animations && bone.animations.length > 0) {
                serializedBone.animation = bone.animations[0].serialize();
            }

            serializationObject.ranges = [];
            for (var name in this._ranges) {
                let source = this._ranges[name];

                if (!source) {
                    continue;
                }

                var range: any = {};
                range.name = name;
                range.from = source.from;
                range.to = source.to;
                serializationObject.ranges.push(range);
            }
        }
        return serializationObject;
    }

    /**
     * Creates a new skeleton from serialized data
     * @param parsedSkeleton defines the serialized data
     * @param scene defines the hosting scene
     * @returns a new skeleton
     */
    public static Parse(parsedSkeleton: any, scene: Scene): Skeleton {
        var skeleton = new Skeleton(parsedSkeleton.name, parsedSkeleton.id, scene);
        if (parsedSkeleton.dimensionsAtRest) {
            skeleton.dimensionsAtRest = Vector3.FromArray(parsedSkeleton.dimensionsAtRest);
        }

        skeleton.needInitialSkinMatrix = parsedSkeleton.needInitialSkinMatrix;

        if (parsedSkeleton.overrideMeshId){
            skeleton._hasWaitingData = true;
            skeleton._waitingOverrideMeshId = parsedSkeleton.overrideMeshId;
        }

        let index: number;
        for (index = 0; index < parsedSkeleton.bones.length; index++) {
            var parsedBone = parsedSkeleton.bones[index];
            var parsedBoneIndex = parsedSkeleton.bones[index].index;
            var parentBone = null;
            if (parsedBone.parentBoneIndex > -1) {
                parentBone = skeleton.bones[parsedBone.parentBoneIndex];
            }

            var rest: Nullable<Matrix> = parsedBone.rest ? Matrix.FromArray(parsedBone.rest) : null;
            var bone = new Bone(parsedBone.name, skeleton, parentBone, Matrix.FromArray(parsedBone.matrix), rest, null, parsedBoneIndex);

            if (parsedBone.id !== undefined && parsedBone.id !== null) {
                bone.id = parsedBone.id;
            }

            if (parsedBone.length) {
                bone.length = parsedBone.length;
            }

            if (parsedBone.metadata) {
                bone.metadata = parsedBone.metadata;
            }

            if (parsedBone.animation) {
                bone.animations.push(Animation.Parse(parsedBone.animation));
            }

            if (parsedBone.linkedTransformNodeId !== undefined && parsedBone.linkedTransformNodeId !== null) {
                skeleton._hasWaitingData = true;
                bone._waitingTransformNodeId = parsedBone.linkedTransformNodeId;
            }
        }

        // placed after bones, so createAnimationRange can cascade down
        if (parsedSkeleton.ranges) {
            for (index = 0; index < parsedSkeleton.ranges.length; index++) {
                var data = parsedSkeleton.ranges[index];
                skeleton.createAnimationRange(data.name, data.from, data.to);
            }
        }
        return skeleton;
    }

    /**
     * Compute all node absolute transforms
     * @param forceUpdate defines if computation must be done even if cache is up to date
     */
    public computeAbsoluteTransforms(forceUpdate = false): void {

        var renderId = this._scene.getRenderId();

        if (this._lastAbsoluteTransformsUpdateId != renderId || forceUpdate) {
            this.bones[0].computeAbsoluteTransforms();
            this._lastAbsoluteTransformsUpdateId = renderId;
        }

    }

    /**
     * Gets the root pose matrix
     * @returns a matrix
     */
    public getPoseMatrix(): Nullable<Matrix> {
        var poseMatrix: Nullable<Matrix> = null;

        if (this._meshesWithPoseMatrix.length > 0) {
            poseMatrix = this._meshesWithPoseMatrix[0].getPoseMatrix();
        }

        return poseMatrix;
    }

    /**
     * Sorts bones per internal index
     */
    public sortBones(): void {
        var bones = new Array<Bone>();
        var visited = new Array<boolean>(this.bones.length);
        for (var index = 0; index < this.bones.length; index++) {
            this._sortBones(index, bones, visited);
        }

        this.bones = bones;
    }

    private _sortBones(index: number, bones: Bone[], visited: boolean[]): void {
        if (visited[index]) {
            return;
        }

        visited[index] = true;

        var bone = this.bones[index];
        if (bone._index === undefined) {
            bone._index = index;
        }

        var parentBone = bone.getParent();
        if (parentBone) {
            this._sortBones(this.bones.indexOf(parentBone), bones, visited);
        }

        bones.push(bone);
    }
}
