// Attribute
attribute vec3 position;

#include<bonesDeclaration>

#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]

// Uniforms
#include<instancesDeclaration>

uniform mat4 viewProjection;

varying vec4 vPosition;

#ifdef UV1
attribute vec2 uv;
#endif

#ifdef UV2
attribute vec2 uv2;
#endif

#ifdef DIFFUSE
	varying vec2 vUVDiffuse;
	uniform mat4 diffuseMatrix;
#endif

#ifdef OPACITY
	varying vec2 vUVOpacity;
	uniform mat4 opacityMatrix;
#endif

#ifdef EMISSIVE
	varying vec2 vUVEmissive;
	uniform mat4 emissiveMatrix;
#endif

#ifdef VERTEXALPHA
	attribute vec4 color;
	varying vec4 vColor;
#endif

void main(void)
{
	vec3 positionUpdated = position;
#ifdef UV1
    vec2 uvUpdated = uv;
#endif

#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]

#include<instancesVertex>
#include<bonesVertex>

#ifdef CUBEMAP
	vPosition = finalWorld * vec4(positionUpdated, 1.0);
	gl_Position = viewProjection * finalWorld * vec4(position, 1.0);
#else
	vPosition = viewProjection * finalWorld * vec4(positionUpdated, 1.0);
	gl_Position = vPosition;
#endif

#ifdef DIFFUSE
	#ifdef DIFFUSEUV1
		vUVDiffuse = vec2(diffuseMatrix * vec4(uvUpdated, 1.0, 0.0));
	#endif
	#ifdef DIFFUSEUV2
		vUVDiffuse = vec2(diffuseMatrix * vec4(uv2, 1.0, 0.0));
	#endif
#endif

#ifdef OPACITY
	#ifdef OPACITYUV1
		vUVOpacity = vec2(opacityMatrix * vec4(uvUpdated, 1.0, 0.0));
	#endif
	#ifdef OPACITYUV2
		vUVOpacity = vec2(opacityMatrix * vec4(uv2, 1.0, 0.0));
	#endif
#endif

#ifdef EMISSIVE
	#ifdef EMISSIVEUV1
		vUVEmissive = vec2(emissiveMatrix * vec4(uvUpdated, 1.0, 0.0));
	#endif
	#ifdef EMISSIVEUV2
		vUVEmissive = vec2(emissiveMatrix * vec4(uv2, 1.0, 0.0));
	#endif
#endif

#ifdef VERTEXALPHA
    vColor = color;
#endif
}