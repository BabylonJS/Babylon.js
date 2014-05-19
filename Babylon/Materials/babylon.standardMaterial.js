var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var maxSimultaneousLights = 4;

    var StandardMaterial = (function (_super) {
        __extends(StandardMaterial, _super);
        function StandardMaterial(name, scene) {
            var _this = this;
            _super.call(this, name, scene);
            this.ambientColor = new BABYLON.Color3(0, 0, 0);
            this.diffuseColor = new BABYLON.Color3(1, 1, 1);
            this.specularColor = new BABYLON.Color3(1, 1, 1);
            this.specularPower = 64;
            this.emissiveColor = new BABYLON.Color3(0, 0, 0);
            this.useAlphaFromDiffuseTexture = false;
            this._cachedDefines = null;
            this._renderTargets = new BABYLON.SmartArray(16);
            this._worldViewProjectionMatrix = BABYLON.Matrix.Zero();
            this._lightMatrix = BABYLON.Matrix.Zero();
            this._globalAmbientColor = new BABYLON.Color3(0, 0, 0);
            this._baseColor = new BABYLON.Color3();
            this._scaledDiffuse = new BABYLON.Color3();
            this._scaledSpecular = new BABYLON.Color3();

            this.getRenderTargetTextures = function () {
                _this._renderTargets.reset();

                if (_this.reflectionTexture && _this.reflectionTexture.isRenderTarget) {
                    _this._renderTargets.push(_this.reflectionTexture);
                }

                return _this._renderTargets;
            };
        }
        StandardMaterial.prototype.needAlphaBlending = function () {
            return (this.alpha < 1.0) || (this.opacityTexture != null) || this._shouldUseAlphaFromDiffuseTexture();
        };

        StandardMaterial.prototype.needAlphaTesting = function () {
            return this.diffuseTexture != null && this.diffuseTexture.hasAlpha;
        };

        StandardMaterial.prototype._shouldUseAlphaFromDiffuseTexture = function () {
            return this.diffuseTexture != null && this.diffuseTexture.hasAlpha && this.useAlphaFromDiffuseTexture;
        };

        // Methods
        StandardMaterial.prototype.isReady = function (mesh) {
            if (this.checkReadyOnlyOnce) {
                if (this._wasPreviouslyReady) {
                    return true;
                }
            }

            var scene = this.getScene();

            if (!this.checkReadyOnEveryCall) {
                if (this._renderId === scene.getRenderId()) {
                    return true;
                }
            }

            var engine = scene.getEngine();
            var defines = [];
            var optionalDefines = new Array();

            // Textures
            if (scene.texturesEnabled) {
                if (this.diffuseTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                    if (!this.diffuseTexture.isReady()) {
                        return false;
                    } else {
                        defines.push("#define DIFFUSE");
                    }
                }

                if (this.ambientTexture && BABYLON.StandardMaterial.AmbientTextureEnabled) {
                    if (!this.ambientTexture.isReady()) {
                        return false;
                    } else {
                        defines.push("#define AMBIENT");
                    }
                }

                if (this.opacityTexture && BABYLON.StandardMaterial.OpacityTextureEnabled) {
                    if (!this.opacityTexture.isReady()) {
                        return false;
                    } else {
                        defines.push("#define OPACITY");
                    }
                }

                if (this.reflectionTexture && BABYLON.StandardMaterial.ReflectionTextureEnabled) {
                    if (!this.reflectionTexture.isReady()) {
                        return false;
                    } else {
                        defines.push("#define REFLECTION");
                    }
                }

                if (this.emissiveTexture && BABYLON.StandardMaterial.EmissiveTextureEnabled) {
                    if (!this.emissiveTexture.isReady()) {
                        return false;
                    } else {
                        defines.push("#define EMISSIVE");
                    }
                }

                if (this.specularTexture && BABYLON.StandardMaterial.SpecularTextureEnabled) {
                    if (!this.specularTexture.isReady()) {
                        return false;
                    } else {
                        defines.push("#define SPECULAR");
                        optionalDefines.push(defines[defines.length - 1]);
                    }
                }
            }

            if (scene.getEngine().getCaps().standardDerivatives && this.bumpTexture && BABYLON.StandardMaterial.BumpTextureEnabled) {
                if (!this.bumpTexture.isReady()) {
                    return false;
                } else {
                    defines.push("#define BUMP");
                    optionalDefines.push(defines[defines.length - 1]);
                }
            }

            // Effect
            if (scene.clipPlane) {
                defines.push("#define CLIPPLANE");
            }

            if (engine.getAlphaTesting()) {
                defines.push("#define ALPHATEST");
            }

            if (this._shouldUseAlphaFromDiffuseTexture()) {
                defines.push("#define ALPHAFROMDIFFUSE");
            }

            // Fog
            if (scene.fogMode !== BABYLON.Scene.FOGMODE_NONE) {
                defines.push("#define FOG");
                optionalDefines.push(defines[defines.length - 1]);
            }

            var shadowsActivated = false;
            var lightIndex = 0;
            if (scene.lightsEnabled) {
                for (var index = 0; index < scene.lights.length; index++) {
                    var light = scene.lights[index];

                    if (!light.isEnabled()) {
                        continue;
                    }

                    if (mesh && light.excludedMeshes.indexOf(mesh) !== -1) {
                        continue;
                    }

                    defines.push("#define LIGHT" + lightIndex);

                    if (lightIndex > 0) {
                        optionalDefines.push(defines[defines.length - 1]);
                    }

                    var type;
                    if (light instanceof BABYLON.SpotLight) {
                        type = "#define SPOTLIGHT" + lightIndex;
                    } else if (light instanceof BABYLON.HemisphericLight) {
                        type = "#define HEMILIGHT" + lightIndex;
                    } else {
                        type = "#define POINTDIRLIGHT" + lightIndex;
                    }

                    defines.push(type);
                    if (lightIndex > 0) {
                        optionalDefines.push(defines[defines.length - 1]);
                    }

                    // Shadows
                    var shadowGenerator = light.getShadowGenerator();
                    if (mesh && mesh.receiveShadows && shadowGenerator) {
                        defines.push("#define SHADOW" + lightIndex);

                        if (lightIndex > 0) {
                            optionalDefines.push(defines[defines.length - 1]);
                        }

                        if (!shadowsActivated) {
                            defines.push("#define SHADOWS");
                            shadowsActivated = true;
                        }

                        if (shadowGenerator.useVarianceShadowMap) {
                            defines.push("#define SHADOWVSM" + lightIndex);
                            if (lightIndex > 0) {
                                optionalDefines.push(defines[defines.length - 1]);
                            }
                        }
                    }

                    lightIndex++;
                    if (lightIndex == maxSimultaneousLights)
                        break;
                }
            }

            var attribs = [BABYLON.VertexBuffer.PositionKind, BABYLON.VertexBuffer.NormalKind];
            if (mesh) {
                if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.UVKind)) {
                    attribs.push(BABYLON.VertexBuffer.UVKind);
                    defines.push("#define UV1");
                }
                if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.UV2Kind)) {
                    attribs.push(BABYLON.VertexBuffer.UV2Kind);
                    defines.push("#define UV2");
                }
                if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.ColorKind)) {
                    attribs.push(BABYLON.VertexBuffer.ColorKind);
                    defines.push("#define VERTEXCOLOR");
                }
                if (mesh.skeleton && mesh.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesIndicesKind) && mesh.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesWeightsKind)) {
                    attribs.push(BABYLON.VertexBuffer.MatricesIndicesKind);
                    attribs.push(BABYLON.VertexBuffer.MatricesWeightsKind);
                    defines.push("#define BONES");
                    defines.push("#define BonesPerMesh " + mesh.skeleton.bones.length);
                    defines.push("#define BONES4");
                    optionalDefines.push(defines[defines.length - 1]);
                }
            }

            // Get correct effect
            var join = defines.join("\n");
            if (this._cachedDefines != join) {
                this._cachedDefines = join;

                // Legacy browser patch
                var shaderName = "default";
                if (!scene.getEngine().getCaps().standardDerivatives) {
                    shaderName = "legacydefault";
                }

                this._effect = scene.getEngine().createEffect(shaderName, attribs, [
                    "world", "view", "viewProjection", "vEyePosition", "vLightsType", "vAmbientColor", "vDiffuseColor", "vSpecularColor", "vEmissiveColor",
                    "vLightData0", "vLightDiffuse0", "vLightSpecular0", "vLightDirection0", "vLightGround0", "lightMatrix0",
                    "vLightData1", "vLightDiffuse1", "vLightSpecular1", "vLightDirection1", "vLightGround1", "lightMatrix1",
                    "vLightData2", "vLightDiffuse2", "vLightSpecular2", "vLightDirection2", "vLightGround2", "lightMatrix2",
                    "vLightData3", "vLightDiffuse3", "vLightSpecular3", "vLightDirection3", "vLightGround3", "lightMatrix3",
                    "vFogInfos", "vFogColor",
                    "vDiffuseInfos", "vAmbientInfos", "vOpacityInfos", "vReflectionInfos", "vEmissiveInfos", "vSpecularInfos", "vBumpInfos",
                    "mBones",
                    "vClipPlane", "diffuseMatrix", "ambientMatrix", "opacityMatrix", "reflectionMatrix", "emissiveMatrix", "specularMatrix", "bumpMatrix",
                    "darkness0", "darkness1", "darkness2", "darkness3"], [
                    "diffuseSampler", "ambientSampler", "opacitySampler", "reflectionCubeSampler", "reflection2DSampler", "emissiveSampler", "specularSampler", "bumpSampler",
                    "shadowSampler0", "shadowSampler1", "shadowSampler2", "shadowSampler3"
                ], join, optionalDefines, this.onCompiled, this.onError);
            }
            if (!this._effect.isReady()) {
                return false;
            }

            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;
            return true;
        };

        StandardMaterial.prototype.unbind = function () {
            if (this.reflectionTexture && this.reflectionTexture.isRenderTarget) {
                this._effect.setTexture("reflection2DSampler", null);
            }
        };

        StandardMaterial.prototype.bind = function (world, mesh) {
            var scene = this.getScene();
            this._baseColor.copyFrom(this.diffuseColor);

            // Matrices
            this._effect.setMatrix("world", world);
            this._effect.setMatrix("viewProjection", scene.getTransformMatrix());

            // Bones
            if (mesh.skeleton && mesh.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesIndicesKind) && mesh.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesWeightsKind)) {
                this._effect.setMatrices("mBones", mesh.skeleton.getTransformMatrices());
            }

            // Textures
            if (this.diffuseTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                this._effect.setTexture("diffuseSampler", this.diffuseTexture);

                this._effect.setFloat2("vDiffuseInfos", this.diffuseTexture.coordinatesIndex, this.diffuseTexture.level);
                this._effect.setMatrix("diffuseMatrix", this.diffuseTexture._computeTextureMatrix());

                this._baseColor.copyFromFloats(1, 1, 1);
            }

            if (this.ambientTexture && BABYLON.StandardMaterial.AmbientTextureEnabled) {
                this._effect.setTexture("ambientSampler", this.ambientTexture);

                this._effect.setFloat2("vAmbientInfos", this.ambientTexture.coordinatesIndex, this.ambientTexture.level);
                this._effect.setMatrix("ambientMatrix", this.ambientTexture._computeTextureMatrix());
            }

            if (this.opacityTexture && BABYLON.StandardMaterial.OpacityTextureEnabled) {
                this._effect.setTexture("opacitySampler", this.opacityTexture);

                this._effect.setFloat2("vOpacityInfos", this.opacityTexture.coordinatesIndex, this.opacityTexture.level);
                this._effect.setMatrix("opacityMatrix", this.opacityTexture._computeTextureMatrix());
            }

            if (this.reflectionTexture && BABYLON.StandardMaterial.ReflectionTextureEnabled) {
                if (this.reflectionTexture.isCube) {
                    this._effect.setTexture("reflectionCubeSampler", this.reflectionTexture);
                } else {
                    this._effect.setTexture("reflection2DSampler", this.reflectionTexture);
                }

                this._effect.setMatrix("reflectionMatrix", this.reflectionTexture._computeReflectionTextureMatrix());
                this._effect.setFloat3("vReflectionInfos", this.reflectionTexture.coordinatesMode, this.reflectionTexture.level, this.reflectionTexture.isCube ? 1 : 0);
            }

            if (this.emissiveTexture && BABYLON.StandardMaterial.EmissiveTextureEnabled) {
                this._effect.setTexture("emissiveSampler", this.emissiveTexture);

                this._effect.setFloat2("vEmissiveInfos", this.emissiveTexture.coordinatesIndex, this.emissiveTexture.level);
                this._effect.setMatrix("emissiveMatrix", this.emissiveTexture._computeTextureMatrix());
            }

            if (this.specularTexture && BABYLON.StandardMaterial.SpecularTextureEnabled) {
                this._effect.setTexture("specularSampler", this.specularTexture);

                this._effect.setFloat2("vSpecularInfos", this.specularTexture.coordinatesIndex, this.specularTexture.level);
                this._effect.setMatrix("specularMatrix", this.specularTexture._computeTextureMatrix());
            }

            if (this.bumpTexture && scene.getEngine().getCaps().standardDerivatives && BABYLON.StandardMaterial.BumpTextureEnabled) {
                this._effect.setTexture("bumpSampler", this.bumpTexture);

                this._effect.setFloat2("vBumpInfos", this.bumpTexture.coordinatesIndex, this.bumpTexture.level);
                this._effect.setMatrix("bumpMatrix", this.bumpTexture._computeTextureMatrix());
            }

            // Colors
            scene.ambientColor.multiplyToRef(this.ambientColor, this._globalAmbientColor);

            this._effect.setVector3("vEyePosition", scene.activeCamera.position);
            this._effect.setColor3("vAmbientColor", this._globalAmbientColor);
            this._effect.setColor4("vDiffuseColor", this._baseColor, this.alpha * mesh.visibility);
            this._effect.setColor4("vSpecularColor", this.specularColor, this.specularPower);
            this._effect.setColor3("vEmissiveColor", this.emissiveColor);

            if (scene.lightsEnabled) {
                var lightIndex = 0;
                for (var index = 0; index < scene.lights.length; index++) {
                    var light = scene.lights[index];

                    if (!light.isEnabled()) {
                        continue;
                    }

                    if (mesh && light.excludedMeshes.indexOf(mesh) !== -1) {
                        continue;
                    }

                    if (light instanceof BABYLON.PointLight) {
                        // Point Light
                        light.transferToEffect(this._effect, "vLightData" + lightIndex);
                    } else if (light instanceof BABYLON.DirectionalLight) {
                        // Directional Light
                        light.transferToEffect(this._effect, "vLightData" + lightIndex);
                    } else if (light instanceof BABYLON.SpotLight) {
                        // Spot Light
                        light.transferToEffect(this._effect, "vLightData" + lightIndex, "vLightDirection" + lightIndex);
                    } else if (light instanceof BABYLON.HemisphericLight) {
                        // Hemispheric Light
                        light.transferToEffect(this._effect, "vLightData" + lightIndex, "vLightGround" + lightIndex);
                    }

                    light.diffuse.scaleToRef(light.intensity, this._scaledDiffuse);
                    light.specular.scaleToRef(light.intensity, this._scaledSpecular);
                    this._effect.setColor4("vLightDiffuse" + lightIndex, this._scaledDiffuse, light.range);
                    this._effect.setColor3("vLightSpecular" + lightIndex, this._scaledSpecular);

                    // Shadows
                    var shadowGenerator = light.getShadowGenerator();
                    if (mesh.receiveShadows && shadowGenerator) {
                        world.multiplyToRef(shadowGenerator.getTransformMatrix(), this._lightMatrix);
                        this._effect.setMatrix("lightMatrix" + lightIndex, this._lightMatrix);
                        this._effect.setTexture("shadowSampler" + lightIndex, shadowGenerator.getShadowMap());
                        this._effect.setFloat("darkness" + lightIndex, shadowGenerator.getDarkness());
                    }

                    lightIndex++;

                    if (lightIndex == maxSimultaneousLights)
                        break;
                }
            }

            if (scene.clipPlane) {
                var clipPlane = scene.clipPlane;
                this._effect.setFloat4("vClipPlane", clipPlane.normal.x, clipPlane.normal.y, clipPlane.normal.z, clipPlane.d);
            }

            // View
            if (scene.fogMode !== BABYLON.Scene.FOGMODE_NONE || this.reflectionTexture) {
                this._effect.setMatrix("view", scene.getViewMatrix());
            }

            // Fog
            if (scene.fogMode !== BABYLON.Scene.FOGMODE_NONE) {
                this._effect.setFloat4("vFogInfos", scene.fogMode, scene.fogStart, scene.fogEnd, scene.fogDensity);
                this._effect.setColor3("vFogColor", scene.fogColor);
            }
        };

        StandardMaterial.prototype.getAnimatables = function () {
            var results = [];

            if (this.diffuseTexture && this.diffuseTexture.animations && this.diffuseTexture.animations.length > 0) {
                results.push(this.diffuseTexture);
            }

            if (this.ambientTexture && this.ambientTexture.animations && this.ambientTexture.animations.length > 0) {
                results.push(this.ambientTexture);
            }

            if (this.opacityTexture && this.opacityTexture.animations && this.opacityTexture.animations.length > 0) {
                results.push(this.opacityTexture);
            }

            if (this.reflectionTexture && this.reflectionTexture.animations && this.reflectionTexture.animations.length > 0) {
                results.push(this.reflectionTexture);
            }

            if (this.emissiveTexture && this.emissiveTexture.animations && this.emissiveTexture.animations.length > 0) {
                results.push(this.emissiveTexture);
            }

            if (this.specularTexture && this.specularTexture.animations && this.specularTexture.animations.length > 0) {
                results.push(this.specularTexture);
            }

            if (this.bumpTexture && this.bumpTexture.animations && this.bumpTexture.animations.length > 0) {
                results.push(this.bumpTexture);
            }

            return results;
        };

        StandardMaterial.prototype.dispose = function (forceDisposeEffect) {
            if (this.diffuseTexture) {
                this.diffuseTexture.dispose();
            }

            if (this.ambientTexture) {
                this.ambientTexture.dispose();
            }

            if (this.opacityTexture) {
                this.opacityTexture.dispose();
            }

            if (this.reflectionTexture) {
                this.reflectionTexture.dispose();
            }

            if (this.emissiveTexture) {
                this.emissiveTexture.dispose();
            }

            if (this.specularTexture) {
                this.specularTexture.dispose();
            }

            if (this.bumpTexture) {
                this.bumpTexture.dispose();
            }

            _super.prototype.dispose.call(this, forceDisposeEffect);
        };

        StandardMaterial.prototype.clone = function (name) {
            var newStandardMaterial = new BABYLON.StandardMaterial(name, this.getScene());

            // Base material
            newStandardMaterial.checkReadyOnEveryCall = this.checkReadyOnEveryCall;
            newStandardMaterial.alpha = this.alpha;
            newStandardMaterial.wireframe = this.wireframe;
            newStandardMaterial.backFaceCulling = this.backFaceCulling;

            // Standard material
            if (this.diffuseTexture && this.diffuseTexture.clone) {
                newStandardMaterial.diffuseTexture = this.diffuseTexture.clone();
            }
            if (this.ambientTexture && this.ambientTexture.clone) {
                newStandardMaterial.ambientTexture = this.ambientTexture.clone();
            }
            if (this.opacityTexture && this.opacityTexture.clone) {
                newStandardMaterial.opacityTexture = this.opacityTexture.clone();
            }
            if (this.reflectionTexture && this.reflectionTexture.clone) {
                newStandardMaterial.reflectionTexture = this.reflectionTexture.clone();
            }
            if (this.emissiveTexture && this.emissiveTexture.clone) {
                newStandardMaterial.emissiveTexture = this.emissiveTexture.clone();
            }
            if (this.specularTexture && this.specularTexture.clone) {
                newStandardMaterial.specularTexture = this.specularTexture.clone();
            }
            if (this.bumpTexture && this.bumpTexture.clone) {
                newStandardMaterial.bumpTexture = this.bumpTexture.clone();
            }

            newStandardMaterial.ambientColor = this.ambientColor.clone();
            newStandardMaterial.diffuseColor = this.diffuseColor.clone();
            newStandardMaterial.specularColor = this.specularColor.clone();
            newStandardMaterial.specularPower = this.specularPower;
            newStandardMaterial.emissiveColor = this.emissiveColor.clone();

            return newStandardMaterial;
        };

        StandardMaterial.DiffuseTextureEnabled = true;
        StandardMaterial.AmbientTextureEnabled = true;
        StandardMaterial.OpacityTextureEnabled = true;
        StandardMaterial.ReflectionTextureEnabled = true;
        StandardMaterial.EmissiveTextureEnabled = true;
        StandardMaterial.SpecularTextureEnabled = true;
        StandardMaterial.BumpTextureEnabled = true;
        return StandardMaterial;
    })(BABYLON.Material);
    BABYLON.StandardMaterial = StandardMaterial;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.standardMaterial.js.map
