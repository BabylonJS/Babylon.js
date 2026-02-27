import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import { GeometryInputBlock } from "../geometryInputBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { Vector4 } from "../../../../Maths/math.vector";
import { CreateIcoSphereVertexData } from "core/Meshes/Builders/icoSphereBuilder";
import { PropertyTypeForEdition, editableInPropertyPage } from "../../../../Decorators/nodeDecorator";

/**
 * Defines a block used to generate icosphere geometry data
 */
export class IcoSphereBlock extends NodeGeometryBlock {
    /**
     * Gets or sets a boolean indicating that this block can evaluate context
     * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
     */
    @editableInPropertyPage("Evaluate context", PropertyTypeForEdition.Boolean, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public evaluateContext = false;

    /**
     * Create a new IcoSphereBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("radius", NodeGeometryBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("radiusX", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("radiusY", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("radiusZ", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("subdivisions", NodeGeometryBlockConnectionPointTypes.Int, true, 4);

        this.registerOutput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "IcoSphereBlock";
    }

    /**
     * Gets the radius input component
     */
    public get radius(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the radiusX input component
     */
    public get radiusX(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the radiusY input component
     */
    public get radiusY(): NodeGeometryConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the radiusZ input component
     */
    public get radiusZ(): NodeGeometryConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the subdivisions input component
     */
    public get subdivisions(): NodeGeometryConnectionPoint {
        return this._inputs[4];
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
            radiusX?: number;
            radiusY?: number;
            radiusZ?: number;
            flat?: boolean;
            subdivisions?: number;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
        } = {};

        const func = (state: NodeGeometryBuildState) => {
            options.radius = this.radius.getConnectedValue(state);
            options.subdivisions = this.subdivisions.getConnectedValue(state);
            options.radiusX = this.radiusX.getConnectedValue(state);
            options.radiusY = this.radiusY.getConnectedValue(state);
            options.radiusZ = this.radiusZ.getConnectedValue(state);

            // Append vertex data from the plane builder
            return CreateIcoSphereVertexData(options);
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

RegisterClass("BABYLON.IcoSphereBlock", IcoSphereBlock);
