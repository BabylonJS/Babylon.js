precision highp float;

// Attributes
attribute vec3 position;
#ifdef NORMAL
attribute vec3 normal;
#endif
#ifdef VERTEXCOLOR
attribute vec4 color;
#endif

#include<helperFunctions>

#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>

// Uniforms
#include<instancesDeclaration>

uniform mat4 view;
uniform mat4 viewProjection;

#ifdef DIFFUSEX
varying vec2 vTextureUVX;
#endif

#ifdef DIFFUSEY
varying vec2 vTextureUVY;
#endif

#ifdef DIFFUSEZ
varying vec2 vTextureUVZ;
#endif

uniform float tileSize;

#ifdef POINTSIZE
uniform float pointSize;
#endif

// Output
varying vec3 vPositionW;
#ifdef NORMAL
varying mat3 tangentSpace;
#endif

#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
varying vec4 vColor;
#endif

#include<clipPlaneVertexDeclaration>

#include<logDepthDeclaration>
#include<fogVertexDeclaration>
#include<__decl__lightFragment>[0..maxSimultaneousLights]


#define CUSTOM_VERTEX_DEFINITIONS

void main(void)
{

#define CUSTOM_VERTEX_MAIN_BEGIN

	#include<instancesVertex>
    #include<bonesVertex>
    #include<bakedVertexAnimation>

	vec4 worldPos = finalWorld * vec4(position, 1.0);

	gl_Position = viewProjection * worldPos;

	vPositionW = vec3(worldPos);

#ifdef DIFFUSEX
	vTextureUVX = worldPos.zy / tileSize;
#endif

#ifdef DIFFUSEY
	vTextureUVY = worldPos.xz / tileSize;
#endif

#ifdef DIFFUSEZ
	vTextureUVZ = worldPos.xy / tileSize;
#endif

#ifdef NORMAL
	// Compute tangent space (used for normal mapping + tri planar color mapping)
	vec3 xtan = vec3(0,0,1);//tangent space for the X aligned plane
   	vec3 xbin = vec3(0,1,0);
   
   	vec3 ytan = vec3(1,0,0);//tangent space for the Y aligned plane
   	vec3 ybin = vec3(0,0,1);
   
   	vec3 ztan = vec3(1,0,0);//tangent space for the Z aligned plane
   	vec3 zbin = vec3(0,1,0);
	   
	vec3 normalizedNormal = normalize(normal);
   	normalizedNormal *= normalizedNormal;

	vec3 worldBinormal = normalize(xbin * normalizedNormal.x + ybin * normalizedNormal.y + zbin * normalizedNormal.z);
   	vec3 worldTangent = normalize(xtan * normalizedNormal.x + ytan * normalizedNormal.y + ztan * normalizedNormal.z);
	   
	mat3 normalWorld = mat3(world);

	#ifdef NONUNIFORMSCALING
		normalWorld = transposeMat3(inverseMat3(normalWorld));
	#endif

	worldTangent = normalize((normalWorld * worldTangent).xyz);
    worldBinormal = normalize((normalWorld * worldBinormal).xyz);
	vec3 worldNormal = normalize((normalWorld * normalize(normal)).xyz);

	tangentSpace[0] = worldTangent;
    tangentSpace[1] = worldBinormal;
    tangentSpace[2] = worldNormal;
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

	// Point size
#if defined(POINTSIZE) && !defined(WEBGPU)
	gl_PointSize = pointSize;
#endif

#define CUSTOM_VERTEX_MAIN_END
}
