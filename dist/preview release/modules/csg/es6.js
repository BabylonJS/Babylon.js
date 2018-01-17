

import * as BABYLON from 'babylonjs/core/es6';
var BABYLON;
(function (BABYLON) {
    // Unique ID when we import meshes from Babylon to CSG
    var currentCSGMeshId = 0;
    // # class Vertex
    // Represents a vertex of a polygon. Use your own vertex class instead of this
    // one to provide additional features like texture coordinates and vertex
    // colors. Custom vertex classes need to provide a `pos` property and `clone()`,
    // `flip()`, and `interpolate()` methods that behave analogous to the ones
    // defined by `BABYLON.CSG.Vertex`. This class provides `normal` so convenience
    // functions like `BABYLON.CSG.sphere()` can return a smooth vertex normal, but `normal`
    // is not used anywhere else. 
    // Same goes for uv, it allows to keep the original vertex uv coordinates of the 2 meshes
    var Vertex = /** @class */ (function () {
        function Vertex(pos, normal, uv) {
            this.pos = pos;
            this.normal = normal;
            this.uv = uv;
        }
        Vertex.prototype.clone = function () {
            return new Vertex(this.pos.clone(), this.normal.clone(), this.uv.clone());
        };
        // Invert all orientation-specific data (e.g. vertex normal). Called when the
        // orientation of a polygon is flipped.
        Vertex.prototype.flip = function () {
            this.normal = this.normal.scale(-1);
        };
        // Create a new vertex between this vertex and `other` by linearly
        // interpolating all properties using a parameter of `t`. Subclasses should
        // override this to interpolate additional properties.
        Vertex.prototype.interpolate = function (other, t) {
            return new Vertex(BABYLON.Vector3.Lerp(this.pos, other.pos, t), BABYLON.Vector3.Lerp(this.normal, other.normal, t), BABYLON.Vector2.Lerp(this.uv, other.uv, t));
        };
        return Vertex;
    }());
    // # class Plane
    // Represents a plane in 3D space.
    var Plane = /** @class */ (function () {
        function Plane(normal, w) {
            this.normal = normal;
            this.w = w;
        }
        Plane.FromPoints = function (a, b, c) {
            var v0 = c.subtract(a);
            var v1 = b.subtract(a);
            if (v0.lengthSquared() === 0 || v1.lengthSquared() === 0) {
                return null;
            }
            var n = BABYLON.Vector3.Normalize(BABYLON.Vector3.Cross(v0, v1));
            return new Plane(n, BABYLON.Vector3.Dot(n, a));
        };
        Plane.prototype.clone = function () {
            return new Plane(this.normal.clone(), this.w);
        };
        Plane.prototype.flip = function () {
            this.normal.scaleInPlace(-1);
            this.w = -this.w;
        };
        // Split `polygon` by this plane if needed, then put the polygon or polygon
        // fragments in the appropriate lists. Coplanar polygons go into either
        // `coplanarFront` or `coplanarBack` depending on their orientation with
        // respect to this plane. Polygons in front or in back of this plane go into
        // either `front` or `back`.
        Plane.prototype.splitPolygon = function (polygon, coplanarFront, coplanarBack, front, back) {
            var COPLANAR = 0;
            var FRONT = 1;
            var BACK = 2;
            var SPANNING = 3;
            // Classify each point as well as the entire polygon into one of the above
            // four classes.
            var polygonType = 0;
            var types = [];
            var i;
            var t;
            for (i = 0; i < polygon.vertices.length; i++) {
                t = BABYLON.Vector3.Dot(this.normal, polygon.vertices[i].pos) - this.w;
                var type = (t < -Plane.EPSILON) ? BACK : (t > Plane.EPSILON) ? FRONT : COPLANAR;
                polygonType |= type;
                types.push(type);
            }
            // Put the polygon in the correct list, splitting it when necessary.
            switch (polygonType) {
                case COPLANAR:
                    (BABYLON.Vector3.Dot(this.normal, polygon.plane.normal) > 0 ? coplanarFront : coplanarBack).push(polygon);
                    break;
                case FRONT:
                    front.push(polygon);
                    break;
                case BACK:
                    back.push(polygon);
                    break;
                case SPANNING:
                    var f = [], b = [];
                    for (i = 0; i < polygon.vertices.length; i++) {
                        var j = (i + 1) % polygon.vertices.length;
                        var ti = types[i], tj = types[j];
                        var vi = polygon.vertices[i], vj = polygon.vertices[j];
                        if (ti !== BACK)
                            f.push(vi);
                        if (ti !== FRONT)
                            b.push(ti !== BACK ? vi.clone() : vi);
                        if ((ti | tj) === SPANNING) {
                            t = (this.w - BABYLON.Vector3.Dot(this.normal, vi.pos)) / BABYLON.Vector3.Dot(this.normal, vj.pos.subtract(vi.pos));
                            var v = vi.interpolate(vj, t);
                            f.push(v);
                            b.push(v.clone());
                        }
                    }
                    var poly;
                    if (f.length >= 3) {
                        poly = new Polygon(f, polygon.shared);
                        if (poly.plane)
                            front.push(poly);
                    }
                    if (b.length >= 3) {
                        poly = new Polygon(b, polygon.shared);
                        if (poly.plane)
                            back.push(poly);
                    }
                    break;
            }
        };
        // `BABYLON.CSG.Plane.EPSILON` is the tolerance used by `splitPolygon()` to decide if a
        // point is on the plane.
        Plane.EPSILON = 1e-5;
        return Plane;
    }());
    // # class Polygon
    // Represents a convex polygon. The vertices used to initialize a polygon must
    // be coplanar and form a convex loop.
    // 
    // Each convex polygon has a `shared` property, which is shared between all
    // polygons that are clones of each other or were split from the same polygon.
    // This can be used to define per-polygon properties (such as surface color).
    var Polygon = /** @class */ (function () {
        function Polygon(vertices, shared) {
            this.vertices = vertices;
            this.shared = shared;
            this.plane = Plane.FromPoints(vertices[0].pos, vertices[1].pos, vertices[2].pos);
        }
        Polygon.prototype.clone = function () {
            var vertices = this.vertices.map(function (v) { return v.clone(); });
            return new Polygon(vertices, this.shared);
        };
        Polygon.prototype.flip = function () {
            this.vertices.reverse().map(function (v) { v.flip(); });
            this.plane.flip();
        };
        return Polygon;
    }());
    // # class Node
    // Holds a node in a BSP tree. A BSP tree is built from a collection of polygons
    // by picking a polygon to split along. That polygon (and all other coplanar
    // polygons) are added directly to that node and the other polygons are added to
    // the front and/or back subtrees. This is not a leafy BSP tree since there is
    // no distinction between internal and leaf nodes.
    var Node = /** @class */ (function () {
        function Node(polygons) {
            this.plane = null;
            this.front = null;
            this.back = null;
            this.polygons = new Array();
            if (polygons) {
                this.build(polygons);
            }
        }
        Node.prototype.clone = function () {
            var node = new Node();
            node.plane = this.plane && this.plane.clone();
            node.front = this.front && this.front.clone();
            node.back = this.back && this.back.clone();
            node.polygons = this.polygons.map(function (p) { return p.clone(); });
            return node;
        };
        // Convert solid space to empty space and empty space to solid space.
        Node.prototype.invert = function () {
            for (var i = 0; i < this.polygons.length; i++) {
                this.polygons[i].flip();
            }
            if (this.plane) {
                this.plane.flip();
            }
            if (this.front) {
                this.front.invert();
            }
            if (this.back) {
                this.back.invert();
            }
            var temp = this.front;
            this.front = this.back;
            this.back = temp;
        };
        // Recursively remove all polygons in `polygons` that are inside this BSP
        // tree.
        Node.prototype.clipPolygons = function (polygons) {
            if (!this.plane)
                return polygons.slice();
            var front = new Array(), back = new Array();
            for (var i = 0; i < polygons.length; i++) {
                this.plane.splitPolygon(polygons[i], front, back, front, back);
            }
            if (this.front) {
                front = this.front.clipPolygons(front);
            }
            if (this.back) {
                back = this.back.clipPolygons(back);
            }
            else {
                back = [];
            }
            return front.concat(back);
        };
        // Remove all polygons in this BSP tree that are inside the other BSP tree
        // `bsp`.
        Node.prototype.clipTo = function (bsp) {
            this.polygons = bsp.clipPolygons(this.polygons);
            if (this.front)
                this.front.clipTo(bsp);
            if (this.back)
                this.back.clipTo(bsp);
        };
        // Return a list of all polygons in this BSP tree.
        Node.prototype.allPolygons = function () {
            var polygons = this.polygons.slice();
            if (this.front)
                polygons = polygons.concat(this.front.allPolygons());
            if (this.back)
                polygons = polygons.concat(this.back.allPolygons());
            return polygons;
        };
        // Build a BSP tree out of `polygons`. When called on an existing tree, the
        // new polygons are filtered down to the bottom of the tree and become new
        // nodes there. Each set of polygons is partitioned using the first polygon
        // (no heuristic is used to pick a good split).
        Node.prototype.build = function (polygons) {
            if (!polygons.length)
                return;
            if (!this.plane)
                this.plane = polygons[0].plane.clone();
            var front = new Array(), back = new Array();
            for (var i = 0; i < polygons.length; i++) {
                this.plane.splitPolygon(polygons[i], this.polygons, this.polygons, front, back);
            }
            if (front.length) {
                if (!this.front)
                    this.front = new Node();
                this.front.build(front);
            }
            if (back.length) {
                if (!this.back)
                    this.back = new Node();
                this.back.build(back);
            }
        };
        return Node;
    }());
    var CSG = /** @class */ (function () {
        function CSG() {
            this.polygons = new Array();
        }
        // Convert BABYLON.Mesh to BABYLON.CSG
        CSG.FromMesh = function (mesh) {
            var vertex, normal, uv, position, polygon, polygons = new Array(), vertices;
            var matrix, meshPosition, meshRotation, meshRotationQuaternion = null, meshScaling;
            if (mesh instanceof BABYLON.Mesh) {
                mesh.computeWorldMatrix(true);
                matrix = mesh.getWorldMatrix();
                meshPosition = mesh.position.clone();
                meshRotation = mesh.rotation.clone();
                if (mesh.rotationQuaternion) {
                    meshRotationQuaternion = mesh.rotationQuaternion.clone();
                }
                meshScaling = mesh.scaling.clone();
            }
            else {
                throw 'BABYLON.CSG: Wrong Mesh type, must be BABYLON.Mesh';
            }
            var indices = mesh.getIndices(), positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind), normals = mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind), uvs = mesh.getVerticesData(BABYLON.VertexBuffer.UVKind);
            var subMeshes = mesh.subMeshes;
            for (var sm = 0, sml = subMeshes.length; sm < sml; sm++) {
                for (var i = subMeshes[sm].indexStart, il = subMeshes[sm].indexCount + subMeshes[sm].indexStart; i < il; i += 3) {
                    vertices = [];
                    for (var j = 0; j < 3; j++) {
                        var sourceNormal = new BABYLON.Vector3(normals[indices[i + j] * 3], normals[indices[i + j] * 3 + 1], normals[indices[i + j] * 3 + 2]);
                        uv = new BABYLON.Vector2(uvs[indices[i + j] * 2], uvs[indices[i + j] * 2 + 1]);
                        var sourcePosition = new BABYLON.Vector3(positions[indices[i + j] * 3], positions[indices[i + j] * 3 + 1], positions[indices[i + j] * 3 + 2]);
                        position = BABYLON.Vector3.TransformCoordinates(sourcePosition, matrix);
                        normal = BABYLON.Vector3.TransformNormal(sourceNormal, matrix);
                        vertex = new Vertex(position, normal, uv);
                        vertices.push(vertex);
                    }
                    polygon = new Polygon(vertices, { subMeshId: sm, meshId: currentCSGMeshId, materialIndex: subMeshes[sm].materialIndex });
                    // To handle the case of degenerated triangle
                    // polygon.plane == null <=> the polygon does not represent 1 single plane <=> the triangle is degenerated
                    if (polygon.plane)
                        polygons.push(polygon);
                }
            }
            var csg = CSG.FromPolygons(polygons);
            csg.matrix = matrix;
            csg.position = meshPosition;
            csg.rotation = meshRotation;
            csg.scaling = meshScaling;
            csg.rotationQuaternion = meshRotationQuaternion;
            currentCSGMeshId++;
            return csg;
        };
        // Construct a BABYLON.CSG solid from a list of `BABYLON.CSG.Polygon` instances.
        CSG.FromPolygons = function (polygons) {
            var csg = new CSG();
            csg.polygons = polygons;
            return csg;
        };
        CSG.prototype.clone = function () {
            var csg = new CSG();
            csg.polygons = this.polygons.map(function (p) { return p.clone(); });
            csg.copyTransformAttributes(this);
            return csg;
        };
        CSG.prototype.union = function (csg) {
            var a = new Node(this.clone().polygons);
            var b = new Node(csg.clone().polygons);
            a.clipTo(b);
            b.clipTo(a);
            b.invert();
            b.clipTo(a);
            b.invert();
            a.build(b.allPolygons());
            return CSG.FromPolygons(a.allPolygons()).copyTransformAttributes(this);
        };
        CSG.prototype.unionInPlace = function (csg) {
            var a = new Node(this.polygons);
            var b = new Node(csg.polygons);
            a.clipTo(b);
            b.clipTo(a);
            b.invert();
            b.clipTo(a);
            b.invert();
            a.build(b.allPolygons());
            this.polygons = a.allPolygons();
        };
        CSG.prototype.subtract = function (csg) {
            var a = new Node(this.clone().polygons);
            var b = new Node(csg.clone().polygons);
            a.invert();
            a.clipTo(b);
            b.clipTo(a);
            b.invert();
            b.clipTo(a);
            b.invert();
            a.build(b.allPolygons());
            a.invert();
            return CSG.FromPolygons(a.allPolygons()).copyTransformAttributes(this);
        };
        CSG.prototype.subtractInPlace = function (csg) {
            var a = new Node(this.polygons);
            var b = new Node(csg.polygons);
            a.invert();
            a.clipTo(b);
            b.clipTo(a);
            b.invert();
            b.clipTo(a);
            b.invert();
            a.build(b.allPolygons());
            a.invert();
            this.polygons = a.allPolygons();
        };
        CSG.prototype.intersect = function (csg) {
            var a = new Node(this.clone().polygons);
            var b = new Node(csg.clone().polygons);
            a.invert();
            b.clipTo(a);
            b.invert();
            a.clipTo(b);
            b.clipTo(a);
            a.build(b.allPolygons());
            a.invert();
            return CSG.FromPolygons(a.allPolygons()).copyTransformAttributes(this);
        };
        CSG.prototype.intersectInPlace = function (csg) {
            var a = new Node(this.polygons);
            var b = new Node(csg.polygons);
            a.invert();
            b.clipTo(a);
            b.invert();
            a.clipTo(b);
            b.clipTo(a);
            a.build(b.allPolygons());
            a.invert();
            this.polygons = a.allPolygons();
        };
        // Return a new BABYLON.CSG solid with solid and empty space switched. This solid is
        // not modified.
        CSG.prototype.inverse = function () {
            var csg = this.clone();
            csg.inverseInPlace();
            return csg;
        };
        CSG.prototype.inverseInPlace = function () {
            this.polygons.map(function (p) { p.flip(); });
        };
        // This is used to keep meshes transformations so they can be restored
        // when we build back a Babylon Mesh
        // NB : All CSG operations are performed in world coordinates
        CSG.prototype.copyTransformAttributes = function (csg) {
            this.matrix = csg.matrix;
            this.position = csg.position;
            this.rotation = csg.rotation;
            this.scaling = csg.scaling;
            this.rotationQuaternion = csg.rotationQuaternion;
            return this;
        };
        // Build Raw mesh from CSG
        // Coordinates here are in world space
        CSG.prototype.buildMeshGeometry = function (name, scene, keepSubMeshes) {
            var matrix = this.matrix.clone();
            matrix.invert();
            var mesh = new BABYLON.Mesh(name, scene), vertices = [], indices = [], normals = [], uvs = [], vertex = BABYLON.Vector3.Zero(), normal = BABYLON.Vector3.Zero(), uv = BABYLON.Vector2.Zero(), polygons = this.polygons, polygonIndices = [0, 0, 0], polygon, vertice_dict = {}, vertex_idx, currentIndex = 0, subMesh_dict = {}, subMesh_obj;
            if (keepSubMeshes) {
                // Sort Polygons, since subMeshes are indices range
                polygons.sort(function (a, b) {
                    if (a.shared.meshId === b.shared.meshId) {
                        return a.shared.subMeshId - b.shared.subMeshId;
                    }
                    else {
                        return a.shared.meshId - b.shared.meshId;
                    }
                });
            }
            for (var i = 0, il = polygons.length; i < il; i++) {
                polygon = polygons[i];
                // Building SubMeshes
                if (!subMesh_dict[polygon.shared.meshId]) {
                    subMesh_dict[polygon.shared.meshId] = {};
                }
                if (!subMesh_dict[polygon.shared.meshId][polygon.shared.subMeshId]) {
                    subMesh_dict[polygon.shared.meshId][polygon.shared.subMeshId] = {
                        indexStart: +Infinity,
                        indexEnd: -Infinity,
                        materialIndex: polygon.shared.materialIndex
                    };
                }
                subMesh_obj = subMesh_dict[polygon.shared.meshId][polygon.shared.subMeshId];
                for (var j = 2, jl = polygon.vertices.length; j < jl; j++) {
                    polygonIndices[0] = 0;
                    polygonIndices[1] = j - 1;
                    polygonIndices[2] = j;
                    for (var k = 0; k < 3; k++) {
                        vertex.copyFrom(polygon.vertices[polygonIndices[k]].pos);
                        normal.copyFrom(polygon.vertices[polygonIndices[k]].normal);
                        uv.copyFrom(polygon.vertices[polygonIndices[k]].uv);
                        var localVertex = BABYLON.Vector3.TransformCoordinates(vertex, matrix);
                        var localNormal = BABYLON.Vector3.TransformNormal(normal, matrix);
                        vertex_idx = vertice_dict[localVertex.x + ',' + localVertex.y + ',' + localVertex.z];
                        // Check if 2 points can be merged
                        if (!(typeof vertex_idx !== 'undefined' &&
                            normals[vertex_idx * 3] === localNormal.x &&
                            normals[vertex_idx * 3 + 1] === localNormal.y &&
                            normals[vertex_idx * 3 + 2] === localNormal.z &&
                            uvs[vertex_idx * 2] === uv.x &&
                            uvs[vertex_idx * 2 + 1] === uv.y)) {
                            vertices.push(localVertex.x, localVertex.y, localVertex.z);
                            uvs.push(uv.x, uv.y);
                            normals.push(normal.x, normal.y, normal.z);
                            vertex_idx = vertice_dict[localVertex.x + ',' + localVertex.y + ',' + localVertex.z] = (vertices.length / 3) - 1;
                        }
                        indices.push(vertex_idx);
                        subMesh_obj.indexStart = Math.min(currentIndex, subMesh_obj.indexStart);
                        subMesh_obj.indexEnd = Math.max(currentIndex, subMesh_obj.indexEnd);
                        currentIndex++;
                    }
                }
            }
            mesh.setVerticesData(BABYLON.VertexBuffer.PositionKind, vertices);
            mesh.setVerticesData(BABYLON.VertexBuffer.NormalKind, normals);
            mesh.setVerticesData(BABYLON.VertexBuffer.UVKind, uvs);
            mesh.setIndices(indices, null);
            if (keepSubMeshes) {
                // We offset the materialIndex by the previous number of materials in the CSG mixed meshes
                var materialIndexOffset = 0, materialMaxIndex;
                mesh.subMeshes = new Array();
                for (var m in subMesh_dict) {
                    materialMaxIndex = -1;
                    for (var sm in subMesh_dict[m]) {
                        subMesh_obj = subMesh_dict[m][sm];
                        BABYLON.SubMesh.CreateFromIndices(subMesh_obj.materialIndex + materialIndexOffset, subMesh_obj.indexStart, subMesh_obj.indexEnd - subMesh_obj.indexStart + 1, mesh);
                        materialMaxIndex = Math.max(subMesh_obj.materialIndex, materialMaxIndex);
                    }
                    materialIndexOffset += ++materialMaxIndex;
                }
            }
            return mesh;
        };
        // Build Mesh from CSG taking material and transforms into account
        CSG.prototype.toMesh = function (name, material, scene, keepSubMeshes) {
            var mesh = this.buildMeshGeometry(name, scene, keepSubMeshes);
            mesh.material = material;
            mesh.position.copyFrom(this.position);
            mesh.rotation.copyFrom(this.rotation);
            if (this.rotationQuaternion) {
                mesh.rotationQuaternion = this.rotationQuaternion.clone();
            }
            mesh.scaling.copyFrom(this.scaling);
            mesh.computeWorldMatrix(true);
            return mesh;
        };
        return CSG;
    }());
    BABYLON.CSG = CSG;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.csg.js.map

