import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import { GeometryInputBlock } from "../geometryInputBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import { Matrix } from "../../../../Maths/math.vector";
import { PropertyTypeForEdition, editableInPropertyPage } from "../../../../Decorators/nodeDecorator";
import { CreateGroundVertexData } from "core/Meshes/Builders/groundBuilder";

/**
 * Defines a block used to generate plane geometry data
 */
export class PlaneBlock extends NodeGeometryBlock {
    private _rotationMatrix = new Matrix();
    /**
     * Gets or sets a boolean indicating that this block can evaluate context
     * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
     */
    @editableInPropertyPage("Evaluate context", PropertyTypeForEdition.Boolean, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public evaluateContext = false;

    /**
     * Create a new PlaneBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("size", NodeGeometryBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("width", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("height", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("subdivisions", NodeGeometryBlockConnectionPointTypes.Int, true, 1, 0);
        this.registerInput("subdivisionsX", NodeGeometryBlockConnectionPointTypes.Int, true, 0, 0);
        this.registerInput("subdivisionsY", NodeGeometryBlockConnectionPointTypes.Int, true, 0, 0);

        this.registerOutput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "PlaneBlock";
    }

    /**
     * Gets the size input component
     */
    public get size(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the width input component
     */
    public get width(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the height input component
     */
    public get height(): NodeGeometryConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the subdivisions input component
     */
    public get subdivisions(): NodeGeometryConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the subdivisionsX input component
     */
    public get subdivisionsX(): NodeGeometryConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the subdivisionsY input component
     */
    public get subdivisionsY(): NodeGeometryConnectionPoint {
        return this._inputs[5];
    }

    /**
     * Gets the geometry output component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    public override autoConfigure() {
        if (this.size.isConnected) {
            return;
        }

        if (!this.width.isConnected && !this.height.isConnected) {
            const sizeInput = new GeometryInputBlock("Size");
            sizeInput.value = 1;
            sizeInput.output.connectTo(this.size);
            return;
        }

        if (!this.width.isConnected) {
            const widthInput = new GeometryInputBlock("Width");
            widthInput.value = 1;
            widthInput.output.connectTo(this.width);
        }

        if (!this.height.isConnected) {
            const heightInput = new GeometryInputBlock("Height");
            heightInput.value = 1;
            heightInput.output.connectTo(this.height);
        }
    }

    protected override _buildBlock(state: NodeGeometryBuildState) {
        const options: { size?: number; width?: number; height?: number; subdivisions?: number; subdivisionsX?: number; subdivisionsY?: number } = {};
        const func = (state: NodeGeometryBuildState) => {
            options.size = this.size.getConnectedValue(state);
            options.width = this.width.getConnectedValue(state);
            options.height = this.height.getConnectedValue(state);

            const subdivisions = this.subdivisions.getConnectedValue(state);
            const subdivisionsX = this.subdivisionsX.getConnectedValue(state);
            const subdivisionsY = this.subdivisionsY.getConnectedValue(state);

            if (subdivisions) {
                options.subdivisions = subdivisions;
            }

            if (subdivisionsX) {
                options.subdivisionsX = subdivisionsX;
            }

            if (subdivisionsY) {
                options.subdivisionsY = subdivisionsY;
            }

            // Append vertex data from the ground builder (to get access to subdivisions)
            const vertexData = CreateGroundVertexData(options);

            Matrix.RotationYawPitchRollToRef(-Math.PI / 2, 0, Math.PI / 2, this._rotationMatrix);

            vertexData.transform(this._rotationMatrix);

            return vertexData;
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

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this.evaluateContext = serializationObject.evaluateContext;
    }
}

RegisterClass("BABYLON.PlaneBlock", PlaneBlock);
