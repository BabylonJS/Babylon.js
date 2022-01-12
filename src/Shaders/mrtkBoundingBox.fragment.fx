uniform vec3 cameraPosition;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUV;
varying vec3 vTangent;
varying vec3 vBinormal;
varying vec4 vExtra1;

uniform float _Near_Width_;
uniform float _Far_Width_;
uniform float _Near_Distance_;
uniform float _Far_Distance_;
uniform vec4 _Edge_Color_;
uniform float _Proximity_Max_Intensity_;
uniform float _Proximity_Far_Radius_;
uniform float _Proximity_Near_Radius_;
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
uniform sampler2D _Blob_Texture_;
uniform bool _Blob_Enable_2_;
uniform vec3 _Blob_Position_2_;
uniform float _Blob_Near_Size_2_;
uniform float _Blob_Inner_Fade_2_;
uniform float _Blob_Pulse_2_;
uniform float _Blob_Fade_2_;
//define ENABLE_TRANSITION
uniform vec3 _Center_;
uniform float _Transition_;
uniform float _Radius_;
uniform float _Fuzz_;
uniform float _Start_Time_;
uniform float _Transition_Period_;
uniform vec4 _Flash_Color_;
uniform vec4 _Trim_Color_;
uniform bool _Invert_;
//define ENABLE_FADE
uniform float _Fade_Width_;
uniform bool _Hide_XY_Faces_;
uniform bool _Show_Frame_;

uniform bool Use_Global_Left_Index;
uniform bool Use_Global_Right_Index;
uniform vec4 Global_Left_Index_Tip_Position;
uniform vec4 Global_Right_Index_Tip_Position;
uniform vec4 Global_Left_Thumb_Tip_Position;
uniform vec4 Global_Right_Thumb_Tip_Position;
uniform float  Global_Left_Index_Tip_Proximity;
uniform float  Global_Right_Index_Tip_Proximity;

//BLOCK_BEGIN Holo_Edge_Fragment 37

void Holo_Edge_Fragment_B37(
    float Edge_Width,
    vec4 Edges,
    out float NotEdge)
{
    vec2 c = vec2(min(Edges.x,Edges.y),min(Edges.z,Edges.w));
    vec2 df = fwidth(c)*Edge_Width;
    vec2 g = clamp(c/df, 0.0, 1.0);
    NotEdge = g.x*g.y;
}
//BLOCK_END Holo_Edge_Fragment

//BLOCK_BEGIN Blob_Fragment 40

void Blob_Fragment_B40(
    sampler2D Blob_Texture,
    vec2 UV,
    vec3 Blob_Info,
    out vec4 Blob_Color)
{
    float k = dot(UV,UV);
    Blob_Color = Blob_Info.y * texture(Blob_Texture,vec2(vec2(sqrt(k),Blob_Info.x).x,1.0-vec2(sqrt(k),Blob_Info.x).y))*(1.0-clamp(k, 0.0, 1.0));
}
//BLOCK_END Blob_Fragment

//BLOCK_BEGIN Transition 53

float tramp(float start, float end, float x)
{
    return smoothstep(start,end,x);
//    return clamp((x-start)/(end-start), 0.0, 1.0);
}

void Transition_B53(
    vec3 Position,
    float Time,
    vec3 Center,
    float Transition,
    float Radius,
    float Fuzz,
    float Start_Time,
    float Speed,
    vec4 Flash_Color,
    vec4 Trim_Color,
    bool Invert,
    float Edge_Weight,
    out float Trans_Intensity,
    out vec4 Flash)
{
    float t = Invert ? 1.0-Transition : Transition;
    t = Start_Time>0.0 ? clamp((Time-Start_Time)/Speed,0.0,1.0) : t;
    
    float d = distance(Center,Position);
    float k = t * Radius;
    float s1 = tramp(k-Fuzz-Fuzz,k-Fuzz,d);
    float s2 = tramp(k-Fuzz,k,d);
    
    float s = clamp(s1-s2, 0.0, 1.0);
    Trans_Intensity = Invert ? s1 : 1.0-s1;
    //Trans_Intensity = 1; //sqrt(Trans_Intensity);
    
    Flash = Edge_Weight*s*mix(Trim_Color,Flash_Color,s);
}
//BLOCK_END Transition

