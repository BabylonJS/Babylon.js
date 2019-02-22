import { Mesh } from "babylonjs/Meshes/mesh";
import { VertexBuffer } from "babylonjs/Meshes/buffer";
import { Vector3 } from "babylonjs/Maths/math";

/**
 * Class for generating STL data from a Babylon scene.
 */
export class STLExport {
     /**
     * Exports the geometry of a Mesh array in .STL file format (ASCII)
     * @param mesh defines the meshe to serialize
     * @param fileName Name of the file when downloaded.
     * @param download triggers the automatic download of the file.
     * @returns the ASCII STL format
     */
    public static ASCII(mesh: Mesh, download = false, fileName?: string): string {

            let data = 'solid exportedMesh\r\n';
            let vertices = mesh.getVerticesData(VertexBuffer.PositionKind) || [];
            let indices = mesh.getIndices() || [];

            for (let i = 0; i < indices.length; i += 3) {
                let id = [indices[i] * 3, indices[i + 1] * 3, indices[i + 2] * 3];
                let v = [
                new Vector3(vertices[id[0]], vertices[id[0] + 1], vertices[id[0] + 2]),
                new Vector3(vertices[id[1]], vertices[id[1] + 1], vertices[id[1] + 2]),
                new Vector3(vertices[id[2]], vertices[id[2] + 1], vertices[id[2] + 2])
                ];                
                let p1p2 = v[0].subtract(v[1]);
                let p3p2 = v[2].subtract(v[1]);
                let n = (Vector3.Cross(p1p2, p3p2)).normalize();

                data += 'facet normal ' + n.x + ' ' + n.y + ' ' + n.z + '\r\n';
                data += '\touter loop\r\n';
                data += '\t\tvertex ' + v[0].x + ' ' + v[0].y + ' ' + v[0].z + '\r\n';
                data += '\t\tvertex ' + v[1].x + ' ' + v[1].y + ' ' + v[1].z + '\r\n';
                data += '\t\tvertex ' + v[2].x + ' ' + v[2].y + ' ' + v[2].z + '\r\n';
                data += '\tendloop\r\n';
                data += 'endfacet\r\n';
            }            
            data += 'endsolid exportedMesh';

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