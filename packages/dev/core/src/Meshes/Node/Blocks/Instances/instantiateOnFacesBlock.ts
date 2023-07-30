import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import type { INodeGeometryExecutionContext } from "../../Interfaces/nodeGeometryExecutionContext";
import type { VertexData } from "../../../mesh.vertexData";
import { Vector3 } from "../../../../Maths/math.vector";

/**
 * Block used to instance geometry on every face of a geometry
 */
export class InstantiateOnFacesBlock extends NodeGeometryBlock implements INodeGeometryExecutionContext {
    private _vertexData: VertexData;
    private _currentIndex: number;

    /**
     * Create a new InstantiateOnFacesBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.registerInput("instance", NodeGeometryBlockConnectionPointTypes.Geometry, true);
        this.registerInput("rotation", NodeGeometryBlockConnectionPointTypes.Vector3, true, Vector3.Zero());
        this.registerInput("scaling", NodeGeometryBlockConnectionPointTypes.Vector3, true, Vector3.One());
        this.registerInput("count", NodeGeometryBlockConnectionPointTypes.Int, true, 256);

        this.scaling.acceptedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Float);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current index in the current flow
     * @returns the current index
     */
    public getExecutionIndex(): number {
        return this._currentIndex;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "InstantiateOnFacesBlock";
    }

    /**
     * Gets the geometry input component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the instance input component
     */
    public get instance(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the rotation input component
     */
    public get rotation(): NodeGeometryConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the scaling input component
     */
    public get scaling(): NodeGeometryConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the count input component
     */
    public get count(): NodeGeometryConnectionPoint {
        return this._inputs[4];
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

        if (!this._vertexData || !this._vertexData.positions || !this._vertexData.indices || !this.instance.isConnected) {
            state.executionContext = null;
            state.geometryContext = null;
            this.output._storedValue = null;
            return;
        }

        // Processing
        const instanceCount = this.count.getConnectedValue(state);
        const faceCount = this._vertexData.indices.length / 3;
        const instancePerFace = Math.floor(instanceCount / faceCount);
        const instanceGeometry = this.instance.getConnectedValue(state) as VertexData;

        if (!instanceGeometry || !instanceGeometry.positions || instanceGeometry.positions.length === 0) {
            state.executionContext = null;
            state.geometryContext = null;
            this.output._storedValue = null;            
            return;
        }

        const additionalVertexData: VertexData[] = [];
        const currentPosition = new Vector3();
        const vertex0 = new Vector3();
        const vertex1 = new Vector3();
        const vertex2 = new Vector3();

        for (this._currentIndex = 0; this._currentIndex < faceCount; this._currentIndex++) {

            // Extract face vertices
            vertex0.fromArray(this._vertexData.positions, this._vertexData.indices[this._currentIndex * 3] * 3);
            vertex1.fromArray(this._vertexData.positions, this._vertexData.indices[this._currentIndex * 3 + 1] * 3);
            vertex2.fromArray(this._vertexData.positions, this._vertexData.indices[this._currentIndex * 3 + 2] * 3);

            for (let faceDispatchCount = 0; faceDispatchCount < instancePerFace; faceDispatchCount++) {
                // Get random point on face
                let x = Math.random();
                let y = Math.random();

                if (x > y) {
                    const temp = x;
                    x = y;
                    y = temp;
                }
                const s = x;
                const t = y - x;
                const u = 1 - s - t;
                
                currentPosition.set(
                    s * vertex0.x + t * vertex1.x + u * vertex2.x,
                    s * vertex0.y + t * vertex1.y + u * vertex2.y,
                    s * vertex0.z + t * vertex1.z + u * vertex2.z);

                // Clone the instance
                const clone = instanceGeometry.clone();

                const scaling = state.adaptInput(this.scaling, NodeGeometryBlockConnectionPointTypes.Vector3, Vector3.OneReadOnly);
                const rotation = this.rotation.getConnectedValue(state) || Vector3.ZeroReadOnly;
                state._instantiate(clone, currentPosition, rotation, scaling, additionalVertexData);
            }
        }

        // Merge
        if (additionalVertexData.length) {
            if (additionalVertexData.length === 1) {
                this._vertexData = additionalVertexData[0];
            } else {
            // We do not merge the main one as user can use a merge node if wanted
                const main = additionalVertexData.splice(0, 1)[0];
                this._vertexData = main.merge(additionalVertexData, true);
            }
        }

        // Storage
        this.output._storedValue = this._vertexData;
        state.executionContext = null;
        state.geometryContext = null;
    }  
}

RegisterClass("BABYLON.InstantiateOnFacesBlock", InstantiateOnFacesBlock);
