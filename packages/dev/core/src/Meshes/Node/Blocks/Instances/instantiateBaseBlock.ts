import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import type { INodeGeometryExecutionContext } from "../../Interfaces/nodeGeometryExecutionContext";
import type { VertexData } from "../../../mesh.vertexData";
import { PropertyTypeForEdition, editableInPropertyPage } from "core/Decorators/nodeDecorator";
import type { INodeGeometryInstancingContext } from "../../Interfaces/nodeGeometryInstancingContext";

/**
 * Block used as a base for InstantiateXXX blocks
 */
export abstract class InstantiateBaseBlock extends NodeGeometryBlock implements INodeGeometryExecutionContext, INodeGeometryInstancingContext {
    protected _vertexData: VertexData;
    protected _currentIndex: number;

    /**
     * Gets or sets a boolean indicating that this block can evaluate context
     * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
     */
    @editableInPropertyPage("Evaluate context", PropertyTypeForEdition.Boolean, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public evaluateContext = true;

    /**
     * Create a new InstantiateBaseBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("instance", NodeGeometryBlockConnectionPointTypes.Geometry, true);
        this.registerInput("count", NodeGeometryBlockConnectionPointTypes.Int, true, 1);

        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current instance index in the current flow
     * @returns the current index
     */
    public getInstanceIndex(): number {
        return this._currentIndex;
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
        return "InstantiateBaseBlock";
    }

    /**
     * Gets the instance input component
     */
    public get instance(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the count input component
     */
    public get count(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the geometry output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected override _dumpPropertiesCode() {
        const codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.evaluateContext = ${this.evaluateContext ? "true" : "false"};\n`;
        return codeString;
    }

    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.evaluateContext = this.evaluateContext;

        return serializationObject;
    }

    /** @internal */
    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        if (serializationObject.evaluateContext !== undefined) {
            this.evaluateContext = serializationObject.evaluateContext;
        }
    }
}
