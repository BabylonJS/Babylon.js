
import { Nullable } from "babylonjs/types";
import { Matrix } from "babylonjs/Maths/math.vector";
import { Tools } from "babylonjs/Misc/tools";
import { StandardMaterial } from "babylonjs/Materials/standardMaterial";
import { Geometry } from "babylonjs/Meshes/geometry";
import { Mesh } from "babylonjs/Meshes/mesh";

/**
 * Class for generating OBJ data from a Babylon scene.
 */
export class OBJExport {
    /**
     * Exports the geometry of a Mesh array in .OBJ file format (text)
     * @param mesh defines the list of meshes to serialize
     * @param materials defines if materials should be exported
     * @param matlibname defines the name of the associated mtl file
     * @param globalposition defines if the exported positions are globals or local to the exported mesh
     * @returns the OBJ content
     */
    public static OBJ(mesh: Mesh[], materials?: boolean, matlibname?: string, globalposition?: boolean): string {
        const output: string[] = [];
        let v = 1;
        if (materials) {
            if (!matlibname) {
                matlibname = 'mat';
            }
            output.push("mtllib " + matlibname + ".mtl");
        }
        for (let j = 0; j < mesh.length; j++) {
            output.push("g object" + j);
            output.push("o object_" + j);

            //Uses the position of the item in the scene, to the file (this back to normal in the end)
            let lastMatrix: Nullable<Matrix> = null;
            if (globalposition) {
                var newMatrix = Matrix.Translation(mesh[j].position.x, mesh[j].position.y, mesh[j].position.z);
                lastMatrix = Matrix.Translation(-(mesh[j].position.x), -(mesh[j].position.y), -(mesh[j].position.z));
                mesh[j].bakeTransformIntoVertices(newMatrix);
            }

            //TODO: submeshes (groups)
            //TODO: smoothing groups (s 1, s off);
            if (materials) {
                let mat = mesh[j].material;

                if (mat) {
                    output.push("usemtl " + mat.id);
                }
            }
            const g: Nullable<Geometry> = mesh[j].geometry;

            if (!g) {
                Tools.Warn("No geometry is present on the mesh");
                continue;
            }

            const trunkVerts = g.getVerticesData('position');
            const trunkNormals = g.getVerticesData('normal');
            const trunkUV = g.getVerticesData('uv');
            const trunkFaces = g.getIndices();
            var curV = 0;

            if (!trunkVerts || !trunkFaces) {
                Tools.Warn("There are no position vertices or indices on the mesh!");
                continue;
            }

            for (var i = 0; i < trunkVerts.length; i += 3) {
                output.push("v " + trunkVerts[i] + " " + trunkVerts[i + 1] + " " + trunkVerts[i + 2]);
                curV++;
            }

            if (trunkNormals != null) {
                for (i = 0; i < trunkNormals.length; i += 3) {
                    output.push("vn " + trunkNormals[i] + " " + trunkNormals[i + 1] + " " + trunkNormals[i + 2]);
                }
            }
            if (trunkUV != null) {

                for (i = 0; i < trunkUV.length; i += 2) {
                    output.push("vt " + trunkUV[i] + " " + trunkUV[i + 1]);
                }
            }

            for (i = 0; i < trunkFaces.length; i += 3) {
                const indices = [String(trunkFaces[i + 2] + v), String(trunkFaces[i + 1] + v), String(trunkFaces[i] + v)];
                const blanks: string[] = ["", "", ""];

                const facePositions = indices;
                const faceUVs = trunkUV != null ? indices : blanks;
                const faceNormals = trunkNormals != null ? indices : blanks;

                output.push(
                    "f " + facePositions[0] + "/" + faceUVs[0] + "/" + faceNormals[0] +
                    " " + facePositions[1] + "/" + faceUVs[1] + "/" + faceNormals[1] +
                    " " + facePositions[2] + "/" + faceUVs[2] + "/" + faceNormals[2]
                );
            }
            //back de previous matrix, to not change the original mesh in the scene
            if (globalposition && lastMatrix) {
                mesh[j].bakeTransformIntoVertices(lastMatrix);
            }
            v += curV;
        }
        const text: string = output.join("\n");
        return (text);
    }

    /**
     * Exports the material(s) of a mesh in .MTL file format (text)
     * @param mesh defines the mesh to extract the material from
     * @returns the mtl content
     */
    //TODO: Export the materials of mesh array
    public static MTL(mesh: Mesh): string {
        var output = [];
        var m = <StandardMaterial>mesh.material;
        output.push("newmtl mat1");
        output.push("  Ns " + m.specularPower.toFixed(4));
        output.push("  Ni 1.5000");
        output.push("  d " + m.alpha.toFixed(4));
        output.push("  Tr 0.0000");
        output.push("  Tf 1.0000 1.0000 1.0000");
        output.push("  illum 2");
        output.push("  Ka " + m.ambientColor.r.toFixed(4) + " " + m.ambientColor.g.toFixed(4) + " " + m.ambientColor.b.toFixed(4));
        output.push("  Kd " + m.diffuseColor.r.toFixed(4) + " " + m.diffuseColor.g.toFixed(4) + " " + m.diffuseColor.b.toFixed(4));
        output.push("  Ks " + m.specularColor.r.toFixed(4) + " " + m.specularColor.g.toFixed(4) + " " + m.specularColor.b.toFixed(4));
        output.push("  Ke " + m.emissiveColor.r.toFixed(4) + " " + m.emissiveColor.g.toFixed(4) + " " + m.emissiveColor.b.toFixed(4));

        //TODO: uv scale, offset, wrap
        //TODO: UV mirrored in Blender? second UV channel? lightMap? reflection textures?
        var uvscale = "";

        if (m.ambientTexture) {
            output.push("  map_Ka " + uvscale + m.ambientTexture.name);
        }

        if (m.diffuseTexture) {
            output.push("  map_Kd " + uvscale + m.diffuseTexture.name);
            //TODO: alpha testing, opacity in diffuse texture alpha channel (diffuseTexture.hasAlpha -> map_d)
        }

        if (m.specularTexture) {
            output.push("  map_Ks " + uvscale + m.specularTexture.name);
            /* TODO: glossiness = specular highlight component is in alpha channel of specularTexture. (???)
            if (m.useGlossinessFromSpecularMapAlpha)  {
                output.push("  map_Ns "+uvscale + m.specularTexture.name);
            }
            */
        }

        /* TODO: emissive texture not in .MAT format (???)
        if (m.emissiveTexture) {
            output.push("  map_d "+uvscale+m.emissiveTexture.name);
        }
        */

        if (m.bumpTexture) {
            output.push("  map_bump -imfchan z " + uvscale + m.bumpTexture.name);
        }

        if (m.opacityTexture) {
            output.push("  map_d " + uvscale + m.opacityTexture.name);
        }

        var text = output.join("\n");
        return (text);
    }
}
