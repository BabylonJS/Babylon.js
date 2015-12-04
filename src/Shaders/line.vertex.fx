precision highp float;

// Attributes
attribute vec3 position;
attribute vec4 normal;

// Uniforms
uniform mat4 worldViewProjection;

uniform float width;
uniform float aspectRatio;

void main(void) {
	vec4 viewPosition = worldViewProjection * vec4(position, 1.0);
	vec4 viewPositionNext = worldViewProjection * vec4(normal.xyz, 1.0);

	vec2 currentScreen = viewPosition.xy / viewPosition.w;
	vec2 nextScreen = viewPositionNext.xy / viewPositionNext.w;

	currentScreen.x *= aspectRatio;
	nextScreen.x *= aspectRatio;

	vec2 dir = normalize(nextScreen - currentScreen);
	vec2 normalDir = vec2(-dir.y, dir.x);

	normalDir *= width / 2.0;
	normalDir.x /= aspectRatio;

	vec4 offset = vec4(normalDir * normal.w, 0.0, 0.0);
	gl_Position = viewPosition + offset;
}