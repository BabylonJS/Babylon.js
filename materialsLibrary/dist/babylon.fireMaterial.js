/// <reference path="../../../dist/preview release/babylon.d.ts"/>

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
var BABYLON;
(function (BABYLON) {
    var maxSimultaneousLights = 4;
    var FireMaterialDefines = (function (_super) {
        __extends(FireMaterialDefines, _super);
        function FireMaterialDefines() {
            _super.call(this);
            this.DIFFUSE = false;
            this.CLIPPLANE = false;
            this.ALPHATEST = false;
            this.POINTSIZE = false;
            this.FOG = false;
            this.UV1 = false;
            this.VERTEXCOLOR = false;
            this.VERTEXALPHA = false;
            this.BonesPerMesh = 0;
            this.NUM_BONE_INFLUENCERS = 0;
            this.INSTANCES = false;
            this._keys = Object.keys(this);
        }
        return FireMaterialDefines;
    })(BABYLON.MaterialDefines);
    var FireMaterial = (function (_super) {
        __extends(FireMaterial, _super);
        function FireMaterial(name, scene) {
            _super.call(this, name, scene);
            this.diffuseColor = new BABYLON.Color3(1, 1, 1);
            this.speed = 1.0;
            this._scaledDiffuse = new BABYLON.Color3();
            this._defines = new FireMaterialDefines();
            this._cachedDefines = new FireMaterialDefines();
            this._lastTime = 0;
            this._cachedDefines.BonesPerMesh = -1;
        }
        FireMaterial.prototype.needAlphaBlending = function () {
            return (this.alpha < 1.0);
        };
        FireMaterial.prototype.needAlphaTesting = function () {
            return false;
        };
        FireMaterial.prototype.getAlphaTestTexture = function () {
            return null;
        };
        // Methods   
        FireMaterial.prototype._checkCache = function (scene, mesh, useInstances) {
            if (!mesh) {
                return true;
            }
            if (this._defines.INSTANCES !== useInstances) {
                return false;
            }
            if (mesh._materialDefines && mesh._materialDefines.isEqual(this._defines)) {
                return true;
            }
            return false;
        };
        FireMaterial.prototype.isReady = function (mesh, useInstances) {
            if (this.checkReadyOnlyOnce) {
                if (this._wasPreviouslyReady) {
                    return true;
                }
            }
            var scene = this.getScene();
            if (!this.checkReadyOnEveryCall) {
                if (this._renderId === scene.getRenderId()) {
                    if (this._checkCache(scene, mesh, useInstances)) {
                        return true;
                    }
                }
            }
            var engine = scene.getEngine();
            var needNormals = false;
            var needUVs = false;
            this._defines.reset();
            // Textures
            if (scene.texturesEnabled) {
                if (this.diffuseTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                    if (!this.diffuseTexture.isReady()) {
                        return false;
                    }
                    else {
                        needUVs = true;
                        this._defines.DIFFUSE = true;
                    }
                }
            }
            // Effect
            if (scene.clipPlane) {
                this._defines.CLIPPLANE = true;
            }
            this._defines.ALPHATEST = true;
            // Point size
            if (this.pointsCloud || scene.forcePointsCloud) {
                this._defines.POINTSIZE = true;
            }
            // Fog
            if (scene.fogEnabled && mesh && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE && this.fogEnabled) {
                this._defines.FOG = true;
            }
            // Attribs
            if (mesh) {
                if (needUVs) {
                    if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.UVKind)) {
                        this._defines.UV1 = true;
                    }
                }
                if (mesh.useVertexColors && mesh.isVerticesDataPresent(BABYLON.VertexBuffer.ColorKind)) {
                    this._defines.VERTEXCOLOR = true;
                    if (mesh.hasVertexAlpha) {
                        this._defines.VERTEXALPHA = true;
                    }
                }
                if (mesh.useBones && mesh.computeBonesUsingShaders) {
                    this._defines.NUM_BONE_INFLUENCERS = mesh.numBoneInfluencers;
                    this._defines.BonesPerMesh = (mesh.skeleton.bones.length + 1);
                }
                // Instances
                if (useInstances) {
                    this._defines.INSTANCES = true;
                }
            }
            // Get correct effect      
            if (!this._defines.isEqual(this._cachedDefines)) {
                this._defines.cloneTo(this._cachedDefines);
                scene.resetCachedMaterial();
                // Fallbacks
                var fallbacks = new BABYLON.EffectFallbacks();
                if (this._defines.FOG) {
                    fallbacks.addFallback(1, "FOG");
                }
                if (this._defines.NUM_BONE_INFLUENCERS > 0) {
                    fallbacks.addCPUSkinningFallback(0, mesh);
                }
                //Attributes
                var attribs = [BABYLON.VertexBuffer.PositionKind];
                if (this._defines.UV1) {
                    attribs.push(BABYLON.VertexBuffer.UVKind);
                }
                if (this._defines.VERTEXCOLOR) {
                    attribs.push(BABYLON.VertexBuffer.ColorKind);
                }
                BABYLON.MaterialHelper.PrepareAttributesForBones(attribs, mesh, this._defines, fallbacks);
                BABYLON.MaterialHelper.PrepareAttributesForInstances(attribs, this._defines);
                // Legacy browser patch
                var shaderName = "fire";
                var join = this._defines.toString();
                this._effect = scene.getEngine().createEffect(shaderName, attribs, ["world", "view", "viewProjection", "vEyePosition",
                    "vFogInfos", "vFogColor", "pointSize",
                    "vDiffuseInfos",
                    "mBones",
                    "vClipPlane", "diffuseMatrix",
                    // Fire
                    "time", "speed"
                ], ["diffuseSampler",
                    // Fire
                    "distortionSampler", "opacitySampler"
                ], join, fallbacks, this.onCompiled, this.onError);
            }
            if (!this._effect.isReady()) {
                return false;
            }
            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;
            if (mesh) {
                if (!mesh._materialDefines) {
                    mesh._materialDefines = new FireMaterialDefines();
                }
                this._defines.cloneTo(mesh._materialDefines);
            }
            return true;
        };
        FireMaterial.prototype.bindOnlyWorldMatrix = function (world) {
            this._effect.setMatrix("world", world);
        };
        FireMaterial.prototype.bind = function (world, mesh) {
            var scene = this.getScene();
            // Matrices        
            this.bindOnlyWorldMatrix(world);
            this._effect.setMatrix("viewProjection", scene.getTransformMatrix());
            // Bones
            BABYLON.MaterialHelper.BindBonesParameters(mesh, this._effect);
            if (scene.getCachedMaterial() !== this) {
                // Textures        
                if (this.diffuseTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                    this._effect.setTexture("diffuseSampler", this.diffuseTexture);
                    this._effect.setFloat2("vDiffuseInfos", this.diffuseTexture.coordinatesIndex, this.diffuseTexture.level);
                    this._effect.setMatrix("diffuseMatrix", this.diffuseTexture.getTextureMatrix());
                    this._effect.setTexture("distortionSampler", this.distortionTexture);
                    this._effect.setTexture("opacitySampler", this.opacityTexture);
                }
                // Clip plane
                if (scene.clipPlane) {
                    var clipPlane = scene.clipPlane;
                    this._effect.setFloat4("vClipPlane", clipPlane.normal.x, clipPlane.normal.y, clipPlane.normal.z, clipPlane.d);
                }
                // Point size
                if (this.pointsCloud) {
                    this._effect.setFloat("pointSize", this.pointSize);
                }
                this._effect.setVector3("vEyePosition", scene._mirroredCameraPosition ? scene._mirroredCameraPosition : scene.activeCamera.position);
            }
            this._effect.setColor4("vDiffuseColor", this._scaledDiffuse, this.alpha * mesh.visibility);
            // View
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE) {
                this._effect.setMatrix("view", scene.getViewMatrix());
            }
            // Fog
            BABYLON.MaterialHelper.BindFogParameters(scene, mesh, this._effect);
            // Time
            this._lastTime += scene.getEngine().getDeltaTime();
            this._effect.setFloat("time", this._lastTime);
            // Speed
            this._effect.setFloat("speed", this.speed);
            _super.prototype.bind.call(this, world, mesh);
        };
        FireMaterial.prototype.getAnimatables = function () {
            var results = [];
            if (this.diffuseTexture && this.diffuseTexture.animations && this.diffuseTexture.animations.length > 0) {
                results.push(this.diffuseTexture);
            }
            if (this.distortionTexture && this.distortionTexture.animations && this.distortionTexture.animations.length > 0) {
                results.push(this.distortionTexture);
            }
            if (this.opacityTexture && this.opacityTexture.animations && this.opacityTexture.animations.length > 0) {
                results.push(this.opacityTexture);
            }
            return results;
        };
        FireMaterial.prototype.dispose = function (forceDisposeEffect) {
            if (this.diffuseTexture) {
                this.diffuseTexture.dispose();
            }
            if (this.distortionTexture) {
                this.distortionTexture.dispose();
            }
            _super.prototype.dispose.call(this, forceDisposeEffect);
        };
        FireMaterial.prototype.clone = function (name) {
            var _this = this;
            /*
            var newMaterial = new FireMaterial(name, this.getScene());

            // Base material
            this.copyTo(newMaterial);

            // Fire material
            if (this.diffuseTexture && this.diffuseTexture.clone) {
                newMaterial.diffuseTexture = this.diffuseTexture.clone();
            }
            if (this.distortionTexture && this.distortionTexture.clone) {
                newMaterial.distortionTexture = this.distortionTexture.clone();
            }
            if (this.opacityTexture && this.opacityTexture.clone) {
                newMaterial.opacityTexture = this.opacityTexture.clone();
            }

            newMaterial.diffuseColor = this.diffuseColor.clone();
            return newMaterial;
            */
            return BABYLON.SerializationHelper.Clone(function () { return new FireMaterial(name, _this.getScene()); }, this);
        };
        FireMaterial.prototype.serialize = function () {
            var serializationObject = _super.prototype.serialize.call(this);
            serializationObject.customType = "BABYLON.FireMaterial";
            serializationObject.diffuseColor = this.diffuseColor.asArray();
            serializationObject.speed = this.speed;
            if (this.diffuseTexture) {
                serializationObject.diffuseTexture = this.diffuseTexture.serialize();
            }
            if (this.distortionTexture) {
                serializationObject.distortionTexture = this.distortionTexture.serialize();
            }
            if (this.opacityTexture) {
                serializationObject.opacityTexture = this.opacityTexture.serialize();
            }
            return serializationObject;
        };
        FireMaterial.Parse = function (source, scene, rootUrl) {
            var material = new FireMaterial(source.name, scene);
            material.diffuseColor = BABYLON.Color3.FromArray(source.diffuseColor);
            material.speed = source.speed;
            material.alpha = source.alpha;
            material.id = source.id;
            BABYLON.Tags.AddTagsTo(material, source.tags);
            material.backFaceCulling = source.backFaceCulling;
            material.wireframe = source.wireframe;
            if (source.diffuseTexture) {
                material.diffuseTexture = BABYLON.Texture.Parse(source.diffuseTexture, scene, rootUrl);
            }
            if (source.distortionTexture) {
                material.distortionTexture = BABYLON.Texture.Parse(source.distortionTexture, scene, rootUrl);
            }
            if (source.opacityTexture) {
                material.opacityTexture = BABYLON.Texture.Parse(source.opacityTexture, scene, rootUrl);
            }
            if (source.checkReadyOnlyOnce) {
                material.checkReadyOnlyOnce = source.checkReadyOnlyOnce;
            }
            return material;
        };
        __decorate([
            BABYLON.serializeAsTexture()
        ], FireMaterial.prototype, "diffuseTexture");
        __decorate([
            BABYLON.serializeAsTexture()
        ], FireMaterial.prototype, "distortionTexture");
        __decorate([
            BABYLON.serializeAsTexture()
        ], FireMaterial.prototype, "opacityTexture");
        __decorate([
            BABYLON.serialize("diffuseColor")
        ], FireMaterial.prototype, "diffuseColor");
        __decorate([
            BABYLON.serialize()
        ], FireMaterial.prototype, "speed");
        return FireMaterial;
    })(BABYLON.Material);
    BABYLON.FireMaterial = FireMaterial;
})(BABYLON || (BABYLON = {}));

