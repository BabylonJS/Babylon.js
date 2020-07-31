#ifdef SHADOWS
    #ifndef SHADOWFLOAT
        // Dupplicate to prevent include in include issues
        float unpack(vec4 color)
        {
            const vec4 bit_shift = vec4(1.0 / (255.0 * 255.0 * 255.0), 1.0 / (255.0 * 255.0), 1.0 / 255.0, 1.0);
            return dot(color, bit_shift);
        }
    #endif

    float computeFallOff(float value, vec2 clipSpace, float frustumEdgeFalloff)
    {
        float mask = smoothstep(1.0 - frustumEdgeFalloff, 1.00000012, clamp(dot(clipSpace, clipSpace), 0., 1.));
        return mix(value, 1.0, mask);
    }

    #define inline
    float computeShadowCube(vec3 lightPosition, samplerCube shadowSampler, float darkness, vec2 depthValues)
    {
        vec3 directionToLight = vPositionW - lightPosition;
        float depth = length(directionToLight);
        depth = (depth + depthValues.x) / (depthValues.y);
        depth = clamp(depth, 0., 1.0);

        directionToLight = normalize(directionToLight);
        directionToLight.y = -directionToLight.y;
        
        #ifndef SHADOWFLOAT
            float shadow = unpack(textureCube(shadowSampler, directionToLight));
        #else
            float shadow = textureCube(shadowSampler, directionToLight).x;
        #endif

        return depth > shadow ? darkness : 1.0;
    }

    #define inline
    float computeShadowWithPoissonSamplingCube(vec3 lightPosition, samplerCube shadowSampler, float mapSize, float darkness, vec2 depthValues)
    {
        vec3 directionToLight = vPositionW - lightPosition;
        float depth = length(directionToLight);
        depth = (depth + depthValues.x) / (depthValues.y);
        depth = clamp(depth, 0., 1.0);

        directionToLight = normalize(directionToLight);
        directionToLight.y = -directionToLight.y;

        float visibility = 1.;

        vec3 poissonDisk[4];
        poissonDisk[0] = vec3(-1.0, 1.0, -1.0);
        poissonDisk[1] = vec3(1.0, -1.0, -1.0);
        poissonDisk[2] = vec3(-1.0, -1.0, -1.0);
        poissonDisk[3] = vec3(1.0, -1.0, 1.0);

        // Poisson Sampling

        #ifndef SHADOWFLOAT
            if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[0] * mapSize)) < depth) visibility -= 0.25;
            if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[1] * mapSize)) < depth) visibility -= 0.25;
            if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[2] * mapSize)) < depth) visibility -= 0.25;
            if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[3] * mapSize)) < depth) visibility -= 0.25;
        #else
            if (textureCube(shadowSampler, directionToLight + poissonDisk[0] * mapSize).x < depth) visibility -= 0.25;
            if (textureCube(shadowSampler, directionToLight + poissonDisk[1] * mapSize).x < depth) visibility -= 0.25;
            if (textureCube(shadowSampler, directionToLight + poissonDisk[2] * mapSize).x < depth) visibility -= 0.25;
            if (textureCube(shadowSampler, directionToLight + poissonDisk[3] * mapSize).x < depth) visibility -= 0.25;
        #endif

        return  min(1.0, visibility + darkness);
    }

    #define inline
    float computeShadowWithESMCube(vec3 lightPosition, samplerCube shadowSampler, float darkness, float depthScale, vec2 depthValues)
    {
        vec3 directionToLight = vPositionW - lightPosition;
        float depth = length(directionToLight);
        depth = (depth + depthValues.x) / (depthValues.y);
        float shadowPixelDepth = clamp(depth, 0., 1.0);

        directionToLight = normalize(directionToLight);
        directionToLight.y = -directionToLight.y;
        
        #ifndef SHADOWFLOAT
            float shadowMapSample = unpack(textureCube(shadowSampler, directionToLight));
        #else
            float shadowMapSample = textureCube(shadowSampler, directionToLight).x;
        #endif

        float esm = 1.0 - clamp(exp(min(87., depthScale * shadowPixelDepth)) * shadowMapSample, 0., 1. - darkness);	
        return esm;
    }

    #define inline
    float computeShadowWithCloseESMCube(vec3 lightPosition, samplerCube shadowSampler, float darkness, float depthScale, vec2 depthValues)
    {
        vec3 directionToLight = vPositionW - lightPosition;
        float depth = length(directionToLight);
        depth = (depth + depthValues.x) / (depthValues.y);
        float shadowPixelDepth = clamp(depth, 0., 1.0);

        directionToLight = normalize(directionToLight);
        directionToLight.y = -directionToLight.y;
        
        #ifndef SHADOWFLOAT
            float shadowMapSample = unpack(textureCube(shadowSampler, directionToLight));
        #else
            float shadowMapSample = textureCube(shadowSampler, directionToLight).x;
        #endif

        float esm = clamp(exp(min(87., -depthScale * (shadowPixelDepth - shadowMapSample))), darkness, 1.);

        return esm;
    }

    #ifdef WEBGL2
        #define inline
        float computeShadowCSM(float layer, vec4 vPositionFromLight, float depthMetric, highp sampler2DArray shadowSampler, float darkness, float frustumEdgeFalloff)
        {
            vec3 clipSpace = vPositionFromLight.xyz / vPositionFromLight.w;
            vec2 uv = 0.5 * clipSpace.xy + vec2(0.5);
            vec3 uvLayer = vec3(uv.x, uv.y, layer);

            float shadowPixelDepth = clamp(depthMetric, 0., 1.0);

            #ifndef SHADOWFLOAT
                float shadow = unpack(texture2D(shadowSampler, uvLayer));
            #else
                float shadow = texture2D(shadowSampler, uvLayer).x;
            #endif

            return shadowPixelDepth > shadow ? computeFallOff(darkness, clipSpace.xy, frustumEdgeFalloff) : 1.;
        }
    #endif

    #define inline
    float computeShadow(vec4 vPositionFromLight, float depthMetric, sampler2D shadowSampler, float darkness, float frustumEdgeFalloff)
    {
        vec3 clipSpace = vPositionFromLight.xyz / vPositionFromLight.w;
        vec2 uv = 0.5 * clipSpace.xy + vec2(0.5);

        if (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0)
        {
            return 1.0;
        }
        else
        {
            float shadowPixelDepth = clamp(depthMetric, 0., 1.0);

            #ifndef SHADOWFLOAT
                float shadow = unpack(texture2D(shadowSampler, uv));
            #else
                float shadow = texture2D(shadowSampler, uv).x;
            #endif

            return shadowPixelDepth > shadow ? computeFallOff(darkness, clipSpace.xy, frustumEdgeFalloff) : 1.;
        }
    }

    #define inline
    float computeShadowWithPoissonSampling(vec4 vPositionFromLight, float depthMetric, sampler2D shadowSampler, float mapSize, float darkness, float frustumEdgeFalloff)
    {
        vec3 clipSpace = vPositionFromLight.xyz / vPositionFromLight.w;
        vec2 uv = 0.5 * clipSpace.xy + vec2(0.5);

        if (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0)
        {
            return 1.0;
        }
        else
        {
            float shadowPixelDepth = clamp(depthMetric, 0., 1.0);

            float visibility = 1.;

            vec2 poissonDisk[4];
            poissonDisk[0] = vec2(-0.94201624, -0.39906216);
            poissonDisk[1] = vec2(0.94558609, -0.76890725);
            poissonDisk[2] = vec2(-0.094184101, -0.92938870);
            poissonDisk[3] = vec2(0.34495938, 0.29387760);

            // Poisson Sampling

            #ifndef SHADOWFLOAT
                if (unpack(texture2D(shadowSampler, uv + poissonDisk[0] * mapSize)) < shadowPixelDepth) visibility -= 0.25;
                if (unpack(texture2D(shadowSampler, uv + poissonDisk[1] * mapSize)) < shadowPixelDepth) visibility -= 0.25;
                if (unpack(texture2D(shadowSampler, uv + poissonDisk[2] * mapSize)) < shadowPixelDepth) visibility -= 0.25;
                if (unpack(texture2D(shadowSampler, uv + poissonDisk[3] * mapSize)) < shadowPixelDepth) visibility -= 0.25;
            #else
                if (texture2D(shadowSampler, uv + poissonDisk[0] * mapSize).x < shadowPixelDepth) visibility -= 0.25;
                if (texture2D(shadowSampler, uv + poissonDisk[1] * mapSize).x < shadowPixelDepth) visibility -= 0.25;
                if (texture2D(shadowSampler, uv + poissonDisk[2] * mapSize).x < shadowPixelDepth) visibility -= 0.25;
                if (texture2D(shadowSampler, uv + poissonDisk[3] * mapSize).x < shadowPixelDepth) visibility -= 0.25;
            #endif

            return computeFallOff(min(1.0, visibility + darkness), clipSpace.xy, frustumEdgeFalloff);
        }
    }

    #define inline
    float computeShadowWithESM(vec4 vPositionFromLight, float depthMetric, sampler2D shadowSampler, float darkness, float depthScale, float frustumEdgeFalloff)
    {
        vec3 clipSpace = vPositionFromLight.xyz / vPositionFromLight.w;
        vec2 uv = 0.5 * clipSpace.xy + vec2(0.5);

        if (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0)
        {
            return 1.0;
        }
        else
        {
            float shadowPixelDepth = clamp(depthMetric, 0., 1.0);

            #ifndef SHADOWFLOAT
                float shadowMapSample = unpack(texture2D(shadowSampler, uv));
            #else
                float shadowMapSample = texture2D(shadowSampler, uv).x;
            #endif
            
            float esm = 1.0 - clamp(exp(min(87., depthScale * shadowPixelDepth)) * shadowMapSample, 0., 1. - darkness);

            return computeFallOff(esm, clipSpace.xy, frustumEdgeFalloff);
        }
    }

    #define inline
    float computeShadowWithCloseESM(vec4 vPositionFromLight, float depthMetric, sampler2D shadowSampler, float darkness, float depthScale, float frustumEdgeFalloff)
    {
        vec3 clipSpace = vPositionFromLight.xyz / vPositionFromLight.w;
        vec2 uv = 0.5 * clipSpace.xy + vec2(0.5);

        if (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0)
        {
            return 1.0;
        }
        else
        {
            float shadowPixelDepth = clamp(depthMetric, 0., 1.0);		
            
            #ifndef SHADOWFLOAT
                float shadowMapSample = unpack(texture2D(shadowSampler, uv));
            #else
                float shadowMapSample = texture2D(shadowSampler, uv).x;
            #endif
            
            float esm = clamp(exp(min(87., -depthScale * (shadowPixelDepth - shadowMapSample))), darkness, 1.);

            return computeFallOff(esm, clipSpace.xy, frustumEdgeFalloff);
        }
    }

    #ifdef WEBGL2
        #define GREATEST_LESS_THAN_ONE 0.99999994

        // Shadow PCF kernel size 1 with a single tap (lowest quality)
        #define inline
        float computeShadowWithCSMPCF1(float layer, vec4 vPositionFromLight, float depthMetric, highp sampler2DArrayShadow shadowSampler, float darkness, float frustumEdgeFalloff)
        {
            vec3 clipSpace = vPositionFromLight.xyz / vPositionFromLight.w;
            vec3 uvDepth = vec3(0.5 * clipSpace.xyz + vec3(0.5));

            uvDepth.z = clamp(uvDepth.z, 0., GREATEST_LESS_THAN_ONE);

            vec4 uvDepthLayer = vec4(uvDepth.x, uvDepth.y, layer, uvDepth.z);

            float shadow = texture(shadowSampler, uvDepthLayer);
            shadow = mix(darkness, 1., shadow);
            return computeFallOff(shadow, clipSpace.xy, frustumEdgeFalloff);
        }

        // Shadow PCF kernel 3*3 in only 4 taps (medium quality)
        // This uses a well distributed taps to allow a gaussian distribution covering a 3*3 kernel
        // https://mynameismjp.wordpress.com/2013/09/10/shadow-maps/
        #define inline
        float computeShadowWithCSMPCF3(float layer, vec4 vPositionFromLight, float depthMetric, highp sampler2DArrayShadow shadowSampler, vec2 shadowMapSizeAndInverse, float darkness, float frustumEdgeFalloff)
        {
            vec3 clipSpace = vPositionFromLight.xyz / vPositionFromLight.w;
            vec3 uvDepth = vec3(0.5 * clipSpace.xyz + vec3(0.5));

            uvDepth.z = clamp(uvDepth.z, 0., GREATEST_LESS_THAN_ONE);

            vec2 uv = uvDepth.xy * shadowMapSizeAndInverse.x;	// uv in texel units
            uv += 0.5;											// offset of half to be in the center of the texel
            vec2 st = fract(uv);								// how far from the center
            vec2 base_uv = floor(uv) - 0.5;						// texel coord
            base_uv *= shadowMapSizeAndInverse.y;				// move back to uv coords

            // Equation resolved to fit in a 3*3 distribution like 
            // 1 2 1
            // 2 4 2 
            // 1 2 1
            vec2 uvw0 = 3. - 2. * st;
            vec2 uvw1 = 1. + 2. * st;
            vec2 u = vec2((2. - st.x) / uvw0.x - 1., st.x / uvw1.x + 1.) * shadowMapSizeAndInverse.y;
            vec2 v = vec2((2. - st.y) / uvw0.y - 1., st.y / uvw1.y + 1.) * shadowMapSizeAndInverse.y;

            float shadow = 0.;
            shadow += uvw0.x * uvw0.y * texture2D(shadowSampler, vec4(base_uv.xy + vec2(u[0], v[0]), layer, uvDepth.z));
            shadow += uvw1.x * uvw0.y * texture2D(shadowSampler, vec4(base_uv.xy + vec2(u[1], v[0]), layer, uvDepth.z));
            shadow += uvw0.x * uvw1.y * texture2D(shadowSampler, vec4(base_uv.xy + vec2(u[0], v[1]), layer, uvDepth.z));
            shadow += uvw1.x * uvw1.y * texture2D(shadowSampler, vec4(base_uv.xy + vec2(u[1], v[1]), layer, uvDepth.z));
            shadow = shadow / 16.;

            shadow = mix(darkness, 1., shadow);
            return computeFallOff(shadow, clipSpace.xy, frustumEdgeFalloff);
        }

        // Shadow PCF kernel 5*5 in only 9 taps (high quality)
        // This uses a well distributed taps to allow a gaussian distribution covering a 5*5 kernel
        // https://mynameismjp.wordpress.com/2013/09/10/shadow-maps/
        #define inline
        float computeShadowWithCSMPCF5(float layer, vec4 vPositionFromLight, float depthMetric, highp sampler2DArrayShadow shadowSampler, vec2 shadowMapSizeAndInverse, float darkness, float frustumEdgeFalloff)
        {
            vec3 clipSpace = vPositionFromLight.xyz / vPositionFromLight.w;
            vec3 uvDepth = vec3(0.5 * clipSpace.xyz + vec3(0.5));

            uvDepth.z = clamp(uvDepth.z, 0., GREATEST_LESS_THAN_ONE);

            vec2 uv = uvDepth.xy * shadowMapSizeAndInverse.x;	// uv in texel units
            uv += 0.5;											// offset of half to be in the center of the texel
            vec2 st = fract(uv);								// how far from the center
            vec2 base_uv = floor(uv) - 0.5;						// texel coord
            base_uv *= shadowMapSizeAndInverse.y;				// move back to uv coords

            // Equation resolved to fit in a 5*5 distribution like 
            // 1 2 4 2 1
            vec2 uvw0 = 4. - 3. * st;
            vec2 uvw1 = vec2(7.);
            vec2 uvw2 = 1. + 3. * st;

            vec3 u = vec3((3. - 2. * st.x) / uvw0.x - 2., (3. + st.x) / uvw1.x, st.x / uvw2.x + 2.) * shadowMapSizeAndInverse.y;
            vec3 v = vec3((3. - 2. * st.y) / uvw0.y - 2., (3. + st.y) / uvw1.y, st.y / uvw2.y + 2.) * shadowMapSizeAndInverse.y;

            float shadow = 0.;
            shadow += uvw0.x * uvw0.y * texture2D(shadowSampler, vec4(base_uv.xy + vec2(u[0], v[0]), layer, uvDepth.z));
            shadow += uvw1.x * uvw0.y * texture2D(shadowSampler, vec4(base_uv.xy + vec2(u[1], v[0]), layer, uvDepth.z));
            shadow += uvw2.x * uvw0.y * texture2D(shadowSampler, vec4(base_uv.xy + vec2(u[2], v[0]), layer, uvDepth.z));
            shadow += uvw0.x * uvw1.y * texture2D(shadowSampler, vec4(base_uv.xy + vec2(u[0], v[1]), layer, uvDepth.z));
            shadow += uvw1.x * uvw1.y * texture2D(shadowSampler, vec4(base_uv.xy + vec2(u[1], v[1]), layer, uvDepth.z));
            shadow += uvw2.x * uvw1.y * texture2D(shadowSampler, vec4(base_uv.xy + vec2(u[2], v[1]), layer, uvDepth.z));
            shadow += uvw0.x * uvw2.y * texture2D(shadowSampler, vec4(base_uv.xy + vec2(u[0], v[2]), layer, uvDepth.z));
            shadow += uvw1.x * uvw2.y * texture2D(shadowSampler, vec4(base_uv.xy + vec2(u[1], v[2]), layer, uvDepth.z));
            shadow += uvw2.x * uvw2.y * texture2D(shadowSampler, vec4(base_uv.xy + vec2(u[2], v[2]), layer, uvDepth.z));
            shadow = shadow / 144.;

            shadow = mix(darkness, 1., shadow);
            return computeFallOff(shadow, clipSpace.xy, frustumEdgeFalloff);
        }

        // Shadow PCF kernel size 1 with a single tap (lowest quality)
        #define inline
        float computeShadowWithPCF1(vec4 vPositionFromLight, float depthMetric, sampler2DShadow shadowSampler, float darkness, float frustumEdgeFalloff)
        {
            if (depthMetric > 1.0 || depthMetric < 0.0) {
                return 1.0;
            }
            else
            {
                vec3 clipSpace = vPositionFromLight.xyz / vPositionFromLight.w;
                vec3 uvDepth = vec3(0.5 * clipSpace.xyz + vec3(0.5));

                float shadow = texture2D(shadowSampler, uvDepth);
                shadow = mix(darkness, 1., shadow);
                return computeFallOff(shadow, clipSpace.xy, frustumEdgeFalloff);
            }
        }

        // Shadow PCF kernel 3*3 in only 4 taps (medium quality)
        // This uses a well distributed taps to allow a gaussian distribution covering a 3*3 kernel
        // https://mynameismjp.wordpress.com/2013/09/10/shadow-maps/
        #define inline
        float computeShadowWithPCF3(vec4 vPositionFromLight, float depthMetric, sampler2DShadow shadowSampler, vec2 shadowMapSizeAndInverse, float darkness, float frustumEdgeFalloff)
        {
            if (depthMetric > 1.0 || depthMetric < 0.0) {
                return 1.0;
            }
            else
            {
                vec3 clipSpace = vPositionFromLight.xyz / vPositionFromLight.w;
                vec3 uvDepth = vec3(0.5 * clipSpace.xyz + vec3(0.5));

                vec2 uv = uvDepth.xy * shadowMapSizeAndInverse.x;	// uv in texel units
                uv += 0.5;											// offset of half to be in the center of the texel
                vec2 st = fract(uv);								// how far from the center
                vec2 base_uv = floor(uv) - 0.5;						// texel coord
                base_uv *= shadowMapSizeAndInverse.y;				// move back to uv coords

                // Equation resolved to fit in a 3*3 distribution like 
                // 1 2 1
                // 2 4 2 
                // 1 2 1
                vec2 uvw0 = 3. - 2. * st;
                vec2 uvw1 = 1. + 2. * st;
                vec2 u = vec2((2. - st.x) / uvw0.x - 1., st.x / uvw1.x + 1.) * shadowMapSizeAndInverse.y;
                vec2 v = vec2((2. - st.y) / uvw0.y - 1., st.y / uvw1.y + 1.) * shadowMapSizeAndInverse.y;

                float shadow = 0.;
                shadow += uvw0.x * uvw0.y * texture2D(shadowSampler, vec3(base_uv.xy + vec2(u[0], v[0]), uvDepth.z));
                shadow += uvw1.x * uvw0.y * texture2D(shadowSampler, vec3(base_uv.xy + vec2(u[1], v[0]), uvDepth.z));
                shadow += uvw0.x * uvw1.y * texture2D(shadowSampler, vec3(base_uv.xy + vec2(u[0], v[1]), uvDepth.z));
                shadow += uvw1.x * uvw1.y * texture2D(shadowSampler, vec3(base_uv.xy + vec2(u[1], v[1]), uvDepth.z));
                shadow = shadow / 16.;

                shadow = mix(darkness, 1., shadow);
                return computeFallOff(shadow, clipSpace.xy, frustumEdgeFalloff);
            }
        }
        
        // Shadow PCF kernel 5*5 in only 9 taps (high quality)
        // This uses a well distributed taps to allow a gaussian distribution covering a 5*5 kernel
        // https://mynameismjp.wordpress.com/2013/09/10/shadow-maps/
        #define inline
        float computeShadowWithPCF5(vec4 vPositionFromLight, float depthMetric, sampler2DShadow shadowSampler, vec2 shadowMapSizeAndInverse, float darkness, float frustumEdgeFalloff)
        {
            if (depthMetric > 1.0 || depthMetric < 0.0) {
                return 1.0;
            }
            else
            {
                vec3 clipSpace = vPositionFromLight.xyz / vPositionFromLight.w;
                vec3 uvDepth = vec3(0.5 * clipSpace.xyz + vec3(0.5));

                vec2 uv = uvDepth.xy * shadowMapSizeAndInverse.x;	// uv in texel units
                uv += 0.5;											// offset of half to be in the center of the texel
                vec2 st = fract(uv);								// how far from the center
                vec2 base_uv = floor(uv) - 0.5;						// texel coord
                base_uv *= shadowMapSizeAndInverse.y;				// move back to uv coords

                // Equation resolved to fit in a 5*5 distribution like 
                // 1 2 4 2 1
                vec2 uvw0 = 4. - 3. * st;
                vec2 uvw1 = vec2(7.);
                vec2 uvw2 = 1. + 3. * st;

                vec3 u = vec3((3. - 2. * st.x) / uvw0.x - 2., (3. + st.x) / uvw1.x, st.x / uvw2.x + 2.) * shadowMapSizeAndInverse.y;
                vec3 v = vec3((3. - 2. * st.y) / uvw0.y - 2., (3. + st.y) / uvw1.y, st.y / uvw2.y + 2.) * shadowMapSizeAndInverse.y;

                float shadow = 0.;
                shadow += uvw0.x * uvw0.y * texture2D(shadowSampler, vec3(base_uv.xy + vec2(u[0], v[0]), uvDepth.z));
                shadow += uvw1.x * uvw0.y * texture2D(shadowSampler, vec3(base_uv.xy + vec2(u[1], v[0]), uvDepth.z));
                shadow += uvw2.x * uvw0.y * texture2D(shadowSampler, vec3(base_uv.xy + vec2(u[2], v[0]), uvDepth.z));
                shadow += uvw0.x * uvw1.y * texture2D(shadowSampler, vec3(base_uv.xy + vec2(u[0], v[1]), uvDepth.z));
                shadow += uvw1.x * uvw1.y * texture2D(shadowSampler, vec3(base_uv.xy + vec2(u[1], v[1]), uvDepth.z));
                shadow += uvw2.x * uvw1.y * texture2D(shadowSampler, vec3(base_uv.xy + vec2(u[2], v[1]), uvDepth.z));
                shadow += uvw0.x * uvw2.y * texture2D(shadowSampler, vec3(base_uv.xy + vec2(u[0], v[2]), uvDepth.z));
                shadow += uvw1.x * uvw2.y * texture2D(shadowSampler, vec3(base_uv.xy + vec2(u[1], v[2]), uvDepth.z));
                shadow += uvw2.x * uvw2.y * texture2D(shadowSampler, vec3(base_uv.xy + vec2(u[2], v[2]), uvDepth.z));
                shadow = shadow / 144.;

                shadow = mix(darkness, 1., shadow);
                return computeFallOff(shadow, clipSpace.xy, frustumEdgeFalloff);
            }
        }

        const vec3 PoissonSamplers32[64] = vec3[64](
            vec3(0.06407013, 0.05409927, 0.),
            vec3(0.7366577, 0.5789394, 0.),
            vec3(-0.6270542, -0.5320278, 0.),
            vec3(-0.4096107, 0.8411095, 0.),
            vec3(0.6849564, -0.4990818, 0.),
            vec3(-0.874181, -0.04579735, 0.),
            vec3(0.9989998, 0.0009880066, 0.),
            vec3(-0.004920578, -0.9151649, 0.),
            vec3(0.1805763, 0.9747483, 0.),
            vec3(-0.2138451, 0.2635818, 0.),
            vec3(0.109845, 0.3884785, 0.),
            vec3(0.06876755, -0.3581074, 0.),
            vec3(0.374073, -0.7661266, 0.),
            vec3(0.3079132, -0.1216763, 0.),
            vec3(-0.3794335, -0.8271583, 0.),
            vec3(-0.203878, -0.07715034, 0.),
            vec3(0.5912697, 0.1469799, 0.),
            vec3(-0.88069, 0.3031784, 0.),
            vec3(0.5040108, 0.8283722, 0.),
            vec3(-0.5844124, 0.5494877, 0.),
            vec3(0.6017799, -0.1726654, 0.),
            vec3(-0.5554981, 0.1559997, 0.),
            vec3(-0.3016369, -0.3900928, 0.),
            vec3(-0.5550632, -0.1723762, 0.),
            vec3(0.925029, 0.2995041, 0.),
            vec3(-0.2473137, 0.5538505, 0.),
            vec3(0.9183037, -0.2862392, 0.),
            vec3(0.2469421, 0.6718712, 0.),
            vec3(0.3916397, -0.4328209, 0.),
            vec3(-0.03576927, -0.6220032, 0.),
            vec3(-0.04661255, 0.7995201, 0.),
            vec3(0.4402924, 0.3640312, 0.),

            vec3(0., 0., 0.),
            vec3(0., 0., 0.),
            vec3(0., 0., 0.),
            vec3(0., 0., 0.),
            vec3(0., 0., 0.),
            vec3(0., 0., 0.),
            vec3(0., 0., 0.),
            vec3(0., 0., 0.),
            vec3(0., 0., 0.),
            vec3(0., 0., 0.),
            vec3(0., 0., 0.),
            vec3(0., 0., 0.),
            vec3(0., 0., 0.),
            vec3(0., 0., 0.),
            vec3(0., 0., 0.),
            vec3(0., 0., 0.),
            vec3(0., 0., 0.),
            vec3(0., 0., 0.),
            vec3(0., 0., 0.),
            vec3(0., 0., 0.),
            vec3(0., 0., 0.),
            vec3(0., 0., 0.),
            vec3(0., 0., 0.),
            vec3(0., 0., 0.),
            vec3(0., 0., 0.),
            vec3(0., 0., 0.),
            vec3(0., 0., 0.),
            vec3(0., 0., 0.),
            vec3(0., 0., 0.),
            vec3(0., 0., 0.),
            vec3(0., 0., 0.),
            vec3(0., 0., 0.)
        );

        const vec3 PoissonSamplers64[64] = vec3[64](
            vec3(-0.613392, 0.617481, 0.),
            vec3(0.170019, -0.040254, 0.),
            vec3(-0.299417, 0.791925, 0.),
            vec3(0.645680, 0.493210, 0.),
            vec3(-0.651784, 0.717887, 0.),
            vec3(0.421003, 0.027070, 0.),
            vec3(-0.817194, -0.271096, 0.),
            vec3(-0.705374, -0.668203, 0.),
            vec3(0.977050, -0.108615, 0.),
            vec3(0.063326, 0.142369, 0.),
            vec3(0.203528, 0.214331, 0.),
            vec3(-0.667531, 0.326090, 0.),
            vec3(-0.098422, -0.295755, 0.),
            vec3(-0.885922, 0.215369, 0.),
            vec3(0.566637, 0.605213, 0.),
            vec3(0.039766, -0.396100, 0.),
            vec3(0.751946, 0.453352, 0.),
            vec3(0.078707, -0.715323, 0.),
            vec3(-0.075838, -0.529344, 0.),
            vec3(0.724479, -0.580798, 0.),
            vec3(0.222999, -0.215125, 0.),
            vec3(-0.467574, -0.405438, 0.),
            vec3(-0.248268, -0.814753, 0.),
            vec3(0.354411, -0.887570, 0.),
            vec3(0.175817, 0.382366, 0.),
            vec3(0.487472, -0.063082, 0.),
            vec3(-0.084078, 0.898312, 0.),
            vec3(0.488876, -0.783441, 0.),
            vec3(0.470016, 0.217933, 0.),
            vec3(-0.696890, -0.549791, 0.),
            vec3(-0.149693, 0.605762, 0.),
            vec3(0.034211, 0.979980, 0.),
            vec3(0.503098, -0.308878, 0.),
            vec3(-0.016205, -0.872921, 0.),
            vec3(0.385784, -0.393902, 0.),
            vec3(-0.146886, -0.859249, 0.),
            vec3(0.643361, 0.164098, 0.),
            vec3(0.634388, -0.049471, 0.),
            vec3(-0.688894, 0.007843, 0.),
            vec3(0.464034, -0.188818, 0.),
            vec3(-0.440840, 0.137486, 0.),
            vec3(0.364483, 0.511704, 0.),
            vec3(0.034028, 0.325968, 0.),
            vec3(0.099094, -0.308023, 0.),
            vec3(0.693960, -0.366253, 0.),
            vec3(0.678884, -0.204688, 0.),
            vec3(0.001801, 0.780328, 0.),
            vec3(0.145177, -0.898984, 0.),
            vec3(0.062655, -0.611866, 0.),
            vec3(0.315226, -0.604297, 0.),
            vec3(-0.780145, 0.486251, 0.),
            vec3(-0.371868, 0.882138, 0.),
            vec3(0.200476, 0.494430, 0.),
            vec3(-0.494552, -0.711051, 0.),
            vec3(0.612476, 0.705252, 0.),
            vec3(-0.578845, -0.768792, 0.),
            vec3(-0.772454, -0.090976, 0.),
            vec3(0.504440, 0.372295, 0.),
            vec3(0.155736, 0.065157, 0.),
            vec3(0.391522, 0.849605, 0.),
            vec3(-0.620106, -0.328104, 0.),
            vec3(0.789239, -0.419965, 0.),
            vec3(-0.545396, 0.538133, 0.),
            vec3(-0.178564, -0.596057, 0.)
        );

        // PCSS
        // This helps to achieve a contact hardening effect on the shadow
        // It uses 16 Taps for search and a 32 PCF taps in a randomly rotating poisson sampling disc.
        // This is heavily inspired from http://developer.download.nvidia.com/shaderlibrary/docs/shadow_PCSS.pdf
        // and http://developer.download.nvidia.com/whitepapers/2008/PCSS_Integration.pdf
        #define inline
        float computeShadowWithCSMPCSS(float layer, vec4 vPositionFromLight, float depthMetric, highp sampler2DArray depthSampler, highp sampler2DArrayShadow shadowSampler, float shadowMapSizeInverse, float lightSizeUV, float darkness, float frustumEdgeFalloff, int searchTapCount, int pcfTapCount, vec3[64] poissonSamplers, vec2 lightSizeUVCorrection, float depthCorrection, float penumbraDarkness)
        {
            vec3 clipSpace = vPositionFromLight.xyz / vPositionFromLight.w;
            vec3 uvDepth = vec3(0.5 * clipSpace.xyz + vec3(0.5));

            uvDepth.z = clamp(uvDepth.z, 0., GREATEST_LESS_THAN_ONE);

            vec4 uvDepthLayer = vec4(uvDepth.x, uvDepth.y, layer, uvDepth.z);

            float blockerDepth = 0.0;
            float sumBlockerDepth = 0.0;
            float numBlocker = 0.0;
            for (int i = 0; i < searchTapCount; i ++) {
                blockerDepth = texture(depthSampler, vec3(uvDepth.xy + (lightSizeUV * lightSizeUVCorrection * shadowMapSizeInverse * PoissonSamplers32[i].xy), layer)).r;
                if (blockerDepth < depthMetric) {
                    sumBlockerDepth += blockerDepth;
                    numBlocker++;
                }
            }

            if (numBlocker < 1.0) {
                return 1.0;
            }
            else
            {
                float avgBlockerDepth = sumBlockerDepth / numBlocker;

                // Offset preventing aliasing on contact.
                float AAOffset = shadowMapSizeInverse * 10.;
                // Do not dividing by z despite being physically incorrect looks better due to the limited kernel size.
                // float penumbraRatio = (depthMetric - avgBlockerDepth) / avgBlockerDepth;
                float penumbraRatio = ((depthMetric - avgBlockerDepth) * depthCorrection + AAOffset);
                vec4 filterRadius = vec4(penumbraRatio * lightSizeUV * lightSizeUVCorrection * shadowMapSizeInverse, 0., 0.);

                float random = getRand(vPositionFromLight.xy);
                float rotationAngle = random * 3.1415926;
                vec2 rotationVector = vec2(cos(rotationAngle), sin(rotationAngle));

                float shadow = 0.;
                for (int i = 0; i < pcfTapCount; i++) {
                    vec4 offset = vec4(poissonSamplers[i], 0.);
                    // Rotated offset.
                    offset = vec4(offset.x * rotationVector.x - offset.y * rotationVector.y, offset.y * rotationVector.x + offset.x * rotationVector.y, 0., 0.);
                    shadow += texture2D(shadowSampler, uvDepthLayer + offset * filterRadius);
                }
                shadow /= float(pcfTapCount);

                // Blocker distance falloff
                shadow = mix(shadow, 1., min((depthMetric - avgBlockerDepth) * depthCorrection * penumbraDarkness, 1.));

                // Apply darkness
                shadow = mix(darkness, 1., shadow);

                // Apply light frustrum fallof
                return computeFallOff(shadow, clipSpace.xy, frustumEdgeFalloff);
            }
        }

        // PCSS
        // This helps to achieve a contact hardening effect on the shadow
        // It uses 16 Taps for search and a 32 PCF taps in a randomly rotating poisson sampling disc.
        // This is heavily inspired from http://developer.download.nvidia.com/shaderlibrary/docs/shadow_PCSS.pdf
        // and http://developer.download.nvidia.com/whitepapers/2008/PCSS_Integration.pdf
        #define inline
        float computeShadowWithPCSS(vec4 vPositionFromLight, float depthMetric, sampler2D depthSampler, sampler2DShadow shadowSampler, float shadowMapSizeInverse, float lightSizeUV, float darkness, float frustumEdgeFalloff, int searchTapCount, int pcfTapCount, vec3[64] poissonSamplers)
        {
            if (depthMetric > 1.0 || depthMetric < 0.0) {
                return 1.0;
            }
            else
            {
                vec3 clipSpace = vPositionFromLight.xyz / vPositionFromLight.w;
                vec3 uvDepth = vec3(0.5 * clipSpace.xyz + vec3(0.5));

                float blockerDepth = 0.0;
                float sumBlockerDepth = 0.0;
                float numBlocker = 0.0;
                for (int i = 0; i < searchTapCount; i ++) {
                    blockerDepth = texture(depthSampler, uvDepth.xy + (lightSizeUV * shadowMapSizeInverse * PoissonSamplers32[i].xy)).r;
                    if (blockerDepth < depthMetric) {
                        sumBlockerDepth += blockerDepth;
                        numBlocker++;
                    }
                }

                if (numBlocker < 1.0) {
                    return 1.0;
                }
                else
                {
                    float avgBlockerDepth = sumBlockerDepth / numBlocker;

                    // Offset preventing aliasing on contact.
                    float AAOffset = shadowMapSizeInverse * 10.;
                    // Do not dividing by z despite being physically incorrect looks better due to the limited kernel size.
                    // float penumbraRatio = (depthMetric - avgBlockerDepth) / avgBlockerDepth;
                    float penumbraRatio = ((depthMetric - avgBlockerDepth) + AAOffset);
                    float filterRadius = penumbraRatio * lightSizeUV * shadowMapSizeInverse;

                    float random = getRand(vPositionFromLight.xy);
                    float rotationAngle = random * 3.1415926;
                    vec2 rotationVector = vec2(cos(rotationAngle), sin(rotationAngle));

                    float shadow = 0.;
                    for (int i = 0; i < pcfTapCount; i++) {
                        vec3 offset = poissonSamplers[i];
                        // Rotated offset.
                        offset = vec3(offset.x * rotationVector.x - offset.y * rotationVector.y, offset.y * rotationVector.x + offset.x * rotationVector.y, 0.);
                        shadow += texture2D(shadowSampler, uvDepth + offset * filterRadius);
                    }
                    shadow /= float(pcfTapCount);

                    // Blocker distance falloff
                    shadow = mix(shadow, 1., depthMetric - avgBlockerDepth);

                    // Apply darkness
                    shadow = mix(darkness, 1., shadow);

                    // Apply light frustrum fallof
                    return computeFallOff(shadow, clipSpace.xy, frustumEdgeFalloff);
                }
            }
        }

        #define inline
        float computeShadowWithPCSS16(vec4 vPositionFromLight, float depthMetric, sampler2D depthSampler, sampler2DShadow shadowSampler, float shadowMapSizeInverse, float lightSizeUV, float darkness, float frustumEdgeFalloff)
        {
            return computeShadowWithPCSS(vPositionFromLight, depthMetric, depthSampler, shadowSampler, shadowMapSizeInverse, lightSizeUV, darkness, frustumEdgeFalloff, 16, 16, PoissonSamplers32);
        }

        #define inline
        float computeShadowWithPCSS32(vec4 vPositionFromLight, float depthMetric, sampler2D depthSampler, sampler2DShadow shadowSampler, float shadowMapSizeInverse, float lightSizeUV, float darkness, float frustumEdgeFalloff)
        {
            return computeShadowWithPCSS(vPositionFromLight, depthMetric, depthSampler, shadowSampler, shadowMapSizeInverse, lightSizeUV, darkness, frustumEdgeFalloff, 16, 32, PoissonSamplers32);
        }

        #define inline
        float computeShadowWithPCSS64(vec4 vPositionFromLight, float depthMetric, sampler2D depthSampler, sampler2DShadow shadowSampler, float shadowMapSizeInverse, float lightSizeUV, float darkness, float frustumEdgeFalloff)
        {
            return computeShadowWithPCSS(vPositionFromLight, depthMetric, depthSampler, shadowSampler, shadowMapSizeInverse, lightSizeUV, darkness, frustumEdgeFalloff, 32, 64, PoissonSamplers64);
        }

        #define inline
        float computeShadowWithCSMPCSS16(float layer, vec4 vPositionFromLight, float depthMetric, highp sampler2DArray depthSampler, highp sampler2DArrayShadow shadowSampler, float shadowMapSizeInverse, float lightSizeUV, float darkness, float frustumEdgeFalloff, vec2 lightSizeUVCorrection, float depthCorrection, float penumbraDarkness)
        {
            return computeShadowWithCSMPCSS(layer, vPositionFromLight, depthMetric, depthSampler, shadowSampler, shadowMapSizeInverse, lightSizeUV, darkness, frustumEdgeFalloff, 16, 16, PoissonSamplers32, lightSizeUVCorrection, depthCorrection, penumbraDarkness);
        }

        #define inline
        float computeShadowWithCSMPCSS32(float layer, vec4 vPositionFromLight, float depthMetric, highp sampler2DArray depthSampler, highp sampler2DArrayShadow shadowSampler, float shadowMapSizeInverse, float lightSizeUV, float darkness, float frustumEdgeFalloff, vec2 lightSizeUVCorrection, float depthCorrection, float penumbraDarkness)
        {
            return computeShadowWithCSMPCSS(layer, vPositionFromLight, depthMetric, depthSampler, shadowSampler, shadowMapSizeInverse, lightSizeUV, darkness, frustumEdgeFalloff, 16, 32, PoissonSamplers32, lightSizeUVCorrection, depthCorrection, penumbraDarkness);
        }

        #define inline
        float computeShadowWithCSMPCSS64(float layer, vec4 vPositionFromLight, float depthMetric, highp sampler2DArray depthSampler, highp sampler2DArrayShadow shadowSampler, float shadowMapSizeInverse, float lightSizeUV, float darkness, float frustumEdgeFalloff, vec2 lightSizeUVCorrection, float depthCorrection, float penumbraDarkness)
        {
            return computeShadowWithCSMPCSS(layer, vPositionFromLight, depthMetric, depthSampler, shadowSampler, shadowMapSizeInverse, lightSizeUV, darkness, frustumEdgeFalloff, 32, 64, PoissonSamplers64, lightSizeUVCorrection, depthCorrection, penumbraDarkness);
        }
    #endif
#endif
