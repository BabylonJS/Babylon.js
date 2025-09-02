precision highp float;

const float GammaEncodePowerApprox = 1.0 / 2.2;

varying vec2 vUV;
uniform sampler2D textureSampler;
uniform float lod;
uniform vec2 texSize;
uniform int gamma;
void main(void)
{
    ivec2 textureDimensions = textureSize(textureSampler, 0);
    gl_FragColor = texelFetch(textureSampler, ivec2(vUV * vec2(textureDimensions)), int(lod));
    if (gamma == 0) {
        gl_FragColor.rgb = pow(gl_FragColor.rgb, vec3(GammaEncodePowerApprox));
    }
}
