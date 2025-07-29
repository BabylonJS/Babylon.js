attribute position: vec3f;
flat varying vOffset: u32;
flat varying vMask: u32;

// Uniforms
#include<sceneUboDeclaration>

var lightDataTexture: texture_2d<f32>;
uniform tileMaskResolution: vec3f;
uniform halfTileRes: vec2f;

#include<clusteredLightFunctions>

@vertex
fn main(input: VertexInputs) -> FragmentInputs {
    let light = getClusteredSpotLight(lightDataTexture, vertexInputs.instanceIndex);

    // We don't apply the view matrix to the disc since we want it always facing the camera
    let viewPosition = scene.view * vec4f(light.vLightData.xyz, 1) + vec4f(vertexInputs.position * light.vLightFalloff.x, 0);
    let projPosition = scene.projection * viewPosition;

    // Convert to NDC 0->1 space and scale to the tile resolution
    var tilePosition = (projPosition.xy / projPosition.w + 1.0) / 2.0 * uniforms.tileMaskResolution.xy;
    // Round to a whole tile boundary with a bit of wiggle room
    tilePosition = select(floor(tilePosition) - 0.01, ceil(tilePosition) + 0.01, vertexInputs.position.xy > vec2f(0));

    // We don't care about depth and don't want it to be clipped so set Z to 0
    vertexOutputs.position = vec4f(tilePosition / uniforms.tileMaskResolution.xy * 2.0 - 1.0, 0, 1);
    let uResolution = vec2u(uniforms.tileMaskResolution.xy);
    vertexOutputs.vOffset = vertexInputs.instanceIndex / CLUSTLIGHT_BATCH * uResolution.x * uResolution.y;
    vertexOutputs.vMask = 1u << vertexInputs.instanceIndex;
}
