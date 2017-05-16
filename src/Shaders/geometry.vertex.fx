#version 300 es

precision highp float;
precision highp int;

#include<bonesDeclaration>
#include<instancesDeclaration>

in vec3 position;
in vec3 normal;

#if defined(ALPHATEST) || defined(NEED_UV)
out vec2 vUV;
uniform mat4 diffuseMatrix;
#ifdef UV1
in vec2 uv;
#endif
#ifdef UV2
in vec2 uv2;
#endif
#endif

// Uniform
uniform mat4 viewProjection;
uniform mat4 view;

out vec3 vNormalV;

void main(void)
{
#include<instancesVertex>

#include<bonesVertex>

	vNormalV = normalize(vec3((view * finalWorld) * vec4(normal, 0.0)));
	gl_Position = viewProjection * finalWorld * vec4(position, 1.0);

#if defined(ALPHATEST) || defined(BASIC_RENDER)
#ifdef UV1
	vUV = vec2(diffuseMatrix * vec4(uv, 1.0, 0.0));
#endif
#ifdef UV2
	vUV = vec2(diffuseMatrix * vec4(uv2, 1.0, 0.0));
#endif
#endif
}