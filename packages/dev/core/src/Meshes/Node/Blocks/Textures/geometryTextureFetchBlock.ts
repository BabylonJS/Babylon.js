import { Vector4, type Vector2 } from "core/Maths/math.vector";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import type { INodeGeometryTextureData } from "../../Interfaces/nodeGeometryTextureData";
import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import { PropertyTypeForEdition, editableInPropertyPage } from "core/Decorators/nodeDecorator";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";

/**
 * Block used to fetch a color from texture data
 */
export class GeometryTextureFetchBlock extends NodeGeometryBlock {
    /**
     * Gets or sets a boolean indicating if coordinates should be clamped between 0 and 1
     */
    @editableInPropertyPage("Clamp Coordinates", PropertyTypeForEdition.Boolean, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public clampCoordinates = true;

    /**
     * Gets or sets a boolean indicating if coordinates should be clamped between 0 and 1
     */
    @editableInPropertyPage("Interpolation", PropertyTypeForEdition.Boolean, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public interpolation = true;

    /**
     * Creates a new GeometryTextureFetchBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("texture", NodeGeometryBlockConnectionPointTypes.Texture);
        this.registerInput("coordinates", NodeGeometryBlockConnectionPointTypes.Vector2);
        this.registerOutput("rgba", NodeGeometryBlockConnectionPointTypes.Vector4);
        this.registerOutput("rgb", NodeGeometryBlockConnectionPointTypes.Vector3);
        this.registerOutput("r", NodeGeometryBlockConnectionPointTypes.Float);
        this.registerOutput("g", NodeGeometryBlockConnectionPointTypes.Float);
        this.registerOutput("b", NodeGeometryBlockConnectionPointTypes.Float);
        this.registerOutput("a", NodeGeometryBlockConnectionPointTypes.Float);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
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
     * Gets the rgba component
     */
    public get rgba(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the rgb component
     */
    public get rgb(): NodeGeometryConnectionPoint {
        return this._outputs[1];
    }

    /**
     * Gets the r component
     */
    public get r(): NodeGeometryConnectionPoint {
        return this._outputs[2];
    }

    /**
     * Gets the g component
     */
    public get g(): NodeGeometryConnectionPoint {
        return this._outputs[3];
    }

    /**
     * Gets the b component
     */
    public get b(): NodeGeometryConnectionPoint {
        return this._outputs[4];
    }

    /**
     * Gets the a component
     */
    public get a(): NodeGeometryConnectionPoint {
        return this._outputs[5];
    }

    private _repeatClamp(num: number) {
        if (num >= 0) {
            return num % 1;
        } else {
            return 1 - (Math.abs(num) % 1);
        }
    }

    private _lerp(a: Vector4, b: Vector4, t: number) {
        return new Vector4(a.x * (1 - t) + b.x * t, a.y * (1 - t) + b.y * t, a.z * (1 - t) + b.z * t, a.w * (1 - t) + b.w * t);
    }

    private _getPixel(ix: number, iy: number, data: Float32Array, width: number): Vector4 {
        const i = (iy * width + ix) * 4;
        return new Vector4(data[i], data[i + 1], data[i + 2], data[i + 3]);
    }

    protected override _buildBlock() {
        const func = (state: NodeGeometryBuildState) => {
            const textureData = this.texture.getConnectedValue(state) as INodeGeometryTextureData;
            if (!textureData || !textureData.data) {
                return null;
            }

            const uv = this.coordinates.getConnectedValue(state) as Vector2;

            if (!uv) {
                return null;
            }

            const u = this.clampCoordinates ? Math.max(0, Math.min(uv.x, 1.0)) : this._repeatClamp(uv.x);
            const v = this.clampCoordinates ? Math.max(0, Math.min(uv.y, 1.0)) : this._repeatClamp(uv.y);
            const width = textureData.width;
            const height = textureData.height;
            const data = textureData.data;

            // Convert UV to texel space
            const x = u * (width - 1);
            const y = v * (height - 1);

            if (this.interpolation) {
                const x0 = Math.floor(x);
                const y0 = Math.floor(y);
                const x1 = Math.min(x0 + 1, width - 1);
                const y1 = Math.min(y0 + 1, height - 1);

                const dx = x - x0;
                const dy = y - y0;

                const c00 = this._getPixel(x0, y0, data, width);
                const c10 = this._getPixel(x1, y0, data, width);
                const c01 = this._getPixel(x0, y1, data, width);
                const c11 = this._getPixel(x1, y1, data, width);

                // Interpolate horizontally
                const top = this._lerp(c00, c10, dx);
                const bottom = this._lerp(c01, c11, dx);

                // Interpolate vertically
                return this._lerp(top, bottom, dy);
            }

            return this._getPixel(Math.floor(x), Math.floor(y), data, width);
        };

        this.rgba._storedFunction = (state) => {
            return func(state);
        };

        this.rgb._storedFunction = (state) => {
            const color = func(state) as Vector4;
            return color ? color.toVector3() : null;
        };

        this.r._storedFunction = (state) => {
            const color = func(state) as Vector4;
            return color ? color.x : null;
        };

        this.g._storedFunction = (state) => {
            const color = func(state) as Vector4;
            return color ? color.y : null;
        };

        this.b._storedFunction = (state) => {
            const color = func(state) as Vector4;
            return color ? color.z : null;
        };

        this.a._storedFunction = (state) => {
            const color = func(state) as Vector4;
            return color ? color.w : null;
        };
    }

    protected override _dumpPropertiesCode() {
        const codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.clampCoordinates = ${this.clampCoordinates};\n`;
        return codeString;
    }

    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.clampCoordinates = this.clampCoordinates;
        serializationObject.interpolation = this.interpolation;

        return serializationObject;
    }

    /** @internal */
    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this.clampCoordinates = serializationObject.clampCoordinates;
        if (serializationObject.clampCoordinates === undefined) {
            this.interpolation = serializationObject.interpolation;
        }
    }
}

RegisterClass("BABYLON.GeometryTextureFetchBlock", GeometryTextureFetchBlock);
