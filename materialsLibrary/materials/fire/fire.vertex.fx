precision highp float;

// Attributes
attribute vec3 position;
#ifdef NORMAL
attribute vec3 normal;
#endif
#ifdef UV1
attribute vec2 uv;
#endif
#ifdef UV2
attribute vec2 uv2;
#endif
#ifdef VERTEXCOLOR
attribute vec4 color;
#endif

// Uniforms

#ifdef INSTANCES
attribute vec4 world0;
attribute vec4 world1;
attribute vec4 world2;
attribute vec4 world3;
#else
uniform mat4 world;
#endif

uniform mat4 view;
uniform mat4 viewProjection;

#ifdef DIFFUSE
varying vec2 vDiffuseUV;
#endif

#if NUM_BONE_INFLUENCERS > 0
	uniform mat4 mBones[BonesPerMesh];

	attribute vec4 matricesIndices;
	attribute vec4 matricesWeights;
	#if NUM_BONE_INFLUENCERS > 4
		attribute vec4 matricesIndicesExtra;
		attribute vec4 matricesWeightsExtra;
	#endif
#endif

#ifdef POINTSIZE
uniform float pointSize;
#endif

// Output
varying vec3 vPositionW;
#ifdef NORMAL
varying vec3 vNormalW;
#endif

#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif

#ifdef CLIPPLANE
uniform vec4 vClipPlane;
varying float fClipDistance;
#endif

#ifdef FOG
varying float fFogDistance;
#endif

// Fire
uniform float time;
uniform float speed;

varying vec2 vDistortionCoords1;
varying vec2 vDistortionCoords2;
varying vec2 vDistortionCoords3;

void main(void) {
	mat4 finalWorld;

#ifdef INSTANCES
	finalWorld = mat4(world0, world1, world2, world3);
#else
	finalWorld = world;
#endif

#if NUM_BONE_INFLUENCERS > 0
	mat4 influence;
	influence = mBones[int(matricesIndices[0])] * matricesWeights[0];

	#if NUM_BONE_INFLUENCERS > 1
		influence += mBones[int(matricesIndices[1])] * matricesWeights[1];
	#endif 
	#if NUM_BONE_INFLUENCERS > 2
		influence += mBones[int(matricesIndices[2])] * matricesWeights[2];
	#endif	
	#if NUM_BONE_INFLUENCERS > 3
		influence += mBones[int(matricesIndices[3])] * matricesWeights[3];
	#endif	

	#if NUM_BONE_INFLUENCERS > 4
		influence += mBones[int(matricesIndicesExtra[0])] * matricesWeightsExtra[0];
	#endif
	#if NUM_BONE_INFLUENCERS > 5
		influence += mBones[int(matricesIndicesExtra[1])] * matricesWeightsExtra[1];
	#endif	
	#if NUM_BONE_INFLUENCERS > 6
		influence += mBones[int(matricesIndicesExtra[2])] * matricesWeightsExtra[2];
	#endif	
	#if NUM_BONE_INFLUENCERS > 7
		influence += mBones[int(matricesIndicesExtra[3])] * matricesWeightsExtra[3];
	#endif	

	finalWorld = finalWorld * influence;
#endif

	gl_Position = viewProjection * finalWorld * vec4(position, 1.0);

	vec4 worldPos = finalWorld * vec4(position, 1.0);
	vPositionW = vec3(worldPos);

#ifdef NORMAL
	vNormalW = normalize(vec3(finalWorld * vec4(normal, 0.0)));
#endif

	// Texture coordinates
#ifdef DIFFUSE
	vDiffuseUV = uv;
	vDiffuseUV.y -= 0.2;
#endif

	// Clip plane
#ifdef CLIPPLANE
	fClipDistance = dot(worldPos, vClipPlane);
#endif

	// Fog
#ifdef FOG
	fFogDistance = (view * worldPos).z;
#endif

	// Vertex color
#ifdef VERTEXCOLOR
	vColor = color;
#endif

	// Point size
#ifdef POINTSIZE
	gl_PointSize = pointSize;
#endif

	// Fire
	vec3 layerSpeed = vec3(-0.2, -0.52, -0.1) * speed;
	
	vDistortionCoords1.x = uv.x;
	vDistortionCoords1.y = uv.y + layerSpeed.x * time / 1000.0;
	
	vDistortionCoords2.x = uv.x;
	vDistortionCoords2.y = uv.y + layerSpeed.y * time / 1000.0;
	
	vDistortionCoords3.x = uv.x;
	vDistortionCoords3.y = uv.y + layerSpeed.z * time / 1000.0;
}
