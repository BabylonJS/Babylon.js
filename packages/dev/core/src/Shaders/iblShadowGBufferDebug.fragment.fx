#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vUV;

uniform sampler2D textureSampler;
uniform sampler2D prePass_ClipSpaceDepth;
uniform sampler2D prePass_Depth;
uniform sampler2D prePass_Normal;
uniform sampler2D prePass_WorldNormal;
uniform sampler2D prePass_Position;
uniform sampler2D prePass_LocalPosition;
uniform sampler2D prePass_Velocity;
uniform vec4 sizeParams;
uniform float maxDepth;

#define offsetX sizeParams.x
#define offsetY sizeParams.y
#define widthScale sizeParams.z
#define heightScale sizeParams.w

void main(void) {
  vec2 uv =
      vec2((offsetX + vUV.x) * widthScale, (offsetY + vUV.y) * heightScale);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor.rgba = texture2D(textureSampler, vUV);
    return;
  }

  vec4 first = texture2D(textureSampler, vUV);
  vec4 depth = texture2D(prePass_ClipSpaceDepth, vUV);
  vec4 linearDepth = texture2D(prePass_Depth, vUV);
  vec4 normal = texture2D(prePass_Normal, vUV);
  vec4 worldNormal = texture2D(prePass_WorldNormal, vUV);
  vec4 worldPosition = texture2D(prePass_Position, vUV);
  vec4 localPosition = texture2D(prePass_LocalPosition, vUV);
  vec4 velocity = texture2D(prePass_Velocity, vUV);

  // mixes colors
  if (uv.x <= 0.125) { // show only base texture
    gl_FragColor = first;
  } else if (uv.x <= 0.25) { // show only depth texture
    gl_FragColor.rgb = depth.rgb;
    gl_FragColor.a = 1.0;
  } else if (uv.x <= 0.375) {
    gl_FragColor.rgb = linearDepth.rgb / vec3(maxDepth);
    gl_FragColor.a = 1.0;
  } else if (uv.x <= 0.5) {
    gl_FragColor.rgb = velocity.rgb;
    gl_FragColor.a = 1.0;
  } else if (uv.x <= 0.625) {
    gl_FragColor.rgb = worldPosition.rgb;
    gl_FragColor.a = 1.0;
  } else if (uv.x <= 0.75) {
    gl_FragColor.rgb = localPosition.rgb;
    gl_FragColor.a = 1.0;
  } else if (uv.x <= 0.875) {
    gl_FragColor.rgb = worldNormal.rgb;
    gl_FragColor.a = 1.0;
  } else { // normal
    gl_FragColor.rgb = normal.rgb * vec3(0.5, 0.5, 0.0) + vec3(0.5, 0.5, 0.0);
    gl_FragColor.a = 1.0;
  }

}