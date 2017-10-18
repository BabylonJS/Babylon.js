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
    var TerrainMaterialDefines = /** @class */ (function (_super) {
        __extends(TerrainMaterialDefines, _super);
        function TerrainMaterialDefines() {
            var _this = _super.call(this) || this;
            _this.DIFFUSE = false;
            _this.BUMP = false;
            _this.CLIPPLANE = false;
            _this.ALPHATEST = false;
            _this.DEPTHPREPASS = false;
            _this.POINTSIZE = false;
            _this.FOG = false;
            _this.SPECULARTERM = false;
            _this.NORMAL = false;
            _this.UV1 = false;
            _this.UV2 = false;
            _this.VERTEXCOLOR = false;
            _this.VERTEXALPHA = false;
            _this.NUM_BONE_INFLUENCERS = 0;
            _this.BonesPerMesh = 0;
            _this.INSTANCES = false;
            _this.rebuild();
            return _this;
        }
        return TerrainMaterialDefines;
    }(BABYLON.MaterialDefines));
    var TerrainMaterial = /** @class */ (function (_super) {
        __extends(TerrainMaterial, _super);
        function TerrainMaterial(name, scene) {
            var _this = _super.call(this, name, scene) || this;
            _this.diffuseColor = new BABYLON.Color3(1, 1, 1);
            _this.specularColor = new BABYLON.Color3(0, 0, 0);
            _this.specularPower = 64;
            _this._disableLighting = false;
            _this._maxSimultaneousLights = 4;
            return _this;
        }
        TerrainMaterial.prototype.needAlphaBlending = function () {
            return (this.alpha < 1.0);
        };
        TerrainMaterial.prototype.needAlphaTesting = function () {
            return false;
        };
        TerrainMaterial.prototype.getAlphaTestTexture = function () {
            return null;
        };
        // Methods   
        TerrainMaterial.prototype.isReadyForSubMesh = function (mesh, subMesh, useInstances) {
            if (this.isFrozen) {
                if (this._wasPreviouslyReady && subMesh.effect) {
                    return true;
                }
            }
            if (!subMesh._materialDefines) {
                subMesh._materialDefines = new TerrainMaterialDefines();
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
            if (scene.texturesEnabled) {
                if (this.mixTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                    if (!this.mixTexture.isReady()) {
                        return false;
                    }
                    else {
                        defines._needUVs = true;
                        defines.DIFFUSE = true;
                    }
                }
                if ((this.bumpTexture1 || this.bumpTexture2 || this.bumpTexture3) && BABYLON.StandardMaterial.BumpTextureEnabled) {
                    defines._needUVs = true;
                    defines._needNormals = true;
                    defines.BUMP = true;
                }
            }
            // Misc.
            BABYLON.MaterialHelper.PrepareDefinesForMisc(mesh, scene, false, this.pointsCloud, this.fogEnabled, defines);
            // Lights
            defines._needNormals = BABYLON.MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, false, this._maxSimultaneousLights, this._disableLighting);
            // Values that need to be evaluated on every frame
            BABYLON.MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances);
            // Attribs
            BABYLON.MaterialHelper.PrepareDefinesForAttributes(mesh, defines, true, true);
            // Get correct effect      
            if (defines.isDirty) {
                defines.markAsProcessed();
                scene.resetCachedMaterial();
                // Fallbacks
                var fallbacks = new BABYLON.EffectFallbacks();
                if (defines.FOG) {
                    fallbacks.addFallback(1, "FOG");
                }
                BABYLON.MaterialHelper.HandleFallbacksForShadows(defines, fallbacks, this.maxSimultaneousLights);
                if (defines.NUM_BONE_INFLUENCERS > 0) {
                    fallbacks.addCPUSkinningFallback(0, mesh);
                }
                //Attributes
                var attribs = [BABYLON.VertexBuffer.PositionKind];
                if (defines.NORMAL) {
                    attribs.push(BABYLON.VertexBuffer.NormalKind);
                }
                if (defines.UV1) {
                    attribs.push(BABYLON.VertexBuffer.UVKind);
                }
                if (defines.UV2) {
                    attribs.push(BABYLON.VertexBuffer.UV2Kind);
                }
                if (defines.VERTEXCOLOR) {
                    attribs.push(BABYLON.VertexBuffer.ColorKind);
                }
                BABYLON.MaterialHelper.PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
                BABYLON.MaterialHelper.PrepareAttributesForInstances(attribs, defines);
                // Legacy browser patch
                var shaderName = "terrain";
                var join = defines.toString();
                var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vDiffuseColor", "vSpecularColor",
                    "vFogInfos", "vFogColor", "pointSize",
                    "vTextureInfos",
                    "mBones",
                    "vClipPlane", "textureMatrix",
                    "diffuse1Infos", "diffuse2Infos", "diffuse3Infos"
                ];
                var samplers = ["textureSampler", "diffuse1Sampler", "diffuse2Sampler", "diffuse3Sampler",
                    "bump1Sampler", "bump2Sampler", "bump3Sampler"
                ];
                var uniformBuffers = new Array();
                BABYLON.MaterialHelper.PrepareUniformsAndSamplersList({
                    uniformsNames: uniforms,
                    uniformBuffersNames: uniformBuffers,
                    samplers: samplers,
                    defines: defines,
                    maxSimultaneousLights: this.maxSimultaneousLights
                });
                subMesh.setEffect(scene.getEngine().createEffect(shaderName, {
                    attributes: attribs,
                    uniformsNames: uniforms,
                    uniformBuffersNames: uniformBuffers,
                    samplers: samplers,
                    defines: join,
                    fallbacks: fallbacks,
                    onCompiled: this.onCompiled,
                    onError: this.onError,
                    indexParameters: { maxSimultaneousLights: this.maxSimultaneousLights }
                }, engine), defines);
            }
            if (!subMesh.effect.isReady()) {
                return false;
            }
            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;
            return true;
        };
        TerrainMaterial.prototype.bindForSubMesh = function (world, mesh, subMesh) {
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
                if (this.mixTexture) {
                    this._activeEffect.setTexture("textureSampler", this._mixTexture);
                    this._activeEffect.setFloat2("vTextureInfos", this._mixTexture.coordinatesIndex, this._mixTexture.level);
                    this._activeEffect.setMatrix("textureMatrix", this._mixTexture.getTextureMatrix());
                    if (BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                        if (this._diffuseTexture1) {
                            this._activeEffect.setTexture("diffuse1Sampler", this._diffuseTexture1);
                            this._activeEffect.setFloat2("diffuse1Infos", this._diffuseTexture1.uScale, this._diffuseTexture1.vScale);
                        }
                        if (this._diffuseTexture2) {
                            this._activeEffect.setTexture("diffuse2Sampler", this._diffuseTexture2);
                            this._activeEffect.setFloat2("diffuse2Infos", this._diffuseTexture2.uScale, this._diffuseTexture2.vScale);
                        }
                        if (this._diffuseTexture3) {
                            this._activeEffect.setTexture("diffuse3Sampler", this._diffuseTexture3);
                            this._activeEffect.setFloat2("diffuse3Infos", this._diffuseTexture3.uScale, this._diffuseTexture3.vScale);
                        }
                    }
                    if (BABYLON.StandardMaterial.BumpTextureEnabled && scene.getEngine().getCaps().standardDerivatives) {
                        if (this._bumpTexture1) {
                            this._activeEffect.setTexture("bump1Sampler", this._bumpTexture1);
                        }
                        if (this._bumpTexture2) {
                            this._activeEffect.setTexture("bump2Sampler", this._bumpTexture2);
                        }
                        if (this._bumpTexture3) {
                            this._activeEffect.setTexture("bump3Sampler", this._bumpTexture3);
                        }
                    }
                }
                // Clip plane
                BABYLON.MaterialHelper.BindClipPlane(this._activeEffect, scene);
                // Point size
                if (this.pointsCloud) {
                    this._activeEffect.setFloat("pointSize", this.pointSize);
                }
                this._activeEffect.setVector3("vEyePosition", scene._mirroredCameraPosition ? scene._mirroredCameraPosition : scene.activeCamera.position);
            }
            this._activeEffect.setColor4("vDiffuseColor", this.diffuseColor, this.alpha * mesh.visibility);
            if (defines.SPECULARTERM) {
                this._activeEffect.setColor4("vSpecularColor", this.specularColor, this.specularPower);
            }
            if (scene.lightsEnabled && !this.disableLighting) {
                BABYLON.MaterialHelper.BindLights(scene, mesh, this._activeEffect, defines, this.maxSimultaneousLights);
            }
            // View
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE) {
                this._activeEffect.setMatrix("view", scene.getViewMatrix());
            }
            // Fog
            BABYLON.MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect);
            this._afterBind(mesh, this._activeEffect);
        };
        TerrainMaterial.prototype.getAnimatables = function () {
            var results = [];
            if (this.mixTexture && this.mixTexture.animations && this.mixTexture.animations.length > 0) {
                results.push(this.mixTexture);
            }
            return results;
        };
        TerrainMaterial.prototype.getActiveTextures = function () {
            var activeTextures = _super.prototype.getActiveTextures.call(this);
            if (this._mixTexture) {
                activeTextures.push(this._mixTexture);
            }
            if (this._diffuseTexture1) {
                activeTextures.push(this._diffuseTexture1);
            }
            if (this._diffuseTexture2) {
                activeTextures.push(this._diffuseTexture2);
            }
            if (this._diffuseTexture3) {
                activeTextures.push(this._diffuseTexture3);
            }
            if (this._bumpTexture1) {
                activeTextures.push(this._bumpTexture1);
            }
            if (this._bumpTexture2) {
                activeTextures.push(this._bumpTexture2);
            }
            if (this._bumpTexture3) {
                activeTextures.push(this._bumpTexture3);
            }
            return activeTextures;
        };
        TerrainMaterial.prototype.hasTexture = function (texture) {
            if (_super.prototype.hasTexture.call(this, texture)) {
                return true;
            }
            if (this._mixTexture === texture) {
                return true;
            }
            if (this._diffuseTexture1 === texture) {
                return true;
            }
            if (this._diffuseTexture2 === texture) {
                return true;
            }
            if (this._diffuseTexture3 === texture) {
                return true;
            }
            if (this._bumpTexture1 === texture) {
                return true;
            }
            if (this._bumpTexture2 === texture) {
                return true;
            }
            if (this._bumpTexture3 === texture) {
                return true;
            }
            return false;
        };
        TerrainMaterial.prototype.dispose = function (forceDisposeEffect) {
            if (this.mixTexture) {
                this.mixTexture.dispose();
            }
            _super.prototype.dispose.call(this, forceDisposeEffect);
        };
        TerrainMaterial.prototype.clone = function (name) {
            var _this = this;
            return BABYLON.SerializationHelper.Clone(function () { return new TerrainMaterial(name, _this.getScene()); }, this);
        };
        TerrainMaterial.prototype.serialize = function () {
            var serializationObject = BABYLON.SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.TerrainMaterial";
            return serializationObject;
        };
        TerrainMaterial.prototype.getClassName = function () {
            return "TerrainMaterial";
        };
        // Statics
        TerrainMaterial.Parse = function (source, scene, rootUrl) {
            return BABYLON.SerializationHelper.Parse(function () { return new TerrainMaterial(source.name, scene); }, source, scene, rootUrl);
        };
        __decorate([
            BABYLON.serializeAsTexture("mixTexture")
        ], TerrainMaterial.prototype, "_mixTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], TerrainMaterial.prototype, "mixTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture("diffuseTexture1")
        ], TerrainMaterial.prototype, "_diffuseTexture1", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], TerrainMaterial.prototype, "diffuseTexture1", void 0);
        __decorate([
            BABYLON.serializeAsTexture("diffuseTexture2")
        ], TerrainMaterial.prototype, "_diffuseTexture2", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], TerrainMaterial.prototype, "diffuseTexture2", void 0);
        __decorate([
            BABYLON.serializeAsTexture("diffuseTexture3")
        ], TerrainMaterial.prototype, "_diffuseTexture3", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], TerrainMaterial.prototype, "diffuseTexture3", void 0);
        __decorate([
            BABYLON.serializeAsTexture("bumpTexture1")
        ], TerrainMaterial.prototype, "_bumpTexture1", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], TerrainMaterial.prototype, "bumpTexture1", void 0);
        __decorate([
            BABYLON.serializeAsTexture("bumpTexture2")
        ], TerrainMaterial.prototype, "_bumpTexture2", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], TerrainMaterial.prototype, "bumpTexture2", void 0);
        __decorate([
            BABYLON.serializeAsTexture("bumpTexture3")
        ], TerrainMaterial.prototype, "_bumpTexture3", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], TerrainMaterial.prototype, "bumpTexture3", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], TerrainMaterial.prototype, "diffuseColor", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], TerrainMaterial.prototype, "specularColor", void 0);
        __decorate([
            BABYLON.serialize()
        ], TerrainMaterial.prototype, "specularPower", void 0);
        __decorate([
            BABYLON.serialize("disableLighting")
        ], TerrainMaterial.prototype, "_disableLighting", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], TerrainMaterial.prototype, "disableLighting", void 0);
        __decorate([
            BABYLON.serialize("maxSimultaneousLights")
        ], TerrainMaterial.prototype, "_maxSimultaneousLights", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], TerrainMaterial.prototype, "maxSimultaneousLights", void 0);
        return TerrainMaterial;
    }(BABYLON.PushMaterial));
    BABYLON.TerrainMaterial = TerrainMaterial;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.terrainMaterial.js.map

