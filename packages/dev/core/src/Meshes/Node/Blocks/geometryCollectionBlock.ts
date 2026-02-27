import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import type { VertexData } from "../../mesh.vertexData";
import type { NodeGeometryBuildState } from "../nodeGeometryBuildState";
import { PropertyTypeForEdition, editableInPropertyPage } from "../../../Decorators/nodeDecorator";

/**
 * Block used to randomly pick a geometry from a collection
 */
export class GeometryCollectionBlock extends NodeGeometryBlock {
    /**
     * Gets or sets a boolean indicating that this block can evaluate context
     * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
     */
    @editableInPropertyPage("Evaluate context", PropertyTypeForEdition.Boolean, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public evaluateContext = true;

    /**
     * Create a new GeometryCollectionBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("geometry0", NodeGeometryBlockConnectionPointTypes.Geometry, true);
        this.registerInput("geometry1", NodeGeometryBlockConnectionPointTypes.Geometry, true);
        this.registerInput("geometry2", NodeGeometryBlockConnectionPointTypes.Geometry, true);
        this.registerInput("geometry3", NodeGeometryBlockConnectionPointTypes.Geometry, true);
        this.registerInput("geometry4", NodeGeometryBlockConnectionPointTypes.Geometry, true);
        this.registerInput("geometry5", NodeGeometryBlockConnectionPointTypes.Geometry, true);
        this.registerInput("geometry6", NodeGeometryBlockConnectionPointTypes.Geometry, true);
        this.registerInput("geometry7", NodeGeometryBlockConnectionPointTypes.Geometry, true);
        this.registerInput("geometry8", NodeGeometryBlockConnectionPointTypes.Geometry, true);
        this.registerInput("geometry9", NodeGeometryBlockConnectionPointTypes.Geometry, true);

        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Geometry);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._linkConnectionTypes(0, 1);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "GeometryCollectionBlock";
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
     * Gets the geometry5 input component
     */
    public get geometry5(): NodeGeometryConnectionPoint {
        return this._inputs[5];
    }

    /**
     * Gets the geometry6 input component
     */
    public get geometry6(): NodeGeometryConnectionPoint {
        return this._inputs[6];
    }

    /**
     * Gets the geometry7 input component
     */
    public get geometry7(): NodeGeometryConnectionPoint {
        return this._inputs[7];
    }

    /**
     * Gets the geometry8 input component
     */
    public get geometry8(): NodeGeometryConnectionPoint {
        return this._inputs[8];
    }

    /**
     * Gets the geometry9 input component
     */
    public get geometry9(): NodeGeometryConnectionPoint {
        return this._inputs[9];
    }

    /**
     * Gets the geometry output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    private _storeGeometry(input: NodeGeometryConnectionPoint, state: NodeGeometryBuildState, index: number, availables: VertexData[]) {
        if (input.isConnected) {
            const vertexData = input.getConnectedValue(state) as VertexData;
            if (!vertexData) {
                return;
            }
            vertexData.metadata = vertexData.metadata || {};
            vertexData.metadata.collectionId = index;
            availables.push(vertexData);
        }
    }

    protected override _buildBlock(state: NodeGeometryBuildState) {
        const func = (state: NodeGeometryBuildState) => {
            const availables: VertexData[] = [];

            this._storeGeometry(this.geometry0, state, 0, availables);
            this._storeGeometry(this.geometry1, state, 1, availables);
            this._storeGeometry(this.geometry2, state, 2, availables);
            this._storeGeometry(this.geometry3, state, 3, availables);
            this._storeGeometry(this.geometry4, state, 4, availables);
            this._storeGeometry(this.geometry5, state, 5, availables);
            this._storeGeometry(this.geometry6, state, 6, availables);
            this._storeGeometry(this.geometry7, state, 7, availables);
            this._storeGeometry(this.geometry8, state, 8, availables);
            this._storeGeometry(this.geometry9, state, 9, availables);

            if (!availables.length) {
                return null;
            }
            return availables[Math.round(Math.random() * (availables.length - 1))];
        };

        if (this.evaluateContext) {
            this.output._storedFunction = func;
        } else {
            this.output._storedFunction = null;
            this.output._storedValue = func(state);
        }
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

        this.evaluateContext = serializationObject.evaluateContext;
    }
}

RegisterClass("BABYLON.GeometryCollectionBlock", GeometryCollectionBlock);
