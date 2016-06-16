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
                case BABYLON.VertexBuffer.MatricesIndicesExtraKind:
                    this.matricesIndicesExtra = data;
                    break;
                case BABYLON.VertexBuffer.MatricesWeightsExtraKind:
                    this.matricesWeightsExtra = data;
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
            if (this.matricesIndicesExtra) {
                meshOrGeometry.setVerticesData(BABYLON.VertexBuffer.MatricesIndicesExtraKind, this.matricesIndicesExtra, updatable);
            }
            if (this.matricesWeightsExtra) {
                meshOrGeometry.setVerticesData(BABYLON.VertexBuffer.MatricesWeightsExtraKind, this.matricesWeightsExtra, updatable);
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
            if (this.matricesIndicesExtra) {
                meshOrGeometry.updateVerticesData(BABYLON.VertexBuffer.MatricesIndicesExtraKind, this.matricesIndicesExtra, updateExtends, makeItUnique);
            }
            if (this.matricesWeightsExtra) {
                meshOrGeometry.updateVerticesData(BABYLON.VertexBuffer.MatricesWeightsExtraKind, this.matricesWeightsExtra, updateExtends, makeItUnique);
            }
            if (this.indices) {
                meshOrGeometry.setIndices(this.indices);
            }
        };
        VertexData.prototype.transform = function (matrix) {
            var transformed = BABYLON.Vector3.Zero();
            var index;
            if (this.positions) {
                var position = BABYLON.Vector3.Zero();
                for (index = 0; index < this.positions.length; index += 3) {
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
                    //TODO check type - if Int32Array!
                    this.indices.push(other.indices[index] + offset);
                }
            }
            this.positions = this._mergeElement(this.positions, other.positions);
            this.normals = this._mergeElement(this.normals, other.normals);
            this.uvs = this._mergeElement(this.uvs, other.uvs);
            this.uvs2 = this._mergeElement(this.uvs2, other.uvs2);
            this.uvs3 = this._mergeElement(this.uvs3, other.uvs3);
            this.uvs4 = this._mergeElement(this.uvs4, other.uvs4);
            this.uvs5 = this._mergeElement(this.uvs5, other.uvs5);
            this.uvs6 = this._mergeElement(this.uvs6, other.uvs6);
            this.colors = this._mergeElement(this.colors, other.colors);
            this.matricesIndices = this._mergeElement(this.matricesIndices, other.matricesIndices);
            this.matricesWeights = this._mergeElement(this.matricesWeights, other.matricesWeights);
            this.matricesIndicesExtra = this._mergeElement(this.matricesIndicesExtra, other.matricesIndicesExtra);
            this.matricesWeightsExtra = this._mergeElement(this.matricesWeightsExtra, other.matricesWeightsExtra);
        };
        VertexData.prototype._mergeElement = function (source, other) {
            if (!other)
                return source;
            if (!source)
                return other;
            var len = other.length + source.length;
            var isSrcTypedArray = source instanceof Float32Array;
            var isOthTypedArray = other instanceof Float32Array;
            // use non-loop method when the source is Float32Array
            if (isSrcTypedArray) {
                var ret32 = new Float32Array(len);
                ret32.set(source);
                ret32.set(other, source.length);
                return ret32;
            }
            else if (!isOthTypedArray) {
                return source.concat(other);
            }
            else {
                var ret = source.slice(0); // copy source to a separate array
                for (var i = 0, len = other.length; i < len; i++) {
                    ret.push(other[i]);
                }
                return ret;
            }
        };
        VertexData.prototype.serialize = function () {
            var serializationObject = this.serialize();
            if (this.positions) {
                serializationObject.positions = this.positions;
            }
            if (this.normals) {
                serializationObject.normals = this.normals;
            }
            if (this.uvs) {
                serializationObject.uvs = this.uvs;
            }
            if (this.uvs2) {
                serializationObject.uvs2 = this.uvs2;
            }
            if (this.uvs3) {
                serializationObject.uvs3 = this.uvs3;
            }
            if (this.uvs4) {
                serializationObject.uvs4 = this.uvs4;
            }
            if (this.uvs5) {
                serializationObject.uvs5 = this.uvs5;
            }
            if (this.uvs6) {
                serializationObject.uvs6 = this.uvs6;
            }
            if (this.colors) {
                serializationObject.colors = this.colors;
            }
            if (this.matricesIndices) {
                serializationObject.matricesIndices = this.matricesIndices;
                serializationObject.matricesIndices._isExpanded = true;
            }
            if (this.matricesWeights) {
                serializationObject.matricesWeights = this.matricesWeights;
            }
            if (this.matricesIndicesExtra) {
                serializationObject.matricesIndicesExtra = this.matricesIndicesExtra;
                serializationObject.matricesIndicesExtra._isExpanded = true;
            }
            if (this.matricesWeightsExtra) {
                serializationObject.matricesWeightsExtra = this.matricesWeightsExtra;
            }
            serializationObject.indices = this.indices;
            return serializationObject;
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
            if (meshOrGeometry.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesIndicesExtraKind)) {
                result.matricesIndicesExtra = meshOrGeometry.getVerticesData(BABYLON.VertexBuffer.MatricesIndicesExtraKind, copyWhenShared);
            }
            if (meshOrGeometry.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesWeightsExtraKind)) {
                result.matricesWeightsExtra = meshOrGeometry.getVerticesData(BABYLON.VertexBuffer.MatricesWeightsExtraKind, copyWhenShared);
            }
            result.indices = meshOrGeometry.getIndices(copyWhenShared);
            return result;
        };
        VertexData.CreateRibbon = function (options) {
            var pathArray = options.pathArray;
            var closeArray = options.closeArray || false;
            var closePath = options.closePath || false;
            var invertUV = options.invertUV || false;
            var defaultOffset = Math.floor(pathArray[0].length / 2);
            var offset = options.offset || defaultOffset;
            offset = offset > defaultOffset ? defaultOffset : Math.floor(offset); // offset max allowed : defaultOffset
            var sideOrientation = (options.sideOrientation === 0) ? 0 : options.sideOrientation || BABYLON.Mesh.DEFAULTSIDE;
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
            var idx = []; // array of path indexes : index of each path (first vertex) in the total vertex number
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
            var closePathCorr = (closePath) ? 1 : 0;
            var path;
            var l;
            minlg = pathArray[0].length;
            var vectlg;
            var dist;
            for (p = 0; p < pathArray.length; p++) {
                uTotalDistance[p] = 0;
                us[p] = [0];
                path = pathArray[p];
                l = path.length;
                minlg = (minlg < l) ? minlg : l;
                j = 0;
                while (j < l) {
                    positions.push(path[j].x, path[j].y, path[j].z);
                    if (j > 0) {
                        vectlg = path[j].subtract(path[j - 1]).length();
                        dist = vectlg + uTotalDistance[p];
                        us[p].push(dist);
                        uTotalDistance[p] = dist;
                    }
                    j++;
                }
                if (closePath) {
                    j--;
                    positions.push(path[0].x, path[0].y, path[0].z);
                    vectlg = path[j].subtract(path[0]).length();
                    dist = vectlg + uTotalDistance[p];
                    us[p].push(dist);
                    uTotalDistance[p] = dist;
                }
                lg[p] = l + closePathCorr;
                idx[p] = idc;
                idc += (l + closePathCorr);
            }
            // vertical distances (v)
            var path1;
            var path2;
            var vertex1;
            var vertex2;
            for (i = 0; i < minlg + closePathCorr; i++) {
                vTotalDistance[i] = 0;
                vs[i] = [0];
                for (p = 0; p < pathArray.length - 1; p++) {
                    path1 = pathArray[p];
                    path2 = pathArray[p + 1];
                    if (i === minlg) {
                        vertex1 = path1[0];
                        vertex2 = path2[0];
                    }
                    else {
                        vertex1 = path1[i];
                        vertex2 = path2[i];
                    }
                    vectlg = vertex2.subtract(vertex1).length();
                    dist = vectlg + vTotalDistance[i];
                    vs[i].push(dist);
                    vTotalDistance[i] = dist;
                }
                if (closeArray) {
                    path1 = pathArray[p];
                    path2 = pathArray[0];
                    if (i === minlg) {
                        vertex2 = path2[0];
                    }
                    vectlg = vertex2.subtract(vertex1).length();
                    dist = vectlg + vTotalDistance[i];
                    vTotalDistance[i] = dist;
                }
            }
            // uvs
            var u;
            var v;
            for (p = 0; p < pathArray.length; p++) {
                for (i = 0; i < minlg + closePathCorr; i++) {
                    u = us[p][i] / uTotalDistance[p];
                    v = vs[i][p] / vTotalDistance[i];
                    if (invertUV) {
                        uvs.push(v, u);
                    }
                    else {
                        uvs.push(u, v);
                    }
                }
            }
            // indices
            p = 0; // path index
            var pi = 0; // positions array index
            var l1 = lg[p] - 1; // path1 length
            var l2 = lg[p + 1] - 1; // path2 length
            var min = (l1 < l2) ? l1 : l2; // current path stop index
            var shft = idx[1] - idx[0]; // shift
            var path1nb = closeArray ? lg.length : lg.length - 1; // number of path1 to iterate	on
            while (pi <= min && p < path1nb) {
                // draw two triangles between path1 (p1) and path2 (p2) : (p1.pi, p2.pi, p1.pi+1) and (p2.pi+1, p1.pi+1, p2.pi) clockwise
                indices.push(pi, pi + shft, pi + 1);
                indices.push(pi + shft + 1, pi + 1, pi + shft);
                pi += 1;
                if (pi === min) {
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
            if (closePath) {
                var indexFirst = 0;
                var indexLast = 0;
                for (p = 0; p < pathArray.length; p++) {
                    indexFirst = idx[p] * 3;
                    if (p + 1 < pathArray.length) {
                        indexLast = (idx[p + 1] - 1) * 3;
                    }
                    else {
                        indexLast = normals.length - 3;
                    }
                    normals[indexFirst] = (normals[indexFirst] + normals[indexLast]) * 0.5;
                    normals[indexFirst + 1] = (normals[indexFirst + 1] + normals[indexLast + 1]) * 0.5;
                    normals[indexFirst + 2] = (normals[indexFirst + 2] + normals[indexLast + 2]) * 0.5;
                    normals[indexLast] = normals[indexFirst];
                    normals[indexLast + 1] = normals[indexFirst + 1];
                    normals[indexLast + 2] = normals[indexFirst + 2];
                }
            }
            // sides
            VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs);
            // Result
            var vertexData = new VertexData();
            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;
            if (closePath) {
                vertexData._idx = idx;
            }
            return vertexData;
        };
        VertexData.CreateBox = function (options) {
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
            var width = options.width || options.size || 1;
            var height = options.height || options.size || 1;
            var depth = options.depth || options.size || 1;
            var sideOrientation = (options.sideOrientation === 0) ? 0 : options.sideOrientation || BABYLON.Mesh.DEFAULTSIDE;
            var faceUV = options.faceUV || new Array(6);
            var faceColors = options.faceColors;
            var colors = [];
            // default face colors and UV if undefined
            for (var f = 0; f < 6; f++) {
                if (faceUV[f] === undefined) {
                    faceUV[f] = new BABYLON.Vector4(0, 0, 1, 1);
                }
                if (faceColors && faceColors[f] === undefined) {
                    faceColors[f] = new BABYLON.Color4(1, 1, 1, 1);
                }
            }
            var scaleVector = new BABYLON.Vector3(width / 2, height / 2, depth / 2);
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
                var vertex = normal.subtract(side1).subtract(side2).multiply(scaleVector);
                positions.push(vertex.x, vertex.y, vertex.z);
                normals.push(normal.x, normal.y, normal.z);
                uvs.push(faceUV[index].z, faceUV[index].w);
                if (faceColors) {
                    colors.push(faceColors[index].r, faceColors[index].g, faceColors[index].b, faceColors[index].a);
                }
                vertex = normal.subtract(side1).add(side2).multiply(scaleVector);
                positions.push(vertex.x, vertex.y, vertex.z);
                normals.push(normal.x, normal.y, normal.z);
                uvs.push(faceUV[index].x, faceUV[index].w);
                if (faceColors) {
                    colors.push(faceColors[index].r, faceColors[index].g, faceColors[index].b, faceColors[index].a);
                }
                vertex = normal.add(side1).add(side2).multiply(scaleVector);
                positions.push(vertex.x, vertex.y, vertex.z);
                normals.push(normal.x, normal.y, normal.z);
                uvs.push(faceUV[index].x, faceUV[index].y);
                if (faceColors) {
                    colors.push(faceColors[index].r, faceColors[index].g, faceColors[index].b, faceColors[index].a);
                }
                vertex = normal.add(side1).subtract(side2).multiply(scaleVector);
                positions.push(vertex.x, vertex.y, vertex.z);
                normals.push(normal.x, normal.y, normal.z);
                uvs.push(faceUV[index].z, faceUV[index].y);
                if (faceColors) {
                    colors.push(faceColors[index].r, faceColors[index].g, faceColors[index].b, faceColors[index].a);
                }
            }
            // sides
            VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs);
            // Result
            var vertexData = new VertexData();
            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;
            if (faceColors) {
                var totalColors = (sideOrientation === BABYLON.Mesh.DOUBLESIDE) ? colors.concat(colors) : colors;
                vertexData.colors = totalColors;
            }
            return vertexData;
        };
        VertexData.CreateSphere = function (options) {
            var segments = options.segments || 32;
            var diameterX = options.diameterX || options.diameter || 1;
            var diameterY = options.diameterY || options.diameter || 1;
            var diameterZ = options.diameterZ || options.diameter || 1;
            var arc = (options.arc <= 0 || options.arc > 1) ? 1.0 : options.arc || 1.0;
            var slice = (options.slice <= 0) ? 1.0 : options.slice || 1.0;
            var sideOrientation = (options.sideOrientation === 0) ? 0 : options.sideOrientation || BABYLON.Mesh.DEFAULTSIDE;
            var radius = new BABYLON.Vector3(diameterX / 2, diameterY / 2, diameterZ / 2);
            var totalZRotationSteps = 2 + segments;
            var totalYRotationSteps = 2 * totalZRotationSteps;
            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];
            for (var zRotationStep = 0; zRotationStep <= totalZRotationSteps; zRotationStep++) {
                var normalizedZ = zRotationStep / totalZRotationSteps;
                var angleZ = normalizedZ * Math.PI * slice;
                for (var yRotationStep = 0; yRotationStep <= totalYRotationSteps; yRotationStep++) {
                    var normalizedY = yRotationStep / totalYRotationSteps;
                    var angleY = normalizedY * Math.PI * 2 * arc;
                    var rotationZ = BABYLON.Matrix.RotationZ(-angleZ);
                    var rotationY = BABYLON.Matrix.RotationY(angleY);
                    var afterRotZ = BABYLON.Vector3.TransformCoordinates(BABYLON.Vector3.Up(), rotationZ);
                    var complete = BABYLON.Vector3.TransformCoordinates(afterRotZ, rotationY);
                    var vertex = complete.multiply(radius);
                    var normal = complete.divide(radius).normalize();
                    positions.push(vertex.x, vertex.y, vertex.z);
                    normals.push(normal.x, normal.y, normal.z);
                    uvs.push(normalizedY, normalizedZ);
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
        // Cylinder and cone
        VertexData.CreateCylinder = function (options) {
            var height = options.height || 2;
            var diameterTop = (options.diameterTop === 0) ? 0 : options.diameterTop || options.diameter || 1;
            var diameterBottom = options.diameterBottom || options.diameter || 1;
            var tessellation = options.tessellation || 24;
            var subdivisions = options.subdivisions || 1;
            var hasRings = options.hasRings;
            var enclose = options.enclose;
            var arc = (options.arc <= 0 || options.arc > 1) ? 1.0 : options.arc || 1.0;
            var sideOrientation = (options.sideOrientation === 0) ? 0 : options.sideOrientation || BABYLON.Mesh.DEFAULTSIDE;
            var faceUV = options.faceUV || new Array(3);
            var faceColors = options.faceColors;
            // default face colors and UV if undefined
            var quadNb = (arc !== 1 && enclose) ? 2 : 0;
            var ringNb = (hasRings) ? subdivisions : 1;
            var surfaceNb = 2 + (1 + quadNb) * ringNb;
            var f;
            for (f = 0; f < surfaceNb; f++) {
                if (faceColors && faceColors[f] === undefined) {
                    faceColors[f] = new BABYLON.Color4(1, 1, 1, 1);
                }
            }
            for (f = 0; f < surfaceNb; f++) {
                if (faceUV && faceUV[f] === undefined) {
                    faceUV[f] = new BABYLON.Vector4(0, 0, 1, 1);
                }
            }
            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];
            var colors = [];
            var angle_step = Math.PI * 2 * arc / tessellation;
            var angle;
            var h;
            var radius;
            var tan = (diameterBottom - diameterTop) / 2 / height;
            var ringVertex = BABYLON.Vector3.Zero();
            var ringNormal = BABYLON.Vector3.Zero();
            var ringFirstVertex = BABYLON.Vector3.Zero();
            var ringFirstNormal = BABYLON.Vector3.Zero();
            var quadNormal = BABYLON.Vector3.Zero();
            var Y = BABYLON.Axis.Y;
            // positions, normals, uvs
            var i;
            var j;
            var r;
            var ringIdx = 1;
            var s = 1; // surface index
            var cs = 0;
            var v = 0;
            for (i = 0; i <= subdivisions; i++) {
                h = i / subdivisions;
                radius = (h * (diameterTop - diameterBottom) + diameterBottom) / 2;
                ringIdx = (hasRings && i !== 0 && i !== subdivisions) ? 2 : 1;
                for (r = 0; r < ringIdx; r++) {
                    if (hasRings) {
                        s += r;
                    }
                    if (enclose) {
                        s += 2 * r;
                    }
                    for (j = 0; j <= tessellation; j++) {
                        angle = j * angle_step;
                        // position
                        ringVertex.x = Math.cos(-angle) * radius;
                        ringVertex.y = -height / 2 + h * height;
                        ringVertex.z = Math.sin(-angle) * radius;
                        // normal
                        if (diameterTop === 0 && i === subdivisions) {
                            // if no top cap, reuse former normals
                            ringNormal.x = normals[normals.length - (tessellation + 1) * 3];
                            ringNormal.y = normals[normals.length - (tessellation + 1) * 3 + 1];
                            ringNormal.z = normals[normals.length - (tessellation + 1) * 3 + 2];
                        }
                        else {
                            ringNormal.x = ringVertex.x;
                            ringNormal.z = ringVertex.z;
                            ringNormal.y = Math.sqrt(ringNormal.x * ringNormal.x + ringNormal.z * ringNormal.z) * tan;
                            ringNormal.normalize();
                        }
                        // keep first ring vertex values for enclose
                        if (j === 0) {
                            ringFirstVertex.copyFrom(ringVertex);
                            ringFirstNormal.copyFrom(ringNormal);
                        }
                        positions.push(ringVertex.x, ringVertex.y, ringVertex.z);
                        normals.push(ringNormal.x, ringNormal.y, ringNormal.z);
                        if (hasRings) {
                            v = (cs !== s) ? faceUV[s].y : faceUV[s].w;
                        }
                        else {
                            v = faceUV[s].y + (faceUV[s].w - faceUV[s].y) * h;
                        }
                        uvs.push(faceUV[s].x + (faceUV[s].z - faceUV[s].x) * j / tessellation, v);
                        if (faceColors) {
                            colors.push(faceColors[s].r, faceColors[s].g, faceColors[s].b, faceColors[s].a);
                        }
                    }
                    // if enclose, add four vertices and their dedicated normals
                    if (arc !== 1 && enclose) {
                        positions.push(ringVertex.x, ringVertex.y, ringVertex.z);
                        positions.push(0, ringVertex.y, 0);
                        positions.push(0, ringVertex.y, 0);
                        positions.push(ringFirstVertex.x, ringFirstVertex.y, ringFirstVertex.z);
                        BABYLON.Vector3.CrossToRef(Y, ringNormal, quadNormal);
                        quadNormal.normalize();
                        normals.push(quadNormal.x, quadNormal.y, quadNormal.z, quadNormal.x, quadNormal.y, quadNormal.z);
                        BABYLON.Vector3.CrossToRef(ringFirstNormal, Y, quadNormal);
                        quadNormal.normalize();
                        normals.push(quadNormal.x, quadNormal.y, quadNormal.z, quadNormal.x, quadNormal.y, quadNormal.z);
                        if (hasRings) {
                            v = (cs !== s) ? faceUV[s + 1].y : faceUV[s + 1].w;
                        }
                        else {
                            v = faceUV[s + 1].y + (faceUV[s + 1].w - faceUV[s + 1].y) * h;
                        }
                        uvs.push(faceUV[s + 1].x, v);
                        uvs.push(faceUV[s + 1].z, v);
                        if (hasRings) {
                            v = (cs !== s) ? faceUV[s + 2].y : faceUV[s + 2].w;
                        }
                        else {
                            v = faceUV[s + 2].y + (faceUV[s + 2].w - faceUV[s + 2].y) * h;
                        }
                        uvs.push(faceUV[s + 2].x, v);
                        uvs.push(faceUV[s + 2].z, v);
                        if (faceColors) {
                            colors.push(faceColors[s + 1].r, faceColors[s + 1].g, faceColors[s + 1].b, faceColors[s + 1].a);
                            colors.push(faceColors[s + 1].r, faceColors[s + 1].g, faceColors[s + 1].b, faceColors[s + 1].a);
                            colors.push(faceColors[s + 2].r, faceColors[s + 2].g, faceColors[s + 2].b, faceColors[s + 2].a);
                            colors.push(faceColors[s + 2].r, faceColors[s + 2].g, faceColors[s + 2].b, faceColors[s + 2].a);
                        }
                    }
                    if (cs !== s) {
                        cs = s;
                    }
                }
            }
            // indices
            var e = (arc !== 1 && enclose) ? tessellation + 4 : tessellation; // correction of number of iteration if enclose
            var s;
            i = 0;
            for (s = 0; s < subdivisions; s++) {
                for (j = 0; j < tessellation; j++) {
                    var i0 = i * (e + 1) + j;
                    var i1 = (i + 1) * (e + 1) + j;
                    var i2 = i * (e + 1) + (j + 1);
                    var i3 = (i + 1) * (e + 1) + (j + 1);
                    indices.push(i0, i1, i2);
                    indices.push(i3, i2, i1);
                }
                if (arc !== 1 && enclose) {
                    indices.push(i0 + 2, i1 + 2, i2 + 2);
                    indices.push(i3 + 2, i2 + 2, i1 + 2);
                    indices.push(i0 + 4, i1 + 4, i2 + 4);
                    indices.push(i3 + 4, i2 + 4, i1 + 4);
                }
                i = (hasRings) ? (i + 2) : (i + 1);
            }
            // Caps
            var createCylinderCap = function (isTop) {
                var radius = isTop ? diameterTop / 2 : diameterBottom / 2;
                if (radius === 0) {
                    return;
                }
                // Cap positions, normals & uvs
                var angle;
                var circleVector;
                var i;
                var u = (isTop) ? faceUV[surfaceNb - 1] : faceUV[0];
                var c;
                if (faceColors) {
                    c = (isTop) ? faceColors[surfaceNb - 1] : faceColors[0];
                }
                // cap center
                var vbase = positions.length / 3;
                var offset = isTop ? height / 2 : -height / 2;
                var center = new BABYLON.Vector3(0, offset, 0);
                positions.push(center.x, center.y, center.z);
                normals.push(0, isTop ? 1 : -1, 0);
                uvs.push(u.x + (u.z - u.x) * 0.5, u.y + (u.w - u.y) * 0.5);
                if (faceColors) {
                    colors.push(c.r, c.g, c.b, c.a);
                }
                var textureScale = new BABYLON.Vector2(0.5, 0.5);
                for (i = 0; i <= tessellation; i++) {
                    angle = Math.PI * 2 * i * arc / tessellation;
                    var cos = Math.cos(-angle);
                    var sin = Math.sin(-angle);
                    circleVector = new BABYLON.Vector3(cos * radius, offset, sin * radius);
                    var textureCoordinate = new BABYLON.Vector2(cos * textureScale.x + 0.5, sin * textureScale.y + 0.5);
                    positions.push(circleVector.x, circleVector.y, circleVector.z);
                    normals.push(0, isTop ? 1 : -1, 0);
                    uvs.push(u.x + (u.z - u.x) * textureCoordinate.x, u.y + (u.w - u.y) * textureCoordinate.y);
                    if (faceColors) {
                        colors.push(c.r, c.g, c.b, c.a);
                    }
                }
                // Cap indices
                for (i = 0; i < tessellation; i++) {
                    if (!isTop) {
                        indices.push(vbase);
                        indices.push(vbase + (i + 1));
                        indices.push(vbase + (i + 2));
                    }
                    else {
                        indices.push(vbase);
                        indices.push(vbase + (i + 2));
                        indices.push(vbase + (i + 1));
                    }
                }
            };
            // add caps to geometry
            createCylinderCap(false);
            createCylinderCap(true);
            // Sides
            VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs);
            var vertexData = new VertexData();
            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;
            if (faceColors) {
                vertexData.colors = colors;
            }
            return vertexData;
        };
        VertexData.CreateTorus = function (options) {
            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];
            var diameter = options.diameter || 1;
            var thickness = options.thickness || 0.5;
            var tessellation = options.tessellation || 16;
            var sideOrientation = (options.sideOrientation === 0) ? 0 : options.sideOrientation || BABYLON.Mesh.DEFAULTSIDE;
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
        VertexData.CreateLineSystem = function (options) {
            var indices = [];
            var positions = [];
            var lines = options.lines;
            var idx = 0;
            for (var l = 0; l < lines.length; l++) {
                var points = lines[l];
                for (var index = 0; index < points.length; index++) {
                    positions.push(points[index].x, points[index].y, points[index].z);
                    if (index > 0) {
                        indices.push(idx - 1);
                        indices.push(idx);
                    }
                    idx++;
                }
            }
            var vertexData = new VertexData();
            vertexData.indices = indices;
            vertexData.positions = positions;
            return vertexData;
        };
        VertexData.CreateDashedLines = function (options) {
            var dashSize = options.dashSize || 3;
            var gapSize = options.gapSize || 1;
            var dashNb = options.dashNb || 200;
            var points = options.points;
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
        VertexData.CreateGround = function (options) {
            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];
            var row, col;
            var width = options.width || 1;
            var height = options.height || 1;
            var subdivisions = options.subdivisions || 1;
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
        VertexData.CreateTiledGround = function (options) {
            var xmin = options.xmin || -1.0;
            var zmin = options.zmin || -1.0;
            var xmax = options.xmax || 1.0;
            var zmax = options.zmax || 1.0;
            var subdivisions = options.subdivisions || { w: 1, h: 1 };
            var precision = options.precision || { w: 1, h: 1 };
            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];
            var row, col, tileRow, tileCol;
            subdivisions.h = (subdivisions.h < 1) ? 1 : subdivisions.h;
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
        VertexData.CreateGroundFromHeightMap = function (options) {
            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];
            var row, col;
            // Vertices
            for (row = 0; row <= options.subdivisions; row++) {
                for (col = 0; col <= options.subdivisions; col++) {
                    var position = new BABYLON.Vector3((col * options.width) / options.subdivisions - (options.width / 2.0), 0, ((options.subdivisions - row) * options.height) / options.subdivisions - (options.height / 2.0));
                    // Compute height
                    var heightMapX = (((position.x + options.width / 2) / options.width) * (options.bufferWidth - 1)) | 0;
                    var heightMapY = ((1.0 - (position.z + options.height / 2) / options.height) * (options.bufferHeight - 1)) | 0;
                    var pos = (heightMapX + heightMapY * options.bufferWidth) * 4;
                    var r = options.buffer[pos] / 255.0;
                    var g = options.buffer[pos + 1] / 255.0;
                    var b = options.buffer[pos + 2] / 255.0;
                    var gradient = r * 0.3 + g * 0.59 + b * 0.11;
                    position.y = options.minHeight + (options.maxHeight - options.minHeight) * gradient;
                    // Add  vertex
                    positions.push(position.x, position.y, position.z);
                    normals.push(0, 0, 0);
                    uvs.push(col / options.subdivisions, 1.0 - row / options.subdivisions);
                }
            }
            // Indices
            for (row = 0; row < options.subdivisions; row++) {
                for (col = 0; col < options.subdivisions; col++) {
                    indices.push(col + 1 + (row + 1) * (options.subdivisions + 1));
                    indices.push(col + 1 + row * (options.subdivisions + 1));
                    indices.push(col + row * (options.subdivisions + 1));
                    indices.push(col + (row + 1) * (options.subdivisions + 1));
                    indices.push(col + 1 + (row + 1) * (options.subdivisions + 1));
                    indices.push(col + row * (options.subdivisions + 1));
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
        VertexData.CreatePlane = function (options) {
            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];
            var width = options.width || options.size || 1;
            var height = options.height || options.size || 1;
            var sideOrientation = (options.sideOrientation === 0) ? 0 : options.sideOrientation || BABYLON.Mesh.DEFAULTSIDE;
            // Vertices
            var halfWidth = width / 2.0;
            var halfHeight = height / 2.0;
            positions.push(-halfWidth, -halfHeight, 0);
            normals.push(0, 0, -1.0);
            uvs.push(0.0, 0.0);
            positions.push(halfWidth, -halfHeight, 0);
            normals.push(0, 0, -1.0);
            uvs.push(1.0, 0.0);
            positions.push(halfWidth, halfHeight, 0);
            normals.push(0, 0, -1.0);
            uvs.push(1.0, 1.0);
            positions.push(-halfWidth, halfHeight, 0);
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
        VertexData.CreateDisc = function (options) {
            var positions = [];
            var indices = [];
            var normals = [];
            var uvs = [];
            var radius = options.radius || 0.5;
            var tessellation = options.tessellation || 64;
            var arc = (options.arc <= 0 || options.arc > 1) ? 1.0 : options.arc || 1.0;
            var sideOrientation = (options.sideOrientation === 0) ? 0 : options.sideOrientation || BABYLON.Mesh.DEFAULTSIDE;
            // positions and uvs
            positions.push(0, 0, 0); // disc center first
            uvs.push(0.5, 0.5);
            var theta = Math.PI * 2 * arc;
            var step = theta / tessellation;
            for (var a = 0; a < theta; a += step) {
                var x = Math.cos(a);
                var y = Math.sin(a);
                var u = (x + 1) / 2;
                var v = (1 - y) / 2;
                positions.push(radius * x, radius * y, 0);
                uvs.push(u, v);
            }
            if (arc === 1) {
                positions.push(positions[3], positions[4], positions[5]); // close the circle
                uvs.push(uvs[2], uvs[3]);
            }
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
        VertexData.CreateIcoSphere = function (options) {
            var sideOrientation = options.sideOrientation || BABYLON.Mesh.DEFAULTSIDE;
            var radius = options.radius || 1;
            var flat = (options.flat === undefined) ? true : options.flat;
            var subdivisions = options.subdivisions || 4;
            var radiusX = options.radiusX || radius;
            var radiusY = options.radiusY || radius;
            var radiusZ = options.radiusZ || radius;
            var t = (1 + Math.sqrt(5)) / 2;
            // 12 vertex x,y,z
            var ico_vertices = [
                -1, t, -0, 1, t, 0, -1, -t, 0, 1, -t, 0,
                0, -1, -t, 0, 1, -t, 0, -1, t, 0, 1, t,
                t, 0, 1, t, 0, -1, -t, 0, 1, -t, 0, -1 // v8-11
            ];
            // index of 3 vertex makes a face of icopshere
            var ico_indices = [
                0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 12, 22, 23,
                1, 5, 20, 5, 11, 4, 23, 22, 13, 22, 18, 6, 7, 1, 8,
                14, 21, 4, 14, 4, 2, 16, 13, 6, 15, 6, 19, 3, 8, 9,
                4, 21, 5, 13, 17, 23, 6, 13, 22, 19, 6, 18, 9, 8, 1
            ];
            // vertex for uv have aliased position, not for UV
            var vertices_unalias_id = [
                0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
                // vertex alias
                0,
                2,
                3,
                3,
                3,
                4,
                7,
                8,
                9,
                9,
                10,
                11 // 23: B + 12
            ];
            // uv as integer step (not pixels !)
            var ico_vertexuv = [
                5, 1, 3, 1, 6, 4, 0, 0,
                5, 3, 4, 2, 2, 2, 4, 0,
                2, 0, 1, 1, 6, 0, 6, 2,
                // vertex alias (for same vertex on different faces)
                0, 4,
                3, 3,
                4, 4,
                3, 1,
                4, 2,
                4, 4,
                0, 2,
                1, 1,
                2, 2,
                3, 3,
                1, 3,
                2, 4 // 23: B + 12
            ];
            // Vertices[0, 1, ...9, A, B] : position on UV plane
            // '+' indicate duplicate position to be fixed (3,9:0,2,3,4,7,8,A,B)
            // First island of uv mapping
            // v = 4h          3+  2
            // v = 3h        9+  4
            // v = 2h      9+  5   B
            // v = 1h    9   1   0
            // v = 0h  3   8   7   A
            //     u = 0 1 2 3 4 5 6  *a
            // Second island of uv mapping
            // v = 4h  0+  B+  4+
            // v = 3h    A+  2+
            // v = 2h  7+  6   3+
            // v = 1h    8+  3+
            // v = 0h
            //     u = 0 1 2 3 4 5 6  *a
            // Face layout on texture UV mapping
            // ============
            // \ 4  /\ 16 /   ======
            //  \  /  \  /   /\ 11 /
            //   \/ 7  \/   /  \  /
            //    =======  / 10 \/
            //   /\ 17 /\  =======
            //  /  \  /  \ \ 15 /\
            // / 8  \/ 12 \ \  /  \
            // ============  \/ 6  \
            // \ 18 /\  ============
            //  \  /  \ \ 5  /\ 0  /
            //   \/ 13 \ \  /  \  /
            //   =======  \/ 1  \/
            //       =============
            //      /\ 19 /\  2 /\
            //     /  \  /  \  /  \
            //    / 14 \/ 9  \/  3 \
            //   ===================
            // uv step is u:1 or 0.5, v:cos(30)=sqrt(3)/2, ratio approx is 84/97
            var ustep = 138 / 1024;
            var vstep = 239 / 1024;
            var uoffset = 60 / 1024;
            var voffset = 26 / 1024;
            // Second island should have margin, not to touch the first island
            // avoid any borderline artefact in pixel rounding
            var island_u_offset = -40 / 1024;
            var island_v_offset = +20 / 1024;
            // face is either island 0 or 1 :
            // second island is for faces : [4, 7, 8, 12, 13, 16, 17, 18]
            var island = [
                0, 0, 0, 0, 1,
                0, 0, 1, 1, 0,
                0, 0, 1, 1, 0,
                0, 1, 1, 1, 0 //  15 - 19
            ];
            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];
            var current_indice = 0;
            // prepare array of 3 vector (empty) (to be worked in place, shared for each face)
            var face_vertex_pos = new Array(3);
            var face_vertex_uv = new Array(3);
            var v012;
            for (v012 = 0; v012 < 3; v012++) {
                face_vertex_pos[v012] = BABYLON.Vector3.Zero();
                face_vertex_uv[v012] = BABYLON.Vector2.Zero();
            }
            // create all with normals
            for (var face = 0; face < 20; face++) {
                // 3 vertex per face
                for (v012 = 0; v012 < 3; v012++) {
                    // look up vertex 0,1,2 to its index in 0 to 11 (or 23 including alias)
                    var v_id = ico_indices[3 * face + v012];
                    // vertex have 3D position (x,y,z)
                    face_vertex_pos[v012].copyFromFloats(ico_vertices[3 * vertices_unalias_id[v_id]], ico_vertices[3 * vertices_unalias_id[v_id] + 1], ico_vertices[3 * vertices_unalias_id[v_id] + 2]);
                    // Normalize to get normal, then scale to radius
                    face_vertex_pos[v012].normalize().scaleInPlace(radius);
                    // uv Coordinates from vertex ID
                    face_vertex_uv[v012].copyFromFloats(ico_vertexuv[2 * v_id] * ustep + uoffset + island[face] * island_u_offset, ico_vertexuv[2 * v_id + 1] * vstep + voffset + island[face] * island_v_offset);
                }
                // Subdivide the face (interpolate pos, norm, uv)
                // - pos is linear interpolation, then projected to sphere (converge polyhedron to sphere)
                // - norm is linear interpolation of vertex corner normal
                //   (to be checked if better to re-calc from face vertex, or if approximation is OK ??? )
                // - uv is linear interpolation
                //
                // Topology is as below for sub-divide by 2
                // vertex shown as v0,v1,v2
                // interp index is i1 to progress in range [v0,v1[
                // interp index is i2 to progress in range [v0,v2[
                // face index as  (i1,i2)  for /\  : (i1,i2),(i1+1,i2),(i1,i2+1)
                //            and (i1,i2)' for \/  : (i1+1,i2),(i1+1,i2+1),(i1,i2+1)
                //
                //
                //                    i2    v2
                //                    ^    ^
                //                   /    / \
                //                  /    /   \
                //                 /    /     \
                //                /    / (0,1) \
                //               /    #---------\
                //              /    / \ (0,0)'/ \
                //             /    /   \     /   \
                //            /    /     \   /     \
                //           /    / (0,0) \ / (1,0) \
                //          /    #---------#---------\
                //              v0                    v1
                //
                //              --------------------> i1
                //
                // interp of (i1,i2):
                //  along i2 :  x0=lerp(v0,v2, i2/S) <---> x1=lerp(v1,v2, i2/S)
                //  along i1 :  lerp(x0,x1, i1/(S-i2))
                //
                // centroid of triangle is needed to get help normal computation
                //  (c1,c2) are used for centroid location
                var interp_vertex = function (i1, i2, c1, c2) {
                    // vertex is interpolated from
                    //   - face_vertex_pos[0..2]
                    //   - face_vertex_uv[0..2]
                    var pos_x0 = BABYLON.Vector3.Lerp(face_vertex_pos[0], face_vertex_pos[2], i2 / subdivisions);
                    var pos_x1 = BABYLON.Vector3.Lerp(face_vertex_pos[1], face_vertex_pos[2], i2 / subdivisions);
                    var pos_interp = (subdivisions === i2) ? face_vertex_pos[2] : BABYLON.Vector3.Lerp(pos_x0, pos_x1, i1 / (subdivisions - i2));
                    pos_interp.normalize();
                    var vertex_normal;
                    if (flat) {
                        // in flat mode, recalculate normal as face centroid normal
                        var centroid_x0 = BABYLON.Vector3.Lerp(face_vertex_pos[0], face_vertex_pos[2], c2 / subdivisions);
                        var centroid_x1 = BABYLON.Vector3.Lerp(face_vertex_pos[1], face_vertex_pos[2], c2 / subdivisions);
                        vertex_normal = BABYLON.Vector3.Lerp(centroid_x0, centroid_x1, c1 / (subdivisions - c2));
                    }
                    else {
                        // in smooth mode, recalculate normal from each single vertex position
                        vertex_normal = new BABYLON.Vector3(pos_interp.x, pos_interp.y, pos_interp.z);
                    }
                    // Vertex normal need correction due to X,Y,Z radius scaling
                    vertex_normal.x /= radiusX;
                    vertex_normal.y /= radiusY;
                    vertex_normal.z /= radiusZ;
                    vertex_normal.normalize();
                    var uv_x0 = BABYLON.Vector2.Lerp(face_vertex_uv[0], face_vertex_uv[2], i2 / subdivisions);
                    var uv_x1 = BABYLON.Vector2.Lerp(face_vertex_uv[1], face_vertex_uv[2], i2 / subdivisions);
                    var uv_interp = (subdivisions === i2) ? face_vertex_uv[2] : BABYLON.Vector2.Lerp(uv_x0, uv_x1, i1 / (subdivisions - i2));
                    positions.push(pos_interp.x * radiusX, pos_interp.y * radiusY, pos_interp.z * radiusZ);
                    normals.push(vertex_normal.x, vertex_normal.y, vertex_normal.z);
                    uvs.push(uv_interp.x, uv_interp.y);
                    // push each vertex has member of a face
                    // Same vertex can bleong to multiple face, it is pushed multiple time (duplicate vertex are present)
                    indices.push(current_indice);
                    current_indice++;
                };
                for (var i2 = 0; i2 < subdivisions; i2++) {
                    for (var i1 = 0; i1 + i2 < subdivisions; i1++) {
                        // face : (i1,i2)  for /\  :
                        // interp for : (i1,i2),(i1+1,i2),(i1,i2+1)
                        interp_vertex(i1, i2, i1 + 1.0 / 3, i2 + 1.0 / 3);
                        interp_vertex(i1 + 1, i2, i1 + 1.0 / 3, i2 + 1.0 / 3);
                        interp_vertex(i1, i2 + 1, i1 + 1.0 / 3, i2 + 1.0 / 3);
                        if (i1 + i2 + 1 < subdivisions) {
                            // face : (i1,i2)' for \/  :
                            // interp for (i1+1,i2),(i1+1,i2+1),(i1,i2+1)
                            interp_vertex(i1 + 1, i2, i1 + 2.0 / 3, i2 + 2.0 / 3);
                            interp_vertex(i1 + 1, i2 + 1, i1 + 2.0 / 3, i2 + 2.0 / 3);
                            interp_vertex(i1, i2 + 1, i1 + 2.0 / 3, i2 + 2.0 / 3);
                        }
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
        // inspired from // http://stemkoski.github.io/Three.js/Polyhedra.html
        VertexData.CreatePolyhedron = function (options) {
            // provided polyhedron types :
            // 0 : Tetrahedron, 1 : Octahedron, 2 : Dodecahedron, 3 : Icosahedron, 4 : Rhombicuboctahedron, 5 : Triangular Prism, 6 : Pentagonal Prism, 7 : Hexagonal Prism, 8 : Square Pyramid (J1)
            // 9 : Pentagonal Pyramid (J2), 10 : Triangular Dipyramid (J12), 11 : Pentagonal Dipyramid (J13), 12 : Elongated Square Dipyramid (J15), 13 : Elongated Pentagonal Dipyramid (J16), 14 : Elongated Pentagonal Cupola (J20)
            var polyhedra = [];
            polyhedra[0] = { vertex: [[0, 0, 1.732051], [1.632993, 0, -0.5773503], [-0.8164966, 1.414214, -0.5773503], [-0.8164966, -1.414214, -0.5773503]], face: [[0, 1, 2], [0, 2, 3], [0, 3, 1], [1, 3, 2]] };
            polyhedra[1] = { vertex: [[0, 0, 1.414214], [1.414214, 0, 0], [0, 1.414214, 0], [-1.414214, 0, 0], [0, -1.414214, 0], [0, 0, -1.414214]], face: [[0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1], [1, 4, 5], [1, 5, 2], [2, 5, 3], [3, 5, 4]] };
            polyhedra[2] = {
                vertex: [[0, 0, 1.070466], [0.7136442, 0, 0.7978784], [-0.3568221, 0.618034, 0.7978784], [-0.3568221, -0.618034, 0.7978784], [0.7978784, 0.618034, 0.3568221], [0.7978784, -0.618034, 0.3568221], [-0.9341724, 0.381966, 0.3568221], [0.1362939, 1, 0.3568221], [0.1362939, -1, 0.3568221], [-0.9341724, -0.381966, 0.3568221], [0.9341724, 0.381966, -0.3568221], [0.9341724, -0.381966, -0.3568221], [-0.7978784, 0.618034, -0.3568221], [-0.1362939, 1, -0.3568221], [-0.1362939, -1, -0.3568221], [-0.7978784, -0.618034, -0.3568221], [0.3568221, 0.618034, -0.7978784], [0.3568221, -0.618034, -0.7978784], [-0.7136442, 0, -0.7978784], [0, 0, -1.070466]],
                face: [[0, 1, 4, 7, 2], [0, 2, 6, 9, 3], [0, 3, 8, 5, 1], [1, 5, 11, 10, 4], [2, 7, 13, 12, 6], [3, 9, 15, 14, 8], [4, 10, 16, 13, 7], [5, 8, 14, 17, 11], [6, 12, 18, 15, 9], [10, 11, 17, 19, 16], [12, 13, 16, 19, 18], [14, 15, 18, 19, 17]]
            };
            polyhedra[3] = {
                vertex: [[0, 0, 1.175571], [1.051462, 0, 0.5257311], [0.3249197, 1, 0.5257311], [-0.8506508, 0.618034, 0.5257311], [-0.8506508, -0.618034, 0.5257311], [0.3249197, -1, 0.5257311], [0.8506508, 0.618034, -0.5257311], [0.8506508, -0.618034, -0.5257311], [-0.3249197, 1, -0.5257311], [-1.051462, 0, -0.5257311], [-0.3249197, -1, -0.5257311], [0, 0, -1.175571]],
                face: [[0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 5], [0, 5, 1], [1, 5, 7], [1, 7, 6], [1, 6, 2], [2, 6, 8], [2, 8, 3], [3, 8, 9], [3, 9, 4], [4, 9, 10], [4, 10, 5], [5, 10, 7], [6, 7, 11], [6, 11, 8], [7, 10, 11], [8, 11, 9], [9, 11, 10]]
            };
            polyhedra[4] = {
                vertex: [[0, 0, 1.070722], [0.7148135, 0, 0.7971752], [-0.104682, 0.7071068, 0.7971752], [-0.6841528, 0.2071068, 0.7971752], [-0.104682, -0.7071068, 0.7971752], [0.6101315, 0.7071068, 0.5236279], [1.04156, 0.2071068, 0.1367736], [0.6101315, -0.7071068, 0.5236279], [-0.3574067, 1, 0.1367736], [-0.7888348, -0.5, 0.5236279], [-0.9368776, 0.5, 0.1367736], [-0.3574067, -1, 0.1367736], [0.3574067, 1, -0.1367736], [0.9368776, -0.5, -0.1367736], [0.7888348, 0.5, -0.5236279], [0.3574067, -1, -0.1367736], [-0.6101315, 0.7071068, -0.5236279], [-1.04156, -0.2071068, -0.1367736], [-0.6101315, -0.7071068, -0.5236279], [0.104682, 0.7071068, -0.7971752], [0.6841528, -0.2071068, -0.7971752], [0.104682, -0.7071068, -0.7971752], [-0.7148135, 0, -0.7971752], [0, 0, -1.070722]],
                face: [[0, 2, 3], [1, 6, 5], [4, 9, 11], [7, 15, 13], [8, 16, 10], [12, 14, 19], [17, 22, 18], [20, 21, 23], [0, 1, 5, 2], [0, 3, 9, 4], [0, 4, 7, 1], [1, 7, 13, 6], [2, 5, 12, 8], [2, 8, 10, 3], [3, 10, 17, 9], [4, 11, 15, 7], [5, 6, 14, 12], [6, 13, 20, 14], [8, 12, 19, 16], [9, 17, 18, 11], [10, 16, 22, 17], [11, 18, 21, 15], [13, 15, 21, 20], [14, 20, 23, 19], [16, 19, 23, 22], [18, 22, 23, 21]]
            };
            polyhedra[5] = { vertex: [[0, 0, 1.322876], [1.309307, 0, 0.1889822], [-0.9819805, 0.8660254, 0.1889822], [0.1636634, -1.299038, 0.1889822], [0.3273268, 0.8660254, -0.9449112], [-0.8183171, -0.4330127, -0.9449112]], face: [[0, 3, 1], [2, 4, 5], [0, 1, 4, 2], [0, 2, 5, 3], [1, 3, 5, 4]] };
            polyhedra[6] = { vertex: [[0, 0, 1.159953], [1.013464, 0, 0.5642542], [-0.3501431, 0.9510565, 0.5642542], [-0.7715208, -0.6571639, 0.5642542], [0.6633206, 0.9510565, -0.03144481], [0.8682979, -0.6571639, -0.3996071], [-1.121664, 0.2938926, -0.03144481], [-0.2348831, -1.063314, -0.3996071], [0.5181548, 0.2938926, -0.9953061], [-0.5850262, -0.112257, -0.9953061]], face: [[0, 1, 4, 2], [0, 2, 6, 3], [1, 5, 8, 4], [3, 6, 9, 7], [5, 7, 9, 8], [0, 3, 7, 5, 1], [2, 4, 8, 9, 6]] };
            polyhedra[7] = { vertex: [[0, 0, 1.118034], [0.8944272, 0, 0.6708204], [-0.2236068, 0.8660254, 0.6708204], [-0.7826238, -0.4330127, 0.6708204], [0.6708204, 0.8660254, 0.2236068], [1.006231, -0.4330127, -0.2236068], [-1.006231, 0.4330127, 0.2236068], [-0.6708204, -0.8660254, -0.2236068], [0.7826238, 0.4330127, -0.6708204], [0.2236068, -0.8660254, -0.6708204], [-0.8944272, 0, -0.6708204], [0, 0, -1.118034]], face: [[0, 1, 4, 2], [0, 2, 6, 3], [1, 5, 8, 4], [3, 6, 10, 7], [5, 9, 11, 8], [7, 10, 11, 9], [0, 3, 7, 9, 5, 1], [2, 4, 8, 11, 10, 6]] };
            polyhedra[8] = { vertex: [[-0.729665, 0.670121, 0.319155], [-0.655235, -0.29213, -0.754096], [-0.093922, -0.607123, 0.537818], [0.702196, 0.595691, 0.485187], [0.776626, -0.36656, -0.588064]], face: [[1, 4, 2], [0, 1, 2], [3, 0, 2], [4, 3, 2], [4, 1, 0, 3]] };
            polyhedra[9] = { vertex: [[-0.868849, -0.100041, 0.61257], [-0.329458, 0.976099, 0.28078], [-0.26629, -0.013796, -0.477654], [-0.13392, -1.034115, 0.229829], [0.738834, 0.707117, -0.307018], [0.859683, -0.535264, -0.338508]], face: [[3, 0, 2], [5, 3, 2], [4, 5, 2], [1, 4, 2], [0, 1, 2], [0, 3, 5, 4, 1]] };
            polyhedra[10] = { vertex: [[-0.610389, 0.243975, 0.531213], [-0.187812, -0.48795, -0.664016], [-0.187812, 0.9759, -0.664016], [0.187812, -0.9759, 0.664016], [0.798201, 0.243975, 0.132803]], face: [[1, 3, 0], [3, 4, 0], [3, 1, 4], [0, 2, 1], [0, 4, 2], [2, 4, 1]] };
            polyhedra[11] = { vertex: [[-1.028778, 0.392027, -0.048786], [-0.640503, -0.646161, 0.621837], [-0.125162, -0.395663, -0.540059], [0.004683, 0.888447, -0.651988], [0.125161, 0.395663, 0.540059], [0.632925, -0.791376, 0.433102], [1.031672, 0.157063, -0.354165]], face: [[3, 2, 0], [2, 1, 0], [2, 5, 1], [0, 4, 3], [0, 1, 4], [4, 1, 5], [2, 3, 6], [3, 4, 6], [5, 2, 6], [4, 5, 6]] };
            polyhedra[12] = { vertex: [[-0.669867, 0.334933, -0.529576], [-0.669867, 0.334933, 0.529577], [-0.4043, 1.212901, 0], [-0.334933, -0.669867, -0.529576], [-0.334933, -0.669867, 0.529577], [0.334933, 0.669867, -0.529576], [0.334933, 0.669867, 0.529577], [0.4043, -1.212901, 0], [0.669867, -0.334933, -0.529576], [0.669867, -0.334933, 0.529577]], face: [[8, 9, 7], [6, 5, 2], [3, 8, 7], [5, 0, 2], [4, 3, 7], [0, 1, 2], [9, 4, 7], [1, 6, 2], [9, 8, 5, 6], [8, 3, 0, 5], [3, 4, 1, 0], [4, 9, 6, 1]] };
            polyhedra[13] = { vertex: [[-0.931836, 0.219976, -0.264632], [-0.636706, 0.318353, 0.692816], [-0.613483, -0.735083, -0.264632], [-0.326545, 0.979634, 0], [-0.318353, -0.636706, 0.692816], [-0.159176, 0.477529, -0.856368], [0.159176, -0.477529, -0.856368], [0.318353, 0.636706, 0.692816], [0.326545, -0.979634, 0], [0.613482, 0.735082, -0.264632], [0.636706, -0.318353, 0.692816], [0.931835, -0.219977, -0.264632]], face: [[11, 10, 8], [7, 9, 3], [6, 11, 8], [9, 5, 3], [2, 6, 8], [5, 0, 3], [4, 2, 8], [0, 1, 3], [10, 4, 8], [1, 7, 3], [10, 11, 9, 7], [11, 6, 5, 9], [6, 2, 0, 5], [2, 4, 1, 0], [4, 10, 7, 1]] };
            polyhedra[14] = {
                vertex: [[-0.93465, 0.300459, -0.271185], [-0.838689, -0.260219, -0.516017], [-0.711319, 0.717591, 0.128359], [-0.710334, -0.156922, 0.080946], [-0.599799, 0.556003, -0.725148], [-0.503838, -0.004675, -0.969981], [-0.487004, 0.26021, 0.48049], [-0.460089, -0.750282, -0.512622], [-0.376468, 0.973135, -0.325605], [-0.331735, -0.646985, 0.084342], [-0.254001, 0.831847, 0.530001], [-0.125239, -0.494738, -0.966586], [0.029622, 0.027949, 0.730817], [0.056536, -0.982543, -0.262295], [0.08085, 1.087391, 0.076037], [0.125583, -0.532729, 0.485984], [0.262625, 0.599586, 0.780328], [0.391387, -0.726999, -0.716259], [0.513854, -0.868287, 0.139347], [0.597475, 0.85513, 0.326364], [0.641224, 0.109523, 0.783723], [0.737185, -0.451155, 0.538891], [0.848705, -0.612742, -0.314616], [0.976075, 0.365067, 0.32976], [1.072036, -0.19561, 0.084927]],
                face: [[15, 18, 21], [12, 20, 16], [6, 10, 2], [3, 0, 1], [9, 7, 13], [2, 8, 4, 0], [0, 4, 5, 1], [1, 5, 11, 7], [7, 11, 17, 13], [13, 17, 22, 18], [18, 22, 24, 21], [21, 24, 23, 20], [20, 23, 19, 16], [16, 19, 14, 10], [10, 14, 8, 2], [15, 9, 13, 18], [12, 15, 21, 20], [6, 12, 16, 10], [3, 6, 2, 0], [9, 3, 1, 7], [9, 15, 12, 6, 3], [22, 17, 11, 5, 4, 8, 14, 19, 23, 24]]
            };
            var type = (options.type < 0 || options.type >= polyhedra.length) ? 0 : options.type || 0;
            var size = options.size;
            var sizeX = options.sizeX || size || 1;
            var sizeY = options.sizeY || size || 1;
            var sizeZ = options.sizeZ || size || 1;
            var data = options.custom || polyhedra[type];
            var nbfaces = data.face.length;
            var faceUV = options.faceUV || new Array(nbfaces);
            var faceColors = options.faceColors;
            var flat = (options.flat === undefined) ? true : options.flat;
            var sideOrientation = (options.sideOrientation === 0) ? 0 : options.sideOrientation || BABYLON.Mesh.DEFAULTSIDE;
            var positions = [];
            var indices = [];
            var normals = [];
            var uvs = [];
            var colors = [];
            var index = 0;
            var faceIdx = 0; // face cursor in the array "indexes"
            var indexes = [];
            var i = 0;
            var f = 0;
            var u, v, ang, x, y, tmp;
            // default face colors and UV if undefined
            if (flat) {
                for (f = 0; f < nbfaces; f++) {
                    if (faceColors && faceColors[f] === undefined) {
                        faceColors[f] = new BABYLON.Color4(1, 1, 1, 1);
                    }
                    if (faceUV && faceUV[f] === undefined) {
                        faceUV[f] = new BABYLON.Vector4(0, 0, 1, 1);
                    }
                }
            }
            if (!flat) {
                for (i = 0; i < data.vertex.length; i++) {
                    positions.push(data.vertex[i][0] * sizeX, data.vertex[i][1] * sizeY, data.vertex[i][2] * sizeZ);
                    uvs.push(0, 0);
                }
                for (f = 0; f < nbfaces; f++) {
                    for (i = 0; i < data.face[f].length - 2; i++) {
                        indices.push(data.face[f][0], data.face[f][i + 2], data.face[f][i + 1]);
                    }
                }
            }
            else {
                for (f = 0; f < nbfaces; f++) {
                    var fl = data.face[f].length; // number of vertices of the current face
                    ang = 2 * Math.PI / fl;
                    x = 0.5 * Math.tan(ang / 2);
                    y = 0.5;
                    // positions, uvs, colors
                    for (i = 0; i < fl; i++) {
                        // positions
                        positions.push(data.vertex[data.face[f][i]][0] * sizeX, data.vertex[data.face[f][i]][1] * sizeY, data.vertex[data.face[f][i]][2] * sizeZ);
                        indexes.push(index);
                        index++;
                        // uvs
                        u = faceUV[f].x + (faceUV[f].z - faceUV[f].x) * (0.5 + x);
                        v = faceUV[f].y + (faceUV[f].w - faceUV[f].y) * (y - 0.5);
                        uvs.push(u, v);
                        tmp = x * Math.cos(ang) - y * Math.sin(ang);
                        y = x * Math.sin(ang) + y * Math.cos(ang);
                        x = tmp;
                        // colors
                        if (faceColors) {
                            colors.push(faceColors[f].r, faceColors[f].g, faceColors[f].b, faceColors[f].a);
                        }
                    }
                    // indices from indexes
                    for (i = 0; i < fl - 2; i++) {
                        indices.push(indexes[0 + faceIdx], indexes[i + 2 + faceIdx], indexes[i + 1 + faceIdx]);
                    }
                    faceIdx += fl;
                }
            }
            VertexData.ComputeNormals(positions, indices, normals);
            VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs);
            var vertexData = new VertexData();
            vertexData.positions = positions;
            vertexData.indices = indices;
            vertexData.normals = normals;
            vertexData.uvs = uvs;
            if (faceColors && flat) {
                vertexData.colors = colors;
            }
            return vertexData;
        };
        // based on http://code.google.com/p/away3d/source/browse/trunk/fp10/Away3D/src/away3d/primitives/TorusKnot.as?spec=svn2473&r=2473
        VertexData.CreateTorusKnot = function (options) {
            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];
            var radius = options.radius || 2;
            var tube = options.tube || 0.5;
            var radialSegments = options.radialSegments || 32;
            var tubularSegments = options.tubularSegments || 32;
            var p = options.p || 2;
            var q = options.q || 3;
            var sideOrientation = (options.sideOrientation === 0) ? 0 : options.sideOrientation || BABYLON.Mesh.DEFAULTSIDE;
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
            var i;
            var j;
            for (i = 0; i <= radialSegments; i++) {
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
                for (j = 0; j < tubularSegments; j++) {
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
            var p1p2x = 0.0;
            var p1p2y = 0.0;
            var p1p2z = 0.0;
            var p3p2x = 0.0;
            var p3p2y = 0.0;
            var p3p2z = 0.0;
            var faceNormalx = 0.0;
            var faceNormaly = 0.0;
            var faceNormalz = 0.0;
            var length = 0.0;
            var i1 = 0;
            var i2 = 0;
            var i3 = 0;
            for (index = 0; index < positions.length; index++) {
                normals[index] = 0.0;
            }
            // indice triplet = 1 face
            var nbFaces = indices.length / 3;
            for (index = 0; index < nbFaces; index++) {
                i1 = indices[index * 3]; // get the indexes of each vertex of the face
                i2 = indices[index * 3 + 1];
                i3 = indices[index * 3 + 2];
                p1p2x = positions[i1 * 3] - positions[i2 * 3]; // compute two vectors per face
                p1p2y = positions[i1 * 3 + 1] - positions[i2 * 3 + 1];
                p1p2z = positions[i1 * 3 + 2] - positions[i2 * 3 + 2];
                p3p2x = positions[i3 * 3] - positions[i2 * 3];
                p3p2y = positions[i3 * 3 + 1] - positions[i2 * 3 + 1];
                p3p2z = positions[i3 * 3 + 2] - positions[i2 * 3 + 2];
                faceNormalx = p1p2y * p3p2z - p1p2z * p3p2y; // compute the face normal with cross product
                faceNormaly = p1p2z * p3p2x - p1p2x * p3p2z;
                faceNormalz = p1p2x * p3p2y - p1p2y * p3p2x;
                length = Math.sqrt(faceNormalx * faceNormalx + faceNormaly * faceNormaly + faceNormalz * faceNormalz);
                length = (length === 0) ? 1.0 : length;
                faceNormalx /= length; // normalize this normal
                faceNormaly /= length;
                faceNormalz /= length;
                normals[i1 * 3] += faceNormalx; // accumulate all the normals per face
                normals[i1 * 3 + 1] += faceNormaly;
                normals[i1 * 3 + 2] += faceNormalz;
                normals[i2 * 3] += faceNormalx;
                normals[i2 * 3 + 1] += faceNormaly;
                normals[i2 * 3 + 2] += faceNormalz;
                normals[i3 * 3] += faceNormalx;
                normals[i3 * 3 + 1] += faceNormaly;
                normals[i3 * 3 + 2] += faceNormalz;
            }
            // last normalization of each normal
            for (index = 0; index < normals.length / 3; index++) {
                faceNormalx = normals[index * 3];
                faceNormaly = normals[index * 3 + 1];
                faceNormalz = normals[index * 3 + 2];
                length = Math.sqrt(faceNormalx * faceNormalx + faceNormaly * faceNormaly + faceNormalz * faceNormalz);
                length = (length === 0) ? 1.0 : length;
                faceNormalx /= length;
                faceNormaly /= length;
                faceNormalz /= length;
                normals[index * 3] = faceNormalx;
                normals[index * 3 + 1] = faceNormaly;
                normals[index * 3 + 2] = faceNormalz;
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
        VertexData.ImportVertexData = function (parsedVertexData, geometry) {
            var vertexData = new VertexData();
            // positions
            var positions = parsedVertexData.positions;
            if (positions) {
                vertexData.set(positions, BABYLON.VertexBuffer.PositionKind);
            }
            // normals
            var normals = parsedVertexData.normals;
            if (normals) {
                vertexData.set(normals, BABYLON.VertexBuffer.NormalKind);
            }
            // uvs
            var uvs = parsedVertexData.uvs;
            if (uvs) {
                vertexData.set(uvs, BABYLON.VertexBuffer.UVKind);
            }
            // uv2s
            var uv2s = parsedVertexData.uv2s;
            if (uv2s) {
                vertexData.set(uv2s, BABYLON.VertexBuffer.UV2Kind);
            }
            // uv3s
            var uv3s = parsedVertexData.uv3s;
            if (uv3s) {
                vertexData.set(uv3s, BABYLON.VertexBuffer.UV3Kind);
            }
            // uv4s
            var uv4s = parsedVertexData.uv4s;
            if (uv4s) {
                vertexData.set(uv4s, BABYLON.VertexBuffer.UV4Kind);
            }
            // uv5s
            var uv5s = parsedVertexData.uv5s;
            if (uv5s) {
                vertexData.set(uv5s, BABYLON.VertexBuffer.UV5Kind);
            }
            // uv6s
            var uv6s = parsedVertexData.uv6s;
            if (uv6s) {
                vertexData.set(uv6s, BABYLON.VertexBuffer.UV6Kind);
            }
            // colors
            var colors = parsedVertexData.colors;
            if (colors) {
                vertexData.set(BABYLON.Color4.CheckColors4(colors, positions.length / 3), BABYLON.VertexBuffer.ColorKind);
            }
            // matricesIndices
            var matricesIndices = parsedVertexData.matricesIndices;
            if (matricesIndices) {
                vertexData.set(matricesIndices, BABYLON.VertexBuffer.MatricesIndicesKind);
            }
            // matricesWeights
            var matricesWeights = parsedVertexData.matricesWeights;
            if (matricesWeights) {
                vertexData.set(matricesWeights, BABYLON.VertexBuffer.MatricesWeightsKind);
            }
            // indices
            var indices = parsedVertexData.indices;
            if (indices) {
                vertexData.indices = indices;
            }
            geometry.setAllVerticesData(vertexData, parsedVertexData.updatable);
        };
        return VertexData;
    })();
    BABYLON.VertexData = VertexData;
})(BABYLON || (BABYLON = {}));
