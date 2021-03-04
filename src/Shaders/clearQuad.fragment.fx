[[block]] struct Uniforms {
  [[offset(0)]] color : vec4<f32>;
  [[offset(16)]] depthValue : f32;
};
[[binding(0), set(0)]] var<uniform> uniforms : Uniforms;

[[location(0)]] var<out> outColor : vec4<f32>;

[[stage(fragment)]]
fn main() -> void {
  outColor = uniforms.color;
  return;
}
