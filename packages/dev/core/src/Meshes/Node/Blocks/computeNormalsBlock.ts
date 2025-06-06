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

                // Helper to read a vector from positions
                const getVec = (i: number): [number, number, number] => {
                    const idx = i * 3;
                    return [positions[idx], positions[idx + 1], positions[idx + 2]];
                };

                // Loop over each triangle
                for (let i = 0; i < indices.length; i += 3) {
                    const i0 = indices[i];
                    const i1 = indices[i + 1];
                    const i2 = indices[i + 2];

                    const [x0, y0, z0] = getVec(i0);
                    const [x1, y1, z1] = getVec(i1);
                    const [x2, y2, z2] = getVec(i2);

                    const vx = x1 - x0;
                    const vy = y1 - y0;
                    const vz = z1 - z0;

                    const ux = x2 - x0;
                    const uy = y2 - y0;
                    const uz = z2 - z0;

                    // Cross product: u × v
                    const nx = uy * vz - uz * vy;
                    const ny = uz * vx - ux * vz;
                    const nz = ux * vy - uy * vx;

                    // Add the face normal to each vertex normal
                    for (const idx of [i0, i1, i2]) {
                        normals[idx * 3] += nx;
                        normals[idx * 3 + 1] += ny;
                        normals[idx * 3 + 2] += nz;
                    }
                }

                // Normalize normals
                for (let i = 0; i < numVertices; i++) {
                    const x = normals[i * 3];
                    const y = normals[i * 3 + 1];
                    const z = normals[i * 3 + 2];

                    const length = Math.sqrt(x * x + y * y + z * z) || 1;

                    normals[i * 3] = x / length;
                    normals[i * 3 + 1] = y / length;
                    normals[i * 3 + 2] = z / length;
                }
            }

            //VertexData.ComputeNormals(vertexData.positions, vertexData.indices, vertexData.normals);
            computeNormals(vertexData.positions, vertexData.indices, vertexData.normals);

            return vertexData;
        };
    }
}

RegisterClass("BABYLON.ComputeNormalsBlock", ComputeNormalsBlock);
