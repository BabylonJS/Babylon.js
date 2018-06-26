#version 300 es


uniform mat4 view;
uniform mat4 projection;
uniform vec2 translationPivot;

// Particles state
in vec3 position;
in float age;
in float life;
in vec3 size;
#ifndef BILLBOARD
in vec3 initialDirection;
#endif
in vec2 angle;
#ifdef ANIMATESHEET
in float cellIndex;
#endif
in vec2 offset;
in vec2 uv;

out vec2 vUV;
out vec4 vColor;

#ifdef CLIPPLANE
uniform vec4 vClipPlane;
uniform mat4 invView;
out float fClipDistance;
#endif

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

	return position + alignedCorner;
}

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
		rotatedCorner.x = cornerPos.x * cos(angle.x) - cornerPos.y * sin(angle.x);
		rotatedCorner.z = cornerPos.x * sin(angle.x) + cornerPos.y * cos(angle.x);
		rotatedCorner.y = 0.;

		vec3 yaxis = normalize(position - eyePosition);
		yaxis.y = 0.;
		vec3 worldPos = rotate(yaxis, rotatedCorner.xyz);

		vec4 viewPosition = (view * vec4(worldPos, 1.0)); 
	#else
		// Rotate
		rotatedCorner.x = cornerPos.x * cos(angle.x) - cornerPos.y * sin(angle.x);
		rotatedCorner.y = cornerPos.x * sin(angle.x) + cornerPos.y * cos(angle.x);
		rotatedCorner.z = 0.;

		// Expand position
		vec4 viewPosition = view * vec4(position, 1.0) + rotatedCorner;
	#endif

#else
  // Rotate
	vec3 rotatedCorner;
	rotatedCorner.x = cornerPos.x * cos(angle.x) - cornerPos.y * sin(angle.x);
	rotatedCorner.y = 0.;
	rotatedCorner.z = cornerPos.x * sin(angle.x) + cornerPos.y * cos(angle.x);

	vec3 yaxis = normalize(initialDirection);
	vec3 worldPos = rotate(yaxis, rotatedCorner);

  // Expand position
  vec4 viewPosition = view * vec4(worldPos, 1.0);  
#endif
	gl_Position = projection * viewPosition;

	// Clip plane
#ifdef CLIPPLANE
	vec4 worldPos = invView * viewPosition;
	fClipDistance = dot(worldPos, vClipPlane);
#endif  
}