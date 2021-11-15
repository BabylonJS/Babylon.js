uniform vec3 cameraPosition;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUV;
varying vec3 vTangent;
varying vec3 vBinormal;
varying vec4 vExtra1;
varying vec4 vExtra2;

uniform float _Radius_;
uniform float _Line_Width_;
uniform bool _Absolute_Sizes_;
uniform float _Filter_Width_;
uniform vec4 _Base_Color_;
uniform vec4 _Line_Color_;
uniform float _Radius_Top_Left_;
uniform float _Radius_Top_Right_;
uniform float _Radius_Bottom_Left_;
uniform float _Radius_Bottom_Right_;
uniform float _Rate_;
uniform vec4 _Highlight_Color_;
uniform float _Highlight_Width_;
uniform vec4 _Highlight_Transform_;
uniform float _Highlight_;
//define IRIDESCENCE_ENABLE
uniform float _Iridescence_Intensity_;
uniform float _Iridescence_Edge_Intensity_;
uniform vec4 _Iridescence_Tint_;
uniform sampler2D _Iridescent_Map_;
uniform float _Angle_;
uniform bool _Reflected_;
uniform float _Frequency_;
uniform float _Vertical_Offset_;
uniform vec4 _Gradient_Color_;
uniform vec4 _Top_Left_;
uniform vec4 _Top_Right_;
uniform vec4 _Bottom_Left_;
uniform vec4 _Bottom_Right_;
//define EDGE_ONLY
uniform float _Edge_Width_;
uniform float _Edge_Power_;
uniform float _Line_Gradient_Blend_;
uniform float _Fade_Out_;
//define SMOOTH_EDGES


//BLOCK_BEGIN FastLinearTosRGB 353

void FastLinearTosRGB_B353(
    vec4 Linear,
    out vec4 sRGB)
{
    sRGB.rgb = sqrt(clamp(Linear.rgb, 0.0, 1.0));
    sRGB.a = Linear.a;
    
}
//BLOCK_END FastLinearTosRGB

//BLOCK_BEGIN Round_Rect_Fragment 332

void Round_Rect_Fragment_B332(
    float Radius,
    float Line_Width,
    vec4 Line_Color,
    float Filter_Width,
    vec2 UV,
    float Line_Visibility,
    vec4 Rect_Parms,
    vec4 Fill_Color,
    out vec4 Color)
{
    float d = length(max(abs(UV)-Rect_Parms.xy,0.0));
    float dx = max(fwidth(d)*Filter_Width,0.00001);
    
    //float Inside_Rect = clamp((Radius-d)/dx, 0.0, 1.0);
    float g = min(Rect_Parms.z,Rect_Parms.w);
    float dgrad = max(fwidth(g)*Filter_Width,0.00001);
    float Inside_Rect = clamp(g/dgrad, 0.0, 1.0);
    
    //this is arguably more correct...
    //float inner = clamp((d+dx*0.5-max(Rect_Parms.z,d-dx*0.5))/dx, 0.0, 1.0);
    float inner = clamp((d+dx*0.5-max(Radius-Line_Width,d-dx*0.5))/dx, 0.0, 1.0);
    
    Color = clamp(mix(Fill_Color, Line_Color, inner), 0.0, 1.0)*Inside_Rect;
    //but this saves 3 ops
    //float inner = clamp((Rect_Parms.z-d)/dx, 0.0, 1.0);
    //Color = mix(Line_Color*Line_Visibility, Fill_Color, inner)*Inside_Rect;
}
//BLOCK_END Round_Rect_Fragment

//BLOCK_BEGIN Iridescence 343

void Iridescence_B343(
    vec3 Position,
    vec3 Normal,
    vec2 UV,
    vec3 Axis,
    vec3 Eye,
    vec4 Tint,
    sampler2D Texture,
    bool Reflected,
    float Frequency,
    float Vertical_Offset,
    out vec4 Color)
{
    
    vec3 i = normalize(Position-Eye);
    vec3 r = reflect(i,Normal);
    float idota = dot(i,Axis);
    float idotr = dot(i,r);
    
    float x = Reflected ? idotr : idota;
    
    vec2 xy;
    xy.x = fract((x*Frequency+1.0)*0.5 + UV.y*Vertical_Offset);
    xy.y = 0.5;
    
    Color = texture(Texture,xy);
    Color.rgb*=Tint.rgb;
}
//BLOCK_END Iridescence

//BLOCK_BEGIN Scale_RGB 346

void Scale_RGB_B346(
    vec4 Color,
    float Scalar,
    out vec4 Result)
{
    Result = vec4(Scalar,Scalar,Scalar,1) * Color;
}
//BLOCK_END Scale_RGB

//BLOCK_BEGIN Scale_RGB 344

void Scale_RGB_B344(
    float Scalar,
    vec4 Color,
    out vec4 Result)
{
    Result = vec4(Scalar,Scalar,Scalar,1) * Color;
}
//BLOCK_END Scale_RGB

//BLOCK_BEGIN Line_Fragment 362

