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

// Real-Time Polygonal-Light Shading with Linearly Transformed Cosines
// by Eric Heitz, Jonathan Dupuy, Stephen Hill and David Neubelt
// code: https://github.com/selfshadow/ltc_code/
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