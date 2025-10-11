// This code reads uniforms and samples textures to fill up the base and specular
// layer properties for OpenPBR
#ifdef THIN_FILM
// Thin Film Layer Properties
var thin_film_weight: f32 = uniforms.vThinFilmWeight;
var thin_film_thickness: f32 = uniforms.vThinFilmThickness.r * 1000.0f; // Convert from microns to nanometers
var thin_film_ior: f32 = uniforms.vThinFilmIor;
#ifdef THIN_FILM_WEIGHT
    var thinFilmWeightFromTexture: f32 = textureSample(thinFilmWeightSampler, thinFilmWeightSamplerSampler, fragmentInputs.vThinFilmWeightUV + uvOffset).r * uniforms.vThinFilmWeightInfos.y;
#endif
#ifdef THIN_FILM_THICKNESS
    var thinFilmThicknessFromTexture: f32 = textureSample(thinFilmThicknessSampler, thinFilmThicknessSamplerSampler, fragmentInputs.vThinFilmThicknessUV + uvOffset).g * uniforms.vThinFilmThicknessInfos.y;
#endif
#ifdef THIN_FILM_WEIGHT
    thin_film_weight *= thinFilmWeightFromTexture;
#endif
#ifdef THIN_FILM_THICKNESS
    thin_film_thickness *= thinFilmThicknessFromTexture;
#endif
#endif