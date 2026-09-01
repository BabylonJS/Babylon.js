attribute position: vec3f;
attribute offset: vec2f;

uniform view: mat4x4f;
uniform projection: mat4x4f;

#ifdef FLUIDRENDERING_PER_PARTICLE_SIZE
    attribute size: vec2f;
#else
    uniform size: vec2f;
#endif

varying uv: vec2f;
varying viewPos: vec3f;
varying sphereRadius: f32;

#ifdef FLUIDRENDERING_VELOCITY
    attribute velocity: vec3f;
    varying velocityNorm: f32;
#endif

@vertex
fn main(input: VertexInputs) -> FragmentInputs {
#ifdef FLUIDRENDERING_PER_PARTICLE_SIZE
    var particleSize: vec2f = vertexInputs.size;
#else
    var particleSize: vec2f = uniforms.size;
#endif

    var cornerPos: vec3f = vec3f(
        vec2f(vertexInputs.offset.x - 0.5, vertexInputs.offset.y - 0.5) * particleSize,
        0.0
    );

    vertexOutputs.viewPos = (uniforms.view * vec4f(vertexInputs.position, 1.0)).xyz;

    vertexOutputs.position = uniforms.projection * vec4f(vertexOutputs.viewPos + cornerPos, 1.0);

    vertexOutputs.uv = vertexInputs.offset;
    vertexOutputs.sphereRadius = particleSize.x / 2.0;
#ifdef FLUIDRENDERING_VELOCITY
    vertexOutputs.velocityNorm = length(velocity);
#endif
}
