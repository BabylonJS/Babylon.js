#ifndef UBO_MESH
#define UBO_MESH

layout(std140, column_major) uniform;

uniform Mesh
{
    mat4 world;
    float visibility;
};

#endif