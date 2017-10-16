/// <reference path="../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var OBJExport = /** @class */ (function () {
        function OBJExport() {
        }
        //Exports the geometrys of a Mesh array in .OBJ file format (text)
        OBJExport.OBJ = function (mesh, materials, matlibname, globalposition) {
            var output = [];
            var v = 1;
            if (materials) {
                if (!matlibname) {
                    matlibname = 'mat';
                }
                output.push("mtllib " + matlibname + ".mtl");
            }
            for (var j = 0; j < mesh.length; j++) {
                output.push("g object" + j);
                output.push("o object_" + j);
                //Uses the position of the item in the scene, to the file (this back to normal in the end)
                if (globalposition) {
                    var newMatrix = BABYLON.Matrix.Translation(mesh[j].position.x, mesh[j].position.y, mesh[j].position.z);
                    var lastMatrix = BABYLON.Matrix.Translation(-(mesh[j].position.x), -(mesh[j].position.y), -(mesh[j].position.z));
                    mesh[j].bakeTransformIntoVertices(newMatrix);
                }
                //TODO: submeshes (groups)
                //TODO: smoothing groups (s 1, s off);
                if (materials) {
                    output.push("usemtl " + mesh[j].material.id);
                }
                var g = mesh[j].geometry;
                var trunkVerts = g.getVerticesData('position');
                var trunkNormals = g.getVerticesData('normal');
                var trunkUV = g.getVerticesData('uv');
                var trunkFaces = g.getIndices();
                var curV = 0;
                for (var i = 0; i < trunkVerts.length; i += 3) {
                    output.push("v " + trunkVerts[i] + " " + trunkVerts[i + 1] + " " + trunkVerts[i + 2]);
                    curV++;
                }
                for (i = 0; i < trunkNormals.length; i += 3) {
                    output.push("vn " + trunkNormals[i] + " " + trunkNormals[i + 1] + " " + trunkNormals[i + 2]);
                }
                for (i = 0; i < trunkUV.length; i += 2) {
                    output.push("vt " + trunkUV[i] + " " + trunkUV[i + 1]);
                }
                for (i = 0; i < trunkFaces.length; i += 3) {
                    output.push("f " + (trunkFaces[i + 2] + v) + "/" + (trunkFaces[i + 2] + v) + "/" + (trunkFaces[i + 2] + v) +
                        " " + (trunkFaces[i + 1] + v) + "/" + (trunkFaces[i + 1] + v) + "/" + (trunkFaces[i + 1] + v) +
                        " " + (trunkFaces[i] + v) + "/" + (trunkFaces[i] + v) + "/" + (trunkFaces[i] + v));
                }
                //back de previous matrix, to not change the original mesh in the scene
                if (globalposition) {
                    mesh[j].bakeTransformIntoVertices(lastMatrix);
                }
                v += curV;
            }
            var text = output.join("\n");
            return (text);
        };
        //Exports the material(s) of a mesh in .MTL file format (text)
        //TODO: Export the materials of mesh array
        OBJExport.MTL = function (mesh) {
            var output = [];
            var m = mesh.material;
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
        };
        return OBJExport;
    }());
    BABYLON.OBJExport = OBJExport;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.objSerializer.js.map
