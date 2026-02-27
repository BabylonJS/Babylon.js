import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import { VertexDataMaterialInfo, type VertexData } from "../../../../Meshes/mesh.vertexData";
import { PropertyTypeForEdition, editableInPropertyPage } from "../../../../Decorators/nodeDecorator";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";

/**
 * Block used to affect a material ID to a geometry
 */
export class SetMaterialIDBlock extends NodeGeometryBlock {
    /**
     * Gets or sets a boolean indicating that this block can evaluate context
     * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
     */
    @editableInPropertyPage("Evaluate context", PropertyTypeForEdition.Boolean, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public evaluateContext = true;

    /**
     * Create a new SetMaterialIDBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.registerInput("id", NodeGeometryBlockConnectionPointTypes.Int, true, 0);

        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.id.acceptedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Float);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "SetMaterialIDBlock";
    }

    /**
     * Gets the geometry input component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the id input component
     */
    public get id(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the geometry output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock(state: NodeGeometryBuildState) {
        if (!this.geometry.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }

        const func = (state: NodeGeometryBuildState) => {
            const vertexData = this.geometry.getConnectedValue(state) as VertexData;
            if (!vertexData || !vertexData.indices || !vertexData.positions) {
                return vertexData;
            }

            const materialInfo = new VertexDataMaterialInfo();
            materialInfo.materialIndex = this.id.getConnectedValue(state) | 0;
            materialInfo.indexStart = 0;
            materialInfo.indexCount = vertexData.indices.length;
            materialInfo.verticesStart = 0;
            materialInfo.verticesCount = vertexData.positions.length / 3;

            vertexData.materialInfos = [materialInfo];

            return vertexData;
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

        if (serializationObject.evaluateContext !== undefined) {
            this.evaluateContext = serializationObject.evaluateContext;
        }
    }
}

RegisterClass("BABYLON.SetMaterialIDBlock", SetMaterialIDBlock);
