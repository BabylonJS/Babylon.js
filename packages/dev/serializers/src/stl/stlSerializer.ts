import { Mesh } from "core/Meshes/mesh";
import { InstancedMesh } from "core/Meshes/instancedMesh";
import { VertexBuffer } from "core/Buffers/buffer";
import { Vector3 } from "core/Maths/math.vector";

/**
 * Class for generating STL data from a Babylon scene.
 */
export class STLExport {
    /**
     * Exports the geometry of a Mesh array in .STL file format (ASCII)
     * @param meshes list defines the mesh to serialize
     * @param download triggers the automatic download of the file.
     * @param fileName changes the downloads fileName.
     * @param binary changes the STL to a binary type.
     * @param isLittleEndian toggle for binary type exporter.
     * @param doNotBakeTransform toggle if meshes transforms should be baked or not.
     * @param supportInstancedMeshes toggle to export instanced Meshes. Enabling support for instanced meshes will override doNoBakeTransform as true
     * @param exportIndividualMeshes toggle to export each mesh as an independent mesh. By default, all the meshes are combined into one mesh. This property has no effect when exporting in binary format
     * @returns the STL as UTF8 string
     */
    public static CreateSTL(
        meshes: (Mesh | InstancedMesh)[],
        download: boolean = true,
        fileName: string = "stlmesh",
        binary: boolean = false,
        isLittleEndian: boolean = true,
        doNotBakeTransform: boolean = false,
        supportInstancedMeshes: boolean = false,
        exportIndividualMeshes: boolean = false
    ): any {
        //Binary support adapted from https://gist.github.com/paulkaplan/6d5f0ab2c7e8fdc68a61

        const getFaceData = function (indices: any, vertices: any, i: number) {
            const id = [indices[i] * 3, indices[i + 1] * 3, indices[i + 2] * 3];
            const v = [
                new Vector3(vertices[id[0]], vertices[id[0] + 2], vertices[id[0] + 1]),
                new Vector3(vertices[id[1]], vertices[id[1] + 2], vertices[id[1] + 1]),
                new Vector3(vertices[id[2]], vertices[id[2] + 2], vertices[id[2] + 1]),
            ];
            const p1p2 = v[0].subtract(v[1]);
            const p3p2 = v[2].subtract(v[1]);
            const n = Vector3.Cross(p3p2, p1p2).normalize();

            return { v, n };
        };

        const writeVector = function (dataview: any, offset: number, vector: Vector3, isLittleEndian: boolean) {
            offset = writeFloat(dataview, offset, vector.x, isLittleEndian);
            offset = writeFloat(dataview, offset, vector.y, isLittleEndian);
            return writeFloat(dataview, offset, vector.z, isLittleEndian);
        };

        const writeFloat = function (dataview: any, offset: number, value: number, isLittleEndian: boolean) {
            dataview.setFloat32(offset, value, isLittleEndian);
            return offset + 4;
        };

        const getVerticesData = function (mesh: InstancedMesh | Mesh) {
            if (supportInstancedMeshes) {
                let sourceMesh = mesh;
                if (mesh instanceof InstancedMesh) {
                    sourceMesh = mesh.sourceMesh;
                }
                const data = sourceMesh.getVerticesData(VertexBuffer.PositionKind, true, true);
                if (!data) {
                    return [];
                }
                const temp = Vector3.Zero();
                let index;
                for (index = 0; index < data.length; index += 3) {
                    Vector3.TransformCoordinatesFromFloatsToRef(data[index], data[index + 1], data[index + 2], mesh.computeWorldMatrix(true), temp).toArray(data, index);
                }
                return data;
            } else {
                return mesh.getVerticesData(VertexBuffer.PositionKind) || [];
            }
        };

        if (supportInstancedMeshes) {
            doNotBakeTransform = true;
        }

        let data: DataView<ArrayBuffer> | string = "";

        let faceCount = 0;
        let offset = 0;

        if (binary) {
            for (let i = 0; i < meshes.length; i++) {
                const mesh = meshes[i];
                const indices = mesh.getIndices();
                faceCount += indices ? indices.length / 3 : 0;
            }

            const bufferSize = 84 + 50 * faceCount;
            const buffer = new ArrayBuffer(bufferSize);
            data = new DataView(buffer);

            offset += 80;
            data.setUint32(offset, faceCount, isLittleEndian);
            offset += 4;
        } else {
            if (!exportIndividualMeshes) {
                data = "solid stlmesh\r\n";
            }
        }

        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            if (!binary && exportIndividualMeshes) {
                data += "solid " + mesh.name + "\r\n";
            }
            if (!doNotBakeTransform && mesh instanceof Mesh) {
                mesh.bakeCurrentTransformIntoVertices();
            }
            const vertices = getVerticesData(mesh);
            const indices = mesh.getIndices() || [];

            for (let i = 0; i < indices.length; i += 3) {
                const fd = getFaceData(indices, vertices, i);

                if (binary) {
                    offset = writeVector(data, offset, fd.n, isLittleEndian);
                    offset = writeVector(data, offset, fd.v[0], isLittleEndian);
                    offset = writeVector(data, offset, fd.v[1], isLittleEndian);
                    offset = writeVector(data, offset, fd.v[2], isLittleEndian);
                    offset += 2;
                } else {
                    data += "\tfacet normal " + fd.n.x + " " + fd.n.y + " " + fd.n.z + "\r\n";
                    data += "\t\touter loop\r\n";
                    data += "\t\t\tvertex " + fd.v[0].x + " " + fd.v[0].y + " " + fd.v[0].z + "\r\n";
                    data += "\t\t\tvertex " + fd.v[1].x + " " + fd.v[1].y + " " + fd.v[1].z + "\r\n";
                    data += "\t\t\tvertex " + fd.v[2].x + " " + fd.v[2].y + " " + fd.v[2].z + "\r\n";
                    data += "\t\tendloop\r\n";
                    data += "\tendfacet\r\n";
                }
            }
            if (!binary && exportIndividualMeshes) {
                data += "endsolid " + name + "\r\n";
            }
        }

        if (!binary && !exportIndividualMeshes) {
            data += "endsolid stlmesh";
        }

        if (download) {
            const a = document.createElement("a");
            const blob = new Blob([data], { type: "application/octet-stream" });
            a.href = window.URL.createObjectURL(blob);
            a.download = fileName + ".stl";
            a.click();
        }

        return data;
    }
}
