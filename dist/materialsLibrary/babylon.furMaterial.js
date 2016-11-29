/// <reference path="../../../dist/preview release/babylon.d.ts"/>

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var maxSimultaneousLights = 4;
    var FurMaterialDefines = (function (_super) {
        __extends(FurMaterialDefines, _super);
        function FurMaterialDefines() {
            _super.call(this);
            this.DIFFUSE = false;
            this.HEIGHTMAP = false;
            this.CLIPPLANE = false;
            this.ALPHATEST = false;
            this.POINTSIZE = false;
            this.FOG = false;
            this.NORMAL = false;
            this.UV1 = false;
            this.UV2 = false;
            this.VERTEXCOLOR = false;
            this.VERTEXALPHA = false;
            this.NUM_BONE_INFLUENCERS = 0;
            this.BonesPerMesh = 0;
            this.INSTANCES = false;
            this.HIGHLEVEL = false;
            this.rebuild();
        }
        return FurMaterialDefines;
    }(BABYLON.MaterialDefines));
    var FurMaterial = (function (_super) {
        __extends(FurMaterial, _super);
        function FurMaterial(name, scene) {
            _super.call(this, name, scene);
            this.diffuseColor = new BABYLON.Color3(1, 1, 1);
            this.furLength = 1;
            this.furAngle = 0;
            this.furColor = new BABYLON.Color3(0.44, 0.21, 0.02);
            this.furOffset = 0.0;
            this.furSpacing = 12;
            this.furGravity = new BABYLON.Vector3(0, 0, 0);
            this.furSpeed = 100;
            this.furDensity = 20;
            this.disableLighting = false;
            this.highLevelFur = true;
            this.maxSimultaneousLights = 4;
            this._worldViewProjectionMatrix = BABYLON.Matrix.Zero();
            this._furTime = 0;
            this._defines = new FurMaterialDefines();
            this._cachedDefines = new FurMaterialDefines();
            this._cachedDefines.BonesPerMesh = -1;
        }
        Object.defineProperty(FurMaterial.prototype, "furTime", {
            get: function () {
                return this._furTime;
            },
            set: function (furTime) {
                this._furTime = furTime;
            },
            enumerable: true,
            configurable: true
        });
        FurMaterial.prototype.needAlphaBlending = function () {
            return (this.alpha < 1.0);
        };
        FurMaterial.prototype.needAlphaTesting = function () {
            return false;
        };
        FurMaterial.prototype.getAlphaTestTexture = function () {
            return null;
        };
        FurMaterial.prototype.updateFur = function () {
            for (var i = 1; i < this._meshes.length; i++) {
                var offsetFur = this._meshes[i].material;
                offsetFur.furLength = this.furLength;
                offsetFur.furAngle = this.furAngle;
                offsetFur.furGravity = this.furGravity;
                offsetFur.furSpacing = this.furSpacing;
                offsetFur.furSpeed = this.furSpeed;
                offsetFur.furColor = this.furColor;
                offsetFur.diffuseTexture = this.diffuseTexture;
                offsetFur.furTexture = this.furTexture;
                offsetFur.highLevelFur = this.highLevelFur;
                offsetFur.furTime = this.furTime;
                offsetFur.furDensity = this.furDensity;
            }
        };
        // Methods   
        FurMaterial.prototype._checkCache = function (scene, mesh, useInstances) {
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
        FurMaterial.prototype.isReady = function (mesh, useInstances) {
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
                if (this.heightTexture) {
                    if (!this.heightTexture.isReady()) {
                        return false;
                    }
                    else {
                        needUVs = true;
                        this._defines.HEIGHTMAP = true;
                    }
                }
            }
            // Effect
            if (scene.clipPlane) {
                this._defines.CLIPPLANE = true;
            }
            if (engine.getAlphaTesting()) {
                this._defines.ALPHATEST = true;
            }
            // Point size
            if (this.pointsCloud || scene.forcePointsCloud) {
                this._defines.POINTSIZE = true;
            }
            // Fog
            if (scene.fogEnabled && mesh && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE && this.fogEnabled) {
                this._defines.FOG = true;
            }
            // High level
            if (this.highLevelFur) {
                this._defines.HIGHLEVEL = true;
            }
            // Lights
            if (scene.lightsEnabled && !this.disableLighting) {
                needNormals = BABYLON.MaterialHelper.PrepareDefinesForLights(scene, mesh, this._defines, this.maxSimultaneousLights);
            }
            // Attribs
            if (mesh) {
                if (needNormals && mesh.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)) {
                    this._defines.NORMAL = true;
                }
                if (needUVs) {
                    if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.UVKind)) {
                        this._defines.UV1 = true;
                    }
                    if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.UV2Kind)) {
                        this._defines.UV2 = true;
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
                BABYLON.MaterialHelper.HandleFallbacksForShadows(this._defines, fallbacks, this.maxSimultaneousLights);
                if (this._defines.NUM_BONE_INFLUENCERS > 0) {
                    fallbacks.addCPUSkinningFallback(0, mesh);
                }
                //Attributes
                var attribs = [BABYLON.VertexBuffer.PositionKind];
                if (this._defines.NORMAL) {
                    attribs.push(BABYLON.VertexBuffer.NormalKind);
                }
                if (this._defines.UV1) {
                    attribs.push(BABYLON.VertexBuffer.UVKind);
                }
                if (this._defines.UV2) {
                    attribs.push(BABYLON.VertexBuffer.UV2Kind);
                }
                if (this._defines.VERTEXCOLOR) {
                    attribs.push(BABYLON.VertexBuffer.ColorKind);
                }
                BABYLON.MaterialHelper.PrepareAttributesForBones(attribs, mesh, this._defines, fallbacks);
                BABYLON.MaterialHelper.PrepareAttributesForInstances(attribs, this._defines);
                // Legacy browser patch
                var shaderName = "fur";
                var join = this._defines.toString();
                var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vDiffuseColor",
                    "vFogInfos", "vFogColor", "pointSize",
                    "vDiffuseInfos",
                    "mBones",
                    "vClipPlane", "diffuseMatrix",
                    "furLength", "furAngle", "furColor", "furOffset", "furGravity", "furTime", "furSpacing", "furDensity"
                ];
                var samplers = ["diffuseSampler",
                    "heightTexture", "furTexture"
                ];
                BABYLON.MaterialHelper.PrepareUniformsAndSamplersList(uniforms, samplers, this._defines, this.maxSimultaneousLights);
                this._effect = scene.getEngine().createEffect(shaderName, attribs, uniforms, samplers, join, fallbacks, this.onCompiled, this.onError, { maxSimultaneousLights: this.maxSimultaneousLights });
            }
            if (!this._effect.isReady()) {
                return false;
            }
            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;
            if (mesh) {
                if (!mesh._materialDefines) {
                    mesh._materialDefines = new FurMaterialDefines();
                }
                this._defines.cloneTo(mesh._materialDefines);
            }
            return true;
        };
        FurMaterial.prototype.bindOnlyWorldMatrix = function (world) {
            this._effect.setMatrix("world", world);
        };
        FurMaterial.prototype.bind = function (world, mesh) {
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
                }
                if (this.heightTexture) {
                    this._effect.setTexture("heightTexture", this.heightTexture);
                }
                // Clip plane
                BABYLON.MaterialHelper.BindClipPlane(this._effect, scene);
                // Point size
                if (this.pointsCloud) {
                    this._effect.setFloat("pointSize", this.pointSize);
                }
                this._effect.setVector3("vEyePosition", scene._mirroredCameraPosition ? scene._mirroredCameraPosition : scene.activeCamera.position);
            }
            this._effect.setColor4("vDiffuseColor", this.diffuseColor, this.alpha * mesh.visibility);
            if (scene.lightsEnabled && !this.disableLighting) {
                BABYLON.MaterialHelper.BindLights(scene, mesh, this._effect, this._defines, this.maxSimultaneousLights);
            }
            // View
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE) {
                this._effect.setMatrix("view", scene.getViewMatrix());
            }
            // Fog
            BABYLON.MaterialHelper.BindFogParameters(scene, mesh, this._effect);
            this._effect.setFloat("furLength", this.furLength);
            this._effect.setFloat("furAngle", this.furAngle);
            this._effect.setColor4("furColor", this.furColor, 1.0);
            if (this.highLevelFur) {
                this._effect.setVector3("furGravity", this.furGravity);
                this._effect.setFloat("furOffset", this.furOffset);
                this._effect.setFloat("furSpacing", this.furSpacing);
                this._effect.setFloat("furDensity", this.furDensity);
                this._furTime += this.getScene().getEngine().getDeltaTime() / this.furSpeed;
                this._effect.setFloat("furTime", this._furTime);
                this._effect.setTexture("furTexture", this.furTexture);
            }
            _super.prototype.bind.call(this, world, mesh);
        };
        FurMaterial.prototype.getAnimatables = function () {
            var results = [];
            if (this.diffuseTexture && this.diffuseTexture.animations && this.diffuseTexture.animations.length > 0) {
                results.push(this.diffuseTexture);
            }
            if (this.heightTexture && this.heightTexture.animations && this.heightTexture.animations.length > 0) {
                results.push(this.heightTexture);
            }
            return results;
        };
        FurMaterial.prototype.dispose = function (forceDisposeEffect) {
            if (this.diffuseTexture) {
                this.diffuseTexture.dispose();
            }
            if (this._meshes) {
                for (var i = 1; i < this._meshes.length; i++) {
                    this._meshes[i].material.dispose(forceDisposeEffect);
                    this._meshes[i].dispose();
                }
            }
            _super.prototype.dispose.call(this, forceDisposeEffect);
        };
        FurMaterial.prototype.clone = function (name) {
            var _this = this;
            return BABYLON.SerializationHelper.Clone(function () { return new FurMaterial(name, _this.getScene()); }, this);
        };
        FurMaterial.prototype.serialize = function () {
            var serializationObject = BABYLON.SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.FurMaterial";
            if (this._meshes) {
                serializationObject.sourceMeshName = this._meshes[0].name;
                serializationObject.quality = this._meshes.length;
            }
            return serializationObject;
        };
        // Statics
        FurMaterial.Parse = function (source, scene, rootUrl) {
            var material = BABYLON.SerializationHelper.Parse(function () { return new FurMaterial(source.name, scene); }, source, scene, rootUrl);
            if (source.sourceMeshName && material.highLevelFur) {
                scene.executeWhenReady(function () {
                    var sourceMesh = scene.getMeshByName(source.sourceMeshName);
                    if (sourceMesh) {
                        var furTexture = FurMaterial.GenerateTexture("Fur Texture", scene);
                        material.furTexture = furTexture;
                        FurMaterial.FurifyMesh(sourceMesh, source.quality);
                    }
                });
            }
            return material;
        };
        FurMaterial.GenerateTexture = function (name, scene) {
            // Generate fur textures
            var texture = new BABYLON.DynamicTexture("FurTexture " + name, 256, scene, true);
            var context = texture.getContext();
            for (var i = 0; i < 20000; ++i) {
                context.fillStyle = "rgba(255, " + Math.floor(Math.random() * 255) + ", " + Math.floor(Math.random() * 255) + ", 1)";
                context.fillRect((Math.random() * texture.getSize().width), (Math.random() * texture.getSize().height), 2, 2);
            }
            texture.update(false);
            texture.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
            texture.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
            return texture;
        };
        // Creates and returns an array of meshes used as shells for the Fur Material
        // that can be disposed later in your code
        // The quality is in interval [0, 100]
        FurMaterial.FurifyMesh = function (sourceMesh, quality) {
            var meshes = [sourceMesh];
            var mat = sourceMesh.material;
            var i;
            if (!(mat instanceof FurMaterial)) {
                throw "The material of the source mesh must be a Fur Material";
            }
            for (i = 1; i < quality; i++) {
                var offsetFur = new BABYLON.FurMaterial(mat.name + i, sourceMesh.getScene());
                sourceMesh.getScene().materials.pop();
                BABYLON.Tags.EnableFor(offsetFur);
                BABYLON.Tags.AddTagsTo(offsetFur, "furShellMaterial");
                offsetFur.furLength = mat.furLength;
                offsetFur.furAngle = mat.furAngle;
                offsetFur.furGravity = mat.furGravity;
                offsetFur.furSpacing = mat.furSpacing;
                offsetFur.furSpeed = mat.furSpeed;
                offsetFur.furColor = mat.furColor;
                offsetFur.diffuseTexture = mat.diffuseTexture;
                offsetFur.furOffset = i / quality;
                offsetFur.furTexture = mat.furTexture;
                offsetFur.highLevelFur = mat.highLevelFur;
                offsetFur.furTime = mat.furTime;
                offsetFur.furDensity = mat.furDensity;
                var offsetMesh = sourceMesh.clone(sourceMesh.name + i);
                offsetMesh.material = offsetFur;
                offsetMesh.skeleton = sourceMesh.skeleton;
                offsetMesh.position = BABYLON.Vector3.Zero();
                meshes.push(offsetMesh);
            }
            for (i = 1; i < meshes.length; i++) {
                meshes[i].parent = sourceMesh;
            }
            sourceMesh.material._meshes = meshes;
            return meshes;
        };
        __decorate([
            BABYLON.serializeAsTexture()
        ], FurMaterial.prototype, "diffuseTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], FurMaterial.prototype, "heightTexture", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], FurMaterial.prototype, "diffuseColor", void 0);
        __decorate([
            BABYLON.serialize()
        ], FurMaterial.prototype, "furLength", void 0);
        __decorate([
            BABYLON.serialize()
        ], FurMaterial.prototype, "furAngle", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], FurMaterial.prototype, "furColor", void 0);
        __decorate([
            BABYLON.serialize()
        ], FurMaterial.prototype, "furOffset", void 0);
        __decorate([
            BABYLON.serialize()
        ], FurMaterial.prototype, "furSpacing", void 0);
        __decorate([
            BABYLON.serializeAsVector3()
        ], FurMaterial.prototype, "furGravity", void 0);
        __decorate([
            BABYLON.serialize()
        ], FurMaterial.prototype, "furSpeed", void 0);
        __decorate([
            BABYLON.serialize()
        ], FurMaterial.prototype, "furDensity", void 0);
        __decorate([
            BABYLON.serialize()
        ], FurMaterial.prototype, "disableLighting", void 0);
        __decorate([
            BABYLON.serialize()
        ], FurMaterial.prototype, "highLevelFur", void 0);
        __decorate([
            BABYLON.serialize()
        ], FurMaterial.prototype, "maxSimultaneousLights", void 0);
        __decorate([
            BABYLON.serialize()
        ], FurMaterial.prototype, "furTime", null);
        return FurMaterial;
    }(BABYLON.Material));
    BABYLON.FurMaterial = FurMaterial;
})(BABYLON || (BABYLON = {}));

