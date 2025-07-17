attribute position: vec3f;
flat varying vMask: u32;

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
    let light = &light0.vLights[vertexInputs.instanceIndex];
    var maxAngle = acosClamped(light.direction.w);
    // We allow some wiggle room equal to the difference between two vertical sphere segments
    maxAngle += SEGMENT_ANGLE;

    let angle = acosClamped(dot(DOWN, vertexInputs.position));
    var positionUpdated = vec3f(0);
    if angle < maxAngle {
        positionUpdated = vertexInputs.position;
    }
    positionUpdated *= light.diffuse.a;

#include<instancesVertex>

    vertexOutputs.position = scene.viewProjection * finalWorld * vec4f(positionUpdated, 1);
    // Since we don't write to depth just set this to 0 to prevent clipping
    vertexOutputs.position.z = 0.0;
    vertexOutputs.vMask = 1u << vertexInputs.instanceIndex;
}
