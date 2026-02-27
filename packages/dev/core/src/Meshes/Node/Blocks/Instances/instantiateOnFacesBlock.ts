import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import type { INodeGeometryExecutionContext } from "../../Interfaces/nodeGeometryExecutionContext";
import type { VertexData } from "../../../mesh.vertexData";
import { Vector2, Vector3 } from "../../../../Maths/math.vector";
import { PropertyTypeForEdition, editableInPropertyPage } from "../../../../Decorators/nodeDecorator";
import type { Nullable } from "../../../../types";
import type { INodeGeometryInstancingContext } from "../../Interfaces/nodeGeometryInstancingContext";

/**
 * Block used to instance geometry on every face of a geometry
 */
export class InstantiateOnFacesBlock extends NodeGeometryBlock implements INodeGeometryExecutionContext, INodeGeometryInstancingContext {
    private _vertexData: VertexData;
    private _currentFaceIndex: number;
    private _currentLoopIndex: number;
    private _currentPosition = new Vector3();
    private _currentUV = new Vector2();
    private _vertex0 = new Vector3();
    private _vertex1 = new Vector3();
    private _vertex2 = new Vector3();
    private _tempVector0 = new Vector3();
    private _tempVector1 = new Vector3();
    private _uv0 = new Vector2();
    private _uv1 = new Vector2();
    private _uv2 = new Vector2();

    /**
     * Gets or sets a boolean indicating that this block can evaluate context
     * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
     */
    @editableInPropertyPage("Evaluate context", PropertyTypeForEdition.Boolean, "ADVANCED", { notifiers: { rebuild: true } })
    public evaluateContext = true;

    /**
     * Create a new InstantiateOnFacesBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.registerInput("instance", NodeGeometryBlockConnectionPointTypes.Geometry, true);
        this.registerInput("count", NodeGeometryBlockConnectionPointTypes.Int, true, 256);
        this.registerInput("matrix", NodeGeometryBlockConnectionPointTypes.Matrix, true);
        this.registerInput("offset", NodeGeometryBlockConnectionPointTypes.Vector3, true, Vector3.Zero());
        this.registerInput("rotation", NodeGeometryBlockConnectionPointTypes.Vector3, true, Vector3.Zero());
        this.registerInput("scaling", NodeGeometryBlockConnectionPointTypes.Vector3, true, Vector3.One());

        this.scaling.acceptedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Float);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current instance index in the current flow
     * @returns the current index
     */
    public getInstanceIndex(): number {
        return this._currentLoopIndex;
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
        return this._currentFaceIndex;
    }

    /**
     * Gets the current loop index in the current flow
     * @returns the current loop index
     */
    public getExecutionLoopIndex(): number {
        return this._currentLoopIndex;
    }

    /**
     * Gets the value associated with a contextual positions
     * @returns the value associated with the source
     */
    public getOverridePositionsContextualValue() {
        return this._currentPosition;
    }

    /**
     * Gets the value associated with a contextual normals
     * @returns the value associated with the source
     */
    public getOverrideNormalsContextualValue() {
        this._vertex1.subtractToRef(this._vertex0, this._tempVector0);
        this._vertex2.subtractToRef(this._vertex1, this._tempVector1);
        this._tempVector0.normalize();
        this._tempVector1.normalize();
        return Vector3.Cross(this._tempVector1, this._tempVector0);
    }

