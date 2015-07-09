var BABYLON;
(function (BABYLON) {
    var VertexData = (function () {
        function VertexData() {
        }
        VertexData.prototype.set = function (data, kind) {
            switch (kind) {
                case BABYLON.VertexBuffer.PositionKind:
                    this.positions = data;
                    break;
                case BABYLON.VertexBuffer.NormalKind:
                    this.normals = data;
                    break;
                case BABYLON.VertexBuffer.UVKind:
                    this.uvs = data;
                    break;
                case BABYLON.VertexBuffer.UV2Kind:
                    this.uvs2 = data;
                    break;
                case BABYLON.VertexBuffer.UV3Kind:
                    this.uvs3 = data;
                    break;
                case BABYLON.VertexBuffer.UV4Kind:
                    this.uvs4 = data;
                    break;
                case BABYLON.VertexBuffer.UV5Kind:
                    this.uvs5 = data;
                    break;
                case BABYLON.VertexBuffer.UV6Kind:
                    this.uvs6 = data;
                    break;
                case BABYLON.VertexBuffer.ColorKind:
                    this.colors = data;
                    break;
                case BABYLON.VertexBuffer.MatricesIndicesKind:
                    this.matricesIndices = data;
                    break;
                case BABYLON.VertexBuffer.MatricesWeightsKind:
                    this.matricesWeights = data;
                    break;
            }
        };
        VertexData.prototype.applyToMesh = function (mesh, updatable) {
            this._applyTo(mesh, updatable);
        };
        VertexData.prototype.applyToGeometry = function (geometry, updatable) {
            this._applyTo(geometry, updatable);
        };
        VertexData.prototype.updateMesh = function (mesh, updateExtends, makeItUnique) {
            this._update(mesh);
        };
        VertexData.prototype.updateGeometry = function (geometry, updateExtends, makeItUnique) {
            this._update(geometry);
        };
        VertexData.prototype._applyTo = function (meshOrGeometry, updatable) {
            if (this.positions) {
                meshOrGeometry.setVerticesData(BABYLON.VertexBuffer.PositionKind, this.positions, updatable);
            }
            if (this.normals) {
                meshOrGeometry.setVerticesData(BABYLON.VertexBuffer.NormalKind, this.normals, updatable);
            }
            if (this.uvs) {
                meshOrGeometry.setVerticesData(BABYLON.VertexBuffer.UVKind, this.uvs, updatable);
            }
            if (this.uvs2) {
                meshOrGeometry.setVerticesData(BABYLON.VertexBuffer.UV2Kind, this.uvs2, updatable);
            }
            if (this.uvs3) {
                meshOrGeometry.setVerticesData(BABYLON.VertexBuffer.UV3Kind, this.uvs3, updatable);
            }
            if (this.uvs4) {
                meshOrGeometry.setVerticesData(BABYLON.VertexBuffer.UV4Kind, this.uvs4, updatable);
            }
            if (this.uvs5) {
                meshOrGeometry.setVerticesData(BABYLON.VertexBuffer.UV5Kind, this.uvs5, updatable);
            }
            if (this.uvs6) {
                meshOrGeometry.setVerticesData(BABYLON.VertexBuffer.UV6Kind, this.uvs6, updatable);
            }
            if (this.colors) {
                meshOrGeometry.setVerticesData(BABYLON.VertexBuffer.ColorKind, this.colors, updatable);
            }
            if (this.matricesIndices) {
                meshOrGeometry.setVerticesData(BABYLON.VertexBuffer.MatricesIndicesKind, this.matricesIndices, updatable);
            }
            if (this.matricesWeights) {
                meshOrGeometry.setVerticesData(BABYLON.VertexBuffer.MatricesWeightsKind, this.matricesWeights, updatable);
            }
            if (this.indices) {
                meshOrGeometry.setIndices(this.indices);
            }
        };
        VertexData.prototype._update = function (meshOrGeometry, updateExtends, makeItUnique) {
            if (this.positions) {
                meshOrGeometry.updateVerticesData(BABYLON.VertexBuffer.PositionKind, this.positions, updateExtends, makeItUnique);
            }
            if (this.normals) {
                meshOrGeometry.updateVerticesData(BABYLON.VertexBuffer.NormalKind, this.normals, updateExtends, makeItUnique);
            }
            if (this.uvs) {
                meshOrGeometry.updateVerticesData(BABYLON.VertexBuffer.UVKind, this.uvs, updateExtends, makeItUnique);
            }
            if (this.uvs2) {
                meshOrGeometry.updateVerticesData(BABYLON.VertexBuffer.UV2Kind, this.uvs2, updateExtends, makeItUnique);
            }
            if (this.uvs3) {
                meshOrGeometry.updateVerticesData(BABYLON.VertexBuffer.UV3Kind, this.uvs3, updateExtends, makeItUnique);
            }
            if (this.uvs4) {
                meshOrGeometry.updateVerticesData(BABYLON.VertexBuffer.UV4Kind, this.uvs4, updateExtends, makeItUnique);
            }
            if (this.uvs5) {
                meshOrGeometry.updateVerticesData(BABYLON.VertexBuffer.UV5Kind, this.uvs5, updateExtends, makeItUnique);
            }
            if (this.uvs6) {
                meshOrGeometry.updateVerticesData(BABYLON.VertexBuffer.UV6Kind, this.uvs6, updateExtends, makeItUnique);
            }
            if (this.colors) {
                meshOrGeometry.updateVerticesData(BABYLON.VertexBuffer.ColorKind, this.colors, updateExtends, makeItUnique);
            }
            if (this.matricesIndices) {
                meshOrGeometry.updateVerticesData(BABYLON.VertexBuffer.MatricesIndicesKind, this.matricesIndices, updateExtends, makeItUnique);
            }
            if (this.matricesWeights) {
                meshOrGeometry.updateVerticesData(BABYLON.VertexBuffer.MatricesWeightsKind, this.matricesWeights, updateExtends, makeItUnique);
            }
            if (this.indices) {
                meshOrGeometry.setIndices(this.indices);
            }
        };
        VertexData.prototype.transform = function (matrix) {
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
        VertexData.prototype.merge = function (other) {
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
            if (other.uvs2) {
                if (!this.uvs2) {
                    this.uvs2 = [];
                }
                for (index = 0; index < other.uvs2.length; index++) {
                    this.uvs2.push(other.uvs2[index]);
                }
            }
            if (other.uvs3) {
                if (!this.uvs3) {
                    this.uvs3 = [];
                }
                for (index = 0; index < other.uvs3.length; index++) {
                    this.uvs3.push(other.uvs3[index]);
                }
            }
            if (other.uvs4) {
                if (!this.uvs4) {
                    this.uvs4 = [];
                }
                for (index = 0; index < other.uvs4.length; index++) {
                    this.uvs4.push(other.uvs4[index]);
                }
            }
            if (other.uvs5) {
                if (!this.uvs5) {
                    this.uvs5 = [];
                }
                for (index = 0; index < other.uvs5.length; index++) {
                    this.uvs5.push(other.uvs5[index]);
                }
            }
            if (other.uvs6) {
                if (!this.uvs6) {
                    this.uvs6 = [];
                }
                for (index = 0; index < other.uvs6.length; index++) {
                    this.uvs6.push(other.uvs6[index]);
                }
            }
            if (other.matricesIndices) {
                if (!this.matricesIndices) {
                    this.matricesIndices = [];
                }
                for (index = 0; index < other.matricesIndices.length; index++) {
                    this.matricesIndices.push(other.matricesIndices[index]);
                }
            }
            if (other.matricesWeights) {
                if (!this.matricesWeights) {
                    this.matricesWeights = [];
                }
                for (index = 0; index < other.matricesWeights.length; index++) {
                    this.matricesWeights.push(other.matricesWeights[index]);
                }
            }
            if (other.colors) {
                if (!this.colors) {
                    this.colors = [];
                }
                for (index = 0; index < other.colors.length; index++) {
                    this.colors.push(other.colors[index]);
                }
            }
        };
        // Statics
        VertexData.ExtractFromMesh = function (mesh, copyWhenShared) {
            return VertexData._ExtractFrom(mesh, copyWhenShared);
        };
        VertexData.ExtractFromGeometry = function (geometry, copyWhenShared) {
            return VertexData._ExtractFrom(geometry, copyWhenShared);
        };
        VertexData._ExtractFrom = function (meshOrGeometry, copyWhenShared) {
            var result = new VertexData();
            if (meshOrGeometry.isVerticesDataPresent(BABYLON.VertexBuffer.PositionKind)) {
                result.positions = meshOrGeometry.getVerticesData(BABYLON.VertexBuffer.PositionKind, copyWhenShared);
            }
            if (meshOrGeometry.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)) {
                result.normals = meshOrGeometry.getVerticesData(BABYLON.VertexBuffer.NormalKind, copyWhenShared);
            }
            if (meshOrGeometry.isVerticesDataPresent(BABYLON.VertexBuffer.UVKind)) {
                result.uvs = meshOrGeometry.getVerticesData(BABYLON.VertexBuffer.UVKind, copyWhenShared);
            }
            if (meshOrGeometry.isVerticesDataPresent(BABYLON.VertexBuffer.UV2Kind)) {
                result.uvs2 = meshOrGeometry.getVerticesData(BABYLON.VertexBuffer.UV2Kind, copyWhenShared);
            }
            if (meshOrGeometry.isVerticesDataPresent(BABYLON.VertexBuffer.UV3Kind)) {
                result.uvs3 = meshOrGeometry.getVerticesData(BABYLON.VertexBuffer.UV3Kind, copyWhenShared);
            }
            if (meshOrGeometry.isVerticesDataPresent(BABYLON.VertexBuffer.UV4Kind)) {
                result.uvs4 = meshOrGeometry.getVerticesData(BABYLON.VertexBuffer.UV4Kind, copyWhenShared);
            }
            if (meshOrGeometry.isVerticesDataPresent(BABYLON.VertexBuffer.UV5Kind)) {
                result.uvs5 = meshOrGeometry.getVerticesData(BABYLON.VertexBuffer.UV5Kind, copyWhenShared);
            }
            if (meshOrGeometry.isVerticesDataPresent(BABYLON.VertexBuffer.UV6Kind)) {
                result.uvs6 = meshOrGeometry.getVerticesData(BABYLON.VertexBuffer.UV6Kind, copyWhenShared);
            }
            if (meshOrGeometry.isVerticesDataPresent(BABYLON.VertexBuffer.ColorKind)) {
                result.colors = meshOrGeometry.getVerticesData(BABYLON.VertexBuffer.ColorKind, copyWhenShared);
            }
            if (meshOrGeometry.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesIndicesKind)) {
                result.matricesIndices = meshOrGeometry.getVerticesData(BABYLON.VertexBuffer.MatricesIndicesKind, copyWhenShared);
            }
            if (meshOrGeometry.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesWeightsKind)) {
                result.matricesWeights = meshOrGeometry.getVerticesData(BABYLON.VertexBuffer.MatricesWeightsKind, copyWhenShared);
            }
            result.indices = meshOrGeometry.getIndices(copyWhenShared);
            return result;
        };
        VertexData.CreateRibbon = function (pathArray, closeArray, closePath, offset, sideOrientation) {
            if (sideOrientation === void 0) { sideOrientation = BABYLON.Mesh.DEFAULTSIDE; }
            closeArray = closeArray || false;
            closePath = closePath || false;
            var defaultOffset = Math.floor(pathArray[0].length / 2);
            offset = offset || defaultOffset;
            offset = offset > defaultOffset ? defaultOffset : Math.floor(offset); // offset max allowed : defaultOffset
            var positions = [];
            var indices = [];
            var normals = [];
            var uvs = [];
            var us = []; // us[path_id] = [uDist1, uDist2, uDist3 ... ] distances between points on path path_id
            var vs = []; // vs[i] = [vDist1, vDist2, vDist3, ... ] distances between points i of consecutives paths from pathArray
            var uTotalDistance = []; // uTotalDistance[p] : total distance of path p
            var vTotalDistance = []; //  vTotalDistance[i] : total distance between points i of first and last path from pathArray
            var minlg; // minimal length among all paths from pathArray
            var lg = []; // array of path lengths : nb of vertex per path
            var idx = []; // array of path indexes : index of each path (first vertex) in positions array
            var p; // path iterator
            var i; // point iterator
            var j; // point iterator
            // if single path in pathArray
            if (pathArray.length < 2) {
                var ar1 = [];
                var ar2 = [];
                for (i = 0; i < pathArray[0].length - offset; i++) {
                    ar1.push(pathArray[0][i]);
                    ar2.push(pathArray[0][i + offset]);
                }
                pathArray = [ar1, ar2];
            }
            // positions and horizontal distances (u)
            var idc = 0;
            minlg = pathArray[0].length;
            for (p = 0; p < pathArray.length; p++) {
                uTotalDistance[p] = 0;
                us[p] = [0];
                var path = pathArray[p];
                var l = path.length;
                minlg = (minlg < l) ? minlg : l;
                lg[p] = l;
                idx[p] = idc;
                j = 0;
                while (j < l) {
                    positions.push(path[j].x, path[j].y, path[j].z);
                    if (j > 0) {
                        var vectlg = path[j].subtract(path[j - 1]).length();
                        var dist = vectlg + uTotalDistance[p];
                        us[p].push(dist);
                        uTotalDistance[p] = dist;
                    }
                    j++;
                }
                if (closePath) {
                    vectlg = path[0].subtract(path[j - 1]).length();
                    dist = vectlg + uTotalDistance[p];
                    uTotalDistance[p] = dist;
                }
                idc += l;
            }
            // vertical distances (v)
            for (i = 0; i < minlg; i++) {
                vTotalDistance[i] = 0;
                vs[i] = [0];
                var path1;
                var path2;
                for (p = 0; p < pathArray.length - 1; p++) {
                    path1 = pathArray[p];
                    path2 = pathArray[p + 1];
                    vectlg = path2[i].subtract(path1[i]).length();
                    dist = vectlg + vTotalDistance[i];
                    vs[i].push(dist);
                    vTotalDistance[i] = dist;
                }
                if (closeArray) {
                    path1 = pathArray[p];
                    path2 = pathArray[0];
                    vectlg = path2[i].subtract(path1[i]).length();
                    dist = vectlg + vTotalDistance[i];
                    vTotalDistance[i] = dist;
                }
            }
            // uvs
            var u;
            var v;
            for (p = 0; p < pathArray.length; p++) {
                for (i = 0; i < minlg; i++) {
                    u = us[p][i] / uTotalDistance[p];
                    v = vs[i][p] / vTotalDistance[i];
                    uvs.push(u, v);
                }
            }
            // indices
            p = 0; // path index
            var pi = 0; // positions array index
            var l1 = lg[p] - 1; // path1 length
            var l2 = lg[p + 1] - 1; // path2 length
            var min = (l1 < l2) ? l1 : l2; // current path stop index
            var shft = idx[1] - idx[0]; // shift 
            var path1nb = closeArray ? lg.length : lg.length - 1; // number of path1 to iterate	
            var t1; // two consecutive triangles, so 4 points : point1
            var t2; // point2
            var t3; // point3
            var t4; // point4
            while (pi <= min && p < path1nb) {
                // draw two triangles between path1 (p1) and path2 (p2) : (p1.pi, p2.pi, p1.pi+1) and (p2.pi+1, p1.pi+1, p2.pi) clockwise
                t1 = pi;
                t2 = pi + shft;
                t3 = pi + 1;
                t4 = pi + shft + 1;
                indices.push(pi, pi + shft, pi + 1);
                indices.push(pi + shft + 1, pi + 1, pi + shft);
                pi += 1;
                if (pi === min) {
                    if (closePath) {
                        indices.push(pi, pi + shft, idx[p]);
                        indices.push(idx[p] + shft, idx[p], pi + shft);
                        t3 = idx[p];
                        t4 = idx[p] + shft;
                    }
                    p++;
                    if (p === lg.length - 1) {
                        shft = idx[0] - idx[p];
                        l1 = lg[p] - 1;
                        l2 = lg[0] - 1;
                    }
                    else {
                        shft = idx[p + 1] - idx[p];
                        l1 = lg[p] - 1;
                        l2 = lg[p + 1] - 1;
                    }
                    pi = idx[p];
                    min = (l1 < l2) ? l1 + pi : l2 + pi;
                }
            }
            // normals
            VertexData.ComputeNormals(positions, indices, normals);
            // sides
            VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs);
            // Result
            var vertexData = new VertexData();
            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;
            return vertexData;
        };
        VertexData.CreateBox = function (size, sideOrientation) {
            if (sideOrientation === void 0) { sideOrientation = BABYLON.Mesh.DEFAULTSIDE; }
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
            size = size || 1;
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
            // sides
            VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs);
            // Result
            var vertexData = new VertexData();
            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;
            return vertexData;
        };
        VertexData.CreateSphere = function (segments, diameter, sideOrientation) {
            if (sideOrientation === void 0) { sideOrientation = BABYLON.Mesh.DEFAULTSIDE; }
            segments = segments || 32;
            diameter = diameter || 1;
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
                    for (var firstIndex = verticesCount - 2 * (totalYRotationSteps + 1); (firstIndex + totalYRotationSteps + 2) < verticesCount; firstIndex++) {
                        indices.push((firstIndex));
                        indices.push((firstIndex + 1));
                        indices.push(firstIndex + totalYRotationSteps + 1);
                        indices.push((firstIndex + totalYRotationSteps + 1));
                        indices.push((firstIndex + 1));
                        indices.push((firstIndex + totalYRotationSteps + 2));
                    }
                }
            }
            // Sides
            VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs);
            // Result
            var vertexData = new VertexData();
            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;
            return vertexData;
        };
        VertexData.CreateCylinder = function (height, diameterTop, diameterBottom, tessellation, subdivisions, sideOrientation) {
            if (subdivisions === void 0) { subdivisions = 1; }
            if (sideOrientation === void 0) { sideOrientation = BABYLON.Mesh.DEFAULTSIDE; }
            var radiusTop = diameterTop / 2;
            var radiusBottom = diameterBottom / 2;
            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];
            height = height || 1;
            diameterTop = diameterTop || 0.5;
            diameterBottom = diameterBottom || 1;
            tessellation = tessellation || 16;
            subdivisions = subdivisions || 1;
            subdivisions = (subdivisions < 1) ? 1 : subdivisions;
            var getCircleVector = function (i) {
                var angle = (i * 2.0 * Math.PI / tessellation);
                var dx = Math.cos(angle);
                var dz = Math.sin(angle);
                return new BABYLON.Vector3(dx, 0, dz);
            };
            var createCylinderCap = function (isTop) {
                var radius = isTop ? radiusTop : radiusBottom;
                if (radius === 0) {
                    return;
                }
                var vbase = positions.length / 3;
                var offset = new BABYLON.Vector3(0, height / 2, 0);
                var textureScale = new BABYLON.Vector2(0.5, 0.5);
                if (!isTop) {
                    offset.scaleInPlace(-1);
                    textureScale.x = -textureScale.x;
                }
                // Positions, normals & uvs
                for (var i = 0; i < tessellation; i++) {
                    var circleVector = getCircleVector(i);
                    var position = circleVector.scale(radius).add(offset);
                    var textureCoordinate = new BABYLON.Vector2(circleVector.x * textureScale.x + 0.5, circleVector.z * textureScale.y + 0.5);
                    positions.push(position.x, position.y, position.z);
                    uvs.push(textureCoordinate.x, textureCoordinate.y);
                }
                // Indices
                for (i = 0; i < tessellation - 2; i++) {
                    if (!isTop) {
                        indices.push(vbase);
                        indices.push(vbase + (i + 2) % tessellation);
                        indices.push(vbase + (i + 1) % tessellation);
                    }
                    else {
                        indices.push(vbase);
                        indices.push(vbase + (i + 1) % tessellation);
                        indices.push(vbase + (i + 2) % tessellation);
                    }
                }
            };
            var base = new BABYLON.Vector3(0, -1, 0).scale(height / 2);
            var offset = new BABYLON.Vector3(0, 1, 0).scale(height / subdivisions);
            var stride = tessellation + 1;
            // Positions, normals & uvs
            for (var i = 0; i <= tessellation; i++) {
                var circleVector = getCircleVector(i);
                var textureCoordinate = new BABYLON.Vector2(i / tessellation, 0);
                var position, radius = radiusBottom;
                for (var s = 0; s <= subdivisions; s++) {
                    // Update variables
                    position = circleVector.scale(radius);
                    position.addInPlace(base.add(offset.scale(s)));
                    textureCoordinate.y += 1 / subdivisions;
                    radius += (radiusTop - radiusBottom) / subdivisions;
                    // Push in arrays
                    positions.push(position.x, position.y, position.z);
                    uvs.push(textureCoordinate.x, textureCoordinate.y);
                }
            }
            subdivisions += 1;
            // Indices
            for (s = 0; s < subdivisions - 1; s++) {
                for (i = 0; i <= tessellation; i++) {
                    indices.push(i * subdivisions + s);
                    indices.push((i * subdivisions + (s + subdivisions)) % (stride * subdivisions));
                    indices.push(i * subdivisions + (s + 1));
                    indices.push(i * subdivisions + (s + 1));
                    indices.push((i * subdivisions + (s + subdivisions)) % (stride * subdivisions));
                    indices.push((i * subdivisions + (s + subdivisions + 1)) % (stride * subdivisions));
                }
            }
            // Create flat triangle fan caps to seal the top and bottom.
            createCylinderCap(true);
            createCylinderCap(false);
            // Normals
            VertexData.ComputeNormals(positions, indices, normals);
            // Sides
            VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs);
            // Result
            var vertexData = new VertexData();
            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;
            return vertexData;
        };
        VertexData.CreateTorus = function (diameter, thickness, tessellation, sideOrientation) {
            if (sideOrientation === void 0) { sideOrientation = BABYLON.Mesh.DEFAULTSIDE; }
            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];
            diameter = diameter || 1;
            thickness = thickness || 0.5;
            tessellation = tessellation || 16;
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
            // Sides
            VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs);
            // Result
            var vertexData = new VertexData();
            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;
            return vertexData;
        };
        VertexData.CreateLines = function (points) {
            var indices = [];
            var positions = [];
            for (var index = 0; index < points.length; index++) {
                positions.push(points[index].x, points[index].y, points[index].z);
                if (index > 0) {
                    indices.push(index - 1);
                    indices.push(index);
                }
            }
            // Result
            var vertexData = new VertexData();
            vertexData.indices = indices;
            vertexData.positions = positions;
            return vertexData;
        };
        VertexData.CreateDashedLines = function (points, dashSize, gapSize, dashNb) {
            dashSize = dashSize || 3;
            gapSize = gapSize || 1;
            dashNb = dashNb || 200;
            var positions = new Array();
            var indices = new Array();
            var curvect = BABYLON.Vector3.Zero();
            var lg = 0;
            var nb = 0;
            var shft = 0;
            var dashshft = 0;
            var curshft = 0;
            var idx = 0;
            var i = 0;
            for (i = 0; i < points.length - 1; i++) {
                points[i + 1].subtractToRef(points[i], curvect);
                lg += curvect.length();
            }
            shft = lg / dashNb;
            dashshft = dashSize * shft / (dashSize + gapSize);
            for (i = 0; i < points.length - 1; i++) {
                points[i + 1].subtractToRef(points[i], curvect);
                nb = Math.floor(curvect.length() / shft);
                curvect.normalize();
                for (var j = 0; j < nb; j++) {
                    curshft = shft * j;
                    positions.push(points[i].x + curshft * curvect.x, points[i].y + curshft * curvect.y, points[i].z + curshft * curvect.z);
                    positions.push(points[i].x + (curshft + dashshft) * curvect.x, points[i].y + (curshft + dashshft) * curvect.y, points[i].z + (curshft + dashshft) * curvect.z);
                    indices.push(idx, idx + 1);
                    idx += 2;
                }
            }
            // Result
            var vertexData = new VertexData();
            vertexData.positions = positions;
            vertexData.indices = indices;
            return vertexData;
        };
        VertexData.CreateGround = function (width, height, subdivisions) {
            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];
            var row, col;
            width = width || 1;
            height = height || 1;
            subdivisions = subdivisions || 1;
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
            var vertexData = new VertexData();
            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;
            return vertexData;
        };
        VertexData.CreateTiledGround = function (xmin, zmin, xmax, zmax, subdivisions, precision) {
            if (subdivisions === void 0) { subdivisions = { w: 1, h: 1 }; }
            if (precision === void 0) { precision = { w: 1, h: 1 }; }
            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];
            var row, col, tileRow, tileCol;
            subdivisions.h = (subdivisions.w < 1) ? 1 : subdivisions.h;
            subdivisions.w = (subdivisions.w < 1) ? 1 : subdivisions.w;
            precision.w = (precision.w < 1) ? 1 : precision.w;
            precision.h = (precision.h < 1) ? 1 : precision.h;
            var tileSize = {
                'w': (xmax - xmin) / subdivisions.w,
                'h': (zmax - zmin) / subdivisions.h
            };
            function applyTile(xTileMin, zTileMin, xTileMax, zTileMax) {
                // Indices
                var base = positions.length / 3;
                var rowLength = precision.w + 1;
                for (row = 0; row < precision.h; row++) {
                    for (col = 0; col < precision.w; col++) {
                        var square = [
                            base + col + row * rowLength,
                            base + (col + 1) + row * rowLength,
                            base + (col + 1) + (row + 1) * rowLength,
                            base + col + (row + 1) * rowLength
                        ];
                        indices.push(square[1]);
                        indices.push(square[2]);
                        indices.push(square[3]);
                        indices.push(square[0]);
                        indices.push(square[1]);
                        indices.push(square[3]);
                    }
                }
                // Position, normals and uvs
                var position = BABYLON.Vector3.Zero();
                var normal = new BABYLON.Vector3(0, 1.0, 0);
                for (row = 0; row <= precision.h; row++) {
                    position.z = (row * (zTileMax - zTileMin)) / precision.h + zTileMin;
                    for (col = 0; col <= precision.w; col++) {
                        position.x = (col * (xTileMax - xTileMin)) / precision.w + xTileMin;
                        position.y = 0;
                        positions.push(position.x, position.y, position.z);
                        normals.push(normal.x, normal.y, normal.z);
                        uvs.push(col / precision.w, row / precision.h);
                    }
                }
            }
            for (tileRow = 0; tileRow < subdivisions.h; tileRow++) {
                for (tileCol = 0; tileCol < subdivisions.w; tileCol++) {
                    applyTile(xmin + tileCol * tileSize.w, zmin + tileRow * tileSize.h, xmin + (tileCol + 1) * tileSize.w, zmin + (tileRow + 1) * tileSize.h);
                }
            }
            // Result
            var vertexData = new VertexData();
            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;
            return vertexData;
        };
        VertexData.CreateGroundFromHeightMap = function (width, height, subdivisions, minHeight, maxHeight, buffer, bufferWidth, bufferHeight) {
            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];
            var row, col;
            // Vertices
            for (row = 0; row <= subdivisions; row++) {
                for (col = 0; col <= subdivisions; col++) {
                    var position = new BABYLON.Vector3((col * width) / subdivisions - (width / 2.0), 0, ((subdivisions - row) * height) / subdivisions - (height / 2.0));
                    // Compute height
                    var heightMapX = (((position.x + width / 2) / width) * (bufferWidth - 1)) | 0;
                    var heightMapY = ((1.0 - (position.z + height / 2) / height) * (bufferHeight - 1)) | 0;
                    var pos = (heightMapX + heightMapY * bufferWidth) * 4;
                    var r = buffer[pos] / 255.0;
                    var g = buffer[pos + 1] / 255.0;
                    var b = buffer[pos + 2] / 255.0;
                    var gradient = r * 0.3 + g * 0.59 + b * 0.11;
                    position.y = minHeight + (maxHeight - minHeight) * gradient;
                    // Add  vertex
                    positions.push(position.x, position.y, position.z);
                    normals.push(0, 0, 0);
                    uvs.push(col / subdivisions, 1.0 - row / subdivisions);
                }
            }
            // Indices
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
            // Normals
            VertexData.ComputeNormals(positions, indices, normals);
            // Result
            var vertexData = new VertexData();
            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;
            return vertexData;
        };
        VertexData.CreatePlane = function (size, sideOrientation) {
            if (sideOrientation === void 0) { sideOrientation = BABYLON.Mesh.DEFAULTSIDE; }
            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];
            size = size || 1;
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
            // Sides
            VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs);
            // Result
            var vertexData = new VertexData();
            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;
            return vertexData;
        };
        VertexData.CreateDisc = function (radius, tessellation, sideOrientation) {
            if (sideOrientation === void 0) { sideOrientation = BABYLON.Mesh.DEFAULTSIDE; }
            var positions = [];
            var indices = [];
            var normals = [];
            var uvs = [];
            // positions and uvs
            positions.push(0, 0, 0); // disc center first
            uvs.push(0.5, 0.5);
            var step = Math.PI * 2 / tessellation;
            for (var a = 0; a < Math.PI * 2; a += step) {
                var x = Math.cos(a);
                var y = Math.sin(a);
                var u = (x + 1) / 2;
                var v = (1 - y) / 2;
                positions.push(radius * x, radius * y, 0);
                uvs.push(u, v);
            }
            positions.push(positions[3], positions[4], positions[5]); // close the circle
            uvs.push(uvs[2], uvs[3]);
            //indices
            var vertexNb = positions.length / 3;
            for (var i = 1; i < vertexNb - 1; i++) {
                indices.push(i + 1, 0, i);
            }
            // result
            VertexData.ComputeNormals(positions, indices, normals);
            VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs);
            var vertexData = new VertexData();
            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;
            return vertexData;
        };
        // based on http://code.google.com/p/away3d/source/browse/trunk/fp10/Away3D/src/away3d/primitives/TorusKnot.as?spec=svn2473&r=2473
        VertexData.CreateTorusKnot = function (radius, tube, radialSegments, tubularSegments, p, q, sideOrientation) {
            if (sideOrientation === void 0) { sideOrientation = BABYLON.Mesh.DEFAULTSIDE; }
            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];
            radius = radius || 2;
            tube = tube || 0.5;
            radialSegments = radialSegments || 32;
            tubularSegments = tubularSegments || 32;
            p = p || 2;
            q = q || 3;
            // Helper
            var getPos = function (angle) {
                var cu = Math.cos(angle);
                var su = Math.sin(angle);
                var quOverP = q / p * angle;
                var cs = Math.cos(quOverP);
                var tx = radius * (2 + cs) * 0.5 * cu;
                var ty = radius * (2 + cs) * su * 0.5;
                var tz = radius * Math.sin(quOverP) * 0.5;
                return new BABYLON.Vector3(tx, ty, tz);
            };
            // Vertices
            for (var i = 0; i <= radialSegments; i++) {
                var modI = i % radialSegments;
                var u = modI / radialSegments * 2 * p * Math.PI;
                var p1 = getPos(u);
                var p2 = getPos(u + 0.01);
                var tang = p2.subtract(p1);
                var n = p2.add(p1);
                var bitan = BABYLON.Vector3.Cross(tang, n);
                n = BABYLON.Vector3.Cross(bitan, tang);
                bitan.normalize();
                n.normalize();
                for (var j = 0; j < tubularSegments; j++) {
                    var modJ = j % tubularSegments;
                    var v = modJ / tubularSegments * 2 * Math.PI;
                    var cx = -tube * Math.cos(v);
                    var cy = tube * Math.sin(v);
                    positions.push(p1.x + cx * n.x + cy * bitan.x);
                    positions.push(p1.y + cx * n.y + cy * bitan.y);
                    positions.push(p1.z + cx * n.z + cy * bitan.z);
                    uvs.push(i / radialSegments);
                    uvs.push(j / tubularSegments);
                }
            }
            for (i = 0; i < radialSegments; i++) {
                for (j = 0; j < tubularSegments; j++) {
                    var jNext = (j + 1) % tubularSegments;
                    var a = i * tubularSegments + j;
                    var b = (i + 1) * tubularSegments + j;
                    var c = (i + 1) * tubularSegments + jNext;
                    var d = i * tubularSegments + jNext;
                    indices.push(d);
                    indices.push(b);
                    indices.push(a);
                    indices.push(d);
                    indices.push(c);
                    indices.push(b);
                }
            }
            // Normals
            VertexData.ComputeNormals(positions, indices, normals);
            // Sides
            VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs);
            // Result
            var vertexData = new VertexData();
            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;
            return vertexData;
        };
        // Tools
        /**
         * @param {any} - positions (number[] or Float32Array)
         * @param {any} - indices   (number[] or Uint16Array)
         * @param {any} - normals   (number[] or Float32Array)
         */
        VertexData.ComputeNormals = function (positions, indices, normals) {
            var index = 0;
            // temp Vector3
            var p1 = BABYLON.Vector3.Zero();
            var p2 = BABYLON.Vector3.Zero();
            var p3 = BABYLON.Vector3.Zero();
            var p1p2 = BABYLON.Vector3.Zero();
            var p3p2 = BABYLON.Vector3.Zero();
            var faceNormal = BABYLON.Vector3.Zero();
            var vertexNormali1 = BABYLON.Vector3.Zero();
            var vertexNormali2 = BABYLON.Vector3.Zero();
            var vertexNormali3 = BABYLON.Vector3.Zero();
            // indice triplet = 1 face
            var nbFaces = indices.length / 3;
            for (index = 0; index < nbFaces; index++) {
                var i1 = indices[index * 3];
                var i2 = indices[index * 3 + 1];
                var i3 = indices[index * 3 + 2];
                // setting the temp V3
                BABYLON.Vector3.FromFloatsToRef(positions[i1 * 3], positions[i1 * 3 + 1], positions[i1 * 3 + 2], p1);
                BABYLON.Vector3.FromFloatsToRef(positions[i2 * 3], positions[i2 * 3 + 1], positions[i2 * 3 + 2], p2);
                BABYLON.Vector3.FromFloatsToRef(positions[i3 * 3], positions[i3 * 3 + 1], positions[i3 * 3 + 2], p3);
                p1.subtractToRef(p2, p1p2);
                p3.subtractToRef(p2, p3p2);
                BABYLON.Vector3.CrossToRef(p1p2, p3p2, faceNormal);
                faceNormal.normalize();
                // All intermediate results are stored in the normals array :
                // get the normals at i1, i2 and i3 indexes
                normals[i1 * 3] = normals[i1 * 3] || 0.0;
                normals[i1 * 3 + 1] = normals[i1 * 3 + 1] || 0.0;
                normals[i1 * 3 + 2] = normals[i1 * 3 + 2] || 0.0;
                normals[i2 * 3] = normals[i2 * 3] || 0.0;
                normals[i2 * 3 + 1] = normals[i2 * 3 + 1] || 0.0;
                normals[i2 * 3 + 2] = normals[i2 * 3 + 2] || 0.0;
                normals[i3 * 3] = normals[i3 * 3] || 0.0;
                normals[i3 * 3 + 1] = normals[i3 * 3 + 1] || 0.0;
                normals[i3 * 3 + 2] = normals[i3 * 3 + 2] || 0.0;
                // make intermediate vectors3 from normals values
                BABYLON.Vector3.FromFloatsToRef(normals[i1 * 3], normals[i1 * 3 + 1], normals[i1 * 3 + 2], vertexNormali1);
                BABYLON.Vector3.FromFloatsToRef(normals[i2 * 3], normals[i2 * 3 + 1], normals[i2 * 3 + 2], vertexNormali2);
                BABYLON.Vector3.FromFloatsToRef(normals[i3 * 3], normals[i3 * 3 + 1], normals[i3 * 3 + 2], vertexNormali3);
                // add the current face normals to these intermediate vectors3
                vertexNormali1 = vertexNormali1.addInPlace(faceNormal);
                vertexNormali2 = vertexNormali2.addInPlace(faceNormal);
                vertexNormali3 = vertexNormali3.addInPlace(faceNormal);
                // store back intermediate vectors3 into the normals array
                normals[i1 * 3] = vertexNormali1.x;
                normals[i1 * 3 + 1] = vertexNormali1.y;
                normals[i1 * 3 + 2] = vertexNormali1.z;
                normals[i2 * 3] = vertexNormali2.x;
                normals[i2 * 3 + 1] = vertexNormali2.y;
                normals[i2 * 3 + 2] = vertexNormali2.z;
                normals[i3 * 3] = vertexNormali3.x;
                normals[i3 * 3 + 1] = vertexNormali3.y;
                normals[i3 * 3 + 2] = vertexNormali3.z;
            }
            // last normalization
            for (index = 0; index < normals.length / 3; index++) {
                BABYLON.Vector3.FromFloatsToRef(normals[index * 3], normals[index * 3 + 1], normals[index * 3 + 2], vertexNormali1);
                vertexNormali1.normalize();
                normals[index * 3] = vertexNormali1.x;
                normals[index * 3 + 1] = vertexNormali1.y;
                normals[index * 3 + 2] = vertexNormali1.z;
            }
        };
        VertexData._ComputeSides = function (sideOrientation, positions, indices, normals, uvs) {
            var li = indices.length;
            var ln = normals.length;
            var i;
            var n;
            sideOrientation = sideOrientation || BABYLON.Mesh.DEFAULTSIDE;
            switch (sideOrientation) {
                case BABYLON.Mesh.FRONTSIDE:
                    // nothing changed
                    break;
                case BABYLON.Mesh.BACKSIDE:
                    var tmp;
                    // indices
                    for (i = 0; i < li; i += 3) {
                        tmp = indices[i];
                        indices[i] = indices[i + 2];
                        indices[i + 2] = tmp;
                    }
                    // normals
                    for (n = 0; n < ln; n++) {
                        normals[n] = -normals[n];
                    }
                    break;
                case BABYLON.Mesh.DOUBLESIDE:
                    // positions 
                    var lp = positions.length;
                    var l = lp / 3;
                    for (var p = 0; p < lp; p++) {
                        positions[lp + p] = positions[p];
                    }
                    // indices
                    for (i = 0; i < li; i += 3) {
                        indices[i + li] = indices[i + 2] + l;
                        indices[i + 1 + li] = indices[i + 1] + l;
                        indices[i + 2 + li] = indices[i] + l;
                    }
                    // normals
                    for (n = 0; n < ln; n++) {
                        normals[ln + n] = -normals[n];
                    }
                    // uvs
                    var lu = uvs.length;
                    for (var u = 0; u < lu; u++) {
                        uvs[u + lu] = uvs[u];
                    }
                    break;
            }
        };
        return VertexData;
    })();
    BABYLON.VertexData = VertexData;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.mesh.vertexData.js.map