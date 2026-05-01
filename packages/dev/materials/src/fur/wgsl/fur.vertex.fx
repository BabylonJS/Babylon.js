// Attributes
attribute position: vec3f;
attribute normal: vec3f;

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
uniform furLength: f32;
uniform furAngle: f32;
#ifdef HIGHLEVEL
uniform furOffset: f32;
uniform furGravity: vec3f;
uniform furTime: f32;
uniform furSpacing: f32;
uniform furDensity: f32;
#endif
#ifdef HEIGHTMAP
var heightTextureSampler: sampler;
var heightTexture: texture_2d<f32>;
#endif

#ifdef HIGHLEVEL
varying vFurUV: vec2f;
#endif

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
varying vfur_length: f32;

#ifdef VERTEXCOLOR
varying vColor: vec4f;
#endif

#include<clipPlaneVertexDeclaration>
#include<logDepthDeclaration>
#include<fogVertexDeclaration>
#include<__decl__lightVxFragment>[0..maxSimultaneousLights]

fn Rand(rv: vec3f) -> f32 {
	var x: f32 = dot(rv,  vec3f(12.9898, 78.233, 24.65487));
	return fract(sin(x) * 43758.5453);
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

//FUR
var r: f32 = Rand(vertexInputs.position);
#ifdef HEIGHTMAP
	vertexOutputs.vfur_length = uniforms.furLength * textureSampleLevel(heightTexture, heightTextureSampler, vertexInputs.uv, 0.).x;
#else
	vertexOutputs.vfur_length = (uniforms.furLength * r);
#endif
	var tangent1: vec3f =  vec3f(vertexInputs.normal.y, -vertexInputs.normal.x, 0);
	var tangent2: vec3f =  vec3f(-vertexInputs.normal.z, 0, vertexInputs.normal.x);
	r = Rand(tangent1 * r);
	var J: f32 = (2.0 + 4.0 * r);
	r = Rand(tangent2*r);
	var K: f32 = (2.0 + 2.0 * r);
	tangent1 = tangent1*J + tangent2 * K;
	tangent1 = normalize(tangent1);

    var newPosition: vec3f = vertexInputs.position + vertexInputs.normal * vertexOutputs.vfur_length * cos(uniforms.furAngle) + tangent1 * vertexOutputs.vfur_length * sin(uniforms.furAngle);

	#ifdef HIGHLEVEL
	// Compute fur data passed to the pixel shader
	var forceDirection: vec3f =  vec3f(0.0, 0.0, 0.0);
	forceDirection.x = sin(uniforms.furTime + vertexInputs.position.x * 0.05) * 0.2;
	forceDirection.y = cos(uniforms.furTime * 0.7 + vertexInputs.position.y * 0.04) * 0.2;
	forceDirection.z = sin(uniforms.furTime * 0.7 + vertexInputs.position.z * 0.04) * 0.2;

	var displacement: vec3f =  vec3f(0.0, 0.0, 0.0);
	displacement = uniforms.furGravity + forceDirection;

	var displacementFactor: f32 = pow(uniforms.furOffset, 3.0);

	var aNormal: vec3f = vertexInputs.normal;
	aNormal = vec3f(aNormal.xyz + displacement * displacementFactor);

	newPosition =  vec3f(newPosition.x, newPosition.y, newPosition.z) + (normalize(aNormal) * uniforms.furOffset * uniforms.furSpacing);
	#endif

	#ifdef NORMAL
	vertexOutputs.vNormalW = normalize(( finalWorld *  vec4f(vertexInputs.normal, 0.0)).xyz);
	#endif

//END FUR
	vertexOutputs.position = uniforms.viewProjection * finalWorld *  vec4f(newPosition, 1.0);

	var worldPos: vec4f = finalWorld *  vec4f(newPosition, 1.0);
	vertexOutputs.vPositionW =  worldPos.xyz;

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

    #ifdef HIGHLEVEL
	vertexOutputs.vFurUV = vertexOutputs.vDiffuseUV * uniforms.furDensity;
	#endif
#else
    #ifdef HIGHLEVEL
	vertexOutputs.vFurUV = uv * uniforms.furDensity;
	#endif
#endif

	// Clip plane
	#include<clipPlaneVertex>

	#include<logDepthVertex>
	// Fog
	#include<fogVertex>

	// Shadows
	#include<shadowsVertex>[0..maxSimultaneousLights]

	// Vertex color
	#include<vertexColorMixing>

#define CUSTOM_VERTEX_MAIN_END
}
