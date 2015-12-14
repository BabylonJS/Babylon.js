precision highp float;

// Attributes
attribute vec3 position;
#ifdef NORMAL
attribute vec3 normal;
#endif
#ifdef VERTEXCOLOR
attribute vec4 color;
#endif
#ifdef BONES
attribute vec4 matricesIndices;
attribute vec4 matricesWeights;
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

#ifdef BONES
uniform mat4 mBones[BonesPerMesh];
#endif

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

#ifdef CLIPPLANE
uniform vec4 vClipPlane;
varying float fClipDistance;
#endif

#ifdef FOG
varying float fFogDistance;
#endif

#ifdef SHADOWS
#if defined(SPOTLIGHT0) || defined(DIRLIGHT0)
uniform mat4 lightMatrix0;
varying vec4 vPositionFromLight0;
#endif
#if defined(SPOTLIGHT1) || defined(DIRLIGHT1)
uniform mat4 lightMatrix1;
varying vec4 vPositionFromLight1;
#endif
#if defined(SPOTLIGHT2) || defined(DIRLIGHT2)
uniform mat4 lightMatrix2;
varying vec4 vPositionFromLight2;
#endif
#if defined(SPOTLIGHT3) || defined(DIRLIGHT3)
uniform mat4 lightMatrix3;
varying vec4 vPositionFromLight3;
#endif
#endif

void main(void) {
	mat4 finalWorld;

#ifdef INSTANCES
	finalWorld = mat4(world0, world1, world2, world3);
#else
	finalWorld = world;
#endif

#ifdef BONES
	mat4 m0 = mBones[int(matricesIndices.x)] * matricesWeights.x;
	mat4 m1 = mBones[int(matricesIndices.y)] * matricesWeights.y;
	mat4 m2 = mBones[int(matricesIndices.z)] * matricesWeights.z;

#ifdef BONES4
	mat4 m3 = mBones[int(matricesIndices.w)] * matricesWeights.w;
	finalWorld = finalWorld * (m0 + m1 + m2 + m3);
#else
	finalWorld = finalWorld * (m0 + m1 + m2);
#endif 

#endif
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
#ifdef CLIPPLANE
	fClipDistance = dot(worldPos, vClipPlane);
#endif

	// Fog
#ifdef FOG
	fFogDistance = (view * worldPos).z;
#endif

	// Shadows
#ifdef SHADOWS
#if defined(SPOTLIGHT0) || defined(DIRLIGHT0)
	vPositionFromLight0 = lightMatrix0 * worldPos;
#endif
#if defined(SPOTLIGHT1) || defined(DIRLIGHT1)
	vPositionFromLight1 = lightMatrix1 * worldPos;
#endif
#if defined(SPOTLIGHT2) || defined(DIRLIGHT2)
	vPositionFromLight2 = lightMatrix2 * worldPos;
#endif
#if defined(SPOTLIGHT3) || defined(DIRLIGHT3)
	vPositionFromLight3 = lightMatrix3 * worldPos;
#endif
#endif

	// Vertex color
#ifdef VERTEXCOLOR
	vColor = color;
#endif

	// Point size
#ifdef POINTSIZE
	gl_PointSize = pointSize;
#endif
}
