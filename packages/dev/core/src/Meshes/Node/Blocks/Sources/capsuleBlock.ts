import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import { GeometryInputBlock } from "../geometryInputBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { Vector3 } from "../../../../Maths/math.vector";
import { CreateCapsuleVertexData } from "core/Meshes/Builders/capsuleBuilder";
import { PropertyTypeForEdition, editableInPropertyPage } from "../../../../Decorators/nodeDecorator";

/**
 * Defines a block used to generate capsule geometry data
 */
export class CapsuleBlock extends NodeGeometryBlock {
    /**
     * Gets or sets a boolean indicating that this block can evaluate context
     * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
     */
    @editableInPropertyPage("Evaluate context", PropertyTypeForEdition.Boolean, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public evaluateContext = false;

    /**
     * Create a new CapsuleBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("height", NodeGeometryBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("radius", NodeGeometryBlockConnectionPointTypes.Float, true, 0.25);
        this.registerInput("tessellation", NodeGeometryBlockConnectionPointTypes.Int, true, 16);
        this.registerInput("subdivisions", NodeGeometryBlockConnectionPointTypes.Int, true, 2);

        this.registerOutput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "CapsuleBlock";
    }

    /**
     * Gets the height input component
     */
    public get height(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the radius input component
     */
    public get radius(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the tessellation input component
     */
    public get tessellation(): NodeGeometryConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the subdivisions input component
     */
    public get subdivisions(): NodeGeometryConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the geometry output component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    /** @internal */
    public override autoConfigure() {
        if (!this.height.isConnected) {
            const heightInput = new GeometryInputBlock("Height");
            heightInput.value = 1;
            heightInput.output.connectTo(this.height);
        }
        if (!this.radius.isConnected) {
            const radiusInput = new GeometryInputBlock("Radius");
            radiusInput.value = 0.2;
            radiusInput.output.connectTo(this.radius);
        }
    }

    protected override _buildBlock(state: NodeGeometryBuildState) {
        const options: {
            orientation?: Vector3;
            subdivisions?: number;
            tessellation?: number;
            height?: number;
            radius?: number;
            capSubdivisions?: number;
            radiusTop?: number;
            radiusBottom?: number;
            topCapSubdivisions?: number;
            bottomCapSubdivisions?: number;
            updatable?: boolean;
        } = {};

        const func = (state: NodeGeometryBuildState) => {
            options.height = this.height.getConnectedValue(state);
            options.radius = this.radius.getConnectedValue(state);
            options.tessellation = this.tessellation.getConnectedValue(state);
            options.subdivisions = this.subdivisions.getConnectedValue(state);

            // Append vertex data from the plane builder
            return CreateCapsuleVertexData(options);
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

RegisterClass("BABYLON.CapsuleBlock", CapsuleBlock);
