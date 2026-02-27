// Real-Time Polygonal-Light Shading with Linearly Transformed Cosines
// by Eric Heitz, Jonathan Dupuy, Stephen Hill and David Neubelt
// code: https://github.com/selfshadow/ltc_code/
// Inspired by https://github.com/mrdoob/three.js/blob/34342755bff5c582d3aa1c9f70fb6d04688c25fe/src/renderers/shaders/ShaderChunk/lights_physical_pars_fragment.glsl.js

fn LTCUv(N: vec3f, V: vec3f, roughness: f32) -> vec2f {

	var LUTSIZE: f32 = 64.0;
	var LUTSCALE: f32 = ( LUTSIZE - 1.0 ) / LUTSIZE;
	var LUTBIAS:f32 = 0.5 / LUTSIZE;

	var dotNV:f32 = saturate( dot( N, V ) );

	// texture parameterized by sqrt( GGX alpha ) and sqrt( 1 - cos( theta ) )
	var uv:vec2f = vec2f( roughness, sqrt( 1.0 - dotNV ) );

	uv = uv * LUTSCALE + LUTBIAS;

	return uv;
}

fn LTCClippedSphereFormFactor( f:vec3f ) -> f32 {

	// Real-Time Area Lighting: a Journey from Research to Production (p.102)
	// An approximation of the form factor of a horizon-clipped rectangle.
	var l: f32 = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}

fn LTCEdgeVectorFormFactor( v1:vec3f, v2:vec3f ) -> vec3f {

	var x:f32 = dot( v1, v2 );

	var y:f32 = abs( x );

	// rational polynomial approximation to theta / sin( theta ) / 2PI
	var a:f32 = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	var b:f32 = 3.4175940 + ( 4.1616724 + y ) * y;
	var v:f32 = a / b;

	var thetaSintheta:f32 = 0.0;

	if( x > 0.0 )
	{
		thetaSintheta = v;
	}
	else
	{
		thetaSintheta = 0.5 * inverseSqrt( max( 1.0 - x * x, 0.00000001 ) ) - v;
	}
	return cross( v1, v2 ) * thetaSintheta;
}

fn LTCEvaluate( N:vec3f, V:vec3f, P:vec3f, mInv: mat3x3<f32>, rectCoords0:vec3f, rectCoords1:vec3f, rectCoords2:vec3f, rectCoords3:vec3f ) -> vec3f {

	// bail if point is on back side of plane of light
	// assumes ccw winding order of light vertices
	var v1:vec3f = rectCoords1 - rectCoords0;
	var v2:vec3f = rectCoords3 - rectCoords0;
	var lightNormal:vec3f = cross( v1, v2 );

	if( dot( lightNormal, P - rectCoords0 ) < 0.0 ){
		return vec3f( 0.0 );
	}

	// construct orthonormal basis around N
	var T1:vec3f = normalize( V - N * dot( V, N ) );
	var T2:vec3f = - cross( N, T1 ); // negated from paper; possibly due to a different handedness of world coordinate system

	// compute transform
	var mat: mat3x3<f32> = mInv * transposeMat3( mat3x3<f32>( T1, T2, N ) );

	// transform rect
	var coords0: vec3f = mat * ( rectCoords0 - P );
	var coords1: vec3f = mat * ( rectCoords1 - P );
	var coords2: vec3f = mat * ( rectCoords2 - P );
	var coords3: vec3f = mat * ( rectCoords3 - P );

	// project rect onto sphere
	coords0 = normalize( coords0 );
	coords1 = normalize( coords1 );
	coords2 = normalize( coords2 );
	coords3 = normalize( coords3 );

	// calculate vector form factor
	var vectorFormFactor:vec3f = vec3( 0.0 );
	vectorFormFactor += LTCEdgeVectorFormFactor( coords0, coords1 );
	vectorFormFactor += LTCEdgeVectorFormFactor( coords1, coords2 );
	vectorFormFactor += LTCEdgeVectorFormFactor( coords2, coords3 );
	vectorFormFactor += LTCEdgeVectorFormFactor( coords3, coords0 );

	// adjust for horizon clipping
	var result:f32 = LTCClippedSphereFormFactor( vectorFormFactor );
	return vec3f( result );
}

