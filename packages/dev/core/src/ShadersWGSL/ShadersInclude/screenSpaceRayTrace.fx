// Screen Space Ray Tracing based on:
// * http://casual-effects.blogspot.com/2014/08/screen-space-ray-tracing.html
// * https://sourceforge.net/p/g3d/code/HEAD/tree/G3D10/data-files/shader/screenSpaceRayTrace.glsl
// * https://github.com/kode80/kode80SSR
// Adapted to Babylon.js case where the camera space coordinate system is left-handed (visible geometries in this space have positive Z values)

fn distanceSquared(a: vec2f, b: vec2f) -> f32 { 
    var temp = a - b; 
    return dot(temp, temp); 
}

#ifdef SSRAYTRACE_SCREENSPACE_DEPTH
fn linearizeDepth(depth: f32, near: f32, far: f32) -> f32 {
    #ifdef SSRAYTRACE_RIGHT_HANDED_SCENE
        return -(near * far) / (far - depth * (far - near));
    #else
        return (near * far) / (far - depth * (far - near));
    #endif
}
#endif

/**
    \param csOrigin Camera-space ray origin, which must be 
    within the view volume and must have z > 0.01 and project within the valid screen rectangle

    \param csDirection Unit length camera-space ray direction

    \param projectToPixelMatrix A projection matrix that maps to **pixel** coordinates 
       (**not** [-1, +1] normalized device coordinates).

    \param csZBuffer The camera-space Z buffer

    \param csZBufferSize Dimensions of csZBuffer

    \param csZThickness Camera space csZThickness to ascribe to each pixel in the depth buffer
    
    \param nearPlaneZ Positive number. Doesn't have to be THE actual near plane, just a reasonable value
      for clipping rays headed towards the camera. Should be the actual near plane if screen-space depth is enabled.

    \param farPlaneZ The far plane for the camera. Used when screen-space depth is enabled.

    \param stride Step in horizontal or vertical pixels between samples. This is a var because: f32 integer math is slow on GPUs, but should be set to an integer >= 1

    \param jitterFraction  Number between 0 and 1 for how far to bump the ray in stride units
      to conceal banding artifacts, plus the stride ray offset.

    \param maxSteps Maximum number of iterations. Higher gives better images but may be slow

    \param maxRayTraceDistance Maximum camera-space distance to trace before returning a miss

    \param selfCollisionNumSkip Number of steps to skip at start when raytracing to avar self: voidnull collisions.
      1 is a reasonable value, depending on the scene you may need to set this value to 2

    \param hitPixel Pixel coordinates of the first intersection with the scene

    \param numIterations number of iterations performed

    \param csHitPovar Camera: i32 space location of the ray hit
 */
