#version 300 es

uniform sampler2D textureSampler;

in vec2 vUV;
in vec4 vColor;

out vec4 outFragColor;

#ifdef CLIPPLANE
in float fClipDistance;
#endif

void main() {
#ifdef CLIPPLANE
	if (fClipDistance > 0.0)
		discard;
#endif  
  outFragColor = texture(textureSampler, vUV) * vColor;
}
