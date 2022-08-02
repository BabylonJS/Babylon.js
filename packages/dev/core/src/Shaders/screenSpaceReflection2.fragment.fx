// Screen Space Reflection Post-Process based on the following tutorial:
// https://lettier.github.io/3d-game-shaders-for-beginners/screen-space-reflection.html

precision highp float;
uniform sampler2D textureSampler;

#ifdef SSR_SUPPORTED
uniform sampler2D normalSampler;
uniform sampler2D positionSampler;
uniform sampler2D reflectivitySampler;
uniform sampler2D depthSampler;
#if defined(BACKUP_TEXTURE)
    uniform samplerCube backUpSampler;
#endif // BACKUP
// SSR parameters
uniform float maxDistance;
uniform float resolution;
uniform int steps;
uniform float thickness;
uniform float strength;
uniform float falloffExponent;
uniform float roughnessFactor;
uniform float distanceFade;
uniform float maxReflectivityForSSRReflections;
#endif // SSR_SUPPORTED

uniform mat4 view;
uniform mat4 projection;

// camera properties
uniform float minZ;
uniform float maxZ;
uniform vec3 cameraPos;

// Varyings
varying vec2 vUV;

#ifdef SSR_SUPPORTED

/**
 * According to specular, see https://en.wikipedia.org/wiki/Schlick%27s_approximation
 */
vec3 fresnelSchlick(float cosTheta, vec3 F0)
{
    return F0 + (vec3(1.0) - F0) * pow(1.0 - cosTheta, 5.0);
}

vec3 hash(vec3 a)
{
    a = fract(a * 0.8);
    a += dot(a, a.yxz + 19.19);   
    return fract((a.xxy + a.yxx) * a.zyx); 
}

// Structs
struct ReflectionInfo {
    float visibilityBackup;
    float visibility;
    vec2 coords;
    bool miss;
};

/** Computes and returns the coordinates and the visibility of the reflected pixel if any, as well as a boolean defining if there is a reflected pixel or if it's a miss
 * The intersection algorithm based on a David Lettier's tutorial uses 2D ray marching 
 */
