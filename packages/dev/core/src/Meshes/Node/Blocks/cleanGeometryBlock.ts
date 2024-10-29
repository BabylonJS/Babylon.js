import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import { PropertyTypeForEdition, editableInPropertyPage } from "../../../Decorators/nodeDecorator";
import type { NodeGeometryBuildState } from "../nodeGeometryBuildState";
import type { VertexData } from "core/Meshes/mesh.vertexData";
import { Vector3 } from "core/Maths";

/**
 * Block used to clean a geometry
 */
export class CleanGeometryBlock extends NodeGeometryBlock {
    private _tmpVectorA = new Vector3();
    private _tmpVectorB = new Vector3();
    private _tmpVectorC = new Vector3();
    private _tmpVectorAB = new Vector3();
    private _tmpVectorAC = new Vector3();
    private _tmpVectorCross = new Vector3();
    private _tmpVectorToView = new Vector3();

    /**
     * Gets or sets a boolean indicating that this block can evaluate context
     * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
     */
    @editableInPropertyPage("Evaluate context", PropertyTypeForEdition.Boolean, "ADVANCED", { notifiers: { rebuild: true } })
    public evaluateContext = true;

    /**
     * Creates a new CleanGeometryBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "CleanGeometryBlock";
    }

    /**
     * Gets the geometry component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock(state: NodeGeometryBuildState) {
        const func = (state: NodeGeometryBuildState) => {
            if (!this.geometry.isConnected) {
                return null;
            }

            const vertexData = (this.geometry.getConnectedValue(state) as VertexData).clone();

            if (!vertexData.positions || !vertexData.indices) {
                return vertexData;
            }

            const indices = vertexData.indices;
            const positions = vertexData.positions;

            this._tmpVectorToView.set(0, 0, 1);

            // Clean indices
            for (let index = 0; index < indices.length; index += 3) {
                const a = indices[index];
                const b = indices[index + 1];
                const c = indices[index + 2];

                this._tmpVectorA.fromArray(positions, a * 3);
                this._tmpVectorB.fromArray(positions, b * 3);
                this._tmpVectorC.fromArray(positions, c * 3);

                this._tmpVectorB.subtractToRef(this._tmpVectorA, this._tmpVectorAB);
                this._tmpVectorC.subtractToRef(this._tmpVectorA, this._tmpVectorAC);

                Vector3.CrossToRef(this._tmpVectorAB, this._tmpVectorAC, this._tmpVectorCross);

                this._tmpVectorCross.normalize();

                if (Vector3.Dot(this._tmpVectorCross, this._tmpVectorToView) > 0) {
                    // CW!
                    indices[index] = c;
                    indices[index + 2] = a;
                }
            }

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
        return super._dumpPropertiesCode() + `${this._codeVariableName}.evaluateContext = ${this.evaluateContext ? "true" : "false"};\n`;
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

RegisterClass("BABYLON.CleanGeometryBlock", CleanGeometryBlock);
