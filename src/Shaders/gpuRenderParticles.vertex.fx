#version 300 es

uniform mat4 view;
uniform mat4 projection;
uniform vec2 translationPivot;
uniform vec3 worldOffset;
#ifdef LOCAL
uniform mat4 emitterWM;
#endif

// Particles state
in vec3 position;
in float age;
in float life;
in vec3 size;
#ifndef BILLBOARD
in vec3 initialDirection;
#endif
#ifdef BILLBOARDSTRETCHED
in vec3 direction;
#endif
in float angle;
#ifdef ANIMATESHEET
in float cellIndex;
#endif
in vec2 offset;
in vec2 uv;

out vec2 vUV;
out vec4 vColor;

#if defined(CLIPPLANE) || defined(CLIPPLANE2) || defined(CLIPPLANE3) || defined(CLIPPLANE4) || defined(CLIPPLANE5) || defined(CLIPPLANE6)
uniform mat4 invView;
#endif

#include<clipPlaneVertexDeclaration2>

#ifdef COLORGRADIENTS
uniform sampler2D colorGradientSampler;
#else
uniform vec4 colorDead;
in vec4 color;
#endif

#ifdef ANIMATESHEET
uniform vec3 sheetInfos;
#endif

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
	#ifdef LOCAL
		return ((emitterWM * vec4(position, 1.0)).xyz + worldOffset) + alignedCorner;
	#else
		return (position + worldOffset) + alignedCorner;
	#endif
}

#ifdef BILLBOARDSTRETCHED
vec3 rotateAlign(vec3 toCamera, vec3 rotatedCorner) {
	vec3 normalizedToCamera = normalize(toCamera);
	vec3 normalizedCrossDirToCamera = normalize(cross(normalize(direction), normalizedToCamera));
	vec3 crossProduct = normalize(cross(normalizedToCamera, normalizedCrossDirToCamera));

	vec3 row0 = vec3(normalizedCrossDirToCamera.x, normalizedCrossDirToCamera.y, normalizedCrossDirToCamera.z);
	vec3 row1 = vec3(crossProduct.x, crossProduct.y, crossProduct.z);
	vec3 row2 = vec3(normalizedToCamera.x, normalizedToCamera.y, normalizedToCamera.z);

	mat3 rotMatrix =  mat3(row0, row1, row2);

	vec3 alignedCorner = rotMatrix * rotatedCorner;
	#ifdef LOCAL
		return ((emitterWM * vec4(position, 1.0)).xyz + worldOffset) + alignedCorner;
	#else
		return (position + worldOffset) + alignedCorner;
	#endif
}
#endif

void main() {

	#ifdef ANIMATESHEET
		float rowOffset = floor(cellIndex / sheetInfos.z);
		float columnOffset = cellIndex - rowOffset * sheetInfos.z;

		vec2 uvScale = sheetInfos.xy;
		vec2 uvOffset = vec2(uv.x , 1.0 - uv.y);
		vUV = (uvOffset + vec2(columnOffset, rowOffset)) * uvScale;
	#else
   	vUV = uv;
	#endif
  float ratio = age / life;
#ifdef COLORGRADIENTS
	vColor = texture(colorGradientSampler, vec2(ratio, 0));
#else
	vColor = color * vec4(1.0 - ratio) + colorDead * vec4(ratio);
#endif

  vec2 cornerPos = (offset - translationPivot) * size.yz * size.x + translationPivot;

#ifdef BILLBOARD
	vec4 rotatedCorner;
	rotatedCorner.w = 0.;

	#ifdef BILLBOARDY
		rotatedCorner.x = cornerPos.x * cos(angle) - cornerPos.y * sin(angle);
		rotatedCorner.z = cornerPos.x * sin(angle) + cornerPos.y * cos(angle);
		rotatedCorner.y = 0.;

		vec3 yaxis = (position + worldOffset) - eyePosition;
		yaxis.y = 0.;
		vec3 worldPos = rotate(normalize(yaxis), rotatedCorner.xyz);

		vec4 viewPosition = (view * vec4(worldPos, 1.0));
	#elif defined(BILLBOARDSTRETCHED)
		rotatedCorner.x = cornerPos.x * cos(angle) - cornerPos.y * sin(angle);
		rotatedCorner.y = cornerPos.x * sin(angle) + cornerPos.y * cos(angle);
		rotatedCorner.z = 0.;

		vec3 toCamera = (position + worldOffset) - eyePosition;
		vec3 worldPos = rotateAlign(toCamera, rotatedCorner.xyz);

		vec4 viewPosition = (view * vec4(worldPos, 1.0));
	#else
		// Rotate
		rotatedCorner.x = cornerPos.x * cos(angle) - cornerPos.y * sin(angle);
		rotatedCorner.y = cornerPos.x * sin(angle) + cornerPos.y * cos(angle);
		rotatedCorner.z = 0.;

		// Expand position
		#ifdef LOCAL
			vec4 viewPosition = view * vec4(((emitterWM * vec4(position, 1.0)).xyz + worldOffset), 1.0) + rotatedCorner;
		#else
			vec4 viewPosition = view * vec4((position + worldOffset), 1.0) + rotatedCorner;
		#endif
	#endif

#else
  // Rotate
	vec3 rotatedCorner;
	rotatedCorner.x = cornerPos.x * cos(angle) - cornerPos.y * sin(angle);
	rotatedCorner.y = 0.;
	rotatedCorner.z = cornerPos.x * sin(angle) + cornerPos.y * cos(angle);

	vec3 yaxis = normalize(initialDirection);
	vec3 worldPos = rotate(yaxis, rotatedCorner);

  // Expand position
  vec4 viewPosition = view * vec4(worldPos, 1.0);
#endif
	gl_Position = projection * viewPosition;

	// Clip plane
#if defined(CLIPPLANE) || defined(CLIPPLANE2) || defined(CLIPPLANE3) || defined(CLIPPLANE4) || defined(CLIPPLANE5) || defined(CLIPPLANE6)
	vec4 worldPos = invView * viewPosition;
#endif
	#include<clipPlaneVertex>
}