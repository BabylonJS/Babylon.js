var BABYLON;
(function (BABYLON) {
    var VertexBuffer = (function () {
        function VertexBuffer(mesh, data, kind, updatable, engine) {
            this._mesh = mesh;
            this._engine = engine || mesh.getScene().getEngine();
            this._updatable = updatable;

            if (updatable) {
                this._buffer = this._engine.createDynamicVertexBuffer(data.length * 4);
                this._engine.updateDynamicVertexBuffer(this._buffer, data);
            } else {
                this._buffer = this._engine.createVertexBuffer(data);
            }

            this._data = data;
            this._kind = kind;

            switch (kind) {
                case VertexBuffer.PositionKind:
                    this._strideSize = 3;
                    if (this._mesh) {
                        this._mesh._resetPointsArrayCache();
                    }
                    break;
                case VertexBuffer.NormalKind:
                    this._strideSize = 3;
                    break;
                case VertexBuffer.UVKind:
                    this._strideSize = 2;
                    break;
                case VertexBuffer.UV2Kind:
                    this._strideSize = 2;
                    break;
                case VertexBuffer.ColorKind:
                    this._strideSize = 3;
                    break;
                case VertexBuffer.MatricesIndicesKind:
                    this._strideSize = 4;
                    break;
                case VertexBuffer.MatricesWeightsKind:
                    this._strideSize = 4;
                    break;
            }
        }
        // Properties
        VertexBuffer.prototype.isUpdatable = function () {
            return this._updatable;
        };

        VertexBuffer.prototype.getData = function () {
            return this._data;
        };

        VertexBuffer.prototype.getBuffer = function () {
            return this._buffer;
        };

        VertexBuffer.prototype.getStrideSize = function () {
            return this._strideSize;
        };

        // Methods
        VertexBuffer.prototype.update = function (data) {
            if (!this._updatable) {
                console.log("You cannot update a non-updatable vertex buffer");
                return;
            }

            this._engine.updateDynamicVertexBuffer(this._buffer, data);
            this._data = data;

            if (this._kind === BABYLON.VertexBuffer.PositionKind && this._mesh) {
                this._mesh._resetPointsArrayCache();
            }
        };

        VertexBuffer.prototype.dispose = function () {
            this._engine._releaseBuffer(this._buffer);
        };

        VertexBuffer.PositionKind = "position";
        VertexBuffer.NormalKind = "normal";
        VertexBuffer.UVKind = "uv";
        VertexBuffer.UV2Kind = "uv2";
        VertexBuffer.ColorKind = "color";
        VertexBuffer.MatricesIndicesKind = "matricesIndices";
        VertexBuffer.MatricesWeightsKind = "matricesWeights";
        return VertexBuffer;
    })();
    BABYLON.VertexBuffer = VertexBuffer;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.vertexBuffer.js.map
