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
uniform float _Bevel_Front_;
uniform float _Bevel_Front_Stretch_;
uniform float _Bevel_Back_;
uniform float _Bevel_Back_Stretch_;
uniform float _Radius_Top_Left_;
uniform float _Radius_Top_Right_;
uniform float _Radius_Bottom_Left_;
uniform float _Radius_Bottom_Right_;
uniform bool _Bulge_Enabled_;
uniform float _Bulge_Height_;
uniform float _Bulge_Radius_;
uniform float _Sun_Intensity_;
uniform float _Sun_Theta_;
uniform float _Sun_Phi_;
uniform float _Indirect_Diffuse_;
uniform vec4 _Albedo_;
uniform float _Specular_;
uniform float _Shininess_;
uniform float _Sharpness_;
uniform float _Subsurface_;
uniform vec4 _Left_Color_;
uniform vec4 _Right_Color_;
uniform float _Reflection_;
uniform float _Front_Reflect_;
uniform float _Edge_Reflect_;
uniform float _Power_;
//define SKY_ENABLED
uniform vec4 _Sky_Color_;
uniform vec4 _Horizon_Color_;
uniform vec4 _Ground_Color_;
uniform float _Horizon_Power_;
//define ENV_ENABLE
uniform sampler2D _Reflection_Map_;
uniform sampler2D _Indirect_Environment_;
//define OCCLUSION_ENABLED
uniform float _Width_;
uniform float _Fuzz_;
uniform float _Min_Fuzz_;
uniform float _Clip_Fade_;
uniform float _Hue_Shift_;
uniform float _Saturation_Shift_;
uniform float _Value_Shift_;
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
uniform vec3 _Left_Index_Pos_;
uniform vec3 _Right_Index_Pos_;
uniform vec3 _Left_Index_Middle_Pos_;
uniform vec3 _Right_Index_Middle_Pos_;
//define DECAL_ENABLE
uniform sampler2D _Decal_;
uniform vec2 _Decal_Scale_XY_;
uniform bool _Decal_Front_Only_;
uniform float _Rim_Intensity_;
uniform sampler2D _Rim_Texture_;
uniform float _Rim_Hue_Shift_;
uniform float _Rim_Saturation_Shift_;
uniform float _Rim_Value_Shift_;
//define IRIDESCENCE_ENABLED
uniform float _Iridescence_Intensity_;
uniform sampler2D _Iridescence_Texture_;

uniform bool Use_Global_Left_Index;
uniform bool Use_Global_Right_Index;
uniform vec4 Global_Left_Index_Tip_Position;
uniform vec4 Global_Right_Index_Tip_Position;
uniform vec4 Global_Left_Thumb_Tip_Position;
uniform vec4 Global_Right_Thumb_Tip_Position;
uniform vec4 Global_Left_Index_Middle_Position;
uniform vec4 Global_Right_Index_Middle_Position;
uniform float  Global_Left_Index_Tip_Proximity;
uniform float  Global_Right_Index_Tip_Proximity;

//BLOCK_BEGIN Blob_Fragment 30

