uniform sampler2D textureSampler;
uniform vec2 scalingRange;

varying vec2 vUV;

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
