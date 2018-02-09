#version 300 es

uniform float timeDelta;
uniform float generalRandom;
uniform mat4 emitterWM;
uniform sampler2D randomSampler;

// Particles state
in vec3 position;
in float age;
in float life;
in float seed;
in vec3 direction;

// Output
out vec3 outPosition;
out float outAge;
out float outLife;
out float outSeed;
out vec3 outDirection;

float getRandomFloat() {
  return texture(randomSampler, vec2(float(gl_VertexID) * generalRandom, 0)).r;
}
 vec3 getRandomVec3() {
   return texture(randomSampler, vec2(float(gl_VertexID) * seed, 0)).rgb;
 }

void main() {
  if (age >= life) {
    // Create the particle at origin
    outPosition = (emitterWM * vec4(0., 0., 0., 1.)).xyz;

    // Age and life
    outAge = 0.0;
    outLife = getRandomFloat() * 15.0;

    // Seed
    outSeed = seed;

    // Direction
    outDirection = 2.0 * (getRandomVec3() -vec3(0.5, 0.5, 0.5));
  } else {
    outPosition = position + direction * timeDelta;
    outAge = age + timeDelta;
    outLife = life;
    outSeed = seed;
    outDirection = direction;
  }
}