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

if(typeof require !== 'undefined'){
    var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : this);
    var BABYLON = globalObject["BABYLON"] || {}; 
var BABYLON0 = require('babylonjs/core');
if(BABYLON !== BABYLON0) __extends(BABYLON, BABYLON0);

var BABYLON;
(function (BABYLON) {
    var FreeCameraGamepadInput = /** @class */ (function () {
        function FreeCameraGamepadInput() {
            this.gamepadAngularSensibility = 200;
            this.gamepadMoveSensibility = 40;
            // private members
            this._cameraTransform = BABYLON.Matrix.Identity();
            this._deltaTransform = BABYLON.Vector3.Zero();
            this._vector3 = BABYLON.Vector3.Zero();
            this._vector2 = BABYLON.Vector2.Zero();
        }
        FreeCameraGamepadInput.prototype.attachControl = function (element, noPreventDefault) {
            var _this = this;
            var manager = this.camera.getScene().gamepadManager;
            this._onGamepadConnectedObserver = manager.onGamepadConnectedObservable.add(function (gamepad) {
                if (gamepad.type !== BABYLON.Gamepad.POSE_ENABLED) {
                    // prioritize XBOX gamepads.
                    if (!_this.gamepad || gamepad.type === BABYLON.Gamepad.XBOX) {
                        _this.gamepad = gamepad;
                    }
                }
            });
            this._onGamepadDisconnectedObserver = manager.onGamepadDisconnectedObservable.add(function (gamepad) {
                if (_this.gamepad === gamepad) {
                    _this.gamepad = null;
                }
            });
            this.gamepad = manager.getGamepadByType(BABYLON.Gamepad.XBOX);
        };
        FreeCameraGamepadInput.prototype.detachControl = function (element) {
            this.camera.getScene().gamepadManager.onGamepadConnectedObservable.remove(this._onGamepadConnectedObserver);
            this.camera.getScene().gamepadManager.onGamepadDisconnectedObservable.remove(this._onGamepadDisconnectedObserver);
            this.gamepad = null;
        };
        FreeCameraGamepadInput.prototype.checkInputs = function () {
            if (this.gamepad && this.gamepad.leftStick) {
                var camera = this.camera;
                var LSValues = this.gamepad.leftStick;
                var normalizedLX = LSValues.x / this.gamepadMoveSensibility;
                var normalizedLY = LSValues.y / this.gamepadMoveSensibility;
                LSValues.x = Math.abs(normalizedLX) > 0.005 ? 0 + normalizedLX : 0;
                LSValues.y = Math.abs(normalizedLY) > 0.005 ? 0 + normalizedLY : 0;
                var RSValues = this.gamepad.rightStick;
                if (RSValues) {
                    var normalizedRX = RSValues.x / this.gamepadAngularSensibility;
                    var normalizedRY = RSValues.y / this.gamepadAngularSensibility;
                    RSValues.x = Math.abs(normalizedRX) > 0.001 ? 0 + normalizedRX : 0;
                    RSValues.y = Math.abs(normalizedRY) > 0.001 ? 0 + normalizedRY : 0;
                }
                else {
                    RSValues = { x: 0, y: 0 };
                }
                if (!camera.rotationQuaternion) {
                    BABYLON.Matrix.RotationYawPitchRollToRef(camera.rotation.y, camera.rotation.x, 0, this._cameraTransform);
                }
                else {
                    camera.rotationQuaternion.toRotationMatrix(this._cameraTransform);
                }
                var speed = camera._computeLocalCameraSpeed() * 50.0;
                this._vector3.copyFromFloats(LSValues.x * speed, 0, -LSValues.y * speed);
                BABYLON.Vector3.TransformCoordinatesToRef(this._vector3, this._cameraTransform, this._deltaTransform);
                camera.cameraDirection.addInPlace(this._deltaTransform);
                this._vector2.copyFromFloats(RSValues.y, RSValues.x);
                camera.cameraRotation.addInPlace(this._vector2);
            }
        };
        FreeCameraGamepadInput.prototype.getClassName = function () {
            return "FreeCameraGamepadInput";
        };
        FreeCameraGamepadInput.prototype.getSimpleName = function () {
            return "gamepad";
        };
        __decorate([
            BABYLON.serialize()
        ], FreeCameraGamepadInput.prototype, "gamepadAngularSensibility", void 0);
        __decorate([
            BABYLON.serialize()
        ], FreeCameraGamepadInput.prototype, "gamepadMoveSensibility", void 0);
        return FreeCameraGamepadInput;
    }());
    BABYLON.FreeCameraGamepadInput = FreeCameraGamepadInput;
    BABYLON.CameraInputTypes["FreeCameraGamepadInput"] = FreeCameraGamepadInput;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.freeCameraGamepadInput.js.map


var BABYLON;
(function (BABYLON) {
    var ArcRotateCameraGamepadInput = /** @class */ (function () {
        function ArcRotateCameraGamepadInput() {
            this.gamepadRotationSensibility = 80;
            this.gamepadMoveSensibility = 40;
        }
        ArcRotateCameraGamepadInput.prototype.attachControl = function (element, noPreventDefault) {
            var _this = this;
            var manager = this.camera.getScene().gamepadManager;
            this._onGamepadConnectedObserver = manager.onGamepadConnectedObservable.add(function (gamepad) {
                if (gamepad.type !== BABYLON.Gamepad.POSE_ENABLED) {
                    // prioritize XBOX gamepads.
                    if (!_this.gamepad || gamepad.type === BABYLON.Gamepad.XBOX) {
                        _this.gamepad = gamepad;
                    }
                }
            });
            this._onGamepadDisconnectedObserver = manager.onGamepadDisconnectedObservable.add(function (gamepad) {
                if (_this.gamepad === gamepad) {
                    _this.gamepad = null;
                }
            });
            this.gamepad = manager.getGamepadByType(BABYLON.Gamepad.XBOX);
        };
        ArcRotateCameraGamepadInput.prototype.detachControl = function (element) {
            this.camera.getScene().gamepadManager.onGamepadConnectedObservable.remove(this._onGamepadConnectedObserver);
            this.camera.getScene().gamepadManager.onGamepadDisconnectedObservable.remove(this._onGamepadDisconnectedObserver);
            this.gamepad = null;
        };
        ArcRotateCameraGamepadInput.prototype.checkInputs = function () {
            if (this.gamepad) {
                var camera = this.camera;
                var RSValues = this.gamepad.rightStick;
                if (RSValues) {
                    if (RSValues.x != 0) {
                        var normalizedRX = RSValues.x / this.gamepadRotationSensibility;
                        if (normalizedRX != 0 && Math.abs(normalizedRX) > 0.005) {
                            camera.inertialAlphaOffset += normalizedRX;
                        }
                    }
                    if (RSValues.y != 0) {
                        var normalizedRY = RSValues.y / this.gamepadRotationSensibility;
                        if (normalizedRY != 0 && Math.abs(normalizedRY) > 0.005) {
                            camera.inertialBetaOffset += normalizedRY;
                        }
                    }
                }
                var LSValues = this.gamepad.leftStick;
                if (LSValues && LSValues.y != 0) {
                    var normalizedLY = LSValues.y / this.gamepadMoveSensibility;
                    if (normalizedLY != 0 && Math.abs(normalizedLY) > 0.005) {
                        this.camera.inertialRadiusOffset -= normalizedLY;
                    }
                }
            }
        };
        ArcRotateCameraGamepadInput.prototype.getClassName = function () {
            return "ArcRotateCameraGamepadInput";
        };
        ArcRotateCameraGamepadInput.prototype.getSimpleName = function () {
            return "gamepad";
        };
        __decorate([
            BABYLON.serialize()
        ], ArcRotateCameraGamepadInput.prototype, "gamepadRotationSensibility", void 0);
        __decorate([
            BABYLON.serialize()
        ], ArcRotateCameraGamepadInput.prototype, "gamepadMoveSensibility", void 0);
        return ArcRotateCameraGamepadInput;
    }());
    BABYLON.ArcRotateCameraGamepadInput = ArcRotateCameraGamepadInput;
    BABYLON.CameraInputTypes["ArcRotateCameraGamepadInput"] = ArcRotateCameraGamepadInput;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.arcRotateCameraGamepadInput.js.map

BABYLON.Effect.ShadersStore['defaultVertexShader'] = "#include<__decl__defaultVertex>\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef TANGENT\nattribute vec4 tangent;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<helperFunctions>\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2;\n#endif\n#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0\nvarying vec2 vDiffuseUV;\n#endif\n#if defined(AMBIENT) && AMBIENTDIRECTUV == 0\nvarying vec2 vAmbientUV;\n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0\nvarying vec2 vOpacityUV;\n#endif\n#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0\nvarying vec2 vEmissiveUV;\n#endif\n#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0\nvarying vec2 vLightmapUV;\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM) && SPECULARDIRECTUV == 0\nvarying vec2 vSpecularUV;\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0\nvarying vec2 vBumpUV;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<bumpVertexDeclaration>\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<morphTargetsVertexGlobalDeclaration>\n#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#include<logDepthDeclaration>\nvoid main(void) {\nvec3 positionUpdated=position;\n#ifdef NORMAL \nvec3 normalUpdated=normal;\n#endif\n#ifdef TANGENT\nvec4 tangentUpdated=tangent;\n#endif\n#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvPositionUVW=positionUpdated;\n#endif \n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(positionUpdated,1.0);\nvec4 worldPos=finalWorld*vec4(positionUpdated,1.0);\nvPositionW=vec3(worldPos);\n#ifdef NORMAL\nmat3 normalWorld=mat3(finalWorld);\n#ifdef NONUNIFORMSCALING\nnormalWorld=transposeMat3(inverseMat3(normalWorld));\n#endif\nvNormalW=normalize(normalWorld*normalUpdated);\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvDirectionW=normalize(vec3(finalWorld*vec4(positionUpdated,0.0)));\n#endif\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef MAINUV1\nvMainUV1=uv;\n#endif\n#ifdef MAINUV2\nvMainUV2=uv2;\n#endif\n#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0\nif (vDiffuseInfos.x == 0.)\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(AMBIENT) && AMBIENTDIRECTUV == 0\nif (vAmbientInfos.x == 0.)\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0\nif (vOpacityInfos.x == 0.)\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0\nif (vEmissiveInfos.x == 0.)\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0\nif (vLightmapInfos.x == 0.)\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM) && SPECULARDIRECTUV == 0\nif (vSpecularInfos.x == 0.)\n{\nvSpecularUV=vec2(specularMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvSpecularUV=vec2(specularMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0\nif (vBumpInfos.x == 0.)\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#include<bumpVertex>\n#include<clipPlaneVertex>\n#include<fogVertex>\n#include<shadowsVertex>[0..maxSimultaneousLights]\n#ifdef VERTEXCOLOR\n\nvColor=color;\n#endif\n#include<pointCloudVertex>\n#include<logDepthVertex>\n}";
BABYLON.Effect.ShadersStore['defaultPixelShader'] = "#include<__decl__defaultFragment>\n#if defined(BUMP) || !defined(NORMAL)\n#extension GL_OES_standard_derivatives : enable\n#endif\n#ifdef LOGARITHMICDEPTH\n#extension GL_EXT_frag_depth : enable\n#endif\n\n#define RECIPROCAL_PI2 0.15915494\nuniform vec3 vEyePosition;\nuniform vec3 vAmbientColor;\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2;\n#endif\n\n#include<helperFunctions>\n\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n\n#ifdef DIFFUSE\n#if DIFFUSEDIRECTUV == 1\n#define vDiffuseUV vMainUV1\n#elif DIFFUSEDIRECTUV == 2\n#define vDiffuseUV vMainUV2\n#else\nvarying vec2 vDiffuseUV;\n#endif\nuniform sampler2D diffuseSampler;\n#endif\n#ifdef AMBIENT\n#if AMBIENTDIRECTUV == 1\n#define vAmbientUV vMainUV1\n#elif AMBIENTDIRECTUV == 2\n#define vAmbientUV vMainUV2\n#else\nvarying vec2 vAmbientUV;\n#endif\nuniform sampler2D ambientSampler;\n#endif\n#ifdef OPACITY \n#if OPACITYDIRECTUV == 1\n#define vOpacityUV vMainUV1\n#elif OPACITYDIRECTUV == 2\n#define vOpacityUV vMainUV2\n#else\nvarying vec2 vOpacityUV;\n#endif\nuniform sampler2D opacitySampler;\n#endif\n#ifdef EMISSIVE\n#if EMISSIVEDIRECTUV == 1\n#define vEmissiveUV vMainUV1\n#elif EMISSIVEDIRECTUV == 2\n#define vEmissiveUV vMainUV2\n#else\nvarying vec2 vEmissiveUV;\n#endif\nuniform sampler2D emissiveSampler;\n#endif\n#ifdef LIGHTMAP\n#if LIGHTMAPDIRECTUV == 1\n#define vLightmapUV vMainUV1\n#elif LIGHTMAPDIRECTUV == 2\n#define vLightmapUV vMainUV2\n#else\nvarying vec2 vLightmapUV;\n#endif\nuniform sampler2D lightmapSampler;\n#endif\n#ifdef REFRACTION\n#ifdef REFRACTIONMAP_3D\nuniform samplerCube refractionCubeSampler;\n#else\nuniform sampler2D refraction2DSampler;\n#endif\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\n#if SPECULARDIRECTUV == 1\n#define vSpecularUV vMainUV1\n#elif SPECULARDIRECTUV == 2\n#define vSpecularUV vMainUV2\n#else\nvarying vec2 vSpecularUV;\n#endif\nuniform sampler2D specularSampler;\n#endif\n\n#include<fresnelFunction>\n\n#ifdef REFLECTION\n#ifdef REFLECTIONMAP_3D\nuniform samplerCube reflectionCubeSampler;\n#else\nuniform sampler2D reflection2DSampler;\n#endif\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#else\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#endif\n#include<reflectionFunction>\n#endif\n#include<imageProcessingDeclaration>\n#include<imageProcessingFunctions>\n#include<bumpFragmentFunctions>\n#include<clipPlaneFragmentDeclaration>\n#include<logDepthDeclaration>\n#include<fogFragmentDeclaration>\nvoid main(void) {\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\nvec4 baseColor=vec4(1.,1.,1.,1.);\nvec3 diffuseColor=vDiffuseColor.rgb;\n\nfloat alpha=vDiffuseColor.a;\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=normalize(-cross(dFdx(vPositionW),dFdy(vPositionW)));\n#endif\n#include<bumpFragment>\n#ifdef TWOSIDEDLIGHTING\nnormalW=gl_FrontFacing ? normalW : -normalW;\n#endif\n#ifdef DIFFUSE\nbaseColor=texture2D(diffuseSampler,vDiffuseUV+uvOffset);\n#ifdef ALPHATEST\nif (baseColor.a<0.4)\ndiscard;\n#endif\n#ifdef ALPHAFROMDIFFUSE\nalpha*=baseColor.a;\n#endif\nbaseColor.rgb*=vDiffuseInfos.y;\n#endif\n#include<depthPrePass>\n#ifdef VERTEXCOLOR\nbaseColor.rgb*=vColor.rgb;\n#endif\n\nvec3 baseAmbientColor=vec3(1.,1.,1.);\n#ifdef AMBIENT\nbaseAmbientColor=texture2D(ambientSampler,vAmbientUV+uvOffset).rgb*vAmbientInfos.y;\n#endif\n\n#ifdef SPECULARTERM\nfloat glossiness=vSpecularColor.a;\nvec3 specularColor=vSpecularColor.rgb;\n#ifdef SPECULAR\nvec4 specularMapColor=texture2D(specularSampler,vSpecularUV+uvOffset);\nspecularColor=specularMapColor.rgb;\n#ifdef GLOSSINESS\nglossiness=glossiness*specularMapColor.a;\n#endif\n#endif\n#else\nfloat glossiness=0.;\n#endif\n\nvec3 diffuseBase=vec3(0.,0.,0.);\nlightingInfo info;\n#ifdef SPECULARTERM\nvec3 specularBase=vec3(0.,0.,0.);\n#endif\nfloat shadow=1.;\n#ifdef LIGHTMAP\nvec3 lightmapColor=texture2D(lightmapSampler,vLightmapUV+uvOffset).rgb*vLightmapInfos.y;\n#endif\n#include<lightFragment>[0..maxSimultaneousLights]\n\nvec3 refractionColor=vec3(0.,0.,0.);\n#ifdef REFRACTION\nvec3 refractionVector=normalize(refract(-viewDirectionW,normalW,vRefractionInfos.y));\n#ifdef REFRACTIONMAP_3D\nrefractionVector.y=refractionVector.y*vRefractionInfos.w;\nif (dot(refractionVector,viewDirectionW)<1.0)\n{\nrefractionColor=textureCube(refractionCubeSampler,refractionVector).rgb*vRefractionInfos.x;\n}\n#else\nvec3 vRefractionUVW=vec3(refractionMatrix*(view*vec4(vPositionW+refractionVector*vRefractionInfos.z,1.0)));\nvec2 refractionCoords=vRefractionUVW.xy/vRefractionUVW.z;\nrefractionCoords.y=1.0-refractionCoords.y;\nrefractionColor=texture2D(refraction2DSampler,refractionCoords).rgb*vRefractionInfos.x;\n#endif\n#endif\n\nvec3 reflectionColor=vec3(0.,0.,0.);\n#ifdef REFLECTION\nvec3 vReflectionUVW=computeReflectionCoords(vec4(vPositionW,1.0),normalW);\n#ifdef REFLECTIONMAP_3D\n#ifdef ROUGHNESS\nfloat bias=vReflectionInfos.y;\n#ifdef SPECULARTERM\n#ifdef SPECULAR\n#ifdef GLOSSINESS\nbias*=(1.0-specularMapColor.a);\n#endif\n#endif\n#endif\nreflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW,bias).rgb*vReflectionInfos.x;\n#else\nreflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW).rgb*vReflectionInfos.x;\n#endif\n#else\nvec2 coords=vReflectionUVW.xy;\n#ifdef REFLECTIONMAP_PROJECTION\ncoords/=vReflectionUVW.z;\n#endif\ncoords.y=1.0-coords.y;\nreflectionColor=texture2D(reflection2DSampler,coords).rgb*vReflectionInfos.x;\n#endif\n#ifdef REFLECTIONFRESNEL\nfloat reflectionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,reflectionRightColor.a,reflectionLeftColor.a);\n#ifdef REFLECTIONFRESNELFROMSPECULAR\n#ifdef SPECULARTERM\nreflectionColor*=specularColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#else\nreflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#endif\n#else\nreflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#endif\n#endif\n#endif\n#ifdef REFRACTIONFRESNEL\nfloat refractionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,refractionRightColor.a,refractionLeftColor.a);\nrefractionColor*=refractionLeftColor.rgb*(1.0-refractionFresnelTerm)+refractionFresnelTerm*refractionRightColor.rgb;\n#endif\n#ifdef OPACITY\nvec4 opacityMap=texture2D(opacitySampler,vOpacityUV+uvOffset);\n#ifdef OPACITYRGB\nopacityMap.rgb=opacityMap.rgb*vec3(0.3,0.59,0.11);\nalpha*=(opacityMap.x+opacityMap.y+opacityMap.z)* vOpacityInfos.y;\n#else\nalpha*=opacityMap.a*vOpacityInfos.y;\n#endif\n#endif\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\n#ifdef OPACITYFRESNEL\nfloat opacityFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,opacityParts.z,opacityParts.w);\nalpha+=opacityParts.x*(1.0-opacityFresnelTerm)+opacityFresnelTerm*opacityParts.y;\n#endif\n\nvec3 emissiveColor=vEmissiveColor;\n#ifdef EMISSIVE\nemissiveColor+=texture2D(emissiveSampler,vEmissiveUV+uvOffset).rgb*vEmissiveInfos.y;\n#endif\n#ifdef EMISSIVEFRESNEL\nfloat emissiveFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,emissiveRightColor.a,emissiveLeftColor.a);\nemissiveColor*=emissiveLeftColor.rgb*(1.0-emissiveFresnelTerm)+emissiveFresnelTerm*emissiveRightColor.rgb;\n#endif\n\n#ifdef DIFFUSEFRESNEL\nfloat diffuseFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,diffuseRightColor.a,diffuseLeftColor.a);\ndiffuseBase*=diffuseLeftColor.rgb*(1.0-diffuseFresnelTerm)+diffuseFresnelTerm*diffuseRightColor.rgb;\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#else\n#ifdef LINKEMISSIVEWITHDIFFUSE\nvec3 finalDiffuse=clamp((diffuseBase+emissiveColor)*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#else\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor+emissiveColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#endif\n#endif\n#ifdef SPECULARTERM\nvec3 finalSpecular=specularBase*specularColor;\n#ifdef SPECULAROVERALPHA\nalpha=clamp(alpha+dot(finalSpecular,vec3(0.3,0.59,0.11)),0.,1.);\n#endif\n#else\nvec3 finalSpecular=vec3(0.0);\n#endif\n#ifdef REFLECTIONOVERALPHA\nalpha=clamp(alpha+dot(reflectionColor,vec3(0.3,0.59,0.11)),0.,1.);\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec4 color=vec4(clamp(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+emissiveColor+refractionColor,0.0,1.0),alpha);\n#else\nvec4 color=vec4(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+refractionColor,alpha);\n#endif\n\n#ifdef LIGHTMAP\n#ifndef LIGHTMAPEXCLUDED\n#ifdef USELIGHTMAPASSHADOWMAP\ncolor.rgb*=lightmapColor;\n#else\ncolor.rgb+=lightmapColor;\n#endif\n#endif\n#endif\n#include<logDepthFragment>\n#include<fogFragment>\n\n\n#ifdef IMAGEPROCESSINGPOSTPROCESS\ncolor.rgb=toLinearSpace(color.rgb);\n#else\n#ifdef IMAGEPROCESSING\ncolor.rgb=toLinearSpace(color.rgb);\ncolor=applyImageProcessing(color);\n#endif\n#endif\n#ifdef PREMULTIPLYALPHA\n\ncolor.rgb*=color.a;\n#endif\ngl_FragColor=color;\n}";

var BABYLON;
(function (BABYLON) {
    var GamepadManager = /** @class */ (function () {
        function GamepadManager(_scene) {
            var _this = this;
            this._scene = _scene;
            this._babylonGamepads = [];
            this._oneGamepadConnected = false;
            this._isMonitoring = false;
            this.onGamepadDisconnectedObservable = new BABYLON.Observable();
            if (!BABYLON.Tools.IsWindowObjectExist()) {
                this._gamepadEventSupported = false;
            }
            else {
                this._gamepadEventSupported = 'GamepadEvent' in window;
                this._gamepadSupport = (navigator.getGamepads ||
                    navigator.webkitGetGamepads || navigator.msGetGamepads || navigator.webkitGamepads);
            }
            this.onGamepadConnectedObservable = new BABYLON.Observable(function (observer) {
                // This will be used to raise the onGamepadConnected for all gamepads ALREADY connected
                for (var i in _this._babylonGamepads) {
                    var gamepad = _this._babylonGamepads[i];
                    if (gamepad && gamepad._isConnected) {
                        _this.onGamepadConnectedObservable.notifyObserver(observer, gamepad);
                    }
                }
            });
            this._onGamepadConnectedEvent = function (evt) {
                var gamepad = evt.gamepad;
                if (gamepad.index in _this._babylonGamepads) {
                    if (_this._babylonGamepads[gamepad.index].isConnected) {
                        return;
                    }
                }
                var newGamepad;
                if (_this._babylonGamepads[gamepad.index]) {
                    newGamepad = _this._babylonGamepads[gamepad.index];
                    newGamepad.browserGamepad = gamepad;
                    newGamepad._isConnected = true;
                }
                else {
                    newGamepad = _this._addNewGamepad(gamepad);
                }
                _this.onGamepadConnectedObservable.notifyObservers(newGamepad);
                _this._startMonitoringGamepads();
            };
            this._onGamepadDisconnectedEvent = function (evt) {
                var gamepad = evt.gamepad;
                // Remove the gamepad from the list of gamepads to monitor.
                for (var i in _this._babylonGamepads) {
                    if (_this._babylonGamepads[i].index === gamepad.index) {
                        var disconnectedGamepad = _this._babylonGamepads[i];
                        disconnectedGamepad._isConnected = false;
                        _this.onGamepadDisconnectedObservable.notifyObservers(disconnectedGamepad);
                        break;
                    }
                }
            };
            if (this._gamepadSupport) {
                //first add already-connected gamepads
                this._updateGamepadObjects();
                if (this._babylonGamepads.length) {
                    this._startMonitoringGamepads();
                }
                // Checking if the gamepad connected event is supported (like in Firefox)
                if (this._gamepadEventSupported) {
                    window.addEventListener('gamepadconnected', this._onGamepadConnectedEvent, false);
                    window.addEventListener('gamepaddisconnected', this._onGamepadDisconnectedEvent, false);
                }
                else {
                    this._startMonitoringGamepads();
                }
            }
        }
        Object.defineProperty(GamepadManager.prototype, "gamepads", {
            get: function () {
                return this._babylonGamepads;
            },
            enumerable: true,
            configurable: true
        });
        GamepadManager.prototype.getGamepadByType = function (type) {
            if (type === void 0) { type = BABYLON.Gamepad.XBOX; }
            for (var _i = 0, _a = this._babylonGamepads; _i < _a.length; _i++) {
                var gamepad = _a[_i];
                if (gamepad && gamepad.type === type) {
                    return gamepad;
                }
            }
            return null;
        };
        GamepadManager.prototype.dispose = function () {
            if (this._gamepadEventSupported) {
                if (this._onGamepadConnectedEvent) {
                    window.removeEventListener('gamepadconnected', this._onGamepadConnectedEvent);
                }
                if (this._onGamepadDisconnectedEvent) {
                    window.removeEventListener('gamepaddisconnected', this._onGamepadDisconnectedEvent);
                }
                this._onGamepadConnectedEvent = null;
                this._onGamepadDisconnectedEvent = null;
            }
            this._babylonGamepads.forEach(function (gamepad) {
                gamepad.dispose();
            });
            this.onGamepadConnectedObservable.clear();
            this.onGamepadDisconnectedObservable.clear();
            this._oneGamepadConnected = false;
            this._stopMonitoringGamepads();
            this._babylonGamepads = [];
        };
        GamepadManager.prototype._addNewGamepad = function (gamepad) {
            if (!this._oneGamepadConnected) {
                this._oneGamepadConnected = true;
            }
            var newGamepad;
            var xboxOne = (gamepad.id.search("Xbox One") !== -1);
            if (xboxOne || gamepad.id.search("Xbox 360") !== -1 || gamepad.id.search("xinput") !== -1) {
                newGamepad = new BABYLON.Xbox360Pad(gamepad.id, gamepad.index, gamepad, xboxOne);
            }
            else if (gamepad.pose) {
                newGamepad = BABYLON.PoseEnabledControllerHelper.InitiateController(gamepad);
            }
            else {
                newGamepad = new BABYLON.GenericPad(gamepad.id, gamepad.index, gamepad);
            }
            this._babylonGamepads[newGamepad.index] = newGamepad;
            return newGamepad;
        };
        GamepadManager.prototype._startMonitoringGamepads = function () {
            if (!this._isMonitoring) {
                this._isMonitoring = true;
                //back-comp
                if (!this._scene) {
                    this._checkGamepadsStatus();
                }
            }
        };
        GamepadManager.prototype._stopMonitoringGamepads = function () {
            this._isMonitoring = false;
        };
        GamepadManager.prototype._checkGamepadsStatus = function () {
            var _this = this;
            // Hack to be compatible Chrome
            this._updateGamepadObjects();
            for (var i in this._babylonGamepads) {
                var gamepad = this._babylonGamepads[i];
                if (!gamepad || !gamepad.isConnected) {
                    continue;
                }
                gamepad.update();
            }
            if (this._isMonitoring && !this._scene) {
                BABYLON.Tools.QueueNewFrame(function () { _this._checkGamepadsStatus(); });
            }
        };
        // This function is called only on Chrome, which does not properly support
        // connection/disconnection events and forces you to recopy again the gamepad object
        GamepadManager.prototype._updateGamepadObjects = function () {
            var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
            for (var i = 0; i < gamepads.length; i++) {
                if (gamepads[i]) {
                    if (!this._babylonGamepads[gamepads[i].index]) {
                        var newGamepad = this._addNewGamepad(gamepads[i]);
                        this.onGamepadConnectedObservable.notifyObservers(newGamepad);
                    }
                    else {
                        // Forced to copy again this object for Chrome for unknown reason
                        this._babylonGamepads[i].browserGamepad = gamepads[i];
                        if (!this._babylonGamepads[i].isConnected) {
                            this._babylonGamepads[i]._isConnected = true;
                            this.onGamepadConnectedObservable.notifyObservers(this._babylonGamepads[i]);
                        }
                    }
                }
            }
        };
        return GamepadManager;
    }());
    BABYLON.GamepadManager = GamepadManager;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.gamepadManager.js.map


var BABYLON;
(function (BABYLON) {
    var StickValues = /** @class */ (function () {
        function StickValues(x, y) {
            this.x = x;
            this.y = y;
        }
        return StickValues;
    }());
    BABYLON.StickValues = StickValues;
    var Gamepad = /** @class */ (function () {
        function Gamepad(id, index, browserGamepad, leftStickX, leftStickY, rightStickX, rightStickY) {
            if (leftStickX === void 0) { leftStickX = 0; }
            if (leftStickY === void 0) { leftStickY = 1; }
            if (rightStickX === void 0) { rightStickX = 2; }
            if (rightStickY === void 0) { rightStickY = 3; }
            this.id = id;
            this.index = index;
            this.browserGamepad = browserGamepad;
            this._isConnected = true;
            this._invertLeftStickY = false;
            this.type = Gamepad.GAMEPAD;
            this._leftStickAxisX = leftStickX;
            this._leftStickAxisY = leftStickY;
            this._rightStickAxisX = rightStickX;
            this._rightStickAxisY = rightStickY;
            if (this.browserGamepad.axes.length >= 2) {
                this._leftStick = { x: this.browserGamepad.axes[this._leftStickAxisX], y: this.browserGamepad.axes[this._leftStickAxisY] };
            }
            if (this.browserGamepad.axes.length >= 4) {
                this._rightStick = { x: this.browserGamepad.axes[this._rightStickAxisX], y: this.browserGamepad.axes[this._rightStickAxisY] };
            }
        }
        Object.defineProperty(Gamepad.prototype, "isConnected", {
            get: function () {
                return this._isConnected;
            },
            enumerable: true,
            configurable: true
        });
        Gamepad.prototype.onleftstickchanged = function (callback) {
            this._onleftstickchanged = callback;
        };
        Gamepad.prototype.onrightstickchanged = function (callback) {
            this._onrightstickchanged = callback;
        };
        Object.defineProperty(Gamepad.prototype, "leftStick", {
            get: function () {
                return this._leftStick;
            },
            set: function (newValues) {
                if (this._onleftstickchanged && (this._leftStick.x !== newValues.x || this._leftStick.y !== newValues.y)) {
                    this._onleftstickchanged(newValues);
                }
                this._leftStick = newValues;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Gamepad.prototype, "rightStick", {
            get: function () {
                return this._rightStick;
            },
            set: function (newValues) {
                if (this._onrightstickchanged && (this._rightStick.x !== newValues.x || this._rightStick.y !== newValues.y)) {
                    this._onrightstickchanged(newValues);
                }
                this._rightStick = newValues;
            },
            enumerable: true,
            configurable: true
        });
        Gamepad.prototype.update = function () {
            if (this._leftStick) {
                this.leftStick = { x: this.browserGamepad.axes[this._leftStickAxisX], y: this.browserGamepad.axes[this._leftStickAxisY] };
                if (this._invertLeftStickY) {
                    this.leftStick.y *= -1;
                }
            }
            if (this._rightStick) {
                this.rightStick = { x: this.browserGamepad.axes[this._rightStickAxisX], y: this.browserGamepad.axes[this._rightStickAxisY] };
            }
        };
        Gamepad.prototype.dispose = function () {
        };
        Gamepad.GAMEPAD = 0;
        Gamepad.GENERIC = 1;
        Gamepad.XBOX = 2;
        Gamepad.POSE_ENABLED = 3;
        return Gamepad;
    }());
    BABYLON.Gamepad = Gamepad;
    var GenericPad = /** @class */ (function (_super) {
        __extends(GenericPad, _super);
        function GenericPad(id, index, browserGamepad) {
            var _this = _super.call(this, id, index, browserGamepad) || this;
            _this.onButtonDownObservable = new BABYLON.Observable();
            _this.onButtonUpObservable = new BABYLON.Observable();
            _this.type = Gamepad.GENERIC;
            _this._buttons = new Array(browserGamepad.buttons.length);
            return _this;
        }
        GenericPad.prototype.onbuttondown = function (callback) {
            this._onbuttondown = callback;
        };
        GenericPad.prototype.onbuttonup = function (callback) {
            this._onbuttonup = callback;
        };
        GenericPad.prototype._setButtonValue = function (newValue, currentValue, buttonIndex) {
            if (newValue !== currentValue) {
                if (newValue === 1) {
                    if (this._onbuttondown) {
                        this._onbuttondown(buttonIndex);
                    }
                    this.onButtonDownObservable.notifyObservers(buttonIndex);
                }
                if (newValue === 0) {
                    if (this._onbuttonup) {
                        this._onbuttonup(buttonIndex);
                    }
                    this.onButtonUpObservable.notifyObservers(buttonIndex);
                }
            }
            return newValue;
        };
        GenericPad.prototype.update = function () {
            _super.prototype.update.call(this);
            for (var index = 0; index < this._buttons.length; index++) {
                this._buttons[index] = this._setButtonValue(this.browserGamepad.buttons[index].value, this._buttons[index], index);
            }
        };
        GenericPad.prototype.dispose = function () {
            _super.prototype.dispose.call(this);
            this.onButtonDownObservable.clear();
            this.onButtonUpObservable.clear();
        };
        return GenericPad;
    }(Gamepad));
    BABYLON.GenericPad = GenericPad;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.gamepad.js.map


var BABYLON;
(function (BABYLON) {
    var Xbox360Button;
    (function (Xbox360Button) {
        Xbox360Button[Xbox360Button["A"] = 0] = "A";
        Xbox360Button[Xbox360Button["B"] = 1] = "B";
        Xbox360Button[Xbox360Button["X"] = 2] = "X";
        Xbox360Button[Xbox360Button["Y"] = 3] = "Y";
        Xbox360Button[Xbox360Button["Start"] = 4] = "Start";
        Xbox360Button[Xbox360Button["Back"] = 5] = "Back";
        Xbox360Button[Xbox360Button["LB"] = 6] = "LB";
        Xbox360Button[Xbox360Button["RB"] = 7] = "RB";
        Xbox360Button[Xbox360Button["LeftStick"] = 8] = "LeftStick";
        Xbox360Button[Xbox360Button["RightStick"] = 9] = "RightStick";
    })(Xbox360Button = BABYLON.Xbox360Button || (BABYLON.Xbox360Button = {}));
    var Xbox360Dpad;
    (function (Xbox360Dpad) {
        Xbox360Dpad[Xbox360Dpad["Up"] = 0] = "Up";
        Xbox360Dpad[Xbox360Dpad["Down"] = 1] = "Down";
        Xbox360Dpad[Xbox360Dpad["Left"] = 2] = "Left";
        Xbox360Dpad[Xbox360Dpad["Right"] = 3] = "Right";
    })(Xbox360Dpad = BABYLON.Xbox360Dpad || (BABYLON.Xbox360Dpad = {}));
    var Xbox360Pad = /** @class */ (function (_super) {
        __extends(Xbox360Pad, _super);
        function Xbox360Pad(id, index, gamepad, xboxOne) {
            if (xboxOne === void 0) { xboxOne = false; }
            var _this = _super.call(this, id, index, gamepad, 0, 1, 2, 3) || this;
            _this._leftTrigger = 0;
            _this._rightTrigger = 0;
            _this.onButtonDownObservable = new BABYLON.Observable();
            _this.onButtonUpObservable = new BABYLON.Observable();
            _this.onPadDownObservable = new BABYLON.Observable();
            _this.onPadUpObservable = new BABYLON.Observable();
            _this._buttonA = 0;
            _this._buttonB = 0;
            _this._buttonX = 0;
            _this._buttonY = 0;
            _this._buttonBack = 0;
            _this._buttonStart = 0;
            _this._buttonLB = 0;
            _this._buttonRB = 0;
            _this._buttonLeftStick = 0;
            _this._buttonRightStick = 0;
            _this._dPadUp = 0;
            _this._dPadDown = 0;
            _this._dPadLeft = 0;
            _this._dPadRight = 0;
            _this._isXboxOnePad = false;
            _this.type = BABYLON.Gamepad.XBOX;
            _this._isXboxOnePad = xboxOne;
            return _this;
        }
        Xbox360Pad.prototype.onlefttriggerchanged = function (callback) {
            this._onlefttriggerchanged = callback;
        };
        Xbox360Pad.prototype.onrighttriggerchanged = function (callback) {
            this._onrighttriggerchanged = callback;
        };
        Object.defineProperty(Xbox360Pad.prototype, "leftTrigger", {
            get: function () {
                return this._leftTrigger;
            },
            set: function (newValue) {
                if (this._onlefttriggerchanged && this._leftTrigger !== newValue) {
                    this._onlefttriggerchanged(newValue);
                }
                this._leftTrigger = newValue;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Xbox360Pad.prototype, "rightTrigger", {
            get: function () {
                return this._rightTrigger;
            },
            set: function (newValue) {
                if (this._onrighttriggerchanged && this._rightTrigger !== newValue) {
                    this._onrighttriggerchanged(newValue);
                }
                this._rightTrigger = newValue;
            },
            enumerable: true,
            configurable: true
        });
        Xbox360Pad.prototype.onbuttondown = function (callback) {
            this._onbuttondown = callback;
        };
        Xbox360Pad.prototype.onbuttonup = function (callback) {
            this._onbuttonup = callback;
        };
        Xbox360Pad.prototype.ondpaddown = function (callback) {
            this._ondpaddown = callback;
        };
        Xbox360Pad.prototype.ondpadup = function (callback) {
            this._ondpadup = callback;
        };
        Xbox360Pad.prototype._setButtonValue = function (newValue, currentValue, buttonType) {
            if (newValue !== currentValue) {
                if (newValue === 1) {
                    if (this._onbuttondown) {
                        this._onbuttondown(buttonType);
                    }
                    this.onButtonDownObservable.notifyObservers(buttonType);
                }
                if (newValue === 0) {
                    if (this._onbuttonup) {
                        this._onbuttonup(buttonType);
                    }
                    this.onButtonUpObservable.notifyObservers(buttonType);
                }
            }
            return newValue;
        };
        Xbox360Pad.prototype._setDPadValue = function (newValue, currentValue, buttonType) {
            if (newValue !== currentValue) {
                if (newValue === 1) {
                    if (this._ondpaddown) {
                        this._ondpaddown(buttonType);
                    }
                    this.onPadDownObservable.notifyObservers(buttonType);
                }
                if (newValue === 0) {
                    if (this._ondpadup) {
                        this._ondpadup(buttonType);
                    }
                    this.onPadUpObservable.notifyObservers(buttonType);
                }
            }
            return newValue;
        };
        Object.defineProperty(Xbox360Pad.prototype, "buttonA", {
            get: function () {
                return this._buttonA;
            },
            set: function (value) {
                this._buttonA = this._setButtonValue(value, this._buttonA, Xbox360Button.A);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Xbox360Pad.prototype, "buttonB", {
            get: function () {
                return this._buttonB;
            },
            set: function (value) {
                this._buttonB = this._setButtonValue(value, this._buttonB, Xbox360Button.B);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Xbox360Pad.prototype, "buttonX", {
            get: function () {
                return this._buttonX;
            },
            set: function (value) {
                this._buttonX = this._setButtonValue(value, this._buttonX, Xbox360Button.X);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Xbox360Pad.prototype, "buttonY", {
            get: function () {
                return this._buttonY;
            },
            set: function (value) {
                this._buttonY = this._setButtonValue(value, this._buttonY, Xbox360Button.Y);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Xbox360Pad.prototype, "buttonStart", {
            get: function () {
                return this._buttonStart;
            },
            set: function (value) {
                this._buttonStart = this._setButtonValue(value, this._buttonStart, Xbox360Button.Start);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Xbox360Pad.prototype, "buttonBack", {
            get: function () {
                return this._buttonBack;
            },
            set: function (value) {
                this._buttonBack = this._setButtonValue(value, this._buttonBack, Xbox360Button.Back);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Xbox360Pad.prototype, "buttonLB", {
            get: function () {
                return this._buttonLB;
            },
            set: function (value) {
                this._buttonLB = this._setButtonValue(value, this._buttonLB, Xbox360Button.LB);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Xbox360Pad.prototype, "buttonRB", {
            get: function () {
                return this._buttonRB;
            },
            set: function (value) {
                this._buttonRB = this._setButtonValue(value, this._buttonRB, Xbox360Button.RB);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Xbox360Pad.prototype, "buttonLeftStick", {
            get: function () {
                return this._buttonLeftStick;
            },
            set: function (value) {
                this._buttonLeftStick = this._setButtonValue(value, this._buttonLeftStick, Xbox360Button.LeftStick);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Xbox360Pad.prototype, "buttonRightStick", {
            get: function () {
                return this._buttonRightStick;
            },
            set: function (value) {
                this._buttonRightStick = this._setButtonValue(value, this._buttonRightStick, Xbox360Button.RightStick);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Xbox360Pad.prototype, "dPadUp", {
            get: function () {
                return this._dPadUp;
            },
            set: function (value) {
                this._dPadUp = this._setDPadValue(value, this._dPadUp, Xbox360Dpad.Up);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Xbox360Pad.prototype, "dPadDown", {
            get: function () {
                return this._dPadDown;
            },
            set: function (value) {
                this._dPadDown = this._setDPadValue(value, this._dPadDown, Xbox360Dpad.Down);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Xbox360Pad.prototype, "dPadLeft", {
            get: function () {
                return this._dPadLeft;
            },
            set: function (value) {
                this._dPadLeft = this._setDPadValue(value, this._dPadLeft, Xbox360Dpad.Left);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Xbox360Pad.prototype, "dPadRight", {
            get: function () {
                return this._dPadRight;
            },
            set: function (value) {
                this._dPadRight = this._setDPadValue(value, this._dPadRight, Xbox360Dpad.Right);
            },
            enumerable: true,
            configurable: true
        });
        Xbox360Pad.prototype.update = function () {
            _super.prototype.update.call(this);
            if (this._isXboxOnePad) {
                this.buttonA = this.browserGamepad.buttons[0].value;
                this.buttonB = this.browserGamepad.buttons[1].value;
                this.buttonX = this.browserGamepad.buttons[2].value;
                this.buttonY = this.browserGamepad.buttons[3].value;
                this.buttonLB = this.browserGamepad.buttons[4].value;
                this.buttonRB = this.browserGamepad.buttons[5].value;
                this.leftTrigger = this.browserGamepad.axes[2];
                this.rightTrigger = this.browserGamepad.axes[5];
                this.buttonBack = this.browserGamepad.buttons[9].value;
                this.buttonStart = this.browserGamepad.buttons[8].value;
                this.buttonLeftStick = this.browserGamepad.buttons[6].value;
                this.buttonRightStick = this.browserGamepad.buttons[7].value;
                this.dPadUp = this.browserGamepad.buttons[11].value;
                this.dPadDown = this.browserGamepad.buttons[12].value;
                this.dPadLeft = this.browserGamepad.buttons[13].value;
                this.dPadRight = this.browserGamepad.buttons[14].value;
            }
            else {
                this.buttonA = this.browserGamepad.buttons[0].value;
                this.buttonB = this.browserGamepad.buttons[1].value;
                this.buttonX = this.browserGamepad.buttons[2].value;
                this.buttonY = this.browserGamepad.buttons[3].value;
                this.buttonLB = this.browserGamepad.buttons[4].value;
                this.buttonRB = this.browserGamepad.buttons[5].value;
                this.leftTrigger = this.browserGamepad.buttons[6].value;
                this.rightTrigger = this.browserGamepad.buttons[7].value;
                this.buttonBack = this.browserGamepad.buttons[8].value;
                this.buttonStart = this.browserGamepad.buttons[9].value;
                this.buttonLeftStick = this.browserGamepad.buttons[10].value;
                this.buttonRightStick = this.browserGamepad.buttons[11].value;
                this.dPadUp = this.browserGamepad.buttons[12].value;
                this.dPadDown = this.browserGamepad.buttons[13].value;
                this.dPadLeft = this.browserGamepad.buttons[14].value;
                this.dPadRight = this.browserGamepad.buttons[15].value;
            }
        };
        Xbox360Pad.prototype.dispose = function () {
            _super.prototype.dispose.call(this);
            this.onButtonDownObservable.clear();
            this.onButtonUpObservable.clear();
            this.onPadDownObservable.clear();
            this.onPadUpObservable.clear();
        };
        return Xbox360Pad;
    }(BABYLON.Gamepad));
    BABYLON.Xbox360Pad = Xbox360Pad;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.xboxGamepad.js.map


var BABYLON;
(function (BABYLON) {
    var PoseEnabledControllerType;
    (function (PoseEnabledControllerType) {
        PoseEnabledControllerType[PoseEnabledControllerType["VIVE"] = 0] = "VIVE";
        PoseEnabledControllerType[PoseEnabledControllerType["OCULUS"] = 1] = "OCULUS";
        PoseEnabledControllerType[PoseEnabledControllerType["WINDOWS"] = 2] = "WINDOWS";
        PoseEnabledControllerType[PoseEnabledControllerType["GENERIC"] = 3] = "GENERIC";
    })(PoseEnabledControllerType = BABYLON.PoseEnabledControllerType || (BABYLON.PoseEnabledControllerType = {}));
    var PoseEnabledControllerHelper = /** @class */ (function () {
        function PoseEnabledControllerHelper() {
        }
        PoseEnabledControllerHelper.InitiateController = function (vrGamepad) {
            // Oculus Touch
            if (vrGamepad.id.indexOf('Oculus Touch') !== -1) {
                return new BABYLON.OculusTouchController(vrGamepad);
            }
            else if (vrGamepad.id.indexOf(BABYLON.WindowsMotionController.GAMEPAD_ID_PREFIX) === 0) {
                return new BABYLON.WindowsMotionController(vrGamepad);
            }
            else if (vrGamepad.id.toLowerCase().indexOf('openvr') !== -1) {
                return new BABYLON.ViveController(vrGamepad);
            }
            else {
                return new BABYLON.GenericController(vrGamepad);
            }
        };
        return PoseEnabledControllerHelper;
    }());
    BABYLON.PoseEnabledControllerHelper = PoseEnabledControllerHelper;
    var PoseEnabledController = /** @class */ (function (_super) {
        __extends(PoseEnabledController, _super);
        function PoseEnabledController(browserGamepad) {
            var _this = _super.call(this, browserGamepad.id, browserGamepad.index, browserGamepad) || this;
            // Represents device position and rotation in room space. Should only be used to help calculate babylon space values
            _this._deviceRoomPosition = BABYLON.Vector3.Zero();
            _this._deviceRoomRotationQuaternion = new BABYLON.Quaternion();
            // Represents device position and rotation in babylon space
            _this.devicePosition = BABYLON.Vector3.Zero();
            _this.deviceRotationQuaternion = new BABYLON.Quaternion();
            _this.deviceScaleFactor = 1;
            _this._leftHandSystemQuaternion = new BABYLON.Quaternion();
            _this._deviceToWorld = BABYLON.Matrix.Identity();
            _this._workingMatrix = BABYLON.Matrix.Identity();
            _this.type = BABYLON.Gamepad.POSE_ENABLED;
            _this.controllerType = PoseEnabledControllerType.GENERIC;
            _this.position = BABYLON.Vector3.Zero();
            _this.rotationQuaternion = new BABYLON.Quaternion();
            _this._calculatedPosition = BABYLON.Vector3.Zero();
            _this._calculatedRotation = new BABYLON.Quaternion();
            BABYLON.Quaternion.RotationYawPitchRollToRef(Math.PI, 0, 0, _this._leftHandSystemQuaternion);
            return _this;
        }
        PoseEnabledController.prototype.update = function () {
            _super.prototype.update.call(this);
            var pose = this.browserGamepad.pose;
            this.updateFromDevice(pose);
            BABYLON.Vector3.TransformCoordinatesToRef(this._calculatedPosition, this._deviceToWorld, this.devicePosition);
            this._deviceToWorld.getRotationMatrixToRef(this._workingMatrix);
            BABYLON.Quaternion.FromRotationMatrixToRef(this._workingMatrix, this.deviceRotationQuaternion);
            this.deviceRotationQuaternion.multiplyInPlace(this._calculatedRotation);
            if (this._mesh) {
                this._mesh.position.copyFrom(this.devicePosition);
                if (this._mesh.rotationQuaternion) {
                    this._mesh.rotationQuaternion.copyFrom(this.deviceRotationQuaternion);
                }
            }
        };
        PoseEnabledController.prototype.updateFromDevice = function (poseData) {
            if (poseData) {
                this.rawPose = poseData;
                if (poseData.position) {
                    this._deviceRoomPosition.copyFromFloats(poseData.position[0], poseData.position[1], -poseData.position[2]);
                    if (this._mesh && this._mesh.getScene().useRightHandedSystem) {
                        this._deviceRoomPosition.z *= -1;
                    }
                    this._deviceRoomPosition.scaleToRef(this.deviceScaleFactor, this._calculatedPosition);
                    this._calculatedPosition.addInPlace(this.position);
                }
                var pose = this.rawPose;
                if (poseData.orientation && pose.orientation) {
                    this._deviceRoomRotationQuaternion.copyFromFloats(pose.orientation[0], pose.orientation[1], -pose.orientation[2], -pose.orientation[3]);
                    if (this._mesh) {
                        if (this._mesh.getScene().useRightHandedSystem) {
                            this._deviceRoomRotationQuaternion.z *= -1;
                            this._deviceRoomRotationQuaternion.w *= -1;
                        }
                        else {
                            this._deviceRoomRotationQuaternion.multiplyToRef(this._leftHandSystemQuaternion, this._deviceRoomRotationQuaternion);
                        }
                    }
                    // if the camera is set, rotate to the camera's rotation
                    this._deviceRoomRotationQuaternion.multiplyToRef(this.rotationQuaternion, this._calculatedRotation);
                }
            }
        };
        PoseEnabledController.prototype.attachToMesh = function (mesh) {
            if (this._mesh) {
                this._mesh.parent = null;
            }
            this._mesh = mesh;
            if (this._poseControlledCamera) {
                this._mesh.parent = this._poseControlledCamera;
            }
            if (!this._mesh.rotationQuaternion) {
                this._mesh.rotationQuaternion = new BABYLON.Quaternion();
            }
        };
        PoseEnabledController.prototype.attachToPoseControlledCamera = function (camera) {
            this._poseControlledCamera = camera;
            if (this._mesh) {
                this._mesh.parent = this._poseControlledCamera;
            }
        };
        PoseEnabledController.prototype.dispose = function () {
            if (this._mesh) {
                this._mesh.dispose();
            }
            this._mesh = null;
            _super.prototype.dispose.call(this);
        };
        Object.defineProperty(PoseEnabledController.prototype, "mesh", {
            get: function () {
                return this._mesh;
            },
            enumerable: true,
            configurable: true
        });
        PoseEnabledController.prototype.getForwardRay = function (length) {
            if (length === void 0) { length = 100; }
            if (!this.mesh) {
                return new BABYLON.Ray(BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, 1), length);
            }
            var m = this.mesh.getWorldMatrix();
            var origin = m.getTranslation();
            var forward = new BABYLON.Vector3(0, 0, -1);
            var forwardWorld = BABYLON.Vector3.TransformNormal(forward, m);
            var direction = BABYLON.Vector3.Normalize(forwardWorld);
            return new BABYLON.Ray(origin, direction, length);
        };
        return PoseEnabledController;
    }(BABYLON.Gamepad));
    BABYLON.PoseEnabledController = PoseEnabledController;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.poseEnabledController.js.map


var BABYLON;
(function (BABYLON) {
    var WebVRController = /** @class */ (function (_super) {
        __extends(WebVRController, _super);
        function WebVRController(vrGamepad) {
            var _this = _super.call(this, vrGamepad) || this;
            // Observables
            _this.onTriggerStateChangedObservable = new BABYLON.Observable();
            _this.onMainButtonStateChangedObservable = new BABYLON.Observable();
            _this.onSecondaryButtonStateChangedObservable = new BABYLON.Observable();
            _this.onPadStateChangedObservable = new BABYLON.Observable();
            _this.onPadValuesChangedObservable = new BABYLON.Observable();
            _this.pad = { x: 0, y: 0 };
            // avoid GC, store state in a tmp object
            _this._changes = {
                pressChanged: false,
                touchChanged: false,
                valueChanged: false,
                changed: false
            };
            _this._buttons = new Array(vrGamepad.buttons.length);
            _this.hand = vrGamepad.hand;
            return _this;
        }
        WebVRController.prototype.onButtonStateChange = function (callback) {
            this._onButtonStateChange = callback;
        };
        Object.defineProperty(WebVRController.prototype, "defaultModel", {
            get: function () {
                return this._defaultModel;
            },
            enumerable: true,
            configurable: true
        });
        WebVRController.prototype.update = function () {
            _super.prototype.update.call(this);
            for (var index = 0; index < this._buttons.length; index++) {
                this._setButtonValue(this.browserGamepad.buttons[index], this._buttons[index], index);
            }
            ;
            if (this.leftStick.x !== this.pad.x || this.leftStick.y !== this.pad.y) {
                this.pad.x = this.leftStick.x;
                this.pad.y = this.leftStick.y;
                this.onPadValuesChangedObservable.notifyObservers(this.pad);
            }
        };
        WebVRController.prototype._setButtonValue = function (newState, currentState, buttonIndex) {
            if (!newState) {
                newState = {
                    pressed: false,
                    touched: false,
                    value: 0
                };
            }
            if (!currentState) {
                this._buttons[buttonIndex] = {
                    pressed: newState.pressed,
                    touched: newState.touched,
                    value: newState.value
                };
                return;
            }
            this._checkChanges(newState, currentState);
            if (this._changes.changed) {
                this._onButtonStateChange && this._onButtonStateChange(this.index, buttonIndex, newState);
                this.handleButtonChange(buttonIndex, newState, this._changes);
            }
            this._buttons[buttonIndex].pressed = newState.pressed;
            this._buttons[buttonIndex].touched = newState.touched;
            // oculus triggers are never 0, thou not touched.
            this._buttons[buttonIndex].value = newState.value < 0.00000001 ? 0 : newState.value;
        };
        WebVRController.prototype._checkChanges = function (newState, currentState) {
            this._changes.pressChanged = newState.pressed !== currentState.pressed;
            this._changes.touchChanged = newState.touched !== currentState.touched;
            this._changes.valueChanged = newState.value !== currentState.value;
            this._changes.changed = this._changes.pressChanged || this._changes.touchChanged || this._changes.valueChanged;
            return this._changes;
        };
        WebVRController.prototype.dispose = function () {
            _super.prototype.dispose.call(this);
            this.onTriggerStateChangedObservable.clear();
            this.onMainButtonStateChangedObservable.clear();
            this.onSecondaryButtonStateChangedObservable.clear();
            this.onPadStateChangedObservable.clear();
            this.onPadValuesChangedObservable.clear();
        };
        return WebVRController;
    }(BABYLON.PoseEnabledController));
    BABYLON.WebVRController = WebVRController;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.webVRController.js.map


var BABYLON;
(function (BABYLON) {
    var OculusTouchController = /** @class */ (function (_super) {
        __extends(OculusTouchController, _super);
        function OculusTouchController(vrGamepad) {
            var _this = _super.call(this, vrGamepad) || this;
            _this.onSecondaryTriggerStateChangedObservable = new BABYLON.Observable();
            _this.onThumbRestChangedObservable = new BABYLON.Observable();
            _this.controllerType = BABYLON.PoseEnabledControllerType.OCULUS;
            return _this;
        }
        OculusTouchController.prototype.initControllerMesh = function (scene, meshLoaded) {
            var _this = this;
            var meshName;
            // Hand
            if (this.hand === 'left') {
                meshName = OculusTouchController.MODEL_LEFT_FILENAME;
            }
            else {
                meshName = OculusTouchController.MODEL_RIGHT_FILENAME;
            }
            BABYLON.SceneLoader.ImportMesh("", OculusTouchController.MODEL_BASE_URL, meshName, scene, function (newMeshes) {
                /*
                Parent Mesh name: oculus_touch_left
                - body
                - trigger
                - thumbstick
                - grip
                - button_y
                - button_x
                - button_enter
                */
                _this._defaultModel = newMeshes[1];
                _this.attachToMesh(_this._defaultModel);
                if (meshLoaded) {
                    meshLoaded(_this._defaultModel);
                }
            });
        };
        Object.defineProperty(OculusTouchController.prototype, "onAButtonStateChangedObservable", {
            // helper getters for left and right hand.
            get: function () {
                if (this.hand === 'right') {
                    return this.onMainButtonStateChangedObservable;
                }
                else {
                    throw new Error('No A button on left hand');
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(OculusTouchController.prototype, "onBButtonStateChangedObservable", {
            get: function () {
                if (this.hand === 'right') {
                    return this.onSecondaryButtonStateChangedObservable;
                }
                else {
                    throw new Error('No B button on left hand');
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(OculusTouchController.prototype, "onXButtonStateChangedObservable", {
            get: function () {
                if (this.hand === 'left') {
                    return this.onMainButtonStateChangedObservable;
                }
                else {
                    throw new Error('No X button on right hand');
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(OculusTouchController.prototype, "onYButtonStateChangedObservable", {
            get: function () {
                if (this.hand === 'left') {
                    return this.onSecondaryButtonStateChangedObservable;
                }
                else {
                    throw new Error('No Y button on right hand');
                }
            },
            enumerable: true,
            configurable: true
        });
        /*
         0) thumb stick (touch, press, value = pressed (0,1)). value is in this.leftStick
         1) index trigger (touch (?), press (only when value > 0.1), value 0 to 1)
         2) secondary trigger (same)
         3) A (right) X (left), touch, pressed = value
         4) B / Y
         5) thumb rest
        */
        OculusTouchController.prototype.handleButtonChange = function (buttonIdx, state, changes) {
            var notifyObject = state; //{ state: state, changes: changes };
            var triggerDirection = this.hand === 'right' ? -1 : 1;
            switch (buttonIdx) {
                case 0:
                    this.onPadStateChangedObservable.notifyObservers(notifyObject);
                    return;
                case 1:// index trigger
                    if (this._defaultModel) {
                        (this._defaultModel.getChildren()[3]).rotation.x = -notifyObject.value * 0.20;
                        (this._defaultModel.getChildren()[3]).position.y = -notifyObject.value * 0.005;
                        (this._defaultModel.getChildren()[3]).position.z = -notifyObject.value * 0.005;
                    }
                    this.onTriggerStateChangedObservable.notifyObservers(notifyObject);
                    return;
                case 2:// secondary trigger
                    if (this._defaultModel) {
                        (this._defaultModel.getChildren()[4]).position.x = triggerDirection * notifyObject.value * 0.0035;
                    }
                    this.onSecondaryTriggerStateChangedObservable.notifyObservers(notifyObject);
                    return;
                case 3:
                    if (this._defaultModel) {
                        if (notifyObject.pressed) {
                            (this._defaultModel.getChildren()[1]).position.y = -0.001;
                        }
                        else {
                            (this._defaultModel.getChildren()[1]).position.y = 0;
                        }
                    }
                    this.onMainButtonStateChangedObservable.notifyObservers(notifyObject);
                    return;
                case 4:
                    if (this._defaultModel) {
                        if (notifyObject.pressed) {
                            (this._defaultModel.getChildren()[2]).position.y = -0.001;
                        }
                        else {
                            (this._defaultModel.getChildren()[2]).position.y = 0;
                        }
                    }
                    this.onSecondaryButtonStateChangedObservable.notifyObservers(notifyObject);
                    return;
                case 5:
                    this.onThumbRestChangedObservable.notifyObservers(notifyObject);
                    return;
            }
        };
        OculusTouchController.MODEL_BASE_URL = 'https://controllers.babylonjs.com/oculus/';
        OculusTouchController.MODEL_LEFT_FILENAME = 'left.babylon';
        OculusTouchController.MODEL_RIGHT_FILENAME = 'right.babylon';
        return OculusTouchController;
    }(BABYLON.WebVRController));
    BABYLON.OculusTouchController = OculusTouchController;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.oculusTouchController.js.map


var BABYLON;
(function (BABYLON) {
    var ViveController = /** @class */ (function (_super) {
        __extends(ViveController, _super);
        function ViveController(vrGamepad) {
            var _this = _super.call(this, vrGamepad) || this;
            _this.controllerType = BABYLON.PoseEnabledControllerType.VIVE;
            _this._invertLeftStickY = true;
            return _this;
        }
        ViveController.prototype.initControllerMesh = function (scene, meshLoaded) {
            var _this = this;
            BABYLON.SceneLoader.ImportMesh("", ViveController.MODEL_BASE_URL, ViveController.MODEL_FILENAME, scene, function (newMeshes) {
                /*
                Parent Mesh name: ViveWand
                - body
                - r_gripper
                - l_gripper
                - menu_button
                - system_button
                - trackpad
                - trigger
                - LED
                */
                _this._defaultModel = newMeshes[1];
                _this.attachToMesh(_this._defaultModel);
                if (meshLoaded) {
                    meshLoaded(_this._defaultModel);
                }
            });
        };
        Object.defineProperty(ViveController.prototype, "onLeftButtonStateChangedObservable", {
            get: function () {
                return this.onMainButtonStateChangedObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ViveController.prototype, "onRightButtonStateChangedObservable", {
            get: function () {
                return this.onMainButtonStateChangedObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ViveController.prototype, "onMenuButtonStateChangedObservable", {
            get: function () {
                return this.onSecondaryButtonStateChangedObservable;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Vive mapping:
         * 0: touchpad
         * 1: trigger
         * 2: left AND right buttons
         * 3: menu button
         */
        ViveController.prototype.handleButtonChange = function (buttonIdx, state, changes) {
            var notifyObject = state; //{ state: state, changes: changes };
            switch (buttonIdx) {
                case 0:
                    this.onPadStateChangedObservable.notifyObservers(notifyObject);
                    return;
                case 1:// index trigger
                    if (this._defaultModel) {
                        (this._defaultModel.getChildren()[6]).rotation.x = -notifyObject.value * 0.15;
                    }
                    this.onTriggerStateChangedObservable.notifyObservers(notifyObject);
                    return;
                case 2:// left AND right button
                    this.onMainButtonStateChangedObservable.notifyObservers(notifyObject);
                    return;
                case 3:
                    if (this._defaultModel) {
                        if (notifyObject.pressed) {
                            (this._defaultModel.getChildren()[2]).position.y = -0.001;
                        }
                        else {
                            (this._defaultModel.getChildren()[2]).position.y = 0;
                        }
                    }
                    this.onSecondaryButtonStateChangedObservable.notifyObservers(notifyObject);
                    return;
            }
        };
        ViveController.MODEL_BASE_URL = 'https://controllers.babylonjs.com/vive/';
        ViveController.MODEL_FILENAME = 'wand.babylon';
        return ViveController;
    }(BABYLON.WebVRController));
    BABYLON.ViveController = ViveController;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.viveController.js.map


var BABYLON;
(function (BABYLON) {
    var GenericController = /** @class */ (function (_super) {
        __extends(GenericController, _super);
        function GenericController(vrGamepad) {
            return _super.call(this, vrGamepad) || this;
        }
        GenericController.prototype.initControllerMesh = function (scene, meshLoaded) {
            var _this = this;
            BABYLON.SceneLoader.ImportMesh("", GenericController.MODEL_BASE_URL, GenericController.MODEL_FILENAME, scene, function (newMeshes) {
                _this._defaultModel = newMeshes[1];
                _this.attachToMesh(_this._defaultModel);
                if (meshLoaded) {
                    meshLoaded(_this._defaultModel);
                }
            });
        };
        GenericController.prototype.handleButtonChange = function (buttonIdx, state, changes) {
            console.log("Button id: " + buttonIdx + "state: ");
            console.dir(state);
        };
        GenericController.MODEL_BASE_URL = 'https://controllers.babylonjs.com/generic/';
        GenericController.MODEL_FILENAME = 'generic.babylon';
        return GenericController;
    }(BABYLON.WebVRController));
    BABYLON.GenericController = GenericController;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.genericController.js.map


var BABYLON;
(function (BABYLON) {
    var LoadedMeshInfo = /** @class */ (function () {
        function LoadedMeshInfo() {
            this.buttonMeshes = {};
            this.axisMeshes = {};
        }
        return LoadedMeshInfo;
    }());
    var WindowsMotionController = /** @class */ (function (_super) {
        __extends(WindowsMotionController, _super);
        function WindowsMotionController(vrGamepad) {
            var _this = _super.call(this, vrGamepad) || this;
            _this._mapping = {
                // Semantic button names
                buttons: ['thumbstick', 'trigger', 'grip', 'menu', 'trackpad'],
                // A mapping of the button name to glTF model node name
                // that should be transformed by button value.
                buttonMeshNames: {
                    'trigger': 'SELECT',
                    'menu': 'MENU',
                    'grip': 'GRASP',
                    'thumbstick': 'THUMBSTICK_PRESS',
                    'trackpad': 'TOUCHPAD_PRESS'
                },
                // This mapping is used to translate from the Motion Controller to Babylon semantics
                buttonObservableNames: {
                    'trigger': 'onTriggerStateChangedObservable',
                    'menu': 'onSecondaryButtonStateChangedObservable',
                    'grip': 'onMainButtonStateChangedObservable',
                    'thumbstick': 'onPadStateChangedObservable',
                    'trackpad': 'onTrackpadChangedObservable'
                },
                // A mapping of the axis name to glTF model node name
                // that should be transformed by axis value.
                // This array mirrors the browserGamepad.axes array, such that 
                // the mesh corresponding to axis 0 is in this array index 0.
                axisMeshNames: [
                    'THUMBSTICK_X',
                    'THUMBSTICK_Y',
                    'TOUCHPAD_TOUCH_X',
                    'TOUCHPAD_TOUCH_Y'
                ],
                pointingPoseMeshName: 'POINTING_POSE'
            };
            _this.onTrackpadChangedObservable = new BABYLON.Observable();
            _this.onTrackpadValuesChangedObservable = new BABYLON.Observable();
            _this.trackpad = { x: 0, y: 0 };
            _this.controllerType = BABYLON.PoseEnabledControllerType.WINDOWS;
            _this._loadedMeshInfo = null;
            return _this;
        }
        Object.defineProperty(WindowsMotionController.prototype, "onTriggerButtonStateChangedObservable", {
            get: function () {
                return this.onTriggerStateChangedObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WindowsMotionController.prototype, "onMenuButtonStateChangedObservable", {
            get: function () {
                return this.onSecondaryButtonStateChangedObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WindowsMotionController.prototype, "onGripButtonStateChangedObservable", {
            get: function () {
                return this.onMainButtonStateChangedObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WindowsMotionController.prototype, "onThumbstickButtonStateChangedObservable", {
            get: function () {
                return this.onPadStateChangedObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WindowsMotionController.prototype, "onTouchpadButtonStateChangedObservable", {
            get: function () {
                return this.onTrackpadChangedObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WindowsMotionController.prototype, "onTouchpadValuesChangedObservable", {
            get: function () {
                return this.onTrackpadValuesChangedObservable;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Called once per frame by the engine.
         */
        WindowsMotionController.prototype.update = function () {
            _super.prototype.update.call(this);
            // Only need to animate axes if there is a loaded mesh
            if (this._loadedMeshInfo) {
                if (this.browserGamepad.axes) {
                    if (this.browserGamepad.axes[2] != this.trackpad.x || this.browserGamepad.axes[3] != this.trackpad.y) {
                        this.trackpad.x = this.browserGamepad["axes"][2];
                        this.trackpad.y = this.browserGamepad["axes"][3];
                        this.onTrackpadValuesChangedObservable.notifyObservers(this.trackpad);
                    }
                    for (var axis = 0; axis < this._mapping.axisMeshNames.length; axis++) {
                        this.lerpAxisTransform(axis, this.browserGamepad.axes[axis]);
                    }
                }
            }
        };
        /**
         * Called once for each button that changed state since the last frame
         * @param buttonIdx Which button index changed
         * @param state New state of the button
         * @param changes Which properties on the state changed since last frame
         */
        WindowsMotionController.prototype.handleButtonChange = function (buttonIdx, state, changes) {
            var buttonName = this._mapping.buttons[buttonIdx];
            if (!buttonName) {
                return;
            }
            // Only emit events for buttons that we know how to map from index to name
            var observable = this[(this._mapping.buttonObservableNames)[buttonName]];
            if (observable) {
                observable.notifyObservers(state);
            }
            this.lerpButtonTransform(buttonName, state.value);
        };
        WindowsMotionController.prototype.lerpButtonTransform = function (buttonName, buttonValue) {
            // If there is no loaded mesh, there is nothing to transform.
            if (!this._loadedMeshInfo) {
                return;
            }
            var meshInfo = this._loadedMeshInfo.buttonMeshes[buttonName];
            if (!meshInfo.unpressed.rotationQuaternion || !meshInfo.pressed.rotationQuaternion || !meshInfo.value.rotationQuaternion) {
                return;
            }
            BABYLON.Quaternion.SlerpToRef(meshInfo.unpressed.rotationQuaternion, meshInfo.pressed.rotationQuaternion, buttonValue, meshInfo.value.rotationQuaternion);
            BABYLON.Vector3.LerpToRef(meshInfo.unpressed.position, meshInfo.pressed.position, buttonValue, meshInfo.value.position);
        };
        WindowsMotionController.prototype.lerpAxisTransform = function (axis, axisValue) {
            if (!this._loadedMeshInfo) {
                return;
            }
            var meshInfo = this._loadedMeshInfo.axisMeshes[axis];
            if (!meshInfo) {
                return;
            }
            if (!meshInfo.min.rotationQuaternion || !meshInfo.max.rotationQuaternion || !meshInfo.value.rotationQuaternion) {
                return;
            }
            // Convert from gamepad value range (-1 to +1) to lerp range (0 to 1)
            var lerpValue = axisValue * 0.5 + 0.5;
            BABYLON.Quaternion.SlerpToRef(meshInfo.min.rotationQuaternion, meshInfo.max.rotationQuaternion, lerpValue, meshInfo.value.rotationQuaternion);
            BABYLON.Vector3.LerpToRef(meshInfo.min.position, meshInfo.max.position, lerpValue, meshInfo.value.position);
        };
        /**
         * Implements abstract method on WebVRController class, loading controller meshes and calling this.attachToMesh if successful.
         * @param scene scene in which to add meshes
         * @param meshLoaded optional callback function that will be called if the mesh loads successfully.
         */
        WindowsMotionController.prototype.initControllerMesh = function (scene, meshLoaded, forceDefault) {
            var _this = this;
            if (forceDefault === void 0) { forceDefault = false; }
            var path;
            var filename;
            // Checking if GLB loader is present
            if (BABYLON.SceneLoader.IsPluginForExtensionAvailable(".glb")) {
                // Determine the device specific folder based on the ID suffix
                var device = 'default';
                if (this.id && !forceDefault) {
                    var match = this.id.match(WindowsMotionController.GAMEPAD_ID_PATTERN);
                    device = ((match && match[0]) || device);
                }
                // Hand
                if (this.hand === 'left') {
                    filename = WindowsMotionController.MODEL_LEFT_FILENAME;
                }
                else {
                    filename = WindowsMotionController.MODEL_RIGHT_FILENAME;
                }
                path = WindowsMotionController.MODEL_BASE_URL + device + '/';
            }
            else {
                BABYLON.Tools.Warn("You need to reference GLTF loader to load Windows Motion Controllers model. Falling back to generic models");
                path = BABYLON.GenericController.MODEL_BASE_URL;
                filename = BABYLON.GenericController.MODEL_FILENAME;
            }
            BABYLON.SceneLoader.ImportMesh("", path, filename, scene, function (meshes) {
                // glTF files successfully loaded from the remote server, now process them to ensure they are in the right format.
                _this._loadedMeshInfo = _this.processModel(scene, meshes);
                if (!_this._loadedMeshInfo) {
                    return;
                }
                _this._defaultModel = _this._loadedMeshInfo.rootNode;
                _this.attachToMesh(_this._defaultModel);
                if (meshLoaded) {
                    meshLoaded(_this._defaultModel);
                }
            }, null, function (scene, message) {
                BABYLON.Tools.Log(message);
                BABYLON.Tools.Warn('Failed to retrieve controller model from the remote server: ' + path + filename);
                if (!forceDefault) {
                    _this.initControllerMesh(scene, meshLoaded, true);
                }
            });
        };
        /**
         * Takes a list of meshes (as loaded from the glTF file) and finds the root node, as well as nodes that
         * can be transformed by button presses and axes values, based on this._mapping.
         *
         * @param scene scene in which the meshes exist
         * @param meshes list of meshes that make up the controller model to process
         * @return structured view of the given meshes, with mapping of buttons and axes to meshes that can be transformed.
         */
        WindowsMotionController.prototype.processModel = function (scene, meshes) {
            var loadedMeshInfo = null;
            // Create a new mesh to contain the glTF hierarchy
            var parentMesh = new BABYLON.Mesh(this.id + " " + this.hand, scene);
            // Find the root node in the loaded glTF scene, and attach it as a child of 'parentMesh'
            var childMesh = null;
            for (var i = 0; i < meshes.length; i++) {
                var mesh = meshes[i];
                if (!mesh.parent) {
                    // Exclude controller meshes from picking results
                    mesh.isPickable = false;
                    // Handle root node, attach to the new parentMesh
                    childMesh = mesh;
                    break;
                }
            }
            if (childMesh) {
                childMesh.setParent(parentMesh);
                // Create our mesh info. Note that this method will always return non-null.
                loadedMeshInfo = this.createMeshInfo(parentMesh);
            }
            else {
                BABYLON.Tools.Warn('Could not find root node in model file.');
            }
            return loadedMeshInfo;
        };
        WindowsMotionController.prototype.createMeshInfo = function (rootNode) {
            var loadedMeshInfo = new LoadedMeshInfo();
            var i;
            loadedMeshInfo.rootNode = rootNode;
            // Reset the caches
            loadedMeshInfo.buttonMeshes = {};
            loadedMeshInfo.axisMeshes = {};
            // Button Meshes
            for (i = 0; i < this._mapping.buttons.length; i++) {
                var buttonMeshName = this._mapping.buttonMeshNames[this._mapping.buttons[i]];
                if (!buttonMeshName) {
                    BABYLON.Tools.Log('Skipping unknown button at index: ' + i + ' with mapped name: ' + this._mapping.buttons[i]);
                    continue;
                }
                var buttonMesh = getChildByName(rootNode, buttonMeshName);
                if (!buttonMesh) {
                    BABYLON.Tools.Warn('Missing button mesh with name: ' + buttonMeshName);
                    continue;
                }
                var buttonMeshInfo = {
                    index: i,
                    value: getImmediateChildByName(buttonMesh, 'VALUE'),
                    pressed: getImmediateChildByName(buttonMesh, 'PRESSED'),
                    unpressed: getImmediateChildByName(buttonMesh, 'UNPRESSED')
                };
                if (buttonMeshInfo.value && buttonMeshInfo.pressed && buttonMeshInfo.unpressed) {
                    loadedMeshInfo.buttonMeshes[this._mapping.buttons[i]] = buttonMeshInfo;
                }
                else {
                    // If we didn't find the mesh, it simply means this button won't have transforms applied as mapped button value changes.
                    BABYLON.Tools.Warn('Missing button submesh under mesh with name: ' + buttonMeshName +
                        '(VALUE: ' + !!buttonMeshInfo.value +
                        ', PRESSED: ' + !!buttonMeshInfo.pressed +
                        ', UNPRESSED:' + !!buttonMeshInfo.unpressed +
                        ')');
                }
            }
            // Axis Meshes
            for (i = 0; i < this._mapping.axisMeshNames.length; i++) {
                var axisMeshName = this._mapping.axisMeshNames[i];
                if (!axisMeshName) {
                    BABYLON.Tools.Log('Skipping unknown axis at index: ' + i);
                    continue;
                }
                var axisMesh = getChildByName(rootNode, axisMeshName);
                if (!axisMesh) {
                    BABYLON.Tools.Warn('Missing axis mesh with name: ' + axisMeshName);
                    continue;
                }
                var axisMeshInfo = {
                    index: i,
                    value: getImmediateChildByName(axisMesh, 'VALUE'),
                    min: getImmediateChildByName(axisMesh, 'MIN'),
                    max: getImmediateChildByName(axisMesh, 'MAX')
                };
                if (axisMeshInfo.value && axisMeshInfo.min && axisMeshInfo.max) {
                    loadedMeshInfo.axisMeshes[i] = axisMeshInfo;
                }
                else {
                    // If we didn't find the mesh, it simply means thit axis won't have transforms applied as mapped axis values change.
                    BABYLON.Tools.Warn('Missing axis submesh under mesh with name: ' + axisMeshName +
                        '(VALUE: ' + !!axisMeshInfo.value +
                        ', MIN: ' + !!axisMeshInfo.min +
                        ', MAX:' + !!axisMeshInfo.max +
                        ')');
                }
            }
            // Pointing Ray
            loadedMeshInfo.pointingPoseNode = getChildByName(rootNode, this._mapping.pointingPoseMeshName);
            if (!loadedMeshInfo.pointingPoseNode) {
                BABYLON.Tools.Warn('Missing pointing pose mesh with name: ' + this._mapping.pointingPoseMeshName);
            }
            return loadedMeshInfo;
            // Look through all children recursively. This will return null if no mesh exists with the given name.
            function getChildByName(node, name) {
                return node.getChildMeshes(false, function (n) { return n.name === name; })[0];
            }
            // Look through only immediate children. This will return null if no mesh exists with the given name.
            function getImmediateChildByName(node, name) {
                return node.getChildMeshes(true, function (n) { return n.name == name; })[0];
            }
        };
        WindowsMotionController.prototype.getForwardRay = function (length) {
            if (length === void 0) { length = 100; }
            if (!(this._loadedMeshInfo && this._loadedMeshInfo.pointingPoseNode)) {
                return _super.prototype.getForwardRay.call(this, length);
            }
            var m = this._loadedMeshInfo.pointingPoseNode.getWorldMatrix();
            var origin = m.getTranslation();
            var forward = new BABYLON.Vector3(0, 0, -1);
            var forwardWorld = BABYLON.Vector3.TransformNormal(forward, m);
            var direction = BABYLON.Vector3.Normalize(forwardWorld);
            return new BABYLON.Ray(origin, direction, length);
        };
        WindowsMotionController.prototype.dispose = function () {
            _super.prototype.dispose.call(this);
            this.onTrackpadChangedObservable.clear();
        };
        WindowsMotionController.MODEL_BASE_URL = 'https://controllers.babylonjs.com/microsoft/';
        WindowsMotionController.MODEL_LEFT_FILENAME = 'left.glb';
        WindowsMotionController.MODEL_RIGHT_FILENAME = 'right.glb';
        WindowsMotionController.GAMEPAD_ID_PREFIX = 'Spatial Controller (Spatial Interaction Source) ';
        WindowsMotionController.GAMEPAD_ID_PATTERN = /([0-9a-zA-Z]+-[0-9a-zA-Z]+)$/;
        return WindowsMotionController;
    }(BABYLON.WebVRController));
    BABYLON.WindowsMotionController = WindowsMotionController;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.windowsMotionController.js.map

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
(function() {
var EXPORTS = {};EXPORTS['FreeCameraGamepadInput'] = BABYLON['FreeCameraGamepadInput'];EXPORTS['ArcRotateCameraGamepadInput'] = BABYLON['ArcRotateCameraGamepadInput'];EXPORTS['GamepadManager'] = BABYLON['GamepadManager'];EXPORTS['StickValues'] = BABYLON['StickValues'];EXPORTS['Gamepad'] = BABYLON['Gamepad'];EXPORTS['GenericPad'] = BABYLON['GenericPad'];EXPORTS['Xbox360Button'] = BABYLON['Xbox360Button'];EXPORTS['Xbox360Dpad'] = BABYLON['Xbox360Dpad'];EXPORTS['Xbox360Pad'] = BABYLON['Xbox360Pad'];EXPORTS['PoseEnabledControllerType'] = BABYLON['PoseEnabledControllerType'];EXPORTS['PoseEnabledControllerHelper'] = BABYLON['PoseEnabledControllerHelper'];EXPORTS['PoseEnabledController'] = BABYLON['PoseEnabledController'];EXPORTS['WebVRController'] = BABYLON['WebVRController'];EXPORTS['OculusTouchController'] = BABYLON['OculusTouchController'];EXPORTS['ViveController'] = BABYLON['ViveController'];EXPORTS['GenericController'] = BABYLON['GenericController'];EXPORTS['WindowsMotionController'] = BABYLON['WindowsMotionController'];
    globalObject["BABYLON"] = globalObject["BABYLON"] || BABYLON;
    module.exports = EXPORTS;
    })();
}