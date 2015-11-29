precision highp float;

// Varying
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUV;
varying float vfl;

// Uniforms
uniform mat4 world;

// Refs
uniform vec3 cameraPosition;
				
void main(void) {
    vec3 vLightPosition = vec3(0,200,100);
    
    // World values
    vec3 vPositionW = vec3(world * vec4(vPosition, 1.0));
    vec3 vNormalW = normalize(vec3(world * vec4(vNormal, 0.0)));
    vec3 viewDirectionW = normalize(cameraPosition - vPositionW);
    
    // Light variation depends on fur length gives shadow effect on a plane
    vec3 lightVectorW = (0.1 + vfl/4.0)*normalize(vLightPosition - vPositionW);
    vec3 color = vec3(0.44,0.21,0.02).rgb;
    
    // diffuse
    float ndl = abs(dot(vNormalW, lightVectorW));
    
    // Specular
    vec3 angleW = normalize(viewDirectionW + (0.1 + vfl)*lightVectorW);
    float specComp = max(0., dot(vNormalW, angleW));
    specComp = pow(specComp, max(1., 64.)) * 2.;
    
    gl_FragColor = vec4(color * ndl , 1.0);
};