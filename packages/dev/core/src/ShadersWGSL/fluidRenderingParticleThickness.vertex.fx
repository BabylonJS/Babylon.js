attribute vec3 position;
attribute vec2 offset;

uniform mat4 view;
uniform mat4 projection;
uniform vec2 size;

varying vec2 uv;

void main(void) {
    vec3 cornerPos;
    cornerPos.xy = vec2(offset.x - 0.5, offset.y - 0.5) * size;
    cornerPos.z = 0.0;

    vec3 viewPos = (view * vec4(position, 1.0)).xyz + cornerPos;

    gl_Position = projection * vec4(viewPos, 1.0);

    uv = offset;
}
