var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    /**
     * Special Glow Blur post process only blurring the alpha channel
     * It enforces keeping the most luminous color in the color channel.
     */
    var GlowBlurPostProcess = (function (_super) {
        __extends(GlowBlurPostProcess, _super);
        function GlowBlurPostProcess(name, direction, blurWidth, options, camera, samplingMode, engine, reusable) {
            var _this = this;
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.BILINEAR_SAMPLINGMODE; }
            _super.call(this, name, "glowBlurPostProcess", ["screenSize", "direction", "blurWidth"], null, options, camera, samplingMode, engine, reusable);
            this.direction = direction;
            this.blurWidth = blurWidth;
            this.onApplyObservable.add(function (effect) {
                effect.setFloat2("screenSize", _this.width, _this.height);
                effect.setVector2("direction", _this.direction);
                effect.setFloat("blurWidth", _this.blurWidth);
            });
        }
        return GlowBlurPostProcess;
    }(BABYLON.PostProcess));
    /**
     * The highlight layer Helps adding a glow effect around a mesh.
     *
     * Once instantiated in a scene, simply use the pushMesh or removeMesh method to add or remove
     * glowy meshes to your scene.
     *
     * !!! THIS REQUIRES AN ACTIVE STENCIL BUFFER ON THE CANVAS !!!
     */
    var HighlightLayer = (function () {
        /**
         * Instantiates a new highlight Layer and references it to the scene..
         * @param name The name of the layer
         * @param scene The scene to use the layer in
         * @param options Sets of none mandatory options to use with the layer (see IHighlightLayerOptions for more information)
         */
        function HighlightLayer(name, scene, options) {
            this._vertexBuffers = {};
            this._mainTextureDesiredSize = { width: 0, height: 0 };
            this._meshes = {};
            this._maxSize = 0;
            this._shouldRender = false;
            this._instanceGlowingMeshStencilReference = HighlightLayer.glowingMeshStencilReference++;
            this._excludedMeshes = {};
            /**
             * Specifies whether or not the inner glow is ACTIVE in the layer.
             */
            this.innerGlow = true;
            /**
             * Specifies whether or not the outer glow is ACTIVE in the layer.
             */
            this.outerGlow = true;
            /**
             * An event triggered when the highlight layer has been disposed.
             * @type {BABYLON.Observable}
             */
            this.onDisposeObservable = new BABYLON.Observable();
            /**
             * An event triggered when the highlight layer is about rendering the main texture with the glowy parts.
             * @type {BABYLON.Observable}
             */
            this.onBeforeRenderMainTextureObservable = new BABYLON.Observable();
            /**
             * An event triggered when the highlight layer is being blurred.
             * @type {BABYLON.Observable}
             */
            this.onBeforeBlurObservable = new BABYLON.Observable();
            /**
             * An event triggered when the highlight layer has been blurred.
             * @type {BABYLON.Observable}
             */
            this.onAfterBlurObservable = new BABYLON.Observable();
            /**
             * An event triggered when the glowing blurred texture is being merged in the scene.
             * @type {BABYLON.Observable}
             */
            this.onBeforeComposeObservable = new BABYLON.Observable();
            /**
             * An event triggered when the glowing blurred texture has been merged in the scene.
             * @type {BABYLON.Observable}
             */
            this.onAfterComposeObservable = new BABYLON.Observable();
            /**
             * An event triggered when the highlight layer changes its size.
             * @type {BABYLON.Observable}
             */
            this.onSizeChangedObservable = new BABYLON.Observable();
            this._scene = scene;
            var engine = scene.getEngine();
            this._engine = engine;
            this._maxSize = this._engine.getCaps().maxTextureSize;
            this._scene.highlightLayers.push(this);
            // Warn on stencil.
            if (!this._engine.isStencilEnable) {
                BABYLON.Tools.Warn("Rendering the Highlight Layer requires the stencil to be active on the canvas. var engine = new BABYLON.Engine(canvas, antialias, { stencil: true }");
            }
            // Adapt options
            this._options = options || {
                mainTextureRatio: 0.25,
                blurTextureSizeRatio: 0.5,
                blurHorizontalSize: 1,
                blurVerticalSize: 1,
                alphaBlendingMode: BABYLON.Engine.ALPHA_COMBINE
            };
            this._options.mainTextureRatio = this._options.mainTextureRatio || 0.25;
            this._options.blurTextureSizeRatio = this._options.blurTextureSizeRatio || 0.5;
            this._options.blurHorizontalSize = this._options.blurHorizontalSize || 1;
            this._options.blurVerticalSize = this._options.blurVerticalSize || 1;
            this._options.alphaBlendingMode = this._options.alphaBlendingMode || BABYLON.Engine.ALPHA_COMBINE;
            // VBO
            var vertices = [];
            vertices.push(1, 1);
            vertices.push(-1, 1);
            vertices.push(-1, -1);
            vertices.push(1, -1);
            var vertexBuffer = new BABYLON.VertexBuffer(engine, vertices, BABYLON.VertexBuffer.PositionKind, false, false, 2);
            this._vertexBuffers[BABYLON.VertexBuffer.PositionKind] = vertexBuffer;
            // Indices
            var indices = [];
            indices.push(0);
            indices.push(1);
            indices.push(2);
            indices.push(0);
            indices.push(2);
            indices.push(3);
            this._indexBuffer = engine.createIndexBuffer(indices);
            // Effect
            this._glowMapMergeEffect = engine.createEffect("glowMapMerge", [BABYLON.VertexBuffer.PositionKind], ["offset"], ["textureSampler"], "");
            // Render target
            this.setMainTextureSize();
            // Create Textures and post processes
            this.createTextureAndPostProcesses();
        }
        Object.defineProperty(HighlightLayer.prototype, "blurHorizontalSize", {
            /**
             * Gets the horizontal size of the blur.
             */
            get: function () {
                return this._horizontalBlurPostprocess.blurWidth;
            },
            /**
             * Specifies the horizontal size of the blur.
             */
            set: function (value) {
                this._horizontalBlurPostprocess.blurWidth = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HighlightLayer.prototype, "blurVerticalSize", {
            /**
             * Gets the vertical size of the blur.
             */
            get: function () {
                return this._verticalBlurPostprocess.blurWidth;
            },
            /**
             * Specifies the vertical size of the blur.
             */
            set: function (value) {
                this._verticalBlurPostprocess.blurWidth = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HighlightLayer.prototype, "camera", {
            /**
             * Gets the camera attached to the layer.
             */
            get: function () {
                return this._options.camera;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Creates the render target textures and post processes used in the highlight layer.
         */
        HighlightLayer.prototype.createTextureAndPostProcesses = function () {
            var _this = this;
            var blurTextureWidth = this._mainTextureDesiredSize.width * this._options.blurTextureSizeRatio;
            var blurTextureHeight = this._mainTextureDesiredSize.height * this._options.blurTextureSizeRatio;
            blurTextureWidth = BABYLON.Tools.GetExponentOfTwo(blurTextureWidth, this._maxSize);
            blurTextureHeight = BABYLON.Tools.GetExponentOfTwo(blurTextureHeight, this._maxSize);
            this._mainTexture = new BABYLON.RenderTargetTexture("HighlightLayerMainRTT", {
                width: this._mainTextureDesiredSize.width,
                height: this._mainTextureDesiredSize.height
            }, this._scene, false, true, BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
            this._mainTexture.activeCamera = this._options.camera;
            this._mainTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this._mainTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this._mainTexture.anisotropicFilteringLevel = 1;
            this._mainTexture.updateSamplingMode(BABYLON.Texture.BILINEAR_SAMPLINGMODE);
            this._mainTexture.renderParticles = false;
            this._mainTexture.renderList = null;
            this._blurTexture = new BABYLON.RenderTargetTexture("HighlightLayerBlurRTT", {
                width: blurTextureWidth,
                height: blurTextureHeight
            }, this._scene, false, true, BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
            this._blurTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this._blurTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this._blurTexture.anisotropicFilteringLevel = 16;
            this._blurTexture.updateSamplingMode(BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
            this._blurTexture.renderParticles = false;
            this._downSamplePostprocess = new BABYLON.PassPostProcess("HighlightLayerPPP", this._options.blurTextureSizeRatio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine());
            this._downSamplePostprocess.onApplyObservable.add(function (effect) {
                effect.setTexture("textureSampler", _this._mainTexture);
            });
            this._horizontalBlurPostprocess = new GlowBlurPostProcess("HighlightLayerHBP", new BABYLON.Vector2(1.0, 0), this._options.blurHorizontalSize, 1, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine());
            this._horizontalBlurPostprocess.onApplyObservable.add(function (effect) {
                effect.setFloat2("screenSize", blurTextureWidth, blurTextureHeight);
            });
            this._verticalBlurPostprocess = new GlowBlurPostProcess("HighlightLayerVBP", new BABYLON.Vector2(0, 1.0), this._options.blurVerticalSize, 1, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine());
            this._verticalBlurPostprocess.onApplyObservable.add(function (effect) {
                effect.setFloat2("screenSize", blurTextureWidth, blurTextureHeight);
            });
            this._mainTexture.onAfterUnbindObservable.add(function () {
                _this.onBeforeBlurObservable.notifyObservers(_this);
                _this._scene.postProcessManager.directRender([_this._downSamplePostprocess, _this._horizontalBlurPostprocess, _this._verticalBlurPostprocess], _this._blurTexture.getInternalTexture());
                _this.onAfterBlurObservable.notifyObservers(_this);
            });
            // Custom render function
            var renderSubMesh = function (subMesh) {
                var mesh = subMesh.getRenderingMesh();
                var scene = _this._scene;
                var engine = scene.getEngine();
                // Culling
                engine.setState(subMesh.getMaterial().backFaceCulling);
                // Managing instances
                var batch = mesh._getInstancesRenderList(subMesh._id);
                if (batch.mustReturn) {
                    return;
                }
                // Excluded Mesh
                if (_this._excludedMeshes[mesh.id]) {
                    return;
                }
                ;
                var hardwareInstancedRendering = (engine.getCaps().instancedArrays !== null) && (batch.visibleInstances[subMesh._id] !== null) && (batch.visibleInstances[subMesh._id] !== undefined);
                var highlightLayerMesh = _this._meshes[mesh.id];
                var material = subMesh.getMaterial();
                var emissiveTexture = null;
                if (highlightLayerMesh && highlightLayerMesh.glowEmissiveOnly && material) {
                    emissiveTexture = material.emissiveTexture;
                }
                if (_this.isReady(subMesh, hardwareInstancedRendering, emissiveTexture)) {
                    engine.enableEffect(_this._glowMapGenerationEffect);
                    mesh._bind(subMesh, _this._glowMapGenerationEffect, BABYLON.Material.TriangleFillMode);
                    _this._glowMapGenerationEffect.setMatrix("viewProjection", scene.getTransformMatrix());
                    if (highlightLayerMesh) {
                        _this._glowMapGenerationEffect.setFloat4("color", highlightLayerMesh.color.r, highlightLayerMesh.color.g, highlightLayerMesh.color.b, 1.0);
                    }
                    else {
                        _this._glowMapGenerationEffect.setFloat4("color", HighlightLayer.neutralColor.r, HighlightLayer.neutralColor.g, HighlightLayer.neutralColor.b, HighlightLayer.neutralColor.a);
                    }
                    // Alpha test
                    if (material && material.needAlphaTesting()) {
                        var alphaTexture = material.getAlphaTestTexture();
                        _this._glowMapGenerationEffect.setTexture("diffuseSampler", alphaTexture);
                        _this._glowMapGenerationEffect.setMatrix("diffuseMatrix", alphaTexture.getTextureMatrix());
                    }
                    // Glow emissive only
                    if (emissiveTexture) {
                        _this._glowMapGenerationEffect.setTexture("emissiveSampler", emissiveTexture);
                        _this._glowMapGenerationEffect.setMatrix("emissiveMatrix", emissiveTexture.getTextureMatrix());
                    }
                    // Bones
                    if (mesh.useBones && mesh.computeBonesUsingShaders) {
                        _this._glowMapGenerationEffect.setMatrices("mBones", mesh.skeleton.getTransformMatrices(mesh));
                    }
                    // Draw
                    mesh._processRendering(subMesh, _this._glowMapGenerationEffect, BABYLON.Material.TriangleFillMode, batch, hardwareInstancedRendering, function (isInstance, world) { return _this._glowMapGenerationEffect.setMatrix("world", world); });
                }
                else {
                    // Need to reset refresh rate of the shadowMap
                    _this._mainTexture.resetRefreshCounter();
                }
            };
            this._mainTexture.customRenderFunction = function (opaqueSubMeshes, alphaTestSubMeshes, transparentSubMeshes) {
                _this.onBeforeRenderMainTextureObservable.notifyObservers(_this);
                var index;
                for (index = 0; index < opaqueSubMeshes.length; index++) {
                    renderSubMesh(opaqueSubMeshes.data[index]);
                }
                for (index = 0; index < alphaTestSubMeshes.length; index++) {
                    renderSubMesh(alphaTestSubMeshes.data[index]);
                }
                for (index = 0; index < transparentSubMeshes.length; index++) {
                    renderSubMesh(transparentSubMeshes.data[index]);
                }
            };
            this._mainTexture.onClearObservable.add(function (engine) {
                engine.clear(HighlightLayer.neutralColor, true, true, true);
            });
        };
        /**
         * Checks for the readiness of the element composing the layer.
         * @param subMesh the mesh to check for
         * @param useInstances specify wether or not to use instances to render the mesh
         * @param emissiveTexture the associated emissive texture used to generate the glow
         * @return true if ready otherwise, false
         */
        HighlightLayer.prototype.isReady = function (subMesh, useInstances, emissiveTexture) {
            if (!subMesh.getMaterial().isReady()) {
                return false;
            }
            var defines = [];
            var attribs = [BABYLON.VertexBuffer.PositionKind];
            var mesh = subMesh.getMesh();
            var material = subMesh.getMaterial();
            var uv1 = false;
            var uv2 = false;
            // Alpha test
            if (material && material.needAlphaTesting()) {
                var alphaTexture = material.getAlphaTestTexture();
                if (alphaTexture) {
                    defines.push("#define ALPHATEST");
                    if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.UV2Kind) &&
                        alphaTexture.coordinatesIndex === 1) {
                        defines.push("#define DIFFUSEUV2");
                        uv2 = true;
                    }
                    else if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.UVKind)) {
                        defines.push("#define DIFFUSEUV1");
                        uv1 = true;
                    }
                }
            }
            // Emissive
            if (emissiveTexture) {
                defines.push("#define EMISSIVE");
                if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.UV2Kind) &&
                    emissiveTexture.coordinatesIndex === 1) {
                    defines.push("#define EMISSIVEUV2");
                    uv2 = true;
                }
                else if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.UVKind)) {
                    defines.push("#define EMISSIVEUV1");
                    uv1 = true;
                }
            }
            if (uv1) {
                attribs.push(BABYLON.VertexBuffer.UVKind);
                defines.push("#define UV1");
            }
            if (uv2) {
                attribs.push(BABYLON.VertexBuffer.UV2Kind);
                defines.push("#define UV2");
            }
            // Bones
            if (mesh.useBones && mesh.computeBonesUsingShaders) {
                attribs.push(BABYLON.VertexBuffer.MatricesIndicesKind);
                attribs.push(BABYLON.VertexBuffer.MatricesWeightsKind);
                if (mesh.numBoneInfluencers > 4) {
                    attribs.push(BABYLON.VertexBuffer.MatricesIndicesExtraKind);
                    attribs.push(BABYLON.VertexBuffer.MatricesWeightsExtraKind);
                }
                defines.push("#define NUM_BONE_INFLUENCERS " + mesh.numBoneInfluencers);
                defines.push("#define BonesPerMesh " + (mesh.skeleton.bones.length + 1));
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
                this._glowMapGenerationEffect = this._scene.getEngine().createEffect("glowMapGeneration", attribs, ["world", "mBones", "viewProjection", "diffuseMatrix", "color", "emissiveMatrix"], ["diffuseSampler", "emissiveSampler"], join);
            }
            return this._glowMapGenerationEffect.isReady();
        };
        /**
         * Renders the glowing part of the scene by blending the blurred glowing meshes on top of the rendered scene.
         */
        HighlightLayer.prototype.render = function () {
            var currentEffect = this._glowMapMergeEffect;
            // Check
            if (!currentEffect.isReady() || !this._blurTexture.isReady())
                return;
            var engine = this._scene.getEngine();
            this.onBeforeComposeObservable.notifyObservers(this);
            // Render
            engine.enableEffect(currentEffect);
            engine.setState(false);
            // Cache
            var previousStencilBuffer = engine.getStencilBuffer();
            var previousStencilFunction = engine.getStencilFunction();
            var previousStencilMask = engine.getStencilMask();
            var previousAlphaMode = engine.getAlphaMode();
            // Texture
            currentEffect.setTexture("textureSampler", this._blurTexture);
            // VBOs
            engine.bindBuffers(this._vertexBuffers, this._indexBuffer, currentEffect);
            // Draw order
            engine.setAlphaMode(this._options.alphaBlendingMode);
            engine.setStencilMask(0x00);
            engine.setStencilBuffer(true);
            engine.setStencilFunctionReference(this._instanceGlowingMeshStencilReference);
            if (this.outerGlow) {
                currentEffect.setFloat("offset", 0);
                engine.setStencilFunction(BABYLON.Engine.NOTEQUAL);
                engine.draw(true, 0, 6);
            }
            if (this.innerGlow) {
                currentEffect.setFloat("offset", 1);
                engine.setStencilFunction(BABYLON.Engine.EQUAL);
                engine.draw(true, 0, 6);
            }
            // Restore Cache
            engine.setStencilFunction(previousStencilFunction);
            engine.setStencilMask(previousStencilMask);
            engine.setAlphaMode(previousAlphaMode);
            engine.setStencilBuffer(previousStencilBuffer);
            this.onAfterComposeObservable.notifyObservers(this);
            // Handle size changes.
            var size = this._mainTexture.getSize();
            this.setMainTextureSize();
            if (size.width !== this._mainTextureDesiredSize.width || size.height !== this._mainTextureDesiredSize.height) {
                // Recreate RTT and post processes on size change.
                this.onSizeChangedObservable.notifyObservers(this);
                this.disposeTextureAndPostProcesses();
                this.createTextureAndPostProcesses();
            }
        };
        /**
         * Add a mesh in the exclusion list to prevent it to impact or being impacted by the highlight layer.
         * @param mesh The mesh to exclude from the highlight layer
         */
        HighlightLayer.prototype.addExcludedMesh = function (mesh) {
            var meshExcluded = this._excludedMeshes[mesh.id];
            if (!meshExcluded) {
                this._excludedMeshes[mesh.id] = {
                    mesh: mesh,
                    beforeRender: mesh.onBeforeRenderObservable.add(function (mesh) {
                        mesh.getEngine().setStencilBuffer(false);
                    }),
                    afterRender: mesh.onAfterRenderObservable.add(function (mesh) {
                        mesh.getEngine().setStencilBuffer(true);
                    }),
                };
            }
        };
        /**
          * Remove a mesh from the exclusion list to let it impact or being impacted by the highlight layer.
          * @param mesh The mesh to highlight
          */
        HighlightLayer.prototype.removeExcludedMesh = function (mesh) {
            var meshExcluded = this._excludedMeshes[mesh.id];
            if (meshExcluded) {
                mesh.onBeforeRenderObservable.remove(meshExcluded.beforeRender);
                mesh.onAfterRenderObservable.remove(meshExcluded.afterRender);
            }
            this._excludedMeshes[mesh.id] = undefined;
        };
        /**
         * Add a mesh in the highlight layer in order to make it glow with the chosen color.
         * @param mesh The mesh to highlight
         * @param color The color of the highlight
         * @param glowEmissiveOnly Extract the glow from the emissive texture
         */
        HighlightLayer.prototype.addMesh = function (mesh, color, glowEmissiveOnly) {
            var _this = this;
            if (glowEmissiveOnly === void 0) { glowEmissiveOnly = false; }
            var meshHighlight = this._meshes[mesh.id];
            if (meshHighlight) {
                meshHighlight.color = color;
            }
            else {
                this._meshes[mesh.id] = {
                    mesh: mesh,
                    color: color,
                    // Lambda required for capture due to Observable this context
                    observerHighlight: mesh.onBeforeRenderObservable.add(function (mesh) {
                        if (_this._excludedMeshes[mesh.id]) {
                            _this.defaultStencilReference(mesh);
                        }
                        else {
                            mesh.getScene().getEngine().setStencilFunctionReference(_this._instanceGlowingMeshStencilReference);
                        }
                    }),
                    observerDefault: mesh.onAfterRenderObservable.add(this.defaultStencilReference),
                    glowEmissiveOnly: glowEmissiveOnly
                };
            }
            this._shouldRender = true;
        };
        /**
         * Remove a mesh from the highlight layer in order to make it stop glowing.
         * @param mesh The mesh to highlight
         */
        HighlightLayer.prototype.removeMesh = function (mesh) {
            var meshHighlight = this._meshes[mesh.id];
            if (meshHighlight) {
                mesh.onBeforeRenderObservable.remove(meshHighlight.observerHighlight);
                mesh.onAfterRenderObservable.remove(meshHighlight.observerDefault);
            }
            this._meshes[mesh.id] = undefined;
            this._shouldRender = false;
            for (var meshHighlightToCheck in this._meshes) {
                if (meshHighlightToCheck) {
                    this._shouldRender = true;
                    break;
                }
            }
        };
        /**
         * Returns true if the layer contains information to display, otherwise false.
         */
        HighlightLayer.prototype.shouldRender = function () {
            return this._shouldRender;
        };
        /**
         * Sets the main texture desired size which is the closest power of two
         * of the engine canvas size.
         */
        HighlightLayer.prototype.setMainTextureSize = function () {
            if (this._options.mainTextureFixedSize) {
                this._mainTextureDesiredSize.width = this._options.mainTextureFixedSize;
                this._mainTextureDesiredSize.height = this._options.mainTextureFixedSize;
            }
            else {
                this._mainTextureDesiredSize.width = this._engine.getRenderingCanvas().width * this._options.mainTextureRatio;
                this._mainTextureDesiredSize.height = this._engine.getRenderingCanvas().height * this._options.mainTextureRatio;
                this._mainTextureDesiredSize.width = BABYLON.Tools.GetExponentOfTwo(this._mainTextureDesiredSize.width, this._maxSize);
                this._mainTextureDesiredSize.height = BABYLON.Tools.GetExponentOfTwo(this._mainTextureDesiredSize.height, this._maxSize);
            }
        };
        /**
         * Force the stencil to the normal expected value for none glowing parts
         */
        HighlightLayer.prototype.defaultStencilReference = function (mesh) {
            mesh.getScene().getEngine().setStencilFunctionReference(HighlightLayer.normalMeshStencilReference);
        };
        /**
         * Dispose only the render target textures and post process.
         */
        HighlightLayer.prototype.disposeTextureAndPostProcesses = function () {
            this._blurTexture.dispose();
            this._mainTexture.dispose();
            this._downSamplePostprocess.dispose();
            this._horizontalBlurPostprocess.dispose();
            this._verticalBlurPostprocess.dispose();
        };
        /**
         * Dispose the highlight layer and free resources.
         */
        HighlightLayer.prototype.dispose = function () {
            var vertexBuffer = this._vertexBuffers[BABYLON.VertexBuffer.PositionKind];
            if (vertexBuffer) {
                vertexBuffer.dispose();
                this._vertexBuffers[BABYLON.VertexBuffer.PositionKind] = null;
            }
            if (this._indexBuffer) {
                this._scene.getEngine()._releaseBuffer(this._indexBuffer);
                this._indexBuffer = null;
            }
            // Clean textures and post processes
            this.disposeTextureAndPostProcesses();
            // Clean mesh references 
            for (var id in this._meshes) {
                var meshHighlight = this._meshes[id];
                if (meshHighlight && meshHighlight.mesh) {
                    meshHighlight.mesh.onBeforeRenderObservable.remove(meshHighlight.observerHighlight);
                    meshHighlight.mesh.onAfterRenderObservable.remove(meshHighlight.observerDefault);
                }
            }
            this._meshes = null;
            for (var id in this._excludedMeshes) {
                var meshHighlight = this._excludedMeshes[id];
                if (meshHighlight) {
                    meshHighlight.mesh.onBeforeRenderObservable.remove(meshHighlight.beforeRender);
                    meshHighlight.mesh.onAfterRenderObservable.remove(meshHighlight.afterRender);
                }
            }
            this._excludedMeshes = null;
            // Remove from scene
            var index = this._scene.highlightLayers.indexOf(this, 0);
            if (index > -1) {
                this._scene.highlightLayers.splice(index, 1);
            }
            // Callback
            this.onDisposeObservable.notifyObservers(this);
            this.onDisposeObservable.clear();
            this.onBeforeRenderMainTextureObservable.clear();
            this.onBeforeBlurObservable.clear();
            this.onBeforeComposeObservable.clear();
            this.onAfterComposeObservable.clear();
            this.onSizeChangedObservable.clear();
        };
        /**
         * The neutral color used during the preparation of the glow effect.
         * This is black by default as the blend operation is a blend operation.
         */
        HighlightLayer.neutralColor = new BABYLON.Color4(0, 0, 0, 0);
        /**
         * Stencil value used for glowing meshes.
         */
        HighlightLayer.glowingMeshStencilReference = 0x02;
        /**
         * Stencil value used for the other meshes in the scene.
         */
        HighlightLayer.normalMeshStencilReference = 0x01;
        return HighlightLayer;
    }());
    BABYLON.HighlightLayer = HighlightLayer;
})(BABYLON || (BABYLON = {}));
