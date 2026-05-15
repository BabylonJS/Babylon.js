// Attributes
attribute position: vec3f;
#ifdef NORMAL
attribute normal: vec3f;
#endif
#ifdef VERTEXCOLOR
attribute color: vec4f;
#endif

#include<helperFunctions>

#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>

// Uniforms
#include<instancesDeclaration>

uniform view: mat4x4f;
uniform viewProjection: mat4x4f;

#ifdef DIFFUSEX
varying vTextureUVX: vec2f;
#endif

#ifdef DIFFUSEY
varying vTextureUVY: vec2f;
#endif

#ifdef DIFFUSEZ
varying vTextureUVZ: vec2f;
#endif

uniform tileSize: f32;

#ifdef POINTSIZE
uniform pointSize: f32;
#endif

// Output
varying vPositionW: vec3f;
#ifdef NORMAL
varying tangentSpace0: vec3f;
varying tangentSpace1: vec3f;
varying tangentSpace2: vec3f;
#endif

#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
varying vColor: vec4f;
#endif

#include<clipPlaneVertexDeclaration>

#include<logDepthDeclaration>
#include<fogVertexDeclaration>
#include<__decl__lightVxFragment>[0..maxSimultaneousLights]

#if defined(CLUSTLIGHT_BATCH) && CLUSTLIGHT_BATCH > 0
varying vViewDepth: f32;
#endif

#define CUSTOM_VERTEX_DEFINITIONS

@vertex
fn main(input : VertexInputs) -> FragmentInputs
{

#define CUSTOM_VERTEX_MAIN_BEGIN

#ifdef VERTEXCOLOR
    var colorUpdated: vec4f = vertexInputs.color;
#endif

	#include<instancesVertex>
    #include<bonesVertex>
    #include<bakedVertexAnimation>

	var worldPos: vec4f = finalWorld *  vec4f(vertexInputs.position, 1.0);

	vertexOutputs.position = uniforms.viewProjection * worldPos;

	vertexOutputs.vPositionW =  worldPos.xyz;

#ifdef DIFFUSEX
	vertexOutputs.vTextureUVX = worldPos.zy / uniforms.tileSize;
#endif

#ifdef DIFFUSEY
	vertexOutputs.vTextureUVY = worldPos.xz / uniforms.tileSize;
#endif

#ifdef DIFFUSEZ
	vertexOutputs.vTextureUVZ = worldPos.xy / uniforms.tileSize;
#endif

#ifdef NORMAL
	// Compute tangent space (used for normal mapping + tri planar color mapping)
	var xtan: vec3f =  vec3f(0,0,1);//tangent space for the X aligned plane
   	var xbin: vec3f =  vec3f(0,1,0);

   	var ytan: vec3f =  vec3f(1,0,0);//tangent space for the Y aligned plane
   	var ybin: vec3f =  vec3f(0,0,1);

   	var ztan: vec3f =  vec3f(1,0,0);//tangent space for the Z aligned plane
   	var zbin: vec3f =  vec3f(0,1,0);

	var normalizedNormal: vec3f = normalize(vertexInputs.normal);
   	normalizedNormal = normalizedNormal * normalizedNormal;

	var worldBinormal: vec3f = normalize(xbin * normalizedNormal.x + ybin * normalizedNormal.y + zbin * normalizedNormal.z);
   	var worldTangent: vec3f = normalize(xtan * normalizedNormal.x + ytan * normalizedNormal.y + ztan * normalizedNormal.z);

	var normalWorld: mat3x3f =  mat3x3f(finalWorld[0].xyz, finalWorld[1].xyz, finalWorld[2].xyz);

	#ifdef NONUNIFORMSCALING
		normalWorld = transposeMat3(inverseMat3(normalWorld));
	#endif

	worldTangent = normalize((normalWorld * worldTangent).xyz);
    worldBinormal = normalize((normalWorld * worldBinormal).xyz);
	var worldNormal: vec3f = normalize((normalWorld * normalize(vertexInputs.normal)).xyz);

	vertexOutputs.tangentSpace0 = worldTangent;
    vertexOutputs.tangentSpace1 = worldBinormal;
    vertexOutputs.tangentSpace2 = worldNormal;
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
