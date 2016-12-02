var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var INSPECTOR;
(function (INSPECTOR) {
    /**
    * Display a very small div. A new canvas is created, with a new Babylon.js scene, containing only the
    * cube texture in a cube
    */
    var HDRCubeTextureElement = (function (_super) {
        __extends(HDRCubeTextureElement, _super);
        /** The texture given as a parameter should be cube. */
        function HDRCubeTextureElement(tex) {
            _super.call(this, tex);
        }
        /** Creates the box  */
        HDRCubeTextureElement.prototype._populateScene = function () {
            var _this = this;
            // Create the hdr texture
            var hdrTexture = new BABYLON.HDRCubeTexture(this._textureUrl, this._scene, 512);
            hdrTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
            this._cube = BABYLON.Mesh.CreateBox("hdrSkyBox", 10.0, this._scene);
            var hdrSkyboxMaterial = new BABYLON.PBRMaterial("skyBox", this._scene);
            hdrSkyboxMaterial.backFaceCulling = false;
            hdrSkyboxMaterial.reflectionTexture = hdrTexture;
            hdrSkyboxMaterial.microSurface = 1.0;
            hdrSkyboxMaterial.disableLighting = true;
            this._cube.material = hdrSkyboxMaterial;
            this._cube.registerBeforeRender(function () {
                _this._cube.rotation.y += 0.01;
            });
        };
        return HDRCubeTextureElement;
    }(INSPECTOR.CubeTextureElement));
    INSPECTOR.HDRCubeTextureElement = HDRCubeTextureElement;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=HDRCubeTextureElement.js.map