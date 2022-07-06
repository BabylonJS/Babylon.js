uniform vec3 cameraPosition;

varying vec3 vNormal;
varying vec2 vUV;
varying vec3 vTangent;
varying vec4 vExtra1;
varying vec4 vExtra2;
varying vec4 vExtra3;

uniform float _Radius_;
uniform float _Line_Width_;
uniform bool _Relative_To_Height_;
uniform float _Filter_Width_;
uniform vec4 _Edge_Color_;
uniform float _Fade_Out_;
uniform bool _Smooth_Edges_;
uniform bool _Blob_Enable_;
uniform vec3 _Blob_Position_;
uniform float _Blob_Intensity_;
uniform float _Blob_Near_Size_;
uniform float _Blob_Far_Size_;
uniform float _Blob_Near_Distance_;
uniform float _Blob_Far_Distance_;
uniform float _Blob_Fade_Length_;
uniform float _Blob_Inner_Fade_;
uniform float _Blob_Pulse_;
uniform float _Blob_Fade_;
uniform float _Blob_Pulse_Max_Size_;
uniform bool _Blob_Enable_2_;
uniform vec3 _Blob_Position_2_;
uniform float _Blob_Near_Size_2_;
uniform float _Blob_Inner_Fade_2_;
uniform float _Blob_Pulse_2_;
uniform float _Blob_Fade_2_;
uniform float _Gaze_Intensity_;
uniform float _Gaze_Focus_;
uniform sampler2D _Blob_Texture_;
uniform float _Selection_Fuzz_;
uniform float _Selected_;
uniform float _Selection_Fade_;
uniform float _Selection_Fade_Size_;
uniform float _Selected_Distance_;
uniform float _Selected_Fade_Length_;
uniform float _Proximity_Max_Intensity_;
uniform float _Proximity_Far_Distance_;
uniform float _Proximity_Near_Radius_;
uniform float _Proximity_Anisotropy_;
uniform bool _Use_Global_Left_Index_;
uniform bool _Use_Global_Right_Index_;
uniform vec4 Global_Left_Index_Tip_Position;
uniform vec4 Global_Right_Index_Tip_Position;


//BLOCK_BEGIN Scale_Color 54

void Scale_Color_B54(
    vec4 Color,
    float Scalar,
    out vec4 Result)
{
    Result = Scalar * Color;
}
//BLOCK_END Scale_Color

//BLOCK_BEGIN Scale_RGB 50

void Scale_RGB_B50(
    vec4 Color,
    float Scalar,
    out vec4 Result)
{
    Result = vec4(Scalar,Scalar,Scalar,1) * Color;
}
//BLOCK_END Scale_RGB

//BLOCK_BEGIN Proximity_Fragment 51

void Proximity_Fragment_B51(
    float Proximity_Max_Intensity,
    float Proximity_Near_Radius,
    vec4 Deltas,
    float Show_Selection,
    float Distance_Fade1,
    float Distance_Fade2,
    float Strength,
    out float Proximity)
{
    float proximity1 = (1.0-clamp(length(Deltas.xy)/Proximity_Near_Radius, 0.0, 1.0))*Distance_Fade1;
    float proximity2 = (1.0-clamp(length(Deltas.zw)/Proximity_Near_Radius, 0.0, 1.0))*Distance_Fade2;
    
    Proximity = Strength * (Proximity_Max_Intensity * max(proximity1, proximity2) *(1.0-Show_Selection)+Show_Selection);
    
}
//BLOCK_END Proximity_Fragment

//BLOCK_BEGIN Blob_Fragment 56

void Blob_Fragment_B56(
    vec2 UV,
    vec3 Blob_Info,
    sampler2D Blob_Texture,
    out vec4 Blob_Color)
{
    float k = dot(UV,UV);
    Blob_Color = Blob_Info.y * texture(Blob_Texture,vec2(vec2(sqrt(k),Blob_Info.x).x,1.0-vec2(sqrt(k),Blob_Info.x).y))*(1.0-clamp(k, 0.0, 1.0));
}
//BLOCK_END Blob_Fragment

//BLOCK_BEGIN Round_Rect_Fragment 61

void Round_Rect_Fragment_B61(
    float Radius,
    vec4 Line_Color,
    float Filter_Width,
    float Line_Visibility,
    vec4 Fill_Color,
    bool Smooth_Edges,
    vec4 Rect_Parms,
    out float Inside_Rect)
{
    float d = length(max(abs(Rect_Parms.zw)-Rect_Parms.xy,0.0));
    float dx = max(fwidth(d)*Filter_Width,0.00001);
    
    Inside_Rect = Smooth_Edges ? clamp((Radius-d)/dx, 0.0, 1.0) : 1.0-step(Radius,d);
    
}
//BLOCK_END Round_Rect_Fragment


void main()
{
    // Is_Quad (#53)
    float Is_Quad_Q53;
    Is_Quad_Q53=vNormal.z;
    
    vec4 Blob_Color_Q56;
    Blob_Fragment_B56(vUV,vTangent,_Blob_Texture_,Blob_Color_Q56);

    // To_XYZW (#52)
    float X_Q52;
    float Y_Q52;
    float Z_Q52;
    float W_Q52;
    X_Q52=vExtra3.x;
    Y_Q52=vExtra3.y;
    Z_Q52=vExtra3.z;
    W_Q52=vExtra3.w;

    float Proximity_Q51;
    Proximity_Fragment_B51(_Proximity_Max_Intensity_,_Proximity_Near_Radius_,vExtra2,X_Q52,Y_Q52,Z_Q52,1.0,Proximity_Q51);

    float Inside_Rect_Q61;
    Round_Rect_Fragment_B61(W_Q52,vec4(1,1,1,1),_Filter_Width_,1.0,vec4(0,0,0,0),_Smooth_Edges_,vExtra1,Inside_Rect_Q61);

    vec4 Result_Q50;
    Scale_RGB_B50(_Edge_Color_,Proximity_Q51,Result_Q50);

    // Scale_Color (#47)
    vec4 Result_Q47 = Inside_Rect_Q61 * Blob_Color_Q56;

    // Mix_Colors (#48)
    vec4 Color_At_T_Q48 = mix(Result_Q50, Result_Q47, Is_Quad_Q53);

    vec4 Result_Q54;
    Scale_Color_B54(Color_At_T_Q48,_Fade_Out_,Result_Q54);

    vec4 Out_Color = Result_Q54;
    float Clip_Threshold = 0.001;
    bool To_sRGB = false;

    gl_FragColor = Out_Color;
}