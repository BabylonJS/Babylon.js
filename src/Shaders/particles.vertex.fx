precision highp float;

// Attributes
attribute vec3 position;
attribute vec4 color;
attribute vec4 options;

// Uniforms
uniform mat4 view;
uniform mat4 projection;

// Output
varying vec2 vUV;
varying vec4 vColor;

#ifdef CLIPPLANE
uniform vec4 vClipPlane;
uniform mat4 invView;
varying float fClipDistance;
#endif

void main(void) {	
	vec3 viewPos = (view * vec4(position, 1.0)).xyz; 
	vec3 cornerPos;
	float size = options.y;
	float angle = options.x;
	vec2 offset = options.zw;

	cornerPos = vec3(offset.x - 0.5, offset.y  - 0.5, 0.) * size;

	// Rotate
	vec3 rotatedCorner;
	rotatedCorner.x = cornerPos.x * cos(angle) - cornerPos.y * sin(angle);
	rotatedCorner.y = cornerPos.x * sin(angle) + cornerPos.y * cos(angle);
	rotatedCorner.z = 0.;

	// Position
	viewPos += rotatedCorner;
	gl_Position = projection * vec4(viewPos, 1.0);   
	
	vColor = color;
	vUV = offset;

	// Clip plane
#ifdef CLIPPLANE
	vec4 worldPos = invView * vec4(viewPos, 1.0);
	fClipDistance = dot(worldPos, vClipPlane);
#endif
}