#define OPENPBR_VERTEX_SHADER

#include<openpbrUboDeclaration>

#define CUSTOM_VERTEX_BEGIN

// Attributes
attribute position: vec3f;
#ifdef NORMAL
attribute normal: vec3f;
#endif
#ifdef TANGENT
attribute tangent: vec4f;
#endif
#ifdef UV1
attribute uv: vec2f;
#endif
#include<uvAttributeDeclaration>[2..7]
#include<mainUVVaryingDeclaration>[1..7]
#ifdef VERTEXCOLOR
attribute color: vec4f;
#endif

#include<helperFunctions>
#include<pbrBRDFFunctions>
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>

#include<instancesDeclaration>
#include<prePassVertexDeclaration>

#include<samplerVertexDeclaration>(_DEFINENAME_,BASE_COLOR,_VARYINGNAME_,Albedo)
#include<samplerVertexDeclaration>(_DEFINENAME_,BASE_WEIGHT,_VARYINGNAME_,BaseWeight)
#include<samplerVertexDeclaration>(_DEFINENAME_,BASE_DIFFUSE_ROUGHNESS,_VARYINGNAME_,BaseDiffuseRoughness)
#include<samplerVertexDeclaration>(_DEFINENAME_,BASE_METALNESS,_VARYINGNAME_,BaseMetalness)
#include<samplerVertexDeclaration>(_DEFINENAME_,SPECULAR_WEIGHT,_VARYINGNAME_,SpecularWeight)
#include<samplerVertexDeclaration>(_DEFINENAME_,SPECULAR_COLOR,_VARYINGNAME_,SpecularColor)
#include<samplerVertexDeclaration>(_DEFINENAME_,SPECULAR_ROUGHNESS,_VARYINGNAME_,SpecularRoughness)
#include<samplerVertexDeclaration>(_DEFINENAME_,COAT_WEIGHT,_VARYINGNAME_,CoatWeight)
#include<samplerVertexDeclaration>(_DEFINENAME_,COAT_COLOR,_VARYINGNAME_,CoatColor)
#include<samplerVertexDeclaration>(_DEFINENAME_,COAT_ROUGHNESS,_VARYINGNAME_,CoatRoughness)
// #include<samplerVertexDeclaration>(_DEFINENAME_,COAT_ROUGHNESS_ANISOTROPY,_VARYINGNAME_,CoatRoughnessAnisotropy
#include<samplerVertexDeclaration>(_DEFINENAME_,COAT_DARKENING,_VARYINGNAME_,CoatDarkening)
#include<samplerVertexDeclaration>(_DEFINENAME_,GEOMETRY_NORMAL,_VARYINGNAME_,GeometryNormal)
#include<samplerVertexDeclaration>(_DEFINENAME_,GEOMETRY_COAT_NORMAL,_VARYINGNAME_,GeometryCoatNormal)
#include<samplerVertexDeclaration>(_DEFINENAME_,GEOMETRY_OPACITY,_VARYINGNAME_,GeometryOpacity)
#include<samplerVertexDeclaration>(_DEFINENAME_,EMISSION_COLOR,_VARYINGNAME_,EmissionColor)

#include<samplerVertexDeclaration>(_DEFINENAME_,AMBIENT_OCCLUSION,_VARYINGNAME_,AmbientOcclusion)
#include<samplerVertexDeclaration>(_DEFINENAME_,DECAL,_VARYINGNAME_,Decal)
#include<samplerVertexDeclaration>(_DEFINENAME_,DETAIL,_VARYINGNAME_,Detail)

// Output
varying vPositionW: vec3f;
#if DEBUGMODE > 0
    varying vClipSpacePosition: vec4f;
#endif
#ifdef NORMAL
    varying vNormalW: vec3f;
    #if defined(USESPHERICALFROMREFLECTIONMAP) && defined(USESPHERICALINVERTEX)
        varying vEnvironmentIrradiance: vec3f;

        #include<harmonicsFunctions>
    #endif
#endif

#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
varying vColor: vec4f;
#endif

#include<openpbrNormalMapVertexDeclaration>
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#include<lightVxUboDeclaration>[0..maxSimultaneousLights]

#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]

#ifdef REFLECTIONMAP_SKYBOX
varying vPositionUVW: vec3f;
#endif

#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
varying vDirectionW: vec3f;
#endif

#include<logDepthDeclaration>
#define CUSTOM_VERTEX_DEFINITIONS

