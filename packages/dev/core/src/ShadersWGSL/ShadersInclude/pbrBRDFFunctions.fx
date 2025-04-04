// Constants
#define FRESNEL_MAXIMUM_ON_ROUGH 0.25

// ______________________________________________________________________
//
//                              BRDF LOOKUP
// ______________________________________________________________________

#ifdef MS_BRDF_ENERGY_CONSERVATION
    // http://www.jcgt.org/published/0008/01/03/
    // http://advances.realtimerendering.com/s2018/Siggraph%202018%20HDRP%20talk_with%20notes.pdf
    fn getEnergyConservationFactor(specularEnvironmentR0: vec3f, environmentBrdf: vec3f) -> vec3f {
        return 1.0 + specularEnvironmentR0 * (1.0 / environmentBrdf.y - 1.0);
    }
#endif

#ifdef ENVIRONMENTBRDF
    fn getBRDFLookup(NdotV: f32, perceptualRoughness: f32) -> vec3f {
        // Indexed on cos(theta) and roughness
        var UV: vec2f =  vec2f(NdotV, perceptualRoughness);
        
        // We can find the scale and offset to apply to the specular value.
        var brdfLookup: vec4f =  textureSample(environmentBrdfSampler, environmentBrdfSamplerSampler, UV);

        #ifdef ENVIRONMENTBRDF_RGBD
            brdfLookup = vec4f(fromRGBD(brdfLookup.rgba), brdfLookup.a);
        #endif

        return brdfLookup.rgb;
    }

    fn getReflectanceFromBRDFWithEnvLookup(specularEnvironmentR0: vec3f, specularEnvironmentR90: vec3f, ior: f32, environmentBrdf: vec3f) -> vec3f {
        #ifdef BRDF_V_HEIGHT_CORRELATED
            #ifdef METALLICWORKFLOW
                // Scale the reflectance by the IOR for values less than 1.5
                var reflectance: vec3f = (specularEnvironmentR90 - specularEnvironmentR0) * clamp(environmentBrdf.x * 2.0 * (ior - 1.0), 0.0, 1.0) + specularEnvironmentR0 * environmentBrdf.y;
            #else
                var reflectance: vec3f = (specularEnvironmentR90 - specularEnvironmentR0) * environmentBrdf.x + specularEnvironmentR0 * environmentBrdf.y;
            #endif
            // Simplification if F90 = 1 var reflectance: vec3f = (specularEnvironmentR90 - specularEnvironmentR0) * environmentBrdf.xxx + specularEnvironmentR0 * environmentBrdf.yyy;
        #else
            var reflectance: vec3f = specularEnvironmentR0 * environmentBrdf.x + specularEnvironmentR90 * environmentBrdf.y;
        #endif
        return reflectance;
    }

    fn getReflectanceFromBRDFLookup(specularEnvironmentR0: vec3f, environmentBrdf: vec3f) -> vec3f {
        #ifdef BRDF_V_HEIGHT_CORRELATED
            var reflectance: vec3f = mix(environmentBrdf.xxx, environmentBrdf.yyy, specularEnvironmentR0);
        #else
            var reflectance: vec3f = specularEnvironmentR0 * environmentBrdf.x + environmentBrdf.y;
        #endif
        return reflectance;
    }
#endif

/* NOT USED
#if defined(SHEEN) && defined(SHEEN_SOFTER)
// Approximation of (integral on hemisphere)[f_sheen*cos(theta)*dtheta*dphi]
fn getBRDFLookupCharlieSheen(NdotV: f32, perceptualRoughness: f32) -> f32
{
    var c: f32 = 1.0 - NdotV;
    var c3: f32 = c*c*c;
    return 0.65584461 * c3 + 1.0 / (4.16526551 + exp(-7.97291361*perceptualRoughness+6.33516894));
}
#endif
*/

