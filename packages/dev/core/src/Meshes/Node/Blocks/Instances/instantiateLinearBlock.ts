import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import { Matrix, Quaternion, Vector3 } from "../../../../Maths/math.vector";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import type { VertexData } from "core/Meshes/mesh.vertexData";
import { InstantiateBaseBlock } from "./instantiateBaseBlock";

/**
 * Block used to clone geometry along a line
 */
export class InstantiateLinearBlock extends InstantiateBaseBlock {
    /**
     * Create a new Instantiate Linear Block
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);
        // Direction is magnitude per step
        this.registerInput("direction", NodeGeometryBlockConnectionPointTypes.Vector3, true, new Vector3(1, 0, 0));

        // Rotation is magnitude per step
        this.registerInput("rotation", NodeGeometryBlockConnectionPointTypes.Vector3, true, new Vector3(0, 0, 0));

        // Scaling is magnitude per step
        this.registerInput("scaling", NodeGeometryBlockConnectionPointTypes.Vector3, true, new Vector3(0, 0, 0));
        this.scaling.acceptedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Float);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "InstantiateLinearBlock";
    }

    /**
     * Gets the direction input component
     */
    public get direction(): NodeGeometryConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the rotation input component
     */
    public get rotation(): NodeGeometryConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the scaling input component
     */
    public get scaling(): NodeGeometryConnectionPoint {
        return this._inputs[4];
    }

    protected override _buildBlock(state: NodeGeometryBuildState) {
        const func = (state: NodeGeometryBuildState) => {
            state.pushExecutionContext(this);
            state.pushInstancingContext(this);

            const iterationCount = this.count.getConnectedValue(state) as number;

            const additionalVertexData: VertexData[] = [];

            const transformMatrix = Matrix.Identity();
            const transformOffset = Vector3.Zero();
            const rotationOffset = Vector3.Zero();
            const scaleOffset = Vector3.Zero();

            for (this._currentIndex = 0; this._currentIndex < iterationCount; this._currentIndex++) {
                const instanceGeometry = this.instance.getConnectedValue(state) as VertexData;

                if (!instanceGeometry || !instanceGeometry.positions || instanceGeometry.positions.length === 0) {
                    continue;
                }
                // Clone the instance
                const clone = instanceGeometry.clone();

                const direction = this.direction.getConnectedValue(state) as Vector3;
                const rotation = this.rotation.getConnectedValue(state) as Vector3;
                const scale = state.adaptInput(this.scaling, NodeGeometryBlockConnectionPointTypes.Vector3, Vector3.OneReadOnly);

                transformOffset.copyFrom(direction.clone().scale(this._currentIndex));
                rotationOffset.copyFrom(rotation.clone().scale(this._currentIndex));
                scaleOffset.copyFrom(scale.clone().scale(this._currentIndex));
                scaleOffset.addInPlaceFromFloats(1, 1, 1);

                Matrix.ComposeToRef(scaleOffset, Quaternion.FromEulerAngles(rotationOffset.x, rotationOffset.y, rotationOffset.z), transformOffset, transformMatrix);

                state._instantiateWithMatrix(clone, transformMatrix, additionalVertexData);
            }

            // Merge
            if (additionalVertexData.length) {
                if (additionalVertexData.length === 1) {
                    this._vertexData = additionalVertexData[0];
                } else {
                    // We do not merge the main one as user can use a merge node if wanted
                    const main = additionalVertexData.splice(0, 1)[0];
                    this._vertexData = main.merge(additionalVertexData, true, false, true, true);
                }
            }

            state.restoreExecutionContext();
            state.restoreInstancingContext();
            // Storage
            return this._vertexData;
        };

        if (this.evaluateContext) {
            this.output._storedFunction = func;
        } else {
            this.output._storedFunction = null;
            this.output._storedValue = func(state);
        }
    }
}

RegisterClass("BABYLON.InstantiateLinearBlock", InstantiateLinearBlock);
