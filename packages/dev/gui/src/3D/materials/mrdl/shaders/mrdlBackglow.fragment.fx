uniform vec3 cameraPosition;

varying vec3 vNormal;
varying vec2 vUV;

uniform float _Bevel_Radius_;
uniform float _Line_Width_;
uniform bool _Absolute_Sizes_;
uniform float _Tuning_Motion_;
uniform float _Motion_;
uniform float _Max_Intensity_;
uniform float _Intensity_Fade_In_Exponent_;
uniform float _Outer_Fuzz_Start_;
uniform float _Outer_Fuzz_End_;
uniform vec4 _Color_;
uniform vec4 _Inner_Color_;
uniform float _Blend_Exponent_;
uniform float _Falloff_;
uniform float _Bias_;


//BLOCK_BEGIN Ease_Transition 45

float BiasFunc(float b, float v) {
  return pow(v,log(clamp(b,0.001,0.999))/log(0.5));
}
//BLOCK_END Ease_Transition

//BLOCK_BEGIN Fuzzy_Round_Rect 33

void Fuzzy_Round_Rect_B33(
    float Size_X,
    float Size_Y,
    float Radius_X,
    float Radius_Y,
    float Line_Width,
    vec2 UV,
    float Outer_Fuzz,
    float Max_Outer_Fuzz,
    out float Rect_Distance,
    out float Inner_Distance)
{
    vec2 halfSize = vec2(Size_X,Size_Y)*0.5;
    vec2 r = max(min(vec2(Radius_X,Radius_Y),halfSize),vec2(0.001,0.001));
    float radius = min(r.x,r.y)-Max_Outer_Fuzz;
    vec2 v = abs(UV);
    vec2 nearestp = min(v,halfSize-r);
    float d = distance(nearestp,v);
    Inner_Distance = clamp(1.0-(radius-d)/Line_Width, 0.0, 1.0);
    Rect_Distance = clamp(1.0-(d-radius)/Outer_Fuzz, 0.0, 1.0)*Inner_Distance;
}
//BLOCK_END Fuzzy_Round_Rect


void main()
{
    // To_XY (#42)
    float X_Q42;
    float Y_Q42;
    X_Q42=vNormal.x;
    Y_Q42=vNormal.y;

    // Max (#24)
    float MaxAB_Q24=max(_Tuning_Motion_,_Motion_);

    // Sqrt (#27)
    float Sqrt_F_Q27 = sqrt(MaxAB_Q24);

    // Power (#43)
    float Power_Q43 = pow(MaxAB_Q24, _Intensity_Fade_In_Exponent_);

    // Lerp (#26)
    float Value_At_T_Q26=mix(_Outer_Fuzz_Start_,_Outer_Fuzz_End_,Sqrt_F_Q27);

    // Multiply (#23)
    float Product_Q23 = _Max_Intensity_ * Power_Q43;

    float Rect_Distance_Q33;
    float Inner_Distance_Q33;
    Fuzzy_Round_Rect_B33(X_Q42,Y_Q42,_Bevel_Radius_,_Bevel_Radius_,_Line_Width_,vUV,Value_At_T_Q26,_Outer_Fuzz_Start_,Rect_Distance_Q33,Inner_Distance_Q33);

    // Power (#44)
    float Power_Q44 = pow(Inner_Distance_Q33, _Blend_Exponent_);

    // Ease_Transition (#45)
    float Result_Q45 = pow(BiasFunc(_Bias_,Rect_Distance_Q33),_Falloff_);

    // Mix_Colors (#25)
    vec4 Color_At_T_Q25 = mix(_Inner_Color_, _Color_, Power_Q44);

    // Multiply (#22)
    float Product_Q22 = Result_Q45 * Product_Q23;

    // Scale_Color (#28)
    vec4 Result_Q28 = Product_Q22 * Color_At_T_Q25;

    vec4 Out_Color = Result_Q28;
    float Clip_Threshold = 0.0;

    gl_FragColor = Out_Color;
}