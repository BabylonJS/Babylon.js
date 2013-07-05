var BABYLON = BABYLON || {};

(function () {
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

        if (BABYLON.clipPlane) {
            defines.push("#define CLIPPLANE");
        }

        if (engine.getAlphaTesting()) {
            defines.push("#define ALPHATEST");
        }
        
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
            if (window.ActiveXObject !== undefined) {
                shaderName = "iedefault";
            }

            this._effect = this._scene.getEngine().createEffect(shaderName,
                attribs,
                ["world", "view", "worldViewProjection", "vEyePosition", "vLightsType", "vAmbientColor", "vDiffuseColor", "vSpecularColor", "vEmissiveColor",
                 "vLightData0", "vLightDiffuse0", "vLightSpecular0", "vLightDirection0", "vLightGround0",
                 "vLightData1", "vLightDiffuse1", "vLightSpecular1", "vLightDirection1", "vLightGround1",
                 "vLightData2", "vLightDiffuse2", "vLightSpecular2", "vLightDirection2", "vLightGround2",
                 "vLightData3", "vLightDiffuse3", "vLightSpecular3", "vLightDirection3", "vLightGround3",
                 "vDiffuseInfos", "vAmbientInfos", "vOpacityInfos", "vReflectionInfos", "vEmissiveInfos", "vSpecularInfos",
                 "vMisc", "vClipPlane", "diffuseMatrix", "ambientMatrix", "opacityMatrix", "reflectionMatrix", "emissiveMatrix", "specularMatrix"],
                ["diffuseSampler", "ambientSampler", "opacitySampler", "reflectionCubeSampler", "reflection2DSampler", "emissiveSampler", "specularSampler"],
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
        var vMisc = [0, 0, 0, 0];
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

            // Matrix
            var matrix = BABYLON.Matrix.Identity();

            switch (this.reflectionTexture.coordinatesMode) {
                case BABYLON.Texture.SPHERICAL_MODE:
                    matrix.m[0] = -0.5 * this.reflectionTexture.uScale;
                    matrix.m[5] = -0.5 * this.reflectionTexture.vScale;
                    matrix.m[12] = 0.5 + this.reflectionTexture.uOffset;
                    matrix.m[13] = 0.5 + this.reflectionTexture.vOffset;
                    break;
                case BABYLON.Texture.PLANAR_MODE:
                    matrix.m[0] = this.reflectionTexture.uScale;
                    matrix.m[5] = this.reflectionTexture.vScale;
                    matrix.m[12] = this.reflectionTexture.uOffset;
                    matrix.m[13] = this.reflectionTexture.vOffset;
                    break;
                case BABYLON.Texture.PROJECTION_MODE:
                    matrix.m[0] = 0.5;
                    matrix.m[5] = -0.5;
                    matrix.m[10] = 0.0;
                    matrix.m[12] = 0.5;
                    matrix.m[13] = 0.5;
                    matrix.m[14] = 1.0;
                    matrix.m[15] = 1.0;

                    matrix = this._scene.getProjectionMatrix().multiply(matrix);
                    break;
            }
            this._effect.setMatrix("reflectionMatrix", matrix);
            vMisc[0] = (this.reflectionTexture.isCube ? 1 : 0);
            this._effect.setMatrix("view", this._scene.getViewMatrix());
            this._effect.setVector2("vReflectionInfos", this.reflectionTexture.coordinatesMode, this.reflectionTexture.level);
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
                this._effect.setVector4("vLightData" + lightIndex, light.position.x, light.position.y, light.position.z, 0);
            } else if (light instanceof BABYLON.DirectionalLight) {
                // Directional Light
                this._effect.setVector4("vLightData" + lightIndex, light.direction.x, light.direction.y, light.direction.z, 1);
            } else if (light instanceof BABYLON.SpotLight) {
                // Spot Light
                this._effect.setVector4("vLightData" + lightIndex, light.position.x, light.position.y, light.position.z, light.exponent);
                var normalizeDirection = BABYLON.Vector3.Normalize(light.direction);
                this._effect.setVector4("vLightDirection" + lightIndex, normalizeDirection.x, normalizeDirection.y, normalizeDirection.z, Math.cos(light.angle * 0.5));
            } else if (light instanceof BABYLON.HemisphericLight) {
                // Hemispheric Light
                var normalizeDirection = BABYLON.Vector3.Normalize(light.direction);
                this._effect.setVector4("vLightData" + lightIndex, normalizeDirection.x, normalizeDirection.y, normalizeDirection.z, 0);
                this._effect.setColor3("vLightGround" + lightIndex, light.groundColor.scale(light.intensity));
            }
            this._effect.setColor3("vLightDiffuse" + lightIndex, light.diffuse.scale(light.intensity));
            this._effect.setColor3("vLightSpecular" + lightIndex, light.specular.scale(light.intensity));

            lightIndex++;

            if (lightIndex == 4)
                break;
        }

        this._effect.setVector4("vMisc", vMisc[0], vMisc[1], vMisc[2], vMisc[3]);

        if (BABYLON.clipPlane) {
            this._effect.setVector4("vClipPlane", BABYLON.clipPlane.normal.x, BABYLON.clipPlane.normal.y, BABYLON.clipPlane.normal.z, BABYLON.clipPlane.d);
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

        // Remove from scene
        var index = this._scene.materials.indexOf(this);
        this._scene.materials.splice(index, 1);

        // Callback
        if (this.onDispose) {
            this.onDispose();
        }
    };
})();