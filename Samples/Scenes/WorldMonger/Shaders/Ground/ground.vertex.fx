// Attributes
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

// Uniforms
uniform mat4 world;
uniform mat4 worldViewProjection;

// Ground
varying vec2 vGroundUV;
uniform mat4 groundMatrix;

// Snow
varying vec2 vSnowUV;
uniform mat4 snowMatrix;

// Rock
varying vec2 vRockUV;
uniform mat4 rockMatrix;

// Sand
varying vec2 vSandUV;
uniform mat4 sandMatrix;

// Grass
varying vec2 vGrassUV;
uniform mat4 grassMatrix;

// Blend
varying vec2 vBlendUV;
uniform mat4 blendMatrix;

// Normal
varying vec3 vPositionW;
varying vec3 vNormalW;

#ifdef CLIPPLANE
uniform vec4 vClipPlane;
varying float fClipDistance;
#endif

void main(void) {
	gl_Position = worldViewProjection * vec4(position, 1.0);   
	
	vec4 worldPos = world * vec4(position, 1.0);
	vPositionW = vec3(worldPos);
	vNormalW = normalize(vec3(world * vec4(normal, 0.0)));

	vGroundUV = vec2(groundMatrix * vec4(uv, 1.0, 0.0));
	vSnowUV = vec2(snowMatrix * vec4(uv, 1.0, 0.0));
	vRockUV = vec2(rockMatrix * vec4(uv, 1.0, 0.0));
	vSandUV = vec2(sandMatrix * vec4(uv, 1.0, 0.0));
	vGrassUV = vec2(grassMatrix * vec4(uv, 1.0, 0.0));
	vBlendUV = vec2(blendMatrix * vec4(uv, 1.0, 0.0));

	// Clip plane
#ifdef CLIPPLANE
	fClipDistance = dot(worldPos, vClipPlane);
#endif
}