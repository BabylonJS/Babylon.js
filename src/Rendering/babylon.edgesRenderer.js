var BABYLON;
(function (BABYLON) {
    var FaceAdjacencies = (function () {
        function FaceAdjacencies() {
            this.edges = new Array();
            this.edgesConnectedCount = 0;
        }
        return FaceAdjacencies;
    })();
    var EdgesRenderer = (function () {
        // Beware when you use this class with complex objects as the adjacencies computation can be really long
        function EdgesRenderer(source, epsilon, checkVerticesInsteadOfIndices) {
            if (epsilon === void 0) { epsilon = 0.95; }
            if (checkVerticesInsteadOfIndices === void 0) { checkVerticesInsteadOfIndices = false; }
            this.edgesWidthScalerForOrthographic = 1000.0;
            this.edgesWidthScalerForPerspective = 50.0;
            this._linesPositions = new Array();
            this._linesNormals = new Array();
            this._linesIndices = new Array();
            this._buffers = new Array();
            this._checkVerticesInsteadOfIndices = false;
            this._source = source;
            this._checkVerticesInsteadOfIndices = checkVerticesInsteadOfIndices;
            this._epsilon = epsilon;
            this._prepareRessources();
            this._generateEdgesLines();
        }
        EdgesRenderer.prototype._prepareRessources = function () {
            if (this._lineShader) {
                return;
            }
            this._lineShader = new BABYLON.ShaderMaterial("lineShader", this._source.getScene(), "line", {
                attributes: ["position", "normal"],
                uniforms: ["worldViewProjection", "color", "width", "aspectRatio"]
            });
            this._lineShader.disableDepthWrite = true;
            this._lineShader.backFaceCulling = false;
        };
        EdgesRenderer.prototype.dispose = function () {
            this._vb0.dispose();
            this._vb1.dispose();
            this._source.getScene().getEngine()._releaseBuffer(this._ib);
            this._lineShader.dispose();
        };
        EdgesRenderer.prototype._processEdgeForAdjacencies = function (pa, pb, p0, p1, p2) {
            if (pa === p0 && pb === p1 || pa === p1 && pb === p0) {
                return 0;
            }
            if (pa === p1 && pb === p2 || pa === p2 && pb === p1) {
                return 1;
            }
            if (pa === p2 && pb === p0 || pa === p0 && pb === p2) {
                return 2;
            }
            return -1;
        };
        EdgesRenderer.prototype._processEdgeForAdjacenciesWithVertices = function (pa, pb, p0, p1, p2) {
            if (pa.equalsWithEpsilon(p0) && pb.equalsWithEpsilon(p1) || pa.equalsWithEpsilon(p1) && pb.equalsWithEpsilon(p0)) {
                return 0;
            }
            if (pa.equalsWithEpsilon(p1) && pb.equalsWithEpsilon(p2) || pa.equalsWithEpsilon(p2) && pb.equalsWithEpsilon(p1)) {
                return 1;
            }
            if (pa.equalsWithEpsilon(p2) && pb.equalsWithEpsilon(p0) || pa.equalsWithEpsilon(p0) && pb.equalsWithEpsilon(p2)) {
                return 2;
            }
            return -1;
        };
        EdgesRenderer.prototype._checkEdge = function (faceIndex, edge, faceNormals, p0, p1) {
            var needToCreateLine;
            if (edge === undefined) {
                needToCreateLine = true;
            }
            else {
                var dotProduct = BABYLON.Vector3.Dot(faceNormals[faceIndex], faceNormals[edge]);
                needToCreateLine = dotProduct < this._epsilon;
            }
            if (needToCreateLine) {
                var offset = this._linesPositions.length / 3;
                var normal = p0.subtract(p1);
                normal.normalize();
                // Positions
                this._linesPositions.push(p0.x);
                this._linesPositions.push(p0.y);
                this._linesPositions.push(p0.z);
                this._linesPositions.push(p0.x);
                this._linesPositions.push(p0.y);
                this._linesPositions.push(p0.z);
                this._linesPositions.push(p1.x);
                this._linesPositions.push(p1.y);
                this._linesPositions.push(p1.z);
                this._linesPositions.push(p1.x);
                this._linesPositions.push(p1.y);
                this._linesPositions.push(p1.z);
                // Normals
                this._linesNormals.push(p1.x);
                this._linesNormals.push(p1.y);
                this._linesNormals.push(p1.z);
                this._linesNormals.push(-1);
                this._linesNormals.push(p1.x);
                this._linesNormals.push(p1.y);
                this._linesNormals.push(p1.z);
                this._linesNormals.push(1);
                this._linesNormals.push(p0.x);
                this._linesNormals.push(p0.y);
                this._linesNormals.push(p0.z);
                this._linesNormals.push(-1);
                this._linesNormals.push(p0.x);
                this._linesNormals.push(p0.y);
                this._linesNormals.push(p0.z);
                this._linesNormals.push(1);
                // Indices
                this._linesIndices.push(offset);
                this._linesIndices.push(offset + 1);
                this._linesIndices.push(offset + 2);
                this._linesIndices.push(offset);
                this._linesIndices.push(offset + 2);
                this._linesIndices.push(offset + 3);
            }
        };
        EdgesRenderer.prototype._generateEdgesLines = function () {
            var positions = this._source.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            var indices = this._source.getIndices();
            // First let's find adjacencies
            var adjacencies = new Array();
            var faceNormals = new Array();
            var index;
            var faceAdjacencies;
            // Prepare faces
            for (index = 0; index < indices.length; index += 3) {
                faceAdjacencies = new FaceAdjacencies();
                var p0Index = indices[index];
                var p1Index = indices[index + 1];
                var p2Index = indices[index + 2];
                faceAdjacencies.p0 = new BABYLON.Vector3(positions[p0Index * 3], positions[p0Index * 3 + 1], positions[p0Index * 3 + 2]);
                faceAdjacencies.p1 = new BABYLON.Vector3(positions[p1Index * 3], positions[p1Index * 3 + 1], positions[p1Index * 3 + 2]);
                faceAdjacencies.p2 = new BABYLON.Vector3(positions[p2Index * 3], positions[p2Index * 3 + 1], positions[p2Index * 3 + 2]);
                var faceNormal = BABYLON.Vector3.Cross(faceAdjacencies.p1.subtract(faceAdjacencies.p0), faceAdjacencies.p2.subtract(faceAdjacencies.p1));
                faceNormal.normalize();
                faceNormals.push(faceNormal);
                adjacencies.push(faceAdjacencies);
            }
            // Scan
            for (index = 0; index < adjacencies.length; index++) {
                faceAdjacencies = adjacencies[index];
                for (var otherIndex = index + 1; otherIndex < adjacencies.length; otherIndex++) {
                    var otherFaceAdjacencies = adjacencies[otherIndex];
                    if (faceAdjacencies.edgesConnectedCount === 3) {
                        break;
                    }
                    if (otherFaceAdjacencies.edgesConnectedCount === 3) {
                        continue;
                    }
                    var otherP0 = indices[otherIndex * 3];
                    var otherP1 = indices[otherIndex * 3 + 1];
                    var otherP2 = indices[otherIndex * 3 + 2];
                    for (var edgeIndex = 0; edgeIndex < 3; edgeIndex++) {
                        var otherEdgeIndex;
                        if (faceAdjacencies.edges[edgeIndex] !== undefined) {
                            continue;
                        }
                        switch (edgeIndex) {
                            case 0:
                                if (this._checkVerticesInsteadOfIndices) {
                                    otherEdgeIndex = this._processEdgeForAdjacenciesWithVertices(faceAdjacencies.p0, faceAdjacencies.p1, otherFaceAdjacencies.p0, otherFaceAdjacencies.p1, otherFaceAdjacencies.p2);
                                }
                                else {
                                    otherEdgeIndex = this._processEdgeForAdjacencies(indices[index * 3], indices[index * 3 + 1], otherP0, otherP1, otherP2);
                                }
                                break;
                            case 1:
                                if (this._checkVerticesInsteadOfIndices) {
                                    otherEdgeIndex = this._processEdgeForAdjacenciesWithVertices(faceAdjacencies.p1, faceAdjacencies.p2, otherFaceAdjacencies.p0, otherFaceAdjacencies.p1, otherFaceAdjacencies.p2);
                                }
                                else {
                                    otherEdgeIndex = this._processEdgeForAdjacencies(indices[index * 3 + 1], indices[index * 3 + 2], otherP0, otherP1, otherP2);
                                }
                                break;
                            case 2:
                                if (this._checkVerticesInsteadOfIndices) {
                                    otherEdgeIndex = this._processEdgeForAdjacenciesWithVertices(faceAdjacencies.p2, faceAdjacencies.p0, otherFaceAdjacencies.p0, otherFaceAdjacencies.p1, otherFaceAdjacencies.p2);
                                }
                                else {
                                    otherEdgeIndex = this._processEdgeForAdjacencies(indices[index * 3 + 2], indices[index * 3], otherP0, otherP1, otherP2);
                                }
                                break;
                        }
                        if (otherEdgeIndex === -1) {
                            continue;
                        }
                        faceAdjacencies.edges[edgeIndex] = otherIndex;
                        otherFaceAdjacencies.edges[otherEdgeIndex] = index;
                        faceAdjacencies.edgesConnectedCount++;
                        otherFaceAdjacencies.edgesConnectedCount++;
                        if (faceAdjacencies.edgesConnectedCount === 3) {
                            break;
                        }
                    }
                }
            }
            // Create lines
            for (index = 0; index < adjacencies.length; index++) {
                // We need a line when a face has no adjacency on a specific edge or if all the adjacencies has an angle greater than epsilon
                var current = adjacencies[index];
                this._checkEdge(index, current.edges[0], faceNormals, current.p0, current.p1);
                this._checkEdge(index, current.edges[1], faceNormals, current.p1, current.p2);
                this._checkEdge(index, current.edges[2], faceNormals, current.p2, current.p0);
            }
            // Merge into a single mesh
            var engine = this._source.getScene().getEngine();
            this._vb0 = new BABYLON.VertexBuffer(engine, this._linesPositions, BABYLON.VertexBuffer.PositionKind, false);
            this._vb1 = new BABYLON.VertexBuffer(engine, this._linesNormals, BABYLON.VertexBuffer.NormalKind, false, false, 4);
            this._buffers[BABYLON.VertexBuffer.PositionKind] = this._vb0;
            this._buffers[BABYLON.VertexBuffer.NormalKind] = this._vb1;
            this._ib = engine.createIndexBuffer(this._linesIndices);
            this._indicesCount = this._linesIndices.length;
        };
        EdgesRenderer.prototype.render = function () {
            if (!this._lineShader.isReady()) {
                return;
            }
            var scene = this._source.getScene();
            var engine = scene.getEngine();
            this._lineShader._preBind();
            // VBOs
            engine.bindMultiBuffers(this._buffers, this._ib, this._lineShader.getEffect());
            scene.resetCachedMaterial();
            this._lineShader.setColor4("color", this._source.edgesColor);
            if (scene.activeCamera.mode === BABYLON.Camera.ORTHOGRAPHIC_CAMERA) {
                this._lineShader.setFloat("width", this._source.edgesWidth / this.edgesWidthScalerForOrthographic);
            }
            else {
                this._lineShader.setFloat("width", this._source.edgesWidth / this.edgesWidthScalerForPerspective);
            }
            this._lineShader.setFloat("aspectRatio", engine.getAspectRatio(scene.activeCamera));
            this._lineShader.bind(this._source.getWorldMatrix());
            // Draw order
            engine.draw(true, 0, this._indicesCount);
            this._lineShader.unbind();
            engine.setDepthWrite(true);
        };
        return EdgesRenderer;
    })();
    BABYLON.EdgesRenderer = EdgesRenderer;
})(BABYLON || (BABYLON = {}));
