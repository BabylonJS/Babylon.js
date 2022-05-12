uniform mat4 world;
uniform mat4 viewProjection;
uniform vec3 cameraPosition;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
#ifdef TANGENT
attribute vec3 tangent;
#else
const vec3 tangent = vec3(0.);
#endif

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
uniform float  Global_Left_Index_Tip_Proximity;
uniform float  Global_Right_Index_Tip_Proximity;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUV;
varying vec3 vTangent;
varying vec3 vBinormal;
varying vec4 vColor;
varying vec4 vExtra1;
varying vec4 vExtra2;
varying vec4 vExtra3;

//BLOCK_BEGIN Object_To_World_Pos 162

void Object_To_World_Pos_B162(
    vec3 Pos_Object,
    out vec3 Pos_World)
{
    Pos_World=(world * vec4(Pos_Object,1.0)).xyz;
    
}
//BLOCK_END Object_To_World_Pos

//BLOCK_BEGIN Object_To_World_Normal 182

void Object_To_World_Normal_B182(
    vec3 Nrm_Object,
    out vec3 Nrm_World)
{
    Nrm_World=(vec4(Nrm_Object,0.0)).xyz;
    
}
//BLOCK_END Object_To_World_Normal

//BLOCK_BEGIN Blob_Vertex 173

void Blob_Vertex_B173(
    vec3 Position,
    vec3 Normal,
    vec3 Tangent,
    vec3 Bitangent,
    vec3 Blob_Position,
    float Intensity,
    float Blob_Near_Size,
    float Blob_Far_Size,
    float Blob_Near_Distance,
    float Blob_Far_Distance,
    float Blob_Fade_Length,
    float Blob_Pulse,
    float Blob_Fade,
    out vec4 Blob_Info)
{
    
    vec3 blob =  (Use_Global_Left_Index ? Global_Left_Index_Tip_Position.xyz :  Blob_Position);
    vec3 delta = blob - Position;
    float dist = dot(Normal,delta);
    
    float lerpValue = clamp((abs(dist)-Blob_Near_Distance)/(Blob_Far_Distance-Blob_Near_Distance), 0.0, 1.0);
    float fadeValue = 1.0-clamp((abs(dist)-Blob_Far_Distance)/Blob_Fade_Length,0.0,1.0);
    
    float size = Blob_Near_Size + (Blob_Far_Size-Blob_Near_Size)*lerpValue;
    
    vec2 blobXY = vec2(dot(delta,Tangent),dot(delta,Bitangent))/(0.0001+size);
    
    float Fade = fadeValue*Intensity*Blob_Fade;
    
    float Distance = (lerpValue*0.5+0.5)*(1.0-Blob_Pulse);
    Blob_Info = vec4(blobXY.x,blobXY.y,Distance,Fade);
    
}
//BLOCK_END Blob_Vertex

//BLOCK_BEGIN Blob_Vertex 174

void Blob_Vertex_B174(
    vec3 Position,
    vec3 Normal,
    vec3 Tangent,
    vec3 Bitangent,
    vec3 Blob_Position,
    float Intensity,
    float Blob_Near_Size,
    float Blob_Far_Size,
    float Blob_Near_Distance,
    float Blob_Far_Distance,
    float Blob_Fade_Length,
    float Blob_Pulse,
    float Blob_Fade,
    out vec4 Blob_Info)
{
    
    vec3 blob =  (Use_Global_Right_Index ? Global_Right_Index_Tip_Position.xyz :  Blob_Position);
    vec3 delta = blob - Position;
    float dist = dot(Normal,delta);
    
    float lerpValue = clamp((abs(dist)-Blob_Near_Distance)/(Blob_Far_Distance-Blob_Near_Distance), 0.0, 1.0);
    float fadeValue = 1.0-clamp((abs(dist)-Blob_Far_Distance)/Blob_Fade_Length,0.0,1.0);
    
    float size = Blob_Near_Size + (Blob_Far_Size-Blob_Near_Size)*lerpValue;
    
    vec2 blobXY = vec2(dot(delta,Tangent),dot(delta,Bitangent))/(0.0001+size);
    
    float Fade = fadeValue*Intensity*Blob_Fade;
    
    float Distance = (lerpValue*0.5+0.5)*(1.0-Blob_Pulse);
    Blob_Info = vec4(blobXY.x,blobXY.y,Distance,Fade);
    
}
//BLOCK_END Blob_Vertex

