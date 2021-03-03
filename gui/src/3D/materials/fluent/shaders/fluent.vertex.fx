precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

// Uniforms
uniform mat4 world;
uniform mat4 viewProjection;

varying vec2 vUV;

#ifdef BORDER
varying vec2 scaleInfo;
uniform float borderWidth;
uniform vec3 scaleFactor;
#endif

#ifdef HOVERLIGHT
varying vec3 worldPosition;
#endif

void main(void) {
	vUV = uv;

#ifdef BORDER
	vec3 scale = scaleFactor;
	float minScale = min(min(scale.x, scale.y), scale.z);
    float maxScale = max(max(scale.x, scale.y), scale.z);
	float minOverMiddleScale = minScale / (scale.x + scale.y + scale.z - minScale - maxScale);
    float areaYZ = scale.y * scale.z;
    float areaXZ = scale.x * scale.z;
    float areaXY = scale.x * scale.y;
    float scaledBorderWidth = borderWidth;	

	if (abs(normal.x) == 1.0) // Y,Z plane.
	{
		scale.x = scale.y;
		scale.y = scale.z;
		
		if (areaYZ > areaXZ && areaYZ > areaXY)
		{
			scaledBorderWidth *= minOverMiddleScale;
		}
	}
	else if (abs(normal.y) == 1.0) // X,Z plane.
	{
		scale.x = scale.z;

		if (areaXZ > areaXY && areaXZ > areaYZ)
		{
			scaledBorderWidth *= minOverMiddleScale;
		}
	}
	else  // X,Y plane.
	{
		if (areaXY > areaYZ && areaXY > areaXZ)
		{
			scaledBorderWidth *= minOverMiddleScale;
		}
	}

 	float scaleRatio = min(scale.x, scale.y) / max(scale.x, scale.y);
	if (scale.x > scale.y)
	{
		scaleInfo.x = 1.0 - (scaledBorderWidth * scaleRatio);
		scaleInfo.y = 1.0 - scaledBorderWidth;
	}
	else
	{
		scaleInfo.x = 1.0 - scaledBorderWidth;
		scaleInfo.y = 1.0 - (scaledBorderWidth * scaleRatio);
	}	
#endif		

	vec4 worldPos = world * vec4(position, 1.0);

#ifdef HOVERLIGHT
	worldPosition = worldPos.xyz;
#endif

	gl_Position = viewProjection * worldPos;
}
