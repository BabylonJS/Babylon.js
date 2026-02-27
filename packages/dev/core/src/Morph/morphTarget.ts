import type { IAnimatable } from "../Animations/animatable.interface";
import { Observable } from "../Misc/observable";
import type { Nullable, FloatArray } from "../types";
import type { Scene } from "../scene";
import { EngineStore } from "../Engines/engineStore";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import { VertexBuffer } from "../Buffers/buffer";
import type { AnimationPropertiesOverride } from "../Animations/animationPropertiesOverride";
import { serialize } from "../Misc/decorators";
import { SerializationHelper } from "../Misc/decorators.serialization";
import { GetClass } from "../Misc/typeStore";
import type { Animation } from "../Animations/animation";
import type { MorphTargetManager } from "./morphTargetManager";

/**
 * Defines a target to use with MorphTargetManager
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/morphTargets
 */
export class MorphTarget implements IAnimatable {
    /**
     * Gets or sets the list of animations
     */
    public animations: Animation[] = [];

    private _scene: Nullable<Scene>;
    private _positions: Nullable<FloatArray> = null;
    private _normals: Nullable<FloatArray> = null;
    private _tangents: Nullable<FloatArray> = null;
    private _uvs: Nullable<FloatArray> = null;
    private _uv2s: Nullable<FloatArray> = null;
    private _colors: Nullable<FloatArray> = null;
    private _influence: number;
    private _uniqueId = 0;

    /**
     * Observable raised when the influence changes
     */
    public onInfluenceChanged = new Observable<boolean>();

    /** @internal */
    public _onDataLayoutChanged = new Observable<void>();

    /**
     * Gets or sets the influence of this target (ie. its weight in the overall morphing)
     */
    public get influence(): number {
        return this._influence;
    }

    public set influence(influence: number) {
        if (this._influence === influence) {
            return;
        }

        const previous = this._influence;
        this._influence = influence;

        if (this.onInfluenceChanged.hasObservers()) {
            this.onInfluenceChanged.notifyObservers(previous === 0 || influence === 0);
        }
    }

    /**
     * Gets or sets the id of the morph Target
     */
    @serialize()
    public id: string;

    /**
     * Gets or sets the morph target manager this morph target is associated with
     */
    @serialize()
    public morphTargetManager: Nullable<MorphTargetManager> = null;

    private _animationPropertiesOverride: Nullable<AnimationPropertiesOverride> = null;

    /**
     * Gets or sets the animation properties override
     */
    public get animationPropertiesOverride(): Nullable<AnimationPropertiesOverride> {
        if (!this._animationPropertiesOverride && this._scene) {
            return this._scene.animationPropertiesOverride;
        }
        return this._animationPropertiesOverride;
    }

    public set animationPropertiesOverride(value: Nullable<AnimationPropertiesOverride>) {
        this._animationPropertiesOverride = value;
    }

