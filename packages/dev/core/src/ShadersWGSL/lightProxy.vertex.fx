attribute position: vec3f;
flat varying vMask: u32;

uniform angleBias: f32;
uniform positionBias: vec2f;

// Declarations
#include<sceneUboDeclaration>
#include<meshUboDeclaration>
#include<instancesDeclaration>

#include<spotLightDeclaration>
#include<lightVxUboDeclaration>[0..1]

const DOWN = vec3f(0, -1, 0);

fn acosClamped(v: f32) -> f32 {
    return acos(clamp(v, 0, 1));
}

@vertex
fn main(input: VertexInputs) -> FragmentInputs {
#include<instancesVertex>
    let light = &light0.vLights[vertexInputs.instanceIndex];

    // Get the center (last column) and transformed offset (everything but the last column) of the projected position
    var projPosition = scene.viewProjection * finalWorld[3];
    let finalWorld3 = mat3x4(finalWorld[0], finalWorld[1], finalWorld[2]);
    let offset = scene.viewProjection * (finalWorld3 * vertexInputs.position);

    // For spot lights we keep it at the center if its larger than the spotlight angle
    let maxAngle = acos(light.direction.w);
    // We use the original position for this angle, it will get rotated to face the spotlight direction
    let angle = acos(dot(DOWN, normalize(vertexInputs.position))) + uniforms.angleBias;
    if angle < maxAngle {
        // Pointlights or positions within the angle of a spotlight
        projPosition += offset;
    }

    vertexOutputs.position = vec4f(
        // Offset the position in NDC space away from the center
        projPosition.xy + sign(offset.xy) * uniforms.positionBias * projPosition.w,
        // Since we don't write to depth just set this to 0 to prevent clipping
        0,
        projPosition.w
    );
    vertexOutputs.vMask = 1u << vertexInputs.instanceIndex;
}
