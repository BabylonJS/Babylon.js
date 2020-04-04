#version 300 es

#define PI 3.14159

uniform float currentCount;
uniform float timeDelta;
uniform float stopFactor;
#ifndef LOCAL
uniform mat4 emitterWM;
#endif
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

#ifdef POINTEMITTER
uniform vec3 direction1;
uniform vec3 direction2;
#endif

#ifdef HEMISPHERICEMITTER
uniform float radius;
uniform float radiusRange;
uniform float directionRandomizer;
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

#ifdef CYLINDEREMITTER
uniform float radius;
uniform float height;
uniform float radiusRange;
#ifdef DIRECTEDCYLINDEREMITTER
  uniform vec3 direction1;
  uniform vec3 direction2;
#else
  uniform float directionRandomizer;
#endif
#endif

#ifdef CONEEMITTER
uniform vec2 radius;
uniform float coneAngle;
uniform vec2 height;
uniform float directionRandomizer;
#endif

// Particles state
in vec3 position;
#ifdef CUSTOMEMITTER
in vec3 initialPosition;
#endif
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
#ifdef ANGULARSPEEDGRADIENTS
in float angle;
#else
in vec2 angle;
#endif
#ifdef ANIMATESHEET
in float cellIndex;
#ifdef ANIMATESHEETRANDOMSTART
in float cellStartOffset;
#endif
#endif
#ifdef NOISE
in vec3 noiseCoordinates1;
in vec3 noiseCoordinates2;
#endif

// Output
out vec3 outPosition;
#ifdef CUSTOMEMITTER
out vec3 outInitialPosition;
#endif
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
#ifdef ANGULARSPEEDGRADIENTS
out float outAngle;
#else
out vec2 outAngle;
#endif
#ifdef ANIMATESHEET
out float outCellIndex;
#ifdef ANIMATESHEETRANDOMSTART
out float outCellStartOffset;
#endif
#endif
#ifdef NOISE
out vec3 outNoiseCoordinates1;
out vec3 outNoiseCoordinates2;
#endif

#ifdef SIZEGRADIENTS
uniform sampler2D sizeGradientSampler;
#endif 

#ifdef ANGULARSPEEDGRADIENTS
uniform sampler2D angularSpeedGradientSampler;
#endif 

#ifdef VELOCITYGRADIENTS
uniform sampler2D velocityGradientSampler;
#endif

#ifdef LIMITVELOCITYGRADIENTS
uniform sampler2D limitVelocityGradientSampler;
uniform float limitVelocityDamping;
#endif

#ifdef DRAGGRADIENTS
uniform sampler2D dragGradientSampler;
#endif

