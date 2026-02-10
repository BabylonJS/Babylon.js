import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import { RegisterClass } from "../../../../Misc/typeStore";
import { Vector3 } from "core/Maths/math.vector";
import { VertexData } from "core/Meshes/mesh.vertexData";

/**
 * Defines a block used to generate a geometry data from a list of points
 */
export class PointListBlock extends NodeGeometryBlock {
    /**
     * Gets or sets a list of points used to generate the geometry
     */
    public points: Vector3[] = [];

    /**
     * Create a new PointListBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerOutput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "PointListBlock";
    }

    /**
     * Gets the geometry output component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock(_state: NodeGeometryBuildState) {
        this.geometry._storedFunction = () => {
            this.geometry._executionCount = 1;

            if (this.points.length === 0) {
                return null;
            }

            const vertexData = new VertexData();
            vertexData.positions = this.points.reduce((acc, point) => {
                acc.push(point.x, point.y, point.z);
                return acc;
            }, [] as number[]);

            return vertexData;
        };
    }

    protected override _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.points = [];\n`;

        for (let i = 0; i < this.points.length; i++) {
            const point = this.points[i];
            codeString += `${this._codeVariableName}.points.push(new BABYLON.Vector3(${point.x}, ${point.y}, ${point.z}));\n`;
        }
        return codeString;
    }

    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.points = this.points.map((point) => {
            return point.asArray();
        });

        return serializationObject;
    }

    /** @internal */
    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this.points = serializationObject.points.map((point: number[]) => {
            return Vector3.FromArray(point);
        });
    }
}

RegisterClass("BABYLON.PointListBlock", PointListBlock);