ReflectionInfo getReflectionInfo2DRayMarching(vec3 dirVS, vec3 hitCoordVS, vec2 texSize){

    ReflectionInfo info;
    // Default values if the algorithm fail to find intersection:
    info.visibilityBackup = 0.0;
    info.visibility = 0.0;
    info.coords = vUV;
    info.miss = true;

    // Calculate the start and end point of the reflection ray in view space.
    vec4 startVS = vec4(hitCoordVS, 1.0);
    vec4 endVS = vec4(hitCoordVS + (dirVS * maxDistance), 1.0);

    #ifdef RIGHT_HANDED_SCENE
        if (endVS.z > minZ) // no need to compute anything, the max depth of reflection is not in the view space (not behind the near plane)
    #else 
        if (endVS.z < minZ) 
    #endif
    {
    #if defined(BACKUP_TEXTURE)
        info.visibilityBackup = 1.0;
    #endif
    return info;
    }


    // Calculate the start and end point of the reflection ray in screen space.
    vec4 startSS = projection * startVS; // Project to screen space.
    startSS.xyz /= startSS.w; // Perform the perspective divide.
    startSS.xy = startSS.xy * 0.5 + vec2(0.5); // Convert from clip space to texture space.
    startSS.xy *= texSize; // Convert the UV coordinates to fragment/pixel coordinates.

    vec4 endSS = projection * endVS;
    endSS.xyz /= endSS.w;
    endSS.xy = endSS.xy * 0.5 + vec2(0.5);
    endSS.xy *= texSize;

    vec2 currFrag = startSS.xy; // (currFrag / texSize) equivalent to vUV at this point
    vec2 uv = vUV;

    // compute delta difference between X and Y coordinates
    float deltaX = endSS.x - startSS.x;
    float deltaY = endSS.y - startSS.y;

    // useX = 1 if the X dimension is bigger than the Y one
    float useX = abs(deltaX) >= abs(deltaY) ? 1.0 : 0.0;
    
    // delta: the biggest delta between deltaX and deltaY
    float delta = mix(abs(deltaY), abs(deltaX), useX) * clamp(resolution, 0.0, 1.0);
    
    // increment: interpolation step according to each direction
    vec2 increment = vec2(deltaX, deltaY) / max(delta, 0.01); // we skip some pixels if resolution less than 1.0

    // percentage of research, interpolation coefficient
    float search0 = 0.0;
    float search1 = 0.0;
    float currSearch = 0.0;

    // indices defining if there is a hit or not at each pass
    float hit0 = 0.0;
    float hit1 = 0.0;

    float rayDepth = startVS.z; // depth of the start point in view space
    float deltaDepth; 
    float depthFromDepthBuffer; 

    // We are using varying thickness, depending on the distance between two adjacent pixels in view space
    float offset; // use to compute maxTol offset
    float maxTol = thickness; // will be increased depending on distance between two adjacent pixels in view space

    // start of the first pass: looking for intersection position
    for (int i = 0; i < int(delta); i++) {
        // move from the startSS to endSS using linear interpolation
        // currFragx = (startSS.x) * (1.0 - currSearch) + (endSS.x) * currSearch;
        // currFragy = (startSS.y) * (1.0 - currSearch) + (endSS.y) * currSearch;
        currFrag += increment;
        uv.xy  = currFrag / texSize;

        depthFromDepthBuffer = (texture2D(depthSampler, uv).r);
        // depthFromDepthBuffer = (view *texture2D(positionSampler, uv.xy)).z; // equivalent to the previous line

        offset = (startVS.z * endVS.z) / mix(endVS.z, startVS.z, currSearch);
        
        // increase search info 
        currSearch = mix ( (currFrag.y - startSS.y) / deltaY, 
                      (currFrag.x - startSS.x) / deltaX, 
                      useX);

        // perspective-correct interpolation to find 
        rayDepth = (startVS.z * endVS.z) / mix(endVS.z, startVS.z, currSearch);

        offset = abs(offset - rayDepth);
        maxTol = thickness + offset;
       
        // difference between the perspective-correct interpolation and the current depth of the scene
        deltaDepth = rayDepth - depthFromDepthBuffer;
        #ifdef RIGHT_HANDED_SCENE
            deltaDepth *= -1.0;
        #endif

        if (deltaDepth > 0.0 && deltaDepth < maxTol) {
            hit0 = 1.0;
        } 
        
        if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0){ 
            #if defined(BACKUP_TEXTURE)
                info.visibilityBackup = 1.0;
            #endif
            return info;
        } 
        
        if (hit0 == 1.0) break;

        // no intersection, we continue
        // search0 save the position of the last known miss
        search0 = currSearch;
    }  
    // end of the first pass

    if (hit0 == 0.0){ // if no hit during the first pass, we skip the second pass
        #if defined(BACKUP_TEXTURE)
            info.visibilityBackup = 1.0;
        #endif
        return info;
    }

    // save search1 as the last known hit position
    search1 = currSearch;  
    // save currSearch as the halfway between the position of the last miss and the position of the last hit 
    currSearch = ((search1 + search0) / 2.0);
    
    // start of the second pass: binary search
    for (int i = 0; i < steps; i++) { 
        // second pass
        // the aim is to search more precisely where is the intersection point
        // in fact we could have missed a fragment during the first pass
        // or we could have found a false-positive intersection
        currFrag = mix(startSS.xy, endSS.xy, currSearch);
        uv.xy = currFrag / texSize;

        depthFromDepthBuffer = (texture2D(depthSampler, uv).r);
        // depthFromDepthBuffer = (view * texture2D(positionSampler, uv.xy)).z; // equivalent to the previous line

        rayDepth = (startVS.z * endVS.z) / mix(endVS.z, startVS.z, currSearch);
        deltaDepth = rayDepth - depthFromDepthBuffer;
        #ifdef RIGHT_HANDED_SCENE
            deltaDepth *= -1.0;
        #endif

        if (deltaDepth > 0.0 && deltaDepth < maxTol ) {
            if (deltaDepth < thickness) {
                hit1 = 1.0;
            }
            search1 = currSearch;
            currSearch = ((search1 + search0) / 2.0);
        } else {
            search0 = currSearch;
            currSearch = ((search1 + search0) / 2.0);
        }
    }       
    // end of the second pass
      
    // compute how much the reflection is visible
    if (hit1 == 0.0){
        #if defined(BACKUP_TEXTURE)
            info.visibilityBackup = 1.0;
        #endif

    } else {
        info.miss = false;
        vec3 normalInUV = normalize(texture2D(normalSampler, uv).xyz);
        if (dot(normalize(dirVS), normalInUV) > 0.0){
            info.visibility = 0.0; // hit backface of a mesh
        } else {
            vec2 nextPixelOffset = increment * resolution;
            vec2 dCoordScreen = smoothstep(vec2(0.2), vec2(0.6), abs(vec2(0.5, 0.5) - uv)); // HermiteInterpolation
            info.visibility = texture2D(textureSampler, uv).a // alpha value of the reflected scene position 
        
                // reduce back face limit artifacts (false positive intersections)
                * clamp(dot(normalInUV, normalize( texture2D(normalSampler, (currFrag + nextPixelOffset)/texSize).xyz)), 0.0, 1.0)
                * clamp(dot(normalInUV, normalize( texture2D(normalSampler, (currFrag - nextPixelOffset)/texSize).xyz)), 0.0, 1.0)
                * clamp(dot(normalInUV, normalize( texture2D(normalSampler, (currFrag + nextPixelOffset.yx)/texSize).xyz)), 0.0, 1.0)
                * clamp(dot(normalInUV, normalize( texture2D(normalSampler, (currFrag - nextPixelOffset.yx)/texSize).xyz)), 0.0, 1.0)
                
                * (1.0 - max (dot(-normalize(hitCoordVS), normalize(dirVS)), 0.0)) // to fade out the reflection as the reflected direction point to the camera's position (hit behind the camera)
                * (1.0 - currSearch) // the reflection should be sharper when near from the starting point
                * (1.0 - clamp (abs(hitCoordVS.z / distanceFade), 0.0, 1.0)) // to fade out the reflection near the distanceFade
                * (1.0 - clamp (deltaDepth/thickness, 0.0, 1.0)) // since the hit point is not always precisely found, we fade out the reflected color if we aren't precise enough 
                * clamp(1.0 - (dCoordScreen.x + dCoordScreen.y), 0.0, 1.0); // to fade out the reflection near the edge of the screen
        }

        #if defined(BACKUP_TEXTURE)
            info.visibilityBackup = 1.0 - info.visibility; // complementary reflectivityColor
        #endif
        info.coords = uv;
    }

    return info;
}
#endif // SSR_SUPPORTED