void Blob_Fragment_B30(
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

//BLOCK_BEGIN FastLinearTosRGB 42

void FastLinearTosRGB_B42(
    vec4 Linear,
    out vec4 sRGB)
{
    sRGB.rgb = sqrt(clamp(Linear.rgb, 0.0, 1.0));
    sRGB.a = Linear.a;
    
}
//BLOCK_END FastLinearTosRGB

//BLOCK_BEGIN Scale_RGB 59

void Scale_RGB_B59(
    vec4 Color,
    float Scalar,
    out vec4 Result)
{
    Result = vec4(Scalar,Scalar,Scalar,1) * Color;
}
//BLOCK_END Scale_RGB

//BLOCK_BEGIN Fragment_Main 121

void Fragment_Main_B121(
    float Sun_Intensity,
    float Sun_Theta,
    float Sun_Phi,
    vec3 Normal,
    vec4 Albedo,
    float Fresnel_Reflect,
    float Shininess,
    vec3 Incident,
    vec4 Horizon_Color,
    vec4 Sky_Color,
    vec4 Ground_Color,
    float Indirect_Diffuse,
    float Specular,
    float Horizon_Power,
    float Reflection,
    vec4 Reflection_Sample,
    vec4 Indirect_Sample,
    float Sharpness,
    float SSS,
    float Subsurface,
    vec4 Translucence,
    vec4 Rim_Light,
    vec4 Iridescence,
    out vec4 Result)
{
    
    float theta = Sun_Theta * 2.0 * 3.14159;
    float phi = Sun_Phi * 3.14159;
    
    vec3 lightDir =  vec3(cos(phi)*cos(theta),sin(phi),cos(phi)*sin(theta));
    float NdotL = max(dot(lightDir,Normal),0.0);
    
    //vec3 H = normalize(Normal-Incident);
    vec3 R = reflect(Incident,Normal);
    float RdotL = max(0.0,dot(R,lightDir));
    float specular = pow(RdotL,Shininess);
    specular = mix(specular,smoothstep(0.495*Sharpness,1.0-0.495*Sharpness,specular),Sharpness);
    
    vec4 gi = mix(Ground_Color,Sky_Color,Normal.y*0.5+0.5);
    //SampleEnv(Normal,Sky_Color,Horizon_Color,Ground_Color,1);
    
    Result = ((Sun_Intensity*NdotL + Indirect_Sample * Indirect_Diffuse + Translucence)*(1.0 + SSS * Subsurface)) * Albedo * (1.0-Fresnel_Reflect) + (Sun_Intensity*specular*Specular + Fresnel_Reflect * Reflection*Reflection_Sample) + Fresnel_Reflect * Rim_Light + Iridescence;
    
}
//BLOCK_END Fragment_Main

//BLOCK_BEGIN Bulge 79

void Bulge_B79(
    bool Enabled,
    vec3 Normal,
    vec3 Tangent,
    float Bulge_Height,
    vec4 UV,
    float Bulge_Radius,
    vec3 ButtonN,
    out vec3 New_Normal)
{
    vec2 xy = clamp(UV.xy*2.0,vec2(-1,-1),vec2(1,1));
    
    vec3 B = (cross(Normal,Tangent));
    
    //vec3 dirX = Normal * cosa.x + Tangent * sina.x;
    //New_Normal = Normal; // * cosa.y + B * sina.y;
    //New_Normal = normalize(Normal + (New_Normal-Normal)*(1-clamp(xy.x, 0.0, 1.0))*(1-clamp(xy.y, 0.0, 1.0)));
    
    //float r = clamp(length(xy), 0.0, 1.0)*Bulge_Height;
    float k = -clamp(1.0-length(xy)/Bulge_Radius, 0.0, 1.0)*Bulge_Height;
    k = sin(k*3.14159*0.5);
    k *= smoothstep(0.9998,0.9999,abs(dot(ButtonN,Normal)));
    New_Normal = Normal * sqrt(1.0-k*k)+(xy.x*Tangent + xy.y*B)*k;
    New_Normal = Enabled ? New_Normal : Normal;
}
//BLOCK_END Bulge

//BLOCK_BEGIN SSS 77

void SSS_B77(
    vec3 ButtonN,
    vec3 Normal,
    vec3 Incident,
    out float Result)
{
    float NdotI = abs(dot(Normal,Incident));
    float BdotI = abs(dot(ButtonN,Incident));
    Result = (abs(NdotI-BdotI)); //*abs(ButtonN.y); //*sqrt(1.0-NdotI);
    //Result = abs(NdotI-BdotI)*exp(-1.0/max(NdotI,0.01));
    
    
    
}
//BLOCK_END SSS

//BLOCK_BEGIN FingerOcclusion 67

void FingerOcclusion_B67(
    float Width,
    float DistToCenter,
    float Fuzz,
    float Min_Fuzz,
    vec3 Position,
    vec3 Forward,
    vec3 Nearest,
    float Fade_Out,
    out float NotInShadow)
{
    float d = dot((Nearest-Position),Forward);
    float sh = smoothstep(Width*0.5,Width*0.5+Fuzz*max(d,0.0)+Min_Fuzz,DistToCenter);
    NotInShadow = 1.0-(1.0-sh)*smoothstep(-Fade_Out,0.0,d);
    
}
//BLOCK_END FingerOcclusion

//BLOCK_BEGIN FingerOcclusion 68

void FingerOcclusion_B68(
    float Width,
    float DistToCenter,
    float Fuzz,
    float Min_Fuzz,
    vec3 Position,
    vec3 Forward,
    vec3 Nearest,
    float Fade_Out,
    out float NotInShadow)
{
    float d = dot((Nearest-Position),Forward);
    float sh = smoothstep(Width*0.5,Width*0.5+Fuzz*max(d,0.0)+Min_Fuzz,DistToCenter);
    NotInShadow = 1.0-(1.0-sh)*smoothstep(-Fade_Out,0.0,d);
    
}
//BLOCK_END FingerOcclusion

//BLOCK_BEGIN Scale_Color 91

void Scale_Color_B91(
    vec4 Color,
    float Scalar,
    out vec4 Result)
{
    Result = Scalar * Color;
}
//BLOCK_END Scale_Color

//BLOCK_BEGIN From_HSV 73

void From_HSV_B73(
    float Hue,
    float Saturation,
    float Value,
    float Alpha,
    out vec4 Color)
{
    
    // from http://lolengine.net/blog/2013/07/27/rgb-to-hsv-in-glsl
    
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    
    vec3 p = abs(fract(vec3(Hue,Hue,Hue) + K.xyz) * 6.0 - K.www);
    
    Color.rgb = Value * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), Saturation);
    Color.a = Alpha;
    
}
//BLOCK_END From_HSV

