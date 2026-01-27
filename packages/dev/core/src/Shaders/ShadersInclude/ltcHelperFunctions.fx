// Real-Time Polygonal-Light Shading with Linearly Transformed Cosines
// by Eric Heitz, Jonathan Dupuy, Stephen Hill and David Neubelt
// code: https://github.com/selfshadow/ltc_code/
// Inspired by https://github.com/mrdoob/three.js/blob/34342755bff5c582d3aa1c9f70fb6d04688c25fe/src/renderers/shaders/ShaderChunk/lights_physical_pars_fragment.glsl.js

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

vec3 FetchDiffuseFilteredTexture(sampler2D texLightFiltered, vec3 p1_, vec3 p2_, vec3 p3_, vec3 p4_)
{
    // area light plane basis
    vec3 V1 = p2_ - p1_;
    vec3 V2 = p4_ - p1_;
    vec3 planeOrtho = (cross(V1, V2));
    float planeAreaSquared = dot(planeOrtho, planeOrtho);
    float planeDistxPlaneArea = dot(planeOrtho, p1_);
    // orthonormal projection of (0,0,0) in area light space
    vec3 P = planeDistxPlaneArea * planeOrtho / planeAreaSquared - p1_;

    // find tex coords of P
    float dot_V1_V2 = dot(V1,V2);
    float inv_dot_V1_V1 = 1.0 / dot(V1, V1);
    vec3 V2_ = V2 - V1 * dot_V1_V2 * inv_dot_V1_V1;
    vec2 Puv;
    Puv.y = dot(V2_, P) / dot(V2_, V2_);
    Puv.x = dot(V1, P)*inv_dot_V1_V1 - dot_V1_V2*inv_dot_V1_V1*Puv.y ;

    // LOD
    float d = abs(planeDistxPlaneArea) / pow(planeAreaSquared, 0.75);
	float sampleLOD = log(2048.0*d)/log(3.0);
	vec2 sampleUV = vec2(0.125, 0.125) + (vec2(0.75) * Puv);
	sampleUV.x = 1.0 - sampleUV.x;

    return texture2DLodEXT(texLightFiltered, sampleUV, sampleLOD).rgb;
}

vec3 LTCEvaluateWithEmission( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ], const in sampler2D texFilteredMap ) {

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

	vec3 textureLight = FetchDiffuseFilteredTexture(texFilteredMap, coords[0], coords[1], coords[2], coords[3]);

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
	
	return vec3( result ) * textureLight;
}

struct areaLightData
{
    vec3 Diffuse;
	vec3 Specular;
	vec4 Fresnel;
};

#define inline
areaLightData computeAreaLightSpecularDiffuseFresnel(const in sampler2D ltc1, const in sampler2D ltc2, const in vec3 viewDir, const in vec3 normal, const in vec3 position, const in vec3 lightPos, const in vec3 halfWidth, const in vec3 halfHeight, const in float roughness) 
{
	areaLightData result;
	vec3 rectCoords[ 4 ];
	rectCoords[ 0 ] = lightPos + halfWidth - halfHeight; // counterclockwise; light shines in local neg z direction
	rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
	rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
	rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;

#ifdef SPECULARTERM
	vec2 uv = LTCUv( normal, viewDir, roughness );

	vec4 t1 = texture2D( ltc1, uv );

	// LTC Fresnel Approximation by Stephen Hill
	// http://blog.selfshadow.com/publications/s2016-advances/s2016_ltc_fresnel.pdf
	vec4 t2 = texture2D( ltc2, uv );

	mat3 mInv = mat3(
		vec3( t1.x, 0, t1.y ),
		vec3(    0, 1,    0 ),
		vec3( t1.z, 0, t1.w )
	);

	result.Specular = LTCEvaluate( normal, viewDir, position, mInv, rectCoords );
	result.Fresnel = t2;
#endif
	result.Diffuse = LTCEvaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	return result;
}

#define inline
areaLightData computeAreaLightSpecularDiffuseFresnelWithEmission(const in sampler2D ltc1, const in sampler2D ltc2, const in sampler2D texFilteredMap, const in vec3 viewDir, const in vec3 normal, const in vec3 position, const in vec3 lightPos, const in vec3 halfWidth, const in vec3 halfHeight, const in float roughness) 
{
	areaLightData result;
	vec3 rectCoords[ 4 ];
	rectCoords[ 0 ] = lightPos + halfWidth - halfHeight; // counterclockwise; light shines in local neg z direction
	rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
	rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
	rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;

#ifdef SPECULARTERM
	vec2 uv = LTCUv( normal, viewDir, roughness );

	vec4 t1 = texture2D( ltc1, uv );

	// LTC Fresnel Approximation by Stephen Hill
	// http://blog.selfshadow.com/publications/s2016-advances/s2016_ltc_fresnel.pdf
	vec4 t2 = texture2D( ltc2, uv );

	mat3 mInv = mat3(
		vec3( t1.x, 0, t1.y ),
		vec3(    0, 1,    0 ),
		vec3( t1.z, 0, t1.w )
	);
	result.Specular = LTCEvaluateWithEmission( normal, viewDir, position, mInv, rectCoords, texFilteredMap );
	result.Fresnel = t2;
#endif
	result.Diffuse = LTCEvaluateWithEmission( normal, viewDir, position, mat3( 1.0 ), rectCoords, texFilteredMap );
	return result;
}