import type { Nullable } from "../types";
import type { Scene } from "../scene";
import { serialize, expandToProperty, serializeAsTexture, SerializationHelper } from "../Misc/decorators";
import type { BaseTexture } from "../Materials/Textures/baseTexture";
import { Vector4 } from "../Maths/math.vector";
import type { Effect } from "../Materials/effect";
import { EngineStore } from "../Engines/engineStore";

/**
 * Interface for baked vertex animation texture, see BakedVertexAnimationManager
 * @since 5.0
 */
export interface IBakedVertexAnimationManager {
    /**
     * The vertex animation texture
     */
    texture: Nullable<BaseTexture>;

    /**
     * Gets or sets a boolean indicating if the edgesRenderer is active
     */
    isEnabled: boolean;

    /**
     * The animation parameters for the mesh. See setAnimationParameters()
     */
    animationParameters: Vector4;

    /**
     * The time counter, to pick the correct animation frame.
     */
    time: number;

    /**
     * Binds to the effect.
     * @param effect The effect to bind to.
     * @param useInstances True when it's an instance.
     */
    bind(effect: Effect, useInstances: boolean): void;

    /**
     * Sets animation parameters.
     * @param startFrame The first frame of the animation.
     * @param endFrame The last frame of the animation.
     * @param offset The offset when starting the animation.
     * @param speedFramesPerSecond The frame rate.
     */
    setAnimationParameters(startFrame: number, endFrame: number, offset: number, speedFramesPerSecond: number): void;

    /**
     * Disposes the resources of the manager.
     * @param forceDisposeTextures - Forces the disposal of all textures.
     */
    dispose(forceDisposeTextures?: boolean): void;

    /**
     * Get the current class name useful for serialization or dynamic coding.
     * @returns "BakedVertexAnimationManager"
     */
    getClassName(): string;
}

/**
 * This class is used to animate meshes using a baked vertex animation texture
 * @see https://doc.babylonjs.com/divingDeeper/animation/baked_texture_animations
 * @since 5.0
 */
export class BakedVertexAnimationManager implements IBakedVertexAnimationManager {
    private _scene: Scene;

    private _texture: Nullable<BaseTexture> = null;
    /**
     * The vertex animation texture
     */
    @serializeAsTexture()
    @expandToProperty("_markSubMeshesAsAttributesDirty")
    public texture: Nullable<BaseTexture>;

    private _isEnabled = true;
    /**
     * Enable or disable the vertex animation manager
     */
    @serialize()
    @expandToProperty("_markSubMeshesAsAttributesDirty")
    public isEnabled = true;

    /**
     * The animation parameters for the mesh. See setAnimationParameters()
     */
    @serialize()
    public animationParameters: Vector4;

    /**
     * The time counter, to pick the correct animation frame.
     */
    @serialize()
    public time = 0;

    /**
     * Creates a new BakedVertexAnimationManager
     * @param scene defines the current scene
     */
    constructor(scene?: Nullable<Scene>) {
        scene = scene || EngineStore.LastCreatedScene;
        if (!scene) {
            return;
        }
        this._scene = scene;
        this.animationParameters = new Vector4(0, 0, 0, 30);
    }

    /** @internal */
    public _markSubMeshesAsAttributesDirty(): void {
        for (const mesh of this._scene.meshes) {
            if ((<any>mesh).bakedVertexAnimationManager === this) {
                mesh._markSubMeshesAsAttributesDirty();
            }
        }
    }

    /**
     * Binds to the effect.
     * @param effect The effect to bind to.
     * @param useInstances True when it's an instance.
     */
    public bind(effect: Effect, useInstances = false): void {
        if (!this._texture || !this._isEnabled) {
            return;
        }

        const size = this._texture.getSize();
        effect.setFloat2("bakedVertexAnimationTextureSizeInverted", 1.0 / size.width, 1.0 / size.height);
        effect.setFloat("bakedVertexAnimationTime", this.time);

        if (!useInstances) {
            effect.setVector4("bakedVertexAnimationSettings", this.animationParameters);
        }

        effect.setTexture("bakedVertexAnimationTexture", this._texture);
    }

    /**
     * Clone the current manager
     * @returns a new BakedVertexAnimationManager
     */
    public clone(): BakedVertexAnimationManager {
        const copy = new BakedVertexAnimationManager(this._scene);
        this.copyTo(copy);
        return copy;
    }

    /**
     * Sets animation parameters.
     * @param startFrame The first frame of the animation.
     * @param endFrame The last frame of the animation.
     * @param offset The offset when starting the animation.
     * @param speedFramesPerSecond The frame rate.
     */
    public setAnimationParameters(startFrame: number, endFrame: number, offset: number = 0, speedFramesPerSecond: number = 30): void {
        this.animationParameters = new Vector4(startFrame, endFrame, offset, speedFramesPerSecond);
    }

    /**
     * Disposes the resources of the manager.
     * @param forceDisposeTextures - Forces the disposal of all textures.
     */
    public dispose(forceDisposeTextures?: boolean): void {
        if (forceDisposeTextures) {
            this._texture?.dispose();
        }
    }

    /**
     * Get the current class name useful for serialization or dynamic coding.
     * @returns "BakedVertexAnimationManager"
     */
    public getClassName(): string {
        return "BakedVertexAnimationManager";
    }

    /**
     * Makes a duplicate of the current instance into another one.
     * @param vatMap define the instance where to copy the info
     */
    public copyTo(vatMap: BakedVertexAnimationManager): void {
        SerializationHelper.Clone(() => vatMap, this);
    }

    /**
     * Serializes this vertex animation instance
     * @returns - An object with the serialized instance.
     */
    public serialize(): any {
        return SerializationHelper.Serialize(this);
    }

    /**
     * Parses a vertex animation setting from a serialized object.
     * @param source - Serialized object.
     * @param scene Defines the scene we are parsing for
     * @param rootUrl Defines the rootUrl to load from
     */
    public parse(source: any, scene: Scene, rootUrl: string): void {
        SerializationHelper.Parse(() => this, source, scene, rootUrl);
    }
}
