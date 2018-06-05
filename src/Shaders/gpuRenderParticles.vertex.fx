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

  // Rotate
	vec4 rotatedCorner;
	rotatedCorner.x = cornerPos.x * cos(angle.x) - cornerPos.y * sin(angle.x);
	rotatedCorner.y = cornerPos.x * sin(angle.x) + cornerPos.y * cos(angle.x);
	rotatedCorner.z = 0.;
  rotatedCorner.w = 0.;

  // Expand position
  vec4 viewPosition = view * vec4(position, 1.0);
  gl_Position = projection * (viewPosition + rotatedCorner);

	// Clip plane
#ifdef CLIPPLANE
	vec4 worldPos = invView * viewPosition;
	fClipDistance = dot(worldPos, vClipPlane);
#endif  
}