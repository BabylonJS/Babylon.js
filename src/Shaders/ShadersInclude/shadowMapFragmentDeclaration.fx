#if SM_FLOAT == 0
	#include<packingFunctions>
#endif

#if SM_SOFTTRANSPARENTSHADOW == 1
	#include<bayerDitherFunctions>

    uniform float softTransparentShadowSM;
#endif

varying float vDepthMetricSM;

#if SM_USEDISTANCE == 1
    uniform vec3 lightDataSM;
    varying vec3 vPositionWSM;
#endif

uniform vec3 biasAndScaleSM;
uniform vec2 depthValuesSM;

#if defined(SM_DEPTHCLAMP) &&  SM_DEPTHCLAMP == 1
    varying float zSM;
#endif
