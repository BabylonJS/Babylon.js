#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vUV;

uniform sampler2D textureSampler;
uniform sampler2D prePass_NdcDepth;
uniform sampler2D prePass_WorldNormal;
uniform sampler2D prePass_Position;
uniform sampler2D prePass_LocalPosition;
uniform sampler2D prePass_VelocityLinear;
uniform vec4 sizeParams;
uniform float maxDepth;

#define offsetX sizeParams.x
#define offsetY sizeParams.y
#define widthScale sizeParams.z
#define heightScale sizeParams.w

void main(void) {
  vec2 uv =
      vec2((offsetX + vUV.x) * widthScale, (offsetY + vUV.y) * heightScale);
  vec4 backgroundColour = texture2D(textureSampler, vUV).rgba;
  vec4 depth = texture2D(prePass_NdcDepth, vUV);
  vec4 worldNormal = texture2D(prePass_WorldNormal, vUV);
  vec4 worldPosition = texture2D(prePass_Position, vUV);
  vec4 localPosition = texture2D(prePass_LocalPosition, vUV);
  vec4 velocityLinear = texture2D(prePass_VelocityLinear, vUV);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor.rgba = backgroundColour;
  } else {
    gl_FragColor.a = 1.0;
    if (uv.x <= 0.2) { // show only depth texture
      gl_FragColor.rgb = depth.rgb;
      gl_FragColor.a = 1.0;
    } else if (uv.x <= 0.4) {
      velocityLinear.rg = velocityLinear.rg * 0.5 + 0.5;
      gl_FragColor.rgb = velocityLinear.rgb;
    } else if (uv.x <= 0.6) {
      gl_FragColor.rgb = worldPosition.rgb;
    } else if (uv.x <= 0.8) {
      gl_FragColor.rgb = localPosition.rgb;
    } else {
      gl_FragColor.rgb = worldNormal.rgb;
    }
  }
}