import type { Observer } from "../Misc/observable";
import { SmartArray } from "../Misc/smartArray";
import { Logger } from "../Misc/logger";
import type { Nullable } from "../types";
import type { IDisposable, Scene } from "../scene";
import { EngineStore } from "../Engines/engineStore";
import type { Mesh } from "../Meshes/mesh";
import { MorphTarget } from "./morphTarget";
import { Constants } from "../Engines/constants";
import type { Effect } from "../Materials/effect";
import { RawTexture2DArray } from "../Materials/Textures/rawTexture2DArray";
import type { IAssetContainer } from "core/IAssetContainer";
/**
 * This class is used to deform meshes using morphing between different targets
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/morphTargets
 */
export class MorphTargetManager implements IDisposable {
    /** Enable storing morph target data into textures when set to true (true by default) */
    public static EnableTextureStorage = true;

    /** Maximum number of active morph targets supported in the "vertex attribute" mode (i.e., not the "texture" mode) */
    public static MaxActiveMorphTargetsInVertexAttributeMode = 8;

    /**
     * When used in texture mode, if greather than 0, this will override the the morph manager numMaxInfluencers value.
     */
    public static ConstantTargetCountForTextureMode = 0;

    private _targets = new Array<MorphTarget>();
    private _targetInfluenceChangedObservers = new Array<Nullable<Observer<boolean>>>();
    private _targetDataLayoutChangedObservers = new Array<Nullable<Observer<void>>>();
    private _activeTargets = new SmartArray<MorphTarget>(16);
    private _scene: Nullable<Scene>;
    private _influences: Float32Array;
    private _supportsPositions = false;
    private _supportsNormals = false;
    private _supportsTangents = false;
    private _supportsUVs = false;
    private _supportsUV2s = false;
    private _supportsColors = false;
    private _vertexCount = 0;
    private _uniqueId = 0;
    private _tempInfluences = new Array<number>();
    private _canUseTextureForTargets = false;
    private _blockCounter = 0;
    private _mustSynchronize = true;
    private _forceUpdateWhenUnfrozen = false;

    /** @internal */
    public _textureVertexStride = 0;

    /** @internal */
    public _textureWidth = 0;

    /** @internal */
    public _textureHeight = 1;

    /** @internal */
    public _morphTargetTextureIndices: Float32Array;

    /** @internal */
    public _parentContainer: Nullable<IAssetContainer> = null;

    /** @internal */
    public _targetStoreTexture: Nullable<RawTexture2DArray>;

    /**
     * Gets or sets a boolean indicating if influencers must be optimized (eg. recompiling the shader if less influencers are used)
     */
    public optimizeInfluencers = true;

    /**
     * Gets or sets a boolean indicating if positions must be morphed
     */
    public enablePositionMorphing = true;

    /**
     * Gets or sets a boolean indicating if normals must be morphed
     */
    public enableNormalMorphing = true;

    /**
     * Gets or sets a boolean indicating if tangents must be morphed
     */
    public enableTangentMorphing = true;

    /**
     * Gets or sets a boolean indicating if UV must be morphed
     */
    public enableUVMorphing = true;

    /**
     * Gets or sets a boolean indicating if UV2 must be morphed
     */
    public enableUV2Morphing = true;

    /**
     * Gets or sets a boolean indicating if colors must be morphed
     */
    public enableColorMorphing = true;

    /**
     * Sets a boolean indicating that adding new target or updating an existing target will not update the underlying data buffers
     */
    public set areUpdatesFrozen(block: boolean) {
        if (block) {
            this._blockCounter++;
        } else {
            this._blockCounter--;
            if (this._blockCounter <= 0) {
                this._blockCounter = 0;

                this._syncActiveTargets(this._forceUpdateWhenUnfrozen);
                this._forceUpdateWhenUnfrozen = false;
            }
        }
    }

    public get areUpdatesFrozen() {
        return this._blockCounter > 0;
    }

    /**
     * Creates a new MorphTargetManager
     * @param scene defines the current scene
     * @param meshName name of the mesh this morph target manager is associated with
     */
    public constructor(
        scene: Nullable<Scene> = null,
        public meshName?: string
    ) {
        if (!scene) {
            scene = EngineStore.LastCreatedScene;
        }

        this._scene = scene;

        if (this._scene) {
            this._scene.addMorphTargetManager(this);

            this._uniqueId = this._scene.getUniqueId();

            const engineCaps = this._scene.getEngine().getCaps();
            this._canUseTextureForTargets =
                engineCaps.canUseGLVertexID && engineCaps.textureFloat && engineCaps.maxVertexTextureImageUnits > 0 && engineCaps.texture2DArrayMaxLayerCount > 1;
        }
    }

