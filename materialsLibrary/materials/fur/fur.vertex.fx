precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

// Uniforms
uniform mat4 worldViewProjection;
uniform float time;

// Varying
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUV;
varying float vfl;
				
float Random_Final(vec3 rv)
{
	float x = dot(rv, vec3(12.9898,78.233, 24.65487));
	return fract(sin(x) * 43758.5453);
}

void main(void) {
    float r = Random_Final(position);
    float fur_length = (2.5 * r);
    vec3 tangent1 = vec3(normal.y, -normal.x, 0);
    vec3 tangent2 = vec3(-normal.z, 0, normal.x);
    r = Random_Final(tangent1);
	 float J = (4.0 + 2.0*r);
    r = Random_Final(tangent2);
	 float K = (2.0 + 2.0* r);
	 tangent1 = tangent1*J + tangent2*K;
	 tangent1 = normalize(tangent1);
    vec3 v = position;
    v = v + 0.2*normal * fur_length + tangent1*0.1;
    
    gl_Position = worldViewProjection * vec4(v, 1.0);
    
    vPosition = position;
    vNormal = normal;
    vUV = uv;
    vfl = fur_length;
};
