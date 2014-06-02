#ifdef GL_ES
precision mediump float;
#endif

// Attribute
attribute vec3 position;
#ifdef BONES
attribute vec4 matricesIndices;
attribute vec4 matricesWeights;
#endif

// Uniform
#ifdef INSTANCES
attribute mat4 world;
#else
uniform mat4 world;
#endif

uniform mat4 viewProjection;
#ifdef BONES
uniform mat4 mBones[BonesPerMesh];
#endif

#ifndef VSM
varying vec4 vPosition;
#endif

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
#ifdef BONES
	mat4 m0 = mBones[int(matricesIndices.x)] * matricesWeights.x;
	mat4 m1 = mBones[int(matricesIndices.y)] * matricesWeights.y;
	mat4 m2 = mBones[int(matricesIndices.z)] * matricesWeights.z;
	mat4 m3 = mBones[int(matricesIndices.w)] * matricesWeights.w;
	mat4 finalWorld = world * (m0 + m1 + m2 + m3);
	gl_Position = viewProjection * finalWorld * vec4(position, 1.0);
#else
#ifndef VSM
	vPosition = viewProjection * world * vec4(position, 1.0);
#endif
	gl_Position = viewProjection * world * vec4(position, 1.0);
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