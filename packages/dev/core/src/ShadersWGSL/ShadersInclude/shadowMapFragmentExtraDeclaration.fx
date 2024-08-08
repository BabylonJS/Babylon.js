#if SM_FLOAT == 0
	#include<packingFunctions>
#endif

#if SM_SOFTTRANSPARENTSHADOW == 1
	#include<bayerDitherFunctions>

    uniform softTransparentShadowSM: vec2f;
#endif

varying vDepthMetricSM: f32;

#if SM_USEDISTANCE == 1
    uniform lightDataSM: vec3f;
    varying vPositionWSM: vec3f;
#endif

uniform biasAndScaleSM: vec3f;
uniform depthValuesSM: vec2f;

#if defined(SM_DEPTHCLAMP) &&  SM_DEPTHCLAMP == 1
    varying zSM: f32;
#endif