BABYLON.Effect.ShadersStore['fireVertexShader'] = "precision highp float;\n\n// Attributes\nattribute vec3 position;\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n\n#include<bonesDeclaration>\n\n// Uniforms\n#include<instancesDeclaration>\n\nuniform mat4 view;\nuniform mat4 viewProjection;\n\n#ifdef DIFFUSE\nvarying vec2 vDiffuseUV;\n#endif\n\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n\n// Output\nvarying vec3 vPositionW;\n\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n#include<clipPlaneVertexDeclaration>\n\n#include<fogVertexDeclaration>\n#include<shadowsVertexDeclaration>\n\n// Fire\nuniform float time;\nuniform float speed;\n\nvarying vec2 vDistortionCoords1;\nvarying vec2 vDistortionCoords2;\nvarying vec2 vDistortionCoords3;\n\nvoid main(void) {\n\n#include<instancesVertex>\n#include<bonesVertex>\n\n\tgl_Position = viewProjection * finalWorld * vec4(position, 1.0);\n\n\tvec4 worldPos = finalWorld * vec4(position, 1.0);\n\tvPositionW = vec3(worldPos);\n\n\t// Texture coordinates\n#ifdef DIFFUSE\n\tvDiffuseUV = uv;\n\tvDiffuseUV.y -= 0.2;\n#endif\n\n\t// Clip plane\n#include<clipPlaneVertex>\n\n\t// Fog\n#include<fogVertex>\n\n\t// Vertex color\n#ifdef VERTEXCOLOR\n\tvColor = color;\n#endif\n\n\t// Point size\n#ifdef POINTSIZE\n\tgl_PointSize = pointSize;\n#endif\n\n\t// Fire\n\tvec3 layerSpeed = vec3(-0.2, -0.52, -0.1) * speed;\n\t\n\tvDistortionCoords1.x = uv.x;\n\tvDistortionCoords1.y = uv.y + layerSpeed.x * time / 1000.0;\n\t\n\tvDistortionCoords2.x = uv.x;\n\tvDistortionCoords2.y = uv.y + layerSpeed.y * time / 1000.0;\n\t\n\tvDistortionCoords3.x = uv.x;\n\tvDistortionCoords3.y = uv.y + layerSpeed.z * time / 1000.0;\n}\n";
BABYLON.Effect.ShadersStore['firePixelShader'] = "precision highp float;\n\n// Constants\nuniform vec3 vEyePosition;\n\n// Input\nvarying vec3 vPositionW;\n\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n// Samplers\n#ifdef DIFFUSE\nvarying vec2 vDiffuseUV;\nuniform sampler2D diffuseSampler;\nuniform vec2 vDiffuseInfos;\n#endif\n\n// Fire\nuniform sampler2D distortionSampler;\nuniform sampler2D opacitySampler;\n\nvarying vec2 vDistortionCoords1;\nvarying vec2 vDistortionCoords2;\nvarying vec2 vDistortionCoords3;\n\n#include<clipPlaneFragmentDeclaration>\n\n// Fog\n#include<fogFragmentDeclaration>\n\nvec4 bx2(vec4 x)\n{\n   return vec4(2.0) * x - vec4(1.0);\n}\n\nvoid main(void) {\n\t// Clip plane\n#include<clipPlaneFragment>\n\n\tvec3 viewDirectionW = normalize(vEyePosition - vPositionW);\n\n\t// Base color\n\tvec4 baseColor = vec4(1., 1., 1., 1.);\n\n\t// Alpha\n\tfloat alpha = 1.0;\n\n#ifdef DIFFUSE\n\t// Fire\n\tconst float distortionAmount0  = 0.092;\n\tconst float distortionAmount1  = 0.092;\n\tconst float distortionAmount2  = 0.092;\n\t\n\tvec2 heightAttenuation = vec2(0.3, 0.39);\n\t\n\tvec4 noise0 = texture2D(distortionSampler, vDistortionCoords1);\n\tvec4 noise1 = texture2D(distortionSampler, vDistortionCoords2);\n\tvec4 noise2 = texture2D(distortionSampler, vDistortionCoords3);\n\t\n\tvec4 noiseSum = bx2(noise0) * distortionAmount0 + bx2(noise1) * distortionAmount1 + bx2(noise2) * distortionAmount2;\n\t\n\tvec4 perturbedBaseCoords = vec4(vDiffuseUV, 0.0, 1.0) + noiseSum * (vDiffuseUV.y * heightAttenuation.x + heightAttenuation.y);\n\t\n\tvec4 opacityColor = texture2D(opacitySampler, perturbedBaseCoords.xy);\n\t\n#ifdef ALPHATEST\n\tif (opacityColor.r < 0.1)\n\t\tdiscard;\n#endif\n\t\n\tbaseColor = texture2D(diffuseSampler, perturbedBaseCoords.xy) * 2.0;\n\tbaseColor *= opacityColor;\n\n\tbaseColor.rgb *= vDiffuseInfos.y;\n#endif\n\n#ifdef VERTEXCOLOR\n\tbaseColor.rgb *= vColor.rgb;\n#endif\n\n\t// Lighting\n\tvec3 diffuseBase = vec3(1.0, 1.0, 1.0);\n\n#ifdef VERTEXALPHA\n\talpha *= vColor.a;\n#endif\n\n\t// Composition\n\tvec4 color = vec4(baseColor.rgb, alpha);\n\n#include<fogFragment>\n\n\tgl_FragColor = color;\n}";
