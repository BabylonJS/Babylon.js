layout(std140, column_major) uniform;

uniform BoundingBoxRenderer {
    vec4 color;
    mat4 world;
    mat4 viewProjection;
	mat4 viewProjectionR;
};
