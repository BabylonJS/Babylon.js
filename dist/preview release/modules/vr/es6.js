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
    var VRDistortionCorrectionPostProcess = /** @class */ (function (_super) {
        __extends(VRDistortionCorrectionPostProcess, _super);
        function VRDistortionCorrectionPostProcess(name, camera, isRightEye, vrMetrics) {
            var _this = _super.call(this, name, "vrDistortionCorrection", [
                'LensCenter',
                'Scale',
                'ScaleIn',
                'HmdWarpParam'
            ], null, vrMetrics.postProcessScaleFactor, camera, BABYLON.Texture.BILINEAR_SAMPLINGMODE) || this;
            _this._isRightEye = isRightEye;
            _this._distortionFactors = vrMetrics.distortionK;
            _this._postProcessScaleFactor = vrMetrics.postProcessScaleFactor;
            _this._lensCenterOffset = vrMetrics.lensCenterOffset;
            _this.adaptScaleToCurrentViewport = true;
            _this.onSizeChangedObservable.add(function () {
                _this.aspectRatio = _this.width * .5 / _this.height;
                _this._scaleIn = new BABYLON.Vector2(2, 2 / _this.aspectRatio);
                _this._scaleFactor = new BABYLON.Vector2(.5 * (1 / _this._postProcessScaleFactor), .5 * (1 / _this._postProcessScaleFactor) * _this.aspectRatio);
                _this._lensCenter = new BABYLON.Vector2(_this._isRightEye ? 0.5 - _this._lensCenterOffset * 0.5 : 0.5 + _this._lensCenterOffset * 0.5, 0.5);
            });
            _this.onApplyObservable.add(function (effect) {
                effect.setFloat2("LensCenter", _this._lensCenter.x, _this._lensCenter.y);
                effect.setFloat2("Scale", _this._scaleFactor.x, _this._scaleFactor.y);
                effect.setFloat2("ScaleIn", _this._scaleIn.x, _this._scaleIn.y);
                effect.setFloat4("HmdWarpParam", _this._distortionFactors[0], _this._distortionFactors[1], _this._distortionFactors[2], _this._distortionFactors[3]);
            });
            return _this;
        }
        return VRDistortionCorrectionPostProcess;
    }(BABYLON.PostProcess));
    BABYLON.VRDistortionCorrectionPostProcess = VRDistortionCorrectionPostProcess;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.vrDistortionCorrectionPostProcess.js.map