void main(void)
{
    #ifdef SSR_SUPPORTED

    // *************** Get data from samplers ***************

    vec4 original = texture2D(textureSampler, vUV);
    vec4 spec = (texture2D(reflectivitySampler, vUV));
    
    if (dot(spec.xyz, vec3(1.0)) <= 0.0){ // TODO ? 0.04 * 3.0
        gl_FragColor = original; // no reflectivity, no need to compute reflection
        return;
    }

    float roughness = 1.0 - spec.a;

    // Get coordinates of the direction of the reflected ray
    // according to the pixel's position and normal.
    vec3 unitNormal = normalize((texture2D(normalSampler, vUV)).xyz);
    vec3 position = (view * texture2D(positionSampler, vUV)).xyz;

    vec3 unitPosition = normalize(position);
    vec3 reflected = normalize(reflect(unitPosition, unitNormal)); // incident direction = unit position in camera space

    // *************** Compute reflection info  ***************
    ReflectionInfo info;

    // hash(position) represents a random vector3, jitt represents a bias to simulate roughness (light deviation)
    vec3 jitt = mix(vec3(0.0), hash(texture2D(positionSampler, vUV).xyz), roughness) * roughnessFactor;

    #ifdef RIGHT_HANDED_SCENE
    if (position.z < -distanceFade || distanceFade == 0.0) // no need to compute reflection, the point we are evaluating is further than the distanceFade
    #else // if left handed scene
    if (position.z > distanceFade || distanceFade == 0.0)
    #endif 
    {       
    #if defined(BACKUP_TEXTURE)
        info.coords = vUV;
        info.visibility = 0.0;
        info.miss = true;
        info.visibilityBackup = 1.0;
    #else
        gl_FragColor = original;
        return;
    #endif
    } else {
        vec2 texSize = vec2(textureSize(textureSampler, 0));
        info = getReflectionInfo2DRayMarching(reflected + jitt, position, texSize);
    }

    // *************** Get reflection color ***************

    vec3 reflectedColor;
    
    #if defined(BACKUP_TEXTURE)
        if (dot(spec.xyz, vec3(1.0))/3.0 > maxReflectivityForSSRReflections) {
            info.visibility = 0.0;
            info.visibilityBackup = 1.0;
        }
        // compute reflection in view space and then come back to world space
        vec3 coord = vec3( inverse(view) * vec4(reflected, 0.0));

        #ifdef BACKUP_TEXTURE_IS_PROBE
            coord.y *= -1.0;
        #endif
            
        #ifdef RIGHT_HANDED_SCENE
            coord.z *= -1.0;
        #endif
        reflectedColor = textureCube(backUpSampler, coord + jitt).xyz * info.visibilityBackup;

        if (!info.miss){
            reflectedColor += texture2D(textureSampler, info.coords).xyz * info.visibility;
        }
    #else 
        if (dot(spec.xyz, vec3(1.0))/3.0 > maxReflectivityForSSRReflections) {
            info.visibility = 0.0;
            info.visibilityBackup = 0.0;
        }
        if (info.miss){
            gl_FragColor = original;
            return;
        } else {
            reflectedColor = texture2D(textureSampler, info.coords).xyz;
        }
    #endif 
    
    //  *********************** Shading *******************************

    // Fresnel
    // "The specular map contains F0 for dielectrics and the reflectance value for raw metal"
    vec3 F0 = spec.xyz;
  
    vec3 reflectionCoeff = fresnelSchlick(max(dot(unitNormal, -unitPosition), 0.0), F0) // https://lettier.github.io/3d-game-shaders-for-beginners/fresnel-factor.html
                            * (info.visibility + info.visibilityBackup); 
    reflectionCoeff = clamp(pow(reflectionCoeff * strength, vec3(falloffExponent)), 0.0, 1.0);

    // Render the final color
    // (no refraction) and (AbsorbtionCoeff + RefractionCoeff + ReflectionCoeff = 1)  => AbsorbtionCoeff = 1 - ReflectionCoeff
    gl_FragColor = vec4((original.xyz * (vec3(1.0) - reflectionCoeff)) + (reflectedColor * reflectionCoeff), original.a);

    #else // SSR not SUPPORTED
    gl_FragColor = original;
    #endif // SSR_SUPPORTED
}

#endif // BACK_COMPATIBILITY






