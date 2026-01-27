// This code reads uniforms and samples textures to fill up the base and specular
// layer properties for OpenPBR
#ifdef THIN_FILM
// Thin Film Layer Properties
float thin_film_weight = vThinFilmWeight;
float thin_film_thickness = vThinFilmThickness.r * 1000.0; // Convert from microns to nanometers
float thin_film_ior = vThinFilmIor;
#ifdef THIN_FILM_WEIGHT
    float thinFilmWeightFromTexture = texture2D(thinFilmWeightSampler, vThinFilmWeightUV + uvOffset).r * vThinFilmWeightInfos.y;
#endif
#ifdef THIN_FILM_THICKNESS
    float thinFilmThicknessFromTexture = texture2D(thinFilmThicknessSampler, vThinFilmThicknessUV + uvOffset).g * vThinFilmThicknessInfos.y;
#endif
#ifdef THIN_FILM_WEIGHT
    thin_film_weight *= thinFilmWeightFromTexture;
#endif
#ifdef THIN_FILM_THICKNESS
    thin_film_thickness *= thinFilmThicknessFromTexture;
#endif
// Scalar used to scale the thin film effect based on how different the IOR is from 1.0 (no thin film effect)
float thin_film_ior_scale = clamp(2.0f * abs(thin_film_ior - 1.0f), 0.0f, 1.0f);
#endif