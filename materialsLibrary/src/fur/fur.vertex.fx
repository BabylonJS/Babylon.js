precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 normal;

#ifdef UV1
attribute vec2 uv;
#endif
#ifdef UV2
attribute vec2 uv2;
#endif
#ifdef VERTEXCOLOR
attribute vec4 color;
#endif

#include<bonesDeclaration>

// Uniforms
uniform float furLength;
uniform float furAngle;
#ifdef HIGHLEVEL
uniform float furOffset;
uniform vec3 furGravity;
uniform float furTime;
uniform float furSpacing;
uniform float furDensity;
#endif
#ifdef HEIGHTMAP
uniform sampler2D heightTexture;
#endif

#ifdef HIGHLEVEL
varying vec2 vFurUV;
#endif

#include<instancesDeclaration>

uniform mat4 view;
uniform mat4 viewProjection;

#ifdef DIFFUSE
varying vec2 vDiffuseUV;
uniform mat4 diffuseMatrix;
uniform vec2 vDiffuseInfos;
#endif

#ifdef POINTSIZE
uniform float pointSize;
#endif

// Output
varying vec3 vPositionW;
#ifdef NORMAL
varying vec3 vNormalW;
#endif
varying float vfur_length;

#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif

#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#include<shadowsVertexDeclaration>[0..maxSimultaneousLights]

float Rand(vec3 rv) {
	float x = dot(rv, vec3(12.9898,78.233, 24.65487));
	return fract(sin(x) * 43758.5453);
}

void main(void) {

	#include<instancesVertex>
    #include<bonesVertex>

//FUR
float r = Rand(position);
#ifdef HEIGHTMAP	
	vfur_length = furLength * texture2D(heightTexture, uv).rgb.x;
#else	
	vfur_length = (furLength * r);
#endif
	vec3 tangent1 = vec3(normal.y, -normal.x, 0);
	vec3 tangent2 = vec3(-normal.z, 0, normal.x);
	r = Rand(tangent1 * r);
	float J = (2.0 + 4.0 * r);
	r = Rand(tangent2*r);
	float K = (2.0 + 2.0 * r);
	tangent1 = tangent1*J + tangent2 * K;
	tangent1 = normalize(tangent1);
	
    vec3 newPosition = position + normal * vfur_length*cos(furAngle) + tangent1 * vfur_length * sin(furAngle);
    
	#ifdef HIGHLEVEL
	// Compute fur data passed to the pixel shader
	vec3 forceDirection = vec3(0.0, 0.0, 0.0);
	forceDirection.x = sin(furTime + position.x * 0.05) * 0.2;
	forceDirection.y = cos(furTime * 0.7 + position.y * 0.04) * 0.2;
	forceDirection.z = sin(furTime * 0.7 + position.z * 0.04) * 0.2;
	
	vec3 displacement = vec3(0.0, 0.0, 0.0);
	displacement = furGravity + forceDirection;
	
	float displacementFactor = pow(furOffset, 3.0);
	
	vec3 aNormal = normal;
	aNormal.xyz += displacement * displacementFactor;
	
	newPosition = vec3(newPosition.x, newPosition.y, newPosition.z) + (normalize(aNormal) * furOffset * furSpacing);
	#endif
	
	#ifdef NORMAL
	#ifdef HIGHLEVEL
	vNormalW = normalize(vec3(finalWorld * vec4(normal, 0.0)) * aNormal);
	#else
	vNormalW = normalize(vec3(finalWorld * vec4(normal, 0.0)));
	#endif
	#endif
	
//END FUR
	gl_Position = viewProjection * finalWorld * vec4(newPosition, 1.0);

	vec4 worldPos = finalWorld * vec4(newPosition, 1.0);
	vPositionW = vec3(worldPos);

	// Texture coordinates
#ifndef UV1
	vec2 uv = vec2(0., 0.);
#endif
#ifndef UV2
	vec2 uv2 = vec2(0., 0.);
#endif

#ifdef DIFFUSE
	if (vDiffuseInfos.x == 0.)
	{
		vDiffuseUV = vec2(diffuseMatrix * vec4(uv, 1.0, 0.0));
	}
	else
	{
		vDiffuseUV = vec2(diffuseMatrix * vec4(uv2, 1.0, 0.0));
	}
    
    #ifdef HIGHLEVEL
	vFurUV = vDiffuseUV * furDensity;
	#endif
#else
    #ifdef HIGHLEVEL
	vFurUV = uv * furDensity;
	#endif
#endif

	// Clip plane
	#include<clipPlaneVertex>

	// Fog
	#include<fogVertex>

	// Shadows
	#include<shadowsVertex>[0..maxSimultaneousLights]

	// Vertex color
#ifdef VERTEXCOLOR
	vColor = color;
#endif

	// Point size
#ifdef POINTSIZE
	gl_PointSize = pointSize;
#endif
}
