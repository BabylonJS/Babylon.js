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
#ifdef POSITIONW_AS_VARYING
varying vPositionW: vec3f;
#endif

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
	var row1: vec3f = normalize(vertexInputs.direction);
#else
	var crossProduct: vec3f = normalize(cross(normalizedToCamera, normalizedCrossDirToCamera));
	var row1: vec3f =  vec3f(crossProduct.x, crossProduct.y, crossProduct.z);
#endif

	var rotMatrix: mat3x3f =   mat3x3f(row0, row1, row2);

	var alignedCorner: vec3f = rotMatrix * rotatedCorner;
	return vertexInputs.position + alignedCorner;
}
#endif


#define CUSTOM_VERTEX_DEFINITIONS

@vertex
fn main(input : VertexInputs) -> FragmentInputs {

#define CUSTOM_VERTEX_MAIN_BEGIN

	var cornerPos: vec2f;
	var vPositionW: vec3f;

	cornerPos = ( vec2f(vertexInputs.offset.x - 0.5, vertexInputs.offset.y  - 0.5) - uniforms.translationPivot) * vertexInputs.size;

#ifdef BILLBOARD
	// Rotate
	var rotatedCorner: vec3f;

#ifdef BILLBOARDY
	rotatedCorner.x = cornerPos.x * cos(vertexInputs.angle) - cornerPos.y * sin(vertexInputs.angle) + uniforms.translationPivot.x;
	rotatedCorner.z = cornerPos.x * sin(vertexInputs.angle) + cornerPos.y * cos(vertexInputs.angle) + uniforms.translationPivot.y;
	rotatedCorner.y = 0.;

	var yaxis: vec3f = vertexInputs.position - uniforms.eyePosition;
	yaxis.y = 0.;

	vPositionW = rotate(normalize(yaxis), rotatedCorner);

	var viewPos: vec3f = (uniforms.view *  vec4f(vPositionW, 1.0)).xyz;
#elif defined(BILLBOARDSTRETCHED)
	rotatedCorner.x = cornerPos.x * cos(vertexInputs.angle) - cornerPos.y * sin(vertexInputs.angle) + uniforms.translationPivot.x;
	rotatedCorner.y = cornerPos.x * sin(vertexInputs.angle) + cornerPos.y * cos(vertexInputs.angle) + uniforms.translationPivot.y;
	rotatedCorner.z = 0.;

	var toCamera: vec3f = vertexInputs.position - uniforms.eyePosition;
	vPositionW = rotateAlign(toCamera, rotatedCorner);

	var viewPos: vec3f = (uniforms.view *  vec4f(vPositionW, 1.0)).xyz;
#else
	rotatedCorner.x = cornerPos.x * cos(vertexInputs.angle) - cornerPos.y * sin(vertexInputs.angle) + uniforms.translationPivot.x;
	rotatedCorner.y = cornerPos.x * sin(vertexInputs.angle) + cornerPos.y * cos(vertexInputs.angle) + uniforms.translationPivot.y;
	rotatedCorner.z = 0.;

	var viewPos: vec3f = (uniforms.view *  vec4f(vertexInputs.position, 1.0)).xyz + rotatedCorner;

    vPositionW = (uniforms.invView *  vec4f(viewPos, 1)).xyz;
#endif

#ifdef RAMPGRADIENT
	vertexOutputs.remapRanges = vertexInputs.remapData;
#endif

	// Position
	vertexOutputs.position = uniforms.projection *  vec4f(viewPos, 1.0);
#else
	// Rotate
	var rotatedCorner: vec3f;
	rotatedCorner.x = cornerPos.x * cos(vertexInputs.angle) - cornerPos.y * sin(vertexInputs.angle) + uniforms.translationPivot.x;
	rotatedCorner.z = cornerPos.x * sin(vertexInputs.angle) + cornerPos.y * cos(vertexInputs.angle) + uniforms.translationPivot.y;
	rotatedCorner.y = 0.;

	var yaxis: vec3f = normalize(vertexInputs.direction);
	vPositionW = rotate(yaxis, rotatedCorner);

	vertexOutputs.position = uniforms.projection * uniforms.view *  vec4f(vPositionW, 1.0);
#endif
	vertexOutputs.vColor = vertexInputs.color;

	#ifdef ANIMATESHEET
		var rowOffset: f32 = floor(vertexInputs.cellIndex * uniforms.particlesInfos.z);
		var columnOffset: f32 = vertexInputs.cellIndex - rowOffset / uniforms.particlesInfos.z;

		var uvScale: vec2f = uniforms.particlesInfos.xy;
		var uvOffset: vec2f =  vec2f(vertexInputs.offset.x , 1.0 - vertexInputs.offset.y);
		vertexOutputs.vUV = (uvOffset +  vec2f(columnOffset, rowOffset)) * uvScale;
	#else
		vertexOutputs.vUV = vertexInputs.offset;
	#endif

	// Clip plane
#if defined(CLIPPLANE) || defined(CLIPPLANE2) || defined(CLIPPLANE3) || defined(CLIPPLANE4) || defined(CLIPPLANE5) || defined(CLIPPLANE6) || defined(FOG)
    var worldPos: vec4f =  vec4f(vPositionW, 1.0);
#endif
#ifdef POSITIONW_AS_VARYING
	vertexOutputs.vPositionW = vPositionW;
#endif
	#include<clipPlaneVertex>
	#include<fogVertex>
	#include<logDepthVertex>
	
#define CUSTOM_VERTEX_MAIN_END

}