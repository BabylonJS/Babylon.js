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
var BABYLON;
(function (BABYLON) {
    var CustomShaderStructure = (function () {
        function CustomShaderStructure() {
        }
        return CustomShaderStructure;
    }());
    BABYLON.CustomShaderStructure = CustomShaderStructure;
    var ShaderForVer3_0 = (function (_super) {
        __extends(ShaderForVer3_0, _super);
        function ShaderForVer3_0() {
            var _this = _super.call(this) || this;
            _this.VertexStore = "";
            _this.FragmentStore = "#include<__decl__defaultFragment>\
#[Fragment_Begin]\
#ifdef BUMP\
#extension GL_OES_standard_derivatives : enable\
#endif\
#ifdef LOGARITHMICDEPTH\
#extension GL_EXT_frag_depth : enable\
#endif\
\
#define RECIPROCAL_PI2 0.15915494\
uniform vec3 vEyePosition;\
uniform vec3 vAmbientColor;\
\
varying vec3 vPositionW;\
#ifdef NORMAL\
varying vec3 vNormalW;\
#endif\
#ifdef VERTEXCOLOR\
varying vec4 vColor;\
#endif\
\
#include<helperFunctions>\
\
#include<__decl__lightFragment>[0..maxSimultaneousLights]\
#include<lightsFragmentFunctions>\
#include<shadowsFragmentFunctions>\
\
#ifdef DIFFUSE\
varying vec2 vDiffuseUV;\
uniform sampler2D diffuseSampler;\
#endif\
#ifdef AMBIENT\
varying vec2 vAmbientUV;\
uniform sampler2D ambientSampler;\
#endif\
#ifdef OPACITY\
varying vec2 vOpacityUV;\
uniform sampler2D opacitySampler;\
#endif\
#ifdef EMISSIVE\
varying vec2 vEmissiveUV;\
uniform sampler2D emissiveSampler;\
#endif\
#ifdef LIGHTMAP\
varying vec2 vLightmapUV;\
uniform sampler2D lightmapSampler;\
#endif\
#ifdef REFRACTION\
#ifdef REFRACTIONMAP_3D\
uniform samplerCube refractionCubeSampler;\
#else\
uniform sampler2D refraction2DSampler;\
#endif\
#endif\
#if defined(SPECULAR) && defined(SPECULARTERM)\
varying vec2 vSpecularUV;\
uniform sampler2D specularSampler;\
#endif\
\
#include<fresnelFunction>\
\
#ifdef REFLECTION\
#ifdef REFLECTIONMAP_3D\
uniform samplerCube reflectionCubeSampler;\
#else\
uniform sampler2D reflection2DSampler;\
#endif\
#ifdef REFLECTIONMAP_SKYBOX\
varying vec3 vPositionUVW;\
#else\
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\
varying vec3 vDirectionW;\
#endif\
#endif\
#include<reflectionFunction>\
#endif\
#ifdef CAMERACOLORGRADING\
#include<colorGradingDefinition> \
#include<colorGrading>\
#endif\
#ifdef CAMERACOLORCURVES\
#include<colorCurvesDefinition>\
#include<colorCurves>\
#endif\
#include<bumpFragmentFunctions>\
#include<clipPlaneFragmentDeclaration>\
#include<logDepthDeclaration>\
#include<fogFragmentDeclaration>\
\
#[Fragment_Definations]\
\
void main(void) {\
\
#[Fragment_MainBegin]\
\
#include<clipPlaneFragment>\
vec3 viewDirectionW=normalize(vEyePosition-vPositionW);\
\
vec4 baseColor=vec4(1.,1.,1.,1.);\
vec3 diffuseColor=vDiffuseColor.rgb;\
#[Fragment_Custom_Deffiuse]\
\
float alpha=vDiffuseColor.a;\
#[Fragment_Custom_Alpha]\
\
#ifdef NORMAL\
vec3 normalW=normalize(vNormalW);\
#else\
vec3 normalW=vec3(1.0,1.0,1.0);\
#endif\
#include<bumpFragment>\
#ifdef TWOSIDEDLIGHTING\
normalW=gl_FrontFacing ? normalW : -normalW;\
#endif\
#ifdef DIFFUSE\
baseColor=texture2D(diffuseSampler,vDiffuseUV+uvOffset);\
#ifdef ALPHATEST\
if (baseColor.a<0.4)\
discard;\
#endif\
#ifdef ALPHAFROMDIFFUSE\
alpha*=baseColor.a;\
#endif\
baseColor.rgb*=vDiffuseInfos.y;\
#endif\
#ifdef VERTEXCOLOR\
baseColor.rgb*=vColor.rgb;\
#endif\
\
vec3 baseAmbientColor=vec3(1.,1.,1.);\
#ifdef AMBIENT\
baseAmbientColor=texture2D(ambientSampler,vAmbientUV+uvOffset).rgb*vAmbientInfos.y;\
#endif\
\
#ifdef SPECULARTERM\
float glossiness=vSpecularColor.a;\
vec3 specularColor=vSpecularColor.rgb;\
#ifdef SPECULAR\
vec4 specularMapColor=texture2D(specularSampler,vSpecularUV+uvOffset);\
specularColor=specularMapColor.rgb;\
#ifdef GLOSSINESS\
glossiness=glossiness*specularMapColor.a;\
#endif\
#endif\
#else\
float glossiness=0.;\
#endif\
\
vec3 diffuseBase=vec3(0.,0.,0.);\
lightingInfo info;\
#ifdef SPECULARTERM\
vec3 specularBase=vec3(0.,0.,0.);\
#endif\
float shadow=1.;\
#ifdef LIGHTMAP\
vec3 lightmapColor=texture2D(lightmapSampler,vLightmapUV+uvOffset).rgb*vLightmapInfos.y;\
#endif\
#include<lightFragment>[0..maxSimultaneousLights]\
\
vec3 refractionColor=vec3(0.,0.,0.);\
#ifdef REFRACTION\
vec3 refractionVector=normalize(refract(-viewDirectionW,normalW,vRefractionInfos.y));\
#ifdef REFRACTIONMAP_3D\
refractionVector.y=refractionVector.y*vRefractionInfos.w;\
if (dot(refractionVector,viewDirectionW)<1.0)\
{\
refractionColor=textureCube(refractionCubeSampler,refractionVector).rgb*vRefractionInfos.x;\
}\
#else\
vec3 vRefractionUVW=vec3(refractionMatrix*(view*vec4(vPositionW+refractionVector*vRefractionInfos.z,1.0)));\
vec2 refractionCoords=vRefractionUVW.xy/vRefractionUVW.z;\
refractionCoords.y=1.0-refractionCoords.y;\
refractionColor=texture2D(refraction2DSampler,refractionCoords).rgb*vRefractionInfos.x;\
#endif\
#endif\
\
vec3 reflectionColor=vec3(0.,0.,0.);\
#ifdef REFLECTION\
vec3 vReflectionUVW=computeReflectionCoords(vec4(vPositionW,1.0),normalW);\
#ifdef REFLECTIONMAP_3D\
#ifdef ROUGHNESS\
float bias=vReflectionInfos.y;\
#ifdef SPECULARTERM\
#ifdef SPECULAR\
#ifdef GLOSSINESS\
bias*=(1.0-specularMapColor.a);\
#endif\
#endif\
#endif\
reflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW,bias).rgb*vReflectionInfos.x;\
#else\
reflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW).rgb*vReflectionInfos.x;\
#endif\
#else\
vec2 coords=vReflectionUVW.xy;\
#ifdef REFLECTIONMAP_PROJECTION\
coords/=vReflectionUVW.z;\
#endif\
coords.y=1.0-coords.y;\
reflectionColor=texture2D(reflection2DSampler,coords).rgb*vReflectionInfos.x;\
#endif\
#ifdef REFLECTIONFRESNEL\
float reflectionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,reflectionRightColor.a,reflectionLeftColor.a);\
#ifdef REFLECTIONFRESNELFROMSPECULAR\
#ifdef SPECULARTERM\
reflectionColor*=specularColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\
#else\
reflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\
#endif\
#else\
reflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\
#endif\
#endif\
#endif\
#ifdef REFRACTIONFRESNEL\
float refractionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,refractionRightColor.a,refractionLeftColor.a);\
refractionColor*=refractionLeftColor.rgb*(1.0-refractionFresnelTerm)+refractionFresnelTerm*refractionRightColor.rgb;\
#endif\
#ifdef OPACITY\
vec4 opacityMap=texture2D(opacitySampler,vOpacityUV+uvOffset);\
#ifdef OPACITYRGB\
opacityMap.rgb=opacityMap.rgb*vec3(0.3,0.59,0.11);\
alpha*=(opacityMap.x+opacityMap.y+opacityMap.z)* vOpacityInfos.y;\
#else\
alpha*=opacityMap.a*vOpacityInfos.y;\
#endif\
#endif\
#ifdef VERTEXALPHA\
alpha*=vColor.a;\
#endif\
#ifdef OPACITYFRESNEL\
float opacityFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,opacityParts.z,opacityParts.w);\
alpha+=opacityParts.x*(1.0-opacityFresnelTerm)+opacityFresnelTerm*opacityParts.y;\
#endif\
\
vec3 emissiveColor=vEmissiveColor;\
#ifdef EMISSIVE\
emissiveColor+=texture2D(emissiveSampler,vEmissiveUV+uvOffset).rgb*vEmissiveInfos.y;\
#endif\
#ifdef EMISSIVEFRESNEL\
float emissiveFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,emissiveRightColor.a,emissiveLeftColor.a);\
emissiveColor*=emissiveLeftColor.rgb*(1.0-emissiveFresnelTerm)+emissiveFresnelTerm*emissiveRightColor.rgb;\
#endif\
\
#ifdef DIFFUSEFRESNEL\
float diffuseFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,diffuseRightColor.a,diffuseLeftColor.a);\
diffuseBase*=diffuseLeftColor.rgb*(1.0-diffuseFresnelTerm)+diffuseFresnelTerm*diffuseRightColor.rgb;\
#endif\
\
#ifdef EMISSIVEASILLUMINATION\
vec3 finalDiffuse=clamp(diffuseBase*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\
#else\
#ifdef LINKEMISSIVEWITHDIFFUSE\
vec3 finalDiffuse=clamp((diffuseBase+emissiveColor)*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\
#else\
vec3 finalDiffuse=clamp(diffuseBase*diffuseColor+emissiveColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\
#endif\
#endif\
#ifdef SPECULARTERM\
vec3 finalSpecular=specularBase*specularColor;\
#ifdef SPECULAROVERALPHA\
alpha=clamp(alpha+dot(finalSpecular,vec3(0.3,0.59,0.11)),0.,1.);\
#endif\
#else\
vec3 finalSpecular=vec3(0.0);\
#endif\
#ifdef REFLECTIONOVERALPHA\
alpha=clamp(alpha+dot(reflectionColor,vec3(0.3,0.59,0.11)),0.,1.);\
#endif\
\
#ifdef EMISSIVEASILLUMINATION\
vec4 color=vec4(clamp(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+emissiveColor+refractionColor,0.0,1.0),alpha);\
#else\
vec4 color=vec4(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+refractionColor,alpha);\
#endif\
\
#ifdef LIGHTMAP\
#ifndef LIGHTMAPEXCLUDED\
#ifdef USELIGHTMAPASSHADOWMAP\
color.rgb*=lightmapColor;\
#else\
color.rgb+=lightmapColor;\
#endif\
#endif\
#endif\
#include<logDepthFragment>\
#include<fogFragment>\
#ifdef CAMERACOLORGRADING\
color=colorGrades(color);\
#endif\
#ifdef CAMERACOLORCURVES\
color.rgb=applyColorCurves(color.rgb);\
#endif\
#[Fragment_Before_FragColor]\
gl_FragColor=color;\
}";
            _this.VertexStore = "#include<__decl__defaultVertex>\
\
#[Vertex_Begin]\
\
attribute vec3 position;\
#ifdef NORMAL\
attribute vec3 normal;\
#endif\
#ifdef TANGENT\
attribute vec4 tangent;\
#endif\
#ifdef UV1\
attribute vec2 uv;\
#endif\
#ifdef UV2\
attribute vec2 uv2;\
#endif\
#ifdef VERTEXCOLOR\
attribute vec4 color;\
#endif\
#include<bonesDeclaration>\
\
#include<instancesDeclaration>\
#ifdef DIFFUSE\
varying vec2 vDiffuseUV;\
#endif\
#ifdef AMBIENT\
varying vec2 vAmbientUV;\
#endif\
#ifdef OPACITY\
varying vec2 vOpacityUV;\
#endif\
#ifdef EMISSIVE\
varying vec2 vEmissiveUV;\
#endif\
#ifdef LIGHTMAP\
varying vec2 vLightmapUV;\
#endif\
#if defined(SPECULAR) && defined(SPECULARTERM)\
varying vec2 vSpecularUV;\
#endif\
#ifdef BUMP\
varying vec2 vBumpUV;\
#endif\
\
varying vec3 vPositionW;\
#ifdef NORMAL\
varying vec3 vNormalW;\
#endif\
#ifdef VERTEXCOLOR\
varying vec4 vColor;\
#endif\
#include<bumpVertexDeclaration>\
#include<clipPlaneVertexDeclaration>\
#include<fogVertexDeclaration>\
#include<shadowsVertexDeclaration>[0..maxSimultaneousLights]\
#include<morphTargetsVertexGlobalDeclaration>\
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]\
#ifdef REFLECTIONMAP_SKYBOX\
varying vec3 vPositionUVW;\
#endif\
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\
varying vec3 vDirectionW;\
#endif\
#include<logDepthDeclaration>\
\
#[Vertex_Definations]\
\
void main(void) {\
    \
    #[Vertex_Bagin]\
    \
vec3 positionUpdated=position;\
#ifdef NORMAL \
vec3 normalUpdated=normal;\
#endif\
#ifdef TANGENT\
vec4 tangentUpdated=tangent;\
#endif\
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]\
#ifdef REFLECTIONMAP_SKYBOX\
vPositionUVW=positionUpdated;\
#endif \
#include<instancesVertex>\
#include<bonesVertex>\
\
#[Vertex_Befor_PositionUpdated]\
\
gl_Position=viewProjection*finalWorld*vec4(positionUpdated,1.0);\
vec4 worldPos=finalWorld*vec4(positionUpdated,1.0);\
vPositionW=vec3(worldPos);\
#ifdef NORMAL\
\
#[Vertex_Befor_NormalUpdated]\
\
vNormalW=normalize(vec3(finalWorld*vec4(normalUpdated,0.0)));\
#endif\
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\
vDirectionW=normalize(vec3(finalWorld*vec4(positionUpdated,0.0)));\
#endif\
\
#ifndef UV1\
vec2 uv=vec2(0.,0.);\
#endif\
#ifndef UV2\
vec2 uv2=vec2(0.,0.);\
#endif\
#ifdef DIFFUSE\
if (vDiffuseInfos.x == 0.)\
{\
vDiffuseUV=vec2(diffuseMatrix*vec4(uv,1.0,0.0));\
}\
else\
{\
vDiffuseUV=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));\
}\
#endif\
#ifdef AMBIENT\
if (vAmbientInfos.x == 0.)\
{\
vAmbientUV=vec2(ambientMatrix*vec4(uv,1.0,0.0));\
}\
else\
{\
vAmbientUV=vec2(ambientMatrix*vec4(uv2,1.0,0.0));\
}\
#endif\
#ifdef OPACITY\
if (vOpacityInfos.x == 0.)\
{\
vOpacityUV=vec2(opacityMatrix*vec4(uv,1.0,0.0));\
}\
else\
{\
vOpacityUV=vec2(opacityMatrix*vec4(uv2,1.0,0.0));\
}\
#endif\
#ifdef EMISSIVE\
if (vEmissiveInfos.x == 0.)\
{\
vEmissiveUV=vec2(emissiveMatrix*vec4(uv,1.0,0.0));\
}\
else\
{\
vEmissiveUV=vec2(emissiveMatrix*vec4(uv2,1.0,0.0));\
}\
#endif\
#ifdef LIGHTMAP\
if (vLightmapInfos.x == 0.)\
{\
vLightmapUV=vec2(lightmapMatrix*vec4(uv,1.0,0.0));\
}\
else\
{\
vLightmapUV=vec2(lightmapMatrix*vec4(uv2,1.0,0.0));\
}\
#endif\
#if defined(SPECULAR) && defined(SPECULARTERM)\
if (vSpecularInfos.x == 0.)\
{\
vSpecularUV=vec2(specularMatrix*vec4(uv,1.0,0.0));\
}\
else\
{\
vSpecularUV=vec2(specularMatrix*vec4(uv2,1.0,0.0));\
}\
#endif\
#ifdef BUMP\
if (vBumpInfos.x == 0.)\
{\
vBumpUV=vec2(bumpMatrix*vec4(uv,1.0,0.0));\
}\
else\
{\
vBumpUV=vec2(bumpMatrix*vec4(uv2,1.0,0.0));\
}\
#endif\
#include<bumpVertex>\
#include<clipPlaneVertex>\
#include<fogVertex>\
#include<shadowsVertex>[0..maxSimultaneousLights]\
#ifdef VERTEXCOLOR\
\
vColor=color;\
#endif\
#include<pointCloudVertex>\
#include<logDepthVertex>\
}";
            return _this;
        }
        return ShaderForVer3_0;
    }(CustomShaderStructure));
    BABYLON.ShaderForVer3_0 = ShaderForVer3_0;
    var StandardShaderVersions = (function () {
        function StandardShaderVersions() {
        }
        return StandardShaderVersions;
    }());
    BABYLON.StandardShaderVersions = StandardShaderVersions;
    var CustomMaterial = (function (_super) {
        __extends(CustomMaterial, _super);
        function CustomMaterial(name, scene) {
            var _this = _super.call(this, name, scene) || this;
            _this.customShaderNameResolve = _this.Builder;
            _this.SelectVersion("3.0.0");
            return _this;
        }
        CustomMaterial.prototype.Builder = function (shaderName) {
            CustomMaterial.ShaderIndexer++;
            var name = shaderName + "custom_" + CustomMaterial.ShaderIndexer;
            BABYLON.Effect.ShadersStore[name + "VertexShader"] = this.ShaderVersion.VertexStore
                .replace('#[Vertex_Begin]', (this.CustomParts.Vertex_Begin ? this.CustomParts.Vertex_Begin : ""))
                .replace('#[Vertex_Definations]', (this.CustomParts.Vertex_Definations ? this.CustomParts.Vertex_Definations : ""))
                .replace('#[Vertex_MainBegin]', (this.CustomParts.Vertex_MainBegin ? this.CustomParts.Vertex_MainBegin : ""))
                .replace('#[Vertex_Befor_PositionUpdated]', (this.CustomParts.Vertex_Befor_PositionUpdated ? this.CustomParts.Vertex_Befor_PositionUpdated : ""))
                .replace('#[Vertex_Befor_NormalUpdated]', (this.CustomParts.Vertex_Befor_NormalUpdated ? this.CustomParts.Vertex_Befor_NormalUpdated : ""));
            BABYLON.Effect.ShadersStore[name + "PixelShader"] = this.ShaderVersion.FragmentStore
                .replace('#[Fragment_Begin]', (this.CustomParts.Fragment_Begin ? this.CustomParts.Fragment_Begin : ""))
                .replace('#[Fragment_Definations]', (this.CustomParts.Fragment_Definations ? this.CustomParts.Fragment_Definations : ""))
                .replace('#[Fragment_Custom_Deffiuse]', (this.CustomParts.Fragment_Custom_Deffiuse ? this.CustomParts.Fragment_Custom_Deffiuse : ""))
                .replace('#[Fragment_Custom_Alpha]', (this.CustomParts.Fragment_Custom_Alpha ? this.CustomParts.Fragment_Custom_Alpha : ""))
                .replace('#[Fragment_Before_FragColor]', (this.CustomParts.Fragment_Before_FragColor ? this.CustomParts.Fragment_Before_FragColor : ""));
            return name;
        };
        CustomMaterial.prototype.SelectVersion = function (ver) {
            switch (ver) {
                case "3.0.0":
                    this.ShaderVersion = new ShaderForVer3_0();
                    break;
            }
        };
        CustomMaterial.prototype.Fragment_Begin = function (shaderPart) {
            this.CustomParts.Fragment_Begin = shaderPart;
            return this;
        };
        CustomMaterial.prototype.Fragment_Definations = function (shaderPart) {
            this.CustomParts.Fragment_Definations = shaderPart;
            return this;
        };
        CustomMaterial.prototype.Fragment_MainBegin = function (shaderPart) {
            this.CustomParts.Fragment_MainBegin = shaderPart;
            return this;
        };
        CustomMaterial.prototype.Fragment_Custom_Deffiuse = function (shaderPart) {
            this.CustomParts.Fragment_Custom_Deffiuse = shaderPart.replace("result", "diffuseColor");
            return this;
        };
        CustomMaterial.prototype.Fragment_Custom_Alpha = function (shaderPart) {
            this.CustomParts.Fragment_Custom_Alpha = shaderPart.replace("result", "alpha");
            return this;
        };
        CustomMaterial.prototype.Fragment_Before_FragColor = function (shaderPart) {
            this.CustomParts.Fragment_Before_FragColor = shaderPart.replace("result", "color");
            return this;
        };
        CustomMaterial.prototype.Vertex_Begin = function (shaderPart) {
            this.CustomParts.Vertex_Begin = shaderPart;
            return this;
        };
        CustomMaterial.prototype.Vertex_Definations = function (shaderPart) {
            this.CustomParts.Vertex_Definations = shaderPart;
            return this;
        };
        CustomMaterial.prototype.Vertex_MainBegin = function (shaderPart) {
            this.CustomParts.Vertex_MainBegin = shaderPart;
            return this;
        };
        CustomMaterial.prototype.Vertex_Befor_PositionUpdated = function (shaderPart) {
            this.CustomParts.Vertex_Befor_PositionUpdated = shaderPart.replace("result", "positionUpdated");
            return this;
        };
        CustomMaterial.prototype.Vertex_Befor_NormalUpdated = function (shaderPart) {
            this.CustomParts.Vertex_Befor_PositionUpdated = shaderPart.replace("result", "normalUpdated");
            return this;
        };
        return CustomMaterial;
    }(BABYLON.StandardMaterial));
    CustomMaterial.ShaderIndexer = 1;
    BABYLON.CustomMaterial = CustomMaterial;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.customMaterial.js.map
