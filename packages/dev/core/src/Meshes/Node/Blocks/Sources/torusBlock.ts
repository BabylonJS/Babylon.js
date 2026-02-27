import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import { GeometryInputBlock } from "../geometryInputBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { Vector4 } from "../../../../Maths/math.vector";
import { CreateTorusVertexData } from "core/Meshes/Builders/torusBuilder";
import { PropertyTypeForEdition, editableInPropertyPage } from "../../../../Decorators/nodeDecorator";

/**
 * Defines a block used to generate torus geometry data
 */
export class TorusBlock extends NodeGeometryBlock {
    /**
     * Gets or sets a boolean indicating that this block can evaluate context
     * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
     */
    @editableInPropertyPage("Evaluate context", PropertyTypeForEdition.Boolean, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public evaluateContext = false;

    /**
     * Create a new TorusBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("diameter", NodeGeometryBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("thickness", NodeGeometryBlockConnectionPointTypes.Float, true, 0.5);
        this.registerInput("tessellation", NodeGeometryBlockConnectionPointTypes.Int, true, 16);

        this.registerOutput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "TorusBlock";
    }

    /**
     * Gets the diameter input component
     */
    public get diameter(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the thickness input component
     */
    public get thickness(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the tessellation input component
     */
    public get tessellation(): NodeGeometryConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the geometry output component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    /** @internal */
    public override autoConfigure() {
        if (!this.diameter.isConnected) {
            const diameterInput = new GeometryInputBlock("Diameter");
            diameterInput.value = 1;
            diameterInput.output.connectTo(this.diameter);
        }
    }

    protected override _buildBlock(state: NodeGeometryBuildState) {
        const options: {
            diameter?: number;
            thickness?: number;
            tessellation?: number;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
        } = {};
        const func = (state: NodeGeometryBuildState) => {
            options.thickness = this.thickness.getConnectedValue(state);
            options.diameter = this.diameter.getConnectedValue(state);
            options.tessellation = this.tessellation.getConnectedValue(state);

            // Append vertex data from the plane builder
            return CreateTorusVertexData(options);
        };

        if (this.evaluateContext) {
            this.geometry._storedFunction = func;
        } else {
            const value = func(state);
            this.geometry._storedFunction = () => {
                this.geometry._executionCount = 1;
                return value.clone();
            };
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

RegisterClass("BABYLON.TorusBlock", TorusBlock);
