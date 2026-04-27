precision highp float;

#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>

#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]

#include<instancesDeclaration>
#include<__decl__geometryVertex>

#include<clipPlaneVertexDeclaration>

// IBL includes for irradiance calculation in vertex shader
#ifdef IRRADIANCE
    #ifdef REFLECTION
        uniform mat4 reflectionMatrix;
        uniform vec2 vReflectionInfos;
        uniform vec3 vReflectionColor;
        
        #ifdef USESPHERICALFROMREFLECTIONMAP
            varying vec3 vEnvironmentIrradiance;
			#ifdef SPHERICAL_HARMONICS
                uniform vec3 vSphericalL00;
                uniform vec3 vSphericalL1_1;
                uniform vec3 vSphericalL10;
                uniform vec3 vSphericalL11;
                uniform vec3 vSphericalL2_2;
                uniform vec3 vSphericalL2_1;
                uniform vec3 vSphericalL20;
                uniform vec3 vSphericalL21;
                uniform vec3 vSphericalL22;
            #else
                uniform vec3 vSphericalX;
                uniform vec3 vSphericalY;
                uniform vec3 vSphericalZ;
                uniform vec3 vSphericalXX_ZZ;
                uniform vec3 vSphericalYY_ZZ;
                uniform vec3 vSphericalZZ;
                uniform vec3 vSphericalXY;
                uniform vec3 vSphericalYZ;
                uniform vec3 vSphericalZX;
            #endif
			#include<harmonicsFunctions>
        #endif
    #endif
#endif

attribute vec3 position;
#ifdef HAS_NORMAL_ATTRIBUTE
	attribute vec3 normal;
#endif

#ifdef NEED_UV
	varying vec2 vUV;

	#ifdef ALPHATEST
	uniform mat4 diffuseMatrix;
	#endif
	#ifdef BUMP
	uniform mat4 bumpMatrix;
	varying vec2 vBumpUV;
	#endif
	#ifdef REFLECTIVITY
	uniform mat4 reflectivityMatrix;
	uniform mat4 albedoMatrix;
	varying vec2 vReflectivityUV;
	varying vec2 vAlbedoUV;
	#endif
	#ifdef METALLIC_TEXTURE
	varying vec2 vMetallicUV;
	uniform mat4 metallicMatrix;
	#endif
	#ifdef ROUGHNESS_TEXTURE
	varying vec2 vRoughnessUV;
	uniform mat4 roughnessMatrix;
	#endif
	#ifdef SUBSURFACE_WEIGHT
	varying vec2 vSubsurfaceWeightUV;
	uniform mat4 subsurfaceWeightMatrix;
	#endif
	#ifdef TRANSMISSION_WEIGHT
	varying vec2 vTransmissionWeightUV;
	uniform mat4 transmissionWeightMatrix;
	#endif

	#ifdef UV1
	attribute vec2 uv;
	#endif

	#ifdef UV2
	attribute vec2 uv2;
	#endif
#endif

#ifdef BUMP
varying mat4 vWorldView;
#endif

#ifdef BUMP
varying vec3 vNormalW;
#else
varying vec3 vNormalV;
#endif

varying vec4 vViewPos;

#if defined(POSITION) || defined(BUMP) || defined(IRRADIANCE)
varying vec3 vPositionW;
#endif

#if defined(VELOCITY) || defined(VELOCITY_LINEAR)
uniform mat4 previousViewProjection;

varying vec4 vCurrentPosition;
varying vec4 vPreviousPosition;
#endif


#define CUSTOM_VERTEX_DEFINITIONS

