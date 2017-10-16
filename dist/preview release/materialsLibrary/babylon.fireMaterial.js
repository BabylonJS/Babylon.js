/// <reference path="../../../dist/preview release/babylon.d.ts"/>
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
var BABYLON;
(function (BABYLON) {
    var FireMaterialDefines = /** @class */ (function (_super) {
        __extends(FireMaterialDefines, _super);
        function FireMaterialDefines() {
            var _this = _super.call(this) || this;
            _this.DIFFUSE = false;
            _this.CLIPPLANE = false;
            _this.ALPHATEST = false;
            _this.DEPTHPREPASS = false;
            _this.POINTSIZE = false;
            _this.FOG = false;
            _this.UV1 = false;
            _this.VERTEXCOLOR = false;
            _this.VERTEXALPHA = false;
            _this.BonesPerMesh = 0;
            _this.NUM_BONE_INFLUENCERS = 0;
            _this.INSTANCES = false;
            _this.rebuild();
            return _this;
        }
        return FireMaterialDefines;
    }(BABYLON.MaterialDefines));
    var FireMaterial = /** @class */ (function (_super) {
        __extends(FireMaterial, _super);
        function FireMaterial(name, scene) {
            var _this = _super.call(this, name, scene) || this;
            _this.diffuseColor = new BABYLON.Color3(1, 1, 1);
            _this.speed = 1.0;
            _this._scaledDiffuse = new BABYLON.Color3();
            _this._lastTime = 0;
            return _this;
        }
        FireMaterial.prototype.needAlphaBlending = function () {
            return false;
        };
        FireMaterial.prototype.needAlphaTesting = function () {
            return true;
        };
        FireMaterial.prototype.getAlphaTestTexture = function () {
            return null;
        };
        // Methods   
        FireMaterial.prototype.isReadyForSubMesh = function (mesh, subMesh, useInstances) {
            if (this.isFrozen) {
                if (this._wasPreviouslyReady && subMesh.effect) {
                    return true;
                }
            }
            if (!subMesh._materialDefines) {
                subMesh._materialDefines = new FireMaterialDefines();
            }
            var defines = subMesh._materialDefines;
            var scene = this.getScene();
            if (!this.checkReadyOnEveryCall && subMesh.effect) {
                if (this._renderId === scene.getRenderId()) {
                    return true;
                }
            }
            var engine = scene.getEngine();
            // Textures
            if (defines._areTexturesDirty) {
                defines._needUVs = false;
                if (this._diffuseTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                    if (!this._diffuseTexture.isReady()) {
                        return false;
                    }
                    else {
                        defines._needUVs = true;
                        defines.DIFFUSE = true;
                    }
                }
            }
            // Misc.
            if (defines._areMiscDirty) {
                defines.POINTSIZE = (this.pointsCloud || scene.forcePointsCloud);
                defines.FOG = (scene.fogEnabled && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE && this.fogEnabled);
            }
            // Values that need to be evaluated on every frame
            BABYLON.MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances);
            // Attribs
            BABYLON.MaterialHelper.PrepareDefinesForAttributes(mesh, defines, false, true);
            // Get correct effect      
            if (defines.isDirty) {
                defines.markAsProcessed();
                scene.resetCachedMaterial();
                // Fallbacks
                var fallbacks = new BABYLON.EffectFallbacks();
                if (defines.FOG) {
                    fallbacks.addFallback(1, "FOG");
                }
                if (defines.NUM_BONE_INFLUENCERS > 0) {
                    fallbacks.addCPUSkinningFallback(0, mesh);
                }
                //Attributes
                var attribs = [BABYLON.VertexBuffer.PositionKind];
                if (defines.UV1) {
                    attribs.push(BABYLON.VertexBuffer.UVKind);
                }
                if (defines.VERTEXCOLOR) {
                    attribs.push(BABYLON.VertexBuffer.ColorKind);
                }
                BABYLON.MaterialHelper.PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
                BABYLON.MaterialHelper.PrepareAttributesForInstances(attribs, defines);
                // Legacy browser patch
                var shaderName = "fire";
                var join = defines.toString();
                subMesh.setEffect(scene.getEngine().createEffect(shaderName, {
                    attributes: attribs,
                    uniformsNames: ["world", "view", "viewProjection", "vEyePosition",
                        "vFogInfos", "vFogColor", "pointSize",
                        "vDiffuseInfos",
                        "mBones",
                        "vClipPlane", "diffuseMatrix",
                        // Fire
                        "time", "speed"
                    ],
                    uniformBuffersNames: [],
                    samplers: ["diffuseSampler",
                        // Fire
                        "distortionSampler", "opacitySampler"
                    ],
                    defines: join,
                    fallbacks: fallbacks,
                    onCompiled: this.onCompiled,
                    onError: this.onError
                }, engine), defines);
            }
            if (!subMesh.effect.isReady()) {
                return false;
            }
            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;
            return true;
        };
        FireMaterial.prototype.bindForSubMesh = function (world, mesh, subMesh) {
            var scene = this.getScene();
            var defines = subMesh._materialDefines;
            if (!defines) {
                return;
            }
            var effect = subMesh.effect;
            this._activeEffect = effect;
            // Matrices
            this.bindOnlyWorldMatrix(world);
            this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());
            // Bones
            BABYLON.MaterialHelper.BindBonesParameters(mesh, this._activeEffect);
            if (this._mustRebind(scene, effect)) {
                // Textures        
                if (this._diffuseTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                    this._activeEffect.setTexture("diffuseSampler", this._diffuseTexture);
                    this._activeEffect.setFloat2("vDiffuseInfos", this._diffuseTexture.coordinatesIndex, this._diffuseTexture.level);
                    this._activeEffect.setMatrix("diffuseMatrix", this._diffuseTexture.getTextureMatrix());
                    this._activeEffect.setTexture("distortionSampler", this._distortionTexture);
                    this._activeEffect.setTexture("opacitySampler", this._opacityTexture);
                }
                // Clip plane
                if (scene.clipPlane) {
                    var clipPlane = scene.clipPlane;
                    this._activeEffect.setFloat4("vClipPlane", clipPlane.normal.x, clipPlane.normal.y, clipPlane.normal.z, clipPlane.d);
                }
                // Point size
                if (this.pointsCloud) {
                    this._activeEffect.setFloat("pointSize", this.pointSize);
                }
                this._activeEffect.setVector3("vEyePosition", scene._mirroredCameraPosition ? scene._mirroredCameraPosition : scene.activeCamera.position);
            }
            this._activeEffect.setColor4("vDiffuseColor", this._scaledDiffuse, this.alpha * mesh.visibility);
            // View
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE) {
                this._activeEffect.setMatrix("view", scene.getViewMatrix());
            }
            // Fog
            BABYLON.MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect);
            // Time
            this._lastTime += scene.getEngine().getDeltaTime();
            this._activeEffect.setFloat("time", this._lastTime);
            // Speed
            this._activeEffect.setFloat("speed", this.speed);
            this._afterBind(mesh, this._activeEffect);
        };
        FireMaterial.prototype.getAnimatables = function () {
            var results = [];
            if (this._diffuseTexture && this._diffuseTexture.animations && this._diffuseTexture.animations.length > 0) {
                results.push(this._diffuseTexture);
            }
            if (this._distortionTexture && this._distortionTexture.animations && this._distortionTexture.animations.length > 0) {
                results.push(this._distortionTexture);
            }
            if (this._opacityTexture && this._opacityTexture.animations && this._opacityTexture.animations.length > 0) {
                results.push(this._opacityTexture);
            }
            return results;
        };
        FireMaterial.prototype.getActiveTextures = function () {
            var activeTextures = _super.prototype.getActiveTextures.call(this);
            if (this._diffuseTexture) {
                activeTextures.push(this._diffuseTexture);
            }
            if (this._distortionTexture) {
                activeTextures.push(this._distortionTexture);
            }
            if (this._opacityTexture) {
                activeTextures.push(this._opacityTexture);
            }
            return activeTextures;
        };
        FireMaterial.prototype.hasTexture = function (texture) {
            if (_super.prototype.hasTexture.call(this, texture)) {
                return true;
            }
            if (this._diffuseTexture === texture) {
                return true;
            }
            if (this._distortionTexture === texture) {
                return true;
            }
            if (this._opacityTexture === texture) {
                return true;
            }
            return false;
        };
        FireMaterial.prototype.getClassName = function () {
            return "FireMaterial";
        };
        FireMaterial.prototype.dispose = function (forceDisposeEffect) {
            if (this._diffuseTexture) {
                this._diffuseTexture.dispose();
            }
            if (this._distortionTexture) {
                this._distortionTexture.dispose();
            }
            _super.prototype.dispose.call(this, forceDisposeEffect);
        };
        FireMaterial.prototype.clone = function (name) {
            var _this = this;
            return BABYLON.SerializationHelper.Clone(function () { return new FireMaterial(name, _this.getScene()); }, this);
        };
        FireMaterial.prototype.serialize = function () {
            var serializationObject = _super.prototype.serialize.call(this);
            serializationObject.customType = "BABYLON.FireMaterial";
            serializationObject.diffuseColor = this.diffuseColor.asArray();
            serializationObject.speed = this.speed;
            if (this._diffuseTexture) {
                serializationObject._diffuseTexture = this._diffuseTexture.serialize();
            }
            if (this._distortionTexture) {
                serializationObject._distortionTexture = this._distortionTexture.serialize();
            }
            if (this._opacityTexture) {
                serializationObject._opacityTexture = this._opacityTexture.serialize();
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
            if (source._diffuseTexture) {
                material._diffuseTexture = BABYLON.Texture.Parse(source._diffuseTexture, scene, rootUrl);
            }
            if (source._distortionTexture) {
                material._distortionTexture = BABYLON.Texture.Parse(source._distortionTexture, scene, rootUrl);
            }
            if (source._opacityTexture) {
                material._opacityTexture = BABYLON.Texture.Parse(source._opacityTexture, scene, rootUrl);
            }
            if (source.checkReadyOnlyOnce) {
                material.checkReadyOnlyOnce = source.checkReadyOnlyOnce;
            }
            return material;
        };
        __decorate([
            BABYLON.serializeAsTexture("diffuseTexture")
        ], FireMaterial.prototype, "_diffuseTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], FireMaterial.prototype, "diffuseTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture("distortionTexture")
        ], FireMaterial.prototype, "_distortionTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], FireMaterial.prototype, "distortionTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture("opacityTexture")
        ], FireMaterial.prototype, "_opacityTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], FireMaterial.prototype, "opacityTexture", void 0);
        __decorate([
            BABYLON.serialize("diffuseColor")
        ], FireMaterial.prototype, "diffuseColor", void 0);
        __decorate([
            BABYLON.serialize()
        ], FireMaterial.prototype, "speed", void 0);
        return FireMaterial;
    }(BABYLON.PushMaterial));
    BABYLON.FireMaterial = FireMaterial;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.fireMaterial.js.map