#if !defined(ENVIRONMENTBRDF) || defined(REFLECTIONMAP_SKYBOX) || defined(ALPHAFRESNEL)
    fn getReflectanceFromAnalyticalBRDFLookup_Jones(VdotN: f32, reflectance0: vec3f, reflectance90: vec3f, smoothness: f32) -> vec3f
    {
        // Schlick fresnel approximation, extended with basic smoothness term so that rough surfaces do not approach reflectance90 at grazing angle
        var weight: f32 = mix(FRESNEL_MAXIMUM_ON_ROUGH, 1.0, smoothness);
        return reflectance0 + weight * (reflectance90 - reflectance0) * pow5(saturate(1.0 - VdotN));
    }
#endif

#if defined(SHEEN) && defined(ENVIRONMENTBRDF)
    /**
     * The sheen BRDF not containing F can be easily stored in the blue channel of the BRDF texture.
     * The blue channel contains DCharlie * VAshikhmin * NdotL as a lokkup table
     */
    fn getSheenReflectanceFromBRDFLookup(reflectance0: vec3f, environmentBrdf: vec3f) -> vec3f {
        var sheenEnvironmentReflectance: vec3f = reflectance0 * environmentBrdf.b;
        return sheenEnvironmentReflectance;
    }
#endif

// ______________________________________________________________________
//
//                              Schlick/Fresnel
// ______________________________________________________________________

// iorI incident iorT transmitted

// Schlick's approximation for R0 (Fresnel Reflectance Values)
// Keep for references

// fn getR0fromIORs(iorT: vec3f, iorI: vec3f) -> vec3f { 
//     var t: vec3f = (iorT - iorI) / (iorT + iorI);
//     return t * t;
// }

// fn getR0fromAirToSurfaceIORT(iorT: vec3f) -> vec3f {
//     return getR0fromIOR(iorT,  vec3f(1.0));
// }

// fn getIORTfromAirToSurfaceR0(f0: vec3f) -> vec3f {
//     var s: vec3f = sqrt(f0);
//     return (1.0 + s) / (1.0 - s);
// }

// f0 Remapping due to layers
// fn getR0RemappedForClearCoat(f0: vec3f, clearCoatF0: vec3f) -> vec3f {
//     var iorBase: vec3f = getIORfromAirToSurfaceR0(f0);
//     var clearCoatIor: vec3f = getIORfromAirToSurfaceR0(clearCoatF0);
//     return getR0fromIOR(iorBase, clearCoatIor);
// }

fn fresnelSchlickGGXVec3(VdotH: f32, reflectance0: vec3f, reflectance90: vec3f) -> vec3f
{
    return reflectance0 + (reflectance90 - reflectance0) * pow5(1.0 - VdotH);
}

fn fresnelSchlickGGX(VdotH: f32, reflectance0: f32, reflectance90: f32) -> f32
{
    return reflectance0 + (reflectance90 - reflectance0) * pow5(1.0 - VdotH);
}

#ifdef CLEARCOAT
    // Knowing ior clear coat is fix for the material
    // Solving iorbase = 1 + sqrt(fo) / (1 - sqrt(fo)) and f0base = square((iorbase - iorclearcoat) / (iorbase + iorclearcoat))
    // provide f0base = square(A + B * sqrt(fo)) / (B + A * sqrt(fo))
    // where A = 1 - iorclearcoat
    // and   B = 1 + iorclearcoat
    fn getR0RemappedForClearCoat(f0: vec3f) -> vec3f {
        #ifdef CLEARCOAT_DEFAULTIOR
            #ifdef MOBILE
                return saturateVec3(f0 * (f0 * 0.526868 + 0.529324) - 0.0482256);
            #else
                return saturateVec3(f0 * (f0 * (0.941892 - 0.263008 * f0) + 0.346479) - 0.0285998);
            #endif
        #else
            var s: vec3f = sqrt(f0);
            var t: vec3f = (uniforms.vClearCoatRefractionParams.z + uniforms.vClearCoatRefractionParams.w * s) / (uniforms.vClearCoatRefractionParams.w + uniforms.vClearCoatRefractionParams.z * s);
            return squareVec3(t);
        #endif
    }
