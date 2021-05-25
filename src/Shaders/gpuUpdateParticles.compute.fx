struct Particle {
    position : vec3<f32>;
    age : f32;
    size : vec3<f32>;
    life : f32;
    seed : vec4<f32>;
    direction : vec3<f32>;
    dummy0: f32;

    #ifdef CUSTOMEMITTER
        initialPosition : vec3<f32>;
        dummy1: f32;
    #endif
    #ifndef COLORGRADIENTS
        color : vec4<f32>;
    #endif
    #ifndef BILLBOARD
        initialDirection : vec3<f32>;
        dummy2: f32;
    #endif
    #ifdef NOISE
        noiseCoordinates1 : vec3<f32>;
        dummy3: f32;
        noiseCoordinates2 : vec3<f32>;
        dummy4: f32;
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
[[binding(2), group(0)]] var<storage> particlesOut : [[access(read_write)]] Particles;
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

fn getRandomVec3(offset : f32, vertexID : f32) -> vec3<f32> {
    return textureSampleLevel(randomTexture2, randomSampler2, vec2<f32>(vertexID * offset / params.currentCount, 0.), 0.).rgb;
}

fn getRandomVec4(offset : f32, vertexID : f32) -> vec4<f32> {
    return textureSampleLevel(randomTexture, randomSampler, vec2<f32>(vertexID * offset / params.currentCount, 0.), 0.);
}

[[stage(compute), workgroup_size(64)]]
fn main([[builtin(global_invocation_id)]] GlobalInvocationID : vec3<u32>) {
    let index : u32 = GlobalInvocationID.x;
    let vertexID : f32 = f32(index);

    if (index >= u32(params.currentCount)) {
        return;
    }

    let PI : f32 = 3.14159;
    let timeDelta : f32 = params.timeDelta;
    let newAge : f32 = particlesIn.particles[index].age + timeDelta;
    let life : f32 = particlesIn.particles[index].life;
    let seed : vec4<f32> = particlesIn.particles[index].seed;
    let direction : vec3<f32> = particlesIn.particles[index].direction;

    // If particle is dead and system is not stopped, spawn as new particle
    if (newAge >= life && params.stopFactor != 0.) {
        var newPosition : vec3<f32>;
        var newDirection : vec3<f32>;

        // Let's get some random values
        let randoms : vec4<f32> = getRandomVec4(seed.x, vertexID);

        // Age and life
        let outLife : f32 = params.lifeTime.x + (params.lifeTime.y - params.lifeTime.x) * randoms.r;
        particlesOut.particles[index].life = outLife;
        particlesOut.particles[index].age = newAge - life;

        // Seed
        particlesOut.particles[index].seed = seed;

        // Size
        var sizex : f32;
        #ifdef SIZEGRADIENTS    
            sizex = textureSampleLevel(sizeGradientTexture, sizeGradientSampler, vec2<f32>(0., 0.), 0.).r;
        #else
            sizex = params.sizeRange.x + (params.sizeRange.y - params.sizeRange.x) * randoms.g;
        #endif
        particlesOut.particles[index].size = vec3<f32>(
            sizex,
            params.scaleRange.x + (params.scaleRange.y - params.scaleRange.x) * randoms.b,
            params.scaleRange.z + (params.scaleRange.w - params.scaleRange.z) * randoms.a);

        // Color
        #ifndef COLORGRADIENTS
            particlesOut.particles[index].color = params.color1 + (params.color2 - params.color1) * randoms.b;
        #endif

        // Angular speed
        #ifndef ANGULARSPEEDGRADIENTS    
            particlesOut.particles[index].angle = vec2<f32>(
                params.angleRange.z + (params.angleRange.w - params.angleRange.z) * randoms.r,
                params.angleRange.x + (params.angleRange.y - params.angleRange.x) * randoms.a);
        #else
            particlesOut.particles[index].angle = params.angleRange.z + (params.angleRange.w - params.angleRange.z) * randoms.r;
        #endif        

        // Position / Direction (based on emitter type)
        #if defined(POINTEMITTER)
            let randoms2 : vec3<f32> = getRandomVec3(seed.y, vertexID);
            let randoms3 : vec3<f32> = getRandomVec3(seed.z, vertexID);

            newPosition = vec3<f32>(0., 0., 0.);

            newDirection = params.direction1 + (params.direction2 - params.direction1) * randoms3;
        #elif defined(BOXEMITTER)
            let randoms2 : vec3<f32> = getRandomVec3(seed.y, vertexID);
            let randoms3 : vec3<f32> = getRandomVec3(seed.z, vertexID);

            newPosition = params.minEmitBox + (params.maxEmitBox - params.minEmitBox) * randoms2;
            newDirection = params.direction1 + (params.direction2 - params.direction1) * randoms3;    
        #elif defined(HEMISPHERICEMITTER)
            let randoms2 : vec3<f32> = getRandomVec3(seed.y, vertexID);
            let randoms3 : vec3<f32> = getRandomVec3(seed.z, vertexID);

            // Position on the sphere surface
            let phi : f32 = 2.0 * PI * randoms2.x;
            let theta : f32 = acos(-1.0 + 2.0 * randoms2.y);
            let randX : f32 = cos(phi) * sin(theta);
            let randY : f32 = cos(theta);
            let randZ : f32 = sin(phi) * sin(theta);

            newPosition = (params.radius - (params.radius * params.radiusRange * randoms2.z)) * vec3<f32>(randX, abs(randY), randZ);
            newDirection = normalize(newPosition + params.directionRandomizer * randoms3);
        #elif defined(SPHEREEMITTER)
            let randoms2 : vec3<f32> = getRandomVec3(seed.y, vertexID);
            let randoms3 : vec3<f32> = getRandomVec3(seed.z, vertexID);

            // Position on the sphere surface
            let phi : f32 = 2.0 * PI * randoms2.x;
            let theta : f32 = acos(-1.0 + 2.0 * randoms2.y);
            let randX : f32 = cos(phi) * sin(theta);
            let randY : f32 = cos(theta);
            let randZ : f32 = sin(phi) * sin(theta);

            newPosition = (params.radius - (params.radius * params.radiusRange * randoms2.z)) * vec3<f32>(randX, randY, randZ);

            // Direction
            #ifdef DIRECTEDSPHEREEMITTER
                newDirection = normalize(params.direction1 + (params.direction2 - params.direction1) * randoms3);
            #else
                newDirection = normalize(newPosition + params.directionRandomizer * randoms3);
            #endif
        #elif defined(CYLINDEREMITTER)
            let randoms2 : vec3<f32> = getRandomVec3(seed.y, vertexID);
            let randoms3 : vec3<f32> = getRandomVec3(seed.z, vertexID);

            // Position on the cylinder
            let yPos : f32 = (-0.5 + randoms2.x) * params.height;
            var angle : f32 = randoms2.y * PI * 2.;
            let inverseRadiusRangeSquared : f32 = (1. - params.radiusRange) * (1. - params.radiusRange);
            let positionRadius : f32 = params.radius * sqrt(inverseRadiusRangeSquared + randoms2.z * (1. - inverseRadiusRangeSquared));
            let xPos : f32 = positionRadius * cos(angle);
            let zPos : f32 = positionRadius * sin(angle);

            newPosition = vec3<f32>(xPos, yPos, zPos);

            #ifdef DIRECTEDCYLINDEREMITTER
                newDirection = params.direction1 + (params.direction2 - params.direction1) * randoms3;
            #else
                // Direction
                angle = angle + (-0.5 + randoms3.x) * PI * params.directionRandomizer;
                newDirection = vec3<f32>(cos(angle), (-0.5 + randoms3.y) * params.directionRandomizer, sin(angle));
                newDirection = normalize(newDirection);
            #endif
        #elif defined(CONEEMITTER)
            let randoms2 : vec3<f32> = getRandomVec3(seed.y, vertexID);

            let s : f32 = 2.0 * PI * randoms2.x;

            #ifdef CONEEMITTERSPAWNPOINT
                let h : f32 = 0.0001;
            #else
                var h : f32 = randoms2.y * params.height.y;
                
                // Better distribution in a cone at normal angles.
                h = 1. - h * h;        
            #endif

            var lRadius : f32 = params.radius.x - params.radius.x * randoms2.z * params.radius.y;
            lRadius = lRadius * h;

            let randX : f32 = lRadius * sin(s);
            let randZ : f32 = lRadius * cos(s);
            let randY : f32 = h  * params.height.x;

            newPosition = vec3<f32>(randX, randY, randZ); 

            // Direction
            if (abs(cos(params.coneAngle)) == 1.0) {
                newDirection = vec3<f32>(0., 1.0, 0.);
            } else {
                let randoms3 : vec3<f32> = getRandomVec3(seed.z, vertexID);
                newDirection = normalize(newPosition + params.directionRandomizer * randoms3);        
            }
        #elif defined(CUSTOMEMITTER)
            newPosition = particlesIn.particles[index].initialPosition;
            particlesOut.particles[index].initialPosition = newPosition;
        #else    
            // Create the particle at origin
            newPosition = vec3<f32>(0., 0., 0.);

            // Spread in all directions
            newDirection = 2.0 * (getRandomVec3(seed.w, vertexID) - vec3<f32>(0.5, 0.5, 0.5));
        #endif

        let power : f32 = params.emitPower.x + (params.emitPower.y - params.emitPower.x) * randoms.a;

        #ifdef LOCAL
            particlesOut.particles[index].position = newPosition;
        #else
            particlesOut.particles[index].position = (params.emitterWM * vec4<f32>(newPosition, 1.)).xyz;
        #endif

        #ifdef CUSTOMEMITTER
            particlesOut.particles[index].direction = direction;
            #ifndef BILLBOARD        
                particlesOut.particles[index].initialDirection = direction;
            #endif
        #else
            #ifdef LOCAL
                let initial : vec3<f32> = newDirection;
            #else 
                let initial : vec3<f32> = (params.emitterWM * vec4<f32>(newDirection, 0.)).xyz;
            #endif
            particlesOut.particles[index].direction = initial * power;
            #ifndef BILLBOARD        
                particlesOut.particles[index].initialDirection = initial;
            #endif
        #endif
        #ifdef ANIMATESHEET      
            particlesOut.particles[index].cellIndex = params.cellInfos.x;

            #ifdef ANIMATESHEETRANDOMSTART
                particlesOut.particles[index].cellStartOffset = randoms.a * outLife;
            #endif    
        #endif

        #ifdef NOISE
            particlesOut.particles[index].noiseCoordinates1 = particlesIn.particles[index].noiseCoordinates1;
            particlesOut.particles[index].noiseCoordinates2 = particlesIn.particles[index].noiseCoordinates2;
        #endif
    } else {
        // move the particle
        var directionScale : f32 = timeDelta;
        particlesOut.particles[index].age = newAge;
        let ageGradient : f32 = newAge / life;

        #ifdef VELOCITYGRADIENTS
            directionScale = directionScale * textureSampleLevel(velocityGradientTexture, velocityGradientSampler, vec2<f32>(ageGradient, 0.), 0.).r;
        #endif

        #ifdef DRAGGRADIENTS
            directionScale = directionScale * (1.0 - textureSampleLevel(dragGradientTexture, dragGradientSampler, vec2<f32>(ageGradient, 0.), 0.).r);
        #endif

        let position : vec3<f32> = particlesIn.particles[index].position;
        #if defined(CUSTOMEMITTER)
            particlesOut.particles[index].position = position + (direction - position) * ageGradient;    
            particlesOut.particles[index].initialPosition = particlesIn.particles[index].initialPosition;
        #else
            particlesOut.particles[index].position = position + direction * directionScale;
        #endif
            
        particlesOut.particles[index].life = life;
        particlesOut.particles[index].seed = seed;
        #ifndef COLORGRADIENTS    
            particlesOut.particles[index].color = particlesIn.particles[index].color;
        #endif

        #ifdef SIZEGRADIENTS
            particlesOut.particles[index].size = vec3<f32>(
                textureSampleLevel(sizeGradientTexture, sizeGradientSampler, vec2<f32>(ageGradient, 0.), 0.).r,
                particlesIn.particles[index].size.yz);
        #else
            particlesOut.particles[index].size = particlesIn.particles[index].size;
        #endif 

        #ifndef BILLBOARD    
            particlesOut.particles[index].initialDirection = particlesIn.particles[index].initialDirection;
        #endif

        #ifdef CUSTOMEMITTER
            particlesOut.particles[index].direction = direction;
        #else
            var updatedDirection : vec3<f32> = direction + params.gravity * timeDelta;

            #ifdef LIMITVELOCITYGRADIENTS
                let limitVelocity : f32 = textureSampleLevel(limitVelocityGradientTexture, limitVelocityGradientSampler, vec2<f32>(ageGradient, 0.), 0.).r;

                let currentVelocity : f32 = length(updatedDirection);

                if (currentVelocity > limitVelocity) {
                    updatedDirection = updatedDirection * params.limitVelocityDamping;
                }
            #endif

            particlesOut.particles[index].direction = updatedDirection;

            #ifdef NOISE
                let noiseCoordinates1 : vec3<f32> = particlesIn.particles[index].noiseCoordinates1;
                let noiseCoordinates2 : vec3<f32> = particlesIn.particles[index].noiseCoordinates2;
                
                let fetchedR : f32 = textureSampleLevel(noiseTexture, noiseSampler, vec2<f32>(noiseCoordinates1.x, noiseCoordinates1.y) * vec2<f32>(0.5, 0.5) + vec2<f32>(0.5, 0.5), 0.).r;
                let fetchedG : f32 = textureSampleLevel(noiseTexture, noiseSampler, vec2<f32>(noiseCoordinates1.z, noiseCoordinates2.x) * vec2<f32>(0.5, 0.5) + vec2<f32>(0.5, 0.5), 0.).r;
                let fetchedB : f32 = textureSampleLevel(noiseTexture, noiseSampler, vec2<f32>(noiseCoordinates2.y, noiseCoordinates2.z) * vec2<f32>(0.5, 0.5) + vec2<f32>(0.5, 0.5), 0.).r;

                let force : vec3<f32> = vec3<f32>(-1. + 2. * fetchedR, -1. + 2. * fetchedG, -1. + 2. * fetchedB) * params.noiseStrength;

                particlesOut.particles[index].direction = particlesOut.particles[index].direction + force * timeDelta;

                particlesOut.particles[index].noiseCoordinates1 = noiseCoordinates1;
                particlesOut.particles[index].noiseCoordinates2 = noiseCoordinates2;
            #endif    
        #endif 

        #ifdef ANGULARSPEEDGRADIENTS
            let angularSpeed : f32 = textureSampleLevel(angularSpeedGradientTexture, angularSpeedGradientSampler, vec2<f32>(ageGradient, 0.), 0.).r;
            particlesOut.particles[index].angle = particlesIn.particles[index].angle + angularSpeed * timeDelta;
        #else
            let angle : vec2<f32> = particlesIn.particles[index].angle;
            particlesOut.particles[index].angle = vec2<f32>(angle.x + angle.y * timeDelta, angle.y);
        #endif

        #ifdef ANIMATESHEET      
            var offsetAge : f32 = particlesOut.particles[index].age;
            let dist : f32 = params.cellInfos.y - params.cellInfos.x;

            #ifdef ANIMATESHEETRANDOMSTART
                let cellStartOffset : f32 = particlesIn.particles[index].cellStartOffset;
                particlesOut.particles[index].cellStartOffset = cellStartOffset;
                offsetAge = offsetAge + cellStartOffset;
            #else
                let cellStartOffset : f32 = 0.;
            #endif    

            let ratio : f32 = clamp(((cellStartOffset + params.cellInfos.z * offsetAge) % life) / life, 0., 1.0);

            particlesOut.particles[index].cellIndex = f32(i32(params.cellInfos.x + ratio * dist));
        #endif
    }
}
