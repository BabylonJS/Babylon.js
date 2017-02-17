precision highp float;

// Attributes
attribute vec3 position;
#ifdef NORMAL
attribute vec3 normal;
#endif
#ifdef VERTEXCOLOR
attribute vec4 color;
#endif

#include<bonesDeclaration>

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

#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif

#include<clipPlaneVertexDeclaration>

#include<fogVertexDeclaration>
#include<shadowsVertexDeclaration>[0..maxSimultaneousLights]

void main(void)
{

	#include<instancesVertex>
    #include<bonesVertex>
	
	gl_Position = viewProjection * finalWorld * vec4(position, 1.0);

	vec4 worldPos = finalWorld * vec4(position, 1.0);
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
	   
	worldTangent = (world * vec4(worldTangent, 1.0)).xyz;
    worldBinormal = (world * vec4(worldBinormal, 1.0)).xyz;
	vec3 worldNormal = normalize(cross(worldTangent, worldBinormal));

	tangentSpace[0] = worldTangent;
    tangentSpace[1] = worldBinormal;
    tangentSpace[2] = worldNormal;
#endif

	// Clip plane
	#include<clipPlaneVertex>

	// Fog
	#include<fogVertex>

	// Shadows
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
