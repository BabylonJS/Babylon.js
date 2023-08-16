import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import { Quaternion, Vector3 } from "../../../Maths/math.vector";
import { type NodeGeometryBuildState } from "../nodeGeometryBuildState";
import { VertexData } from "core/Meshes/mesh.vertexData";

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

        const lastVertexIndex = this._vertexData.positions.length / 3 - 1;
        const origin = this.origin.getConnectedValue(state) as Vector3;
        const direction = this.direction.getConnectedValue(state) as Vector3;
        const transformPerStepOrTotal = this.transformPerStepOrTotal.getConnectedValue(state) as number;

        const rotation = this.rotation.getConnectedValue(state) as Vector3;
        const rotationPerStepOrTotal = this.rotationPerStepOrTotal.getConnectedValue(state) as number;

        const scale = this.scale.getConnectedValue(state) as Vector3;
        const scalePerStepOrTotal = this.scalePerStepOrTotal.getConnectedValue(state) as number;

        const positionChunk = [...this._vertexData.positions];

        let indexChunk: number[] = [];
        if (this._vertexData.indices) {
            indexChunk = [...this._vertexData.indices];
        }

        let normalChunk: number[] = [];
        if (this._vertexData.normals?.length) {
            normalChunk = [...this._vertexData.normals];
        }

        let uvChunk: number[] = [];
        if (this._vertexData.uvs?.length) {
            uvChunk = [...this._vertexData.uvs];
        }

        const newVertexData = new VertexData();
        newVertexData.positions = [];
        newVertexData.indices = [];
        newVertexData.normals = [];
        newVertexData.uvs = [];

        const countVector = new Vector3(count - 1, count - 1, count - 1);
        const invertRadians = Math.PI / 180;

        for (this._currentIndex = 0; this._currentIndex < count; this._currentIndex++) {
            const currentIndexOffset = this._currentIndex * lastVertexIndex + 1 * this._currentIndex;

            let transformOffset = direction.clone().scale(this._currentIndex);
            if (transformPerStepOrTotal == 1) {
                const distanceStep = direction.divide(countVector).scale(this._currentIndex);
                transformOffset = direction.clone().multiply(distanceStep);
            }

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

            for (let i = 0; i < positionChunk.length; i += 3) {
                const srtPoint = new Vector3(positionChunk[i], positionChunk[i + 1], positionChunk[i + 2]);

                srtPoint.multiplyInPlace(scaleOffset);

                console.log(scaleOffset);

                srtPoint.rotateByQuaternionToRef(
                    Quaternion.FromEulerAngles(rotationOffset.x * invertRadians, rotationOffset.y * invertRadians, rotationOffset.z * invertRadians),
                    srtPoint
                );

                srtPoint.addInPlace(origin).addInPlace(transformOffset);

                newVertexData.positions.push(srtPoint.x, srtPoint.y, srtPoint.z);
            }

            if (indexChunk.length) {
                for (let i = 0; i < indexChunk.length; i++) {
                    newVertexData.indices.push(indexChunk[i] + currentIndexOffset);
                }
            }

            if (normalChunk.length) {
                for (let i = 0; i < normalChunk.length; i += 3) {
                    newVertexData.normals.push(normalChunk[i]);
                    newVertexData.normals.push(normalChunk[i + 1]);
                    newVertexData.normals.push(normalChunk[i + 2]);
                }
            }

            if (uvChunk.length) {
                for (let i = 0; i < uvChunk.length; i += 2) {
                    newVertexData.uvs.push(uvChunk[i]);
                    newVertexData.uvs.push(uvChunk[i + 1]);
                }
            }
        }

        // Storage
        this.output._storedValue = newVertexData;
        state.executionContext = null;
        state.geometryContext = null;
    }
}

RegisterClass("BABYLON.LinearClonerBlock", LinearClonerBlock);
