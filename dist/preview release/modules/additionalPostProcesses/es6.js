var __extends = (this && this.__extends) || (function () {
var extendStatics = Object.setPrototypeOf ||
    ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
    function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
return function (d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
})();

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
return c > 3 && r && Object.defineProperty(target, key, r), r;
};

import * as postProcesses from 'babylonjs/postProcesses/es6';

var BABYLON;
(function (BABYLON) {
    var RefractionPostProcess = /** @class */ (function (_super) {
        __extends(RefractionPostProcess, _super);
        function RefractionPostProcess(name, refractionTextureUrl, color, depth, colorLevel, options, camera, samplingMode, engine, reusable) {
            var _this = _super.call(this, name, "refraction", ["baseColor", "depth", "colorLevel"], ["refractionSampler"], options, camera, samplingMode, engine, reusable) || this;
            _this.color = color;
            _this.depth = depth;
            _this.colorLevel = colorLevel;
            _this.onActivateObservable.add(function (cam) {
                _this._refRexture = _this._refRexture || new BABYLON.Texture(refractionTextureUrl, cam.getScene());
            });
            _this.onApplyObservable.add(function (effect) {
                effect.setColor3("baseColor", _this.color);
                effect.setFloat("depth", _this.depth);
                effect.setFloat("colorLevel", _this.colorLevel);
                effect.setTexture("refractionSampler", _this._refRexture);
            });
            return _this;
        }
        // Methods
        RefractionPostProcess.prototype.dispose = function (camera) {
            if (this._refRexture) {
                this._refRexture.dispose();
            }
            _super.prototype.dispose.call(this, camera);
        };
        return RefractionPostProcess;
    }(BABYLON.PostProcess));
    BABYLON.RefractionPostProcess = RefractionPostProcess;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.refractionPostProcess.js.map


var BABYLON;
(function (BABYLON) {
    var BlackAndWhitePostProcess = /** @class */ (function (_super) {
        __extends(BlackAndWhitePostProcess, _super);
        function BlackAndWhitePostProcess(name, options, camera, samplingMode, engine, reusable) {
            var _this = _super.call(this, name, "blackAndWhite", ["degree"], null, options, camera, samplingMode, engine, reusable) || this;
            _this.degree = 1;
            _this.onApplyObservable.add(function (effect) {
                effect.setFloat("degree", _this.degree);
            });
            return _this;
        }
        return BlackAndWhitePostProcess;
    }(BABYLON.PostProcess));
    BABYLON.BlackAndWhitePostProcess = BlackAndWhitePostProcess;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.blackAndWhitePostProcess.js.map


var BABYLON;
(function (BABYLON) {
    var ConvolutionPostProcess = /** @class */ (function (_super) {
        __extends(ConvolutionPostProcess, _super);
        function ConvolutionPostProcess(name, kernel, options, camera, samplingMode, engine, reusable) {
            var _this = _super.call(this, name, "convolution", ["kernel", "screenSize"], null, options, camera, samplingMode, engine, reusable) || this;
            _this.kernel = kernel;
            _this.onApply = function (effect) {
                effect.setFloat2("screenSize", _this.width, _this.height);
                effect.setArray("kernel", _this.kernel);
            };
            return _this;
        }
        // Statics
        // Based on http://en.wikipedia.org/wiki/Kernel_(image_processing)
        ConvolutionPostProcess.EdgeDetect0Kernel = [1, 0, -1, 0, 0, 0, -1, 0, 1];
        ConvolutionPostProcess.EdgeDetect1Kernel = [0, 1, 0, 1, -4, 1, 0, 1, 0];
        ConvolutionPostProcess.EdgeDetect2Kernel = [-1, -1, -1, -1, 8, -1, -1, -1, -1];
        ConvolutionPostProcess.SharpenKernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
        ConvolutionPostProcess.EmbossKernel = [-2, -1, 0, -1, 1, 1, 0, 1, 2];
        ConvolutionPostProcess.GaussianKernel = [0, 1, 0, 1, 1, 1, 0, 1, 0];
        return ConvolutionPostProcess;
    }(BABYLON.PostProcess));
    BABYLON.ConvolutionPostProcess = ConvolutionPostProcess;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.convolutionPostProcess.js.map


var BABYLON;
(function (BABYLON) {
    var FilterPostProcess = /** @class */ (function (_super) {
        __extends(FilterPostProcess, _super);
        function FilterPostProcess(name, kernelMatrix, options, camera, samplingMode, engine, reusable) {
            var _this = _super.call(this, name, "filter", ["kernelMatrix"], null, options, camera, samplingMode, engine, reusable) || this;
            _this.kernelMatrix = kernelMatrix;
            _this.onApply = function (effect) {
                effect.setMatrix("kernelMatrix", _this.kernelMatrix);
            };
            return _this;
        }
        return FilterPostProcess;
    }(BABYLON.PostProcess));
    BABYLON.FilterPostProcess = FilterPostProcess;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.filterPostProcess.js.map


var BABYLON;
(function (BABYLON) {
    var FxaaPostProcess = /** @class */ (function (_super) {
        __extends(FxaaPostProcess, _super);
        function FxaaPostProcess(name, options, camera, samplingMode, engine, reusable, textureType) {
            if (camera === void 0) { camera = null; }
            if (textureType === void 0) { textureType = BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT; }
            var _this = _super.call(this, name, "fxaa", ["texelSize"], null, options, camera, samplingMode || BABYLON.Texture.BILINEAR_SAMPLINGMODE, engine, reusable, null, textureType, "fxaa") || this;
            _this.onApplyObservable.add(function (effect) {
                var texelSize = _this.texelSize;
                effect.setFloat2("texelSize", texelSize.x, texelSize.y);
            });
            return _this;
        }
        return FxaaPostProcess;
    }(BABYLON.PostProcess));
    BABYLON.FxaaPostProcess = FxaaPostProcess;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.fxaaPostProcess.js.map



var BABYLON;
(function (BABYLON) {
    // Inspired by http://http.developer.nvidia.com/GPUGems3/gpugems3_ch13.html
    var VolumetricLightScatteringPostProcess = /** @class */ (function (_super) {
        __extends(VolumetricLightScatteringPostProcess, _super);
        /**
         * @constructor
         * @param {string} name - The post-process name
         * @param {any} ratio - The size of the post-process and/or internal pass (0.5 means that your postprocess will have a width = canvas.width 0.5 and a height = canvas.height 0.5)
         * @param {BABYLON.Camera} camera - The camera that the post-process will be attached to
         * @param {BABYLON.Mesh} mesh - The mesh used to create the light scattering
         * @param {number} samples - The post-process quality, default 100
         * @param {number} samplingMode - The post-process filtering mode
         * @param {BABYLON.Engine} engine - The babylon engine
         * @param {boolean} reusable - If the post-process is reusable
         * @param {BABYLON.Scene} scene - The constructor needs a scene reference to initialize internal components. If "camera" is null (RenderPipelineà, "scene" must be provided
         */
        function VolumetricLightScatteringPostProcess(name, ratio, camera, mesh, samples, samplingMode, engine, reusable, scene) {
            if (samples === void 0) { samples = 100; }
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.BILINEAR_SAMPLINGMODE; }
            var _this = _super.call(this, name, "volumetricLightScattering", ["decay", "exposure", "weight", "meshPositionOnScreen", "density"], ["lightScatteringSampler"], ratio.postProcessRatio || ratio, camera, samplingMode, engine, reusable, "#define NUM_SAMPLES " + samples) || this;
            _this._screenCoordinates = BABYLON.Vector2.Zero();
            /**
            * Custom position of the mesh. Used if "useCustomMeshPosition" is set to "true"
            * @type {Vector3}
            */
            _this.customMeshPosition = BABYLON.Vector3.Zero();
            /**
            * Set if the post-process should use a custom position for the light source (true) or the internal mesh position (false)
            * @type {boolean}
            */
            _this.useCustomMeshPosition = false;
            /**
            * If the post-process should inverse the light scattering direction
            * @type {boolean}
            */
            _this.invert = true;
            /**
            * Array containing the excluded meshes not rendered in the internal pass
            */
            _this.excludedMeshes = new Array();
            /**
            * Controls the overall intensity of the post-process
            * @type {number}
            */
            _this.exposure = 0.3;
            /**
            * Dissipates each sample's contribution in range [0, 1]
            * @type {number}
            */
            _this.decay = 0.96815;
            /**
            * Controls the overall intensity of each sample
            * @type {number}
            */
            _this.weight = 0.58767;
            /**
            * Controls the density of each sample
            * @type {number}
            */
            _this.density = 0.926;
            scene = ((camera === null) ? scene : camera.getScene()); // parameter "scene" can be null.
            engine = scene.getEngine();
            _this._viewPort = new BABYLON.Viewport(0, 0, 1, 1).toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
            // Configure mesh
            _this.mesh = ((mesh !== null) ? mesh : VolumetricLightScatteringPostProcess.CreateDefaultMesh("VolumetricLightScatteringMesh", scene));
            // Configure
            _this._createPass(scene, ratio.passRatio || ratio);
            _this.onActivate = function (camera) {
                if (!_this.isSupported) {
                    _this.dispose(camera);
                }
                _this.onActivate = null;
            };
            _this.onApplyObservable.add(function (effect) {
                _this._updateMeshScreenCoordinates(scene);
                effect.setTexture("lightScatteringSampler", _this._volumetricLightScatteringRTT);
                effect.setFloat("exposure", _this.exposure);
                effect.setFloat("decay", _this.decay);
                effect.setFloat("weight", _this.weight);
                effect.setFloat("density", _this.density);
                effect.setVector2("meshPositionOnScreen", _this._screenCoordinates);
            });
            return _this;
        }
        Object.defineProperty(VolumetricLightScatteringPostProcess.prototype, "useDiffuseColor", {
            get: function () {
                BABYLON.Tools.Warn("VolumetricLightScatteringPostProcess.useDiffuseColor is no longer used, use the mesh material directly instead");
                return false;
            },
            set: function (useDiffuseColor) {
                BABYLON.Tools.Warn("VolumetricLightScatteringPostProcess.useDiffuseColor is no longer used, use the mesh material directly instead");
            },
            enumerable: true,
            configurable: true
        });
        VolumetricLightScatteringPostProcess.prototype.getClassName = function () {
            return "VolumetricLightScatteringPostProcess";
        };
        VolumetricLightScatteringPostProcess.prototype.isReady = function (subMesh, useInstances) {
            var mesh = subMesh.getMesh();
            // Render this.mesh as default
            if (mesh === this.mesh && mesh.material) {
                return mesh.material.isReady(mesh);
            }
            var defines = [];
            var attribs = [BABYLON.VertexBuffer.PositionKind];
            var material = subMesh.getMaterial();
            // Alpha test
            if (material) {
                if (material.needAlphaTesting()) {
                    defines.push("#define ALPHATEST");
                }
                if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.UVKind)) {
                    attribs.push(BABYLON.VertexBuffer.UVKind);
                    defines.push("#define UV1");
                }
                if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.UV2Kind)) {
                    attribs.push(BABYLON.VertexBuffer.UV2Kind);
                    defines.push("#define UV2");
                }
            }
            // Bones
            if (mesh.useBones && mesh.computeBonesUsingShaders) {
                attribs.push(BABYLON.VertexBuffer.MatricesIndicesKind);
                attribs.push(BABYLON.VertexBuffer.MatricesWeightsKind);
                defines.push("#define NUM_BONE_INFLUENCERS " + mesh.numBoneInfluencers);
                defines.push("#define BonesPerMesh " + (mesh.skeleton ? (mesh.skeleton.bones.length + 1) : 0));
            }
            else {
                defines.push("#define NUM_BONE_INFLUENCERS 0");
            }
            // Instances
            if (useInstances) {
                defines.push("#define INSTANCES");
                attribs.push("world0");
                attribs.push("world1");
                attribs.push("world2");
                attribs.push("world3");
            }
            // Get correct effect      
            var join = defines.join("\n");
            if (this._cachedDefines !== join) {
                this._cachedDefines = join;
                this._volumetricLightScatteringPass = mesh.getScene().getEngine().createEffect({ vertexElement: "depth", fragmentElement: "volumetricLightScatteringPass" }, attribs, ["world", "mBones", "viewProjection", "diffuseMatrix"], ["diffuseSampler"], join);
            }
            return this._volumetricLightScatteringPass.isReady();
        };
        /**
         * Sets the new light position for light scattering effect
         * @param {BABYLON.Vector3} The new custom light position
         */
        VolumetricLightScatteringPostProcess.prototype.setCustomMeshPosition = function (position) {
            this.customMeshPosition = position;
        };
        /**
         * Returns the light position for light scattering effect
         * @return {BABYLON.Vector3} The custom light position
         */
        VolumetricLightScatteringPostProcess.prototype.getCustomMeshPosition = function () {
            return this.customMeshPosition;
        };
        /**
         * Disposes the internal assets and detaches the post-process from the camera
         */
        VolumetricLightScatteringPostProcess.prototype.dispose = function (camera) {
            var rttIndex = camera.getScene().customRenderTargets.indexOf(this._volumetricLightScatteringRTT);
            if (rttIndex !== -1) {
                camera.getScene().customRenderTargets.splice(rttIndex, 1);
            }
            this._volumetricLightScatteringRTT.dispose();
            _super.prototype.dispose.call(this, camera);
        };
        /**
         * Returns the render target texture used by the post-process
         * @return {BABYLON.RenderTargetTexture} The render target texture used by the post-process
         */
        VolumetricLightScatteringPostProcess.prototype.getPass = function () {
            return this._volumetricLightScatteringRTT;
        };
        // Private methods
        VolumetricLightScatteringPostProcess.prototype._meshExcluded = function (mesh) {
            if (this.excludedMeshes.length > 0 && this.excludedMeshes.indexOf(mesh) !== -1) {
                return true;
            }
            return false;
        };
        VolumetricLightScatteringPostProcess.prototype._createPass = function (scene, ratio) {
            var _this = this;
            var engine = scene.getEngine();
            this._volumetricLightScatteringRTT = new BABYLON.RenderTargetTexture("volumetricLightScatteringMap", { width: engine.getRenderWidth() * ratio, height: engine.getRenderHeight() * ratio }, scene, false, true, BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
            this._volumetricLightScatteringRTT.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this._volumetricLightScatteringRTT.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this._volumetricLightScatteringRTT.renderList = null;
            this._volumetricLightScatteringRTT.renderParticles = false;
            var camera = this.getCamera();
            if (camera) {
                camera.customRenderTargets.push(this._volumetricLightScatteringRTT);
            }
            else {
                scene.customRenderTargets.push(this._volumetricLightScatteringRTT);
            }
            // Custom render function for submeshes
            var renderSubMesh = function (subMesh) {
                var mesh = subMesh.getRenderingMesh();
                if (_this._meshExcluded(mesh)) {
                    return;
                }
                var material = subMesh.getMaterial();
                if (!material) {
                    return;
                }
                var scene = mesh.getScene();
                var engine = scene.getEngine();
                // Culling
                engine.setState(material.backFaceCulling);
                // Managing instances
                var batch = mesh._getInstancesRenderList(subMesh._id);
                if (batch.mustReturn) {
                    return;
                }
                var hardwareInstancedRendering = (engine.getCaps().instancedArrays) && (batch.visibleInstances[subMesh._id] !== null);
                if (_this.isReady(subMesh, hardwareInstancedRendering)) {
                    var effect = _this._volumetricLightScatteringPass;
                    if (mesh === _this.mesh) {
                        if (subMesh.effect) {
                            effect = subMesh.effect;
                        }
                        else {
                            effect = material.getEffect();
                        }
                    }
                    engine.enableEffect(effect);
                    mesh._bind(subMesh, effect, BABYLON.Material.TriangleFillMode);
                    if (mesh === _this.mesh) {
                        material.bind(mesh.getWorldMatrix(), mesh);
                    }
                    else {
                        _this._volumetricLightScatteringPass.setMatrix("viewProjection", scene.getTransformMatrix());
                        // Alpha test
                        if (material && material.needAlphaTesting()) {
                            var alphaTexture = material.getAlphaTestTexture();
                            _this._volumetricLightScatteringPass.setTexture("diffuseSampler", alphaTexture);
                            if (alphaTexture) {
                                _this._volumetricLightScatteringPass.setMatrix("diffuseMatrix", alphaTexture.getTextureMatrix());
                            }
                        }
                        // Bones
                        if (mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
                            _this._volumetricLightScatteringPass.setMatrices("mBones", mesh.skeleton.getTransformMatrices(mesh));
                        }
                    }
                    // Draw
                    mesh._processRendering(subMesh, _this._volumetricLightScatteringPass, BABYLON.Material.TriangleFillMode, batch, hardwareInstancedRendering, function (isInstance, world) { return effect.setMatrix("world", world); });
                }
            };
            // Render target texture callbacks
            var savedSceneClearColor;
            var sceneClearColor = new BABYLON.Color4(0.0, 0.0, 0.0, 1.0);
            this._volumetricLightScatteringRTT.onBeforeRenderObservable.add(function () {
                savedSceneClearColor = scene.clearColor;
                scene.clearColor = sceneClearColor;
            });
            this._volumetricLightScatteringRTT.onAfterRenderObservable.add(function () {
                scene.clearColor = savedSceneClearColor;
            });
            this._volumetricLightScatteringRTT.customRenderFunction = function (opaqueSubMeshes, alphaTestSubMeshes, transparentSubMeshes, depthOnlySubMeshes) {
                var engine = scene.getEngine();
                var index;
                if (depthOnlySubMeshes.length) {
                    engine.setColorWrite(false);
                    for (index = 0; index < depthOnlySubMeshes.length; index++) {
                        renderSubMesh(depthOnlySubMeshes.data[index]);
                    }
                    engine.setColorWrite(true);
                }
                for (index = 0; index < opaqueSubMeshes.length; index++) {
                    renderSubMesh(opaqueSubMeshes.data[index]);
                }
                engine.setAlphaTesting(true);
                for (index = 0; index < alphaTestSubMeshes.length; index++) {
                    renderSubMesh(alphaTestSubMeshes.data[index]);
                }
                engine.setAlphaTesting(false);
                if (transparentSubMeshes.length) {
                    // Sort sub meshes
                    for (index = 0; index < transparentSubMeshes.length; index++) {
                        var submesh = transparentSubMeshes.data[index];
                        var boundingInfo = submesh.getBoundingInfo();
                        if (boundingInfo && scene.activeCamera) {
                            submesh._alphaIndex = submesh.getMesh().alphaIndex;
                            submesh._distanceToCamera = boundingInfo.boundingSphere.centerWorld.subtract(scene.activeCamera.position).length();
                        }
                    }
                    var sortedArray = transparentSubMeshes.data.slice(0, transparentSubMeshes.length);
                    sortedArray.sort(function (a, b) {
                        // Alpha index first
                        if (a._alphaIndex > b._alphaIndex) {
                            return 1;
                        }
                        if (a._alphaIndex < b._alphaIndex) {
                            return -1;
                        }
                        // Then distance to camera
                        if (a._distanceToCamera < b._distanceToCamera) {
                            return 1;
                        }
                        if (a._distanceToCamera > b._distanceToCamera) {
                            return -1;
                        }
                        return 0;
                    });
                    // Render sub meshes
                    engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE);
                    for (index = 0; index < sortedArray.length; index++) {
                        renderSubMesh(sortedArray[index]);
                    }
                    engine.setAlphaMode(BABYLON.Engine.ALPHA_DISABLE);
                }
            };
        };
        VolumetricLightScatteringPostProcess.prototype._updateMeshScreenCoordinates = function (scene) {
            var transform = scene.getTransformMatrix();
            var meshPosition;
            if (this.useCustomMeshPosition) {
                meshPosition = this.customMeshPosition;
            }
            else if (this.attachedNode) {
                meshPosition = this.attachedNode.position;
            }
            else {
                meshPosition = this.mesh.parent ? this.mesh.getAbsolutePosition() : this.mesh.position;
            }
            var pos = BABYLON.Vector3.Project(meshPosition, BABYLON.Matrix.Identity(), transform, this._viewPort);
            this._screenCoordinates.x = pos.x / this._viewPort.width;
            this._screenCoordinates.y = pos.y / this._viewPort.height;
            if (this.invert)
                this._screenCoordinates.y = 1.0 - this._screenCoordinates.y;
        };
        // Static methods
        /**
        * Creates a default mesh for the Volumeric Light Scattering post-process
        * @param {string} The mesh name
        * @param {BABYLON.Scene} The scene where to create the mesh
        * @return {BABYLON.Mesh} the default mesh
        */
        VolumetricLightScatteringPostProcess.CreateDefaultMesh = function (name, scene) {
            var mesh = BABYLON.Mesh.CreatePlane(name, 1, scene);
            mesh.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_ALL;
            var material = new BABYLON.StandardMaterial(name + "Material", scene);
            material.emissiveColor = new BABYLON.Color3(1, 1, 1);
            mesh.material = material;
            return mesh;
        };
        __decorate([
            BABYLON.serializeAsVector3()
        ], VolumetricLightScatteringPostProcess.prototype, "customMeshPosition", void 0);
        __decorate([
            BABYLON.serialize()
        ], VolumetricLightScatteringPostProcess.prototype, "useCustomMeshPosition", void 0);
        __decorate([
            BABYLON.serialize()
        ], VolumetricLightScatteringPostProcess.prototype, "invert", void 0);
        __decorate([
            BABYLON.serializeAsMeshReference()
        ], VolumetricLightScatteringPostProcess.prototype, "mesh", void 0);
        __decorate([
            BABYLON.serialize()
        ], VolumetricLightScatteringPostProcess.prototype, "excludedMeshes", void 0);
        __decorate([
            BABYLON.serialize()
        ], VolumetricLightScatteringPostProcess.prototype, "exposure", void 0);
        __decorate([
            BABYLON.serialize()
        ], VolumetricLightScatteringPostProcess.prototype, "decay", void 0);
        __decorate([
            BABYLON.serialize()
        ], VolumetricLightScatteringPostProcess.prototype, "weight", void 0);
        __decorate([
            BABYLON.serialize()
        ], VolumetricLightScatteringPostProcess.prototype, "density", void 0);
        return VolumetricLightScatteringPostProcess;
    }(BABYLON.PostProcess));
    BABYLON.VolumetricLightScatteringPostProcess = VolumetricLightScatteringPostProcess;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.volumetricLightScatteringPostProcess.js.map

//
//  This post-process allows the modification of rendered colors by using
//  a 'look-up table' (LUT). This effect is also called Color Grading.
// 
//  The object needs to be provided an url to a texture containing the color
//  look-up table: the texture must be 256 pixels wide and 16 pixels high.
//  Use an image editing software to tweak the LUT to match your needs.
// 
//  For an example of a color LUT, see here:
//      http://udn.epicgames.com/Three/rsrc/Three/ColorGrading/RGBTable16x1.png
//  For explanations on color grading, see here:
//      http://udn.epicgames.com/Three/ColorGrading.html
//

var BABYLON;
(function (BABYLON) {
    var ColorCorrectionPostProcess = /** @class */ (function (_super) {
        __extends(ColorCorrectionPostProcess, _super);
        function ColorCorrectionPostProcess(name, colorTableUrl, options, camera, samplingMode, engine, reusable) {
            var _this = _super.call(this, name, 'colorCorrection', null, ['colorTable'], options, camera, samplingMode, engine, reusable) || this;
            _this._colorTableTexture = new BABYLON.Texture(colorTableUrl, camera.getScene(), true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
            _this._colorTableTexture.anisotropicFilteringLevel = 1;
            _this._colorTableTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            _this._colorTableTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            _this.onApply = function (effect) {
                effect.setTexture("colorTable", _this._colorTableTexture);
            };
            return _this;
        }
        return ColorCorrectionPostProcess;
    }(BABYLON.PostProcess));
    BABYLON.ColorCorrectionPostProcess = ColorCorrectionPostProcess;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.colorCorrectionPostProcess.js.map


var BABYLON;
(function (BABYLON) {
    var TonemappingOperator;
    (function (TonemappingOperator) {
        TonemappingOperator[TonemappingOperator["Hable"] = 0] = "Hable";
        TonemappingOperator[TonemappingOperator["Reinhard"] = 1] = "Reinhard";
        TonemappingOperator[TonemappingOperator["HejiDawson"] = 2] = "HejiDawson";
        TonemappingOperator[TonemappingOperator["Photographic"] = 3] = "Photographic";
    })(TonemappingOperator = BABYLON.TonemappingOperator || (BABYLON.TonemappingOperator = {}));
    ;
    var TonemapPostProcess = /** @class */ (function (_super) {
        __extends(TonemapPostProcess, _super);
        function TonemapPostProcess(name, _operator, exposureAdjustment, camera, samplingMode, engine, textureFormat) {
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.BILINEAR_SAMPLINGMODE; }
            if (textureFormat === void 0) { textureFormat = BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT; }
            var _this = _super.call(this, name, "tonemap", ["_ExposureAdjustment"], null, 1.0, camera, samplingMode, engine, true, null, textureFormat) || this;
            _this._operator = _operator;
            _this.exposureAdjustment = exposureAdjustment;
            var defines = "#define ";
            if (_this._operator === TonemappingOperator.Hable)
                defines += "HABLE_TONEMAPPING";
            else if (_this._operator === TonemappingOperator.Reinhard)
                defines += "REINHARD_TONEMAPPING";
            else if (_this._operator === TonemappingOperator.HejiDawson)
                defines += "OPTIMIZED_HEJIDAWSON_TONEMAPPING";
            else if (_this._operator === TonemappingOperator.Photographic)
                defines += "PHOTOGRAPHIC_TONEMAPPING";
            //sadly a second call to create the effect.
            _this.updateEffect(defines);
            _this.onApply = function (effect) {
                effect.setFloat("_ExposureAdjustment", _this.exposureAdjustment);
            };
            return _this;
        }
        return TonemapPostProcess;
    }(BABYLON.PostProcess));
    BABYLON.TonemapPostProcess = TonemapPostProcess;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.tonemapPostProcess.js.map


var BABYLON;
(function (BABYLON) {
    var DisplayPassPostProcess = /** @class */ (function (_super) {
        __extends(DisplayPassPostProcess, _super);
        function DisplayPassPostProcess(name, options, camera, samplingMode, engine, reusable) {
            return _super.call(this, name, "displayPass", ["passSampler"], ["passSampler"], options, camera, samplingMode, engine, reusable) || this;
        }
        return DisplayPassPostProcess;
    }(BABYLON.PostProcess));
    BABYLON.DisplayPassPostProcess = DisplayPassPostProcess;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.displayPassPostProcess.js.map


var BABYLON;
(function (BABYLON) {
    var HighlightsPostProcess = /** @class */ (function (_super) {
        __extends(HighlightsPostProcess, _super);
        function HighlightsPostProcess(name, options, camera, samplingMode, engine, reusable, textureType) {
            if (textureType === void 0) { textureType = BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT; }
            return _super.call(this, name, "highlights", null, null, options, camera, samplingMode, engine, reusable, null, textureType) || this;
        }
        return HighlightsPostProcess;
    }(BABYLON.PostProcess));
    BABYLON.HighlightsPostProcess = HighlightsPostProcess;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.highlightsPostProcess.js.map



var BABYLON;
(function (BABYLON) {
    var ImageProcessingPostProcess = /** @class */ (function (_super) {
        __extends(ImageProcessingPostProcess, _super);
        function ImageProcessingPostProcess(name, options, camera, samplingMode, engine, reusable, textureType, imageProcessingConfiguration) {
            if (camera === void 0) { camera = null; }
            if (textureType === void 0) { textureType = BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT; }
            var _this = _super.call(this, name, "imageProcessing", [], [], options, camera, samplingMode, engine, reusable, null, textureType, "postprocess", null, true) || this;
            _this._fromLinearSpace = true;
            /**
             * Defines cache preventing GC.
             */
            _this._defines = {
                IMAGEPROCESSING: false,
                VIGNETTE: false,
                VIGNETTEBLENDMODEMULTIPLY: false,
                VIGNETTEBLENDMODEOPAQUE: false,
                TONEMAPPING: false,
                CONTRAST: false,
                COLORCURVES: false,
                COLORGRADING: false,
                COLORGRADING3D: false,
                FROMLINEARSPACE: false,
                SAMPLER3DGREENDEPTH: false,
                SAMPLER3DBGRMAP: false,
                IMAGEPROCESSINGPOSTPROCESS: false,
                EXPOSURE: false,
            };
            // Setup the configuration as forced by the constructor. This would then not force the 
            // scene materials output in linear space and let untouched the default forward pass.
            if (imageProcessingConfiguration) {
                imageProcessingConfiguration.applyByPostProcess = true;
                _this._attachImageProcessingConfiguration(imageProcessingConfiguration, true);
                // This will cause the shader to be compiled
                _this.fromLinearSpace = false;
            }
            else {
                _this._attachImageProcessingConfiguration(null, true);
                _this.imageProcessingConfiguration.applyByPostProcess = true;
            }
            _this.onApply = function (effect) {
                _this.imageProcessingConfiguration.bind(effect, _this.aspectRatio);
            };
            return _this;
        }
        Object.defineProperty(ImageProcessingPostProcess.prototype, "imageProcessingConfiguration", {
            /**
             * Gets the image processing configuration used either in this material.
             */
            get: function () {
                return this._imageProcessingConfiguration;
            },
            /**
             * Sets the Default image processing configuration used either in the this material.
             *
             * If sets to null, the scene one is in use.
             */
            set: function (value) {
                this._attachImageProcessingConfiguration(value);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Attaches a new image processing configuration to the PBR Material.
         * @param configuration
         */
        ImageProcessingPostProcess.prototype._attachImageProcessingConfiguration = function (configuration, doNotBuild) {
            var _this = this;
            if (doNotBuild === void 0) { doNotBuild = false; }
            if (configuration === this._imageProcessingConfiguration) {
                return;
            }
            // Detaches observer.
            if (this._imageProcessingConfiguration && this._imageProcessingObserver) {
                this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver);
            }
            // Pick the scene configuration if needed.
            if (!configuration) {
                var scene = null;
                var engine = this.getEngine();
                var camera = this.getCamera();
                if (camera) {
                    scene = camera.getScene();
                }
                else if (engine && engine.scenes) {
                    var scenes = engine.scenes;
                    scene = scenes[scenes.length - 1];
                }
                else {
                    scene = BABYLON.Engine.LastCreatedScene;
                }
                this._imageProcessingConfiguration = scene.imageProcessingConfiguration;
            }
            else {
                this._imageProcessingConfiguration = configuration;
            }
            // Attaches observer.
            this._imageProcessingObserver = this._imageProcessingConfiguration.onUpdateParameters.add(function (conf) {
                _this._updateParameters();
            });
            // Ensure the effect will be rebuilt.
            if (!doNotBuild) {
                this._updateParameters();
            }
        };
        Object.defineProperty(ImageProcessingPostProcess.prototype, "colorCurves", {
            /**
             * Gets Color curves setup used in the effect if colorCurvesEnabled is set to true .
             */
            get: function () {
                return this.imageProcessingConfiguration.colorCurves;
            },
            /**
             * Sets Color curves setup used in the effect if colorCurvesEnabled is set to true .
             */
            set: function (value) {
                this.imageProcessingConfiguration.colorCurves = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImageProcessingPostProcess.prototype, "colorCurvesEnabled", {
            /**
             * Gets wether the color curves effect is enabled.
             */
            get: function () {
                return this.imageProcessingConfiguration.colorCurvesEnabled;
            },
            /**
             * Sets wether the color curves effect is enabled.
             */
            set: function (value) {
                this.imageProcessingConfiguration.colorCurvesEnabled = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImageProcessingPostProcess.prototype, "colorGradingTexture", {
            /**
             * Gets Color grading LUT texture used in the effect if colorGradingEnabled is set to true.
             */
            get: function () {
                return this.imageProcessingConfiguration.colorGradingTexture;
            },
            /**
             * Sets Color grading LUT texture used in the effect if colorGradingEnabled is set to true.
             */
            set: function (value) {
                this.imageProcessingConfiguration.colorGradingTexture = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImageProcessingPostProcess.prototype, "colorGradingEnabled", {
            /**
             * Gets wether the color grading effect is enabled.
             */
            get: function () {
                return this.imageProcessingConfiguration.colorGradingEnabled;
            },
            /**
             * Gets wether the color grading effect is enabled.
             */
            set: function (value) {
                this.imageProcessingConfiguration.colorGradingEnabled = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImageProcessingPostProcess.prototype, "exposure", {
            /**
             * Gets exposure used in the effect.
             */
            get: function () {
                return this.imageProcessingConfiguration.exposure;
            },
            /**
             * Sets exposure used in the effect.
             */
            set: function (value) {
                this.imageProcessingConfiguration.exposure = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImageProcessingPostProcess.prototype, "toneMappingEnabled", {
            /**
             * Gets wether tonemapping is enabled or not.
             */
            get: function () {
                return this._imageProcessingConfiguration.toneMappingEnabled;
            },
            /**
             * Sets wether tonemapping is enabled or not
             */
            set: function (value) {
                this._imageProcessingConfiguration.toneMappingEnabled = value;
            },
            enumerable: true,
            configurable: true
        });
        ;
        ;
        Object.defineProperty(ImageProcessingPostProcess.prototype, "contrast", {
            /**
             * Gets contrast used in the effect.
             */
            get: function () {
                return this.imageProcessingConfiguration.contrast;
            },
            /**
             * Sets contrast used in the effect.
             */
            set: function (value) {
                this.imageProcessingConfiguration.contrast = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImageProcessingPostProcess.prototype, "vignetteStretch", {
            /**
             * Gets Vignette stretch size.
             */
            get: function () {
                return this.imageProcessingConfiguration.vignetteStretch;
            },
            /**
             * Sets Vignette stretch size.
             */
            set: function (value) {
                this.imageProcessingConfiguration.vignetteStretch = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImageProcessingPostProcess.prototype, "vignetteCentreX", {
            /**
             * Gets Vignette centre X Offset.
             */
            get: function () {
                return this.imageProcessingConfiguration.vignetteCentreX;
            },
            /**
             * Sets Vignette centre X Offset.
             */
            set: function (value) {
                this.imageProcessingConfiguration.vignetteCentreX = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImageProcessingPostProcess.prototype, "vignetteCentreY", {
            /**
             * Gets Vignette centre Y Offset.
             */
            get: function () {
                return this.imageProcessingConfiguration.vignetteCentreY;
            },
            /**
             * Sets Vignette centre Y Offset.
             */
            set: function (value) {
                this.imageProcessingConfiguration.vignetteCentreY = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImageProcessingPostProcess.prototype, "vignetteWeight", {
            /**
             * Gets Vignette weight or intensity of the vignette effect.
             */
            get: function () {
                return this.imageProcessingConfiguration.vignetteWeight;
            },
            /**
             * Sets Vignette weight or intensity of the vignette effect.
             */
            set: function (value) {
                this.imageProcessingConfiguration.vignetteWeight = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImageProcessingPostProcess.prototype, "vignetteColor", {
            /**
             * Gets Color of the vignette applied on the screen through the chosen blend mode (vignetteBlendMode)
             * if vignetteEnabled is set to true.
             */
            get: function () {
                return this.imageProcessingConfiguration.vignetteColor;
            },
            /**
             * Sets Color of the vignette applied on the screen through the chosen blend mode (vignetteBlendMode)
             * if vignetteEnabled is set to true.
             */
            set: function (value) {
                this.imageProcessingConfiguration.vignetteColor = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImageProcessingPostProcess.prototype, "vignetteCameraFov", {
            /**
             * Gets Camera field of view used by the Vignette effect.
             */
            get: function () {
                return this.imageProcessingConfiguration.vignetteCameraFov;
            },
            /**
             * Sets Camera field of view used by the Vignette effect.
             */
            set: function (value) {
                this.imageProcessingConfiguration.vignetteCameraFov = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImageProcessingPostProcess.prototype, "vignetteBlendMode", {
            /**
             * Gets the vignette blend mode allowing different kind of effect.
             */
            get: function () {
                return this.imageProcessingConfiguration.vignetteBlendMode;
            },
            /**
             * Sets the vignette blend mode allowing different kind of effect.
             */
            set: function (value) {
                this.imageProcessingConfiguration.vignetteBlendMode = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImageProcessingPostProcess.prototype, "vignetteEnabled", {
            /**
             * Gets wether the vignette effect is enabled.
             */
            get: function () {
                return this.imageProcessingConfiguration.vignetteEnabled;
            },
            /**
             * Sets wether the vignette effect is enabled.
             */
            set: function (value) {
                this.imageProcessingConfiguration.vignetteEnabled = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImageProcessingPostProcess.prototype, "fromLinearSpace", {
            /**
             * Gets wether the input of the processing is in Gamma or Linear Space.
             */
            get: function () {
                return this._fromLinearSpace;
            },
            /**
             * Sets wether the input of the processing is in Gamma or Linear Space.
             */
            set: function (value) {
                if (this._fromLinearSpace === value) {
                    return;
                }
                this._fromLinearSpace = value;
                this._updateParameters();
            },
            enumerable: true,
            configurable: true
        });
        ImageProcessingPostProcess.prototype.getClassName = function () {
            return "ImageProcessingPostProcess";
        };
        ImageProcessingPostProcess.prototype._updateParameters = function () {
            this._defines.FROMLINEARSPACE = this._fromLinearSpace;
            this.imageProcessingConfiguration.prepareDefines(this._defines, true);
            var defines = "";
            for (var define in this._defines) {
                if (this._defines[define]) {
                    defines += "#define " + define + ";\r\n";
                }
            }
            var samplers = ["textureSampler"];
            BABYLON.ImageProcessingConfiguration.PrepareSamplers(samplers, this._defines);
            var uniforms = ["scale"];
            BABYLON.ImageProcessingConfiguration.PrepareUniforms(uniforms, this._defines);
            this.updateEffect(defines, uniforms, samplers);
        };
        ImageProcessingPostProcess.prototype.dispose = function (camera) {
            _super.prototype.dispose.call(this, camera);
            if (this._imageProcessingConfiguration && this._imageProcessingObserver) {
                this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver);
            }
            this.imageProcessingConfiguration.applyByPostProcess = false;
        };
        __decorate([
            BABYLON.serialize()
        ], ImageProcessingPostProcess.prototype, "_fromLinearSpace", void 0);
        return ImageProcessingPostProcess;
    }(BABYLON.PostProcess));
    BABYLON.ImageProcessingPostProcess = ImageProcessingPostProcess;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.imageProcessingPostProcess.js.map

BABYLON.Effect.ShadersStore['defaultVertexShader'] = "#include<__decl__defaultVertex>\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef TANGENT\nattribute vec4 tangent;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<helperFunctions>\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2;\n#endif\n#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0\nvarying vec2 vDiffuseUV;\n#endif\n#if defined(AMBIENT) && AMBIENTDIRECTUV == 0\nvarying vec2 vAmbientUV;\n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0\nvarying vec2 vOpacityUV;\n#endif\n#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0\nvarying vec2 vEmissiveUV;\n#endif\n#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0\nvarying vec2 vLightmapUV;\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM) && SPECULARDIRECTUV == 0\nvarying vec2 vSpecularUV;\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0\nvarying vec2 vBumpUV;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<bumpVertexDeclaration>\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<morphTargetsVertexGlobalDeclaration>\n#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#include<logDepthDeclaration>\nvoid main(void) {\nvec3 positionUpdated=position;\n#ifdef NORMAL \nvec3 normalUpdated=normal;\n#endif\n#ifdef TANGENT\nvec4 tangentUpdated=tangent;\n#endif\n#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvPositionUVW=positionUpdated;\n#endif \n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(positionUpdated,1.0);\nvec4 worldPos=finalWorld*vec4(positionUpdated,1.0);\nvPositionW=vec3(worldPos);\n#ifdef NORMAL\nmat3 normalWorld=mat3(finalWorld);\n#ifdef NONUNIFORMSCALING\nnormalWorld=transposeMat3(inverseMat3(normalWorld));\n#endif\nvNormalW=normalize(normalWorld*normalUpdated);\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvDirectionW=normalize(vec3(finalWorld*vec4(positionUpdated,0.0)));\n#endif\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef MAINUV1\nvMainUV1=uv;\n#endif\n#ifdef MAINUV2\nvMainUV2=uv2;\n#endif\n#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0\nif (vDiffuseInfos.x == 0.)\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(AMBIENT) && AMBIENTDIRECTUV == 0\nif (vAmbientInfos.x == 0.)\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0\nif (vOpacityInfos.x == 0.)\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0\nif (vEmissiveInfos.x == 0.)\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0\nif (vLightmapInfos.x == 0.)\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM) && SPECULARDIRECTUV == 0\nif (vSpecularInfos.x == 0.)\n{\nvSpecularUV=vec2(specularMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvSpecularUV=vec2(specularMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0\nif (vBumpInfos.x == 0.)\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#include<bumpVertex>\n#include<clipPlaneVertex>\n#include<fogVertex>\n#include<shadowsVertex>[0..maxSimultaneousLights]\n#ifdef VERTEXCOLOR\n\nvColor=color;\n#endif\n#include<pointCloudVertex>\n#include<logDepthVertex>\n}";
BABYLON.Effect.ShadersStore['defaultPixelShader'] = "#include<__decl__defaultFragment>\n#if defined(BUMP) || !defined(NORMAL)\n#extension GL_OES_standard_derivatives : enable\n#endif\n#ifdef LOGARITHMICDEPTH\n#extension GL_EXT_frag_depth : enable\n#endif\n\n#define RECIPROCAL_PI2 0.15915494\nuniform vec3 vEyePosition;\nuniform vec3 vAmbientColor;\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2;\n#endif\n\n#include<helperFunctions>\n\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n\n#ifdef DIFFUSE\n#if DIFFUSEDIRECTUV == 1\n#define vDiffuseUV vMainUV1\n#elif DIFFUSEDIRECTUV == 2\n#define vDiffuseUV vMainUV2\n#else\nvarying vec2 vDiffuseUV;\n#endif\nuniform sampler2D diffuseSampler;\n#endif\n#ifdef AMBIENT\n#if AMBIENTDIRECTUV == 1\n#define vAmbientUV vMainUV1\n#elif AMBIENTDIRECTUV == 2\n#define vAmbientUV vMainUV2\n#else\nvarying vec2 vAmbientUV;\n#endif\nuniform sampler2D ambientSampler;\n#endif\n#ifdef OPACITY \n#if OPACITYDIRECTUV == 1\n#define vOpacityUV vMainUV1\n#elif OPACITYDIRECTUV == 2\n#define vOpacityUV vMainUV2\n#else\nvarying vec2 vOpacityUV;\n#endif\nuniform sampler2D opacitySampler;\n#endif\n#ifdef EMISSIVE\n#if EMISSIVEDIRECTUV == 1\n#define vEmissiveUV vMainUV1\n#elif EMISSIVEDIRECTUV == 2\n#define vEmissiveUV vMainUV2\n#else\nvarying vec2 vEmissiveUV;\n#endif\nuniform sampler2D emissiveSampler;\n#endif\n#ifdef LIGHTMAP\n#if LIGHTMAPDIRECTUV == 1\n#define vLightmapUV vMainUV1\n#elif LIGHTMAPDIRECTUV == 2\n#define vLightmapUV vMainUV2\n#else\nvarying vec2 vLightmapUV;\n#endif\nuniform sampler2D lightmapSampler;\n#endif\n#ifdef REFRACTION\n#ifdef REFRACTIONMAP_3D\nuniform samplerCube refractionCubeSampler;\n#else\nuniform sampler2D refraction2DSampler;\n#endif\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\n#if SPECULARDIRECTUV == 1\n#define vSpecularUV vMainUV1\n#elif SPECULARDIRECTUV == 2\n#define vSpecularUV vMainUV2\n#else\nvarying vec2 vSpecularUV;\n#endif\nuniform sampler2D specularSampler;\n#endif\n\n#include<fresnelFunction>\n\n#ifdef REFLECTION\n#ifdef REFLECTIONMAP_3D\nuniform samplerCube reflectionCubeSampler;\n#else\nuniform sampler2D reflection2DSampler;\n#endif\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#else\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#endif\n#include<reflectionFunction>\n#endif\n#include<imageProcessingDeclaration>\n#include<imageProcessingFunctions>\n#include<bumpFragmentFunctions>\n#include<clipPlaneFragmentDeclaration>\n#include<logDepthDeclaration>\n#include<fogFragmentDeclaration>\nvoid main(void) {\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\nvec4 baseColor=vec4(1.,1.,1.,1.);\nvec3 diffuseColor=vDiffuseColor.rgb;\n\nfloat alpha=vDiffuseColor.a;\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=normalize(-cross(dFdx(vPositionW),dFdy(vPositionW)));\n#endif\n#include<bumpFragment>\n#ifdef TWOSIDEDLIGHTING\nnormalW=gl_FrontFacing ? normalW : -normalW;\n#endif\n#ifdef DIFFUSE\nbaseColor=texture2D(diffuseSampler,vDiffuseUV+uvOffset);\n#ifdef ALPHATEST\nif (baseColor.a<0.4)\ndiscard;\n#endif\n#ifdef ALPHAFROMDIFFUSE\nalpha*=baseColor.a;\n#endif\nbaseColor.rgb*=vDiffuseInfos.y;\n#endif\n#include<depthPrePass>\n#ifdef VERTEXCOLOR\nbaseColor.rgb*=vColor.rgb;\n#endif\n\nvec3 baseAmbientColor=vec3(1.,1.,1.);\n#ifdef AMBIENT\nbaseAmbientColor=texture2D(ambientSampler,vAmbientUV+uvOffset).rgb*vAmbientInfos.y;\n#endif\n\n#ifdef SPECULARTERM\nfloat glossiness=vSpecularColor.a;\nvec3 specularColor=vSpecularColor.rgb;\n#ifdef SPECULAR\nvec4 specularMapColor=texture2D(specularSampler,vSpecularUV+uvOffset);\nspecularColor=specularMapColor.rgb;\n#ifdef GLOSSINESS\nglossiness=glossiness*specularMapColor.a;\n#endif\n#endif\n#else\nfloat glossiness=0.;\n#endif\n\nvec3 diffuseBase=vec3(0.,0.,0.);\nlightingInfo info;\n#ifdef SPECULARTERM\nvec3 specularBase=vec3(0.,0.,0.);\n#endif\nfloat shadow=1.;\n#ifdef LIGHTMAP\nvec3 lightmapColor=texture2D(lightmapSampler,vLightmapUV+uvOffset).rgb*vLightmapInfos.y;\n#endif\n#include<lightFragment>[0..maxSimultaneousLights]\n\nvec3 refractionColor=vec3(0.,0.,0.);\n#ifdef REFRACTION\nvec3 refractionVector=normalize(refract(-viewDirectionW,normalW,vRefractionInfos.y));\n#ifdef REFRACTIONMAP_3D\nrefractionVector.y=refractionVector.y*vRefractionInfos.w;\nif (dot(refractionVector,viewDirectionW)<1.0)\n{\nrefractionColor=textureCube(refractionCubeSampler,refractionVector).rgb*vRefractionInfos.x;\n}\n#else\nvec3 vRefractionUVW=vec3(refractionMatrix*(view*vec4(vPositionW+refractionVector*vRefractionInfos.z,1.0)));\nvec2 refractionCoords=vRefractionUVW.xy/vRefractionUVW.z;\nrefractionCoords.y=1.0-refractionCoords.y;\nrefractionColor=texture2D(refraction2DSampler,refractionCoords).rgb*vRefractionInfos.x;\n#endif\n#endif\n\nvec3 reflectionColor=vec3(0.,0.,0.);\n#ifdef REFLECTION\nvec3 vReflectionUVW=computeReflectionCoords(vec4(vPositionW,1.0),normalW);\n#ifdef REFLECTIONMAP_3D\n#ifdef ROUGHNESS\nfloat bias=vReflectionInfos.y;\n#ifdef SPECULARTERM\n#ifdef SPECULAR\n#ifdef GLOSSINESS\nbias*=(1.0-specularMapColor.a);\n#endif\n#endif\n#endif\nreflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW,bias).rgb*vReflectionInfos.x;\n#else\nreflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW).rgb*vReflectionInfos.x;\n#endif\n#else\nvec2 coords=vReflectionUVW.xy;\n#ifdef REFLECTIONMAP_PROJECTION\ncoords/=vReflectionUVW.z;\n#endif\ncoords.y=1.0-coords.y;\nreflectionColor=texture2D(reflection2DSampler,coords).rgb*vReflectionInfos.x;\n#endif\n#ifdef REFLECTIONFRESNEL\nfloat reflectionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,reflectionRightColor.a,reflectionLeftColor.a);\n#ifdef REFLECTIONFRESNELFROMSPECULAR\n#ifdef SPECULARTERM\nreflectionColor*=specularColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#else\nreflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#endif\n#else\nreflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#endif\n#endif\n#endif\n#ifdef REFRACTIONFRESNEL\nfloat refractionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,refractionRightColor.a,refractionLeftColor.a);\nrefractionColor*=refractionLeftColor.rgb*(1.0-refractionFresnelTerm)+refractionFresnelTerm*refractionRightColor.rgb;\n#endif\n#ifdef OPACITY\nvec4 opacityMap=texture2D(opacitySampler,vOpacityUV+uvOffset);\n#ifdef OPACITYRGB\nopacityMap.rgb=opacityMap.rgb*vec3(0.3,0.59,0.11);\nalpha*=(opacityMap.x+opacityMap.y+opacityMap.z)* vOpacityInfos.y;\n#else\nalpha*=opacityMap.a*vOpacityInfos.y;\n#endif\n#endif\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\n#ifdef OPACITYFRESNEL\nfloat opacityFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,opacityParts.z,opacityParts.w);\nalpha+=opacityParts.x*(1.0-opacityFresnelTerm)+opacityFresnelTerm*opacityParts.y;\n#endif\n\nvec3 emissiveColor=vEmissiveColor;\n#ifdef EMISSIVE\nemissiveColor+=texture2D(emissiveSampler,vEmissiveUV+uvOffset).rgb*vEmissiveInfos.y;\n#endif\n#ifdef EMISSIVEFRESNEL\nfloat emissiveFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,emissiveRightColor.a,emissiveLeftColor.a);\nemissiveColor*=emissiveLeftColor.rgb*(1.0-emissiveFresnelTerm)+emissiveFresnelTerm*emissiveRightColor.rgb;\n#endif\n\n#ifdef DIFFUSEFRESNEL\nfloat diffuseFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,diffuseRightColor.a,diffuseLeftColor.a);\ndiffuseBase*=diffuseLeftColor.rgb*(1.0-diffuseFresnelTerm)+diffuseFresnelTerm*diffuseRightColor.rgb;\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#else\n#ifdef LINKEMISSIVEWITHDIFFUSE\nvec3 finalDiffuse=clamp((diffuseBase+emissiveColor)*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#else\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor+emissiveColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#endif\n#endif\n#ifdef SPECULARTERM\nvec3 finalSpecular=specularBase*specularColor;\n#ifdef SPECULAROVERALPHA\nalpha=clamp(alpha+dot(finalSpecular,vec3(0.3,0.59,0.11)),0.,1.);\n#endif\n#else\nvec3 finalSpecular=vec3(0.0);\n#endif\n#ifdef REFLECTIONOVERALPHA\nalpha=clamp(alpha+dot(reflectionColor,vec3(0.3,0.59,0.11)),0.,1.);\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec4 color=vec4(clamp(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+emissiveColor+refractionColor,0.0,1.0),alpha);\n#else\nvec4 color=vec4(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+refractionColor,alpha);\n#endif\n\n#ifdef LIGHTMAP\n#ifndef LIGHTMAPEXCLUDED\n#ifdef USELIGHTMAPASSHADOWMAP\ncolor.rgb*=lightmapColor;\n#else\ncolor.rgb+=lightmapColor;\n#endif\n#endif\n#endif\n#include<logDepthFragment>\n#include<fogFragment>\n\n\n#ifdef IMAGEPROCESSINGPOSTPROCESS\ncolor.rgb=toLinearSpace(color.rgb);\n#else\n#ifdef IMAGEPROCESSING\ncolor.rgb=toLinearSpace(color.rgb);\ncolor=applyImageProcessing(color);\n#endif\n#endif\n#ifdef PREMULTIPLYALPHA\n\ncolor.rgb*=color.a;\n#endif\ngl_FragColor=color;\n}";
BABYLON.Effect.ShadersStore['postprocessVertexShader'] = "\nattribute vec2 position;\nuniform vec2 scale;\n\nvarying vec2 vUV;\nconst vec2 madd=vec2(0.5,0.5);\nvoid main(void) { \nvUV=(position*madd+madd)*scale;\ngl_Position=vec4(position,0.0,1.0);\n}";
BABYLON.Effect.ShadersStore['passPixelShader'] = "\nvarying vec2 vUV;\nuniform sampler2D textureSampler;\nvoid main(void) \n{\ngl_FragColor=texture2D(textureSampler,vUV);\n}";
BABYLON.Effect.ShadersStore['refractionPixelShader'] = "\nvarying vec2 vUV;\nuniform sampler2D textureSampler;\nuniform sampler2D refractionSampler;\n\nuniform vec3 baseColor;\nuniform float depth;\nuniform float colorLevel;\nvoid main() {\nfloat ref=1.0-texture2D(refractionSampler,vUV).r;\nvec2 uv=vUV-vec2(0.5);\nvec2 offset=uv*depth*ref;\nvec3 sourceColor=texture2D(textureSampler,vUV-offset).rgb;\ngl_FragColor=vec4(sourceColor+sourceColor*ref*colorLevel,1.0);\n}";
BABYLON.Effect.ShadersStore['blackAndWhitePixelShader'] = "\nvarying vec2 vUV;\nuniform sampler2D textureSampler;\nuniform float degree;\nvoid main(void) \n{\nvec3 color=texture2D(textureSampler,vUV).rgb;\nfloat luminance=dot(color,vec3(0.3,0.59,0.11)); \nvec3 blackAndWhite=vec3(luminance,luminance,luminance);\ngl_FragColor=vec4(color-((color-blackAndWhite)*degree),1.0);\n}";
BABYLON.Effect.ShadersStore['convolutionPixelShader'] = "\nvarying vec2 vUV;\nuniform sampler2D textureSampler;\nuniform vec2 screenSize;\nuniform float kernel[9];\nvoid main(void)\n{\nvec2 onePixel=vec2(1.0,1.0)/screenSize;\nvec4 colorSum =\ntexture2D(textureSampler,vUV+onePixel*vec2(-1,-1))*kernel[0] +\ntexture2D(textureSampler,vUV+onePixel*vec2(0,-1))*kernel[1] +\ntexture2D(textureSampler,vUV+onePixel*vec2(1,-1))*kernel[2] +\ntexture2D(textureSampler,vUV+onePixel*vec2(-1,0))*kernel[3] +\ntexture2D(textureSampler,vUV+onePixel*vec2(0,0))*kernel[4] +\ntexture2D(textureSampler,vUV+onePixel*vec2(1,0))*kernel[5] +\ntexture2D(textureSampler,vUV+onePixel*vec2(-1,1))*kernel[6] +\ntexture2D(textureSampler,vUV+onePixel*vec2(0,1))*kernel[7] +\ntexture2D(textureSampler,vUV+onePixel*vec2(1,1))*kernel[8];\nfloat kernelWeight =\nkernel[0] +\nkernel[1] +\nkernel[2] +\nkernel[3] +\nkernel[4] +\nkernel[5] +\nkernel[6] +\nkernel[7] +\nkernel[8];\nif (kernelWeight<=0.0) {\nkernelWeight=1.0;\n}\ngl_FragColor=vec4((colorSum/kernelWeight).rgb,1);\n}";
BABYLON.Effect.ShadersStore['filterPixelShader'] = "\nvarying vec2 vUV;\nuniform sampler2D textureSampler;\nuniform mat4 kernelMatrix;\nvoid main(void)\n{\nvec3 baseColor=texture2D(textureSampler,vUV).rgb;\nvec3 updatedColor=(kernelMatrix*vec4(baseColor,1.0)).rgb;\ngl_FragColor=vec4(updatedColor,1.0);\n}";
BABYLON.Effect.ShadersStore['fxaaPixelShader'] = "uniform sampler2D textureSampler;\nuniform vec2 texelSize;\nvarying vec2 vUV;\nvarying vec2 sampleCoordS;\nvarying vec2 sampleCoordE;\nvarying vec2 sampleCoordN;\nvarying vec2 sampleCoordW;\nvarying vec2 sampleCoordNW;\nvarying vec2 sampleCoordSE;\nvarying vec2 sampleCoordNE;\nvarying vec2 sampleCoordSW;\nconst float fxaaQualitySubpix=1.0;\nconst float fxaaQualityEdgeThreshold=0.166;\nconst float fxaaQualityEdgeThresholdMin=0.0833;\nconst vec3 kLumaCoefficients=vec3(0.2126,0.7152,0.0722);\n#define FxaaLuma(rgba) dot(rgba.rgb,kLumaCoefficients)\nvoid main(){\nvec2 posM;\nposM.x=vUV.x;\nposM.y=vUV.y;\nvec4 rgbyM=texture2D(textureSampler,vUV,0.0);\nfloat lumaM=FxaaLuma(rgbyM);\nfloat lumaS=FxaaLuma(texture2D(textureSampler,sampleCoordS,0.0));\nfloat lumaE=FxaaLuma(texture2D(textureSampler,sampleCoordE,0.0));\nfloat lumaN=FxaaLuma(texture2D(textureSampler,sampleCoordN,0.0));\nfloat lumaW=FxaaLuma(texture2D(textureSampler,sampleCoordW,0.0));\nfloat maxSM=max(lumaS,lumaM);\nfloat minSM=min(lumaS,lumaM);\nfloat maxESM=max(lumaE,maxSM);\nfloat minESM=min(lumaE,minSM);\nfloat maxWN=max(lumaN,lumaW);\nfloat minWN=min(lumaN,lumaW);\nfloat rangeMax=max(maxWN,maxESM);\nfloat rangeMin=min(minWN,minESM);\nfloat rangeMaxScaled=rangeMax*fxaaQualityEdgeThreshold;\nfloat range=rangeMax-rangeMin;\nfloat rangeMaxClamped=max(fxaaQualityEdgeThresholdMin,rangeMaxScaled);\nif(range<rangeMaxClamped) \n{\ngl_FragColor=rgbyM;\nreturn;\n}\nfloat lumaNW=FxaaLuma(texture2D(textureSampler,sampleCoordNW,0.0));\nfloat lumaSE=FxaaLuma(texture2D(textureSampler,sampleCoordSE,0.0));\nfloat lumaNE=FxaaLuma(texture2D(textureSampler,sampleCoordNE,0.0));\nfloat lumaSW=FxaaLuma(texture2D(textureSampler,sampleCoordSW,0.0));\nfloat lumaNS=lumaN+lumaS;\nfloat lumaWE=lumaW+lumaE;\nfloat subpixRcpRange=1.0/range;\nfloat subpixNSWE=lumaNS+lumaWE;\nfloat edgeHorz1=(-2.0*lumaM)+lumaNS;\nfloat edgeVert1=(-2.0*lumaM)+lumaWE;\nfloat lumaNESE=lumaNE+lumaSE;\nfloat lumaNWNE=lumaNW+lumaNE;\nfloat edgeHorz2=(-2.0*lumaE)+lumaNESE;\nfloat edgeVert2=(-2.0*lumaN)+lumaNWNE;\nfloat lumaNWSW=lumaNW+lumaSW;\nfloat lumaSWSE=lumaSW+lumaSE;\nfloat edgeHorz4=(abs(edgeHorz1)*2.0)+abs(edgeHorz2);\nfloat edgeVert4=(abs(edgeVert1)*2.0)+abs(edgeVert2);\nfloat edgeHorz3=(-2.0*lumaW)+lumaNWSW;\nfloat edgeVert3=(-2.0*lumaS)+lumaSWSE;\nfloat edgeHorz=abs(edgeHorz3)+edgeHorz4;\nfloat edgeVert=abs(edgeVert3)+edgeVert4;\nfloat subpixNWSWNESE=lumaNWSW+lumaNESE;\nfloat lengthSign=texelSize.x;\nbool horzSpan=edgeHorz>=edgeVert;\nfloat subpixA=subpixNSWE*2.0+subpixNWSWNESE;\nif (!horzSpan)\n{\nlumaN=lumaW;\n}\nif (!horzSpan) \n{\nlumaS=lumaE;\n}\nif (horzSpan) \n{\nlengthSign=texelSize.y;\n}\nfloat subpixB=(subpixA*(1.0/12.0))-lumaM;\nfloat gradientN=lumaN-lumaM;\nfloat gradientS=lumaS-lumaM;\nfloat lumaNN=lumaN+lumaM;\nfloat lumaSS=lumaS+lumaM;\nbool pairN=abs(gradientN)>=abs(gradientS);\nfloat gradient=max(abs(gradientN),abs(gradientS));\nif (pairN)\n{\nlengthSign=-lengthSign;\n}\nfloat subpixC=clamp(abs(subpixB)*subpixRcpRange,0.0,1.0);\nvec2 posB;\nposB.x=posM.x;\nposB.y=posM.y;\nvec2 offNP;\noffNP.x=(!horzSpan) ? 0.0 : texelSize.x;\noffNP.y=(horzSpan) ? 0.0 : texelSize.y;\nif (!horzSpan) \n{\nposB.x+=lengthSign*0.5;\n}\nif (horzSpan)\n{\nposB.y+=lengthSign*0.5;\n}\nvec2 posN;\nposN.x=posB.x-offNP.x*1.5;\nposN.y=posB.y-offNP.y*1.5;\nvec2 posP;\nposP.x=posB.x+offNP.x*1.5;\nposP.y=posB.y+offNP.y*1.5;\nfloat subpixD=((-2.0)*subpixC)+3.0;\nfloat lumaEndN=FxaaLuma(texture2D(textureSampler,posN,0.0));\nfloat subpixE=subpixC*subpixC;\nfloat lumaEndP=FxaaLuma(texture2D(textureSampler,posP,0.0));\nif (!pairN) \n{\nlumaNN=lumaSS;\n}\nfloat gradientScaled=gradient*1.0/4.0;\nfloat lumaMM=lumaM-lumaNN*0.5;\nfloat subpixF=subpixD*subpixE;\nbool lumaMLTZero=lumaMM<0.0;\nlumaEndN-=lumaNN*0.5;\nlumaEndP-=lumaNN*0.5;\nbool doneN=abs(lumaEndN)>=gradientScaled;\nbool doneP=abs(lumaEndP)>=gradientScaled;\nif (!doneN) \n{\nposN.x-=offNP.x*3.0;\n}\nif (!doneN) \n{\nposN.y-=offNP.y*3.0;\n}\nbool doneNP=(!doneN) || (!doneP);\nif (!doneP) \n{\nposP.x+=offNP.x*3.0;\n}\nif (!doneP)\n{\nposP.y+=offNP.y*3.0;\n}\nif (doneNP)\n{\nif (!doneN) lumaEndN=FxaaLuma(texture2D(textureSampler,posN.xy,0.0));\nif (!doneP) lumaEndP=FxaaLuma(texture2D(textureSampler,posP.xy,0.0));\nif (!doneN) lumaEndN=lumaEndN-lumaNN*0.5;\nif (!doneP) lumaEndP=lumaEndP-lumaNN*0.5;\ndoneN=abs(lumaEndN)>=gradientScaled;\ndoneP=abs(lumaEndP)>=gradientScaled;\nif (!doneN) posN.x-=offNP.x*12.0;\nif (!doneN) posN.y-=offNP.y*12.0;\ndoneNP=(!doneN) || (!doneP);\nif (!doneP) posP.x+=offNP.x*12.0;\nif (!doneP) posP.y+=offNP.y*12.0;\n}\nfloat dstN=posM.x-posN.x;\nfloat dstP=posP.x-posM.x;\nif (!horzSpan)\n{\ndstN=posM.y-posN.y;\n}\nif (!horzSpan) \n{\ndstP=posP.y-posM.y;\n}\nbool goodSpanN=(lumaEndN<0.0) != lumaMLTZero;\nfloat spanLength=(dstP+dstN);\nbool goodSpanP=(lumaEndP<0.0) != lumaMLTZero;\nfloat spanLengthRcp=1.0/spanLength;\nbool directionN=dstN<dstP;\nfloat dst=min(dstN,dstP);\nbool goodSpan=directionN ? goodSpanN : goodSpanP;\nfloat subpixG=subpixF*subpixF;\nfloat pixelOffset=(dst*(-spanLengthRcp))+0.5;\nfloat subpixH=subpixG*fxaaQualitySubpix;\nfloat pixelOffsetGood=goodSpan ? pixelOffset : 0.0;\nfloat pixelOffsetSubpix=max(pixelOffsetGood,subpixH);\nif (!horzSpan)\n{\nposM.x+=pixelOffsetSubpix*lengthSign;\n}\nif (horzSpan)\n{\nposM.y+=pixelOffsetSubpix*lengthSign;\n}\ngl_FragColor=texture2D(textureSampler,posM,0.0);\n}";
BABYLON.Effect.ShadersStore['volumetricLightScatteringPixelShader'] = "uniform sampler2D textureSampler;\nuniform sampler2D lightScatteringSampler;\nuniform float decay;\nuniform float exposure;\nuniform float weight;\nuniform float density;\nuniform vec2 meshPositionOnScreen;\nvarying vec2 vUV;\nvoid main(void) {\nvec2 tc=vUV;\nvec2 deltaTexCoord=(tc-meshPositionOnScreen.xy);\ndeltaTexCoord*=1.0/float(NUM_SAMPLES)*density;\nfloat illuminationDecay=1.0;\nvec4 color=texture2D(lightScatteringSampler,tc)*0.4;\nfor(int i=0; i<NUM_SAMPLES; i++) {\ntc-=deltaTexCoord;\nvec4 dataSample=texture2D(lightScatteringSampler,tc)*0.4;\ndataSample*=illuminationDecay*weight;\ncolor+=dataSample;\nilluminationDecay*=decay;\n}\nvec4 realColor=texture2D(textureSampler,vUV);\ngl_FragColor=((vec4((vec3(color.r,color.g,color.b)*exposure),1))+(realColor*(1.5-0.4)));\n}\n";
BABYLON.Effect.ShadersStore['volumetricLightScatteringPassPixelShader'] = "#if defined(ALPHATEST) || defined(NEED_UV)\nvarying vec2 vUV;\n#endif\n#if defined(ALPHATEST)\nuniform sampler2D diffuseSampler;\n#endif\nvoid main(void)\n{\n#if defined(ALPHATEST)\nvec4 diffuseColor=texture2D(diffuseSampler,vUV);\nif (diffuseColor.a<0.4)\ndiscard;\n#endif\ngl_FragColor=vec4(0.0,0.0,0.0,1.0);\n}\n";
BABYLON.Effect.ShadersStore['colorCorrectionPixelShader'] = "\nuniform sampler2D textureSampler; \nuniform sampler2D colorTable; \n\nvarying vec2 vUV;\n\nconst float SLICE_COUNT=16.0; \n\nvec4 sampleAs3DTexture(sampler2D textureSampler,vec3 uv,float width) {\nfloat sliceSize=1.0/width; \nfloat slicePixelSize=sliceSize/width; \nfloat sliceInnerSize=slicePixelSize*(width-1.0); \nfloat zSlice0=min(floor(uv.z*width),width-1.0);\nfloat zSlice1=min(zSlice0+1.0,width-1.0);\nfloat xOffset=slicePixelSize*0.5+uv.x*sliceInnerSize;\nfloat s0=xOffset+(zSlice0*sliceSize);\nfloat s1=xOffset+(zSlice1*sliceSize);\nvec4 slice0Color=texture2D(textureSampler,vec2(s0,uv.y));\nvec4 slice1Color=texture2D(textureSampler,vec2(s1,uv.y));\nfloat zOffset=mod(uv.z*width,1.0);\nvec4 result=mix(slice0Color,slice1Color,zOffset);\nreturn result;\n}\nvoid main(void)\n{\nvec4 screen_color=texture2D(textureSampler,vUV);\ngl_FragColor=sampleAs3DTexture(colorTable,screen_color.rgb,SLICE_COUNT);\n}";
BABYLON.Effect.ShadersStore['tonemapPixelShader'] = "\nvarying vec2 vUV;\nuniform sampler2D textureSampler;\n\nuniform float _ExposureAdjustment;\n#if defined(HABLE_TONEMAPPING)\nconst float A=0.15;\nconst float B=0.50;\nconst float C=0.10;\nconst float D=0.20;\nconst float E=0.02;\nconst float F=0.30;\nconst float W=11.2;\n#endif\nfloat Luminance(vec3 c)\n{\nreturn dot(c,vec3(0.22,0.707,0.071));\n}\nvoid main(void) \n{\nvec3 colour=texture2D(textureSampler,vUV).rgb;\n#if defined(REINHARD_TONEMAPPING)\nfloat lum=Luminance(colour.rgb); \nfloat lumTm=lum*_ExposureAdjustment;\nfloat scale=lumTm/(1.0+lumTm); \ncolour*=scale/lum;\n#elif defined(HABLE_TONEMAPPING)\ncolour*=_ExposureAdjustment;\nconst float ExposureBias=2.0;\nvec3 x=ExposureBias*colour;\nvec3 curr=((x*(A*x+C*B)+D*E)/(x*(A*x+B)+D*F))-E/F;\nx=vec3(W,W,W);\nvec3 whiteScale=1.0/(((x*(A*x+C*B)+D*E)/(x*(A*x+B)+D*F))-E/F);\ncolour=curr*whiteScale;\n#elif defined(OPTIMIZED_HEJIDAWSON_TONEMAPPING)\ncolour*=_ExposureAdjustment;\nvec3 X=max(vec3(0.0,0.0,0.0),colour-0.004);\nvec3 retColor=(X*(6.2*X+0.5))/(X*(6.2*X+1.7)+0.06);\ncolour=retColor*retColor;\n#elif defined(PHOTOGRAPHIC_TONEMAPPING)\ncolour=vec3(1.0,1.0,1.0)-exp2(-_ExposureAdjustment*colour);\n#endif\ngl_FragColor=vec4(colour.rgb,1.0);\n}";
BABYLON.Effect.ShadersStore['displayPassPixelShader'] = "\nvarying vec2 vUV;\nuniform sampler2D textureSampler;\nuniform sampler2D passSampler;\nvoid main(void)\n{\ngl_FragColor=texture2D(passSampler,vUV);\n}";
BABYLON.Effect.ShadersStore['highlightsPixelShader'] = "\nvarying vec2 vUV;\nuniform sampler2D textureSampler;\nconst vec3 RGBLuminanceCoefficients=vec3(0.2126,0.7152,0.0722);\nvoid main(void) \n{\nvec4 tex=texture2D(textureSampler,vUV);\nvec3 c=tex.rgb;\nfloat luma=dot(c.rgb,RGBLuminanceCoefficients);\n\n\ngl_FragColor=vec4(pow(c,vec3(25.0-luma*15.0)),tex.a); \n}";
BABYLON.Effect.ShadersStore['imageProcessingPixelShader'] = "\nvarying vec2 vUV;\nuniform sampler2D textureSampler;\n#include<imageProcessingDeclaration>\n#include<helperFunctions>\n#include<imageProcessingFunctions>\nvoid main(void)\n{\nvec4 result=texture2D(textureSampler,vUV);\n#ifdef IMAGEPROCESSING\n#ifndef FROMLINEARSPACE\n\nresult.rgb=toLinearSpace(result.rgb);\n#endif\nresult=applyImageProcessing(result);\n#else\n\n#ifdef FROMLINEARSPACE\nresult=applyImageProcessing(result);\n#endif\n#endif\ngl_FragColor=result;\n}";

BABYLON.Effect.IncludesShadersStore['depthPrePass'] = "#ifdef DEPTHPREPASS\ngl_FragColor=vec4(0.,0.,0.,1.0);\nreturn;\n#endif";
BABYLON.Effect.IncludesShadersStore['bonesDeclaration'] = "#if NUM_BONE_INFLUENCERS>0\nuniform mat4 mBones[BonesPerMesh];\nattribute vec4 matricesIndices;\nattribute vec4 matricesWeights;\n#if NUM_BONE_INFLUENCERS>4\nattribute vec4 matricesIndicesExtra;\nattribute vec4 matricesWeightsExtra;\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['instancesDeclaration'] = "#ifdef INSTANCES\nattribute vec4 world0;\nattribute vec4 world1;\nattribute vec4 world2;\nattribute vec4 world3;\n#else\nuniform mat4 world;\n#endif";
BABYLON.Effect.IncludesShadersStore['pointCloudVertexDeclaration'] = "#ifdef POINTSIZE\nuniform float pointSize;\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpVertexDeclaration'] = "#if defined(BUMP) || defined(PARALLAX)\n#if defined(TANGENT) && defined(NORMAL) \nvarying mat3 vTBN;\n#endif\n#endif\n";
BABYLON.Effect.IncludesShadersStore['clipPlaneVertexDeclaration'] = "#ifdef CLIPPLANE\nuniform vec4 vClipPlane;\nvarying float fClipDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogVertexDeclaration'] = "#ifdef FOG\nvarying vec3 vFogDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertexGlobalDeclaration'] = "#ifdef MORPHTARGETS\nuniform float morphTargetInfluences[NUM_MORPH_INFLUENCERS];\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertexDeclaration'] = "#ifdef MORPHTARGETS\nattribute vec3 position{X};\n#ifdef MORPHTARGETS_NORMAL\nattribute vec3 normal{X};\n#endif\n#ifdef MORPHTARGETS_TANGENT\nattribute vec3 tangent{X};\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthDeclaration'] = "#ifdef LOGARITHMICDEPTH\nuniform float logarithmicDepthConstant;\nvarying float vFragmentDepth;\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertex'] = "#ifdef MORPHTARGETS\npositionUpdated+=(position{X}-position)*morphTargetInfluences[{X}];\n#ifdef MORPHTARGETS_NORMAL\nnormalUpdated+=(normal{X}-normal)*morphTargetInfluences[{X}];\n#endif\n#ifdef MORPHTARGETS_TANGENT\ntangentUpdated.xyz+=(tangent{X}-tangent.xyz)*morphTargetInfluences[{X}];\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['instancesVertex'] = "#ifdef INSTANCES\nmat4 finalWorld=mat4(world0,world1,world2,world3);\n#else\nmat4 finalWorld=world;\n#endif";
BABYLON.Effect.IncludesShadersStore['bonesVertex'] = "#if NUM_BONE_INFLUENCERS>0\nmat4 influence;\ninfluence=mBones[int(matricesIndices[0])]*matricesWeights[0];\n#if NUM_BONE_INFLUENCERS>1\ninfluence+=mBones[int(matricesIndices[1])]*matricesWeights[1];\n#endif \n#if NUM_BONE_INFLUENCERS>2\ninfluence+=mBones[int(matricesIndices[2])]*matricesWeights[2];\n#endif \n#if NUM_BONE_INFLUENCERS>3\ninfluence+=mBones[int(matricesIndices[3])]*matricesWeights[3];\n#endif \n#if NUM_BONE_INFLUENCERS>4\ninfluence+=mBones[int(matricesIndicesExtra[0])]*matricesWeightsExtra[0];\n#endif \n#if NUM_BONE_INFLUENCERS>5\ninfluence+=mBones[int(matricesIndicesExtra[1])]*matricesWeightsExtra[1];\n#endif \n#if NUM_BONE_INFLUENCERS>6\ninfluence+=mBones[int(matricesIndicesExtra[2])]*matricesWeightsExtra[2];\n#endif \n#if NUM_BONE_INFLUENCERS>7\ninfluence+=mBones[int(matricesIndicesExtra[3])]*matricesWeightsExtra[3];\n#endif \nfinalWorld=finalWorld*influence;\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpVertex'] = "#if defined(BUMP) || defined(PARALLAX)\n#if defined(TANGENT) && defined(NORMAL)\nvec3 tbnNormal=normalize(normalUpdated);\nvec3 tbnTangent=normalize(tangentUpdated.xyz);\nvec3 tbnBitangent=cross(tbnNormal,tbnTangent)*tangentUpdated.w;\nvTBN=mat3(finalWorld)*mat3(tbnTangent,tbnBitangent,tbnNormal);\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneVertex'] = "#ifdef CLIPPLANE\nfClipDistance=dot(worldPos,vClipPlane);\n#endif";
BABYLON.Effect.IncludesShadersStore['fogVertex'] = "#ifdef FOG\nvFogDistance=(view*worldPos).xyz;\n#endif";
BABYLON.Effect.IncludesShadersStore['shadowsVertex'] = "#ifdef SHADOWS\n#if defined(SHADOW{X}) && !defined(SHADOWCUBE{X})\nvPositionFromLight{X}=lightMatrix{X}*worldPos;\nvDepthMetric{X}=((vPositionFromLight{X}.z+light{X}.depthValues.x)/(light{X}.depthValues.y));\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['pointCloudVertex'] = "#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthVertex'] = "#ifdef LOGARITHMICDEPTH\nvFragmentDepth=1.0+gl_Position.w;\ngl_Position.z=log2(max(0.000001,vFragmentDepth))*logarithmicDepthConstant;\n#endif";
BABYLON.Effect.IncludesShadersStore['helperFunctions'] = "const float PI=3.1415926535897932384626433832795;\nconst float LinearEncodePowerApprox=2.2;\nconst float GammaEncodePowerApprox=1.0/LinearEncodePowerApprox;\nconst vec3 LuminanceEncodeApprox=vec3(0.2126,0.7152,0.0722);\nmat3 transposeMat3(mat3 inMatrix) {\nvec3 i0=inMatrix[0];\nvec3 i1=inMatrix[1];\nvec3 i2=inMatrix[2];\nmat3 outMatrix=mat3(\nvec3(i0.x,i1.x,i2.x),\nvec3(i0.y,i1.y,i2.y),\nvec3(i0.z,i1.z,i2.z)\n);\nreturn outMatrix;\n}\n\nmat3 inverseMat3(mat3 inMatrix) {\nfloat a00=inMatrix[0][0],a01=inMatrix[0][1],a02=inMatrix[0][2];\nfloat a10=inMatrix[1][0],a11=inMatrix[1][1],a12=inMatrix[1][2];\nfloat a20=inMatrix[2][0],a21=inMatrix[2][1],a22=inMatrix[2][2];\nfloat b01=a22*a11-a12*a21;\nfloat b11=-a22*a10+a12*a20;\nfloat b21=a21*a10-a11*a20;\nfloat det=a00*b01+a01*b11+a02*b21;\nreturn mat3(b01,(-a22*a01+a02*a21),(a12*a01-a02*a11),\nb11,(a22*a00-a02*a20),(-a12*a00+a02*a10),\nb21,(-a21*a00+a01*a20),(a11*a00-a01*a10))/det;\n}\nfloat computeFallOff(float value,vec2 clipSpace,float frustumEdgeFalloff)\n{\nfloat mask=smoothstep(1.0-frustumEdgeFalloff,1.0,clamp(dot(clipSpace,clipSpace),0.,1.));\nreturn mix(value,1.0,mask);\n}\nvec3 applyEaseInOut(vec3 x){\nreturn x*x*(3.0-2.0*x);\n}\nvec3 toLinearSpace(vec3 color)\n{\nreturn pow(color,vec3(LinearEncodePowerApprox));\n}\nvec3 toGammaSpace(vec3 color)\n{\nreturn pow(color,vec3(GammaEncodePowerApprox));\n}\nfloat square(float value)\n{\nreturn value*value;\n}\nfloat getLuminance(vec3 color)\n{\nreturn clamp(dot(color,LuminanceEncodeApprox),0.,1.);\n}\n\nfloat getRand(vec2 seed) {\nreturn fract(sin(dot(seed.xy ,vec2(12.9898,78.233)))*43758.5453);\n}\nvec3 dither(vec2 seed,vec3 color) {\nfloat rand=getRand(seed);\ncolor+=mix(-0.5/255.0,0.5/255.0,rand);\ncolor=max(color,0.0);\nreturn color;\n}";
BABYLON.Effect.IncludesShadersStore['lightFragmentDeclaration'] = "#ifdef LIGHT{X}\nuniform vec4 vLightData{X};\nuniform vec4 vLightDiffuse{X};\n#ifdef SPECULARTERM\nuniform vec3 vLightSpecular{X};\n#else\nvec3 vLightSpecular{X}=vec3(0.);\n#endif\n#ifdef SHADOW{X}\n#if defined(SHADOWCUBE{X})\nuniform samplerCube shadowSampler{X};\n#else\nvarying vec4 vPositionFromLight{X};\nvarying float vDepthMetric{X};\nuniform sampler2D shadowSampler{X};\nuniform mat4 lightMatrix{X};\n#endif\nuniform vec4 shadowsInfo{X};\nuniform vec2 depthValues{X};\n#endif\n#ifdef SPOTLIGHT{X}\nuniform vec4 vLightDirection{X};\n#endif\n#ifdef HEMILIGHT{X}\nuniform vec3 vLightGround{X};\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['lightsFragmentFunctions'] = "\nstruct lightingInfo\n{\nvec3 diffuse;\n#ifdef SPECULARTERM\nvec3 specular;\n#endif\n#ifdef NDOTL\nfloat ndl;\n#endif\n};\nlightingInfo computeLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,float range,float glossiness) {\nlightingInfo result;\nvec3 lightVectorW;\nfloat attenuation=1.0;\nif (lightData.w == 0.)\n{\nvec3 direction=lightData.xyz-vPositionW;\nattenuation=max(0.,1.0-length(direction)/range);\nlightVectorW=normalize(direction);\n}\nelse\n{\nlightVectorW=normalize(-lightData.xyz);\n}\n\nfloat ndl=max(0.,dot(vNormal,lightVectorW));\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=ndl*diffuseColor*attenuation;\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightVectorW);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor*attenuation;\n#endif\nreturn result;\n}\nlightingInfo computeSpotLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec4 lightDirection,vec3 diffuseColor,vec3 specularColor,float range,float glossiness) {\nlightingInfo result;\nvec3 direction=lightData.xyz-vPositionW;\nvec3 lightVectorW=normalize(direction);\nfloat attenuation=max(0.,1.0-length(direction)/range);\n\nfloat cosAngle=max(0.,dot(lightDirection.xyz,-lightVectorW));\nif (cosAngle>=lightDirection.w)\n{\ncosAngle=max(0.,pow(cosAngle,lightData.w));\nattenuation*=cosAngle;\n\nfloat ndl=max(0.,dot(vNormal,lightVectorW));\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=ndl*diffuseColor*attenuation;\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightVectorW);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor*attenuation;\n#endif\nreturn result;\n}\nresult.diffuse=vec3(0.);\n#ifdef SPECULARTERM\nresult.specular=vec3(0.);\n#endif\n#ifdef NDOTL\nresult.ndl=0.;\n#endif\nreturn result;\n}\nlightingInfo computeHemisphericLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,vec3 groundColor,float glossiness) {\nlightingInfo result;\n\nfloat ndl=dot(vNormal,lightData.xyz)*0.5+0.5;\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=mix(groundColor,diffuseColor,ndl);\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightData.xyz);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor;\n#endif\nreturn result;\n}\n";
BABYLON.Effect.IncludesShadersStore['lightUboDeclaration'] = "#ifdef LIGHT{X}\nuniform Light{X}\n{\nvec4 vLightData;\nvec4 vLightDiffuse;\nvec3 vLightSpecular;\n#ifdef SPOTLIGHT{X}\nvec4 vLightDirection;\n#endif\n#ifdef HEMILIGHT{X}\nvec3 vLightGround;\n#endif\nvec4 shadowsInfo;\nvec2 depthValues;\n} light{X};\n#ifdef SHADOW{X}\n#if defined(SHADOWCUBE{X})\nuniform samplerCube shadowSampler{X};\n#else\nvarying vec4 vPositionFromLight{X};\nvarying float vDepthMetric{X};\nuniform sampler2D shadowSampler{X};\nuniform mat4 lightMatrix{X};\n#endif\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['defaultVertexDeclaration'] = "\nuniform mat4 viewProjection;\nuniform mat4 view;\n#ifdef DIFFUSE\nuniform mat4 diffuseMatrix;\nuniform vec2 vDiffuseInfos;\n#endif\n#ifdef AMBIENT\nuniform mat4 ambientMatrix;\nuniform vec2 vAmbientInfos;\n#endif\n#ifdef OPACITY\nuniform mat4 opacityMatrix;\nuniform vec2 vOpacityInfos;\n#endif\n#ifdef EMISSIVE\nuniform vec2 vEmissiveInfos;\nuniform mat4 emissiveMatrix;\n#endif\n#ifdef LIGHTMAP\nuniform vec2 vLightmapInfos;\nuniform mat4 lightmapMatrix;\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\nuniform vec2 vSpecularInfos;\nuniform mat4 specularMatrix;\n#endif\n#ifdef BUMP\nuniform vec3 vBumpInfos;\nuniform mat4 bumpMatrix;\n#endif\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n";
BABYLON.Effect.IncludesShadersStore['defaultFragmentDeclaration'] = "uniform vec4 vDiffuseColor;\n#ifdef SPECULARTERM\nuniform vec4 vSpecularColor;\n#endif\nuniform vec3 vEmissiveColor;\n\n#ifdef DIFFUSE\nuniform vec2 vDiffuseInfos;\n#endif\n#ifdef AMBIENT\nuniform vec2 vAmbientInfos;\n#endif\n#ifdef OPACITY \nuniform vec2 vOpacityInfos;\n#endif\n#ifdef EMISSIVE\nuniform vec2 vEmissiveInfos;\n#endif\n#ifdef LIGHTMAP\nuniform vec2 vLightmapInfos;\n#endif\n#ifdef BUMP\nuniform vec3 vBumpInfos;\nuniform vec2 vTangentSpaceParams;\n#endif\n#if defined(REFLECTIONMAP_SPHERICAL) || defined(REFLECTIONMAP_PROJECTION) || defined(REFRACTION)\nuniform mat4 view;\n#endif\n#ifdef REFRACTION\nuniform vec4 vRefractionInfos;\n#ifndef REFRACTIONMAP_3D\nuniform mat4 refractionMatrix;\n#endif\n#ifdef REFRACTIONFRESNEL\nuniform vec4 refractionLeftColor;\nuniform vec4 refractionRightColor;\n#endif\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\nuniform vec2 vSpecularInfos;\n#endif\n#ifdef DIFFUSEFRESNEL\nuniform vec4 diffuseLeftColor;\nuniform vec4 diffuseRightColor;\n#endif\n#ifdef OPACITYFRESNEL\nuniform vec4 opacityParts;\n#endif\n#ifdef EMISSIVEFRESNEL\nuniform vec4 emissiveLeftColor;\nuniform vec4 emissiveRightColor;\n#endif\n\n#ifdef REFLECTION\nuniform vec2 vReflectionInfos;\n#ifdef REFLECTIONMAP_SKYBOX\n#else\n#if defined(REFLECTIONMAP_PLANAR) || defined(REFLECTIONMAP_CUBIC) || defined(REFLECTIONMAP_PROJECTION)\nuniform mat4 reflectionMatrix;\n#endif\n#endif\n#ifdef REFLECTIONFRESNEL\nuniform vec4 reflectionLeftColor;\nuniform vec4 reflectionRightColor;\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['defaultUboDeclaration'] = "layout(std140,column_major) uniform;\nuniform Material\n{\nvec4 diffuseLeftColor;\nvec4 diffuseRightColor;\nvec4 opacityParts;\nvec4 reflectionLeftColor;\nvec4 reflectionRightColor;\nvec4 refractionLeftColor;\nvec4 refractionRightColor;\nvec4 emissiveLeftColor; \nvec4 emissiveRightColor;\nvec2 vDiffuseInfos;\nvec2 vAmbientInfos;\nvec2 vOpacityInfos;\nvec2 vReflectionInfos;\nvec2 vEmissiveInfos;\nvec2 vLightmapInfos;\nvec2 vSpecularInfos;\nvec3 vBumpInfos;\nmat4 diffuseMatrix;\nmat4 ambientMatrix;\nmat4 opacityMatrix;\nmat4 reflectionMatrix;\nmat4 emissiveMatrix;\nmat4 lightmapMatrix;\nmat4 specularMatrix;\nmat4 bumpMatrix; \nvec4 vTangentSpaceParams;\nmat4 refractionMatrix;\nvec4 vRefractionInfos;\nvec4 vSpecularColor;\nvec3 vEmissiveColor;\nvec4 vDiffuseColor;\nfloat pointSize; \n};\nuniform Scene {\nmat4 viewProjection;\nmat4 view;\n};";
BABYLON.Effect.IncludesShadersStore['shadowsFragmentFunctions'] = "#ifdef SHADOWS\n#ifndef SHADOWFLOAT\nfloat unpack(vec4 color)\n{\nconst vec4 bit_shift=vec4(1.0/(255.0*255.0*255.0),1.0/(255.0*255.0),1.0/255.0,1.0);\nreturn dot(color,bit_shift);\n}\n#endif\nfloat computeShadowCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\ndepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadow=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadow=textureCube(shadowSampler,directionToLight).x;\n#endif\nif (depth>shadow)\n{\nreturn darkness;\n}\nreturn 1.0;\n}\nfloat computeShadowWithPCFCube(vec3 lightPosition,samplerCube shadowSampler,float mapSize,float darkness,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\ndepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\nfloat visibility=1.;\nvec3 poissonDisk[4];\npoissonDisk[0]=vec3(-1.0,1.0,-1.0);\npoissonDisk[1]=vec3(1.0,-1.0,-1.0);\npoissonDisk[2]=vec3(-1.0,-1.0,-1.0);\npoissonDisk[3]=vec3(1.0,-1.0,1.0);\n\n#ifndef SHADOWFLOAT\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[0]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[1]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[2]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[3]*mapSize))<depth) visibility-=0.25;\n#else\nif (textureCube(shadowSampler,directionToLight+poissonDisk[0]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[1]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[2]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[3]*mapSize).x<depth) visibility-=0.25;\n#endif\nreturn min(1.0,visibility+darkness);\n}\nfloat computeShadowWithESMCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,float depthScale,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\nfloat shadowPixelDepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadowMapSample=textureCube(shadowSampler,directionToLight).x;\n#endif\nfloat esm=1.0-clamp(exp(min(87.,depthScale*shadowPixelDepth))*shadowMapSample,0.,1.-darkness); \nreturn esm;\n}\nfloat computeShadowWithCloseESMCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,float depthScale,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\nfloat shadowPixelDepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadowMapSample=textureCube(shadowSampler,directionToLight).x;\n#endif\nfloat esm=clamp(exp(min(87.,-depthScale*(shadowPixelDepth-shadowMapSample))),darkness,1.);\nreturn esm;\n}\nfloat computeShadow(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\n#ifndef SHADOWFLOAT\nfloat shadow=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadow=texture2D(shadowSampler,uv).x;\n#endif\nif (shadowPixelDepth>shadow)\n{\nreturn computeFallOff(darkness,clipSpace.xy,frustumEdgeFalloff);\n}\nreturn 1.;\n}\nfloat computeShadowWithPCF(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float mapSize,float darkness,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\nfloat visibility=1.;\nvec2 poissonDisk[4];\npoissonDisk[0]=vec2(-0.94201624,-0.39906216);\npoissonDisk[1]=vec2(0.94558609,-0.76890725);\npoissonDisk[2]=vec2(-0.094184101,-0.92938870);\npoissonDisk[3]=vec2(0.34495938,0.29387760);\n\n#ifndef SHADOWFLOAT\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[0]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[1]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[2]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[3]*mapSize))<shadowPixelDepth) visibility-=0.25;\n#else\nif (texture2D(shadowSampler,uv+poissonDisk[0]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[1]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[2]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[3]*mapSize).x<shadowPixelDepth) visibility-=0.25;\n#endif\nreturn computeFallOff(min(1.0,visibility+darkness),clipSpace.xy,frustumEdgeFalloff);\n}\nfloat computeShadowWithESM(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float depthScale,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadowMapSample=texture2D(shadowSampler,uv).x;\n#endif\nfloat esm=1.0-clamp(exp(min(87.,depthScale*shadowPixelDepth))*shadowMapSample,0.,1.-darkness);\nreturn computeFallOff(esm,clipSpace.xy,frustumEdgeFalloff);\n}\nfloat computeShadowWithCloseESM(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float depthScale,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0); \n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadowMapSample=texture2D(shadowSampler,uv).x;\n#endif\nfloat esm=clamp(exp(min(87.,-depthScale*(shadowPixelDepth-shadowMapSample))),darkness,1.);\nreturn computeFallOff(esm,clipSpace.xy,frustumEdgeFalloff);\n}\n#endif\n";
BABYLON.Effect.IncludesShadersStore['fresnelFunction'] = "#ifdef FRESNEL\nfloat computeFresnelTerm(vec3 viewDirection,vec3 worldNormal,float bias,float power)\n{\nfloat fresnelTerm=pow(bias+abs(dot(viewDirection,worldNormal)),power);\nreturn clamp(fresnelTerm,0.,1.);\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['reflectionFunction'] = "vec3 computeReflectionCoords(vec4 worldPos,vec3 worldNormal)\n{\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvec3 direction=normalize(vDirectionW);\nfloat t=clamp(direction.y*-0.5+0.5,0.,1.0);\nfloat s=atan(direction.z,direction.x)*RECIPROCAL_PI2+0.5;\n#ifdef REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED\nreturn vec3(1.0-s,t,0);\n#else\nreturn vec3(s,t,0);\n#endif\n#endif\n#ifdef REFLECTIONMAP_EQUIRECTANGULAR\nvec3 cameraToVertex=normalize(worldPos.xyz-vEyePosition.xyz);\nvec3 r=reflect(cameraToVertex,worldNormal);\nfloat t=clamp(r.y*-0.5+0.5,0.,1.0);\nfloat s=atan(r.z,r.x)*RECIPROCAL_PI2+0.5;\nreturn vec3(s,t,0);\n#endif\n#ifdef REFLECTIONMAP_SPHERICAL\nvec3 viewDir=normalize(vec3(view*worldPos));\nvec3 viewNormal=normalize(vec3(view*vec4(worldNormal,0.0)));\nvec3 r=reflect(viewDir,viewNormal);\nr.z=r.z-1.0;\nfloat m=2.0*length(r);\nreturn vec3(r.x/m+0.5,1.0-r.y/m-0.5,0);\n#endif\n#ifdef REFLECTIONMAP_PLANAR\nvec3 viewDir=worldPos.xyz-vEyePosition.xyz;\nvec3 coords=normalize(reflect(viewDir,worldNormal));\nreturn vec3(reflectionMatrix*vec4(coords,1));\n#endif\n#ifdef REFLECTIONMAP_CUBIC\nvec3 viewDir=worldPos.xyz-vEyePosition.xyz;\nvec3 coords=reflect(viewDir,worldNormal);\n#ifdef INVERTCUBICMAP\ncoords.y=1.0-coords.y;\n#endif\nreturn vec3(reflectionMatrix*vec4(coords,0));\n#endif\n#ifdef REFLECTIONMAP_PROJECTION\nreturn vec3(reflectionMatrix*(view*worldPos));\n#endif\n#ifdef REFLECTIONMAP_SKYBOX\nreturn vPositionUVW;\n#endif\n#ifdef REFLECTIONMAP_EXPLICIT\nreturn vec3(0,0,0);\n#endif\n}";
BABYLON.Effect.IncludesShadersStore['imageProcessingDeclaration'] = "#ifdef EXPOSURE\nuniform float exposureLinear;\n#endif\n#ifdef CONTRAST\nuniform float contrast;\n#endif\n#ifdef VIGNETTE\nuniform vec2 vInverseScreenSize;\nuniform vec4 vignetteSettings1;\nuniform vec4 vignetteSettings2;\n#endif\n#ifdef COLORCURVES\nuniform vec4 vCameraColorCurveNegative;\nuniform vec4 vCameraColorCurveNeutral;\nuniform vec4 vCameraColorCurvePositive;\n#endif\n#ifdef COLORGRADING\n#ifdef COLORGRADING3D\nuniform highp sampler3D txColorTransform;\n#else\nuniform sampler2D txColorTransform;\n#endif\nuniform vec4 colorTransformSettings;\n#endif";
BABYLON.Effect.IncludesShadersStore['imageProcessingFunctions'] = "#if defined(COLORGRADING) && !defined(COLORGRADING3D)\n\nvec3 sampleTexture3D(sampler2D colorTransform,vec3 color,vec2 sampler3dSetting)\n{\nfloat sliceSize=2.0*sampler3dSetting.x; \n#ifdef SAMPLER3DGREENDEPTH\nfloat sliceContinuous=(color.g-sampler3dSetting.x)*sampler3dSetting.y;\n#else\nfloat sliceContinuous=(color.b-sampler3dSetting.x)*sampler3dSetting.y;\n#endif\nfloat sliceInteger=floor(sliceContinuous);\n\n\nfloat sliceFraction=sliceContinuous-sliceInteger;\n#ifdef SAMPLER3DGREENDEPTH\nvec2 sliceUV=color.rb;\n#else\nvec2 sliceUV=color.rg;\n#endif\nsliceUV.x*=sliceSize;\nsliceUV.x+=sliceInteger*sliceSize;\nsliceUV=clamp(sliceUV,0.,1.);\nvec4 slice0Color=texture2D(colorTransform,sliceUV);\nsliceUV.x+=sliceSize;\nsliceUV=clamp(sliceUV,0.,1.);\nvec4 slice1Color=texture2D(colorTransform,sliceUV);\nvec3 result=mix(slice0Color.rgb,slice1Color.rgb,sliceFraction);\n#ifdef SAMPLER3DBGRMAP\ncolor.rgb=result.rgb;\n#else\ncolor.rgb=result.bgr;\n#endif\nreturn color;\n}\n#endif\nvec4 applyImageProcessing(vec4 result) {\n#ifdef EXPOSURE\nresult.rgb*=exposureLinear;\n#endif\n#ifdef VIGNETTE\n\nvec2 viewportXY=gl_FragCoord.xy*vInverseScreenSize;\nviewportXY=viewportXY*2.0-1.0;\nvec3 vignetteXY1=vec3(viewportXY*vignetteSettings1.xy+vignetteSettings1.zw,1.0);\nfloat vignetteTerm=dot(vignetteXY1,vignetteXY1);\nfloat vignette=pow(vignetteTerm,vignetteSettings2.w);\n\nvec3 vignetteColor=vignetteSettings2.rgb;\n#ifdef VIGNETTEBLENDMODEMULTIPLY\nvec3 vignetteColorMultiplier=mix(vignetteColor,vec3(1,1,1),vignette);\nresult.rgb*=vignetteColorMultiplier;\n#endif\n#ifdef VIGNETTEBLENDMODEOPAQUE\nresult.rgb=mix(vignetteColor,result.rgb,vignette);\n#endif\n#endif\n#ifdef TONEMAPPING\nconst float tonemappingCalibration=1.590579;\nresult.rgb=1.0-exp2(-tonemappingCalibration*result.rgb);\n#endif\n\nresult.rgb=toGammaSpace(result.rgb);\nresult.rgb=clamp(result.rgb,0.0,1.0);\n#ifdef CONTRAST\n\nvec3 resultHighContrast=applyEaseInOut(result.rgb);\nif (contrast<1.0) {\n\nresult.rgb=mix(vec3(0.5,0.5,0.5),result.rgb,contrast);\n} else {\n\nresult.rgb=mix(result.rgb,resultHighContrast,contrast-1.0);\n}\n#endif\n\n#ifdef COLORGRADING\nvec3 colorTransformInput=result.rgb*colorTransformSettings.xxx+colorTransformSettings.yyy;\n#ifdef COLORGRADING3D\nvec3 colorTransformOutput=texture(txColorTransform,colorTransformInput).rgb;\n#else\nvec3 colorTransformOutput=sampleTexture3D(txColorTransform,colorTransformInput,colorTransformSettings.yz).rgb;\n#endif\nresult.rgb=mix(result.rgb,colorTransformOutput,colorTransformSettings.www);\n#endif\n#ifdef COLORCURVES\n\nfloat luma=getLuminance(result.rgb);\nvec2 curveMix=clamp(vec2(luma*3.0-1.5,luma*-3.0+1.5),vec2(0.0),vec2(1.0));\nvec4 colorCurve=vCameraColorCurveNeutral+curveMix.x*vCameraColorCurvePositive-curveMix.y*vCameraColorCurveNegative;\nresult.rgb*=colorCurve.rgb;\nresult.rgb=mix(vec3(luma),result.rgb,colorCurve.a);\n#endif\nreturn result;\n}";
BABYLON.Effect.IncludesShadersStore['bumpFragmentFunctions'] = "#ifdef BUMP\n#if BUMPDIRECTUV == 1\n#define vBumpUV vMainUV1\n#elif BUMPDIRECTUV == 2\n#define vBumpUV vMainUV2\n#else\nvarying vec2 vBumpUV;\n#endif\nuniform sampler2D bumpSampler;\n#if defined(TANGENT) && defined(NORMAL) \nvarying mat3 vTBN;\n#endif\n\nmat3 cotangent_frame(vec3 normal,vec3 p,vec2 uv)\n{\n\nuv=gl_FrontFacing ? uv : -uv;\n\nvec3 dp1=dFdx(p);\nvec3 dp2=dFdy(p);\nvec2 duv1=dFdx(uv);\nvec2 duv2=dFdy(uv);\n\nvec3 dp2perp=cross(dp2,normal);\nvec3 dp1perp=cross(normal,dp1);\nvec3 tangent=dp2perp*duv1.x+dp1perp*duv2.x;\nvec3 bitangent=dp2perp*duv1.y+dp1perp*duv2.y;\n\ntangent*=vTangentSpaceParams.x;\nbitangent*=vTangentSpaceParams.y;\n\nfloat invmax=inversesqrt(max(dot(tangent,tangent),dot(bitangent,bitangent)));\nreturn mat3(tangent*invmax,bitangent*invmax,normal);\n}\nvec3 perturbNormal(mat3 cotangentFrame,vec2 uv)\n{\nvec3 map=texture2D(bumpSampler,uv).xyz;\nmap=map*2.0-1.0;\n#ifdef NORMALXYSCALE\nmap=normalize(map*vec3(vBumpInfos.y,vBumpInfos.y,1.0));\n#endif\nreturn normalize(cotangentFrame*map);\n}\n#ifdef PARALLAX\nconst float minSamples=4.;\nconst float maxSamples=15.;\nconst int iMaxSamples=15;\n\nvec2 parallaxOcclusion(vec3 vViewDirCoT,vec3 vNormalCoT,vec2 texCoord,float parallaxScale) {\nfloat parallaxLimit=length(vViewDirCoT.xy)/vViewDirCoT.z;\nparallaxLimit*=parallaxScale;\nvec2 vOffsetDir=normalize(vViewDirCoT.xy);\nvec2 vMaxOffset=vOffsetDir*parallaxLimit;\nfloat numSamples=maxSamples+(dot(vViewDirCoT,vNormalCoT)*(minSamples-maxSamples));\nfloat stepSize=1.0/numSamples;\n\nfloat currRayHeight=1.0;\nvec2 vCurrOffset=vec2(0,0);\nvec2 vLastOffset=vec2(0,0);\nfloat lastSampledHeight=1.0;\nfloat currSampledHeight=1.0;\nfor (int i=0; i<iMaxSamples; i++)\n{\ncurrSampledHeight=texture2D(bumpSampler,vBumpUV+vCurrOffset).w;\n\nif (currSampledHeight>currRayHeight)\n{\nfloat delta1=currSampledHeight-currRayHeight;\nfloat delta2=(currRayHeight+stepSize)-lastSampledHeight;\nfloat ratio=delta1/(delta1+delta2);\nvCurrOffset=(ratio)* vLastOffset+(1.0-ratio)*vCurrOffset;\n\nbreak;\n}\nelse\n{\ncurrRayHeight-=stepSize;\nvLastOffset=vCurrOffset;\nvCurrOffset+=stepSize*vMaxOffset;\nlastSampledHeight=currSampledHeight;\n}\n}\nreturn vCurrOffset;\n}\nvec2 parallaxOffset(vec3 viewDir,float heightScale)\n{\n\nfloat height=texture2D(bumpSampler,vBumpUV).w;\nvec2 texCoordOffset=heightScale*viewDir.xy*height;\nreturn -texCoordOffset;\n}\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneFragmentDeclaration'] = "#ifdef CLIPPLANE\nvarying float fClipDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogFragmentDeclaration'] = "#ifdef FOG\n#define FOGMODE_NONE 0.\n#define FOGMODE_EXP 1.\n#define FOGMODE_EXP2 2.\n#define FOGMODE_LINEAR 3.\n#define E 2.71828\nuniform vec4 vFogInfos;\nuniform vec3 vFogColor;\nvarying vec3 vFogDistance;\nfloat CalcFogFactor()\n{\nfloat fogCoeff=1.0;\nfloat fogStart=vFogInfos.y;\nfloat fogEnd=vFogInfos.z;\nfloat fogDensity=vFogInfos.w;\nfloat fogDistance=length(vFogDistance);\nif (FOGMODE_LINEAR == vFogInfos.x)\n{\nfogCoeff=(fogEnd-fogDistance)/(fogEnd-fogStart);\n}\nelse if (FOGMODE_EXP == vFogInfos.x)\n{\nfogCoeff=1.0/pow(E,fogDistance*fogDensity);\n}\nelse if (FOGMODE_EXP2 == vFogInfos.x)\n{\nfogCoeff=1.0/pow(E,fogDistance*fogDistance*fogDensity*fogDensity);\n}\nreturn clamp(fogCoeff,0.0,1.0);\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneFragment'] = "#ifdef CLIPPLANE\nif (fClipDistance>0.0)\n{\ndiscard;\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpFragment'] = "vec2 uvOffset=vec2(0.0,0.0);\n#if defined(BUMP) || defined(PARALLAX)\n#ifdef NORMALXYSCALE\nfloat normalScale=1.0;\n#else \nfloat normalScale=vBumpInfos.y;\n#endif\n#if defined(TANGENT) && defined(NORMAL)\nmat3 TBN=vTBN;\n#else\nmat3 TBN=cotangent_frame(normalW*normalScale,vPositionW,vBumpUV);\n#endif\n#endif\n#ifdef PARALLAX\nmat3 invTBN=transposeMat3(TBN);\n#ifdef PARALLAXOCCLUSION\nuvOffset=parallaxOcclusion(invTBN*-viewDirectionW,invTBN*normalW,vBumpUV,vBumpInfos.z);\n#else\nuvOffset=parallaxOffset(invTBN*viewDirectionW,vBumpInfos.z);\n#endif\n#endif\n#ifdef BUMP\nnormalW=perturbNormal(TBN,vBumpUV+uvOffset);\n#endif";
BABYLON.Effect.IncludesShadersStore['lightFragment'] = "#ifdef LIGHT{X}\n#if defined(SHADOWONLY) || (defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X}) && defined(LIGHTMAPNOSPECULAR{X}))\n\n#else\n#ifdef PBR\n#ifdef SPOTLIGHT{X}\ninfo=computeSpotLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDirection,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#ifdef HEMILIGHT{X}\ninfo=computeHemisphericLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightGround,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#if defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})\ninfo=computeLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#else\n#ifdef SPOTLIGHT{X}\ninfo=computeSpotLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDirection,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,glossiness);\n#endif\n#ifdef HEMILIGHT{X}\ninfo=computeHemisphericLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightGround,glossiness);\n#endif\n#if defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})\ninfo=computeLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,glossiness);\n#endif\n#endif\n#endif\n#ifdef SHADOW{X}\n#ifdef SHADOWCLOSEESM{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithCloseESMCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.depthValues);\n#else\nshadow=computeShadowWithCloseESM(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.shadowsInfo.w);\n#endif\n#else\n#ifdef SHADOWESM{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithESMCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.depthValues);\n#else\nshadow=computeShadowWithESM(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.shadowsInfo.w);\n#endif\n#else \n#ifdef SHADOWPCF{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithPCFCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.x,light{X}.depthValues);\n#else\nshadow=computeShadowWithPCF(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);\n#endif\n#else\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.depthValues);\n#else\nshadow=computeShadow(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);\n#endif\n#endif\n#endif\n#endif\n#ifdef SHADOWONLY\n#ifndef SHADOWINUSE\n#define SHADOWINUSE\n#endif\nglobalShadow+=shadow;\nshadowLightCount+=1.0;\n#endif\n#else\nshadow=1.;\n#endif\n#ifndef SHADOWONLY\n#ifdef CUSTOMUSERLIGHTING\ndiffuseBase+=computeCustomDiffuseLighting(info,diffuseBase,shadow);\n#ifdef SPECULARTERM\nspecularBase+=computeCustomSpecularLighting(info,specularBase,shadow);\n#endif\n#elif defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X})\ndiffuseBase+=lightmapColor*shadow;\n#ifdef SPECULARTERM\n#ifndef LIGHTMAPNOSPECULAR{X}\nspecularBase+=info.specular*shadow*lightmapColor;\n#endif\n#endif\n#else\ndiffuseBase+=info.diffuse*shadow;\n#ifdef SPECULARTERM\nspecularBase+=info.specular*shadow;\n#endif\n#endif\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthFragment'] = "#ifdef LOGARITHMICDEPTH\ngl_FragDepthEXT=log2(vFragmentDepth)*logarithmicDepthConstant*0.5;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogFragment'] = "#ifdef FOG\nfloat fog=CalcFogFactor();\ncolor.rgb=fog*color.rgb+(1.0-fog)*vFogColor;\n#endif";
var RefractionPostProcess = BABYLON.RefractionPostProcess;
var BlackAndWhitePostProcess = BABYLON.BlackAndWhitePostProcess;
var ConvolutionPostProcess = BABYLON.ConvolutionPostProcess;
var FilterPostProcess = BABYLON.FilterPostProcess;
var FxaaPostProcess = BABYLON.FxaaPostProcess;
var VolumetricLightScatteringPostProcess = BABYLON.VolumetricLightScatteringPostProcess;
var ColorCorrectionPostProcess = BABYLON.ColorCorrectionPostProcess;
var TonemappingOperator = BABYLON.TonemappingOperator;
var TonemapPostProcess = BABYLON.TonemapPostProcess;
var DisplayPassPostProcess = BABYLON.DisplayPassPostProcess;
var HighlightsPostProcess = BABYLON.HighlightsPostProcess;
var ImageProcessingPostProcess = BABYLON.ImageProcessingPostProcess;

export { RefractionPostProcess,BlackAndWhitePostProcess,ConvolutionPostProcess,FilterPostProcess,FxaaPostProcess,VolumetricLightScatteringPostProcess,ColorCorrectionPostProcess,TonemappingOperator,TonemapPostProcess,DisplayPassPostProcess,HighlightsPostProcess,ImageProcessingPostProcess };