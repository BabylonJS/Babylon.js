#version 300 es

uniform float currentCount;
uniform float timeDelta;
uniform vec2 generalRandoms;
uniform mat4 emitterWM;
uniform vec2 lifeTime;
uniform vec2 sizeRange;
uniform vec4 color1;
uniform vec4 color2;
uniform vec3 gravity;
uniform sampler2D randomSampler;

#ifdef BOXEMITTER
uniform vec3 direction1;
uniform vec3 direction2;
#endif

// Particles state
in vec3 position;
in float age;
in float life;
in float seed;
in float size;
in vec4 color;
in vec3 direction;

// Output
out vec3 outPosition;
out float outAge;
out float outLife;
out float outSeed;
out float outSize;
out vec4 outColor;
out vec3 outDirection;

vec3 getRandomVec3(float offset) {
  return texture(randomSampler, vec2(float(gl_VertexID) * offset / currentCount, 0)).rgb;
}

void main() {
  if (age >= life) {
    // Create the particle at origin
    outPosition = (emitterWM * vec4(0., 0., 0., 1.)).xyz;

    // Let's get some random values
    vec3 randoms = getRandomVec3(generalRandoms.x);
    vec3 randoms2 = getRandomVec3(generalRandoms.y);

    // Age and life
    outAge = 0.0;
    outLife = lifeTime.x + (lifeTime.y - lifeTime.x) * randoms.r;

    // Seed
    outSeed = seed;

    // Size
    outSize = sizeRange.x + (sizeRange.y - sizeRange.x) * randoms.g;

    // Color
    outColor = color1 + (color2 - color1) * randoms.b;

    // Direction
#ifdef BOXEMITTER
    outDirection = direction1 + (direction2 - direction1) * randoms2;
#else    
    outDirection = 2.0 * (getRandomVec3(seed) - vec3(0.5, 0.5, 0.5));
#endif
  } else {   
    outPosition = position + (direction + gravity) * timeDelta;
    outAge = age + timeDelta;
    outLife = life;
    outSeed = seed;
    outColor = color;
    outSize = size;
    outDirection = direction;
  }
}