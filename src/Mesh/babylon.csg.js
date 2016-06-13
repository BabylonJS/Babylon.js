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
    var Vertex = (function () {
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
    var Plane = (function () {
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
    var Polygon = (function () {
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
    var Node = (function () {
        function Node(polygons) {
            this.plane = null;
            this.front = null;
            this.back = null;
            this.polygons = [];
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
            var front = [], back = [];
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
            var front = [], back = [];
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
    var CSG = (function () {
        function CSG() {
            this.polygons = new Array();
        }
        // Convert BABYLON.Mesh to BABYLON.CSG
        CSG.FromMesh = function (mesh) {
            var vertex, normal, uv, position, polygon, polygons = new Array(), vertices;
            var matrix, meshPosition, meshRotation, meshRotationQuaternion, meshScaling;
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
        CSG.prototype.toPolygons = function () {
            return this.polygons;
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
            mesh.setIndices(indices);
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