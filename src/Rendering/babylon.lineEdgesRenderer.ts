module BABYLON {

    class FaceAdjacencies {
        public edges = new Array<number>();
        public p0: Vector3;
        public p1: Vector3;
        public edgesConnectedCount = 0;
    }

    export class LineEdgesRenderer extends EdgesRenderer {
        // Beware when you use this class with complex objects as the adjacencies computation can be really long
        constructor(source: AbstractMesh, epsilon = 0.95, checkVerticesInsteadOfIndices = false) {
                super(source, epsilon, checkVerticesInsteadOfIndices, false);
                this._generateEdgesLines();
        }

        protected _checkEdge(faceIndex: number, edge: number, faceNormals: Array<Vector3>, p0: Vector3, p1: Vector3): void {
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

        _generateEdgesLines(): void {
            var positions = this._source.getVerticesData(VertexBuffer.PositionKind);
            var indices = this._source.getIndices();

            if (!indices || !positions) {
                return;
            }

            // First let's find adjacencies
            var adjacencies = new Array<FaceAdjacencies>();
            var faceNormals = new Array<Vector3>();
            var index: number;
            for(let i=0; i<(positions.length / 3) - 1 ; i++){
                const currentAdjecancy  = new FaceAdjacencies();
                currentAdjecancy.p0 = new Vector3(positions[i*3], positions[i*3+1], positions[i*3+2]);
                currentAdjecancy.p1 = new Vector3(positions[(i+1)*3], positions[(i+1)*3 + 1], positions[(i+1)*3 + 2]);
                adjacencies.push(currentAdjecancy);
            }
            // Create lines
            for (index = 0; index < adjacencies.length; index++) {
                // We need a line when a face has no adjacency on a specific edge or if all the adjacencies has an angle greater than epsilon
                var current = adjacencies[index];
                this._checkEdge(index, current.edges[0], faceNormals, current.p0, current.p1);
            }

            // Merge into a single mesh
            var engine = this._source.getScene().getEngine();

            this._buffers[VertexBuffer.PositionKind] = new VertexBuffer(engine, this._linesPositions, VertexBuffer.PositionKind, false);
            this._buffers[VertexBuffer.NormalKind] = new VertexBuffer(engine, this._linesNormals, VertexBuffer.NormalKind, false, false, 4);

            this._ib = engine.createIndexBuffer(this._linesIndices);

            this._indicesCount = this._linesIndices.length;
        }
    }
} 