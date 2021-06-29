uniform mat4 world;
uniform mat4 viewProjection;
uniform vec3 cameraPosition;

attribute vec3 position;
attribute vec3 normal;
attribute vec3 tangent;

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


varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUV;
varying vec3 vTangent;
varying vec3 vBinormal;
varying vec4 vColor;
varying vec4 vExtra1;
varying vec4 vExtra2;
varying vec4 vExtra3;

//BLOCK_BEGIN Object_To_World_Pos 115

void Object_To_World_Pos_B115(
    vec3 Pos_Object,
    out vec3 Pos_World)
{
    Pos_World=(world * vec4(Pos_Object,1.0)).xyz;
    
}
//BLOCK_END Object_To_World_Pos

//BLOCK_BEGIN PickDir 140

void PickDir_B140(
    float Degrees,
    vec3 DirX,
    vec3 DirY,
    out vec3 Dir)
{
    // main code goes here
    float a = Degrees*3.14159/180.0;
    Dir = cos(a)*DirX+sin(a)*DirY;
    
}
//BLOCK_END PickDir

//BLOCK_BEGIN Round_Rect_Vertex 139

void Round_Rect_Vertex_B139(
    vec2 UV,
    float Radius,
    float Margin,
    float Anisotropy,
    float Gradient1,
    float Gradient2,
    out vec2 Rect_UV,
    out vec4 Rect_Parms,
    out vec2 Scale_XY,
    out vec2 Line_UV)
{
    Scale_XY = vec2(Anisotropy,1.0);
    Line_UV = (UV - vec2(0.5,0.5));
    Rect_UV = Line_UV * Scale_XY;
    Rect_Parms.xy = Scale_XY*0.5-vec2(Radius,Radius)-vec2(Margin,Margin);
    Rect_Parms.z = Gradient1; //Radius - Line_Width;
    Rect_Parms.w = Gradient2;
}
//BLOCK_END Round_Rect_Vertex

//BLOCK_BEGIN Line_Vertex 135

void Line_Vertex_B135(
    vec2 Scale_XY,
    vec2 UV,
    float Time,
    float Rate,
    vec4 Highlight_Transform,
    out vec3 Line_Vertex)
{
    float angle2 = (Rate*Time) * 2.0 * 3.1416;
    float sinAngle2 = sin(angle2);
    float cosAngle2 = cos(angle2);
    
    vec2 xformUV = UV * Highlight_Transform.xy + Highlight_Transform.zw;
    Line_Vertex.x = 0.0;
    Line_Vertex.y = cosAngle2*xformUV.x-sinAngle2*xformUV.y;
    Line_Vertex.z = 0.0; //sinAngle2*xformUV.x+cosAngle2*xformUV.y;
    
}
//BLOCK_END Line_Vertex

//BLOCK_BEGIN Blob_Vertex 180

