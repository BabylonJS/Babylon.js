precision highp float;

uniform mat4 view;
uniform mat4 projection;
uniform vec2 translationPivot;
uniform vec3 worldOffset;
uniform mat4 emitterWM;

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

// Particles state
attribute vec3 position;
attribute float age;
attribute float life;
attribute vec3 size;
#if !defined(BILLBOARD) || defined(BILLBOARDSTRETCHED_LOCAL)
attribute vec3 initialDirection;
#endif
#ifdef BILLBOARDSTRETCHED
attribute vec3 direction;
#endif
attribute float angle;
#ifdef ANIMATESHEET
attribute float cellIndex;
#endif
attribute vec2 offset;
attribute vec2 uv;

varying vec2 vUV;
varying vec4 vColor;
varying vec3 vPositionW;

#if defined(BILLBOARD) && !defined(BILLBOARDY) && !defined(BILLBOARDSTRETCHED)
uniform mat4 invView;
#endif

#include<clipPlaneVertexDeclaration2>
#include<fogVertexDeclaration>
#include<logDepthDeclaration>

#ifdef COLORGRADIENTS
uniform sampler2D colorGradientSampler;
#ifdef COLORGRADIENTS_COLOR2
attribute vec4 seed;
#endif
#else
uniform vec4 colorDead;
attribute vec4 color;
#endif

#ifdef ANIMATESHEET
uniform vec3 sheetInfos;
#endif

#ifdef BILLBOARD
	uniform vec3 eyePosition;
#endif

vec3 particleBasePosition() {
#ifdef LOCAL
	return (emitterWM * vec4(position, 1.0)).xyz + worldOffset;
#else
	return position + worldOffset;
#endif
}

vec3 particleDirection(vec3 directionValue) {
#ifdef LOCAL
	return (emitterWM * vec4(directionValue, 0.0)).xyz;
#else
	return directionValue;
#endif
}

vec3 rotate(vec3 yaxis, vec3 rotatedCorner) {
	vec3 xaxis = normalize(cross(vec3(0., 1.0, 0.), yaxis));
	vec3 zaxis = normalize(cross(yaxis, xaxis));

	vec3 row0 = vec3(xaxis.x, xaxis.y, xaxis.z);
	vec3 row1 = vec3(yaxis.x, yaxis.y, yaxis.z);
	vec3 row2 = vec3(zaxis.x, zaxis.y, zaxis.z);

	mat3 rotMatrix =  mat3(row0, row1, row2);

	vec3 alignedCorner = rotMatrix * rotatedCorner;
	return particleBasePosition() + alignedCorner;
}