//BLOCK_BEGIN Fast_Fresnel 122

void Fast_Fresnel_B122(
    float Front_Reflect,
    float Edge_Reflect,
    float Power,
    vec3 Normal,
    vec3 Incident,
    out float Transmit,
    out float Reflect)
{
    
    float d = max(-dot(Incident, Normal),0.0);
    Reflect = Front_Reflect+(Edge_Reflect-Front_Reflect)*pow(.01-d,Power);
    Transmit=1.0-Reflect;
    
}
//BLOCK_END Fast_Fresnel

//BLOCK_BEGIN Mapped_Environment 51

void Mapped_Environment_B51(
    sampler2D Reflected_Environment,
    sampler2D Indirect_Environment,
    vec3 Dir,
    out vec4 Reflected_Color,
    out vec4 Indirect_Diffuse)
{
    // main code goes here
    Reflected_Color = texture(Reflected_Environment, vec2(atan(Dir.z,Dir.x)/3.14159*0.5, asin(Dir.y)/3.14159+0.5));
    Indirect_Diffuse = texture(Indirect_Environment, vec2(atan(Dir.z,Dir.x)/3.14159*0.5, asin(Dir.y)/3.14159+0.5));
    
}
//BLOCK_END Mapped_Environment

//BLOCK_BEGIN Sky_Environment 50

vec4 SampleEnv_Bid50(vec3 D, vec4 S, vec4 H, vec4 G, float exponent)
{
    float k = pow(abs(D.y),exponent);
    vec4 C;
    if (D.y>0.0) {
        C=mix(H,S,k);
    } else {
        C=mix(H,G,k);    
    }
    return C;
}

void Sky_Environment_B50(
    vec3 Normal,
    vec3 Reflected,
    vec4 Sky_Color,
    vec4 Horizon_Color,
    vec4 Ground_Color,
    float Horizon_Power,
    out vec4 Reflected_Color,
    out vec4 Indirect_Color)
{
    // main code goes here
    Reflected_Color = SampleEnv_Bid50(Reflected,Sky_Color,Horizon_Color,Ground_Color,Horizon_Power);
    Indirect_Color = mix(Ground_Color,Sky_Color,Normal.y*0.5+0.5);
    
}
//BLOCK_END Sky_Environment

//BLOCK_BEGIN Min_Segment_Distance 65

