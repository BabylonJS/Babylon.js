layout(std140, column_major) uniform;

uniform Mesh
{
    mat4 world;
    float visibility;
};

#define WORLD_UBO