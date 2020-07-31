import { Mesh } from "babylonjs/Meshes/mesh";
import { VertexBuffer } from "babylonjs/Meshes/buffer";
import { Vector3 } from "babylonjs/Maths/math.vector";

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
    * @returns the STL as UTF8 string
    */
    public static CreateSTL(meshes: Mesh[], download: boolean= true, fileName: string= 'STL_Mesh', binary: boolean= false, isLittleEndian: boolean = true): any {

        //Binary support adapted from https://gist.github.com/paulkaplan/6d5f0ab2c7e8fdc68a61

        let getFaceData = function(indices: any, vertices: any, i: number) {
            let id = [indices[i] * 3, indices[i + 1] * 3, indices[i + 2] * 3];
            let v = [
                new Vector3(vertices[id[0]], vertices[id[0] + 1], vertices[id[0] + 2]),
                new Vector3(vertices[id[1]], vertices[id[1] + 1], vertices[id[1] + 2]),
                new Vector3(vertices[id[2]], vertices[id[2] + 1], vertices[id[2] + 2])
            ];
            let p1p2 = v[0].subtract(v[1]);
            let p3p2 = v[2].subtract(v[1]);
            let n = (Vector3.Cross(p1p2, p3p2)).normalize();

            return {v, n};
        };

        let writeVector = function(dataview: any, offset: number, vector: Vector3, isLittleEndian: boolean) {
                offset = writeFloat(dataview, offset, vector.x, isLittleEndian);
                offset = writeFloat(dataview, offset, vector.y, isLittleEndian);
                return writeFloat(dataview, offset, vector.z, isLittleEndian);
        };

        let writeFloat = function(dataview: any, offset: number, value: number, isLittleEndian: boolean) {
            dataview.setFloat32(offset, value, isLittleEndian);
            return offset + 4;
        };

        let data;

        let faceCount = 0;
        let offset = 0;

        if (binary) {
            for (let i = 0; i < meshes.length; i++) {
                let mesh = meshes[i];
                let indices = mesh.getIndices();
                faceCount += indices ? indices.length : 0;
            }

            let bufferSize = 84 + (50 * faceCount);
            let buffer = new ArrayBuffer(bufferSize);
            data = new DataView(buffer);

            offset += 80;
            data.setUint32(offset, faceCount, isLittleEndian);
            offset += 4;

        }else {
            data = 'solid exportedMesh\r\n';
        }

        for (let i = 0; i < meshes.length; i++) {
            let mesh = meshes[i];
            mesh.bakeCurrentTransformIntoVertices();
            let vertices = mesh.getVerticesData(VertexBuffer.PositionKind) || [];
            let indices = mesh.getIndices() || [];

            for (let i = 0; i < indices.length; i += 3) {
                let fd = getFaceData(indices, vertices, i);

                if (binary) {
                    offset = writeVector(data, offset, fd.n, isLittleEndian);
                    offset = writeVector(data, offset, fd.v[0], isLittleEndian);
                    offset = writeVector(data, offset, fd.v[1], isLittleEndian);
                    offset = writeVector(data, offset, fd.v[2], isLittleEndian);
                    offset += 2;
                }else {
                    data += 'facet normal ' + fd.n.x + ' ' + fd.n.y + ' ' + fd.n.z + '\r\n';
                    data += '\touter loop\r\n';
                    data += '\t\tvertex ' + fd.v[0].x + ' ' + fd.v[0].y + ' ' + fd.v[0].z + '\r\n';
                    data += '\t\tvertex ' + fd.v[1].x + ' ' + fd.v[1].y + ' ' + fd.v[1].z + '\r\n';
                    data += '\t\tvertex ' + fd.v[2].x + ' ' + fd.v[2].y + ' ' + fd.v[2].z + '\r\n';
                    data += '\tendloop\r\n';
                    data += 'endfacet\r\n';
                }

            }
        }

        if (!binary) {
            data += 'endsolid exportedMesh';
        }

        if (download) {
            let a = document.createElement('a');
            let blob = new Blob([data], {'type': 'application/octet-stream'});
            a.href = window.URL.createObjectURL(blob);

            if (!fileName) {
                fileName = "STL_Mesh";
            }
            a.download = fileName + ".stl";
            a.click();
        }

    return data;
    }
}