//BLOCK_BEGIN Move_Verts 280

void Move_Verts_B280(
    float Anisotropy,
    vec3 P,
    float Radius,
    float Bevel,
    vec3 Normal_Object,
    float ScaleZ,
    float Stretch,
    out vec3 New_P,
    out vec2 New_UV,
    out float Radial_Gradient,
    out vec3 Radial_Dir,
    out vec3 New_Normal)
{
    vec2 UV = P.xy * 2.0 + 0.5;
    vec2 center = clamp(UV, 0.0, 1.0);
    vec2 delta = UV - center;
    float deltad = (length(delta)*2.0);
    float f = (Bevel+(Radius-Bevel)*Stretch)/Radius;
    //float br = clamp((deltad-(1-f))/f, 0.0, 1.0);
    float innerd = clamp(deltad*2.0, 0.0, 1.0);
    float outerd = clamp(deltad*2.0-1.0, 0.0, 1.0);
    float bevelAngle = outerd*3.14159*0.5;
    float sinb = sin(bevelAngle);
    float cosb = cos(bevelAngle);
    float beveld = (1.0-f)*innerd + f * sinb;
    float br = outerd;
    vec2 r2 = 2.0 * vec2(Radius / Anisotropy, Radius);
    
    float dir = P.z<0.0001 ? 1.0 : -1.0;
    
    //New_UV = center + r2 * (UV - 2 * center + 0.5);
    New_UV = center + r2 * ((0.5-center)+normalize(delta+vec2(0.0,0.000001))*beveld*0.5);
    New_P = vec3(New_UV - 0.5, P.z+dir*(1.0-cosb)*Bevel*ScaleZ);
            
    Radial_Gradient = clamp((deltad-0.5)*2.0, 0.0, 1.0);
    Radial_Dir = vec3(delta * r2, 0.0);
    
    vec3 beveledNormal = cosb*Normal_Object + sinb*vec3(delta.x,delta.y,0.0);
    New_Normal = Normal_Object.z==0.0 ? Normal_Object : beveledNormal;
    
}
//BLOCK_END Move_Verts

//BLOCK_BEGIN Object_To_World_Dir 210

void Object_To_World_Dir_B210(
    vec3 Dir_Object,
    out vec3 Normal_World,
    out vec3 Normal_World_N,
    out float Normal_Length)
{
    Normal_World = (world * vec4(Dir_Object,0.0)).xyz;
    Normal_Length = length(Normal_World);
    Normal_World_N = Normal_World / Normal_Length;
}
//BLOCK_END Object_To_World_Dir

//BLOCK_BEGIN To_XYZ 228