#ifdef BILLBOARDSTRETCHED
vec3 rotateAlign(vec3 toCamera, vec3 rotatedCorner) {
#ifdef BILLBOARDSTRETCHED_LOCAL
	vec3 stretchDirection = particleDirection(initialDirection);
#else
	vec3 stretchDirection = particleDirection(direction);
#endif
	vec3 normalizedToCamera = normalize(toCamera);
	vec3 normalizedCrossDirToCamera = normalize(cross(normalize(stretchDirection), normalizedToCamera));

	vec3 row0 = vec3(normalizedCrossDirToCamera.x, normalizedCrossDirToCamera.y, normalizedCrossDirToCamera.z);
	vec3 row2 = vec3(normalizedToCamera.x, normalizedToCamera.y, normalizedToCamera.z);

#ifdef BILLBOARDSTRETCHED_LOCAL
	vec3 row1 = normalize(stretchDirection);
#else
	vec3 crossProduct = normalize(cross(normalizedToCamera, normalizedCrossDirToCamera));
	vec3 row1 = vec3(crossProduct.x, crossProduct.y, crossProduct.z);
#endif

	mat3 rotMatrix =  mat3(row0, row1, row2);

	vec3 alignedCorner = rotMatrix * rotatedCorner;
	return particleBasePosition() + alignedCorner;
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

void main() {
#ifdef PREPASS
	vec3 geometryNormalW;
#endif

#ifdef EMITRATECTRL
  // Skip dead particles (age >= life means particle has expired).
  // Place vertex outside the clip frustum (z=2 > w=1) so the GPU
  // discards it during clipping — no fragment shader cost.
  if (life > 0.0 && age >= life) {
    gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
    vColor = vec4(0.0); // safety fallback for any leaked varyings
    vUV = vec2(0.0);
    vPositionW = vec3(0.0);
    return;
  }
#endif

	#ifdef ANIMATESHEET
		float rowOffset = floor(cellIndex / sheetInfos.z);
		float columnOffset = cellIndex - rowOffset * sheetInfos.z;

		vec2 uvScale = sheetInfos.xy;
		vec2 uvOffset = vec2(uv.x , 1.0 - uv.y);
		vUV = (uvOffset + vec2(columnOffset, rowOffset)) * uvScale;
	#else
   	    vUV = uv;
	#endif
  float ratio = min(1.0, age / life);
#ifdef COLORGRADIENTS
	#ifdef COLORGRADIENTS_COLOR2
		// Sample both rows of the color gradient texture (row 0 = color1, row 1 = color2) at their texel
		// centers and lerp using the particle's persistent seed.x for a stable per-particle color.
		vec4 vColor1 = texture2D(colorGradientSampler, vec2(ratio, 0.25));
		vec4 vColor2 = texture2D(colorGradientSampler, vec2(ratio, 0.75));
		vColor = mix(vColor1, vColor2, seed.x);
	#else
		vColor = texture2D(colorGradientSampler, vec2(ratio, 0));
	#endif
#else
	vColor = color * vec4(1.0 - ratio) + colorDead * vec4(ratio);
#endif

  vec2 cornerPos = (offset - translationPivot) * size.yz * size.x;

#ifdef BILLBOARD
	vec4 rotatedCorner;
	rotatedCorner.w = 0.;

	#ifdef BILLBOARDY
		rotatedCorner.x = cornerPos.x * cos(angle) - cornerPos.y * sin(angle);
		rotatedCorner.z = cornerPos.x * sin(angle) + cornerPos.y * cos(angle);
		rotatedCorner.y = 0.;
        rotatedCorner.xz += translationPivot;

		vec3 yaxis = particleBasePosition() - eyePosition;
		yaxis.y = 0.;
		vPositionW = rotate(normalize(yaxis), rotatedCorner.xyz);
#ifdef PREPASS
		geometryNormalW = normalize(yaxis);
#endif

		vec4 viewPosition = (view * vec4(vPositionW, 1.0));
	#elif defined(BILLBOARDSTRETCHED)
		rotatedCorner.x = cornerPos.x * cos(angle) - cornerPos.y * sin(angle);
		rotatedCorner.y = cornerPos.x * sin(angle) + cornerPos.y * cos(angle);
		rotatedCorner.z = 0.;
        rotatedCorner.xy += translationPivot;

		vec3 toCamera = particleBasePosition() - eyePosition;
		vPositionW = rotateAlign(toCamera, rotatedCorner.xyz);
#ifdef PREPASS
	#ifdef BILLBOARDSTRETCHED_LOCAL
		geometryNormalW = stretchedNormal(toCamera, particleDirection(initialDirection));
	#else
		geometryNormalW = stretchedNormal(toCamera, particleDirection(direction));
	#endif
#endif

		vec4 viewPosition = (view * vec4(vPositionW, 1.0));
	#else
		// Rotate
		rotatedCorner.x = cornerPos.x * cos(angle) - cornerPos.y * sin(angle);
		rotatedCorner.y = cornerPos.x * sin(angle) + cornerPos.y * cos(angle);
		rotatedCorner.z = 0.;
        rotatedCorner.xy += translationPivot;

		// Expand position
		#ifdef LOCAL
			vec4 viewPosition = view * vec4(((emitterWM * vec4(position, 1.0)).xyz + worldOffset), 1.0) + rotatedCorner;
		#else
			vec4 viewPosition = view * vec4((position + worldOffset), 1.0) + rotatedCorner;
		#endif

        vPositionW = (invView * viewPosition).xyz;
#ifdef PREPASS
		geometryNormalW = normalize((invView * vec4(0.0, 0.0, 1.0, 0.0)).xyz);
#endif
	#endif

#else
    // Rotate
	vec3 rotatedCorner;
	rotatedCorner.x = cornerPos.x * cos(angle) - cornerPos.y * sin(angle);
	rotatedCorner.y = 0.;
	rotatedCorner.z = cornerPos.x * sin(angle) + cornerPos.y * cos(angle);
    rotatedCorner.xz += translationPivot;

	vec3 yaxis = normalize(particleDirection(initialDirection));
	vPositionW = rotate(yaxis, rotatedCorner);
#ifdef PREPASS
	geometryNormalW = yaxis;
#endif

    // Expand position
    vec4 viewPosition = view * vec4(vPositionW, 1.0);
#endif
	gl_Position = projection * viewPosition;

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
		vPosition = (inverseEmitterWM * vec4(vPositionW - worldOffset, 1.0)).xyz;
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
}