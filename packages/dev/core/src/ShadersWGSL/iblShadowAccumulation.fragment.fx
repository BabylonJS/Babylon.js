varying vUV: vec2f;

uniform accumulationParameters: vec4f;

#define remanence uniforms.accumulationParameters.x
#define resetb uniforms.accumulationParameters.y
#define sceneSize uniforms.accumulationParameters.z

var motionSampler: texture_2d<f32>;
var positionSampler: texture_2d<f32>;
var spatialBlurSampler : texture_2d<f32>;
var oldAccumulationSamplerSampler: sampler;
var oldAccumulationSampler: texture_2d<f32>;
var prevPositionSamplerSampler: sampler;
var prevPositionSampler: texture_2d<f32>;

fn max2(v: vec2f, w: vec2f) -> vec2f { 
  return  vec2f(max(v.x, w.x), max(v.y, w.y)); 
}

fn lessThan(x: vec2f, y: vec2f) -> vec2<bool> {
    return x < y;
}

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
  var reset: bool =  bool(resetb);
  var gbufferRes : vec2f = vec2f(textureDimensions(positionSampler, 0));
  var gbufferPixelCoord: vec2i =  vec2i(input.vUV * gbufferRes);
  var shadowRes : vec2f = vec2f(textureDimensions(spatialBlurSampler, 0));
  var shadowPixelCoord: vec2i =  vec2i(input.vUV * shadowRes);

  var LP: vec4f = textureLoad(positionSampler, gbufferPixelCoord, 0);
  if (0.0 == LP.w) {
    fragmentOutputs.color = vec4f(1.0, 0.0, 0.0, 1.0);
    return fragmentOutputs;
  }
  var velocityColor: vec2f = textureLoad(motionSampler, gbufferPixelCoord, 0).xy;
  var prevCoord: vec2f = input.vUV + velocityColor;
  var PrevLP: vec3f = textureSampleLevel(prevPositionSampler, prevPositionSamplerSampler, prevCoord, 0.0).xyz;
  var PrevShadows: vec4f = textureSampleLevel(oldAccumulationSampler, oldAccumulationSamplerSampler, prevCoord, 0.0);
  var newShadows : vec3f = textureLoad(spatialBlurSampler, shadowPixelCoord, 0).xyz;

  PrevShadows.a = select(1.0, max(PrevShadows.a / (1.0 + PrevShadows.a), 1.0 - remanence), !reset && all(lessThan(abs(prevCoord -  vec2f(0.5)),  vec2f(0.5))) &&
              distance(LP.xyz, PrevLP) < 5e-2 * sceneSize);
  PrevShadows = max( vec4f(0.0), PrevShadows);

  fragmentOutputs.color =  vec4f(mix(PrevShadows.x, newShadows.x, PrevShadows.a),
                                mix(PrevShadows.y, newShadows.y, PrevShadows.a),
                                mix(PrevShadows.z, newShadows.z, PrevShadows.a), PrevShadows.a);
}