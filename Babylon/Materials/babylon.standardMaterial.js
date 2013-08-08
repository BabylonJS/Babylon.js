var BABYLON = BABYLON || {};

(function () {

    var isIE = function() {
        return window.ActiveXObject !== undefined;
    };
    
    BABYLON.StandardMaterial = function (name, scene) {
        this.name = name;
        this.id = name;

        this._scene = scene;
        scene.materials.push(this);

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
        var engine = this._scene.getEngine();

        // Textures
        if (this.diffuseTexture && !this.diffuseTexture.isReady()) {
            return false;
        }

        if (this.ambientTexture && !this.ambientTexture.isReady()) {
            return false;
        }

        if (this.opacityTexture && !this.opacityTexture.isReady()) {
            return false;
        }

        if (this.reflectionTexture && !this.reflectionTexture.isReady()) {
            return false;
        }

        if (this.emissiveTexture && !this.emissiveTexture.isReady()) {
            return false;
        }

        if (this.specularTexture && !this.specularTexture.isReady()) {
            return false;
        }
        
        if (this.bumpTexture && !this.bumpTexture.isReady()) {
            return false;
        }

        // Effect
        var defines = [];
        if (this.diffuseTexture) {
            defines.push("#define DIFFUSE");
        }

        if (this.ambientTexture) {
            defines.push("#define AMBIENT");
        }

        if (this.opacityTexture) {
            defines.push("#define OPACITY");
        }

        if (this.reflectionTexture) {
            defines.push("#define REFLECTION");
        }

        if (this.emissiveTexture) {
            defines.push("#define EMISSIVE");
        }

        if (this.specularTexture) {
            defines.push("#define SPECULAR");
        }
        
        if (this.bumpTexture && this._scene.getEngine().getCaps().standardDerivatives) {
            defines.push("#define BUMP");
        }

        if (BABYLON.clipPlane) {
            defines.push("#define CLIPPLANE");
        }

        if (engine.getAlphaTesting()) {
            defines.push("#define ALPHATEST");
        }
        
        // Fog
        if (this._scene.fogMode !== BABYLON.Scene.FOGMODE_NONE) {
            defines.push("#define FOG");
        }

        var shadowsActivated = false;
        var lightIndex = 0;
        for (var index = 0; index < this._scene.lights.length; index++) {
            var light = this._scene.lights[index];

            if (!light.isEnabled) {
                continue;
            }

            defines.push("#define LIGHT" + lightIndex);
            
            if (light instanceof BABYLON.SpotLight) {
                defines.push("#define SPOTLIGHT" + lightIndex);
            } else if (light instanceof BABYLON.HemisphericLight) {
                defines.push("#define HEMILIGHT" + lightIndex);
            } else {
                defines.push("#define POINTDIRLIGHT" + lightIndex);               
            }
            
            // Shadows
            var shadowGenerator = light.getShadowGenerator();
            if (mesh && mesh.receiveShadows && shadowGenerator && shadowGenerator.isReady()) {
                defines.push("#define SHADOW" + lightIndex);

                if (!shadowsActivated) {
                    defines.push("#define SHADOWS");
                    shadowsActivated = true;
                }

                if (shadowGenerator.useVarianceShadowMap) {
                    defines.push("#define SHADOWVSM" + lightIndex);
                }
            }

            lightIndex++;
            if (lightIndex == 4)
                break;
        }

        var attribs = ["position", "normal"];
        if (mesh) {
            switch (mesh._uvCount) {
                case 1:
                    attribs = ["position", "normal", "uv"];
                    defines.push("#define UV1");
                    break;
                case 2:
                    attribs = ["position", "normal", "uv", "uv2"];
                    defines.push("#define UV1");
                    defines.push("#define UV2");
                    break;
            }
        }

        // Get correct effect      
        var join = defines.join("\n");
        if (this._cachedDefines != join) {
            this._cachedDefines = join;
            
            // IE patch
            var shaderName = "default";
            if (isIE()) {
                shaderName = "iedefault";
            }

            this._effect = this._scene.getEngine().createEffect(shaderName,
                attribs,
            ["world", "view", "worldViewProjection", "vEyePosition", "vLightsType", "vAmbientColor", "vDiffuseColor", "vSpecularColor", "vEmissiveColor",
                "vLightData0", "vLightDiffuse0", "vLightSpecular0", "vLightDirection0", "vLightGround0", "lightMatrix0",
                "vLightData1", "vLightDiffuse1", "vLightSpecular1", "vLightDirection1", "vLightGround1", "lightMatrix1",
                "vLightData2", "vLightDiffuse2", "vLightSpecular2", "vLightDirection2", "vLightGround2", "lightMatrix2",
                "vLightData3", "vLightDiffuse3", "vLightSpecular3", "vLightDirection3", "vLightGround3", "lightMatrix3",
                "vFogInfos", "vFogColor",
                 "vDiffuseInfos", "vAmbientInfos", "vOpacityInfos", "vReflectionInfos", "vEmissiveInfos", "vSpecularInfos", "vBumpInfos",
                 "vClipPlane", "diffuseMatrix", "ambientMatrix", "opacityMatrix", "reflectionMatrix", "emissiveMatrix", "specularMatrix", "bumpMatrix"],
                ["diffuseSampler", "ambientSampler", "opacitySampler", "reflectionCubeSampler", "reflection2DSampler", "emissiveSampler", "specularSampler", "bumpSampler",
                 "shadowSampler0", "shadowSampler1", "shadowSampler2", "shadowSampler3"
                ],
                join);
        }
        if (!this._effect.isReady()) {
            return false;
        }

        return true;
    };

    BABYLON.StandardMaterial.prototype.getRenderTargetTextures = function () {
        var results = [];

        if (this.reflectionTexture && this.reflectionTexture.isRenderTarget) {
            results.push(this.reflectionTexture);
        }

        return results;
    };

    BABYLON.StandardMaterial.prototype.unbind = function () {
        if (this.reflectionTexture && this.reflectionTexture.isRenderTarget) {
            this._effect.setTexture("reflection2DSampler", null);
        }
    };

    BABYLON.StandardMaterial.prototype.bind = function (world, mesh) {
        var baseColor = this.diffuseColor;

        // Values
        if (this.diffuseTexture) {
            this._effect.setTexture("diffuseSampler", this.diffuseTexture);

            this._effect.setVector2("vDiffuseInfos", this.diffuseTexture.coordinatesIndex, this.diffuseTexture.level);
            this._effect.setMatrix("diffuseMatrix", this.diffuseTexture._computeTextureMatrix());

            baseColor = new BABYLON.Color3(1, 1, 1);
        }

        if (this.ambientTexture) {
            this._effect.setTexture("ambientSampler", this.ambientTexture);

            this._effect.setVector2("vAmbientInfos", this.ambientTexture.coordinatesIndex, this.ambientTexture.level);
            this._effect.setMatrix("ambientMatrix", this.ambientTexture._computeTextureMatrix());
        }

        if (this.opacityTexture) {
            this._effect.setTexture("opacitySampler", this.opacityTexture);

            this._effect.setVector2("vOpacityInfos", this.opacityTexture.coordinatesIndex, this.opacityTexture.level);
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

            this._effect.setVector2("vEmissiveInfos", this.emissiveTexture.coordinatesIndex, this.emissiveTexture.level);
            this._effect.setMatrix("emissiveMatrix", this.emissiveTexture._computeTextureMatrix());
        }

        if (this.specularTexture) {
            this._effect.setTexture("specularSampler", this.specularTexture);

            this._effect.setVector2("vSpecularInfos", this.specularTexture.coordinatesIndex, this.specularTexture.level);
            this._effect.setMatrix("specularMatrix", this.specularTexture._computeTextureMatrix());
        }
        
        if (this.bumpTexture && this._scene.getEngine().getCaps().standardDerivatives) {
            this._effect.setTexture("bumpSampler", this.bumpTexture);

            this._effect.setVector2("vBumpInfos", this.bumpTexture.coordinatesIndex, this.bumpTexture.level);
            this._effect.setMatrix("bumpMatrix", this.bumpTexture._computeTextureMatrix());
        }

        this._effect.setMatrix("world", world);
        this._effect.setMatrix("worldViewProjection", world.multiply(this._scene.getTransformMatrix()));
        this._effect.setVector3("vEyePosition", this._scene.activeCamera.position);
        this._effect.setColor3("vAmbientColor", this._scene.ambientColor.multiply(this.ambientColor));
        this._effect.setColor4("vDiffuseColor", baseColor, this.alpha * mesh.visibility);
        this._effect.setColor4("vSpecularColor", this.specularColor, this.specularPower);
        this._effect.setColor3("vEmissiveColor", this.emissiveColor);

        var lightIndex = 0;
        for (var index = 0; index < this._scene.lights.length; index++) {
            var light = this._scene.lights[index];

            if (!light.isEnabled) {
                continue;
            }
                        
            if (light instanceof BABYLON.PointLight) {
                // Point Light
                this._effect.setFloat4("vLightData" + lightIndex, light.position.x, light.position.y, light.position.z, 0);
            } else if (light instanceof BABYLON.DirectionalLight) {
                // Directional Light
                this._effect.setFloat4("vLightData" + lightIndex, light.direction.x, light.direction.y, light.direction.z, 1);               
            } else if (light instanceof BABYLON.SpotLight) {
                // Spot Light
                this._effect.setFloat4("vLightData" + lightIndex, light.position.x, light.position.y, light.position.z, light.exponent);
                var normalizeDirection = BABYLON.Vector3.Normalize(light.direction);
                this._effect.setFloat4("vLightDirection" + lightIndex, normalizeDirection.x, normalizeDirection.y, normalizeDirection.z, Math.cos(light.angle * 0.5));
            } else if (light instanceof BABYLON.HemisphericLight) {
                // Hemispheric Light
                var normalizeDirection = BABYLON.Vector3.Normalize(light.direction);
                this._effect.setFloat4("vLightData" + lightIndex, normalizeDirection.x, normalizeDirection.y, normalizeDirection.z, 0);
                this._effect.setColor3("vLightGround" + lightIndex, light.groundColor.scale(light.intensity));
            }
            this._effect.setColor3("vLightDiffuse" + lightIndex, light.diffuse.scale(light.intensity));
            this._effect.setColor3("vLightSpecular" + lightIndex, light.specular.scale(light.intensity));
            
            // Shadows
            var shadowGenerator = light.getShadowGenerator();
            if (mesh.receiveShadows && shadowGenerator && shadowGenerator.isReady()) {
                this._effect.setMatrix("lightMatrix" + lightIndex, world.multiply(shadowGenerator.getTransformMatrix()));
                this._effect.setTexture("shadowSampler" + lightIndex, shadowGenerator.getShadowMap());
            }

            lightIndex++;

            if (lightIndex == 4)
                break;
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
})();