attribute vec3 position;
attribute vec2 offset;

uniform mat4 view;
uniform mat4 projection;

#ifdef FLUIDRENDERING_PER_PARTICLE_SIZE
    #ifdef FLUIDRENDERING_PER_PARTICLE_SIZE_VEC3
        attribute vec3 size;
    #else
        attribute vec2 size;
    #endif
#else
    uniform vec2 size;
#endif

varying vec2 uv;
varying vec3 viewPos;
varying float sphereRadius;

#ifdef FLUIDRENDERING_VELOCITY
    attribute vec3 velocity;
    varying float velocityNorm;
#endif

void main(void) {
#ifdef FLUIDRENDERING_PER_PARTICLE_SIZE_VEC3
    vec2 particleSize = size.yz * size.x;
#else
    vec2 particleSize = size;
#endif
#ifdef FLUIDRENDERING_CENTERED_OFFSET
    vec2 fluidOffset = offset + vec2(0.5);
#else
    vec2 fluidOffset = offset;
#endif
    vec3 cornerPos;
    cornerPos.xy = (fluidOffset - vec2(0.5)) * particleSize;
    cornerPos.z = 0.0;

    viewPos = (view * vec4(position, 1.0)).xyz;

    gl_Position = projection * vec4(viewPos + cornerPos, 1.0);

    uv = fluidOffset;
    sphereRadius = particleSize.x / 2.0;
#ifdef FLUIDRENDERING_VELOCITY
    velocityNorm = length(velocity);
#endif
}
