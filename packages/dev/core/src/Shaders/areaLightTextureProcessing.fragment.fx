uniform sampler2D textureSampler;
uniform vec2 scalingRange;

varying vec2 vUV;

void main(void)
{
    float x = (vUV.x - scalingRange.x) / (scalingRange.y - scalingRange.x);
	float y = (vUV.y - scalingRange.x) / (scalingRange.y - scalingRange.x);
    vec2 scaledUV = vec2(x, y);
	gl_FragColor = texture2D(textureSampler, scaledUV);
}