    private _numMaxInfluencers = 0;

    /**
     * Gets or sets the maximum number of influencers (targets) (default value: 0).
     * Setting a value for this property can lead to a smoother experience, as only one shader will be compiled, which will use this value as the maximum number of influencers.
     * If you leave the value at 0 (default), a new shader will be compiled every time the number of active influencers changes. This can cause problems, as compiling a shader takes time.
     * If you assign a non-zero value to this property, you need to ensure that this value is greater than the maximum number of (active) influencers you'll need for this morph manager.
     * Otherwise, the number of active influencers will be truncated at the value you set for this property, which can lead to unexpected results.
     * Note that this property has no effect if "useTextureToStoreTargets" is false.
     * Note as well that if MorphTargetManager.ConstantTargetCountForTextureMode is greater than 0, this property will be ignored and the constant value will be used instead.
     */
    public get numMaxInfluencers(): number {
        if (MorphTargetManager.ConstantTargetCountForTextureMode > 0 && this.isUsingTextureForTargets) {
            return MorphTargetManager.ConstantTargetCountForTextureMode;
        }
        return this._numMaxInfluencers;
    }

    public set numMaxInfluencers(value: number) {
        if (this._numMaxInfluencers === value) {
            return;
        }

        this._numMaxInfluencers = value;
        this._mustSynchronize = true;
        this._syncActiveTargets();
    }

    /**
     * Gets the unique ID of this manager
     */
    public get uniqueId(): number {
        return this._uniqueId;
    }

    /**
     * Gets the number of vertices handled by this manager
     */
    public get vertexCount(): number {
        return this._vertexCount;
    }

    /**
     * Gets a boolean indicating if this manager supports morphing of positions
     */
    public get supportsPositions(): boolean {
        return this._supportsPositions && this.enablePositionMorphing;
    }

    /**
     * Gets a boolean indicating if this manager supports morphing of normals
     */
    public get supportsNormals(): boolean {
        return this._supportsNormals && this.enableNormalMorphing;
    }

    /**
     * Gets a boolean indicating if this manager supports morphing of tangents
     */
    public get supportsTangents(): boolean {
        return this._supportsTangents && this.enableTangentMorphing;
    }

    /**
     * Gets a boolean indicating if this manager supports morphing of texture coordinates
     */
    public get supportsUVs(): boolean {
        return this._supportsUVs && this.enableUVMorphing;
    }

    /**
     * Gets a boolean indicating if this manager supports morphing of texture coordinates 2
     */
    public get supportsUV2s(): boolean {
        return this._supportsUV2s && this.enableUV2Morphing;
    }

    /**
     * Gets a boolean indicating if this manager supports morphing of colors
     */
    public get supportsColors(): boolean {
        return this._supportsColors && this.enableColorMorphing;
    }

    /**
     * Gets a boolean indicating if this manager has data for morphing positions
     */
    public get hasPositions(): boolean {
        return this._supportsPositions;
    }

    /**
     * Gets a boolean indicating if this manager has data for morphing normals
     */
    public get hasNormals(): boolean {
        return this._supportsNormals;
    }

    /**
     * Gets a boolean indicating if this manager has data for morphing tangents
     */
    public get hasTangents(): boolean {
        return this._supportsTangents;
    }

    /**
     * Gets a boolean indicating if this manager has data for morphing texture coordinates
     */
    public get hasUVs(): boolean {
        return this._supportsUVs;
    }

    /**
     * Gets a boolean indicating if this manager has data for morphing texture coordinates 2
     */
    public get hasUV2s(): boolean {
        return this._supportsUV2s;
    }

    /**
     * Gets a boolean indicating if this manager has data for morphing colors
     */
    public get hasColors(): boolean {
        return this._supportsColors;
    }

    /**
     * Gets the number of targets stored in this manager
     */
    public get numTargets(): number {
        return this._targets.length;
    }

    /**
     * Gets the number of influencers (ie. the number of targets with influences > 0)
     */
    public get numInfluencers(): number {
        if (this._influencesAreDirty) {
            this._syncActiveTargets();
        }
        return this._activeTargets.length;
    }

    /**
     * Gets the list of influences (one per target)
     */
    public get influences(): Float32Array {
        if (this._influencesAreDirty) {
            this._syncActiveTargets();
        }
        return this._influences;
    }

