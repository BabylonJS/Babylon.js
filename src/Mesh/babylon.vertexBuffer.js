var BABYLON;
(function (BABYLON) {
    var VertexBuffer = (function () {
        function VertexBuffer(engine, data, kind, updatable, postponeInternalCreation, stride, instanced, offset, size) {
            if (!stride) {
                // Deduce stride from kind
                switch (kind) {
                    case VertexBuffer.PositionKind:
                        stride = 3;
                        break;
                    case VertexBuffer.NormalKind:
                        stride = 3;
                        break;
                    case VertexBuffer.UVKind:
                    case VertexBuffer.UV2Kind:
                    case VertexBuffer.UV3Kind:
                    case VertexBuffer.UV4Kind:
                    case VertexBuffer.UV5Kind:
                    case VertexBuffer.UV6Kind:
                        stride = 2;
                        break;
                    case VertexBuffer.ColorKind:
                        stride = 4;
                        break;
                    case VertexBuffer.MatricesIndicesKind:
                    case VertexBuffer.MatricesIndicesExtraKind:
                        stride = 4;
                        break;
                    case VertexBuffer.MatricesWeightsKind:
                    case VertexBuffer.MatricesWeightsExtraKind:
                        stride = 4;
                        break;
                }
            }
            if (data instanceof BABYLON.Buffer) {
                if (!stride) {
                    stride = data.getStrideSize();
                }
                this._buffer = data;
                this._ownsBuffer = false;
            }
            else {
                this._buffer = new BABYLON.Buffer(engine, data, updatable, stride, postponeInternalCreation, instanced);
                this._ownsBuffer = true;
            }
            this._stride = stride;
            this._offset = offset ? offset : 0;
            this._size = size ? size : stride;
            this._kind = kind;
        }
        VertexBuffer.prototype.getKind = function () {
            return this._kind;
        };
        // Properties
        VertexBuffer.prototype.isUpdatable = function () {
            return this._buffer.isUpdatable();
        };
        VertexBuffer.prototype.getData = function () {
            return this._buffer.getData();
        };
        VertexBuffer.prototype.getBuffer = function () {
            return this._buffer.getBuffer();
        };
        VertexBuffer.prototype.getStrideSize = function () {
            return this._stride;
        };
        VertexBuffer.prototype.getOffset = function () {
            return this._offset;
        };
        VertexBuffer.prototype.getSize = function () {
            return this._size;
        };
        VertexBuffer.prototype.getIsInstanced = function () {
            return this._buffer.getIsInstanced();
        };
        // Methods
        VertexBuffer.prototype.create = function (data) {
            return this._buffer.create(data);
        };
        VertexBuffer.prototype.update = function (data) {
            return this._buffer.update(data);
        };
        VertexBuffer.prototype.updateDirectly = function (data, offset) {
            return this._buffer.updateDirectly(data, offset);
        };
        VertexBuffer.prototype.dispose = function () {
            if (this._ownsBuffer) {
                this._buffer.dispose();
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
        Object.defineProperty(VertexBuffer, "UV3Kind", {
            get: function () {
                return VertexBuffer._UV3Kind;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VertexBuffer, "UV4Kind", {
            get: function () {
                return VertexBuffer._UV4Kind;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VertexBuffer, "UV5Kind", {
            get: function () {
                return VertexBuffer._UV5Kind;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VertexBuffer, "UV6Kind", {
            get: function () {
                return VertexBuffer._UV6Kind;
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
        Object.defineProperty(VertexBuffer, "MatricesIndicesExtraKind", {
            get: function () {
                return VertexBuffer._MatricesIndicesExtraKind;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VertexBuffer, "MatricesWeightsExtraKind", {
            get: function () {
                return VertexBuffer._MatricesWeightsExtraKind;
            },
            enumerable: true,
            configurable: true
        });
        // Enums
        VertexBuffer._PositionKind = "position";
        VertexBuffer._NormalKind = "normal";
        VertexBuffer._UVKind = "uv";
        VertexBuffer._UV2Kind = "uv2";
        VertexBuffer._UV3Kind = "uv3";
        VertexBuffer._UV4Kind = "uv4";
        VertexBuffer._UV5Kind = "uv5";
        VertexBuffer._UV6Kind = "uv6";
        VertexBuffer._ColorKind = "color";
        VertexBuffer._MatricesIndicesKind = "matricesIndices";
        VertexBuffer._MatricesWeightsKind = "matricesWeights";
        VertexBuffer._MatricesIndicesExtraKind = "matricesIndicesExtra";
        VertexBuffer._MatricesWeightsExtraKind = "matricesWeightsExtra";
        return VertexBuffer;
    })();
    BABYLON.VertexBuffer = VertexBuffer;
})(BABYLON || (BABYLON = {}));
