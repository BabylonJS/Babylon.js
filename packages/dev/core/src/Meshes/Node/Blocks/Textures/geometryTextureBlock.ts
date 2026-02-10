import type { Nullable } from "core/types";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import type { INodeGeometryTextureData } from "../../Interfaces/nodeGeometryTextureData";
import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import type { Texture } from "core/Materials/Textures/texture";
import { TextureTools } from "core/Misc/textureTools";
/**
 * Block used to load texture data
 */
export class GeometryTextureBlock extends NodeGeometryBlock {
    private _data: Nullable<Float32Array> = null;
    private _width: number;
    private _height: number;

    /**
     * Gets or sets a boolean indicating that this block should serialize its cached data
     */
    public serializedCachedData = false;

    /**
     * Gets the texture data
     */
    public get textureData(): Nullable<Float32Array> {
        return this._data;
    }

    /**
     * Gets the texture width
     */
    public get textureWidth() {
        return this._width;
    }

    /**
     * Gets the texture height
     */
    public get textureHeight() {
        return this._height;
    }

    /**
     * Creates a new GeometryTextureBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerOutput("texture", NodeGeometryBlockConnectionPointTypes.Texture);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "GeometryTextureBlock";
    }

    /**
     * Gets the texture component
     */
    public get texture(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    private async _prepareImgToLoadAsync(url: string) {
        return await new Promise<void>((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;

                ctx!.drawImage(img, 0, 0);

                const imageData = ctx!.getImageData(0, 0, img.width, img.height);
                const pixels = imageData.data;
                const floatArray = new Float32Array(pixels.length);

                for (let i = 0; i < pixels.length; i++) {
                    floatArray[i] = pixels[i] / 255.0;
                }

                this._data = floatArray;
                this._width = img.width;
                this._height = img.height;
                resolve();
            };

            img.onerror = () => {
                this._data = null;
                reject(new Error("Failed to load image"));
            };

            img.src = url;
        });
    }

    /**
     * Remove stored data
     */
    public cleanData() {
        this._data = null;
    }

    /**
     * Load the texture data from a Float32Array
     * @param data defines the data to load
     * @param width defines the width of the texture
     * @param height defines the height of the texture
     */
    public loadTextureFromData(data: Float32Array, width: number, height: number) {
        this._data = data;
        this._width = width;
        this._height = height;
    }

    /**
     * Load the texture data
     * @param imageFile defines the file to load data from
     * @returns a promise fulfilled when image data is loaded
     */
    public async loadTextureFromFileAsync(imageFile: File) {
        return await this._prepareImgToLoadAsync(URL.createObjectURL(imageFile));
    }

    /**
     * Load the texture data
     * @param url defines the url to load data from
     * @returns a promise fulfilled when image data is loaded
     */
    public async loadTextureFromUrlAsync(url: string) {
        return await this._prepareImgToLoadAsync(url);
    }

    /**
     * Load the texture data
     * @param texture defines the source texture
     * @returns a promise fulfilled when image data is loaded
     */
    public async extractFromTextureAsync(texture: Texture) {
        return await new Promise<void>((resolve, reject) => {
            if (!texture.isReady()) {
                texture.onLoadObservable.addOnce(async () => {
                    try {
                        await this.extractFromTextureAsync(texture);
                        resolve();
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
                    const floatArray = new Float32Array(data.length);

                    for (let i = 0; i < data.length; i++) {
                        floatArray[i] = data[i] / 255.0;
                    }
                    this._data = floatArray;
                    this._width = size.width;
                    this._height = size.height;
                    resolve();
                })
                // eslint-disable-next-line github/no-then
                .catch(reject);
        });
    }

    protected override _buildBlock() {
        if (!this._data) {
            this.texture._storedValue = null;
            return;
        }

        const textureData: INodeGeometryTextureData = {
            data: this._data,
            width: this._width,
            height: this._height,
        };

        this.texture._storedValue = textureData;
    }

    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.width = this._width;
        serializationObject.height = this._height;
        serializationObject.serializedCachedData = this.serializedCachedData;
        if (this._data && this.serializedCachedData) {
            serializationObject.data = Array.from(this._data);
        }

        return serializationObject;
    }

    /** @internal */
    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this._width = serializationObject.width;
        this._height = serializationObject.height;
        if (serializationObject.data) {
            this._data = new Float32Array(serializationObject.data);
            this.serializedCachedData = true;
        } else {
            this.serializedCachedData = !!serializationObject.serializedCachedData;
        }
    }
}

RegisterClass("BABYLON.GeometryTextureBlock", GeometryTextureBlock);
