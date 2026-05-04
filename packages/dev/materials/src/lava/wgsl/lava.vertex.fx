// Inputs
uniform time: f32;
uniform lowFrequencySpeed: f32;
// Varying
varying noise: f32;

// Attributes
attribute position: vec3f;
#ifdef NORMAL
attribute normal: vec3f;
#endif
#ifdef UV1
attribute uv: vec2f;
#endif
#ifdef UV2
attribute uv2: vec2f;
#endif
#ifdef VERTEXCOLOR
attribute color: vec4f;
#endif

#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>

// Uniforms
#include<instancesDeclaration>

uniform view: mat4x4f;
uniform viewProjection: mat4x4f;

#ifdef DIFFUSE
varying vDiffuseUV: vec2f;
uniform diffuseMatrix: mat4x4f;
uniform vDiffuseInfos: vec2f;
#endif

#ifdef POINTSIZE
uniform pointSize: f32;
#endif

// Output
varying vPositionW: vec3f;
#ifdef NORMAL
varying vNormalW: vec3f;
#endif

#ifdef VERTEXCOLOR
varying vColor: vec4f;
#endif


#include<clipPlaneVertexDeclaration>

#include<logDepthDeclaration>
#include<fogVertexDeclaration>
#include<__decl__lightVxFragment>[0..maxSimultaneousLights]

/* NOISE FUNCTIONS */
fn mod289v3(x: vec3f) -> vec3f
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

fn mod289v4(x: vec4f) -> vec4f
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

fn permute(x: vec4f) -> vec4f
{
  return mod289v4(((x*34.0)+1.0)*x);
}

fn taylorInvSqrt(r: vec4f) -> vec4f
{
  return  vec4f(1.79284291400159) - 0.85373472095314 * r;
}

fn fade(t: vec3f) -> vec3f {
  return t*t*t*(t*(t*6.0-15.0)+10.0);
}

