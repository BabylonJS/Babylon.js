"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.StandardMaterial = function (name, scene) {
        BABYLON.Material.call(this, name, scene);

        this.diffuseTexture = null;
        this.ambientTexture = null;
        this.opacityTexture = null;
        this.reflectionTexture = null;
        this.emissiveTexture = null;
        this.specularTexture = null;
        this.bumpTexture = null;

        this.ambientColor = new BABYLON.Color3(0, 0, 0);
        this.diffuseColor = new BABYLON.Color3(1, 1, 1);
        this.specularColor = new BABYLON.Color3(1, 1, 1);
        this.specularPower = 64;
        this.emissiveColor = new BABYLON.Color3(0, 0, 0);

        this._cachedDefines = null;

        this._renderTargets = new BABYLON.Tools.SmartArray(16);

        // Internals
        this._worldViewProjectionMatrix = BABYLON.Matrix.Zero();
        this._lightMatrix = BABYLON.Matrix.Zero();
        this._globalAmbientColor = new BABYLON.Color3(0, 0, 0);
        this._baseColor = new BABYLON.Color3();
        this._scaledDiffuse = new BABYLON.Color3();
        this._scaledSpecular = new BABYLON.Color3();
    };

    BABYLON.StandardMaterial.prototype = Object.create(BABYLON.Material.prototype);

    // Properties   
    BABYLON.StandardMaterial.prototype.needAlphaBlending = function () {
        return (this.alpha < 1.0) || (this.opacityTexture != null);
    };

    BABYLON.StandardMaterial.prototype.needAlphaTesting = function () {
        return this.diffuseTexture != null && this.diffuseTexture.hasAlpha;
    };

    // Methods   
    BABYLON.StandardMaterial.prototype.isReady = function (mesh) {
        if (this.checkReadyOnlyOnce) {
            if (this._wasPreviouslyReady) {
                return true;
            }
        }

        if (!this.checkReadyOnEveryCall) {
            if (this._renderId === this._scene.getRenderId()) {
                return true;
            }
        }       

        var engine = this._scene.getEngine();
        var defines = [];
        var optionalDefines = [];

        // Textures
        if (this._scene.texturesEnabled) {
            if (this.diffuseTexture) {
                if (!this.diffuseTexture.isReady()) {
                    return false;
                } else {
                    defines.push("#define DIFFUSE");
                }
            }

            if (this.ambientTexture) {
                if (!this.ambientTexture.isReady()) {
                    return false;
                } else {
                    defines.push("#define AMBIENT");
                }
            }

            if (this.opacityTexture) {
                if (!this.opacityTexture.isReady()) {
                    return false;
                } else {
                    defines.push("#define OPACITY");
                }
            }

            if (this.reflectionTexture) {
                if (!this.reflectionTexture.isReady()) {
                    return false;
                } else {
                    defines.push("#define REFLECTION");
                }
            }

            if (this.emissiveTexture) {
                if (!this.emissiveTexture.isReady()) {
                    return false;
                } else {
                    defines.push("#define EMISSIVE");
                }
            }

            if (this.specularTexture) {
                if (!this.specularTexture.isReady()) {
                    return false;
                } else {
                    defines.push("#define SPECULAR");
                    optionalDefines.push(defines[defines.length - 1]);
                }
            }
        }

        if (this._scene.getEngine().getCaps().standardDerivatives && this.bumpTexture) {
            if (!this.bumpTexture.isReady()) {
                return false;
            } else {
                defines.push("#define BUMP");
                optionalDefines.push(defines[defines.length - 1]);
            }
        }

        // Effect
        if (BABYLON.clipPlane) {
            defines.push("#define CLIPPLANE");
        }

        if (engine.getAlphaTesting()) {
            defines.push("#define ALPHATEST");
        }

        // Fog
        if (this._scene.fogMode !== BABYLON.Scene.FOGMODE_NONE) {
            defines.push("#define FOG");
            optionalDefines.push(defines[defines.length - 1]);
        }

        var shadowsActivated = false;
        var lightIndex = 0;
        if (this._scene.lightsEnabled) {
            for (var index = 0; index < this._scene.lights.length; index++) {
                var light = this._scene.lights[index];

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
                if (lightIndex == 4)
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
            if (!this._scene.getEngine().getCaps().standardDerivatives) {
                shaderName = "legacydefault";
            }

            this._effect = this._scene.getEngine().createEffect(shaderName,
                attribs,
                ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vAmbientColor", "vDiffuseColor", "vSpecularColor", "vEmissiveColor",
                "vLightData0", "vLightDiffuse0", "vLightSpecular0", "vLightDirection0", "vLightGround0", "lightMatrix0",
                "vLightData1", "vLightDiffuse1", "vLightSpecular1", "vLightDirection1", "vLightGround1", "lightMatrix1",
                "vLightData2", "vLightDiffuse2", "vLightSpecular2", "vLightDirection2", "vLightGround2", "lightMatrix2",
                "vLightData3", "vLightDiffuse3", "vLightSpecular3", "vLightDirection3", "vLightGround3", "lightMatrix3",
                "vFogInfos", "vFogColor",
                 "vDiffuseInfos", "vAmbientInfos", "vOpacityInfos", "vReflectionInfos", "vEmissiveInfos", "vSpecularInfos", "vBumpInfos",
                 "mBones",
                 "vClipPlane", "diffuseMatrix", "ambientMatrix", "opacityMatrix", "reflectionMatrix", "emissiveMatrix", "specularMatrix", "bumpMatrix"],
                ["diffuseSampler", "ambientSampler", "opacitySampler", "reflectionCubeSampler", "reflection2DSampler", "emissiveSampler", "specularSampler", "bumpSampler",
                 "shadowSampler0", "shadowSampler1", "shadowSampler2", "shadowSampler3"
                ],
                join, optionalDefines);
        }
        if (!this._effect.isReady()) {
            return false;
        }

        this._renderId = this._scene.getRenderId();
        this._wasPreviouslyReady = true;
        return true;
    };

    BABYLON.StandardMaterial.prototype.getRenderTargetTextures = function () {
        this._renderTargets.reset();

        if (this.reflectionTexture && this.reflectionTexture.isRenderTarget) {
            this._renderTargets.push(this.reflectionTexture);
        }

        return this._renderTargets;
    };

    BABYLON.StandardMaterial.prototype.unbind = function () {
        if (this.reflectionTexture && this.reflectionTexture.isRenderTarget) {
            this._effect.setTexture("reflection2DSampler", null);
        }
    };

    BABYLON.StandardMaterial.prototype.bind = function (world, mesh) {
        this._baseColor.copyFrom(this.diffuseColor);

        // Matrices        
        this._effect.setMatrix("world", world);
        this._effect.setMatrix("viewProjection", this._scene.getTransformMatrix());

        // Bones
        if (mesh.skeleton && mesh.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesIndicesKind) && mesh.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesWeightsKind)) {
            this._effect.setMatrices("mBones", mesh.skeleton.getTransformMatrices());
        }

        // Textures        
        if (this.diffuseTexture) {
            this._effect.setTexture("diffuseSampler", this.diffuseTexture);

            this._effect.setFloat2("vDiffuseInfos", this.diffuseTexture.coordinatesIndex, this.diffuseTexture.level);
            this._effect.setMatrix("diffuseMatrix", this.diffuseTexture._computeTextureMatrix());

            this._baseColor.copyFromFloats(1, 1, 1);
        }

        if (this.ambientTexture) {
            this._effect.setTexture("ambientSampler", this.ambientTexture);

            this._effect.setFloat2("vAmbientInfos", this.ambientTexture.coordinatesIndex, this.ambientTexture.level);
            this._effect.setMatrix("ambientMatrix", this.ambientTexture._computeTextureMatrix());
        }

        if (this.opacityTexture) {
            this._effect.setTexture("opacitySampler", this.opacityTexture);

            this._effect.setFloat2("vOpacityInfos", this.opacityTexture.coordinatesIndex, this.opacityTexture.level);
            this._effect.setMatrix("opacityMatrix", this.opacityTexture._computeTextureMatrix());
        }

        if (this.reflectionTexture) {
            if (this.reflectionTexture.isCube) {
                this._effect.setTexture("reflectionCubeSampler", this.reflectionTexture);
            } else {
                this._effect.setTexture("reflection2DSampler", this.reflectionTexture);
            }

            this._effect.setMatrix("reflectionMatrix", this.reflectionTexture._computeReflectionTextureMatrix());
            this._effect.setFloat3("vReflectionInfos", this.reflectionTexture.coordinatesMode, this.reflectionTexture.level, this.reflectionTexture.isCube ? 1 : 0);
        }

        if (this.emissiveTexture) {
            this._effect.setTexture("emissiveSampler", this.emissiveTexture);

            this._effect.setFloat2("vEmissiveInfos", this.emissiveTexture.coordinatesIndex, this.emissiveTexture.level);
            this._effect.setMatrix("emissiveMatrix", this.emissiveTexture._computeTextureMatrix());
        }

        if (this.specularTexture) {
            this._effect.setTexture("specularSampler", this.specularTexture);

            this._effect.setFloat2("vSpecularInfos", this.specularTexture.coordinatesIndex, this.specularTexture.level);
            this._effect.setMatrix("specularMatrix", this.specularTexture._computeTextureMatrix());
        }

        if (this.bumpTexture && this._scene.getEngine().getCaps().standardDerivatives) {
            this._effect.setTexture("bumpSampler", this.bumpTexture);

            this._effect.setFloat2("vBumpInfos", this.bumpTexture.coordinatesIndex, this.bumpTexture.level);
            this._effect.setMatrix("bumpMatrix", this.bumpTexture._computeTextureMatrix());
        }

        // Colors
        this._scene.ambientColor.multiplyToRef(this.ambientColor, this._globalAmbientColor);

        this._effect.setVector3("vEyePosition", this._scene.activeCamera.position);
        this._effect.setColor3("vAmbientColor", this._globalAmbientColor);
        this._effect.setColor4("vDiffuseColor", this._baseColor, this.alpha * mesh.visibility);
        this._effect.setColor4("vSpecularColor", this.specularColor, this.specularPower);
        this._effect.setColor3("vEmissiveColor", this.emissiveColor);

        if (this._scene.lightsEnabled) {
            var lightIndex = 0;
            for (var index = 0; index < this._scene.lights.length; index++) {
                var light = this._scene.lights[index];

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
                this._effect.setColor3("vLightDiffuse" + lightIndex, this._scaledDiffuse);
                this._effect.setColor3("vLightSpecular" + lightIndex, this._scaledSpecular);

                // Shadows
                var shadowGenerator = light.getShadowGenerator();
                if (mesh.receiveShadows && shadowGenerator) {
                    world.multiplyToRef(shadowGenerator.getTransformMatrix(), this._lightMatrix);
                    this._effect.setMatrix("lightMatrix" + lightIndex, this._lightMatrix);
                    this._effect.setTexture("shadowSampler" + lightIndex, shadowGenerator.getShadowMap());
                }

                lightIndex++;

                if (lightIndex == 4)
                    break;
            }
        }

        if (BABYLON.clipPlane) {
            this._effect.setFloat4("vClipPlane", BABYLON.clipPlane.normal.x, BABYLON.clipPlane.normal.y, BABYLON.clipPlane.normal.z, BABYLON.clipPlane.d);
        }

        // View
        if (this._scene.fogMode !== BABYLON.Scene.FOGMODE_NONE || this.reflectionTexture) {
            this._effect.setMatrix("view", this._scene.getViewMatrix());
        }

        // Fog
        if (this._scene.fogMode !== BABYLON.Scene.FOGMODE_NONE) {
            this._effect.setFloat4("vFogInfos", this._scene.fogMode, this._scene.fogStart, this._scene.fogEnd, this._scene.fogDensity);
            this._effect.setColor3("vFogColor", this._scene.fogColor);
        }
    };

    BABYLON.StandardMaterial.prototype.getAnimatables = function () {
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

    BABYLON.StandardMaterial.prototype.dispose = function () {
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

        this.baseDispose();
    };

    BABYLON.StandardMaterial.prototype.clone = function (name) {
        var newStandardMaterial = new BABYLON.StandardMaterial(name, this._scene);

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

})();