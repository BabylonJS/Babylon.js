#version 300 es

#define PI 3.14159

uniform float currentCount;
uniform float timeDelta;
uniform float stopFactor;
uniform vec3 generalRandoms;
uniform mat4 emitterWM;
uniform vec2 lifeTime;
uniform vec2 emitPower;
uniform vec2 sizeRange;
uniform vec4 color1;
uniform vec4 color2;
uniform vec3 gravity;
uniform sampler2D randomSampler;

#ifdef BOXEMITTER
uniform vec3 direction1;
uniform vec3 direction2;
uniform vec3 minEmitBox;
uniform vec3 maxEmitBox;
#endif

#ifdef SPHEREEMITTER
uniform float radius;
  #ifdef DIRECTEDSPHEREEMITTER
  uniform vec3 direction1;
  uniform vec3 direction2;
  #else
  uniform float directionRandomizer;
  #endif
#endif

#ifdef CONEEMITTER
uniform float radius;
uniform float angle;
uniform float height;
uniform float directionRandomizer;
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

vec4 getRandomVec4(float offset) {
  return texture(randomSampler, vec2(float(gl_VertexID) * offset / currentCount, 0));
}


void main() {
  if (age >= life) {
    if (stopFactor == 0.) {
      outPosition = position;
      outAge = life;
      outLife = life;
      outSeed = seed;
      outColor = vec4(0.,0.,0.,0.);
      outSize = 0.;
      outDirection = direction;
      return;
    }
    vec3 position;
    vec3 direction;

    // Let's get some random values
    vec4 randoms = getRandomVec4(generalRandoms.x);

    // Age and life
    outAge = 0.0;
    outLife = lifeTime.x + (lifeTime.y - lifeTime.x) * randoms.r;

    // Seed
    outSeed = seed;

    // Size
    outSize = sizeRange.x + (sizeRange.y - sizeRange.x) * randoms.g;

    // Color
    outColor = color1 + (color2 - color1) * randoms.b;

    // Position / Direction (based on emitter type)
#ifdef BOXEMITTER
    vec3 randoms2 = getRandomVec3(generalRandoms.y);
    vec3 randoms3 = getRandomVec3(generalRandoms.z);

    position = minEmitBox + (maxEmitBox - minEmitBox) * randoms2;

    direction = direction1 + (direction2 - direction1) * randoms3;
#elif defined(SPHEREEMITTER)
    vec3 randoms2 = getRandomVec3(generalRandoms.y);
    vec3 randoms3 = getRandomVec3(generalRandoms.z);

    // Position on the sphere surface
    float phi = 2.0 * PI * randoms2.x;
    float theta = PI * randoms2.y;
    float randX = cos(phi) * sin(theta);
    float randY = cos(theta);
    float randZ = sin(phi) * sin(theta);

    position = (radius * randoms2.z) * vec3(randX, randY, randZ);

    #ifdef DIRECTEDSPHEREEMITTER
      direction = direction1 + (direction2 - direction1) * randoms3;
    #else
      // Direction
      direction = position + directionRandomizer * randoms3;
    #endif
#elif defined(CONEEMITTER)
    vec3 randoms2 = getRandomVec3(generalRandoms.y);

    float s = 2.0 * PI * randoms2.x;
    float h = randoms2.y;
    
    // Better distribution in a cone at normal angles.
    h = 1. - h * h;
    float lRadius = radius * randoms2.z;
    lRadius = lRadius * h;

    float randX = lRadius * sin(s);
    float randZ = lRadius * cos(s);
    float randY = h  * height;

    position = vec3(randX, randY, randZ); 

    // Direction
    if (angle == 0.) {
        direction = vec3(0., 1.0, 0.);
    } else {
        vec3 randoms3 = getRandomVec3(generalRandoms.z);
        direction = position + directionRandomizer * randoms3;
    }
#else    
    // Create the particle at origin
    position = vec3(0., 0., 0.);

    // Spread in all directions
    direction = 2.0 * (getRandomVec3(seed) - vec3(0.5, 0.5, 0.5));
#endif

    float power = emitPower.x + (emitPower.y - emitPower.x) * randoms.a;

    outPosition = (emitterWM * vec4(position, 1.)).xyz;
    outDirection = (emitterWM * vec4(direction * power, 0.)).xyz;

  } else {   
    outPosition = position + direction * timeDelta;
    outAge = age + timeDelta;
    outLife = life;
    outSeed = seed;
    outColor = color;
    outSize = size;
    outDirection = direction + gravity * timeDelta;
  }
}