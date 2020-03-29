#if SM_FLOAT == 0
	#include<packingFunctions>
#endif

varying float vDepthMetricSM;

#ifdef SM_USEDISTANCE == 1
    uniform vec3 lightDataSM;
    varying vec3 vPositionWSM;
#endif

uniform vec3 biasAndScaleSM;
uniform vec2 depthValuesSM;

#ifdef SM_DEPTHCLAMP == 1
    varying float zSM;
#endif
