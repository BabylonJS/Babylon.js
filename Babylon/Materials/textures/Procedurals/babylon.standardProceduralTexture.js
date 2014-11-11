var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var WoodProceduralTexture = (function (_super) {
        __extends(WoodProceduralTexture, _super);
        function WoodProceduralTexture(name, size, scene, fallbackTexture, generateMipMaps) {
            _super.call(this, name, size, "wood", scene, fallbackTexture, generateMipMaps);
            this._ampScale = 0.03;
            this._ringScale = 5;
            this._woodColor1 = new BABYLON.Color3(0.80, 0.55, 0.01);
            this._woodColor2 = new BABYLON.Color3(0.60, 0.41, 0.0);

            this.updateShaderUniforms();

            // Use 0 to render just once, 1 to render on every frame, 2 to render every two frames and so on...
            this.refreshRate = 0;
        }
        WoodProceduralTexture.prototype.updateShaderUniforms = function () {
            this.setFloat("ampScale", this._ampScale);
            this.setFloat("ringScale", this._ringScale);
            this.setColor3("woodColor1", this._woodColor1);
            this.setColor3("woodColor2", this._woodColor2);
        };

        Object.defineProperty(WoodProceduralTexture.prototype, "ampScale", {
            get: function () {
                return this._ampScale;
            },
            set: function (value) {
                this._ampScale = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });


        Object.defineProperty(WoodProceduralTexture.prototype, "ringScale", {
            get: function () {
                return this._ringScale;
            },
            set: function (value) {
                this._ringScale = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });


        Object.defineProperty(WoodProceduralTexture.prototype, "woodColor1", {
            get: function () {
                return this._woodColor1;
            },
            set: function (value) {
                this._woodColor1 = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });


        Object.defineProperty(WoodProceduralTexture.prototype, "woodColor2", {
            get: function () {
                return this._woodColor2;
            },
            set: function (value) {
                this._woodColor2 = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });

        return WoodProceduralTexture;
    })(BABYLON.ProceduralTexture);
    BABYLON.WoodProceduralTexture = WoodProceduralTexture;

    var FireProceduralTexture = (function (_super) {
        __extends(FireProceduralTexture, _super);
        function FireProceduralTexture(name, size, scene, fallbackTexture, generateMipMaps) {
            _super.call(this, name, size, "fire", scene, fallbackTexture, generateMipMaps);
            this._time = 0.0;
            this._speed = new BABYLON.Vector2(0.5, 0.3);
            this._shift = 1.6;
            this._alpha = 1.0;
            this._autoGenerateTime = true;

            this._fireColors = FireProceduralTexture.RedFireColors;
            this.updateShaderUniforms();

            // Use 0 to render just once, 1 to render on every frame, 2 to render every two frames and so on...
            this.refreshRate = 1;
        }
        FireProceduralTexture.prototype.updateShaderUniforms = function () {
            this.setFloat("iGlobalTime", this._time);
            this.setVector2("speed", this._speed);
            this.setFloat("shift", this._shift);
            this.setFloat("alpha", this._alpha);

            this.setColor3("c1", new BABYLON.Color3(this._fireColors[0][0], this._fireColors[0][1], this._fireColors[0][2]));
            this.setColor3("c2", new BABYLON.Color3(this._fireColors[1][0], this._fireColors[1][1], this._fireColors[1][2]));
            this.setColor3("c3", new BABYLON.Color3(this._fireColors[2][0], this._fireColors[2][1], this._fireColors[2][2]));
            this.setColor3("c4", new BABYLON.Color3(this._fireColors[3][0], this._fireColors[3][1], this._fireColors[3][2]));
            this.setColor3("c5", new BABYLON.Color3(this._fireColors[4][0], this._fireColors[4][1], this._fireColors[4][2]));
            this.setColor3("c6", new BABYLON.Color3(this._fireColors[5][0], this._fireColors[5][1], this._fireColors[5][2]));
        };

        FireProceduralTexture.prototype.render = function (useCameraPostProcess) {
            if (this._autoGenerateTime) {
                this._time += this.getScene().getAnimationRatio() * 0.03;
                this.updateShaderUniforms();
            }

            _super.prototype.render.call(this, useCameraPostProcess);
        };

        Object.defineProperty(FireProceduralTexture, "PurpleFireColors", {
            get: function () {
                return [
                    [0.5, 0.0, 1.0],
                    [0.9, 0.0, 1.0],
                    [0.2, 0.0, 1.0],
                    [1.0, 0.9, 1.0],
                    [0.1, 0.1, 1.0],
                    [0.9, 0.9, 1.0]
                ];
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(FireProceduralTexture, "GreenFireColors", {
            get: function () {
                return [
                    [0.5, 1.0, 0.0],
                    [0.5, 1.0, 0.0],
                    [0.3, 0.4, 0.0],
                    [0.5, 1.0, 0.0],
                    [0.2, 0.0, 0.0],
                    [0.5, 1.0, 0.0]
                ];
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(FireProceduralTexture, "RedFireColors", {
            get: function () {
                return [
                    [0.5, 0.0, 0.1],
                    [0.9, 0.0, 0.0],
                    [0.2, 0.0, 0.0],
                    [1.0, 0.9, 0.0],
                    [0.1, 0.1, 0.1],
                    [0.9, 0.9, 0.9]
                ];
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(FireProceduralTexture, "BlueFireColors", {
            get: function () {
                return [
                    [0.1, 0.0, 0.5],
                    [0.0, 0.0, 0.5],
                    [0.1, 0.0, 0.2],
                    [0.0, 0.0, 1.0],
                    [0.1, 0.2, 0.3],
                    [0.0, 0.2, 0.9]
                ];
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(FireProceduralTexture.prototype, "fireColors", {
            get: function () {
                return this._fireColors;
            },
            set: function (value) {
                this._fireColors = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });


        Object.defineProperty(FireProceduralTexture.prototype, "time", {
            get: function () {
                return this._time;
            },
            set: function (value) {
                this._time = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });


        Object.defineProperty(FireProceduralTexture.prototype, "speed", {
            get: function () {
                return this._speed;
            },
            set: function (value) {
                this._speed = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });


        Object.defineProperty(FireProceduralTexture.prototype, "shift", {
            get: function () {
                return this._shift;
            },
            set: function (value) {
                this._shift = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });


        Object.defineProperty(FireProceduralTexture.prototype, "alpha", {
            get: function () {
                return this._alpha;
            },
            set: function (value) {
                this._alpha = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });

        return FireProceduralTexture;
    })(BABYLON.ProceduralTexture);
    BABYLON.FireProceduralTexture = FireProceduralTexture;

    var CloudProceduralTexture = (function (_super) {
        __extends(CloudProceduralTexture, _super);
        function CloudProceduralTexture(name, size, scene, fallbackTexture, generateMipMaps) {
            _super.call(this, name, size, "cloud", scene, fallbackTexture, generateMipMaps);

            // Use 0 to render just once, 1 to render on every frame, 2 to render every two frames and so on...
            this.refreshRate = 0;
        }
        return CloudProceduralTexture;
    })(BABYLON.ProceduralTexture);
    BABYLON.CloudProceduralTexture = CloudProceduralTexture;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.standardProceduralTexture.js.map
