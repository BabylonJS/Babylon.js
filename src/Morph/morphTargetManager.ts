import { Observer } from "../Misc/observable";
import { SmartArray } from "../Misc/smartArray";
import { Logger } from "../Misc/logger";
import { Nullable } from "../types";
import { Scene } from "../scene";
import { EngineStore } from "../Engines/engineStore";
import { Mesh } from "../Meshes/mesh";
import { MorphTarget } from "./morphTarget";
/**
 * This class is used to deform meshes using morphing between different targets
 * @see https://doc.babylonjs.com/how_to/how_to_use_morphtargets
 */
export class MorphTargetManager {
    private _targets = new Array<MorphTarget>();
    private _targetInfluenceChangedObservers = new Array<Nullable<Observer<boolean>>>();
    private _targetDataLayoutChangedObservers = new Array<Nullable<Observer<void>>>();
    private _activeTargets = new SmartArray<MorphTarget>(16);
    private _scene: Nullable<Scene>;
    private _influences: Float32Array;
    private _supportsNormals = false;
    private _supportsTangents = false;
    private _supportsUVs = false;
    private _vertexCount = 0;
    private _uniqueId = 0;
    private _tempInfluences = new Array<number>();

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
     * Creates a new MorphTargetManager
     * @param scene defines the current scene
     */
    public constructor(scene: Nullable<Scene> = null) {
        if (!scene) {
            scene = EngineStore.LastCreatedScene;
        }

        this._scene = scene;

        if (this._scene) {
            this._scene.morphTargetManagers.push(this);

            this._uniqueId = this._scene.getUniqueId();
        }
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
     * Gets the number of targets stored in this manager
     */
    public get numTargets(): number {
        return this._targets.length;
    }

    /**
     * Gets the number of influencers (ie. the number of targets with influences > 0)
     */
    public get numInfluencers(): number {
        return this._activeTargets.length;
    }

    /**
     * Gets the list of influences (one per target)
     */
    public get influences(): Float32Array {
        return this._influences;
    }

    /**
     * Gets the active target at specified index. An active target is a target with an influence > 0
     * @param index defines the index to check
     * @returns the requested target
     */
    public getActiveTarget(index: number): MorphTarget {
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
     * Add a new target to this manager
     * @param target defines the target to add
     */
    public addTarget(target: MorphTarget): void {
        this._targets.push(target);
        this._targetInfluenceChangedObservers.push(target.onInfluenceChanged.add((needUpdate) => {
            this._syncActiveTargets(needUpdate);
        }));
        this._targetDataLayoutChangedObservers.push(target._onDataLayoutChanged.add(() => {
            this._syncActiveTargets(true);
        }));
        this._syncActiveTargets(true);
    }

    /**
     * Removes a target from the manager
     * @param target defines the target to remove
     */
    public removeTarget(target: MorphTarget): void {
        var index = this._targets.indexOf(target);
        if (index >= 0) {
            this._targets.splice(index, 1);

            target.onInfluenceChanged.remove(this._targetInfluenceChangedObservers.splice(index, 1)[0]);
            target._onDataLayoutChanged.remove(this._targetDataLayoutChangedObservers.splice(index, 1)[0]);
            this._syncActiveTargets(true);
        }
    }

    /**
     * Clone the current manager
     * @returns a new MorphTargetManager
     */
    public clone(): MorphTargetManager {
        let copy = new MorphTargetManager(this._scene);

        for (var target of this._targets) {
            copy.addTarget(target.clone());
        }

        copy.enableNormalMorphing = this.enableNormalMorphing;
        copy.enableTangentMorphing = this.enableTangentMorphing;
        copy.enableUVMorphing = this.enableUVMorphing;

        return copy;
    }

    /**
     * Serializes the current manager into a Serialization object
     * @returns the serialized object
     */
    public serialize(): any {
        var serializationObject: any = {};

        serializationObject.id = this.uniqueId;

        serializationObject.targets = [];
        for (var target of this._targets) {
            serializationObject.targets.push(target.serialize());
        }

        return serializationObject;
    }

    private _syncActiveTargets(needUpdate: boolean): void {
        let influenceCount = 0;
        this._activeTargets.reset();
        this._supportsNormals = true;
        this._supportsTangents = true;
        this._supportsUVs = true;
        this._vertexCount = 0;
        for (var target of this._targets) {
            if (target.influence === 0) {
                continue;
            }

            this._activeTargets.push(target);
            this._tempInfluences[influenceCount++] = target.influence;

            this._supportsNormals = this._supportsNormals && target.hasNormals;
            this._supportsTangents = this._supportsTangents && target.hasTangents;
            this._supportsUVs = this._supportsUVs && target.hasUVs;

            const positions = target.getPositions();
            if (positions) {
                const vertexCount = positions.length / 3;
                if (this._vertexCount === 0) {
                    this._vertexCount = vertexCount;
                }
                else if (this._vertexCount !== vertexCount) {
                    Logger.Error("Incompatible target. Targets must all have the same vertices count.");
                    return;
                }
            }
        }

        if (!this._influences || this._influences.length !== influenceCount) {
            this._influences = new Float32Array(influenceCount);
        }

        for (var index = 0; index < influenceCount; index++) {
            this._influences[index] = this._tempInfluences[index];
        }

        if (needUpdate) {
            this.synchronize();
        }
    }

    /**
     * Syncrhonize the targets with all the meshes using this morph target manager
     */
    public synchronize(): void {
        if (!this._scene) {
            return;
        }
        // Flag meshes as dirty to resync with the active targets
        for (var mesh of this._scene.meshes) {
            if ((<any>mesh).morphTargetManager === this) {
                (<Mesh>mesh)._syncGeometryWithMorphTargetManager();
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
        var result = new MorphTargetManager(scene);

        result._uniqueId = serializationObject.id;

        for (var targetData of serializationObject.targets) {
            result.addTarget(MorphTarget.Parse(targetData));
        }

        return result;
    }
}
