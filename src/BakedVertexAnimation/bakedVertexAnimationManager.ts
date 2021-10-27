import { Nullable } from "../types";
import { Scene } from "../scene";
import { serialize, expandToProperty, serializeAsTexture, SerializationHelper } from "../Misc/decorators";
import { BaseTexture } from '../Materials/Textures/baseTexture';
import { Vector4 } from "../Maths/math.vector";
import { Effect } from "../Materials/effect";

export class BakedVertexAnimationManager {
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
    public animationParameters: Vector4;

    /**
     * The time counter, to pick the correct animation frame.
     */
    public time = 0;

    constructor(scene: Scene) {
        this._scene = scene;
    }

    /** @hidden */
    public _markSubMeshesAsAttributesDirty(): void {
        for (const mesh of this._scene.meshes) {
            if ((<any>mesh).bakedVertexAnimationManager === this) {
                mesh._markSubMeshesAsAttributesDirty();
            }
        }
    }

    public bind(effect: Effect, useInstances = false) {
        if (!this._texture || !this._isEnabled) {
            return;
        }

        const size = this._texture.getSize();
        effect.setFloat2(
            "bakedVertexAnimationTextureSizeInverted",
            1.0 / size.width,
            1.0 / size.height
        );
        effect.setFloat("bakedVertexAnimationTime", this.time);

        if (!useInstances) {
            effect.setVector4("bakedVertexAnimationSettings", this.animationParameters);
        }

        effect.setTexture("bakedVertexAnimationTexture", this._texture);
    }


    /**
     * Sets animation parameters.
     * @param startFrame The first frame of the animation.
     * @param endFrame The last frame of the animation.
     * @param offset The offset when starting the animation.
     * @param speedFramesPerSecond The frame rate.
     */
    public setAnimationParameters(
        startFrame: number,
        endFrame: number,
        offset: number = 0,
        speedFramesPerSecond: number = 30
    ): void {
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
