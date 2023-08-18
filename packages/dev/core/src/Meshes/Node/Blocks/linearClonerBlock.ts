import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import { Matrix, Quaternion, Vector3 } from "../../../Maths/math.vector";
import { type NodeGeometryBuildState } from "../nodeGeometryBuildState";
import type { VertexData } from "core/Meshes/mesh.vertexData";
import { Nullable } from "core/types";

/**
 * Block used to clone geometry along a line
 */
export class LinearClonerBlock extends NodeGeometryBlock {
    private _vertexData: VertexData;
    private _currentIndex: number;

    /**
     * Gets the current index in the current flow
     * @returns the current index
     */
    public getExecutionIndex(): number {
        return this._currentIndex;
    }

    /**
     * Gets the current face index in the current flow
     * @returns the current face index
     */
    public getExecutionFaceIndex(): number {
        return 0;
    }

    /**
     * Create a new LinearClonerBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);
        this.registerInput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry, false);
        this.registerInput("count", NodeGeometryBlockConnectionPointTypes.Int, true, 1, 0);
        this.registerInput("origin", NodeGeometryBlockConnectionPointTypes.Vector3, true, new Vector3(0, 0, 0));

        //Direction is magnitude per step, or total distance
        this.registerInput("direction", NodeGeometryBlockConnectionPointTypes.Vector3, true, new Vector3(1, 0, 0));
        //Per step or total
        this.registerInput("transformPerStepOrTotal", NodeGeometryBlockConnectionPointTypes.Int, true, 0, 0, 1);

        //rotation is magnitude per step, or total rotation
        this.registerInput("rotation", NodeGeometryBlockConnectionPointTypes.Vector3, true, new Vector3(0, 0, 0));
        //Per step or total
        this.registerInput("rotationPerStepOrTotal", NodeGeometryBlockConnectionPointTypes.Int, true, 0, 0, 1);

        //scale is magnitude per step, or total rotation
        this.registerInput("scale", NodeGeometryBlockConnectionPointTypes.Vector3, true, new Vector3(0, 0, 0));
        //Per step or total
        this.registerInput("scalePerStepOrTotal", NodeGeometryBlockConnectionPointTypes.Int, true, 0, 0, 1);

        //Random culling
        this.registerInput("scalePerStepOrTotal", NodeGeometryBlockConnectionPointTypes.Int, true, 0, 0, 1);

        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "LinearClonerBlock";
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
     * Gets the transformPerStepOrTotal input component
     */
    public get transformPerStepOrTotal(): NodeGeometryConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the rotation input component
     */
    public get rotation(): NodeGeometryConnectionPoint {
        return this._inputs[5];
    }

    /**
     * Gets the rotationPerStepOrTotal input component
     */
    public get rotationPerStepOrTotal(): NodeGeometryConnectionPoint {
        return this._inputs[6];
    }

    /**
     * Gets the scale input component
     */
    public get scale(): NodeGeometryConnectionPoint {
        return this._inputs[7];
    }

    /**
     * Gets the scalePerStepOrTotal input component
     */
    public get scalePerStepOrTotal(): NodeGeometryConnectionPoint {
        return this._inputs[8];
    }

    /**
     * Gets the geometry output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected _buildBlock(state: NodeGeometryBuildState) {
        state.executionContext = this;

        this._vertexData = this.geometry.getConnectedValue(state);
        state.geometryContext = this._vertexData;

        if (!this._vertexData || !this._vertexData.positions || !this.geometry.isConnected) {
            state.executionContext = null;
            state.geometryContext = null;
            this.output._storedValue = null;
            return;
        }
        const count = this.count.getConnectedValue(state) as number;

        if (count <= 0) {
            this.output._storedValue = this._vertexData;
            state.executionContext = null;
            state.geometryContext = null;
        }

        const origin = this.origin.getConnectedValue(state) as Vector3;
        const direction = this.direction.getConnectedValue(state) as Vector3;
        const transformPerStepOrTotal = this.transformPerStepOrTotal.getConnectedValue(state) as number;

        const rotation = this.rotation.getConnectedValue(state) as Vector3;
        const rotationPerStepOrTotal = this.rotationPerStepOrTotal.getConnectedValue(state) as number;

        const scale = this.scale.getConnectedValue(state) as Vector3;
        const scalePerStepOrTotal = this.scalePerStepOrTotal.getConnectedValue(state) as number;

        const countVector = new Vector3(count - 1, count - 1, count - 1);
        const invertRadians = Math.PI / 180;

        const transformMatrix = Matrix.Identity();

        const results = [];

        let rootData: Nullable<VertexData> = null;

        for (this._currentIndex = 0; this._currentIndex < count; this._currentIndex++) {
            const clone = this._vertexData.clone();

            let transformOffset = direction.clone().scale(this._currentIndex);
            if (transformPerStepOrTotal == 1) {
                const distanceStep = direction.divide(countVector).scale(this._currentIndex);
                transformOffset = direction.clone().multiply(distanceStep);
            }
            transformOffset.addInPlace(origin);

            let rotationOffset = rotation.clone().scale(this._currentIndex);
            if (rotationPerStepOrTotal == 1) {
                const rotationStep = rotation.divide(countVector).scale(this._currentIndex);
                rotationOffset = rotation.clone().multiply(rotationStep);
            }

            let scaleOffset = scale.clone().scale(this._currentIndex);
            if (scalePerStepOrTotal == 1) {
                const scaleStep = scale.divide(countVector).scale(this._currentIndex);
                scaleOffset = scale.clone().multiply(scaleStep);
            }
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

        // Storage
        this.output._storedValue = this._vertexData;
        state.executionContext = null;
        state.geometryContext = null;
    }
}

RegisterClass("BABYLON.LinearClonerBlock", LinearClonerBlock);