void main(void)
{
    vec3 positionUpdated = position;
#ifdef HAS_NORMAL_ATTRIBUTE
    vec3 normalUpdated = normal;
#else
    vec3 normalUpdated = vec3(0.0, 0.0, 0.0);
#endif
#ifdef UV1
    vec2 uvUpdated = uv;
#endif
#ifdef UV2
    vec2 uv2Updated = uv2;
#endif

#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]

#include<instancesVertex>

	#if (defined(VELOCITY) || defined(VELOCITY_LINEAR)) && !defined(BONES_VELOCITY_ENABLED)
	// Compute velocity before bones computation
	vCurrentPosition = viewProjection * finalWorld * vec4(positionUpdated, 1.0);
	vPreviousPosition = previousViewProjection * finalPreviousWorld * vec4(positionUpdated, 1.0);
	#endif

#include<bonesVertex>
#include<bakedVertexAnimation>
	vec4 worldPos = vec4(finalWorld * vec4(positionUpdated, 1.0));

	#ifdef BUMP
		vWorldView = view * finalWorld;
		mat3 normalWorld = mat3(finalWorld);
		vNormalW = normalize(normalWorld * normalUpdated);
	#else
        #ifdef NORMAL_WORLDSPACE
			vNormalV = normalize(vec3(finalWorld * vec4(normalUpdated, 0.0)));
		#else
			vNormalV = normalize(vec3((view * finalWorld) * vec4(normalUpdated, 0.0)));
		#endif
	#endif

	vViewPos = view * worldPos;

	#if (defined(VELOCITY) || defined(VELOCITY_LINEAR)) && defined(BONES_VELOCITY_ENABLED)
		vCurrentPosition = viewProjection * finalWorld * vec4(positionUpdated, 1.0);

		#if NUM_BONE_INFLUENCERS > 0
			mat4 previousInfluence;
			previousInfluence = mPreviousBones[int(matricesIndices[0])] * matricesWeights[0];
			#if NUM_BONE_INFLUENCERS > 1
				previousInfluence += mPreviousBones[int(matricesIndices[1])] * matricesWeights[1];
			#endif
			#if NUM_BONE_INFLUENCERS > 2
				previousInfluence += mPreviousBones[int(matricesIndices[2])] * matricesWeights[2];
			#endif
			#if NUM_BONE_INFLUENCERS > 3
				previousInfluence += mPreviousBones[int(matricesIndices[3])] * matricesWeights[3];
			#endif

			#if NUM_BONE_INFLUENCERS > 4
				previousInfluence += mPreviousBones[int(matricesIndicesExtra[0])] * matricesWeightsExtra[0];
			#endif
			#if NUM_BONE_INFLUENCERS > 5
				previousInfluence += mPreviousBones[int(matricesIndicesExtra[1])] * matricesWeightsExtra[1];
			#endif
			#if NUM_BONE_INFLUENCERS > 6
				previousInfluence += mPreviousBones[int(matricesIndicesExtra[2])] * matricesWeightsExtra[2];
			#endif
			#if NUM_BONE_INFLUENCERS > 7
				previousInfluence += mPreviousBones[int(matricesIndicesExtra[3])] * matricesWeightsExtra[3];
			#endif

			vPreviousPosition = previousViewProjection * finalPreviousWorld * previousInfluence * vec4(positionUpdated, 1.0);
		#else
			vPreviousPosition = previousViewProjection * finalPreviousWorld * vec4(positionUpdated, 1.0);
		#endif
	#endif

	#if defined(POSITION) || defined(BUMP) || defined(IRRADIANCE)
	vPositionW = worldPos.xyz / worldPos.w;
	#endif

	gl_Position = viewProjection * finalWorld * vec4(positionUpdated, 1.0);

	#include<clipPlaneVertex>

	#ifdef NEED_UV
		#ifdef UV1
			#if defined(ALPHATEST) && defined(ALPHATEST_UV1)
			vUV = vec2(diffuseMatrix * vec4(uvUpdated, 1.0, 0.0));
			#else
			vUV = uvUpdated;
			#endif

			#ifdef BUMP_UV1
			vBumpUV = vec2(bumpMatrix * vec4(uvUpdated, 1.0, 0.0));
			#endif
			#ifdef REFLECTIVITY_UV1
			vReflectivityUV = vec2(reflectivityMatrix * vec4(uvUpdated, 1.0, 0.0));
			#else
				#ifdef METALLIC_UV1
					vMetallicUV = vec2(metallicMatrix * vec4(uvUpdated, 1.0, 0.0));
				#endif
				#ifdef ROUGHNESS_UV1
					vRoughnessUV = vec2(roughnessMatrix * vec4(uvUpdated, 1.0, 0.0));
				#endif
			#endif
			#ifdef ALBEDO_UV1
			vAlbedoUV = vec2(albedoMatrix * vec4(uvUpdated, 1.0, 0.0));
			#endif
			#ifdef SUBSURFACE_COLOR_UV1
			vSubsurfaceColorUV = vec2(subsurfaceColorMatrix * vec4(uvUpdated, 1.0, 0.0));
			#endif
			#ifdef SUBSURFACE_WEIGHT_UV1
			vSubsurfaceWeightUV = vec2(subsurfaceWeightMatrix * vec4(uvUpdated, 1.0, 0.0));
			#endif
		#endif
		#ifdef UV2
			#if defined(ALPHATEST) && defined(ALPHATEST_UV2)
			vUV = vec2(diffuseMatrix * vec4(uv2Updated, 1.0, 0.0));
			#else
			vUV = uv2Updated;
			#endif

			#ifdef BUMP_UV2
			vBumpUV = vec2(bumpMatrix * vec4(uv2Updated, 1.0, 0.0));
			#endif
			#ifdef REFLECTIVITY_UV2
			vReflectivityUV = vec2(reflectivityMatrix * vec4(uv2Updated, 1.0, 0.0));
			#else
				#ifdef METALLIC_UV2
					vMetallicUV = vec2(metallicMatrix * vec4(uv2Updated, 1.0, 0.0));
				#endif
				#ifdef ROUGHNESS_UV2
					vRoughnessUV = vec2(roughnessMatrix * vec4(uv2Updated, 1.0, 0.0));
				#endif
			#endif
			#ifdef ALBEDO_UV2
			vAlbedoUV = vec2(albedoMatrix * vec4(uv2Updated, 1.0, 0.0));
			#endif
			#ifdef SUBSURFACE_COLOR_UV2
			vSubsurfaceColorUV = vec2(subsurfaceColorMatrix * vec4(uv2Updated, 1.0, 0.0));
			#endif
			#ifdef SUBSURFACE_WEIGHT_UV2
			vSubsurfaceWeightUV = vec2(subsurfaceWeightMatrix * vec4(uv2Updated, 1.0, 0.0));
			#endif
		#endif
	#endif

	#include<bumpVertex>

	// Calculate environment irradiance in vertex shader for spherical harmonics
	#ifdef IRRADIANCE
		#ifdef REFLECTION
			#ifdef USESPHERICALFROMREFLECTIONMAP
				// Transform normal to reflection space and compute SH irradiance
				vec3 reflectionVector = vec3(reflectionMatrix * vec4(normalUpdated, 0.0)).xyz;
				#ifdef REFLECTIONMAP_OPPOSITEZ
					reflectionVector.z *= -1.0;
				#endif
				vEnvironmentIrradiance = computeEnvironmentIrradiance(reflectionVector) * vReflectionInfos.x;
			#endif
		#endif
	#endif
}
