var BABYLON;
(function (BABYLON) {
    var VertexBuffer = (function () {
        function VertexBuffer(engine, data, kind, updatable, postponeInternalCreation) {
            if (engine instanceof BABYLON.Mesh) {
                this._engine = engine.getScene().getEngine();
            } else {
                this._engine = engine;
            }

            this._updatable = updatable;

            this._data = data;

            if (!postponeInternalCreation) {
                this.create();
            }

            this._kind = kind;

            switch (kind) {
                case VertexBuffer.PositionKind:
                    this._strideSize = 3;
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
        VertexBuffer.prototype.create = function (data) {
            if (!data && this._buffer) {
                return;
            }

            data = data || this._data;

            if (!this._buffer) {
                if (this._updatable) {
                    this._buffer = this._engine.createDynamicVertexBuffer(data.length * 4);
                } else {
                    this._buffer = this._engine.createVertexBuffer(data);
                }
            }

            if (this._updatable) {
                this._engine.updateDynamicVertexBuffer(this._buffer, data);
                this._data = data;
            }
        };

        VertexBuffer.prototype.update = function (data) {
            this.create(data);
        };

        VertexBuffer.prototype.dispose = function () {
            if (!this._buffer) {
                return;
            }
            if (this._engine._releaseBuffer(this._buffer)) {
                this._buffer = null;
            }
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