    private _useTextureToStoreTargets = true;
    /**
     * Gets or sets a boolean indicating that targets should be stored as a texture instead of using vertex attributes (default is true).
     * Please note that this option is not available if the hardware does not support it
     */
    public get useTextureToStoreTargets(): boolean {
        return this._useTextureToStoreTargets;
    }

    public set useTextureToStoreTargets(value: boolean) {
        if (this._useTextureToStoreTargets === value) {
            return;
        }
        this._useTextureToStoreTargets = value;
        this._mustSynchronize = true;
        this._syncActiveTargets();
    }

    /**
     * Gets a boolean indicating that the targets are stored into a texture (instead of as attributes)
     */
    public get isUsingTextureForTargets() {
        return (
            MorphTargetManager.EnableTextureStorage &&
            this.useTextureToStoreTargets &&
            this._canUseTextureForTargets &&
            !this._scene?.getEngine().getCaps().disableMorphTargetTexture
        );
    }

    /**
     * Gets or sets an object used to store user defined information for the MorphTargetManager
     */
    public metadata: any = null;

    /**
     * Gets the active target at specified index. An active target is a target with an influence > 0
     * @param index defines the index to check
     * @returns the requested target
     */
    public getActiveTarget(index: number): MorphTarget {
        if (this._influencesAreDirty) {
            this._syncActiveTargets();
        }
        return this._activeTargets.data[index];
    }

    /**
     * Gets the target at specified index
     * @param index defines the index to check
     * @returns the requested target
     */
    public getTarget(index: number): MorphTarget {
        return this._targets[index];
    }

    /**
     * Gets the first target with the specified name
     * @param name defines the name to check
     * @returns the requested target
     */
    public getTargetByName(name: string): Nullable<MorphTarget> {
        for (const target of this._targets) {
            if (target.name === name) {
                return target;
            }
        }

        return null;
    }

    private _influencesAreDirty = false;
    private _needUpdateInfluences = false;

    /**
     * Add a new target to this manager
     * @param target defines the target to add
     */
    public addTarget(target: MorphTarget): void {
        this._targets.push(target);
        this._targetInfluenceChangedObservers.push(
            target.onInfluenceChanged.add((needUpdate) => {
                if (this.areUpdatesFrozen && needUpdate) {
                    this._forceUpdateWhenUnfrozen = true;
                }
                this._influencesAreDirty = true;
                this._needUpdateInfluences = this._needUpdateInfluences || needUpdate;
            })
        );
        this._targetDataLayoutChangedObservers.push(
            target._onDataLayoutChanged.add(() => {
                this._mustSynchronize = true;
                this._syncActiveTargets();
            })
        );
        this._mustSynchronize = true;
        this._syncActiveTargets();
    }

    /**
     * Removes a target from the manager
     * @param target defines the target to remove
     */
    public removeTarget(target: MorphTarget): void {
        const index = this._targets.indexOf(target);
        if (index >= 0) {
            this._targets.splice(index, 1);

            target.onInfluenceChanged.remove(this._targetInfluenceChangedObservers.splice(index, 1)[0]);
            target._onDataLayoutChanged.remove(this._targetDataLayoutChangedObservers.splice(index, 1)[0]);
            this._mustSynchronize = true;
            this._syncActiveTargets();
        }

        if (this._scene) {
            this._scene.stopAnimation(target);
        }
    }

    /**
     * @internal
     */
    public _bind(effect: Effect) {
        if (this._influencesAreDirty) {
            this._syncActiveTargets();
        }
        effect.setFloat3("morphTargetTextureInfo", this._textureVertexStride, this._textureWidth, this._textureHeight);
        effect.setFloatArray("morphTargetTextureIndices", this._morphTargetTextureIndices);
        effect.setTexture("morphTargets", this._targetStoreTexture);
        effect.setFloat("morphTargetCount", this.numInfluencers);
    }

    /**
     * Clone the current manager
     * @returns a new MorphTargetManager
     */
    public clone(): MorphTargetManager {
        const copy = new MorphTargetManager(this._scene);
        copy.areUpdatesFrozen = true;

        for (const target of this._targets) {
            copy.addTarget(target.clone());
        }
        copy.areUpdatesFrozen = false;

        copy.enablePositionMorphing = this.enablePositionMorphing;
        copy.enableNormalMorphing = this.enableNormalMorphing;
        copy.enableTangentMorphing = this.enableTangentMorphing;
        copy.enableUVMorphing = this.enableUVMorphing;
        copy.enableUV2Morphing = this.enableUV2Morphing;
        copy.enableColorMorphing = this.enableColorMorphing;
        copy.metadata = this.metadata;

        return copy;
    }

