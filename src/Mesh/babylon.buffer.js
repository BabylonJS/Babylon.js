var BABYLON;
(function (BABYLON) {
    var Buffer = (function () {
        function Buffer(engine, data, updatable, stride, postponeInternalCreation, instanced) {
            if (engine instanceof BABYLON.Mesh) {
                this._engine = engine.getScene().getEngine();
            }
            else {
                this._engine = engine;
            }
            this._updatable = updatable;
            this._data = data;
            this._strideSize = stride;
            if (!postponeInternalCreation) {
                this.create();
            }
            this._instanced = instanced;
        }
        Buffer.prototype.createVertexBuffer = function (kind, offset, size, stride) {
            // a lot of these parameters are ignored as they are overriden by the buffer
            return new BABYLON.VertexBuffer(this._engine, this, kind, this._updatable, true, stride ? stride : this._strideSize, this._instanced, offset, size);
        };
        // Properties
        Buffer.prototype.isUpdatable = function () {
            return this._updatable;
        };
        Buffer.prototype.getData = function () {
            return this._data;
        };
        Buffer.prototype.getBuffer = function () {
            return this._buffer;
        };
        Buffer.prototype.getStrideSize = function () {
            return this._strideSize;
        };
        Buffer.prototype.getIsInstanced = function () {
            return this._instanced;
        };
        // Methods
        Buffer.prototype.create = function (data) {
            if (!data && this._buffer) {
                return; // nothing to do
            }
            data = data || this._data;
            if (!this._buffer) {
                if (this._updatable) {
                    this._buffer = this._engine.createDynamicVertexBuffer(data);
                    this._data = data;
                }
                else {
                    this._buffer = this._engine.createVertexBuffer(data);
                }
            }
            else if (this._updatable) {
                this._engine.updateDynamicVertexBuffer(this._buffer, data);
                this._data = data;
            }
        };
        Buffer.prototype.update = function (data) {
            this.create(data);
        };
        Buffer.prototype.updateDirectly = function (data, offset, vertexCount) {
            if (!this._buffer) {
                return;
            }
            if (this._updatable) {
                this._engine.updateDynamicVertexBuffer(this._buffer, data, offset, (vertexCount ? vertexCount * this.getStrideSize() : undefined));
                this._data = null;
            }
        };
        Buffer.prototype.dispose = function () {
            if (!this._buffer) {
                return;
            }
            if (this._engine._releaseBuffer(this._buffer)) {
                this._buffer = null;
            }
        };
        return Buffer;
    }());
    BABYLON.Buffer = Buffer;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.buffer.js.map