var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var INSPECTOR;
(function (INSPECTOR) {
    var SceneTab = (function (_super) {
        __extends(SceneTab, _super);
        function SceneTab(tabbar, insp) {
            var _this = this;
            _super.call(this, tabbar, 'Scene');
            /** The list of skeleton viewer */
            this._skeletonViewers = [];
            this._inspector = insp;
            // Build the properties panel : a div that will contains the tree and the detail panel
            this._panel = INSPECTOR.Helpers.CreateDiv('tab-panel');
            this._actions = INSPECTOR.Helpers.CreateDiv('scene-actions', this._panel);
            this._detailsPanel = new INSPECTOR.DetailPanel();
            this._panel.appendChild(this._detailsPanel.toHtml());
            // build propertiesline
            var details = [];
            for (var _i = 0, _a = INSPECTOR.PROPERTIES['Scene'].properties; _i < _a.length; _i++) {
                var prop = _a[_i];
                details.push(new INSPECTOR.PropertyLine(new INSPECTOR.Property(prop, this._inspector.scene)));
            }
            this._detailsPanel.details = details;
            Split([this._actions, this._detailsPanel.toHtml()], {
                sizes: [50, 50],
                direction: 'vertical'
            });
            // Build actions
            {
                // Rendering mode
                var title = INSPECTOR.Helpers.CreateDiv('actions-title', this._actions);
                title.textContent = 'Rendering mode';
                var point = INSPECTOR.Helpers.CreateDiv('action-radio', this._actions);
                var wireframe = INSPECTOR.Helpers.CreateDiv('action-radio', this._actions);
                var solid = INSPECTOR.Helpers.CreateDiv('action-radio', this._actions);
                point.textContent = 'Point';
                wireframe.textContent = 'Wireframe';
                solid.textContent = 'Solid';
                if (this._inspector.scene.forcePointsCloud) {
                    point.classList.add('active');
                }
                else if (this._inspector.scene.forceWireframe) {
                    wireframe.classList.add('active');
                }
                else {
                    solid.classList.add('active');
                }
                this._generateRadioAction([point, wireframe, solid]);
                point.addEventListener('click', function () { _this._inspector.scene.forcePointsCloud = true; _this._inspector.scene.forceWireframe = false; });
                wireframe.addEventListener('click', function () { _this._inspector.scene.forcePointsCloud = false; _this._inspector.scene.forceWireframe = true; });
                solid.addEventListener('click', function () { _this._inspector.scene.forcePointsCloud = false; _this._inspector.scene.forceWireframe = false; });
                // Textures
                title = INSPECTOR.Helpers.CreateDiv('actions-title', this._actions);
                title.textContent = 'Textures channels';
                this._generateActionLine('Diffuse Texture', BABYLON.StandardMaterial.DiffuseTextureEnabled, function (b) { BABYLON.StandardMaterial.DiffuseTextureEnabled = b; });
                this._generateActionLine('Ambient Texture', BABYLON.StandardMaterial.AmbientTextureEnabled, function (b) { BABYLON.StandardMaterial.AmbientTextureEnabled = b; });
                this._generateActionLine('Specular Texture', BABYLON.StandardMaterial.SpecularTextureEnabled, function (b) { BABYLON.StandardMaterial.SpecularTextureEnabled = b; });
                this._generateActionLine('Emissive Texture', BABYLON.StandardMaterial.EmissiveTextureEnabled, function (b) { BABYLON.StandardMaterial.EmissiveTextureEnabled = b; });
                this._generateActionLine('Bump Texture', BABYLON.StandardMaterial.BumpTextureEnabled, function (b) { BABYLON.StandardMaterial.BumpTextureEnabled = b; });
                this._generateActionLine('Opacity Texture', BABYLON.StandardMaterial.OpacityTextureEnabled, function (b) { BABYLON.StandardMaterial.OpacityTextureEnabled = b; });
                this._generateActionLine('Reflection Texture', BABYLON.StandardMaterial.ReflectionTextureEnabled, function (b) { BABYLON.StandardMaterial.ReflectionTextureEnabled = b; });
                this._generateActionLine('Refraction Texture', BABYLON.StandardMaterial.RefractionTextureEnabled, function (b) { BABYLON.StandardMaterial.RefractionTextureEnabled = b; });
                this._generateActionLine('ColorGrading', BABYLON.StandardMaterial.ColorGradingTextureEnabled, function (b) { BABYLON.StandardMaterial.ColorGradingTextureEnabled = b; });
                this._generateActionLine('Lightmap Texture', BABYLON.StandardMaterial.LightmapTextureEnabled, function (b) { BABYLON.StandardMaterial.LightmapTextureEnabled = b; });
                this._generateActionLine('Fresnel', BABYLON.StandardMaterial.FresnelEnabled, function (b) { BABYLON.StandardMaterial.FresnelEnabled = b; });
                // Options
                title = INSPECTOR.Helpers.CreateDiv('actions-title', this._actions);
                title.textContent = 'Options';
                this._generateActionLine('Animations', this._inspector.scene.animationsEnabled, function (b) { _this._inspector.scene.animationsEnabled = b; });
                this._generateActionLine('Collisions', this._inspector.scene.collisionsEnabled, function (b) { _this._inspector.scene.collisionsEnabled = b; });
                this._generateActionLine('Fog', this._inspector.scene.fogEnabled, function (b) { _this._inspector.scene.fogEnabled = b; });
                this._generateActionLine('Lens flares', this._inspector.scene.lensFlaresEnabled, function (b) { _this._inspector.scene.lensFlaresEnabled = b; });
                this._generateActionLine('Lights', this._inspector.scene.lightsEnabled, function (b) { _this._inspector.scene.lightsEnabled = b; });
                this._generateActionLine('Particles', this._inspector.scene.particlesEnabled, function (b) { _this._inspector.scene.particlesEnabled = b; });
                this._generateActionLine('Post-processes', this._inspector.scene.postProcessesEnabled, function (b) { _this._inspector.scene.postProcessesEnabled = b; });
                this._generateActionLine('Probes', this._inspector.scene.probesEnabled, function (b) { _this._inspector.scene.probesEnabled = b; });
                this._generateActionLine('Procedural textures', this._inspector.scene.proceduralTexturesEnabled, function (b) { _this._inspector.scene.proceduralTexturesEnabled = b; });
                this._generateActionLine('Render targets', this._inspector.scene.renderTargetsEnabled, function (b) { _this._inspector.scene.renderTargetsEnabled = b; });
                this._generateActionLine('Shadows', this._inspector.scene.shadowsEnabled, function (b) { _this._inspector.scene.shadowsEnabled = b; });
                this._generateActionLine('Skeletons', this._inspector.scene.skeletonsEnabled, function (b) { _this._inspector.scene.skeletonsEnabled = b; });
                this._generateActionLine('Sprites', this._inspector.scene.spritesEnabled, function (b) { _this._inspector.scene.spritesEnabled = b; });
                this._generateActionLine('Textures', this._inspector.scene.texturesEnabled, function (b) { _this._inspector.scene.texturesEnabled = b; });
                // Audio
                title = INSPECTOR.Helpers.CreateDiv('actions-title', this._actions);
                title.textContent = 'Audio';
                var headphones = INSPECTOR.Helpers.CreateDiv('action-radio', this._actions);
                var normalSpeaker = INSPECTOR.Helpers.CreateDiv('action-radio', this._actions);
                this._generateActionLine('Disable audio', !this._inspector.scene.audioEnabled, function (b) { _this._inspector.scene.audioEnabled = !b; });
                headphones.textContent = 'Headphones';
                normalSpeaker.textContent = 'Normal speakers';
                this._generateRadioAction([headphones, normalSpeaker]);
                if (this._inspector.scene.headphone) {
                    headphones.classList.add('active');
                }
                else {
                    normalSpeaker.classList.add('active');
                }
                headphones.addEventListener('click', function () { _this._inspector.scene.headphone = true; });
                normalSpeaker.addEventListener('click', function () { _this._inspector.scene.headphone = false; });
                // Viewers
                title = INSPECTOR.Helpers.CreateDiv('actions-title', this._actions);
                title.textContent = 'Viewer';
                this._generateActionLine('Skeletons', false, function (b) {
                    if (b) {
                        for (var index = 0; index < _this._inspector.scene.meshes.length; index++) {
                            var mesh = _this._inspector.scene.meshes[index];
                            if (mesh.skeleton) {
                                var found = false;
                                for (var sIndex = 0; sIndex < _this._skeletonViewers.length; sIndex++) {
                                    if (_this._skeletonViewers[sIndex].skeleton === mesh.skeleton) {
                                        found = true;
                                        break;
                                    }
                                }
                                if (found) {
                                    continue;
                                }
                                var viewer = new BABYLON.Debug.SkeletonViewer(mesh.skeleton, mesh, _this._inspector.scene);
                                viewer.isEnabled = true;
                                _this._skeletonViewers.push(viewer);
                            }
                        }
                    }
                    else {
                        for (var index = 0; index < _this._skeletonViewers.length; index++) {
                            _this._skeletonViewers[index].dispose();
                        }
                        _this._skeletonViewers = [];
                    }
                });
            }
        }
        /** Overrides super.dispose */
        SceneTab.prototype.dispose = function () {
            this._detailsPanel.dispose();
        };
        /** generates a div which correspond to an option that can be activated/deactivated */
        SceneTab.prototype._generateActionLine = function (name, initValue, action) {
            var div = INSPECTOR.Helpers.CreateDiv('scene-actions', this._actions);
            div.textContent = name;
            div.classList.add('action');
            if (initValue) {
                div.classList.add('active');
            }
            div.addEventListener('click', function (e) {
                div.classList.toggle('active');
                var isActivated = div.classList.contains('active');
                action(isActivated);
            });
        };
        /**
         * Add a click action for all given elements :
         * the clicked element is set as active, all others elements are deactivated
         */
        SceneTab.prototype._generateRadioAction = function (arr) {
            var active = function (elem, evt) {
                for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
                    var e = arr_1[_i];
                    e.classList.remove('active');
                }
                elem.classList.add('active');
            };
            for (var _i = 0, arr_2 = arr; _i < arr_2.length; _i++) {
                var elem = arr_2[_i];
                elem.addEventListener('click', active.bind(this, elem));
            }
        };
        return SceneTab;
    }(INSPECTOR.Tab));
    INSPECTOR.SceneTab = SceneTab;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=SceneTab.js.map