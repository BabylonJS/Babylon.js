// Pre Light Computing
struct preLightingInfo
{
    // Pre Falloff Info
    vec3 lightOffset;
    float lightDistanceSquared;
    float lightDistance;

    // Falloff Info
    float attenuation;

    // Lighting Info
    vec3 L;
    vec3 H;
    float NdotV;
    float NdotLUnclamped;
    float NdotL;
    float VdotH;
    float roughness;

    #ifdef IRIDESCENCE
        float iridescenceIntensity;
    #endif

    #ifdef AREALIGHTUSED
        vec3 areaLightDiffuse;

        #ifdef SPECULARTERM
            vec3 areaLightSpecular;
        #endif
    #endif
};

preLightingInfo computePointAndSpotPreLightingInfo(vec4 lightData, vec3 V, vec3 N, vec3 posW) {
    preLightingInfo result;

    // Attenuation data.
    result.lightOffset = lightData.xyz - posW;
    result.lightDistanceSquared = dot(result.lightOffset, result.lightOffset);

    // Roughness.
    result.lightDistance = sqrt(result.lightDistanceSquared);

    // Geometry Data.
    result.L = normalize(result.lightOffset);
    result.H = normalize(V + result.L);
    result.VdotH = saturate(dot(V, result.H));

    result.NdotLUnclamped = dot(N, result.L);
    result.NdotL = saturateEps(result.NdotLUnclamped);

    return result;
}

preLightingInfo computeDirectionalPreLightingInfo(vec4 lightData, vec3 V, vec3 N) {
    preLightingInfo result;

    // Roughness
    result.lightDistance = length(-lightData.xyz);

    // Geometry Data.
    result.L = normalize(-lightData.xyz);
    result.H = normalize(V + result.L);
    result.VdotH = saturate(dot(V, result.H));

    result.NdotLUnclamped = dot(N, result.L);
    result.NdotL = saturateEps(result.NdotLUnclamped);

    return result;
}

preLightingInfo computeHemisphericPreLightingInfo(vec4 lightData, vec3 V, vec3 N) {
    preLightingInfo result;

    // Geometry Data.
    // Half Lambert for Hemispherix lighting.
    result.NdotL = dot(N, lightData.xyz) * 0.5 + 0.5;
    result.NdotL = saturateEps(result.NdotL);
    result.NdotLUnclamped = result.NdotL;

    #ifdef SPECULARTERM
        result.L = normalize(lightData.xyz);
        result.H = normalize(V + result.L);
        result.VdotH = saturate(dot(V, result.H));
    #endif

    return result;
}

#ifdef AREALIGHTUSED
#include<ltcHelperFunctions>

preLightingInfo computeAreaPreLightingInfo(sampler2D ltc1, sampler2D ltc2, vec3 viewDirectionW, vec3 vNormal, vec3 vPosition, vec4 lightData, vec3 halfWidth, vec3 halfHeight, vec3 specularColor, float roughness ) 
{
	preLightingInfo result;
    result.lightOffset = lightData.xyz - vPosition;
    result.lightDistanceSquared = dot(result.lightOffset, result.lightOffset);
    // Roughness.
    result.lightDistance = sqrt(result.lightDistanceSquared);

	vec3 normal = vNormal;
	vec3 viewDir = viewDirectionW;
	vec3 position = vPosition;
	vec3 lightPos = lightData.xyz;

	vec3 rectCoords[ 4 ];
	rectCoords[ 0 ] = lightPos + halfWidth - halfHeight; // counterclockwise; light shines in local neg z direction
	rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
	rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
	rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;

	vec2 uv = LTCUv( normal, viewDir, roughness );

	vec4 t1 = texture2D( ltc1, uv );
	vec4 t2 = texture2D( ltc2, uv );

	mat3 mInv = mat3(
		vec3( t1.x, 0, t1.y ),
		vec3(    0, 1,    0 ),
		vec3( t1.z, 0, t1.w )
	);

#ifdef SPECULARTERM
	// LTC Fresnel Approximation by Stephen Hill
	// http://blog.selfshadow.com/publications/s2016-advances/s2016_ltc_fresnel.pdf
	vec3 fresnel = ( specularColor * t2.x + ( vec3( 1.0 ) - specularColor ) * t2.y );
	result.areaLightSpecular = specularColor * fresnel * LTCEvaluate( normal, viewDir, position, mInv, rectCoords );
#endif
	result.areaLightDiffuse = LTCEvaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	return result;
}
#endif