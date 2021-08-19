[[block]]
struct Mesh {
    world : mat4x4<f32>;
    visibility : f32;
};

[[group(1), binding(1)]] var<uniform> mesh : Mesh;

#define WORLD_UBO