struct areaLightData
{
    Diffuse: vec3f,
	Specular: vec3f,
	Fresnel: vec4f
};


fn computeAreaLightSpecularDiffuseFresnel(ltc1: texture_2d<f32>, ltc1Sampler:sampler, ltc2:texture_2d<f32>, ltc2Sampler:sampler, viewDir: vec3f, normal:vec3f, position:vec3f, lightPos:vec3f, halfWidth:vec3f,  halfHeight:vec3f, roughness:f32) -> areaLightData {
    var result: areaLightData;

	var rectCoords0:vec3f = lightPos + halfWidth - halfHeight; // counterclockwise; light shines in local neg z direction
	var rectCoords1:vec3f = lightPos - halfWidth - halfHeight;
	var rectCoords2:vec3f = lightPos - halfWidth + halfHeight;
	var rectCoords3:vec3f = lightPos + halfWidth + halfHeight;
	
#ifdef SPECULARTERM
	var uv:vec2f = LTCUv( normal, viewDir, roughness );

	var t1:vec4f = textureSample( ltc1, ltc1Sampler, uv );
	var t2:vec4f = textureSample( ltc2, ltc2Sampler, uv );

	var mInv:mat3x3<f32> = mat3x3<f32>(
		vec3f( t1.x, 0, t1.y ),
		vec3f(    0, 1,    0 ),
		vec3f( t1.z, 0, t1.w )
	);

	// LTC Fresnel Approximation by Stephen Hill
	// http://blog.selfshadow.com/publications/s2016-advances/s2016_ltc_fresnel.pdf
	result.Fresnel = t2;
	result.Specular = LTCEvaluate( normal, viewDir, position, mInv, rectCoords0, rectCoords1, rectCoords2, rectCoords3 );
#endif
	var mInvEmpty:mat3x3<f32> = mat3x3<f32>(
		vec3f( 1, 0, 0 ),
		vec3f( 0, 1, 0 ),
		vec3f( 0, 0, 1 )
	);

	result.Diffuse += LTCEvaluate( normal, viewDir, position, mInvEmpty, rectCoords0, rectCoords1, rectCoords2, rectCoords3 );
    return result;
}

// Texture Area Light functions

fn FetchDiffuseFilteredTexture(texLightFiltered: texture_2d<f32>, texLightFilteredSampler: sampler, p1_: vec3f, p2_: vec3f, p3_: vec3f, p4_: vec3f) -> vec3f {
	// area light plane basis
	var V1: vec3f = p2_ - p1_;
	var V2: vec3f = p4_ - p1_;
	var planeOrtho: vec3f = cross(V1, V2);
	var planeAreaSquared: f32 = dot(planeOrtho, planeOrtho);
	var planeDistxPlaneArea: f32 = dot(planeOrtho, p1_);
	// orthonormal projection of (0,0,0) in area light space
	var P: vec3f = planeDistxPlaneArea * planeOrtho / planeAreaSquared - p1_;

	// find tex coords of P
	var dot_V1_V2: f32 = dot(V1, V2);
	var inv_dot_V1_V1: f32 = 1.0 / dot(V1, V1);
	var V2_: vec3f = V2 - V1 * dot_V1_V2 * inv_dot_V1_V1;
	var Puv: vec2f;
	Puv.y = dot(V2_, P) / dot(V2_, V2_);
	Puv.x = dot(V1, P) * inv_dot_V1_V1 - dot_V1_V2 * inv_dot_V1_V1 * Puv.y;

	// LOD
	var d: f32 = abs(planeDistxPlaneArea) / pow(planeAreaSquared, 0.75);
	var sampleLOD: f32 = log(2048.0 * d) / log(3.0);
	var sampleUV: vec2f = vec2f(0.125, 0.125) + (vec2f(0.75) * Puv);
	sampleUV.x = 1.0 - sampleUV.x;

	return textureSampleLevel(texLightFiltered, texLightFilteredSampler, sampleUV, sampleLOD).rgb;
}