    /**
     * Gets the value associated with a contextual UV1 se
     * @returns the value associated with the source
     */
    public getOverrideUVs1ContextualValue() {
        return this._currentUV;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
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
     * Gets the count input component
     */
    public get count(): NodeGeometryConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the matrix input component
     */
    public get matrix(): NodeGeometryConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the offset input component
     */
    public get offset(): NodeGeometryConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the rotation input component
     */
    public get rotation(): NodeGeometryConnectionPoint {
        return this._inputs[5];
    }

    /**
     * Gets the scaling input component
     */
    public get scaling(): NodeGeometryConnectionPoint {
        return this._inputs[6];
    }

    /**
     * Gets the geometry output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock(state: NodeGeometryBuildState) {
        const func = (state: NodeGeometryBuildState) => {
            state.pushExecutionContext(this);
            state.pushInstancingContext(this);

            this._vertexData = this.geometry.getConnectedValue(state);
            state.pushGeometryContext(this._vertexData);

            if (!this._vertexData || !this._vertexData.positions || !this._vertexData.indices || !this.instance.isConnected) {
                state.restoreExecutionContext();
                state.restoreInstancingContext();
                state.restoreGeometryContext();
                this.output._storedValue = null;
                return;
            }

            // Processing
            let instanceGeometry: Nullable<VertexData> = null;
            const instanceCount = this.count.getConnectedValue(state);
            const faceCount = this._vertexData.indices.length / 3;
            const instancePerFace = instanceCount / faceCount;
            let accumulatedCount = 0;
            const additionalVertexData: VertexData[] = [];
            let totalDone = 0;
            this._currentLoopIndex = 0;

            for (this._currentFaceIndex = 0; this._currentFaceIndex < faceCount; this._currentFaceIndex++) {
                accumulatedCount += instancePerFace;
                const countPerFace = (accumulatedCount | 0) - totalDone;

                if (countPerFace < 1) {
                    continue;
                }

                const faceID0 = this._vertexData.indices[this._currentFaceIndex * 3];
                const faceID1 = this._vertexData.indices[this._currentFaceIndex * 3 + 1];
                const faceID2 = this._vertexData.indices[this._currentFaceIndex * 3 + 2];

                // Extract face vertices
                this._vertex0.fromArray(this._vertexData.positions, faceID0 * 3);
                this._vertex1.fromArray(this._vertexData.positions, faceID1 * 3);
                this._vertex2.fromArray(this._vertexData.positions, faceID2 * 3);

                if (this._vertexData.uvs) {
                    this._uv0.fromArray(this._vertexData.uvs, faceID0 * 2);
                    this._uv1.fromArray(this._vertexData.uvs, faceID1 * 2);
                    this._uv2.fromArray(this._vertexData.uvs, faceID2 * 2);
                }

                for (let faceDispatchCount = 0; faceDispatchCount < countPerFace; faceDispatchCount++) {
                    if (totalDone >= instanceCount) {
                        break;
                    }

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

                    this._currentPosition.set(
                        s * this._vertex0.x + t * this._vertex1.x + u * this._vertex2.x,
                        s * this._vertex0.y + t * this._vertex1.y + u * this._vertex2.y,
                        s * this._vertex0.z + t * this._vertex1.z + u * this._vertex2.z
                    );

                    if (this._vertexData.uvs) {
                        this._currentUV.set(s * this._uv0.x + t * this._uv1.x + u * this._uv2.x, s * this._uv0.y + t * this._uv1.y + u * this._uv2.y);
                    }

                    // Clone the instance
                    instanceGeometry = this.instance.getConnectedValue(state) as VertexData;

                    if (!instanceGeometry || !instanceGeometry.positions || instanceGeometry.positions.length === 0) {
                        accumulatedCount -= instancePerFace;
                        continue;
                    }
                    const clone = instanceGeometry.clone();

                    if (this.matrix.isConnected) {
                        const transform = this.matrix.getConnectedValue(state);
                        state._instantiateWithPositionAndMatrix(clone, this._currentPosition, transform, additionalVertexData);
                    } else {
                        const offset = state.adaptInput(this.offset, NodeGeometryBlockConnectionPointTypes.Vector3, Vector3.ZeroReadOnly);
                        const scaling = state.adaptInput(this.scaling, NodeGeometryBlockConnectionPointTypes.Vector3, Vector3.OneReadOnly);
                        const rotation = this.rotation.getConnectedValue(state) || Vector3.ZeroReadOnly;

                        this._currentPosition.addInPlace(offset);
                        state._instantiate(clone, this._currentPosition, rotation, scaling, additionalVertexData);
                    }
                    totalDone++;
                    this._currentLoopIndex++;
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
            state.restoreGeometryContext();
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

    /** @internal */
    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        if (serializationObject.evaluateContext !== undefined) {
            this.evaluateContext = serializationObject.evaluateContext;
        }
    }
}

RegisterClass("BABYLON.InstantiateOnFacesBlock", InstantiateOnFacesBlock);
