import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import type { VertexData } from "../../mesh.vertexData";
import type { NodeGeometryBuildState } from "../nodeGeometryBuildState";
import { PropertyTypeForEdition, editableInPropertyPage } from "../../../Decorators/nodeDecorator";
import { CSG2, InitializeCSG2Async, IsCSG2Ready } from "core/Meshes/csg2";
import type { Nullable } from "core/types";
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
    @editableInPropertyPage("Evaluate context", PropertyTypeForEdition.Boolean, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public evaluateContext = false;

    /**
     * Gets or sets the operation applied by the block
     */
    @editableInPropertyPage("Operation", PropertyTypeForEdition.List, "ADVANCED", {
        notifiers: { rebuild: true },
        embedded: true,
        options: [
            { label: "Intersect", value: BooleanGeometryOperations.Intersect },
            { label: "Subtract", value: BooleanGeometryOperations.Subtract },
            { label: "Union", value: BooleanGeometryOperations.Union },
        ],
    })
    public operation = BooleanGeometryOperations.Intersect;

    /**
     * Gets or sets a boolean indicating that this block can evaluate context
     * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
     */
    @editableInPropertyPage("Use old CSG engine", PropertyTypeForEdition.Boolean, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public useOldCSGEngine = false;

    private _csg2LoadingPromise: Promise<void>;
    /**
     * @internal
     */
    public override get _isReadyState(): Nullable<Promise<void>> {
        if (IsCSG2Ready()) {
            return null;
        }

        if (!this._csg2LoadingPromise) {
            this._csg2LoadingPromise = InitializeCSG2Async();
        }

        return this._csg2LoadingPromise;
    }

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
    public override getClassName() {
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

    protected override _buildBlock(state: NodeGeometryBuildState) {
        const func = (state: NodeGeometryBuildState) => {
            const vertexData0 = this.geometry0.getConnectedValue(state) as VertexData;
            const vertexData1 = this.geometry1.getConnectedValue(state) as VertexData;

            if (!vertexData0 || !vertexData1) {
                return null;
            }

            const vertexCount = vertexData0.positions!.length / 3;
            // Ensure that all the fields are filled to avoid problems later on in the graph
            if (!vertexData0.normals && vertexData1.normals) {
                vertexData0.normals = new Array<number>(vertexData0.positions!.length);
            }
            if (!vertexData1.normals && vertexData0.normals) {
                vertexData1.normals = new Array<number>(vertexData1.positions!.length);
            }
            if (!vertexData0.uvs && vertexData1.uvs) {
                vertexData0.uvs = new Array<number>(vertexCount * 2);
            }
            if (!vertexData1.uvs && vertexData0.uvs) {
                vertexData1.uvs = new Array<number>(vertexCount * 2);
            }
            if (!vertexData0.colors && vertexData1.colors) {
                vertexData0.colors = new Array<number>(vertexCount * 4);
            }
            if (!vertexData1.colors && vertexData0.colors) {
                vertexData1.colors = new Array<number>(vertexCount * 4);
            }

            let boolCSG: CSG | CSG2;

            if (this.useOldCSGEngine) {
                const csg0 = CSG.FromVertexData(vertexData0);
                const csg1 = CSG.FromVertexData(vertexData1);
                switch (this.operation) {
                    case BooleanGeometryOperations.Intersect:
                        boolCSG = csg0.intersect(csg1);
                        break;
                    case BooleanGeometryOperations.Subtract:
                        boolCSG = csg0.subtract(csg1);
                        break;
                    case BooleanGeometryOperations.Union:
                        boolCSG = csg0.union(csg1);
                        break;
                }
            } else {
                const csg0 = CSG2.FromVertexData(vertexData0);
                const csg1 = CSG2.FromVertexData(vertexData1);
                switch (this.operation) {
                    case BooleanGeometryOperations.Intersect:
                        boolCSG = csg0.intersect(csg1);
                        break;
                    case BooleanGeometryOperations.Subtract:
                        boolCSG = csg0.subtract(csg1);
                        break;
                    case BooleanGeometryOperations.Union:
                        boolCSG = csg0.add(csg1);
                        break;
                }
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

    protected override _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.evaluateContext = ${this.evaluateContext ? "true" : "false"};\n`;
        codeString += `${this._codeVariableName}.operation = BABYLON.BooleanGeometryOperations.${BooleanGeometryOperations[this.operation]};\n`;
        codeString += `${this._codeVariableName}.useOldCSGEngine = ${this.useOldCSGEngine ? "true" : "false"};\n`;
        return codeString;
    }

    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.evaluateContext = this.evaluateContext;
        serializationObject.operation = this.operation;
        serializationObject.useOldCSGEngine = this.useOldCSGEngine;

        return serializationObject;
    }

    /** @internal */
    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this.evaluateContext = serializationObject.evaluateContext;
        if (serializationObject.operation) {
            this.operation = serializationObject.operation;
        }

        this.useOldCSGEngine = !!serializationObject.useOldCSGEngine;
    }
}

RegisterClass("BABYLON.BooleanGeometryBlock", BooleanGeometryBlock);
