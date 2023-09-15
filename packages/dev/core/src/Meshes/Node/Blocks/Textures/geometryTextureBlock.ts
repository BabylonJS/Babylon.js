import type { Nullable } from "core/types";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import type { INodeGeometryTextureData } from "../../Interfaces/nodeGeometryTextureData";
import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
/**
 * Block used to load texture data
 */
export class GeometryTextureBlock extends NodeGeometryBlock {
    private _data: Nullable<Float32Array> = null;
    private _width: number;
    private _height: number;

    /**
     * Gets the texture data
     */
    public get textureData() {
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
    public getClassName() {
        return "GeometryTextureBlock";
    }

    /**
     * Gets the texture component
     */
    public get texture(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    private _prepareImgToLoadAsync(url: string) {
        return new Promise<void>((resolve, reject) => {
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
                reject();
            };

            img.src = url;
        });
    }

    /**
     * Load the texture data
     * @param imageFile defines the file to load data from
     * @returns a promise fulfilled when image data is loaded
     */
    public loadTextureFromFileAsync(imageFile: File) {
        return this._prepareImgToLoadAsync(URL.createObjectURL(imageFile));
    }

    /**
     * Load the texture data
     * @param url defines the url to load data from
     * @returns a promise fulfilled when image data is loaded
     */
    public loadTextureFromUrlAsync(url: string) {
        return this._prepareImgToLoadAsync(url);
    }

    protected _buildBlock() {
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
    public serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.width = this._width;
        serializationObject.height = this._height;
        if (this._data) {
            serializationObject.data = Array.from(this._data);
        }

        return serializationObject;
    }

    public _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this._width = serializationObject.width;
        this._height = serializationObject.height;
        if (serializationObject.data) {
            this._data = new Float32Array(serializationObject.data);
        }
    }
}

RegisterClass("BABYLON.GeometryTextureBlock", GeometryTextureBlock);