fn LTCEvaluateWithEmission(N: vec3f, V: vec3f, P: vec3f, mInv: mat3x3<f32>, rectCoords0: vec3f, rectCoords1: vec3f, rectCoords2: vec3f, rectCoords3: vec3f, texFilteredMap: texture_2d<f32>, texFilteredMapSampler: sampler) -> vec3f {
	// bail if point is on back side of plane of light
	// assumes ccw winding order of light vertices
	var v1: vec3f = rectCoords1 - rectCoords0;
	var v2: vec3f = rectCoords3 - rectCoords0;
	var lightNormal: vec3f = cross(v1, v2);

	if (dot(lightNormal, P - rectCoords0) < 0.0) {
		return vec3f(0.0);
	}

	// construct orthonormal basis around N
	var T1: vec3f = normalize(V - N * dot(V, N));
	var T2: vec3f = -cross(N, T1);

	// compute transform
	var mat: mat3x3<f32> = mInv * transposeMat3(mat3x3<f32>(T1, T2, N));

	// transform rect
	var coords0: vec3f = mat * (rectCoords0 - P);
	var coords1: vec3f = mat * (rectCoords1 - P);
	var coords2: vec3f = mat * (rectCoords2 - P);
	var coords3: vec3f = mat * (rectCoords3 - P);

	var textureLight: vec3f = FetchDiffuseFilteredTexture(texFilteredMap, texFilteredMapSampler, coords0, coords1, coords2, coords3);

	// project rect onto sphere
	coords0 = normalize(coords0);
	coords1 = normalize(coords1);
	coords2 = normalize(coords2);
	coords3 = normalize(coords3);

	// calculate vector form factor
	var vectorFormFactor: vec3f = vec3f(0.0);
	vectorFormFactor += LTCEdgeVectorFormFactor(coords0, coords1);
	vectorFormFactor += LTCEdgeVectorFormFactor(coords1, coords2);
	vectorFormFactor += LTCEdgeVectorFormFactor(coords2, coords3);
	vectorFormFactor += LTCEdgeVectorFormFactor(coords3, coords0);

	// adjust for horizon clipping
	var result: f32 = LTCClippedSphereFormFactor(vectorFormFactor);

	return vec3f(result) * textureLight;
}

fn computeAreaLightSpecularDiffuseFresnelWithEmission(ltc1: texture_2d<f32>, ltc1Sampler:sampler, ltc2:texture_2d<f32>, ltc2Sampler:sampler, emissionTexture: texture_2d<f32>, emissionTextureSampler:sampler, viewDir: vec3f, normal:vec3f, position:vec3f, lightPos:vec3f, halfWidth:vec3f,  halfHeight:vec3f, roughness:f32) -> areaLightData {
	var result: areaLightData;

	var rectCoords0: vec3f = lightPos + halfWidth - halfHeight; // counterclockwise; light shines in local neg z direction
	var rectCoords1: vec3f = lightPos - halfWidth - halfHeight;
	var rectCoords2: vec3f = lightPos - halfWidth + halfHeight;
	var rectCoords3: vec3f = lightPos + halfWidth + halfHeight;

	#ifdef SPECULARTERM
	var uv: vec2f = LTCUv(normal, viewDir, roughness);

	var t1: vec4f = textureSample(ltc1, ltc1Sampler, uv);

	// LTC Fresnel Approximation by Stephen Hill
	// http://blog.selfshadow.com/publications/s2016-advances/s2016_ltc_fresnel.pdf
	var t2: vec4f = textureSample(ltc2, ltc2Sampler, uv);

	var mInv: mat3x3<f32> = mat3x3<f32>(
		vec3f(t1.x, 0, t1.y),
		vec3f(0, 1, 0),
		vec3f(t1.z, 0, t1.w)
	);
	result.Specular = LTCEvaluateWithEmission(normal, viewDir, position, mInv, rectCoords0, rectCoords1, rectCoords2, rectCoords3, emissionTexture, emissionTextureSampler);
	result.Fresnel = t2;
	#endif
	var mInvEmpty: mat3x3<f32> = mat3x3<f32>(
		vec3f(1, 0, 0),
		vec3f(0, 1, 0),
		vec3f(0, 0, 1)
	);
	result.Diffuse = LTCEvaluateWithEmission(normal, viewDir, position, mInvEmpty, rectCoords0, rectCoords1, rectCoords2, rectCoords3, emissionTexture, emissionTextureSampler);
	return result;
}

