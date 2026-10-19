// Attributes
attribute position: vec4f;
attribute options: vec2f;
attribute offsets: vec2f;
attribute inverts: vec2f;
attribute cellInfo: vec4f;
attribute color: vec4f;

// Uniforms
uniform view: mat4x4f;
uniform projection: mat4x4f;
#ifdef PREPASS
#if defined(PREPASS_POSITION) || defined(PREPASS_WORLD_NORMAL)
uniform invView: mat4x4f;
#endif
#ifdef PREPASS_NORMALIZED_VIEW_DEPTH
uniform cameraInfo: vec2f;
#endif
#if defined(PREPASS_NORMAL) || defined(PREPASS_WORLD_NORMAL)
uniform spriteNormalSign: f32;
#endif
#endif
#if defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)
attribute previousPosition: vec4f;
attribute previousOptions: vec2f;
uniform previousView: mat4x4f;
uniform previousProjection: mat4x4f;
#endif

// Output
varying vUV: vec2f;
varying vColor: vec4f;
#ifdef PREPASS
#ifdef PREPASS_POSITION
varying vPositionW: vec3f;
#endif
#ifdef PREPASS_LOCAL_POSITION
varying vPosition: vec3f;
#endif
#ifdef PREPASS_DEPTH
varying vViewPos: vec3f;
#endif
#ifdef PREPASS_NORMALIZED_VIEW_DEPTH
varying vNormViewDepth: f32;
#endif
#ifdef PREPASS_NORMAL
varying vNormalV: vec3f;
#endif
#ifdef PREPASS_WORLD_NORMAL
varying vNormalW: vec3f;
#endif
#endif
#if defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)
varying vCurrentPosition: vec4f;
varying vPreviousPosition: vec4f;
#endif

#include<fogVertexDeclaration>
#include<logDepthDeclaration>


#define CUSTOM_VERTEX_DEFINITIONS

@vertex
fn main(input : VertexInputs) -> FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN
	
	var viewPos: vec3f = (uniforms.view *  vec4f(vertexInputs.position.xyz, 1.0)).xyz; 
	var cornerPos: vec2f;
	
	var angle: f32 = vertexInputs.position.w;
	var size: vec2f =  vec2f(vertexInputs.options.x, vertexInputs.options.y);
	var offset: vec2f = vertexInputs.offsets.xy;

	cornerPos =  vec2f(offset.x - 0.5, offset.y  - 0.5) * size;

	// Rotate
	var rotatedCorner: vec3f;
	rotatedCorner.x = cornerPos.x * cos(angle) - cornerPos.y * sin(angle);
	rotatedCorner.y = cornerPos.x * sin(angle) + cornerPos.y * cos(angle);
	rotatedCorner.z = 0.;

	// Position
	viewPos += rotatedCorner;
	vertexOutputs.position = uniforms.projection * vec4f(viewPos, 1.0);   

#ifdef PREPASS
	#ifdef PREPASS_POSITION
	var worldPos: vec4f = uniforms.invView * vec4f(viewPos, 1.0);
	vertexOutputs.vPositionW = worldPos.xyz / worldPos.w;
	#endif
	#ifdef PREPASS_LOCAL_POSITION
	// Sprite local position is the angle-rotated billboard-plane offset from the sprite center.
	vertexOutputs.vPosition = rotatedCorner;
	#endif
	#ifdef PREPASS_DEPTH
	vertexOutputs.vViewPos = viewPos;
	#endif
	#ifdef PREPASS_NORMALIZED_VIEW_DEPTH
	vertexOutputs.vNormViewDepth = (viewPos.z - uniforms.cameraInfo.x) / (uniforms.cameraInfo.y - uniforms.cameraInfo.x);
	#endif
	#ifdef PREPASS_NORMAL
	vertexOutputs.vNormalV = vec3f(0.0, 0.0, uniforms.spriteNormalSign);
	#endif
	#ifdef PREPASS_WORLD_NORMAL
	vertexOutputs.vNormalW = normalize((uniforms.invView * vec4f(0.0, 0.0, uniforms.spriteNormalSign, 0.0)).xyz);
	#endif
#endif

#if defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)
	var previousViewPos: vec3f = (uniforms.previousView * vec4f(vertexInputs.previousPosition.xyz, 1.0)).xyz;
	var previousCornerPos: vec2f = vec2f(offset.x - 0.5, offset.y - 0.5) * vertexInputs.previousOptions;
	var previousRotatedCorner: vec3f;
	previousRotatedCorner.x = previousCornerPos.x * cos(vertexInputs.previousPosition.w) - previousCornerPos.y * sin(vertexInputs.previousPosition.w);
	previousRotatedCorner.y = previousCornerPos.x * sin(vertexInputs.previousPosition.w) + previousCornerPos.y * cos(vertexInputs.previousPosition.w);
	previousRotatedCorner.z = 0.0;
	previousViewPos += previousRotatedCorner;
	vertexOutputs.vCurrentPosition = vertexOutputs.position;
	vertexOutputs.vPreviousPosition = uniforms.previousProjection * vec4f(previousViewPos, 1.0);
#endif

	// Color
	vertexOutputs.vColor = vertexInputs.color;
	
	// Texture
	var uvOffset: vec2f =  vec2f(abs(offset.x - vertexInputs.inverts.x), abs(1.0 - offset.y - vertexInputs.inverts.y));
	var uvPlace: vec2f = vertexInputs.cellInfo.xy;
	var uvSize: vec2f = vertexInputs.cellInfo.zw;

	vertexOutputs.vUV.x = uvPlace.x + uvSize.x * uvOffset.x;
	vertexOutputs.vUV.y = uvPlace.y + uvSize.y * uvOffset.y;

	// Fog
#ifdef FOG
	vertexOutputs.vFogDistance = viewPos;
#endif

#include<logDepthVertex>

#define CUSTOM_VERTEX_MAIN_END
}