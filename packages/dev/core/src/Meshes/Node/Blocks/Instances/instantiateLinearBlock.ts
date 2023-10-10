import { InstantiateBlock } from "./instantiateBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import { Matrix, Quaternion, Vector3 } from "../../../../Maths/math.vector";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import type { VertexData } from "core/Meshes/mesh.vertexData";
import type { Nullable } from "core/types";
import { PropertyTypeForEdition, editableInPropertyPage } from "core/Decorators/nodeDecorator";
import type { INodeGeometryExecutionContext } from "../../Interfaces/nodeGeometryExecutionContext";
import type { INodeGeometryInstancingContext } from "../../Interfaces/nodeGeometryInstancingContext";

/**
 * Block used to clone geometry along a line
 */
export class InstantiateLinearBlock extends InstantiateBlock implements INodeGeometryExecutionContext, INodeGeometryInstancingContext {
    /**
     * Gets or sets a boolean indicating that this block can evaluate context
     * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
     */
    @editableInPropertyPage("Evaluate context", PropertyTypeForEdition.Boolean, "ADVANCED", { notifiers: { rebuild: true } })
    public evaluateContext = true;

    /**
     * Create a new Instantiate Linear Block
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);
        this.registerInput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry, false);
        this.registerInput("count", NodeGeometryBlockConnectionPointTypes.Int, true, 1, 0);
        this.registerInput("origin", NodeGeometryBlockConnectionPointTypes.Vector3, true, new Vector3(0, 0, 0));

        //Direction is magnitude per step, or total distance
        this.registerInput("direction", NodeGeometryBlockConnectionPointTypes.Vector3, true, new Vector3(1, 0, 0));

        //rotation is magnitude per step, or total rotation
        this.registerInput("rotation", NodeGeometryBlockConnectionPointTypes.Vector3, true, new Vector3(0, 0, 0));

        //scale is magnitude per step, or total rotation
        this.registerInput("scale", NodeGeometryBlockConnectionPointTypes.Vector3, true, new Vector3(0, 0, 0));
        this.scale.acceptedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Float);

        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "InstantiateLinearBlock";
    }

    /**
     * Gets the geometry input component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the count input component
     */
    public get count(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the origin input component
     */
    public get origin(): NodeGeometryConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the direction input component
     */
    public get direction(): NodeGeometryConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the rotation input component
     */
    public get rotation(): NodeGeometryConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the scale input component
     */
    public get scale(): NodeGeometryConnectionPoint {
        return this._inputs[5];
    }

    /**
     * Gets the geometry output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected _buildBlock(state: NodeGeometryBuildState) {
        const func = (state: NodeGeometryBuildState) => {
            state.pushExecutionContext(this);

            this._vertexData = this.geometry.getConnectedValue(state);
            state.pushGeometryContext(this._vertexData);

            if (!this._vertexData || !this._vertexData.positions || !this.geometry.isConnected) {
                state.restoreExecutionContext();
                state.restoreGeometryContext();
                this.output._storedValue = null;
                return;
            }
            const count = this.count.getConnectedValue(state) as number;

            if (count <= 0) {
                this.output._storedValue = this._vertexData;
                state.restoreExecutionContext();
                state.restoreGeometryContext();
                return this._vertexData;
            }

            const origin = this.origin.getConnectedValue(state) as Vector3;
            const direction = this.direction.getConnectedValue(state) as Vector3;
            const rotation = this.rotation.getConnectedValue(state) as Vector3;
            const scale = state.adaptInput(this.scale, NodeGeometryBlockConnectionPointTypes.Vector3, Vector3.OneReadOnly);

            const invertRadians = Math.PI / 180;

            const results = [];

            let rootData: Nullable<VertexData> = null;

            const transformMatrix = Matrix.Identity();
            const transformOffset = Vector3.Zero();
            const rotationOffset = Vector3.Zero();
            const scaleOffset = Vector3.Zero();

            for (this._currentIndex = 0; this._currentIndex < count; this._currentIndex++) {
                const clone = this._vertexData.clone();

                transformOffset.copyFrom(direction.clone().scale(this._currentIndex));
                transformOffset.addInPlace(origin);

                rotationOffset.copyFrom(rotation.clone().scale(this._currentIndex));

                scaleOffset.copyFrom(scale.clone().scale(this._currentIndex));

                scaleOffset.addInPlace(new Vector3(1, 1, 1));

                Matrix.ComposeToRef(
                    scaleOffset,
                    Quaternion.FromEulerAngles(rotationOffset.x * invertRadians, rotationOffset.y * invertRadians, rotationOffset.z * invertRadians),
                    transformOffset,
                    transformMatrix
                );

                clone.transform(transformMatrix);

                if (!rootData) {
                    rootData = clone;
                } else {
                    results.push(clone);
                }
            }

            if (rootData) {
                rootData.merge(results, false, false, true, true);
                this._vertexData = rootData;
            }
            state.restoreExecutionContext();
            state.restoreGeometryContext();
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