//BLOCK_BEGIN Wireframe_Fragment 54

vec2 FilterStep(vec2 Edge, vec2 X)
{
    // note we are in effect doubling the filter width
    vec2 dX = max(fwidth(X),vec2(0.00001,0.00001));
    return clamp( (X+dX - max(Edge,X-dX))/(dX*2.0), 0.0, 1.0);
}

void Wireframe_Fragment_B54(
    vec3 Widths,
    vec2 UV,
    out float Edge)
{
    vec2 c = min(UV,vec2(1.0,1.0)-UV);
    vec2 g = FilterStep(Widths.xy,c); 
    Edge = 1.0-min(g.x,g.y);
    
}
//BLOCK_END Wireframe_Fragment

//BLOCK_BEGIN Proximity 43

void Proximity_B43(
    vec3 Position,
    vec3 Proximity_Center,
    vec3 Proximity_Center_2,
    float Proximity_Max_Intensity,
    float Proximity_Far_Radius,
    float Proximity_Near_Radius,
    out float Proximity)
{
    vec3 blob1 =  (Use_Global_Left_Index ? Global_Left_Index_Tip_Position.xyz :  Proximity_Center);
    vec3 blob2 =  (Use_Global_Right_Index ? Global_Right_Index_Tip_Position.xyz :  Proximity_Center_2);
    
    vec3 delta1 = blob1-Position;
    vec3 delta2 = blob2-Position;
    
    float d2 = sqrt(min(dot(delta1,delta1),dot(delta2,delta2)));
    Proximity = Proximity_Max_Intensity * (1.0-clamp((d2-Proximity_Near_Radius)/(Proximity_Far_Radius-Proximity_Near_Radius), 0.0, 1.0));
}
//BLOCK_END Proximity


void main()
{
    float NotEdge_Q37;
    #if ENABLE_FADE
      Holo_Edge_Fragment_B37(_Fade_Width_,vExtra1,NotEdge_Q37);
    #else
      NotEdge_Q37 = 1.0;
    #endif

    vec4 Blob_Color_Q40;
    Blob_Fragment_B40(_Blob_Texture_,vUV,vBinormal,Blob_Color_Q40);

    // To_XYZ (#32)
    float X_Q32;
    float Y_Q32;
    float Z_Q32;
    X_Q32=vNormal.x;
    Y_Q32=vNormal.y;
    Z_Q32=vNormal.z;

    float Edge_Q54;
    Wireframe_Fragment_B54(vNormal,vUV,Edge_Q54);

    float Proximity_Q43;
    Proximity_B43(vPosition,_Blob_Position_,_Blob_Position_2_,_Proximity_Max_Intensity_,_Proximity_Far_Radius_,_Proximity_Near_Radius_,Proximity_Q43);

    float Trans_Intensity_Q53;
    vec4 Flash_Q53;
    #if ENABLE_TRANSITION
      Transition_B53(vPosition,(huxTime*20.0),vTangent,_Transition_,_Radius_,_Fuzz_,_Start_Time_,_Transition_Period_,_Flash_Color_,_Trim_Color_,_Invert_,Edge_Q54,Trans_Intensity_Q53,Flash_Q53);
    #else
      Trans_Intensity_Q53 = 0.0;
      Flash_Q53 = vec4(0,0,0,0);
    #endif

    // Max (#29)
    float MaxAB_Q29=max(Proximity_Q43,Trans_Intensity_Q53);

    // Multiply (#39)
    float Edge_Intensity_Q39 = Edge_Q54 * MaxAB_Q29;

    // Add_Scaled_Color (#31)
    vec4 Wire_Color_Q31 = Flash_Q53 + Edge_Intensity_Q39 * _Edge_Color_;

    // Mix_Colors (#30)
    vec4 Color_At_T_Q30 = mix(Wire_Color_Q31, Blob_Color_Q40, Z_Q32);

    // Conditional_Color (#38)
    vec4 Result_Q38 = _Show_Frame_ ? vec4(0.3,0.3,0.3,0.3) : Color_At_T_Q30;

    // Scale_Color (#16)
    vec4 Result_Q16 = NotEdge_Q37 * Result_Q38;

    vec4 Out_Color = Result_Q16;
    float Clip_Threshold = 0.0;
    bool To_sRGB = false;

    gl_FragColor = Out_Color;
}