precision highp float;

// Attributes
attribute vec3 position;
#ifdef NORMAL
attribute vec3 normal;
#endif
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
#include<instancesDeclaration>

uniform mat4 view;
uniform mat4 viewProjection;

#ifdef BUMP
varying vec2 vNormalUV;
#ifdef BUMPSUPERIMPOSE
    varying vec2 vNormalUV2;
#endif
uniform mat4 normalMatrix;
uniform vec2 vNormalInfos;
#endif

#ifdef POINTSIZE
uniform float pointSize;
#endif

// Output
varying vec3 vPositionW;
#ifdef NORMAL
varying vec3 vNormalW;
#endif

#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif

#include<clipPlaneVertexDeclaration>

#include<fogVertexDeclaration>
#include<shadowsVertexDeclaration>[0..maxSimultaneousLights]

#include<logDepthDeclaration>

// Water uniforms
uniform mat4 worldReflectionViewProjection;
uniform vec2 windDirection;
uniform float waveLength;
uniform float time;
uniform float windForce;
uniform float waveHeight;
uniform float waveSpeed;

// Water varyings
varying vec3 vPosition;
varying vec3 vRefractionMapTexCoord;
varying vec3 vReflectionMapTexCoord;



void main(void) {

    #include<instancesVertex>
    #include<bonesVertex>

	vec4 worldPos = finalWorld * vec4(position, 1.0);
	vPositionW = vec3(worldPos);

#ifdef NORMAL
	vNormalW = normalize(vec3(finalWorld * vec4(normal, 0.0)));
#endif

	// Texture coordinates
#ifndef UV1
	vec2 uv = vec2(0., 0.);
#endif
#ifndef UV2
	vec2 uv2 = vec2(0., 0.);
#endif

#ifdef BUMP
	if (vNormalInfos.x == 0.)
	{
		vNormalUV = vec2(normalMatrix * vec4((uv * 1.0) / waveLength + time * windForce * windDirection, 1.0, 0.0));
        #ifdef BUMPSUPERIMPOSE
		    vNormalUV2 = vec2(normalMatrix * vec4((uv * 0.721) / waveLength + time * 1.2 * windForce * windDirection, 1.0, 0.0));
		#endif
	}
	else
	{
		vNormalUV = vec2(normalMatrix * vec4((uv2 * 1.0) / waveLength + time * windForce * windDirection , 1.0, 0.0));
        #ifdef BUMPSUPERIMPOSE
    		vNormalUV2 = vec2(normalMatrix * vec4((uv2 * 0.721) / waveLength + time * 1.2 * windForce * windDirection , 1.0, 0.0));
    	#endif
	}
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

	vec3 p = position;
	float newY = (sin(((p.x * 5.0) + time * waveSpeed)) * waveHeight * windDirection.x * 5.0)
			   + (cos(((p.z * 5.0) +  time * waveSpeed)) * waveHeight * windDirection.y * 1.25);
	p.y += abs(newY);
	
	gl_Position = viewProjection * finalWorld * vec4(p, 1.0);

#ifdef REFLECTION
	worldPos = viewProjection * finalWorld * vec4(p, 1.0);
	
	// Water
	vPosition = position;
	
	vRefractionMapTexCoord.x = 0.5 * (worldPos.w + worldPos.x);
	vRefractionMapTexCoord.y = 0.5 * (worldPos.w + worldPos.y);
	vRefractionMapTexCoord.z = worldPos.w;
	
	worldPos = worldReflectionViewProjection * vec4(position, 1.0);
	vReflectionMapTexCoord.x = 0.5 * (worldPos.w + worldPos.x);
	vReflectionMapTexCoord.y = 0.5 * (worldPos.w + worldPos.y);
	vReflectionMapTexCoord.z = worldPos.w;
#endif

#include<logDepthVertex>

}
