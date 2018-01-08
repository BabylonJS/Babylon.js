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


import * as BABYLON from 'babylonjs/core/es6';

var BABYLON;
(function (BABYLON) {
    var Condition = /** @class */ (function () {
        function Condition(actionManager) {
            this._actionManager = actionManager;
        }
        Condition.prototype.isValid = function () {
            return true;
        };
        Condition.prototype._getProperty = function (propertyPath) {
            return this._actionManager._getProperty(propertyPath);
        };
        Condition.prototype._getEffectiveTarget = function (target, propertyPath) {
            return this._actionManager._getEffectiveTarget(target, propertyPath);
        };
        Condition.prototype.serialize = function () {
        };
        Condition.prototype._serialize = function (serializedCondition) {
            return {
                type: 2,
                children: [],
                name: serializedCondition.name,
                properties: serializedCondition.properties
            };
        };
        return Condition;
    }());
    BABYLON.Condition = Condition;
    var ValueCondition = /** @class */ (function (_super) {
        __extends(ValueCondition, _super);
        function ValueCondition(actionManager, target, propertyPath, value, operator) {
            if (operator === void 0) { operator = ValueCondition.IsEqual; }
            var _this = _super.call(this, actionManager) || this;
            _this.propertyPath = propertyPath;
            _this.value = value;
            _this.operator = operator;
            _this._target = target;
            _this._effectiveTarget = _this._getEffectiveTarget(target, _this.propertyPath);
            _this._property = _this._getProperty(_this.propertyPath);
            return _this;
        }
        Object.defineProperty(ValueCondition, "IsEqual", {
            get: function () {
                return ValueCondition._IsEqual;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ValueCondition, "IsDifferent", {
            get: function () {
                return ValueCondition._IsDifferent;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ValueCondition, "IsGreater", {
            get: function () {
                return ValueCondition._IsGreater;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ValueCondition, "IsLesser", {
            get: function () {
                return ValueCondition._IsLesser;
            },
            enumerable: true,
            configurable: true
        });
        // Methods
        ValueCondition.prototype.isValid = function () {
            switch (this.operator) {
                case ValueCondition.IsGreater:
                    return this._effectiveTarget[this._property] > this.value;
                case ValueCondition.IsLesser:
                    return this._effectiveTarget[this._property] < this.value;
                case ValueCondition.IsEqual:
                case ValueCondition.IsDifferent:
                    var check;
                    if (this.value.equals) {
                        check = this.value.equals(this._effectiveTarget[this._property]);
                    }
                    else {
                        check = this.value === this._effectiveTarget[this._property];
                    }
                    return this.operator === ValueCondition.IsEqual ? check : !check;
            }
            return false;
        };
        ValueCondition.prototype.serialize = function () {
            return this._serialize({
                name: "ValueCondition",
                properties: [
                    BABYLON.Action._GetTargetProperty(this._target),
                    { name: "propertyPath", value: this.propertyPath },
                    { name: "value", value: BABYLON.Action._SerializeValueAsString(this.value) },
                    { name: "operator", value: ValueCondition.GetOperatorName(this.operator) }
                ]
            });
        };
        ValueCondition.GetOperatorName = function (operator) {
            switch (operator) {
                case ValueCondition._IsEqual: return "IsEqual";
                case ValueCondition._IsDifferent: return "IsDifferent";
                case ValueCondition._IsGreater: return "IsGreater";
                case ValueCondition._IsLesser: return "IsLesser";
                default: return "";
            }
        };
        // Statics
        ValueCondition._IsEqual = 0;
        ValueCondition._IsDifferent = 1;
        ValueCondition._IsGreater = 2;
        ValueCondition._IsLesser = 3;
        return ValueCondition;
    }(Condition));
    BABYLON.ValueCondition = ValueCondition;
    var PredicateCondition = /** @class */ (function (_super) {
        __extends(PredicateCondition, _super);
        function PredicateCondition(actionManager, predicate) {
            var _this = _super.call(this, actionManager) || this;
            _this.predicate = predicate;
            return _this;
        }
        PredicateCondition.prototype.isValid = function () {
            return this.predicate();
        };
        return PredicateCondition;
    }(Condition));
    BABYLON.PredicateCondition = PredicateCondition;
    var StateCondition = /** @class */ (function (_super) {
        __extends(StateCondition, _super);
        function StateCondition(actionManager, target, value) {
            var _this = _super.call(this, actionManager) || this;
            _this.value = value;
            _this._target = target;
            return _this;
        }
        // Methods
        StateCondition.prototype.isValid = function () {
            return this._target.state === this.value;
        };
        StateCondition.prototype.serialize = function () {
            return this._serialize({
                name: "StateCondition",
                properties: [
                    BABYLON.Action._GetTargetProperty(this._target),
                    { name: "value", value: this.value }
                ]
            });
        };
        return StateCondition;
    }(Condition));
    BABYLON.StateCondition = StateCondition;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.condition.js.map

var BABYLON;
(function (BABYLON) {
    var Action = /** @class */ (function () {
        function Action(triggerOptions, condition) {
            this.triggerOptions = triggerOptions;
            this.onBeforeExecuteObservable = new BABYLON.Observable();
            if (triggerOptions.parameter) {
                this.trigger = triggerOptions.trigger;
                this._triggerParameter = triggerOptions.parameter;
            }
            else {
                this.trigger = triggerOptions;
            }
            this._nextActiveAction = this;
            this._condition = condition;
        }
        // Methods
        Action.prototype._prepare = function () {
        };
        Action.prototype.getTriggerParameter = function () {
            return this._triggerParameter;
        };
        Action.prototype._executeCurrent = function (evt) {
            if (this._nextActiveAction._condition) {
                var condition = this._nextActiveAction._condition;
                var currentRenderId = this._actionManager.getScene().getRenderId();
                // We cache the current evaluation for the current frame
                if (condition._evaluationId === currentRenderId) {
                    if (!condition._currentResult) {
                        return;
                    }
                }
                else {
                    condition._evaluationId = currentRenderId;
                    if (!condition.isValid()) {
                        condition._currentResult = false;
                        return;
                    }
                    condition._currentResult = true;
                }
            }
            this.onBeforeExecuteObservable.notifyObservers(this);
            this._nextActiveAction.execute(evt);
            this.skipToNextActiveAction();
        };
        Action.prototype.execute = function (evt) {
        };
        Action.prototype.skipToNextActiveAction = function () {
            if (this._nextActiveAction._child) {
                if (!this._nextActiveAction._child._actionManager) {
                    this._nextActiveAction._child._actionManager = this._actionManager;
                }
                this._nextActiveAction = this._nextActiveAction._child;
            }
            else {
                this._nextActiveAction = this;
            }
        };
        Action.prototype.then = function (action) {
            this._child = action;
            action._actionManager = this._actionManager;
            action._prepare();
            return action;
        };
        Action.prototype._getProperty = function (propertyPath) {
            return this._actionManager._getProperty(propertyPath);
        };
        Action.prototype._getEffectiveTarget = function (target, propertyPath) {
            return this._actionManager._getEffectiveTarget(target, propertyPath);
        };
        Action.prototype.serialize = function (parent) {
        };
        // Called by BABYLON.Action objects in serialize(...). Internal use
        Action.prototype._serialize = function (serializedAction, parent) {
            var serializationObject = {
                type: 1,
                children: [],
                name: serializedAction.name,
                properties: serializedAction.properties || []
            };
            // Serialize child
            if (this._child) {
                this._child.serialize(serializationObject);
            }
            // Check if "this" has a condition
            if (this._condition) {
                var serializedCondition = this._condition.serialize();
                serializedCondition.children.push(serializationObject);
                if (parent) {
                    parent.children.push(serializedCondition);
                }
                return serializedCondition;
            }
            if (parent) {
                parent.children.push(serializationObject);
            }
            return serializationObject;
        };
        Action._SerializeValueAsString = function (value) {
            if (typeof value === "number") {
                return value.toString();
            }
            if (typeof value === "boolean") {
                return value ? "true" : "false";
            }
            if (value instanceof BABYLON.Vector2) {
                return value.x + ", " + value.y;
            }
            if (value instanceof BABYLON.Vector3) {
                return value.x + ", " + value.y + ", " + value.z;
            }
            if (value instanceof BABYLON.Color3) {
                return value.r + ", " + value.g + ", " + value.b;
            }
            if (value instanceof BABYLON.Color4) {
                return value.r + ", " + value.g + ", " + value.b + ", " + value.a;
            }
            return value; // string
        };
        Action._GetTargetProperty = function (target) {
            return {
                name: "target",
                targetType: target instanceof BABYLON.Mesh ? "MeshProperties"
                    : target instanceof BABYLON.Light ? "LightProperties"
                        : target instanceof BABYLON.Camera ? "CameraProperties"
                            : "SceneProperties",
                value: target instanceof BABYLON.Scene ? "Scene" : target.name
            };
        };
        return Action;
    }());
    BABYLON.Action = Action;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.action.js.map

BABYLON.Effect.ShadersStore['defaultVertexShader'] = "#include<__decl__defaultVertex>\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef TANGENT\nattribute vec4 tangent;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<helperFunctions>\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2;\n#endif\n#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0\nvarying vec2 vDiffuseUV;\n#endif\n#if defined(AMBIENT) && AMBIENTDIRECTUV == 0\nvarying vec2 vAmbientUV;\n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0\nvarying vec2 vOpacityUV;\n#endif\n#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0\nvarying vec2 vEmissiveUV;\n#endif\n#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0\nvarying vec2 vLightmapUV;\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM) && SPECULARDIRECTUV == 0\nvarying vec2 vSpecularUV;\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0\nvarying vec2 vBumpUV;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<bumpVertexDeclaration>\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<morphTargetsVertexGlobalDeclaration>\n#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#include<logDepthDeclaration>\nvoid main(void) {\nvec3 positionUpdated=position;\n#ifdef NORMAL \nvec3 normalUpdated=normal;\n#endif\n#ifdef TANGENT\nvec4 tangentUpdated=tangent;\n#endif\n#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvPositionUVW=positionUpdated;\n#endif \n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(positionUpdated,1.0);\nvec4 worldPos=finalWorld*vec4(positionUpdated,1.0);\nvPositionW=vec3(worldPos);\n#ifdef NORMAL\nmat3 normalWorld=mat3(finalWorld);\n#ifdef NONUNIFORMSCALING\nnormalWorld=transposeMat3(inverseMat3(normalWorld));\n#endif\nvNormalW=normalize(normalWorld*normalUpdated);\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvDirectionW=normalize(vec3(finalWorld*vec4(positionUpdated,0.0)));\n#endif\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef MAINUV1\nvMainUV1=uv;\n#endif\n#ifdef MAINUV2\nvMainUV2=uv2;\n#endif\n#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0\nif (vDiffuseInfos.x == 0.)\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(AMBIENT) && AMBIENTDIRECTUV == 0\nif (vAmbientInfos.x == 0.)\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0\nif (vOpacityInfos.x == 0.)\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0\nif (vEmissiveInfos.x == 0.)\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0\nif (vLightmapInfos.x == 0.)\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM) && SPECULARDIRECTUV == 0\nif (vSpecularInfos.x == 0.)\n{\nvSpecularUV=vec2(specularMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvSpecularUV=vec2(specularMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0\nif (vBumpInfos.x == 0.)\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#include<bumpVertex>\n#include<clipPlaneVertex>\n#include<fogVertex>\n#include<shadowsVertex>[0..maxSimultaneousLights]\n#ifdef VERTEXCOLOR\n\nvColor=color;\n#endif\n#include<pointCloudVertex>\n#include<logDepthVertex>\n}";
BABYLON.Effect.ShadersStore['defaultPixelShader'] = "#include<__decl__defaultFragment>\n#if defined(BUMP) || !defined(NORMAL)\n#extension GL_OES_standard_derivatives : enable\n#endif\n#ifdef LOGARITHMICDEPTH\n#extension GL_EXT_frag_depth : enable\n#endif\n\n#define RECIPROCAL_PI2 0.15915494\nuniform vec3 vEyePosition;\nuniform vec3 vAmbientColor;\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2;\n#endif\n\n#include<helperFunctions>\n\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n\n#ifdef DIFFUSE\n#if DIFFUSEDIRECTUV == 1\n#define vDiffuseUV vMainUV1\n#elif DIFFUSEDIRECTUV == 2\n#define vDiffuseUV vMainUV2\n#else\nvarying vec2 vDiffuseUV;\n#endif\nuniform sampler2D diffuseSampler;\n#endif\n#ifdef AMBIENT\n#if AMBIENTDIRECTUV == 1\n#define vAmbientUV vMainUV1\n#elif AMBIENTDIRECTUV == 2\n#define vAmbientUV vMainUV2\n#else\nvarying vec2 vAmbientUV;\n#endif\nuniform sampler2D ambientSampler;\n#endif\n#ifdef OPACITY \n#if OPACITYDIRECTUV == 1\n#define vOpacityUV vMainUV1\n#elif OPACITYDIRECTUV == 2\n#define vOpacityUV vMainUV2\n#else\nvarying vec2 vOpacityUV;\n#endif\nuniform sampler2D opacitySampler;\n#endif\n#ifdef EMISSIVE\n#if EMISSIVEDIRECTUV == 1\n#define vEmissiveUV vMainUV1\n#elif EMISSIVEDIRECTUV == 2\n#define vEmissiveUV vMainUV2\n#else\nvarying vec2 vEmissiveUV;\n#endif\nuniform sampler2D emissiveSampler;\n#endif\n#ifdef LIGHTMAP\n#if LIGHTMAPDIRECTUV == 1\n#define vLightmapUV vMainUV1\n#elif LIGHTMAPDIRECTUV == 2\n#define vLightmapUV vMainUV2\n#else\nvarying vec2 vLightmapUV;\n#endif\nuniform sampler2D lightmapSampler;\n#endif\n#ifdef REFRACTION\n#ifdef REFRACTIONMAP_3D\nuniform samplerCube refractionCubeSampler;\n#else\nuniform sampler2D refraction2DSampler;\n#endif\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\n#if SPECULARDIRECTUV == 1\n#define vSpecularUV vMainUV1\n#elif SPECULARDIRECTUV == 2\n#define vSpecularUV vMainUV2\n#else\nvarying vec2 vSpecularUV;\n#endif\nuniform sampler2D specularSampler;\n#endif\n\n#include<fresnelFunction>\n\n#ifdef REFLECTION\n#ifdef REFLECTIONMAP_3D\nuniform samplerCube reflectionCubeSampler;\n#else\nuniform sampler2D reflection2DSampler;\n#endif\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#else\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#endif\n#include<reflectionFunction>\n#endif\n#include<imageProcessingDeclaration>\n#include<imageProcessingFunctions>\n#include<bumpFragmentFunctions>\n#include<clipPlaneFragmentDeclaration>\n#include<logDepthDeclaration>\n#include<fogFragmentDeclaration>\nvoid main(void) {\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\nvec4 baseColor=vec4(1.,1.,1.,1.);\nvec3 diffuseColor=vDiffuseColor.rgb;\n\nfloat alpha=vDiffuseColor.a;\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=normalize(-cross(dFdx(vPositionW),dFdy(vPositionW)));\n#endif\n#include<bumpFragment>\n#ifdef TWOSIDEDLIGHTING\nnormalW=gl_FrontFacing ? normalW : -normalW;\n#endif\n#ifdef DIFFUSE\nbaseColor=texture2D(diffuseSampler,vDiffuseUV+uvOffset);\n#ifdef ALPHATEST\nif (baseColor.a<0.4)\ndiscard;\n#endif\n#ifdef ALPHAFROMDIFFUSE\nalpha*=baseColor.a;\n#endif\nbaseColor.rgb*=vDiffuseInfos.y;\n#endif\n#include<depthPrePass>\n#ifdef VERTEXCOLOR\nbaseColor.rgb*=vColor.rgb;\n#endif\n\nvec3 baseAmbientColor=vec3(1.,1.,1.);\n#ifdef AMBIENT\nbaseAmbientColor=texture2D(ambientSampler,vAmbientUV+uvOffset).rgb*vAmbientInfos.y;\n#endif\n\n#ifdef SPECULARTERM\nfloat glossiness=vSpecularColor.a;\nvec3 specularColor=vSpecularColor.rgb;\n#ifdef SPECULAR\nvec4 specularMapColor=texture2D(specularSampler,vSpecularUV+uvOffset);\nspecularColor=specularMapColor.rgb;\n#ifdef GLOSSINESS\nglossiness=glossiness*specularMapColor.a;\n#endif\n#endif\n#else\nfloat glossiness=0.;\n#endif\n\nvec3 diffuseBase=vec3(0.,0.,0.);\nlightingInfo info;\n#ifdef SPECULARTERM\nvec3 specularBase=vec3(0.,0.,0.);\n#endif\nfloat shadow=1.;\n#ifdef LIGHTMAP\nvec3 lightmapColor=texture2D(lightmapSampler,vLightmapUV+uvOffset).rgb*vLightmapInfos.y;\n#endif\n#include<lightFragment>[0..maxSimultaneousLights]\n\nvec3 refractionColor=vec3(0.,0.,0.);\n#ifdef REFRACTION\nvec3 refractionVector=normalize(refract(-viewDirectionW,normalW,vRefractionInfos.y));\n#ifdef REFRACTIONMAP_3D\nrefractionVector.y=refractionVector.y*vRefractionInfos.w;\nif (dot(refractionVector,viewDirectionW)<1.0)\n{\nrefractionColor=textureCube(refractionCubeSampler,refractionVector).rgb*vRefractionInfos.x;\n}\n#else\nvec3 vRefractionUVW=vec3(refractionMatrix*(view*vec4(vPositionW+refractionVector*vRefractionInfos.z,1.0)));\nvec2 refractionCoords=vRefractionUVW.xy/vRefractionUVW.z;\nrefractionCoords.y=1.0-refractionCoords.y;\nrefractionColor=texture2D(refraction2DSampler,refractionCoords).rgb*vRefractionInfos.x;\n#endif\n#endif\n\nvec3 reflectionColor=vec3(0.,0.,0.);\n#ifdef REFLECTION\nvec3 vReflectionUVW=computeReflectionCoords(vec4(vPositionW,1.0),normalW);\n#ifdef REFLECTIONMAP_3D\n#ifdef ROUGHNESS\nfloat bias=vReflectionInfos.y;\n#ifdef SPECULARTERM\n#ifdef SPECULAR\n#ifdef GLOSSINESS\nbias*=(1.0-specularMapColor.a);\n#endif\n#endif\n#endif\nreflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW,bias).rgb*vReflectionInfos.x;\n#else\nreflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW).rgb*vReflectionInfos.x;\n#endif\n#else\nvec2 coords=vReflectionUVW.xy;\n#ifdef REFLECTIONMAP_PROJECTION\ncoords/=vReflectionUVW.z;\n#endif\ncoords.y=1.0-coords.y;\nreflectionColor=texture2D(reflection2DSampler,coords).rgb*vReflectionInfos.x;\n#endif\n#ifdef REFLECTIONFRESNEL\nfloat reflectionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,reflectionRightColor.a,reflectionLeftColor.a);\n#ifdef REFLECTIONFRESNELFROMSPECULAR\n#ifdef SPECULARTERM\nreflectionColor*=specularColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#else\nreflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#endif\n#else\nreflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#endif\n#endif\n#endif\n#ifdef REFRACTIONFRESNEL\nfloat refractionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,refractionRightColor.a,refractionLeftColor.a);\nrefractionColor*=refractionLeftColor.rgb*(1.0-refractionFresnelTerm)+refractionFresnelTerm*refractionRightColor.rgb;\n#endif\n#ifdef OPACITY\nvec4 opacityMap=texture2D(opacitySampler,vOpacityUV+uvOffset);\n#ifdef OPACITYRGB\nopacityMap.rgb=opacityMap.rgb*vec3(0.3,0.59,0.11);\nalpha*=(opacityMap.x+opacityMap.y+opacityMap.z)* vOpacityInfos.y;\n#else\nalpha*=opacityMap.a*vOpacityInfos.y;\n#endif\n#endif\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\n#ifdef OPACITYFRESNEL\nfloat opacityFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,opacityParts.z,opacityParts.w);\nalpha+=opacityParts.x*(1.0-opacityFresnelTerm)+opacityFresnelTerm*opacityParts.y;\n#endif\n\nvec3 emissiveColor=vEmissiveColor;\n#ifdef EMISSIVE\nemissiveColor+=texture2D(emissiveSampler,vEmissiveUV+uvOffset).rgb*vEmissiveInfos.y;\n#endif\n#ifdef EMISSIVEFRESNEL\nfloat emissiveFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,emissiveRightColor.a,emissiveLeftColor.a);\nemissiveColor*=emissiveLeftColor.rgb*(1.0-emissiveFresnelTerm)+emissiveFresnelTerm*emissiveRightColor.rgb;\n#endif\n\n#ifdef DIFFUSEFRESNEL\nfloat diffuseFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,diffuseRightColor.a,diffuseLeftColor.a);\ndiffuseBase*=diffuseLeftColor.rgb*(1.0-diffuseFresnelTerm)+diffuseFresnelTerm*diffuseRightColor.rgb;\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#else\n#ifdef LINKEMISSIVEWITHDIFFUSE\nvec3 finalDiffuse=clamp((diffuseBase+emissiveColor)*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#else\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor+emissiveColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#endif\n#endif\n#ifdef SPECULARTERM\nvec3 finalSpecular=specularBase*specularColor;\n#ifdef SPECULAROVERALPHA\nalpha=clamp(alpha+dot(finalSpecular,vec3(0.3,0.59,0.11)),0.,1.);\n#endif\n#else\nvec3 finalSpecular=vec3(0.0);\n#endif\n#ifdef REFLECTIONOVERALPHA\nalpha=clamp(alpha+dot(reflectionColor,vec3(0.3,0.59,0.11)),0.,1.);\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec4 color=vec4(clamp(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+emissiveColor+refractionColor,0.0,1.0),alpha);\n#else\nvec4 color=vec4(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+refractionColor,alpha);\n#endif\n\n#ifdef LIGHTMAP\n#ifndef LIGHTMAPEXCLUDED\n#ifdef USELIGHTMAPASSHADOWMAP\ncolor.rgb*=lightmapColor;\n#else\ncolor.rgb+=lightmapColor;\n#endif\n#endif\n#endif\n#include<logDepthFragment>\n#include<fogFragment>\n\n\n#ifdef IMAGEPROCESSINGPOSTPROCESS\ncolor.rgb=toLinearSpace(color.rgb);\n#else\n#ifdef IMAGEPROCESSING\ncolor.rgb=toLinearSpace(color.rgb);\ncolor=applyImageProcessing(color);\n#endif\n#endif\n#ifdef PREMULTIPLYALPHA\n\ncolor.rgb*=color.a;\n#endif\ngl_FragColor=color;\n}";

var BABYLON;
(function (BABYLON) {
    /**
     * ActionEvent is the event beint sent when an action is triggered.
     */
    var ActionEvent = /** @class */ (function () {
        /**
         * @param source The mesh or sprite that triggered the action.
         * @param pointerX The X mouse cursor position at the time of the event
         * @param pointerY The Y mouse cursor position at the time of the event
         * @param meshUnderPointer The mesh that is currently pointed at (can be null)
         * @param sourceEvent the original (browser) event that triggered the ActionEvent
         */
        function ActionEvent(source, pointerX, pointerY, meshUnderPointer, sourceEvent, additionalData) {
            this.source = source;
            this.pointerX = pointerX;
            this.pointerY = pointerY;
            this.meshUnderPointer = meshUnderPointer;
            this.sourceEvent = sourceEvent;
            this.additionalData = additionalData;
        }
        /**
         * Helper function to auto-create an ActionEvent from a source mesh.
         * @param source The source mesh that triggered the event
         * @param evt {Event} The original (browser) event
         */
        ActionEvent.CreateNew = function (source, evt, additionalData) {
            var scene = source.getScene();
            return new ActionEvent(source, scene.pointerX, scene.pointerY, scene.meshUnderPointer, evt, additionalData);
        };
        /**
         * Helper function to auto-create an ActionEvent from a source mesh.
         * @param source The source sprite that triggered the event
         * @param scene Scene associated with the sprite
         * @param evt {Event} The original (browser) event
         */
        ActionEvent.CreateNewFromSprite = function (source, scene, evt, additionalData) {
            return new ActionEvent(source, scene.pointerX, scene.pointerY, scene.meshUnderPointer, evt, additionalData);
        };
        /**
         * Helper function to auto-create an ActionEvent from a scene. If triggered by a mesh use ActionEvent.CreateNew
         * @param scene the scene where the event occurred
         * @param evt {Event} The original (browser) event
         */
        ActionEvent.CreateNewFromScene = function (scene, evt) {
            return new ActionEvent(null, scene.pointerX, scene.pointerY, scene.meshUnderPointer, evt);
        };
        ActionEvent.CreateNewFromPrimitive = function (prim, pointerPos, evt, additionalData) {
            return new ActionEvent(prim, pointerPos.x, pointerPos.y, null, evt, additionalData);
        };
        return ActionEvent;
    }());
    BABYLON.ActionEvent = ActionEvent;
    /**
     * Action Manager manages all events to be triggered on a given mesh or the global scene.
     * A single scene can have many Action Managers to handle predefined actions on specific meshes.
     */
    var ActionManager = /** @class */ (function () {
        function ActionManager(scene) {
            // Members
            this.actions = new Array();
            this.hoverCursor = '';
            this._scene = scene;
            scene._actionManagers.push(this);
        }
        Object.defineProperty(ActionManager, "NothingTrigger", {
            get: function () {
                return ActionManager._NothingTrigger;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActionManager, "OnPickTrigger", {
            get: function () {
                return ActionManager._OnPickTrigger;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActionManager, "OnLeftPickTrigger", {
            get: function () {
                return ActionManager._OnLeftPickTrigger;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActionManager, "OnRightPickTrigger", {
            get: function () {
                return ActionManager._OnRightPickTrigger;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActionManager, "OnCenterPickTrigger", {
            get: function () {
                return ActionManager._OnCenterPickTrigger;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActionManager, "OnPickDownTrigger", {
            get: function () {
                return ActionManager._OnPickDownTrigger;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActionManager, "OnDoublePickTrigger", {
            get: function () {
                return ActionManager._OnDoublePickTrigger;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActionManager, "OnPickUpTrigger", {
            get: function () {
                return ActionManager._OnPickUpTrigger;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActionManager, "OnPickOutTrigger", {
            /// This trigger will only be raised if you also declared a OnPickDown
            get: function () {
                return ActionManager._OnPickOutTrigger;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActionManager, "OnLongPressTrigger", {
            get: function () {
                return ActionManager._OnLongPressTrigger;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActionManager, "OnPointerOverTrigger", {
            get: function () {
                return ActionManager._OnPointerOverTrigger;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActionManager, "OnPointerOutTrigger", {
            get: function () {
                return ActionManager._OnPointerOutTrigger;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActionManager, "OnEveryFrameTrigger", {
            get: function () {
                return ActionManager._OnEveryFrameTrigger;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActionManager, "OnIntersectionEnterTrigger", {
            get: function () {
                return ActionManager._OnIntersectionEnterTrigger;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActionManager, "OnIntersectionExitTrigger", {
            get: function () {
                return ActionManager._OnIntersectionExitTrigger;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActionManager, "OnKeyDownTrigger", {
            get: function () {
                return ActionManager._OnKeyDownTrigger;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActionManager, "OnKeyUpTrigger", {
            get: function () {
                return ActionManager._OnKeyUpTrigger;
            },
            enumerable: true,
            configurable: true
        });
        // Methods
        ActionManager.prototype.dispose = function () {
            var index = this._scene._actionManagers.indexOf(this);
            for (var i = 0; i < this.actions.length; i++) {
                var action = this.actions[i];
                ActionManager.Triggers[action.trigger]--;
                if (ActionManager.Triggers[action.trigger] === 0) {
                    delete ActionManager.Triggers[action.trigger];
                }
            }
            if (index > -1) {
                this._scene._actionManagers.splice(index, 1);
            }
        };
        ActionManager.prototype.getScene = function () {
            return this._scene;
        };
        /**
         * Does this action manager handles actions of any of the given triggers
         * @param {number[]} triggers - the triggers to be tested
         * @return {boolean} whether one (or more) of the triggers is handeled
         */
        ActionManager.prototype.hasSpecificTriggers = function (triggers) {
            for (var index = 0; index < this.actions.length; index++) {
                var action = this.actions[index];
                if (triggers.indexOf(action.trigger) > -1) {
                    return true;
                }
            }
            return false;
        };
        /**
         * Does this action manager handles actions of a given trigger
         * @param {number} trigger - the trigger to be tested
         * @return {boolean} whether the trigger is handeled
         */
        ActionManager.prototype.hasSpecificTrigger = function (trigger) {
            for (var index = 0; index < this.actions.length; index++) {
                var action = this.actions[index];
                if (action.trigger === trigger) {
                    return true;
                }
            }
            return false;
        };
        Object.defineProperty(ActionManager.prototype, "hasPointerTriggers", {
            /**
             * Does this action manager has pointer triggers
             * @return {boolean} whether or not it has pointer triggers
             */
            get: function () {
                for (var index = 0; index < this.actions.length; index++) {
                    var action = this.actions[index];
                    if (action.trigger >= ActionManager._OnPickTrigger && action.trigger <= ActionManager._OnPointerOutTrigger) {
                        return true;
                    }
                }
                return false;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActionManager.prototype, "hasPickTriggers", {
            /**
             * Does this action manager has pick triggers
             * @return {boolean} whether or not it has pick triggers
             */
            get: function () {
                for (var index = 0; index < this.actions.length; index++) {
                    var action = this.actions[index];
                    if (action.trigger >= ActionManager._OnPickTrigger && action.trigger <= ActionManager._OnPickUpTrigger) {
                        return true;
                    }
                }
                return false;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActionManager, "HasTriggers", {
            /**
             * Does exist one action manager with at least one trigger
             * @return {boolean} whether or not it exists one action manager with one trigger
            **/
            get: function () {
                for (var t in ActionManager.Triggers) {
                    if (ActionManager.Triggers.hasOwnProperty(t)) {
                        return true;
                    }
                }
                return false;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActionManager, "HasPickTriggers", {
            /**
             * Does exist one action manager with at least one pick trigger
             * @return {boolean} whether or not it exists one action manager with one pick trigger
            **/
            get: function () {
                for (var t in ActionManager.Triggers) {
                    if (ActionManager.Triggers.hasOwnProperty(t)) {
                        var t_int = parseInt(t);
                        if (t_int >= ActionManager._OnPickTrigger && t_int <= ActionManager._OnPickUpTrigger) {
                            return true;
                        }
                    }
                }
                return false;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Does exist one action manager that handles actions of a given trigger
         * @param {number} trigger - the trigger to be tested
         * @return {boolean} whether the trigger is handeled by at least one action manager
        **/
        ActionManager.HasSpecificTrigger = function (trigger) {
            for (var t in ActionManager.Triggers) {
                if (ActionManager.Triggers.hasOwnProperty(t)) {
                    var t_int = parseInt(t);
                    if (t_int === trigger) {
                        return true;
                    }
                }
            }
            return false;
        };
        /**
         * Registers an action to this action manager
         * @param {BABYLON.Action} action - the action to be registered
         * @return {BABYLON.Action} the action amended (prepared) after registration
         */
        ActionManager.prototype.registerAction = function (action) {
            if (action.trigger === ActionManager.OnEveryFrameTrigger) {
                if (this.getScene().actionManager !== this) {
                    BABYLON.Tools.Warn("OnEveryFrameTrigger can only be used with scene.actionManager");
                    return null;
                }
            }
            this.actions.push(action);
            if (ActionManager.Triggers[action.trigger]) {
                ActionManager.Triggers[action.trigger]++;
            }
            else {
                ActionManager.Triggers[action.trigger] = 1;
            }
            action._actionManager = this;
            action._prepare();
            return action;
        };
        /**
         * Process a specific trigger
         * @param {number} trigger - the trigger to process
         * @param evt {BABYLON.ActionEvent} the event details to be processed
         */
        ActionManager.prototype.processTrigger = function (trigger, evt) {
            for (var index = 0; index < this.actions.length; index++) {
                var action = this.actions[index];
                if (action.trigger === trigger) {
                    if (evt) {
                        if (trigger === ActionManager.OnKeyUpTrigger
                            || trigger === ActionManager.OnKeyDownTrigger) {
                            var parameter = action.getTriggerParameter();
                            if (parameter && parameter !== evt.sourceEvent.keyCode) {
                                if (!parameter.toLowerCase) {
                                    continue;
                                }
                                var lowerCase = parameter.toLowerCase();
                                if (lowerCase !== evt.sourceEvent.key) {
                                    var unicode = evt.sourceEvent.charCode ? evt.sourceEvent.charCode : evt.sourceEvent.keyCode;
                                    var actualkey = String.fromCharCode(unicode).toLowerCase();
                                    if (actualkey !== lowerCase) {
                                        continue;
                                    }
                                }
                            }
                        }
                    }
                    action._executeCurrent(evt);
                }
            }
        };
        ActionManager.prototype._getEffectiveTarget = function (target, propertyPath) {
            var properties = propertyPath.split(".");
            for (var index = 0; index < properties.length - 1; index++) {
                target = target[properties[index]];
            }
            return target;
        };
        ActionManager.prototype._getProperty = function (propertyPath) {
            var properties = propertyPath.split(".");
            return properties[properties.length - 1];
        };
        ActionManager.prototype.serialize = function (name) {
            var root = {
                children: new Array(),
                name: name,
                type: 3,
                properties: new Array() // Empty for root but required
            };
            for (var i = 0; i < this.actions.length; i++) {
                var triggerObject = {
                    type: 0,
                    children: new Array(),
                    name: ActionManager.GetTriggerName(this.actions[i].trigger),
                    properties: new Array()
                };
                var triggerOptions = this.actions[i].triggerOptions;
                if (triggerOptions && typeof triggerOptions !== "number") {
                    if (triggerOptions.parameter instanceof BABYLON.Node) {
                        triggerObject.properties.push(BABYLON.Action._GetTargetProperty(triggerOptions.parameter));
                    }
                    else {
                        var parameter = {};
                        BABYLON.Tools.DeepCopy(triggerOptions.parameter, parameter, ["mesh"]);
                        if (triggerOptions.parameter.mesh) {
                            parameter._meshId = triggerOptions.parameter.mesh.id;
                        }
                        triggerObject.properties.push({ name: "parameter", targetType: null, value: parameter });
                    }
                }
                // Serialize child action, recursively
                this.actions[i].serialize(triggerObject);
                // Add serialized trigger
                root.children.push(triggerObject);
            }
            return root;
        };
        ActionManager.Parse = function (parsedActions, object, scene) {
            var actionManager = new ActionManager(scene);
            if (object === null)
                scene.actionManager = actionManager;
            else
                object.actionManager = actionManager;
            // instanciate a new object
            var instanciate = function (name, params) {
                // TODO: We will need to find a solution for the next line when using commonjs / es6 .
                var newInstance = Object.create(BABYLON.Tools.Instantiate("BABYLON." + name).prototype);
                newInstance.constructor.apply(newInstance, params);
                return newInstance;
            };
            var parseParameter = function (name, value, target, propertyPath) {
                if (propertyPath === null) {
                    // String, boolean or float
                    var floatValue = parseFloat(value);
                    if (value === "true" || value === "false")
                        return value === "true";
                    else
                        return isNaN(floatValue) ? value : floatValue;
                }
                var effectiveTarget = propertyPath.split(".");
                var values = value.split(",");
                // Get effective Target
                for (var i = 0; i < effectiveTarget.length; i++) {
                    target = target[effectiveTarget[i]];
                }
                // Return appropriate value with its type
                if (typeof (target) === "boolean")
                    return values[0] === "true";
                if (typeof (target) === "string")
                    return values[0];
                // Parameters with multiple values such as Vector3 etc.
                var split = new Array();
                for (var i = 0; i < values.length; i++)
                    split.push(parseFloat(values[i]));
                if (target instanceof BABYLON.Vector3)
                    return BABYLON.Vector3.FromArray(split);
                if (target instanceof BABYLON.Vector4)
                    return BABYLON.Vector4.FromArray(split);
                if (target instanceof BABYLON.Color3)
                    return BABYLON.Color3.FromArray(split);
                if (target instanceof BABYLON.Color4)
                    return BABYLON.Color4.FromArray(split);
                return parseFloat(values[0]);
            };
            // traverse graph per trigger
            var traverse = function (parsedAction, trigger, condition, action, combineArray) {
                if (combineArray === void 0) { combineArray = null; }
                if (parsedAction.detached)
                    return;
                var parameters = new Array();
                var target = null;
                var propertyPath = null;
                var combine = parsedAction.combine && parsedAction.combine.length > 0;
                // Parameters
                if (parsedAction.type === 2)
                    parameters.push(actionManager);
                else
                    parameters.push(trigger);
                if (combine) {
                    var actions = new Array();
                    for (var j = 0; j < parsedAction.combine.length; j++) {
                        traverse(parsedAction.combine[j], ActionManager.NothingTrigger, condition, action, actions);
                    }
                    parameters.push(actions);
                }
                else {
                    for (var i = 0; i < parsedAction.properties.length; i++) {
                        var value = parsedAction.properties[i].value;
                        var name = parsedAction.properties[i].name;
                        var targetType = parsedAction.properties[i].targetType;
                        if (name === "target")
                            if (targetType !== null && targetType === "SceneProperties")
                                value = target = scene;
                            else
                                value = target = scene.getNodeByName(value);
                        else if (name === "parent")
                            value = scene.getNodeByName(value);
                        else if (name === "sound")
                            value = scene.getSoundByName(value);
                        else if (name !== "propertyPath") {
                            if (parsedAction.type === 2 && name === "operator")
                                value = BABYLON.ValueCondition[value];
                            else
                                value = parseParameter(name, value, target, name === "value" ? propertyPath : null);
                        }
                        else {
                            propertyPath = value;
                        }
                        parameters.push(value);
                    }
                }
                if (combineArray === null) {
                    parameters.push(condition);
                }
                else {
                    parameters.push(null);
                }
                // If interpolate value action
                if (parsedAction.name === "InterpolateValueAction") {
                    var param = parameters[parameters.length - 2];
                    parameters[parameters.length - 1] = param;
                    parameters[parameters.length - 2] = condition;
                }
                // Action or condition(s) and not CombineAction
                var newAction = instanciate(parsedAction.name, parameters);
                if (newAction instanceof BABYLON.Condition && condition !== null) {
                    var nothing = new BABYLON.DoNothingAction(trigger, condition);
                    if (action)
                        action.then(nothing);
                    else
                        actionManager.registerAction(nothing);
                    action = nothing;
                }
                if (combineArray === null) {
                    if (newAction instanceof BABYLON.Condition) {
                        condition = newAction;
                        newAction = action;
                    }
                    else {
                        condition = null;
                        if (action)
                            action.then(newAction);
                        else
                            actionManager.registerAction(newAction);
                    }
                }
                else {
                    combineArray.push(newAction);
                }
                for (var i = 0; i < parsedAction.children.length; i++)
                    traverse(parsedAction.children[i], trigger, condition, newAction, null);
            };
            // triggers
            for (var i = 0; i < parsedActions.children.length; i++) {
                var triggerParams;
                var trigger = parsedActions.children[i];
                if (trigger.properties.length > 0) {
                    var param = trigger.properties[0].value;
                    var value = trigger.properties[0].targetType === null ? param : scene.getMeshByName(param);
                    if (value._meshId) {
                        value.mesh = scene.getMeshByID(value._meshId);
                    }
                    triggerParams = { trigger: ActionManager[trigger.name], parameter: value };
                }
                else
                    triggerParams = ActionManager[trigger.name];
                for (var j = 0; j < trigger.children.length; j++) {
                    if (!trigger.detached)
                        traverse(trigger.children[j], triggerParams, null, null);
                }
            }
        };
        ActionManager.GetTriggerName = function (trigger) {
            switch (trigger) {
                case 0: return "NothingTrigger";
                case 1: return "OnPickTrigger";
                case 2: return "OnLeftPickTrigger";
                case 3: return "OnRightPickTrigger";
                case 4: return "OnCenterPickTrigger";
                case 5: return "OnPickDownTrigger";
                case 6: return "OnPickUpTrigger";
                case 7: return "OnLongPressTrigger";
                case 8: return "OnPointerOverTrigger";
                case 9: return "OnPointerOutTrigger";
                case 10: return "OnEveryFrameTrigger";
                case 11: return "OnIntersectionEnterTrigger";
                case 12: return "OnIntersectionExitTrigger";
                case 13: return "OnKeyDownTrigger";
                case 14: return "OnKeyUpTrigger";
                case 15: return "OnPickOutTrigger";
                default: return "";
            }
        };
        // Statics
        ActionManager._NothingTrigger = 0;
        ActionManager._OnPickTrigger = 1;
        ActionManager._OnLeftPickTrigger = 2;
        ActionManager._OnRightPickTrigger = 3;
        ActionManager._OnCenterPickTrigger = 4;
        ActionManager._OnPickDownTrigger = 5;
        ActionManager._OnDoublePickTrigger = 6;
        ActionManager._OnPickUpTrigger = 7;
        ActionManager._OnLongPressTrigger = 8;
        ActionManager._OnPointerOverTrigger = 9;
        ActionManager._OnPointerOutTrigger = 10;
        ActionManager._OnEveryFrameTrigger = 11;
        ActionManager._OnIntersectionEnterTrigger = 12;
        ActionManager._OnIntersectionExitTrigger = 13;
        ActionManager._OnKeyDownTrigger = 14;
        ActionManager._OnKeyUpTrigger = 15;
        ActionManager._OnPickOutTrigger = 16;
        ActionManager.Triggers = {};
        return ActionManager;
    }());
    BABYLON.ActionManager = ActionManager;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.actionManager.js.map


var BABYLON;
(function (BABYLON) {
    var InterpolateValueAction = /** @class */ (function (_super) {
        __extends(InterpolateValueAction, _super);
        function InterpolateValueAction(triggerOptions, target, propertyPath, value, duration, condition, stopOtherAnimations, onInterpolationDone) {
            if (duration === void 0) { duration = 1000; }
            var _this = _super.call(this, triggerOptions, condition) || this;
            _this.propertyPath = propertyPath;
            _this.value = value;
            _this.duration = duration;
            _this.stopOtherAnimations = stopOtherAnimations;
            _this.onInterpolationDone = onInterpolationDone;
            _this.onInterpolationDoneObservable = new BABYLON.Observable();
            _this._target = _this._effectiveTarget = target;
            return _this;
        }
        InterpolateValueAction.prototype._prepare = function () {
            this._effectiveTarget = this._getEffectiveTarget(this._effectiveTarget, this.propertyPath);
            this._property = this._getProperty(this.propertyPath);
        };
        InterpolateValueAction.prototype.execute = function () {
            var _this = this;
            var scene = this._actionManager.getScene();
            var keys = [
                {
                    frame: 0,
                    value: this._effectiveTarget[this._property]
                }, {
                    frame: 100,
                    value: this.value
                }
            ];
            var dataType;
            if (typeof this.value === "number") {
                dataType = BABYLON.Animation.ANIMATIONTYPE_FLOAT;
            }
            else if (this.value instanceof BABYLON.Color3) {
                dataType = BABYLON.Animation.ANIMATIONTYPE_COLOR3;
            }
            else if (this.value instanceof BABYLON.Vector3) {
                dataType = BABYLON.Animation.ANIMATIONTYPE_VECTOR3;
            }
            else if (this.value instanceof BABYLON.Matrix) {
                dataType = BABYLON.Animation.ANIMATIONTYPE_MATRIX;
            }
            else if (this.value instanceof BABYLON.Quaternion) {
                dataType = BABYLON.Animation.ANIMATIONTYPE_QUATERNION;
            }
            else {
                BABYLON.Tools.Warn("InterpolateValueAction: Unsupported type (" + typeof this.value + ")");
                return;
            }
            var animation = new BABYLON.Animation("InterpolateValueAction", this._property, 100 * (1000.0 / this.duration), dataType, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
            animation.setKeys(keys);
            if (this.stopOtherAnimations) {
                scene.stopAnimation(this._effectiveTarget);
            }
            var wrapper = function () {
                _this.onInterpolationDoneObservable.notifyObservers(_this);
                if (_this.onInterpolationDone) {
                    _this.onInterpolationDone();
                }
            };
            scene.beginDirectAnimation(this._effectiveTarget, [animation], 0, 100, false, 1, wrapper);
        };
        InterpolateValueAction.prototype.serialize = function (parent) {
            return _super.prototype._serialize.call(this, {
                name: "InterpolateValueAction",
                properties: [
                    BABYLON.Action._GetTargetProperty(this._target),
                    { name: "propertyPath", value: this.propertyPath },
                    { name: "value", value: BABYLON.Action._SerializeValueAsString(this.value) },
                    { name: "duration", value: BABYLON.Action._SerializeValueAsString(this.duration) },
                    { name: "stopOtherAnimations", value: BABYLON.Action._SerializeValueAsString(this.stopOtherAnimations) || false }
                ]
            }, parent);
        };
        return InterpolateValueAction;
    }(BABYLON.Action));
    BABYLON.InterpolateValueAction = InterpolateValueAction;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.interpolateValueAction.js.map


var BABYLON;
(function (BABYLON) {
    var SwitchBooleanAction = /** @class */ (function (_super) {
        __extends(SwitchBooleanAction, _super);
        function SwitchBooleanAction(triggerOptions, target, propertyPath, condition) {
            var _this = _super.call(this, triggerOptions, condition) || this;
            _this.propertyPath = propertyPath;
            _this._target = _this._effectiveTarget = target;
            return _this;
        }
        SwitchBooleanAction.prototype._prepare = function () {
            this._effectiveTarget = this._getEffectiveTarget(this._effectiveTarget, this.propertyPath);
            this._property = this._getProperty(this.propertyPath);
        };
        SwitchBooleanAction.prototype.execute = function () {
            this._effectiveTarget[this._property] = !this._effectiveTarget[this._property];
        };
        SwitchBooleanAction.prototype.serialize = function (parent) {
            return _super.prototype._serialize.call(this, {
                name: "SwitchBooleanAction",
                properties: [
                    BABYLON.Action._GetTargetProperty(this._target),
                    { name: "propertyPath", value: this.propertyPath }
                ]
            }, parent);
        };
        return SwitchBooleanAction;
    }(BABYLON.Action));
    BABYLON.SwitchBooleanAction = SwitchBooleanAction;
    var SetStateAction = /** @class */ (function (_super) {
        __extends(SetStateAction, _super);
        function SetStateAction(triggerOptions, target, value, condition) {
            var _this = _super.call(this, triggerOptions, condition) || this;
            _this.value = value;
            _this._target = target;
            return _this;
        }
        SetStateAction.prototype.execute = function () {
            this._target.state = this.value;
        };
        SetStateAction.prototype.serialize = function (parent) {
            return _super.prototype._serialize.call(this, {
                name: "SetStateAction",
                properties: [
                    BABYLON.Action._GetTargetProperty(this._target),
                    { name: "value", value: this.value }
                ]
            }, parent);
        };
        return SetStateAction;
    }(BABYLON.Action));
    BABYLON.SetStateAction = SetStateAction;
    var SetValueAction = /** @class */ (function (_super) {
        __extends(SetValueAction, _super);
        function SetValueAction(triggerOptions, target, propertyPath, value, condition) {
            var _this = _super.call(this, triggerOptions, condition) || this;
            _this.propertyPath = propertyPath;
            _this.value = value;
            _this._target = _this._effectiveTarget = target;
            return _this;
        }
        SetValueAction.prototype._prepare = function () {
            this._effectiveTarget = this._getEffectiveTarget(this._effectiveTarget, this.propertyPath);
            this._property = this._getProperty(this.propertyPath);
        };
        SetValueAction.prototype.execute = function () {
            this._effectiveTarget[this._property] = this.value;
            if (this._target.markAsDirty) {
                this._target.markAsDirty(this._property);
            }
        };
        SetValueAction.prototype.serialize = function (parent) {
            return _super.prototype._serialize.call(this, {
                name: "SetValueAction",
                properties: [
                    BABYLON.Action._GetTargetProperty(this._target),
                    { name: "propertyPath", value: this.propertyPath },
                    { name: "value", value: BABYLON.Action._SerializeValueAsString(this.value) }
                ]
            }, parent);
        };
        return SetValueAction;
    }(BABYLON.Action));
    BABYLON.SetValueAction = SetValueAction;
    var IncrementValueAction = /** @class */ (function (_super) {
        __extends(IncrementValueAction, _super);
        function IncrementValueAction(triggerOptions, target, propertyPath, value, condition) {
            var _this = _super.call(this, triggerOptions, condition) || this;
            _this.propertyPath = propertyPath;
            _this.value = value;
            _this._target = _this._effectiveTarget = target;
            return _this;
        }
        IncrementValueAction.prototype._prepare = function () {
            this._effectiveTarget = this._getEffectiveTarget(this._effectiveTarget, this.propertyPath);
            this._property = this._getProperty(this.propertyPath);
            if (typeof this._effectiveTarget[this._property] !== "number") {
                BABYLON.Tools.Warn("Warning: IncrementValueAction can only be used with number values");
            }
        };
        IncrementValueAction.prototype.execute = function () {
            this._effectiveTarget[this._property] += this.value;
            if (this._target.markAsDirty) {
                this._target.markAsDirty(this._property);
            }
        };
        IncrementValueAction.prototype.serialize = function (parent) {
            return _super.prototype._serialize.call(this, {
                name: "IncrementValueAction",
                properties: [
                    BABYLON.Action._GetTargetProperty(this._target),
                    { name: "propertyPath", value: this.propertyPath },
                    { name: "value", value: BABYLON.Action._SerializeValueAsString(this.value) }
                ]
            }, parent);
        };
        return IncrementValueAction;
    }(BABYLON.Action));
    BABYLON.IncrementValueAction = IncrementValueAction;
    var PlayAnimationAction = /** @class */ (function (_super) {
        __extends(PlayAnimationAction, _super);
        function PlayAnimationAction(triggerOptions, target, from, to, loop, condition) {
            var _this = _super.call(this, triggerOptions, condition) || this;
            _this.from = from;
            _this.to = to;
            _this.loop = loop;
            _this._target = target;
            return _this;
        }
        PlayAnimationAction.prototype._prepare = function () {
        };
        PlayAnimationAction.prototype.execute = function () {
            var scene = this._actionManager.getScene();
            scene.beginAnimation(this._target, this.from, this.to, this.loop);
        };
        PlayAnimationAction.prototype.serialize = function (parent) {
            return _super.prototype._serialize.call(this, {
                name: "PlayAnimationAction",
                properties: [
                    BABYLON.Action._GetTargetProperty(this._target),
                    { name: "from", value: String(this.from) },
                    { name: "to", value: String(this.to) },
                    { name: "loop", value: BABYLON.Action._SerializeValueAsString(this.loop) || false }
                ]
            }, parent);
        };
        return PlayAnimationAction;
    }(BABYLON.Action));
    BABYLON.PlayAnimationAction = PlayAnimationAction;
    var StopAnimationAction = /** @class */ (function (_super) {
        __extends(StopAnimationAction, _super);
        function StopAnimationAction(triggerOptions, target, condition) {
            var _this = _super.call(this, triggerOptions, condition) || this;
            _this._target = target;
            return _this;
        }
        StopAnimationAction.prototype._prepare = function () {
        };
        StopAnimationAction.prototype.execute = function () {
            var scene = this._actionManager.getScene();
            scene.stopAnimation(this._target);
        };
        StopAnimationAction.prototype.serialize = function (parent) {
            return _super.prototype._serialize.call(this, {
                name: "StopAnimationAction",
                properties: [BABYLON.Action._GetTargetProperty(this._target)]
            }, parent);
        };
        return StopAnimationAction;
    }(BABYLON.Action));
    BABYLON.StopAnimationAction = StopAnimationAction;
    var DoNothingAction = /** @class */ (function (_super) {
        __extends(DoNothingAction, _super);
        function DoNothingAction(triggerOptions, condition) {
            if (triggerOptions === void 0) { triggerOptions = BABYLON.ActionManager.NothingTrigger; }
            return _super.call(this, triggerOptions, condition) || this;
        }
        DoNothingAction.prototype.execute = function () {
        };
        DoNothingAction.prototype.serialize = function (parent) {
            return _super.prototype._serialize.call(this, {
                name: "DoNothingAction",
                properties: []
            }, parent);
        };
        return DoNothingAction;
    }(BABYLON.Action));
    BABYLON.DoNothingAction = DoNothingAction;
    var CombineAction = /** @class */ (function (_super) {
        __extends(CombineAction, _super);
        function CombineAction(triggerOptions, children, condition) {
            var _this = _super.call(this, triggerOptions, condition) || this;
            _this.children = children;
            return _this;
        }
        CombineAction.prototype._prepare = function () {
            for (var index = 0; index < this.children.length; index++) {
                this.children[index]._actionManager = this._actionManager;
                this.children[index]._prepare();
            }
        };
        CombineAction.prototype.execute = function (evt) {
            for (var index = 0; index < this.children.length; index++) {
                this.children[index].execute(evt);
            }
        };
        CombineAction.prototype.serialize = function (parent) {
            var serializationObject = _super.prototype._serialize.call(this, {
                name: "CombineAction",
                properties: [],
                combine: []
            }, parent);
            for (var i = 0; i < this.children.length; i++) {
                serializationObject.combine.push(this.children[i].serialize(null));
            }
            return serializationObject;
        };
        return CombineAction;
    }(BABYLON.Action));
    BABYLON.CombineAction = CombineAction;
    var ExecuteCodeAction = /** @class */ (function (_super) {
        __extends(ExecuteCodeAction, _super);
        function ExecuteCodeAction(triggerOptions, func, condition) {
            var _this = _super.call(this, triggerOptions, condition) || this;
            _this.func = func;
            return _this;
        }
        ExecuteCodeAction.prototype.execute = function (evt) {
            this.func(evt);
        };
        return ExecuteCodeAction;
    }(BABYLON.Action));
    BABYLON.ExecuteCodeAction = ExecuteCodeAction;
    var SetParentAction = /** @class */ (function (_super) {
        __extends(SetParentAction, _super);
        function SetParentAction(triggerOptions, target, parent, condition) {
            var _this = _super.call(this, triggerOptions, condition) || this;
            _this._target = target;
            _this._parent = parent;
            return _this;
        }
        SetParentAction.prototype._prepare = function () {
        };
        SetParentAction.prototype.execute = function () {
            if (this._target.parent === this._parent) {
                return;
            }
            var invertParentWorldMatrix = this._parent.getWorldMatrix().clone();
            invertParentWorldMatrix.invert();
            this._target.position = BABYLON.Vector3.TransformCoordinates(this._target.position, invertParentWorldMatrix);
            this._target.parent = this._parent;
        };
        SetParentAction.prototype.serialize = function (parent) {
            return _super.prototype._serialize.call(this, {
                name: "SetParentAction",
                properties: [
                    BABYLON.Action._GetTargetProperty(this._target),
                    BABYLON.Action._GetTargetProperty(this._parent),
                ]
            }, parent);
        };
        return SetParentAction;
    }(BABYLON.Action));
    BABYLON.SetParentAction = SetParentAction;
    var PlaySoundAction = /** @class */ (function (_super) {
        __extends(PlaySoundAction, _super);
        function PlaySoundAction(triggerOptions, sound, condition) {
            var _this = _super.call(this, triggerOptions, condition) || this;
            _this._sound = sound;
            return _this;
        }
        PlaySoundAction.prototype._prepare = function () {
        };
        PlaySoundAction.prototype.execute = function () {
            if (this._sound !== undefined)
                this._sound.play();
        };
        PlaySoundAction.prototype.serialize = function (parent) {
            return _super.prototype._serialize.call(this, {
                name: "PlaySoundAction",
                properties: [{ name: "sound", value: this._sound.name }]
            }, parent);
        };
        return PlaySoundAction;
    }(BABYLON.Action));
    BABYLON.PlaySoundAction = PlaySoundAction;
    var StopSoundAction = /** @class */ (function (_super) {
        __extends(StopSoundAction, _super);
        function StopSoundAction(triggerOptions, sound, condition) {
            var _this = _super.call(this, triggerOptions, condition) || this;
            _this._sound = sound;
            return _this;
        }
        StopSoundAction.prototype._prepare = function () {
        };
        StopSoundAction.prototype.execute = function () {
            if (this._sound !== undefined)
                this._sound.stop();
        };
        StopSoundAction.prototype.serialize = function (parent) {
            return _super.prototype._serialize.call(this, {
                name: "StopSoundAction",
                properties: [{ name: "sound", value: this._sound.name }]
            }, parent);
        };
        return StopSoundAction;
    }(BABYLON.Action));
    BABYLON.StopSoundAction = StopSoundAction;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.directActions.js.map

BABYLON.Effect.IncludesShadersStore['depthPrePass'] = "#ifdef DEPTHPREPASS\ngl_FragColor=vec4(0.,0.,0.,1.0);\nreturn;\n#endif";
BABYLON.Effect.IncludesShadersStore['bonesDeclaration'] = "#if NUM_BONE_INFLUENCERS>0\nuniform mat4 mBones[BonesPerMesh];\nattribute vec4 matricesIndices;\nattribute vec4 matricesWeights;\n#if NUM_BONE_INFLUENCERS>4\nattribute vec4 matricesIndicesExtra;\nattribute vec4 matricesWeightsExtra;\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['instancesDeclaration'] = "#ifdef INSTANCES\nattribute vec4 world0;\nattribute vec4 world1;\nattribute vec4 world2;\nattribute vec4 world3;\n#else\nuniform mat4 world;\n#endif";
BABYLON.Effect.IncludesShadersStore['pointCloudVertexDeclaration'] = "#ifdef POINTSIZE\nuniform float pointSize;\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpVertexDeclaration'] = "#if defined(BUMP) || defined(PARALLAX)\n#if defined(TANGENT) && defined(NORMAL) \nvarying mat3 vTBN;\n#endif\n#endif\n";
BABYLON.Effect.IncludesShadersStore['clipPlaneVertexDeclaration'] = "#ifdef CLIPPLANE\nuniform vec4 vClipPlane;\nvarying float fClipDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogVertexDeclaration'] = "#ifdef FOG\nvarying vec3 vFogDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertexGlobalDeclaration'] = "#ifdef MORPHTARGETS\nuniform float morphTargetInfluences[NUM_MORPH_INFLUENCERS];\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertexDeclaration'] = "#ifdef MORPHTARGETS\nattribute vec3 position{X};\n#ifdef MORPHTARGETS_NORMAL\nattribute vec3 normal{X};\n#endif\n#ifdef MORPHTARGETS_TANGENT\nattribute vec3 tangent{X};\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthDeclaration'] = "#ifdef LOGARITHMICDEPTH\nuniform float logarithmicDepthConstant;\nvarying float vFragmentDepth;\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertex'] = "#ifdef MORPHTARGETS\npositionUpdated+=(position{X}-position)*morphTargetInfluences[{X}];\n#ifdef MORPHTARGETS_NORMAL\nnormalUpdated+=(normal{X}-normal)*morphTargetInfluences[{X}];\n#endif\n#ifdef MORPHTARGETS_TANGENT\ntangentUpdated.xyz+=(tangent{X}-tangent.xyz)*morphTargetInfluences[{X}];\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['instancesVertex'] = "#ifdef INSTANCES\nmat4 finalWorld=mat4(world0,world1,world2,world3);\n#else\nmat4 finalWorld=world;\n#endif";
BABYLON.Effect.IncludesShadersStore['bonesVertex'] = "#if NUM_BONE_INFLUENCERS>0\nmat4 influence;\ninfluence=mBones[int(matricesIndices[0])]*matricesWeights[0];\n#if NUM_BONE_INFLUENCERS>1\ninfluence+=mBones[int(matricesIndices[1])]*matricesWeights[1];\n#endif \n#if NUM_BONE_INFLUENCERS>2\ninfluence+=mBones[int(matricesIndices[2])]*matricesWeights[2];\n#endif \n#if NUM_BONE_INFLUENCERS>3\ninfluence+=mBones[int(matricesIndices[3])]*matricesWeights[3];\n#endif \n#if NUM_BONE_INFLUENCERS>4\ninfluence+=mBones[int(matricesIndicesExtra[0])]*matricesWeightsExtra[0];\n#endif \n#if NUM_BONE_INFLUENCERS>5\ninfluence+=mBones[int(matricesIndicesExtra[1])]*matricesWeightsExtra[1];\n#endif \n#if NUM_BONE_INFLUENCERS>6\ninfluence+=mBones[int(matricesIndicesExtra[2])]*matricesWeightsExtra[2];\n#endif \n#if NUM_BONE_INFLUENCERS>7\ninfluence+=mBones[int(matricesIndicesExtra[3])]*matricesWeightsExtra[3];\n#endif \nfinalWorld=finalWorld*influence;\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpVertex'] = "#if defined(BUMP) || defined(PARALLAX)\n#if defined(TANGENT) && defined(NORMAL)\nvec3 tbnNormal=normalize(normalUpdated);\nvec3 tbnTangent=normalize(tangentUpdated.xyz);\nvec3 tbnBitangent=cross(tbnNormal,tbnTangent)*tangentUpdated.w;\nvTBN=mat3(finalWorld)*mat3(tbnTangent,tbnBitangent,tbnNormal);\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneVertex'] = "#ifdef CLIPPLANE\nfClipDistance=dot(worldPos,vClipPlane);\n#endif";
BABYLON.Effect.IncludesShadersStore['fogVertex'] = "#ifdef FOG\nvFogDistance=(view*worldPos).xyz;\n#endif";
BABYLON.Effect.IncludesShadersStore['shadowsVertex'] = "#ifdef SHADOWS\n#if defined(SHADOW{X}) && !defined(SHADOWCUBE{X})\nvPositionFromLight{X}=lightMatrix{X}*worldPos;\nvDepthMetric{X}=((vPositionFromLight{X}.z+light{X}.depthValues.x)/(light{X}.depthValues.y));\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['pointCloudVertex'] = "#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthVertex'] = "#ifdef LOGARITHMICDEPTH\nvFragmentDepth=1.0+gl_Position.w;\ngl_Position.z=log2(max(0.000001,vFragmentDepth))*logarithmicDepthConstant;\n#endif";
BABYLON.Effect.IncludesShadersStore['helperFunctions'] = "const float PI=3.1415926535897932384626433832795;\nconst float LinearEncodePowerApprox=2.2;\nconst float GammaEncodePowerApprox=1.0/LinearEncodePowerApprox;\nconst vec3 LuminanceEncodeApprox=vec3(0.2126,0.7152,0.0722);\nmat3 transposeMat3(mat3 inMatrix) {\nvec3 i0=inMatrix[0];\nvec3 i1=inMatrix[1];\nvec3 i2=inMatrix[2];\nmat3 outMatrix=mat3(\nvec3(i0.x,i1.x,i2.x),\nvec3(i0.y,i1.y,i2.y),\nvec3(i0.z,i1.z,i2.z)\n);\nreturn outMatrix;\n}\n\nmat3 inverseMat3(mat3 inMatrix) {\nfloat a00=inMatrix[0][0],a01=inMatrix[0][1],a02=inMatrix[0][2];\nfloat a10=inMatrix[1][0],a11=inMatrix[1][1],a12=inMatrix[1][2];\nfloat a20=inMatrix[2][0],a21=inMatrix[2][1],a22=inMatrix[2][2];\nfloat b01=a22*a11-a12*a21;\nfloat b11=-a22*a10+a12*a20;\nfloat b21=a21*a10-a11*a20;\nfloat det=a00*b01+a01*b11+a02*b21;\nreturn mat3(b01,(-a22*a01+a02*a21),(a12*a01-a02*a11),\nb11,(a22*a00-a02*a20),(-a12*a00+a02*a10),\nb21,(-a21*a00+a01*a20),(a11*a00-a01*a10))/det;\n}\nfloat computeFallOff(float value,vec2 clipSpace,float frustumEdgeFalloff)\n{\nfloat mask=smoothstep(1.0-frustumEdgeFalloff,1.0,clamp(dot(clipSpace,clipSpace),0.,1.));\nreturn mix(value,1.0,mask);\n}\nvec3 applyEaseInOut(vec3 x){\nreturn x*x*(3.0-2.0*x);\n}\nvec3 toLinearSpace(vec3 color)\n{\nreturn pow(color,vec3(LinearEncodePowerApprox));\n}\nvec3 toGammaSpace(vec3 color)\n{\nreturn pow(color,vec3(GammaEncodePowerApprox));\n}\nfloat square(float value)\n{\nreturn value*value;\n}\nfloat getLuminance(vec3 color)\n{\nreturn clamp(dot(color,LuminanceEncodeApprox),0.,1.);\n}\n\nfloat getRand(vec2 seed) {\nreturn fract(sin(dot(seed.xy ,vec2(12.9898,78.233)))*43758.5453);\n}\nvec3 dither(vec2 seed,vec3 color) {\nfloat rand=getRand(seed);\ncolor+=mix(-0.5/255.0,0.5/255.0,rand);\ncolor=max(color,0.0);\nreturn color;\n}";
BABYLON.Effect.IncludesShadersStore['lightFragmentDeclaration'] = "#ifdef LIGHT{X}\nuniform vec4 vLightData{X};\nuniform vec4 vLightDiffuse{X};\n#ifdef SPECULARTERM\nuniform vec3 vLightSpecular{X};\n#else\nvec3 vLightSpecular{X}=vec3(0.);\n#endif\n#ifdef SHADOW{X}\n#if defined(SHADOWCUBE{X})\nuniform samplerCube shadowSampler{X};\n#else\nvarying vec4 vPositionFromLight{X};\nvarying float vDepthMetric{X};\nuniform sampler2D shadowSampler{X};\nuniform mat4 lightMatrix{X};\n#endif\nuniform vec4 shadowsInfo{X};\nuniform vec2 depthValues{X};\n#endif\n#ifdef SPOTLIGHT{X}\nuniform vec4 vLightDirection{X};\n#endif\n#ifdef HEMILIGHT{X}\nuniform vec3 vLightGround{X};\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['lightsFragmentFunctions'] = "\nstruct lightingInfo\n{\nvec3 diffuse;\n#ifdef SPECULARTERM\nvec3 specular;\n#endif\n#ifdef NDOTL\nfloat ndl;\n#endif\n};\nlightingInfo computeLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,float range,float glossiness) {\nlightingInfo result;\nvec3 lightVectorW;\nfloat attenuation=1.0;\nif (lightData.w == 0.)\n{\nvec3 direction=lightData.xyz-vPositionW;\nattenuation=max(0.,1.0-length(direction)/range);\nlightVectorW=normalize(direction);\n}\nelse\n{\nlightVectorW=normalize(-lightData.xyz);\n}\n\nfloat ndl=max(0.,dot(vNormal,lightVectorW));\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=ndl*diffuseColor*attenuation;\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightVectorW);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor*attenuation;\n#endif\nreturn result;\n}\nlightingInfo computeSpotLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec4 lightDirection,vec3 diffuseColor,vec3 specularColor,float range,float glossiness) {\nlightingInfo result;\nvec3 direction=lightData.xyz-vPositionW;\nvec3 lightVectorW=normalize(direction);\nfloat attenuation=max(0.,1.0-length(direction)/range);\n\nfloat cosAngle=max(0.,dot(lightDirection.xyz,-lightVectorW));\nif (cosAngle>=lightDirection.w)\n{\ncosAngle=max(0.,pow(cosAngle,lightData.w));\nattenuation*=cosAngle;\n\nfloat ndl=max(0.,dot(vNormal,lightVectorW));\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=ndl*diffuseColor*attenuation;\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightVectorW);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor*attenuation;\n#endif\nreturn result;\n}\nresult.diffuse=vec3(0.);\n#ifdef SPECULARTERM\nresult.specular=vec3(0.);\n#endif\n#ifdef NDOTL\nresult.ndl=0.;\n#endif\nreturn result;\n}\nlightingInfo computeHemisphericLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,vec3 groundColor,float glossiness) {\nlightingInfo result;\n\nfloat ndl=dot(vNormal,lightData.xyz)*0.5+0.5;\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=mix(groundColor,diffuseColor,ndl);\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightData.xyz);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor;\n#endif\nreturn result;\n}\n";
BABYLON.Effect.IncludesShadersStore['lightUboDeclaration'] = "#ifdef LIGHT{X}\nuniform Light{X}\n{\nvec4 vLightData;\nvec4 vLightDiffuse;\nvec3 vLightSpecular;\n#ifdef SPOTLIGHT{X}\nvec4 vLightDirection;\n#endif\n#ifdef HEMILIGHT{X}\nvec3 vLightGround;\n#endif\nvec4 shadowsInfo;\nvec2 depthValues;\n} light{X};\n#ifdef SHADOW{X}\n#if defined(SHADOWCUBE{X})\nuniform samplerCube shadowSampler{X};\n#else\nvarying vec4 vPositionFromLight{X};\nvarying float vDepthMetric{X};\nuniform sampler2D shadowSampler{X};\nuniform mat4 lightMatrix{X};\n#endif\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['defaultVertexDeclaration'] = "\nuniform mat4 viewProjection;\nuniform mat4 view;\n#ifdef DIFFUSE\nuniform mat4 diffuseMatrix;\nuniform vec2 vDiffuseInfos;\n#endif\n#ifdef AMBIENT\nuniform mat4 ambientMatrix;\nuniform vec2 vAmbientInfos;\n#endif\n#ifdef OPACITY\nuniform mat4 opacityMatrix;\nuniform vec2 vOpacityInfos;\n#endif\n#ifdef EMISSIVE\nuniform vec2 vEmissiveInfos;\nuniform mat4 emissiveMatrix;\n#endif\n#ifdef LIGHTMAP\nuniform vec2 vLightmapInfos;\nuniform mat4 lightmapMatrix;\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\nuniform vec2 vSpecularInfos;\nuniform mat4 specularMatrix;\n#endif\n#ifdef BUMP\nuniform vec3 vBumpInfos;\nuniform mat4 bumpMatrix;\n#endif\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n";
BABYLON.Effect.IncludesShadersStore['defaultFragmentDeclaration'] = "uniform vec4 vDiffuseColor;\n#ifdef SPECULARTERM\nuniform vec4 vSpecularColor;\n#endif\nuniform vec3 vEmissiveColor;\n\n#ifdef DIFFUSE\nuniform vec2 vDiffuseInfos;\n#endif\n#ifdef AMBIENT\nuniform vec2 vAmbientInfos;\n#endif\n#ifdef OPACITY \nuniform vec2 vOpacityInfos;\n#endif\n#ifdef EMISSIVE\nuniform vec2 vEmissiveInfos;\n#endif\n#ifdef LIGHTMAP\nuniform vec2 vLightmapInfos;\n#endif\n#ifdef BUMP\nuniform vec3 vBumpInfos;\nuniform vec2 vTangentSpaceParams;\n#endif\n#if defined(REFLECTIONMAP_SPHERICAL) || defined(REFLECTIONMAP_PROJECTION) || defined(REFRACTION)\nuniform mat4 view;\n#endif\n#ifdef REFRACTION\nuniform vec4 vRefractionInfos;\n#ifndef REFRACTIONMAP_3D\nuniform mat4 refractionMatrix;\n#endif\n#ifdef REFRACTIONFRESNEL\nuniform vec4 refractionLeftColor;\nuniform vec4 refractionRightColor;\n#endif\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\nuniform vec2 vSpecularInfos;\n#endif\n#ifdef DIFFUSEFRESNEL\nuniform vec4 diffuseLeftColor;\nuniform vec4 diffuseRightColor;\n#endif\n#ifdef OPACITYFRESNEL\nuniform vec4 opacityParts;\n#endif\n#ifdef EMISSIVEFRESNEL\nuniform vec4 emissiveLeftColor;\nuniform vec4 emissiveRightColor;\n#endif\n\n#ifdef REFLECTION\nuniform vec2 vReflectionInfos;\n#ifdef REFLECTIONMAP_SKYBOX\n#else\n#if defined(REFLECTIONMAP_PLANAR) || defined(REFLECTIONMAP_CUBIC) || defined(REFLECTIONMAP_PROJECTION)\nuniform mat4 reflectionMatrix;\n#endif\n#endif\n#ifdef REFLECTIONFRESNEL\nuniform vec4 reflectionLeftColor;\nuniform vec4 reflectionRightColor;\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['defaultUboDeclaration'] = "layout(std140,column_major) uniform;\nuniform Material\n{\nvec4 diffuseLeftColor;\nvec4 diffuseRightColor;\nvec4 opacityParts;\nvec4 reflectionLeftColor;\nvec4 reflectionRightColor;\nvec4 refractionLeftColor;\nvec4 refractionRightColor;\nvec4 emissiveLeftColor; \nvec4 emissiveRightColor;\nvec2 vDiffuseInfos;\nvec2 vAmbientInfos;\nvec2 vOpacityInfos;\nvec2 vReflectionInfos;\nvec2 vEmissiveInfos;\nvec2 vLightmapInfos;\nvec2 vSpecularInfos;\nvec3 vBumpInfos;\nmat4 diffuseMatrix;\nmat4 ambientMatrix;\nmat4 opacityMatrix;\nmat4 reflectionMatrix;\nmat4 emissiveMatrix;\nmat4 lightmapMatrix;\nmat4 specularMatrix;\nmat4 bumpMatrix; \nvec4 vTangentSpaceParams;\nmat4 refractionMatrix;\nvec4 vRefractionInfos;\nvec4 vSpecularColor;\nvec3 vEmissiveColor;\nvec4 vDiffuseColor;\nfloat pointSize; \n};\nuniform Scene {\nmat4 viewProjection;\nmat4 view;\n};";
BABYLON.Effect.IncludesShadersStore['shadowsFragmentFunctions'] = "#ifdef SHADOWS\n#ifndef SHADOWFLOAT\nfloat unpack(vec4 color)\n{\nconst vec4 bit_shift=vec4(1.0/(255.0*255.0*255.0),1.0/(255.0*255.0),1.0/255.0,1.0);\nreturn dot(color,bit_shift);\n}\n#endif\nfloat computeShadowCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\ndepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadow=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadow=textureCube(shadowSampler,directionToLight).x;\n#endif\nif (depth>shadow)\n{\nreturn darkness;\n}\nreturn 1.0;\n}\nfloat computeShadowWithPCFCube(vec3 lightPosition,samplerCube shadowSampler,float mapSize,float darkness,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\ndepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\nfloat visibility=1.;\nvec3 poissonDisk[4];\npoissonDisk[0]=vec3(-1.0,1.0,-1.0);\npoissonDisk[1]=vec3(1.0,-1.0,-1.0);\npoissonDisk[2]=vec3(-1.0,-1.0,-1.0);\npoissonDisk[3]=vec3(1.0,-1.0,1.0);\n\n#ifndef SHADOWFLOAT\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[0]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[1]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[2]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[3]*mapSize))<depth) visibility-=0.25;\n#else\nif (textureCube(shadowSampler,directionToLight+poissonDisk[0]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[1]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[2]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[3]*mapSize).x<depth) visibility-=0.25;\n#endif\nreturn min(1.0,visibility+darkness);\n}\nfloat computeShadowWithESMCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,float depthScale,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\nfloat shadowPixelDepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadowMapSample=textureCube(shadowSampler,directionToLight).x;\n#endif\nfloat esm=1.0-clamp(exp(min(87.,depthScale*shadowPixelDepth))*shadowMapSample,0.,1.-darkness); \nreturn esm;\n}\nfloat computeShadowWithCloseESMCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,float depthScale,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\nfloat shadowPixelDepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadowMapSample=textureCube(shadowSampler,directionToLight).x;\n#endif\nfloat esm=clamp(exp(min(87.,-depthScale*(shadowPixelDepth-shadowMapSample))),darkness,1.);\nreturn esm;\n}\nfloat computeShadow(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\n#ifndef SHADOWFLOAT\nfloat shadow=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadow=texture2D(shadowSampler,uv).x;\n#endif\nif (shadowPixelDepth>shadow)\n{\nreturn computeFallOff(darkness,clipSpace.xy,frustumEdgeFalloff);\n}\nreturn 1.;\n}\nfloat computeShadowWithPCF(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float mapSize,float darkness,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\nfloat visibility=1.;\nvec2 poissonDisk[4];\npoissonDisk[0]=vec2(-0.94201624,-0.39906216);\npoissonDisk[1]=vec2(0.94558609,-0.76890725);\npoissonDisk[2]=vec2(-0.094184101,-0.92938870);\npoissonDisk[3]=vec2(0.34495938,0.29387760);\n\n#ifndef SHADOWFLOAT\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[0]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[1]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[2]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[3]*mapSize))<shadowPixelDepth) visibility-=0.25;\n#else\nif (texture2D(shadowSampler,uv+poissonDisk[0]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[1]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[2]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[3]*mapSize).x<shadowPixelDepth) visibility-=0.25;\n#endif\nreturn computeFallOff(min(1.0,visibility+darkness),clipSpace.xy,frustumEdgeFalloff);\n}\nfloat computeShadowWithESM(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float depthScale,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadowMapSample=texture2D(shadowSampler,uv).x;\n#endif\nfloat esm=1.0-clamp(exp(min(87.,depthScale*shadowPixelDepth))*shadowMapSample,0.,1.-darkness);\nreturn computeFallOff(esm,clipSpace.xy,frustumEdgeFalloff);\n}\nfloat computeShadowWithCloseESM(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float depthScale,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0); \n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadowMapSample=texture2D(shadowSampler,uv).x;\n#endif\nfloat esm=clamp(exp(min(87.,-depthScale*(shadowPixelDepth-shadowMapSample))),darkness,1.);\nreturn computeFallOff(esm,clipSpace.xy,frustumEdgeFalloff);\n}\n#endif\n";
BABYLON.Effect.IncludesShadersStore['fresnelFunction'] = "#ifdef FRESNEL\nfloat computeFresnelTerm(vec3 viewDirection,vec3 worldNormal,float bias,float power)\n{\nfloat fresnelTerm=pow(bias+abs(dot(viewDirection,worldNormal)),power);\nreturn clamp(fresnelTerm,0.,1.);\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['reflectionFunction'] = "vec3 computeReflectionCoords(vec4 worldPos,vec3 worldNormal)\n{\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvec3 direction=normalize(vDirectionW);\nfloat t=clamp(direction.y*-0.5+0.5,0.,1.0);\nfloat s=atan(direction.z,direction.x)*RECIPROCAL_PI2+0.5;\n#ifdef REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED\nreturn vec3(1.0-s,t,0);\n#else\nreturn vec3(s,t,0);\n#endif\n#endif\n#ifdef REFLECTIONMAP_EQUIRECTANGULAR\nvec3 cameraToVertex=normalize(worldPos.xyz-vEyePosition.xyz);\nvec3 r=reflect(cameraToVertex,worldNormal);\nfloat t=clamp(r.y*-0.5+0.5,0.,1.0);\nfloat s=atan(r.z,r.x)*RECIPROCAL_PI2+0.5;\nreturn vec3(s,t,0);\n#endif\n#ifdef REFLECTIONMAP_SPHERICAL\nvec3 viewDir=normalize(vec3(view*worldPos));\nvec3 viewNormal=normalize(vec3(view*vec4(worldNormal,0.0)));\nvec3 r=reflect(viewDir,viewNormal);\nr.z=r.z-1.0;\nfloat m=2.0*length(r);\nreturn vec3(r.x/m+0.5,1.0-r.y/m-0.5,0);\n#endif\n#ifdef REFLECTIONMAP_PLANAR\nvec3 viewDir=worldPos.xyz-vEyePosition.xyz;\nvec3 coords=normalize(reflect(viewDir,worldNormal));\nreturn vec3(reflectionMatrix*vec4(coords,1));\n#endif\n#ifdef REFLECTIONMAP_CUBIC\nvec3 viewDir=worldPos.xyz-vEyePosition.xyz;\nvec3 coords=reflect(viewDir,worldNormal);\n#ifdef INVERTCUBICMAP\ncoords.y=1.0-coords.y;\n#endif\nreturn vec3(reflectionMatrix*vec4(coords,0));\n#endif\n#ifdef REFLECTIONMAP_PROJECTION\nreturn vec3(reflectionMatrix*(view*worldPos));\n#endif\n#ifdef REFLECTIONMAP_SKYBOX\nreturn vPositionUVW;\n#endif\n#ifdef REFLECTIONMAP_EXPLICIT\nreturn vec3(0,0,0);\n#endif\n}";
BABYLON.Effect.IncludesShadersStore['imageProcessingDeclaration'] = "#ifdef EXPOSURE\nuniform float exposureLinear;\n#endif\n#ifdef CONTRAST\nuniform float contrast;\n#endif\n#ifdef VIGNETTE\nuniform vec2 vInverseScreenSize;\nuniform vec4 vignetteSettings1;\nuniform vec4 vignetteSettings2;\n#endif\n#ifdef COLORCURVES\nuniform vec4 vCameraColorCurveNegative;\nuniform vec4 vCameraColorCurveNeutral;\nuniform vec4 vCameraColorCurvePositive;\n#endif\n#ifdef COLORGRADING\n#ifdef COLORGRADING3D\nuniform highp sampler3D txColorTransform;\n#else\nuniform sampler2D txColorTransform;\n#endif\nuniform vec4 colorTransformSettings;\n#endif";
BABYLON.Effect.IncludesShadersStore['imageProcessingFunctions'] = "#if defined(COLORGRADING) && !defined(COLORGRADING3D)\n\nvec3 sampleTexture3D(sampler2D colorTransform,vec3 color,vec2 sampler3dSetting)\n{\nfloat sliceSize=2.0*sampler3dSetting.x; \n#ifdef SAMPLER3DGREENDEPTH\nfloat sliceContinuous=(color.g-sampler3dSetting.x)*sampler3dSetting.y;\n#else\nfloat sliceContinuous=(color.b-sampler3dSetting.x)*sampler3dSetting.y;\n#endif\nfloat sliceInteger=floor(sliceContinuous);\n\n\nfloat sliceFraction=sliceContinuous-sliceInteger;\n#ifdef SAMPLER3DGREENDEPTH\nvec2 sliceUV=color.rb;\n#else\nvec2 sliceUV=color.rg;\n#endif\nsliceUV.x*=sliceSize;\nsliceUV.x+=sliceInteger*sliceSize;\nsliceUV=clamp(sliceUV,0.,1.);\nvec4 slice0Color=texture2D(colorTransform,sliceUV);\nsliceUV.x+=sliceSize;\nsliceUV=clamp(sliceUV,0.,1.);\nvec4 slice1Color=texture2D(colorTransform,sliceUV);\nvec3 result=mix(slice0Color.rgb,slice1Color.rgb,sliceFraction);\n#ifdef SAMPLER3DBGRMAP\ncolor.rgb=result.rgb;\n#else\ncolor.rgb=result.bgr;\n#endif\nreturn color;\n}\n#endif\nvec4 applyImageProcessing(vec4 result) {\n#ifdef EXPOSURE\nresult.rgb*=exposureLinear;\n#endif\n#ifdef VIGNETTE\n\nvec2 viewportXY=gl_FragCoord.xy*vInverseScreenSize;\nviewportXY=viewportXY*2.0-1.0;\nvec3 vignetteXY1=vec3(viewportXY*vignetteSettings1.xy+vignetteSettings1.zw,1.0);\nfloat vignetteTerm=dot(vignetteXY1,vignetteXY1);\nfloat vignette=pow(vignetteTerm,vignetteSettings2.w);\n\nvec3 vignetteColor=vignetteSettings2.rgb;\n#ifdef VIGNETTEBLENDMODEMULTIPLY\nvec3 vignetteColorMultiplier=mix(vignetteColor,vec3(1,1,1),vignette);\nresult.rgb*=vignetteColorMultiplier;\n#endif\n#ifdef VIGNETTEBLENDMODEOPAQUE\nresult.rgb=mix(vignetteColor,result.rgb,vignette);\n#endif\n#endif\n#ifdef TONEMAPPING\nconst float tonemappingCalibration=1.590579;\nresult.rgb=1.0-exp2(-tonemappingCalibration*result.rgb);\n#endif\n\nresult.rgb=toGammaSpace(result.rgb);\nresult.rgb=clamp(result.rgb,0.0,1.0);\n#ifdef CONTRAST\n\nvec3 resultHighContrast=applyEaseInOut(result.rgb);\nif (contrast<1.0) {\n\nresult.rgb=mix(vec3(0.5,0.5,0.5),result.rgb,contrast);\n} else {\n\nresult.rgb=mix(result.rgb,resultHighContrast,contrast-1.0);\n}\n#endif\n\n#ifdef COLORGRADING\nvec3 colorTransformInput=result.rgb*colorTransformSettings.xxx+colorTransformSettings.yyy;\n#ifdef COLORGRADING3D\nvec3 colorTransformOutput=texture(txColorTransform,colorTransformInput).rgb;\n#else\nvec3 colorTransformOutput=sampleTexture3D(txColorTransform,colorTransformInput,colorTransformSettings.yz).rgb;\n#endif\nresult.rgb=mix(result.rgb,colorTransformOutput,colorTransformSettings.www);\n#endif\n#ifdef COLORCURVES\n\nfloat luma=getLuminance(result.rgb);\nvec2 curveMix=clamp(vec2(luma*3.0-1.5,luma*-3.0+1.5),vec2(0.0),vec2(1.0));\nvec4 colorCurve=vCameraColorCurveNeutral+curveMix.x*vCameraColorCurvePositive-curveMix.y*vCameraColorCurveNegative;\nresult.rgb*=colorCurve.rgb;\nresult.rgb=mix(vec3(luma),result.rgb,colorCurve.a);\n#endif\nreturn result;\n}";
BABYLON.Effect.IncludesShadersStore['bumpFragmentFunctions'] = "#ifdef BUMP\n#if BUMPDIRECTUV == 1\n#define vBumpUV vMainUV1\n#elif BUMPDIRECTUV == 2\n#define vBumpUV vMainUV2\n#else\nvarying vec2 vBumpUV;\n#endif\nuniform sampler2D bumpSampler;\n#if defined(TANGENT) && defined(NORMAL) \nvarying mat3 vTBN;\n#endif\n\nmat3 cotangent_frame(vec3 normal,vec3 p,vec2 uv)\n{\n\nuv=gl_FrontFacing ? uv : -uv;\n\nvec3 dp1=dFdx(p);\nvec3 dp2=dFdy(p);\nvec2 duv1=dFdx(uv);\nvec2 duv2=dFdy(uv);\n\nvec3 dp2perp=cross(dp2,normal);\nvec3 dp1perp=cross(normal,dp1);\nvec3 tangent=dp2perp*duv1.x+dp1perp*duv2.x;\nvec3 bitangent=dp2perp*duv1.y+dp1perp*duv2.y;\n\ntangent*=vTangentSpaceParams.x;\nbitangent*=vTangentSpaceParams.y;\n\nfloat invmax=inversesqrt(max(dot(tangent,tangent),dot(bitangent,bitangent)));\nreturn mat3(tangent*invmax,bitangent*invmax,normal);\n}\nvec3 perturbNormal(mat3 cotangentFrame,vec2 uv)\n{\nvec3 map=texture2D(bumpSampler,uv).xyz;\nmap=map*2.0-1.0;\n#ifdef NORMALXYSCALE\nmap=normalize(map*vec3(vBumpInfos.y,vBumpInfos.y,1.0));\n#endif\nreturn normalize(cotangentFrame*map);\n}\n#ifdef PARALLAX\nconst float minSamples=4.;\nconst float maxSamples=15.;\nconst int iMaxSamples=15;\n\nvec2 parallaxOcclusion(vec3 vViewDirCoT,vec3 vNormalCoT,vec2 texCoord,float parallaxScale) {\nfloat parallaxLimit=length(vViewDirCoT.xy)/vViewDirCoT.z;\nparallaxLimit*=parallaxScale;\nvec2 vOffsetDir=normalize(vViewDirCoT.xy);\nvec2 vMaxOffset=vOffsetDir*parallaxLimit;\nfloat numSamples=maxSamples+(dot(vViewDirCoT,vNormalCoT)*(minSamples-maxSamples));\nfloat stepSize=1.0/numSamples;\n\nfloat currRayHeight=1.0;\nvec2 vCurrOffset=vec2(0,0);\nvec2 vLastOffset=vec2(0,0);\nfloat lastSampledHeight=1.0;\nfloat currSampledHeight=1.0;\nfor (int i=0; i<iMaxSamples; i++)\n{\ncurrSampledHeight=texture2D(bumpSampler,vBumpUV+vCurrOffset).w;\n\nif (currSampledHeight>currRayHeight)\n{\nfloat delta1=currSampledHeight-currRayHeight;\nfloat delta2=(currRayHeight+stepSize)-lastSampledHeight;\nfloat ratio=delta1/(delta1+delta2);\nvCurrOffset=(ratio)* vLastOffset+(1.0-ratio)*vCurrOffset;\n\nbreak;\n}\nelse\n{\ncurrRayHeight-=stepSize;\nvLastOffset=vCurrOffset;\nvCurrOffset+=stepSize*vMaxOffset;\nlastSampledHeight=currSampledHeight;\n}\n}\nreturn vCurrOffset;\n}\nvec2 parallaxOffset(vec3 viewDir,float heightScale)\n{\n\nfloat height=texture2D(bumpSampler,vBumpUV).w;\nvec2 texCoordOffset=heightScale*viewDir.xy*height;\nreturn -texCoordOffset;\n}\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneFragmentDeclaration'] = "#ifdef CLIPPLANE\nvarying float fClipDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogFragmentDeclaration'] = "#ifdef FOG\n#define FOGMODE_NONE 0.\n#define FOGMODE_EXP 1.\n#define FOGMODE_EXP2 2.\n#define FOGMODE_LINEAR 3.\n#define E 2.71828\nuniform vec4 vFogInfos;\nuniform vec3 vFogColor;\nvarying vec3 vFogDistance;\nfloat CalcFogFactor()\n{\nfloat fogCoeff=1.0;\nfloat fogStart=vFogInfos.y;\nfloat fogEnd=vFogInfos.z;\nfloat fogDensity=vFogInfos.w;\nfloat fogDistance=length(vFogDistance);\nif (FOGMODE_LINEAR == vFogInfos.x)\n{\nfogCoeff=(fogEnd-fogDistance)/(fogEnd-fogStart);\n}\nelse if (FOGMODE_EXP == vFogInfos.x)\n{\nfogCoeff=1.0/pow(E,fogDistance*fogDensity);\n}\nelse if (FOGMODE_EXP2 == vFogInfos.x)\n{\nfogCoeff=1.0/pow(E,fogDistance*fogDistance*fogDensity*fogDensity);\n}\nreturn clamp(fogCoeff,0.0,1.0);\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneFragment'] = "#ifdef CLIPPLANE\nif (fClipDistance>0.0)\n{\ndiscard;\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpFragment'] = "vec2 uvOffset=vec2(0.0,0.0);\n#if defined(BUMP) || defined(PARALLAX)\n#ifdef NORMALXYSCALE\nfloat normalScale=1.0;\n#else \nfloat normalScale=vBumpInfos.y;\n#endif\n#if defined(TANGENT) && defined(NORMAL)\nmat3 TBN=vTBN;\n#else\nmat3 TBN=cotangent_frame(normalW*normalScale,vPositionW,vBumpUV);\n#endif\n#endif\n#ifdef PARALLAX\nmat3 invTBN=transposeMat3(TBN);\n#ifdef PARALLAXOCCLUSION\nuvOffset=parallaxOcclusion(invTBN*-viewDirectionW,invTBN*normalW,vBumpUV,vBumpInfos.z);\n#else\nuvOffset=parallaxOffset(invTBN*viewDirectionW,vBumpInfos.z);\n#endif\n#endif\n#ifdef BUMP\nnormalW=perturbNormal(TBN,vBumpUV+uvOffset);\n#endif";
BABYLON.Effect.IncludesShadersStore['lightFragment'] = "#ifdef LIGHT{X}\n#if defined(SHADOWONLY) || (defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X}) && defined(LIGHTMAPNOSPECULAR{X}))\n\n#else\n#ifdef PBR\n#ifdef SPOTLIGHT{X}\ninfo=computeSpotLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDirection,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#ifdef HEMILIGHT{X}\ninfo=computeHemisphericLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightGround,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#if defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})\ninfo=computeLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#else\n#ifdef SPOTLIGHT{X}\ninfo=computeSpotLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDirection,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,glossiness);\n#endif\n#ifdef HEMILIGHT{X}\ninfo=computeHemisphericLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightGround,glossiness);\n#endif\n#if defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})\ninfo=computeLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,glossiness);\n#endif\n#endif\n#endif\n#ifdef SHADOW{X}\n#ifdef SHADOWCLOSEESM{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithCloseESMCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.depthValues);\n#else\nshadow=computeShadowWithCloseESM(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.shadowsInfo.w);\n#endif\n#else\n#ifdef SHADOWESM{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithESMCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.depthValues);\n#else\nshadow=computeShadowWithESM(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.shadowsInfo.w);\n#endif\n#else \n#ifdef SHADOWPCF{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithPCFCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.x,light{X}.depthValues);\n#else\nshadow=computeShadowWithPCF(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);\n#endif\n#else\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.depthValues);\n#else\nshadow=computeShadow(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);\n#endif\n#endif\n#endif\n#endif\n#ifdef SHADOWONLY\n#ifndef SHADOWINUSE\n#define SHADOWINUSE\n#endif\nglobalShadow+=shadow;\nshadowLightCount+=1.0;\n#endif\n#else\nshadow=1.;\n#endif\n#ifndef SHADOWONLY\n#ifdef CUSTOMUSERLIGHTING\ndiffuseBase+=computeCustomDiffuseLighting(info,diffuseBase,shadow);\n#ifdef SPECULARTERM\nspecularBase+=computeCustomSpecularLighting(info,specularBase,shadow);\n#endif\n#elif defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X})\ndiffuseBase+=lightmapColor*shadow;\n#ifdef SPECULARTERM\n#ifndef LIGHTMAPNOSPECULAR{X}\nspecularBase+=info.specular*shadow*lightmapColor;\n#endif\n#endif\n#else\ndiffuseBase+=info.diffuse*shadow;\n#ifdef SPECULARTERM\nspecularBase+=info.specular*shadow;\n#endif\n#endif\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthFragment'] = "#ifdef LOGARITHMICDEPTH\ngl_FragDepthEXT=log2(vFragmentDepth)*logarithmicDepthConstant*0.5;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogFragment'] = "#ifdef FOG\nfloat fog=CalcFogFactor();\ncolor.rgb=fog*color.rgb+(1.0-fog)*vFogColor;\n#endif";
var Condition = BABYLON.Condition;
var ValueCondition = BABYLON.ValueCondition;
var PredicateCondition = BABYLON.PredicateCondition;
var StateCondition = BABYLON.StateCondition;
var Action = BABYLON.Action;
var ActionEvent = BABYLON.ActionEvent;
var ActionManager = BABYLON.ActionManager;
var InterpolateValueAction = BABYLON.InterpolateValueAction;
var SwitchBooleanAction = BABYLON.SwitchBooleanAction;
var SetStateAction = BABYLON.SetStateAction;
var SetValueAction = BABYLON.SetValueAction;
var IncrementValueAction = BABYLON.IncrementValueAction;
var PlayAnimationAction = BABYLON.PlayAnimationAction;
var StopAnimationAction = BABYLON.StopAnimationAction;
var DoNothingAction = BABYLON.DoNothingAction;
var CombineAction = BABYLON.CombineAction;
var ExecuteCodeAction = BABYLON.ExecuteCodeAction;
var SetParentAction = BABYLON.SetParentAction;
var PlaySoundAction = BABYLON.PlaySoundAction;
var StopSoundAction = BABYLON.StopSoundAction;

export { Condition,ValueCondition,PredicateCondition,StateCondition,Action,ActionEvent,ActionManager,InterpolateValueAction,SwitchBooleanAction,SetStateAction,SetValueAction,IncrementValueAction,PlayAnimationAction,StopAnimationAction,DoNothingAction,CombineAction,ExecuteCodeAction,SetParentAction,PlaySoundAction,StopSoundAction };