void Min_Segment_Distance_B65(
    vec3 P0,
    vec3 P1,
    vec3 Q0,
    vec3 Q1,
    out vec3 NearP,
    out vec3 NearQ,
    out float Distance)
{
    vec3 u = P1 - P0;
    vec3 v = Q1 - Q0;
    vec3 w = P0 - Q0;
    
    float a = dot(u,u);
    float b = dot(u,v);
    float c = dot(v,v);
    float d = dot(u,w);
    float e = dot(v,w);
    
    float D = a*c-b*b;
    float sD = D;
    float tD = D;
    float sc, sN, tc, tN;
    
    if (D<0.00001) {
        sN = 0.0;
        sD = 1.0;
        tN = e;
        tD = c;
    } else {
        sN = (b*e - c*d);
        tN = (a*e - b*d);
        if (sN < 0.0) {
            sN = 0.0;
            tN = e;
            tD = c;
        } else if (sN > sD) {
            sN = sD;
            tN = e + b;
            tD = c;
        }
    }
    
    if (tN < 0.0) {
        tN = 0.0;
        if (-d < 0.0) {
            sN = 0.0;
        } else if (-d > a) {
            sN = sD;
        } else {
            sN = -d;
            sD = a;
        }
    } else if (tN > tD) {
        tN = tD;
        if ((-d + b) < 0.0) {
            sN = 0.0;
        } else if ((-d + b) > a) {
            sN = sD;
        } else {
            sN = (-d + b);
            sD = a;
        }
    }
    
    sc = abs(sN)<0.000001 ? 0.0 : sN / sD;
    tc = abs(tN)<0.000001 ? 0.0 : tN / tD;
    
    NearP = P0 + sc * u;
    NearQ = Q0 + tc * v;
    
    Distance = distance(NearP,NearQ);
    
}
//BLOCK_END Min_Segment_Distance

//BLOCK_BEGIN To_XYZ 74

void To_XYZ_B74(
    vec3 Vec3,
    out float X,
    out float Y,
    out float Z)
{
    X=Vec3.x;
    Y=Vec3.y;
    Z=Vec3.z;
    
}
//BLOCK_END To_XYZ

//BLOCK_BEGIN Finger_Positions 64

void Finger_Positions_B64(
    vec3 Left_Index_Pos,
    vec3 Right_Index_Pos,
    vec3 Left_Index_Middle_Pos,
    vec3 Right_Index_Middle_Pos,
    out vec3 Left_Index,
    out vec3 Right_Index,
    out vec3 Left_Index_Middle,
    out vec3 Right_Index_Middle)
{
    Left_Index =  (Use_Global_Left_Index ? Global_Left_Index_Tip_Position.xyz :  Left_Index_Pos);
    Right_Index =  (Use_Global_Right_Index ? Global_Right_Index_Tip_Position.xyz :  Right_Index_Pos);
    
    Left_Index_Middle =  (Use_Global_Left_Index ? Global_Left_Index_Middle_Position.xyz :  Left_Index_Middle_Pos);
    Right_Index_Middle =  (Use_Global_Right_Index ? Global_Right_Index_Middle_Position.xyz :  Right_Index_Middle_Pos);
    
}
//BLOCK_END Finger_Positions

//BLOCK_BEGIN VaryHSV 108

void VaryHSV_B108(
    vec3 HSV_In,
    float Hue_Shift,
    float Saturation_Shift,
    float Value_Shift,
    out vec3 HSV_Out)
{
    HSV_Out = vec3(fract(HSV_In.x+Hue_Shift),clamp(HSV_In.y+Saturation_Shift, 0.0, 1.0),clamp(HSV_In.z+Value_Shift, 0.0, 1.0));
}
//BLOCK_END VaryHSV

//BLOCK_BEGIN Remap_Range 114

void Remap_Range_B114(
    float In_Min,
    float In_Max,
    float Out_Min,
    float Out_Max,
    float In,
    out float Out)
{
    Out = mix(Out_Min,Out_Max,clamp((In-In_Min)/(In_Max-In_Min),0.0,1.0));
    
}
//BLOCK_END Remap_Range

//BLOCK_BEGIN To_HSV 75

void To_HSV_B75(
    vec4 Color,
    out float Hue,
    out float Saturation,
    out float Value,
    out float Alpha,
    out vec3 HSV)
{
    
    // from http://lolengine.net/blog/2013/07/27/rgb-to-hsv-in-glsl
    
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = Color.g < Color.b ? vec4(Color.bg, K.wz) : vec4(Color.gb, K.xy);
    vec4 q = Color.r < p.x ? vec4(p.xyw, Color.r) : vec4(Color.r, p.yzx);
    
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    
    Hue = abs(q.z + (q.w - q.y) / (6.0 * d + e));
    Saturation = d / (q.x + e);
    Value = q.x;
    Alpha = Color.a;
    HSV = vec3(Hue,Saturation,Value);
}
//BLOCK_END To_HSV

