vec4 colorGrades(vec4 color) 
{    
    // Dynamic runtime calculations (dependent on input color)
    float sliceContinuous = color.z * vCameraColorGradingInfos.z;
    float sliceInteger = floor(sliceContinuous);

    // Note: this is mathematically equivalent to fract(sliceContinuous); but we use explicit subtract
    // rather than separate fract() for correct results near slice boundaries (matching sliceInteger choice)
    float sliceFraction = sliceContinuous - sliceInteger; 

    // Calculate UV offset from slice origin (top-left)
    vec2 sliceUV = color.xy * vCameraColorGradingScaleOffset.xy + vCameraColorGradingScaleOffset.zw;

    // Calculate UV positions into overall texture for neighbouring slices 
    // (to emulate trilinear filtering on missing 3D hardware texture support)
    sliceUV.x += sliceInteger * vCameraColorGradingInfos.w;
    vec4 slice0Color = texture2D(cameraColorGrading2DSampler, sliceUV);

    sliceUV.x += vCameraColorGradingInfos.w;
    vec4 slice1Color = texture2D(cameraColorGrading2DSampler, sliceUV);

    vec3 result = mix(slice0Color.rgb, slice1Color.rgb, sliceFraction);
    color.rgb = mix(color.rgb, result, vCameraColorGradingInfos.x);

    return color;
}