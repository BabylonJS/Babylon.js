uniform vec2 textureResolution;
uniform sampler2D textureSampler;
uniform vec2 blurDirection;
uniform vec2 rangeFilter;
uniform vec2 scalingRange;

varying vec2 vUV;

vec4 blur5(vec2 uv, vec2 resolution, vec2 direction) {
  vec4 color = vec4(0.0);
  vec2 off1 = vec2(1.3333333333333333) * direction;
  color += texture2D(textureSampler, uv) * 0.29411764705882354;
  color += texture2D(textureSampler, uv + (off1 / resolution)) * 0.35294117647058826;
  color += texture2D(textureSampler, uv - (off1 / resolution)) * 0.35294117647058826;
  return color; 
}

vec4 blur9(vec2 uv, vec2 resolution, vec2 direction) {
  vec4 color = vec4(0.0);
  vec2 off1 = vec2(1.3846153846) * direction;
  vec2 off2 = vec2(3.2307692308) * direction;
  color += texture2D(textureSampler, uv) * 0.2270270270;
  color += texture2D(textureSampler, uv + (off1 / resolution)) * 0.3162162162;
  color += texture2D(textureSampler, uv - (off1 / resolution)) * 0.3162162162;
  color += texture2D(textureSampler, uv + (off2 / resolution)) * 0.0702702703;
  color += texture2D(textureSampler, uv - (off2 / resolution)) * 0.0702702703;
  return color;
}

vec4 blur13(vec2 uv, vec2 resolution, vec2 direction) {
    vec4 color = vec4(0.0);
    vec2 off1 = vec2(1.411764705882353) * direction;
    vec2 off2 = vec2(3.2941176470588234) * direction;
    vec2 off3 = vec2(5.176470588235294) * direction;
    color += texture2D(textureSampler, uv) * 0.1964825501511404;
    color += texture2D(textureSampler, uv + (off1 / resolution)) * 0.2969069646728344;
    color += texture2D(textureSampler, uv - (off1 / resolution)) * 0.2969069646728344;
    color += texture2D(textureSampler, uv + (off2 / resolution)) * 0.09447039785044732;
    color += texture2D(textureSampler, uv - (off2 / resolution)) * 0.09447039785044732;
    color += texture2D(textureSampler, uv + (off3 / resolution)) * 0.010381362401148057;
    color += texture2D(textureSampler, uv - (off3 / resolution)) * 0.010381362401148057;
    return color;
}

void main(void)
{
    float x = (vUV.x - scalingRange.x) / (scalingRange.y - scalingRange.x);
	float y = (vUV.y - scalingRange.x) / (scalingRange.y - scalingRange.x);
    vec2 scaledUV = vec2(x, y);

    if((scaledUV.x > 0.0 && scaledUV.x < 1.0) && (scaledUV.y > 0.0 && scaledUV.y < 1.0)){
        gl_FragColor = texture2D(textureSampler, scaledUV);
    }
    else 
	{
		if(scaledUV.x < 0.0)
		{
			scaledUV.x = abs(scaledUV.x);
		}
		else if (scaledUV.x > 1.0)
		{
			scaledUV.x = 2.0 - scaledUV.x;
		}

		if(scaledUV.y < 0.0)
		{
			scaledUV.y = abs(scaledUV.y);
		}
		else if (scaledUV.y > 1.0)
		{
			scaledUV.y = 2.0 - scaledUV.y;
		}

        gl_FragColor = texture2D(textureSampler, scaledUV);
    }
}