#endif

#ifdef IRIDESCENCE
// XYZ to sRGB color space
const XYZ_TO_REC709: mat3x3f =  mat3x3f(
     3.2404542, -0.9692660,  0.0556434,
    -1.5371385,  1.8760108, -0.2040259,
    -0.4985314,  0.0415560,  1.0572252
);

// Assume air interface for top
// Note: We don't handle the case fresnel0 == 1
fn getIORTfromAirToSurfaceR0(f0: vec3f) -> vec3f {
    var sqrtF0: vec3f = sqrt(f0);
    return (1. + sqrtF0) / (1. - sqrtF0);
}

// Conversion FO/IOR
fn getR0fromIORsVec3(iorT: vec3f, iorI: f32) -> vec3f {
    return squareVec3((iorT -  vec3f(iorI)) / (iorT +  vec3f(iorI)));
}

fn getR0fromIORs(iorT: f32, iorI: f32) -> f32 {
    return square((iorT - iorI) / (iorT + iorI));
}

// Fresnel equations for dielectric/dielectric interfaces.
// Ref: https://belcour.github.io/blog/research/publication/2017/05/01/brdf-thin-film.html
// Evaluation XYZ sensitivity curves in Fourier space
fn evalSensitivity(opd: f32, shift: vec3f) -> vec3f {
    var phase: f32 = 2.0 * PI * opd * 1.0e-9;

    const val: vec3f =  vec3f(5.4856e-13, 4.4201e-13, 5.2481e-13);
    const pos: vec3f =  vec3f(1.6810e+06, 1.7953e+06, 2.2084e+06);
    const vr: vec3f =  vec3f(4.3278e+09, 9.3046e+09, 6.6121e+09);

    var xyz: vec3f = val * sqrt(2.0 * PI * vr) * cos(pos * phase + shift) * exp(-square(phase) * vr);
    xyz.x += 9.7470e-14 * sqrt(2.0 * PI * 4.5282e+09) * cos(2.2399e+06 * phase + shift[0]) * exp(-4.5282e+09 * square(phase));
    xyz /= 1.0685e-7;

    var srgb: vec3f = XYZ_TO_REC709 * xyz;
    return srgb;
}

fn evalIridescence(outsideIOR: f32, eta2: f32, cosTheta1: f32, thinFilmThickness: f32, baseF0: vec3f) -> vec3f {
    var I: vec3f =  vec3f(1.0);

    // Force iridescenceIOR -> outsideIOR when thinFilmThickness -> 0.0
    var iridescenceIOR: f32 = mix(outsideIOR, eta2, smoothstep(0.0, 0.03, thinFilmThickness));
    // Evaluate the cosTheta on the base layer (Snell law)
    var sinTheta2Sq: f32 = square(outsideIOR / iridescenceIOR) * (1.0 - square(cosTheta1));

    // Handle TIR:
    var cosTheta2Sq: f32 = 1.0 - sinTheta2Sq;
    if (cosTheta2Sq < 0.0) {
        return I;
    }

    var cosTheta2: f32 = sqrt(cosTheta2Sq);

    // First interface
    var R0: f32 = getR0fromIORs(iridescenceIOR, outsideIOR);
    var R12: f32 = fresnelSchlickGGX(cosTheta1, R0, 1.);
    var R21: f32 = R12;
    var T121: f32 = 1.0 - R12;
    var phi12: f32 = 0.0;
    if (iridescenceIOR < outsideIOR) {
        phi12 = PI;
    }
    var phi21: f32 = PI - phi12;

    // Second interface
    var baseIOR: vec3f = getIORTfromAirToSurfaceR0(clamp(baseF0, vec3f(0.0), vec3f(0.9999))); // guard against 1.0
    var R1: vec3f = getR0fromIORsVec3(baseIOR, iridescenceIOR);
    var R23: vec3f = fresnelSchlickGGXVec3(cosTheta2, R1,  vec3f(1.));
    var phi23: vec3f =  vec3f(0.0);
    if (baseIOR[0] < iridescenceIOR) {
        phi23[0] = PI;
    }
    if (baseIOR[1] < iridescenceIOR) {
        phi23[1] = PI;
    }
    if (baseIOR[2] < iridescenceIOR) {
        phi23[2] = PI;
    }

    // Phase shift
    var opd: f32 = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
    var phi: vec3f =  vec3f(phi21) + phi23;

    // Compound terms
    var R123: vec3f = clamp(R12 * R23, vec3f(1e-5), vec3f(0.9999));
    var r123: vec3f = sqrt(R123);
    var Rs: vec3f = (T121 * T121) * R23 / ( vec3f(1.0) - R123);

    // Reflectance term for m = 0 (DC term amplitude)
    var C0: vec3f = R12 + Rs;
    I = C0;

    // Reflectance term for m > 0 (pairs of diracs)
    var Cm: vec3f = Rs - T121;
    for (var m: i32 = 1; m <= 2; m++)
    {
        Cm *= r123;
        var Sm: vec3f = 2.0 * evalSensitivity( f32(m) * opd,  f32(m) * phi);
        I += Cm * Sm;
    }

    // Since out of gamut colors might be produced, negative color values are clamped to 0.
    return max(I,  vec3f(0.0));
}
#endif