BABYLON.Effect.ShadersStore['defaultVertexShader'] = "#include<__decl__defaultVertex>\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef TANGENT\nattribute vec4 tangent;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<helperFunctions>\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2;\n#endif\n#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0\nvarying vec2 vDiffuseUV;\n#endif\n#if defined(AMBIENT) && AMBIENTDIRECTUV == 0\nvarying vec2 vAmbientUV;\n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0\nvarying vec2 vOpacityUV;\n#endif\n#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0\nvarying vec2 vEmissiveUV;\n#endif\n#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0\nvarying vec2 vLightmapUV;\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM) && SPECULARDIRECTUV == 0\nvarying vec2 vSpecularUV;\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0\nvarying vec2 vBumpUV;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<bumpVertexDeclaration>\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<morphTargetsVertexGlobalDeclaration>\n#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#include<logDepthDeclaration>\nvoid main(void) {\nvec3 positionUpdated=position;\n#ifdef NORMAL \nvec3 normalUpdated=normal;\n#endif\n#ifdef TANGENT\nvec4 tangentUpdated=tangent;\n#endif\n#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvPositionUVW=positionUpdated;\n#endif \n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(positionUpdated,1.0);\nvec4 worldPos=finalWorld*vec4(positionUpdated,1.0);\nvPositionW=vec3(worldPos);\n#ifdef NORMAL\nmat3 normalWorld=mat3(finalWorld);\n#ifdef NONUNIFORMSCALING\nnormalWorld=transposeMat3(inverseMat3(normalWorld));\n#endif\nvNormalW=normalize(normalWorld*normalUpdated);\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvDirectionW=normalize(vec3(finalWorld*vec4(positionUpdated,0.0)));\n#endif\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef MAINUV1\nvMainUV1=uv;\n#endif\n#ifdef MAINUV2\nvMainUV2=uv2;\n#endif\n#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0\nif (vDiffuseInfos.x == 0.)\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(AMBIENT) && AMBIENTDIRECTUV == 0\nif (vAmbientInfos.x == 0.)\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0\nif (vOpacityInfos.x == 0.)\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0\nif (vEmissiveInfos.x == 0.)\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0\nif (vLightmapInfos.x == 0.)\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM) && SPECULARDIRECTUV == 0\nif (vSpecularInfos.x == 0.)\n{\nvSpecularUV=vec2(specularMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvSpecularUV=vec2(specularMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0\nif (vBumpInfos.x == 0.)\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#include<bumpVertex>\n#include<clipPlaneVertex>\n#include<fogVertex>\n#include<shadowsVertex>[0..maxSimultaneousLights]\n#ifdef VERTEXCOLOR\n\nvColor=color;\n#endif\n#include<pointCloudVertex>\n#include<logDepthVertex>\n}";
BABYLON.Effect.ShadersStore['defaultPixelShader'] = "#include<__decl__defaultFragment>\n#if defined(BUMP) || !defined(NORMAL)\n#extension GL_OES_standard_derivatives : enable\n#endif\n#ifdef LOGARITHMICDEPTH\n#extension GL_EXT_frag_depth : enable\n#endif\n\n#define RECIPROCAL_PI2 0.15915494\nuniform vec3 vEyePosition;\nuniform vec3 vAmbientColor;\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2;\n#endif\n\n#include<helperFunctions>\n\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n\n#ifdef DIFFUSE\n#if DIFFUSEDIRECTUV == 1\n#define vDiffuseUV vMainUV1\n#elif DIFFUSEDIRECTUV == 2\n#define vDiffuseUV vMainUV2\n#else\nvarying vec2 vDiffuseUV;\n#endif\nuniform sampler2D diffuseSampler;\n#endif\n#ifdef AMBIENT\n#if AMBIENTDIRECTUV == 1\n#define vAmbientUV vMainUV1\n#elif AMBIENTDIRECTUV == 2\n#define vAmbientUV vMainUV2\n#else\nvarying vec2 vAmbientUV;\n#endif\nuniform sampler2D ambientSampler;\n#endif\n#ifdef OPACITY \n#if OPACITYDIRECTUV == 1\n#define vOpacityUV vMainUV1\n#elif OPACITYDIRECTUV == 2\n#define vOpacityUV vMainUV2\n#else\nvarying vec2 vOpacityUV;\n#endif\nuniform sampler2D opacitySampler;\n#endif\n#ifdef EMISSIVE\n#if EMISSIVEDIRECTUV == 1\n#define vEmissiveUV vMainUV1\n#elif EMISSIVEDIRECTUV == 2\n#define vEmissiveUV vMainUV2\n#else\nvarying vec2 vEmissiveUV;\n#endif\nuniform sampler2D emissiveSampler;\n#endif\n#ifdef LIGHTMAP\n#if LIGHTMAPDIRECTUV == 1\n#define vLightmapUV vMainUV1\n#elif LIGHTMAPDIRECTUV == 2\n#define vLightmapUV vMainUV2\n#else\nvarying vec2 vLightmapUV;\n#endif\nuniform sampler2D lightmapSampler;\n#endif\n#ifdef REFRACTION\n#ifdef REFRACTIONMAP_3D\nuniform samplerCube refractionCubeSampler;\n#else\nuniform sampler2D refraction2DSampler;\n#endif\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\n#if SPECULARDIRECTUV == 1\n#define vSpecularUV vMainUV1\n#elif SPECULARDIRECTUV == 2\n#define vSpecularUV vMainUV2\n#else\nvarying vec2 vSpecularUV;\n#endif\nuniform sampler2D specularSampler;\n#endif\n\n#include<fresnelFunction>\n\n#ifdef REFLECTION\n#ifdef REFLECTIONMAP_3D\nuniform samplerCube reflectionCubeSampler;\n#else\nuniform sampler2D reflection2DSampler;\n#endif\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#else\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#endif\n#include<reflectionFunction>\n#endif\n#include<imageProcessingDeclaration>\n#include<imageProcessingFunctions>\n#include<bumpFragmentFunctions>\n#include<clipPlaneFragmentDeclaration>\n#include<logDepthDeclaration>\n#include<fogFragmentDeclaration>\nvoid main(void) {\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\nvec4 baseColor=vec4(1.,1.,1.,1.);\nvec3 diffuseColor=vDiffuseColor.rgb;\n\nfloat alpha=vDiffuseColor.a;\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=normalize(-cross(dFdx(vPositionW),dFdy(vPositionW)));\n#endif\n#include<bumpFragment>\n#ifdef TWOSIDEDLIGHTING\nnormalW=gl_FrontFacing ? normalW : -normalW;\n#endif\n#ifdef DIFFUSE\nbaseColor=texture2D(diffuseSampler,vDiffuseUV+uvOffset);\n#ifdef ALPHATEST\nif (baseColor.a<0.4)\ndiscard;\n#endif\n#ifdef ALPHAFROMDIFFUSE\nalpha*=baseColor.a;\n#endif\nbaseColor.rgb*=vDiffuseInfos.y;\n#endif\n#include<depthPrePass>\n#ifdef VERTEXCOLOR\nbaseColor.rgb*=vColor.rgb;\n#endif\n\nvec3 baseAmbientColor=vec3(1.,1.,1.);\n#ifdef AMBIENT\nbaseAmbientColor=texture2D(ambientSampler,vAmbientUV+uvOffset).rgb*vAmbientInfos.y;\n#endif\n\n#ifdef SPECULARTERM\nfloat glossiness=vSpecularColor.a;\nvec3 specularColor=vSpecularColor.rgb;\n#ifdef SPECULAR\nvec4 specularMapColor=texture2D(specularSampler,vSpecularUV+uvOffset);\nspecularColor=specularMapColor.rgb;\n#ifdef GLOSSINESS\nglossiness=glossiness*specularMapColor.a;\n#endif\n#endif\n#else\nfloat glossiness=0.;\n#endif\n\nvec3 diffuseBase=vec3(0.,0.,0.);\nlightingInfo info;\n#ifdef SPECULARTERM\nvec3 specularBase=vec3(0.,0.,0.);\n#endif\nfloat shadow=1.;\n#ifdef LIGHTMAP\nvec3 lightmapColor=texture2D(lightmapSampler,vLightmapUV+uvOffset).rgb*vLightmapInfos.y;\n#endif\n#include<lightFragment>[0..maxSimultaneousLights]\n\nvec3 refractionColor=vec3(0.,0.,0.);\n#ifdef REFRACTION\nvec3 refractionVector=normalize(refract(-viewDirectionW,normalW,vRefractionInfos.y));\n#ifdef REFRACTIONMAP_3D\nrefractionVector.y=refractionVector.y*vRefractionInfos.w;\nif (dot(refractionVector,viewDirectionW)<1.0)\n{\nrefractionColor=textureCube(refractionCubeSampler,refractionVector).rgb*vRefractionInfos.x;\n}\n#else\nvec3 vRefractionUVW=vec3(refractionMatrix*(view*vec4(vPositionW+refractionVector*vRefractionInfos.z,1.0)));\nvec2 refractionCoords=vRefractionUVW.xy/vRefractionUVW.z;\nrefractionCoords.y=1.0-refractionCoords.y;\nrefractionColor=texture2D(refraction2DSampler,refractionCoords).rgb*vRefractionInfos.x;\n#endif\n#endif\n\nvec3 reflectionColor=vec3(0.,0.,0.);\n#ifdef REFLECTION\nvec3 vReflectionUVW=computeReflectionCoords(vec4(vPositionW,1.0),normalW);\n#ifdef REFLECTIONMAP_3D\n#ifdef ROUGHNESS\nfloat bias=vReflectionInfos.y;\n#ifdef SPECULARTERM\n#ifdef SPECULAR\n#ifdef GLOSSINESS\nbias*=(1.0-specularMapColor.a);\n#endif\n#endif\n#endif\nreflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW,bias).rgb*vReflectionInfos.x;\n#else\nreflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW).rgb*vReflectionInfos.x;\n#endif\n#else\nvec2 coords=vReflectionUVW.xy;\n#ifdef REFLECTIONMAP_PROJECTION\ncoords/=vReflectionUVW.z;\n#endif\ncoords.y=1.0-coords.y;\nreflectionColor=texture2D(reflection2DSampler,coords).rgb*vReflectionInfos.x;\n#endif\n#ifdef REFLECTIONFRESNEL\nfloat reflectionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,reflectionRightColor.a,reflectionLeftColor.a);\n#ifdef REFLECTIONFRESNELFROMSPECULAR\n#ifdef SPECULARTERM\nreflectionColor*=specularColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#else\nreflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#endif\n#else\nreflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#endif\n#endif\n#endif\n#ifdef REFRACTIONFRESNEL\nfloat refractionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,refractionRightColor.a,refractionLeftColor.a);\nrefractionColor*=refractionLeftColor.rgb*(1.0-refractionFresnelTerm)+refractionFresnelTerm*refractionRightColor.rgb;\n#endif\n#ifdef OPACITY\nvec4 opacityMap=texture2D(opacitySampler,vOpacityUV+uvOffset);\n#ifdef OPACITYRGB\nopacityMap.rgb=opacityMap.rgb*vec3(0.3,0.59,0.11);\nalpha*=(opacityMap.x+opacityMap.y+opacityMap.z)* vOpacityInfos.y;\n#else\nalpha*=opacityMap.a*vOpacityInfos.y;\n#endif\n#endif\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\n#ifdef OPACITYFRESNEL\nfloat opacityFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,opacityParts.z,opacityParts.w);\nalpha+=opacityParts.x*(1.0-opacityFresnelTerm)+opacityFresnelTerm*opacityParts.y;\n#endif\n\nvec3 emissiveColor=vEmissiveColor;\n#ifdef EMISSIVE\nemissiveColor+=texture2D(emissiveSampler,vEmissiveUV+uvOffset).rgb*vEmissiveInfos.y;\n#endif\n#ifdef EMISSIVEFRESNEL\nfloat emissiveFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,emissiveRightColor.a,emissiveLeftColor.a);\nemissiveColor*=emissiveLeftColor.rgb*(1.0-emissiveFresnelTerm)+emissiveFresnelTerm*emissiveRightColor.rgb;\n#endif\n\n#ifdef DIFFUSEFRESNEL\nfloat diffuseFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,diffuseRightColor.a,diffuseLeftColor.a);\ndiffuseBase*=diffuseLeftColor.rgb*(1.0-diffuseFresnelTerm)+diffuseFresnelTerm*diffuseRightColor.rgb;\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#else\n#ifdef LINKEMISSIVEWITHDIFFUSE\nvec3 finalDiffuse=clamp((diffuseBase+emissiveColor)*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#else\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor+emissiveColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#endif\n#endif\n#ifdef SPECULARTERM\nvec3 finalSpecular=specularBase*specularColor;\n#ifdef SPECULAROVERALPHA\nalpha=clamp(alpha+dot(finalSpecular,vec3(0.3,0.59,0.11)),0.,1.);\n#endif\n#else\nvec3 finalSpecular=vec3(0.0);\n#endif\n#ifdef REFLECTIONOVERALPHA\nalpha=clamp(alpha+dot(reflectionColor,vec3(0.3,0.59,0.11)),0.,1.);\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec4 color=vec4(clamp(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+emissiveColor+refractionColor,0.0,1.0),alpha);\n#else\nvec4 color=vec4(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+refractionColor,alpha);\n#endif\n\n#ifdef LIGHTMAP\n#ifndef LIGHTMAPEXCLUDED\n#ifdef USELIGHTMAPASSHADOWMAP\ncolor.rgb*=lightmapColor;\n#else\ncolor.rgb+=lightmapColor;\n#endif\n#endif\n#endif\n#include<logDepthFragment>\n#include<fogFragment>\n\n\n#ifdef IMAGEPROCESSINGPOSTPROCESS\ncolor.rgb=toLinearSpace(color.rgb);\n#else\n#ifdef IMAGEPROCESSING\ncolor.rgb=toLinearSpace(color.rgb);\ncolor=applyImageProcessing(color);\n#endif\n#endif\n#ifdef PREMULTIPLYALPHA\n\ncolor.rgb*=color.a;\n#endif\ngl_FragColor=color;\n}";