//BLOCK_BEGIN Code 110

void Code_B110(
    float X,
    out float Result)
{
    Result = (acos(X)/3.14159-0.5)*2.0;
}
//BLOCK_END Code

//BLOCK_BEGIN Rim_Light 132

void Rim_Light_B132(
    vec3 Front,
    vec3 Normal,
    vec3 Incident,
    float Rim_Intensity,
    sampler2D Texture,
    out vec4 Result)
{
    vec3 R = reflect(Incident,Normal);
    float RdotF = dot(R,Front);
    float RdotL = sqrt(1.0-RdotF*RdotF);
    vec2 UV = vec2(R.y*0.5+0.5,0.5);
    vec4 Color = texture(Texture,UV);
    Result = Color;
    
}
//BLOCK_END Rim_Light


void main()
{
    vec4 Blob_Color_Q30;
    #if BLOB_ENABLE
      Blob_Fragment_B30(_Blob_Texture_,vExtra2,vExtra3,Blob_Color_Q30);
    #else
      Blob_Color_Q30 = vec4(0,0,0,0);
    #endif

    // Incident3 (#39)
    vec3 Incident_Q39 = normalize(vPosition - cameraPosition);

    // Normalize3 (#38)
    vec3 Normalized_Q38 = normalize(vNormal);

    // Normalize3 (#71)
    vec3 Normalized_Q71 = normalize(vTangent);

    // Color_Texture (#83)
    vec4 Color_Q83;
    #if DECAL_ENABLE
      Color_Q83 = texture(_Decal_,vUV);
    #else
      Color_Q83 = vec4(0,0,0,0);
    #endif

    // To_XYZW (#90)
    float X_Q90;
    float Y_Q90;
    float Z_Q90;
    float W_Q90;
    X_Q90=vExtra1.x;
    Y_Q90=vExtra1.y;
    Z_Q90=vExtra1.z;
    W_Q90=vExtra1.w;

    // FastsRGBtoLinear (#43)
    vec4 Linear_Q43;
    Linear_Q43.rgb = clamp(_Sky_Color_.rgb*_Sky_Color_.rgb, 0.0, 1.0);
    Linear_Q43.a=_Sky_Color_.a;
    
    // FastsRGBtoLinear (#44)
    vec4 Linear_Q44;
    Linear_Q44.rgb = clamp(_Horizon_Color_.rgb*_Horizon_Color_.rgb, 0.0, 1.0);
    Linear_Q44.a=_Horizon_Color_.a;
    
    // FastsRGBtoLinear (#45)
    vec4 Linear_Q45;
    Linear_Q45.rgb = clamp(_Ground_Color_.rgb*_Ground_Color_.rgb, 0.0, 1.0);
    Linear_Q45.a=_Ground_Color_.a;
    
    vec3 Left_Index_Q64;
    vec3 Right_Index_Q64;
    vec3 Left_Index_Middle_Q64;
    vec3 Right_Index_Middle_Q64;
    Finger_Positions_B64(_Left_Index_Pos_,_Right_Index_Pos_,_Left_Index_Middle_Pos_,_Right_Index_Middle_Pos_,Left_Index_Q64,Right_Index_Q64,Left_Index_Middle_Q64,Right_Index_Middle_Q64);

    // FastsRGBtoLinear (#46)
    vec4 Linear_Q46;
    Linear_Q46.rgb = clamp(_Albedo_.rgb*_Albedo_.rgb, 0.0, 1.0);
    Linear_Q46.a=_Albedo_.a;
    
    // Normalize3 (#107)
    vec3 Normalized_Q107 = normalize(vBinormal);

    // Incident3 (#70)
    vec3 Incident_Q70 = normalize(vPosition - cameraPosition);

    vec3 New_Normal_Q79;
    Bulge_B79(_Bulge_Enabled_,Normalized_Q38,Normalized_Q71,_Bulge_Height_,vColor,_Bulge_Radius_,vBinormal,New_Normal_Q79);

    float Result_Q77;
    SSS_B77(vBinormal,New_Normal_Q79,Incident_Q39,Result_Q77);

    vec4 Result_Q91;
    Scale_Color_B91(Color_Q83,X_Q90,Result_Q91);

    float Transmit_Q122;
    float Reflect_Q122;
    Fast_Fresnel_B122(_Front_Reflect_,_Edge_Reflect_,_Power_,New_Normal_Q79,Incident_Q39,Transmit_Q122,Reflect_Q122);

    // Multiply (#125)
    float Product_Q125 = Y_Q90 * Y_Q90;

    vec3 NearP_Q65;
    vec3 NearQ_Q65;
    float Distance_Q65;
    Min_Segment_Distance_B65(Left_Index_Q64,Left_Index_Middle_Q64,vPosition,cameraPosition,NearP_Q65,NearQ_Q65,Distance_Q65);

    vec3 NearP_Q63;
    vec3 NearQ_Q63;
    float Distance_Q63;
    Min_Segment_Distance_B65(Right_Index_Q64,Right_Index_Middle_Q64,vPosition,cameraPosition,NearP_Q63,NearQ_Q63,Distance_Q63);

    // Reflect (#47)
    vec3 Reflected_Q47 = reflect(Incident_Q39, New_Normal_Q79);

    // Multiply_Colors (#103)
    vec4 Product_Q103 = Linear_Q46 * vec4(1,1,1,1);

    vec4 Result_Q132;
    Rim_Light_B132(Normalized_Q107,Normalized_Q38,Incident_Q70,_Rim_Intensity_,_Rim_Texture_,Result_Q132);

    // DotProduct3 (#72)
    float Dot_Q72 = dot(Incident_Q70,  Normalized_Q71);

    // Max (#123)
    float MaxAB_Q123=max(Reflect_Q122,Product_Q125);

    float NotInShadow_Q67;
    #if OCCLUSION_ENABLED
      FingerOcclusion_B67(_Width_,Distance_Q65,_Fuzz_,_Min_Fuzz_,vPosition,vBinormal,NearP_Q65,_Clip_Fade_,NotInShadow_Q67);
    #else
      NotInShadow_Q67 = 1.0;
    #endif

    float NotInShadow_Q68;
    #if OCCLUSION_ENABLED
      FingerOcclusion_B68(_Width_,Distance_Q63,_Fuzz_,_Min_Fuzz_,vPosition,vBinormal,NearP_Q63,_Clip_Fade_,NotInShadow_Q68);
    #else
      NotInShadow_Q68 = 1.0;
    #endif

    vec4 Reflected_Color_Q51;
    vec4 Indirect_Diffuse_Q51;
    #if ENV_ENABLE
      Mapped_Environment_B51(_Reflection_Map_,_Indirect_Environment_,Reflected_Q47,Reflected_Color_Q51,Indirect_Diffuse_Q51);
    #else
      Reflected_Color_Q51 = vec4(0,0,0,1);
      Indirect_Diffuse_Q51 = vec4(0,0,0,1);
    #endif

    vec4 Reflected_Color_Q50;
    vec4 Indirect_Color_Q50;
    #if SKY_ENABLED
      Sky_Environment_B50(New_Normal_Q79,Reflected_Q47,Linear_Q43,Linear_Q44,Linear_Q45,_Horizon_Power_,Reflected_Color_Q50,Indirect_Color_Q50);
    #else
      Reflected_Color_Q50 = vec4(0,0,0,1);
      Indirect_Color_Q50 = vec4(0,0,0,1);
    #endif

    float Hue_Q75;
    float Saturation_Q75;
    float Value_Q75;
    float Alpha_Q75;
    vec3 HSV_Q75;
    To_HSV_B75(Product_Q103,Hue_Q75,Saturation_Q75,Value_Q75,Alpha_Q75,HSV_Q75);

    float Hue_Q127;
    float Saturation_Q127;
    float Value_Q127;
    float Alpha_Q127;
    vec3 HSV_Q127;
    To_HSV_B75(Result_Q132,Hue_Q127,Saturation_Q127,Value_Q127,Alpha_Q127,HSV_Q127);

    float Result_Q110;
    Code_B110(Dot_Q72,Result_Q110);

    // Abs (#76)
    float AbsA_Q76 = abs(Result_Q110);

    // Min (#58)
    float MinAB_Q58=min(NotInShadow_Q67,NotInShadow_Q68);

    // Add_Colors (#48)
    vec4 Sum_Q48 = Reflected_Color_Q51 + Reflected_Color_Q50;

    // Add_Colors (#49)
    vec4 Sum_Q49 = Indirect_Diffuse_Q51 + Indirect_Color_Q50;

    vec3 HSV_Out_Q126;
    VaryHSV_B108(HSV_Q127,_Rim_Hue_Shift_,_Rim_Saturation_Shift_,_Rim_Value_Shift_,HSV_Out_Q126);

    float Out_Q114;
    Remap_Range_B114(-1.0,1.0,0.0,1.0,Result_Q110,Out_Q114);

    // Modify (#106)
    float Product_Q106;
    Product_Q106 = AbsA_Q76 * _Hue_Shift_;
    //Product_Q106 = sign(AbsA_Q76)*sqrt(abs(AbsA_Q76))*_Hue_Shift_;

    float X_Q128;
    float Y_Q128;
    float Z_Q128;
    To_XYZ_B74(HSV_Out_Q126,X_Q128,Y_Q128,Z_Q128);

    // From_XY (#112)
    vec2 Vec2_Q112 = vec2(Out_Q114,0.5);

    vec3 HSV_Out_Q108;
    VaryHSV_B108(HSV_Q75,Product_Q106,_Saturation_Shift_,_Value_Shift_,HSV_Out_Q108);

    vec4 Color_Q129;
    From_HSV_B73(X_Q128,Y_Q128,Z_Q128,0.0,Color_Q129);

    // Color_Texture (#111)
    vec4 Color_Q111;
    #if IRIDESCENCE_ENABLED
      Color_Q111 = texture(_Iridescence_Texture_,Vec2_Q112);
    #else
      Color_Q111 = vec4(0,0,0,0);
    #endif

    float X_Q74;
    float Y_Q74;
    float Z_Q74;
    To_XYZ_B74(HSV_Out_Q108,X_Q74,Y_Q74,Z_Q74);

    // Scale_Color (#131)
    vec4 Result_Q131 = _Rim_Intensity_ * Color_Q129;

    // Scale_Color (#113)
    vec4 Result_Q113 = _Iridescence_Intensity_ * Color_Q111;

    vec4 Color_Q73;
    From_HSV_B73(X_Q74,Y_Q74,Z_Q74,0.0,Color_Q73);

    // Blend_Over (#84)
    vec4 Result_Q84 = Result_Q91 + (1.0 - Result_Q91.a) * Color_Q73;

    vec4 Result_Q121;
    Fragment_Main_B121(_Sun_Intensity_,_Sun_Theta_,_Sun_Phi_,New_Normal_Q79,Result_Q84,MaxAB_Q123,_Shininess_,Incident_Q39,_Horizon_Color_,_Sky_Color_,_Ground_Color_,_Indirect_Diffuse_,_Specular_,_Horizon_Power_,_Reflection_,Sum_Q48,Sum_Q49,_Sharpness_,Result_Q77,_Subsurface_,vec4(0,0,0,0),Result_Q131,Result_Q113,Result_Q121);

    vec4 Result_Q59;
    Scale_RGB_B59(Result_Q121,MinAB_Q58,Result_Q59);

    vec4 sRGB_Q42;
    FastLinearTosRGB_B42(Result_Q59,sRGB_Q42);

    // Blend_Over (#31)
    vec4 Result_Q31 = Blob_Color_Q30 + (1.0 - Blob_Color_Q30.a) * sRGB_Q42;

    // Set_Alpha (#40)
    vec4 Result_Q40 = Result_Q31; Result_Q40.a = 1.0;

    vec4 Out_Color = Result_Q40;
    float Clip_Threshold = 0.001;
    bool To_sRGB = false;

    gl_FragColor = Out_Color;
}