void Line_Fragment_B362(
    vec4 Base_Color,
    vec4 Highlight_Color,
    float Highlight_Width,
    vec3 Line_Vertex,
    float Highlight,
    out vec4 Line_Color)
{
    float k2 = 1.0-clamp(abs(Line_Vertex.y/Highlight_Width), 0.0, 1.0);
    Line_Color = mix(Base_Color,Highlight_Color,Highlight*k2);
}
//BLOCK_END Line_Fragment

//BLOCK_BEGIN Edge 356

void Edge_B356(
    vec4 RectParms,
    float Radius,
    float Line_Width,
    vec2 UV,
    float Edge_Width,
    float Edge_Power,
    out float Result)
{
    float d = length(max(abs(UV)-RectParms.xy,0.0));
    float edge = 1.0-clamp((1.0-d/(Radius-Line_Width))/Edge_Width, 0.0, 1.0);
    Result = pow(edge, Edge_Power);
    
}
//BLOCK_END Edge

//BLOCK_BEGIN Gradient 355

void Gradient_B355(
    vec4 Gradient_Color,
    vec4 Top_Left,
    vec4 Top_Right,
    vec4 Bottom_Left,
    vec4 Bottom_Right,
    vec2 UV,
    out vec4 Result)
{
    vec3 top = Top_Left.rgb + (Top_Right.rgb - Top_Left.rgb)*UV.x;
    vec3 bottom = Bottom_Left.rgb + (Bottom_Right.rgb - Bottom_Left.rgb)*UV.x;
    
    Result.rgb = Gradient_Color.rgb * (bottom + (top - bottom)*UV.y);
    Result.a = 1.0;
    
    
}
//BLOCK_END Gradient


void main()
{
    // To_XYZW (#338)
    float X_Q338;
    float Y_Q338;
    float Z_Q338;
    float W_Q338;
    X_Q338=vExtra2.x;
    Y_Q338=vExtra2.y;
    Z_Q338=vExtra2.z;
    W_Q338=vExtra2.w;

    vec4 Color_Q343;
    #if IRIDESCENCE_ENABLE
      Iridescence_B343(vPosition,vNormal,vUV,vBinormal,cameraPosition,_Iridescence_Tint_,_Iridescent_Map_,_Reflected_,_Frequency_,_Vertical_Offset_,Color_Q343);
    #else
      Color_Q343 = vec4(0,0,0,0);
    #endif

    vec4 Result_Q344;
    Scale_RGB_B344(_Iridescence_Intensity_,Color_Q343,Result_Q344);

    vec4 Line_Color_Q362;
    Line_Fragment_B362(_Line_Color_,_Highlight_Color_,_Highlight_Width_,vTangent,_Highlight_,Line_Color_Q362);

    float Result_Q356;
    #if EDGE_ONLY
      Edge_B356(vExtra1,Z_Q338,W_Q338,vUV,_Edge_Width_,_Edge_Power_,Result_Q356);
    #else
      Result_Q356 = 1.0;
    #endif

    // From_XY (#339)
    vec2 Vec2_Q339 = vec2(X_Q338,Y_Q338);

    vec4 Result_Q355;
    Gradient_B355(_Gradient_Color_,_Top_Left_,_Top_Right_,_Bottom_Left_,_Bottom_Right_,Vec2_Q339,Result_Q355);

    // FastsRGBtoLinear (#348)
    vec4 Linear_Q348;
    Linear_Q348.rgb = clamp(Result_Q355.rgb*Result_Q355.rgb, 0.0, 1.0);
    Linear_Q348.a=Result_Q355.a;
    
    vec4 Result_Q346;
    Scale_RGB_B346(Linear_Q348,Result_Q356,Result_Q346);

    // Add_Colors (#345)
    vec4 Sum_Q345 = Result_Q346 + Result_Q344;

    // Mix_Colors (#347)
    vec4 Color_At_T_Q347 = mix(Line_Color_Q362, Result_Q346, _Line_Gradient_Blend_);

    // Add_Colors (#350)
    vec4 Base_And_Iridescent_Q350;
    Base_And_Iridescent_Q350 = _Base_Color_ + vec4(Sum_Q345.rgb,0.0);
    
    // Add_Scaled_Color (#349)
    vec4 Sum_Q349 = Color_At_T_Q347 + _Iridescence_Edge_Intensity_ * Color_Q343;

    // Set_Alpha (#351)
    vec4 Result_Q351 = Sum_Q349; Result_Q351.a = 1.0;

    vec4 Color_Q332;
    Round_Rect_Fragment_B332(Z_Q338,W_Q338,Result_Q351,_Filter_Width_,vUV,1.0,vExtra1,Base_And_Iridescent_Q350,Color_Q332);

    // Scale_Color (#354)
    vec4 Result_Q354 = _Fade_Out_ * Color_Q332;

    vec4 sRGB_Q353;
    FastLinearTosRGB_B353(Result_Q354,sRGB_Q353);

    vec4 Out_Color = sRGB_Q353;
    float Clip_Threshold = 0.001;
    bool To_sRGB = false;

    gl_FragColor = Out_Color;
}