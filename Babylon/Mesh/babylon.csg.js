"use strict";

var BABYLON = BABYLON || {};

// Constructive Solid Geometry for BABYLON
// Based on https://github.com/evanw/csg.js/
(function () {

    // Unique ID when we import meshes from Babylon to CSG
    var currentCSGMeshId = 0;

    BABYLON.CSG = function () {
        this.polygons = [];
    };

    // Convert BABYLON.Mesh to BABYLON.CSG
    BABYLON.CSG.FromMesh = function (mesh) {
        var vertex, normal, uv, position,
            polygon,
            polygons = [],
            vertices;

        if (mesh instanceof BABYLON.Mesh) {
            mesh.computeWorldMatrix(true);
            this.matrix = mesh.getWorldMatrix();
            this.position = mesh.position.clone();
            this.rotation = mesh.rotation.clone();
            this.scaling = mesh.scaling.clone();
        } else {
            throw 'BABYLON.CSG: Wrong Mesh type, must be BABYLON.Mesh';
        }

        var indices = mesh.getIndices(),
            positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind),
            normals = mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind),
            uvs = mesh.getVerticesData(BABYLON.VertexBuffer.UVKind);

        var subMeshes = mesh.subMeshes;

        for (var sm = 0, sml = subMeshes.length; sm < sml; sm++) {
            for (var i = subMeshes[sm].indexStart, il = subMeshes[sm].indexCount + subMeshes[sm].indexStart; i < il; i += 3) {
                vertices = [];
                for (var j = 0; j < 3; j++) {
                    normal = new BABYLON.Vector3(normals[indices[i + j] * 3], normals[indices[i + j] * 3 + 1], normals[indices[i + j] * 3 + 2]);
                    uv = new BABYLON.Vector2(uvs[indices[i + j] * 2], uvs[indices[i + j] * 2 + 1]);
                    position = new BABYLON.Vector3(positions[indices[i + j] * 3], positions[indices[i + j] * 3 + 1], positions[indices[i + j] * 3 + 2]);
                    position = BABYLON.Vector3.TransformCoordinates(position, this.matrix);
                    normal = BABYLON.Vector3.TransformNormal(normal, this.matrix);

                    vertex = new BABYLON.CSG.Vertex(position, normal, uv);
                    vertices.push(vertex);
                }

                polygon = new BABYLON.CSG.Polygon(vertices, { subMeshId: sm, meshId: currentCSGMeshId, materialIndex: subMeshes[sm].materialIndex });

                // To handle the case of degenerated triangle
                // polygon.plane == null <=> the polygon does not represent 1 single plane <=> the triangle is degenerated
                if (polygon.plane)
                    polygons.push(polygon);
            }
        }

        var csg = BABYLON.CSG.fromPolygons(polygons);
        csg.copyTransformAttributes(this);
        currentCSGMeshId++;

        return csg;
    };


    // Construct a BABYLON.CSG solid from a list of `BABYLON.CSG.Polygon` instances.
    BABYLON.CSG.fromPolygons = function (polygons) {
        var csg = new BABYLON.CSG();
        csg.polygons = polygons;
        return csg;
    };

    BABYLON.CSG.prototype = {
        clone: function () {
            var csg = new BABYLON.CSG();
            csg.polygons = this.polygons.map(function (p) { return p.clone(); });
            csg.copyTransformAttributes(this);
            return csg;
        },

        toPolygons: function () {
            return this.polygons;
        },

        union: function (csg) {
            var a = new BABYLON.CSG.Node(this.clone().polygons);
            var b = new BABYLON.CSG.Node(csg.clone().polygons);
            a.clipTo(b);
            b.clipTo(a);
            b.invert();
            b.clipTo(a);
            b.invert();
            a.build(b.allPolygons());
            return BABYLON.CSG.fromPolygons(a.allPolygons()).copyTransformAttributes(this);
        },

        subtract: function (csg) {
            var a = new BABYLON.CSG.Node(this.clone().polygons);
            var b = new BABYLON.CSG.Node(csg.clone().polygons);
            a.invert();
            a.clipTo(b);
            b.clipTo(a);
            b.invert();
            b.clipTo(a);
            b.invert();
            a.build(b.allPolygons());
            a.invert();
            return BABYLON.CSG.fromPolygons(a.allPolygons()).copyTransformAttributes(this);
        },

        intersect: function (csg) {
            var a = new BABYLON.CSG.Node(this.clone().polygons);
            var b = new BABYLON.CSG.Node(csg.clone().polygons);
            a.invert();
            b.clipTo(a);
            b.invert();
            a.clipTo(b);
            b.clipTo(a);
            a.build(b.allPolygons());
            a.invert();
            return BABYLON.CSG.fromPolygons(a.allPolygons()).copyTransformAttributes(this);
        },

        // Return a new BABYLON.CSG solid with solid and empty space switched. This solid is
        // not modified.
        inverse: function () {
            var csg = this.clone();
            csg.polygons.map(function (p) { p.flip(); });
            return csg;
        }
    };

    // This is used to keep meshes transformations so they can be restored
    // when we build back a Babylon Mesh
    // NB : All CSG operations are performed in world coordinates
    BABYLON.CSG.prototype.copyTransformAttributes = function(object) {
        this.matrix = object.matrix;
        this.position = object.position;
        this.rotation = object.rotation;
        this.scaling = object.scaling;

        return this;
    };

    // Build Raw mesh from CSG
    // Coordinates here are in world space
    BABYLON.CSG.prototype.buildMeshGeometry = function (name, scene, keepSubMeshes) {
        var matrix = this.matrix.clone();
        matrix.invert();

        var mesh = new BABYLON.Mesh(name, scene),
            vertices = [],
            indices = [],
            normals = [],
            uvs = [],
            vertex, normal, uv,
            polygons = this.polygons,
            polygonIndices = [0, 0, 0],
            polygon,
            vertice_dict = {},
            vertex_idx,
            currentIndex = 0,
            subMesh_dict = {},
            subMesh_obj;

        if (keepSubMeshes) {
            // Sort Polygons, since subMeshes are indices range
            polygons.sort(function (a, b) {
                if (a.shared.meshId === b.shared.meshId) {
                    return a.shared.subMeshId - b.shared.subMeshId;
                } else {
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
                    vertex = polygon.vertices[polygonIndices[k]].pos;
                    normal = polygon.vertices[polygonIndices[k]].normal;
                    uv = polygon.vertices[polygonIndices[k]].uv;
                    vertex = new BABYLON.Vector3(vertex.x, vertex.y, vertex.z);
                    normal = new BABYLON.Vector3(normal.x, normal.y, normal.z);
                    vertex = BABYLON.Vector3.TransformCoordinates(vertex, matrix);
                    normal = BABYLON.Vector3.TransformNormal(normal, matrix);

                    vertex_idx = vertice_dict[vertex.x + ',' + vertex.y + ',' + vertex.z];

                    // Check if 2 points can be merged
                    if (!(typeof vertex_idx !== 'undefined' &&
                         normals[vertex_idx * 3] === normal.x &&
                         normals[vertex_idx * 3 + 1] === normal.y &&
                         normals[vertex_idx * 3 + 2] === normal.z &&
                         uvs[vertex_idx * 2] === uv.x &&
                         uvs[vertex_idx * 2 + 1] === uv.y)) {
                        vertices.push(vertex.x, vertex.y, vertex.z);
                        uvs.push(uv.x, uv.y);
                        normals.push(normal.x, normal.y, normal.z);
                        vertex_idx = vertice_dict[vertex.x + ',' + vertex.y + ',' + vertex.z] = (vertices.length / 3) - 1;
                    }

                    indices.push(vertex_idx);

                    subMesh_obj.indexStart = Math.min(currentIndex, subMesh_obj.indexStart);
                    subMesh_obj.indexEnd = Math.max(currentIndex, subMesh_obj.indexEnd);
                    currentIndex++;
                }

            }

        }

        mesh.setVerticesData(vertices, BABYLON.VertexBuffer.PositionKind);
        mesh.setVerticesData(normals, BABYLON.VertexBuffer.NormalKind);
        mesh.setVerticesData(uvs, BABYLON.VertexBuffer.UVKind);
        mesh.setIndices(indices);

        if (keepSubMeshes) {
            // We offset the materialIndex by the previous number of materials in the CSG mixed meshes
            var materialIndexOffset = 0,
                materialMaxIndex;

            mesh.subMeshes.length = 0;

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
    BABYLON.CSG.prototype.toMesh = function (name, material, scene, keepSubMeshes) {
        var mesh = this.buildMeshGeometry(name, scene, keepSubMeshes);

        mesh.material = material;

        mesh.position.copyFrom(this.position);
        mesh.rotation.copyFrom(this.rotation);
        mesh.scaling.copyFrom(this.scaling);
        mesh.computeWorldMatrix(true);

        return mesh;
    };

    // # class Vector

    // Represents a 3D vector.
    // 
    // Example usage:
    // 
    //         new BABYLON.CSG.Vector(1, 2, 3);
    //         new BABYLON.CSG.Vector([1, 2, 3]);
    //         new BABYLON.CSG.Vector({ x: 1, y: 2, z: 3 });

    BABYLON.CSG.Vector = function (x, y, z) {
        if (arguments.length == 3) {
            this.x = x;
            this.y = y;
            this.z = z;
        } else if ('x' in x) {
            this.x = x.x;
            this.y = x.y;
            this.z = x.z;
        } else {
            this.x = x[0];
            this.y = x[1];
            this.z = x[2];
        }
    };

    BABYLON.CSG.Vector.prototype = {
        clone: function () {
            return new BABYLON.CSG.Vector(this.x, this.y, this.z);
        },

        negated: function () {
            return new BABYLON.CSG.Vector(-this.x, -this.y, -this.z);
        },

        plus: function (a) {
            return new BABYLON.CSG.Vector(this.x + a.x, this.y + a.y, this.z + a.z);
        },

        minus: function (a) {
            return new BABYLON.CSG.Vector(this.x - a.x, this.y - a.y, this.z - a.z);
        },

        times: function (a) {
            return new BABYLON.CSG.Vector(this.x * a, this.y * a, this.z * a);
        },

        dividedBy: function (a) {
            return new BABYLON.CSG.Vector(this.x / a, this.y / a, this.z / a);
        },

        dot: function (a) {
            return this.x * a.x + this.y * a.y + this.z * a.z;
        },

        lerp: function (a, t) {
            return this.plus(a.minus(this).times(t));
        },

        length: function () {
            return Math.sqrt(this.dot(this));
        },

        lengthSq: function () {
            return this.dot(this);
        },

        unit: function () {
            return this.dividedBy(this.length());
        },

        cross: function (a) {
            return new BABYLON.CSG.Vector(
                this.y * a.z - this.z * a.y,
                this.z * a.x - this.x * a.z,
                this.x * a.y - this.y * a.x
            );
        }
    };

    // # class Vertex

    // Represents a vertex of a polygon. Use your own vertex class instead of this
    // one to provide additional features like texture coordinates and vertex
    // colors. Custom vertex classes need to provide a `pos` property and `clone()`,
    // `flip()`, and `interpolate()` methods that behave analogous to the ones
    // defined by `BABYLON.CSG.Vertex`. This class provides `normal` so convenience
    // functions like `BABYLON.CSG.sphere()` can return a smooth vertex normal, but `normal`
    // is not used anywhere else. 
    // Same goes for uv, it allows to keep the original vertex uv coordinates of the 2 meshes

    BABYLON.CSG.Vertex = function (pos, normal, uv) {
        this.pos = new BABYLON.CSG.Vector(pos);
        this.normal = new BABYLON.CSG.Vector(normal);
        this.uv = new BABYLON.CSG.Vector(uv.x, uv.y, 0);
    };

    BABYLON.CSG.Vertex.prototype = {
        clone: function () {
            return new BABYLON.CSG.Vertex(this.pos.clone(), this.normal.clone(), this.uv.clone());
        },

        // Invert all orientation-specific data (e.g. vertex normal). Called when the
        // orientation of a polygon is flipped.
        flip: function () {
            this.normal = this.normal.negated();
        },

        // Create a new vertex between this vertex and `other` by linearly
        // interpolating all properties using a parameter of `t`. Subclasses should
        // override this to interpolate additional properties.
        interpolate: function (other, t) {
            return new BABYLON.CSG.Vertex(
                this.pos.lerp(other.pos, t),
                this.normal.lerp(other.normal, t),
                this.uv.lerp(other.uv, t)
            );
        }
    };

    // # class Plane

    // Represents a plane in 3D space.

    BABYLON.CSG.Plane = function (normal, w) {
        this.normal = normal;
        this.w = w;
    };

    // `BABYLON.CSG.Plane.EPSILON` is the tolerance used by `splitPolygon()` to decide if a
    // point is on the plane.
    BABYLON.CSG.Plane.EPSILON = 1e-5;

    BABYLON.CSG.Plane.fromPoints = function (a, b, c) {
        var v0 = c.minus(a);
        var v1 = b.minus(a);

        if (v0.lengthSq() === 0 || v1.lengthSq() === 0) {
            return null;
        }

        var n = c.minus(a).cross(b.minus(a)).unit();
        return new BABYLON.CSG.Plane(n, n.dot(a));
    };

    BABYLON.CSG.Plane.prototype = {
        clone: function () {
            return new BABYLON.CSG.Plane(this.normal.clone(), this.w);
        },

        flip: function () {
            this.normal = this.normal.negated();
            this.w = -this.w;
        },

        // Split `polygon` by this plane if needed, then put the polygon or polygon
        // fragments in the appropriate lists. Coplanar polygons go into either
        // `coplanarFront` or `coplanarBack` depending on their orientation with
        // respect to this plane. Polygons in front or in back of this plane go into
        // either `front` or `back`.
        splitPolygon: function (polygon, coplanarFront, coplanarBack, front, back) {
            var COPLANAR = 0;
            var FRONT = 1;
            var BACK = 2;
            var SPANNING = 3;

            // Classify each point as well as the entire polygon into one of the above
            // four classes.
            var polygonType = 0;
            var types = [];
            for (var i = 0; i < polygon.vertices.length; i++) {
                var t = this.normal.dot(polygon.vertices[i].pos) - this.w;
                var type = (t < -BABYLON.CSG.Plane.EPSILON) ? BACK : (t > BABYLON.CSG.Plane.EPSILON) ? FRONT : COPLANAR;
                polygonType |= type;
                types.push(type);
            }

            // Put the polygon in the correct list, splitting it when necessary.
            switch (polygonType) {
                case COPLANAR:
                    (this.normal.dot(polygon.plane.normal) > 0 ? coplanarFront : coplanarBack).push(polygon);
                    break;
                case FRONT:
                    front.push(polygon);
                    break;
                case BACK:
                    back.push(polygon);
                    break;
                case SPANNING:
                    var f = [], b = [];
                    for (var i = 0; i < polygon.vertices.length; i++) {
                        var j = (i + 1) % polygon.vertices.length;
                        var ti = types[i], tj = types[j];
                        var vi = polygon.vertices[i], vj = polygon.vertices[j];
                        if (ti != BACK) f.push(vi);
                        if (ti != FRONT) b.push(ti != BACK ? vi.clone() : vi);
                        if ((ti | tj) == SPANNING) {
                            var t = (this.w - this.normal.dot(vi.pos)) / this.normal.dot(vj.pos.minus(vi.pos));
                            var v = vi.interpolate(vj, t);
                            f.push(v);
                            b.push(v.clone());
                        }
                    }
                    if (f.length >= 3) front.push(new BABYLON.CSG.Polygon(f, polygon.shared));
                    if (b.length >= 3) back.push(new BABYLON.CSG.Polygon(b, polygon.shared));
                    break;
            }
        }
    };

    // # class Polygon

    // Represents a convex polygon. The vertices used to initialize a polygon must
    // be coplanar and form a convex loop. They do not have to be `BABYLON.CSG.Vertex`
    // instances but they must behave similarly (duck typing can be used for
    // customization).
    // 
    // Each convex polygon has a `shared` property, which is shared between all
    // polygons that are clones of each other or were split from the same polygon.
    // This can be used to define per-polygon properties (such as surface color).

    BABYLON.CSG.Polygon = function (vertices, shared) {
        this.vertices = vertices;
        this.shared = shared;
        this.plane = BABYLON.CSG.Plane.fromPoints(vertices[0].pos, vertices[1].pos, vertices[2].pos);

    };

    BABYLON.CSG.Polygon.prototype = {
        clone: function () {
            var vertices = this.vertices.map(function (v) { return v.clone(); });
            return new BABYLON.CSG.Polygon(vertices, this.shared);
        },

        flip: function () {
            this.vertices.reverse().map(function (v) { v.flip(); });
            this.plane.flip();
        }
    };

    // # class Node

    // Holds a node in a BSP tree. A BSP tree is built from a collection of polygons
    // by picking a polygon to split along. That polygon (and all other coplanar
    // polygons) are added directly to that node and the other polygons are added to
    // the front and/or back subtrees. This is not a leafy BSP tree since there is
    // no distinction between internal and leaf nodes.

    BABYLON.CSG.Node = function (polygons) {
        this.plane = null;
        this.front = null;
        this.back = null;
        this.polygons = [];
        if (polygons) this.build(polygons);
    };

    BABYLON.CSG.Node.prototype = {
        clone: function () {
            var node = new BABYLON.CSG.Node();
            node.plane = this.plane && this.plane.clone();
            node.front = this.front && this.front.clone();
            node.back = this.back && this.back.clone();
            node.polygons = this.polygons.map(function (p) { return p.clone(); });
            return node;
        },

        // Convert solid space to empty space and empty space to solid space.
        invert: function () {
            for (var i = 0; i < this.polygons.length; i++) {
                this.polygons[i].flip();
            }
            this.plane.flip();
            if (this.front) {
                this.front.invert();
            }
            if (this.back) {
                this.back.invert();
            }
            var temp = this.front;
            this.front = this.back;
            this.back = temp;
        },

        // Recursively remove all polygons in `polygons` that are inside this BSP
        // tree.
        clipPolygons: function (polygons) {
            if (!this.plane) return polygons.slice();
            var front = [], back = [];
            for (var i = 0; i < polygons.length; i++) {
                this.plane.splitPolygon(polygons[i], front, back, front, back);
            }
            if (this.front) {
                front = this.front.clipPolygons(front);
            }
            if (this.back) {
                back = this.back.clipPolygons(back);
            } else {
                back = [];
            }
            return front.concat(back);
        },

        // Remove all polygons in this BSP tree that are inside the other BSP tree
        // `bsp`.
        clipTo: function (bsp) {
            this.polygons = bsp.clipPolygons(this.polygons);
            if (this.front) this.front.clipTo(bsp);
            if (this.back) this.back.clipTo(bsp);
        },

        // Return a list of all polygons in this BSP tree.
        allPolygons: function () {
            var polygons = this.polygons.slice();
            if (this.front) polygons = polygons.concat(this.front.allPolygons());
            if (this.back) polygons = polygons.concat(this.back.allPolygons());
            return polygons;
        },

        // Build a BSP tree out of `polygons`. When called on an existing tree, the
        // new polygons are filtered down to the bottom of the tree and become new
        // nodes there. Each set of polygons is partitioned using the first polygon
        // (no heuristic is used to pick a good split).
        build: function (polygons) {
            if (!polygons.length) return;
            if (!this.plane) this.plane = polygons[0].plane.clone();
            var front = [], back = [];
            for (var i = 0; i < polygons.length; i++) {
                this.plane.splitPolygon(polygons[i], this.polygons, this.polygons, front, back);
            }
            if (front.length) {
                if (!this.front) this.front = new BABYLON.CSG.Node();
                this.front.build(front);
            }
            if (back.length) {
                if (!this.back) this.back = new BABYLON.CSG.Node();
                this.back.build(back);
            }
        }
    };
})();