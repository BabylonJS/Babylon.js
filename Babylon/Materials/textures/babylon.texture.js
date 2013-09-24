var BABYLON = BABYLON || {};

(function () {
    BABYLON.Texture = function (url, scene, noMipmap, invertY) {
        this._scene = scene;
        this._scene.textures.push(this);

        this.name = url;
        this.url = url;
        this._noMipmap = noMipmap;
        this._invertY = invertY;

        this._texture = this._getFromCache(url, noMipmap);

        if (!this._texture) {
            if (!scene.useDelayedTextureLoading) {
                this._texture = scene.getEngine().createTexture(url, noMipmap, invertY, scene);
            } else {
                this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_NOTLOADED;
            }
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
    BABYLON.Texture.prototype.delayLoad = function () {
        if (this.delayLoadState != BABYLON.Engine.DELAYLOADSTATE_NOTLOADED) {
            return;
        }
        
        this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_LOADED;
        this._texture = this._getFromCache(this.url, this._noMipmap);

        if (!this._texture) {
            this._texture = this._scene.getEngine().createTexture(this.url, this._noMipmap, this._invertY, this._scene);
        }
    };

    BABYLON.Texture.prototype._prepareRowForTextureGeneration = function (x, y, z, t) {
        x -= this.uOffset + 0.5;
        y -= this.vOffset + 0.5;
        z -= 0.5;

        BABYLON.Vector3.TransformCoordinatesFromFloatsToRef(x, y, z, this._rowGenerationMatrix, t);

        t.x *= this.uScale;
        t.y *= this.vScale;

        t.x += 0.5;
        t.y += 0.5;
        t.z += 0.5;
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

        if (!this._cachedTextureMatrix) {
            this._cachedTextureMatrix = BABYLON.Matrix.Zero();
            this._rowGenerationMatrix = new BABYLON.Matrix();
            this._t0 = BABYLON.Vector3.Zero();
            this._t1 = BABYLON.Vector3.Zero();
            this._t2 = BABYLON.Vector3.Zero();
        }

        BABYLON.Matrix.RotationYawPitchRollToRef(this.vAng, this.uAng, this.wAng, this._rowGenerationMatrix);

        this._prepareRowForTextureGeneration(0, 0, 0, this._t0);
        this._prepareRowForTextureGeneration(1.0, 0, 0, this._t1);
        this._prepareRowForTextureGeneration(0, 1.0, 0, this._t2);

        this._t1.subtractInPlace(this._t0);
        this._t2.subtractInPlace(this._t0);

        BABYLON.Matrix.IdentityToRef(this._cachedTextureMatrix);
        this._cachedTextureMatrix.m[0] = this._t1.x; this._cachedTextureMatrix.m[1] = this._t1.y; this._cachedTextureMatrix.m[2] = this._t1.z;
        this._cachedTextureMatrix.m[4] = this._t2.x; this._cachedTextureMatrix.m[5] = this._t2.y; this._cachedTextureMatrix.m[6] = this._t2.z;
        this._cachedTextureMatrix.m[8] = this._t0.x; this._cachedTextureMatrix.m[9] = this._t0.y; this._cachedTextureMatrix.m[10] = this._t0.z;

        return this._cachedTextureMatrix;
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

        if (!this._cachedTextureMatrix) {
            this._cachedTextureMatrix = BABYLON.Matrix.Zero();
            this._projectionModeMatrix = BABYLON.Matrix.Zero();
        }

        switch (this.coordinatesMode) {
            case BABYLON.Texture.SPHERICAL_MODE:
                BABYLON.Matrix.IdentityToRef(this._cachedTextureMatrix);
                this._cachedTextureMatrix[0] = -0.5 * this.uScale;
                this._cachedTextureMatrix[5] = -0.5 * this.vScale;
                this._cachedTextureMatrix[12] = 0.5 + this.uOffset;
                this._cachedTextureMatrix[13] = 0.5 + this.vOffset;
                break;
            case BABYLON.Texture.PLANAR_MODE:
                BABYLON.Matrix.IdentityToRef(this._cachedTextureMatrix);
                this._cachedTextureMatrix[0] = this.uScale;
                this._cachedTextureMatrix[5] = this.vScale;
                this._cachedTextureMatrix[12] = this.uOffset;
                this._cachedTextureMatrix[13] = this.vOffset;
                break;
            case BABYLON.Texture.PROJECTION_MODE:
                BABYLON.Matrix.IdentityToRef(this._projectionModeMatrix);

                this._projectionModeMatrix.m[0] = 0.5;
                this._projectionModeMatrix.m[5] = -0.5;
                this._projectionModeMatrix.m[10] = 0.0;
                this._projectionModeMatrix.m[12] = 0.5;
                this._projectionModeMatrix.m[13] = 0.5;
                this._projectionModeMatrix.m[14] = 1.0;
                this._projectionModeMatrix.m[15] = 1.0;

                this._scene.getProjectionMatrix().multiplyToRef(this._projectionModeMatrix, this._cachedTextureMatrix);
                break;
            default:
                BABYLON.Matrix.IdentityToRef(this._cachedTextureMatrix);
                break;
        }
        return this._cachedTextureMatrix;
    };

    BABYLON.Texture.prototype.clone = function () {
        var newTexture = new BABYLON.Texture(this._texture.url, this._scene, this._noMipmap, this._invertY);

        // Base texture
        newTexture.hasAlpha = this.hasAlpha;
        newTexture.level = this.level;

        // Texture
        newTexture.uOffset = this.uOffset;
        newTexture.vOffset = this.vOffset;
        newTexture.uScale = this.uScale;
        newTexture.vScale = this.vScale;
        newTexture.uAng = this.uAng;
        newTexture.vAng = this.vAng;
        newTexture.wAng = this.wAng;
        newTexture.wrapU = this.wrapU;
        newTexture.wrapV = this.wrapV;
        newTexture.coordinatesIndex = this.coordinatesIndex;
        newTexture.coordinatesMode = this.coordinatesMode;

        return newTexture;
    };
})();