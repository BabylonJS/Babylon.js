uniform float depthValue;

const vec2 pos[4] = {
    vec2(-1.0, 1.0),
    vec2(1.0, 1.0),
    vec2(-1.0, -1.0),
    vec2(1.0, -1.0)
};

void main(void) {
    gl_Position = vec4(pos[gl_VertexID], depthValue, 1.0);
}
