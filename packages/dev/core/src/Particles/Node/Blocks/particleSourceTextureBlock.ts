import type { NodeParticleConnectionPoint } from "../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../nodeParticleBuildState";
import type { Nullable } from "core/types";
import type { BaseTexture } from "../../../Materials/Textures/baseTexture";
import type { ProceduralTexture } from "../../../Materials/Textures/Procedurals/proceduralTexture";

import { Texture } from "core/Materials/Textures/texture";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../nodeParticleBlock";
import { TextureTools } from "core/Misc/textureTools";

/**
 * Interface used to define texture data
 */
export interface INodeParticleTextureData {
    /** Width of the texture in pixels */
    width: number;
    /** Height of the texture in pixels */
    height: number;
    /** RGBA pixel data */
    data: Uint8ClampedArray;
}

/**
 * Block used to provide a texture for particles in a particle system
 */
export class ParticleTextureSourceBlock extends NodeParticleBlock {
    private _url: string = "";
    private _textureDataUrl: string = "";
    private _sourceTexture: Nullable<BaseTexture> = null;
    private _cachedData: Nullable<INodeParticleTextureData> = null;
    private _clonedTextures: BaseTexture[] = [];

    /**
     * Gets or sets the strenght of the flow map effect
     */
    public invertY = true;

    /**
     * Indicates if the texture data should be serialized as a base64 string.
     */
    public serializedCachedData: boolean = false;

    /**
     * Gets or sets the URL of the texture to be used by this block.
     */
    public get url(): string {
        return this._url;
    }

    public set url(value: string) {
        if (this._url === value) {
            return;
        }
        this._cachedData = null;
        this._url = value;
        this._textureDataUrl = "";
        this._sourceTexture = null;
    }

    /**
     * Gets or sets the data URL of the texture to be used by this block.
     * This is a base64 encoded string representing the texture data.
     */
    public get textureDataUrl(): string {
        return this._textureDataUrl;
    }

    public set textureDataUrl(value: string) {
        if (this._textureDataUrl === value) {
            return;
        }

        this._cachedData = null;
        this._textureDataUrl = value;
        this._url = "";
        this._sourceTexture = null;
    }

    /**
     * Directly sets the texture to be used by this block.
     * This value will not be serialized.
     */
    public set sourceTexture(value: Nullable<BaseTexture>) {
        if (this._sourceTexture === value) {
            return;
        }
        this._cachedData = null;
        this._sourceTexture = value;
        this._url = (value as Texture).url || "";
        this._textureDataUrl = "";
    }

