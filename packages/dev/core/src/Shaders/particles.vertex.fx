// Attributes
attribute vec3 position;
attribute vec4 color;
attribute float angle;
attribute vec2 size;
#ifdef ANIMATESHEET
attribute float cellIndex;
#endif
#ifndef BILLBOARD
attribute vec3 direction;
#endif
#ifdef BILLBOARDSTRETCHED
attribute vec3 direction;
#endif
#ifdef RAMPGRADIENT
attribute vec4 remapData;
#endif
attribute vec2 offset;

// Uniforms
uniform mat4 view;
uniform mat4 projection;
uniform vec2 translationPivot;

#ifdef PREPASS
uniform vec2 cameraInfo;
#ifdef LOCAL
uniform mat4 inverseEmitterWM;
#endif
#ifdef PREPASS_POSITION
varying vec3 vGeometryPositionW;
#endif
#ifdef PREPASS_WORLD_NORMAL
varying vec3 vGeometryNormalW;
#endif
#ifdef PREPASS_NORMAL
varying vec3 vGeometryNormalV;
#endif
#ifdef PREPASS_LOCAL_POSITION
varying vec3 vPosition;
#endif
#ifdef PREPASS_DEPTH
varying vec3 vViewPos;
#endif
#ifdef PREPASS_NORMALIZED_VIEW_DEPTH
varying float vNormViewDepth;
#endif
#endif

#ifdef ANIMATESHEET
uniform vec3 particlesInfos; // x (number of rows) y(number of columns) z(rowSize)
#endif

// Output
varying vec2 vUV;
varying vec4 vColor;
#ifdef POSITIONW_AS_VARYING
varying vec3 vPositionW;
#endif

#ifdef RAMPGRADIENT
varying vec4 remapRanges;
#endif

#if defined(BILLBOARD) && !defined(BILLBOARDY) && !defined(BILLBOARDSTRETCHED)
uniform mat4 invView;
#endif
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#include<logDepthDeclaration>

#ifdef BILLBOARD
	uniform vec3 eyePosition;
#endif

vec3 rotate(vec3 yaxis, vec3 rotatedCorner) {
	vec3 xaxis = normalize(cross(vec3(0., 1.0, 0.), yaxis));
	vec3 zaxis = normalize(cross(yaxis, xaxis));

	vec3 row0 = vec3(xaxis.x, xaxis.y, xaxis.z);
	vec3 row1 = vec3(yaxis.x, yaxis.y, yaxis.z);
	vec3 row2 = vec3(zaxis.x, zaxis.y, zaxis.z);

	mat3 rotMatrix =  mat3(row0, row1, row2);

	vec3 alignedCorner = rotMatrix * rotatedCorner;
	return position + alignedCorner;
}

#ifdef BILLBOARDSTRETCHED
vec3 rotateAlign(vec3 toCamera, vec3 rotatedCorner) {
	vec3 normalizedToCamera = normalize(toCamera);
	vec3 normalizedCrossDirToCamera = normalize(cross(normalize(direction), normalizedToCamera));

	vec3 row0 = vec3(normalizedCrossDirToCamera.x, normalizedCrossDirToCamera.y, normalizedCrossDirToCamera.z);
	vec3 row2 = vec3(normalizedToCamera.x, normalizedToCamera.y, normalizedToCamera.z);

#ifdef BILLBOARDSTRETCHED_LOCAL
	vec3 row1 = normalize(direction);
#else
	vec3 crossProduct = normalize(cross(normalizedToCamera, normalizedCrossDirToCamera));
	vec3 row1 = vec3(crossProduct.x, crossProduct.y, crossProduct.z);
#endif

	mat3 rotMatrix =  mat3(row0, row1, row2);

	vec3 alignedCorner = rotMatrix * rotatedCorner;
	return position + alignedCorner;
}

vec3 stretchedNormal(vec3 toCamera, vec3 stretchDirection) {
	vec3 normalizedToCamera = normalize(toCamera);
	vec3 normalizedCrossDirToCamera = normalize(cross(normalize(stretchDirection), normalizedToCamera));
#ifdef BILLBOARDSTRETCHED_LOCAL
	vec3 row1 = normalize(stretchDirection);
#else
	vec3 row1 = normalize(cross(normalizedToCamera, normalizedCrossDirToCamera));
#endif
	return normalize(cross(normalizedCrossDirToCamera, row1));
}
#endif


#define CUSTOM_VERTEX_DEFINITIONS

