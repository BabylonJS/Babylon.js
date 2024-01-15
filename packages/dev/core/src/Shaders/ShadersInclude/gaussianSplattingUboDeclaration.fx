layout(std140, column_major) uniform;

uniform Material
{
	vec2 viewport;
    vec2 dataTextureSize;
};

#include<sceneUboDeclaration>
#include<meshUboDeclaration>
