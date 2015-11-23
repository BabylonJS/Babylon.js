/// <reference path="../../../dist/preview release/babylon.d.ts"/>

var BABYLON;
(function (BABYLON) {
    var BrickProceduralTexture = (function (_super) {
        __extends(BrickProceduralTexture, _super);
        function BrickProceduralTexture(name, size, scene, fallbackTexture, generateMipMaps) {
            _super.call(this, name, size, "bricktexture", scene, fallbackTexture, generateMipMaps);
            this._numberOfBricksHeight = 15;
            this._numberOfBricksWidth = 5;
            this._jointColor = new BABYLON.Color3(0.72, 0.72, 0.72);
            this._brickColor = new BABYLON.Color3(0.77, 0.47, 0.40);
            this.updateShaderUniforms();
            this.refreshRate = 0;
        }
        BrickProceduralTexture.prototype.updateShaderUniforms = function () {
            this.setFloat("numberOfBricksHeight", this._numberOfBricksHeight);
            this.setFloat("numberOfBricksWidth", this._numberOfBricksWidth);
            this.setColor3("brickColor", this._brickColor);
            this.setColor3("jointColor", this._jointColor);
        };
        Object.defineProperty(BrickProceduralTexture.prototype, "numberOfBricksHeight", {
            get: function () {
                return this._numberOfBricksHeight;
            },
            set: function (value) {
                this._numberOfBricksHeight = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BrickProceduralTexture.prototype, "numberOfBricksWidth", {
            get: function () {
                return this._numberOfBricksWidth;
            },
            set: function (value) {
                this._numberOfBricksWidth = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BrickProceduralTexture.prototype, "jointColor", {
            get: function () {
                return this._jointColor;
            },
            set: function (value) {
                this._jointColor = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BrickProceduralTexture.prototype, "brickColor", {
            get: function () {
                return this._brickColor;
            },
            set: function (value) {
                this._brickColor = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });
        return BrickProceduralTexture;
    })(BABYLON.ProceduralTexture);
    BABYLON.BrickProceduralTexture = BrickProceduralTexture;
})(BABYLON || (BABYLON = {}));
