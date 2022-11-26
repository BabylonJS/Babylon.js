attribute vec3 position;
attribute vec2 offset;

uniform mat4 view;
uniform mat4 projection;
uniform vec2 size;

varying vec2 uv;
varying vec3 viewPos;
varying float sphereRadius;

#ifdef FLUIDRENDERING_VELOCITY
    attribute vec3 velocity;
    varying float velocityNorm;
#endif

void main(void) {
    vec3 cornerPos;
    cornerPos.xy = vec2(offset.x - 0.5, offset.y - 0.5) * size;
    cornerPos.z = 0.0;

    viewPos = (view * vec4(position, 1.0)).xyz;

    gl_Position = projection * vec4(viewPos + cornerPos, 1.0);

    uv = offset;
    sphereRadius = size.x / 2.0;
#ifdef FLUIDRENDERING_VELOCITY
    velocityNorm = length(velocity);
#endif
}