    /**
     * Creates a new MorphTarget
     * @param name defines the name of the target
     * @param influence defines the influence to use
     * @param scene defines the scene the morphtarget belongs to
     * @param morphTargetManager morph target manager this morph target is associated with
     */
    public constructor(
        public name: string,
        influence = 0,
        scene: Nullable<Scene> = null,
        morphTargetManager: Nullable<MorphTargetManager> = null
    ) {
        this.id = name;
        this.morphTargetManager = morphTargetManager;
        this._scene = scene || EngineStore.LastCreatedScene;
        this.influence = influence;

        if (this._scene) {
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
     * Gets a boolean defining if the target contains position data
     */
    public get hasPositions(): boolean {
        return !!this._positions;
    }

    /**
     * Gets a boolean defining if the target contains normal data
     */
    public get hasNormals(): boolean {
        return !!this._normals;
    }

    /**
     * Gets a boolean defining if the target contains tangent data
     */
    public get hasTangents(): boolean {
        return !!this._tangents;
    }

    /**
     * Gets a boolean defining if the target contains texture coordinates data
     */
    public get hasUVs(): boolean {
        return !!this._uvs;
    }

    /**
     * Gets a boolean defining if the target contains texture coordinates 2 data
     */
    public get hasUV2s(): boolean {
        return !!this._uv2s;
    }

    public get hasColors(): boolean {
        return !!this._colors;
    }

    /**
     * Gets the number of vertices stored in this target
     */
    public get vertexCount(): number {
        return this._positions
            ? this._positions.length / 3
            : this._normals
              ? this._normals.length / 3
              : this._tangents
                ? this._tangents.length / 3
                : this._uvs
                  ? this._uvs.length / 2
                  : this._uv2s
                    ? this._uv2s.length / 2
                    : this._colors
                      ? this._colors.length / 4
                      : 0;
    }

    /**
     * Affects position data to this target
     * @param data defines the position data to use
     */
    public setPositions(data: Nullable<FloatArray>) {
        const hadPositions = this.hasPositions;

        this._positions = data;

        if (hadPositions !== this.hasPositions) {
            this._onDataLayoutChanged.notifyObservers(undefined);
        }
    }

    /**
     * Gets the position data stored in this target
     * @returns a FloatArray containing the position data (or null if not present)
     */
    public getPositions(): Nullable<FloatArray> {
        return this._positions;
    }

    /**
     * Affects normal data to this target
     * @param data defines the normal data to use
     */
    public setNormals(data: Nullable<FloatArray>) {
        const hadNormals = this.hasNormals;

        this._normals = data;

        if (hadNormals !== this.hasNormals) {
            this._onDataLayoutChanged.notifyObservers(undefined);
        }
    }

    /**
     * Gets the normal data stored in this target
     * @returns a FloatArray containing the normal data (or null if not present)
     */
    public getNormals(): Nullable<FloatArray> {
        return this._normals;
    }

    /**
     * Affects tangent data to this target
     * @param data defines the tangent data to use
     */
    public setTangents(data: Nullable<FloatArray>) {
        const hadTangents = this.hasTangents;

        this._tangents = data;

        if (hadTangents !== this.hasTangents) {
            this._onDataLayoutChanged.notifyObservers(undefined);
        }
    }

    /**
     * Gets the tangent data stored in this target
     * @returns a FloatArray containing the tangent data (or null if not present)
     */
    public getTangents(): Nullable<FloatArray> {
        return this._tangents;
    }

    /**
     * Affects texture coordinates data to this target
     * @param data defines the texture coordinates data to use
     */
    public setUVs(data: Nullable<FloatArray>) {
        const hadUVs = this.hasUVs;

        this._uvs = data;

        if (hadUVs !== this.hasUVs) {
            this._onDataLayoutChanged.notifyObservers(undefined);
        }
    }

    /**
     * Gets the texture coordinates data stored in this target
     * @returns a FloatArray containing the texture coordinates data (or null if not present)
     */
    public getUVs(): Nullable<FloatArray> {
        return this._uvs;
    }

    /**
     * Affects texture coordinates 2 data to this target
     * @param data defines the texture coordinates 2 data to use
     */
    public setUV2s(data: Nullable<FloatArray>) {
        const hadUV2s = this.hasUV2s;

        this._uv2s = data;

        if (hadUV2s !== this.hasUV2s) {
            this._onDataLayoutChanged.notifyObservers(undefined);
        }
    }

    /**
     * Gets the texture coordinates 2 data stored in this target
     * @returns a FloatArray containing the texture coordinates 2 data (or null if not present)
     */
    public getUV2s(): Nullable<FloatArray> {
        return this._uv2s;
    }

    /**
     * Affects color data to this target
     * @param data defines the color data to use
     */
    public setColors(data: Nullable<FloatArray>) {
        const hadColors = this.hasColors;

        this._colors = data;

        if (hadColors !== this.hasColors) {
            this._onDataLayoutChanged.notifyObservers(undefined);
        }
    }

    /**
     * Gets the color data stored in this target
     * @returns a FloatArray containing the color data (or null if not present)
     */
    public getColors(): Nullable<FloatArray> {
        return this._colors;
    }

    /**
     * Clone the current target
     * @returns a new MorphTarget
     */
    public clone(): MorphTarget {
        const newOne = SerializationHelper.Clone(() => new MorphTarget(this.name, this.influence, this._scene, this.morphTargetManager), this);

        newOne._positions = this._positions;
        newOne._normals = this._normals;
        newOne._tangents = this._tangents;
        newOne._uvs = this._uvs;
        newOne._uv2s = this._uv2s;
        newOne._colors = this._colors;

        return newOne;
    }

    /**
     * Serializes the current target into a Serialization object
     * @returns the serialized object
     */
    public serialize(): any {
        const serializationObject: any = {};

        serializationObject.name = this.name;
        serializationObject.influence = this.influence;

        if (this.id != null) {
            serializationObject.id = this.id;
        }
        serializationObject.uniqueId = this.uniqueId;

        serializationObject.positions = Array.prototype.slice.call(this.getPositions());
        if (this.hasNormals) {
            serializationObject.normals = Array.prototype.slice.call(this.getNormals());
        }
        if (this.hasTangents) {
            serializationObject.tangents = Array.prototype.slice.call(this.getTangents());
        }
        if (this.hasUVs) {
            serializationObject.uvs = Array.prototype.slice.call(this.getUVs());
        }
        if (this.hasUV2s) {
            serializationObject.uv2s = Array.prototype.slice.call(this.getUV2s());
        }
        if (this.hasColors) {
            serializationObject.colors = Array.prototype.slice.call(this.getColors());
        }

        // Animations
        SerializationHelper.AppendSerializedAnimations(this, serializationObject);

        return serializationObject;
    }

    /**
     * Returns the string "MorphTarget"
     * @returns "MorphTarget"
     */
    public getClassName(): string {
        return "MorphTarget";
    }

    // Statics

    /**
     * Creates a new target from serialized data
     * @param serializationObject defines the serialized data to use
     * @param scene defines the hosting scene
     * @param morphTargetManager morph target manager this morph target is associated with
     * @returns a new MorphTarget
     */
    public static Parse(serializationObject: any, scene?: Scene, morphTargetManager: Nullable<MorphTargetManager> = null): MorphTarget {
        const result = new MorphTarget(serializationObject.name, serializationObject.influence, scene, morphTargetManager);

        result.setPositions(serializationObject.positions);

        if (serializationObject.id != null) {
            result.id = serializationObject.id;
        }
        if (serializationObject.normals) {
            result.setNormals(serializationObject.normals);
        }
        if (serializationObject.tangents) {
            result.setTangents(serializationObject.tangents);
        }
        if (serializationObject.uvs) {
            result.setUVs(serializationObject.uvs);
        }
        if (serializationObject.uv2s) {
            result.setUV2s(serializationObject.uv2s);
        }
        if (serializationObject.colors) {
            result.setColors(serializationObject.colors);
        }

        // Animations
        if (serializationObject.animations) {
            for (let animationIndex = 0; animationIndex < serializationObject.animations.length; animationIndex++) {
                const parsedAnimation = serializationObject.animations[animationIndex];
                const internalClass = GetClass("BABYLON.Animation");
                if (internalClass) {
                    result.animations.push(internalClass.Parse(parsedAnimation));
                }
            }

            if (serializationObject.autoAnimate && scene) {
                scene.beginAnimation(
                    result,
                    serializationObject.autoAnimateFrom,
                    serializationObject.autoAnimateTo,
                    serializationObject.autoAnimateLoop,
                    serializationObject.autoAnimateSpeed || 1.0
                );
            }
        }

        return result;
    }

    /**
     * Creates a MorphTarget from mesh data
     * @param mesh defines the source mesh
     * @param name defines the name to use for the new target
     * @param influence defines the influence to attach to the target
     * @returns a new MorphTarget
     */
    public static FromMesh(mesh: AbstractMesh, name?: string, influence?: number): MorphTarget {
        if (!name) {
            name = mesh.name;
        }

        const result = new MorphTarget(name, influence, mesh.getScene(), mesh.morphTargetManager);

        result.setPositions(<FloatArray>mesh.getVerticesData(VertexBuffer.PositionKind));

        if (mesh.isVerticesDataPresent(VertexBuffer.NormalKind)) {
            result.setNormals(<FloatArray>mesh.getVerticesData(VertexBuffer.NormalKind));
        }
        if (mesh.isVerticesDataPresent(VertexBuffer.TangentKind)) {
            result.setTangents(<FloatArray>mesh.getVerticesData(VertexBuffer.TangentKind));
        }
        if (mesh.isVerticesDataPresent(VertexBuffer.UVKind)) {
            result.setUVs(<FloatArray>mesh.getVerticesData(VertexBuffer.UVKind));
        }
        if (mesh.isVerticesDataPresent(VertexBuffer.UV2Kind)) {
            result.setUV2s(<FloatArray>mesh.getVerticesData(VertexBuffer.UV2Kind));
        }
        if (mesh.isVerticesDataPresent(VertexBuffer.ColorKind)) {
            result.setColors(<FloatArray>mesh.getVerticesData(VertexBuffer.ColorKind));
        }

        return result;
    }
}
