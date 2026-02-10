import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import { PropertyTypeForEdition, editableInPropertyPage } from "../../../Decorators/nodeDecorator";
import type { NodeGeometryBuildState } from "../nodeGeometryBuildState";
import type { FloatArray } from "../../../types";
import { VertexData } from "../../../Meshes/mesh.vertexData";
import { WithinEpsilon } from "../../../Maths/math.scalar.functions";
import { Epsilon } from "../../../Maths/math.constants";
import type { INodeGeometryExecutionContext } from "../Interfaces/nodeGeometryExecutionContext";
/**
 * Block used to extract unique positions from a geometry
 */
export class GeometryOptimizeBlock extends NodeGeometryBlock implements INodeGeometryExecutionContext {
    private _currentIndex: number;
    /**
     * Gets or sets a boolean indicating that this block can evaluate context
     * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
     */
    @editableInPropertyPage("Evaluate context", PropertyTypeForEdition.Boolean, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public evaluateContext = true;

    /**
     * Define the epsilon used to compare similar positions
     */
    @editableInPropertyPage("Epsilon", PropertyTypeForEdition.Float, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public epsilon = Epsilon;

    /**
     * Optimize faces (by removing duplicates)
     */
    @editableInPropertyPage("Optimize faces", PropertyTypeForEdition.Boolean, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public optimizeFaces = false;

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
     * Creates a new GeometryOptimizeBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.registerInput("selector", NodeGeometryBlockConnectionPointTypes.Int, true);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "GeometryOptimizeBlock";
    }

    /**
     * Gets the geometry component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the selector component
     */
    public get selector(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock(state: NodeGeometryBuildState) {
        const func = (state: NodeGeometryBuildState) => {
            if (!this.geometry.isConnected) {
                return null;
            }
            const vertexData = this.geometry.getConnectedValue(state);
            const newPositions: FloatArray = [];
            const newIndicesMap: { [key: number]: number } = {};
            const newUVs: FloatArray = [];
            state.pushExecutionContext(this);
            state.pushGeometryContext(vertexData);

            // Optimize positions
            for (let index = 0; index < vertexData.positions.length; index += 3) {
                this._currentIndex = index / 3;

                if (this.selector.isConnected) {
                    const selector = this.selector.getConnectedValue(state);
                    if (!selector) {
                        continue;
                    }
                }

                const x = vertexData.positions[index];
                const y = vertexData.positions[index + 1];
                const z = vertexData.positions[index + 2];

                const uvIndex = (index / 3) * 2;
                const u = vertexData.uvs ? vertexData.uvs[uvIndex] : 0;
                const v = vertexData.uvs ? vertexData.uvs[uvIndex + 1] : 0;

                // check if we already have it
                let found = false;
                for (let checkIndex = 0; checkIndex < newPositions.length; checkIndex += 3) {
                    if (
                        WithinEpsilon(x, newPositions[checkIndex], this.epsilon) &&
                        WithinEpsilon(y, newPositions[checkIndex + 1], this.epsilon) &&
                        WithinEpsilon(z, newPositions[checkIndex + 2], this.epsilon)
                    ) {
                        newIndicesMap[index / 3] = checkIndex / 3;
                        found = true;
                        continue;
                    }
                }

                if (!found) {
                    newIndicesMap[index / 3] = newPositions.length / 3;
                    newPositions.push(x, y, z);
                    newUVs.push(u, v);
                }
            }
            const newVertexData = new VertexData();
            newVertexData.positions = newPositions;
            if (vertexData.uvs) {
                newVertexData.uvs = newUVs;
            }
            const indices: number[] = vertexData.indices.map((index: number) => newIndicesMap[index]);
            const newIndices: number[] = [];

            if (this.optimizeFaces) {
                // Optimize indices
                for (let index = 0; index < indices.length; index += 3) {
                    const a = indices[index];
                    const b = indices[index + 1];
                    const c = indices[index + 2];

                    if (a === b || b == c || c === a) {
                        continue;
                    }

                    // check if we already have it
                    let found = false;
                    for (let checkIndex = 0; checkIndex < newIndices.length; checkIndex += 3) {
                        if (a === newIndices[checkIndex] && b === newIndices[checkIndex + 1] && c === newIndices[checkIndex + 2]) {
                            found = true;
                            continue;
                        }

                        if (a === newIndices[checkIndex + 1] && b === newIndices[checkIndex + 2] && c === newIndices[checkIndex]) {
                            found = true;
                            continue;
                        }

                        if (a === newIndices[checkIndex + 2] && b === newIndices[checkIndex] && c === newIndices[checkIndex + 1]) {
                            found = true;
                            continue;
                        }
                    }

                    if (!found) {
                        newIndices.push(a, b, c);
                    }
                }

                newVertexData.indices = newIndices;
            } else {
                newVertexData.indices = indices;
            }

            return newVertexData;
        };

        state.restoreGeometryContext();
        state.restoreExecutionContext();

        if (this.evaluateContext) {
            this.output._storedFunction = func;
        } else {
            this.output._storedFunction = null;
            this.output._storedValue = func(state);
        }
    }

    protected override _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.evaluateContext = ${this.evaluateContext ? "true" : "false"};\n`;
        codeString += `${this._codeVariableName}.epsilon = ${this.epsilon};\n`;
        codeString += `${this._codeVariableName}.optimizeFaces = ${this.optimizeFaces ? "true" : "false"};\n`;
        return codeString;
    }

    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.evaluateContext = this.evaluateContext;
        serializationObject.epsilon = this.epsilon;
        serializationObject.optimizeFaces = this.optimizeFaces;

        return serializationObject;
    }

    /** @internal */
    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this.evaluateContext = serializationObject.evaluateContext;
        this.epsilon = serializationObject.epsilon;
        this.optimizeFaces = serializationObject.optimizeFaces;
    }
}

RegisterClass("BABYLON.GeometryOptimizeBlock", GeometryOptimizeBlock);
