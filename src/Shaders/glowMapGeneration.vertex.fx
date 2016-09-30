// Attribute
attribute vec3 position;

#include<bonesDeclaration>

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

#ifdef ALPHATEST
	varying vec2 vUVDiffuse;
	uniform mat4 diffuseMatrix;
#endif

#ifdef EMISSIVE
	varying vec2 vUVEmissive;
	uniform mat4 emissiveMatrix;
#endif

void main(void)
{
#include<instancesVertex>
#include<bonesVertex>

#ifdef CUBEMAP
	vPosition = finalWorld * vec4(position, 1.0);
	gl_Position = viewProjection * finalWorld * vec4(position, 1.0);
#else
	vPosition = viewProjection * finalWorld * vec4(position, 1.0);
	gl_Position = vPosition;
#endif

#ifdef ALPHATEST
	#ifdef DIFFUSEUV1
		vUVDiffuse = vec2(diffuseMatrix * vec4(uv, 1.0, 0.0));
	#endif
	#ifdef DIFFUSEUV2
		vUVDiffuse = vec2(diffuseMatrix * vec4(uv2, 1.0, 0.0));
	#endif
#endif

#ifdef EMISSIVE
	#ifdef EMISSIVEUV1
		vUVEmissive = vec2(emissiveMatrix * vec4(uv, 1.0, 0.0));
	#endif
	#ifdef EMISSIVEUV2
		vUVEmissive = vec2(emissiveMatrix * vec4(uv2, 1.0, 0.0));
	#endif
#endif
}