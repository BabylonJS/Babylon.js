import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import { Matrix, Quaternion, Vector3 } from "../../../Maths/math.vector";
import { type NodeGeometryBuildState } from "../nodeGeometryBuildState";
import type { VertexData } from "core/Meshes/mesh.vertexData";
import type { Nullable } from "core/types";

/**
 * Block used to clone geometry along a line
 */
export class RadialClonerBlock extends NodeGeometryBlock {
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
     * Create a new RadialClonerBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);
        this.registerInput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry, false);
        this.registerInput("count", NodeGeometryBlockConnectionPointTypes.Int, true, 1, 0);
        this.registerInput("origin", NodeGeometryBlockConnectionPointTypes.Vector3, true, new Vector3(0, 0, 0));
        //Per step or total
        this.registerInput("radius", NodeGeometryBlockConnectionPointTypes.Int, true, 0, 0);

        //Angle start and end
        this.registerInput("angleStart", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("angleEnd", NodeGeometryBlockConnectionPointTypes.Float, true, 0);

        this.registerInput("clonerCenterOrGlobalForward", NodeGeometryBlockConnectionPointTypes.Int, true, 0, 0, 1);

        //transform offset
        this.registerInput("transform", NodeGeometryBlockConnectionPointTypes.Vector3, true, new Vector3(0, 0, 0));
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

        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "RadialClonerBlock";
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
    public get radius(): NodeGeometryConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the direction input component
     */
    public get angleStart(): NodeGeometryConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the direction input component
     */
    public get angleEnd(): NodeGeometryConnectionPoint {
        return this._inputs[5];
    }

    /**
     * Gets the clonerCenterOrGlobalForward input component
     */
    public get clonerCenterOrGlobalForward(): NodeGeometryConnectionPoint {
        return this._inputs[6];
    }

    /**
     * Gets the transformPerStepOrTotal input component
     */
    public get transform(): NodeGeometryConnectionPoint {
        return this._inputs[7];
    }

    /**
     * Gets the transformPerStepOrTotal input component
     */
    public get transformPerStepOrTotal(): NodeGeometryConnectionPoint {
        return this._inputs[8];
    }

    /**
     * Gets the rotation input component
     */
    public get rotation(): NodeGeometryConnectionPoint {
        return this._inputs[9];
    }

    /**
     * Gets the rotationPerStepOrTotal input component
     */
    public get rotationPerStepOrTotal(): NodeGeometryConnectionPoint {
        return this._inputs[10];
    }

    /**
     * Gets the scale input component
     */
    public get scale(): NodeGeometryConnectionPoint {
        return this._inputs[11];
    }

    /**
     * Gets the scalePerStepOrTotal input component
     */
    public get scalePerStepOrTotal(): NodeGeometryConnectionPoint {
        return this._inputs[12];
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
        const radius = this.radius.getConnectedValue(state) as number;
        const angleStart: number = this.angleStart.getConnectedValue(state) as number;
        const angleEnd = this.angleEnd.getConnectedValue(state) as number;

        const clonerCenterOrGlobalForward = this.clonerCenterOrGlobalForward.getConnectedValue(state) as number;

        const transform = this.transform.getConnectedValue(state) as Vector3;
        const transformPerStepOrTotal = this.transformPerStepOrTotal.getConnectedValue(state) as number;

        const rotation = this.rotation.getConnectedValue(state) as Vector3;
        const rotationPerStepOrTotal = this.rotationPerStepOrTotal.getConnectedValue(state) as number;

        const scale = this.scale.getConnectedValue(state) as Vector3;
        const scalePerStepOrTotal = this.scalePerStepOrTotal.getConnectedValue(state) as number;

        const countVector = new Vector3(count - 1, count - 1, count - 1);

        const invertRadians = Math.PI / 180;
        const angleStartRadians = angleStart * invertRadians;
        const angleEndRadians = angleEnd * invertRadians;
        const pieSlice = Math.PI * 2 - (angleStartRadians + angleEndRadians);
        const rStep = pieSlice / count;

        const transformMatrix = Matrix.Identity();
        const results = [];

        let rootData: Nullable<VertexData> = null;

        for (this._currentIndex = 0; this._currentIndex < count; this._currentIndex++) {
            const clone = this._vertexData.clone();

            const centerForward = new Vector3(0, 0, 1);
            const angle = angleStartRadians + rStep * this._currentIndex;
            const angleQuat = Quaternion.FromEulerAngles(0, angle, 0);
            centerForward.rotateByQuaternionToRef(angleQuat, centerForward);
            const objectOrigin = centerForward.scale(radius).add(origin);

            let transformOffset = transform.clone().scale(this._currentIndex);
            if (transformPerStepOrTotal == 1) {
                const transformStep = transform.clone().divide(countVector).scale(this._currentIndex);
                transformOffset = transform.clone().clone().multiply(transformStep);
            }
            if (clonerCenterOrGlobalForward == 0) {
                transformOffset.rotateByQuaternionToRef(angleQuat, transformOffset);
            }
            transformOffset.addInPlace(objectOrigin);

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

            const rotQuat = Quaternion.FromEulerAngles(rotationOffset.x * invertRadians, rotationOffset.y * invertRadians, rotationOffset.z * invertRadians);

            if (clonerCenterOrGlobalForward == 0) {
                rotQuat.multiplyInPlace(angleQuat);
            }

            Matrix.ComposeToRef(scaleOffset, rotQuat, transformOffset, transformMatrix);
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

        this._vertexData.merge(results, false, false, true, true);
        // Storage
        this.output._storedValue = this._vertexData;
        state.executionContext = null;
        state.geometryContext = null;
    }
}

RegisterClass("BABYLON.RadialClonerBlock", RadialClonerBlock);
