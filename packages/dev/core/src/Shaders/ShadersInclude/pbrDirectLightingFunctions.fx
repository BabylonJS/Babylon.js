#define CLEARCOATREFLECTANCE90 1.0

// Light Results
struct lightingInfo
{
    vec3 diffuse;
    #ifdef SPECULARTERM
        vec3 specular;
    #endif
    #ifdef CLEARCOAT
        // xyz contains the clearcoat color.
        // w contains the 1 - clearcoat fresnel to ease the energy conservation computation.
        vec4 clearCoat;
    #endif
    #ifdef SHEEN
        vec3 sheen;
    #endif
};

// Simulate area (small) lights by increasing roughness
float adjustRoughnessFromLightProperties(float roughness, float lightRadius, float lightDistance) {
    #if defined(USEPHYSICALLIGHTFALLOFF) || defined(USEGLTFLIGHTFALLOFF)
        // At small angle this approximation works. 
        float lightRoughness = lightRadius / lightDistance;
        // Distribution can sum.
        float totalRoughness = saturate(lightRoughness + roughness);
        return totalRoughness;
    #else
        return roughness;
    #endif
}

vec3 computeHemisphericDiffuseLighting(preLightingInfo info, vec3 lightColor, vec3 groundColor) {
    return mix(groundColor, lightColor, info.NdotL);
}

vec3 computeDiffuseLighting(preLightingInfo info, vec3 lightColor) {
    float diffuseTerm = diffuseBRDF_Burley(info.NdotL, info.NdotV, info.VdotH, info.roughness);
    return diffuseTerm * info.attenuation * info.NdotL * lightColor;
}

#ifdef AREALIGHTUSED

// Area Light

// Real-Time Polygonal-Light Shading with Linearly Transformed Cosines
// by Eric Heitz, Jonathan Dupuy, Stephen Hill and David Neubelt
// code: https://github.com/selfshadow/ltc_code/

vec2 LTCUv( const in vec3 N, const in vec3 V, const in float roughness ) {

	const float LUTSIZE = 64.0;
	const float LUTSCALE = ( LUTSIZE - 1.0 ) / LUTSIZE;
	const float LUTBIAS = 0.5 / LUTSIZE;

	float dotNV = saturate( dot( N, V ) );

	// texture parameterized by sqrt( GGX alpha ) and sqrt( 1 - cos( theta ) )
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );

	uv = uv * LUTSCALE + LUTBIAS;

	return uv;

}

float LTCClippedSphereFormFactor( const in vec3 f ) {

	// Real-Time Area Lighting: a Journey from Research to Production (p.102)
	// An approximation of the form factor of a horizon-clipped rectangle.
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}

vec3 LTCEdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {

	float x = dot( v1, v2 );

	float y = abs( x );

	// rational polynomial approximation to theta / sin( theta ) / 2PI
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;

	float thetaSintheta = 0.0;

	if( x > 0.0 )
	{
		thetaSintheta = v;
	}
	else
	{
		thetaSintheta = 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	}
	return cross( v1, v2 ) * thetaSintheta;
}

vec3 LTCEvaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {

	// bail if point is on back side of plane of light
	// assumes ccw winding order of light vertices
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );

	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );

	// construct orthonormal basis around N
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 ); // negated from paper; possibly due to a different handedness of world coordinate system

	// compute transform
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );

	// transform rect
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );

	// project rect onto sphere
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );

	// calculate vector form factor
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTCEdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTCEdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTCEdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTCEdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );

	// adjust for horizon clipping
	float result = LTCClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}

vec3 computeAreaLightingDiffuse(sampler2D areaLightsLTC1, sampler2D areaLightsLTC2, vec3 viewDirectionW, vec3 vNormal, vec3 vPosition, vec4 lightData, vec3 halfWidth, vec3 halfHeight, vec3 diffuseColor, vec3 specularColor, float roughness ) 
{
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

	vec4 t1 = texture2D( areaLightsLTC1, uv );
	vec4 t2 = texture2D( areaLightsLTC2, uv );

	mat3 mInv = mat3(
		vec3( t1.x, 0, t1.y ),
		vec3(    0, 1,    0 ),
		vec3( t1.z, 0, t1.w )
	);

	return diffuseColor * LTCEvaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
}

