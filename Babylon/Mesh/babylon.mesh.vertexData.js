"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.VertexData = function () {
    };

    // Methods
    BABYLON.VertexData.prototype.applyToMesh = function(mesh, updatable) {
        if (this.positions) {
            mesh.setVerticesData(this.positions, BABYLON.VertexBuffer.PositionKind, updatable);
        }

        if (this.normals) {
            mesh.setVerticesData(this.normals, BABYLON.VertexBuffer.NormalKind, updatable);
        }

        if (this.uvs) {
            mesh.setVerticesData(this.uvs, BABYLON.VertexBuffer.UVKind, updatable);
        }

        if (this.indices) {
            mesh.setIndices(this.indices);
        }
    };

    BABYLON.VertexData.prototype.transform = function (matrix) {
        var transformed = BABYLON.Vector3.Zero();

        if (this.positions) {
            var position = BABYLON.Vector3.Zero();

            for (var index = 0; index < this.positions.length; index += 3) {
                BABYLON.Vector3.FromArrayToRef(this.positions, index, position);

                BABYLON.Vector3.TransformCoordinatesToRef(position, matrix, transformed);
                this.positions[index] = transformed.x;
                this.positions[index + 1] = transformed.y;
                this.positions[index + 2] = transformed.z;
            }
        }

        if (this.normals) {
            var normal = BABYLON.Vector3.Zero();

            for (index = 0; index < this.normals.length; index += 3) {
                BABYLON.Vector3.FromArrayToRef(this.normals, index, normal);

                BABYLON.Vector3.TransformNormalToRef(normal, matrix, transformed);
                this.normals[index] = transformed.x;
                this.normals[index + 1] = transformed.y;
                this.normals[index + 2] = transformed.z;
            }
        }
    };

    BABYLON.VertexData.prototype.merge = function (other) {
        if (other.indices) {
            if (!this.indices) {
                this.indices = [];
            }

            var offset = this.positions ? this.positions.length / 3 : 0;
            for (var index = 0; index < other.indices.length; index++) {
                this.indices.push(other.indices[index] + offset);
            }
        }

        if (other.positions) {
            if (!this.positions) {
                this.positions = [];
            }

            for (index = 0; index < other.positions.length; index++) {
                this.positions.push(other.positions[index]);
            }
        }

        if (other.normals) {
            if (!this.normals) {
                this.normals = [];
            }
            for (index = 0; index < other.normals.length; index++) {
                this.normals.push(other.normals[index]);
            }
        }

        if (other.uvs) {
            if (!this.uvs) {
                this.uvs = [];
            }
            for (index = 0; index < other.uvs.length; index++) {
                this.uvs.push(other.uvs[index]);
            }
        }
    };

    // Statics
    BABYLON.VertexData.CreateBox = function(size) {
        var normalsSource = [
            new BABYLON.Vector3(0, 0, 1),
            new BABYLON.Vector3(0, 0, -1),
            new BABYLON.Vector3(1, 0, 0),
            new BABYLON.Vector3(-1, 0, 0),
            new BABYLON.Vector3(0, 1, 0),
            new BABYLON.Vector3(0, -1, 0)
        ];

        var indices = [];
        var positions = [];
        var normals = [];
        var uvs = [];

        // Create each face in turn.
        for (var index = 0; index < normalsSource.length; index++) {
            var normal = normalsSource[index];

            // Get two vectors perpendicular to the face normal and to each other.
            var side1 = new BABYLON.Vector3(normal.y, normal.z, normal.x);
            var side2 = BABYLON.Vector3.Cross(normal, side1);

            // Six indices (two triangles) per face.
            var verticesLength = positions.length / 3;
            indices.push(verticesLength);
            indices.push(verticesLength + 1);
            indices.push(verticesLength + 2);

            indices.push(verticesLength);
            indices.push(verticesLength + 2);
            indices.push(verticesLength + 3);

            // Four vertices per face.
            var vertex = normal.subtract(side1).subtract(side2).scale(size / 2);
            positions.push(vertex.x, vertex.y, vertex.z);
            normals.push(normal.x, normal.y, normal.z);
            uvs.push(1.0, 1.0);

            vertex = normal.subtract(side1).add(side2).scale(size / 2);
            positions.push(vertex.x, vertex.y, vertex.z);
            normals.push(normal.x, normal.y, normal.z);
            uvs.push(0.0, 1.0);

            vertex = normal.add(side1).add(side2).scale(size / 2);
            positions.push(vertex.x, vertex.y, vertex.z);
            normals.push(normal.x, normal.y, normal.z);
            uvs.push(0.0, 0.0);

            vertex = normal.add(side1).subtract(side2).scale(size / 2);
            positions.push(vertex.x, vertex.y, vertex.z);
            normals.push(normal.x, normal.y, normal.z);
            uvs.push(1.0, 0.0);
        }

        // Result
        var vertexData = new BABYLON.VertexData();

        vertexData.indices = indices;
        vertexData.positions = positions;
        vertexData.normals = normals;
        vertexData.uvs = uvs;

        return vertexData;
    };

    BABYLON.VertexData.CreateSphere = function (segments, diameter) {
        var radius = diameter / 2;

        var totalZRotationSteps = 2 + segments;
        var totalYRotationSteps = 2 * totalZRotationSteps;

        var indices = [];
        var positions = [];
        var normals = [];
        var uvs = [];

        for (var zRotationStep = 0; zRotationStep <= totalZRotationSteps; zRotationStep++) {
            var normalizedZ = zRotationStep / totalZRotationSteps;
            var angleZ = (normalizedZ * Math.PI);

            for (var yRotationStep = 0; yRotationStep <= totalYRotationSteps; yRotationStep++) {
                var normalizedY = yRotationStep / totalYRotationSteps;

                var angleY = normalizedY * Math.PI * 2;

                var rotationZ = BABYLON.Matrix.RotationZ(-angleZ);
                var rotationY = BABYLON.Matrix.RotationY(angleY);
                var afterRotZ = BABYLON.Vector3.TransformCoordinates(BABYLON.Vector3.Up(), rotationZ);
                var complete = BABYLON.Vector3.TransformCoordinates(afterRotZ, rotationY);

                var vertex = complete.scale(radius);
                var normal = BABYLON.Vector3.Normalize(vertex);

                positions.push(vertex.x, vertex.y, vertex.z);
                normals.push(normal.x, normal.y, normal.z);
                uvs.push(normalizedZ, normalizedY);
            }

            if (zRotationStep > 0) {
                var verticesCount = positions.length / 3;
                for (var firstIndex = verticesCount - 2 * (totalYRotationSteps + 1) ; (firstIndex + totalYRotationSteps + 2) < verticesCount; firstIndex++) {
                    indices.push((firstIndex));
                    indices.push((firstIndex + 1));
                    indices.push(firstIndex + totalYRotationSteps + 1);

                    indices.push((firstIndex + totalYRotationSteps + 1));
                    indices.push((firstIndex + 1));
                    indices.push((firstIndex + totalYRotationSteps + 2));
                }
            }
        }

        // Result
        var vertexData = new BABYLON.VertexData();

        vertexData.indices = indices;
        vertexData.positions = positions;
        vertexData.normals = normals;
        vertexData.uvs = uvs;

        return vertexData;
    };

    BABYLON.VertexData.CreateCylinder = function (height, diameterTop, diameterBottom, tessellation) {
        var radiusTop = diameterTop / 2;
        var radiusBottom = diameterBottom / 2;
        var indices = [];
        var positions = [];
        var normals = [];
        var uvs = [];

        var getCircleVector = function (i) {
            var angle = (i * 2.0 * Math.PI / tessellation);
            var dx = Math.sin(angle);
            var dz = Math.cos(angle);

            return new BABYLON.Vector3(dx, 0, dz);
        };

        var createCylinderCap = function (isTop) {
            var radius = isTop ? radiusTop : radiusBottom;

            if (radius == 0) {
                return;
            }

            // Create cap indices.
            for (var i = 0; i < tessellation - 2; i++) {
                var i1 = (i + 1) % tessellation;
                var i2 = (i + 2) % tessellation;

                if (!isTop) {
                    var tmp = i1;
                    var i1 = i2;
                    i2 = tmp;
                }

                var vbase = positions.length / 3;
                indices.push(vbase);
                indices.push(vbase + i1);
                indices.push(vbase + i2);
            }


            // Which end of the cylinder is this?
            var normal = new BABYLON.Vector3(0, -1, 0);
            var textureScale = new BABYLON.Vector2(-0.5, -0.5);

            if (!isTop) {
                normal = normal.scale(-1);
                textureScale.x = -textureScale.x;
            }

            // Create cap vertices.
            for (var i = 0; i < tessellation; i++) {
                var circleVector = getCircleVector(i);
                var position = circleVector.scale(radius).add(normal.scale(height));
                var textureCoordinate = new BABYLON.Vector2(circleVector.x * textureScale.x + 0.5, circleVector.z * textureScale.y + 0.5);

                positions.push(position.x, position.y, position.z);
                normals.push(normal.x, normal.y, normal.z);
                uvs.push(textureCoordinate.x, textureCoordinate.y);
            }
        };

        height /= 2;

        var topOffset = new BABYLON.Vector3(0, 1, 0).scale(height);

        var stride = tessellation + 1;

        // Create a ring of triangles around the outside of the cylinder.
        for (var i = 0; i <= tessellation; i++) {
            var normal = getCircleVector(i);
            var sideOffsetBottom = normal.scale(radiusBottom);
            var sideOffsetTop = normal.scale(radiusTop);
            var textureCoordinate = new BABYLON.Vector2(i / tessellation, 0);

            var position = sideOffsetBottom.add(topOffset);
            positions.push(position.x, position.y, position.z);
            normals.push(normal.x, normal.y, normal.z);
            uvs.push(textureCoordinate.x, textureCoordinate.y);

            position = sideOffsetTop.subtract(topOffset);
            textureCoordinate.y += 1;
            positions.push(position.x, position.y, position.z);
            normals.push(normal.x, normal.y, normal.z);
            uvs.push(textureCoordinate.x, textureCoordinate.y);

            indices.push(i * 2);
            indices.push((i * 2 + 2) % (stride * 2));
            indices.push(i * 2 + 1);

            indices.push(i * 2 + 1);
            indices.push((i * 2 + 2) % (stride * 2));
            indices.push((i * 2 + 3) % (stride * 2));
        }

        // Create flat triangle fan caps to seal the top and bottom.
        createCylinderCap(true);
        createCylinderCap(false);

        // Result
        var vertexData = new BABYLON.VertexData();

        vertexData.indices = indices;
        vertexData.positions = positions;
        vertexData.normals = normals;
        vertexData.uvs = uvs;

        return vertexData;
    };

    BABYLON.VertexData.CreateTorus = function (diameter, thickness, tessellation) {
        var indices = [];
        var positions = [];
        var normals = [];
        var uvs = [];

        var stride = tessellation + 1;

        for (var i = 0; i <= tessellation; i++) {
            var u = i / tessellation;

            var outerAngle = i * Math.PI * 2.0 / tessellation - Math.PI / 2.0;

            var transform = BABYLON.Matrix.Translation(diameter / 2.0, 0, 0).multiply(BABYLON.Matrix.RotationY(outerAngle));

            for (var j = 0; j <= tessellation; j++) {
                var v = 1 - j / tessellation;

                var innerAngle = j * Math.PI * 2.0 / tessellation + Math.PI;
                var dx = Math.cos(innerAngle);
                var dy = Math.sin(innerAngle);

                // Create a vertex.
                var normal = new BABYLON.Vector3(dx, dy, 0);
                var position = normal.scale(thickness / 2);
                var textureCoordinate = new BABYLON.Vector2(u, v);

                position = BABYLON.Vector3.TransformCoordinates(position, transform);
                normal = BABYLON.Vector3.TransformNormal(normal, transform);

                positions.push(position.x, position.y, position.z);
                normals.push(normal.x, normal.y, normal.z);
                uvs.push(textureCoordinate.x, textureCoordinate.y);

                // And create indices for two triangles.
                var nextI = (i + 1) % stride;
                var nextJ = (j + 1) % stride;

                indices.push(i * stride + j);
                indices.push(i * stride + nextJ);
                indices.push(nextI * stride + j);

                indices.push(i * stride + nextJ);
                indices.push(nextI * stride + nextJ);
                indices.push(nextI * stride + j);
            }
        }

        // Result
        var vertexData = new BABYLON.VertexData();

        vertexData.indices = indices;
        vertexData.positions = positions;
        vertexData.normals = normals;
        vertexData.uvs = uvs;

        return vertexData;
    };

    BABYLON.VertexData.CreateGround = function (width, height, subdivisions) {
        var indices = [];
        var positions = [];
        var normals = [];
        var uvs = [];
        var row, col;

        for (row = 0; row <= subdivisions; row++) {
            for (col = 0; col <= subdivisions; col++) {
                var position = new BABYLON.Vector3((col * width) / subdivisions - (width / 2.0), 0, ((subdivisions - row) * height) / subdivisions - (height / 2.0));
                var normal = new BABYLON.Vector3(0, 1.0, 0);

                positions.push(position.x, position.y, position.z);
                normals.push(normal.x, normal.y, normal.z);
                uvs.push(col / subdivisions, 1.0 - row / subdivisions);
            }
        }

        for (row = 0; row < subdivisions; row++) {
            for (col = 0; col < subdivisions; col++) {
                indices.push(col + 1 + (row + 1) * (subdivisions + 1));
                indices.push(col + 1 + row * (subdivisions + 1));
                indices.push(col + row * (subdivisions + 1));

                indices.push(col + (row + 1) * (subdivisions + 1));
                indices.push(col + 1 + (row + 1) * (subdivisions + 1));
                indices.push(col + row * (subdivisions + 1));
            }
        }

        // Result
        var vertexData = new BABYLON.VertexData();

        vertexData.indices = indices;
        vertexData.positions = positions;
        vertexData.normals = normals;
        vertexData.uvs = uvs;

        return vertexData;
    };

    BABYLON.VertexData.CreatePlane = function (size) {
        var indices = [];
        var positions = [];
        var normals = [];
        var uvs = [];

        // Vertices
        var halfSize = size / 2.0;
        positions.push(-halfSize, -halfSize, 0);
        normals.push(0, 0, -1.0);
        uvs.push(0.0, 0.0);

        positions.push(halfSize, -halfSize, 0);
        normals.push(0, 0, -1.0);
        uvs.push(1.0, 0.0);

        positions.push(halfSize, halfSize, 0);
        normals.push(0, 0, -1.0);
        uvs.push(1.0, 1.0);

        positions.push(-halfSize, halfSize, 0);
        normals.push(0, 0, -1.0);
        uvs.push(0.0, 1.0);

        // Indices
        indices.push(0);
        indices.push(1);
        indices.push(2);

        indices.push(0);
        indices.push(2);
        indices.push(3);

        // Result
        var vertexData = new BABYLON.VertexData();

        vertexData.indices = indices;
        vertexData.positions = positions;
        vertexData.normals = normals;
        vertexData.uvs = uvs;

        return vertexData;
    };
})();