BABYLON.Effect.IncludesShadersStore['depthPrePass'] = "#ifdef DEPTHPREPASS\ngl_FragColor=vec4(0.,0.,0.,1.0);\nreturn;\n#endif";
BABYLON.Effect.IncludesShadersStore['bonesDeclaration'] = "#if NUM_BONE_INFLUENCERS>0\nuniform mat4 mBones[BonesPerMesh];\nattribute vec4 matricesIndices;\nattribute vec4 matricesWeights;\n#if NUM_BONE_INFLUENCERS>4\nattribute vec4 matricesIndicesExtra;\nattribute vec4 matricesWeightsExtra;\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['instancesDeclaration'] = "#ifdef INSTANCES\nattribute vec4 world0;\nattribute vec4 world1;\nattribute vec4 world2;\nattribute vec4 world3;\n#else\nuniform mat4 world;\n#endif";
BABYLON.Effect.IncludesShadersStore['pointCloudVertexDeclaration'] = "#ifdef POINTSIZE\nuniform float pointSize;\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpVertexDeclaration'] = "#if defined(BUMP) || defined(PARALLAX)\n#if defined(TANGENT) && defined(NORMAL) \nvarying mat3 vTBN;\n#endif\n#endif\n";
BABYLON.Effect.IncludesShadersStore['clipPlaneVertexDeclaration'] = "#ifdef CLIPPLANE\nuniform vec4 vClipPlane;\nvarying float fClipDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogVertexDeclaration'] = "#ifdef FOG\nvarying vec3 vFogDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertexGlobalDeclaration'] = "#ifdef MORPHTARGETS\nuniform float morphTargetInfluences[NUM_MORPH_INFLUENCERS];\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertexDeclaration'] = "#ifdef MORPHTARGETS\nattribute vec3 position{X};\n#ifdef MORPHTARGETS_NORMAL\nattribute vec3 normal{X};\n#endif\n#ifdef MORPHTARGETS_TANGENT\nattribute vec3 tangent{X};\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthDeclaration'] = "#ifdef LOGARITHMICDEPTH\nuniform float logarithmicDepthConstant;\nvarying float vFragmentDepth;\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertex'] = "#ifdef MORPHTARGETS\npositionUpdated+=(position{X}-position)*morphTargetInfluences[{X}];\n#ifdef MORPHTARGETS_NORMAL\nnormalUpdated+=(normal{X}-normal)*morphTargetInfluences[{X}];\n#endif\n#ifdef MORPHTARGETS_TANGENT\ntangentUpdated.xyz+=(tangent{X}-tangent.xyz)*morphTargetInfluences[{X}];\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['instancesVertex'] = "#ifdef INSTANCES\nmat4 finalWorld=mat4(world0,world1,world2,world3);\n#else\nmat4 finalWorld=world;\n#endif";
BABYLON.Effect.IncludesShadersStore['bonesVertex'] = "#if NUM_BONE_INFLUENCERS>0\nmat4 influence;\ninfluence=mBones[int(matricesIndices[0])]*matricesWeights[0];\n#if NUM_BONE_INFLUENCERS>1\ninfluence+=mBones[int(matricesIndices[1])]*matricesWeights[1];\n#endif \n#if NUM_BONE_INFLUENCERS>2\ninfluence+=mBones[int(matricesIndices[2])]*matricesWeights[2];\n#endif \n#if NUM_BONE_INFLUENCERS>3\ninfluence+=mBones[int(matricesIndices[3])]*matricesWeights[3];\n#endif \n#if NUM_BONE_INFLUENCERS>4\ninfluence+=mBones[int(matricesIndicesExtra[0])]*matricesWeightsExtra[0];\n#endif \n#if NUM_BONE_INFLUENCERS>5\ninfluence+=mBones[int(matricesIndicesExtra[1])]*matricesWeightsExtra[1];\n#endif \n#if NUM_BONE_INFLUENCERS>6\ninfluence+=mBones[int(matricesIndicesExtra[2])]*matricesWeightsExtra[2];\n#endif \n#if NUM_BONE_INFLUENCERS>7\ninfluence+=mBones[int(matricesIndicesExtra[3])]*matricesWeightsExtra[3];\n#endif \nfinalWorld=finalWorld*influence;\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpVertex'] = "#if defined(BUMP) || defined(PARALLAX)\n#if defined(TANGENT) && defined(NORMAL)\nvec3 tbnNormal=normalize(normalUpdated);\nvec3 tbnTangent=normalize(tangentUpdated.xyz);\nvec3 tbnBitangent=cross(tbnNormal,tbnTangent)*tangentUpdated.w;\nvTBN=mat3(finalWorld)*mat3(tbnTangent,tbnBitangent,tbnNormal);\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneVertex'] = "#ifdef CLIPPLANE\nfClipDistance=dot(worldPos,vClipPlane);\n#endif";
BABYLON.Effect.IncludesShadersStore['fogVertex'] = "#ifdef FOG\nvFogDistance=(view*worldPos).xyz;\n#endif";
BABYLON.Effect.IncludesShadersStore['shadowsVertex'] = "#ifdef SHADOWS\n#if defined(SHADOW{X}) && !defined(SHADOWCUBE{X})\nvPositionFromLight{X}=lightMatrix{X}*worldPos;\nvDepthMetric{X}=((vPositionFromLight{X}.z+light{X}.depthValues.x)/(light{X}.depthValues.y));\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['pointCloudVertex'] = "#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthVertex'] = "#ifdef LOGARITHMICDEPTH\nvFragmentDepth=1.0+gl_Position.w;\ngl_Position.z=log2(max(0.000001,vFragmentDepth))*logarithmicDepthConstant;\n#endif";
BABYLON.Effect.IncludesShadersStore['helperFunctions'] = "const float PI=3.1415926535897932384626433832795;\nconst float LinearEncodePowerApprox=2.2;\nconst float GammaEncodePowerApprox=1.0/LinearEncodePowerApprox;\nconst vec3 LuminanceEncodeApprox=vec3(0.2126,0.7152,0.0722);\nmat3 transposeMat3(mat3 inMatrix) {\nvec3 i0=inMatrix[0];\nvec3 i1=inMatrix[1];\nvec3 i2=inMatrix[2];\nmat3 outMatrix=mat3(\nvec3(i0.x,i1.x,i2.x),\nvec3(i0.y,i1.y,i2.y),\nvec3(i0.z,i1.z,i2.z)\n);\nreturn outMatrix;\n}\n\nmat3 inverseMat3(mat3 inMatrix) {\nfloat a00=inMatrix[0][0],a01=inMatrix[0][1],a02=inMatrix[0][2];\nfloat a10=inMatrix[1][0],a11=inMatrix[1][1],a12=inMatrix[1][2];\nfloat a20=inMatrix[2][0],a21=inMatrix[2][1],a22=inMatrix[2][2];\nfloat b01=a22*a11-a12*a21;\nfloat b11=-a22*a10+a12*a20;\nfloat b21=a21*a10-a11*a20;\nfloat det=a00*b01+a01*b11+a02*b21;\nreturn mat3(b01,(-a22*a01+a02*a21),(a12*a01-a02*a11),\nb11,(a22*a00-a02*a20),(-a12*a00+a02*a10),\nb21,(-a21*a00+a01*a20),(a11*a00-a01*a10))/det;\n}\nfloat computeFallOff(float value,vec2 clipSpace,float frustumEdgeFalloff)\n{\nfloat mask=smoothstep(1.0-frustumEdgeFalloff,1.0,clamp(dot(clipSpace,clipSpace),0.,1.));\nreturn mix(value,1.0,mask);\n}\nvec3 applyEaseInOut(vec3 x){\nreturn x*x*(3.0-2.0*x);\n}\nvec3 toLinearSpace(vec3 color)\n{\nreturn pow(color,vec3(LinearEncodePowerApprox));\n}\nvec3 toGammaSpace(vec3 color)\n{\nreturn pow(color,vec3(GammaEncodePowerApprox));\n}\nfloat square(float value)\n{\nreturn value*value;\n}\nfloat getLuminance(vec3 color)\n{\nreturn clamp(dot(color,LuminanceEncodeApprox),0.,1.);\n}\n\nfloat getRand(vec2 seed) {\nreturn fract(sin(dot(seed.xy ,vec2(12.9898,78.233)))*43758.5453);\n}\nvec3 dither(vec2 seed,vec3 color) {\nfloat rand=getRand(seed);\ncolor+=mix(-0.5/255.0,0.5/255.0,rand);\ncolor=max(color,0.0);\nreturn color;\n}";
BABYLON.Effect.IncludesShadersStore['lightFragmentDeclaration'] = "#ifdef LIGHT{X}\nuniform vec4 vLightData{X};\nuniform vec4 vLightDiffuse{X};\n#ifdef SPECULARTERM\nuniform vec3 vLightSpecular{X};\n#else\nvec3 vLightSpecular{X}=vec3(0.);\n#endif\n#ifdef SHADOW{X}\n#if defined(SHADOWCUBE{X})\nuniform samplerCube shadowSampler{X};\n#else\nvarying vec4 vPositionFromLight{X};\nvarying float vDepthMetric{X};\nuniform sampler2D shadowSampler{X};\nuniform mat4 lightMatrix{X};\n#endif\nuniform vec4 shadowsInfo{X};\nuniform vec2 depthValues{X};\n#endif\n#ifdef SPOTLIGHT{X}\nuniform vec4 vLightDirection{X};\n#endif\n#ifdef HEMILIGHT{X}\nuniform vec3 vLightGround{X};\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['lightsFragmentFunctions'] = "\nstruct lightingInfo\n{\nvec3 diffuse;\n#ifdef SPECULARTERM\nvec3 specular;\n#endif\n#ifdef NDOTL\nfloat ndl;\n#endif\n};\nlightingInfo computeLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,float range,float glossiness) {\nlightingInfo result;\nvec3 lightVectorW;\nfloat attenuation=1.0;\nif (lightData.w == 0.)\n{\nvec3 direction=lightData.xyz-vPositionW;\nattenuation=max(0.,1.0-length(direction)/range);\nlightVectorW=normalize(direction);\n}\nelse\n{\nlightVectorW=normalize(-lightData.xyz);\n}\n\nfloat ndl=max(0.,dot(vNormal,lightVectorW));\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=ndl*diffuseColor*attenuation;\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightVectorW);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor*attenuation;\n#endif\nreturn result;\n}\nlightingInfo computeSpotLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec4 lightDirection,vec3 diffuseColor,vec3 specularColor,float range,float glossiness) {\nlightingInfo result;\nvec3 direction=lightData.xyz-vPositionW;\nvec3 lightVectorW=normalize(direction);\nfloat attenuation=max(0.,1.0-length(direction)/range);\n\nfloat cosAngle=max(0.,dot(lightDirection.xyz,-lightVectorW));\nif (cosAngle>=lightDirection.w)\n{\ncosAngle=max(0.,pow(cosAngle,lightData.w));\nattenuation*=cosAngle;\n\nfloat ndl=max(0.,dot(vNormal,lightVectorW));\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=ndl*diffuseColor*attenuation;\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightVectorW);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor*attenuation;\n#endif\nreturn result;\n}\nresult.diffuse=vec3(0.);\n#ifdef SPECULARTERM\nresult.specular=vec3(0.);\n#endif\n#ifdef NDOTL\nresult.ndl=0.;\n#endif\nreturn result;\n}\nlightingInfo computeHemisphericLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,vec3 groundColor,float glossiness) {\nlightingInfo result;\n\nfloat ndl=dot(vNormal,lightData.xyz)*0.5+0.5;\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=mix(groundColor,diffuseColor,ndl);\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightData.xyz);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor;\n#endif\nreturn result;\n}\n";
BABYLON.Effect.IncludesShadersStore['lightUboDeclaration'] = "#ifdef LIGHT{X}\nuniform Light{X}\n{\nvec4 vLightData;\nvec4 vLightDiffuse;\nvec3 vLightSpecular;\n#ifdef SPOTLIGHT{X}\nvec4 vLightDirection;\n#endif\n#ifdef HEMILIGHT{X}\nvec3 vLightGround;\n#endif\nvec4 shadowsInfo;\nvec2 depthValues;\n} light{X};\n#ifdef SHADOW{X}\n#if defined(SHADOWCUBE{X})\nuniform samplerCube shadowSampler{X};\n#else\nvarying vec4 vPositionFromLight{X};\nvarying float vDepthMetric{X};\nuniform sampler2D shadowSampler{X};\nuniform mat4 lightMatrix{X};\n#endif\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['defaultVertexDeclaration'] = "\nuniform mat4 viewProjection;\nuniform mat4 view;\n#ifdef DIFFUSE\nuniform mat4 diffuseMatrix;\nuniform vec2 vDiffuseInfos;\n#endif\n#ifdef AMBIENT\nuniform mat4 ambientMatrix;\nuniform vec2 vAmbientInfos;\n#endif\n#ifdef OPACITY\nuniform mat4 opacityMatrix;\nuniform vec2 vOpacityInfos;\n#endif\n#ifdef EMISSIVE\nuniform vec2 vEmissiveInfos;\nuniform mat4 emissiveMatrix;\n#endif\n#ifdef LIGHTMAP\nuniform vec2 vLightmapInfos;\nuniform mat4 lightmapMatrix;\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\nuniform vec2 vSpecularInfos;\nuniform mat4 specularMatrix;\n#endif\n#ifdef BUMP\nuniform vec3 vBumpInfos;\nuniform mat4 bumpMatrix;\n#endif\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n";
BABYLON.Effect.IncludesShadersStore['defaultFragmentDeclaration'] = "uniform vec4 vDiffuseColor;\n#ifdef SPECULARTERM\nuniform vec4 vSpecularColor;\n#endif\nuniform vec3 vEmissiveColor;\n\n#ifdef DIFFUSE\nuniform vec2 vDiffuseInfos;\n#endif\n#ifdef AMBIENT\nuniform vec2 vAmbientInfos;\n#endif\n#ifdef OPACITY \nuniform vec2 vOpacityInfos;\n#endif\n#ifdef EMISSIVE\nuniform vec2 vEmissiveInfos;\n#endif\n#ifdef LIGHTMAP\nuniform vec2 vLightmapInfos;\n#endif\n#ifdef BUMP\nuniform vec3 vBumpInfos;\nuniform vec2 vTangentSpaceParams;\n#endif\n#if defined(REFLECTIONMAP_SPHERICAL) || defined(REFLECTIONMAP_PROJECTION) || defined(REFRACTION)\nuniform mat4 view;\n#endif\n#ifdef REFRACTION\nuniform vec4 vRefractionInfos;\n#ifndef REFRACTIONMAP_3D\nuniform mat4 refractionMatrix;\n#endif\n#ifdef REFRACTIONFRESNEL\nuniform vec4 refractionLeftColor;\nuniform vec4 refractionRightColor;\n#endif\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\nuniform vec2 vSpecularInfos;\n#endif\n#ifdef DIFFUSEFRESNEL\nuniform vec4 diffuseLeftColor;\nuniform vec4 diffuseRightColor;\n#endif\n#ifdef OPACITYFRESNEL\nuniform vec4 opacityParts;\n#endif\n#ifdef EMISSIVEFRESNEL\nuniform vec4 emissiveLeftColor;\nuniform vec4 emissiveRightColor;\n#endif\n\n#ifdef REFLECTION\nuniform vec2 vReflectionInfos;\n#ifdef REFLECTIONMAP_SKYBOX\n#else\n#if defined(REFLECTIONMAP_PLANAR) || defined(REFLECTIONMAP_CUBIC) || defined(REFLECTIONMAP_PROJECTION)\nuniform mat4 reflectionMatrix;\n#endif\n#endif\n#ifdef REFLECTIONFRESNEL\nuniform vec4 reflectionLeftColor;\nuniform vec4 reflectionRightColor;\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['defaultUboDeclaration'] = "layout(std140,column_major) uniform;\nuniform Material\n{\nvec4 diffuseLeftColor;\nvec4 diffuseRightColor;\nvec4 opacityParts;\nvec4 reflectionLeftColor;\nvec4 reflectionRightColor;\nvec4 refractionLeftColor;\nvec4 refractionRightColor;\nvec4 emissiveLeftColor; \nvec4 emissiveRightColor;\nvec2 vDiffuseInfos;\nvec2 vAmbientInfos;\nvec2 vOpacityInfos;\nvec2 vReflectionInfos;\nvec2 vEmissiveInfos;\nvec2 vLightmapInfos;\nvec2 vSpecularInfos;\nvec3 vBumpInfos;\nmat4 diffuseMatrix;\nmat4 ambientMatrix;\nmat4 opacityMatrix;\nmat4 reflectionMatrix;\nmat4 emissiveMatrix;\nmat4 lightmapMatrix;\nmat4 specularMatrix;\nmat4 bumpMatrix; \nvec4 vTangentSpaceParams;\nmat4 refractionMatrix;\nvec4 vRefractionInfos;\nvec4 vSpecularColor;\nvec3 vEmissiveColor;\nvec4 vDiffuseColor;\nfloat pointSize; \n};\nuniform Scene {\nmat4 viewProjection;\nmat4 view;\n};";
BABYLON.Effect.IncludesShadersStore['shadowsFragmentFunctions'] = "#ifdef SHADOWS\n#ifndef SHADOWFLOAT\nfloat unpack(vec4 color)\n{\nconst vec4 bit_shift=vec4(1.0/(255.0*255.0*255.0),1.0/(255.0*255.0),1.0/255.0,1.0);\nreturn dot(color,bit_shift);\n}\n#endif\nfloat computeShadowCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\ndepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadow=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadow=textureCube(shadowSampler,directionToLight).x;\n#endif\nif (depth>shadow)\n{\nreturn darkness;\n}\nreturn 1.0;\n}\nfloat computeShadowWithPCFCube(vec3 lightPosition,samplerCube shadowSampler,float mapSize,float darkness,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\ndepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\nfloat visibility=1.;\nvec3 poissonDisk[4];\npoissonDisk[0]=vec3(-1.0,1.0,-1.0);\npoissonDisk[1]=vec3(1.0,-1.0,-1.0);\npoissonDisk[2]=vec3(-1.0,-1.0,-1.0);\npoissonDisk[3]=vec3(1.0,-1.0,1.0);\n\n#ifndef SHADOWFLOAT\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[0]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[1]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[2]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[3]*mapSize))<depth) visibility-=0.25;\n#else\nif (textureCube(shadowSampler,directionToLight+poissonDisk[0]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[1]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[2]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[3]*mapSize).x<depth) visibility-=0.25;\n#endif\nreturn min(1.0,visibility+darkness);\n}\nfloat computeShadowWithESMCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,float depthScale,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\nfloat shadowPixelDepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadowMapSample=textureCube(shadowSampler,directionToLight).x;\n#endif\nfloat esm=1.0-clamp(exp(min(87.,depthScale*shadowPixelDepth))*shadowMapSample,0.,1.-darkness); \nreturn esm;\n}\nfloat computeShadowWithCloseESMCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,float depthScale,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\nfloat shadowPixelDepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadowMapSample=textureCube(shadowSampler,directionToLight).x;\n#endif\nfloat esm=clamp(exp(min(87.,-depthScale*(shadowPixelDepth-shadowMapSample))),darkness,1.);\nreturn esm;\n}\nfloat computeShadow(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\n#ifndef SHADOWFLOAT\nfloat shadow=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadow=texture2D(shadowSampler,uv).x;\n#endif\nif (shadowPixelDepth>shadow)\n{\nreturn computeFallOff(darkness,clipSpace.xy,frustumEdgeFalloff);\n}\nreturn 1.;\n}\nfloat computeShadowWithPCF(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float mapSize,float darkness,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\nfloat visibility=1.;\nvec2 poissonDisk[4];\npoissonDisk[0]=vec2(-0.94201624,-0.39906216);\npoissonDisk[1]=vec2(0.94558609,-0.76890725);\npoissonDisk[2]=vec2(-0.094184101,-0.92938870);\npoissonDisk[3]=vec2(0.34495938,0.29387760);\n\n#ifndef SHADOWFLOAT\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[0]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[1]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[2]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[3]*mapSize))<shadowPixelDepth) visibility-=0.25;\n#else\nif (texture2D(shadowSampler,uv+poissonDisk[0]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[1]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[2]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[3]*mapSize).x<shadowPixelDepth) visibility-=0.25;\n#endif\nreturn computeFallOff(min(1.0,visibility+darkness),clipSpace.xy,frustumEdgeFalloff);\n}\nfloat computeShadowWithESM(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float depthScale,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadowMapSample=texture2D(shadowSampler,uv).x;\n#endif\nfloat esm=1.0-clamp(exp(min(87.,depthScale*shadowPixelDepth))*shadowMapSample,0.,1.-darkness);\nreturn computeFallOff(esm,clipSpace.xy,frustumEdgeFalloff);\n}\nfloat computeShadowWithCloseESM(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float depthScale,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0); \n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadowMapSample=texture2D(shadowSampler,uv).x;\n#endif\nfloat esm=clamp(exp(min(87.,-depthScale*(shadowPixelDepth-shadowMapSample))),darkness,1.);\nreturn computeFallOff(esm,clipSpace.xy,frustumEdgeFalloff);\n}\n#endif\n";
BABYLON.Effect.IncludesShadersStore['fresnelFunction'] = "#ifdef FRESNEL\nfloat computeFresnelTerm(vec3 viewDirection,vec3 worldNormal,float bias,float power)\n{\nfloat fresnelTerm=pow(bias+abs(dot(viewDirection,worldNormal)),power);\nreturn clamp(fresnelTerm,0.,1.);\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['reflectionFunction'] = "vec3 computeReflectionCoords(vec4 worldPos,vec3 worldNormal)\n{\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvec3 direction=normalize(vDirectionW);\nfloat t=clamp(direction.y*-0.5+0.5,0.,1.0);\nfloat s=atan(direction.z,direction.x)*RECIPROCAL_PI2+0.5;\n#ifdef REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED\nreturn vec3(1.0-s,t,0);\n#else\nreturn vec3(s,t,0);\n#endif\n#endif\n#ifdef REFLECTIONMAP_EQUIRECTANGULAR\nvec3 cameraToVertex=normalize(worldPos.xyz-vEyePosition.xyz);\nvec3 r=reflect(cameraToVertex,worldNormal);\nfloat t=clamp(r.y*-0.5+0.5,0.,1.0);\nfloat s=atan(r.z,r.x)*RECIPROCAL_PI2+0.5;\nreturn vec3(s,t,0);\n#endif\n#ifdef REFLECTIONMAP_SPHERICAL\nvec3 viewDir=normalize(vec3(view*worldPos));\nvec3 viewNormal=normalize(vec3(view*vec4(worldNormal,0.0)));\nvec3 r=reflect(viewDir,viewNormal);\nr.z=r.z-1.0;\nfloat m=2.0*length(r);\nreturn vec3(r.x/m+0.5,1.0-r.y/m-0.5,0);\n#endif\n#ifdef REFLECTIONMAP_PLANAR\nvec3 viewDir=worldPos.xyz-vEyePosition.xyz;\nvec3 coords=normalize(reflect(viewDir,worldNormal));\nreturn vec3(reflectionMatrix*vec4(coords,1));\n#endif\n#ifdef REFLECTIONMAP_CUBIC\nvec3 viewDir=worldPos.xyz-vEyePosition.xyz;\nvec3 coords=reflect(viewDir,worldNormal);\n#ifdef INVERTCUBICMAP\ncoords.y=1.0-coords.y;\n#endif\nreturn vec3(reflectionMatrix*vec4(coords,0));\n#endif\n#ifdef REFLECTIONMAP_PROJECTION\nreturn vec3(reflectionMatrix*(view*worldPos));\n#endif\n#ifdef REFLECTIONMAP_SKYBOX\nreturn vPositionUVW;\n#endif\n#ifdef REFLECTIONMAP_EXPLICIT\nreturn vec3(0,0,0);\n#endif\n}";
BABYLON.Effect.IncludesShadersStore['imageProcessingDeclaration'] = "#ifdef EXPOSURE\nuniform float exposureLinear;\n#endif\n#ifdef CONTRAST\nuniform float contrast;\n#endif\n#ifdef VIGNETTE\nuniform vec2 vInverseScreenSize;\nuniform vec4 vignetteSettings1;\nuniform vec4 vignetteSettings2;\n#endif\n#ifdef COLORCURVES\nuniform vec4 vCameraColorCurveNegative;\nuniform vec4 vCameraColorCurveNeutral;\nuniform vec4 vCameraColorCurvePositive;\n#endif\n#ifdef COLORGRADING\n#ifdef COLORGRADING3D\nuniform highp sampler3D txColorTransform;\n#else\nuniform sampler2D txColorTransform;\n#endif\nuniform vec4 colorTransformSettings;\n#endif";
BABYLON.Effect.IncludesShadersStore['imageProcessingFunctions'] = "#if defined(COLORGRADING) && !defined(COLORGRADING3D)\n\nvec3 sampleTexture3D(sampler2D colorTransform,vec3 color,vec2 sampler3dSetting)\n{\nfloat sliceSize=2.0*sampler3dSetting.x; \n#ifdef SAMPLER3DGREENDEPTH\nfloat sliceContinuous=(color.g-sampler3dSetting.x)*sampler3dSetting.y;\n#else\nfloat sliceContinuous=(color.b-sampler3dSetting.x)*sampler3dSetting.y;\n#endif\nfloat sliceInteger=floor(sliceContinuous);\n\n\nfloat sliceFraction=sliceContinuous-sliceInteger;\n#ifdef SAMPLER3DGREENDEPTH\nvec2 sliceUV=color.rb;\n#else\nvec2 sliceUV=color.rg;\n#endif\nsliceUV.x*=sliceSize;\nsliceUV.x+=sliceInteger*sliceSize;\nsliceUV=clamp(sliceUV,0.,1.);\nvec4 slice0Color=texture2D(colorTransform,sliceUV);\nsliceUV.x+=sliceSize;\nsliceUV=clamp(sliceUV,0.,1.);\nvec4 slice1Color=texture2D(colorTransform,sliceUV);\nvec3 result=mix(slice0Color.rgb,slice1Color.rgb,sliceFraction);\n#ifdef SAMPLER3DBGRMAP\ncolor.rgb=result.rgb;\n#else\ncolor.rgb=result.bgr;\n#endif\nreturn color;\n}\n#endif\nvec4 applyImageProcessing(vec4 result) {\n#ifdef EXPOSURE\nresult.rgb*=exposureLinear;\n#endif\n#ifdef VIGNETTE\n\nvec2 viewportXY=gl_FragCoord.xy*vInverseScreenSize;\nviewportXY=viewportXY*2.0-1.0;\nvec3 vignetteXY1=vec3(viewportXY*vignetteSettings1.xy+vignetteSettings1.zw,1.0);\nfloat vignetteTerm=dot(vignetteXY1,vignetteXY1);\nfloat vignette=pow(vignetteTerm,vignetteSettings2.w);\n\nvec3 vignetteColor=vignetteSettings2.rgb;\n#ifdef VIGNETTEBLENDMODEMULTIPLY\nvec3 vignetteColorMultiplier=mix(vignetteColor,vec3(1,1,1),vignette);\nresult.rgb*=vignetteColorMultiplier;\n#endif\n#ifdef VIGNETTEBLENDMODEOPAQUE\nresult.rgb=mix(vignetteColor,result.rgb,vignette);\n#endif\n#endif\n#ifdef TONEMAPPING\nconst float tonemappingCalibration=1.590579;\nresult.rgb=1.0-exp2(-tonemappingCalibration*result.rgb);\n#endif\n\nresult.rgb=toGammaSpace(result.rgb);\nresult.rgb=clamp(result.rgb,0.0,1.0);\n#ifdef CONTRAST\n\nvec3 resultHighContrast=applyEaseInOut(result.rgb);\nif (contrast<1.0) {\n\nresult.rgb=mix(vec3(0.5,0.5,0.5),result.rgb,contrast);\n} else {\n\nresult.rgb=mix(result.rgb,resultHighContrast,contrast-1.0);\n}\n#endif\n\n#ifdef COLORGRADING\nvec3 colorTransformInput=result.rgb*colorTransformSettings.xxx+colorTransformSettings.yyy;\n#ifdef COLORGRADING3D\nvec3 colorTransformOutput=texture(txColorTransform,colorTransformInput).rgb;\n#else\nvec3 colorTransformOutput=sampleTexture3D(txColorTransform,colorTransformInput,colorTransformSettings.yz).rgb;\n#endif\nresult.rgb=mix(result.rgb,colorTransformOutput,colorTransformSettings.www);\n#endif\n#ifdef COLORCURVES\n\nfloat luma=getLuminance(result.rgb);\nvec2 curveMix=clamp(vec2(luma*3.0-1.5,luma*-3.0+1.5),vec2(0.0),vec2(1.0));\nvec4 colorCurve=vCameraColorCurveNeutral+curveMix.x*vCameraColorCurvePositive-curveMix.y*vCameraColorCurveNegative;\nresult.rgb*=colorCurve.rgb;\nresult.rgb=mix(vec3(luma),result.rgb,colorCurve.a);\n#endif\nreturn result;\n}";
BABYLON.Effect.IncludesShadersStore['bumpFragmentFunctions'] = "#ifdef BUMP\n#if BUMPDIRECTUV == 1\n#define vBumpUV vMainUV1\n#elif BUMPDIRECTUV == 2\n#define vBumpUV vMainUV2\n#else\nvarying vec2 vBumpUV;\n#endif\nuniform sampler2D bumpSampler;\n#if defined(TANGENT) && defined(NORMAL) \nvarying mat3 vTBN;\n#endif\n\nmat3 cotangent_frame(vec3 normal,vec3 p,vec2 uv)\n{\n\nuv=gl_FrontFacing ? uv : -uv;\n\nvec3 dp1=dFdx(p);\nvec3 dp2=dFdy(p);\nvec2 duv1=dFdx(uv);\nvec2 duv2=dFdy(uv);\n\nvec3 dp2perp=cross(dp2,normal);\nvec3 dp1perp=cross(normal,dp1);\nvec3 tangent=dp2perp*duv1.x+dp1perp*duv2.x;\nvec3 bitangent=dp2perp*duv1.y+dp1perp*duv2.y;\n\ntangent*=vTangentSpaceParams.x;\nbitangent*=vTangentSpaceParams.y;\n\nfloat invmax=inversesqrt(max(dot(tangent,tangent),dot(bitangent,bitangent)));\nreturn mat3(tangent*invmax,bitangent*invmax,normal);\n}\nvec3 perturbNormal(mat3 cotangentFrame,vec2 uv)\n{\nvec3 map=texture2D(bumpSampler,uv).xyz;\nmap=map*2.0-1.0;\n#ifdef NORMALXYSCALE\nmap=normalize(map*vec3(vBumpInfos.y,vBumpInfos.y,1.0));\n#endif\nreturn normalize(cotangentFrame*map);\n}\n#ifdef PARALLAX\nconst float minSamples=4.;\nconst float maxSamples=15.;\nconst int iMaxSamples=15;\n\nvec2 parallaxOcclusion(vec3 vViewDirCoT,vec3 vNormalCoT,vec2 texCoord,float parallaxScale) {\nfloat parallaxLimit=length(vViewDirCoT.xy)/vViewDirCoT.z;\nparallaxLimit*=parallaxScale;\nvec2 vOffsetDir=normalize(vViewDirCoT.xy);\nvec2 vMaxOffset=vOffsetDir*parallaxLimit;\nfloat numSamples=maxSamples+(dot(vViewDirCoT,vNormalCoT)*(minSamples-maxSamples));\nfloat stepSize=1.0/numSamples;\n\nfloat currRayHeight=1.0;\nvec2 vCurrOffset=vec2(0,0);\nvec2 vLastOffset=vec2(0,0);\nfloat lastSampledHeight=1.0;\nfloat currSampledHeight=1.0;\nfor (int i=0; i<iMaxSamples; i++)\n{\ncurrSampledHeight=texture2D(bumpSampler,vBumpUV+vCurrOffset).w;\n\nif (currSampledHeight>currRayHeight)\n{\nfloat delta1=currSampledHeight-currRayHeight;\nfloat delta2=(currRayHeight+stepSize)-lastSampledHeight;\nfloat ratio=delta1/(delta1+delta2);\nvCurrOffset=(ratio)* vLastOffset+(1.0-ratio)*vCurrOffset;\n\nbreak;\n}\nelse\n{\ncurrRayHeight-=stepSize;\nvLastOffset=vCurrOffset;\nvCurrOffset+=stepSize*vMaxOffset;\nlastSampledHeight=currSampledHeight;\n}\n}\nreturn vCurrOffset;\n}\nvec2 parallaxOffset(vec3 viewDir,float heightScale)\n{\n\nfloat height=texture2D(bumpSampler,vBumpUV).w;\nvec2 texCoordOffset=heightScale*viewDir.xy*height;\nreturn -texCoordOffset;\n}\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneFragmentDeclaration'] = "#ifdef CLIPPLANE\nvarying float fClipDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogFragmentDeclaration'] = "#ifdef FOG\n#define FOGMODE_NONE 0.\n#define FOGMODE_EXP 1.\n#define FOGMODE_EXP2 2.\n#define FOGMODE_LINEAR 3.\n#define E 2.71828\nuniform vec4 vFogInfos;\nuniform vec3 vFogColor;\nvarying vec3 vFogDistance;\nfloat CalcFogFactor()\n{\nfloat fogCoeff=1.0;\nfloat fogStart=vFogInfos.y;\nfloat fogEnd=vFogInfos.z;\nfloat fogDensity=vFogInfos.w;\nfloat fogDistance=length(vFogDistance);\nif (FOGMODE_LINEAR == vFogInfos.x)\n{\nfogCoeff=(fogEnd-fogDistance)/(fogEnd-fogStart);\n}\nelse if (FOGMODE_EXP == vFogInfos.x)\n{\nfogCoeff=1.0/pow(E,fogDistance*fogDensity);\n}\nelse if (FOGMODE_EXP2 == vFogInfos.x)\n{\nfogCoeff=1.0/pow(E,fogDistance*fogDistance*fogDensity*fogDensity);\n}\nreturn clamp(fogCoeff,0.0,1.0);\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneFragment'] = "#ifdef CLIPPLANE\nif (fClipDistance>0.0)\n{\ndiscard;\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpFragment'] = "vec2 uvOffset=vec2(0.0,0.0);\n#if defined(BUMP) || defined(PARALLAX)\n#ifdef NORMALXYSCALE\nfloat normalScale=1.0;\n#else \nfloat normalScale=vBumpInfos.y;\n#endif\n#if defined(TANGENT) && defined(NORMAL)\nmat3 TBN=vTBN;\n#else\nmat3 TBN=cotangent_frame(normalW*normalScale,vPositionW,vBumpUV);\n#endif\n#endif\n#ifdef PARALLAX\nmat3 invTBN=transposeMat3(TBN);\n#ifdef PARALLAXOCCLUSION\nuvOffset=parallaxOcclusion(invTBN*-viewDirectionW,invTBN*normalW,vBumpUV,vBumpInfos.z);\n#else\nuvOffset=parallaxOffset(invTBN*viewDirectionW,vBumpInfos.z);\n#endif\n#endif\n#ifdef BUMP\nnormalW=perturbNormal(TBN,vBumpUV+uvOffset);\n#endif";
BABYLON.Effect.IncludesShadersStore['lightFragment'] = "#ifdef LIGHT{X}\n#if defined(SHADOWONLY) || (defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X}) && defined(LIGHTMAPNOSPECULAR{X}))\n\n#else\n#ifdef PBR\n#ifdef SPOTLIGHT{X}\ninfo=computeSpotLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDirection,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#ifdef HEMILIGHT{X}\ninfo=computeHemisphericLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightGround,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#if defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})\ninfo=computeLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#else\n#ifdef SPOTLIGHT{X}\ninfo=computeSpotLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDirection,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,glossiness);\n#endif\n#ifdef HEMILIGHT{X}\ninfo=computeHemisphericLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightGround,glossiness);\n#endif\n#if defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})\ninfo=computeLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,glossiness);\n#endif\n#endif\n#endif\n#ifdef SHADOW{X}\n#ifdef SHADOWCLOSEESM{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithCloseESMCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.depthValues);\n#else\nshadow=computeShadowWithCloseESM(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.shadowsInfo.w);\n#endif\n#else\n#ifdef SHADOWESM{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithESMCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.depthValues);\n#else\nshadow=computeShadowWithESM(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.shadowsInfo.w);\n#endif\n#else \n#ifdef SHADOWPCF{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithPCFCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.x,light{X}.depthValues);\n#else\nshadow=computeShadowWithPCF(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);\n#endif\n#else\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.depthValues);\n#else\nshadow=computeShadow(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);\n#endif\n#endif\n#endif\n#endif\n#ifdef SHADOWONLY\n#ifndef SHADOWINUSE\n#define SHADOWINUSE\n#endif\nglobalShadow+=shadow;\nshadowLightCount+=1.0;\n#endif\n#else\nshadow=1.;\n#endif\n#ifndef SHADOWONLY\n#ifdef CUSTOMUSERLIGHTING\ndiffuseBase+=computeCustomDiffuseLighting(info,diffuseBase,shadow);\n#ifdef SPECULARTERM\nspecularBase+=computeCustomSpecularLighting(info,specularBase,shadow);\n#endif\n#elif defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X})\ndiffuseBase+=lightmapColor*shadow;\n#ifdef SPECULARTERM\n#ifndef LIGHTMAPNOSPECULAR{X}\nspecularBase+=info.specular*shadow*lightmapColor;\n#endif\n#endif\n#else\ndiffuseBase+=info.diffuse*shadow;\n#ifdef SPECULARTERM\nspecularBase+=info.specular*shadow;\n#endif\n#endif\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthFragment'] = "#ifdef LOGARITHMICDEPTH\ngl_FragDepthEXT=log2(vFragmentDepth)*logarithmicDepthConstant*0.5;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogFragment'] = "#ifdef FOG\nfloat fog=CalcFogFactor();\ncolor.rgb=fog*color.rgb+(1.0-fog)*vFogColor;\n#endif";
var CSG = BABYLON.CSG;

export { CSG };