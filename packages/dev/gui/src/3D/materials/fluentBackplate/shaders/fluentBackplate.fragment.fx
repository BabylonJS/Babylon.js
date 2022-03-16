uniform vec3 cameraPosition;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUV;
varying vec3 vTangent;
varying vec3 vBinormal;
varying vec4 vColor;
varying vec4 vExtra1;
varying vec4 vExtra2;
varying vec4 vExtra3;

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
//define BLOB_ENABLE
uniform vec3 _Blob_Position_;
uniform float _Blob_Intensity_;
uniform float _Blob_Near_Size_;
uniform float _Blob_Far_Size_;
uniform float _Blob_Near_Distance_;
uniform float _Blob_Far_Distance_;
uniform float _Blob_Fade_Length_;
uniform float _Blob_Pulse_;
uniform float _Blob_Fade_;
uniform sampler2D _Blob_Texture_;
//define BLOB_ENABLE_2
uniform vec3 _Blob_Position_2_;
uniform float _Blob_Near_Size_2_;
uniform float _Blob_Pulse_2_;
uniform float _Blob_Fade_2_;
uniform float _Rate_;
uniform vec4 _Highlight_Color_;
uniform float _Highlight_Width_;
uniform vec4 _Highlight_Transform_;
uniform float _Highlight_;
uniform float _Iridescence_Intensity_;
uniform float _Iridescence_Edge_Intensity_;
uniform float _Angle_;
uniform float _Fade_Out_;
//define SMOOTH_EDGES
uniform bool _Reflected_;
uniform float _Frequency_;
uniform float _Vertical_Offset_;
//define IRIDESCENT_MAP_ENABLE
uniform sampler2D _Iridescent_Map_;
uniform bool _Use_Global_Left_Index_;
uniform bool _Use_Global_Right_Index_;
uniform vec4 Global_Left_Index_Tip_Position;
uniform vec4 Global_Right_Index_Tip_Position;


//BLOCK_BEGIN Round_Rect_Fragment 31