// ______________________________________________________________________
//
//                              Distribution
// ______________________________________________________________________

// Trowbridge-Reitz (GGX)
// Generalised Trowbridge-Reitz with gamma power=2.0
fn normalDistributionFunction_TrowbridgeReitzGGX(NdotH: f32, alphaG: f32) -> f32
{
    // Note: alphaG is average slope (gradient) of the normals in slope-space.
    // It is also the (trigonometric) tangent of the median distribution value, i.e. 50% of normals have
    // a tangent (gradient) closer to the macrosurface than this slope.
    var a2: f32 = alphaG * alphaG;
    var d: f32 = NdotH * NdotH * (a2 - 1.0) + 1.0;
    return a2 / (PI * d * d);
}

#ifdef SHEEN
    // http://www.aconty.com/pdf/s2017_pbs_imageworks_sheen.pdf
    // https://knarkowicz.wordpress.com/2018/01/04/cloth-shading/
    fn normalDistributionFunction_CharlieSheen(NdotH: f32, alphaG: f32) -> f32
    {
        var invR: f32 = 1. / alphaG;
        var cos2h: f32 = NdotH * NdotH;
        var sin2h: f32 = 1. - cos2h;
        return (2. + invR) * pow(sin2h, invR * .5) / (2. * PI);
    }
#endif

#ifdef ANISOTROPIC
    // GGX Distribution Anisotropic
    // https://blog.selfshadow.com/publications/s2012-shading-course/burley/s2012_pbs_disney_brdf_notes_v3.pdf Addenda
    fn normalDistributionFunction_BurleyGGX_Anisotropic(NdotH: f32, TdotH: f32, BdotH: f32, alphaTB: vec2f) -> f32 {
        var a2: f32 = alphaTB.x * alphaTB.y;
        var v: vec3f =  vec3f(alphaTB.y * TdotH, alphaTB.x  * BdotH, a2 * NdotH);
        var v2: f32 = dot(v, v);
        var w2: f32 = a2 / v2;
        return a2 * w2 * w2 * RECIPROCAL_PI;
    }
#endif

// ______________________________________________________________________
//
//                              Visibility/Geometry
// ______________________________________________________________________