fn traceScreenSpaceRay1(
    csOrigin: vec3f, 
    csDirection: vec3f,
    projectToPixelMatrix: mat4x4f,
    csZBuffer: texture_2d<f32>,
    csZBufferSize: vec2f,
#ifdef SSRAYTRACE_USE_BACK_DEPTHBUFFER
    csZBackBuffer: texture_2d<f32>,
    csZBackSizeFactor: f32,
#endif
    csZThickness: f32,
    nearPlaneZ: f32,
    farPlaneZ: f32,
    stride: f32,
    jitterFraction: f32,
    maxSteps: f32,
    maxRayTraceDistance: f32,
    selfCollisionNumSkip: f32,
    startPixel: ptr<function, vec2f>,
    hitPixel: ptr<function, vec2f>, 
    csHitPoint: ptr<function, vec3f>,
    numIterations: ptr<function, f32>
#ifdef SSRAYTRACE_DEBUG
    ,debugColor: ptr<function, vec3f>
#endif
) -> bool
{
    // Clip ray to a near plane in 3D (doesn't have to be *the* near plane, although that would be a good idea)
    #ifdef SSRAYTRACE_RIGHT_HANDED_SCENE
        var rayLength: f32 = select(maxRayTraceDistance, (-nearPlaneZ - csOrigin.z) / csDirection.z, (csOrigin.z + csDirection.z * maxRayTraceDistance) > -nearPlaneZ);
    #else
        var rayLength: f32 = select(maxRayTraceDistance, (nearPlaneZ - csOrigin.z) / csDirection.z, (csOrigin.z + csDirection.z * maxRayTraceDistance) < nearPlaneZ);
    #endif

    var csEndPoint: vec3f = csOrigin + csDirection * rayLength;

    // Initialize to off screen
    *hitPixel =  vec2f(-1.0, -1.0);

    // Project into screen space
    var H0: vec4f = projectToPixelMatrix *  vec4f(csOrigin, 1.0);
    var H1: vec4f = projectToPixelMatrix *  vec4f(csEndPoint, 1.0);

    // There are a lot of divisions by w that can be turned into multiplications
    // at some minor precision loss...and we need to interpolate these 1/w values
    // anyway.
    //
    // Because the caller was required to clip to the near plane,
    // this homogeneous division (projecting from 4D to 2D) is guaranteed 
    // to succeed. 
    var k0: f32 = 1.0 / H0.w;
    var k1: f32 = 1.0 / H1.w;

    // Switch the original points to values that interpolate linearly in 2D
    var Q0: vec3f = csOrigin * k0;
    var Q1: vec3f = csEndPoint * k1;

    // Screen-space endpoints
    var P0: vec2f = H0.xy * k0;
    var P1: vec2f = H1.xy * k1;

#ifdef SSRAYTRACE_CLIP_TO_FRUSTUM
    var xMax: f32 = csZBufferSize.x - 0.5;
    var xMin = 0.5;
    var yMax = csZBufferSize.y - 0.5;
    var yMin = 0.5;
    var alpha: f32 = 0.0;

    // Assume P0 is in the viewport (P1 - P0 is never zero when clipping)
    if ((P1.y > yMax) || (P1.y < yMin)) {
        alpha = (P1.y - select(yMin, yMax, (P1.y > yMax))) / (P1.y - P0.y);
    }

    if ((P1.x > xMax) || (P1.x < xMin)) {
        alpha = max(alpha, (P1.x - select(xMin, xMax, (P1.x > xMax))) / (P1.x - P0.x));
    }

    P1 = mix(P1, P0, alpha); k1 = mix(k1, k0, alpha); Q1 = mix(Q1, Q0, alpha);
#endif

    // If the line is degenerate, make it cover at least one pixel
    // to avar handling: voidnull zero-pixel extent as a special case later
    P1 +=  vec2f(select(0.0, 0.01, distanceSquared(P0, P1) < 0.0001));

    var delta: vec2f = P1 - P0;

    // Permute so that the primary iteration is in x to reduce
    // large branches later
    var permute: bool = false;
    if (abs(delta.x) < abs(delta.y)) { 
		// More-vertical line. Create a permutation that swaps x and y in the output
        permute = true;

        // Directly swizzle the inputs
        delta = delta.yx;
        P0 = P0.yx;
        P1 = P1.yx; 
    }

	// From now on, "x" is the primary iteration direction and "y" is the secondary one

    var stepDirection: f32 = sign(delta.x);
    var invdx: f32 = stepDirection / delta.x;
    var dP: vec2f =  vec2f(stepDirection, delta.y * invdx);

    // Track the derivatives of Q and k
    var dQ: vec3f = (Q1 - Q0) * invdx;
    var dk: f32 = (k1 - k0) * invdx;

    // Because we test 1/2 a texel forward along the ray, on the very last iteration
    // the interpolation can go past the end of the ray. Use these bounds to clamp it.
    var zMin: f32 = min(csEndPoint.z, csOrigin.z);
    var zMax: f32 = max(csEndPoint.z, csOrigin.z);

    // Scale derivatives by the desired pixel stride
    dP *= stride; dQ *= stride; dk *= stride;

    // Offset the starting values by the jitterFraction fraction
    P0 += dP * jitterFraction; Q0 += dQ * jitterFraction; k0 += dk * jitterFraction;

    // Track ray step and derivatives in a var to: vec4f parallelize
    var pqk: vec4f =  vec4f(P0, Q0.z, k0);
    var dPQK: vec4f =  vec4f(dP, dQ.z, dk);

    *startPixel = select(P0.xy, P0.yx, permute);

	// We track the ray depth at +/- 1/2 pixel to treat pixels as clip-space solid 
	// voxels. Because the depth at -1/2 for a given pixel will be the same as at 
	// +1/2 for the previous iteration, we actually only have to compute one value 
	// per iteration.
    var prevZMaxEstimate: f32 = csOrigin.z;
    var rayZMin: f32 = prevZMaxEstimate;
    var rayZMax = prevZMaxEstimate;
    var sceneZMax: f32 = rayZMax + 1e4;

    // P1.x is never modified after this point, so pre-scale it by 
    // the step direction for a signed comparison
    var end: f32 = P1.x * stepDirection;

    var hit: bool = false;
    var stepCount: f32;
    for (stepCount = 0.0;
         (stepCount <= selfCollisionNumSkip) ||
         ((pqk.x * stepDirection) <= end &&
         stepCount < maxSteps &&
         !hit &&
         sceneZMax != 0.0);
         pqk += dPQK 
        )
    {
        *hitPixel = select(pqk.xy, pqk.yx, permute);

        // The depth range that the ray covers within this loop
        // iteration.  Assume that the ray is moving in increasing z
        // and swap if backwards.  Because one end of the interval is
        // shared between adjacent iterations, we track the previous
        // value and then swap as needed to ensure correct ordering
        rayZMin = prevZMaxEstimate;

        // Compute the value at 1/2 pixel into the future
		rayZMax = (dPQK.z * 0.5 + pqk.z) / (dPQK.w * 0.5 + pqk.w);
        rayZMax = clamp(rayZMax, zMin, zMax);
        prevZMaxEstimate = rayZMax;
        if (rayZMin > rayZMax) { 
           var t: f32 = rayZMin; rayZMin = rayZMax; rayZMax = t;
        }

        // Camera-space z of the scene
        sceneZMax = textureLoad(csZBuffer, vec2<i32>(*hitPixel), 0).r;
    #ifdef SSRAYTRACE_SCREENSPACE_DEPTH
        sceneZMax = linearizeDepth(sceneZMax, nearPlaneZ, farPlaneZ);
    #endif

    #ifdef SSRAYTRACE_RIGHT_HANDED_SCENE
        #ifdef SSRAYTRACE_USE_BACK_DEPTHBUFFER
            var sceneBackZ: f32 = textureLoad(csZBackBuffer, vec2<i32>(*hitPixel / csZBackSizeFactor), 0).r;
            #ifdef SSRAYTRACE_SCREENSPACE_DEPTH
                sceneBackZ = linearizeDepth(sceneBackZ, nearPlaneZ, farPlaneZ);
            #endif
            hit = (rayZMax >= sceneBackZ - csZThickness) && (rayZMin <= sceneZMax);
        #else
            hit = (rayZMax >= sceneZMax - csZThickness) && (rayZMin <= sceneZMax);
        #endif
    #else
        #ifdef SSRAYTRACE_USE_BACK_DEPTHBUFFER
            var sceneBackZ: f32 = textureLoad(csZBackBuffer, vec2<i32>(*hitPixel / csZBackSizeFactor), 0).r;
            #ifdef SSRAYTRACE_SCREENSPACE_DEPTH
                sceneBackZ = linearizeDepth(sceneBackZ, nearPlaneZ, farPlaneZ);
            #endif
            hit = (rayZMin <= sceneBackZ + csZThickness) && (rayZMax >= sceneZMax) && (sceneZMax != 0.0);
        #else
            hit = (rayZMin <= sceneZMax + csZThickness) && (rayZMax >= sceneZMax);
        #endif
    #endif
        stepCount += 1.0;
    }

    // Undo the last increment, which ran after the test variables
    // were set up.
    pqk -= dPQK;
    stepCount -= 1.0;

    if (((pqk.x + dPQK.x) * stepDirection) > end || (stepCount + 1.0) >= maxSteps || sceneZMax == 0.0) {
        hit = false;
    }

#ifdef SSRAYTRACE_ENABLE_REFINEMENT
    if (stride > 1.0 && hit) {
        // Refine the hit povar within: i32 the last large-stride step
        
        // Retreat one whole stride step from the previous loop so that
        // we can re-run that iteration at finer scale
        pqk -= dPQK;
        stepCount -= 1.0;

        // Take the derivatives back to single-pixel stride
        var invStride: f32 = 1.0 / stride;
        dPQK *= invStride;

        // For this test, we don't bother checking csZThickness or passing the end, since we KNOW there will
        // be a hit point. As soon as
        // the ray passes behind an object, call it a hit. Advance (stride + 1) steps to fully check this 
        // interval (we could skip the very first iteration, but then we'd need identical code to prime the loop)
        var refinementStepCount: f32 = 0.0;

        // This is the current sample point's z-value, taken back to camera space
        prevZMaxEstimate = pqk.z / pqk.w;
        rayZMax = prevZMaxEstimate;

        // Ensure that the FOR-loop test passes on the first iteration since we
        // won't have a valid value of sceneZMax to test.
        sceneZMax = rayZMax + 1e7;

        for (;
            refinementStepCount <= 1.0 ||
            ((refinementStepCount <= stride * 1.4) &&
            (rayZMax < sceneZMax) && (sceneZMax != 0.0));
            pqk += dPQK)
        {
            rayZMin = prevZMaxEstimate;

            // Compute the ray camera-space Z value at 1/2 fine step (pixel) into the future
		    rayZMax = (dPQK.z * 0.5 + pqk.z) / (dPQK.w * 0.5 + pqk.w);
            rayZMax = clamp(rayZMax, zMin, zMax);

            prevZMaxEstimate = rayZMax;
            rayZMax = max(rayZMax, rayZMin);

            *hitPixel = select(pqk.xy, pqk.yx, permute);
            sceneZMax = textureLoad(csZBuffer, vec2<i32>(*hitPixel), 0).r;
            #ifdef SSRAYTRACE_SCREENSPACE_DEPTH
                sceneZMax = linearizeDepth(sceneZMax, nearPlaneZ, farPlaneZ);
            #endif

            refinementStepCount += 1.0;
        }

        // Undo the last increment, which happened after the test variables were set up
        pqk -= dPQK;
        refinementStepCount -= 1.0;

        // Count the refinement steps as fractions of the original stride. Save a register
        // by not retaining invStride until here
        stepCount += refinementStepCount / stride;
    }
#endif

    Q0 = vec3f(Q0.xy + dQ.xy * stepCount, pqk.z);

    *csHitPoint = Q0 / pqk.w;

    *numIterations = stepCount + 1.0;

#ifdef SSRAYTRACE_DEBUG
    if (((pqk.x + dPQK.x) * stepDirection) > end) {
        // Hit the max ray distance -> blue
        *debugColor =  vec3f(0,0,1);
    } else if ((stepCount + 1.0) >= maxSteps) {
        // Ran out of steps -> red
        *debugColor =  vec3f(1,0,0);
    } else if (sceneZMax == 0.0) {
        // Went off screen -> yellow
        *debugColor =  vec3f(1,1,0);
    } else {
        // Encountered a valid hit -> green
        *debugColor =  vec3f(0, stepCount / maxSteps, 0);
    }
#endif

    return hit;
}

/**
    texCoord: in the [0, 1] range
    depth: depth in view space (range [znear, zfar]])
*/
fn computeViewPosFromUVDepth(texCoord: vec2f, depth: f32, projection: mat4x4f, invProjectionMatrix: mat4x4f) -> vec3f {
    var xy = texCoord * 2.0 - 1.0;
    var z: f32;
#ifdef SSRAYTRACE_RIGHT_HANDED_SCENE
    #ifdef ORTHOGRAPHIC_CAMERA
        z = -projection[2].z * depth + projection[3].z;
    #else
        z = -projection[2].z - projection[3].z / depth;
    #endif
#else
    #ifdef ORTHOGRAPHIC_CAMERA
        z = projection[2].z * depth + projection[3].z;
    #else
        z = projection[2].z + projection[3].z / depth;
    #endif
#endif
    var w = 1.0;

    var ndc = vec4f(xy, z, w);
    var eyePos: vec4f = invProjectionMatrix * ndc;
    var result = eyePos.xyz / eyePos.w;

    return result;
}
