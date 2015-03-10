﻿#ifdef GL_ES
precision highp float;
#endif

#if defined(ALPHATEST) || defined(BASIC_RENDER) || defined(OPACITY)
varying vec2 vUV;
#endif

#if defined(ALPHATEST) || defined(BASIC_RENDER)
uniform sampler2D diffuseSampler;
#endif

#if defined(OPACITY)
uniform sampler2D opacitySampler;
uniform float opacityLevel;
#endif

void main(void)
{
#if defined(ALPHATEST) || defined(BASIC_RENDER)
	vec4 diffuseColor = texture2D(diffuseSampler, vUV);
#endif

#ifdef ALPHATEST
	if (diffuseColor.a < 0.4)
		discard;
#endif

#ifdef OPACITY
	vec4 opacityColor = texture2D(opacitySampler, vUV);
	float alpha = 1.0;

	#ifdef OPACITYRGB
	opacityColor.rgb = opacityColor.rgb * vec3(0.3, 0.59, 0.11);
	alpha *= (opacityColor.x + opacityColor.y + opacityColor.z) * opacityLevel;
	#else
	alpha *= opacityColor.a * opacityLevel;
	#endif

	#if defined(BASIC_RENDER)
	gl_FragColor = vec4(diffuseColor.rgb, alpha);
	#else
	gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
	#endif

	gl_FragColor.a = alpha;
#else
	#ifndef BASIC_RENDER
	gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
	#else
	gl_FragColor = diffuseColor;
	#endif
#endif

}
