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
    var ShaderSpecialParts = (function () {
        function ShaderSpecialParts() {
        }
        return ShaderSpecialParts;
    }());
    BABYLON.ShaderSpecialParts = ShaderSpecialParts;
    var ShaderForVer3_0 = (function (_super) {
        __extends(ShaderForVer3_0, _super);
        function ShaderForVer3_0() {
            var _this = _super.call(this) || this;
            _this.VertexStore = "";
            _this.FragmentStore = "#include<__decl__defaultFragment>\n\
#[Fragment_Begin]\n\
#extension GL_OES_standard_derivatives : enable\n\
#ifdef LOGARITHMICDEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define RECIPROCAL_PI2 0.15915494\n\
uniform vec3 vEyePosition;\n\
uniform vec3 vAmbientColor;\n\
\n\
varying vec3 vPositionW;\n\
#ifdef NORMAL\n\
varying vec3 vNormalW_helper;\n\
varying vec3 localNormal;\n\
varying vec3 localPosition;\n\
vec3 vNormalW;\n\
#endif\n\
#ifdef VERTEXCOLOR\n\
varying vec4 vColor;\n\
#endif\n\
\n\
#include<helperFunctions>\n\
\n\
#include<__decl__lightFragment>[0..maxSimultaneousLights]\n\
#include<lightsFragmentFunctions>\n\
#include<shadowsFragmentFunctions>\n\
\n\
#ifdef DIFFUSE\n\
varying vec2 vDiffuseUV;\n\
uniform sampler2D diffuseSampler;\n\
#endif\n\
#ifdef AMBIENT\n\
varying vec2 vAmbientUV;\n\
uniform sampler2D ambientSampler;\n\
#endif\n\
#ifdef OPACITY\n\
varying vec2 vOpacityUV;\n\
uniform sampler2D opacitySampler;\n\
#endif\n\
#ifdef EMISSIVE\n\
varying vec2 vEmissiveUV;\n\
uniform sampler2D emissiveSampler;\n\
#endif\n\
#ifdef LIGHTMAP\n\
varying vec2 vLightmapUV;\n\
uniform sampler2D lightmapSampler;\n\
#endif\n\
#ifdef REFRACTION\n\
#ifdef REFRACTIONMAP_3D\n\
uniform samplerCube refractionCubeSampler;\n\
#else\n\
uniform sampler2D refraction2DSampler;\n\
#endif\n\
#endif\n\
#if defined(SPECULAR) && defined(SPECULARTERM)\n\
varying vec2 vSpecularUV;\n\
uniform sampler2D specularSampler;\n\
#endif\n\
\n\
#include<fresnelFunction>\n\
\n\
#ifdef REFLECTION\n\
#ifdef REFLECTIONMAP_3D\n\
uniform samplerCube reflectionCubeSampler;\n\
#else\n\
uniform sampler2D reflection2DSampler;\n\
#endif\n\
#ifdef REFLECTIONMAP_SKYBOX\n\
varying vec3 vPositionUVW;\n\
#else\n\
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\n\
varying vec3 vDirectionW;\n\
#endif\n\
#endif\n\
#include<reflectionFunction>\n\
#endif\n\
#include<imageProcessingDeclaration>\n\
#include<imageProcessingFunctions>\n\
\n\
#include<bumpFragmentFunctions>\n\
#include<clipPlaneFragmentDeclaration>\n\
#include<logDepthDeclaration>\n\
#include<fogFragmentDeclaration>\n\
\n\
#[Fragment_Definitions]\n\
\n\
void main(void) {\n\
\n\
vNormalW = vNormalW_helper;\n\
#[Fragment_MainBegin]\n\
\n\
#include<clipPlaneFragment>\n\
vec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\
\n\
vec4 baseColor=vec4(1.,1.,1.,1.);\n\
vec3 diffuseColor=vDiffuseColor.rgb;\n\
#[Fragment_Custom_Diffuse]\n\
\n\
float alpha=vDiffuseColor.a;\n\
#[Fragment_Custom_Alpha]\n\
\n\
#ifdef NORMAL\n\
vec3 normalW=normalize(vNormalW);\n\
#else\n\
vec3 normalW=vec3(1.0,1.0,1.0);\n\
#endif\n\
#include<bumpFragment>\n\
#ifdef TWOSIDEDLIGHTING\n\
normalW=gl_FrontFacing ? normalW : -normalW;\n\
#endif\n\
#ifdef DIFFUSE\n\
baseColor=texture2D(diffuseSampler,vDiffuseUV+uvOffset);\n\
#ifdef ALPHATEST\n\
if (baseColor.a<0.4)\n\
discard;\n\
#endif\n\
#ifdef ALPHAFROMDIFFUSE\n\
alpha*=baseColor.a;\n\
#endif\n\
baseColor.rgb*=vDiffuseInfos.y;\n\
#endif\n\
#ifdef VERTEXCOLOR\n\
baseColor.rgb*=vColor.rgb;\n\
#endif\n\
\n\
vec3 baseAmbientColor=vec3(1.,1.,1.);\n\
#ifdef AMBIENT\n\
baseAmbientColor=texture2D(ambientSampler,vAmbientUV+uvOffset).rgb*vAmbientInfos.y;\n\
#endif\n\
\n\
#ifdef SPECULARTERM\n\
float glossiness=vSpecularColor.a;\n\
vec3 specularColor=vSpecularColor.rgb;\n\
#ifdef SPECULAR\n\
vec4 specularMapColor=texture2D(specularSampler,vSpecularUV+uvOffset);\n\
specularColor=specularMapColor.rgb;\n\
#ifdef GLOSSINESS\n\
glossiness=glossiness*specularMapColor.a;\n\
#endif\n\
#endif\n\
#else\n\
float glossiness=0.;\n\
#endif\n\
\n\
vec3 diffuseBase=vec3(0.,0.,0.);\n\
lightingInfo info;\n\
#ifdef SPECULARTERM\n\
vec3 specularBase=vec3(0.,0.,0.);\n\
#endif\n\
float shadow=1.;\n\
#ifdef LIGHTMAP\n\
vec3 lightmapColor=texture2D(lightmapSampler,vLightmapUV+uvOffset).rgb*vLightmapInfos.y;\n\
#endif\n\
#include<lightFragment>[0..maxSimultaneousLights]\n\
\n\
vec3 refractionColor=vec3(0.,0.,0.);\n\
#ifdef REFRACTION\n\
vec3 refractionVector=normalize(refract(-viewDirectionW,normalW,vRefractionInfos.y));\n\
#ifdef REFRACTIONMAP_3D\n\
refractionVector.y=refractionVector.y*vRefractionInfos.w;\n\
if (dot(refractionVector,viewDirectionW)<1.0)\n\
{\n\
refractionColor=textureCube(refractionCubeSampler,refractionVector).rgb*vRefractionInfos.x;\n\
}\n\
#else\n\
vec3 vRefractionUVW=vec3(refractionMatrix*(view*vec4(vPositionW+refractionVector*vRefractionInfos.z,1.0)));\n\
vec2 refractionCoords=vRefractionUVW.xy/vRefractionUVW.z;\n\
refractionCoords.y=1.0-refractionCoords.y;\n\
refractionColor=texture2D(refraction2DSampler,refractionCoords).rgb*vRefractionInfos.x;\n\
#endif\n\
#endif\n\
\n\
vec3 reflectionColor=vec3(0.,0.,0.);\n\
#ifdef REFLECTION\n\
vec3 vReflectionUVW=computeReflectionCoords(vec4(vPositionW,1.0),normalW);\n\
#ifdef REFLECTIONMAP_3D\n\
#ifdef ROUGHNESS\n\
float bias=vReflectionInfos.y;\n\
#ifdef SPECULARTERM\n\
#ifdef SPECULAR\n\
#ifdef GLOSSINESS\n\
bias*=(1.0-specularMapColor.a);\n\
#endif\n\
#endif\n\
#endif\n\
reflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW,bias).rgb*vReflectionInfos.x;\n\
#else\n\
reflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW).rgb*vReflectionInfos.x;\n\
#endif\n\
#else\n\
vec2 coords=vReflectionUVW.xy;\n\
#ifdef REFLECTIONMAP_PROJECTION\n\
coords/=vReflectionUVW.z;\n\
#endif\n\
coords.y=1.0-coords.y;\n\
reflectionColor=texture2D(reflection2DSampler,coords).rgb*vReflectionInfos.x;\n\
#endif\n\
#ifdef REFLECTIONFRESNEL\n\
float reflectionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,reflectionRightColor.a,reflectionLeftColor.a);\n\
#ifdef REFLECTIONFRESNELFROMSPECULAR\n\
#ifdef SPECULARTERM\n\
reflectionColor*=specularColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n\
#else\n\
reflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n\
#endif\n\
#else\n\
reflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n\
#endif\n\
#endif\n\
#endif\n\
#ifdef REFRACTIONFRESNEL\n\
float refractionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,refractionRightColor.a,refractionLeftColor.a);\n\
refractionColor*=refractionLeftColor.rgb*(1.0-refractionFresnelTerm)+refractionFresnelTerm*refractionRightColor.rgb;\n\
#endif\n\
#ifdef OPACITY\n\
vec4 opacityMap=texture2D(opacitySampler,vOpacityUV+uvOffset);\n\
#ifdef OPACITYRGB\n\
opacityMap.rgb=opacityMap.rgb*vec3(0.3,0.59,0.11);\n\
alpha*=(opacityMap.x+opacityMap.y+opacityMap.z)* vOpacityInfos.y;\n\
#else\n\
alpha*=opacityMap.a*vOpacityInfos.y;\n\
#endif\n\
#endif\n\
#ifdef VERTEXALPHA\n\
alpha*=vColor.a;\n\
#endif\n\
#ifdef OPACITYFRESNEL\n\
float opacityFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,opacityParts.z,opacityParts.w);\n\
alpha+=opacityParts.x*(1.0-opacityFresnelTerm)+opacityFresnelTerm*opacityParts.y;\n\
#endif\n\
\n\
vec3 emissiveColor=vEmissiveColor;\n\
#ifdef EMISSIVE\n\
emissiveColor+=texture2D(emissiveSampler,vEmissiveUV+uvOffset).rgb*vEmissiveInfos.y;\n\
#endif\n\
#ifdef EMISSIVEFRESNEL\n\
float emissiveFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,emissiveRightColor.a,emissiveLeftColor.a);\n\
emissiveColor*=emissiveLeftColor.rgb*(1.0-emissiveFresnelTerm)+emissiveFresnelTerm*emissiveRightColor.rgb;\n\
#endif\n\
\n\
#ifdef DIFFUSEFRESNEL\n\
float diffuseFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,diffuseRightColor.a,diffuseLeftColor.a);\n\
diffuseBase*=diffuseLeftColor.rgb*(1.0-diffuseFresnelTerm)+diffuseFresnelTerm*diffuseRightColor.rgb;\n\
#endif\n\
\n\
#ifdef EMISSIVEASILLUMINATION\n\
vec3 finalDiffuse=clamp(diffuseBase*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n\
#else\n\
#ifdef LINKEMISSIVEWITHDIFFUSE\n\
vec3 finalDiffuse=clamp((diffuseBase+emissiveColor)*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n\
#else\n\
vec3 finalDiffuse=clamp(diffuseBase*diffuseColor+emissiveColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n\
#endif\n\
#endif\n\
#ifdef SPECULARTERM\n\
vec3 finalSpecular=specularBase*specularColor;\n\
#ifdef SPECULAROVERALPHA\n\
alpha=clamp(alpha+dot(finalSpecular,vec3(0.3,0.59,0.11)),0.,1.);\n\
#endif\n\
#else\n\
vec3 finalSpecular=vec3(0.0);\n\
#endif\n\
#ifdef REFLECTIONOVERALPHA\n\
alpha=clamp(alpha+dot(reflectionColor,vec3(0.3,0.59,0.11)),0.,1.);\n\
#endif\n\
\n\
#ifdef EMISSIVEASILLUMINATION\n\
vec4 color=vec4(clamp(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+emissiveColor+refractionColor,0.0,1.0),alpha);\n\
#else\n\
vec4 color=vec4(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+refractionColor,alpha);\n\
#endif\n\
\n\
#ifdef LIGHTMAP\n\
#ifndef LIGHTMAPEXCLUDED\n\
#ifdef USELIGHTMAPASSHADOWMAP\n\
color.rgb*=lightmapColor;\n\
#else\n\
color.rgb+=lightmapColor;\n\
#endif\n\
#endif\n\
#endif\n\
#include<logDepthFragment>\n\
#include<fogFragment>\n\
\n\
// Apply image processing if relevant. As this applies in linear space, \n\
// We first move from gamma to linear.\n\
#ifdef IMAGEPROCESSINGPOSTPROCESS\n\
	color.rgb = toLinearSpace(color.rgb);\n\
#else\n\
	#ifdef IMAGEPROCESSING\n\
		color.rgb = toLinearSpace(color.rgb);\n\
		color = applyImageProcessing(color);\n\
	#endif\n\
#endif\n\
\n\
#[Fragment_Before_FragColor]\n\
gl_FragColor=color;\n\
}";
            _this.VertexStore = "#include<__decl__defaultVertex>\n\
\n\
#[Vertex_Begin]\n\
\n\
attribute vec3 position;\n\
#ifdef NORMAL\n\
attribute vec3 normal;\n\
#endif\n\
#ifdef TANGENT\n\
attribute vec4 tangent;\n\
#endif\n\
#ifdef UV1\n\
attribute vec2 uv;\n\
#endif\n\
#ifdef UV2\n\
attribute vec2 uv2;\n\
#endif\n\
#ifdef VERTEXCOLOR\n\
attribute vec4 color;\n\
#endif\n\
#include<bonesDeclaration>\n\
\n\
#include<instancesDeclaration>\n\
#ifdef DIFFUSE\n\
varying vec2 vDiffuseUV;\n\
#endif\n\
#ifdef AMBIENT\n\
varying vec2 vAmbientUV;\n\
#endif\n\
#ifdef OPACITY\n\
varying vec2 vOpacityUV;\n\
#endif\n\
#ifdef EMISSIVE\n\
varying vec2 vEmissiveUV;\n\
#endif\n\
#ifdef LIGHTMAP\n\
varying vec2 vLightmapUV;\n\
#endif\n\
#if defined(SPECULAR) && defined(SPECULARTERM)\n\
varying vec2 vSpecularUV;\n\
#endif\n\
#ifdef BUMP\n\
varying vec2 vBumpUV;\n\
#endif\n\
\n\
varying vec3 localPosition;\n\
varying vec3 vPositionW;\n\
#ifdef NORMAL\n\
varying vec3 vNormalW_helper;\n\
varying vec3 localNormal;\n\
#endif\n\
#ifdef VERTEXCOLOR\n\
varying vec4 vColor;\n\
#endif\n\
#include<bumpVertexDeclaration>\n\
#include<clipPlaneVertexDeclaration>\n\
#include<fogVertexDeclaration>\n\
#include<__decl__lightFragment>[0..maxSimultaneousLights]\n\
#include<morphTargetsVertexGlobalDeclaration>\n\
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]\n\
#ifdef REFLECTIONMAP_SKYBOX\n\
varying vec3 vPositionUVW;\n\
#endif\n\
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\n\
varying vec3 vDirectionW;\n\
#endif\n\
#include<logDepthDeclaration>\n\
\n\
#[Vertex_Definitions]\n\
\n\
void main(void) {\n\
    \n\
    #[Vertex_MainBegin]\n\
    \n\
vec3 positionUpdated=position;\n\
#ifdef NORMAL \n\
vec3 normalUpdated=normal;\n\
#endif\n\
#ifdef TANGENT\n\
vec4 tangentUpdated=tangent;\n\
#endif\n\
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]\n\
#ifdef REFLECTIONMAP_SKYBOX\n\
vPositionUVW=positionUpdated;\n\
#endif \n\
#include<instancesVertex>\n\
#include<bonesVertex>\n\
\n\
localPosition = positionUpdated;\n\
#[Vertex_Before_PositionUpdated]\n\
\n\
gl_Position=viewProjection*finalWorld*vec4(positionUpdated,1.0);\n\
vec4 worldPos=finalWorld*vec4(positionUpdated,1.0);\n\
vPositionW=vec3(worldPos);\n\
#ifdef NORMAL\n\
\n\
#[Vertex_Before_NormalUpdated]\n\
\n\
localNormal = normalUpdated;\n\
vNormalW_helper=normalize(vec3(finalWorld*vec4(normalUpdated,0.0)));\n\
#endif\n\
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\n\
vDirectionW=normalize(vec3(finalWorld*vec4(positionUpdated,0.0)));\n\
#endif\n\
\n\
#ifndef UV1\n\
vec2 uv=vec2(0.,0.);\n\
#endif\n\
#ifndef UV2\n\
vec2 uv2=vec2(0.,0.);\n\
#endif\n\
#ifdef DIFFUSE\n\
if (vDiffuseInfos.x == 0.)\n\
{\n\
vDiffuseUV=vec2(diffuseMatrix*vec4(uv,1.0,0.0));\n\
}\n\
else\n\
{\n\
vDiffuseUV=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));\n\
}\n\
#endif\n\
#ifdef AMBIENT\n\
if (vAmbientInfos.x == 0.)\n\
{\n\
vAmbientUV=vec2(ambientMatrix*vec4(uv,1.0,0.0));\n\
}\n\
else\n\
{\n\
vAmbientUV=vec2(ambientMatrix*vec4(uv2,1.0,0.0));\n\
}\n\
#endif\n\
#ifdef OPACITY\n\
if (vOpacityInfos.x == 0.)\n\
{\n\
vOpacityUV=vec2(opacityMatrix*vec4(uv,1.0,0.0));\n\
}\n\
else\n\
{\n\
vOpacityUV=vec2(opacityMatrix*vec4(uv2,1.0,0.0));\n\
}\n\
#endif\n\
#ifdef EMISSIVE\n\
if (vEmissiveInfos.x == 0.)\n\
{\n\
vEmissiveUV=vec2(emissiveMatrix*vec4(uv,1.0,0.0));\n\
}\n\
else\n\
{\n\
vEmissiveUV=vec2(emissiveMatrix*vec4(uv2,1.0,0.0));\n\
}\n\
#endif\n\
#ifdef LIGHTMAP\n\
if (vLightmapInfos.x == 0.)\n\
{\n\
vLightmapUV=vec2(lightmapMatrix*vec4(uv,1.0,0.0));\n\
}\n\
else\n\
{\n\
vLightmapUV=vec2(lightmapMatrix*vec4(uv2,1.0,0.0));\n\
}\n\
#endif\n\
#if defined(SPECULAR) && defined(SPECULARTERM)\n\
if (vSpecularInfos.x == 0.)\n\
{\n\
vSpecularUV=vec2(specularMatrix*vec4(uv,1.0,0.0));\n\
}\n\
else\n\
{\n\
vSpecularUV=vec2(specularMatrix*vec4(uv2,1.0,0.0));\n\
}\n\
#endif\n\
#ifdef BUMP\n\
if (vBumpInfos.x == 0.)\n\
{\n\
vBumpUV=vec2(bumpMatrix*vec4(uv,1.0,0.0));\n\
}\n\
else\n\
{\n\
vBumpUV=vec2(bumpMatrix*vec4(uv2,1.0,0.0));\n\
}\n\
#endif\n\
#include<bumpVertex>\n\
#include<clipPlaneVertex>\n\
#include<fogVertex>\n\
#include<shadowsVertex>[0..maxSimultaneousLights]\n\
#ifdef VERTEXCOLOR\n\
\n\
vColor=color;\n\
#endif\n\
#include<pointCloudVertex>\n\
#include<logDepthVertex>\n\
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
            _this.CustomParts = new ShaderSpecialParts();
            _this.customShaderNameResolve = _this.Builder;
            _this.SelectVersion("3.0.0");
            return _this;
        }
        CustomMaterial.prototype.AttachAfterBind = function (mesh, effect) {
            for (var el in this._newUniformInstances) {
                var ea = el.toString().split('-');
                if (ea[0] == 'vec2')
                    effect.setVector2(ea[1], this._newUniformInstances[el]);
                else if (ea[0] == 'vec3')
                    effect.setVector3(ea[1], this._newUniformInstances[el]);
                else if (ea[0] == 'vec4')
                    effect.setVector4(ea[1], this._newUniformInstances[el]);
                else if (ea[0] == 'mat4')
                    effect.setMatrix(ea[1], this._newUniformInstances[el]);
                else if (ea[0] == 'float')
                    effect.setFloat(ea[1], this._newUniformInstances[el]);
            }
            for (var el in this._newSamplerInstances) {
                var ea = el.toString().split('-');
                if (ea[0] == 'sampler2D' && this._newSamplerInstances[el].isReady && this._newSamplerInstances[el].isReady())
                    effect.setTexture(ea[1], this._newSamplerInstances[el]);
            }
        };
        CustomMaterial.prototype.ReviewUniform = function (name, arr) {
            if (name == "uniform") {
                for (var ind in this._newUniforms)
                    if (this._customUniform[ind].indexOf('sampler') == -1)
                        arr.push(this._newUniforms[ind]);
            }
            if (name == "sampler") {
                for (var ind in this._newUniforms)
                    if (this._customUniform[ind].indexOf('sampler') != -1)
                        arr.push(this._newUniforms[ind]);
            }
            return arr;
        };
        CustomMaterial.prototype.Builder = function (shaderName, uniforms, uniformBuffers, samplers, defines) {
            if (this._isCreatedShader)
                return this._createdShaderName;
            this._isCreatedShader = false;
            CustomMaterial.ShaderIndexer++;
            var name = name + "custom_" + CustomMaterial.ShaderIndexer;
            this.ReviewUniform("uniform", uniforms);
            this.ReviewUniform("sampler", samplers);
            var fn_afterBind = this._afterBind;
            this._afterBind = function (m, e) {
                this.AttachAfterBind(m, e);
                try {
                    fn_afterBind(m, e);
                }
                catch (e) { }
                ;
            };
            BABYLON.Effect.ShadersStore[name + "VertexShader"] = this.ShaderVersion.VertexStore
                .replace('#[Vertex_Begin]', (this.CustomParts.Vertex_Begin ? this.CustomParts.Vertex_Begin : ""))
                .replace('#[Vertex_Definitions]', (this._customUniform ? this._customUniform.join("\n") : "") + (this.CustomParts.Vertex_Definitions ? this.CustomParts.Vertex_Definitions : ""))
                .replace('#[Vertex_MainBegin]', (this.CustomParts.Vertex_MainBegin ? this.CustomParts.Vertex_MainBegin : ""))
                .replace('#[Vertex_Before_PositionUpdated]', (this.CustomParts.Vertex_Before_PositionUpdated ? this.CustomParts.Vertex_Before_PositionUpdated : ""))
                .replace('#[Vertex_Before_NormalUpdated]', (this.CustomParts.Vertex_Before_NormalUpdated ? this.CustomParts.Vertex_Before_NormalUpdated : ""));
            BABYLON.Effect.ShadersStore[name + "PixelShader"] = this.ShaderVersion.FragmentStore
                .replace('#[Fragment_Begin]', (this.CustomParts.Fragment_Begin ? this.CustomParts.Fragment_Begin : ""))
                .replace('#[Fragment_MainBegin]', (this.CustomParts.Fragment_MainBegin ? this.CustomParts.Fragment_MainBegin : ""))
                .replace('#[Fragment_Definitions]', (this._customUniform ? this._customUniform.join("\n") : "") + (this.CustomParts.Fragment_Definitions ? this.CustomParts.Fragment_Definitions : ""))
                .replace('#[Fragment_Custom_Diffuse]', (this.CustomParts.Fragment_Custom_Diffuse ? this.CustomParts.Fragment_Custom_Diffuse : ""))
                .replace('#[Fragment_Custom_Alpha]', (this.CustomParts.Fragment_Custom_Alpha ? this.CustomParts.Fragment_Custom_Alpha : ""))
                .replace('#[Fragment_Before_FragColor]', (this.CustomParts.Fragment_Before_FragColor ? this.CustomParts.Fragment_Before_FragColor : ""));
            this._isCreatedShader = true;
            this._createdShaderName = name;
            return name;
        };
        CustomMaterial.prototype.SelectVersion = function (ver) {
            switch (ver) {
                case "3.0.0":
                    this.ShaderVersion = new ShaderForVer3_0();
                    break;
            }
        };
        CustomMaterial.prototype.AddUniform = function (name, kind, param) {
            if (!this._customUniform) {
                this._customUniform = new Array();
                this._newUniforms = new Array();
                this._newSamplerInstances = new Array();
                this._newUniformInstances = new Array();
            }
            if (param) {
                if (kind.indexOf("sampler") == -1) {
                    this._newUniformInstances[kind + "-" + name] = param;
                }
                else {
                    this._newSamplerInstances[kind + "-" + name] = param;
                }
            }
            this._customUniform.push("uniform " + kind + " " + name + ";");
            this._newUniforms.push(name);
            return this;
        };
        CustomMaterial.prototype.Fragment_Begin = function (shaderPart) {
            this.CustomParts.Fragment_Begin = shaderPart;
            return this;
        };
        CustomMaterial.prototype.Fragment_Definitions = function (shaderPart) {
            this.CustomParts.Fragment_Definitions = shaderPart;
            return this;
        };
        CustomMaterial.prototype.Fragment_MainBegin = function (shaderPart) {
            this.CustomParts.Fragment_MainBegin = shaderPart;
            return this;
        };
        CustomMaterial.prototype.Fragment_Custom_Diffuse = function (shaderPart) {
            this.CustomParts.Fragment_Custom_Diffuse = shaderPart.replace("result", "diffuseColor");
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
        CustomMaterial.prototype.Vertex_Definitions = function (shaderPart) {
            this.CustomParts.Vertex_Definitions = shaderPart;
            return this;
        };
        CustomMaterial.prototype.Vertex_MainBegin = function (shaderPart) {
            this.CustomParts.Vertex_MainBegin = shaderPart;
            return this;
        };
        CustomMaterial.prototype.Vertex_Before_PositionUpdated = function (shaderPart) {
            this.CustomParts.Vertex_Before_PositionUpdated = shaderPart.replace("result", "positionUpdated");
            return this;
        };
        CustomMaterial.prototype.Vertex_Before_NormalUpdated = function (shaderPart) {
            this.CustomParts.Vertex_Before_NormalUpdated = shaderPart.replace("result", "normalUpdated");
            return this;
        };
        return CustomMaterial;
    }(BABYLON.StandardMaterial));
    CustomMaterial.ShaderIndexer = 1;
    BABYLON.CustomMaterial = CustomMaterial;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.customMaterial.js.map