    /**
     * Serializes the current manager into a Serialization object
     * @returns the serialized object
     */
    public serialize(): any {
        const serializationObject: any = {};

        serializationObject.id = this.uniqueId;
        serializationObject.meshName = this.meshName;

        serializationObject.targets = [];
        for (const target of this._targets) {
            serializationObject.targets.push(target.serialize());
        }

        if (this.metadata) {
            serializationObject.metadata = this.metadata;
        }

        return serializationObject;
    }

    private _syncActiveTargets(needUpdate = false): void {
        if (this.areUpdatesFrozen) {
            return;
        }

        needUpdate = needUpdate || this._needUpdateInfluences;

        this._needUpdateInfluences = false;
        this._influencesAreDirty = false;

        const wasUsingTextureForTargets = !!this._targetStoreTexture;
        const isUsingTextureForTargets = this.isUsingTextureForTargets;

        if (this._mustSynchronize || wasUsingTextureForTargets !== isUsingTextureForTargets) {
            this._mustSynchronize = false;
            this.synchronize();
        }

        let influenceCount = 0;
        this._activeTargets.reset();

        if (!this._morphTargetTextureIndices || this._morphTargetTextureIndices.length !== this._targets.length) {
            this._morphTargetTextureIndices = new Float32Array(this._targets.length);
        }

        let targetIndex = -1;
        for (const target of this._targets) {
            targetIndex++;
            if (target.influence === 0 && this.optimizeInfluencers) {
                continue;
            }

            if (this._activeTargets.length >= MorphTargetManager.MaxActiveMorphTargetsInVertexAttributeMode && !this.isUsingTextureForTargets) {
                break;
            }

            this._activeTargets.push(target);
            this._morphTargetTextureIndices[influenceCount] = targetIndex;
            this._tempInfluences[influenceCount++] = target.influence;
        }

        if (this._morphTargetTextureIndices.length !== influenceCount) {
            this._morphTargetTextureIndices = this._morphTargetTextureIndices.slice(0, influenceCount);
        }

        if (!this._influences || this._influences.length !== influenceCount) {
            this._influences = new Float32Array(influenceCount);
        }

        for (let index = 0; index < influenceCount; index++) {
            this._influences[index] = this._tempInfluences[index];
        }

        if (needUpdate && this._scene) {
            for (const mesh of this._scene.meshes) {
                if ((<any>mesh).morphTargetManager === this) {
                    if (isUsingTextureForTargets) {
                        mesh._markSubMeshesAsAttributesDirty();
                    } else {
                        (<Mesh>mesh)._syncGeometryWithMorphTargetManager();
                    }
                }
            }
        }
    }

