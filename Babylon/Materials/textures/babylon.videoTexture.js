var BABYLON = BABYLON || {};

(function () {
    BABYLON.VideoTexture = function (name, urls, size, scene, generateMipMaps) {
        this._scene = scene;
        this._scene.textures.push(this);

        this.name = name;

        this.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
        this.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;

        this._texture = scene.getEngine().createDynamicTexture(size, generateMipMaps);
        var textureSize = this.getSize();

        this.video = document.createElement("video");
        this.video.width = textureSize.width;
        this.video.height = textureSize.height;
        this.video.autoplay = false;
        this.video.loop = true;
        this.video.preload = true;
        this._autoLaunch = true;

        var that = this;
        this.video.addEventListener("canplaythrough", function () {
            if (that._texture) {
                that._texture.isReady = true;
            }
        });

        urls.forEach(function (url) {
            var source = document.createElement("source");
            source.src = url;
            that.video.appendChild(source);
        });

        this._lastUpdate = new Date();
    };

    BABYLON.VideoTexture.prototype = Object.create(BABYLON.Texture.prototype);

    BABYLON.VideoTexture.prototype._update = function () {
        if (this._autoLaunch) {
            this._autoLaunch = false;
            this.video.play();
        }
        
        var now = new Date();

        if (now - this._lastUpdate < 15) {
            return false;
        }

        this._lastUpdate = now;
        this._scene.getEngine().updateVideoTexture(this._texture, this.video);
        return true;
    };
})();
