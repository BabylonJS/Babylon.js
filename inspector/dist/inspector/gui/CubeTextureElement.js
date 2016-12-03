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
    var CubeTextureElement = (function (_super) {
        __extends(CubeTextureElement, _super);
        /** The texture given as a parameter should be cube. */
        function CubeTextureElement(tex) {
            _super.call(this);
            // On pause the engine will not render anything
            this._pause = false;
            this._div.className = 'fa fa-search texture-element';
            // Create the texture viewer
            this._textureDiv = INSPECTOR.Helpers.CreateDiv('texture-viewer', this._div);
            // canvas
            this._canvas = INSPECTOR.Helpers.CreateElement('canvas', 'texture-viewer-img', this._textureDiv);
            if (tex) {
                this._textureUrl = tex.name;
            }
            this._div.addEventListener('mouseover', this._showViewer.bind(this, 'flex'));
            this._div.addEventListener('mouseout', this._showViewer.bind(this, 'none'));
        }
        CubeTextureElement.prototype.update = function (tex) {
            if (tex && tex.url === this._textureUrl) {
            }
            else {
                if (tex) {
                    this._textureUrl = tex.name;
                }
                if (this._engine) {
                    // Dispose old material and cube
                    this._cube.material.dispose(true, true);
                    this._cube.dispose();
                }
                else {
                    this._initEngine();
                }
                // and create it again
                this._populateScene();
            }
        };
        /** Creates the box  */
        CubeTextureElement.prototype._populateScene = function () {
            var _this = this;
            // Create the hdr texture
            var hdrTexture = new BABYLON.CubeTexture(this._textureUrl, this._scene);
            hdrTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
            this._cube = BABYLON.Mesh.CreateBox("hdrSkyBox", 10.0, this._scene);
            var hdrSkyboxMaterial = new BABYLON.StandardMaterial("skyBox", this._scene);
            hdrSkyboxMaterial.backFaceCulling = false;
            hdrSkyboxMaterial.reflectionTexture = hdrTexture;
            hdrSkyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
            hdrSkyboxMaterial.disableLighting = true;
            this._cube.material = hdrSkyboxMaterial;
            this._cube.registerBeforeRender(function () {
                _this._cube.rotation.y += 0.01;
            });
        };
        /** Init the babylon engine */
        CubeTextureElement.prototype._initEngine = function () {
            var _this = this;
            this._engine = new BABYLON.Engine(this._canvas);
            this._scene = new BABYLON.Scene(this._engine);
            this._scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
            var cam = new BABYLON.FreeCamera('cam', new BABYLON.Vector3(0, 0, -20), this._scene);
            var light = new BABYLON.HemisphericLight('', new BABYLON.Vector3(0, 1, 0), this._scene);
            this._engine.runRenderLoop(function () {
                if (!_this._pause) {
                    _this._scene.render();
                }
            });
            this._canvas.setAttribute('width', '110');
            this._canvas.setAttribute('height', '110');
        };
        CubeTextureElement.prototype._showViewer = function (mode) {
            // If displaying...
            if (mode != 'none') {
                // ... and the canvas is not initialized                
                if (!this._engine) {
                    this._initEngine();
                    this._populateScene();
                }
                // In every cases, unpause the engine
                this._pause = false;
            }
            else {
                // hide : pause the engine
                this._pause = true;
            }
            this._textureDiv.style.display = mode;
        };
        /** Removes properly the babylon engine */
        CubeTextureElement.prototype.dispose = function () {
            if (this._engine) {
                this._engine.dispose();
                this._engine = null;
            }
        };
        return CubeTextureElement;
    }(INSPECTOR.BasicElement));
    INSPECTOR.CubeTextureElement = CubeTextureElement;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=CubeTextureElement.js.map