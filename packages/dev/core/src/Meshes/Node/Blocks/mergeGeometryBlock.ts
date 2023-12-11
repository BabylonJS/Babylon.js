import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import type { VertexData } from "../../../Meshes/mesh.vertexData";
import type { NodeGeometryBuildState } from "../nodeGeometryBuildState";
import { PropertyTypeForEdition, editableInPropertyPage } from "../../../Decorators/nodeDecorator";

/**
 * Block used to merge several geometries
 */
export class MergeGeometryBlock extends NodeGeometryBlock {
    /**
     * Gets or sets a boolean indicating that this block can evaluate context
     * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
     */
    @editableInPropertyPage("Evaluate context", PropertyTypeForEdition.Boolean, "ADVANCED", { notifiers: { rebuild: true } })
    public evaluateContext = false;

    /**
     * Create a new MergeGeometryBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("geometry0", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.registerInput("geometry1", NodeGeometryBlockConnectionPointTypes.Geometry, true);
        this.registerInput("geometry2", NodeGeometryBlockConnectionPointTypes.Geometry, true);
        this.registerInput("geometry3", NodeGeometryBlockConnectionPointTypes.Geometry, true);
        this.registerInput("geometry4", NodeGeometryBlockConnectionPointTypes.Geometry, true);

        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "MergeGeometryBlock";
    }

    /**
     * Gets the geometry0 input component
     */
    public get geometry0(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the geometry1 input component
     */
    public get geometry1(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the geometry2 input component
     */
    public get geometry2(): NodeGeometryConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the geometry3 input component
     */
    public get geometry3(): NodeGeometryConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the geometry4 input component
     */
    public get geometry4(): NodeGeometryConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the geometry output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected _buildBlock(state: NodeGeometryBuildState) {
        const func = (state: NodeGeometryBuildState) => {
            let vertexData = this.geometry0.getConnectedValue(state) as VertexData;
            const additionalVertexData: VertexData[] = [];

            if (vertexData) {
                vertexData = vertexData.clone(); // Preserve source data
            } else {
                return null;
            }

            if (this.geometry1.isConnected) {
                const data = this.geometry1.getConnectedValue(state);
                if (data) {
                    additionalVertexData.push(data);
                }
            }
            if (this.geometry2.isConnected) {
                const data = this.geometry2.getConnectedValue(state);
                if (data) {
                    additionalVertexData.push(data);
                }
            }
            if (this.geometry3.isConnected) {
                const data = this.geometry3.getConnectedValue(state);
                if (data) {
                    additionalVertexData.push(data);
                }
            }
            if (this.geometry4.isConnected) {
                const data = this.geometry4.getConnectedValue(state);
                if (data) {
                    additionalVertexData.push(data);
                }
            }

            if (additionalVertexData.length && vertexData) {
                vertexData = vertexData.merge(additionalVertexData, true, false, true, true);
            }
            return vertexData;
        };

        if (this.evaluateContext) {
            this.output._storedFunction = func;
        } else {
            this.output._storedFunction = null;
            this.output._storedValue = func(state);
        }
    }

    protected _dumpPropertiesCode() {
        const codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.evaluateContext = ${this.evaluateContext ? "true" : "false"};\n`;
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

    public _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this.evaluateContext = serializationObject.evaluateContext;
    }
}

RegisterClass("BABYLON.MergeGeometryBlock", MergeGeometryBlock);
