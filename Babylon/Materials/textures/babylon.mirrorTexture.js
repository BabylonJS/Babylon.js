var BABYLON = BABYLON || {};

(function () {
    BABYLON.MirrorTexture = function (name, size, scene, generateMipMaps) {
        this._scene = scene;
        this._scene.textures.push(this);

        this.name = name;
        this._generateMipMaps = generateMipMaps;

        this._texture = scene.getEngine().createRenderTargetTexture(size, generateMipMaps);
        
        // Render list
        this.renderList = [];
        
        // Internals
        this._transformMatrix = BABYLON.Matrix.Zero();
        this._mirrorMatrix = BABYLON.Matrix.Zero();
    };

    BABYLON.MirrorTexture.prototype = Object.create(BABYLON.RenderTargetTexture.prototype);
    
    // Members
    BABYLON.MirrorTexture.prototype.mirrorPlane = new BABYLON.Plane(0, 1, 0, 1);
    
    // Method
    BABYLON.MirrorTexture.prototype.onBeforeRender = function () {
        var scene = this._scene;

        BABYLON.Matrix.ReflectionToRef(this.mirrorPlane, this._mirrorMatrix);
        this._savedViewMatrix = scene.getViewMatrix();

        this._mirrorMatrix.multiplyToRef(this._savedViewMatrix, this._transformMatrix);

        scene.setTransformMatrix(this._transformMatrix, scene.getProjectionMatrix());

        BABYLON.clipPlane = this.mirrorPlane;

        scene.getEngine().cullBackFaces = false;
    };

    BABYLON.MirrorTexture.prototype.onAfterRender = function () {
        var scene = this._scene;

        scene.setTransformMatrix(this._savedViewMatrix, scene.getProjectionMatrix());
        scene.getEngine().cullBackFaces = true;

        delete BABYLON.clipPlane;
    };
    
    BABYLON.MirrorTexture.prototype.clone = function () {
        var textureSize = this.getSize();
        var newTexture = new BABYLON.DynamicTexture(this.name, textureSize.width, this._scene, this._generateMipMaps);

        // Base texture
        newTexture.hasAlpha = this.hasAlpha;
        newTexture.level = this.level;

        // Mirror Texture
        newTexture.mirrorPlane = this.mirrorPlane.clone();
        newTexture.renderList = this.renderList.slice(0);

        return newTexture;
    };
})();