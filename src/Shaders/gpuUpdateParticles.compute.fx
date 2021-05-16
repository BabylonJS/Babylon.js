struct Particle {
    position : vec3<f32>;
    #ifdef CUSTOMEMITTER
        initialPosition : vec3<f32>;
    #endif
    age : f32;
    life : f32;
    seed : vec4<f32>;
    size : vec3<f32>;
    #ifndef COLORGRADIENTS
        color : vec4<f32>;
    #endif
    direction : vec3<f32>;
    #ifndef BILLBOARD
        initialDirection : vec3<f32>;
    #endif
    #ifdef ANGULARSPEEDGRADIENTS
        angle : f32;
    #else
        angle : vec2<f32>;
    #endif
    #ifdef ANIMATESHEET
        cellIndex : f32;
        #ifdef ANIMATESHEETRANDOMSTART
            cellStartOffset : f32;
        #endif
    #endif
    #ifdef NOISE
        noiseCoordinates1 : vec3<f32>;
        noiseCoordinates2 : vec3<f32>;
    #endif
};
[[block]] struct SimParams {
    numParticles: u32;
};
[[block]] struct Particles {
    particles : array<Particle>;
};

[[binding(0), group(0)]] var<uniform> params : SimParams;
[[binding(1), group(0)]] var<storage> particlesIn : [[access(read)]] Particles;
[[binding(2), group(0)]] var<storage> particlesOut : [[access(write)]] Particles;

[[stage(compute), workgroup_size(64)]]
fn main([[builtin(global_invocation_id)]] GlobalInvocationID : vec3<u32>) {
    let index : u32 = GlobalInvocationID.x;

    if (index >= params.numParticles) {
        return;
    }

    particlesOut.particles[index].position = particlesIn.particles[index].position;
    #ifdef CUSTOMEMITTER
        particlesOut.particles[index].initialPosition = particlesIn.particles[index].initialPosition;
    #endif
    particlesOut.particles[index].age = particlesIn.particles[index].age;
    particlesOut.particles[index].life = particlesIn.particles[index].life;
    particlesOut.particles[index].seed = particlesIn.particles[index].seed;
    particlesOut.particles[index].size = particlesIn.particles[index].size;
    #ifndef COLORGRADIENTS
        particlesOut.particles[index].color = particlesIn.particles[index].color;
    #endif
    particlesOut.particles[index].direction = particlesIn.particles[index].direction;
    #ifndef BILLBOARD
        particlesOut.particles[index].initialDirection = particlesIn.particles[index].initialDirection;
    #endif
    #ifdef ANGULARSPEEDGRADIENTS
        particlesOut.particles[index].angle = particlesIn.particles[index].angle;
    #else
        particlesOut.particles[index].angle = particlesIn.particles[index].angle;
    #endif
    #ifdef ANIMATESHEET
        particlesOut.particles[index].cellIndex = particlesIn.particles[index].cellIndex;
        #ifdef ANIMATESHEETRANDOMSTART
            particlesOut.particles[index].cellStartOffset = particlesIn.particles[index].cellStartOffset;
        #endif
    #endif
    #ifdef NOISE
        particlesOut.particles[index].noiseCoordinates1 = particlesIn.particles[index].noiseCoordinates1;
        particlesOut.particles[index].noiseCoordinates2 = particlesIn.particles[index].noiseCoordinates2;
    #endif
}
