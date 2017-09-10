// Attributes
attribute vec3 position;
attribute vec4 color;
attribute vec4 options;
attribute float cellIndex;

// Uniforms
uniform mat4 view;
uniform mat4 projection;
uniform vec3 particlesInfos; // x (number of rows) y(number of columns) z(rowSize)

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

	#ifdef ANIMATESHEET
	float rowOffset = floor(cellIndex / particlesInfos.z);
    float columnOffset = cellIndex - rowOffset * particlesInfos.z;

	vec2 uvScale = particlesInfos.xy;
	vec2 uvOffset = vec2(offset.x , 1.0 - offset.y);
	vUV = (uvOffset + vec2(columnOffset, rowOffset)) * uvScale;
	#else
	vUV = offset;
	#endif

	// Clip plane
#ifdef CLIPPLANE
	vec4 worldPos = invView * vec4(viewPos, 1.0);
	fClipDistance = dot(worldPos, vClipPlane);
#endif
}