#ifdef SPECULARTERM

vec3 computeAreaLightingSpecular(sampler2D areaLightsLTC1, sampler2D areaLightsLTC2, vec3 viewDirectionW, vec3 vNormal, vec3 vPosition, vec4 lightData, vec3 halfWidth, vec3 halfHeight, vec3 diffuseColor, vec3 specularColor, float roughness ) 
{
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

	vec4 t1 = texture2D( areaLightsLTC1, uv );
	vec4 t2 = texture2D( areaLightsLTC2, uv );

	mat3 mInv = mat3(
		vec3( t1.x, 0, t1.y ),
		vec3(    0, 1,    0 ),
		vec3( t1.z, 0, t1.w )
	);


	// LTC Fresnel Approximation by Stephen Hill
	// http://blog.selfshadow.com/publications/s2016-advances/s2016_ltc_fresnel.pdf
	vec3 fresnel = ( specularColor * t2.x + ( vec3( 1.0 ) - specularColor ) * t2.y );
	return specularColor * fresnel * LTCEvaluate( normal, viewDir, position, mInv, rectCoords );
}
#endif
#endif

#define inline
vec3 computeProjectionTextureDiffuseLighting(sampler2D projectionLightSampler, mat4 textureProjectionMatrix, vec3 posW){
    vec4 strq = textureProjectionMatrix * vec4(posW, 1.0);
    strq /= strq.w;
    vec3 textureColor = texture2D(projectionLightSampler, strq.xy).rgb;
    return toLinearSpace(textureColor);
}

#ifdef SS_TRANSLUCENCY
    vec3 computeDiffuseAndTransmittedLighting(preLightingInfo info, vec3 lightColor, vec3 transmittance) {
        float NdotL = absEps(info.NdotLUnclamped);

        // Use wrap lighting to simulate SSS.
        float wrapNdotL = computeWrappedDiffuseNdotL(NdotL, 0.02);

        // Remap transmittance from tr to 1. if ndotl is negative.
        float trAdapt = step(0., info.NdotLUnclamped);
        vec3 transmittanceNdotL = mix(transmittance * wrapNdotL, vec3(wrapNdotL), trAdapt);

        float diffuseTerm = diffuseBRDF_Burley(NdotL, info.NdotV, info.VdotH, info.roughness);
        return diffuseTerm * transmittanceNdotL * info.attenuation * lightColor;
    }
#endif

#ifdef SPECULARTERM
    vec3 computeSpecularLighting(preLightingInfo info, vec3 N, vec3 reflectance0, vec3 reflectance90, float geometricRoughnessFactor, vec3 lightColor) {
        float NdotH = saturateEps(dot(N, info.H));
        float roughness = max(info.roughness, geometricRoughnessFactor);
        float alphaG = convertRoughnessToAverageSlope(roughness);

        vec3 fresnel = fresnelSchlickGGX(info.VdotH, reflectance0, reflectance90);

        #ifdef IRIDESCENCE
            fresnel = mix(fresnel, reflectance0, info.iridescenceIntensity);
        #endif

        float distribution = normalDistributionFunction_TrowbridgeReitzGGX(NdotH, alphaG);

        #ifdef BRDF_V_HEIGHT_CORRELATED
            float smithVisibility = smithVisibility_GGXCorrelated(info.NdotL, info.NdotV, alphaG);
        #else
            float smithVisibility = smithVisibility_TrowbridgeReitzGGXFast(info.NdotL, info.NdotV, alphaG);
        #endif

        vec3 specTerm = fresnel * distribution * smithVisibility;
        return specTerm * info.attenuation * info.NdotL * lightColor;
    }
#endif

