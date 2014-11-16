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
            this._ampScale = 100.0;
            this._woodColor = new BABYLON.Color3(0.32, 0.17, 0.09);

            this.updateShaderUniforms();

            // Use 0 to render just once, 1 to render on every frame, 2 to render every two frames and so on...
            this.refreshRate = 0;
        }
        WoodProceduralTexture.prototype.updateShaderUniforms = function () {
            this.setFloat("ampScale", this._ampScale);
            this.setColor3("woodColor", this._woodColor);
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


        Object.defineProperty(WoodProceduralTexture.prototype, "woodColor", {
            get: function () {
                return this._woodColor;
            },
            set: function (value) {
                this._woodColor = value;
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
            this._skyColor = new BABYLON.Color3(0.15, 0.68, 1.0);
            this._cloudColor = new BABYLON.Color3(1, 1, 1);

            this.updateShaderUniforms();

            // Use 0 to render just once, 1 to render on every frame, 2 to render every two frames and so on...
            this.refreshRate = 0;
        }
        CloudProceduralTexture.prototype.updateShaderUniforms = function () {
            this.setColor3("skyColor", this._skyColor);
            this.setColor3("cloudColor", this._cloudColor);
        };

        Object.defineProperty(CloudProceduralTexture.prototype, "skyColor", {
            get: function () {
                return this._skyColor;
            },
            set: function (value) {
                this._skyColor = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });


        Object.defineProperty(CloudProceduralTexture.prototype, "cloudColor", {
            get: function () {
                return this._cloudColor;
            },
            set: function (value) {
                this._cloudColor = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });

        return CloudProceduralTexture;
    })(BABYLON.ProceduralTexture);
    BABYLON.CloudProceduralTexture = CloudProceduralTexture;

    var GrassProceduralTexture = (function (_super) {
        __extends(GrassProceduralTexture, _super);
        function GrassProceduralTexture(name, size, scene, fallbackTexture, generateMipMaps) {
            _super.call(this, name, size, "grass", scene, fallbackTexture, generateMipMaps);

            // Use 0 to render just once, 1 to render on every frame, 2 to render every two frames and so on...
            this.refreshRate = 0;
        }
        return GrassProceduralTexture;
    })(BABYLON.ProceduralTexture);
    BABYLON.GrassProceduralTexture = GrassProceduralTexture;

    var RockProceduralTexture = (function (_super) {
        __extends(RockProceduralTexture, _super);
        function RockProceduralTexture(name, size, scene, fallbackTexture, generateMipMaps) {
            _super.call(this, name, size, "rock", scene, fallbackTexture, generateMipMaps);

            // Use 0 to render just once, 1 to render on every frame, 2 to render every two frames and so on...
            this.refreshRate = 0;
        }
        return RockProceduralTexture;
    })(BABYLON.ProceduralTexture);
    BABYLON.RockProceduralTexture = RockProceduralTexture;

    var RoadProceduralTexture = (function (_super) {
        __extends(RoadProceduralTexture, _super);
        function RoadProceduralTexture(name, size, scene, fallbackTexture, generateMipMaps) {
            _super.call(this, name, size, "road", scene, fallbackTexture, generateMipMaps);

            // Use 0 to render just once, 1 to render on every frame, 2 to render every two frames and so on...
            this.refreshRate = 0;
        }
        return RoadProceduralTexture;
    })(BABYLON.ProceduralTexture);
    BABYLON.RoadProceduralTexture = RoadProceduralTexture;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.standardProceduralTexture.js.map
