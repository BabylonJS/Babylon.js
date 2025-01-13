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

float getAttenuation(float cosAngle, float exponent) {
	return max(0., pow(cosAngle, exponent));
}

float getIESAttenuation(float cosAngle, sampler2D iesLightSampler) {
	float angle = acos(cosAngle) / PI;
	return texture2D(iesLightSampler, vec2(angle, 0.)).r;
}

lightingInfo basicSpotLighting(vec3 viewDirectionW, vec3 lightVectorW, vec3 vNormal, float attenuation, vec3 diffuseColor, vec3 specularColor, float glossiness) {
	lightingInfo result;	

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

lightingInfo computeIESSpotLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec4 lightDirection, vec3 diffuseColor, vec3 specularColor, float range, float glossiness, sampler2D iesLightSampler) {	
	vec3 direction = lightData.xyz - vPositionW;
	vec3 lightVectorW = normalize(direction);
	float attenuation = max(0., 1.0 - length(direction) / range);

	// diffuse
	float dotProduct = dot(lightDirection.xyz, -lightVectorW);
	float cosAngle = max(0., dotProduct);

	if (cosAngle >= lightDirection.w)
	{		
		attenuation *= getIESAttenuation(dotProduct, iesLightSampler);
		return basicSpotLighting(viewDirectionW, lightVectorW, vNormal, attenuation, diffuseColor, specularColor, glossiness);
	}

	lightingInfo result;
	result.diffuse = vec3(0.);
#ifdef SPECULARTERM
	result.specular = vec3(0.);
#endif
#ifdef NDOTL
	result.ndl = 0.;
#endif

	return result;
}

lightingInfo computeSpotLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec4 lightDirection, vec3 diffuseColor, vec3 specularColor, float range, float glossiness) {
	vec3 direction = lightData.xyz - vPositionW;
	vec3 lightVectorW = normalize(direction);
	float attenuation = max(0., 1.0 - length(direction) / range);

	// diffuse
	float cosAngle = max(0., dot(lightDirection.xyz, -lightVectorW));

	if (cosAngle >= lightDirection.w)
	{		
		attenuation *= getAttenuation(cosAngle, lightData.w);
		return basicSpotLighting(viewDirectionW, lightVectorW, vNormal, attenuation, diffuseColor, specularColor, glossiness);
	}

	lightingInfo result;
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

uniform sampler2D areaLightsLTC1Sampler;
uniform sampler2D areaLightsLTC2Sampler;

lightingInfo computeAreaLighting(sampler2D ltc1, sampler2D ltc2, vec3 viewDirectionW, vec3 vNormal, vec3 vPosition, vec4 lightData, vec3 halfWidth, vec3 halfHeight, vec3 diffuseColor, vec3 specularColor, float roughness ) 
{
	lightingInfo result;
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
	result.specular += specularColor * fresnel * LTCEvaluate( normal, viewDir, position, mInv, rectCoords );
#endif
	
	result.diffuse += diffuseColor * LTCEvaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	return result;
}

// End Area Light
#endif