var BABYLON;
(function (BABYLON) {
    var AnaglyphPostProcess = /** @class */ (function (_super) {
        __extends(AnaglyphPostProcess, _super);
        function AnaglyphPostProcess(name, options, rigCameras, samplingMode, engine, reusable) {
            var _this = _super.call(this, name, "anaglyph", null, ["leftSampler"], options, rigCameras[1], samplingMode, engine, reusable) || this;
            _this._passedProcess = rigCameras[0]._rigPostProcess;
            _this.onApplyObservable.add(function (effect) {
                effect.setTextureFromPostProcess("leftSampler", _this._passedProcess);
            });
            return _this;
        }
        return AnaglyphPostProcess;
    }(BABYLON.PostProcess));
    BABYLON.AnaglyphPostProcess = AnaglyphPostProcess;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.anaglyphPostProcess.js.map


var BABYLON;
(function (BABYLON) {
    var StereoscopicInterlacePostProcess = /** @class */ (function (_super) {
        __extends(StereoscopicInterlacePostProcess, _super);
        function StereoscopicInterlacePostProcess(name, rigCameras, isStereoscopicHoriz, samplingMode, engine, reusable) {
            var _this = _super.call(this, name, "stereoscopicInterlace", ['stepSize'], ['camASampler'], 1, rigCameras[1], samplingMode, engine, reusable, isStereoscopicHoriz ? "#define IS_STEREOSCOPIC_HORIZ 1" : undefined) || this;
            _this._passedProcess = rigCameras[0]._rigPostProcess;
            _this._stepSize = new BABYLON.Vector2(1 / _this.width, 1 / _this.height);
            _this.onSizeChangedObservable.add(function () {
                _this._stepSize = new BABYLON.Vector2(1 / _this.width, 1 / _this.height);
            });
            _this.onApplyObservable.add(function (effect) {
                effect.setTextureFromPostProcess("camASampler", _this._passedProcess);
                effect.setFloat2("stepSize", _this._stepSize.x, _this._stepSize.y);
            });
            return _this;
        }
        return StereoscopicInterlacePostProcess;
    }(BABYLON.PostProcess));
    BABYLON.StereoscopicInterlacePostProcess = StereoscopicInterlacePostProcess;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.stereoscopicInterlacePostProcess.js.map

var BABYLON;
(function (BABYLON) {
    var FreeCameraDeviceOrientationInput = /** @class */ (function () {
        function FreeCameraDeviceOrientationInput() {
            var _this = this;
            this._screenOrientationAngle = 0;
            this._screenQuaternion = new BABYLON.Quaternion();
            this._alpha = 0;
            this._beta = 0;
            this._gamma = 0;
            this._orientationChanged = function () {
                _this._screenOrientationAngle = (window.orientation !== undefined ? +window.orientation : (window.screen.orientation && window.screen.orientation['angle'] ? window.screen.orientation.angle : 0));
                _this._screenOrientationAngle = -BABYLON.Tools.ToRadians(_this._screenOrientationAngle / 2);
                _this._screenQuaternion.copyFromFloats(0, Math.sin(_this._screenOrientationAngle), 0, Math.cos(_this._screenOrientationAngle));
            };
            this._deviceOrientation = function (evt) {
                _this._alpha = evt.alpha !== null ? evt.alpha : 0;
                _this._beta = evt.beta !== null ? evt.beta : 0;
                _this._gamma = evt.gamma !== null ? evt.gamma : 0;
            };
            this._constantTranform = new BABYLON.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
            this._orientationChanged();
        }
        Object.defineProperty(FreeCameraDeviceOrientationInput.prototype, "camera", {
            get: function () {
                return this._camera;
            },
            set: function (camera) {
                this._camera = camera;
                if (this._camera != null && !this._camera.rotationQuaternion) {
                    this._camera.rotationQuaternion = new BABYLON.Quaternion();
                }
            },
            enumerable: true,
            configurable: true
        });
        FreeCameraDeviceOrientationInput.prototype.attachControl = function (element, noPreventDefault) {
            window.addEventListener("orientationchange", this._orientationChanged);
            window.addEventListener("deviceorientation", this._deviceOrientation);
            //In certain cases, the attach control is called AFTER orientation was changed,
            //So this is needed.
            this._orientationChanged();
        };
        FreeCameraDeviceOrientationInput.prototype.detachControl = function (element) {
            window.removeEventListener("orientationchange", this._orientationChanged);
            window.removeEventListener("deviceorientation", this._deviceOrientation);
        };
        FreeCameraDeviceOrientationInput.prototype.checkInputs = function () {
            //if no device orientation provided, don't update the rotation.
            //Only testing against alpha under the assumption thatnorientation will never be so exact when set.
            if (!this._alpha)
                return;
            BABYLON.Quaternion.RotationYawPitchRollToRef(BABYLON.Tools.ToRadians(this._alpha), BABYLON.Tools.ToRadians(this._beta), -BABYLON.Tools.ToRadians(this._gamma), this.camera.rotationQuaternion);
            this._camera.rotationQuaternion.multiplyInPlace(this._screenQuaternion);
            this._camera.rotationQuaternion.multiplyInPlace(this._constantTranform);
            //Mirror on XY Plane
            this._camera.rotationQuaternion.z *= -1;
            this._camera.rotationQuaternion.w *= -1;
        };
        FreeCameraDeviceOrientationInput.prototype.getClassName = function () {
            return "FreeCameraDeviceOrientationInput";
        };
        FreeCameraDeviceOrientationInput.prototype.getSimpleName = function () {
            return "deviceOrientation";
        };
        return FreeCameraDeviceOrientationInput;
    }());
    BABYLON.FreeCameraDeviceOrientationInput = FreeCameraDeviceOrientationInput;
    BABYLON.CameraInputTypes["FreeCameraDeviceOrientationInput"] = FreeCameraDeviceOrientationInput;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.freeCameraDeviceOrientationInput.js.map

var BABYLON;
(function (BABYLON) {
    var ArcRotateCameraVRDeviceOrientationInput = /** @class */ (function () {
        function ArcRotateCameraVRDeviceOrientationInput() {
            this.alphaCorrection = 1;
            this.betaCorrection = 1;
            this.gammaCorrection = 1;
            this._alpha = 0;
            this._gamma = 0;
            this._dirty = false;
            this._deviceOrientationHandler = this._onOrientationEvent.bind(this);
        }
        ArcRotateCameraVRDeviceOrientationInput.prototype.attachControl = function (element, noPreventDefault) {
            this.camera.attachControl(element, noPreventDefault);
            window.addEventListener("deviceorientation", this._deviceOrientationHandler);
        };
        ArcRotateCameraVRDeviceOrientationInput.prototype._onOrientationEvent = function (evt) {
            if (evt.alpha !== null) {
                this._alpha = +evt.alpha | 0;
            }
            if (evt.gamma !== null) {
                this._gamma = +evt.gamma | 0;
            }
            this._dirty = true;
        };
        ArcRotateCameraVRDeviceOrientationInput.prototype.checkInputs = function () {
            if (this._dirty) {
                this._dirty = false;
                if (this._gamma < 0) {
                    this._gamma = 180 + this._gamma;
                }
                this.camera.alpha = (-this._alpha / 180.0 * Math.PI) % Math.PI * 2;
                this.camera.beta = (this._gamma / 180.0 * Math.PI);
            }
        };
        ArcRotateCameraVRDeviceOrientationInput.prototype.detachControl = function (element) {
            window.removeEventListener("deviceorientation", this._deviceOrientationHandler);
        };
        ArcRotateCameraVRDeviceOrientationInput.prototype.getClassName = function () {
            return "ArcRotateCameraVRDeviceOrientationInput";
        };
        ArcRotateCameraVRDeviceOrientationInput.prototype.getSimpleName = function () {
            return "VRDeviceOrientation";
        };
        return ArcRotateCameraVRDeviceOrientationInput;
    }());
    BABYLON.ArcRotateCameraVRDeviceOrientationInput = ArcRotateCameraVRDeviceOrientationInput;
    BABYLON.CameraInputTypes["ArcRotateCameraVRDeviceOrientationInput"] = ArcRotateCameraVRDeviceOrientationInput;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.arcRotateCameraVRDeviceOrientationInput.js.map

BABYLON.Effect.ShadersStore['defaultVertexShader'] = "#include<__decl__defaultVertex>\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef TANGENT\nattribute vec4 tangent;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<helperFunctions>\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2;\n#endif\n#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0\nvarying vec2 vDiffuseUV;\n#endif\n#if defined(AMBIENT) && AMBIENTDIRECTUV == 0\nvarying vec2 vAmbientUV;\n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0\nvarying vec2 vOpacityUV;\n#endif\n#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0\nvarying vec2 vEmissiveUV;\n#endif\n#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0\nvarying vec2 vLightmapUV;\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM) && SPECULARDIRECTUV == 0\nvarying vec2 vSpecularUV;\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0\nvarying vec2 vBumpUV;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<bumpVertexDeclaration>\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<morphTargetsVertexGlobalDeclaration>\n#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#include<logDepthDeclaration>\nvoid main(void) {\nvec3 positionUpdated=position;\n#ifdef NORMAL \nvec3 normalUpdated=normal;\n#endif\n#ifdef TANGENT\nvec4 tangentUpdated=tangent;\n#endif\n#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvPositionUVW=positionUpdated;\n#endif \n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(positionUpdated,1.0);\nvec4 worldPos=finalWorld*vec4(positionUpdated,1.0);\nvPositionW=vec3(worldPos);\n#ifdef NORMAL\nmat3 normalWorld=mat3(finalWorld);\n#ifdef NONUNIFORMSCALING\nnormalWorld=transposeMat3(inverseMat3(normalWorld));\n#endif\nvNormalW=normalize(normalWorld*normalUpdated);\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvDirectionW=normalize(vec3(finalWorld*vec4(positionUpdated,0.0)));\n#endif\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef MAINUV1\nvMainUV1=uv;\n#endif\n#ifdef MAINUV2\nvMainUV2=uv2;\n#endif\n#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0\nif (vDiffuseInfos.x == 0.)\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(AMBIENT) && AMBIENTDIRECTUV == 0\nif (vAmbientInfos.x == 0.)\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0\nif (vOpacityInfos.x == 0.)\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0\nif (vEmissiveInfos.x == 0.)\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0\nif (vLightmapInfos.x == 0.)\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM) && SPECULARDIRECTUV == 0\nif (vSpecularInfos.x == 0.)\n{\nvSpecularUV=vec2(specularMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvSpecularUV=vec2(specularMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0\nif (vBumpInfos.x == 0.)\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#include<bumpVertex>\n#include<clipPlaneVertex>\n#include<fogVertex>\n#include<shadowsVertex>[0..maxSimultaneousLights]\n#ifdef VERTEXCOLOR\n\nvColor=color;\n#endif\n#include<pointCloudVertex>\n#include<logDepthVertex>\n}";
BABYLON.Effect.ShadersStore['defaultPixelShader'] = "#include<__decl__defaultFragment>\n#if defined(BUMP) || !defined(NORMAL)\n#extension GL_OES_standard_derivatives : enable\n#endif\n#ifdef LOGARITHMICDEPTH\n#extension GL_EXT_frag_depth : enable\n#endif\n\n#define RECIPROCAL_PI2 0.15915494\nuniform vec3 vEyePosition;\nuniform vec3 vAmbientColor;\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2;\n#endif\n\n#include<helperFunctions>\n\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n\n#ifdef DIFFUSE\n#if DIFFUSEDIRECTUV == 1\n#define vDiffuseUV vMainUV1\n#elif DIFFUSEDIRECTUV == 2\n#define vDiffuseUV vMainUV2\n#else\nvarying vec2 vDiffuseUV;\n#endif\nuniform sampler2D diffuseSampler;\n#endif\n#ifdef AMBIENT\n#if AMBIENTDIRECTUV == 1\n#define vAmbientUV vMainUV1\n#elif AMBIENTDIRECTUV == 2\n#define vAmbientUV vMainUV2\n#else\nvarying vec2 vAmbientUV;\n#endif\nuniform sampler2D ambientSampler;\n#endif\n#ifdef OPACITY \n#if OPACITYDIRECTUV == 1\n#define vOpacityUV vMainUV1\n#elif OPACITYDIRECTUV == 2\n#define vOpacityUV vMainUV2\n#else\nvarying vec2 vOpacityUV;\n#endif\nuniform sampler2D opacitySampler;\n#endif\n#ifdef EMISSIVE\n#if EMISSIVEDIRECTUV == 1\n#define vEmissiveUV vMainUV1\n#elif EMISSIVEDIRECTUV == 2\n#define vEmissiveUV vMainUV2\n#else\nvarying vec2 vEmissiveUV;\n#endif\nuniform sampler2D emissiveSampler;\n#endif\n#ifdef LIGHTMAP\n#if LIGHTMAPDIRECTUV == 1\n#define vLightmapUV vMainUV1\n#elif LIGHTMAPDIRECTUV == 2\n#define vLightmapUV vMainUV2\n#else\nvarying vec2 vLightmapUV;\n#endif\nuniform sampler2D lightmapSampler;\n#endif\n#ifdef REFRACTION\n#ifdef REFRACTIONMAP_3D\nuniform samplerCube refractionCubeSampler;\n#else\nuniform sampler2D refraction2DSampler;\n#endif\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\n#if SPECULARDIRECTUV == 1\n#define vSpecularUV vMainUV1\n#elif SPECULARDIRECTUV == 2\n#define vSpecularUV vMainUV2\n#else\nvarying vec2 vSpecularUV;\n#endif\nuniform sampler2D specularSampler;\n#endif\n\n#include<fresnelFunction>\n\n#ifdef REFLECTION\n#ifdef REFLECTIONMAP_3D\nuniform samplerCube reflectionCubeSampler;\n#else\nuniform sampler2D reflection2DSampler;\n#endif\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#else\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#endif\n#include<reflectionFunction>\n#endif\n#include<imageProcessingDeclaration>\n#include<imageProcessingFunctions>\n#include<bumpFragmentFunctions>\n#include<clipPlaneFragmentDeclaration>\n#include<logDepthDeclaration>\n#include<fogFragmentDeclaration>\nvoid main(void) {\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\nvec4 baseColor=vec4(1.,1.,1.,1.);\nvec3 diffuseColor=vDiffuseColor.rgb;\n\nfloat alpha=vDiffuseColor.a;\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=normalize(-cross(dFdx(vPositionW),dFdy(vPositionW)));\n#endif\n#include<bumpFragment>\n#ifdef TWOSIDEDLIGHTING\nnormalW=gl_FrontFacing ? normalW : -normalW;\n#endif\n#ifdef DIFFUSE\nbaseColor=texture2D(diffuseSampler,vDiffuseUV+uvOffset);\n#ifdef ALPHATEST\nif (baseColor.a<0.4)\ndiscard;\n#endif\n#ifdef ALPHAFROMDIFFUSE\nalpha*=baseColor.a;\n#endif\nbaseColor.rgb*=vDiffuseInfos.y;\n#endif\n#include<depthPrePass>\n#ifdef VERTEXCOLOR\nbaseColor.rgb*=vColor.rgb;\n#endif\n\nvec3 baseAmbientColor=vec3(1.,1.,1.);\n#ifdef AMBIENT\nbaseAmbientColor=texture2D(ambientSampler,vAmbientUV+uvOffset).rgb*vAmbientInfos.y;\n#endif\n\n#ifdef SPECULARTERM\nfloat glossiness=vSpecularColor.a;\nvec3 specularColor=vSpecularColor.rgb;\n#ifdef SPECULAR\nvec4 specularMapColor=texture2D(specularSampler,vSpecularUV+uvOffset);\nspecularColor=specularMapColor.rgb;\n#ifdef GLOSSINESS\nglossiness=glossiness*specularMapColor.a;\n#endif\n#endif\n#else\nfloat glossiness=0.;\n#endif\n\nvec3 diffuseBase=vec3(0.,0.,0.);\nlightingInfo info;\n#ifdef SPECULARTERM\nvec3 specularBase=vec3(0.,0.,0.);\n#endif\nfloat shadow=1.;\n#ifdef LIGHTMAP\nvec3 lightmapColor=texture2D(lightmapSampler,vLightmapUV+uvOffset).rgb*vLightmapInfos.y;\n#endif\n#include<lightFragment>[0..maxSimultaneousLights]\n\nvec3 refractionColor=vec3(0.,0.,0.);\n#ifdef REFRACTION\nvec3 refractionVector=normalize(refract(-viewDirectionW,normalW,vRefractionInfos.y));\n#ifdef REFRACTIONMAP_3D\nrefractionVector.y=refractionVector.y*vRefractionInfos.w;\nif (dot(refractionVector,viewDirectionW)<1.0)\n{\nrefractionColor=textureCube(refractionCubeSampler,refractionVector).rgb*vRefractionInfos.x;\n}\n#else\nvec3 vRefractionUVW=vec3(refractionMatrix*(view*vec4(vPositionW+refractionVector*vRefractionInfos.z,1.0)));\nvec2 refractionCoords=vRefractionUVW.xy/vRefractionUVW.z;\nrefractionCoords.y=1.0-refractionCoords.y;\nrefractionColor=texture2D(refraction2DSampler,refractionCoords).rgb*vRefractionInfos.x;\n#endif\n#endif\n\nvec3 reflectionColor=vec3(0.,0.,0.);\n#ifdef REFLECTION\nvec3 vReflectionUVW=computeReflectionCoords(vec4(vPositionW,1.0),normalW);\n#ifdef REFLECTIONMAP_3D\n#ifdef ROUGHNESS\nfloat bias=vReflectionInfos.y;\n#ifdef SPECULARTERM\n#ifdef SPECULAR\n#ifdef GLOSSINESS\nbias*=(1.0-specularMapColor.a);\n#endif\n#endif\n#endif\nreflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW,bias).rgb*vReflectionInfos.x;\n#else\nreflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW).rgb*vReflectionInfos.x;\n#endif\n#else\nvec2 coords=vReflectionUVW.xy;\n#ifdef REFLECTIONMAP_PROJECTION\ncoords/=vReflectionUVW.z;\n#endif\ncoords.y=1.0-coords.y;\nreflectionColor=texture2D(reflection2DSampler,coords).rgb*vReflectionInfos.x;\n#endif\n#ifdef REFLECTIONFRESNEL\nfloat reflectionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,reflectionRightColor.a,reflectionLeftColor.a);\n#ifdef REFLECTIONFRESNELFROMSPECULAR\n#ifdef SPECULARTERM\nreflectionColor*=specularColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#else\nreflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#endif\n#else\nreflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#endif\n#endif\n#endif\n#ifdef REFRACTIONFRESNEL\nfloat refractionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,refractionRightColor.a,refractionLeftColor.a);\nrefractionColor*=refractionLeftColor.rgb*(1.0-refractionFresnelTerm)+refractionFresnelTerm*refractionRightColor.rgb;\n#endif\n#ifdef OPACITY\nvec4 opacityMap=texture2D(opacitySampler,vOpacityUV+uvOffset);\n#ifdef OPACITYRGB\nopacityMap.rgb=opacityMap.rgb*vec3(0.3,0.59,0.11);\nalpha*=(opacityMap.x+opacityMap.y+opacityMap.z)* vOpacityInfos.y;\n#else\nalpha*=opacityMap.a*vOpacityInfos.y;\n#endif\n#endif\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\n#ifdef OPACITYFRESNEL\nfloat opacityFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,opacityParts.z,opacityParts.w);\nalpha+=opacityParts.x*(1.0-opacityFresnelTerm)+opacityFresnelTerm*opacityParts.y;\n#endif\n\nvec3 emissiveColor=vEmissiveColor;\n#ifdef EMISSIVE\nemissiveColor+=texture2D(emissiveSampler,vEmissiveUV+uvOffset).rgb*vEmissiveInfos.y;\n#endif\n#ifdef EMISSIVEFRESNEL\nfloat emissiveFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,emissiveRightColor.a,emissiveLeftColor.a);\nemissiveColor*=emissiveLeftColor.rgb*(1.0-emissiveFresnelTerm)+emissiveFresnelTerm*emissiveRightColor.rgb;\n#endif\n\n#ifdef DIFFUSEFRESNEL\nfloat diffuseFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,diffuseRightColor.a,diffuseLeftColor.a);\ndiffuseBase*=diffuseLeftColor.rgb*(1.0-diffuseFresnelTerm)+diffuseFresnelTerm*diffuseRightColor.rgb;\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#else\n#ifdef LINKEMISSIVEWITHDIFFUSE\nvec3 finalDiffuse=clamp((diffuseBase+emissiveColor)*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#else\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor+emissiveColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#endif\n#endif\n#ifdef SPECULARTERM\nvec3 finalSpecular=specularBase*specularColor;\n#ifdef SPECULAROVERALPHA\nalpha=clamp(alpha+dot(finalSpecular,vec3(0.3,0.59,0.11)),0.,1.);\n#endif\n#else\nvec3 finalSpecular=vec3(0.0);\n#endif\n#ifdef REFLECTIONOVERALPHA\nalpha=clamp(alpha+dot(reflectionColor,vec3(0.3,0.59,0.11)),0.,1.);\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec4 color=vec4(clamp(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+emissiveColor+refractionColor,0.0,1.0),alpha);\n#else\nvec4 color=vec4(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+refractionColor,alpha);\n#endif\n\n#ifdef LIGHTMAP\n#ifndef LIGHTMAPEXCLUDED\n#ifdef USELIGHTMAPASSHADOWMAP\ncolor.rgb*=lightmapColor;\n#else\ncolor.rgb+=lightmapColor;\n#endif\n#endif\n#endif\n#include<logDepthFragment>\n#include<fogFragment>\n\n\n#ifdef IMAGEPROCESSINGPOSTPROCESS\ncolor.rgb=toLinearSpace(color.rgb);\n#else\n#ifdef IMAGEPROCESSING\ncolor.rgb=toLinearSpace(color.rgb);\ncolor=applyImageProcessing(color);\n#endif\n#endif\n#ifdef PREMULTIPLYALPHA\n\ncolor.rgb*=color.a;\n#endif\ngl_FragColor=color;\n}";
BABYLON.Effect.ShadersStore['anaglyphPixelShader'] = "\nvarying vec2 vUV;\nuniform sampler2D textureSampler;\nuniform sampler2D leftSampler;\nvoid main(void)\n{\nvec4 leftFrag=texture2D(leftSampler,vUV);\nleftFrag=vec4(1.0,leftFrag.g,leftFrag.b,1.0);\nvec4 rightFrag=texture2D(textureSampler,vUV);\nrightFrag=vec4(rightFrag.r,1.0,1.0,1.0);\ngl_FragColor=vec4(rightFrag.rgb*leftFrag.rgb,1.0);\n}";
BABYLON.Effect.ShadersStore['stereoscopicInterlacePixelShader'] = "const vec3 TWO=vec3(2.0,2.0,2.0);\nvarying vec2 vUV;\nuniform sampler2D camASampler;\nuniform sampler2D textureSampler;\nuniform vec2 stepSize;\nvoid main(void)\n{\nbool useCamB;\nvec2 texCoord1;\nvec2 texCoord2;\nvec3 frag1;\nvec3 frag2;\n#ifdef IS_STEREOSCOPIC_HORIZ\nuseCamB=vUV.x>0.5;\ntexCoord1=vec2(useCamB ? (vUV.x-0.5)*2.0 : vUV.x*2.0,vUV.y);\ntexCoord2=vec2(texCoord1.x+stepSize.x,vUV.y);\n#else\nuseCamB=vUV.y>0.5;\ntexCoord1=vec2(vUV.x,useCamB ? (vUV.y-0.5)*2.0 : vUV.y*2.0);\ntexCoord2=vec2(vUV.x,texCoord1.y+stepSize.y);\n#endif\n\nif (useCamB){\nfrag1=texture2D(textureSampler,texCoord1).rgb;\nfrag2=texture2D(textureSampler,texCoord2).rgb;\n}else{\nfrag1=texture2D(camASampler ,texCoord1).rgb;\nfrag2=texture2D(camASampler ,texCoord2).rgb;\n}\ngl_FragColor=vec4((frag1+frag2)/TWO,1.0);\n}";
BABYLON.Effect.ShadersStore['vrDistortionCorrectionPixelShader'] = "\nvarying vec2 vUV;\nuniform sampler2D textureSampler;\nuniform vec2 LensCenter;\nuniform vec2 Scale;\nuniform vec2 ScaleIn;\nuniform vec4 HmdWarpParam;\nvec2 HmdWarp(vec2 in01) {\nvec2 theta=(in01-LensCenter)*ScaleIn; \nfloat rSq=theta.x*theta.x+theta.y*theta.y;\nvec2 rvector=theta*(HmdWarpParam.x+HmdWarpParam.y*rSq+HmdWarpParam.z*rSq*rSq+HmdWarpParam.w*rSq*rSq*rSq);\nreturn LensCenter+Scale*rvector;\n}\nvoid main(void)\n{\nvec2 tc=HmdWarp(vUV);\nif (tc.x <0.0 || tc.x>1.0 || tc.y<0.0 || tc.y>1.0)\ngl_FragColor=vec4(0.0,0.0,0.0,0.0);\nelse{\ngl_FragColor=texture2D(textureSampler,tc);\n}\n}";

var BABYLON;
(function (BABYLON) {
    var VRCameraMetrics = /** @class */ (function () {
        function VRCameraMetrics() {
            this.compensateDistortion = true;
        }
        Object.defineProperty(VRCameraMetrics.prototype, "aspectRatio", {
            get: function () {
                return this.hResolution / (2 * this.vResolution);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VRCameraMetrics.prototype, "aspectRatioFov", {
            get: function () {
                return (2 * Math.atan((this.postProcessScaleFactor * this.vScreenSize) / (2 * this.eyeToScreenDistance)));
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VRCameraMetrics.prototype, "leftHMatrix", {
            get: function () {
                var meters = (this.hScreenSize / 4) - (this.lensSeparationDistance / 2);
                var h = (4 * meters) / this.hScreenSize;
                return BABYLON.Matrix.Translation(h, 0, 0);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VRCameraMetrics.prototype, "rightHMatrix", {
            get: function () {
                var meters = (this.hScreenSize / 4) - (this.lensSeparationDistance / 2);
                var h = (4 * meters) / this.hScreenSize;
                return BABYLON.Matrix.Translation(-h, 0, 0);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VRCameraMetrics.prototype, "leftPreViewMatrix", {
            get: function () {
                return BABYLON.Matrix.Translation(0.5 * this.interpupillaryDistance, 0, 0);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VRCameraMetrics.prototype, "rightPreViewMatrix", {
            get: function () {
                return BABYLON.Matrix.Translation(-0.5 * this.interpupillaryDistance, 0, 0);
            },
            enumerable: true,
            configurable: true
        });
        VRCameraMetrics.GetDefault = function () {
            var result = new VRCameraMetrics();
            result.hResolution = 1280;
            result.vResolution = 800;
            result.hScreenSize = 0.149759993;
            result.vScreenSize = 0.0935999975;
            result.vScreenCenter = 0.0467999987;
            result.eyeToScreenDistance = 0.0410000011;
            result.lensSeparationDistance = 0.0635000020;
            result.interpupillaryDistance = 0.0640000030;
            result.distortionK = [1.0, 0.219999999, 0.239999995, 0.0];
            result.chromaAbCorrection = [0.995999992, -0.00400000019, 1.01400006, 0.0];
            result.postProcessScaleFactor = 1.714605507808412;
            result.lensCenterOffset = 0.151976421;
            return result;
        };
        return VRCameraMetrics;
    }());
    BABYLON.VRCameraMetrics = VRCameraMetrics;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.vrCameraMetrics.js.map


var BABYLON;
(function (BABYLON) {
    var WebVRFreeCamera = /** @class */ (function (_super) {
        __extends(WebVRFreeCamera, _super);
        function WebVRFreeCamera(name, position, scene, webVROptions) {
            if (webVROptions === void 0) { webVROptions = {}; }
            var _this = _super.call(this, name, position, scene) || this;
            _this.webVROptions = webVROptions;
            _this._vrDevice = null;
            _this.rawPose = null;
            _this._specsVersion = "1.1";
            _this._attached = false;
            _this._descendants = [];
            // Represents device position and rotation in room space. Should only be used to help calculate babylon space values
            _this._deviceRoomPosition = BABYLON.Vector3.Zero();
            _this._deviceRoomRotationQuaternion = BABYLON.Quaternion.Identity();
            _this._standingMatrix = null;
            // Represents device position and rotation in babylon space
            _this.devicePosition = BABYLON.Vector3.Zero();
            _this.deviceRotationQuaternion = BABYLON.Quaternion.Identity();
            _this.deviceScaleFactor = 1;
            _this._deviceToWorld = BABYLON.Matrix.Identity();
            _this._worldToDevice = BABYLON.Matrix.Identity();
            _this.controllers = [];
            _this.onControllersAttachedObservable = new BABYLON.Observable();
            _this.onControllerMeshLoadedObservable = new BABYLON.Observable();
            _this.rigParenting = true; // should the rig cameras be used as parent instead of this camera.
            _this._defaultHeight = 0;
            _this.deviceDistanceToRoomGround = function () {
                if (_this._standingMatrix) {
                    // Add standing matrix offset to get real offset from ground in room
                    _this._standingMatrix.getTranslationToRef(_this._workingVector);
                    return _this._deviceRoomPosition.y + _this._workingVector.y;
                }
                else {
                    return _this._defaultHeight;
                }
            };
            _this.useStandingMatrix = function (callback) {
                if (callback === void 0) { callback = function (bool) { }; }
                // Use standing matrix if availible
                if (!navigator || !navigator.getVRDisplays) {
                    callback(false);
                }
                else {
                    navigator.getVRDisplays().then(function (displays) {
                        if (!displays || !displays[0] || !displays[0].stageParameters || !displays[0].stageParameters.sittingToStandingTransform) {
                            callback(false);
                        }
                        else {
                            _this._standingMatrix = new BABYLON.Matrix();
                            BABYLON.Matrix.FromFloat32ArrayToRefScaled(displays[0].stageParameters.sittingToStandingTransform, 0, 1, _this._standingMatrix);
                            if (!_this.getScene().useRightHandedSystem) {
                                [2, 6, 8, 9, 14].forEach(function (num) {
                                    if (_this._standingMatrix) {
                                        _this._standingMatrix.m[num] *= -1;
                                    }
                                });
                            }
                            callback(true);
                        }
                    });
                }
            };
            _this._workingVector = BABYLON.Vector3.Zero();
            _this._oneVector = BABYLON.Vector3.One();
            _this._workingMatrix = BABYLON.Matrix.Identity();
            _this._cache.position = BABYLON.Vector3.Zero();
            if (webVROptions.defaultHeight) {
                _this._defaultHeight = webVROptions.defaultHeight;
                _this.position.y = _this._defaultHeight;
            }
            _this.minZ = 0.1;
            //legacy support - the compensation boolean was removed.
            if (arguments.length === 5) {
                _this.webVROptions = arguments[4];
            }
            // default webVR options
            if (_this.webVROptions.trackPosition == undefined) {
                _this.webVROptions.trackPosition = true;
            }
            if (_this.webVROptions.controllerMeshes == undefined) {
                _this.webVROptions.controllerMeshes = true;
            }
            if (_this.webVROptions.defaultLightingOnControllers == undefined) {
                _this.webVROptions.defaultLightingOnControllers = true;
            }
            _this.rotationQuaternion = new BABYLON.Quaternion();
            if (_this.webVROptions && _this.webVROptions.positionScale) {
                _this.deviceScaleFactor = _this.webVROptions.positionScale;
            }
            //enable VR
            var engine = _this.getEngine();
            _this._onVREnabled = function (success) { if (success) {
                _this.initControllers();
            } };
            engine.onVRRequestPresentComplete.add(_this._onVREnabled);
            engine.initWebVR().add(function (event) {
                if (!event.vrDisplay || _this._vrDevice === event.vrDisplay) {
                    return;
                }
                _this._vrDevice = event.vrDisplay;
                //reset the rig parameters.
                _this.setCameraRigMode(BABYLON.Camera.RIG_MODE_WEBVR, { parentCamera: _this, vrDisplay: _this._vrDevice, frameData: _this._frameData, specs: _this._specsVersion });
                if (_this._attached) {
                    _this.getEngine().enableVR();
                }
            });
            if (typeof (VRFrameData) !== "undefined")
                _this._frameData = new VRFrameData();
            /**
             * The idea behind the following lines:
             * objects that have the camera as parent should actually have the rig cameras as a parent.
             * BUT, each of those cameras has a different view matrix, which means that if we set the parent to the first rig camera,
             * the second will not show it correctly.
             *
             * To solve this - each object that has the camera as parent will be added to a protected array.
             * When the rig camera renders, it will take this array and set all of those to be its children.
             * This way, the right camera will be used as a parent, and the mesh will be rendered correctly.
             * Amazing!
             */
            scene.onBeforeCameraRenderObservable.add(function (camera) {
                if (camera.parent === _this && _this.rigParenting) {
                    _this._descendants = _this.getDescendants(true, function (n) {
                        // don't take the cameras or the controllers!
                        var isController = _this.controllers.some(function (controller) { return controller._mesh === n; });
                        var isRigCamera = _this._rigCameras.indexOf(n) !== -1;
                        return !isController && !isRigCamera;
                    });
                    _this._descendants.forEach(function (node) {
                        node.parent = camera;
                    });
                }
            });
            scene.onAfterCameraRenderObservable.add(function (camera) {
                if (camera.parent === _this && _this.rigParenting) {
                    _this._descendants.forEach(function (node) {
                        node.parent = _this;
                    });
                }
            });
            return _this;
        }
        WebVRFreeCamera.prototype.dispose = function () {
            this.getEngine().onVRRequestPresentComplete.removeCallback(this._onVREnabled);
            _super.prototype.dispose.call(this);
        };
        WebVRFreeCamera.prototype.getControllerByName = function (name) {
            for (var _i = 0, _a = this.controllers; _i < _a.length; _i++) {
                var gp = _a[_i];
                if (gp.hand === name) {
                    return gp;
                }
            }
            return null;
        };
        Object.defineProperty(WebVRFreeCamera.prototype, "leftController", {
            get: function () {
                if (!this._leftController) {
                    this._leftController = this.getControllerByName("left");
                }
                return this._leftController;
            },
            enumerable: true,
            configurable: true
        });
        ;
        Object.defineProperty(WebVRFreeCamera.prototype, "rightController", {
            get: function () {
                if (!this._rightController) {
                    this._rightController = this.getControllerByName("right");
                }
                return this._rightController;
            },
            enumerable: true,
            configurable: true
        });
        ;
        WebVRFreeCamera.prototype.getForwardRay = function (length) {
            if (length === void 0) { length = 100; }
            if (this.leftCamera) {
                // Use left eye to avoid computation to compute center on every call
                return _super.prototype.getForwardRay.call(this, length, this.leftCamera.getWorldMatrix(), this.leftCamera.globalPosition); // Need the actual rendered camera
            }
            else {
                return _super.prototype.getForwardRay.call(this, length);
            }
        };
        WebVRFreeCamera.prototype._checkInputs = function () {
            if (this._vrDevice && this._vrDevice.isPresenting) {
                this._vrDevice.getFrameData(this._frameData);
                this.updateFromDevice(this._frameData.pose);
            }
            _super.prototype._checkInputs.call(this);
        };
        WebVRFreeCamera.prototype.updateFromDevice = function (poseData) {
            if (poseData && poseData.orientation) {
                this.rawPose = poseData;
                this._deviceRoomRotationQuaternion.copyFromFloats(poseData.orientation[0], poseData.orientation[1], -poseData.orientation[2], -poseData.orientation[3]);
                if (this.getScene().useRightHandedSystem) {
                    this._deviceRoomRotationQuaternion.z *= -1;
                    this._deviceRoomRotationQuaternion.w *= -1;
                }
                if (this.webVROptions.trackPosition && this.rawPose.position) {
                    this._deviceRoomPosition.copyFromFloats(this.rawPose.position[0], this.rawPose.position[1], -this.rawPose.position[2]);
                    if (this.getScene().useRightHandedSystem) {
                        this._deviceRoomPosition.z *= -1;
                    }
                }
            }
        };
        /**
         * WebVR's attach control will start broadcasting frames to the device.
         * Note that in certain browsers (chrome for example) this function must be called
         * within a user-interaction callback. Example:
         * <pre> scene.onPointerDown = function() { camera.attachControl(canvas); }</pre>
         *
         * @param {HTMLElement} element
         * @param {boolean} [noPreventDefault]
         *
         * @memberOf WebVRFreeCamera
         */
        WebVRFreeCamera.prototype.attachControl = function (element, noPreventDefault) {
            _super.prototype.attachControl.call(this, element, noPreventDefault);
            this._attached = true;
            noPreventDefault = BABYLON.Camera.ForceAttachControlToAlwaysPreventDefault ? false : noPreventDefault;
            if (this._vrDevice) {
                this.getEngine().enableVR();
            }
        };
        WebVRFreeCamera.prototype.detachControl = function (element) {
            this.getScene().gamepadManager.onGamepadConnectedObservable.remove(this._onGamepadConnectedObserver);
            this.getScene().gamepadManager.onGamepadDisconnectedObservable.remove(this._onGamepadDisconnectedObserver);
            _super.prototype.detachControl.call(this, element);
            this._attached = false;
            this.getEngine().disableVR();
        };
        WebVRFreeCamera.prototype.getClassName = function () {
            return "WebVRFreeCamera";
        };
        WebVRFreeCamera.prototype.resetToCurrentRotation = function () {
            //uses the vrDisplay's "resetPose()".
            //pitch and roll won't be affected.
            this._vrDevice.resetPose();
        };
        WebVRFreeCamera.prototype._updateRigCameras = function () {
            var camLeft = this._rigCameras[0];
            var camRight = this._rigCameras[1];
            camLeft.rotationQuaternion.copyFrom(this._deviceRoomRotationQuaternion);
            camRight.rotationQuaternion.copyFrom(this._deviceRoomRotationQuaternion);
            camLeft.position.copyFrom(this._deviceRoomPosition);
            camRight.position.copyFrom(this._deviceRoomPosition);
        };
        WebVRFreeCamera.prototype._updateCache = function (ignoreParentClass) {
            var _this = this;
            if (!this.rotationQuaternion.equals(this._cache.rotationQuaternion) || !this.position.equals(this._cache.position)) {
                // Update to ensure devicePosition is up to date with most recent _deviceRoomPosition
                if (!this.updateCacheCalled) {
                    // make sure it is only called once per loop. this.update() might cause an infinite loop.
                    this.updateCacheCalled = true;
                    this.update();
                }
                // Set working vector to the device position in room space rotated by the new rotation
                this.rotationQuaternion.toRotationMatrix(this._workingMatrix);
                BABYLON.Vector3.TransformCoordinatesToRef(this._deviceRoomPosition, this._workingMatrix, this._workingVector);
                // Subtract this vector from the current device position in world to get the translation for the device world matrix
                this.devicePosition.subtractToRef(this._workingVector, this._workingVector);
                BABYLON.Matrix.ComposeToRef(this._oneVector, this.rotationQuaternion, this._workingVector, this._deviceToWorld);
                // Add translation from anchor position
                this._deviceToWorld.getTranslationToRef(this._workingVector);
                this._workingVector.addInPlace(this.position);
                this._workingVector.subtractInPlace(this._cache.position);
                this._deviceToWorld.setTranslation(this._workingVector);
                // Set an inverted matrix to be used when updating the camera
                this._deviceToWorld.invertToRef(this._worldToDevice);
                // Update the gamepad to ensure the mesh is updated on the same frame as camera
                this.controllers.forEach(function (controller) {
                    controller._deviceToWorld = _this._deviceToWorld;
                    controller.update();
                });
            }
            if (!ignoreParentClass) {
                _super.prototype._updateCache.call(this);
            }
            this.updateCacheCalled = false;
        };
        WebVRFreeCamera.prototype.update = function () {
            // Get current device position in babylon world
            BABYLON.Vector3.TransformCoordinatesToRef(this._deviceRoomPosition, this._deviceToWorld, this.devicePosition);
            // Get current device rotation in babylon world
            BABYLON.Matrix.FromQuaternionToRef(this._deviceRoomRotationQuaternion, this._workingMatrix);
            this._workingMatrix.multiplyToRef(this._deviceToWorld, this._workingMatrix);
            BABYLON.Quaternion.FromRotationMatrixToRef(this._workingMatrix, this.deviceRotationQuaternion);
            _super.prototype.update.call(this);
        };
        WebVRFreeCamera.prototype._getViewMatrix = function () {
            return BABYLON.Matrix.Identity();
        };
        /**
         * This function is called by the two RIG cameras.
         * 'this' is the left or right camera (and NOT (!!!) the WebVRFreeCamera instance)
         */
        WebVRFreeCamera.prototype._getWebVRViewMatrix = function () {
            var _this = this;
            //WebVR 1.1
            var viewArray = this._cameraRigParams["left"] ? this._cameraRigParams["frameData"].leftViewMatrix : this._cameraRigParams["frameData"].rightViewMatrix;
            BABYLON.Matrix.FromArrayToRef(viewArray, 0, this._webvrViewMatrix);
            if (!this.getScene().useRightHandedSystem) {
                [2, 6, 8, 9, 14].forEach(function (num) {
                    _this._webvrViewMatrix.m[num] *= -1;
                });
            }
            // update the camera rotation matrix
            this._webvrViewMatrix.getRotationMatrixToRef(this._cameraRotationMatrix);
            BABYLON.Vector3.TransformCoordinatesToRef(this._referencePoint, this._cameraRotationMatrix, this._transformedReferencePoint);
            // Computing target and final matrix
            this.position.addToRef(this._transformedReferencePoint, this._currentTarget);
            var parentCamera = this._cameraRigParams["parentCamera"];
            // should the view matrix be updated with scale and position offset?
            if (parentCamera.deviceScaleFactor !== 1) {
                this._webvrViewMatrix.invert();
                // scale the position, if set
                if (parentCamera.deviceScaleFactor) {
                    this._webvrViewMatrix.m[12] *= parentCamera.deviceScaleFactor;
                    this._webvrViewMatrix.m[13] *= parentCamera.deviceScaleFactor;
                    this._webvrViewMatrix.m[14] *= parentCamera.deviceScaleFactor;
                }
                this._webvrViewMatrix.invert();
            }
            parentCamera._worldToDevice.multiplyToRef(this._webvrViewMatrix, this._webvrViewMatrix);
            return this._webvrViewMatrix;
        };
        WebVRFreeCamera.prototype._getWebVRProjectionMatrix = function () {
            var _this = this;
            var parentCamera = this.parent;
            parentCamera._vrDevice.depthNear = parentCamera.minZ;
            parentCamera._vrDevice.depthFar = parentCamera.maxZ;
            var projectionArray = this._cameraRigParams["left"] ? this._cameraRigParams["frameData"].leftProjectionMatrix : this._cameraRigParams["frameData"].rightProjectionMatrix;
            BABYLON.Matrix.FromArrayToRef(projectionArray, 0, this._projectionMatrix);
            //babylon compatible matrix
            if (!this.getScene().useRightHandedSystem) {
                [8, 9, 10, 11].forEach(function (num) {
                    _this._projectionMatrix.m[num] *= -1;
                });
            }
            return this._projectionMatrix;
        };
        WebVRFreeCamera.prototype.initControllers = function () {
            var _this = this;
            this.controllers = [];
            var manager = this.getScene().gamepadManager;
            this._onGamepadDisconnectedObserver = manager.onGamepadDisconnectedObservable.add(function (gamepad) {
                if (gamepad.type === BABYLON.Gamepad.POSE_ENABLED) {
                    var webVrController = gamepad;
                    if (webVrController.defaultModel) {
                        webVrController.defaultModel.setEnabled(false);
                    }
                    if (webVrController.hand === "right") {
                        _this._rightController = null;
                    }
                    if (webVrController.hand === "left") {
                        _this._rightController = null;
                    }
                    var controllerIndex = _this.controllers.indexOf(webVrController);
                    if (controllerIndex !== -1) {
                        _this.controllers.splice(controllerIndex, 1);
                    }
                }
            });
            this._onGamepadConnectedObserver = manager.onGamepadConnectedObservable.add(function (gamepad) {
                if (gamepad.type === BABYLON.Gamepad.POSE_ENABLED) {
                    var webVrController_1 = gamepad;
                    webVrController_1._deviceToWorld = _this._deviceToWorld;
                    if (_this.webVROptions.controllerMeshes) {
                        if (webVrController_1.defaultModel) {
                            webVrController_1.defaultModel.setEnabled(true);
                        }
                        else {
                            // Load the meshes
                            webVrController_1.initControllerMesh(_this.getScene(), function (loadedMesh) {
                                _this.onControllerMeshLoadedObservable.notifyObservers(webVrController_1);
                                if (_this.webVROptions.defaultLightingOnControllers) {
                                    if (!_this._lightOnControllers) {
                                        _this._lightOnControllers = new BABYLON.HemisphericLight("vrControllersLight", new BABYLON.Vector3(0, 1, 0), _this.getScene());
                                    }
                                    var activateLightOnSubMeshes_1 = function (mesh, light) {
                                        var children = mesh.getChildren();
                                        if (children.length !== 0) {
                                            children.forEach(function (mesh) {
                                                light.includedOnlyMeshes.push(mesh);
                                                activateLightOnSubMeshes_1(mesh, light);
                                            });
                                        }
                                    };
                                    _this._lightOnControllers.includedOnlyMeshes.push(loadedMesh);
                                    activateLightOnSubMeshes_1(loadedMesh, _this._lightOnControllers);
                                }
                            });
                        }
                    }
                    webVrController_1.attachToPoseControlledCamera(_this);
                    // since this is async - sanity check. Is the controller already stored?
                    if (_this.controllers.indexOf(webVrController_1) === -1) {
                        //add to the controllers array
                        _this.controllers.push(webVrController_1);
                        // Forced to add some control code for Vive as it doesn't always fill properly the "hand" property
                        // Sometimes, both controllers are set correctly (left and right), sometimes none, sometimes only one of them...
                        // So we're overriding setting left & right manually to be sure
                        var firstViveWandDetected = false;
                        for (var i = 0; i < _this.controllers.length; i++) {
                            if (_this.controllers[i].controllerType === BABYLON.PoseEnabledControllerType.VIVE) {
                                if (!firstViveWandDetected) {
                                    firstViveWandDetected = true;
                                    _this.controllers[i].hand = "left";
                                }
                                else {
                                    _this.controllers[i].hand = "right";
                                }
                            }
                        }
                        //did we find enough controllers? Great! let the developer know.
                        if (_this.controllers.length >= 2) {
                            _this.onControllersAttachedObservable.notifyObservers(_this.controllers);
                        }
                    }
                }
            });
        };
        return WebVRFreeCamera;
    }(BABYLON.FreeCamera));
    BABYLON.WebVRFreeCamera = WebVRFreeCamera;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.webVRCamera.js.map


var BABYLON;
(function (BABYLON) {
    // We're mainly based on the logic defined into the FreeCamera code
    var DeviceOrientationCamera = /** @class */ (function (_super) {
        __extends(DeviceOrientationCamera, _super);
        function DeviceOrientationCamera(name, position, scene) {
            var _this = _super.call(this, name, position, scene) || this;
            _this._quaternionCache = new BABYLON.Quaternion();
            _this.inputs.addDeviceOrientation();
            return _this;
        }
        DeviceOrientationCamera.prototype.getClassName = function () {
            return "DeviceOrientationCamera";
        };
        DeviceOrientationCamera.prototype._checkInputs = function () {
            _super.prototype._checkInputs.call(this);
            this._quaternionCache.copyFrom(this.rotationQuaternion);
            if (this._initialQuaternion) {
                this._initialQuaternion.multiplyToRef(this.rotationQuaternion, this.rotationQuaternion);
            }
        };
        DeviceOrientationCamera.prototype.resetToCurrentRotation = function (axis) {
            var _this = this;
            if (axis === void 0) { axis = BABYLON.Axis.Y; }
            //can only work if this camera has a rotation quaternion already.
            if (!this.rotationQuaternion)
                return;
            if (!this._initialQuaternion) {
                this._initialQuaternion = new BABYLON.Quaternion();
            }
            this._initialQuaternion.copyFrom(this._quaternionCache || this.rotationQuaternion);
            ['x', 'y', 'z'].forEach(function (axisName) {
                if (!axis[axisName]) {
                    _this._initialQuaternion[axisName] = 0;
                }
                else {
                    _this._initialQuaternion[axisName] *= -1;
                }
            });
            this._initialQuaternion.normalize();
            //force rotation update
            this._initialQuaternion.multiplyToRef(this.rotationQuaternion, this.rotationQuaternion);
        };
        return DeviceOrientationCamera;
    }(BABYLON.FreeCamera));
    BABYLON.DeviceOrientationCamera = DeviceOrientationCamera;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.deviceOrientationCamera.js.map


var BABYLON;
(function (BABYLON) {
    var VRDeviceOrientationFreeCamera = /** @class */ (function (_super) {
        __extends(VRDeviceOrientationFreeCamera, _super);
        function VRDeviceOrientationFreeCamera(name, position, scene, compensateDistortion, vrCameraMetrics) {
            if (compensateDistortion === void 0) { compensateDistortion = true; }
            if (vrCameraMetrics === void 0) { vrCameraMetrics = BABYLON.VRCameraMetrics.GetDefault(); }
            var _this = _super.call(this, name, position, scene) || this;
            vrCameraMetrics.compensateDistortion = compensateDistortion;
            _this.setCameraRigMode(BABYLON.Camera.RIG_MODE_VR, { vrCameraMetrics: vrCameraMetrics });
            return _this;
        }
        VRDeviceOrientationFreeCamera.prototype.getClassName = function () {
            return "VRDeviceOrientationFreeCamera";
        };
        return VRDeviceOrientationFreeCamera;
    }(BABYLON.DeviceOrientationCamera));
    BABYLON.VRDeviceOrientationFreeCamera = VRDeviceOrientationFreeCamera;
    var VRDeviceOrientationGamepadCamera = /** @class */ (function (_super) {
        __extends(VRDeviceOrientationGamepadCamera, _super);
        function VRDeviceOrientationGamepadCamera(name, position, scene, compensateDistortion, vrCameraMetrics) {
            if (compensateDistortion === void 0) { compensateDistortion = true; }
            if (vrCameraMetrics === void 0) { vrCameraMetrics = BABYLON.VRCameraMetrics.GetDefault(); }
            var _this = _super.call(this, name, position, scene, compensateDistortion, vrCameraMetrics) || this;
            _this.inputs.addGamepad();
            return _this;
        }
        VRDeviceOrientationGamepadCamera.prototype.getClassName = function () {
            return "VRDeviceOrientationGamepadCamera";
        };
        return VRDeviceOrientationGamepadCamera;
    }(VRDeviceOrientationFreeCamera));
    BABYLON.VRDeviceOrientationGamepadCamera = VRDeviceOrientationGamepadCamera;
    var VRDeviceOrientationArcRotateCamera = /** @class */ (function (_super) {
        __extends(VRDeviceOrientationArcRotateCamera, _super);
        function VRDeviceOrientationArcRotateCamera(name, alpha, beta, radius, target, scene, compensateDistortion, vrCameraMetrics) {
            if (compensateDistortion === void 0) { compensateDistortion = true; }
            if (vrCameraMetrics === void 0) { vrCameraMetrics = BABYLON.VRCameraMetrics.GetDefault(); }
            var _this = _super.call(this, name, alpha, beta, radius, target, scene) || this;
            vrCameraMetrics.compensateDistortion = compensateDistortion;
            _this.setCameraRigMode(BABYLON.Camera.RIG_MODE_VR, { vrCameraMetrics: vrCameraMetrics });
            _this.inputs.addVRDeviceOrientation();
            return _this;
        }
        VRDeviceOrientationArcRotateCamera.prototype.getClassName = function () {
            return "VRDeviceOrientationArcRotateCamera";
        };
        return VRDeviceOrientationArcRotateCamera;
    }(BABYLON.ArcRotateCamera));
    BABYLON.VRDeviceOrientationArcRotateCamera = VRDeviceOrientationArcRotateCamera;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.vrDeviceOrientationCamera.js.map


var BABYLON;
(function (BABYLON) {
    var AnaglyphFreeCamera = /** @class */ (function (_super) {
        __extends(AnaglyphFreeCamera, _super);
        function AnaglyphFreeCamera(name, position, interaxialDistance, scene) {
            var _this = _super.call(this, name, position, scene) || this;
            _this.interaxialDistance = interaxialDistance;
            _this.setCameraRigMode(BABYLON.Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH, { interaxialDistance: interaxialDistance });
            return _this;
        }
        AnaglyphFreeCamera.prototype.getClassName = function () {
            return "AnaglyphFreeCamera";
        };
        return AnaglyphFreeCamera;
    }(BABYLON.FreeCamera));
    BABYLON.AnaglyphFreeCamera = AnaglyphFreeCamera;
    var AnaglyphArcRotateCamera = /** @class */ (function (_super) {
        __extends(AnaglyphArcRotateCamera, _super);
        function AnaglyphArcRotateCamera(name, alpha, beta, radius, target, interaxialDistance, scene) {
            var _this = _super.call(this, name, alpha, beta, radius, target, scene) || this;
            _this.interaxialDistance = interaxialDistance;
            _this.setCameraRigMode(BABYLON.Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH, { interaxialDistance: interaxialDistance });
            return _this;
        }
        AnaglyphArcRotateCamera.prototype.getClassName = function () {
            return "AnaglyphArcRotateCamera";
        };
        return AnaglyphArcRotateCamera;
    }(BABYLON.ArcRotateCamera));
    BABYLON.AnaglyphArcRotateCamera = AnaglyphArcRotateCamera;
    var AnaglyphGamepadCamera = /** @class */ (function (_super) {
        __extends(AnaglyphGamepadCamera, _super);
        function AnaglyphGamepadCamera(name, position, interaxialDistance, scene) {
            var _this = _super.call(this, name, position, scene) || this;
            _this.interaxialDistance = interaxialDistance;
            _this.setCameraRigMode(BABYLON.Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH, { interaxialDistance: interaxialDistance });
            return _this;
        }
        AnaglyphGamepadCamera.prototype.getClassName = function () {
            return "AnaglyphGamepadCamera";
        };
        return AnaglyphGamepadCamera;
    }(BABYLON.GamepadCamera));
    BABYLON.AnaglyphGamepadCamera = AnaglyphGamepadCamera;
    var AnaglyphUniversalCamera = /** @class */ (function (_super) {
        __extends(AnaglyphUniversalCamera, _super);
        function AnaglyphUniversalCamera(name, position, interaxialDistance, scene) {
            var _this = _super.call(this, name, position, scene) || this;
            _this.interaxialDistance = interaxialDistance;
            _this.setCameraRigMode(BABYLON.Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH, { interaxialDistance: interaxialDistance });
            return _this;
        }
        AnaglyphUniversalCamera.prototype.getClassName = function () {
            return "AnaglyphUniversalCamera";
        };
        return AnaglyphUniversalCamera;
    }(BABYLON.UniversalCamera));
    BABYLON.AnaglyphUniversalCamera = AnaglyphUniversalCamera;
    var StereoscopicFreeCamera = /** @class */ (function (_super) {
        __extends(StereoscopicFreeCamera, _super);
        function StereoscopicFreeCamera(name, position, interaxialDistance, isStereoscopicSideBySide, scene) {
            var _this = _super.call(this, name, position, scene) || this;
            _this.interaxialDistance = interaxialDistance;
            _this.isStereoscopicSideBySide = isStereoscopicSideBySide;
            _this.setCameraRigMode(isStereoscopicSideBySide ? BABYLON.Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL : BABYLON.Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER, { interaxialDistance: interaxialDistance });
            return _this;
        }
        StereoscopicFreeCamera.prototype.getClassName = function () {
            return "StereoscopicFreeCamera";
        };
        return StereoscopicFreeCamera;
    }(BABYLON.FreeCamera));
    BABYLON.StereoscopicFreeCamera = StereoscopicFreeCamera;
    var StereoscopicArcRotateCamera = /** @class */ (function (_super) {
        __extends(StereoscopicArcRotateCamera, _super);
        function StereoscopicArcRotateCamera(name, alpha, beta, radius, target, interaxialDistance, isStereoscopicSideBySide, scene) {
            var _this = _super.call(this, name, alpha, beta, radius, target, scene) || this;
            _this.interaxialDistance = interaxialDistance;
            _this.isStereoscopicSideBySide = isStereoscopicSideBySide;
            _this.setCameraRigMode(isStereoscopicSideBySide ? BABYLON.Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL : BABYLON.Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER, { interaxialDistance: interaxialDistance });
            return _this;
        }
        StereoscopicArcRotateCamera.prototype.getClassName = function () {
            return "StereoscopicArcRotateCamera";
        };
        return StereoscopicArcRotateCamera;
    }(BABYLON.ArcRotateCamera));
    BABYLON.StereoscopicArcRotateCamera = StereoscopicArcRotateCamera;
    var StereoscopicGamepadCamera = /** @class */ (function (_super) {
        __extends(StereoscopicGamepadCamera, _super);
        function StereoscopicGamepadCamera(name, position, interaxialDistance, isStereoscopicSideBySide, scene) {
            var _this = _super.call(this, name, position, scene) || this;
            _this.interaxialDistance = interaxialDistance;
            _this.isStereoscopicSideBySide = isStereoscopicSideBySide;
            _this.setCameraRigMode(isStereoscopicSideBySide ? BABYLON.Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL : BABYLON.Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER, { interaxialDistance: interaxialDistance });
            return _this;
        }
        StereoscopicGamepadCamera.prototype.getClassName = function () {
            return "StereoscopicGamepadCamera";
        };
        return StereoscopicGamepadCamera;
    }(BABYLON.GamepadCamera));
    BABYLON.StereoscopicGamepadCamera = StereoscopicGamepadCamera;
    var StereoscopicUniversalCamera = /** @class */ (function (_super) {
        __extends(StereoscopicUniversalCamera, _super);
        function StereoscopicUniversalCamera(name, position, interaxialDistance, isStereoscopicSideBySide, scene) {
            var _this = _super.call(this, name, position, scene) || this;
            _this.interaxialDistance = interaxialDistance;
            _this.isStereoscopicSideBySide = isStereoscopicSideBySide;
            _this.setCameraRigMode(isStereoscopicSideBySide ? BABYLON.Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL : BABYLON.Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER, { interaxialDistance: interaxialDistance });
            return _this;
        }
        StereoscopicUniversalCamera.prototype.getClassName = function () {
            return "StereoscopicUniversalCamera";
        };
        return StereoscopicUniversalCamera;
    }(BABYLON.UniversalCamera));
    BABYLON.StereoscopicUniversalCamera = StereoscopicUniversalCamera;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.stereoscopicCameras.js.map

var BABYLON;
(function (BABYLON) {
    var VRExperienceHelper = /** @class */ (function () {
        function VRExperienceHelper(scene, webVROptions) {
            if (webVROptions === void 0) { webVROptions = {}; }
            var _this = this;
            this.webVROptions = webVROptions;
            // Can the system support WebVR, even if a headset isn't plugged in?
            this._webVRsupported = false;
            // If WebVR is supported, is a headset plugged in and are we ready to present?
            this._webVRready = false;
            // Are we waiting for the requestPresent callback to complete?
            this._webVRrequesting = false;
            // Are we presenting to the headset right now?
            this._webVRpresenting = false;
            // Are we presenting in the fullscreen fallback?
            this._fullscreenVRpresenting = false;
            /**
             * Observable raised when entering VR.
             */
            this.onEnteringVRObservable = new BABYLON.Observable();
            /**
             * Observable raised when exiting VR.
             */
            this.onExitingVRObservable = new BABYLON.Observable();
            /**
             * Observable raised when controller mesh is loaded.
             */
            this.onControllerMeshLoadedObservable = new BABYLON.Observable();
            this._useCustomVRButton = false;
            this._teleportationRequested = false;
            this._teleportationEnabledOnLeftController = false;
            this._teleportationEnabledOnRightController = false;
            this._interactionsEnabledOnLeftController = false;
            this._interactionsEnabledOnRightController = false;
            this._leftControllerReady = false;
            this._rightControllerReady = false;
            this._floorMeshesCollection = [];
            this._teleportationAllowed = false;
            this._rotationAllowed = true;
            this._teleportationRequestInitiated = false;
            this._teleportationBackRequestInitiated = false;
            this.teleportBackwardsVector = new BABYLON.Vector3(0, -1, -1);
            this._rotationRightAsked = false;
            this._rotationLeftAsked = false;
            this._isDefaultTeleportationTarget = true;
            this._teleportationFillColor = "#444444";
            this._teleportationBorderColor = "#FFFFFF";
            this._rotationAngle = 0;
            this._haloCenter = new BABYLON.Vector3(0, 0, 0);
            this._padSensibilityUp = 0.65;
            this._padSensibilityDown = 0.35;
            this.onNewMeshSelected = new BABYLON.Observable();
            /**
             * Observable raised before camera teleportation
            */
            this.onBeforeCameraTeleport = new BABYLON.Observable();
            /**
             *  Observable raised after camera teleportation
            */
            this.onAfterCameraTeleport = new BABYLON.Observable();
            /**
            * Observable raised when current selected mesh gets unselected
            */
            this.onSelectedMeshUnselected = new BABYLON.Observable();
            this._pointerDownOnMeshAsked = false;
            this._isActionableMesh = false;
            this._teleportationEnabled = false;
            this._interactionsEnabled = false;
            this._interactionsRequested = false;
            this._displayGaze = true;
            this._displayLaserPointer = true;
            this._dpadPressed = true;
            this._onResize = function () {
                _this.moveButtonToBottomRight();
                if (_this._fullscreenVRpresenting && _this._webVRready) {
                    _this.exitVR();
                }
            };
            this._onFullscreenChange = function () {
                if (document.fullscreen !== undefined) {
                    _this._fullscreenVRpresenting = document.fullscreen;
                }
                else if (document.mozFullScreen !== undefined) {
                    _this._fullscreenVRpresenting = document.mozFullScreen;
                }
                else if (document.webkitIsFullScreen !== undefined) {
                    _this._fullscreenVRpresenting = document.webkitIsFullScreen;
                }
                else if (document.msIsFullScreen !== undefined) {
                    _this._fullscreenVRpresenting = document.msIsFullScreen;
                }
                if (!_this._fullscreenVRpresenting && _this._canvas) {
                    _this.exitVR();
                    if (!_this._useCustomVRButton) {
                        _this._btnVR.style.top = _this._canvas.offsetTop + _this._canvas.offsetHeight - 70 + "px";
                        _this._btnVR.style.left = _this._canvas.offsetLeft + _this._canvas.offsetWidth - 100 + "px";
                    }
                }
            };
            this.beforeRender = function () {
                _this._castRayAndSelectObject();
            };
            this._onNewGamepadConnected = function (gamepad) {
                if (gamepad.type !== BABYLON.Gamepad.POSE_ENABLED) {
                    if (gamepad.leftStick) {
                        gamepad.onleftstickchanged(function (stickValues) {
                            if (_this._teleportationEnabled) {
                                // Listening to classic/xbox gamepad only if no VR controller is active
                                if ((!_this._leftLaserPointer && !_this._rightLaserPointer) ||
                                    ((_this._leftLaserPointer && !_this._leftLaserPointer.isVisible) &&
                                        (_this._rightLaserPointer && !_this._rightLaserPointer.isVisible))) {
                                    _this._checkTeleportWithRay(stickValues);
                                    _this._checkTeleportBackwards(stickValues);
                                }
                            }
                        });
                    }
                    if (gamepad.rightStick) {
                        gamepad.onrightstickchanged(function (stickValues) {
                            if (_this._teleportationEnabled) {
                                _this._checkRotate(stickValues);
                            }
                        });
                    }
                    if (gamepad.type === BABYLON.Gamepad.XBOX) {
                        gamepad.onbuttondown(function (buttonPressed) {
                            if (_this._interactionsEnabled && buttonPressed === BABYLON.Xbox360Button.A) {
                                _this._selectionPointerDown();
                            }
                        });
                        gamepad.onbuttonup(function (buttonPressed) {
                            if (_this._interactionsEnabled && buttonPressed === BABYLON.Xbox360Button.A) {
                                _this._selectionPointerUp();
                            }
                        });
                    }
                }
                else {
                    var webVRController = gamepad;
                    _this._tryEnableInteractionOnController(webVRController);
                }
            };
            // This only succeeds if the controller's mesh exists for the controller so this must be called whenever new controller is connected or when mesh is loaded
            this._tryEnableInteractionOnController = function (webVRController) {
                if (webVRController.hand === "left") {
                    _this._leftControllerReady = true;
                    if (_this._interactionsRequested && !_this._interactionsEnabledOnLeftController) {
                        _this._enableInteractionOnController(webVRController);
                    }
                    if (_this._teleportationRequested && !_this._teleportationEnabledOnLeftController) {
                        _this._enableTeleportationOnController(webVRController);
                    }
                }
                if (webVRController.hand === "right") {
                    _this._rightControllerReady = true;
                    if (_this._interactionsRequested && !_this._interactionsEnabledOnRightController) {
                        _this._enableInteractionOnController(webVRController);
                    }
                    if (_this._teleportationRequested && !_this._teleportationEnabledOnRightController) {
                        _this._enableTeleportationOnController(webVRController);
                    }
                }
            };
            this._onNewGamepadDisconnected = function (gamepad) {
                if (gamepad instanceof BABYLON.WebVRController) {
                    if (gamepad.hand === "left") {
                        _this._interactionsEnabledOnLeftController = false;
                        _this._teleportationEnabledOnLeftController = false;
                        _this._leftControllerReady = false;
                        if (_this._leftLaserPointer) {
                            _this._leftLaserPointer.dispose();
                        }
                    }
                    if (gamepad.hand === "right") {
                        _this._interactionsEnabledOnRightController = false;
                        _this._teleportationEnabledOnRightController = false;
                        _this._rightControllerReady = false;
                        if (_this._rightLaserPointer) {
                            _this._rightLaserPointer.dispose();
                        }
                    }
                }
            };
            this._workingVector = BABYLON.Vector3.Zero();
            this._workingQuaternion = BABYLON.Quaternion.Identity();
            this._workingMatrix = BABYLON.Matrix.Identity();
            this._scene = scene;
            this._canvas = scene.getEngine().getRenderingCanvas();
            // Parse options
            if (webVROptions.createFallbackVRDeviceOrientationFreeCamera === undefined) {
                webVROptions.createFallbackVRDeviceOrientationFreeCamera = true;
            }
            if (webVROptions.createDeviceOrientationCamera === undefined) {
                webVROptions.createDeviceOrientationCamera = true;
            }
            if (webVROptions.defaultHeight === undefined) {
                webVROptions.defaultHeight = 1.7;
            }
            if (webVROptions.useCustomVRButton) {
                this._useCustomVRButton = true;
                if (webVROptions.customVRButton) {
                    this._btnVR = webVROptions.customVRButton;
                }
            }
            if (webVROptions.rayLength) {
                this._rayLength = webVROptions.rayLength;
            }
            this._defaultHeight = webVROptions.defaultHeight;
            // Set position
            if (this._scene.activeCamera) {
                this._position = this._scene.activeCamera.position.clone();
            }
            else {
                this._position = new BABYLON.Vector3(0, this._defaultHeight, 0);
            }
            // Set non-vr camera
            if (webVROptions.createDeviceOrientationCamera || !this._scene.activeCamera) {
                this._deviceOrientationCamera = new BABYLON.DeviceOrientationCamera("deviceOrientationVRHelper", this._position.clone(), scene);
                // Copy data from existing camera
                if (this._scene.activeCamera) {
                    this._deviceOrientationCamera.minZ = this._scene.activeCamera.minZ;
                    this._deviceOrientationCamera.maxZ = this._scene.activeCamera.maxZ;
                    // Set rotation from previous camera
                    if (this._scene.activeCamera instanceof BABYLON.TargetCamera && this._scene.activeCamera.rotation) {
                        var targetCamera = this._scene.activeCamera;
                        if (targetCamera.rotationQuaternion) {
                            this._deviceOrientationCamera.rotationQuaternion.copyFrom(targetCamera.rotationQuaternion);
                        }
                        else {
                            this._deviceOrientationCamera.rotationQuaternion.copyFrom(BABYLON.Quaternion.RotationYawPitchRoll(targetCamera.rotation.y, targetCamera.rotation.x, targetCamera.rotation.z));
                        }
                        this._deviceOrientationCamera.rotation = targetCamera.rotation.clone();
                    }
                }
                this._scene.activeCamera = this._deviceOrientationCamera;
                if (this._canvas) {
                    this._scene.activeCamera.attachControl(this._canvas);
                }
            }
            else {
                this._existingCamera = this._scene.activeCamera;
            }
            // Create VR cameras
            if (webVROptions.createFallbackVRDeviceOrientationFreeCamera) {
                this._vrDeviceOrientationCamera = new BABYLON.VRDeviceOrientationFreeCamera("VRDeviceOrientationVRHelper", this._position, this._scene);
            }
            this._webVRCamera = new BABYLON.WebVRFreeCamera("WebVRHelper", this._position, this._scene, webVROptions);
            this._webVRCamera.useStandingMatrix();
            // Create default button
            if (!this._useCustomVRButton) {
                this._btnVR = document.createElement("BUTTON");
                this._btnVR.className = "babylonVRicon";
                this._btnVR.id = "babylonVRiconbtn";
                this._btnVR.title = "Click to switch to VR";
                var css = ".babylonVRicon { position: absolute; right: 20px; height: 50px; width: 80px; background-color: rgba(51,51,51,0.7); background-image: url(data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%222048%22%20height%3D%221152%22%20viewBox%3D%220%200%202048%201152%22%20version%3D%221.1%22%3E%3Cpath%20transform%3D%22rotate%28180%201024%2C576.0000000000001%29%22%20d%3D%22m1109%2C896q17%2C0%2030%2C-12t13%2C-30t-12.5%2C-30.5t-30.5%2C-12.5l-170%2C0q-18%2C0%20-30.5%2C12.5t-12.5%2C30.5t13%2C30t30%2C12l170%2C0zm-85%2C256q59%2C0%20132.5%2C-1.5t154.5%2C-5.5t164.5%2C-11.5t163%2C-20t150%2C-30t124.5%2C-41.5q23%2C-11%2042%2C-24t38%2C-30q27%2C-25%2041%2C-61.5t14%2C-72.5l0%2C-257q0%2C-123%20-47%2C-232t-128%2C-190t-190%2C-128t-232%2C-47l-81%2C0q-37%2C0%20-68.5%2C14t-60.5%2C34.5t-55.5%2C45t-53%2C45t-53%2C34.5t-55.5%2C14t-55.5%2C-14t-53%2C-34.5t-53%2C-45t-55.5%2C-45t-60.5%2C-34.5t-68.5%2C-14l-81%2C0q-123%2C0%20-232%2C47t-190%2C128t-128%2C190t-47%2C232l0%2C257q0%2C68%2038%2C115t97%2C73q54%2C24%20124.5%2C41.5t150%2C30t163%2C20t164.5%2C11.5t154.5%2C5.5t132.5%2C1.5zm939%2C-298q0%2C39%20-24.5%2C67t-58.5%2C42q-54%2C23%20-122%2C39.5t-143.5%2C28t-155.5%2C19t-157%2C11t-148.5%2C5t-129.5%2C1.5q-59%2C0%20-130%2C-1.5t-148%2C-5t-157%2C-11t-155.5%2C-19t-143.5%2C-28t-122%2C-39.5q-34%2C-14%20-58.5%2C-42t-24.5%2C-67l0%2C-257q0%2C-106%2040.5%2C-199t110%2C-162.5t162.5%2C-109.5t199%2C-40l81%2C0q27%2C0%2052%2C14t50%2C34.5t51%2C44.5t55.5%2C44.5t63.5%2C34.5t74%2C14t74%2C-14t63.5%2C-34.5t55.5%2C-44.5t51%2C-44.5t50%2C-34.5t52%2C-14l14%2C0q37%2C0%2070%2C0.5t64.5%2C4.5t63.5%2C12t68%2C23q71%2C30%20128.5%2C78.5t98.5%2C110t63.5%2C133.5t22.5%2C149l0%2C257z%22%20fill%3D%22white%22%20/%3E%3C/svg%3E%0A); background-size: 80%; background-repeat:no-repeat; background-position: center; border: none; outline: none; transition: transform 0.125s ease-out } .babylonVRicon:hover { transform: scale(1.05) } .babylonVRicon:active {background-color: rgba(51,51,51,1) } .babylonVRicon:focus {background-color: rgba(51,51,51,1) }";
                css += ".babylonVRicon.vrdisplaypresenting { display: none; }";
                // TODO: Add user feedback so that they know what state the VRDisplay is in (disconnected, connected, entering-VR)
                // css += ".babylonVRicon.vrdisplaysupported { }";
                // css += ".babylonVRicon.vrdisplayready { }";
                // css += ".babylonVRicon.vrdisplayrequesting { }";
                var style = document.createElement('style');
                style.appendChild(document.createTextNode(css));
                document.getElementsByTagName('head')[0].appendChild(style);
                this.moveButtonToBottomRight();
            }
            // VR button click event
            if (this._btnVR) {
                this._btnVR.addEventListener("click", function () {
                    if (!_this.isInVRMode) {
                        _this.enterVR();
                    }
                    else {
                        _this.exitVR();
                    }
                });
            }
            // Window events
            window.addEventListener("resize", this._onResize);
            document.addEventListener("fullscreenchange", this._onFullscreenChange, false);
            document.addEventListener("mozfullscreenchange", this._onFullscreenChange, false);
            document.addEventListener("webkitfullscreenchange", this._onFullscreenChange, false);
            document.addEventListener("msfullscreenchange", this._onFullscreenChange, false);
            // Display vr button when headset is connected
            if (webVROptions.createFallbackVRDeviceOrientationFreeCamera) {
                this.displayVRButton();
            }
            else {
                this._scene.getEngine().onVRDisplayChangedObservable.add(function (e) {
                    if (e.vrDisplay) {
                        _this.displayVRButton();
                    }
                });
            }
            // Exiting VR mode using 'ESC' key on desktop
            this._onKeyDown = function (event) {
                if (event.keyCode === 27 && _this.isInVRMode) {
                    _this.exitVR();
                }
            };
            document.addEventListener("keydown", this._onKeyDown);
            // Exiting VR mode double tapping the touch screen
            this._scene.onPrePointerObservable.add(function (pointerInfo, eventState) {
                if (_this.isInVRMode) {
                    _this.exitVR();
                    if (_this._fullscreenVRpresenting) {
                        _this._scene.getEngine().switchFullscreen(true);
                    }
                }
            }, BABYLON.PointerEventTypes.POINTERDOUBLETAP, false);
            // Listen for WebVR display changes
            this._onVRDisplayChanged = function (eventArgs) { return _this.onVRDisplayChanged(eventArgs); };
            this._onVrDisplayPresentChange = function () { return _this.onVrDisplayPresentChange(); };
            this._onVRRequestPresentStart = function () {
                _this._webVRrequesting = true;
                _this.updateButtonVisibility();
            };
            this._onVRRequestPresentComplete = function (success) {
                _this._webVRrequesting = false;
                _this.updateButtonVisibility();
            };
            scene.getEngine().onVRDisplayChangedObservable.add(this._onVRDisplayChanged);
            scene.getEngine().onVRRequestPresentStart.add(this._onVRRequestPresentStart);
            scene.getEngine().onVRRequestPresentComplete.add(this._onVRRequestPresentComplete);
            window.addEventListener('vrdisplaypresentchange', this._onVrDisplayPresentChange);
            scene.onDisposeObservable.add(function () {
                _this.dispose();
            });
            // Gamepad connection events
            this._webVRCamera.onControllerMeshLoadedObservable.add(function (webVRController) { return _this._onDefaultMeshLoaded(webVRController); });
            this._scene.gamepadManager.onGamepadConnectedObservable.add(this._onNewGamepadConnected);
            this._scene.gamepadManager.onGamepadDisconnectedObservable.add(this._onNewGamepadDisconnected);
            this.updateButtonVisibility();
            //create easing functions
            this._circleEase = new BABYLON.CircleEase();
            this._circleEase.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
        }
        Object.defineProperty(VRExperienceHelper.prototype, "onEnteringVR", {
            /** Return this.onEnteringVRObservable
             * Note: This one is for backward compatibility. Please use onEnteringVRObservable directly
             */
            get: function () {
                return this.onEnteringVRObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VRExperienceHelper.prototype, "onExitingVR", {
            /** Return this.onExitingVRObservable
             * Note: This one is for backward compatibility. Please use onExitingVRObservable directly
             */
            get: function () {
                return this.onExitingVRObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VRExperienceHelper.prototype, "onControllerMeshLoaded", {
            /** Return this.onControllerMeshLoadedObservable
             * Note: This one is for backward compatibility. Please use onControllerMeshLoadedObservable directly
             */
            get: function () {
                return this.onControllerMeshLoadedObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VRExperienceHelper.prototype, "teleportationTarget", {
            get: function () {
                return this._teleportationTarget;
            },
            set: function (value) {
                if (value) {
                    value.name = "teleportationTarget";
                    this._isDefaultTeleportationTarget = false;
                    this._teleportationTarget = value;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VRExperienceHelper.prototype, "displayGaze", {
            get: function () {
                return this._displayGaze;
            },
            set: function (value) {
                this._displayGaze = value;
                if (!value) {
                    this._gazeTracker.isVisible = false;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VRExperienceHelper.prototype, "displayLaserPointer", {
            get: function () {
                return this._displayLaserPointer;
            },
            set: function (value) {
                this._displayLaserPointer = value;
                if (!value) {
                    if (this._rightLaserPointer) {
                        this._rightLaserPointer.isVisible = false;
                    }
                    if (this._leftLaserPointer) {
                        this._leftLaserPointer.isVisible = false;
                    }
                }
                else {
                    if (this._rightLaserPointer) {
                        this._rightLaserPointer.isVisible = true;
                    }
                    else if (this._leftLaserPointer) {
                        this._leftLaserPointer.isVisible = true;
                    }
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VRExperienceHelper.prototype, "deviceOrientationCamera", {
            get: function () {
                return this._deviceOrientationCamera;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VRExperienceHelper.prototype, "currentVRCamera", {
            // Based on the current WebVR support, returns the current VR camera used
            get: function () {
                if (this._webVRready) {
                    return this._webVRCamera;
                }
                else {
                    return this._scene.activeCamera;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VRExperienceHelper.prototype, "webVRCamera", {
            get: function () {
                return this._webVRCamera;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VRExperienceHelper.prototype, "vrDeviceOrientationCamera", {
            get: function () {
                return this._vrDeviceOrientationCamera;
            },
            enumerable: true,
            configurable: true
        });
        // Raised when one of the controller has loaded successfully its associated default mesh
        VRExperienceHelper.prototype._onDefaultMeshLoaded = function (webVRController) {
            this._tryEnableInteractionOnController(webVRController);
            try {
                this.onControllerMeshLoadedObservable.notifyObservers(webVRController);
            }
            catch (err) {
                BABYLON.Tools.Warn("Error in your custom logic onControllerMeshLoaded: " + err);
            }
        };
        Object.defineProperty(VRExperienceHelper.prototype, "isInVRMode", {
            /**
             * Gets a value indicating if we are currently in VR mode.
             */
            get: function () {
                return this._webVRpresenting || this._fullscreenVRpresenting;
            },
            enumerable: true,
            configurable: true
        });
        VRExperienceHelper.prototype.onVrDisplayPresentChange = function () {
            var vrDisplay = this._scene.getEngine().getVRDevice();
            if (vrDisplay) {
                var wasPresenting = this._webVRpresenting;
                // A VR display is connected
                this._webVRpresenting = vrDisplay.isPresenting;
                if (wasPresenting && !this._webVRpresenting)
                    this.exitVR();
            }
            else {
                BABYLON.Tools.Warn('Detected VRDisplayPresentChange on an unknown VRDisplay. Did you can enterVR on the vrExperienceHelper?');
            }
            this.updateButtonVisibility();
        };
        VRExperienceHelper.prototype.onVRDisplayChanged = function (eventArgs) {
            this._webVRsupported = eventArgs.vrSupported;
            this._webVRready = !!eventArgs.vrDisplay;
            this._webVRpresenting = eventArgs.vrDisplay && eventArgs.vrDisplay.isPresenting;
            this.updateButtonVisibility();
        };
        VRExperienceHelper.prototype.moveButtonToBottomRight = function () {
            if (this._canvas && !this._useCustomVRButton) {
                this._btnVR.style.top = this._canvas.offsetTop + this._canvas.offsetHeight - 70 + "px";
                this._btnVR.style.left = this._canvas.offsetLeft + this._canvas.offsetWidth - 100 + "px";
            }
        };
        VRExperienceHelper.prototype.displayVRButton = function () {
            if (!this._useCustomVRButton && !this._btnVRDisplayed) {
                document.body.appendChild(this._btnVR);
                this._btnVRDisplayed = true;
            }
        };
        VRExperienceHelper.prototype.updateButtonVisibility = function () {
            if (!this._btnVR || this._useCustomVRButton) {
                return;
            }
            this._btnVR.className = "babylonVRicon";
            if (this.isInVRMode) {
                this._btnVR.className += " vrdisplaypresenting";
            }
            else {
                if (this._webVRready)
                    this._btnVR.className += " vrdisplayready";
                if (this._webVRsupported)
                    this._btnVR.className += " vrdisplaysupported";
                if (this._webVRrequesting)
                    this._btnVR.className += " vrdisplayrequesting";
            }
        };
        /**
         * Attempt to enter VR. If a headset is connected and ready, will request present on that.
         * Otherwise, will use the fullscreen API.
         */
        VRExperienceHelper.prototype.enterVR = function () {
            if (this.onEnteringVRObservable) {
                try {
                    this.onEnteringVRObservable.notifyObservers(this);
                }
                catch (err) {
                    BABYLON.Tools.Warn("Error in your custom logic onEnteringVR: " + err);
                }
            }
            if (this._scene.activeCamera) {
                this._position = this._scene.activeCamera.position.clone();
                // make sure that we return to the last active camera
                this._existingCamera = this._scene.activeCamera;
            }
            if (this._webVRrequesting)
                return;
            // If WebVR is supported and a headset is connected
            if (this._webVRready) {
                if (!this._webVRpresenting) {
                    this._webVRCamera.position = this._position;
                    this._scene.activeCamera = this._webVRCamera;
                }
            }
            else if (this._vrDeviceOrientationCamera) {
                this._vrDeviceOrientationCamera.position = this._position;
                this._scene.activeCamera = this._vrDeviceOrientationCamera;
                this._scene.getEngine().switchFullscreen(true);
                this.updateButtonVisibility();
            }
            if (this._scene.activeCamera && this._canvas) {
                this._scene.activeCamera.attachControl(this._canvas);
            }
            if (this._interactionsEnabled) {
                this._scene.registerBeforeRender(this.beforeRender);
            }
        };
        /**
         * Attempt to exit VR, or fullscreen.
         */
        VRExperienceHelper.prototype.exitVR = function () {
            if (this.onExitingVRObservable) {
                try {
                    this.onExitingVRObservable.notifyObservers(this);
                }
                catch (err) {
                    BABYLON.Tools.Warn("Error in your custom logic onExitingVR: " + err);
                }
            }
            if (this._webVRpresenting) {
                this._scene.getEngine().disableVR();
            }
            if (this._scene.activeCamera) {
                this._position = this._scene.activeCamera.position.clone();
            }
            if (this._deviceOrientationCamera) {
                this._deviceOrientationCamera.position = this._position;
                this._scene.activeCamera = this._deviceOrientationCamera;
                if (this._canvas) {
                    this._scene.activeCamera.attachControl(this._canvas);
                }
            }
            else if (this._existingCamera) {
                this._existingCamera.position = this._position;
                this._scene.activeCamera = this._existingCamera;
            }
            this.updateButtonVisibility();
            if (this._interactionsEnabled) {
                this._scene.unregisterBeforeRender(this.beforeRender);
            }
        };
        Object.defineProperty(VRExperienceHelper.prototype, "position", {
            get: function () {
                return this._position;
            },
            set: function (value) {
                this._position = value;
                if (this._scene.activeCamera) {
                    this._scene.activeCamera.position = value;
                }
            },
            enumerable: true,
            configurable: true
        });
        VRExperienceHelper.prototype.enableInteractions = function () {
            var _this = this;
            if (!this._interactionsEnabled) {
                this._interactionsRequested = true;
                if (this._leftControllerReady && this._webVRCamera.leftController) {
                    this._enableInteractionOnController(this._webVRCamera.leftController);
                }
                if (this._rightControllerReady && this._webVRCamera.rightController) {
                    this._enableInteractionOnController(this._webVRCamera.rightController);
                }
                this._createGazeTracker();
                this.raySelectionPredicate = function (mesh) {
                    return true;
                };
                this.meshSelectionPredicate = function (mesh) {
                    return true;
                };
                this._raySelectionPredicate = function (mesh) {
                    if (_this._isTeleportationFloor(mesh) || (mesh.isVisible && mesh.name.indexOf("gazeTracker") === -1
                        && mesh.name.indexOf("teleportationTarget") === -1
                        && mesh.name.indexOf("torusTeleportation") === -1
                        && mesh.name.indexOf("laserPointer") === -1)) {
                        return _this.raySelectionPredicate(mesh);
                    }
                    return false;
                };
                this._interactionsEnabled = true;
            }
        };
        VRExperienceHelper.prototype._isTeleportationFloor = function (mesh) {
            for (var i = 0; i < this._floorMeshesCollection.length; i++) {
                if (this._floorMeshesCollection[i].id === mesh.id) {
                    return true;
                }
            }
            if (this._floorMeshName && mesh.name === this._floorMeshName) {
                return true;
            }
            return false;
        };
        VRExperienceHelper.prototype.addFloorMesh = function (floorMesh) {
            if (!this._floorMeshesCollection) {
                return;
            }
            if (this._floorMeshesCollection.indexOf(floorMesh) > -1) {
                return;
            }
            this._floorMeshesCollection.push(floorMesh);
        };
        VRExperienceHelper.prototype.removeFloorMesh = function (floorMesh) {
            if (!this._floorMeshesCollection) {
                return;
            }
            var meshIndex = this._floorMeshesCollection.indexOf(floorMesh);
            if (meshIndex !== -1) {
                this._floorMeshesCollection.splice(meshIndex, 1);
            }
        };
        VRExperienceHelper.prototype.enableTeleportation = function (vrTeleportationOptions) {
            if (vrTeleportationOptions === void 0) { vrTeleportationOptions = {}; }
            if (!this._teleportationEnabled) {
                this._teleportationRequested = true;
                this.enableInteractions();
                if (vrTeleportationOptions.floorMeshName) {
                    this._floorMeshName = vrTeleportationOptions.floorMeshName;
                }
                if (vrTeleportationOptions.floorMeshes) {
                    this._floorMeshesCollection = vrTeleportationOptions.floorMeshes;
                }
                if (this._leftControllerReady && this._webVRCamera.leftController) {
                    this._enableTeleportationOnController(this._webVRCamera.leftController);
                }
                if (this._rightControllerReady && this._webVRCamera.rightController) {
                    this._enableTeleportationOnController(this._webVRCamera.rightController);
                }
                // Creates an image processing post process for the vignette not relying
                // on the main scene configuration for image processing to reduce setup and spaces 
                // (gamma/linear) conflicts.
                var imageProcessingConfiguration = new BABYLON.ImageProcessingConfiguration();
                imageProcessingConfiguration.vignetteColor = new BABYLON.Color4(0, 0, 0, 0);
                imageProcessingConfiguration.vignetteEnabled = true;
                this._postProcessMove = new BABYLON.ImageProcessingPostProcess("postProcessMove", 1.0, this._webVRCamera, undefined, undefined, undefined, undefined, imageProcessingConfiguration);
                this._webVRCamera.detachPostProcess(this._postProcessMove);
                this._passProcessMove = new BABYLON.PassPostProcess("pass", 1.0, this._webVRCamera);
                this._teleportationEnabled = true;
                if (this._isDefaultTeleportationTarget) {
                    this._createTeleportationCircles();
                }
            }
        };
        VRExperienceHelper.prototype._enableInteractionOnController = function (webVRController) {
            var _this = this;
            var controllerMesh = webVRController.mesh;
            if (controllerMesh) {
                var makeNotPick = function (root) {
                    root.name += " laserPointer";
                    root.getChildMeshes().forEach(function (c) {
                        makeNotPick(c);
                    });
                };
                makeNotPick(controllerMesh);
                var childMeshes = controllerMesh.getChildMeshes();
                for (var i = 0; i < childMeshes.length; i++) {
                    if (childMeshes[i].name && childMeshes[i].name.indexOf("POINTING_POSE") >= 0) {
                        controllerMesh = childMeshes[i];
                        break;
                    }
                }
                var laserPointer = BABYLON.Mesh.CreateCylinder("laserPointer", 1, 0.004, 0.0002, 20, 1, this._scene, false);
                var laserPointerMaterial = new BABYLON.StandardMaterial("laserPointerMat", this._scene);
                laserPointerMaterial.emissiveColor = new BABYLON.Color3(0.7, 0.7, 0.7);
                laserPointerMaterial.alpha = 0.6;
                laserPointer.material = laserPointerMaterial;
                laserPointer.rotation.x = Math.PI / 2;
                laserPointer.parent = controllerMesh;
                laserPointer.position.z = -0.5;
                laserPointer.isVisible = false;
                if (webVRController.hand === "left") {
                    this._leftLaserPointer = laserPointer;
                    this._interactionsEnabledOnLeftController = true;
                    if (!this._rightLaserPointer) {
                        this._leftLaserPointer.isVisible = true;
                    }
                }
                else {
                    this._rightLaserPointer = laserPointer;
                    this._interactionsEnabledOnRightController = true;
                    if (!this._leftLaserPointer) {
                        this._rightLaserPointer.isVisible = true;
                    }
                }
                webVRController.onMainButtonStateChangedObservable.add(function (stateObject) {
                    // Enabling / disabling laserPointer 
                    if (_this._displayLaserPointer && stateObject.value === 1) {
                        laserPointer.isVisible = !laserPointer.isVisible;
                        // Laser pointer can only be active on left or right, not both at the same time
                        if (webVRController.hand === "left" && _this._rightLaserPointer) {
                            _this._rightLaserPointer.isVisible = false;
                        }
                        else if (_this._leftLaserPointer) {
                            _this._leftLaserPointer.isVisible = false;
                        }
                    }
                });
                webVRController.onTriggerStateChangedObservable.add(function (stateObject) {
                    if (!_this._pointerDownOnMeshAsked) {
                        if (stateObject.value > _this._padSensibilityUp) {
                            _this._selectionPointerDown();
                        }
                    }
                    else if (stateObject.value < _this._padSensibilityDown) {
                        _this._selectionPointerUp();
                    }
                });
            }
        };
        VRExperienceHelper.prototype._checkTeleportWithRay = function (stateObject, webVRController) {
            if (webVRController === void 0) { webVRController = null; }
            if (!this._teleportationRequestInitiated) {
                if (stateObject.y < -this._padSensibilityUp && this._dpadPressed) {
                    if (webVRController) {
                        // If laser pointer wasn't enabled yet
                        if (this._displayLaserPointer && webVRController.hand === "left" && this._leftLaserPointer) {
                            this._leftLaserPointer.isVisible = true;
                            if (this._rightLaserPointer) {
                                this._rightLaserPointer.isVisible = false;
                            }
                        }
                        else if (this._displayLaserPointer && this._rightLaserPointer) {
                            this._rightLaserPointer.isVisible = true;
                            if (this._leftLaserPointer) {
                                this._leftLaserPointer.isVisible = false;
                            }
                        }
                    }
                    this._teleportationRequestInitiated = true;
                }
            }
            else {
                // Listening to the proper controller values changes to confirm teleportation
                if (webVRController == null
                    || (webVRController.hand === "left" && this._leftLaserPointer && this._leftLaserPointer.isVisible)
                    || (webVRController.hand === "right" && this._rightLaserPointer && this._rightLaserPointer.isVisible)) {
                    if (Math.sqrt(stateObject.y * stateObject.y + stateObject.x * stateObject.x) < this._padSensibilityDown) {
                        if (this._teleportationAllowed) {
                            this._teleportationAllowed = false;
                            this._teleportCamera();
                        }
                        this._teleportationRequestInitiated = false;
                    }
                }
            }
        };
        VRExperienceHelper.prototype._selectionPointerDown = function () {
            this._pointerDownOnMeshAsked = true;
            if (this._currentMeshSelected && this._currentHit) {
                this._scene.simulatePointerDown(this._currentHit);
            }
        };
        VRExperienceHelper.prototype._selectionPointerUp = function () {
            if (this._currentMeshSelected && this._currentHit) {
                this._scene.simulatePointerUp(this._currentHit);
            }
            this._pointerDownOnMeshAsked = false;
        };
        VRExperienceHelper.prototype._checkRotate = function (stateObject) {
            // Only rotate when user is not currently selecting a teleportation location
            if (this._teleportationRequestInitiated) {
                return;
            }
            if (!this._rotationLeftAsked) {
                if (stateObject.x < -this._padSensibilityUp && this._dpadPressed) {
                    this._rotationLeftAsked = true;
                    if (this._rotationAllowed) {
                        this._rotateCamera(false);
                    }
                }
            }
            else {
                if (stateObject.x > -this._padSensibilityDown) {
                    this._rotationLeftAsked = false;
                }
            }
            if (!this._rotationRightAsked) {
                if (stateObject.x > this._padSensibilityUp && this._dpadPressed) {
                    this._rotationRightAsked = true;
                    if (this._rotationAllowed) {
                        this._rotateCamera(true);
                    }
                }
            }
            else {
                if (stateObject.x < this._padSensibilityDown) {
                    this._rotationRightAsked = false;
                }
            }
        };
        VRExperienceHelper.prototype._checkTeleportBackwards = function (stateObject) {
            // Only teleport backwards when user is not currently selecting a teleportation location
            if (this._teleportationRequestInitiated) {
                return;
            }
            // Teleport backwards
            if (stateObject.y > this._padSensibilityUp && this._dpadPressed) {
                if (!this._teleportationBackRequestInitiated) {
                    if (!this.currentVRCamera) {
                        return;
                    }
                    // Get rotation and position of the current camera
                    var rotation = BABYLON.Quaternion.FromRotationMatrix(this.currentVRCamera.getWorldMatrix().getRotationMatrix());
                    var position = this.currentVRCamera.position;
                    // If the camera has device position, use that instead
                    if (this.currentVRCamera.devicePosition && this.currentVRCamera.deviceRotationQuaternion) {
                        rotation = this.currentVRCamera.deviceRotationQuaternion;
                        position = this.currentVRCamera.devicePosition;
                    }
                    // Get matrix with only the y rotation of the device rotation
                    rotation.toEulerAnglesToRef(this._workingVector);
                    this._workingVector.z = 0;
                    this._workingVector.x = 0;
                    BABYLON.Quaternion.RotationYawPitchRollToRef(this._workingVector.y, this._workingVector.x, this._workingVector.z, this._workingQuaternion);
                    this._workingQuaternion.toRotationMatrix(this._workingMatrix);
                    // Rotate backwards ray by device rotation to cast at the ground behind the user
                    BABYLON.Vector3.TransformCoordinatesToRef(this.teleportBackwardsVector, this._workingMatrix, this._workingVector);
                    // Teleport if ray hit the ground and is not to far away eg. backwards off a cliff
                    var ray = new BABYLON.Ray(position, this._workingVector);
                    var hit = this._scene.pickWithRay(ray, this._raySelectionPredicate);
                    if (hit && hit.pickedPoint && hit.pickedMesh && this._isTeleportationFloor(hit.pickedMesh) && hit.distance < 5) {
                        this._teleportCamera(hit.pickedPoint);
                    }
                    this._teleportationBackRequestInitiated = true;
                }
            }
            else {
                this._teleportationBackRequestInitiated = false;
            }
        };
        VRExperienceHelper.prototype._enableTeleportationOnController = function (webVRController) {
            var _this = this;
            var controllerMesh = webVRController.mesh;
            if (controllerMesh) {
                if (webVRController.hand === "left") {
                    if (!this._interactionsEnabledOnLeftController) {
                        this._enableInteractionOnController(webVRController);
                    }
                    this._teleportationEnabledOnLeftController = true;
                }
                else {
                    if (!this._interactionsEnabledOnRightController) {
                        this._enableInteractionOnController(webVRController);
                    }
                    this._teleportationEnabledOnRightController = true;
                }
                if (webVRController.controllerType === BABYLON.PoseEnabledControllerType.VIVE) {
                    this._dpadPressed = false;
                    webVRController.onPadStateChangedObservable.add(function (stateObject) {
                        _this._dpadPressed = stateObject.pressed;
                        if (!_this._dpadPressed) {
                            _this._rotationLeftAsked = false;
                            _this._rotationRightAsked = false;
                            _this._teleportationBackRequestInitiated = false;
                        }
                    });
                }
                webVRController.onPadValuesChangedObservable.add(function (stateObject) {
                    _this._checkTeleportBackwards(stateObject);
                    _this._checkTeleportWithRay(stateObject, webVRController);
                    _this._checkRotate(stateObject);
                });
            }
        };
        // Gaze support used to point to teleport or to interact with an object
        VRExperienceHelper.prototype._createGazeTracker = function () {
            this._gazeTracker = BABYLON.Mesh.CreateTorus("gazeTracker", 0.0035, 0.0025, 20, this._scene, false);
            this._gazeTracker.bakeCurrentTransformIntoVertices();
            this._gazeTracker.isPickable = false;
            this._gazeTracker.isVisible = false;
            var targetMat = new BABYLON.StandardMaterial("targetMat", this._scene);
            targetMat.specularColor = BABYLON.Color3.Black();
            targetMat.emissiveColor = new BABYLON.Color3(0.7, 0.7, 0.7);
            targetMat.backFaceCulling = false;
            this._gazeTracker.material = targetMat;
        };
        VRExperienceHelper.prototype._createTeleportationCircles = function () {
            this._teleportationTarget = BABYLON.Mesh.CreateGround("teleportationTarget", 2, 2, 2, this._scene);
            this._teleportationTarget.isPickable = false;
            var length = 512;
            var dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", length, this._scene, true);
            dynamicTexture.hasAlpha = true;
            var context = dynamicTexture.getContext();
            var centerX = length / 2;
            var centerY = length / 2;
            var radius = 200;
            context.beginPath();
            context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
            context.fillStyle = this._teleportationFillColor;
            context.fill();
            context.lineWidth = 10;
            context.strokeStyle = this._teleportationBorderColor;
            context.stroke();
            context.closePath();
            dynamicTexture.update();
            var teleportationCircleMaterial = new BABYLON.StandardMaterial("TextPlaneMaterial", this._scene);
            teleportationCircleMaterial.diffuseTexture = dynamicTexture;
            this._teleportationTarget.material = teleportationCircleMaterial;
            var torus = BABYLON.Mesh.CreateTorus("torusTeleportation", 0.75, 0.1, 25, this._scene, false);
            torus.isPickable = false;
            torus.parent = this._teleportationTarget;
            var animationInnerCircle = new BABYLON.Animation("animationInnerCircle", "position.y", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
            var keys = [];
            keys.push({
                frame: 0,
                value: 0
            });
            keys.push({
                frame: 30,
                value: 0.4
            });
            keys.push({
                frame: 60,
                value: 0
            });
            animationInnerCircle.setKeys(keys);
            var easingFunction = new BABYLON.SineEase();
            easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
            animationInnerCircle.setEasingFunction(easingFunction);
            torus.animations = [];
            torus.animations.push(animationInnerCircle);
            this._scene.beginAnimation(torus, 0, 60, true);
            this._hideTeleportationTarget();
        };
        VRExperienceHelper.prototype._displayTeleportationTarget = function () {
            if (this._teleportationEnabled) {
                this._teleportationTarget.isVisible = true;
                if (this._isDefaultTeleportationTarget) {
                    this._teleportationTarget.getChildren()[0].isVisible = true;
                }
            }
        };
        VRExperienceHelper.prototype._hideTeleportationTarget = function () {
            if (this._teleportationEnabled) {
                this._teleportationTarget.isVisible = false;
                if (this._isDefaultTeleportationTarget) {
                    this._teleportationTarget.getChildren()[0].isVisible = false;
                }
            }
        };
        VRExperienceHelper.prototype._rotateCamera = function (right) {
            var _this = this;
            if (!(this.currentVRCamera instanceof BABYLON.FreeCamera)) {
                return;
            }
            if (right) {
                this._rotationAngle++;
            }
            else {
                this._rotationAngle--;
            }
            this.currentVRCamera.animations = [];
            var target = BABYLON.Quaternion.FromRotationMatrix(BABYLON.Matrix.RotationY(Math.PI / 4 * this._rotationAngle));
            var animationRotation = new BABYLON.Animation("animationRotation", "rotationQuaternion", 90, BABYLON.Animation.ANIMATIONTYPE_QUATERNION, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
            var animationRotationKeys = [];
            animationRotationKeys.push({
                frame: 0,
                value: this.currentVRCamera.rotationQuaternion
            });
            animationRotationKeys.push({
                frame: 6,
                value: target
            });
            animationRotation.setKeys(animationRotationKeys);
            animationRotation.setEasingFunction(this._circleEase);
            this.currentVRCamera.animations.push(animationRotation);
            this._postProcessMove.animations = [];
            var animationPP = new BABYLON.Animation("animationPP", "vignetteWeight", 90, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
            var vignetteWeightKeys = [];
            vignetteWeightKeys.push({
                frame: 0,
                value: 0
            });
            vignetteWeightKeys.push({
                frame: 3,
                value: 4
            });
            vignetteWeightKeys.push({
                frame: 6,
                value: 0
            });
            animationPP.setKeys(vignetteWeightKeys);
            animationPP.setEasingFunction(this._circleEase);
            this._postProcessMove.animations.push(animationPP);
            var animationPP2 = new BABYLON.Animation("animationPP2", "vignetteStretch", 90, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
            var vignetteStretchKeys = [];
            vignetteStretchKeys.push({
                frame: 0,
                value: 0
            });
            vignetteStretchKeys.push({
                frame: 3,
                value: 10
            });
            vignetteStretchKeys.push({
                frame: 6,
                value: 0
            });
            animationPP2.setKeys(vignetteStretchKeys);
            animationPP2.setEasingFunction(this._circleEase);
            this._postProcessMove.animations.push(animationPP2);
            this._postProcessMove.imageProcessingConfiguration.vignetteWeight = 0;
            this._postProcessMove.imageProcessingConfiguration.vignetteStretch = 0;
            this._webVRCamera.attachPostProcess(this._postProcessMove);
            this._scene.beginAnimation(this._postProcessMove, 0, 6, false, 1, function () {
                _this._webVRCamera.detachPostProcess(_this._postProcessMove);
            });
            this._scene.beginAnimation(this.currentVRCamera, 0, 6, false, 1);
        };
        VRExperienceHelper.prototype._moveTeleportationSelectorTo = function (hit) {
            if (hit.pickedPoint) {
                this._teleportationAllowed = true;
                if (this._teleportationRequestInitiated) {
                    this._displayTeleportationTarget();
                }
                else {
                    this._hideTeleportationTarget();
                }
                this._haloCenter.copyFrom(hit.pickedPoint);
                this._teleportationTarget.position.copyFrom(hit.pickedPoint);
                var pickNormal = hit.getNormal(true, false);
                if (pickNormal) {
                    var axis1 = BABYLON.Vector3.Cross(BABYLON.Axis.Y, pickNormal);
                    var axis2 = BABYLON.Vector3.Cross(pickNormal, axis1);
                    BABYLON.Vector3.RotationFromAxisToRef(axis2, pickNormal, axis1, this._teleportationTarget.rotation);
                }
                this._teleportationTarget.position.y += 0.1;
            }
        };
        VRExperienceHelper.prototype._teleportCamera = function (location) {
            var _this = this;
            if (location === void 0) { location = null; }
            if (!(this.currentVRCamera instanceof BABYLON.FreeCamera)) {
                return;
            }
            if (!location) {
                location = this._haloCenter;
            }
            // Teleport the hmd to where the user is looking by moving the anchor to where they are looking minus the
            // offset of the headset from the anchor.
            if (this.webVRCamera.leftCamera) {
                this._workingVector.copyFrom(this.webVRCamera.leftCamera.globalPosition);
                this._workingVector.subtractInPlace(this.webVRCamera.position);
                location.subtractToRef(this._workingVector, this._workingVector);
            }
            else {
                this._workingVector.copyFrom(location);
            }
            // Add height to account for user's height offset
            if (this.isInVRMode) {
                this._workingVector.y += this.webVRCamera.deviceDistanceToRoomGround();
            }
            else {
                this._workingVector.y += this._defaultHeight;
            }
            this.onBeforeCameraTeleport.notifyObservers(this._workingVector);
            // Create animation from the camera's position to the new location
            this.currentVRCamera.animations = [];
            var animationCameraTeleportation = new BABYLON.Animation("animationCameraTeleportation", "position", 90, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
            var animationCameraTeleportationKeys = [{
                    frame: 0,
                    value: this.currentVRCamera.position
                },
                {
                    frame: 11,
                    value: this._workingVector
                }
            ];
            animationCameraTeleportation.setKeys(animationCameraTeleportationKeys);
            animationCameraTeleportation.setEasingFunction(this._circleEase);
            this.currentVRCamera.animations.push(animationCameraTeleportation);
            this._postProcessMove.animations = [];
            var animationPP = new BABYLON.Animation("animationPP", "vignetteWeight", 90, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
            var vignetteWeightKeys = [];
            vignetteWeightKeys.push({
                frame: 0,
                value: 0
            });
            vignetteWeightKeys.push({
                frame: 5,
                value: 8
            });
            vignetteWeightKeys.push({
                frame: 11,
                value: 0
            });
            animationPP.setKeys(vignetteWeightKeys);
            this._postProcessMove.animations.push(animationPP);
            var animationPP2 = new BABYLON.Animation("animationPP2", "vignetteStretch", 90, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
            var vignetteStretchKeys = [];
            vignetteStretchKeys.push({
                frame: 0,
                value: 0
            });
            vignetteStretchKeys.push({
                frame: 5,
                value: 10
            });
            vignetteStretchKeys.push({
                frame: 11,
                value: 0
            });
            animationPP2.setKeys(vignetteStretchKeys);
            this._postProcessMove.animations.push(animationPP2);
            this._postProcessMove.imageProcessingConfiguration.vignetteWeight = 0;
            this._postProcessMove.imageProcessingConfiguration.vignetteStretch = 0;
            this._webVRCamera.attachPostProcess(this._postProcessMove);
            this._scene.beginAnimation(this._postProcessMove, 0, 11, false, 1, function () {
                _this._webVRCamera.detachPostProcess(_this._postProcessMove);
            });
            this._scene.beginAnimation(this.currentVRCamera, 0, 11, false, 1, function () {
                _this.onAfterCameraTeleport.notifyObservers(_this._workingVector);
            });
        };
        VRExperienceHelper.prototype._castRayAndSelectObject = function () {
            if (!(this.currentVRCamera instanceof BABYLON.FreeCamera)) {
                return;
            }
            var ray;
            if (this._leftLaserPointer && this._leftLaserPointer.isVisible && this.currentVRCamera.leftController) {
                ray = this.currentVRCamera.leftController.getForwardRay(this._rayLength);
            }
            else if (this._rightLaserPointer && this._rightLaserPointer.isVisible && this.currentVRCamera.rightController) {
                ray = this.currentVRCamera.rightController.getForwardRay(this._rayLength);
            }
            else {
                ray = this.currentVRCamera.getForwardRay(this._rayLength);
            }
            var hit = this._scene.pickWithRay(ray, this._raySelectionPredicate);
            // Moving the gazeTracker on the mesh face targetted
            if (hit && hit.pickedPoint) {
                if (this._displayGaze) {
                    var multiplier = 1;
                    this._gazeTracker.isVisible = true;
                    if (this._isActionableMesh) {
                        multiplier = 3;
                    }
                    this._gazeTracker.scaling.x = hit.distance * multiplier;
                    this._gazeTracker.scaling.y = hit.distance * multiplier;
                    this._gazeTracker.scaling.z = hit.distance * multiplier;
                    var pickNormal = hit.getNormal();
                    // To avoid z-fighting
                    var deltaFighting = 0.002;
                    if (pickNormal) {
                        var axis1 = BABYLON.Vector3.Cross(BABYLON.Axis.Y, pickNormal);
                        var axis2 = BABYLON.Vector3.Cross(pickNormal, axis1);
                        BABYLON.Vector3.RotationFromAxisToRef(axis2, pickNormal, axis1, this._gazeTracker.rotation);
                    }
                    this._gazeTracker.position.copyFrom(hit.pickedPoint);
                    if (this._gazeTracker.position.x < 0) {
                        this._gazeTracker.position.x += deltaFighting;
                    }
                    else {
                        this._gazeTracker.position.x -= deltaFighting;
                    }
                    if (this._gazeTracker.position.y < 0) {
                        this._gazeTracker.position.y += deltaFighting;
                    }
                    else {
                        this._gazeTracker.position.y -= deltaFighting;
                    }
                    if (this._gazeTracker.position.z < 0) {
                        this._gazeTracker.position.z += deltaFighting;
                    }
                    else {
                        this._gazeTracker.position.z -= deltaFighting;
                    }
                }
                // Changing the size of the laser pointer based on the distance from the targetted point
                if (this._rightLaserPointer && this._rightLaserPointer.isVisible) {
                    this._rightLaserPointer.scaling.y = hit.distance;
                    this._rightLaserPointer.position.z = -hit.distance / 2;
                }
                if (this._leftLaserPointer && this._leftLaserPointer.isVisible) {
                    this._leftLaserPointer.scaling.y = hit.distance;
                    this._leftLaserPointer.position.z = -hit.distance / 2;
                }
            }
            else {
                this._gazeTracker.isVisible = false;
            }
            if (hit && hit.pickedMesh) {
                this._currentHit = hit;
                if (this._pointerDownOnMeshAsked) {
                    this._scene.simulatePointerMove(this._currentHit);
                }
                // The object selected is the floor, we're in a teleportation scenario
                if (this._teleportationEnabled && this._isTeleportationFloor(hit.pickedMesh) && hit.pickedPoint) {
                    // Moving the teleportation area to this targetted point
                    this._moveTeleportationSelectorTo(hit);
                    return;
                }
                // If not, we're in a selection scenario
                this._hideTeleportationTarget();
                this._teleportationAllowed = false;
                if (hit.pickedMesh !== this._currentMeshSelected) {
                    if (this.meshSelectionPredicate(hit.pickedMesh)) {
                        this._currentMeshSelected = hit.pickedMesh;
                        if (hit.pickedMesh.isPickable && hit.pickedMesh.actionManager) {
                            this.changeGazeColor(new BABYLON.Color3(0, 0, 1));
                            this.changeLaserColor(new BABYLON.Color3(0.2, 0.2, 1));
                            this._isActionableMesh = true;
                        }
                        else {
                            this.changeGazeColor(new BABYLON.Color3(0.7, 0.7, 0.7));
                            this.changeLaserColor(new BABYLON.Color3(0.7, 0.7, 0.7));
                            this._isActionableMesh = false;
                        }
                        try {
                            this.onNewMeshSelected.notifyObservers(this._currentMeshSelected);
                        }
                        catch (err) {
                            BABYLON.Tools.Warn("Error in your custom logic onNewMeshSelected: " + err);
                        }
                    }
                    else {
                        if (this._currentMeshSelected) {
                            this.onSelectedMeshUnselected.notifyObservers(this._currentMeshSelected);
                        }
                        this._currentMeshSelected = null;
                        this.changeGazeColor(new BABYLON.Color3(0.7, 0.7, 0.7));
                        this.changeLaserColor(new BABYLON.Color3(0.7, 0.7, 0.7));
                    }
                }
            }
            else {
                this._currentHit = null;
                this._currentMeshSelected = null;
                this._teleportationAllowed = false;
                this._hideTeleportationTarget();
                this.changeGazeColor(new BABYLON.Color3(0.7, 0.7, 0.7));
                this.changeLaserColor(new BABYLON.Color3(0.7, 0.7, 0.7));
            }
        };
        VRExperienceHelper.prototype.changeLaserColor = function (color) {
            if (this._leftLaserPointer && this._leftLaserPointer.material) {
                this._leftLaserPointer.material.emissiveColor = color;
            }
            if (this._rightLaserPointer && this._rightLaserPointer.material) {
                this._rightLaserPointer.material.emissiveColor = color;
            }
        };
        VRExperienceHelper.prototype.changeGazeColor = function (color) {
            if (this._gazeTracker.material) {
                this._gazeTracker.material.emissiveColor = color;
            }
        };
        VRExperienceHelper.prototype.dispose = function () {
            if (this.isInVRMode) {
                this.exitVR();
            }
            if (this._passProcessMove) {
                this._passProcessMove.dispose();
            }
            if (this._postProcessMove) {
                this._postProcessMove.dispose();
            }
            if (this._webVRCamera) {
                this._webVRCamera.dispose();
            }
            if (this._vrDeviceOrientationCamera) {
                this._vrDeviceOrientationCamera.dispose();
            }
            if (!this._useCustomVRButton && this._btnVR.parentNode) {
                document.body.removeChild(this._btnVR);
            }
            if (this._deviceOrientationCamera && (this._scene.activeCamera != this._deviceOrientationCamera)) {
                this._deviceOrientationCamera.dispose();
            }
            if (this._gazeTracker) {
                this._gazeTracker.dispose();
            }
            if (this._teleportationTarget) {
                this._teleportationTarget.dispose();
            }
            this._floorMeshesCollection = [];
            document.removeEventListener("keydown", this._onKeyDown);
            window.removeEventListener('vrdisplaypresentchange', this._onVrDisplayPresentChange);
            window.removeEventListener("resize", this._onResize);
            document.removeEventListener("fullscreenchange", this._onFullscreenChange);
            document.removeEventListener("mozfullscreenchange", this._onFullscreenChange);
            document.removeEventListener("webkitfullscreenchange", this._onFullscreenChange);
            document.removeEventListener("msfullscreenchange", this._onFullscreenChange);
            this._scene.getEngine().onVRDisplayChangedObservable.removeCallback(this._onVRDisplayChanged);
            this._scene.getEngine().onVRRequestPresentStart.removeCallback(this._onVRRequestPresentStart);
            this._scene.getEngine().onVRRequestPresentComplete.removeCallback(this._onVRRequestPresentComplete);
            window.removeEventListener('vrdisplaypresentchange', this._onVrDisplayPresentChange);
            this._scene.gamepadManager.onGamepadConnectedObservable.removeCallback(this._onNewGamepadConnected);
            this._scene.gamepadManager.onGamepadDisconnectedObservable.removeCallback(this._onNewGamepadDisconnected);
            this._scene.unregisterBeforeRender(this.beforeRender);
        };
        VRExperienceHelper.prototype.getClassName = function () {
            return "VRExperienceHelper";
        };
        return VRExperienceHelper;
    }());
    BABYLON.VRExperienceHelper = VRExperienceHelper;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.vrExperienceHelper.js.map

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
var VRDistortionCorrectionPostProcess = BABYLON.VRDistortionCorrectionPostProcess;
var AnaglyphPostProcess = BABYLON.AnaglyphPostProcess;
var StereoscopicInterlacePostProcess = BABYLON.StereoscopicInterlacePostProcess;
var FreeCameraDeviceOrientationInput = BABYLON.FreeCameraDeviceOrientationInput;
var ArcRotateCameraVRDeviceOrientationInput = BABYLON.ArcRotateCameraVRDeviceOrientationInput;
var VRCameraMetrics = BABYLON.VRCameraMetrics;
var WebVRFreeCamera = BABYLON.WebVRFreeCamera;
var DeviceOrientationCamera = BABYLON.DeviceOrientationCamera;
var VRDeviceOrientationFreeCamera = BABYLON.VRDeviceOrientationFreeCamera;
var VRDeviceOrientationGamepadCamera = BABYLON.VRDeviceOrientationGamepadCamera;
var VRDeviceOrientationArcRotateCamera = BABYLON.VRDeviceOrientationArcRotateCamera;
var AnaglyphFreeCamera = BABYLON.AnaglyphFreeCamera;
var AnaglyphArcRotateCamera = BABYLON.AnaglyphArcRotateCamera;
var AnaglyphGamepadCamera = BABYLON.AnaglyphGamepadCamera;
var AnaglyphUniversalCamera = BABYLON.AnaglyphUniversalCamera;
var StereoscopicFreeCamera = BABYLON.StereoscopicFreeCamera;
var StereoscopicArcRotateCamera = BABYLON.StereoscopicArcRotateCamera;
var StereoscopicGamepadCamera = BABYLON.StereoscopicGamepadCamera;
var StereoscopicUniversalCamera = BABYLON.StereoscopicUniversalCamera;
var VRExperienceHelper = BABYLON.VRExperienceHelper;

export { VRDistortionCorrectionPostProcess,AnaglyphPostProcess,StereoscopicInterlacePostProcess,FreeCameraDeviceOrientationInput,ArcRotateCameraVRDeviceOrientationInput,VRCameraMetrics,WebVRFreeCamera,DeviceOrientationCamera,VRDeviceOrientationFreeCamera,VRDeviceOrientationGamepadCamera,VRDeviceOrientationArcRotateCamera,AnaglyphFreeCamera,AnaglyphArcRotateCamera,AnaglyphGamepadCamera,AnaglyphUniversalCamera,StereoscopicFreeCamera,StereoscopicArcRotateCamera,StereoscopicGamepadCamera,StereoscopicUniversalCamera,VRExperienceHelper };