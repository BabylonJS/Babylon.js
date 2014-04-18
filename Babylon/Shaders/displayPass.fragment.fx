#ifdef GL_ES
precision mediump float;
#endif

// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;
uniform sampler2D passSampler;

void main(void)
{
    gl_FragColor = texture2D(passSampler, vUV);
}