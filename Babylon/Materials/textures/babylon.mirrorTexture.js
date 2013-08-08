var BABYLON = BABYLON || {};

(function () {
    BABYLON.MirrorTexture = function (name, size, scene, generateMipMaps) {
        this._scene = scene;
        this._scene.textures.push(this);

        this.name = name;        

        this._texture = scene.getEngine().createRenderTargetTexture(size, generateMipMaps);
        
        // Render list
        this.renderList = [];
    };

    BABYLON.MirrorTexture.prototype = Object.create(BABYLON.RenderTargetTexture.prototype);
    
    // Members
    BABYLON.MirrorTexture.prototype.mirrorPlane = new BABYLON.Plane(0, 1, 0, 1);
    
    // Method
    BABYLON.MirrorTexture.prototype.onBeforeRender = function () {
        var scene = this._scene;

        var mirrorMatrix = BABYLON.Matrix.Reflection(this.mirrorPlane);
        this._savedViewMatrix = scene.getViewMatrix();

        scene.setTransformMatrix(mirrorMatrix.multiply(this._savedViewMatrix), scene.getProjectionMatrix());

        BABYLON.clipPlane = this.mirrorPlane;

        scene.getEngine().cullBackFaces = false;
    };

    BABYLON.MirrorTexture.prototype.onAfterRender = function () {
        var scene = this._scene;

        scene.setTransformMatrix(this._savedViewMatrix, scene.getProjectionMatrix());
        scene.getEngine().cullBackFaces = true;

        delete BABYLON.clipPlane;
    };
})();