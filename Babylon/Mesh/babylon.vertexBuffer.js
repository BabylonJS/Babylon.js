var BABYLON;
(function (BABYLON) {
    var VertexBuffer = (function () {
        function VertexBuffer(engine, data, kind, updatable, postponeInternalCreation, stride) {
            if (engine instanceof BABYLON.Mesh) {
                this._engine = engine.getScene().getEngine();
            }
            else {
                this._engine = engine;
            }
            this._updatable = updatable;
            this._data = data;
            if (!postponeInternalCreation) {
                this.create();
            }
            this._kind = kind;
            if (stride) {
                this._strideSize = stride;
                return;
            }
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
                    this._strideSize = 4;
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
                return; // nothing to do
            }
            data = data || this._data;
            if (!this._buffer) {
                if (this._updatable) {
                    this._buffer = this._engine.createDynamicVertexBuffer(data.length * 4);
                }
                else {
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
        VertexBuffer.prototype.updateDirectly = function (data, offset) {
            if (!this._buffer) {
                return;
            }
            if (this._updatable) {
                this._engine.updateDynamicVertexBuffer(this._buffer, data, offset);
                this._data = null;
            }
        };
        VertexBuffer.prototype.dispose = function () {
            if (!this._buffer) {
                return;
            }
            if (this._engine._releaseBuffer(this._buffer)) {
                this._buffer = null;
            }
        };
        Object.defineProperty(VertexBuffer, "PositionKind", {
            get: function () {
                return VertexBuffer._PositionKind;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VertexBuffer, "NormalKind", {
            get: function () {
                return VertexBuffer._NormalKind;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VertexBuffer, "UVKind", {
            get: function () {
                return VertexBuffer._UVKind;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VertexBuffer, "UV2Kind", {
            get: function () {
                return VertexBuffer._UV2Kind;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VertexBuffer, "ColorKind", {
            get: function () {
                return VertexBuffer._ColorKind;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VertexBuffer, "MatricesIndicesKind", {
            get: function () {
                return VertexBuffer._MatricesIndicesKind;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VertexBuffer, "MatricesWeightsKind", {
            get: function () {
                return VertexBuffer._MatricesWeightsKind;
            },
            enumerable: true,
            configurable: true
        });
        // Enums
        VertexBuffer._PositionKind = "position";
        VertexBuffer._NormalKind = "normal";
        VertexBuffer._UVKind = "uv";
        VertexBuffer._UV2Kind = "uv2";
        VertexBuffer._ColorKind = "color";
        VertexBuffer._MatricesIndicesKind = "matricesIndices";
        VertexBuffer._MatricesWeightsKind = "matricesWeights";
        return VertexBuffer;
    })();
    BABYLON.VertexBuffer = VertexBuffer;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.vertexBuffer.js.map