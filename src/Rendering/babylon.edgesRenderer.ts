module BABYLON {

    class FaceAdjacencies {
        public edges = new Array<number>();
        public p0: Vector3;
        public p1: Vector3;
        public p2: Vector3;
        public edgesConnectedCount = 0;
    }

    export class EdgesRenderer {
        public edgesWidthScalerForOrthographic = 1000.0;
        public edgesWidthScalerForPerspective = 50.0;
        private _source: AbstractMesh;
        private _linesPositions = new Array<number>();
        private _linesNormals = new Array<number>();
        private _linesIndices = new Array<number>();
        private _epsilon: number;
        private _indicesCount: number;

        private _lineShader: ShaderMaterial;
        private _ib: WebGLBuffer;
        private _buffers: { [key: string]: VertexBuffer; } = {};
        private _checkVerticesInsteadOfIndices = false;

        // Beware when you use this class with complex objects as the adjacencies computation can be really long
        constructor(source: AbstractMesh, epsilon = 0.95, checkVerticesInsteadOfIndices = false) {
            this._source = source;
            this._checkVerticesInsteadOfIndices = checkVerticesInsteadOfIndices;

            this._epsilon = epsilon;

            this._prepareRessources();
            this._generateEdgesLines();
        }

        private _prepareRessources(): void {
            if (this._lineShader) {
                return;
            }

            this._lineShader = new ShaderMaterial("lineShader", this._source.getScene(), "line",
                {
                    attributes: ["position", "normal"],
                    uniforms: ["worldViewProjection", "color", "width", "aspectRatio"]
                });

            this._lineShader.disableDepthWrite = true;
            this._lineShader.backFaceCulling = false;
        }

        public dispose(): void {

            var buffer = this._buffers[VertexBuffer.PositionKind];
            if (buffer) {
                buffer.dispose();
                this._buffers[VertexBuffer.PositionKind] = null;
            }
            buffer = this._buffers[VertexBuffer.NormalKind];
            if (buffer) {
                buffer.dispose();
                this._buffers[VertexBuffer.NormalKind] = null;
            }

            this._source.getScene().getEngine()._releaseBuffer(this._ib);
            this._lineShader.dispose();
        }

        private _processEdgeForAdjacencies(pa: number, pb: number, p0: number, p1: number, p2: number): number {
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
        }

        private _processEdgeForAdjacenciesWithVertices(pa: Vector3, pb: Vector3, p0: Vector3, p1: Vector3, p2: Vector3): number {
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
        }

        private _checkEdge(faceIndex: number, edge: number, faceNormals: Array<Vector3>, p0: Vector3, p1: Vector3): void {
            var needToCreateLine;

            if (edge === undefined) {
                needToCreateLine = true;
            } else {
                var dotProduct = Vector3.Dot(faceNormals[faceIndex], faceNormals[edge]);

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
        }

        _generateEdgesLines(): void {
            var positions = this._source.getVerticesData(VertexBuffer.PositionKind);
            var indices = this._source.getIndices();

            // First let's find adjacencies
            var adjacencies = new Array<FaceAdjacencies>();
            var faceNormals = new Array<Vector3>();
            var index: number;
            var faceAdjacencies: FaceAdjacencies;

            // Prepare faces
            for (index = 0; index < indices.length; index += 3) {
                faceAdjacencies = new FaceAdjacencies();
                var p0Index = indices[index];
                var p1Index = indices[index + 1];
                var p2Index = indices[index + 2];

                faceAdjacencies.p0 = new Vector3(positions[p0Index * 3], positions[p0Index * 3 + 1], positions[p0Index * 3 + 2]);
                faceAdjacencies.p1 = new Vector3(positions[p1Index * 3], positions[p1Index * 3 + 1], positions[p1Index * 3 + 2]);
                faceAdjacencies.p2 = new Vector3(positions[p2Index * 3], positions[p2Index * 3 + 1], positions[p2Index * 3 + 2]);
                var faceNormal = Vector3.Cross(faceAdjacencies.p1.subtract(faceAdjacencies.p0), faceAdjacencies.p2.subtract(faceAdjacencies.p1));

                faceNormal.normalize();

                faceNormals.push(faceNormal);
                adjacencies.push(faceAdjacencies);
            }

            // Scan
            for (index = 0; index < adjacencies.length; index++) {
                faceAdjacencies = adjacencies[index];

                for (var otherIndex = index + 1; otherIndex < adjacencies.length; otherIndex++) {
                    var otherFaceAdjacencies = adjacencies[otherIndex];

                    if (faceAdjacencies.edgesConnectedCount === 3) { // Full
                        break;
                    }

                    if (otherFaceAdjacencies.edgesConnectedCount === 3) { // Full
                        continue;
                    }

                    var otherP0 = indices[otherIndex * 3];
                    var otherP1 = indices[otherIndex * 3 + 1];
                    var otherP2 = indices[otherIndex * 3 + 2];

                    for (var edgeIndex = 0; edgeIndex < 3; edgeIndex++) {
                        var otherEdgeIndex: number;

                        if (faceAdjacencies.edges[edgeIndex] !== undefined) {
                            continue;
                        }

                        switch (edgeIndex) {
                            case 0:
                                if (this._checkVerticesInsteadOfIndices) {
                                    otherEdgeIndex = this._processEdgeForAdjacenciesWithVertices(faceAdjacencies.p0, faceAdjacencies.p1, otherFaceAdjacencies.p0, otherFaceAdjacencies.p1, otherFaceAdjacencies.p2);
                                } else {
                                    otherEdgeIndex = this._processEdgeForAdjacencies(indices[index * 3], indices[index * 3 + 1], otherP0, otherP1, otherP2);
                                }
                                break;
                            case 1:
                                if (this._checkVerticesInsteadOfIndices) {
                                    otherEdgeIndex = this._processEdgeForAdjacenciesWithVertices(faceAdjacencies.p1, faceAdjacencies.p2, otherFaceAdjacencies.p0, otherFaceAdjacencies.p1, otherFaceAdjacencies.p2);
                                } else {
                                    otherEdgeIndex = this._processEdgeForAdjacencies(indices[index * 3 + 1], indices[index * 3 + 2], otherP0, otherP1, otherP2);
                                }
                                break;
                            case 2:
                                if (this._checkVerticesInsteadOfIndices) {
                                    otherEdgeIndex = this._processEdgeForAdjacenciesWithVertices(faceAdjacencies.p2, faceAdjacencies.p0, otherFaceAdjacencies.p0, otherFaceAdjacencies.p1, otherFaceAdjacencies.p2);
                                } else {
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

            this._buffers[VertexBuffer.PositionKind] = new VertexBuffer(engine, this._linesPositions, VertexBuffer.PositionKind, false);
            this._buffers[VertexBuffer.NormalKind] = new VertexBuffer(engine, this._linesNormals, VertexBuffer.NormalKind, false, false, 4);

            this._ib = engine.createIndexBuffer(this._linesIndices);

            this._indicesCount = this._linesIndices.length;
        }

        public render(): void {
            if (!this._lineShader.isReady()) {
                return;
            }

            var scene = this._source.getScene();
            var engine = scene.getEngine();
            this._lineShader._preBind();

            // VBOs
            engine.bindBuffers(this._buffers, this._ib, this._lineShader.getEffect());

            scene.resetCachedMaterial();
            this._lineShader.setColor4("color", this._source.edgesColor);

            if (scene.activeCamera.mode === Camera.ORTHOGRAPHIC_CAMERA) {
                this._lineShader.setFloat("width", this._source.edgesWidth / this.edgesWidthScalerForOrthographic);
            } else {
                this._lineShader.setFloat("width", this._source.edgesWidth / this.edgesWidthScalerForPerspective);
            }

            this._lineShader.setFloat("aspectRatio", engine.getAspectRatio(scene.activeCamera));
            this._lineShader.bind(this._source.getWorldMatrix());

            // Draw order
            engine.draw(true, 0, this._indicesCount);
            this._lineShader.unbind();
            engine.setDepthWrite(true);
        }
    }
} 