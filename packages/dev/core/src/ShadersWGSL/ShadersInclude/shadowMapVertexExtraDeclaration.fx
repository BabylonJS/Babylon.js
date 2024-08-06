#if SM_NORMALBIAS == 1
    uniform lightDataSM: vec3f;
#endif

uniform biasAndScaleSM: vec3f;
uniform depthValuesSM: vec2f;

varying vDepthMetricSM: f32;

#if SM_USEDISTANCE == 1
    varying vPositionWSM: vec3f;
#endif

#if defined(SM_DEPTHCLAMP) &&  SM_DEPTHCLAMP == 1
    varying zSM: f32;
#endif
