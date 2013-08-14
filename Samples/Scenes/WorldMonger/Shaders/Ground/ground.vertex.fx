#ifdef GL_ES
precision mediump float;
#endif

// Attributes
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

// Uniforms
uniform mat4 world;
uniform mat4 worldViewProjection;

// UVs
varying vec4 vGroundSnowUV;
varying vec4 vGrassBlendUV;
varying vec4 vRockSandUV;

// Ground
uniform mat4 groundMatrix;

// Snow
uniform mat4 snowMatrix;

// Rock
uniform mat4 rockMatrix;

// Sand
uniform mat4 sandMatrix;

// Grass
uniform mat4 grassMatrix;

// Blend
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

	vGroundSnowUV.xy = vec2(groundMatrix * vec4(uv, 1.0, 0.0));
	vGroundSnowUV.zw = vec2(snowMatrix * vec4(uv, 1.0, 0.0));
	vRockSandUV.xy = vec2(rockMatrix * vec4(uv, 1.0, 0.0));
	vRockSandUV.zw = vec2(sandMatrix * vec4(uv, 1.0, 0.0));
	vGrassBlendUV.xy = vec2(grassMatrix * vec4(uv, 1.0, 0.0));
	vGrassBlendUV.zw = vec2(blendMatrix * vec4(uv, 1.0, 0.0));

	// Clip plane
#ifdef CLIPPLANE
	fClipDistance = dot(worldPos, vClipPlane);
#endif
}