// Attributes
in vec2 vUV;
uniform vec2 texelSize;
uniform sampler2D inputTexture;

void main(void) {
	vec4 p = texture(inputTexture, vUV);
	if (p.a != 0.0) {
		gl_FragColor = p;
		return;
	}

	vec4 n = texture(inputTexture, vec2(vUV.x, vUV.y + texelSize.y));
	n.xyz *= n.a;

	vec4 s = texture(inputTexture, vec2(vUV.x, vUV.y - texelSize.y));
	s.xyz *= s.a;

	vec4 e = texture(inputTexture, vec2(vUV.x + texelSize.x, vUV.y));
	e.xyz *= e.a;

	vec4 w = texture(inputTexture, vec2(vUV.x - texelSize.x, vUV.y));
	w.xyz *= w.a;

	gl_FragColor = vec4((n.xyz + s.xyz + e.xyz + w.xyz) / (n.a + s.a + e.a + w.a), 1.0);
}