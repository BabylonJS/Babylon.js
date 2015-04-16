var BABYLON;
(function (BABYLON) {
    var ShadowGenerator = (function () {
        function ShadowGenerator(mapSize, light) {
            var _this = this;
            // Members
            this._filter = ShadowGenerator.FILTER_NONE;
            this.blurScale = 2;
            this._blurBoxOffset = 0;
            this._bias = 0.00005;
            this._darkness = 0;
            this._transparencyShadow = false;
            this._viewMatrix = BABYLON.Matrix.Zero();
            this._projectionMatrix = BABYLON.Matrix.Zero();
            this._transformMatrix = BABYLON.Matrix.Zero();
            this._worldViewProjection = BABYLON.Matrix.Zero();
            this._light = light;
            this._scene = light.getScene();
            this._mapSize = mapSize;
            light._shadowGenerator = this;
            // Render target
            this._shadowMap = new BABYLON.RenderTargetTexture(light.name + "_shadowMap", mapSize, this._scene, false);
            this._shadowMap.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this._shadowMap.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this._shadowMap.anisotropicFilteringLevel = 1;
            this._shadowMap.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
            this._shadowMap.renderParticles = false;
            this._shadowMap.onAfterUnbind = function () {
                if (!_this.useBlurVarianceShadowMap) {
                    return;
                }
                if (!_this._shadowMap2) {
                    _this._shadowMap2 = new BABYLON.RenderTargetTexture(light.name + "_shadowMap", mapSize, _this._scene, false);
                    _this._shadowMap2.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
                    _this._shadowMap2.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
                    _this._shadowMap2.updateSamplingMode(BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
                    _this._downSamplePostprocess = new BABYLON.PassPostProcess("downScale", 1.0 / _this.blurScale, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, _this._scene.getEngine());
                    _this._downSamplePostprocess.onApply = function (effect) {
                        effect.setTexture("textureSampler", _this._shadowMap);
                    };
                    _this.blurBoxOffset = 1;
                }
                _this._scene.postProcessManager.directRender([_this._downSamplePostprocess, _this._boxBlurPostprocess], _this._shadowMap2.getInternalTexture());
            };
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
                var hardwareInstancedRendering = (engine.getCaps().instancedArrays !== null) && (batch.visibleInstances[subMesh._id] !== null);
                if (_this.isReady(subMesh, hardwareInstancedRendering)) {
                    engine.enableEffect(_this._effect);
                    mesh._bind(subMesh, _this._effect, BABYLON.Material.TriangleFillMode);
                    var material = subMesh.getMaterial();
                    _this._effect.setMatrix("viewProjection", _this.getTransformMatrix());
                    // Alpha test
                    if (material && material.needAlphaTesting()) {
                        var alphaTexture = material.getAlphaTestTexture();
                        _this._effect.setTexture("diffuseSampler", alphaTexture);
                        _this._effect.setMatrix("diffuseMatrix", alphaTexture.getTextureMatrix());
                    }
                    // Bones
                    if (mesh.useBones) {
                        _this._effect.setMatrices("mBones", mesh.skeleton.getTransformMatrices());
                    }
                    // Draw
                    mesh._processRendering(subMesh, _this._effect, BABYLON.Material.TriangleFillMode, batch, hardwareInstancedRendering, function (isInstance, world) { return _this._effect.setMatrix("world", world); });
                }
                else {
                    // Need to reset refresh rate of the shadowMap
                    _this._shadowMap.resetRefreshCounter();
                }
            };
            this._shadowMap.customRenderFunction = function (opaqueSubMeshes, alphaTestSubMeshes, transparentSubMeshes) {
                var index;
                for (index = 0; index < opaqueSubMeshes.length; index++) {
                    renderSubMesh(opaqueSubMeshes.data[index]);
                }
                for (index = 0; index < alphaTestSubMeshes.length; index++) {
                    renderSubMesh(alphaTestSubMeshes.data[index]);
                }
                if (_this._transparencyShadow) {
                    for (index = 0; index < transparentSubMeshes.length; index++) {
                        renderSubMesh(transparentSubMeshes.data[index]);
                    }
                }
            };
            this._shadowMap.onClear = function (engine) {
                if (_this.useBlurVarianceShadowMap || _this.useVarianceShadowMap) {
                    engine.clear(new BABYLON.Color4(0, 0, 0, 0), true, true);
                }
                else {
                    engine.clear(new BABYLON.Color4(1.0, 1.0, 1.0, 1.0), true, true);
                }
            };
        }
        Object.defineProperty(ShadowGenerator, "FILTER_NONE", {
            // Static
            get: function () {
                return ShadowGenerator._FILTER_NONE;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ShadowGenerator, "FILTER_VARIANCESHADOWMAP", {
            get: function () {
                return ShadowGenerator._FILTER_VARIANCESHADOWMAP;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ShadowGenerator, "FILTER_POISSONSAMPLING", {
            get: function () {
                return ShadowGenerator._FILTER_POISSONSAMPLING;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ShadowGenerator, "FILTER_BLURVARIANCESHADOWMAP", {
            get: function () {
                return ShadowGenerator._FILTER_BLURVARIANCESHADOWMAP;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ShadowGenerator.prototype, "bias", {
            get: function () {
                return this._bias;
            },
            set: function (bias) {
                this._bias = bias;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ShadowGenerator.prototype, "blurBoxOffset", {
            get: function () {
                return this._blurBoxOffset;
            },
            set: function (value) {
                var _this = this;
                if (this._blurBoxOffset === value) {
                    return;
                }
                this._blurBoxOffset = value;
                if (this._boxBlurPostprocess) {
                    this._boxBlurPostprocess.dispose();
                }
                this._boxBlurPostprocess = new BABYLON.PostProcess("DepthBoxBlur", "depthBoxBlur", ["screenSize", "boxOffset"], [], 1.0 / this.blurScale, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine(), false, "#define OFFSET " + value);
                this._boxBlurPostprocess.onApply = function (effect) {
                    effect.setFloat2("screenSize", _this._mapSize / _this.blurScale, _this._mapSize / _this.blurScale);
                };
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ShadowGenerator.prototype, "filter", {
            get: function () {
                return this._filter;
            },
            set: function (value) {
                if (this._filter === value) {
                    return;
                }
                this._filter = value;
                if (this.useVarianceShadowMap || this.useBlurVarianceShadowMap) {
                    this._shadowMap.anisotropicFilteringLevel = 16;
                    this._shadowMap.updateSamplingMode(BABYLON.Texture.BILINEAR_SAMPLINGMODE);
                }
                else {
                    this._shadowMap.anisotropicFilteringLevel = 1;
                    this._shadowMap.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ShadowGenerator.prototype, "useVarianceShadowMap", {
            get: function () {
                return this.filter === ShadowGenerator.FILTER_VARIANCESHADOWMAP && this._light.supportsVSM();
            },
            set: function (value) {
                this.filter = (value ? ShadowGenerator.FILTER_VARIANCESHADOWMAP : ShadowGenerator.FILTER_NONE);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ShadowGenerator.prototype, "usePoissonSampling", {
            get: function () {
                return this.filter === ShadowGenerator.FILTER_POISSONSAMPLING || (!this._light.supportsVSM() && (this.filter === ShadowGenerator.FILTER_VARIANCESHADOWMAP || this.filter === ShadowGenerator.FILTER_BLURVARIANCESHADOWMAP));
            },
            set: function (value) {
                this.filter = (value ? ShadowGenerator.FILTER_POISSONSAMPLING : ShadowGenerator.FILTER_NONE);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ShadowGenerator.prototype, "useBlurVarianceShadowMap", {
            get: function () {
                return this.filter === ShadowGenerator.FILTER_BLURVARIANCESHADOWMAP && this._light.supportsVSM();
            },
            set: function (value) {
                this.filter = (value ? ShadowGenerator.FILTER_BLURVARIANCESHADOWMAP : ShadowGenerator.FILTER_NONE);
            },
            enumerable: true,
            configurable: true
        });
        ShadowGenerator.prototype.isReady = function (subMesh, useInstances) {
            var defines = [];
            if (this.useVarianceShadowMap || this.useBlurVarianceShadowMap) {
                defines.push("#define VSM");
            }
            var attribs = [BABYLON.VertexBuffer.PositionKind];
            var mesh = subMesh.getMesh();
            var material = subMesh.getMaterial();
            // Alpha test
            if (material && material.needAlphaTesting()) {
                defines.push("#define ALPHATEST");
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
            if (mesh.useBones) {
                attribs.push(BABYLON.VertexBuffer.MatricesIndicesKind);
                attribs.push(BABYLON.VertexBuffer.MatricesWeightsKind);
                defines.push("#define BONES");
                defines.push("#define BonesPerMesh " + (mesh.skeleton.bones.length + 1));
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
                this._effect = this._scene.getEngine().createEffect("shadowMap", attribs, ["world", "mBones", "viewProjection", "diffuseMatrix"], ["diffuseSampler"], join);
            }
            return this._effect.isReady();
        };
        ShadowGenerator.prototype.getShadowMap = function () {
            return this._shadowMap;
        };
        ShadowGenerator.prototype.getShadowMapForRendering = function () {
            if (this._shadowMap2) {
                return this._shadowMap2;
            }
            return this._shadowMap;
        };
        ShadowGenerator.prototype.getLight = function () {
            return this._light;
        };
        // Methods
        ShadowGenerator.prototype.getTransformMatrix = function () {
            var scene = this._scene;
            if (this._currentRenderID === scene.getRenderId()) {
                return this._transformMatrix;
            }
            this._currentRenderID = scene.getRenderId();
            var lightPosition = this._light.position;
            var lightDirection = this._light.direction;
            if (this._light.computeTransformedPosition()) {
                lightPosition = this._light.transformedPosition;
            }
            if (this._light.needRefreshPerFrame() || !this._cachedPosition || !this._cachedDirection || !lightPosition.equals(this._cachedPosition) || !lightDirection.equals(this._cachedDirection)) {
                this._cachedPosition = lightPosition.clone();
                this._cachedDirection = lightDirection.clone();
                BABYLON.Matrix.LookAtLHToRef(lightPosition, this._light.position.add(lightDirection), BABYLON.Vector3.Up(), this._viewMatrix);
                this._light.setShadowProjectionMatrix(this._projectionMatrix, this._viewMatrix, this.getShadowMap().renderList);
                this._viewMatrix.multiplyToRef(this._projectionMatrix, this._transformMatrix);
            }
            return this._transformMatrix;
        };
        ShadowGenerator.prototype.getDarkness = function () {
            return this._darkness;
        };
        ShadowGenerator.prototype.setDarkness = function (darkness) {
            if (darkness >= 1.0)
                this._darkness = 1.0;
            else if (darkness <= 0.0)
                this._darkness = 0.0;
            else
                this._darkness = darkness;
        };
        ShadowGenerator.prototype.setTransparencyShadow = function (hasShadow) {
            this._transparencyShadow = hasShadow;
        };
        ShadowGenerator.prototype._packHalf = function (depth) {
            var scale = depth * 255.0;
            var fract = scale - Math.floor(scale);
            return new BABYLON.Vector2(depth - fract / 255.0, fract);
        };
        ShadowGenerator.prototype.dispose = function () {
            this._shadowMap.dispose();
            if (this._shadowMap2) {
                this._shadowMap2.dispose();
            }
            if (this._downSamplePostprocess) {
                this._downSamplePostprocess.dispose();
            }
            if (this._boxBlurPostprocess) {
                this._boxBlurPostprocess.dispose();
            }
        };
        ShadowGenerator._FILTER_NONE = 0;
        ShadowGenerator._FILTER_VARIANCESHADOWMAP = 1;
        ShadowGenerator._FILTER_POISSONSAMPLING = 2;
        ShadowGenerator._FILTER_BLURVARIANCESHADOWMAP = 3;
        return ShadowGenerator;
    })();
    BABYLON.ShadowGenerator = ShadowGenerator;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.shadowGenerator.js.map