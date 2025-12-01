#include<sceneUboDeclaration>
#include<meshUboDeclaration>

attribute position : vec3f;

varying vWorldPos: vec4f;

@vertex
fn main(input : VertexInputs) -> FragmentInputs {
    let worldPos = mesh.world * vec4f(vertexInputs.position, 1.0);

    vertexOutputs.vWorldPos = worldPos;
    vertexOutputs.position = scene.viewProjection * worldPos;
}
