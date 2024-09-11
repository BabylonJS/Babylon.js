varying vNormalizedPosition: vec3f;

uniform nearPlane: f32;
uniform farPlane: f32;
uniform stepSize: f32;
@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
  var normPos: vec3f = input.vNormalizedPosition.xyz;
  var chunkSize: f32 = uniforms.stepSize *  f32(MAX_DRAW_BUFFERS);
  var numChunks: f32 = 1.0 / chunkSize;
  var positionInChunk: f32 = fract(normPos.z / chunkSize);
  var slab: f32 = floor(positionInChunk *  f32(MAX_DRAW_BUFFERS)) /
                f32(MAX_DRAW_BUFFERS);
  if (normPos.x < 0.0 || normPos.y < 0.0 || normPos.z < 0.0 ||
      normPos.x > 1.0 || normPos.y > 1.0 || normPos.z > 1.0) {
    fragmentOutputs.color =  vec4f(0.0, 0.0, 0.0, 0.0);
  } else {
    fragmentOutputs.color =  vec4f(slab, 0.0, 0.0, 0.75);
  }
}