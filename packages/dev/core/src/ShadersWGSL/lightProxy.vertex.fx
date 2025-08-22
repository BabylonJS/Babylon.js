attribute position: vec3f;
flat varying vOffset: u32;
flat varying vMask: u32;

// Uniforms
#include<sceneUboDeclaration>

var lightDataTexture: texture_2d<f32>;
uniform tileMaskResolution: vec3f;
uniform halfTileRes: vec2f;

#include<clusteredLightingFunctions>

@vertex
fn main(input: VertexInputs) -> FragmentInputs {
    let light = getClusteredLight(lightDataTexture, vertexInputs.instanceIndex);
    let range = light.vLightFalloff.x;

    let viewPosition = scene.view * vec4f(light.vLightData.xyz, 1);
    let viewPositionSq = viewPosition * viewPosition;

    // Squared distance for both XZ and YZ
    let distSq = viewPositionSq.xy + viewPositionSq.z;
    // Compute the horizontal and vertical angles to rotate by to get the sphere horizon positions
    let sinSq = (range * range) / distSq;
    // Rotation is multiplied by cos (cos^2 and sin*cos) to scale down the vector after rotation
    let cosSq = max(1.0 - sinSq, vec2f(0.01));
    // Flip the sin values (reversing rotation) if the position is negative
    let sinCos = vertexInputs.position.xy * sqrt(sinSq * cosSq);

    // Apply rotation
    let rotatedX = mat2x2f(cosSq.x, -sinCos.x, sinCos.x, cosSq.x) * viewPosition.xz;
    let rotatedY = mat2x2f(cosSq.y, -sinCos.y, sinCos.y, cosSq.y) * viewPosition.yz;
    // Apply projection
    let projX = scene.projection * vec4f(rotatedX.x, 0, rotatedX.y, 1);
    let projY = scene.projection * vec4f(0, rotatedY.x, rotatedY.y, 1);
    // We really do be `max(..., 0.01)` all through this to get rid of them pesky zeros
    var projPosition = vec2f(projX.x / max(projX.w, 0.01), projY.y / max(projY.w, 0.01));
    // Override with screen extents if rotation invalid (occurs when inside the sphere)
    projPosition = select(vertexInputs.position.xy, projPosition, cosSq > vec2(0.01));

    // Convert to NDC 0->1 space and scale to the tile resolution
    let halfTileRes = uniforms.tileMaskResolution.xy / 2.0;
    var tilePosition = (projPosition + 1.0) * halfTileRes;
    // Round to a whole tile boundary with a bit of wiggle room
    tilePosition = select(floor(tilePosition) - 0.01, ceil(tilePosition) + 0.01, vertexInputs.position.xy > vec2f(0));

    // We don't care about depth and don't want it to be clipped so set Z to 0
    vertexOutputs.position = vec4f(tilePosition / halfTileRes - 1.0, 0, 1);
    vertexOutputs.vOffset = vertexInputs.instanceIndex / CLUSTLIGHT_BATCH;
    vertexOutputs.vMask = 1u << (vertexInputs.instanceIndex % CLUSTLIGHT_BATCH);
}
