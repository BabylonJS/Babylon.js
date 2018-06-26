#version 300 es

#define PI 3.14159

uniform float currentCount;
uniform float timeDelta;
uniform float stopFactor;
uniform mat4 emitterWM;
uniform vec2 lifeTime;
uniform vec2 emitPower;
uniform vec2 sizeRange;
uniform vec4 scaleRange;
#ifndef COLORGRADIENTS
uniform vec4 color1;
uniform vec4 color2;
#endif
uniform vec3 gravity;
uniform sampler2D randomSampler;
uniform sampler2D randomSampler2;
uniform vec4 angleRange;

#ifdef BOXEMITTER
uniform vec3 direction1;
uniform vec3 direction2;
uniform vec3 minEmitBox;
uniform vec3 maxEmitBox;
#endif

#ifdef SPHEREEMITTER
uniform float radius;
uniform float radiusRange;
#ifdef DIRECTEDSPHEREEMITTER
  uniform vec3 direction1;
  uniform vec3 direction2;
#else
  uniform float directionRandomizer;
#endif
#endif

#ifdef CONEEMITTER
uniform float radius;
uniform float coneAngle;
uniform float height;
uniform float directionRandomizer;
#endif

// Particles state
in vec3 position;
in float age;
in float life;
in vec4 seed;
in vec3 size;
#ifndef COLORGRADIENTS
in vec4 color;
#endif
in vec3 direction;
#ifndef BILLBOARD
in vec3 initialDirection;
#endif
in vec2 angle;
#ifdef ANIMATESHEET
in float cellIndex;
#endif

// Output
out vec3 outPosition;
out float outAge;
out float outLife;
out vec4 outSeed;
out vec3 outSize;
#ifndef COLORGRADIENTS
out vec4 outColor;
#endif
out vec3 outDirection;
#ifndef BILLBOARD
out vec3 outInitialDirection;
#endif
out vec2 outAngle;
#ifdef ANIMATESHEET
out float outCellIndex;
#endif

#ifdef SIZEGRADIENTS
uniform sampler2D sizeGradientSampler;
#endif 

#ifdef ANIMATESHEET
uniform vec3 cellInfos;
#endif


vec3 getRandomVec3(float offset) {
  return texture(randomSampler2, vec2(float(gl_VertexID) * offset / currentCount, 0)).rgb;
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
#ifndef COLORGRADIENTS      
      outColor = vec4(0.,0.,0.,0.);
#endif
      outSize = vec3(0., 0., 0.);
#ifndef BILLBOARD        
      outInitialDirection = initialDirection;
#endif      
      outDirection = direction;
      outAngle = angle;
#ifdef ANIMATESHEET      
      outCellIndex = cellIndex;
#endif
      return;
    }
    vec3 position;
    vec3 direction;

    // Let's get some random values
    vec4 randoms = getRandomVec4(seed.x);

    // Age and life
    outAge = 0.0;
    outLife = lifeTime.x + (lifeTime.y - lifeTime.x) * randoms.r;

    // Seed
    outSeed = seed;

    // Size
    outSize.x = texture(sizeGradientSampler, vec2(0, 0)).r;
    outSize.y = scaleRange.x + (scaleRange.y - scaleRange.x) * randoms.b;
    outSize.z = scaleRange.z + (scaleRange.w - scaleRange.z) * randoms.a; 

#ifndef COLORGRADIENTS
    // Color
    outColor = color1 + (color2 - color1) * randoms.b;
#endif

    // Angular speed
    outAngle.y = angleRange.x + (angleRange.y - angleRange.x) * randoms.a;
    outAngle.x = angleRange.z + (angleRange.w - angleRange.z) * randoms.r;

    // Position / Direction (based on emitter type)
#ifdef BOXEMITTER
    vec3 randoms2 = getRandomVec3(seed.y);
    vec3 randoms3 = getRandomVec3(seed.z);

    position = minEmitBox + (maxEmitBox - minEmitBox) * randoms2;

    direction = direction1 + (direction2 - direction1) * randoms3;
#elif defined(SPHEREEMITTER)
    vec3 randoms2 = getRandomVec3(seed.y);
    vec3 randoms3 = getRandomVec3(seed.z);

    // Position on the sphere surface
    float phi = 2.0 * PI * randoms2.x;
    float theta = acos(2.0 * randoms2.y - 1.0);
    float randX = cos(phi) * sin(theta);
    float randY = cos(theta);
    float randZ = sin(phi) * sin(theta);

    position = (radius - (radius * radiusRange * randoms2.z)) * vec3(randX, randY, randZ);

    #ifdef DIRECTEDSPHEREEMITTER
      direction = direction1 + (direction2 - direction1) * randoms3;
    #else
      // Direction
      direction = position + directionRandomizer * randoms3;
    #endif
#elif defined(CONEEMITTER)
    vec3 randoms2 = getRandomVec3(seed.y);

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
    if (coneAngle == 0.) {
        direction = vec3(0., 1.0, 0.);
    } else {
        vec3 randoms3 = getRandomVec3(seed.z);
        direction = position + directionRandomizer * randoms3;
    }
#else    
    // Create the particle at origin
    position = vec3(0., 0., 0.);

    // Spread in all directions
    direction = 2.0 * (getRandomVec3(seed.w) - vec3(0.5, 0.5, 0.5));
#endif

    float power = emitPower.x + (emitPower.y - emitPower.x) * randoms.a;

    outPosition = (emitterWM * vec4(position, 1.)).xyz;
    vec3 initial = (emitterWM * vec4(direction, 0.)).xyz;
    outDirection = initial * power;
#ifndef BILLBOARD        
    outInitialDirection = initial;
#endif
#ifdef ANIMATESHEET      
    outCellIndex = cellInfos.x;
#endif

  } else {   
    outPosition = position + direction * timeDelta;
    outAge = age + timeDelta;
    outLife = life;
    outSeed = seed;
#ifndef COLORGRADIENTS    
    outColor = color;
#endif

#ifdef SIZEGRADIENTS
	outSize.x = texture(sizeGradientSampler, vec2(age / life, 0)).r;
    outSize.yz = size.yz;
#else
    outSize = size;
#endif 

#ifndef BILLBOARD    
    outInitialDirection = initialDirection;
#endif
    outDirection = direction + gravity * timeDelta;
    outAngle = vec2(angle.x + angle.y * timeDelta, angle.y);
#ifdef ANIMATESHEET      
    float dist = cellInfos.y - cellInfos.x;
    float ratio = clamp(mod(((outAge * cellInfos.z) / life), life), 0., 1.0);

    outCellIndex = float(int(cellInfos.x + ratio * dist));
#endif
  }
}