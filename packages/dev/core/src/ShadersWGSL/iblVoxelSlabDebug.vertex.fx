attribute position: vec3f;
varying vNormalizedPosition: vec3f;

uniform world: mat4x4f;
uniform invWorldScale: mat4x4f;
uniform cameraViewMatrix: mat4x4f;
uniform projection: mat4x4f;
uniform viewMatrix: mat4x4f;

@vertex
fn main(input : VertexInputs) -> FragmentInputs {
  var worldPosition: vec4f = (uniforms.world *  vec4f(vertexInputs.position, 1.));
  vertexOutputs.position = uniforms.projection * uniforms.cameraViewMatrix * worldPosition;
  vertexOutputs.vNormalizedPosition = (uniforms.viewMatrix * uniforms.invWorldScale * worldPosition).rgb;
  vertexOutputs.vNormalizedPosition = vertexOutputs.vNormalizedPosition *  vec3f(0.5) +  vec3f(0.5);
}