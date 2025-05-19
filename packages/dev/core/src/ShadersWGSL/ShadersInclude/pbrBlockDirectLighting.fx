var diffuseBase: vec3f = vec3f(0., 0., 0.);
#ifdef SS_TRANSLUCENCY
    var diffuseTransmissionBase: vec3f = vec3f(0., 0., 0.);
#endif
#ifdef SPECULARTERM
    var specularBase: vec3f = vec3f(0., 0., 0.);
#endif
#ifdef CLEARCOAT
    var clearCoatBase: vec3f = vec3f(0., 0., 0.);
#endif
#ifdef SHEEN
    var sheenBase: vec3f = vec3f(0., 0., 0.);
#endif

#if defined(SPECULARTERM) && defined(LIGHT0)
    var coloredFresnel: vec3f = vec3f(0., 0., 0.);
#endif
// Direct Lighting Variables
var preInfo: preLightingInfo;
var info: lightingInfo;
var shadow: f32 = 1.; // 1 - shadowLevel
var aggShadow: f32 = 0.;
var numLights: f32 = 0.;

#if defined(CLEARCOAT) && defined(CLEARCOAT_TINT)
    var absorption: vec3f = vec3f(0.);
#endif
