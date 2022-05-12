uniform float depthValue;

const vec2 pos[4] = {
    vec2(-1.0, 1.0),
    vec2(1.0, 1.0),
    vec2(-1.0, -1.0),
    vec2(1.0, -1.0)
};


#define CUSTOM_VERTEX_DEFINITIONS

void main(void) {

#define CUSTOM_VERTEX_MAIN_BEGIN

    gl_Position = vec4(pos[gl_VertexID], depthValue, 1.0);

#define CUSTOM_VERTEX_MAIN_END
}
