import { VertexData } from "core/Meshes/mesh.vertexData";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import { Vector3 } from "core/Maths/math.vector";
/**
 * Block used to recompute normals for a geometry
 */
export class ComputeNormalsBlock extends NodeGeometryBlock {
    /**
     * Creates a new ComputeNormalsBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ComputeNormalsBlock";
    }

    /**
     * Gets the geometry component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock() {
        this.output._storedFunction = (state) => {
            if (!this.geometry.isConnected) {
                return null;
            }

            const vertexData = this.geometry.getConnectedValue(state);
            if (!vertexData) {
                return null;
            }

            if (!vertexData.normals) {
                vertexData.normals = [];
            }

            function computeNormals(positions: number[], indices: number[], normals: number[]): void {
                const numVertices = positions.length / 3;

                // Initialize normals to zero
                for (let i = 0; i < positions.length; i++) {
                    normals[i] = 0;
                }

                const faceNormals: number[] = [];

                for (let i = 0; i < indices.length; i += 3) {
                    const i0 = indices[i];
                    const i1 = indices[i + 1];
                    const i2 = indices[i + 2];

                    const x0 = positions[i0 * 3],
                        y0 = positions[i0 * 3 + 1],
                        z0 = positions[i0 * 3 + 2];
                    const x1 = positions[i1 * 3],
                        y1 = positions[i1 * 3 + 1],
                        z1 = positions[i1 * 3 + 2];
                    const x2 = positions[i2 * 3],
                        y2 = positions[i2 * 3 + 1],
                        z2 = positions[i2 * 3 + 2];

                    const ux = x1 - x0,
                        uy = y1 - y0,
                        uz = z1 - z0;
                    const vx = x2 - x0,
                        vy = y2 - y0,
                        vz = z2 - z0;

                    // Cross product
                    const nx = uz * vy - uy * vz;
                    const ny = ux * vz - uz * vx;
                    const nz = uy * vx - ux * vy;

                    // Normalize
                    const length = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
                    faceNormals.push(nx / length, ny / length, nz / length);
                }

                const vertexCount = positions.length / 3;

                for (let i = 0; i < indices.length; i += 3) {
                    const faceIndex = i / 3;
                    const fnx = faceNormals[faceIndex * 3];
                    const fny = faceNormals[faceIndex * 3 + 1];
                    const fnz = faceNormals[faceIndex * 3 + 2];

                    for (let j = 0; j < 3; j++) {
                        const vi = indices[i + j];
                        normals[vi * 3] += fnx;
                        normals[vi * 3 + 1] += fny;
                        normals[vi * 3 + 2] += fnz;
                    }
                }

                // Normalize vertex normals
                for (let i = 0; i < vertexCount; i++) {
                    const x = normals[i * 3];
                    const y = normals[i * 3 + 1];
                    const z = normals[i * 3 + 2];
                    const len = Math.sqrt(x * x + y * y + z * z) || 1;

                    normals[i * 3] = x / len;
                    normals[i * 3 + 1] = y / len;
                    normals[i * 3 + 2] = z / len;
                }
            }

            //VertexData.ComputeNormals(vertexData.positions, vertexData.indices, vertexData.normals);
            computeNormals(vertexData.positions, vertexData.indices, vertexData.normals);

            return vertexData;
        };
    }
}

RegisterClass("BABYLON.ComputeNormalsBlock", ComputeNormalsBlock);
