layout(std140, column_major) uniform;

uniform Scene {
    mat4 viewProjection;
#ifdef MULTIVIEW
	mat4 viewProjectionR;
#endif 
	mat4 view;
	mat4 projection;
    vec4 vEyePosition;
};

