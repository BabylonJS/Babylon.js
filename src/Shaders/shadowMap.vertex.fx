// Attribute
attribute vec3 position;

#include<bonesDeclaration>

// Uniforms
#include<instancesDeclaration>

uniform mat4 viewProjection;

varying vec4 vPosition;

#ifdef ALPHATEST
varying vec2 vUV;
uniform mat4 diffuseMatrix;
#ifdef UV1
attribute vec2 uv;
#endif
#ifdef UV2
attribute vec2 uv2;
#endif
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
#ifdef UV1
	vUV = vec2(diffuseMatrix * vec4(uv, 1.0, 0.0));
#endif
#ifdef UV2
	vUV = vec2(diffuseMatrix * vec4(uv2, 1.0, 0.0));
#endif
#endif
}