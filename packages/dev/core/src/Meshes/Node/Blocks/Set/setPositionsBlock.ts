import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import type { INodeGeometryExecutionContext } from "../../Interfaces/nodeGeometryExecutionContext";
import type { VertexData } from "../../../../Meshes/mesh.vertexData";
import type { Vector3 } from "../../../../Maths/math.vector";
import { PropertyTypeForEdition, editableInPropertyPage } from "core/Decorators/nodeDecorator";
import type { FloatArray } from "core/types";

/**
 * Block used to set positions for a geometry
 */
export class SetPositionsBlock extends NodeGeometryBlock implements INodeGeometryExecutionContext {
    private _vertexData: VertexData;
    private _currentIndex: number;

    /**
     * Gets or sets a boolean indicating that this block can evaluate context
     * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
     */
    @editableInPropertyPage("Evaluate context", PropertyTypeForEdition.Boolean, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public evaluateContext = true;

    /**
     * Create a new SetPositionsBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.registerInput("positions", NodeGeometryBlockConnectionPointTypes.Vector3);

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
     * Gets the current loop index in the current flow
     * @returns the current loop index
     */
    public getExecutionLoopIndex(): number {
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
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "SetPositionsBlock";
    }

    /**
     * Gets the geometry input component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the positions input component
     */
    public get positions(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the geometry output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    private _remapVector3Data(source: FloatArray, remap: { [key: number]: number }): FloatArray {
        const newData: FloatArray = [];
        for (let index = 0; index < source.length; index += 3) {
            const remappedIndex = remap[index / 3];

            if (remappedIndex !== undefined) {
                newData.push(source[index], source[index + 1], source[index + 2]);
            }
        }
        return newData;
    }

    private _remapVector4Data(source: FloatArray, remap: { [key: number]: number }): FloatArray {
        const newData: FloatArray = [];
        for (let index = 0; index < source.length; index += 4) {
            const remappedIndex = remap[index / 4];

            if (remappedIndex !== undefined) {
                newData.push(source[index], source[index + 1], source[index + 2], source[index + 3]);
            }
        }
        return newData;
    }

    private _remapVector2Data(source: FloatArray, remap: { [key: number]: number }): FloatArray {
        const newData: FloatArray = [];
        for (let index = 0; index < source.length; index += 2) {
            const remappedIndex = remap[index / 2];

            if (remappedIndex !== undefined) {
                newData.push(source[index], source[index + 1]);
            }
        }
        return newData;
    }

    protected override _buildBlock(state: NodeGeometryBuildState) {
        const func = (state: NodeGeometryBuildState) => {
            state.pushExecutionContext(this);

            this._vertexData = this.geometry.getConnectedValue(state);

            if (this._vertexData) {
                this._vertexData = this._vertexData.clone(); // Preserve source data
            }

            state.pushGeometryContext(this._vertexData);

            if (!this._vertexData || !this._vertexData.positions || !this.positions.isConnected) {
                state.restoreGeometryContext();
                state.restoreExecutionContext();
                this.output._storedValue = null;
                return;
            }

            // Processing
            const remap: { [key: number]: number } = {};
            const vertexCount = this._vertexData.positions.length / 3;
            const newPositions: FloatArray = [];
            let activeIndex = 0;
            let resize = false;
            for (this._currentIndex = 0; this._currentIndex < vertexCount; this._currentIndex++) {
                const tempVector3 = this.positions.getConnectedValue(state) as Vector3;
                if (tempVector3) {
                    tempVector3.toArray(newPositions, activeIndex * 3);
                    remap[this._currentIndex] = activeIndex;
                    activeIndex++;
                } else {
                    resize = true;
                }
            }

            if (resize) {
                // Indices remap
                if (this._vertexData.indices) {
                    const newIndices: number[] = [];
                    for (let index = 0; index < this._vertexData.indices.length; index += 3) {
                        const a = this._vertexData.indices[index];
                        const b = this._vertexData.indices[index + 1];
                        const c = this._vertexData.indices[index + 2];
                        const remappedA = remap[a];
                        const remappedB = remap[b];
                        const remappedC = remap[c];

                        if (remappedA !== undefined && remappedB !== undefined && remappedC !== undefined) {
                            newIndices.push(remappedA);
                            newIndices.push(remappedB);
                            newIndices.push(remappedC);
                        }
                    }

                    this._vertexData.indices = newIndices;
                }

                // Normals remap
                if (this._vertexData.normals) {
                    this._vertexData.normals = this._remapVector3Data(this._vertexData.normals, remap);
                }

                // Tangents remap
                if (this._vertexData.tangents) {
                    this._vertexData.tangents = this._remapVector4Data(this._vertexData.tangents, remap);
                }

                // Colors remap
                if (this._vertexData.colors) {
                    this._vertexData.colors = this._remapVector4Data(this._vertexData.colors, remap);
                }

                // UVs remap
                if (this._vertexData.uvs) {
                    this._vertexData.uvs = this._remapVector2Data(this._vertexData.uvs, remap);
                }
                if (this._vertexData.uvs2) {
                    this._vertexData.uvs2 = this._remapVector2Data(this._vertexData.uvs2, remap);
                }
                if (this._vertexData.uvs3) {
                    this._vertexData.uvs3 = this._remapVector2Data(this._vertexData.uvs3, remap);
                }
                if (this._vertexData.uvs4) {
                    this._vertexData.uvs4 = this._remapVector2Data(this._vertexData.uvs4, remap);
                }
                if (this._vertexData.uvs5) {
                    this._vertexData.uvs5 = this._remapVector2Data(this._vertexData.uvs5, remap);
                }
                if (this._vertexData.uvs6) {
                    this._vertexData.uvs6 = this._remapVector2Data(this._vertexData.uvs6, remap);
                }
            }

            // Update positions
            this._vertexData.positions = newPositions;

            // Storage
            state.restoreGeometryContext();
            state.restoreExecutionContext();
            return this._vertexData;
        };

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

RegisterClass("BABYLON.SetPositionsBlock", SetPositionsBlock);