#ifdef BRDF_V_HEIGHT_CORRELATED
    // GGX Mask/Shadowing Isotropic 
    // Heitz http://jcgt.org/published/0003/02/03/paper.pdf
    // https://twvideo01.ubm-us.net/o1/vault/gdc2017/Presentations/Hammon_Earl_PBR_Diffuse_Lighting.pdf
    fn smithVisibility_GGXCorrelated(NdotL: f32, NdotV: f32, alphaG: f32) -> f32 {
        #ifdef MOBILE
            // Appply simplification as all squared root terms are below 1 and squared
            var GGXV: f32 = NdotL * (NdotV * (1.0 - alphaG) + alphaG);
            var GGXL: f32 = NdotV * (NdotL * (1.0 - alphaG) + alphaG);
            return 0.5 / (GGXV + GGXL);
        #else
            var a2: f32 = alphaG * alphaG;
            var GGXV: f32 = NdotL * sqrt(NdotV * (NdotV - a2 * NdotV) + a2);
            var GGXL: f32 = NdotV * sqrt(NdotL * (NdotL - a2 * NdotL) + a2);
            return 0.5 / (GGXV + GGXL);
        #endif
    }
#else
    // From Microfacet Models for Refraction through Rough Surfaces, Walter et al. 2007
    // Keep for references
    // fn smithVisibilityG1_TrowbridgeReitzGGX(dot: f32, alphaG: f32) -> f32
    // {
    //     var tanSquared: f32 = (1.0 - dot * dot) / (dot * dot);
    //     return 2.0 / (1.0 + sqrt(1.0 + alphaG * alphaG * tanSquared));
    // }

    // fn smithVisibility_TrowbridgeReitzGGX_Walter(NdotL: f32, NdotV: f32, alphaG: f32) -> f32
    // {
    //     var visibility: f32 = smithVisibilityG1_TrowbridgeReitzGGX(NdotL, alphaG) * smithVisibilityG1_TrowbridgeReitzGGX(NdotV, alphaG);
    //     visibility /= (4.0 * NdotL * NdotV); // Cook Torance Denominator  integrated in visibility to avoid issues when visibility function changes.
    //     return visibility;
    // }

    // From smithVisibilityG1_TrowbridgeReitzGGX * dot / dot to cancel the cook
    // torrance denominator :-)
    fn smithVisibilityG1_TrowbridgeReitzGGXFast(dot: f32, alphaG: f32) -> f32
    {
        #ifdef MOBILE
            // Appply simplification as all squared root terms are below 1 and squared
            return 1.0 / (dot + alphaG + (1.0 - alphaG) * dot ));
        #else
            var alphaSquared: f32 = alphaG * alphaG;
            return 1.0 / (dot + sqrt(alphaSquared + (1.0 - alphaSquared) * dot * dot));
        #endif
    }

    fn smithVisibility_TrowbridgeReitzGGXFast(NdotL: f32, NdotV: f32, alphaG: f32) -> f32
    {
        var visibility: f32 = smithVisibilityG1_TrowbridgeReitzGGXFast(NdotL, alphaG) * smithVisibilityG1_TrowbridgeReitzGGXFast(NdotV, alphaG);
        // No Cook Torance Denominator as it is canceled out in the previous form
        return visibility;
    }
#endif

#ifdef ANISOTROPIC
    // GGX Mask/Shadowing Anisotropic 
    // Heitz http://jcgt.org/published/0003/02/03/paper.pdf
    fn smithVisibility_GGXCorrelated_Anisotropic(NdotL: f32, NdotV: f32, TdotV: f32, BdotV: f32, TdotL: f32, BdotL: f32, alphaTB: vec2f) -> f32 {
        var lambdaV: f32 = NdotL * length( vec3f(alphaTB.x * TdotV, alphaTB.y * BdotV, NdotV));
        var lambdaL: f32 = NdotV * length( vec3f(alphaTB.x * TdotL, alphaTB.y * BdotL, NdotL));
        var v: f32 = 0.5 / (lambdaV + lambdaL);
        return v;
    }
#endif

#ifdef CLEARCOAT
    fn visibility_Kelemen(VdotH: f32) -> f32 {
        // Simplified form integration the cook torrance denminator.
        // Expanded is nl * nv / vh2 which factor with 1 / (4 * nl * nv)
        // giving 1 / (4 * vh2))
        return 0.25 / (VdotH * VdotH); 
    }
#endif