    /**
     * Synchronize the targets with all the meshes using this morph target manager
     */
    public synchronize(): void {
        if (!this._scene || this.areUpdatesFrozen) {
            return;
        }

        const engine = this._scene.getEngine();

        this._supportsPositions = true;
        this._supportsNormals = true;
        this._supportsTangents = true;
        this._supportsUVs = true;
        this._supportsUV2s = true;
        this._supportsColors = true;
        this._vertexCount = 0;

        this._targetStoreTexture?.dispose();
        this._targetStoreTexture = null;

        if (this.isUsingTextureForTargets && this._targets.length > engine.getCaps().texture2DArrayMaxLayerCount) {
            this.useTextureToStoreTargets = false;
        }

        for (const target of this._targets) {
            this._supportsPositions = this._supportsPositions && target.hasPositions;
            this._supportsNormals = this._supportsNormals && target.hasNormals;
            this._supportsTangents = this._supportsTangents && target.hasTangents;
            this._supportsUVs = this._supportsUVs && target.hasUVs;
            this._supportsUV2s = this._supportsUV2s && target.hasUV2s;
            this._supportsColors = this._supportsColors && target.hasColors;

            const vertexCount = target.vertexCount;
            if (this._vertexCount === 0) {
                this._vertexCount = vertexCount;
            } else if (this._vertexCount !== vertexCount) {
                Logger.Error(
                    `Incompatible target. Targets must all have the same vertices count. Current vertex count: ${this._vertexCount}, vertex count for target "${target.name}": ${vertexCount}`
                );
                return;
            }
        }

        if (this.isUsingTextureForTargets) {
            this._textureVertexStride = 0;

            this._supportsPositions && this._textureVertexStride++;
            this._supportsNormals && this._textureVertexStride++;
            this._supportsTangents && this._textureVertexStride++;
            this._supportsUVs && this._textureVertexStride++;
            this._supportsUV2s && this._textureVertexStride++;
            this._supportsColors && this._textureVertexStride++;

            this._textureWidth = this._vertexCount * this._textureVertexStride || 1;
            this._textureHeight = 1;

            const maxTextureSize = engine.getCaps().maxTextureSize;
            if (this._textureWidth > maxTextureSize) {
                this._textureHeight = Math.ceil(this._textureWidth / maxTextureSize);
                this._textureWidth = maxTextureSize;
            }

            const targetCount = this._targets.length;
            const data = new Float32Array(targetCount * this._textureWidth * this._textureHeight * 4);

            let offset = 0;
            for (let index = 0; index < targetCount; index++) {
                const target = this._targets[index];

                const positions = target.getPositions();
                const normals = target.getNormals();
                const uvs = target.getUVs();
                const tangents = target.getTangents();
                const uv2s = target.getUV2s();
                const colors = target.getColors();

                offset = index * this._textureWidth * this._textureHeight * 4;
                for (let vertex = 0; vertex < this._vertexCount; vertex++) {
                    if (this._supportsPositions && positions) {
                        data[offset] = positions[vertex * 3];
                        data[offset + 1] = positions[vertex * 3 + 1];
                        data[offset + 2] = positions[vertex * 3 + 2];
                        offset += 4;
                    }

                    if (this._supportsNormals && normals) {
                        data[offset] = normals[vertex * 3];
                        data[offset + 1] = normals[vertex * 3 + 1];
                        data[offset + 2] = normals[vertex * 3 + 2];
                        offset += 4;
                    }

                    if (this._supportsUVs && uvs) {
                        data[offset] = uvs[vertex * 2];
                        data[offset + 1] = uvs[vertex * 2 + 1];
                        offset += 4;
                    }

                    if (this._supportsTangents && tangents) {
                        data[offset] = tangents[vertex * 3];
                        data[offset + 1] = tangents[vertex * 3 + 1];
                        data[offset + 2] = tangents[vertex * 3 + 2];
                        offset += 4;
                    }

                    if (this._supportsUV2s && uv2s) {
                        data[offset] = uv2s[vertex * 2];
                        data[offset + 1] = uv2s[vertex * 2 + 1];
                        offset += 4;
                    }

                    if (this._supportsColors && colors) {
                        data[offset] = colors[vertex * 4];
                        data[offset + 1] = colors[vertex * 4 + 1];
                        data[offset + 2] = colors[vertex * 4 + 2];
                        data[offset + 3] = colors[vertex * 4 + 3];
                        offset += 4;
                    }
                }
            }

            this._targetStoreTexture = RawTexture2DArray.CreateRGBATexture(
                data,
                this._textureWidth,
                this._textureHeight,
                targetCount,
                this._scene,
                false,
                false,
                Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                Constants.TEXTURETYPE_FLOAT
            );
            this._targetStoreTexture.name = `Morph texture_${this.uniqueId}`;
        }

        // Flag meshes as dirty to resync with the active targets
        for (const mesh of this._scene.meshes) {
            if ((<any>mesh).morphTargetManager === this) {
                (<Mesh>mesh)._syncGeometryWithMorphTargetManager();
            }
        }
    }

    /**
     * Release all resources
     */
    public dispose() {
        if (this._targetStoreTexture) {
            this._targetStoreTexture.dispose();
        }

        this._targetStoreTexture = null;
        this.metadata = null;

        // Remove from scene
        if (this._scene) {
            this._scene.removeMorphTargetManager(this);

            if (this._parentContainer) {
                const index = this._parentContainer.morphTargetManagers.indexOf(this);
                if (index > -1) {
                    this._parentContainer.morphTargetManagers.splice(index, 1);
                }
                this._parentContainer = null;
            }

            for (const morph of this._targets) {
                this._scene.stopAnimation(morph);
            }
        }
    }

    // Statics

    /**
     * Creates a new MorphTargetManager from serialized data
     * @param serializationObject defines the serialized data
     * @param scene defines the hosting scene
     * @returns the new MorphTargetManager
     */
    public static Parse(serializationObject: any, scene: Scene): MorphTargetManager {
        const result = new MorphTargetManager(scene);

        for (const targetData of serializationObject.targets) {
            result.addTarget(MorphTarget.Parse(targetData, scene, result));
        }

        if (serializationObject.metadata) {
            result.metadata = serializationObject.metadata;
        }

        return result;
    }
}
