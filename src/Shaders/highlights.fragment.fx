// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;

const vec3 RGBLuminanceCoefficients = vec3(0.2126, 0.7152, 0.0722);

void main(void) 
{
	vec4 tex = texture2D(textureSampler, vUV);
	vec3 c = tex.rgb;
	float luma = dot(c.rgb, RGBLuminanceCoefficients);
	
	// to artificially desaturate/whiteout: c = mix(c, vec3(luma), luma * luma * luma * 0.1)
	// brighter = higher luma = lower exponent = more diffuse glow
	
	gl_FragColor = vec4(pow(c, vec3(25.0 - luma * 15.0)), tex.a);	
}