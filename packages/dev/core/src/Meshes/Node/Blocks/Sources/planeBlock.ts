import { CreatePlaneVertexData } from "../../../../Meshes/Builders/planeBuilder";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import { GeometryInputBlock } from "../geometryInputBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { Vector4 } from "../../../../Maths/math.vector";
import { PropertyTypeForEdition, editableInPropertyPage } from "../../Interfaces/nodeGeometryDecorator";

/**
 * Defines a block used to generate plane geometry data
 */
export class PlaneBlock extends NodeGeometryBlock {
    /**
     * Gets or sets a boolean indicating that this block can evaluate context
     * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
     */
    @editableInPropertyPage("Evaluate context", PropertyTypeForEdition.Boolean, "ADVANCED", { notifiers: { rebuild: true } })
    public evaluateContext = false;

    /**
     * Create a new PlaneBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("size", NodeGeometryBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("width", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("height", NodeGeometryBlockConnectionPointTypes.Float, true, 0);

        this.registerOutput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "PlaneBlock";
    }

    /**
     * Gets the size input component
     */
    public get size(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the width input component
     */
    public get width(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the height input component
     */
    public get height(): NodeGeometryConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the geometry output component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    public autoConfigure() {
        if (this.size.isConnected) {
            return;
        }

        if (!this.width.isConnected && !this.height.isConnected) {
            const sizeInput = new GeometryInputBlock("Size");
            sizeInput.value = 1;
            sizeInput.output.connectTo(this.size);
            return;
        }

        if (!this.width.isConnected) {
            const widthInput = new GeometryInputBlock("Width");
            widthInput.value = 1;
            widthInput.output.connectTo(this.width);
        }

        if (!this.height.isConnected) {
            const heightInput = new GeometryInputBlock("Height");
            heightInput.value = 1;
            heightInput.output.connectTo(this.height);
        }
    }

    protected _buildBlock(state: NodeGeometryBuildState) {
        const options: { size?: number; width?: number; height?: number; sideOrientation?: number; frontUVs?: Vector4; backUVs?: Vector4 } = {};
        const func = (state: NodeGeometryBuildState) => {
            options.size = this.size.getConnectedValue(state);
            options.width = this.width.getConnectedValue(state);
            options.height = this.height.getConnectedValue(state);

            // Append vertex data from the plane builder
            return CreatePlaneVertexData(options);
        };

        if (this.evaluateContext) {
            this.geometry._storedFunction = func;
        } else {
            this.geometry._storedValue = func(state);
        }
    }

    protected _dumpPropertiesCode() {
        const codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.evaluateContext = ${this.evaluateContext ? "true" : "false"};\r\n`;
        return codeString;
    }

    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    public serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.evaluateContext = this.evaluateContext;

        return serializationObject;
    }

    public _deserialize(serializationObject: any, rootUrl: string) {
        super._deserialize(serializationObject, rootUrl);

        this.evaluateContext = serializationObject.evaluateContext;
    }
}

RegisterClass("BABYLON.PlaneBlock", PlaneBlock);