#ifdef SHEEN
    // https://knarkowicz.wordpress.com/2018/01/04/cloth-shading/
    // https://blog.selfshadow.com/publications/s2017-shading-course/imageworks/s2017_pbs_imageworks_sheen.pdf
    // http://www.cs.utah.edu/~premoze/dbrdf/dBRDF.pdf
    fn visibility_Ashikhmin(NdotL: f32, NdotV: f32) -> f32
    {
        return 1. / (4. * (NdotL + NdotV - NdotL * NdotV));
    }

    /* NOT USED
    #ifdef SHEEN_SOFTER
        // http://www.aconty.com/pdf/s2017_pbs_imageworks_sheen.pdf
        fn l(x: f32, alphaG: f32) -> f32
        {
            var oneMinusAlphaSq: f32 = (1.0 - alphaG) * (1.0 - alphaG);
            var a: f32 = mix(21.5473, 25.3245, oneMinusAlphaSq);
            var b: f32 = mix(3.82987, 3.32435, oneMinusAlphaSq);
            var c: f32 = mix(0.19823, 0.16801, oneMinusAlphaSq);
            var d: f32 = mix(-1.97760, -1.27393, oneMinusAlphaSq);
            var e: f32 = mix(-4.32054, -4.85967, oneMinusAlphaSq);
            return a / (1.0 + b * pow(x, c)) + d * x + e;
        }

        fn lambdaSheen(cosTheta: f32, alphaG: f32) -> f32
        {
            return abs(cosTheta) < 0.5 ? exp(l(cosTheta, alphaG)) : exp(2.0 * l(0.5, alphaG) - l(1.0 - cosTheta, alphaG));
        }

        fn visibility_CharlieSheen(NdotL: f32, NdotV: f32, alphaG: f32) -> f32
        {
            var G: f32 = 1.0 / (1.0 + lambdaSheen(NdotV, alphaG) + lambdaSheen(NdotL, alphaG));
            return G / (4.0 * NdotV * NdotL);
        }
    #endif
    */
#endif

// ______________________________________________________________________
//
//                              DiffuseBRDF
// ______________________________________________________________________

// Disney diffuse term
// https://blog.selfshadow.com/publications/s2012-shading-course/burley/s2012_pbs_disney_brdf_notes_v3.pdf
// Page 14
fn diffuseBRDF_Burley(NdotL: f32, NdotV: f32, VdotH: f32, roughness: f32) -> f32 {
    // Diffuse fresnel falloff as per Disney principled BRDF, and in the spirit of
    // of general coupled diffuse/specular models e.g. Ashikhmin Shirley.
    var diffuseFresnelNV: f32 = pow5(saturateEps(1.0 - NdotL));
    var diffuseFresnelNL: f32 = pow5(saturateEps(1.0 - NdotV));
    var diffuseFresnel90: f32 = 0.5 + 2.0 * VdotH * VdotH * roughness;
    var fresnel: f32 =
        (1.0 + (diffuseFresnel90 - 1.0) * diffuseFresnelNL) *
        (1.0 + (diffuseFresnel90 - 1.0) * diffuseFresnelNV);

    return fresnel / PI;
}

#ifdef SS_TRANSLUCENCY
    // Pixar diffusion profile
    // http://graphics.pixar.com/library/ApproxBSSRDF/paper.pdf
    fn transmittanceBRDF_Burley(tintColor: vec3f, diffusionDistance: vec3f, thickness: f32) -> vec3f {
        var S: vec3f = 1. / maxEpsVec3(diffusionDistance);
        var temp: vec3f = exp((-0.333333333 * thickness) * S);
        return tintColor.rgb * 0.25 * (temp * temp * temp + 3.0 * temp);
    }

    // Extends the dark area to prevent seams
    // Keep it energy conserving by using McCauley solution: https://blog.selfshadow.com/2011/12/31/righting-wrap-part-1/
    fn computeWrappedDiffuseNdotL(NdotL: f32, w: f32) -> f32 {
        var t: f32 = 1.0 + w;
        var invt2: f32 = 1.0 / (t * t);
        return saturate((NdotL + w) * invt2);
    }
#endif
