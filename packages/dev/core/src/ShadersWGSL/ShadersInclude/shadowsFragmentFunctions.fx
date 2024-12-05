#ifdef SHADOWS
    #ifndef SHADOWFLOAT
        // Duplicate to prevent include in include issues
        fn unpack(color: vec4f) -> f32
        {
            const bit_shift: vec4f =  vec4f(1.0 / (255.0 * 255.0 * 255.0), 1.0 / (255.0 * 255.0), 1.0 / 255.0, 1.0);
            return dot(color, bit_shift);
        }
    #endif

    fn computeFallOff(value: f32, clipSpace: vec2f, frustumEdgeFalloff: f32) -> f32
    {
        var mask: f32 = smoothstep(1.0 - frustumEdgeFalloff, 1.00000012, clamp(dot(clipSpace, clipSpace), 0., 1.));
        return mix(value, 1.0, mask);
    }

    fn computeShadowCube(worldPos: vec3f, lightPosition: vec3f, shadowTexture: texture_cube<f32>, shadowSampler: sampler, darkness: f32, depthValues: vec2f) -> f32
    {
        var directionToLight: vec3f = worldPos - lightPosition;
        var depth: f32 = length(directionToLight);
        depth = (depth + depthValues.x) / (depthValues.y);
        depth = clamp(depth, 0., 1.0);

        directionToLight = normalize(directionToLight);
        directionToLight.y = -directionToLight.y;
        
        #ifndef SHADOWFLOAT
            var shadow: f32 = unpack(textureSample(shadowTexture, shadowSampler, directionToLight));
        #else
            var shadow: f32 = textureSample(shadowTexture, shadowSampler, directionToLight).x;
        #endif

        return select(1.0, darkness, depth > shadow);
    }
   
    fn computeShadowWithPoissonSamplingCube(worldPos: vec3f, lightPosition: vec3f, shadowTexture: texture_cube<f32>, shadowSampler: sampler, mapSize: f32, darkness: f32, depthValues: vec2f) -> f32
    {
        var directionToLight: vec3f = worldPos - lightPosition;
        var depth: f32 = length(directionToLight);
        depth = (depth + depthValues.x) / (depthValues.y);
        depth = clamp(depth, 0., 1.0);

        directionToLight = normalize(directionToLight);
        directionToLight.y = -directionToLight.y;

        var visibility: f32 = 1.;

        var poissonDisk: array<vec3f, 4>;
        poissonDisk[0] =  vec3f(-1.0, 1.0, -1.0);
        poissonDisk[1] =  vec3f(1.0, -1.0, -1.0);
        poissonDisk[2] =  vec3f(-1.0, -1.0, -1.0);
        poissonDisk[3] =  vec3f(1.0, -1.0, 1.0);

        // Poisson Sampling

        #ifndef SHADOWFLOAT
            if (unpack(textureSample(shadowTexture, shadowSampler, directionToLight + poissonDisk[0] * mapSize)) < depth) {visibility -= 0.25;};
            if (unpack(textureSample(shadowTexture, shadowSampler, directionToLight + poissonDisk[1] * mapSize)) < depth) {visibility -= 0.25;};
            if (unpack(textureSample(shadowTexture, shadowSampler, directionToLight + poissonDisk[2] * mapSize)) < depth) {visibility -= 0.25;};
            if (unpack(textureSample(shadowTexture, shadowSampler, directionToLight + poissonDisk[3] * mapSize)) < depth) {visibility -= 0.25;};
        #else
            if (textureSample(shadowTexture, shadowSampler, directionToLight + poissonDisk[0] * mapSize).x < depth) {visibility -= 0.25;};
            if (textureSample(shadowTexture, shadowSampler, directionToLight + poissonDisk[1] * mapSize).x < depth) {visibility -= 0.25;};
            if (textureSample(shadowTexture, shadowSampler, directionToLight + poissonDisk[2] * mapSize).x < depth) {visibility -= 0.25;};
            if (textureSample(shadowTexture, shadowSampler, directionToLight + poissonDisk[3] * mapSize).x < depth) {visibility -= 0.25;};
        #endif

        return  min(1.0, visibility + darkness);
    }

    fn computeShadowWithESMCube(worldPos: vec3f, lightPosition: vec3f, shadowTexture: texture_cube<f32>, shadowSampler: sampler, darkness: f32, depthScale: f32, depthValues: vec2f) -> f32
    {
        var directionToLight: vec3f = worldPos - lightPosition;
        var depth: f32 = length(directionToLight);
        depth = (depth + depthValues.x) / (depthValues.y);
        var shadowPixelDepth: f32 = clamp(depth, 0., 1.0);

        directionToLight = normalize(directionToLight);
        directionToLight.y = -directionToLight.y;
        
        #ifndef SHADOWFLOAT
            var shadowMapSample: f32 = unpack(textureSample(shadowTexture, shadowSampler, directionToLight));
        #else
            var shadowMapSample: f32 = textureSample(shadowTexture, shadowSampler, directionToLight).x;
        #endif

        var esm: f32 = 1.0 - clamp(exp(min(87., depthScale * shadowPixelDepth)) * shadowMapSample, 0., 1. - darkness);
        return esm;
    }

    fn computeShadowWithCloseESMCube(worldPos: vec3f, lightPosition: vec3f, shadowTexture: texture_cube<f32>, shadowSampler: sampler, darkness: f32, depthScale: f32, depthValues: vec2f) -> f32
    {
        var directionToLight: vec3f = worldPos - lightPosition;
        var depth: f32 = length(directionToLight);
        depth = (depth + depthValues.x) / (depthValues.y);
        var shadowPixelDepth: f32 = clamp(depth, 0., 1.0);

        directionToLight = normalize(directionToLight);
        directionToLight.y = -directionToLight.y;

        #ifndef SHADOWFLOAT
            var shadowMapSample: f32 = unpack(textureSample(shadowTexture, shadowSampler, directionToLight));
        #else
            var shadowMapSample: f32 = textureSample(shadowTexture, shadowSampler, directionToLight).x;
        #endif

        var esm: f32 = clamp(exp(min(87., -depthScale * (shadowPixelDepth - shadowMapSample))), darkness, 1.);

        return esm;
    }
       
    fn computeShadowCSM(layer: i32, vPositionFromLight: vec4f, depthMetric: f32, shadowTexture: texture_2d_array<f32>, shadowSampler: sampler, darkness: f32, frustumEdgeFalloff: f32) -> f32
    {
        var clipSpace: vec3f = vPositionFromLight.xyz / vPositionFromLight.w;
        var uv: vec2f = 0.5 * clipSpace.xy +  vec2f(0.5);

        var shadowPixelDepth: f32 = clamp(depthMetric, 0., 1.0);

        #ifndef SHADOWFLOAT
            var shadow: f32 = unpack(textureSample(shadowTexture, shadowSampler, uv, layer));
        #else
            var shadow: f32 = textureSample(shadowTexture, shadowSampler, uv, layer).x;
        #endif

        return select(1., computeFallOff(darkness, clipSpace.xy, frustumEdgeFalloff), shadowPixelDepth > shadow );
    }

    fn computeShadow(vPositionFromLight: vec4f, depthMetric: f32, shadowTexture: texture_2d<f32>, shadowSampler: sampler, darkness: f32, frustumEdgeFalloff: f32) -> f32
    {
        var clipSpace: vec3f = vPositionFromLight.xyz / vPositionFromLight.w;
        var uv: vec2f = 0.5 * clipSpace.xy +  vec2f(0.5);

        if (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0)
        {
            return 1.0;
        }
        else
        {
            var shadowPixelDepth: f32 = clamp(depthMetric, 0., 1.0);

            #ifndef SHADOWFLOAT
                var shadow: f32 = unpack(textureSampleLevel(shadowTexture, shadowSampler, uv, 0.));
            #else
                var shadow: f32 = textureSampleLevel(shadowTexture, shadowSampler, uv, 0.).x;
            #endif

            return select(1., computeFallOff(darkness, clipSpace.xy, frustumEdgeFalloff), shadowPixelDepth > shadow );
        }
    }

    fn computeShadowWithPoissonSampling(vPositionFromLight: vec4f, depthMetric: f32, shadowTexture: texture_2d<f32>, shadowSampler: sampler, mapSize: f32, darkness: f32, frustumEdgeFalloff: f32) -> f32
    {
        var clipSpace: vec3f = vPositionFromLight.xyz / vPositionFromLight.w;
        var uv: vec2f = 0.5 * clipSpace.xy +  vec2f(0.5);

        if (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0)
        {
            return 1.0;
        }
        else
        {
            var shadowPixelDepth: f32 = clamp(depthMetric, 0., 1.0);

            var visibility: f32 = 1.;

            var poissonDisk: array<vec2f, 4>;
            poissonDisk[0] =  vec2f(-0.94201624, -0.39906216);
            poissonDisk[1] =  vec2f(0.94558609, -0.76890725);
            poissonDisk[2] =  vec2f(-0.094184101, -0.92938870);
            poissonDisk[3] =  vec2f(0.34495938, 0.29387760);

            // Poisson Sampling

            #ifndef SHADOWFLOAT
                if (unpack(textureSampleLevel(shadowTexture, shadowSampler, uv + poissonDisk[0] * mapSize, 0.)) < shadowPixelDepth) {visibility -= 0.25;}
                if (unpack(textureSampleLevel(shadowTexture, shadowSampler, uv + poissonDisk[1] * mapSize, 0.)) < shadowPixelDepth) {visibility -= 0.25;}
                if (unpack(textureSampleLevel(shadowTexture, shadowSampler, uv + poissonDisk[2] * mapSize, 0.)) < shadowPixelDepth) {visibility -= 0.25;}
                if (unpack(textureSampleLevel(shadowTexture, shadowSampler, uv + poissonDisk[3] * mapSize, 0.)) < shadowPixelDepth) {visibility -= 0.25;}
            #else
                if (textureSampleLevel(shadowTexture, shadowSampler, uv + poissonDisk[0] * mapSize, 0.).x < shadowPixelDepth) {visibility -= 0.25;}
                if (textureSampleLevel(shadowTexture, shadowSampler, uv + poissonDisk[1] * mapSize, 0.).x < shadowPixelDepth) {visibility -= 0.25;}
                if (textureSampleLevel(shadowTexture, shadowSampler, uv + poissonDisk[2] * mapSize, 0.).x < shadowPixelDepth) {visibility -= 0.25;}
                if (textureSampleLevel(shadowTexture, shadowSampler, uv + poissonDisk[3] * mapSize, 0.).x < shadowPixelDepth) {visibility -= 0.25;}
            #endif

            return computeFallOff(min(1.0, visibility + darkness), clipSpace.xy, frustumEdgeFalloff);
        }
    }

    fn computeShadowWithESM(vPositionFromLight: vec4f, depthMetric: f32, shadowTexture: texture_2d<f32>, shadowSampler: sampler, darkness: f32, depthScale: f32, frustumEdgeFalloff: f32) -> f32
    {
        var clipSpace: vec3f = vPositionFromLight.xyz / vPositionFromLight.w;
        var uv: vec2f = 0.5 * clipSpace.xy +  vec2f(0.5);

        if (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0)
        {
            return 1.0;
        }
        else
        {
            var shadowPixelDepth: f32 = clamp(depthMetric, 0., 1.0);

            #ifndef SHADOWFLOAT
                var shadowMapSample: f32 = unpack(textureSampleLevel(shadowTexture, shadowSampler, uv, 0.));
            #else
                var shadowMapSample: f32 = textureSampleLevel(shadowTexture, shadowSampler, uv, 0.).x;
            #endif
            
            var esm: f32 = 1.0 - clamp(exp(min(87., depthScale * shadowPixelDepth)) * shadowMapSample, 0., 1. - darkness);

            return computeFallOff(esm, clipSpace.xy, frustumEdgeFalloff);
        }
    }

    fn computeShadowWithCloseESM(vPositionFromLight: vec4f, depthMetric: f32, shadowTexture: texture_2d<f32>, shadowSampler: sampler, darkness: f32, depthScale: f32, frustumEdgeFalloff: f32) -> f32
    {
        var clipSpace: vec3f = vPositionFromLight.xyz / vPositionFromLight.w;
        var uv: vec2f = 0.5 * clipSpace.xy +  vec2f(0.5);

        if (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0)
        {
            return 1.0;
        }
        else
        {
            var shadowPixelDepth: f32 = clamp(depthMetric, 0., 1.0);		
            
            #ifndef SHADOWFLOAT
                var shadowMapSample: f32 = unpack(textureSampleLevel(shadowTexture, shadowSampler, uv, 0.));
            #else
                var shadowMapSample: f32 = textureSampleLevel(shadowTexture, shadowSampler, uv, 0.).x;
            #endif
            
            var esm: f32 = clamp(exp(min(87., -depthScale * (shadowPixelDepth - shadowMapSample))), darkness, 1.);

            return computeFallOff(esm, clipSpace.xy, frustumEdgeFalloff);
        }
    }

    fn getZInClip(clipSpace: vec3f, uvDepth: vec3f) -> f32
    {
    #ifdef IS_NDC_HALF_ZRANGE
        return clipSpace.z;
    #else
        return uvDepth.z;
    #endif
    }


    const GREATEST_LESS_THAN_ONE: f32 = 0.99999994;

    // We need to disable uniformity analysis when using CSM, as there's no textureLod overload that takes a sampler2DArrayShadow.
    // And the workaround that uses textureGrad (which does work with sampler2DArrayShadow) is not supported by the SpirV to WGSL conversion (from Tint)

    #define DISABLE_UNIFORMITY_ANALYSIS

    // Shadow PCF kernel size 1 with a single tap (lowest quality)
    
    fn computeShadowWithCSMPCF1(layer: i32, vPositionFromLight: vec4f, depthMetric: f32, shadowTexture: texture_depth_2d_array, shadowSampler: sampler_comparison, darkness: f32, frustumEdgeFalloff: f32) -> f32
    {
        var clipSpace: vec3f = vPositionFromLight.xyz / vPositionFromLight.w;
        var uvDepth: vec3f =  vec3f(0.5 * clipSpace.xyz +  vec3f(0.5));

        uvDepth.z = clamp(getZInClip(clipSpace, uvDepth), 0., GREATEST_LESS_THAN_ONE);

        var shadow: f32 = textureSampleCompare(shadowTexture, shadowSampler, uvDepth.xy, layer, uvDepth.z);
        shadow = mix(darkness, 1., shadow);
        return computeFallOff(shadow, clipSpace.xy, frustumEdgeFalloff);
    }

    // Shadow PCF kernel 3*3 in only 4 taps (medium quality)
    // This uses a well distributed taps to allow a gaussian distribution covering a 3*3 kernel
    // https://mynameismjp.wordpress.com/2013/09/10/shadow-maps/
    
    fn computeShadowWithCSMPCF3(layer: i32, vPositionFromLight: vec4f, depthMetric: f32, shadowTexture: texture_depth_2d_array, shadowSampler: sampler_comparison, shadowMapSizeAndInverse: vec2f, darkness: f32, frustumEdgeFalloff: f32) -> f32
    {
        var clipSpace: vec3f = vPositionFromLight.xyz / vPositionFromLight.w;
        var uvDepth: vec3f =  vec3f(0.5 * clipSpace.xyz +  vec3f(0.5));

        uvDepth.z = clamp(getZInClip(clipSpace, uvDepth), 0., GREATEST_LESS_THAN_ONE);

        var uv: vec2f = uvDepth.xy * shadowMapSizeAndInverse.x;	// uv in texel units
        uv += 0.5;											// offset of half to be in the center of the texel
        var st: vec2f = fract(uv);								// how far from the center
        var base_uv: vec2f = floor(uv) - 0.5;						// texel coord
        base_uv *= shadowMapSizeAndInverse.y;				// move back to uv coords

        // Equation resolved to fit in a 3*3 distribution like 
        // 1 2 1
        // 2 4 2
        // 1 2 1
        var uvw0: vec2f = 3. - 2. * st;
        var uvw1: vec2f = 1. + 2. * st;
        var u: vec2f =  vec2f((2. - st.x) / uvw0.x - 1., st.x / uvw1.x + 1.) * shadowMapSizeAndInverse.y;
        var v: vec2f =  vec2f((2. - st.y) / uvw0.y - 1., st.y / uvw1.y + 1.) * shadowMapSizeAndInverse.y;

        var shadow: f32 = 0.;
        shadow += uvw0.x * uvw0.y * textureSampleCompare(shadowTexture, shadowSampler,  base_uv.xy +  vec2f(u[0], v[0]), layer, uvDepth.z);
        shadow += uvw1.x * uvw0.y * textureSampleCompare(shadowTexture, shadowSampler,  base_uv.xy +  vec2f(u[1], v[0]), layer, uvDepth.z);
        shadow += uvw0.x * uvw1.y * textureSampleCompare(shadowTexture, shadowSampler,  base_uv.xy +  vec2f(u[0], v[1]), layer, uvDepth.z);
        shadow += uvw1.x * uvw1.y * textureSampleCompare(shadowTexture, shadowSampler,  base_uv.xy +  vec2f(u[1], v[1]), layer, uvDepth.z);
        shadow = shadow / 16.;

        shadow = mix(darkness, 1., shadow);
        return computeFallOff(shadow, clipSpace.xy, frustumEdgeFalloff);
    }

    // Shadow PCF kernel 5*5 in only 9 taps (high quality)
    // This uses a well distributed taps to allow a gaussian distribution covering a 5*5 kernel
    // https://mynameismjp.wordpress.com/2013/09/10/shadow-maps/
    
    fn computeShadowWithCSMPCF5(layer: i32, vPositionFromLight: vec4f, depthMetric: f32, shadowTexture: texture_depth_2d_array, shadowSampler: sampler_comparison, shadowMapSizeAndInverse: vec2f, darkness: f32, frustumEdgeFalloff: f32) -> f32
    {
        var clipSpace: vec3f = vPositionFromLight.xyz / vPositionFromLight.w;
        var uvDepth: vec3f =  vec3f(0.5 * clipSpace.xyz +  vec3f(0.5));

        uvDepth.z = clamp(getZInClip(clipSpace, uvDepth), 0., GREATEST_LESS_THAN_ONE);

        var uv: vec2f = uvDepth.xy * shadowMapSizeAndInverse.x;	// uv in texel units
        uv += 0.5;											// offset of half to be in the center of the texel
        var st: vec2f = fract(uv);								// how far from the center
        var base_uv: vec2f = floor(uv) - 0.5;						// texel coord
        base_uv *= shadowMapSizeAndInverse.y;				// move back to uv coords

        // Equation resolved to fit in a 5*5 distribution like 
        // 1 2 4 2 1
        var uvw0: vec2f = 4. - 3. * st;
        var uvw1: vec2f =  vec2f(7.);
        var uvw2: vec2f = 1. + 3. * st;

        var u: vec3f =  vec3f((3. - 2. * st.x) / uvw0.x - 2., (3. + st.x) / uvw1.x, st.x / uvw2.x + 2.) * shadowMapSizeAndInverse.y;
        var v: vec3f =  vec3f((3. - 2. * st.y) / uvw0.y - 2., (3. + st.y) / uvw1.y, st.y / uvw2.y + 2.) * shadowMapSizeAndInverse.y;

        var shadow: f32 = 0.;
        shadow += uvw0.x * uvw0.y * textureSampleCompare(shadowTexture, shadowSampler,  base_uv.xy +  vec2f(u[0], v[0]), layer, uvDepth.z);
        shadow += uvw1.x * uvw0.y * textureSampleCompare(shadowTexture, shadowSampler,  base_uv.xy +  vec2f(u[1], v[0]), layer, uvDepth.z);
        shadow += uvw2.x * uvw0.y * textureSampleCompare(shadowTexture, shadowSampler,  base_uv.xy +  vec2f(u[2], v[0]), layer, uvDepth.z);
        shadow += uvw0.x * uvw1.y * textureSampleCompare(shadowTexture, shadowSampler,  base_uv.xy +  vec2f(u[0], v[1]), layer, uvDepth.z);
        shadow += uvw1.x * uvw1.y * textureSampleCompare(shadowTexture, shadowSampler,  base_uv.xy +  vec2f(u[1], v[1]), layer, uvDepth.z);
        shadow += uvw2.x * uvw1.y * textureSampleCompare(shadowTexture, shadowSampler,  base_uv.xy +  vec2f(u[2], v[1]), layer, uvDepth.z);
        shadow += uvw0.x * uvw2.y * textureSampleCompare(shadowTexture, shadowSampler,  base_uv.xy +  vec2f(u[0], v[2]), layer, uvDepth.z);
        shadow += uvw1.x * uvw2.y * textureSampleCompare(shadowTexture, shadowSampler,  base_uv.xy +  vec2f(u[1], v[2]), layer, uvDepth.z);
        shadow += uvw2.x * uvw2.y * textureSampleCompare(shadowTexture, shadowSampler,  base_uv.xy +  vec2f(u[2], v[2]), layer, uvDepth.z);
        shadow = shadow / 144.;

        shadow = mix(darkness, 1., shadow);
        return computeFallOff(shadow, clipSpace.xy, frustumEdgeFalloff);
    }

    // Shadow PCF kernel size 1 with a single tap (lowest quality)
    
    fn computeShadowWithPCF1(vPositionFromLight: vec4f, depthMetric: f32, shadowTexture: texture_depth_2d, shadowSampler: sampler_comparison, darkness: f32, frustumEdgeFalloff: f32) -> f32
    {
        if (depthMetric > 1.0 || depthMetric < 0.0) {
            return 1.0;
        }
        else
        {
            var clipSpace: vec3f = vPositionFromLight.xyz / vPositionFromLight.w;
            var uvDepth: vec3f =  vec3f(0.5 * clipSpace.xyz +  vec3f(0.5));
            uvDepth.z = getZInClip(clipSpace, uvDepth);

            var shadow: f32 = textureSampleCompareLevel(shadowTexture, shadowSampler, uvDepth.xy, uvDepth.z);
            shadow = mix(darkness, 1., shadow);

            return computeFallOff(shadow, clipSpace.xy, frustumEdgeFalloff);
        }
    }

    // Shadow PCF kernel 3*3 in only 4 taps (medium quality)
    // This uses a well distributed taps to allow a gaussian distribution covering a 3*3 kernel
    // https://mynameismjp.wordpress.com/2013/09/10/shadow-maps/
    
    fn computeShadowWithPCF3(vPositionFromLight: vec4f, depthMetric: f32, shadowTexture: texture_depth_2d, shadowSampler: sampler_comparison, shadowMapSizeAndInverse: vec2f, darkness: f32, frustumEdgeFalloff: f32) -> f32
    {
        if (depthMetric > 1.0 || depthMetric < 0.0) {
            return 1.0;
        }
        else
        {
            var clipSpace: vec3f = vPositionFromLight.xyz / vPositionFromLight.w;
            var uvDepth: vec3f =  vec3f(0.5 * clipSpace.xyz +  vec3f(0.5));
            uvDepth.z = getZInClip(clipSpace, uvDepth);

            var uv: vec2f = uvDepth.xy * shadowMapSizeAndInverse.x;	// uv in texel units
            uv += 0.5;											// offset of half to be in the center of the texel
            var st: vec2f = fract(uv);								// how far from the center
            var base_uv: vec2f = floor(uv) - 0.5;						// texel coord
            base_uv *= shadowMapSizeAndInverse.y;				// move back to uv coords

            // Equation resolved to fit in a 3*3 distribution like 
            // 1 2 1
            // 2 4 2 
            // 1 2 1
            var uvw0: vec2f = 3. - 2. * st;
            var uvw1: vec2f = 1. + 2. * st;
            var u: vec2f =  vec2f((2. - st.x) / uvw0.x - 1., st.x / uvw1.x + 1.) * shadowMapSizeAndInverse.y;
            var v: vec2f =  vec2f((2. - st.y) / uvw0.y - 1., st.y / uvw1.y + 1.) * shadowMapSizeAndInverse.y;

            var shadow: f32 = 0.;
            shadow += uvw0.x * uvw0.y * textureSampleCompareLevel(shadowTexture, shadowSampler,  base_uv.xy +  vec2f(u[0], v[0]), uvDepth.z);
            shadow += uvw1.x * uvw0.y * textureSampleCompareLevel(shadowTexture, shadowSampler,  base_uv.xy +  vec2f(u[1], v[0]), uvDepth.z);
            shadow += uvw0.x * uvw1.y * textureSampleCompareLevel(shadowTexture, shadowSampler,  base_uv.xy +  vec2f(u[0], v[1]), uvDepth.z);
            shadow += uvw1.x * uvw1.y * textureSampleCompareLevel(shadowTexture, shadowSampler,  base_uv.xy +  vec2f(u[1], v[1]), uvDepth.z);
            shadow = shadow / 16.;

            shadow = mix(darkness, 1., shadow);

            return computeFallOff(shadow, clipSpace.xy, frustumEdgeFalloff);
        }
    }

    // Shadow PCF kernel 5*5 in only 9 taps (high quality)
    // This uses a well distributed taps to allow a gaussian distribution covering a 5*5 kernel
    // https://mynameismjp.wordpress.com/2013/09/10/shadow-maps/
    
    fn computeShadowWithPCF5(vPositionFromLight: vec4f, depthMetric: f32, shadowTexture: texture_depth_2d, shadowSampler: sampler_comparison, shadowMapSizeAndInverse: vec2f, darkness: f32, frustumEdgeFalloff: f32) -> f32
    {
        if (depthMetric > 1.0 || depthMetric < 0.0) {
            return 1.0;
        }
        else
        {
            var clipSpace: vec3f = vPositionFromLight.xyz / vPositionFromLight.w;
            var uvDepth: vec3f =  vec3f(0.5 * clipSpace.xyz +  vec3f(0.5));
            uvDepth.z = getZInClip(clipSpace, uvDepth);

            var uv: vec2f = uvDepth.xy * shadowMapSizeAndInverse.x;	// uv in texel units
            uv += 0.5;											// offset of half to be in the center of the texel
            var st: vec2f = fract(uv);								// how far from the center
            var base_uv: vec2f = floor(uv) - 0.5;						// texel coord
            base_uv *= shadowMapSizeAndInverse.y;				// move back to uv coords

            // Equation resolved to fit in a 5*5 distribution like 
            // 1 2 4 2 1
            var uvw0: vec2f = 4. - 3. * st;
            var uvw1: vec2f =  vec2f(7.);
            var uvw2: vec2f = 1. + 3. * st;

            var u: vec3f =  vec3f((3. - 2. * st.x) / uvw0.x - 2., (3. + st.x) / uvw1.x, st.x / uvw2.x + 2.) * shadowMapSizeAndInverse.y;
            var v: vec3f =  vec3f((3. - 2. * st.y) / uvw0.y - 2., (3. + st.y) / uvw1.y, st.y / uvw2.y + 2.) * shadowMapSizeAndInverse.y;

            var shadow: f32 = 0.;
            shadow += uvw0.x * uvw0.y * textureSampleCompareLevel(shadowTexture, shadowSampler,  base_uv.xy +  vec2f(u[0], v[0]), uvDepth.z);
            shadow += uvw1.x * uvw0.y * textureSampleCompareLevel(shadowTexture, shadowSampler,  base_uv.xy +  vec2f(u[1], v[0]), uvDepth.z);
            shadow += uvw2.x * uvw0.y * textureSampleCompareLevel(shadowTexture, shadowSampler,  base_uv.xy +  vec2f(u[2], v[0]), uvDepth.z);
            shadow += uvw0.x * uvw1.y * textureSampleCompareLevel(shadowTexture, shadowSampler,  base_uv.xy +  vec2f(u[0], v[1]), uvDepth.z);
            shadow += uvw1.x * uvw1.y * textureSampleCompareLevel(shadowTexture, shadowSampler,  base_uv.xy +  vec2f(u[1], v[1]), uvDepth.z);
            shadow += uvw2.x * uvw1.y * textureSampleCompareLevel(shadowTexture, shadowSampler,  base_uv.xy +  vec2f(u[2], v[1]), uvDepth.z);
            shadow += uvw0.x * uvw2.y * textureSampleCompareLevel(shadowTexture, shadowSampler,  base_uv.xy +  vec2f(u[0], v[2]), uvDepth.z);
            shadow += uvw1.x * uvw2.y * textureSampleCompareLevel(shadowTexture, shadowSampler,  base_uv.xy +  vec2f(u[1], v[2]), uvDepth.z);
            shadow += uvw2.x * uvw2.y * textureSampleCompareLevel(shadowTexture, shadowSampler,  base_uv.xy +  vec2f(u[2], v[2]), uvDepth.z);
            shadow = shadow / 144.;

            shadow = mix(darkness, 1., shadow);

            return computeFallOff(shadow, clipSpace.xy, frustumEdgeFalloff);
        }
    }

    const PoissonSamplers32: array<vec3f, 64> = array<vec3f, 64> (
            vec3f(0.06407013, 0.05409927, 0.),
            vec3f(0.7366577, 0.5789394, 0.),
            vec3f(-0.6270542, -0.5320278, 0.),
            vec3f(-0.4096107, 0.8411095, 0.),
            vec3f(0.6849564, -0.4990818, 0.),
            vec3f(-0.874181, -0.04579735, 0.),
            vec3f(0.9989998, 0.0009880066, 0.),
            vec3f(-0.004920578, -0.9151649, 0.),
            vec3f(0.1805763, 0.9747483, 0.),
            vec3f(-0.2138451, 0.2635818, 0.),
            vec3f(0.109845, 0.3884785, 0.),
            vec3f(0.06876755, -0.3581074, 0.),
            vec3f(0.374073, -0.7661266, 0.),
            vec3f(0.3079132, -0.1216763, 0.),
            vec3f(-0.3794335, -0.8271583, 0.),
            vec3f(-0.203878, -0.07715034, 0.),
            vec3f(0.5912697, 0.1469799, 0.),
            vec3f(-0.88069, 0.3031784, 0.),
            vec3f(0.5040108, 0.8283722, 0.),
            vec3f(-0.5844124, 0.5494877, 0.),
            vec3f(0.6017799, -0.1726654, 0.),
            vec3f(-0.5554981, 0.1559997, 0.),
            vec3f(-0.3016369, -0.3900928, 0.),
            vec3f(-0.5550632, -0.1723762, 0.),
            vec3f(0.925029, 0.2995041, 0.),
            vec3f(-0.2473137, 0.5538505, 0.),
            vec3f(0.9183037, -0.2862392, 0.),
            vec3f(0.2469421, 0.6718712, 0.),
            vec3f(0.3916397, -0.4328209, 0.),
            vec3f(-0.03576927, -0.6220032, 0.),
            vec3f(-0.04661255, 0.7995201, 0.),
            vec3f(0.4402924, 0.3640312, 0.),

            vec3f(0.),
            vec3f(0.),
            vec3f(0.),
            vec3f(0.),
            vec3f(0.),
            vec3f(0.),
            vec3f(0.),
            vec3f(0.),
            vec3f(0.),
            vec3f(0.),
            vec3f(0.),
            vec3f(0.),
            vec3f(0.),
            vec3f(0.),
            vec3f(0.),
            vec3f(0.),
            vec3f(0.),
            vec3f(0.),
            vec3f(0.),
            vec3f(0.),
            vec3f(0.),
            vec3f(0.),
            vec3f(0.),
            vec3f(0.),
            vec3f(0.),
            vec3f(0.),
            vec3f(0.),
            vec3f(0.),
            vec3f(0.),
            vec3f(0.),
            vec3f(0.),
            vec3f(0.)
    );

    const PoissonSamplers64: array<vec3f, 64> = array<vec3f, 64> (
            vec3f(-0.613392, 0.617481, 0.),
            vec3f(0.170019, -0.040254, 0.),
            vec3f(-0.299417, 0.791925, 0.),
            vec3f(0.645680, 0.493210, 0.),
            vec3f(-0.651784, 0.717887, 0.),
            vec3f(0.421003, 0.027070, 0.),
            vec3f(-0.817194, -0.271096, 0.),
            vec3f(-0.705374, -0.668203, 0.),
            vec3f(0.977050, -0.108615, 0.),
            vec3f(0.063326, 0.142369, 0.),
            vec3f(0.203528, 0.214331, 0.),
            vec3f(-0.667531, 0.326090, 0.),
            vec3f(-0.098422, -0.295755, 0.),
            vec3f(-0.885922, 0.215369, 0.),
            vec3f(0.566637, 0.605213, 0.),
            vec3f(0.039766, -0.396100, 0.),
            vec3f(0.751946, 0.453352, 0.),
            vec3f(0.078707, -0.715323, 0.),
            vec3f(-0.075838, -0.529344, 0.),
            vec3f(0.724479, -0.580798, 0.),
            vec3f(0.222999, -0.215125, 0.),
            vec3f(-0.467574, -0.405438, 0.),
            vec3f(-0.248268, -0.814753, 0.),
            vec3f(0.354411, -0.887570, 0.),
            vec3f(0.175817, 0.382366, 0.),
            vec3f(0.487472, -0.063082, 0.),
            vec3f(-0.084078, 0.898312, 0.),
            vec3f(0.488876, -0.783441, 0.),
            vec3f(0.470016, 0.217933, 0.),
            vec3f(-0.696890, -0.549791, 0.),
            vec3f(-0.149693, 0.605762, 0.),
            vec3f(0.034211, 0.979980, 0.),
            vec3f(0.503098, -0.308878, 0.),
            vec3f(-0.016205, -0.872921, 0.),
            vec3f(0.385784, -0.393902, 0.),
            vec3f(-0.146886, -0.859249, 0.),
            vec3f(0.643361, 0.164098, 0.),
            vec3f(0.634388, -0.049471, 0.),
            vec3f(-0.688894, 0.007843, 0.),
            vec3f(0.464034, -0.188818, 0.),
            vec3f(-0.440840, 0.137486, 0.),
            vec3f(0.364483, 0.511704, 0.),
            vec3f(0.034028, 0.325968, 0.),
            vec3f(0.099094, -0.308023, 0.),
            vec3f(0.693960, -0.366253, 0.),
            vec3f(0.678884, -0.204688, 0.),
            vec3f(0.001801, 0.780328, 0.),
            vec3f(0.145177, -0.898984, 0.),
            vec3f(0.062655, -0.611866, 0.),
            vec3f(0.315226, -0.604297, 0.),
            vec3f(-0.780145, 0.486251, 0.),
            vec3f(-0.371868, 0.882138, 0.),
            vec3f(0.200476, 0.494430, 0.),
            vec3f(-0.494552, -0.711051, 0.),
            vec3f(0.612476, 0.705252, 0.),
            vec3f(-0.578845, -0.768792, 0.),
            vec3f(-0.772454, -0.090976, 0.),
            vec3f(0.504440, 0.372295, 0.),
            vec3f(0.155736, 0.065157, 0.),
            vec3f(0.391522, 0.849605, 0.),
            vec3f(-0.620106, -0.328104, 0.),
            vec3f(0.789239, -0.419965, 0.),
            vec3f(-0.545396, 0.538133, 0.),
            vec3f(-0.178564, -0.596057, 0.)
    );

    // PCSS
    // This helps to achieve a contact hardening effect on the shadow
    // It uses 16 Taps for search and a 32 PCF taps in a randomly rotating poisson sampling disc.
    // This is heavily inspired from http://developer.download.nvidia.com/shaderlibrary/docs/shadow_PCSS.pdf
    // and http://developer.download.nvidia.com/whitepapers/2008/PCSS_Integration.pdf
    
    fn computeShadowWithCSMPCSS(layer: i32, vPositionFromLight: vec4f, depthMetric: f32, depthTexture: texture_2d_array<f32>, depthSampler: sampler, shadowTexture: texture_depth_2d_array, shadowSampler: sampler_comparison, shadowMapSizeInverse: f32, lightSizeUV: f32, darkness: f32, frustumEdgeFalloff: f32, searchTapCount: i32, pcfTapCount: i32, poissonSamplers: array<vec3f, 64>, lightSizeUVCorrection: vec2f, depthCorrection: f32, penumbraDarkness: f32) -> f32
    {
        var clipSpace: vec3f = vPositionFromLight.xyz / vPositionFromLight.w;
        var uvDepth: vec3f =  vec3f(0.5 * clipSpace.xyz +  vec3f(0.5));

        uvDepth.z = clamp(getZInClip(clipSpace, uvDepth), 0., GREATEST_LESS_THAN_ONE);

        var uvDepthLayer: vec4f =  vec4f(uvDepth.x, uvDepth.y, f32(layer), uvDepth.z);

        var blockerDepth: f32 = 0.0;
        var sumBlockerDepth: f32 = 0.0;
        var numBlocker: f32 = 0.0;
        for (var i: i32 = 0; i < searchTapCount; i ++) {
            blockerDepth = textureSample(depthTexture, depthSampler,  uvDepth.xy + (lightSizeUV * lightSizeUVCorrection * shadowMapSizeInverse * PoissonSamplers32[i].xy), layer).r;
            numBlocker += select(0., 1., blockerDepth < depthMetric);
            sumBlockerDepth += select(0., blockerDepth, blockerDepth < depthMetric);
        }

        var avgBlockerDepth: f32 = sumBlockerDepth / numBlocker;

        // Offset preventing aliasing on contact.
        var AAOffset: f32 = shadowMapSizeInverse * 10.;
        // Do not dividing by z despite being physically incorrect looks better due to the limited kernel size.
        // var penumbraRatio: f32 = (depthMetric - avgBlockerDepth) / avgBlockerDepth;
        var penumbraRatio: f32 = ((depthMetric - avgBlockerDepth) * depthCorrection + AAOffset);
        var filterRadius: vec4f =  vec4f(penumbraRatio * lightSizeUV * lightSizeUVCorrection * shadowMapSizeInverse, 0., 0.);

        var random: f32 = getRand(vPositionFromLight.xy);
        var rotationAngle: f32 = random * 3.1415926;
        var rotationVector: vec2f =  vec2f(cos(rotationAngle), sin(rotationAngle));

        var shadow: f32 = 0.;
        for (var i: i32 = 0; i < pcfTapCount; i++) {
            var offset: vec4f =  vec4f(poissonSamplers[i], 0.);
            // Rotated offset.
            offset =  vec4f(offset.x * rotationVector.x - offset.y * rotationVector.y, offset.y * rotationVector.x + offset.x * rotationVector.y, 0., 0.);
            let coords = uvDepthLayer + offset * filterRadius;
            shadow += textureSampleCompare(shadowTexture, shadowSampler, coords.xy, i32(coords.z), coords.w);
        }
        shadow /=  f32(pcfTapCount);

        // Blocker distance falloff
        shadow = mix(shadow, 1., min((depthMetric - avgBlockerDepth) * depthCorrection * penumbraDarkness, 1.));

        // Apply darkness
        shadow = mix(darkness, 1., shadow);

        // Apply light frustrum fallof
        return select(computeFallOff(shadow, clipSpace.xy, frustumEdgeFalloff), 1.0, numBlocker < 1.0);
    }

    // PCSS
    // This helps to achieve a contact hardening effect on the shadow
    // It uses 16 Taps for search and a 32 PCF taps in a randomly rotating poisson sampling disc.
    // This is heavily inspired from http://developer.download.nvidia.com/shaderlibrary/docs/shadow_PCSS.pdf
    // and http://developer.download.nvidia.com/whitepapers/2008/PCSS_Integration.pdf
    
    fn computeShadowWithPCSS(vPositionFromLight: vec4f, depthMetric: f32, depthTexture: texture_2d<f32>, depthSampler: sampler, shadowTexture: texture_depth_2d, shadowSampler: sampler_comparison, shadowMapSizeInverse: f32, lightSizeUV: f32, darkness: f32, frustumEdgeFalloff: f32, searchTapCount: i32, pcfTapCount: i32, poissonSamplers: array<vec3f, 64>) -> f32
    {
        var clipSpace: vec3f = vPositionFromLight.xyz / vPositionFromLight.w;
        var uvDepth: vec3f =  vec3f(0.5 * clipSpace.xyz +  vec3f(0.5));
        uvDepth.z = getZInClip(clipSpace, uvDepth);

        var blockerDepth: f32 = 0.0;
        var sumBlockerDepth: f32 = 0.0;
        var numBlocker: f32 = 0.0;
        var exitCondition: bool = depthMetric > 1.0 || depthMetric < 0.0;
        for (var i: i32 = 0; i < searchTapCount; i ++) {
            if (exitCondition) {
                break;
            }
            blockerDepth = textureSampleLevel(depthTexture, depthSampler, uvDepth.xy + (lightSizeUV * shadowMapSizeInverse * PoissonSamplers32[i].xy), 0).r;
            numBlocker += select(0., 1., blockerDepth < depthMetric);
            sumBlockerDepth += select(0., blockerDepth, blockerDepth < depthMetric);
        }

        exitCondition = exitCondition || numBlocker < 1.0;
        var avgBlockerDepth: f32 = sumBlockerDepth / numBlocker;

        // Offset preventing aliasing on contact.
        var AAOffset: f32 = shadowMapSizeInverse * 10.;
        // Do not dividing by z despite being physically incorrect looks better due to the limited kernel size.
        // var penumbraRatio: f32 = (depthMetric - avgBlockerDepth) / avgBlockerDepth;
        var penumbraRatio: f32 = ((depthMetric - avgBlockerDepth) + AAOffset);
        var filterRadius: f32 = penumbraRatio * lightSizeUV * shadowMapSizeInverse;

        var random: f32 = getRand(vPositionFromLight.xy);
        var rotationAngle: f32 = random * 3.1415926;
        var rotationVector: vec2f =  vec2f(cos(rotationAngle), sin(rotationAngle));

        var shadow: f32 = 0.;
        for (var i: i32 = 0; i < pcfTapCount; i++) {
            if (exitCondition) {
                break;
            }
            var offset: vec3f = poissonSamplers[i];
            // Rotated offset.
            offset =  vec3f(offset.x * rotationVector.x - offset.y * rotationVector.y, offset.y * rotationVector.x + offset.x * rotationVector.y, 0.);
            let coords = uvDepth + offset * filterRadius;
            shadow += textureSampleCompareLevel(shadowTexture, shadowSampler, coords.xy, coords.z);
        }
        shadow /=  f32(pcfTapCount);

        // Blocker distance falloff
        shadow = mix(shadow, 1., depthMetric - avgBlockerDepth);

        // Apply darkness
        shadow = mix(darkness, 1., shadow);

        // Apply light frustrum fallof
        return select(computeFallOff(shadow, clipSpace.xy, frustumEdgeFalloff), 1.0, exitCondition);
    }

    
    fn computeShadowWithPCSS16(vPositionFromLight: vec4f, depthMetric: f32, depthTexture: texture_2d<f32>, depthSampler: sampler, shadowTexture: texture_depth_2d, shadowSampler: sampler_comparison, shadowMapSizeInverse: f32, lightSizeUV: f32, darkness: f32, frustumEdgeFalloff: f32) -> f32
    {
        return computeShadowWithPCSS(vPositionFromLight, depthMetric, depthTexture, depthSampler, shadowTexture, shadowSampler, shadowMapSizeInverse, lightSizeUV, darkness, frustumEdgeFalloff, 16, 16, PoissonSamplers32);
    }

    
    fn computeShadowWithPCSS32(vPositionFromLight: vec4f, depthMetric: f32, depthTexture: texture_2d<f32>, depthSampler: sampler, shadowTexture: texture_depth_2d, shadowSampler: sampler_comparison, shadowMapSizeInverse: f32, lightSizeUV: f32, darkness: f32, frustumEdgeFalloff: f32) -> f32
    {
        return computeShadowWithPCSS(vPositionFromLight, depthMetric, depthTexture, depthSampler, shadowTexture, shadowSampler, shadowMapSizeInverse, lightSizeUV, darkness, frustumEdgeFalloff, 16, 32, PoissonSamplers32);
    }

    
    fn computeShadowWithPCSS64(vPositionFromLight: vec4f, depthMetric: f32, depthTexture: texture_2d<f32>, depthSampler: sampler, shadowTexture: texture_depth_2d, shadowSampler: sampler_comparison, shadowMapSizeInverse: f32, lightSizeUV: f32, darkness: f32, frustumEdgeFalloff: f32) -> f32
    {
        return computeShadowWithPCSS(vPositionFromLight, depthMetric, depthTexture, depthSampler, shadowTexture, shadowSampler, shadowMapSizeInverse, lightSizeUV, darkness, frustumEdgeFalloff, 32, 64, PoissonSamplers64);
    }

    
    fn computeShadowWithCSMPCSS16(layer: i32, vPositionFromLight: vec4f, depthMetric: f32, depthTexture: texture_2d_array<f32>, depthSampler: sampler, shadowTexture: texture_depth_2d_array, shadowSampler: sampler_comparison, shadowMapSizeInverse: f32, lightSizeUV: f32, darkness: f32, frustumEdgeFalloff: f32, lightSizeUVCorrection: vec2f, depthCorrection: f32, penumbraDarkness: f32) -> f32
    {
        return computeShadowWithCSMPCSS(layer, vPositionFromLight, depthMetric, depthTexture, depthSampler, shadowTexture, shadowSampler, shadowMapSizeInverse, lightSizeUV, darkness, frustumEdgeFalloff, 16, 16, PoissonSamplers32, lightSizeUVCorrection, depthCorrection, penumbraDarkness);
    }

    
    fn computeShadowWithCSMPCSS32(layer: i32, vPositionFromLight: vec4f, depthMetric: f32, depthTexture: texture_2d_array<f32>, depthSampler: sampler, shadowTexture: texture_depth_2d_array, shadowSampler: sampler_comparison, shadowMapSizeInverse: f32, lightSizeUV: f32, darkness: f32, frustumEdgeFalloff: f32, lightSizeUVCorrection: vec2f, depthCorrection: f32, penumbraDarkness: f32) -> f32
    {
        return computeShadowWithCSMPCSS(layer, vPositionFromLight, depthMetric, depthTexture, depthSampler, shadowTexture, shadowSampler, shadowMapSizeInverse, lightSizeUV, darkness, frustumEdgeFalloff, 16, 32, PoissonSamplers32, lightSizeUVCorrection, depthCorrection, penumbraDarkness);
    }

    
    fn computeShadowWithCSMPCSS64(layer: i32, vPositionFromLight: vec4f, depthMetric: f32, depthTexture: texture_2d_array<f32>, depthSampler: sampler, shadowTexture: texture_depth_2d_array, shadowSampler: sampler_comparison, shadowMapSizeInverse: f32, lightSizeUV: f32, darkness: f32, frustumEdgeFalloff: f32, lightSizeUVCorrection: vec2f, depthCorrection: f32, penumbraDarkness: f32) -> f32
    {
        return computeShadowWithCSMPCSS(layer, vPositionFromLight, depthMetric, depthTexture, depthSampler, shadowTexture, shadowSampler, shadowMapSizeInverse, lightSizeUV, darkness, frustumEdgeFalloff, 32, 64, PoissonSamplers64, lightSizeUVCorrection, depthCorrection, penumbraDarkness);
    }
#endif
