layout(std140, column_major) uniform;

uniform Mesh
{
    mat4 world;
    mat4 worldView;
    mat4 worldViewProjection;
    float visibility;
};