    /**
     * Create a new ParticleTextureSourceBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerOutput("texture", NodeParticleBlockConnectionPointTypes.Texture);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ParticleTextureSourceBlock";
    }

    /**
     * Gets the texture output component
     */
    public get texture(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the texture content as a promise
     * @returns a promise that resolves to the texture content, including width, height, and pixel data
     */
    async extractTextureContentAsync() {
        if (!this.texture._storedValue && !this._sourceTexture) {
            return null;
        }

        if (this._cachedData) {
            return this._cachedData;
        }

        const texture = this.texture._storedValue || this._sourceTexture;
        return await new Promise<
            Nullable<{
                width: number;
                height: number;
                data: Uint8ClampedArray;
            }>
        >((resolve, reject) => {
            if (!texture.isReady()) {
                texture.onLoadObservable.addOnce(async () => {
                    try {
                        this._cachedData = await this.extractTextureContentAsync();
                        resolve(this._cachedData);
                    } catch (e) {
                        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                        reject(e);
                    }
                });
                return;
            }
            const size = texture.getSize();
            if (texture.getContent) {
                const proceduralTexture = texture as ProceduralTexture;
                proceduralTexture
                    .getContent()
                    // eslint-disable-next-line github/no-then
                    ?.then((data) => {
                        this._cachedData = {
                            width: size.width,
                            height: size.height,
                            data: data as Uint8ClampedArray,
                        };
                        resolve(this._cachedData);
                    })
                    // eslint-disable-next-line github/no-then
                    .catch(reject);
            } else {
                TextureTools.GetTextureDataAsync(texture, size.width, size.height)
                    // eslint-disable-next-line github/no-then
                    .then((data) => {
                        this._cachedData = {
                            width: size.width,
                            height: size.height,
                            data: new Uint8ClampedArray(data),
                        };
                        texture.dispose();
                        resolve(this._cachedData);
                    })
                    // eslint-disable-next-line github/no-then
                    .catch(reject);
            }
        });
    }

    /**
     * Builds the block
     * @param state defines the current build state
     */
    public override _build(state: NodeParticleBuildState) {
        if (this._sourceTexture) {
            // The same NodeParticleSystemSet can be built into multiple scenes/engines
            // (original system scene, editor preview scene).
            // Textures are engine-specific, so we need to handle cross-engine cases.
            const sourceScene = this._sourceTexture.getScene?.();
            const sourceEngine = sourceScene?.getEngine?.();
            const targetEngine = state.scene.getEngine();

            if (sourceEngine && sourceEngine !== targetEngine) {
                // Cross-engine: recreate texture from URL if available, preserving invertY
                const url = (this._sourceTexture as Texture).url || this._url;
                if (url) {
                    const invertY = (this._sourceTexture as Texture).invertY ?? this.invertY;
                    const tex = new Texture(url, state.scene, undefined, invertY);
                    this._copyTextureProperties(this._sourceTexture, tex);
                    this._clonedTextures.push(tex);
                    this.texture._storedValue = tex;
                    return;
                }
                // No URL available - use the source texture directly as fallback
                // This may not render correctly but avoids breaking completely
                this.texture._storedValue = this._sourceTexture;
                return;
            }

            // Same engine: clone works correctly and preserves all properties
            const cloned = this._sourceTexture.clone();
            if (cloned) {
                this._clonedTextures.push(cloned);
                this.texture._storedValue = cloned;
            } else {
                this.texture._storedValue = this._sourceTexture;
            }
            return;
        }

        if (!this._textureDataUrl && !this._url) {
            this.texture._storedValue = null;
            return;
        }

        if (this._textureDataUrl) {
            const tex = new Texture(this._textureDataUrl, state.scene, undefined, this.invertY);
            this._clonedTextures.push(tex);
            this.texture._storedValue = tex;
            return;
        }

        const tex = new Texture(this._url, state.scene, undefined, this.invertY);
        this._clonedTextures.push(tex);
        this.texture._storedValue = tex;
    }

    /**
     * Serializes this block
     * @returns the serialization object
     */
    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.url = this.url;
        serializationObject.serializedCachedData = this.serializedCachedData;
        serializationObject.invertY = this.invertY;

        if (this.serializedCachedData) {
            serializationObject.textureDataUrl = this.textureDataUrl;
        }

        return serializationObject;
    }

    /**
     * Deserializes this block from a serialization object
     * @param serializationObject the serialization object
     */
    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this.url = serializationObject.url;
        this.serializedCachedData = !!serializationObject.serializedCachedData;
        this.invertY = !!serializationObject.invertY;

        if (serializationObject.textureDataUrl) {
            this.textureDataUrl = serializationObject.textureDataUrl;
        }
    }

    /**
     * Disposes the block and its associated resources
     */
    public override dispose(): void {
        // Dispose all cloned textures we created
        for (const tex of this._clonedTextures) {
            tex.dispose();
        }
        this._clonedTextures = [];
        this.texture._storedValue = null;
        // Never dispose _sourceTexture - it's owned by the caller
        super.dispose();
    }

    /**
     * Copies texture properties from source to target texture
     * @param source - The source texture to copy properties from
     * @param target - The target texture to copy properties to
     */
    private _copyTextureProperties(source: BaseTexture, target: BaseTexture): void {
        // BaseTexture properties
        target.hasAlpha = source.hasAlpha;
        target.level = source.level;
        target.coordinatesIndex = source.coordinatesIndex;
        target.coordinatesMode = source.coordinatesMode;
        target.wrapU = source.wrapU;
        target.wrapV = source.wrapV;
        target.wrapR = source.wrapR;
        target.anisotropicFilteringLevel = source.anisotropicFilteringLevel;

        // Texture-specific properties (if both are Texture instances)
        const sourceTexture = source as Texture;
        const targetTexture = target as Texture;
        if (sourceTexture.uOffset !== undefined && targetTexture.uOffset !== undefined) {
            targetTexture.uOffset = sourceTexture.uOffset;
            targetTexture.vOffset = sourceTexture.vOffset;
            targetTexture.uScale = sourceTexture.uScale;
            targetTexture.vScale = sourceTexture.vScale;
            targetTexture.uAng = sourceTexture.uAng;
            targetTexture.vAng = sourceTexture.vAng;
            targetTexture.wAng = sourceTexture.wAng;
        }
    }
}

RegisterClass("BABYLON.ParticleTextureSourceBlock", ParticleTextureSourceBlock);
