// Attributes
attribute position: vec3f;
attribute color: vec4f;
attribute angle: f32;
attribute size: vec2f;
#ifdef ANIMATESHEET
attribute cellIndex: f32;
#endif
#ifndef BILLBOARD
attribute direction: vec3f;
#endif
#ifdef BILLBOARDSTRETCHED
attribute direction: vec3f;
#endif
#ifdef RAMPGRADIENT
attribute remapData: vec4f;
#endif
attribute offset: vec2f;

// Uniforms
uniform view: mat4x4f;
uniform projection: mat4x4f;
uniform translationPivot: vec2f;

#ifdef ANIMATESHEET
uniform particlesInfos: vec3f; // x (number of rows) y(number of columns) z(rowSize)
#endif

// Output
varying vUV: vec2f;
varying vColor: vec4f;
varying vPositionW: vec3f;

#ifdef RAMPGRADIENT
varying remapRanges: vec4f;
#endif

#if defined(BILLBOARD) && !defined(BILLBOARDY) && !defined(BILLBOARDSTRETCHED)
uniform invView: mat4x4f;
#endif
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#include<logDepthDeclaration>

#ifdef BILLBOARD
	uniform eyePosition: vec3f;
#endif

fn rotate(yaxis: vec3f, rotatedCorner: vec3f) -> vec3f {
	var xaxis: vec3f = normalize(cross( vec3f(0., 1.0, 0.), yaxis));
	var zaxis: vec3f = normalize(cross(yaxis, xaxis));

	var row0: vec3f =  vec3f(xaxis.x, xaxis.y, xaxis.z);
	var row1: vec3f =  vec3f(yaxis.x, yaxis.y, yaxis.z);
	var row2: vec3f =  vec3f(zaxis.x, zaxis.y, zaxis.z);

	var rotMatrix: mat3x3f =  mat3x3f(row0, row1, row2);

	var alignedCorner: vec3f = rotMatrix * rotatedCorner;
	return vertexInputs.position + alignedCorner;
}

#ifdef BILLBOARDSTRETCHED
fn rotateAlign(toCamera: vec3f, rotatedCorner: vec3f) -> vec3f {
	var normalizedToCamera: vec3f = normalize(toCamera);
	var normalizedCrossDirToCamera: vec3f = normalize(cross(normalize(vertexInputs.direction), normalizedToCamera));

	var row0: vec3f =  vec3f(normalizedCrossDirToCamera.x, normalizedCrossDirToCamera.y, normalizedCrossDirToCamera.z);
	var row2: vec3f =  vec3f(normalizedToCamera.x, normalizedToCamera.y, normalizedToCamera.z);

#ifdef BILLBOARDSTRETCHED_LOCAL
	var row1: vec3f = vertexInputs.direction;
#else
	var crossProduct: vec3f = normalize(cross(normalizedToCamera, normalizedCrossDirToCamera));
	var row1: vec3f =  vec3f(crossProduct.x, crossProduct.y, crossProduct.z);
#endif

	var rotMatrix: mat3x3f =   mat3x3f(row0, row1, row2);

	var alignedCorner: vec3f = rotMatrix * rotatedCorner;
	return input.position + alignedCorner;
}
#endif


#define CUSTOM_VERTEX_DEFINITIONS

@vertex
fn main(input : VertexInputs) -> FragmentInputs {

#define CUSTOM_VERTEX_MAIN_BEGIN

	var cornerPos: vec2f;

	cornerPos = ( vec2f(input.offset.x - 0.5, input.offset.y  - 0.5) - uniforms.translationPivot) * input.size;

#ifdef BILLBOARD
	// Rotate
	var rotatedCorner: vec3f;

#ifdef BILLBOARDY
	rotatedCorner.x = cornerPos.x * cos(input.angle) - cornerPos.y * sin(input.angle) + uniforms.translationPivot.x;
	rotatedCorner.z = cornerPos.x * sin(input.angle) + cornerPos.y * cos(input.angle) + uniforms.translationPivot.y;
	rotatedCorner.y = 0.;

	var yaxis: vec3f = input.position - uniforms.eyePosition;
	yaxis.y = 0.;

	vertexOutputs.vPositionW = rotate(normalize(yaxis), rotatedCorner);

	var viewPos: vec3f = (uniforms.view *  vec4f(vertexOutputs.vPositionW, 1.0)).xyz;
#elif defined(BILLBOARDSTRETCHED)
	rotatedCorner.x = cornerPos.x * cos(input.angle) - cornerPos.y * sin(input.angle) + uniforms.translationPivot.x;
	rotatedCorner.y = cornerPos.x * sin(input.angle) + cornerPos.y * cos(input.angle) + uniforms.translationPivot.y;
	rotatedCorner.z = 0.;

	var toCamera: vec3f = input.position - uniforms.eyePosition;
	vertexOutputs.vPositionW = rotateAlign(toCamera, rotatedCorner);

	var viewPos: vec3f = (uniforms.view *  vec4f(vertexOutputs.vPositionW, 1.0)).xyz;
#else
	rotatedCorner.x = cornerPos.x * cos(input.angle) - cornerPos.y * sin(input.angle) + uniforms.translationPivot.x;
	rotatedCorner.y = cornerPos.x * sin(input.angle) + cornerPos.y * cos(input.angle) + uniforms.translationPivot.y;
	rotatedCorner.z = 0.;

	var viewPos: vec3f = (uniforms.view *  vec4f(input.position, 1.0)).xyz + rotatedCorner;

    vertexOutputs.vPositionW = (uniforms.invView *  vec4f(viewPos, 1)).xyz;
#endif

#ifdef RAMPGRADIENT
	vertexOutputs.remapRanges = input.remapData;
#endif

	// Position
	vertexOutputs.position = uniforms.projection *  vec4f(viewPos, 1.0);
#else
	// Rotate
	var rotatedCorner: vec3f;
	rotatedCorner.x = cornerPos.x * cos(input.angle) - cornerPos.y * sin(input.angle) + uniforms.translationPivot.x;
	rotatedCorner.z = cornerPos.x * sin(input.angle) + cornerPos.y * cos(input.angle) + uniforms.translationPivot.y;
	rotatedCorner.y = 0.;

	var yaxis: vec3f = normalize(vertexInputs.direction);
	vertexOutputs.vPositionW = rotate(yaxis, rotatedCorner);

	vertexOutputs.position = uniforms.projection * uniforms.view *  vec4f(vertexOutputs.vPositionW, 1.0);
#endif
	vertexOutputs.vColor = input.color;

	#ifdef ANIMATESHEET
		var rowOffset: f32 = floor(input.cellIndex * uniforms.particlesInfos.z);
		var columnOffset: f32 = input.cellIndex - rowOffset / uniforms.particlesInfos.z;

		var uvScale: vec2f = uniforms.particlesInfos.xy;
		var uvOffset: vec2f =  vec2f(input.offset.x , 1.0 - input.offset.y);
		vertexOutputs.vUV = (uvOffset +  vec2f(columnOffset, rowOffset)) * uvScale;
	#else
		vertexOutputs.vUV = input.offset;
	#endif

	// Clip plane
#if defined(CLIPPLANE) || defined(CLIPPLANE2) || defined(CLIPPLANE3) || defined(CLIPPLANE4) || defined(CLIPPLANE5) || defined(CLIPPLANE6) || defined(FOG)
    var worldPos: vec4f =  vec4f(vertexOutputs.vPositionW, 1.0);
#endif
	#include<clipPlaneVertex>
	#include<fogVertex>
	#include<logDepthVertex>
	
#define CUSTOM_VERTEX_MAIN_END

}