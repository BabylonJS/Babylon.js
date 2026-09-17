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

#ifdef PREPASS
uniform cameraInfo: vec2f;
#ifdef LOCAL
uniform inverseEmitterWM: mat4x4f;
#endif
#ifdef PREPASS_POSITION
varying vGeometryPositionW: vec3f;
#endif
#ifdef PREPASS_WORLD_NORMAL
varying vGeometryNormalW: vec3f;
#endif
#ifdef PREPASS_NORMAL
varying vGeometryNormalV: vec3f;
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
#endif

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

fn stretchedNormal(toCamera: vec3f, stretchDirection: vec3f) -> vec3f {
	let normalizedToCamera: vec3f = normalize(toCamera);
	let normalizedCrossDirToCamera: vec3f = normalize(cross(normalize(stretchDirection), normalizedToCamera));
#ifdef BILLBOARDSTRETCHED_LOCAL
	let row1: vec3f = normalize(stretchDirection);
#else
	let row1: vec3f = normalize(cross(normalizedToCamera, normalizedCrossDirToCamera));
#endif
	return normalize(cross(normalizedCrossDirToCamera, row1));
}
#endif


#define CUSTOM_VERTEX_DEFINITIONS

@vertex
fn main(input : VertexInputs) -> FragmentInputs {

#define CUSTOM_VERTEX_MAIN_BEGIN

	var cornerPos: vec2f;
	var vPositionW: vec3f;
#ifdef PREPASS
	var geometryNormalW: vec3f;
#endif

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
#ifdef PREPASS
	geometryNormalW = normalize(yaxis);
#endif

	var viewPos: vec3f = (uniforms.view *  vec4f(vPositionW, 1.0)).xyz;
#elif defined(BILLBOARDSTRETCHED)
	rotatedCorner.x = cornerPos.x * cos(vertexInputs.angle) - cornerPos.y * sin(vertexInputs.angle) + uniforms.translationPivot.x;
	rotatedCorner.y = cornerPos.x * sin(vertexInputs.angle) + cornerPos.y * cos(vertexInputs.angle) + uniforms.translationPivot.y;
	rotatedCorner.z = 0.;

	var toCamera: vec3f = vertexInputs.position - uniforms.eyePosition;
	vPositionW = rotateAlign(toCamera, rotatedCorner);
#ifdef PREPASS
	geometryNormalW = stretchedNormal(toCamera, vertexInputs.direction);
#endif

	var viewPos: vec3f = (uniforms.view *  vec4f(vPositionW, 1.0)).xyz;
#else
	rotatedCorner.x = cornerPos.x * cos(vertexInputs.angle) - cornerPos.y * sin(vertexInputs.angle) + uniforms.translationPivot.x;
	rotatedCorner.y = cornerPos.x * sin(vertexInputs.angle) + cornerPos.y * cos(vertexInputs.angle) + uniforms.translationPivot.y;
	rotatedCorner.z = 0.;

	var viewPos: vec3f = (uniforms.view *  vec4f(vertexInputs.position, 1.0)).xyz + rotatedCorner;

    vPositionW = (uniforms.invView *  vec4f(viewPos, 1)).xyz;
#ifdef PREPASS
	geometryNormalW = normalize((uniforms.invView * vec4f(0.0, 0.0, 1.0, 0.0)).xyz);
#endif
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
#ifdef PREPASS
	geometryNormalW = yaxis;
#endif

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

#ifdef PREPASS
	let geometryViewPosition: vec4f = uniforms.view * vec4f(vPositionW, 1.0);
#if defined(PREPASS_NORMAL) || defined(PREPASS_WORLD_NORMAL)
	var geometryNormalV = normalize((uniforms.view * vec4f(geometryNormalW, 0.0)).xyz);
	let geometryViewDirection = select(vec3f(0.0, 0.0, geometryViewPosition.z), geometryViewPosition.xyz, uniforms.projection[3][3] == 0.0);
	if (dot(geometryNormalV, geometryViewDirection) > 0.0) {
		geometryNormalV = -geometryNormalV;
		geometryNormalW = -geometryNormalW;
	}
#endif
#ifdef PREPASS_POSITION
	vertexOutputs.vGeometryPositionW = vPositionW;
#endif
#ifdef PREPASS_WORLD_NORMAL
	vertexOutputs.vGeometryNormalW = normalize(geometryNormalW);
#endif
#ifdef PREPASS_NORMAL
	vertexOutputs.vGeometryNormalV = geometryNormalV;
#endif
#ifdef PREPASS_LOCAL_POSITION
	#ifdef LOCAL
		vertexOutputs.vPosition = (uniforms.inverseEmitterWM * vec4f(vPositionW, 1.0)).xyz;
	#else
		vertexOutputs.vPosition = vPositionW;
	#endif
#endif
#ifdef PREPASS_DEPTH
	vertexOutputs.vViewPos = geometryViewPosition.xyz;
#endif
#ifdef PREPASS_NORMALIZED_VIEW_DEPTH
	vertexOutputs.vNormViewDepth = (geometryViewPosition.z - uniforms.cameraInfo.x) / (uniforms.cameraInfo.y - uniforms.cameraInfo.x);
#endif
#endif
	
#define CUSTOM_VERTEX_MAIN_END

}