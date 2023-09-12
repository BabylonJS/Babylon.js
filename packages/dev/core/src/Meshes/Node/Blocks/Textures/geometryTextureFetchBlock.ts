import { Vector4, type Vector2 } from "core/Maths";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import type { INodeGeometryTextureData } from "../../Interfaces/nodeGeometryTextureData";
import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";

/**
 * Block used to fetch a color from texture data
 */
export class GeometryTextureFetchBlock extends NodeGeometryBlock {
    /**
     * Creates a new GeometryTextureFetchBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("texture", NodeGeometryBlockConnectionPointTypes.Texture);
        this.registerInput("coordinates", NodeGeometryBlockConnectionPointTypes.Vector2);
        this.registerOutput("color", NodeGeometryBlockConnectionPointTypes.Vector4);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "GeometryTextureFetchBlock";
    }

    /**
     * Gets the texture component
     */
    public get texture(): NodeGeometryConnectionPoint {
        return this.inputs[0];
    }

    /**
     * Gets the coordinates component
     */
    public get coordinates(): NodeGeometryConnectionPoint {
        return this.inputs[1];
    }

    /**
     * Gets the color component
     */
    public get color(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected _buildBlock() {
        this.color._storedFunction = (state) => {
            const textureData = this.texture.getConnectedValue(state) as INodeGeometryTextureData;
            if (!textureData || !textureData.data) {
                return null;
            }

            const uv = this.coordinates.getConnectedValue(state) as Vector2;

            const x = Math.floor(uv.x * (textureData.width - 1));
            const y = Math.floor(uv.y * (textureData.height - 1));
            const index = x + textureData.width * y;

            return Vector4.FromArray(textureData.data, index * 4);
        };
    }
}

RegisterClass("BABYLON.GeometryTextureFetchBlock", GeometryTextureFetchBlock);
