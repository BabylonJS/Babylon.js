import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import type { INodeGeometryExecutionContext } from "../../Interfaces/nodeGeometryExecutionContext";
import type { VertexData } from "../../../mesh.vertexData";
import { Vector3 } from "../../../../Maths/math.vector";
import { PropertyTypeForEdition, editableInPropertyPage } from "../../../../Decorators/nodeDecorator";
import type { Nullable } from "../../../../types";
import { Ray } from "../../../../Culling/ray";
import { extractMinAndMax } from "../../../../Maths/math.functions";

/**
 * Block used to instance geometry inside a geometry
 */
export class InstantiateOnVolumeBlock extends NodeGeometryBlock implements INodeGeometryExecutionContext {
    private _vertexData: VertexData;
    private _currentPosition = new Vector3();
    private _vertex0 = new Vector3();
    private _vertex1 = new Vector3();
    private _vertex2 = new Vector3();

    /**
     * Gets or sets a boolean indicating that this block can evaluate context
     * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
     */
    @editableInPropertyPage("Evaluate context", PropertyTypeForEdition.Boolean, "ADVANCED", { notifiers: { rebuild: true } })
    public evaluateContext = true;

    /**
     * Create a new InstantiateOnVolumeBlock
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
        return 0;
    }

    /**
     * Gets the current face index in the current flow
     * @returns the current face index
     */
    public getExecutionFaceIndex(): number {
        return 0;
    }

    /**
     * Gets the value associated with a contextual positions
     * @returns the value associated with the source
     */
    public getOverridePositionsContextualValue() {
        return this._currentPosition;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "InstantiateOnVolumeBlock";
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
        let instanceGeometry: Nullable<VertexData> = null;
        if (!this.evaluateContext) {
            instanceGeometry = this.instance.getConnectedValue(state) as VertexData;

            if (!instanceGeometry || !instanceGeometry.positions || instanceGeometry.positions.length === 0) {
                state.executionContext = null;
                state.geometryContext = null;
                this.output._storedValue = null;
                return;
            }
        }

        const instanceCount = this.count.getConnectedValue(state);
        const additionalVertexData: VertexData[] = [];
        const boundingInfo = extractMinAndMax(this._vertexData.positions!, 0, this._vertexData.positions!.length / 3);
        const min = boundingInfo.minimum;
        const max = boundingInfo.maximum;
        const direction = new Vector3(1, 0, 0);
        const faceCount = this._vertexData.indices.length / 3;

        for (let index = 0; index < instanceCount; index++) {
            this._currentPosition.set(Math.random() * (max.x - min.x) + min.x, Math.random() * (max.y - min.y) + min.y, Math.random() * (max.z - min.z) + min.z);

            // Cast a ray from the random point in an arbitrary direction
            const ray = new Ray(this._currentPosition, direction);

            let intersectionCount = 0;
            for (let currentFaceIndex = 0; currentFaceIndex < faceCount; currentFaceIndex++) {
                // Extract face vertices
                this._vertex0.fromArray(this._vertexData.positions!, this._vertexData.indices![currentFaceIndex * 3] * 3);
                this._vertex1.fromArray(this._vertexData.positions!, this._vertexData.indices![currentFaceIndex * 3 + 1] * 3);
                this._vertex2.fromArray(this._vertexData.positions!, this._vertexData.indices![currentFaceIndex * 3 + 2] * 3);

                const currentIntersectInfo = ray.intersectsTriangle(this._vertex0, this._vertex1, this._vertex2);

                if (currentIntersectInfo && currentIntersectInfo.distance > 0) {
                    intersectionCount++;
                }
            }

            if (intersectionCount % 2 === 0) {
                // We are outside, try again
                index--;
                continue;
            }

            // Clone the instance
            if (this.evaluateContext) {
                instanceGeometry = this.instance.getConnectedValue(state) as VertexData;

                if (!instanceGeometry || !instanceGeometry.positions || instanceGeometry.positions.length === 0) {
                    continue;
                }
            }
            const clone = instanceGeometry!.clone();

            const scaling = state.adaptInput(this.scaling, NodeGeometryBlockConnectionPointTypes.Vector3, Vector3.OneReadOnly);
            const rotation = this.rotation.getConnectedValue(state) || Vector3.ZeroReadOnly;
            state._instantiate(clone, this._currentPosition, rotation, scaling, additionalVertexData);
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

        // Storage
        this.output._storedValue = this._vertexData;
        state.executionContext = null;
        state.geometryContext = null;
    }

    protected _dumpPropertiesCode() {
        const codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.evaluateContext = ${this.evaluateContext ? "true" : "false"};\n`;
        return codeString;
    }

    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    public serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.evaluateContext = this.evaluateContext;

        return serializationObject;
    }

    public _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this.evaluateContext = serializationObject.evaluateContext;
    }
}

RegisterClass("BABYLON.InstantiateOnVolumeBlock", InstantiateOnVolumeBlock);
