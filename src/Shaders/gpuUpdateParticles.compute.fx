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
[[block]] struct Particles {
    particles : array<Particle>;
};

[[block]] struct SimParams {
    currentCount : f32;
    timeDelta : f32;
    stopFactor : f32;
    lifeTime : vec2<f32>;
    emitPower : vec2<f32>;

    #ifndef COLORGRADIENTS
        color1 : vec4<f32>;
        color2 : vec4<f32>;
    #endif

    sizeRange : vec2<f32>;
    scaleRange : vec4<f32>;
    angleRange : vec4<f32>;
    gravity : vec3<f32>;

    #ifdef LIMITVELOCITYGRADIENTS
        limitVelocityDamping : f32;
    #endif

    #ifdef ANIMATESHEET
        cellInfos : vec3<f32>;
    #endif

    #ifdef NOISE
        noiseStrength : vec3<f32>;
    #endif

    #ifndef LOCAL
        emitterWM : mat4x4<f32>;
    #endif

    // Emitter types

    #ifdef BOXEMITTER
        direction1 : vec3<f32>;
        direction2 : vec3<f32>;
        minEmitBox : vec3<f32>;
        maxEmitBox : vec3<f32>;
    #endif

    #ifdef CONEEMITTER
        radius : vec2<f32>;
        coneAngle : f32;
        height : vec2<f32>;
        directionRandomizer : f32;
    #endif

    #ifdef CYLINDEREMITTER
        radius : f32;
        height : f32;
        radiusRange : f32;
        #ifdef DIRECTEDCYLINDEREMITTER
            direction1 : vec3<f32>;
            direction2 : vec3<f32>;
        #else
            directionRandomizer : f32;
        #endif
    #endif

    #ifdef HEMISPHERICEMITTER
        radius : f32;
        radiusRange : f32;
        directionRandomizer : f32;
    #endif

    #ifdef POINTEMITTER
        direction1 : vec3<f32>;
        direction2 : vec3<f32>;
    #endif

    #ifdef SPHEREEMITTER
        radius : f32;
        radiusRange : f32;
        #ifdef DIRECTEDSPHEREEMITTER
            direction1 : vec3<f32>;
            direction2 : vec3<f32>;
        #else
            directionRandomizer : f32;
        #endif
    #endif
};

[[binding(0), group(0)]] var<uniform> params : SimParams;
[[binding(1), group(0)]] var<storage> particlesIn : [[access(read)]] Particles;
[[binding(2), group(0)]] var<storage> particlesOut : [[access(write)]] Particles;
[[binding(3), group(0)]] var randomSampler : sampler;
[[binding(4), group(0)]] var randomTexture : texture_2d<f32>;
[[binding(5), group(0)]] var randomSampler2 : sampler;
[[binding(6), group(0)]] var randomTexture2 : texture_2d<f32>;

#ifdef SIZEGRADIENTS
    [[binding(0), group(1)]] var sizeGradientSampler : sampler;
    [[binding(1), group(1)]] var sizeGradientTexture : texture_2d<f32>;
#endif 

#ifdef ANGULARSPEEDGRADIENTS
    [[binding(2), group(1)]] var angularSpeedGradientSampler : sampler;
    [[binding(3), group(1)]] var angularSpeedGradientTexture : texture_2d<f32>;
#endif 

#ifdef VELOCITYGRADIENTS
    [[binding(4), group(1)]] var velocityGradientSampler : sampler;
    [[binding(5), group(1)]] var velocityGradientTexture : texture_2d<f32>;
#endif

#ifdef LIMITVELOCITYGRADIENTS
    [[binding(6), group(1)]] var limitVelocityGradientSampler : sampler;
    [[binding(7), group(1)]] var limitVelocityGradientTexture : texture_2d<f32>;
#endif

#ifdef DRAGGRADIENTS
    [[binding(8), group(1)]] var dragGradientSampler : sampler;
    [[binding(9), group(1)]] var dragGradientTexture : texture_2d<f32>;
#endif

#ifdef NOISE
    [[binding(10), group(1)]] var noiseSampler : sampler;
    [[binding(11), group(1)]] var noiseTexture : texture_2d<f32>;
#endif


[[stage(compute), workgroup_size(64)]]
fn main([[builtin(global_invocation_id)]] GlobalInvocationID : vec3<u32>) {
    let index : u32 = GlobalInvocationID.x;

    if (index >= u32(params.currentCount)) {
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
