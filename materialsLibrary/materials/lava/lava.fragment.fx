precision highp float;

// Constants
uniform vec3 vEyePosition;
uniform vec4 vDiffuseColor;

// Input
varying vec3 vPositionW;

// MAGMAAAA
uniform float time;
uniform float speed;
uniform float movingSpeed;
uniform vec3 fogColor;
uniform sampler2D noiseTexture;
uniform float fogDensity;

// Varying
varying float noise;

#ifdef NORMAL
varying vec3 vNormalW;
#endif

#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif

// Lights
#include<light0FragmentDeclaration>
#include<light1FragmentDeclaration>
#include<light2FragmentDeclaration>
#include<light3FragmentDeclaration>


#include<lightsFragmentFunctions>
#include<shadowsFragmentFunctions>

// Samplers
#ifdef DIFFUSE
varying vec2 vDiffuseUV;
uniform sampler2D diffuseSampler;
uniform vec2 vDiffuseInfos;
#endif

#include<clipPlaneFragmentDeclaration>

// Fog
#include<fogFragmentDeclaration>


float random( vec3 scale, float seed ){
    return fract( sin( dot( gl_FragCoord.xyz + seed, scale ) ) * 43758.5453 + seed ) ;
}


void main(void) {
#include<clipPlaneFragment>

	vec3 viewDirectionW = normalize(vEyePosition - vPositionW);

	// Base color
	vec4 baseColor = vec4(1., 1., 1., 1.);
	vec3 diffuseColor = vDiffuseColor.rgb;

	// Alpha
	float alpha = vDiffuseColor.a;



#ifdef DIFFUSE
    ////// MAGMA ///

	vec4 noiseTex = texture2D( noiseTexture, vDiffuseUV );
	vec2 T1 = vDiffuseUV + vec2( 1.5, -1.5 ) * time  * 0.02;
	vec2 T2 = vDiffuseUV + vec2( -0.5, 2.0 ) * time * 0.01 * speed;

	T1.x += noiseTex.x * 2.0;
	T1.y += noiseTex.y * 2.0;
	T2.x -= noiseTex.y * 0.2 + time*0.001*movingSpeed;
	T2.y += noiseTex.z * 0.2 + time*0.002*movingSpeed;

	float p = texture2D( noiseTexture, T1 * 3.0 ).a;

	vec4 lavaColor = texture2D( diffuseSampler, T2 * 4.0);
	vec4 temp = lavaColor * ( vec4( p, p, p, p ) * 2. ) + ( lavaColor * lavaColor - 0.1 );

	baseColor = temp;

	float depth = gl_FragCoord.z * 4.0;
	const float LOG2 = 1.442695;
    float fogFactor = exp2( - fogDensity * fogDensity * depth * depth * LOG2 );
    fogFactor = 1.0 - clamp( fogFactor, 0.0, 1.0 );

    baseColor = mix( baseColor, vec4( fogColor, baseColor.w ), fogFactor );
    diffuseColor = baseColor.rgb;
    ///// END MAGMA ////



//	baseColor = texture2D(diffuseSampler, vDiffuseUV);

#ifdef ALPHATEST
	if (baseColor.a < 0.4)
		discard;
#endif

	baseColor.rgb *= vDiffuseInfos.y;
#endif

#ifdef VERTEXCOLOR
	baseColor.rgb *= vColor.rgb;
#endif

	// Bump
#ifdef NORMAL
	vec3 normalW = normalize(vNormalW);
#else
	vec3 normalW = vec3(1.0, 1.0, 1.0);
#endif

	// Lighting
	vec3 diffuseBase = vec3(0., 0., 0.);
	float shadow = 1.;
    float glossiness = 0.;
    
#include<light0Fragment>
#include<light1Fragment>
#include<light2Fragment>
#include<light3Fragment>


#ifdef VERTEXALPHA
	alpha *= vColor.a;
#endif

	vec3 finalDiffuse = clamp(diffuseBase * diffuseColor, 0.0, 1.0) * baseColor.rgb;

	// Composition
	vec4 color = vec4(finalDiffuse, alpha);

#include<fogFragment>

	gl_FragColor = color;
}