uniform Scene {
    viewProjection : mat4x4<f32>;
#ifdef MULTIVIEW
	viewProjectionR : mat4x4<f32>;
#endif 
    view : mat4x4<f32>;
    projection : mat4x4<f32>;
    vEyePosition : vec4<f32>;
};
