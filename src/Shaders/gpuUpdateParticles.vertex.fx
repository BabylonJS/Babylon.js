#version 300 es

uniform float timeDelta;

// Particles state
in vec3 position;
in float age;
in float life;
in vec3 velocity;

// Output
out vec3 outPosition;
out float outAge;
out float outLife;
out vec3 outVelocity;

void main() {
  if (age >= life) {
    // Create the particle at origin
    outPosition = vec3(0, 0, 0);

    // Age and life
    outAge = 0.0;
    outLife = life;

    // Initial velocity
    outVelocity = vec3(0, 1, 0);
  } else {
    outPosition = position + velocity * timeDelta;
    outAge = age + timeDelta;
    outLife = life;
    outVelocity = velocity;
  }
}