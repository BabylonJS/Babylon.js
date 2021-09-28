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

//BLOCK_BEGIN Blob_Fragment 180

void Blob_Fragment_B180(
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

//BLOCK_BEGIN FastLinearTosRGB 192

void FastLinearTosRGB_B192(
    vec4 Linear,
    out vec4 sRGB)
{
    sRGB.rgb = sqrt(clamp(Linear.rgb, 0.0, 1.0));
    sRGB.a = Linear.a;
    
}
//BLOCK_END FastLinearTosRGB

//BLOCK_BEGIN Scale_RGB 209

void Scale_RGB_B209(
    vec4 Color,
    float Scalar,
    out vec4 Result)
{
    Result = vec4(Scalar,Scalar,Scalar,1) * Color;
}
//BLOCK_END Scale_RGB

//BLOCK_BEGIN Fragment_Main 271

void Fragment_Main_B271(
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

//BLOCK_BEGIN Bulge 229

void Bulge_B229(
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

//BLOCK_BEGIN SSS 227

void SSS_B227(
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

//BLOCK_BEGIN FingerOcclusion 217

void FingerOcclusion_B217(
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

//BLOCK_BEGIN FingerOcclusion 218

void FingerOcclusion_B218(
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

//BLOCK_BEGIN Scale_Color 241

void Scale_Color_B241(
    vec4 Color,
    float Scalar,
    out vec4 Result)
{
    Result = Scalar * Color;
}
//BLOCK_END Scale_Color

//BLOCK_BEGIN From_HSV 223

void From_HSV_B223(
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

//BLOCK_BEGIN Fast_Fresnel 272

void Fast_Fresnel_B272(
    float Front_Reflect,
    float Edge_Reflect,
    float Power,
    vec3 Normal,
    vec3 Incident,
    out float Transmit,
    out float Reflect)
{
    
    float d = max(-dot(Incident, Normal),0.0);
    Reflect = Front_Reflect+(Edge_Reflect-Front_Reflect)*pow(1.0-d,Power);
    Transmit=1.0-Reflect;
    
}
//BLOCK_END Fast_Fresnel

//BLOCK_BEGIN Mapped_Environment 201

void Mapped_Environment_B201(
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

//BLOCK_BEGIN Sky_Environment 200

vec4 SampleEnv_Bid200(vec3 D, vec4 S, vec4 H, vec4 G, float exponent)
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

void Sky_Environment_B200(
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
    Reflected_Color = SampleEnv_Bid200(Reflected,Sky_Color,Horizon_Color,Ground_Color,Horizon_Power);
    Indirect_Color = mix(Ground_Color,Sky_Color,Normal.y*0.5+0.5);
    
}
//BLOCK_END Sky_Environment

//BLOCK_BEGIN Min_Segment_Distance 215

void Min_Segment_Distance_B215(
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

//BLOCK_BEGIN To_XYZ 224

void To_XYZ_B224(
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

//BLOCK_BEGIN Finger_Positions 214

void Finger_Positions_B214(
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

//BLOCK_BEGIN VaryHSV 258

void VaryHSV_B258(
    vec3 HSV_In,
    float Hue_Shift,
    float Saturation_Shift,
    float Value_Shift,
    out vec3 HSV_Out)
{
    HSV_Out = vec3(fract(HSV_In.x+Hue_Shift),clamp(HSV_In.y+Saturation_Shift, 0.0, 1.0),clamp(HSV_In.z+Value_Shift, 0.0, 1.0));
}
//BLOCK_END VaryHSV

//BLOCK_BEGIN Remap_Range 264

void Remap_Range_B264(
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

//BLOCK_BEGIN To_HSV 225

void To_HSV_B225(
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

//BLOCK_BEGIN Code 260

void Code_B260(
    float X,
    out float Result)
{
    Result = (acos(X)/3.14159-0.5)*2.0;
}
//BLOCK_END Code

//BLOCK_BEGIN Rim_Light 282

void Rim_Light_B282(
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
    vec4 Blob_Color_Q180;
    #if BLOB_ENABLE
      Blob_Fragment_B180(_Blob_Texture_,vExtra2,vExtra3,Blob_Color_Q180);
    #else
      Blob_Color_Q180 = vec4(0,0,0,0);
    #endif

    // Incident3 (#189)
    vec3 Incident_Q189 = normalize(vPosition - cameraPosition);

    // Normalize3 (#188)
    vec3 Normalized_Q188 = normalize(vNormal);

    // Normalize3 (#221)
    vec3 Normalized_Q221 = normalize(vTangent);

    // Color_Texture (#233)
    vec4 Color_Q233;
    #if DECAL_ENABLE
      Color_Q233 = texture(_Decal_,vUV);
    #else
      Color_Q233 = vec4(0,0,0,0);
    #endif

    // To_XYZW (#240)
    float X_Q240;
    float Y_Q240;
    float Z_Q240;
    float W_Q240;
    X_Q240=vExtra1.x;
    Y_Q240=vExtra1.y;
    Z_Q240=vExtra1.z;
    W_Q240=vExtra1.w;

    // FastsRGBtoLinear (#193)
    vec4 Linear_Q193;
    Linear_Q193.rgb = clamp(_Sky_Color_.rgb*_Sky_Color_.rgb, 0.0, 1.0);
    Linear_Q193.a=_Sky_Color_.a;
    
    // FastsRGBtoLinear (#194)
    vec4 Linear_Q194;
    Linear_Q194.rgb = clamp(_Horizon_Color_.rgb*_Horizon_Color_.rgb, 0.0, 1.0);
    Linear_Q194.a=_Horizon_Color_.a;
    
    // FastsRGBtoLinear (#195)
    vec4 Linear_Q195;
    Linear_Q195.rgb = clamp(_Ground_Color_.rgb*_Ground_Color_.rgb, 0.0, 1.0);
    Linear_Q195.a=_Ground_Color_.a;
    
    vec3 Left_Index_Q214;
    vec3 Right_Index_Q214;
    vec3 Left_Index_Middle_Q214;
    vec3 Right_Index_Middle_Q214;
    Finger_Positions_B214(_Left_Index_Pos_,_Right_Index_Pos_,_Left_Index_Middle_Pos_,_Right_Index_Middle_Pos_,Left_Index_Q214,Right_Index_Q214,Left_Index_Middle_Q214,Right_Index_Middle_Q214);

    // FastsRGBtoLinear (#196)
    vec4 Linear_Q196;
    Linear_Q196.rgb = clamp(_Albedo_.rgb*_Albedo_.rgb, 0.0, 1.0);
    Linear_Q196.a=_Albedo_.a;
    
    // Normalize3 (#257)
    vec3 Normalized_Q257 = normalize(vBinormal);

    // Incident3 (#220)
    vec3 Incident_Q220 = normalize(vPosition - cameraPosition);

    vec3 New_Normal_Q229;
    Bulge_B229(_Bulge_Enabled_,Normalized_Q188,Normalized_Q221,_Bulge_Height_,vColor,_Bulge_Radius_,vBinormal,New_Normal_Q229);

    float Result_Q227;
    SSS_B227(vBinormal,New_Normal_Q229,Incident_Q189,Result_Q227);

    vec4 Result_Q241;
    Scale_Color_B241(Color_Q233,X_Q240,Result_Q241);

    float Transmit_Q272;
    float Reflect_Q272;
    Fast_Fresnel_B272(_Front_Reflect_,_Edge_Reflect_,_Power_,New_Normal_Q229,Incident_Q189,Transmit_Q272,Reflect_Q272);

    // Multiply (#275)
    float Product_Q275 = Y_Q240 * Y_Q240;

    vec3 NearP_Q215;
    vec3 NearQ_Q215;
    float Distance_Q215;
    Min_Segment_Distance_B215(Left_Index_Q214,Left_Index_Middle_Q214,vPosition,cameraPosition,NearP_Q215,NearQ_Q215,Distance_Q215);

    vec3 NearP_Q213;
    vec3 NearQ_Q213;
    float Distance_Q213;
    Min_Segment_Distance_B215(Right_Index_Q214,Right_Index_Middle_Q214,vPosition,cameraPosition,NearP_Q213,NearQ_Q213,Distance_Q213);

    // Reflect (#197)
    vec3 Reflected_Q197 = reflect(Incident_Q189, New_Normal_Q229);

    // Multiply_Colors (#253)
    vec4 Product_Q253 = Linear_Q196 * vec4(1,1,1,1);

    vec4 Result_Q282;
    Rim_Light_B282(Normalized_Q257,Normalized_Q188,Incident_Q220,_Rim_Intensity_,_Rim_Texture_,Result_Q282);

    // DotProduct3 (#222)
    float Dot_Q222 = dot(Incident_Q220,  Normalized_Q221);

    // Max (#273)
    float MaxAB_Q273=max(Reflect_Q272,Product_Q275);

    float NotInShadow_Q217;
    #if OCCLUSION_ENABLED
      FingerOcclusion_B217(_Width_,Distance_Q215,_Fuzz_,_Min_Fuzz_,vPosition,vBinormal,NearP_Q215,_Clip_Fade_,NotInShadow_Q217);
    #else
      NotInShadow_Q217 = 1.0;
    #endif

    float NotInShadow_Q218;
    #if OCCLUSION_ENABLED
      FingerOcclusion_B218(_Width_,Distance_Q213,_Fuzz_,_Min_Fuzz_,vPosition,vBinormal,NearP_Q213,_Clip_Fade_,NotInShadow_Q218);
    #else
      NotInShadow_Q218 = 1.0;
    #endif

    vec4 Reflected_Color_Q201;
    vec4 Indirect_Diffuse_Q201;
    #if ENV_ENABLE
      Mapped_Environment_B201(_Reflection_Map_,_Indirect_Environment_,Reflected_Q197,Reflected_Color_Q201,Indirect_Diffuse_Q201);
    #else
      Reflected_Color_Q201 = vec4(0,0,0,1);
      Indirect_Diffuse_Q201 = vec4(0,0,0,1);
    #endif

    vec4 Reflected_Color_Q200;
    vec4 Indirect_Color_Q200;
    #if SKY_ENABLED
      Sky_Environment_B200(New_Normal_Q229,Reflected_Q197,Linear_Q193,Linear_Q194,Linear_Q195,_Horizon_Power_,Reflected_Color_Q200,Indirect_Color_Q200);
    #else
      Reflected_Color_Q200 = vec4(0,0,0,1);
      Indirect_Color_Q200 = vec4(0,0,0,1);
    #endif

    float Hue_Q225;
    float Saturation_Q225;
    float Value_Q225;
    float Alpha_Q225;
    vec3 HSV_Q225;
    To_HSV_B225(Product_Q253,Hue_Q225,Saturation_Q225,Value_Q225,Alpha_Q225,HSV_Q225);

    float Hue_Q277;
    float Saturation_Q277;
    float Value_Q277;
    float Alpha_Q277;
    vec3 HSV_Q277;
    To_HSV_B225(Result_Q282,Hue_Q277,Saturation_Q277,Value_Q277,Alpha_Q277,HSV_Q277);

    float Result_Q260;
    Code_B260(Dot_Q222,Result_Q260);

    // Abs (#226)
    float AbsA_Q226 = abs(Result_Q260);

    // Min (#208)
    float MinAB_Q208=min(NotInShadow_Q217,NotInShadow_Q218);

    // Add_Colors (#198)
    vec4 Sum_Q198 = Reflected_Color_Q201 + Reflected_Color_Q200;

    // Add_Colors (#199)
    vec4 Sum_Q199 = Indirect_Diffuse_Q201 + Indirect_Color_Q200;

    vec3 HSV_Out_Q276;
    VaryHSV_B258(HSV_Q277,_Rim_Hue_Shift_,_Rim_Saturation_Shift_,_Rim_Value_Shift_,HSV_Out_Q276);

    float Out_Q264;
    Remap_Range_B264(-1.0,1.0,0.0,1.0,Result_Q260,Out_Q264);

    // Modify (#256)
    float Product_Q256;
    Product_Q256 = AbsA_Q226 * _Hue_Shift_;
    //Product_Q256 = sign(AbsA_Q226)*sqrt(abs(AbsA_Q226))*_Hue_Shift_;

    float X_Q278;
    float Y_Q278;
    float Z_Q278;
    To_XYZ_B224(HSV_Out_Q276,X_Q278,Y_Q278,Z_Q278);

    // From_XY (#262)
    vec2 Vec2_Q262 = vec2(Out_Q264,0.5);

    vec3 HSV_Out_Q258;
    VaryHSV_B258(HSV_Q225,Product_Q256,_Saturation_Shift_,_Value_Shift_,HSV_Out_Q258);

    vec4 Color_Q279;
    From_HSV_B223(X_Q278,Y_Q278,Z_Q278,0.0,Color_Q279);

    // Color_Texture (#261)
    vec4 Color_Q261;
    #if IRIDESCENCE_ENABLED
      Color_Q261 = texture(_Iridescence_Texture_,Vec2_Q262);
    #else
      Color_Q261 = vec4(0,0,0,0);
    #endif

    float X_Q224;
    float Y_Q224;
    float Z_Q224;
    To_XYZ_B224(HSV_Out_Q258,X_Q224,Y_Q224,Z_Q224);

    // Scale_Color (#281)
    vec4 Result_Q281 = _Rim_Intensity_ * Color_Q279;

    // Scale_Color (#263)
    vec4 Result_Q263 = _Iridescence_Intensity_ * Color_Q261;

    vec4 Color_Q223;
    From_HSV_B223(X_Q224,Y_Q224,Z_Q224,0.0,Color_Q223);

    // Blend_Over (#234)
    vec4 Result_Q234 = Result_Q241 + (1.0 - Result_Q241.a) * Color_Q223;

    vec4 Result_Q271;
    Fragment_Main_B271(_Sun_Intensity_,_Sun_Theta_,_Sun_Phi_,New_Normal_Q229,Result_Q234,MaxAB_Q273,_Shininess_,Incident_Q189,_Horizon_Color_,_Sky_Color_,_Ground_Color_,_Indirect_Diffuse_,_Specular_,_Horizon_Power_,_Reflection_,Sum_Q198,Sum_Q199,_Sharpness_,Result_Q227,_Subsurface_,vec4(0,0,0,0),Result_Q281,Result_Q263,Result_Q271);

    vec4 Result_Q209;
    Scale_RGB_B209(Result_Q271,MinAB_Q208,Result_Q209);

    vec4 sRGB_Q192;
    FastLinearTosRGB_B192(Result_Q209,sRGB_Q192);

    // Blend_Over (#181)
    vec4 Result_Q181 = Blob_Color_Q180 + (1.0 - Blob_Color_Q180.a) * sRGB_Q192;

    // Set_Alpha (#190)
    vec4 Result_Q190 = Result_Q181; Result_Q190.a = 1.0;

    vec4 Out_Color = Result_Q190;
    float Clip_Threshold = 0.001;
    bool To_sRGB = false;

    gl_FragColor = Out_Color;
}