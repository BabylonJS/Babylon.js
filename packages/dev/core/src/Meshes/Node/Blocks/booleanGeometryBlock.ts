import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import type { VertexData } from "../../mesh.vertexData";
import type { NodeGeometryBuildState } from "../nodeGeometryBuildState";
import { PropertyTypeForEdition, editableInPropertyPage } from "../../../Decorators/nodeDecorator";
import { CSG } from "core/Meshes/csg";

/**
 * Operations supported by the boolean block
 */
export enum BooleanGeometryOperations {
    /** Intersect */
    Intersect,
    /** Subtract */
    Subtract,
    /** Union */
    Union,
}

/**
 * Block used to apply a boolean operation between 2 geometries
 */
export class BooleanGeometryBlock extends NodeGeometryBlock {
    /**
     * Gets or sets a boolean indicating that this block can evaluate context
     * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
     */
    @editableInPropertyPage("Evaluate context", PropertyTypeForEdition.Boolean, "ADVANCED", { notifiers: { rebuild: true } })
    public evaluateContext = false;

    /**
     * Gets or sets the operation applied by the block
     */
    @editableInPropertyPage("Operation", PropertyTypeForEdition.List, "ADVANCED", {
        notifiers: { rebuild: true },
        options: [
            { label: "Intersect", value: BooleanGeometryOperations.Intersect },
            { label: "Subtract", value: BooleanGeometryOperations.Subtract },
            { label: "Union", value: BooleanGeometryOperations.Union },
        ],
    })
    public operation = BooleanGeometryOperations.Intersect;

    /**
     * Create a new BooleanGeometryBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("geometry0", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.registerInput("geometry1", NodeGeometryBlockConnectionPointTypes.Geometry);

        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "BooleanGeometryBlock";
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
     * Gets the geometry output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected _buildBlock(state: NodeGeometryBuildState) {
        const func = (state: NodeGeometryBuildState) => {
            const vertexData0 = this.geometry0.getConnectedValue(state) as VertexData;
            const vertexData1 = this.geometry1.getConnectedValue(state) as VertexData;

            if (!vertexData0 || !vertexData1) {
                return null;
            }

            const CSG0 = CSG.FromVertexData(vertexData0);
            const CSG1 = CSG.FromVertexData(vertexData1);

            let boolCSG: CSG;

            switch (this.operation) {
                case BooleanGeometryOperations.Intersect:
                    boolCSG = CSG0.intersect(CSG1);
                    break;
                case BooleanGeometryOperations.Subtract:
                    boolCSG = CSG0.subtract(CSG1);
                    break;
                case BooleanGeometryOperations.Union:
                    boolCSG = CSG0.union(CSG1);
                    break;
            }

            return boolCSG.toVertexData();
        };

        if (this.evaluateContext) {
            this.output._storedFunction = func;
        } else {
            this.output._storedFunction = null;
            this.output._storedValue = func(state);
        }
    }

    protected _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.evaluateContext = ${this.evaluateContext ? "true" : "false"};\n`;
        codeString += `${this._codeVariableName}.operation = BABYLON.BooleanGeometryOperations.${BooleanGeometryOperations[this.operation]};\n`;
        return codeString;
    }

    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    public serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.evaluateContext = this.evaluateContext;
        serializationObject.operation = this.operation;

        return serializationObject;
    }

    public _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this.evaluateContext = serializationObject.evaluateContext;
        if (serializationObject.operation) {
            this.operation = serializationObject.operation;
        }
    }
}

RegisterClass("BABYLON.BooleanGeometryBlock", BooleanGeometryBlock);
