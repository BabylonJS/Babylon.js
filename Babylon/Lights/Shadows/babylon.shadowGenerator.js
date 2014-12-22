var BABYLON;
(function (BABYLON) {
    var ShadowGenerator = (function () {
        function ShadowGenerator(mapSize, light) {
            var _this = this;
            // Members
            this.filter = ShadowGenerator.FILTER_VARIANCESHADOWMAP;
            this._darkness = 0;
            this._transparencyShadow = false;
            this._viewMatrix = BABYLON.Matrix.Zero();
            this._projectionMatrix = BABYLON.Matrix.Zero();
            this._transformMatrix = BABYLON.Matrix.Zero();
            this._worldViewProjection = BABYLON.Matrix.Zero();
            this._light = light;
            this._scene = light.getScene();

            light._shadowGenerator = this;

            // Render target
            this._shadowMap = new BABYLON.RenderTargetTexture(light.name + "_shadowMap", mapSize, this._scene, false);
            this._shadowMap.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this._shadowMap.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this._shadowMap.renderParticles = false;

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
                    var useBones = mesh.skeleton && mesh.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesIndicesKind) && mesh.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesWeightsKind);

                    if (useBones) {
                        _this._effect.setMatrices("mBones", mesh.skeleton.getTransformMatrices());
                    }

                    if (hardwareInstancedRendering) {
                        mesh._renderWithInstances(subMesh, BABYLON.Material.TriangleFillMode, batch, _this._effect, engine);
                    } else {
                        if (batch.renderSelf[subMesh._id]) {
                            _this._effect.setMatrix("world", mesh.getWorldMatrix());

                            // Draw
                            mesh._draw(subMesh, BABYLON.Material.TriangleFillMode);
                        }

                        if (batch.visibleInstances[subMesh._id]) {
                            for (var instanceIndex = 0; instanceIndex < batch.visibleInstances[subMesh._id].length; instanceIndex++) {
                                var instance = batch.visibleInstances[subMesh._id][instanceIndex];

                                _this._effect.setMatrix("world", instance.getWorldMatrix());

                                // Draw
                                mesh._draw(subMesh, BABYLON.Material.TriangleFillMode);
                            }
                        }
                    }
                } else {
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

        Object.defineProperty(ShadowGenerator.prototype, "useVarianceShadowMap", {
            get: function () {
                return this.filter === ShadowGenerator.FILTER_VARIANCESHADOWMAP;
            },
            set: function (value) {
                this.filter = (value ? ShadowGenerator.FILTER_VARIANCESHADOWMAP : ShadowGenerator.FILTER_NONE);
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(ShadowGenerator.prototype, "usePoissonSampling", {
            get: function () {
                return this.filter === ShadowGenerator.FILTER_POISSONSAMPLING;
            },
            set: function (value) {
                this.filter = (value ? ShadowGenerator.FILTER_POISSONSAMPLING : ShadowGenerator.FILTER_NONE);
            },
            enumerable: true,
            configurable: true
        });

        ShadowGenerator.prototype.isReady = function (subMesh, useInstances) {
            var defines = [];

            if (this.useVarianceShadowMap) {
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
            if (mesh.skeleton && mesh.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesIndicesKind) && mesh.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesWeightsKind)) {
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
            if (this._cachedDefines != join) {
                this._cachedDefines = join;
                this._effect = this._scene.getEngine().createEffect("shadowMap", attribs, ["world", "mBones", "viewProjection", "diffuseMatrix"], ["diffuseSampler"], join);
            }

            return this._effect.isReady();
        };

        ShadowGenerator.prototype.getShadowMap = function () {
            return this._shadowMap;
        };

        ShadowGenerator.prototype.getLight = function () {
            return this._light;
        };

        // Methods
        ShadowGenerator.prototype.getTransformMatrix = function () {
            var lightPosition = this._light.position;
            var lightDirection = this._light.direction;

            if (this._light._computeTransformedPosition()) {
                lightPosition = this._light._transformedPosition;
            }

            if (!this._cachedPosition || !this._cachedDirection || !lightPosition.equals(this._cachedPosition) || !lightDirection.equals(this._cachedDirection)) {
                this._cachedPosition = lightPosition.clone();
                this._cachedDirection = lightDirection.clone();

                var activeCamera = this._scene.activeCamera;

                BABYLON.Matrix.LookAtLHToRef(lightPosition, this._light.position.add(lightDirection), BABYLON.Vector3.Up(), this._viewMatrix);
                BABYLON.Matrix.PerspectiveFovLHToRef(Math.PI / 2.0, 1.0, activeCamera.minZ, activeCamera.maxZ, this._projectionMatrix);

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

        ShadowGenerator.prototype.dispose = function () {
            this._shadowMap.dispose();
        };
        ShadowGenerator._FILTER_NONE = 0;
        ShadowGenerator._FILTER_VARIANCESHADOWMAP = 1;
        ShadowGenerator._FILTER_POISSONSAMPLING = 2;
        return ShadowGenerator;
    })();
    BABYLON.ShadowGenerator = ShadowGenerator;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.shadowGenerator.js.map
