// Pre Light Computing
struct preLightingInfo
{
    // Pre Falloff Info
    lightOffset: vec3f,
    lightDistanceSquared: f32,
    lightDistance: f32,

    // Falloff Info
    attenuation: f32,

    // Lighting Info
    L: vec3f,
    H: vec3f,
    NdotV: f32,
    NdotLUnclamped: f32,
    NdotL: f32,
    VdotH: f32,
    roughness: f32,

    #ifdef IRIDESCENCE
        iridescenceIntensity: f32
    #endif

    #ifdef AREALIGHTUSED
    areaLightDiffuse: vec3f,
        #ifdef SPECULARTERM
            areaLightSpecular: vec3f
        #endif
    #endif
};

fn computePointAndSpotPreLightingInfo(lightData: vec4f, V: vec3f, N: vec3f, posW: vec3f) -> preLightingInfo {
    var result: preLightingInfo;

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

fn computeDirectionalPreLightingInfo(lightData: vec4f, V: vec3f, N: vec3f) -> preLightingInfo {
    var result: preLightingInfo;

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

fn computeHemisphericPreLightingInfo(lightData: vec4f, V: vec3f, N: vec3f) -> preLightingInfo {
    var result: preLightingInfo;

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

fn computeAreaPreLightingInfo(ltc1: texture_2d<f32>, ltc1Sampler:sampler, ltc2:texture_2d<f32>, ltc2Sampler:sampler, viewDirectionW: vec3f, vNormal:vec3f, vPosition:vec3f, lightData:vec4f, halfWidth:vec3f,  halfHeight:vec3f, specularColor:vec3f, roughness:f32) -> preLightingInfo {
    var result: preLightingInfo;
	var lightPos:vec3f = lightData.xyz;

	var rectCoords0:vec3f = lightPos + halfWidth - halfHeight; // counterclockwise; light shines in local neg z direction
	var rectCoords1:vec3f = lightPos - halfWidth - halfHeight;
	var rectCoords2:vec3f = lightPos - halfWidth + halfHeight;
	var rectCoords3:vec3f = lightPos + halfWidth + halfHeight;

	var uv:vec2f = LTCUv( vNormal, viewDirectionW, roughness );

	var t1:vec4f = textureSample( ltc1, ltc1Sampler, uv );
	var t2:vec4f = textureSample( ltc2, ltc2Sampler, uv );

	var mInv:mat3x3<f32> = mat3x3<f32>(
		vec3f( t1.x, 0, t1.y ),
		vec3f(    0, 1,    0 ),
		vec3f( t1.z, 0, t1.w )
	);

#ifdef SPECULARTERM
	// LTC Fresnel Approximation by Stephen Hill
	// http://blog.selfshadow.com/publications/s2016-advances/s2016_ltc_fresnel.pdf
	var fresnel:vec3f = ( specularColor * t2.x + ( vec3f( 1.0 ) - specularColor ) * t2.y );
	result.areaLightSpecular += specularColor * fresnel * LTCEvaluate( vNormal, viewDirectionW, vPosition, mInv, rectCoords0, rectCoords1, rectCoords2, rectCoords3 );
#endif
	var mInvEmpty:mat3x3<f32> = mat3x3<f32>(
		vec3f( 1, 0, 0 ),
		vec3f( 0, 1, 0 ),
		vec3f( 0, 0, 1 )
	);

	result.areaLightDiffuse += LTCEvaluate( vNormal, viewDirectionW, vPosition, mInvEmpty, rectCoords0, rectCoords1, rectCoords2, rectCoords3 );
    return result;
}

#endif