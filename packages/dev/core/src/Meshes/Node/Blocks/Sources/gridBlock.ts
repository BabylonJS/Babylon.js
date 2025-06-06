import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import { GeometryInputBlock } from "../geometryInputBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import { CreateGroundVertexData } from "../../../Builders/groundBuilder";
import { PropertyTypeForEdition, editableInPropertyPage } from "../../../../Decorators/nodeDecorator";
import { VertexData } from "core/Meshes/mesh.vertexData";

/**
 * Defines a block used to generate grid geometry data
 */
export class GridBlock extends NodeGeometryBlock {
    /**
     * Gets or sets a boolean indicating that this block can evaluate context
     * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
     */
    @editableInPropertyPage("Evaluate context", PropertyTypeForEdition.Boolean, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public evaluateContext = false;

    /**
     * Create a new GridBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("width", NodeGeometryBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("height", NodeGeometryBlockConnectionPointTypes.Float, true, 1);
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
        return "GridBlock";
    }

    /**
     * Gets the width input component
     */
    public get width(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the height input component
     */
    public get height(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the subdivisions input component
     */
    public get subdivisions(): NodeGeometryConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the subdivisionsX input component
     */
    public get subdivisionsX(): NodeGeometryConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the subdivisionsY input component
     */
    public get subdivisionsY(): NodeGeometryConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the geometry output component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    public override autoConfigure() {
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
        const options: { width?: number; height?: number; subdivisions?: number; subdivisionsX?: number; subdivisionsY?: number } = {};
        const func = (state: NodeGeometryBuildState) => {
            options.width = this.width.getConnectedValue(state);
            options.height = this.height.getConnectedValue(state);
            options.subdivisions = this.subdivisions.getConnectedValue(state);
            options.subdivisionsX = this.subdivisionsX.getConnectedValue(state);
            options.subdivisionsY = this.subdivisionsY.getConnectedValue(state);

            const vertexData = new VertexData();

            const positions: number[] = [];
            const indices: number[] = [];
            const uvs: number[] = [];

            const rows = options.subdivisions! + 1;
            const cols = options.subdivisions! + 1;

            const halfWidth = options.width! / 2;
            const halfHeight = options.height! / 2;

            for (let row = 0; row < rows; row++) {
                const v = row / options.subdivisions!;
                const z = v * options.height! - halfHeight;

                for (let col = 0; col < cols; col++) {
                    const u = col / options.subdivisions!;
                    const x = u * options.width! - halfWidth;

                    positions.push(x, 0, z);
                    uvs.push(u, v);
                }
            }

            for (let row = 0; row < options.subdivisions!; row++) {
                for (let col = 0; col < options.subdivisions!; col++) {
                    const i0 = row * cols + col;
                    const i1 = i0 + 1;
                    const i2 = i0 + cols;
                    const i3 = i2 + 1;

                    // Triangle 1
                    indices.push(i0, i1, i2);

                    // Triangle 2
                    indices.push(i1, i3, i2);
                }
            }

            // Append vertex data from the plane builder
            // return CreateGroundVertexData(options);

            vertexData.positions = positions;
            vertexData.indices = indices;
            vertexData.uvs = uvs;

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

RegisterClass("BABYLON.GridBlock", GridBlock);
