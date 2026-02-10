import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import { GeometryInputBlock } from "../geometryInputBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { Vector4 } from "../../../../Maths/math.vector";
import { CreateSphereVertexData } from "core/Meshes/Builders/sphereBuilder";
import { PropertyTypeForEdition, editableInPropertyPage } from "../../../../Decorators/nodeDecorator";

/**
 * Defines a block used to generate sphere geometry data
 */
export class SphereBlock extends NodeGeometryBlock {
    /**
     * Gets or sets a boolean indicating that this block can evaluate context
     * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
     */
    @editableInPropertyPage("Evaluate context", PropertyTypeForEdition.Boolean, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public evaluateContext = false;

    /**
     * Create a new SphereBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("segments", NodeGeometryBlockConnectionPointTypes.Int, true, 32);
        this.registerInput("diameter", NodeGeometryBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("diameterX", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("diameterY", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("diameterZ", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("arc", NodeGeometryBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("slice", NodeGeometryBlockConnectionPointTypes.Float, true, 1);

        this.registerOutput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "SphereBlock";
    }

    /**
     * Gets the segments input component
     */
    public get segments(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the diameter input component
     */
    public get diameter(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the diameterX input component
     */
    public get diameterX(): NodeGeometryConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the diameterY input component
     */
    public get diameterY(): NodeGeometryConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the diameterZ input component
     */
    public get diameterZ(): NodeGeometryConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the arc input component
     */
    public get arc(): NodeGeometryConnectionPoint {
        return this._inputs[5];
    }

    /**
     * Gets the slice input component
     */
    public get slice(): NodeGeometryConnectionPoint {
        return this._inputs[6];
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
            segments?: number;
            diameter?: number;
            diameterX?: number;
            diameterY?: number;
            diameterZ?: number;
            arc?: number;
            slice?: number;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
            dedupTopBottomIndices?: boolean;
        } = {};
        const func = (state: NodeGeometryBuildState) => {
            options.segments = this.segments.getConnectedValue(state);
            options.diameter = this.diameter.getConnectedValue(state);
            options.diameterX = this.diameterX.getConnectedValue(state);
            options.diameterY = this.diameterY.getConnectedValue(state);
            options.diameterZ = this.diameterZ.getConnectedValue(state);
            options.arc = this.arc.getConnectedValue(state);
            options.slice = this.slice.getConnectedValue(state);

            // Append vertex data from the plane builder
            return CreateSphereVertexData(options);
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

RegisterClass("BABYLON.SphereBlock", SphereBlock);
