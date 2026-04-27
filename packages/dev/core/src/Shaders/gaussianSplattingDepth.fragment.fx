precision highp float;

varying vec2 vPosition;
varying vec4 vColor;

#ifdef DEPTH_RENDER
varying float vDepthMetric;
#endif

void main(void) {
  float A = -dot(vPosition, vPosition);
#if (defined(SM_SOFTTRANSPARENTSHADOW) && SM_SOFTTRANSPARENTSHADOW == 1) ||    \
    (defined(DEPTH_RENDER) && defined(ALPHA_BLENDED_DEPTH))
  float alpha = exp(A) * vColor.a;
  if (A < -4.)
    discard;
#else
  if (A < -vColor.a)
    discard;
#endif
#ifdef DEPTH_RENDER
  float opacity = 1.0;
#ifdef ALPHA_BLENDED_DEPTH
  opacity = alpha;
#endif
  gl_FragColor = vec4(vDepthMetric, 0.0, 0.0, opacity);
#endif
}