// Classic Perlin noise, periodic variant
fn pnoise(P: vec3f, rep: vec3f) -> f32
{
  var Pi0: vec3f = (P - rep * floor(P / rep)); // mod
  Pi0 = floor(Pi0);
  var Pi1: vec3f = Pi0 +  vec3f(1.0);
  Pi1 = Pi1 - rep * floor(Pi1 / rep);
  Pi0 = mod289v3(Pi0);
  Pi1 = mod289v3(Pi1);
  var Pf0: vec3f = fract(P);
  var Pf1: vec3f = Pf0 -  vec3f(1.0);
  var ix: vec4f =  vec4f(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  var iy: vec4f =  vec4f(Pi0.y, Pi0.y, Pi1.y, Pi1.y);
  var iz0: vec4f =  vec4f(Pi0.z);
  var iz1: vec4f =  vec4f(Pi1.z);

  var ixy: vec4f = permute(permute(ix) + iy);
  var ixy0: vec4f = permute(ixy + iz0);
  var ixy1: vec4f = permute(ixy + iz1);

  var gx0: vec4f = ixy0 * (1.0 / 7.0);
  var gy0: vec4f = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  var gz0: vec4f =  vec4f(0.5) - abs(gx0) - abs(gy0);
  var sz0: vec4f = step(gz0,  vec4f(0.0));
  gx0 = gx0 - sz0 * (step( vec4f(0.0), gx0) - 0.5);
  gy0 = gy0 - sz0 * (step( vec4f(0.0), gy0) - 0.5);

  var gx1: vec4f = ixy1 * (1.0 / 7.0);
  var gy1: vec4f = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  var gz1: vec4f =  vec4f(0.5) - abs(gx1) - abs(gy1);
  var sz1: vec4f = step(gz1,  vec4f(0.0));
  gx1 = gx1 - sz1 * (step( vec4f(0.0), gx1) - 0.5);
  gy1 = gy1 - sz1 * (step( vec4f(0.0), gy1) - 0.5);

  var g000: vec3f =  vec3f(gx0.x, gy0.x, gz0.x);
  var g100: vec3f =  vec3f(gx0.y, gy0.y, gz0.y);
  var g010: vec3f =  vec3f(gx0.z, gy0.z, gz0.z);
  var g110: vec3f =  vec3f(gx0.w, gy0.w, gz0.w);
  var g001: vec3f =  vec3f(gx1.x, gy1.x, gz1.x);
  var g101: vec3f =  vec3f(gx1.y, gy1.y, gz1.y);
  var g011: vec3f =  vec3f(gx1.z, gy1.z, gz1.z);
  var g111: vec3f =  vec3f(gx1.w, gy1.w, gz1.w);

  var norm0: vec4f = taylorInvSqrt( vec4f(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 = g000 * norm0.x;
  g010 = g010 * norm0.y;
  g100 = g100 * norm0.z;
  g110 = g110 * norm0.w;
  var norm1: vec4f = taylorInvSqrt( vec4f(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 = g001 * norm1.x;
  g011 = g011 * norm1.y;
  g101 = g101 * norm1.z;
  g111 = g111 * norm1.w;

  var n000: f32 = dot(g000, Pf0);
  var n100: f32 = dot(g100,  vec3f(Pf1.x, Pf0.yz));
  var n010: f32 = dot(g010,  vec3f(Pf0.x, Pf1.y, Pf0.z));
  var n110: f32 = dot(g110,  vec3f(Pf1.xy, Pf0.z));
  var n001: f32 = dot(g001,  vec3f(Pf0.xy, Pf1.z));
  var n101: f32 = dot(g101,  vec3f(Pf1.x, Pf0.y, Pf1.z));
  var n011: f32 = dot(g011,  vec3f(Pf0.x, Pf1.yz));
  var n111: f32 = dot(g111, Pf1);

  var fade_xyz: vec3f = fade(Pf0);
  var n_z: vec4f = mix( vec4f(n000, n100, n010, n110),  vec4f(n001, n101, n011, n111),  vec4f(fade_xyz.z));
  var n_yz: vec2f = mix(n_z.xy, n_z.zw,  vec2f(fade_xyz.y));
  var n_xyz: f32 = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
}
/* END FUNCTION */

fn turbulence(p: vec3f) -> f32 {
    var w: f32 = 100.0;
    var t: f32 = -.5;
    for (var f: f32 = 1.0; f <= 10.0; f = f + 1.0){
        var power: f32 = pow(2.0, f);
        t = t + abs(pnoise( vec3f(power * p),  vec3f(10.0, 10.0, 10.0)) / power);
    }
    return t;
}

#if defined(CLUSTLIGHT_BATCH) && CLUSTLIGHT_BATCH > 0
varying vViewDepth: f32;
#endif

#define CUSTOM_VERTEX_DEFINITIONS

@vertex
fn main(input : VertexInputs) -> FragmentInputs {

#define CUSTOM_VERTEX_MAIN_BEGIN

#ifdef VERTEXCOLOR
    var colorUpdated: vec4f = vertexInputs.color;
#endif

#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>

#ifdef NORMAL
    // get a turbulent 3d noise using the normal, normal to high freq
    vertexOutputs.noise = 10.0 * -.10 * turbulence(.5 * vertexInputs.normal + uniforms.time * 1.15);
    // get a 3d noise using the position, low frequency
    var b: f32 = uniforms.lowFrequencySpeed * 5.0 * pnoise(0.05 * vertexInputs.position +  vec3f(uniforms.time * 1.025),  vec3f(100.0));
    // compose both noises
    var displacement: f32 = -1.5 * vertexOutputs.noise + b;

    // move the position along the normal and transform it
    var newPosition: vec3f = vertexInputs.position + vertexInputs.normal * displacement;
    vertexOutputs.position = uniforms.viewProjection * finalWorld *  vec4f(newPosition, 1.0);


	var worldPos: vec4f = finalWorld *  vec4f(newPosition, 1.0);
	vertexOutputs.vPositionW =  worldPos.xyz;

	vertexOutputs.vNormalW = normalize(( finalWorld *  vec4f(vertexInputs.normal, 0.0)).xyz);
#endif

	// Texture coordinates
#ifndef UV1
	var uv: vec2f =  vec2f(0., 0.);
#else
    var uv: vec2f = vertexInputs.uv;
#endif
#ifndef UV2
	var uv2: vec2f =  vec2f(0., 0.);
#else
    var uv2: vec2f = vertexInputs.uv2;
#endif

#ifdef DIFFUSE
	if (uniforms.vDiffuseInfos.x == 0.)
	{
		vertexOutputs.vDiffuseUV = (uniforms.diffuseMatrix *  vec4f(uv, 1.0, 0.0)).xy;
	}
	else
	{
		vertexOutputs.vDiffuseUV = (uniforms.diffuseMatrix *  vec4f(uv2, 1.0, 0.0)).xy;
	}
#endif

	// Clip plane
#include<clipPlaneVertex>

	// Fog
#include<fogVertex>
#include<shadowsVertex>[0..maxSimultaneousLights]

	// Vertex color
#include<vertexColorMixing>

#include<logDepthVertex>

#define CUSTOM_VERTEX_MAIN_END
}
