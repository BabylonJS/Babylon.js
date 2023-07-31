import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import type { INodeGeometryExecutionContext } from "../../Interfaces/nodeGeometryExecutionContext";
import type { VertexData } from "../../../mesh.vertexData";
import { Vector3 } from "../../../../Maths/math.vector";
import { PropertyTypeForEdition, editableInPropertyPage } from "../../Interfaces/nodeGeometryDecorator";
import { Epsilon } from "../../../../Maths";
import type { Nullable } from "../../../../types";

/**
 * Block used to instance geometry on every vertex of a geometry
 */
export class InstantiateOnVerticesBlock extends NodeGeometryBlock implements INodeGeometryExecutionContext {
    private _vertexData: VertexData;
    private _currentIndex: number;
    private _indexTranslation: Nullable<{[key: number]: number}> = null;

    /**
     * Gets or sets a boolean indicating if the block should remove duplicated positions
     */
    @editableInPropertyPage("Remove duplicated positions", PropertyTypeForEdition.Boolean, "ADVANCED", { notifiers: { update: true } })
    public removeDuplicatedPositions = false;

    /**
     * Create a new InstantiateOnVerticesBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.registerInput("instance", NodeGeometryBlockConnectionPointTypes.Geometry, true);
        this.registerInput("rotation", NodeGeometryBlockConnectionPointTypes.Vector3, true, Vector3.Zero());
        this.registerInput("scaling", NodeGeometryBlockConnectionPointTypes.Vector3, true, Vector3.One());
        this.registerInput("density", NodeGeometryBlockConnectionPointTypes.Float, true, 1, 0, 1);

        this.scaling.acceptedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Float);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current index in the current flow
     * @returns the current index
     */
    public getExecutionIndex(): number {
        return this._indexTranslation ? this._indexTranslation[this._currentIndex] : this._currentIndex;
    }

    /**
     * Gets the current face index in the current flow
     * @returns the current face index
     */
    public getExecutionFaceIndex(): number {
        return 0;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "InstantiateOnVerticesBlock";
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
     * Gets the density input component
     */
    public get density(): NodeGeometryConnectionPoint {
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

        if (!this._vertexData || !this._vertexData.positions || !this.instance.isConnected) {
            state.executionContext = null;
            state.geometryContext = null;
            this.output._storedValue = null;
            return;
        }

        // Processing
        let vertexCount = this._vertexData.positions.length / 3;
        const additionalVertexData: VertexData[] = [];
        const currentPosition = new Vector3();
        const alreadyDone = new Array<number>();
        let vertices = this._vertexData.positions;

        if (this.removeDuplicatedPositions) {
            this._indexTranslation = {};
            for (this._currentIndex = 0; this._currentIndex < vertexCount; this._currentIndex++) {
                const x = vertices[this._currentIndex * 3];
                const y = vertices[this._currentIndex * 3 + 1];
                const z = vertices[this._currentIndex * 3 + 2];
                let found = false;
                for (let index = 0; index < alreadyDone.length; index += 3) {
                    if ( 
                        Math.abs(alreadyDone[index] - x) < Epsilon && 
                        Math.abs(alreadyDone[index + 1] - y) < Epsilon && 
                        Math.abs(alreadyDone[index + 2] - z) < Epsilon
                        ) { 
                        found = true;
                        break;
                    }
                }

                if (found) {
                    continue;
                }
                this._indexTranslation[alreadyDone.length / 3] = this._currentIndex;
                alreadyDone.push(x, y, z);
            }

            vertices = alreadyDone;
            vertexCount = vertices.length / 3;
        } else {
            this._indexTranslation = null;
        }

        for (this._currentIndex = 0; this._currentIndex < vertexCount; this._currentIndex++) {
            const instanceGeometry = this.instance.getConnectedValue(state) as VertexData;

            if (!instanceGeometry || !instanceGeometry.positions || instanceGeometry.positions.length === 0) {
                continue;
            }

            const density = this.density.getConnectedValue(state);

            if (density < 1) {
                if (Math.random() > density) {
                    continue;
                }
            }

            currentPosition.fromArray(vertices, this._currentIndex * 3);

            // Clone the instance
            const clone = instanceGeometry.clone();

            // Transform
            const scaling = state.adaptInput(this.scaling, NodeGeometryBlockConnectionPointTypes.Vector3, Vector3.OneReadOnly);
            const rotation = this.rotation.getConnectedValue(state) || Vector3.ZeroReadOnly;
            state._instantiate(clone, currentPosition, rotation, scaling, additionalVertexData);
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

    protected _dumpPropertiesCode() {
        const codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.removeDuplicatedPositions = ${this.removeDuplicatedPositions ? "true" : "false"};\r\n`;
        return codeString;
    }

    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    public serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.removeDuplicatedPositions = this.removeDuplicatedPositions;

        return serializationObject;
    }

    public _deserialize(serializationObject: any, rootUrl: string) {
        super._deserialize(serializationObject, rootUrl);

        this.removeDuplicatedPositions = serializationObject.removeDuplicatedPositions;
    }
}

RegisterClass("BABYLON.InstantiateOnVerticesBlock", InstantiateOnVerticesBlock);