#ifdef ANISOTROPIC
    vec3 computeAnisotropicSpecularLighting(preLightingInfo info, vec3 V, vec3 N, vec3 T, vec3 B, float anisotropy, vec3 reflectance0, vec3 reflectance90, float geometricRoughnessFactor, vec3 lightColor) {
        float NdotH = saturateEps(dot(N, info.H));
        float TdotH = dot(T, info.H);
        float BdotH = dot(B, info.H);
        float TdotV = dot(T, V);
        float BdotV = dot(B, V);
        float TdotL = dot(T, info.L);
        float BdotL = dot(B, info.L);
        float alphaG = convertRoughnessToAverageSlope(info.roughness);
        vec2 alphaTB = getAnisotropicRoughness(alphaG, anisotropy);
        alphaTB = max(alphaTB, square(geometricRoughnessFactor));

        vec3 fresnel = fresnelSchlickGGX(info.VdotH, reflectance0, reflectance90);

        #ifdef IRIDESCENCE
            fresnel = mix(fresnel, reflectance0, info.iridescenceIntensity);
        #endif

        float distribution = normalDistributionFunction_BurleyGGX_Anisotropic(NdotH, TdotH, BdotH, alphaTB);
        float smithVisibility = smithVisibility_GGXCorrelated_Anisotropic(info.NdotL, info.NdotV, TdotV, BdotV, TdotL, BdotL, alphaTB);

        vec3 specTerm = fresnel * distribution * smithVisibility;
        return specTerm * info.attenuation * info.NdotL * lightColor;
    }
#endif

#ifdef CLEARCOAT
    vec4 computeClearCoatLighting(preLightingInfo info, vec3 Ncc, float geometricRoughnessFactor, float clearCoatIntensity, vec3 lightColor) {
        float NccdotL = saturateEps(dot(Ncc, info.L));
        float NccdotH = saturateEps(dot(Ncc, info.H));
        float clearCoatRoughness = max(info.roughness, geometricRoughnessFactor);
        float alphaG = convertRoughnessToAverageSlope(clearCoatRoughness);

        float fresnel = fresnelSchlickGGX(info.VdotH, vClearCoatRefractionParams.x, CLEARCOATREFLECTANCE90);
        fresnel *= clearCoatIntensity;
        float distribution = normalDistributionFunction_TrowbridgeReitzGGX(NccdotH, alphaG);
        float kelemenVisibility = visibility_Kelemen(info.VdotH);

        float clearCoatTerm = fresnel * distribution * kelemenVisibility;

        return vec4(
            clearCoatTerm * info.attenuation * NccdotL * lightColor,
            1.0 - fresnel
        );
    }

    vec3 computeClearCoatLightingAbsorption(float NdotVRefract, vec3 L, vec3 Ncc, vec3 clearCoatColor, float clearCoatThickness, float clearCoatIntensity) {
        vec3 LRefract = -refract(L, Ncc, vClearCoatRefractionParams.y);
        float NdotLRefract = saturateEps(dot(Ncc, LRefract));

        vec3 absorption = computeClearCoatAbsorption(NdotVRefract, NdotLRefract, clearCoatColor, clearCoatThickness, clearCoatIntensity);
        return absorption;
    }
#endif

#ifdef SHEEN
    vec3 computeSheenLighting(preLightingInfo info, vec3 N, vec3 reflectance0, vec3 reflectance90, float geometricRoughnessFactor, vec3 lightColor) {
        float NdotH = saturateEps(dot(N, info.H));
        float roughness = max(info.roughness, geometricRoughnessFactor);
        float alphaG = convertRoughnessToAverageSlope(roughness);

        // No Fresnel Effect with sheen
        // vec3 fresnel = fresnelSchlickGGX(info.VdotH, reflectance0, reflectance90);
        float fresnel = 1.;
        float distribution = normalDistributionFunction_CharlieSheen(NdotH, alphaG);
        /*#ifdef SHEEN_SOFTER
            float visibility = visibility_CharlieSheen(info.NdotL, info.NdotV, alphaG);
        #else */
            float visibility = visibility_Ashikhmin(info.NdotL, info.NdotV);
        /* #endif */

        float sheenTerm = fresnel * distribution * visibility;
        return sheenTerm * info.attenuation * info.NdotL * lightColor;
    }
#endif
