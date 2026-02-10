import { Subdivide } from "core/Meshes/mesh.vertexData.subdivide";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import { editableInPropertyPage, PropertyTypeForEdition } from "core/Decorators/nodeDecorator";
/**
 * Block used to subdivide for a geometry using Catmull-Clark algorithm
 */
export class SubdivideBlock extends NodeGeometryBlock {
    /**
     * Gets or sets a boolean indicating that this block can evaluate context
     */
    @editableInPropertyPage("Flat Only", PropertyTypeForEdition.Boolean, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public flatOnly = false;

    /**
     * Gets or sets a float defining the loop weight. i.e how much to weigh favoring heavy corners vs favoring Loop's formula
     */
    @editableInPropertyPage("Loop weight", PropertyTypeForEdition.Float, "ADVANCED", { embedded: true, min: 0, max: 1, notifiers: { rebuild: true } })
    public loopWeight = 1.0;

    /**
     * Creates a new ComputeNormalsBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.registerInput("level", NodeGeometryBlockConnectionPointTypes.Int, true, 1, 0, 8);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "SubdivideBlock";
    }

    /**
     * Gets the geometry component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the level component
     */
    public get level(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock() {
        this.output._storedFunction = (state) => {
            if (!this.geometry.isConnected) {
                return null;
            }

            const vertexData = this.geometry.getConnectedValue(state);
            if (!vertexData) {
                return null;
            }

            const level = this.level.getConnectedValue(state);

            return Subdivide(vertexData, level, {
                flatOnly: this.flatOnly,
                weight: this.loopWeight,
            });
        };
    }

    protected override _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.flatOnly = ${this.flatOnly ? "true" : "false"};\n`;
        codeString += `${this._codeVariableName}.loopWeight = ${this.loopWeight};\n`;
        return codeString;
    }

    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.flatOnly = this.flatOnly;
        serializationObject.loopWeight = this.loopWeight;

        return serializationObject;
    }

    /** @internal */
    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this.flatOnly = serializationObject.flatOnly;
        this.loopWeight = serializationObject.loopWeight;
    }
}

RegisterClass("BABYLON.SubdivideBlock", SubdivideBlock);
