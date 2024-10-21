// Light Computing
struct lightingInfo
{
	vec3 diffuse;
#ifdef SPECULARTERM
	vec3 specular;
#endif
#ifdef NDOTL
	float ndl;
#endif
};

// Area Light

// Real-Time Polygonal-Light Shading with Linearly Transformed Cosines
// by Eric Heitz, Jonathan Dupuy, Stephen Hill and David Neubelt
// code: https://github.com/selfshadow/ltc_code/

vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {

	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;

	float dotNV = saturate( dot( N, V ) );

	// texture parameterized by sqrt( GGX alpha ) and sqrt( 1 - cos( theta ) )
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );

	uv = uv * LUT_SCALE + LUT_BIAS;

	return uv;

}

float LTC_ClippedSphereFormFactor( const in vec3 f ) {

	// Real-Time Area Lighting: a Journey from Research to Production (p.102)
	// An approximation of the form factor of a horizon-clipped rectangle.

	float l = length( f );

	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );

}

vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {

	float x = dot( v1, v2 );

	float y = abs( x );

	// rational polynomial approximation to theta / sin( theta ) / 2PI
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;

	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;

	return cross( v1, v2 ) * theta_sintheta;

}

vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {

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
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );

	// adjust for horizon clipping
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );

/*
	// alternate method of adjusting for horizon clipping (see referece)
	// refactoring required
	float len = length( vectorFormFactor );
	float z = vectorFormFactor.z / len;

	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;

	// tabulated horizon-clipped sphere, apparently...
	vec2 uv = vec2( z * 0.5 + 0.5, len );
	uv = uv * LUT_SCALE + LUT_BIAS;

	float scale = texture2D( ltc_2, uv ).w;

	float result = len * scale;
*/

	return vec3( result );

}

// End Area Light

vec3 IntegrateEdge(vec3 v1, vec3 v2, vec3 N) {
    float x = dot(v1, v2);
    float y = abs(x);
    float a = 0.8543985 + (0.4965155 + 0.0145206*y)*y;
    float b = 3.4175940 + (4.1616724 + y)*y;
    float v = a / b;
    float theta sintheta = (x > 0.0) ? v : 0.5*inversesqrt(max(1.0 - x*x, 1e-7)) - v;
    return dot(cross(v1, v2)*theta sintheta, N);
}

lightingInfo computeLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec3 diffuseColor, vec3 specularColor, float range, float glossiness) {
	lightingInfo result;

	vec3 lightVectorW;
	float attenuation = 1.0;
	if (lightData.w == 0.)
	{
		vec3 direction = lightData.xyz - vPositionW;

		attenuation = max(0., 1.0 - length(direction) / range);
		lightVectorW = normalize(direction);
	}
	else
	{
		lightVectorW = normalize(-lightData.xyz);
	}

	// diffuse
	float ndl = max(0., dot(vNormal, lightVectorW));
#ifdef NDOTL
	result.ndl = ndl;
#endif
	result.diffuse = ndl * diffuseColor * attenuation;
#ifdef SPECULARTERM
	// Specular
	vec3 angleW = normalize(viewDirectionW + lightVectorW);
	float specComp = max(0., dot(vNormal, angleW));
	specComp = pow(specComp, max(1., glossiness));

	result.specular = specComp * specularColor * attenuation;
#endif
	return result;
}

lightingInfo computeSpotLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec4 lightDirection, vec3 diffuseColor, vec3 specularColor, float range, float glossiness) {
	lightingInfo result;

	vec3 direction = lightData.xyz - vPositionW;
	vec3 lightVectorW = normalize(direction);
	float attenuation = max(0., 1.0 - length(direction) / range);

	// diffuse
	float cosAngle = max(0., dot(lightDirection.xyz, -lightVectorW));

	if (cosAngle >= lightDirection.w)
	{
		cosAngle = max(0., pow(cosAngle, lightData.w));
		attenuation *= cosAngle;

		// Diffuse
		float ndl = max(0., dot(vNormal, lightVectorW));
#ifdef NDOTL
		result.ndl = ndl;
#endif
		result.diffuse = ndl * diffuseColor * attenuation;
#ifdef SPECULARTERM
		// Specular
		vec3 angleW = normalize(viewDirectionW + lightVectorW);
		float specComp = max(0., dot(vNormal, angleW));
		specComp = pow(specComp, max(1., glossiness));

		result.specular = specComp * specularColor * attenuation;
#endif
		return result;
	}

	result.diffuse = vec3(0.);
#ifdef SPECULARTERM
	result.specular = vec3(0.);
#endif
#ifdef NDOTL
	result.ndl = 0.;
#endif

	return result;
}

lightingInfo computeHemisphericLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec3 diffuseColor, vec3 specularColor, vec3 groundColor, float glossiness) {
	lightingInfo result;

	// Diffuse
	float ndl = dot(vNormal, lightData.xyz) * 0.5 + 0.5;
#ifdef NDOTL
	result.ndl = ndl;
#endif

	result.diffuse = mix(groundColor, diffuseColor, ndl);

#ifdef SPECULARTERM
	// Specular
	vec3 angleW = normalize(viewDirectionW + lightData.xyz);
	float specComp = max(0., dot(vNormal, angleW));
	specComp = pow(specComp, max(1., glossiness));

	result.specular = specComp * specularColor;
#endif
		return result;
}

#define inline
vec3 computeProjectionTextureDiffuseLighting(sampler2D projectionLightSampler, mat4 textureProjectionMatrix, vec3 posW){
	vec4 strq = textureProjectionMatrix * vec4(posW, 1.0);
	strq /= strq.w;
	vec3 textureColor = texture2D(projectionLightSampler, strq.xy).rgb;
	return textureColor;
}

lightingInfo computeAreaLighting( vec3 viewDirectionW, vec3 vNormal, vec3 vPosition, mat4 lightData, vec3 diffuseColor, vec3 specularColor, float range, float glossiness ) 
{
	lightingInfo result;
	vec3 normal = vNormal;
	vec3 viewDir = viewDirectionW;
	vec3 position = vPosition;
	float roughness = 1 - glossiness;

	vec3 rectCoords[ 4 ];
	rectCoords[ 0 ] = lightData[0].xyz;
	rectCoords[ 1 ] = lightData[1].xyz;
	rectCoords[ 2 ] = lightData[2].xyz;
	rectCoords[ 3 ] = lightData[3].xyz;

	vec2 uv = LTC_Uv( normal, viewDir, roughness );

	vec4 t1 = texture2D( ltc_1, uv );
	vec4 t2 = texture2D( ltc_2, uv );

	mat3 mInv = mat3(
		vec3( t1.x, 0, t1.y ),
		vec3(    0, 1,    0 ),
		vec3( t1.z, 0, t1.w )
	);

#ifdef SPECULARTERM
		// LTC Fresnel Approximation by Stephen Hill
	// http://blog.selfshadow.com/publications/s2016-advances/s2016_ltc_fresnel.pdf
	vec3 fresnel = ( specularColor * t2.x + ( vec3( 1.0 ) - specularColor ) * t2.y );
	result.specular += specularColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
#endif
	result.diffuse += diffuseColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
}