void To_XYZ_B228(
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

//BLOCK_BEGIN Conditional_Float 243

void Conditional_Float_B243(
    bool Which,
    float If_True,
    float If_False,
    out float Result)
{
    Result = Which ? If_True : If_False;
    
}
//BLOCK_END Conditional_Float

//BLOCK_BEGIN Object_To_World_Dir 178

void Object_To_World_Dir_B178(
    vec3 Dir_Object,
    out vec3 Binormal_World,
    out vec3 Binormal_World_N,
    out float Binormal_Length)
{
    Binormal_World = (world * vec4(Dir_Object,0.0)).xyz;
    Binormal_Length = length(Binormal_World);
    Binormal_World_N = Binormal_World / Binormal_Length;
}
//BLOCK_END Object_To_World_Dir

//BLOCK_BEGIN Pick_Radius 219

void Pick_Radius_B219(
    float Radius,
    float Radius_Top_Left,
    float Radius_Top_Right,
    float Radius_Bottom_Left,
    float Radius_Bottom_Right,
    vec3 Position,
    out float Result)
{
    bool whichY = Position.y>0.0;
    Result = Position.x<0.0 ? (whichY ? Radius_Top_Left : Radius_Bottom_Left) : (whichY ? Radius_Top_Right : Radius_Bottom_Right);
    Result *= Radius;
}
//BLOCK_END Pick_Radius

//BLOCK_BEGIN Conditional_Float 186

void Conditional_Float_B186(
    bool Which,
    float If_True,
    float If_False,
    out float Result)
{
    Result = Which ? If_True : If_False;
    
}
//BLOCK_END Conditional_Float

//BLOCK_BEGIN Greater_Than 187

void Greater_Than_B187(
    float Left,
    float Right,
    out bool Not_Greater_Than,
    out bool Greater_Than)
{
    Greater_Than = Left > Right;
    Not_Greater_Than = !Greater_Than;
    
}
//BLOCK_END Greater_Than

//BLOCK_BEGIN Remap_Range 255

void Remap_Range_B255(
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


void main()
{
    // Tex_Coords (#235)
    vec2 XY_Q235;
    XY_Q235 = (uv-vec2(0.5,0.5))*_Decal_Scale_XY_ + vec2(0.5,0.5);
    
    // Object_To_World_Dir (#177)
    vec3 Tangent_World_Q177;
    vec3 Tangent_World_N_Q177;
    float Tangent_Length_Q177;
    Tangent_World_Q177 = (world * vec4(vec3(1,0,0),0.0)).xyz;
    Tangent_Length_Q177 = length(Tangent_World_Q177);
    Tangent_World_N_Q177 = Tangent_World_Q177 / Tangent_Length_Q177;

    vec3 Normal_World_Q210;
    vec3 Normal_World_N_Q210;
    float Normal_Length_Q210;
    Object_To_World_Dir_B210(vec3(0,0,1),Normal_World_Q210,Normal_World_N_Q210,Normal_Length_Q210);

    float X_Q228;
    float Y_Q228;
    float Z_Q228;
    To_XYZ_B228(position,X_Q228,Y_Q228,Z_Q228);

    // Object_To_World_Dir (#176)
    vec3 Nrm_World_Q176;
    Nrm_World_Q176 = normalize((world * vec4(normal,0.0)).xyz);
    
    vec3 Binormal_World_Q178;
    vec3 Binormal_World_N_Q178;
    float Binormal_Length_Q178;
    Object_To_World_Dir_B178(vec3(0,1,0),Binormal_World_Q178,Binormal_World_N_Q178,Binormal_Length_Q178);

    // Divide (#179)
    float Anisotropy_Q179 = Tangent_Length_Q177 / Binormal_Length_Q178;

    float Result_Q219;
    Pick_Radius_B219(_Radius_,_Radius_Top_Left_,_Radius_Top_Right_,_Radius_Bottom_Left_,_Radius_Bottom_Right_,position,Result_Q219);

    // Divide (#203)
    float Anisotropy_Q203 = Binormal_Length_Q178 / Normal_Length_Q210;

    bool Not_Greater_Than_Q187;
    bool Greater_Than_Q187;
    Greater_Than_B187(Z_Q228,0.0,Not_Greater_Than_Q187,Greater_Than_Q187);

    // FastsRGBtoLinear (#251)
    vec4 Linear_Q251;
    Linear_Q251.rgb = clamp(_Left_Color_.rgb*_Left_Color_.rgb, 0.0, 1.0);
    Linear_Q251.a=_Left_Color_.a;
    
    // FastsRGBtoLinear (#252)
    vec4 Linear_Q252;
    Linear_Q252.rgb = clamp(_Right_Color_.rgb*_Right_Color_.rgb, 0.0, 1.0);
    Linear_Q252.a=_Right_Color_.a;
    
    // Subtract3 (#211)
    vec3 Difference_Q211 = vec3(0,0,0) - Normal_World_N_Q210;

    // From_RGBA (#184)
    vec4 Out_Color_Q184 = vec4(X_Q228, Y_Q228, Z_Q228, 1);

    float Result_Q186;
    Conditional_Float_B186(Greater_Than_Q187,_Bevel_Back_,_Bevel_Front_,Result_Q186);

    float Result_Q244;
    Conditional_Float_B186(Greater_Than_Q187,_Bevel_Back_Stretch_,_Bevel_Front_Stretch_,Result_Q244);

    vec3 New_P_Q280;
    vec2 New_UV_Q280;
    float Radial_Gradient_Q280;
    vec3 Radial_Dir_Q280;
    vec3 New_Normal_Q280;
    Move_Verts_B280(Anisotropy_Q179,position,Result_Q219,Result_Q186,normal,Anisotropy_Q203,Result_Q244,New_P_Q280,New_UV_Q280,Radial_Gradient_Q280,Radial_Dir_Q280,New_Normal_Q280);

    // To_XY (#248)
    float X_Q248;
    float Y_Q248;
    X_Q248 = New_UV_Q280.x;
    Y_Q248 = New_UV_Q280.y;

    vec3 Pos_World_Q162;
    Object_To_World_Pos_B162(New_P_Q280,Pos_World_Q162);

    vec3 Nrm_World_Q182;
    Object_To_World_Normal_B182(New_Normal_Q280,Nrm_World_Q182);

    vec4 Blob_Info_Q173;
    #if BLOB_ENABLE
      Blob_Vertex_B173(Pos_World_Q162,Nrm_World_Q176,Tangent_World_N_Q177,Binormal_World_N_Q178,_Blob_Position_,_Blob_Intensity_,_Blob_Near_Size_,_Blob_Far_Size_,_Blob_Near_Distance_,_Blob_Far_Distance_,_Blob_Fade_Length_,_Blob_Pulse_,_Blob_Fade_,Blob_Info_Q173);
    #else
      Blob_Info_Q173 = vec4(0,0,0,0);
    #endif

    vec4 Blob_Info_Q174;
    #if BLOB_ENABLE_2
      Blob_Vertex_B174(Pos_World_Q162,Nrm_World_Q176,Tangent_World_N_Q177,Binormal_World_N_Q178,_Blob_Position_2_,_Blob_Intensity_,_Blob_Near_Size_2_,_Blob_Far_Size_,_Blob_Near_Distance_,_Blob_Far_Distance_,_Blob_Fade_Length_,_Blob_Pulse_2_,_Blob_Fade_2_,Blob_Info_Q174);
    #else
      Blob_Info_Q174 = vec4(0,0,0,0);
    #endif

    float Out_Q255;
    Remap_Range_B255(0.0,1.0,0.0,1.0,X_Q248,Out_Q255);

    float X_Q236;
    float Y_Q236;
    float Z_Q236;
    To_XYZ_B228(Nrm_World_Q182,X_Q236,Y_Q236,Z_Q236);

    // Mix_Colors (#247)
    vec4 Color_At_T_Q247 = mix(Linear_Q251, Linear_Q252, Out_Q255);

    // Negate (#237)
    float Minus_F_Q237 = -Z_Q236;

    // To_RGBA (#249)
    float R_Q249;
    float G_Q249;
    float B_Q249;
    float A_Q249;
    R_Q249=Color_At_T_Q247.r; G_Q249=Color_At_T_Q247.g; B_Q249=Color_At_T_Q247.b; A_Q249=Color_At_T_Q247.a;

    // Clamp (#238)
    float ClampF_Q238=clamp(0.0,Minus_F_Q237,1.0);

    float Result_Q243;
    Conditional_Float_B243(_Decal_Front_Only_,ClampF_Q238,1.0,Result_Q243);

    // From_XYZW (#239)
    vec4 Vec4_Q239 = vec4(Result_Q243, Radial_Gradient_Q280, G_Q249, B_Q249);

    vec3 Position = Pos_World_Q162;
    vec3 Normal = Nrm_World_Q182;
    vec2 UV = XY_Q235;
    vec3 Tangent = Tangent_World_N_Q177;
    vec3 Binormal = Difference_Q211;
    vec4 Color = Out_Color_Q184;
    vec4 Extra1 = Vec4_Q239;
    vec4 Extra2 = Blob_Info_Q173;
    vec4 Extra3 = Blob_Info_Q174;

    gl_Position = viewProjection * vec4(Position,1);
    vPosition = Position;
    vNormal = Normal;
    vUV = UV;
    vTangent = Tangent;
    vBinormal = Binormal;
    vColor = Color;
    vExtra1 = Extra1;
    vExtra2 = Extra2;
    vExtra3 = Extra3;
}