BABYLON.Effect.ShadersStore['terrainVertexShader'] = "precision highp float;\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\nuniform mat4 view;\nuniform mat4 viewProjection;\n#ifdef DIFFUSE\nvarying vec2 vTextureUV;\nuniform mat4 textureMatrix;\nuniform vec2 vTextureInfos;\n#endif\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\nvoid main(void) {\n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(position,1.0);\nvec4 worldPos=finalWorld*vec4(position,1.0);\nvPositionW=vec3(worldPos);\n#ifdef NORMAL\nvNormalW=normalize(vec3(finalWorld*vec4(normal,0.0)));\n#endif\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef DIFFUSE\nif (vTextureInfos.x == 0.)\n{\nvTextureUV=vec2(textureMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvTextureUV=vec2(textureMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n\n#ifdef CLIPPLANE\nfClipDistance=dot(worldPos,vClipPlane);\n#endif\n\n#include<fogVertex>\n\n#include<shadowsVertex>[0..maxSimultaneousLights]\n\n#ifdef VERTEXCOLOR\nvColor=color;\n#endif\n\n#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif\n}\n";
BABYLON.Effect.ShadersStore['terrainPixelShader'] = "precision highp float;\n\nuniform vec3 vEyePosition;\nuniform vec4 vDiffuseColor;\n#ifdef SPECULARTERM\nuniform vec4 vSpecularColor;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n#include<helperFunctions>\n\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n\n#ifdef DIFFUSE\nvarying vec2 vTextureUV;\nuniform sampler2D textureSampler;\nuniform vec2 vTextureInfos;\nuniform sampler2D diffuse1Sampler;\nuniform sampler2D diffuse2Sampler;\nuniform sampler2D diffuse3Sampler;\nuniform vec2 diffuse1Infos;\nuniform vec2 diffuse2Infos;\nuniform vec2 diffuse3Infos;\n#endif\n#ifdef BUMP\nuniform sampler2D bump1Sampler;\nuniform sampler2D bump2Sampler;\nuniform sampler2D bump3Sampler;\n#endif\n\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n#include<clipPlaneFragmentDeclaration>\n\n#include<fogFragmentDeclaration>\n\n#ifdef BUMP\n#extension GL_OES_standard_derivatives : enable\n\nmat3 cotangent_frame(vec3 normal,vec3 p,vec2 uv)\n{\n\nvec3 dp1=dFdx(p);\nvec3 dp2=dFdy(p);\nvec2 duv1=dFdx(uv);\nvec2 duv2=dFdy(uv);\n\nvec3 dp2perp=cross(dp2,normal);\nvec3 dp1perp=cross(normal,dp1);\nvec3 tangent=dp2perp*duv1.x+dp1perp*duv2.x;\nvec3 binormal=dp2perp*duv1.y+dp1perp*duv2.y;\n\nfloat invmax=inversesqrt(max(dot(tangent,tangent),dot(binormal,binormal)));\nreturn mat3(tangent*invmax,binormal*invmax,normal);\n}\nvec3 perturbNormal(vec3 viewDir,vec3 mixColor)\n{ \nvec3 bump1Color=texture2D(bump1Sampler,vTextureUV*diffuse1Infos).xyz;\nvec3 bump2Color=texture2D(bump2Sampler,vTextureUV*diffuse2Infos).xyz;\nvec3 bump3Color=texture2D(bump3Sampler,vTextureUV*diffuse3Infos).xyz;\nbump1Color.rgb*=mixColor.r;\nbump2Color.rgb=mix(bump1Color.rgb,bump2Color.rgb,mixColor.g);\nvec3 map=mix(bump2Color.rgb,bump3Color.rgb,mixColor.b);\nmap=map*255./127.-128./127.;\nmat3 TBN=cotangent_frame(vNormalW*vTextureInfos.y,-viewDir,vTextureUV);\nreturn normalize(TBN*map);\n}\n#endif\nvoid main(void) {\n\n#ifdef CLIPPLANE\nif (fClipDistance>0.0)\ndiscard;\n#endif\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\nvec4 baseColor=vec4(1.,1.,1.,1.);\nvec3 diffuseColor=vDiffuseColor.rgb;\n#ifdef SPECULARTERM\nfloat glossiness=vSpecularColor.a;\nvec3 specularColor=vSpecularColor.rgb;\n#else\nfloat glossiness=0.;\n#endif\n\nfloat alpha=vDiffuseColor.a;\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=vec3(1.0,1.0,1.0);\n#endif\n#ifdef DIFFUSE\nbaseColor=texture2D(textureSampler,vTextureUV);\n#if defined(BUMP) && defined(DIFFUSE)\nnormalW=perturbNormal(viewDirectionW,baseColor.rgb);\n#endif\n#ifdef ALPHATEST\nif (baseColor.a<0.4)\ndiscard;\n#endif\n#include<depthPrePass>\nbaseColor.rgb*=vTextureInfos.y;\nvec4 diffuse1Color=texture2D(diffuse1Sampler,vTextureUV*diffuse1Infos);\nvec4 diffuse2Color=texture2D(diffuse2Sampler,vTextureUV*diffuse2Infos);\nvec4 diffuse3Color=texture2D(diffuse3Sampler,vTextureUV*diffuse3Infos);\ndiffuse1Color.rgb*=baseColor.r;\ndiffuse2Color.rgb=mix(diffuse1Color.rgb,diffuse2Color.rgb,baseColor.g);\nbaseColor.rgb=mix(diffuse2Color.rgb,diffuse3Color.rgb,baseColor.b);\n#endif\n#ifdef VERTEXCOLOR\nbaseColor.rgb*=vColor.rgb;\n#endif\n\nvec3 diffuseBase=vec3(0.,0.,0.);\nlightingInfo info;\nfloat shadow=1.;\n#ifdef SPECULARTERM\nvec3 specularBase=vec3(0.,0.,0.);\n#endif\n#include<lightFragment>[0..maxSimultaneousLights]\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\n#ifdef SPECULARTERM\nvec3 finalSpecular=specularBase*specularColor;\n#else\nvec3 finalSpecular=vec3(0.0);\n#endif\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor*baseColor.rgb,0.0,1.0);\n\nvec4 color=vec4(finalDiffuse+finalSpecular,alpha);\n#include<fogFragment>\ngl_FragColor=color;\n}\n";
