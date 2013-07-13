// Attributes
attribute vec3 position;
attribute vec4 options;
attribute vec4 cellInfo;

// Uniforms
uniform vec2 textureInfos;
uniform mat4 view;
uniform mat4 projection;

// Output
varying vec2 vUV;

#ifdef FOG
varying float fFogDistance;
#endif

void main(void) {	
	vec3 viewPos = (view * vec4(position, 1.0)).xyz; 
	vec3 cornerPos;
	
	float angle = options.x;
	float size = options.y;
	vec2 offset = options.zw;
	vec2 uvScale = textureInfos.xy;

	cornerPos = vec3(offset.x - 0.5, offset.y  - 0.5, 0.) * size;

	// Rotate
	vec3 rotatedCorner;
	rotatedCorner.x = cornerPos.x * cos(angle) - cornerPos.y * sin(angle);
	rotatedCorner.y = cornerPos.x * sin(angle) + cornerPos.y * cos(angle);
	rotatedCorner.z = 0.;

	// Position
	viewPos += rotatedCorner;
	gl_Position = projection * vec4(viewPos, 1.0);   
	
	// Texture
	vec2 uvOffset = vec2(abs(offset.x - cellInfo.x), 1.0 - abs(offset.y - cellInfo.y));

	vUV = (uvOffset + cellInfo.zw) * uvScale;

	// Fog
#ifdef FOG
	fFogDistance = viewPos.z;
#endif
}