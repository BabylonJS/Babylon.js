var BABYLON = BABYLON || {};

(function () {
    BABYLON.Texture = function (url, scene, noMipmap, invertY) {
        this._scene = scene;
        this._scene.textures.push(this);

        this.name = url;

        this._texture = this._getFromCache(url, noMipmap);

        if (!this._texture) {
            this._texture = scene.getEngine().createTexture(url, noMipmap, invertY, scene);
        }

        // Animations
        this.animations = [];
    };

    BABYLON.Texture.prototype = Object.create(BABYLON.BaseTexture.prototype);

    // Constants
    BABYLON.Texture.EXPLICIT_MODE = 0;
    BABYLON.Texture.SPHERICAL_MODE = 1;
    BABYLON.Texture.PLANAR_MODE = 2;
    BABYLON.Texture.CUBIC_MODE = 3;
    BABYLON.Texture.PROJECTION_MODE = 4;
    BABYLON.Texture.SKYBOX_MODE = 5;
    
    BABYLON.Texture.CLAMP_ADDRESSMODE = 0;
    BABYLON.Texture.WRAP_ADDRESSMODE = 1;
    BABYLON.Texture.MIRROR_ADDRESSMODE = 2;

    // Members
    BABYLON.Texture.prototype.uOffset = 0;
    BABYLON.Texture.prototype.vOffset = 0;
    BABYLON.Texture.prototype.uScale = 1.0;
    BABYLON.Texture.prototype.vScale = 1.0;
    BABYLON.Texture.prototype.uAng = 0;
    BABYLON.Texture.prototype.vAng = 0;
    BABYLON.Texture.prototype.wAng = 0;
    BABYLON.Texture.prototype.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
    BABYLON.Texture.prototype.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
    BABYLON.Texture.prototype.coordinatesIndex = 0;
    BABYLON.Texture.prototype.coordinatesMode = BABYLON.Texture.EXPLICIT_MODE;

    // Methods    
    BABYLON.Texture.prototype._prepareRowForTextureGeneration = function (t) {
        var matRot = BABYLON.Matrix.RotationYawPitchRoll(this.vAng, this.uAng, this.wAng);

        t.x -= this.uOffset + 0.5;
        t.y -= this.vOffset + 0.5;
        t.z -= 0.5;

        t = BABYLON.Vector3.TransformCoordinates(t, matRot);

        t.x *= this.uScale;
        t.y *= this.vScale;

        t.x += 0.5;
        t.y += 0.5;
        t.z += 0.5;

        return t;
    };

    BABYLON.Texture.prototype._computeTextureMatrix = function () {
        if (
            this.uOffset === this._cachedUOffset &&
            this.vOffset === this._cachedVOffset &&
            this.uScale === this._cachedUScale &&
            this.vScale === this._cachedVScale &&
            this.uAng === this._cachedUAng &&
            this.vAng === this._cachedVAng &&
            this.wAng === this._cachedWAng) {
                return this._cachedTextureMatrix;
        }

        this._cachedUOffset = this.uOffset;
        this._cachedVOffset = this.vOffset;
        this._cachedUScale = this.uScale;
        this._cachedVScale = this.vScale;
        this._cachedUAng = this.uAng;
        this._cachedVAng = this.vAng;
        this._cachedWAng = this.wAng;

        var t0 = new BABYLON.Vector3(0, 0, 0);
        var t1 = new BABYLON.Vector3(1.0, 0, 0);
        var t2 = new BABYLON.Vector3(0, 1.0, 0);

        var matTemp = BABYLON.Matrix.Identity();

        t0 = this._prepareRowForTextureGeneration(t0);
        t1 = this._prepareRowForTextureGeneration(t1);
        t2 = this._prepareRowForTextureGeneration(t2);

        t1 = t1.subtract(t0);
        t2 = t2.subtract(t0);

        matTemp.m[0] = t1.x; matTemp.m[1] = t1.y; matTemp.m[2] = t1.z;
        matTemp.m[4] = t2.x; matTemp.m[5] = t2.y; matTemp.m[6] = t2.z;
        matTemp.m[8] = t0.x; matTemp.m[9] = t0.y; matTemp.m[10] = t0.z;

        this._cachedTextureMatrix = matTemp;
        return matTemp;
    };

    BABYLON.Texture.prototype._computeReflectionTextureMatrix = function () {
        if (
            this.uOffset === this._cachedUOffset &&
            this.vOffset === this._cachedVOffset &&
            this.uScale === this._cachedUScale &&
            this.vScale === this._cachedVScale &&
            this.coordinatesMode === this._cachedCoordinatesMode) {
                return this._cachedTextureMatrix;
        }

        var matrix = BABYLON.Matrix.Identity();

        switch (this.coordinatesMode) {
            case BABYLON.Texture.SPHERICAL_MODE:
                matrix.m[0] = -0.5 * this.uScale;
                matrix.m[5] = -0.5 * this.vScale;
                matrix.m[12] = 0.5 + this.uOffset;
                matrix.m[13] = 0.5 + this.vOffset;
                break;
            case BABYLON.Texture.PLANAR_MODE:
                matrix.m[0] = this.uScale;
                matrix.m[5] = this.vScale;
                matrix.m[12] = this.uOffset;
                matrix.m[13] = this.vOffset;
                break;
            case BABYLON.Texture.PROJECTION_MODE:
                matrix.m[0] = 0.5;
                matrix.m[5] = -0.5;
                matrix.m[10] = 0.0;
                matrix.m[12] = 0.5;
                matrix.m[13] = 0.5;
                matrix.m[14] = 1.0;
                matrix.m[15] = 1.0;

                matrix = this._scene.getProjectionMatrix().multiply(matrix);
                break;
        }
        this._cachedTextureMatrix = matrix;
        return matrix;
    };
})();