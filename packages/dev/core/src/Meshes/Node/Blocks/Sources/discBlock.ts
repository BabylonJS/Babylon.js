import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import { GeometryInputBlock } from "../geometryInputBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { Vector4 } from "../../../../Maths/math.vector";
import { CreateDiscVertexData } from "core/Meshes/Builders/discBuilder";
import { PropertyTypeForEdition, editableInPropertyPage } from "../../../../Decorators/nodeDecorator";

/**
 * Defines a block used to generate disc geometry data
 */
export class DiscBlock extends NodeGeometryBlock {
    /**
     * Gets or sets a boolean indicating that this block can evaluate context
     * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
     */
    @editableInPropertyPage("Evaluate context", PropertyTypeForEdition.Boolean, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public evaluateContext = false;

    /**
     * Create a new DiscBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("radius", NodeGeometryBlockConnectionPointTypes.Float, true, 0.5);
        this.registerInput("tessellation", NodeGeometryBlockConnectionPointTypes.Int, true, 64);
        this.registerInput("arc", NodeGeometryBlockConnectionPointTypes.Float, true, 1.0);

        this.registerOutput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "DiscBlock";
    }

    /**
     * Gets the radius input component
     */
    public get radius(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the tessellation input component
     */
    public get tessellation(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the arc input component
     */
    public get arc(): NodeGeometryConnectionPoint {
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
        if (!this.radius.isConnected) {
            const radiusInput = new GeometryInputBlock("Radius");
            radiusInput.value = 0.2;
            radiusInput.output.connectTo(this.radius);
        }
    }

    protected override _buildBlock(state: NodeGeometryBuildState) {
        const options: {
            radius?: number;
            tessellation?: number;
            arc?: number;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
        } = {};
        const func = (state: NodeGeometryBuildState) => {
            options.radius = this.radius.getConnectedValue(state);
            options.tessellation = this.tessellation.getConnectedValue(state);
            options.arc = this.arc.getConnectedValue(state);

            // Append vertex data from the plane builder
            return CreateDiscVertexData(options);
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

RegisterClass("BABYLON.DiscBlock", DiscBlock);