BABYLON.Effect.ShadersStore['furVertexShader'] = "precision highp float;\n\nattribute vec3 position;\nattribute vec3 normal;\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<bonesDeclaration>\n\nuniform float furLength;\nuniform float furAngle;\n#ifdef HIGHLEVEL\nuniform float furOffset;\nuniform vec3 furGravity;\nuniform float furTime;\nuniform float furSpacing;\nuniform float furDensity;\n#endif\n#ifdef HEIGHTMAP\nuniform sampler2D heightTexture;\n#endif\n#ifdef HIGHLEVEL\nvarying vec2 vFurUV;\n#endif\n#include<instancesDeclaration>\nuniform mat4 view;\nuniform mat4 viewProjection;\n#ifdef DIFFUSE\nvarying vec2 vDiffuseUV;\nuniform mat4 diffuseMatrix;\nuniform vec2 vDiffuseInfos;\n#endif\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\nvarying float vfur_length;\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<shadowsVertexDeclaration>[0..maxSimultaneousLights]\nfloat Rand(vec3 rv) {\nfloat x=dot(rv,vec3(12.9898,78.233,24.65487));\nreturn fract(sin(x)*43758.5453);\n}\nvoid main(void) {\n#include<instancesVertex>\n#include<bonesVertex>\n\nfloat r=Rand(position);\n#ifdef HEIGHTMAP \nvfur_length=furLength*texture2D(heightTexture,uv).rgb.x;\n#else \nvfur_length=(furLength*r);\n#endif\nvec3 tangent1=vec3(normal.y,-normal.x,0);\nvec3 tangent2=vec3(-normal.z,0,normal.x);\nr=Rand(tangent1*r);\nfloat J=(2.0+4.0*r);\nr=Rand(tangent2*r);\nfloat K=(2.0+2.0*r);\ntangent1=tangent1*J+tangent2*K;\ntangent1=normalize(tangent1);\nvec3 newPosition=position+normal*vfur_length*cos(furAngle)+tangent1*vfur_length*sin(furAngle);\n#ifdef HIGHLEVEL\n\nvec3 forceDirection=vec3(0.0,0.0,0.0);\nforceDirection.x=sin(furTime+position.x*0.05)*0.2;\nforceDirection.y=cos(furTime*0.7+position.y*0.04)*0.2;\nforceDirection.z=sin(furTime*0.7+position.z*0.04)*0.2;\nvec3 displacement=vec3(0.0,0.0,0.0);\ndisplacement=furGravity+forceDirection;\nfloat displacementFactor=pow(furOffset,3.0);\nvec3 aNormal=normal;\naNormal.xyz+=displacement*displacementFactor;\nnewPosition=vec3(newPosition.x,newPosition.y,newPosition.z)+(normalize(aNormal)*furOffset*furSpacing);\n#endif\n#ifdef NORMAL\n#ifdef HIGHLEVEL\nvNormalW=normalize(vec3(finalWorld*vec4(normal,0.0))*aNormal);\n#else\nvNormalW=normalize(vec3(finalWorld*vec4(normal,0.0)));\n#endif\n#endif\n\ngl_Position=viewProjection*finalWorld*vec4(newPosition,1.0);\nvec4 worldPos=finalWorld*vec4(newPosition,1.0);\nvPositionW=vec3(worldPos);\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef DIFFUSE\nif (vDiffuseInfos.x == 0.)\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));\n}\n#ifdef HIGHLEVEL\nvFurUV=vDiffuseUV*furDensity;\n#endif\n#else\n#ifdef HIGHLEVEL\nvFurUV=uv*furDensity;\n#endif\n#endif\n\n#include<clipPlaneVertex>\n\n#include<fogVertex>\n\n#include<shadowsVertex>[0..maxSimultaneousLights]\n\n#ifdef VERTEXCOLOR\nvColor=color;\n#endif\n\n#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif\n}\n";
BABYLON.Effect.ShadersStore['furPixelShader'] = "precision highp float;\n\nuniform vec3 vEyePosition;\nuniform vec4 vDiffuseColor;\n\nuniform vec4 furColor;\nvarying vec3 vPositionW;\nvarying float vfur_length;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n#include<lightFragmentDeclaration>[0..maxSimultaneousLights]\n\n#ifdef DIFFUSE\nvarying vec2 vDiffuseUV;\nuniform sampler2D diffuseSampler;\nuniform vec2 vDiffuseInfos;\n#endif\n\n#ifdef HIGHLEVEL\nuniform float furOffset;\nuniform sampler2D furTexture;\nvarying vec2 vFurUV;\n#endif\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n#include<fogFragmentDeclaration>\n#include<clipPlaneFragmentDeclaration>\nfloat Rand(vec3 rv) {\nfloat x=dot(rv,vec3(12.9898,78.233,24.65487));\nreturn fract(sin(x)*43758.5453);\n}\nvoid main(void) {\n\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\nvec4 baseColor=furColor;\nvec3 diffuseColor=vDiffuseColor.rgb;\n\nfloat alpha=vDiffuseColor.a;\n#ifdef DIFFUSE\nbaseColor*=texture2D(diffuseSampler,vDiffuseUV);\n#ifdef ALPHATEST\nif (baseColor.a<0.4)\ndiscard;\n#endif\nbaseColor.rgb*=vDiffuseInfos.y;\n#endif\n#ifdef VERTEXCOLOR\nbaseColor.rgb*=vColor.rgb;\n#endif\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=vec3(1.0,1.0,1.0);\n#endif\n#ifdef HIGHLEVEL\n\nvec4 furTextureColor=texture2D(furTexture,vec2(vFurUV.x,vFurUV.y));\nif (furTextureColor.a<=0.0 || furTextureColor.g<furOffset) {\ndiscard;\n}\nfloat occlusion=mix(0.0,furTextureColor.b*1.2,furOffset);\nbaseColor=vec4(baseColor.xyz*occlusion,1.1-furOffset);\n#endif\n\nvec3 diffuseBase=vec3(0.,0.,0.);\nlightingInfo info;\nfloat shadow=1.;\nfloat glossiness=0.;\n#include<lightFragment>[0..maxSimultaneousLights]\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\nvec3 finalDiffuse=clamp(diffuseBase.rgb*baseColor.rgb,0.0,1.0);\n\n#ifdef HIGHLEVEL\nvec4 color=vec4(finalDiffuse,alpha);\n#else\nfloat r=vfur_length*0.5;\nvec4 color=vec4(finalDiffuse*(0.5+r),alpha);\n#endif\n#include<fogFragment>\ngl_FragColor=color;\n}";

//# sourceMappingURL=.temp/babylon.furMaterial.js.map