BABYLON.Effect.ShadersStore['fireVertexShader'] = "precision highp float;\n\nattribute vec3 position;\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\nuniform mat4 view;\nuniform mat4 viewProjection;\n#ifdef DIFFUSE\nvarying vec2 vDiffuseUV;\n#endif\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n\nuniform float time;\nuniform float speed;\n#ifdef DIFFUSE\nvarying vec2 vDistortionCoords1;\nvarying vec2 vDistortionCoords2;\nvarying vec2 vDistortionCoords3;\n#endif\nvoid main(void) {\n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(position,1.0);\nvec4 worldPos=finalWorld*vec4(position,1.0);\nvPositionW=vec3(worldPos);\n\n#ifdef DIFFUSE\nvDiffuseUV=uv;\nvDiffuseUV.y-=0.2;\n#endif\n\n#include<clipPlaneVertex>\n\n#include<fogVertex>\n\n#ifdef VERTEXCOLOR\nvColor=color;\n#endif\n\n#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif\n#ifdef DIFFUSE\n\nvec3 layerSpeed=vec3(-0.2,-0.52,-0.1)*speed;\nvDistortionCoords1.x=uv.x;\nvDistortionCoords1.y=uv.y+layerSpeed.x*time/1000.0;\nvDistortionCoords2.x=uv.x;\nvDistortionCoords2.y=uv.y+layerSpeed.y*time/1000.0;\nvDistortionCoords3.x=uv.x;\nvDistortionCoords3.y=uv.y+layerSpeed.z*time/1000.0;\n#endif\n}\n";
BABYLON.Effect.ShadersStore['firePixelShader'] = "precision highp float;\n\nuniform vec3 vEyePosition;\n\nvarying vec3 vPositionW;\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n#ifdef DIFFUSE\nvarying vec2 vDiffuseUV;\nuniform sampler2D diffuseSampler;\nuniform vec2 vDiffuseInfos;\n#endif\n\nuniform sampler2D distortionSampler;\nuniform sampler2D opacitySampler;\n#ifdef DIFFUSE\nvarying vec2 vDistortionCoords1;\nvarying vec2 vDistortionCoords2;\nvarying vec2 vDistortionCoords3;\n#endif\n#include<clipPlaneFragmentDeclaration>\n\n#include<fogFragmentDeclaration>\nvec4 bx2(vec4 x)\n{\nreturn vec4(2.0)*x-vec4(1.0);\n}\nvoid main(void) {\n\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\nvec4 baseColor=vec4(1.,1.,1.,1.);\n\nfloat alpha=1.0;\n#ifdef DIFFUSE\n\nconst float distortionAmount0=0.092;\nconst float distortionAmount1=0.092;\nconst float distortionAmount2=0.092;\nvec2 heightAttenuation=vec2(0.3,0.39);\nvec4 noise0=texture2D(distortionSampler,vDistortionCoords1);\nvec4 noise1=texture2D(distortionSampler,vDistortionCoords2);\nvec4 noise2=texture2D(distortionSampler,vDistortionCoords3);\nvec4 noiseSum=bx2(noise0)*distortionAmount0+bx2(noise1)*distortionAmount1+bx2(noise2)*distortionAmount2;\nvec4 perturbedBaseCoords=vec4(vDiffuseUV,0.0,1.0)+noiseSum*(vDiffuseUV.y*heightAttenuation.x+heightAttenuation.y);\nvec4 opacityColor=texture2D(opacitySampler,perturbedBaseCoords.xy);\n#ifdef ALPHATEST\nif (opacityColor.r<0.1)\ndiscard;\n#endif\n#include<depthPrePass>\nbaseColor=texture2D(diffuseSampler,perturbedBaseCoords.xy)*2.0;\nbaseColor*=opacityColor;\nbaseColor.rgb*=vDiffuseInfos.y;\n#endif\n#ifdef VERTEXCOLOR\nbaseColor.rgb*=vColor.rgb;\n#endif\n\nvec3 diffuseBase=vec3(1.0,1.0,1.0);\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\n\nvec4 color=vec4(baseColor.rgb,alpha);\n#include<fogFragment>\ngl_FragColor=color;\n}";
