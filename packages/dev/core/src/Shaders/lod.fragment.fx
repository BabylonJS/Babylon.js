#extension GL_EXT_shader_texture_lod : enable

precision highp float;

const float GammaEncodePowerApprox = 1.0 / 2.2;

varying vec2 vUV;
uniform sampler2D textureSampler;
uniform float lod;
uniform vec2 texSize;
uniform int gamma;
void main(void)
{
    gl_FragColor = textureLod(textureSampler,vUV,lod);
    if (gamma == 0) {
        gl_FragColor.rgb = pow(gl_FragColor.rgb, vec3(GammaEncodePowerApprox));
    }
}
