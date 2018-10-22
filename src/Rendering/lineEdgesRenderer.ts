module BABYLON {
    /**
     * LineEdgesRenderer for LineMeshes to remove unnecessary triangulation
     */
    export class LineEdgesRenderer extends EdgesRenderer {

        /**
         * This constructor turns off auto generating edges line in Edges Renderer to make it here.
         * @param  source LineMesh used to generate edges
         * @param  epsilon not important (specified angle for edge detection)
         * @param  checkVerticesInsteadOfIndices not important for LineMesh
         */
        constructor(source: AbstractMesh, epsilon = 0.95, checkVerticesInsteadOfIndices = false) {
                super(source, epsilon, checkVerticesInsteadOfIndices, false);
                this._generateEdgesLines();
        }

        /**
         * Generate edges for each line in LinesMesh. Every Line should be rendered as edge.
         */
        _generateEdgesLines(): void {
            var positions = this._source.getVerticesData(VertexBuffer.PositionKind);
            var indices = this._source.getIndices();

            if (!indices || !positions) {
                return;
            }

            const p0 = Tmp.Vector3[0];
            const p1 = Tmp.Vector3[1];
            const len = indices.length - 1;
            for (let i = 0, offset = 0; i < len; i += 2, offset += 4) {
                Vector3.FromArrayToRef(positions, 3 * indices[i], p0);
                Vector3.FromArrayToRef(positions, 3 * indices[i + 1], p1);
                this.createLine(p0, p1, offset);
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
