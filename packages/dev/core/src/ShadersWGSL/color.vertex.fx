// Attributes
attribute position: vec3f;

#ifdef VERTEXCOLOR
attribute color: vec4f;
#endif

#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>

#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>

#ifdef FOG
	uniform view: mat4x4f;
#endif

// Uniforms

#include<instancesDeclaration>
uniform viewProjection: mat4x4f;


// Output
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
varying vColor: vec4f;
#endif


#define CUSTOM_VERTEX_DEFINITIONS

@vertex
fn main(input : VertexInputs) -> FragmentInputs {

#define CUSTOM_VERTEX_MAIN_BEGIN

#ifdef VERTEXCOLOR
    var colorUpdated: vec4f = vertexInputs.color;
#endif

#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
    var worldPos: vec4f = finalWorld *  vec4f(vertexInputs.position, 1.0);

	vertexOutputs.position = uniforms.viewProjection * worldPos;

#include<clipPlaneVertex>
#include<fogVertex>

#include<vertexColorMixing>

#define CUSTOM_VERTEX_MAIN_END
}