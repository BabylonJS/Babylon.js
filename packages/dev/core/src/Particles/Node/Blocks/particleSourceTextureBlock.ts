import { Texture } from "core/Materials/Textures/texture";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../nodeParticleBuildState";
import type { Nullable } from "core/types";
import { TextureTools } from "core/Misc/textureTools";
import type { BaseTexture } from "../../../Materials/Textures/baseTexture";

/**
 * Block used to provide a texture for particles in a particle system
 */
export class ParticleTextureSourceBlock extends NodeParticleBlock {
    private _url: string = "";
    private _textureDataUrl: string = "";
    private _sourceTexture: Nullable<BaseTexture> = null;
    private _cachedData: Nullable<{
        width: number;
        height: number;
        data: Uint8ClampedArray;
    }> = null;

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
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
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
        });
    }

    /**
     * Builds the block
     * @param state defines the current build state
     */
    public override _build(state: NodeParticleBuildState) {
        if (this._sourceTexture) {
            this.texture._storedValue = this._sourceTexture;
            return;
        }

        if (!this._textureDataUrl && !this._url) {
            this.texture._storedValue = null;
            return;
        }

        if (this._textureDataUrl) {
            this.texture._storedValue = new Texture(this._textureDataUrl, state.scene);
            return;
        }

        this.texture._storedValue = new Texture(this._url, state.scene);
    }

    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.url = this.url;
        serializationObject.serializedCachedData = this.serializedCachedData;

        if (this.serializedCachedData) {
            serializationObject.textureDataUrl = this.textureDataUrl;
        }

        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this.url = serializationObject.url;
        this.serializedCachedData = !!serializationObject.serializedCachedData;

        if (serializationObject.textureDataUrl) {
            this.textureDataUrl = serializationObject.textureDataUrl;
        }
    }

    public override dispose(): void {
        if (!this._sourceTexture) {
            if (this.texture._storedValue) {
                this.texture._storedValue.dispose();
                this.texture._storedValue = null;
            }
        }
        super.dispose();
    }
}

RegisterClass("BABYLON.ParticleTextureSourceBlock", ParticleTextureSourceBlock);