void Blob_Vertex_B180(
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
    
    vec3 blob = Blob_Position;
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

//BLOCK_BEGIN Move_Verts 129

void Move_Verts_B129(
    float Anisotropy,
    vec3 P,
    float Radius,
    out vec3 New_P,
    out vec2 New_UV,
    out float Radial_Gradient,
    out vec3 Radial_Dir)
{
    vec2 UV = P.xy * 2.0 + 0.5;
    vec2 center = clamp(UV, 0.0, 1.0);
    vec2 delta = UV - center;
            
    vec2 r2 = 2.0 * vec2(Radius / Anisotropy, Radius);
            
    New_UV = center + r2 * (UV - 2.0 * center + 0.5);
    New_P = vec3(New_UV - 0.5, P.z);
            
    Radial_Gradient = 1.0 - length(delta) * 2.0;
    Radial_Dir = vec3(delta * r2, 0.0);
    
}
//BLOCK_END Move_Verts

//BLOCK_BEGIN Object_To_World_Dir 132

void Object_To_World_Dir_B132(
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

//BLOCK_BEGIN RelativeOrAbsoluteDetail 147

void RelativeOrAbsoluteDetail_B147(
    float Nominal_Radius,
    float Nominal_LineWidth,
    bool Absolute_Measurements,
    float Height,
    out float Radius,
    out float Line_Width)
{
    float scale = Absolute_Measurements ? 1.0/Height : 1.0;
    Radius = Nominal_Radius * scale;
    Line_Width = Nominal_LineWidth * scale;
    
    
}
//BLOCK_END RelativeOrAbsoluteDetail

//BLOCK_BEGIN Edge_AA_Vertex 130

void Edge_AA_Vertex_B130(
    vec3 Position_World,
    vec3 Position_Object,
    vec3 Normal_Object,
    vec3 Eye,
    float Radial_Gradient,
    vec3 Radial_Dir,
    vec3 Tangent,
    out float Gradient1,
    out float Gradient2)
{
    // main code goes here
    vec3 I = (Eye-Position_World);
    vec3 T = (world* vec4(Tangent,0.0)).xyz;
    float g = (dot(T,I)<0.0) ? 0.0 : 1.0;
    if (Normal_Object.z==0.0) { // edge
        //vec3 T = Position_Object.z>0.0 ? vec3(0.0,0.0,1.0) : vec3(0.0,0.0,-1.0);
        Gradient1 = Position_Object.z>0.0 ? g : 1.0;
        Gradient2 = Position_Object.z>0.0 ? 1.0 : g;
    } else {
    //    vec3 R = (world* vec4(Tangent,0.0)).xyz; //Radial_Dir);
    //    float k = (dot(R,I)>0.0 ? 1.0 : 0.0);
    //    float kk = dot(normalize(R),normalize(I));
    //    float k =  kk>0.0 ? kk*Edge_Bend : 0.0;
        Gradient1 = g + (1.0-g)*(Radial_Gradient);
        Gradient2 = 1.0;
    }
    
}
//BLOCK_END Edge_AA_Vertex

//BLOCK_BEGIN Pick_Radius 144

void Pick_Radius_B144(
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


void main()
{
    // Object_To_World_Dir (#128)
    vec3 Nrm_World_Q128;
    Nrm_World_Q128 = normalize((world * vec4(normal,0.0)).xyz);
    
    // Object_To_World_Dir (#131)
    vec3 Tangent_World_Q131;
    vec3 Tangent_World_N_Q131;
    float Tangent_Length_Q131;
    Tangent_World_Q131 = (world * vec4(vec3(1,0,0),0.0)).xyz;
    Tangent_Length_Q131 = length(Tangent_World_Q131);
    Tangent_World_N_Q131 = Tangent_World_Q131 / Tangent_Length_Q131;

    vec3 Binormal_World_Q132;
    vec3 Binormal_World_N_Q132;
    float Binormal_Length_Q132;
    Object_To_World_Dir_B132(vec3(0,1,0),Binormal_World_Q132,Binormal_World_N_Q132,Binormal_Length_Q132);

    // Divide (#133)
    float Anisotropy_Q133 = Tangent_Length_Q131 / Binormal_Length_Q132;

    // Conditional (#177)
    vec3 Result_Q177;
    Result_Q177 = mix(_Blob_Position_, Global_Left_Index_Tip_Position.xyz, float(_Use_Global_Left_Index_));
    
    // Conditional (#178)
    vec3 Result_Q178;
    Result_Q178 = mix(_Blob_Position_2_, Global_Right_Index_Tip_Position.xyz, float(_Use_Global_Right_Index_));
    
    float Result_Q144;
    Pick_Radius_B144(_Radius_,_Radius_Top_Left_,_Radius_Top_Right_,_Radius_Bottom_Left_,_Radius_Bottom_Right_,position,Result_Q144);

    vec3 Dir_Q140;
    PickDir_B140(_Angle_,Tangent_World_N_Q131,Binormal_World_N_Q132,Dir_Q140);

    float Radius_Q147;
    float Line_Width_Q147;
    RelativeOrAbsoluteDetail_B147(Result_Q144,_Line_Width_,_Absolute_Sizes_,Binormal_Length_Q132,Radius_Q147,Line_Width_Q147);

    // From_RGBA (#145)
    vec4 Out_Color_Q145 = vec4(Radius_Q147, Line_Width_Q147, 0, 1);

    vec3 New_P_Q129;
    vec2 New_UV_Q129;
    float Radial_Gradient_Q129;
    vec3 Radial_Dir_Q129;
    Move_Verts_B129(Anisotropy_Q133,position,Radius_Q147,New_P_Q129,New_UV_Q129,Radial_Gradient_Q129,Radial_Dir_Q129);

    vec3 Pos_World_Q115;
    Object_To_World_Pos_B115(New_P_Q129,Pos_World_Q115);

    vec4 Blob_Info_Q180;
    #if BLOB_ENABLE
      Blob_Vertex_B180(Pos_World_Q115,Nrm_World_Q128,Tangent_World_N_Q131,Binormal_World_N_Q132,Result_Q177,_Blob_Intensity_,_Blob_Near_Size_,_Blob_Far_Size_,_Blob_Near_Distance_,_Blob_Far_Distance_,_Blob_Fade_Length_,_Blob_Pulse_,_Blob_Fade_,Blob_Info_Q180);
    #else
      Blob_Info_Q180 = vec4(0,0,0,0);
    #endif

    vec4 Blob_Info_Q181;
    #if BLOB_ENABLE_2
      Blob_Vertex_B180(Pos_World_Q115,Nrm_World_Q128,Tangent_World_N_Q131,Binormal_World_N_Q132,Result_Q178,_Blob_Intensity_,_Blob_Near_Size_2_,_Blob_Far_Size_,_Blob_Near_Distance_,_Blob_Far_Distance_,_Blob_Fade_Length_,_Blob_Pulse_2_,_Blob_Fade_2_,Blob_Info_Q181);
    #else
      Blob_Info_Q181 = vec4(0,0,0,0);
    #endif

    float Gradient1_Q130;
    float Gradient2_Q130;
    #if SMOOTH_EDGES
      Edge_AA_Vertex_B130(Pos_World_Q115,position,normal,cameraPosition,Radial_Gradient_Q129,Radial_Dir_Q129,tangent,Gradient1_Q130,Gradient2_Q130);
    #else
      Gradient1_Q130 = 1.0;
      Gradient2_Q130 = 1.0;
    #endif

    vec2 Rect_UV_Q139;
    vec4 Rect_Parms_Q139;
    vec2 Scale_XY_Q139;
    vec2 Line_UV_Q139;
    Round_Rect_Vertex_B139(New_UV_Q129,Radius_Q147,0.0,Anisotropy_Q133,Gradient1_Q130,Gradient2_Q130,Rect_UV_Q139,Rect_Parms_Q139,Scale_XY_Q139,Line_UV_Q139);

    vec3 Line_Vertex_Q135;
    Line_Vertex_B135(Scale_XY_Q139,Line_UV_Q139,0.0,_Rate_,_Highlight_Transform_,Line_Vertex_Q135);

    vec3 Position = Pos_World_Q115;
    vec3 Normal = Dir_Q140;
    vec2 UV = Rect_UV_Q139;
    vec3 Tangent = Line_Vertex_Q135;
    vec3 Binormal = Nrm_World_Q128;
    vec4 Color = Out_Color_Q145;
    vec4 Extra1 = Rect_Parms_Q139;
    vec4 Extra2 = Blob_Info_Q180;
    vec4 Extra3 = Blob_Info_Q181;

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