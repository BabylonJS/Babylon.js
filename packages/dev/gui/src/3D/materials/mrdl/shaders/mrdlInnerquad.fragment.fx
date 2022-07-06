uniform vec3 cameraPosition;

varying vec2 vUV;
varying vec3 vTangent;

uniform vec4 _Color_;
uniform float _Radius_;
uniform bool _Fixed_Radius_;
uniform float _Filter_Width_;
uniform float _Glow_Fraction_;
uniform float _Glow_Max_;
uniform float _Glow_Falloff_;


//BLOCK_BEGIN Round_Rect 194

float FilterStep_Bid194(float edge, float x, float filterWidth)
{
   float dx = max(1.0E-5,fwidth(x)*filterWidth);
   return max((x+dx*0.5 - max(edge,x-dx*0.5))/dx,0.0);
}
void Round_Rect_B194(
    float Size_X,
    float Size_Y,
    float Radius,
    vec4 Rect_Color,
    float Filter_Width,
    vec2 UV,
    float Glow_Fraction,
    float Glow_Max,
    float Glow_Falloff,
    out vec4 Color)
{
    vec2 halfSize = vec2(Size_X,Size_Y)*0.5;
    vec2 r = max(min(vec2(Radius,Radius),halfSize),vec2(0.01,0.01));
    
    vec2 v = abs(UV);
    
    vec2 nearestp = min(v,halfSize-r);
    vec2 delta = (v-nearestp)/max(vec2(0.01,0.01),r);
    float Distance = length(delta);
    
    float insideRect = 1.0 - FilterStep_Bid194(1.0-Glow_Fraction,Distance,Filter_Width);
    
    float glow = clamp((1.0-Distance)/Glow_Fraction, 0.0, 1.0);
    glow = pow(glow, Glow_Falloff);
    Color = Rect_Color * max(insideRect, glow*Glow_Max);
}
//BLOCK_END Round_Rect


void main()
{
    // To_XYZ (#192)
    float X_Q192;
    float Y_Q192;
    float Z_Q192;
    X_Q192=vTangent.x;
    Y_Q192=vTangent.y;
    Z_Q192=vTangent.z;
    
    vec4 Color_Q194;
    Round_Rect_B194(X_Q192,1.0,Y_Q192,_Color_,_Filter_Width_,vUV,_Glow_Fraction_,_Glow_Max_,_Glow_Falloff_,Color_Q194);

    vec4 Out_Color = Color_Q194;
    float Clip_Threshold = 0.0;

    gl_FragColor = Out_Color;
}
