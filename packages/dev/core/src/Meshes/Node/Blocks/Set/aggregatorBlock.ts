import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import type { INodeGeometryExecutionContext } from "../../Interfaces/nodeGeometryExecutionContext";
import type { VertexData } from "../../../../Meshes/mesh.vertexData";
import { PropertyTypeForEdition, editableInPropertyPage } from "core/Decorators/nodeDecorator";
import { Vector2, Vector3, Vector4 } from "core/Maths/math.vector";
import type { Nullable } from "core/types";

/**
 * Conditions supported by the condition block
 */
export enum Aggregations {
    /** Max */
    Max,
    /** Min */
    Min,
    /** Sum */
    Sum,
}

/**
 * Block used to extract a valuefrom a geometry
 */
export class AggregatorBlock extends NodeGeometryBlock implements INodeGeometryExecutionContext {
    private _vertexData: VertexData;
    private _currentIndex: number;

    /**
     * Gets or sets the test used by the block
     */
    @editableInPropertyPage("Aggregation", PropertyTypeForEdition.List, "ADVANCED", {
        notifiers: { rebuild: true },
        embedded: true,
        options: [
            { label: "Max", value: Aggregations.Max },
            { label: "Min", value: Aggregations.Min },
            { label: "Sum", value: Aggregations.Sum },
        ],
    })
    public aggregation = Aggregations.Sum;

    /**
     * Gets or sets a boolean indicating that this block can evaluate context
     * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
     */
    @editableInPropertyPage("Evaluate context", PropertyTypeForEdition.Boolean, "ADVANCED", { notifiers: { rebuild: true } })
    public evaluateContext = true;

    /**
     * Create a new SetPositionsBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.registerInput("source", NodeGeometryBlockConnectionPointTypes.AutoDetect);

        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.BasedOnInput);
        this._outputs[0]._typeConnectionSource = this._inputs[1];
    }

    /**
     * Gets the current index in the current flow
     * @returns the current index
     */
    public getExecutionIndex(): number {
        return this._currentIndex;
    }

    /**
     * Gets the current loop index in the current flow
     * @returns the current loop index
     */
    public getExecutionLoopIndex(): number {
        return this._currentIndex;
    }

    /**
     * Gets the current face index in the current flow
     * @returns the current face index
     */
    public getExecutionFaceIndex(): number {
        return 0;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "AggregatorBlock";
    }

    /**
     * Gets the geometry input component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the source input component
     */
    public get source(): NodeGeometryConnectionPoint {
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
            state.pushExecutionContext(this);

            this._vertexData = this.geometry.getConnectedValue(state);

            state.pushGeometryContext(this._vertexData);

            if (!this._vertexData || !this._vertexData.positions || !this.source.isConnected) {
                state.restoreGeometryContext();
                state.restoreExecutionContext();
                this.output._storedValue = null;
                return;
            }

            // Processing
            const vertexCount = this._vertexData.positions.length / 3;
            const context: any[] = [];
            for (this._currentIndex = 0; this._currentIndex < vertexCount; this._currentIndex++) {
                context.push(this.source.getConnectedValue(state));
            }

            // Aggregation
            let func: Nullable<(a: number, b: number) => number> = null;

            switch (this.aggregation) {
                case Aggregations.Max: {
                    func = (a: number, b: number) => Math.max(a, b);
                    break;
                }
                case Aggregations.Min: {
                    func = (a: number, b: number) => Math.min(a, b);
                    break;
                }
                case Aggregations.Sum: {
                    func = (a: number, b: number) => a + b;
                    break;
                }
            }

            if (!func) {
                state.restoreGeometryContext();
                state.restoreExecutionContext();
                this.output._storedFunction = null;
                this.output._storedValue = null;
                return;
            }

            let returnValue: any;

            switch (this.source.type) {
                case NodeGeometryBlockConnectionPointTypes.Int:
                case NodeGeometryBlockConnectionPointTypes.Float: {
                    returnValue = (context as number[]).reduce(func);
                    break;
                }
                case NodeGeometryBlockConnectionPointTypes.Vector2: {
                    const x = (context as Vector2[]).map((v) => v.x).reduce(func);
                    const y = (context as Vector2[]).map((v) => v.y).reduce(func);
                    returnValue = new Vector2(x, y);
                    break;
                }
                case NodeGeometryBlockConnectionPointTypes.Vector3: {
                    const x = (context as Vector3[]).map((v) => v.x).reduce(func);
                    const y = (context as Vector3[]).map((v) => v.y).reduce(func);
                    const z = (context as Vector3[]).map((v) => v.z).reduce(func);
                    returnValue = new Vector3(x, y, z);
                    break;
                }
                case NodeGeometryBlockConnectionPointTypes.Vector4: {
                    const x = (context as Vector4[]).map((v) => v.x).reduce(func);
                    const y = (context as Vector4[]).map((v) => v.y).reduce(func);
                    const z = (context as Vector4[]).map((v) => v.z).reduce(func);
                    const w = (context as Vector4[]).map((v) => v.w).reduce(func);
                    returnValue = new Vector4(x, y, z, w);
                    break;
                }
            }

            // Storage
            state.restoreGeometryContext();
            state.restoreExecutionContext();
            return returnValue;
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
        codeString += `${this._codeVariableName}.aggregation = BABYLON.Aggregations.${Aggregations[this.aggregation]};\n`;
        return codeString;
    }

    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.evaluateContext = this.evaluateContext;
        serializationObject.aggregation = this.aggregation;

        return serializationObject;
    }

    /** @internal */
    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        if (serializationObject.evaluateContext !== undefined) {
            this.evaluateContext = serializationObject.evaluateContext;
        }
        if (serializationObject.aggregation !== undefined) {
            this.aggregation = serializationObject.aggregation;
        }
    }
}

RegisterClass("BABYLON.AggregatorBlock", AggregatorBlock);
