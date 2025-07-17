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
    let maxAngle = acosClamped(light.direction.w);
    let angle = acosClamped(dot(DOWN, vertexInputs.position));

    var positionUpdated = vec3f(0);
    // We allow some wiggle room equal to the rotation of one slice of the sphere
    if angle - maxAngle < 0.32 {
        positionUpdated = vertexInputs.position;
    }
    positionUpdated *= light.diffuse.a;

#include<instancesVertex>

    vertexOutputs.position = scene.viewProjection * finalWorld * vec4f(positionUpdated, 1);
    vertexOutputs.vMask = 1u << vertexInputs.instanceIndex;
}