void Round_Rect_Fragment_B31(
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

//BLOCK_BEGIN Blob_Fragment 71

void Blob_Fragment_B71(
    sampler2D Blob_Texture,
    vec4 Blob_Info1,
    vec4 Blob_Info2,
    out vec4 Blob_Color)
{
    float k1 = dot(Blob_Info1.xy,Blob_Info1.xy);
    float k2 = dot(Blob_Info2.xy,Blob_Info2.xy);
    vec3 closer = k1<k2 ? vec3(k1,Blob_Info1.z,Blob_Info1.w) : vec3(k2,Blob_Info2.z,Blob_Info2.w);
    Blob_Color = closer.z * texture(Blob_Texture,vec2(vec2(sqrt(closer.x),closer.y).x,1.0-vec2(sqrt(closer.x),closer.y).y))*clamp(1.0-closer.x, 0.0, 1.0);
    
}
//BLOCK_END Blob_Fragment

//BLOCK_BEGIN Line_Fragment 48

void Line_Fragment_B48(
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

//BLOCK_BEGIN Scale_RGB 54

void Scale_RGB_B54(
    vec4 Color,
    float Scalar,
    out vec4 Result)
{
    Result = vec4(Scalar,Scalar,Scalar,1) * Color;
}
//BLOCK_END Scale_RGB

//BLOCK_BEGIN Conditional_Float 38

void Conditional_Float_B38(
    bool Which,
    float If_True,
    float If_False,
    out float Result)
{
    Result = Which ? If_True : If_False;
    
}
//BLOCK_END Conditional_Float


void main()
{
    // To_RGBA (#72)
    float R_Q72;
    float G_Q72;
    float B_Q72;
    float A_Q72;
    R_Q72=vColor.r; G_Q72=vColor.g; B_Q72=vColor.b; A_Q72=vColor.a;

    vec4 Blob_Color_Q71;
    #if BLOB_ENABLE
      // Blob_Fragment_B71(_Blob_Texture_,vExtra2,vExtra3,Blob_Color_Q71);
      float k1 = dot(vExtra2.xy,vExtra2.xy);
      float k2 = dot(vExtra3.xy,vExtra3.xy);
      vec3 closer = k1<k2 ? vec3(k1,vExtra2.z,vExtra2.w) : vec3(k2,vExtra3.z,vExtra3.w);
      Blob_Color_Q71 = closer.z * texture(_Blob_Texture_,vec2(vec2(sqrt(closer.x),closer.y).x,1.0-vec2(sqrt(closer.x),closer.y).y))*clamp(1.0-closer.x, 0.0, 1.0);
    #else
      Blob_Color_Q71 = vec4(0,0,0,0);
    #endif

    vec4 Line_Color_Q48;
    Line_Fragment_B48(_Line_Color_,_Highlight_Color_,_Highlight_Width_,vTangent,_Highlight_,Line_Color_Q48);

    // To_XY (#67)
    float X_Q67;
    float Y_Q67;
    X_Q67 = vUV.x;
    Y_Q67 = vUV.y;

    // Incident3 (#66)
    vec3 Incident_Q66 = normalize(vPosition - cameraPosition);

    // Reflect (#60)
    vec3 Reflected_Q60 = reflect(Incident_Q66, vBinormal);

    // Multiply (#63)
    float Product_Q63 = Y_Q67 * _Vertical_Offset_;

    // DotProduct3 (#68)
    float Dot_Q68 = dot(Incident_Q66,  Reflected_Q60);

    // DotProduct3 (#57)
    float Dot_Q57 = dot(vNormal,  Incident_Q66);

    float Result_Q38;
    Conditional_Float_B38(_Reflected_,Dot_Q68,Dot_Q57,Result_Q38);

    // Multiply (#64)
    float Product_Q64 = Result_Q38 * _Frequency_;

    // Add (#69)
    float Sum_Q69 = Product_Q64 + 1.0;

    // Multiply (#70)
    float Product_Q70 = Sum_Q69 * 0.5;

    // Add (#62)
    float Sum_Q62 = Product_Q63 + Product_Q70;

    // Fract (#59)
    float FractF_Q59=fract(Sum_Q62);

    // From_XY (#65)
    vec2 Vec2_Q65 = vec2(FractF_Q59,0.5);

    // Color_Texture (#58)
    vec4 Color_Q58;
    #if IRIDESCENT_MAP_ENABLE
      Color_Q58 = texture(_Iridescent_Map_,Vec2_Q65);
    #else
      Color_Q58 = vec4(0,0,0,0);
    #endif

    vec4 Result_Q54;
    Scale_RGB_B54(Color_Q58,_Iridescence_Edge_Intensity_,Result_Q54);

    vec4 Result_Q55;
    Scale_RGB_B54(Color_Q58,_Iridescence_Intensity_,Result_Q55);

    // Add_Colors (#53)
    vec4 Base_And_Iridescent_Q53;
    Base_And_Iridescent_Q53 = Line_Color_Q48 + vec4(Result_Q54.rgb,0.0);
    
    // Add_Colors (#56)
    vec4 Base_And_Iridescent_Q56;
    Base_And_Iridescent_Q56 = _Base_Color_ + vec4(Result_Q55.rgb,0.0);
    
    // Set_Alpha (#52)
    vec4 Result_Q52 = Base_And_Iridescent_Q53; Result_Q52.a = 1.0;

    // Blend_Over (#35)
    vec4 Result_Q35 = Blob_Color_Q71 + (1.0 - Blob_Color_Q71.a) * Base_And_Iridescent_Q56;

    vec4 Color_Q31;
    Round_Rect_Fragment_B31(R_Q72,G_Q72,Result_Q52,_Filter_Width_,vUV,1.0,vExtra1,Result_Q35,Color_Q31);

    // Scale_Color (#47)
    vec4 Result_Q47 = _Fade_Out_ * Color_Q31;

    vec4 Out_Color = Result_Q47;
    float Clip_Threshold = 0.001;
    bool To_sRGB = false;

    gl_FragColor = Out_Color;
}