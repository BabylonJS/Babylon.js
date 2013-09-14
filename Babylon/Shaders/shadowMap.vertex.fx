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
#ifdef BONES
uniform mat4 world;
uniform mat4 mBones[BonesPerMesh];
uniform mat4 viewProjection;
#else
uniform mat4 worldViewProjection;
#endif

void main(void)
{
#ifdef BONES
	mat4 m0 = mBones[int(matricesIndices.x)] * matricesWeights.x;
	mat4 m1 = mBones[int(matricesIndices.y)] * matricesWeights.y;
	mat4 m2 = mBones[int(matricesIndices.z)] * matricesWeights.z;
#ifdef IE
	mat4 finalWorld = world * (m0 + m1 + m2);
#else
	mat4 m3 = mBones[int(matricesIndices.w)] * matricesWeights.w;
	mat4 finalWorld = world * (m0 + m1 + m2 + m3);
#endif
	gl_Position = viewProjection * finalWorld * vec4(position, 1.0);
#else
	gl_Position = worldViewProjection * vec4(position, 1.0);
#endif
}