@vertex
fn main(input : VertexInputs) -> FragmentInputs {

	#define CUSTOM_VERTEX_MAIN_BEGIN

    var positionUpdated: vec3f = vertexInputs.position;
#ifdef NORMAL
    var normalUpdated: vec3f = vertexInputs.normal;
#endif
#ifdef TANGENT
    var tangentUpdated: vec4f = vertexInputs.tangent;
#endif
#ifdef UV1
    var uvUpdated: vec2f = vertexInputs.uv;
#endif
#ifdef UV2
    var uv2Updated: vec2f = vertexInputs.uv2;
#endif
#ifdef VERTEXCOLOR
    var colorUpdated: vec4f = vertexInputs.color;
#endif

#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]

#ifdef REFLECTIONMAP_SKYBOX
    vertexOutputs.vPositionUVW = positionUpdated;
#endif

#define CUSTOM_VERTEX_UPDATE_POSITION

#define CUSTOM_VERTEX_UPDATE_NORMAL

#include<instancesVertex>

#if defined(PREPASS) && ((defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)) && !defined(BONES_VELOCITY_ENABLED)
    // Compute velocity before bones computation
    vertexOutputs.vCurrentPosition = scene.viewProjection * finalWorld * vec4f(positionUpdated, 1.0);
    vertexOutputs.vPreviousPosition = uniforms.previousViewProjection * finalPreviousWorld * vec4f(positionUpdated, 1.0);
#endif

#include<bonesVertex>
#include<bakedVertexAnimation>

    var worldPos: vec4f = finalWorld *  vec4f(positionUpdated, 1.0);
    vertexOutputs.vPositionW =  worldPos.xyz;

#ifdef PREPASS
    #include<prePassVertex>
#endif

#ifdef NORMAL
    var normalWorld: mat3x3f =  mat3x3f(finalWorld[0].xyz, finalWorld[1].xyz, finalWorld[2].xyz);

    #if defined(INSTANCES) && defined(THIN_INSTANCES)
        vertexOutputs.vNormalW = normalUpdated /  vec3f(dot(normalWorld[0], normalWorld[0]), dot(normalWorld[1], normalWorld[1]), dot(normalWorld[2], normalWorld[2]));
        vertexOutputs.vNormalW = normalize(normalWorld * vertexOutputs.vNormalW);
    #else
        #ifdef NONUNIFORMSCALING
            normalWorld = transposeMat3(inverseMat3(normalWorld));
        #endif

        vertexOutputs.vNormalW = normalize(normalWorld * normalUpdated);
    #endif

    #if defined(USESPHERICALFROMREFLECTIONMAP) && defined(USESPHERICALINVERTEX)
        #if BASE_DIFFUSE_MODEL != BRDF_DIFFUSE_MODEL_LAMBERT && BASE_DIFFUSE_MODEL != BRDF_DIFFUSE_MODEL_LEGACY
            // Bend the normal towards the viewer based on the diffuse roughness
            var viewDirectionW: vec3f = normalize(scene.vEyePosition.xyz - vertexOutputs.vPositionW);
            var NdotV: f32 = max(dot(vertexOutputs.vNormalW, viewDirectionW), 0.0);
            var roughNormal: vec3f = mix(vertexOutputs.vNormalW, viewDirectionW, (0.5 * (1.0 - NdotV)) * uniforms.vBaseDiffuseRoughness);
            var reflectionVector: vec3f =  (uniforms.reflectionMatrix *  vec4f(roughNormal, 0)).xyz;
        #else
            var reflectionVector: vec3f =  (uniforms.reflectionMatrix *  vec4f(vertexOutputs.vNormalW, 0)).xyz;
        #endif
        #ifdef REFLECTIONMAP_OPPOSITEZ
            reflectionVector.z *= -1.0;
        #endif
        
        vertexOutputs.vEnvironmentIrradiance = computeEnvironmentIrradiance(reflectionVector);
    #endif
#endif

#define CUSTOM_VERTEX_UPDATE_WORLDPOS

#ifdef MULTIVIEW
	if (gl_ViewID_OVR == 0u) {
		vertexOutputs.position = scene.viewProjection * worldPos;
	} else {
		vertexOutputs.position = scene.viewProjectionR * worldPos;
	}
#else
	vertexOutputs.position = scene.viewProjection * worldPos;
#endif

#if DEBUGMODE > 0
    vertexOutputs.vClipSpacePosition = vertexOutputs.position;
#endif

#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
    vertexOutputs.vDirectionW = normalize((finalWorld * vec4f(positionUpdated, 0.0)).xyz);
#endif

    // Texture coordinates
#ifndef UV1
    var uvUpdated: vec2f =  vec2f(0., 0.);
#endif
#ifdef MAINUV1
    vertexOutputs.vMainUV1 = uvUpdated;
#endif
#ifndef UV2
    var uv2Updated: vec2f =  vec2f(0., 0.);
#endif
#ifdef MAINUV2
    vertexOutputs.vMainUV2 = uv2Updated;
#endif

    #include<uvVariableDeclaration>[3..7]

    #include<samplerVertexImplementation>(_DEFINENAME_,BASE_COLOR,_VARYINGNAME_,BaseColor,_MATRIXNAME_,baseColor,_INFONAME_,BaseColorInfos.x)
    #include<samplerVertexImplementation>(_DEFINENAME_,BASE_WEIGHT,_VARYINGNAME_,BaseWeight,_MATRIXNAME_,baseWeight,_INFONAME_,BaseWeightInfos.x)
    #include<samplerVertexImplementation>(_DEFINENAME_,BASE_DIFFUSE_ROUGHNESS,_VARYINGNAME_,BaseDiffuseRoughness,_MATRIXNAME_,baseDiffuseRoughness,_INFONAME_,BaseDiffuseRoughnessInfos.x)
    #include<samplerVertexImplementation>(_DEFINENAME_,BASE_METALNESS,_VARYINGNAME_,BaseMetalness,_MATRIXNAME_,baseMetalness,_INFONAME_,BaseMetalnessInfos.x)
    #include<samplerVertexImplementation>(_DEFINENAME_,SPECULAR_WEIGHT,_VARYINGNAME_,SpecularWeight,_MATRIXNAME_,specularWeight,_INFONAME_,SpecularWeightInfos.x)
    #include<samplerVertexImplementation>(_DEFINENAME_,SPECULAR_COLOR,_VARYINGNAME_,SpecularColor,_MATRIXNAME_,specularColor,_INFONAME_,SpecularColorInfos.x)
    #include<samplerVertexImplementation>(_DEFINENAME_,SPECULAR_ROUGHNESS,_VARYINGNAME_,SpecularRoughness,_MATRIXNAME_,specularRoughness,_INFONAME_,SpecularRoughnessInfos.x)
    #include<samplerVertexImplementation>(_DEFINENAME_,COAT_WEIGHT,_VARYINGNAME_,CoatWeight,_MATRIXNAME_,coatWeight,_INFONAME_,CoatWeightInfos.x)
    #include<samplerVertexImplementation>(_DEFINENAME_,COAT_COLOR,_VARYNAME_,CoatColor,_MATRIXNAME_,coatColor,_INFONAME_,CoatColorInfos.x)
    #include<samplerVertexImplementation>(_DEFINENAME_,COAT_ROUGHNESS,_VARYINGNAME_,CoatRoughness,_MATRIXNAME_,coatRoughness,_INFONAME_,CoatRoughnessInfos.x)
    // #include<samplerVertexImplementation>(_DEFINENAME_,COAT_ROUGHNESS_ANISOTROPY,_VARYINGNAME_,CoatRoughnessAnisotropy,_MATRIXNAME_,coatRoughnessAnisotropy,_INFONAME_,CoatRoughnessAnisotropyInfos.x)
    #include<samplerVertexImplementation>(_DEFINENAME_,COAT_DARKENING,_VARYINGNAME_,CoatDarkening,_MATRIXNAME_,coatDarkening,_INFONAME_,CoatDarkeningInfos.x)
    #include<samplerVertexImplementation>(_DEFINENAME_,GEOMETRY_NORMAL,_VARYINGNAME_,GeometryNormal,_MATRIXNAME_,geometryNormal,_INFONAME_,GeometryNormalInfos.x)
    #include<samplerVertexImplementation>(_DEFINENAME_,GEOMETRY_COAT_NORMAL,_VARYINGNAME_,GeometryCoatNormal,_MATRIXNAME_,geometryCoatNormal,_INFONAME_,GeometryCoatNormalInfos.x)
    #include<samplerVertexImplementation>(_DEFINENAME_,GEOMETRY_OPACITY,_VARYINGNAME_,GeometryOpacity,_MATRIXNAME_,geometryOpacity,_INFONAME_,GeometryOpacityInfos.x)
    #include<samplerVertexImplementation>(_DEFINENAME_,EMISSION_COLOR,_VARYINGNAME_,EmissionColor,_MATRIXNAME_,emissionColor,_INFONAME_,EmissionColorInfos.x)

    #include<samplerVertexImplementation>(_DEFINENAME_,AMBIENT_OCCLUSION,_VARYINGNAME_,AmbientOcclusion,_MATRIXNAME_,ambientOcclusion,_INFONAME_,AmbientOcclusionInfos.x)
    #include<samplerVertexImplementation>(_DEFINENAME_,DECAL,_VARYINGNAME_,Decal,_MATRIXNAME_,decal,_INFONAME_,DecalInfos.x)
    #include<samplerVertexImplementation>(_DEFINENAME_,DETAIL,_VARYINGNAME_,Detail,_MATRIXNAME_,detail,_INFONAME_,DetailInfos.x)

    // TBN
#include<openpbrNormalMapVertex>

    // Clip plane
#include<clipPlaneVertex>

    // Fog
#include<fogVertex>

    // Shadows
#include<shadowsVertex>[0..maxSimultaneousLights]

    // Vertex color
#include<vertexColorMixing>

    // Log. depth
#include<logDepthVertex>

#define CUSTOM_VERTEX_MAIN_END

}