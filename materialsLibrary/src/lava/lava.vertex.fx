precision highp float;
// Inputs
uniform float time;
uniform float lowFrequencySpeed;
// Varying
varying float noise;

// Attributes
attribute vec3 position;
#ifdef NORMAL
attribute vec3 normal;
#endif
#ifdef UV1
attribute vec2 uv;
#endif
#ifdef UV2
attribute vec2 uv2;
#endif
#ifdef VERTEXCOLOR
attribute vec4 color;
#endif

#include<bonesDeclaration>

// Uniforms
#include<instancesDeclaration>

uniform mat4 view;
uniform mat4 viewProjection;

#ifdef DIFFUSE
varying vec2 vDiffuseUV;
uniform mat4 diffuseMatrix;
uniform vec2 vDiffuseInfos;
#endif

#ifdef POINTSIZE
uniform float pointSize;
#endif

// Output
varying vec3 vPositionW;
#ifdef NORMAL
varying vec3 vNormalW;
#endif

#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif


#include<clipPlaneVertexDeclaration>

#include<fogVertexDeclaration>
#include<shadowsVertexDeclaration>[0..maxSimultaneousLights]

/* NOISE FUNCTIONS */
////// ASHIMA webgl noise
////// https://github.com/ashima/webgl-noise/blob/master/src/classicnoise3D.glsl
vec3 mod289(vec3 x)
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x)
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x)
{
  return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

vec3 fade(vec3 t) {
  return t*t*t*(t*(t*6.0-15.0)+10.0);
}

// Classic Perlin noise, periodic variant
float pnoise(vec3 P, vec3 rep)
{
  vec3 Pi0 = mod(floor(P), rep); // Integer part, modulo period
  vec3 Pi1 = mod(Pi0 + vec3(1.0), rep); // Integer part + 1, mod period
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
}
/* END FUNCTION */

float turbulence( vec3 p ) {
    float w = 100.0;
    float t = -.5;
    for (float f = 1.0 ; f <= 10.0 ; f++ ){
        float power = pow( 2.0, f );
        t += abs( pnoise( vec3( power * p ), vec3( 10.0, 10.0, 10.0 ) ) / power );
    }
    return t;
}

void main(void) {

#include<instancesVertex>
#include<bonesVertex>

#ifdef NORMAL
    // get a turbulent 3d noise using the normal, normal to high freq
    noise = 10.0 *  -.10 * turbulence( .5 * normal + time*1.15 );
    // get a 3d noise using the position, low frequency
    float b = lowFrequencySpeed * 5.0 * pnoise( 0.05 * position +vec3(time*1.025), vec3( 100.0 ) );
    // compose both noises
    float displacement = - 1.5 * noise + b;

    // move the position along the normal and transform it
    vec3 newPosition = position + normal * displacement;
    gl_Position = viewProjection * finalWorld * vec4( newPosition, 1.0 );


	vec4 worldPos = finalWorld * vec4(newPosition, 1.0);
	vPositionW = vec3(worldPos);

	vNormalW = normalize(vec3(finalWorld * vec4(normal, 0.0)));
#endif

	// Texture coordinates
#ifndef UV1
	vec2 uv = vec2(0., 0.);
#endif
#ifndef UV2
	vec2 uv2 = vec2(0., 0.);
#endif

#ifdef DIFFUSE
	if (vDiffuseInfos.x == 0.)
	{
		vDiffuseUV = vec2(diffuseMatrix * vec4(uv, 1.0, 0.0));
	}
	else
	{
		vDiffuseUV = vec2(diffuseMatrix * vec4(uv2, 1.0, 0.0));
	}
#endif

	// Clip plane
#include<clipPlaneVertex>

	// Fog
#include<fogVertex>
#include<shadowsVertex>[0..maxSimultaneousLights]

	// Vertex color
#ifdef VERTEXCOLOR
	vColor = color;
#endif

	// Point size
#ifdef POINTSIZE
	gl_PointSize = pointSize;
#endif
}