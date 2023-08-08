import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import type { INodeGeometryExecutionContext } from "../../Interfaces/nodeGeometryExecutionContext";
import type { VertexData } from "../../../mesh.vertexData";
import type { Vector2 } from "../../../../Maths/math.vector";
import { PropertyTypeForEdition, editableInPropertyPage } from "../../Interfaces/nodeGeometryDecorator";

/**
 * Block used to set texture coordinates for a geometry
 */
export class SetUVsBlock extends NodeGeometryBlock implements INodeGeometryExecutionContext {
    private _vertexData: VertexData;
    private _currentIndex: number;

    /**
     * Gets or sets a value indicating which UV to set
     */
    @editableInPropertyPage("Texture coordinates index", PropertyTypeForEdition.List, "ADVANCED", {
        notifiers: { update: true },
        options: [
            { label: "UV1", value: 0 },
            { label: "UV2", value: 1 },
            { label: "UV3", value: 2 },
            { label: "UV4", value: 3 },
            { label: "UV5", value: 4 },
            { label: "UV6", value: 5 },
        ],
    })
    public textureCoordinateIndex = 0;

    /**
     * Create a new SetUVsBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.registerInput("uvs", NodeGeometryBlockConnectionPointTypes.Vector2);

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
        return "SetUVsBlock";
    }

    /**
     * Gets the geometry input component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the uvs input component
     */
    public get uvs(): NodeGeometryConnectionPoint {
        return this._inputs[1];
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

        if (!this._vertexData || !this._vertexData.positions) {
            state.executionContext = null;
            state.geometryContext = null;
            this.output._storedValue = null;
            return;
        }

        if (!this.uvs.isConnected) {
            state.executionContext = null;
            state.geometryContext = null;
            this.output._storedValue = this._vertexData;
            return;
        }

        const uvs: number[] = [];

        // Processing
        const vertexCount = this._vertexData.positions.length / 3;
        for (this._currentIndex = 0; this._currentIndex < vertexCount; this._currentIndex++) {
            const tempVector3 = this.uvs.getConnectedValue(state) as Vector2;
            if (tempVector3) {
                tempVector3.toArray(uvs, this._currentIndex * 2);
            }
        }

        switch (this.textureCoordinateIndex) {
            case 0:
                this._vertexData.uvs = uvs;
                break;
            case 1:
                this._vertexData.uvs2 = uvs;
                break;
            case 2:
                this._vertexData.uvs3 = uvs;
                break;
            case 3:
                this._vertexData.uvs4 = uvs;
                break;
            case 4:
                this._vertexData.uvs5 = uvs;
                break;
            case 5:
                this._vertexData.uvs6 = uvs;
                break;
        }

        // Storage
        this.output._storedValue = this._vertexData;
        state.executionContext = null;
        state.geometryContext = null;
    }

    protected _dumpPropertiesCode() {
        const codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.textureCoordinateIndex};\r\n`;
        return codeString;
    }

    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    public serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.textureCoordinateIndex = this.textureCoordinateIndex;

        return serializationObject;
    }

    public _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this.textureCoordinateIndex = serializationObject.textureCoordinateIndex;
    }
}

RegisterClass("BABYLON.SetUVsBlock", SetUVsBlock);
