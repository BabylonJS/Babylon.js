attribute position: vec3f;
flat varying vMask: u32;

// Uniforms
#include<sceneUboDeclaration>
#include<spotLightDeclaration>
#include<lightVxUboDeclaration>[0..1]

uniform halfTileRes: vec2f;

@vertex
fn main(input: VertexInputs) -> FragmentInputs {
    let light = &light0.vLights[vertexInputs.instanceIndex];

    // We don't apply the view matrix to the disc since we want it always facing the camera
    let viewPosition = scene.view * vec4f(light.position.xyz, 1) + vec4f(vertexInputs.position * light.falloff.x, 0);
    let projPosition = scene.projection * viewPosition;

    // Convert to NDC space and scale to the tile resolution
    var tilePosition = projPosition.xy / projPosition.w * uniforms.halfTileRes;
    // Round to a whole tile boundary with a bit of wiggle room
    tilePosition = select(floor(tilePosition) - 0.01, ceil(tilePosition) + 0.01, vertexInputs.position.xy > vec2f(0));

    // We don't care about depth and don't want it to be clipped
    vertexOutputs.position = vec4f(tilePosition.xy / uniforms.halfTileRes, 0, 1);
    vertexOutputs.vMask = 1u << vertexInputs.instanceIndex;
}
