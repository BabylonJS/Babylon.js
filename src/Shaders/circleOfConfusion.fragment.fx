// samplers
uniform sampler2D depthSampler;

// varyings
varying vec2 vUV;

// preconputed uniforms (not effect parameters)
uniform float near;
uniform float far;

// uniforms
uniform float focusDistance;
uniform float cocPrecalculation;

float sampleDistance(const in vec2 offset) {
    float depth = texture2D(depthSampler, offset).r;	// depth value from DepthRenderer: 0 to 1
	return near + (far - near)*depth;		            // actual distance from the lens
}

void main(void)
{
    float pixelDistance = sampleDistance(vUV);
    float coc = abs(cocPrecalculation* ((focusDistance - pixelDistance)/pixelDistance));
    coc = clamp(coc, 0.0, 1.0);
    gl_FragColor = vec4(coc, coc, coc, 1.0);
}
