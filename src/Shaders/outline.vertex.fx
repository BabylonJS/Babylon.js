precision highp float;

// Attribute
attribute vec3 position;
attribute vec3 normal;

#include<bonesDeclaration>

// Uniform
uniform float offset;

#include<instancesDeclaration>

uniform mat4 viewProjection;

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
	vec3 offsetPosition = position + normal * offset;

#include<instancesVertex>
#include<bonesVertex>

	gl_Position = viewProjection * finalWorld * vec4(offsetPosition, 1.0);

#ifdef ALPHATEST
#ifdef UV1
	vUV = vec2(diffuseMatrix * vec4(uv, 1.0, 0.0));
#endif
#ifdef UV2
	vUV = vec2(diffuseMatrix * vec4(uv2, 1.0, 0.0));
#endif
#endif
}
