var BABYLON = BABYLON || {};

(function () {
    BABYLON.VertexBuffer = function (mesh, data, kind, updatable) {
        this._mesh = mesh;
        this._engine = mesh.getScene().getEngine();
        
        if (updatable) {
            this._buffer = this._engine.createDynamicVertexBuffer(data.length * 4);
            this._engine.updateDynamicVertexBuffer(this._buffer, data);
        } else {
            this._buffer = this._engine.createVertexBuffer(data);
        }

        this._data = data;
        this._kind = kind;

        switch (kind) {
            case BABYLON.VertexBuffer.PositionKind:
                this._strideSize = 3;
                this._mesh._resetPointsArrayCache();
                break;
            case BABYLON.VertexBuffer.NormalKind:
                this._strideSize = 3;
                break;
            case BABYLON.VertexBuffer.UVKind:
                this._strideSize = 2;
                break;
            case BABYLON.VertexBuffer.UV2Kind:
                this._strideSize = 2;
                break;
            case BABYLON.VertexBuffer.ColorKind:
                this._strideSize = 3;
                break;
        }
    };
    
    // Properties
    BABYLON.VertexBuffer.prototype.getData = function() {
        return this._data;
    };
    
    BABYLON.VertexBuffer.prototype.getStrideSize = function () {
        return this._strideSize;
    };
    
    // Methods
    BABYLON.VertexBuffer.prototype.update = function (data) {
        this._engine.updateDynamicVertexBuffer(this._buffer, data);
        this._data = data;
        
        if (this._kind === BABYLON.VertexBuffer.PositionKind) {
            this._mesh._resetPointsArrayCache();
        }
    };

    BABYLON.VertexBuffer.prototype.dispose = function() {
        this._engine._releaseBuffer(this._buffer);
    }; 
        
    // Enums
    BABYLON.VertexBuffer.PositionKind   = "position";
    BABYLON.VertexBuffer.NormalKind     = "normal";
    BABYLON.VertexBuffer.UVKind         = "uv";
    BABYLON.VertexBuffer.UV2Kind        = "uv2";
    BABYLON.VertexBuffer.ColorKind      = "color";
})();