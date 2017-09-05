precision highp float;
precision highp int;

#include<bonesDeclaration>
#include<instancesDeclaration>

attribute vec3 position;
attribute vec3 normal;

#if defined(ALPHATEST) || defined(NEED_UV)
varying vec2 vUV;
uniform mat4 diffuseMatrix;
#ifdef UV1
varying vec2 uv;
#endif
#ifdef UV2
varying vec2 uv2;
#endif
#endif

// Uniform
uniform mat4 viewProjection;
uniform mat4 view;

varying vec3 vNormalV;
varying vec4 vViewPos;

#ifdef POSITION
varying vec3 vPosition;
#endif

void main(void)
{
#include<instancesVertex>

#include<bonesVertex>
	vec4 pos = vec4(finalWorld * vec4(position, 1.0));

	vNormalV = normalize(vec3((view * finalWorld) * vec4(normal, 0.0)));
	vViewPos = view * pos;

	#ifdef POSITION
	vPosition = pos.xyz / pos.w;
	#endif

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