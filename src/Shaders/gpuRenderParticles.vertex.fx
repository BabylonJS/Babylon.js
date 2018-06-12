#version 300 es

uniform vec4 colorDead;
uniform mat4 view;
uniform mat4 projection;

// Particles state
in vec3 position;
in float age;
in float life;
in vec3 size;
in vec4 color;
in vec2 offset;
in vec2 uv;
in vec4 direction;
in vec2 angle;

out vec2 vUV;
out vec4 vColor;

#ifdef CLIPPLANE
uniform vec4 vClipPlane;
uniform mat4 invView;
out float fClipDistance;
#endif


void main() {
  vUV = uv;
  float ratio = age / life;
  vColor = color * vec4(1.0 - ratio) + colorDead * vec4(ratio);

  vec2 cornerPos = offset * size.yz * size.x;

#ifdef BILLBOARD
  // Rotate
	vec4 rotatedCorner;
	rotatedCorner.x = cornerPos.x * cos(angle.x) - cornerPos.y * sin(angle.x);
	rotatedCorner.y = cornerPos.x * sin(angle.x) + cornerPos.y * cos(angle.x);
	rotatedCorner.z = 0.;
  rotatedCorner.w = 0.;

  // Expand position
  vec4 viewPosition = view * vec4(position, 1.0);
  gl_Position = projection * (viewPosition + rotatedCorner);
#else
  // Rotate
	vec3 rotatedCorner;
	rotatedCorner.x = cornerPos.x * cos(angle.x) - cornerPos.y * sin(angle.x);
	rotatedCorner.y = 0.;
	rotatedCorner.z = cornerPos.x * sin(angle.x) + cornerPos.y * cos(angle.x);

	vec3 yaxis = normalize(direction.xyz);
	vec3 xaxis = normalize(cross(vec3(0., 1.0, 0.), yaxis));
	vec3 zaxis = normalize(cross(yaxis, xaxis));

	vec3 row0 = vec3(xaxis.x, xaxis.y, xaxis.z);
	vec3 row1 = vec3(yaxis.x, yaxis.y, yaxis.z);
	vec3 row2 = vec3(zaxis.x, zaxis.y, zaxis.z);

	mat3 rotMatrix =  mat3(row0, row1, row2);

	vec3 alignedCorner = rotMatrix * rotatedCorner;

  // Expand position
  vec4 viewPosition = view * vec4(position + alignedCorner, 1.0);  
  gl_Position = projection * viewPosition;
#endif

	// Clip plane
#ifdef CLIPPLANE
	vec4 worldPos = invView * viewPosition;
	fClipDistance = dot(worldPos, vClipPlane);
#endif  
}