void main(void) {

#define CUSTOM_VERTEX_MAIN_BEGIN

	vec2 cornerPos;
#ifndef POSITIONW_AS_VARYING
	vec3 vPositionW;
#endif
#ifdef PREPASS
	vec3 geometryNormalW;
#endif

	cornerPos = (vec2(offset.x - 0.5, offset.y  - 0.5) - translationPivot) * size;

#ifdef BILLBOARD
	// Rotate
	vec3 rotatedCorner;

#ifdef BILLBOARDY
	rotatedCorner.x = cornerPos.x * cos(angle) - cornerPos.y * sin(angle);
	rotatedCorner.z = cornerPos.x * sin(angle) + cornerPos.y * cos(angle);
	rotatedCorner.y = 0.;
    rotatedCorner.xz += translationPivot;

	vec3 yaxis = position - eyePosition;
	yaxis.y = 0.;

	vPositionW = rotate(normalize(yaxis), rotatedCorner);
#ifdef PREPASS
	geometryNormalW = normalize(yaxis);
#endif

	vec3 viewPos = (view * vec4(vPositionW, 1.0)).xyz;
#elif defined(BILLBOARDSTRETCHED)
	rotatedCorner.x = cornerPos.x * cos(angle) - cornerPos.y * sin(angle);
	rotatedCorner.y = cornerPos.x * sin(angle) + cornerPos.y * cos(angle);
	rotatedCorner.z = 0.;
    rotatedCorner.xy += translationPivot;

	vec3 toCamera = position - eyePosition;
	vPositionW = rotateAlign(toCamera, rotatedCorner);
#ifdef PREPASS
	geometryNormalW = stretchedNormal(toCamera, direction);
#endif

	vec3 viewPos = (view * vec4(vPositionW, 1.0)).xyz;
#else
	rotatedCorner.x = cornerPos.x * cos(angle) - cornerPos.y * sin(angle);
	rotatedCorner.y = cornerPos.x * sin(angle) + cornerPos.y * cos(angle);
	rotatedCorner.z = 0.;
    rotatedCorner.xy += translationPivot;

	vec3 viewPos = (view * vec4(position, 1.0)).xyz + rotatedCorner;

    vPositionW = (invView * vec4(viewPos, 1)).xyz;
#ifdef PREPASS
	geometryNormalW = normalize((invView * vec4(0.0, 0.0, 1.0, 0.0)).xyz);
#endif
#endif

#ifdef RAMPGRADIENT
	remapRanges = remapData;
#endif

	// Position
	gl_Position = projection * vec4(viewPos, 1.0);
#else
	// Rotate
	vec3 rotatedCorner;
	rotatedCorner.x = cornerPos.x * cos(angle) - cornerPos.y * sin(angle);
	rotatedCorner.z = cornerPos.x * sin(angle) + cornerPos.y * cos(angle);
	rotatedCorner.y = 0.;
    rotatedCorner.xz += translationPivot;

	vec3 yaxis = normalize(direction);
	vPositionW = rotate(yaxis, rotatedCorner);
#ifdef PREPASS
	geometryNormalW = yaxis;
#endif

	gl_Position = projection * view * vec4(vPositionW, 1.0);
#endif
	vColor = color;

	#ifdef ANIMATESHEET
		float rowOffset = floor(cellIndex * particlesInfos.z);
		float columnOffset = cellIndex - rowOffset / particlesInfos.z;

		vec2 uvScale = particlesInfos.xy;
		vec2 uvOffset = vec2(offset.x , 1.0 - offset.y);
		vUV = (uvOffset + vec2(columnOffset, rowOffset)) * uvScale;
	#else
		vUV = offset;
	#endif

	// Clip plane
#if defined(CLIPPLANE) || defined(CLIPPLANE2) || defined(CLIPPLANE3) || defined(CLIPPLANE4) || defined(CLIPPLANE5) || defined(CLIPPLANE6) || defined(FOG)
    vec4 worldPos = vec4(vPositionW, 1.0);
#endif
	#include<clipPlaneVertex>
	#include<fogVertex>
	#include<logDepthVertex>

#ifdef PREPASS
	vec4 geometryViewPosition = view * vec4(vPositionW, 1.0);
#if defined(PREPASS_NORMAL) || defined(PREPASS_WORLD_NORMAL)
	vec3 geometryNormalV = normalize((view * vec4(geometryNormalW, 0.0)).xyz);
	vec3 geometryViewDirection = projection[3][3] == 0.0 ? geometryViewPosition.xyz : vec3(0.0, 0.0, geometryViewPosition.z);
	if (dot(geometryNormalV, geometryViewDirection) > 0.0) {
		geometryNormalV = -geometryNormalV;
		geometryNormalW = -geometryNormalW;
	}
#endif
#ifdef PREPASS_POSITION
	vGeometryPositionW = vPositionW;
#endif
#ifdef PREPASS_WORLD_NORMAL
	vGeometryNormalW = normalize(geometryNormalW);
#endif
#ifdef PREPASS_NORMAL
	vGeometryNormalV = geometryNormalV;
#endif
#ifdef PREPASS_LOCAL_POSITION
	#ifdef LOCAL
		vPosition = (inverseEmitterWM * vec4(vPositionW, 1.0)).xyz;
	#else
		vPosition = vPositionW;
	#endif
#endif
#ifdef PREPASS_DEPTH
	vViewPos = geometryViewPosition.xyz;
#endif
#ifdef PREPASS_NORMALIZED_VIEW_DEPTH
	vNormViewDepth = (geometryViewPosition.z - cameraInfo.x) / (cameraInfo.y - cameraInfo.x);
#endif
#endif
	
#define CUSTOM_VERTEX_MAIN_END

}