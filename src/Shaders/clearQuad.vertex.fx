#version 450

const vec2 pos[4] = vec2[4](vec2(-1.0f, 1.0f), vec2(1.0f, 1.0f), vec2(-1.0f, -1.0f), vec2(1.0f, -1.0f));

void main() {
    gl_Position = vec4(pos[gl_VertexIndex], 0.0, 1.0);
}
