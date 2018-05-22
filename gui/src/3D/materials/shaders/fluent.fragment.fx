precision highp float;

varying vec2 vUV;

uniform vec4 albedoColor;

#ifdef INNERGLOW
uniform vec4 innerGlowColor;
#endif

#ifdef BORDER
varying vec2 scaleInfo;
uniform float edgeSmoothingValue;
uniform float borderMinValue;

#endif

void main(void) {

	vec3 albedo = albedoColor.rgb;
	float alpha = albedoColor.a;

#ifdef BORDER	
	float borderPower = 10.0;
	float inverseBorderPower = 1.0 / borderPower;
	float pointToHover = 1.0;
	vec3 borderColor = albedo * borderPower;

	vec2 distanceToEdge;
    distanceToEdge.x = abs(vUV.x - 0.5) * 2.0;
    distanceToEdge.y = abs(vUV.y - 0.5) * 2.0;

    float borderValue = max(smoothstep(scaleInfo.x - edgeSmoothingValue, scaleInfo.x + edgeSmoothingValue, distanceToEdge.x),
                            smoothstep(scaleInfo.y - edgeSmoothingValue, scaleInfo.y + edgeSmoothingValue, distanceToEdge.y));

    borderColor = borderColor * borderValue * max(borderMinValue * inverseBorderPower, pointToHover);	
	albedo += borderColor;
	alpha = max(alpha, borderValue);
#endif

#ifdef INNERGLOW
	// Inner glow color
	vec2 uvGlow = (vUV - vec2(0.5, 0.5)) * (innerGlowColor.a * 2.0);
	uvGlow = uvGlow * uvGlow;
    uvGlow = uvGlow * uvGlow;

    albedo += mix(vec3(0.0, 0.0, 0.0), innerGlowColor.rgb, uvGlow.x + uvGlow.y);	
#endif

	gl_FragColor = vec4(albedo, alpha);
}