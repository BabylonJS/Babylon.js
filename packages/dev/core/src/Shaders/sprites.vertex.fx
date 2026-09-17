// Attributes
attribute vec4 position;
attribute vec2 options;
attribute vec2 offsets;
attribute vec2 inverts;
attribute vec4 cellInfo;
attribute vec4 color;

// Uniforms
uniform mat4 view;
uniform mat4 projection;
#ifdef PREPASS
uniform mat4 invView;
uniform vec2 cameraInfo;
uniform float spriteNormalSign;
#endif
#if defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)
attribute vec4 previousPosition;
attribute vec2 previousOptions;
uniform mat4 previousView;
uniform mat4 previousProjection;
#endif

// Output
varying vec2 vUV;
varying vec4 vColor;
#ifdef PREPASS
varying vec3 vPositionW;
varying vec3 vPosition;
varying vec3 vViewPos;
varying float vNormViewDepth;
varying vec3 vNormalV;
varying vec3 vNormalW;
#endif
#if defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)
varying vec4 vCurrentPosition;
varying vec4 vPreviousPosition;
#endif

#include<fogVertexDeclaration>
#include<logDepthDeclaration>


#define CUSTOM_VERTEX_DEFINITIONS

void main(void) {

#define CUSTOM_VERTEX_MAIN_BEGIN
	
	vec3 viewPos = (view * vec4(position.xyz, 1.0)).xyz; 
	vec2 cornerPos;
	
	float angle = position.w;
	vec2 size = vec2(options.x, options.y);
	vec2 offset = offsets.xy;

	cornerPos = vec2(offset.x - 0.5, offset.y  - 0.5) * size;

	// Rotate
	vec3 rotatedCorner;
	rotatedCorner.x = cornerPos.x * cos(angle) - cornerPos.y * sin(angle);
	rotatedCorner.y = cornerPos.x * sin(angle) + cornerPos.y * cos(angle);
	rotatedCorner.z = 0.;

	// Position
	viewPos += rotatedCorner;
	gl_Position = projection * vec4(viewPos, 1.0);   

#ifdef PREPASS
	vec4 worldPos = invView * vec4(viewPos, 1.0);
	vec3 normalV = vec3(0.0, 0.0, spriteNormalSign);
	vPositionW = worldPos.xyz / worldPos.w;
	// Sprite local position is the angle-rotated billboard-plane offset from the sprite center.
	vPosition = rotatedCorner;
	vViewPos = viewPos;
	vNormViewDepth = (viewPos.z - cameraInfo.x) / (cameraInfo.y - cameraInfo.x);
	vNormalV = normalV;
	vNormalW = normalize((invView * vec4(normalV, 0.0)).xyz);
#endif

#if defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)
	vec3 previousViewPos = (previousView * vec4(previousPosition.xyz, 1.0)).xyz;
	vec2 previousCornerPos = vec2(offset.x - 0.5, offset.y - 0.5) * previousOptions;
	vec3 previousRotatedCorner;
	previousRotatedCorner.x = previousCornerPos.x * cos(previousPosition.w) - previousCornerPos.y * sin(previousPosition.w);
	previousRotatedCorner.y = previousCornerPos.x * sin(previousPosition.w) + previousCornerPos.y * cos(previousPosition.w);
	previousRotatedCorner.z = 0.0;
	previousViewPos += previousRotatedCorner;
	vCurrentPosition = gl_Position;
	vPreviousPosition = previousProjection * vec4(previousViewPos, 1.0);
#endif

	// Color
	vColor = color;
	
	// Texture
	vec2 uvOffset = vec2(abs(offset.x - inverts.x), abs(1.0 - offset.y - inverts.y));
	vec2 uvPlace = cellInfo.xy;
	vec2 uvSize = cellInfo.zw;

	vUV.x = uvPlace.x + uvSize.x * uvOffset.x;
	vUV.y = uvPlace.y + uvSize.y * uvOffset.y;

	// Fog
#ifdef FOG
	vFogDistance = viewPos;
#endif

#include<logDepthVertex>

#define CUSTOM_VERTEX_MAIN_END
}