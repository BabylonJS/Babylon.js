layout(std140, column_major) uniform;

uniform Scene {
    mat4 viewProjection;
#ifdef MULTIVIEW
	mat4 viewProjectionR;
#endif 
	mat4 view;
    vec4 viewPosition;
};

