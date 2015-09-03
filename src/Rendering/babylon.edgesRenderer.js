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
        function EdgesRenderer(source) {
            this._lines = new Array();
            this._source = source;
            this._material = new BABYLON.StandardMaterial(this._source.name + "EdgeMaterial", this._source.getScene());
            this._material.emissiveColor = this._source.edgesColor;
            this._material.diffuseColor = BABYLON.Color3.Black();
            this._material.specularColor = BABYLON.Color3.Black();
            this._generateEdgesLines();
        }
        EdgesRenderer.prototype.dispose = function () {
            for (var index = 0; index < this._lines.length; index++) {
                this._lines[index].dispose();
            }
            this._lines = new Array();
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
        EdgesRenderer.prototype._checkEdge = function (faceIndex, edge, faceNormals, p0, p1) {
            var needToCreateLine;
            if (edge === undefined) {
                needToCreateLine = true;
            }
            else {
                var dotProduct = BABYLON.Vector3.Dot(faceNormals[faceIndex], faceNormals[edge]);
                needToCreateLine = dotProduct < this._source.edgesEpsilon;
            }
            if (needToCreateLine) {
                var scene = this._source.getScene();
                var lineMesh = BABYLON.Mesh.CreateTube(this._source.name + "edge", [p0, p1], this._source.edgesWidth / 100.0, 5, null, BABYLON.Mesh.CAP_ALL, scene, false, BABYLON.Mesh.DEFAULTSIDE);
                this._lines.push(lineMesh);
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
                    if (faceAdjacencies.edgesConnectedCount === 3) {
                        break;
                    }
                    var otherP0 = indices[otherIndex * 3];
                    var otherP1 = indices[otherIndex * 3 + 1];
                    var otherP2 = indices[otherIndex * 3 + 2];
                    for (var edgeIndex = 0; edgeIndex < 3; edgeIndex++) {
                        var otherEdgeIndex;
                        switch (edgeIndex) {
                            case 0:
                                otherEdgeIndex = this._processEdgeForAdjacencies(indices[index * 3], indices[index * 3 + 1], otherP0, otherP1, otherP2);
                                break;
                            case 1:
                                otherEdgeIndex = this._processEdgeForAdjacencies(indices[index * 3 + 1], indices[index * 3 + 2], otherP0, otherP1, otherP2);
                                break;
                            case 2:
                                otherEdgeIndex = this._processEdgeForAdjacencies(indices[index * 3 + 2], indices[index * 3], otherP0, otherP1, otherP2);
                                break;
                        }
                        if (otherEdgeIndex === -1) {
                            continue;
                        }
                        faceAdjacencies.edges[edgeIndex] = otherIndex;
                        adjacencies[otherIndex].edges[otherEdgeIndex] = index;
                        faceAdjacencies.edgesConnectedCount++;
                        adjacencies[otherIndex].edgesConnectedCount++;
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
            this._renderMesh = BABYLON.Mesh.MergeMeshes(this._lines, true, true);
            this._renderMesh.parent = this._source;
            this._renderMesh.material = this._material;
            this._renderMesh.name = this._source.name + "edge";
        };
        return EdgesRenderer;
    })();
    BABYLON.EdgesRenderer = EdgesRenderer;
})(BABYLON || (BABYLON = {}));
