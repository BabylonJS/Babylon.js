/// <reference path="../babylon.d.ts"/>
module BABYLON {
 export class OBJExport {
        //Exports the geometry of a Mesh in .OBJ file format (text)
        public static OBJ(mesh: Mesh, materials?: boolean, matlibname?: string): string {
            var output = [];
            var g = mesh.geometry;
            var trunkVerts = g.getVerticesData('position');
            var trunkNormals = g.getVerticesData('normal');
            var trunkUV = g.getVerticesData('uv');
            var trunkFaces = g.getIndices();
            if (materials) {
                if (!matlibname) {
                    matlibname = 'mat';
                }
                output.push("mtllib " + matlibname + ".mtl");
            }
            for (var i = 0; i < trunkVerts.length; i += 3) {
                output.push("v " + trunkVerts[i] + " " + trunkVerts[i + 1] + " " + trunkVerts[i + 2]);
            }
            for (i = 0; i < trunkNormals.length; i += 3) {
                output.push("vn " + trunkNormals[i] + " " + trunkNormals[i + 1] + " " + trunkNormals[i + 2]);
            }
            for (i = 0; i < trunkUV.length; i += 2) {
                output.push("vt " + trunkUV[i] + " " + trunkUV[i + 1]);
            }

            //TODO: submeshes (groups)
            //TODO: smoothing groups (s 1, s off)

            output.push("g gr1");
            if (materials) {
                output.push("usemtl mat1");
            }
            for (i = 0; i < trunkFaces.length; i += 3) {
                output.push(
                    "f " + (trunkFaces[i + 2] + 1) + "/" + (trunkFaces[i + 2] + 1) + "/" + (trunkFaces[i + 2] + 1) +
                    " " + (trunkFaces[i + 1] + 1) + "/" + (trunkFaces[i + 1] + 1) + "/" + (trunkFaces[i + 1] + 1) +
                    " " + (trunkFaces[i] + 1) + "/" + (trunkFaces[i] + 1) + "/" + (trunkFaces[i] + 1)
                );
            }
            var text = output.join("\n");
            return (text);
        }

        //Exports the material(s) of a mesh in .MTL file format (text)
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
}