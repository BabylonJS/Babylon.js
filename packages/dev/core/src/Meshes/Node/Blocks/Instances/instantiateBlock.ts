import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import type { VertexData } from "../../../mesh.vertexData";
import { Vector3 } from "../../../../Maths/math.vector";
import { InstantiateBaseBlock } from "./instantiateBaseBlock";

/**
 * Block used to instantiate a geometry inside a loop
 */
export class InstantiateBlock extends InstantiateBaseBlock {
    protected override _vertexData: VertexData;
    protected override _currentIndex: number;

    /**
     * Create a new InstantiateBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("matrix", NodeGeometryBlockConnectionPointTypes.Matrix, true);
        this.registerInput("position", NodeGeometryBlockConnectionPointTypes.Vector3, true, Vector3.Zero());
        this.registerInput("rotation", NodeGeometryBlockConnectionPointTypes.Vector3, true, Vector3.Zero());
        this.registerInput("scaling", NodeGeometryBlockConnectionPointTypes.Vector3, true, Vector3.One());

        this.scaling.acceptedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Float);
    }

    /**
     * Gets the current instance index in the current flow
     * @returns the current index
     */
    public override getInstanceIndex(): number {
        return this._currentIndex;
    }

    /**
     * Gets the current index in the current flow
     * @returns the current index
     */
    public override getExecutionIndex(): number {
        return this._currentIndex;
    }

    /**
     * Gets the current loop index in the current flow
     * @returns the current loop index
     */
    public override getExecutionLoopIndex(): number {
        return this._currentIndex;
    }

    /**
     * Gets the current face index in the current flow
     * @returns the current face index
     */
    public override getExecutionFaceIndex(): number {
        return 0;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "InstantiateBlock";
    }

    /**
     * Gets the matrix input component
     */
    public get matrix(): NodeGeometryConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the position input component
     */
    public get position(): NodeGeometryConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the rotation input component
     */
    public get rotation(): NodeGeometryConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the scaling input component
     */
    public get scaling(): NodeGeometryConnectionPoint {
        return this._inputs[5];
    }

    protected override _buildBlock(state: NodeGeometryBuildState) {
        const func = (state: NodeGeometryBuildState) => {
            state.pushExecutionContext(this);
            state.pushInstancingContext(this);

            // Processing
            const iterationCount = this.count.getConnectedValue(state);
            const additionalVertexData: VertexData[] = [];

            for (this._currentIndex = 0; this._currentIndex < iterationCount; this._currentIndex++) {
                const instanceGeometry = this.instance.getConnectedValue(state) as VertexData;

                if (!instanceGeometry || !instanceGeometry.positions || instanceGeometry.positions.length === 0) {
                    continue;
                }

                // Clone the instance
                const clone = instanceGeometry.clone();

                // Transform
                if (this.matrix.isConnected) {
                    const transform = this.matrix.getConnectedValue(state);
                    state._instantiateWithMatrix(clone, transform, additionalVertexData);
                } else {
                    const position = this.position.getConnectedValue(state) || Vector3.ZeroReadOnly;
                    const scaling = state.adaptInput(this.scaling, NodeGeometryBlockConnectionPointTypes.Vector3, Vector3.OneReadOnly);
                    const rotation = this.rotation.getConnectedValue(state) || Vector3.ZeroReadOnly;
                    state._instantiate(clone, position, rotation, scaling, additionalVertexData);
                }
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
            return this._vertexData;
        };

        // Storage

        if (this.evaluateContext) {
            this.output._storedFunction = func;
        } else {
            this.output._storedFunction = null;
            this.output._storedValue = func(state);
        }
    }
}

RegisterClass("BABYLON.InstantiateBlock", InstantiateBlock);