#ifdef NOISE
uniform vec3 noiseStrength;
uniform sampler2D noiseSampler;
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
  float newAge = age + timeDelta;    

  // If particle is dead and system is not stopped, spawn as new particle
  if (newAge >= life && stopFactor != 0.) {
    vec3 newPosition;
    vec3 newDirection;

    // Let's get some random values
    vec4 randoms = getRandomVec4(seed.x);

    // Age and life
    outLife = lifeTime.x + (lifeTime.y - lifeTime.x) * randoms.r;
    outAge = newAge - life;

    // Seed
    outSeed = seed;

    // Size
#ifdef SIZEGRADIENTS    
    outSize.x = texture(sizeGradientSampler, vec2(0, 0)).r;
#else
    outSize.x = sizeRange.x + (sizeRange.y - sizeRange.x) * randoms.g;
#endif
    outSize.y = scaleRange.x + (scaleRange.y - scaleRange.x) * randoms.b;
    outSize.z = scaleRange.z + (scaleRange.w - scaleRange.z) * randoms.a; 

#ifndef COLORGRADIENTS
    // Color
    outColor = color1 + (color2 - color1) * randoms.b;
#endif

    // Angular speed
#ifndef ANGULARSPEEDGRADIENTS    
    outAngle.y = angleRange.x + (angleRange.y - angleRange.x) * randoms.a;
    outAngle.x = angleRange.z + (angleRange.w - angleRange.z) * randoms.r;
#else
    outAngle = angleRange.z + (angleRange.w - angleRange.z) * randoms.r;
#endif        

    // Position / Direction (based on emitter type)
#ifdef POINTEMITTER
    vec3 randoms2 = getRandomVec3(seed.y);
    vec3 randoms3 = getRandomVec3(seed.z);

    newPosition = vec3(0, 0, 0);

    newDirection = direction1 + (direction2 - direction1) * randoms3;
#elif defined(BOXEMITTER)
    vec3 randoms2 = getRandomVec3(seed.y);
    vec3 randoms3 = getRandomVec3(seed.z);

    newPosition = minEmitBox + (maxEmitBox - minEmitBox) * randoms2;

    newDirection = direction1 + (direction2 - direction1) * randoms3;    
#elif defined(HEMISPHERICEMITTER)
    vec3 randoms2 = getRandomVec3(seed.y);
    vec3 randoms3 = getRandomVec3(seed.z);

    // Position on the sphere surface
    float phi = 2.0 * PI * randoms2.x;
    float theta = acos(2.0 * randoms2.y - 1.0);
    float randX = cos(phi) * sin(theta);
    float randY = cos(theta);
    float randZ = sin(phi) * sin(theta);

    newPosition = (radius - (radius * radiusRange * randoms2.z)) * vec3(randX, abs(randY), randZ);
    newDirection = newPosition + directionRandomizer * randoms3;    
#elif defined(SPHEREEMITTER)
    vec3 randoms2 = getRandomVec3(seed.y);
    vec3 randoms3 = getRandomVec3(seed.z);

    // Position on the sphere surface
    float phi = 2.0 * PI * randoms2.x;
    float theta = acos(2.0 * randoms2.y - 1.0);
    float randX = cos(phi) * sin(theta);
    float randY = cos(theta);
    float randZ = sin(phi) * sin(theta);

    newPosition = (radius - (radius * radiusRange * randoms2.z)) * vec3(randX, randY, randZ);

    #ifdef DIRECTEDSPHEREEMITTER
      newDirection = direction1 + (direction2 - direction1) * randoms3;
    #else
      // Direction
      newDirection = newPosition + directionRandomizer * randoms3;
    #endif
#elif defined(CYLINDEREMITTER)
    vec3 randoms2 = getRandomVec3(seed.y);
    vec3 randoms3 = getRandomVec3(seed.z);

    // Position on the cylinder
    float yPos = (randoms2.x - 0.5)*height;
    float angle = randoms2.y * PI * 2.;
    float inverseRadiusRangeSquared = ((1.-radiusRange) * (1.-radiusRange));
    float positionRadius = radius*sqrt(inverseRadiusRangeSquared + (randoms2.z * (1.-inverseRadiusRangeSquared)));
    float xPos = positionRadius * cos(angle);
    float zPos = positionRadius * sin(angle);
    newPosition = vec3(xPos, yPos, zPos);

    #ifdef DIRECTEDCYLINDEREMITTER
      newDirection = direction1 + (direction2 - direction1) * randoms3;
    #else
      // Direction
      angle = angle + ((randoms3.x-0.5) * PI);
      newDirection = vec3(cos(angle), randoms3.y-0.5, sin(angle));
      newDirection = normalize(newDirection);
    #endif
#elif defined(CONEEMITTER)
    vec3 randoms2 = getRandomVec3(seed.y);

    float s = 2.0 * PI * randoms2.x;

    #ifdef CONEEMITTERSPAWNPOINT
        float h = 0.0001;
    #else
        float h = randoms2.y * height.y;
        
        // Better distribution in a cone at normal angles.
        h = 1. - h * h;        
    #endif

    float lRadius = radius.x - radius.x * randoms2.z * radius.y;
    lRadius = lRadius * h;

    float randX = lRadius * sin(s);
    float randZ = lRadius * cos(s);
    float randY = h  * height.x;

    newPosition = vec3(randX, randY, randZ); 

    // Direction
    if (abs(cos(coneAngle)) == 1.0) {
        newDirection = vec3(0., 1.0, 0.);
    } else {
        vec3 randoms3 = getRandomVec3(seed.z);
        newDirection = normalize(newPosition + directionRandomizer * randoms3);        
    }
#elif defined(CUSTOMEMITTER)
      newPosition = initialPosition;
      outInitialPosition = initialPosition;
#else    
    // Create the particle at origin
    newPosition = vec3(0., 0., 0.);

    // Spread in all directions
    newDirection = 2.0 * (getRandomVec3(seed.w) - vec3(0.5, 0.5, 0.5));
#endif

    float power = emitPower.x + (emitPower.y - emitPower.x) * randoms.a;

    #ifdef LOCAL
        outPosition = newPosition;
    #else
        outPosition = (emitterWM * vec4(newPosition, 1.)).xyz;
    #endif

#ifdef CUSTOMEMITTER
    outDirection = direction;
    #ifndef BILLBOARD        
        outInitialDirection = direction;
    #endif
#else
    #ifdef LOCAL
        vec3 initial = newDirection;
    #else 
        vec3 initial = (emitterWM * vec4(newDirection, 0.)).xyz;
    #endif
    outDirection = initial * power;
    #ifndef BILLBOARD        
        outInitialDirection = initial;
    #endif
#endif
#ifdef ANIMATESHEET      
    outCellIndex = cellInfos.x;

#ifdef ANIMATESHEETRANDOMSTART
    outCellStartOffset = randoms.a * outLife;
#endif    
#endif

#ifdef NOISE
    outNoiseCoordinates1 = noiseCoordinates1;
    outNoiseCoordinates2 = noiseCoordinates2;
#endif

  } else {
    float directionScale = timeDelta;
    outAge = newAge;
    float ageGradient = newAge / life;

#ifdef VELOCITYGRADIENTS
    directionScale *= texture(velocityGradientSampler, vec2(ageGradient, 0)).r;
#endif

#ifdef DRAGGRADIENTS
    directionScale *= 1.0 - texture(dragGradientSampler, vec2(ageGradient, 0)).r;
#endif

#if defined(CUSTOMEMITTER)
    outPosition = position + (direction - position) * ageGradient;    
    outInitialPosition = initialPosition;
#else
    outPosition = position + direction * directionScale;
#endif
    
    outLife = life;
    outSeed = seed;
#ifndef COLORGRADIENTS    
    outColor = color;
#endif

#ifdef SIZEGRADIENTS
	outSize.x = texture(sizeGradientSampler, vec2(ageGradient, 0)).r;
    outSize.yz = size.yz;
#else
    outSize = size;
#endif 

#ifndef BILLBOARD    
    outInitialDirection = initialDirection;
#endif

#ifdef CUSTOMEMITTER
    outDirection = direction;
#else
    vec3 updatedDirection = direction + gravity * timeDelta;

    #ifdef LIMITVELOCITYGRADIENTS
        float limitVelocity = texture(limitVelocityGradientSampler, vec2(ageGradient, 0)).r;

        float currentVelocity = length(updatedDirection);

        if (currentVelocity > limitVelocity) {
            updatedDirection = updatedDirection * limitVelocityDamping;
        }
    #endif

    outDirection = updatedDirection;

    #ifdef NOISE
        float fetchedR = texture(noiseSampler, vec2(noiseCoordinates1.x, noiseCoordinates1.y) * vec2(0.5) + vec2(0.5)).r;
        float fetchedG = texture(noiseSampler, vec2(noiseCoordinates1.z, noiseCoordinates2.x) * vec2(0.5) + vec2(0.5)).r;
        float fetchedB = texture(noiseSampler, vec2(noiseCoordinates2.y, noiseCoordinates2.z) * vec2(0.5) + vec2(0.5)).r;

        vec3 force = vec3(2. * fetchedR - 1., 2. * fetchedG - 1., 2. * fetchedB - 1.) * noiseStrength;

        outDirection = outDirection + force * timeDelta;

        outNoiseCoordinates1 = noiseCoordinates1;
        outNoiseCoordinates2 = noiseCoordinates2;
    #endif    
#endif 

#ifdef ANGULARSPEEDGRADIENTS
    float angularSpeed = texture(angularSpeedGradientSampler, vec2(ageGradient, 0)).r;
    outAngle = angle + angularSpeed * timeDelta;
#else
    outAngle = vec2(angle.x + angle.y * timeDelta, angle.y);
#endif

#ifdef ANIMATESHEET      
    float offsetAge = outAge;
    float dist = cellInfos.y - cellInfos.x;

#ifdef ANIMATESHEETRANDOMSTART
    outCellStartOffset = cellStartOffset;
    offsetAge += cellStartOffset;
#else
    float cellStartOffset = 0.;
#endif    

    float ratio = clamp(mod(cellStartOffset + cellInfos.z * offsetAge, life) / life, 0., 1.0);

    outCellIndex = float(int(cellInfos.x + ratio * dist));
#endif
  }
}