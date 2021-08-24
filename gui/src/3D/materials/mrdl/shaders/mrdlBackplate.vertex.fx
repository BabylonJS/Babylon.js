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


varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUV;
varying vec3 vTangent;
varying vec3 vBinormal;
varying vec4 vExtra1;
varying vec4 vExtra2;

//BLOCK_BEGIN Object_To_World_Pos 314

void Object_To_World_Pos_B314(
    vec3 Pos_Object,
    out vec3 Pos_World)
{
    Pos_World=(world * vec4(Pos_Object,1.0)).xyz;
    
}
//BLOCK_END Object_To_World_Pos

//BLOCK_BEGIN Round_Rect_Vertex 357

void Round_Rect_Vertex_B357(
    vec2 UV,
    float Radius,
    float Margin,
    float Anisotropy,
    float Gradient1,
    float Gradient2,
    vec3 Normal,
    vec4 Color_Scale_Translate,
    out vec2 Rect_UV,
    out vec4 Rect_Parms,
    out vec2 Scale_XY,
    out vec2 Line_UV,
    out vec2 Color_UV_Info)
{
    Scale_XY = vec2(Anisotropy,1.0);
    Line_UV = (UV - vec2(0.5,0.5));
    Rect_UV = Line_UV * Scale_XY;
    Rect_Parms.xy = Scale_XY*0.5-vec2(Radius,Radius)-vec2(Margin,Margin);
    Rect_Parms.z = Gradient1; //Radius - Line_Width;
    Rect_Parms.w = Gradient2;
    
    Color_UV_Info = (Line_UV + vec2(0.5,0.5)) * Color_Scale_Translate.xy + Color_Scale_Translate.zw;
    
    
}
//BLOCK_END Round_Rect_Vertex

//BLOCK_BEGIN Line_Vertex 333

void Line_Vertex_B333(
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

//BLOCK_BEGIN PickDir 334

void PickDir_B334(
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

//BLOCK_BEGIN Move_Verts 327

void Move_Verts_B327(
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

//BLOCK_BEGIN Pick_Radius 336

void Pick_Radius_B336(
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

//BLOCK_BEGIN Edge_AA_Vertex 328

void Edge_AA_Vertex_B328(
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
    vec3 T = (vec4(Tangent,0.0)).xyz;
    float g = (dot(T,I)<0.0) ? 0.0 : 1.0;
    if (Normal_Object.z==0.0) { // edge
        //vec3 T = Position_Object.z>0.0 ? vec3(0.0,0.0,1.0) : vec3(0.0,0.0,-1.0);
        Gradient1 = Position_Object.z>0.0 ? g : 1.0;
        Gradient2 = Position_Object.z>0.0 ? 1.0 : g;
    } else {
    //    vec3 R = (transpose(w2o_matrix4)* vec4(Tangent,0.0)).xyz; //Radial_Dir);
    //    float k = (dot(R,I)>0.0 ? 1.0 : 0.0);
    //    float kk = dot(normalize(R),normalize(I));
    //    float k =  kk>0.0 ? kk*Edge_Bend : 0.0;
        Gradient1 = g + (1.0-g)*(Radial_Gradient);
        Gradient2 = 1.0;
    }
    
}
//BLOCK_END Edge_AA_Vertex

//BLOCK_BEGIN Object_To_World_Dir 330

void Object_To_World_Dir_B330(
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

//BLOCK_BEGIN RelativeOrAbsoluteDetail 341

void RelativeOrAbsoluteDetail_B341(
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


void main()
{
    // Object_To_World_Dir (#326)
    vec3 Nrm_World_Q326;
    Nrm_World_Q326 = normalize((world * vec4(normal,0.0)).xyz);
    
    // Object_To_World_Dir (#329)
    vec3 Tangent_World_Q329;
    vec3 Tangent_World_N_Q329;
    float Tangent_Length_Q329;
    Tangent_World_Q329 = (world * vec4(vec3(1,0,0),0.0)).xyz;
    Tangent_Length_Q329 = length(Tangent_World_Q329);
    Tangent_World_N_Q329 = Tangent_World_Q329 / Tangent_Length_Q329;

    vec3 Binormal_World_Q330;
    vec3 Binormal_World_N_Q330;
    float Binormal_Length_Q330;
    Object_To_World_Dir_B330(vec3(0,1,0),Binormal_World_Q330,Binormal_World_N_Q330,Binormal_Length_Q330);

    float Radius_Q341;
    float Line_Width_Q341;
    RelativeOrAbsoluteDetail_B341(_Radius_,_Line_Width_,_Absolute_Sizes_,Binormal_Length_Q330,Radius_Q341,Line_Width_Q341);

    vec3 Dir_Q334;
    PickDir_B334(_Angle_,Tangent_World_N_Q329,Binormal_World_N_Q330,Dir_Q334);

    float Result_Q336;
    Pick_Radius_B336(Radius_Q341,_Radius_Top_Left_,_Radius_Top_Right_,_Radius_Bottom_Left_,_Radius_Bottom_Right_,position,Result_Q336);

    // Divide (#331)
    float Anisotropy_Q331 = Tangent_Length_Q329 / Binormal_Length_Q330;

    // From_RGBA (#337)
    vec4 Out_Color_Q337 = vec4(Result_Q336, Line_Width_Q341, 0, 1);

    vec3 New_P_Q327;
    vec2 New_UV_Q327;
    float Radial_Gradient_Q327;
    vec3 Radial_Dir_Q327;
    Move_Verts_B327(Anisotropy_Q331,position,Result_Q336,New_P_Q327,New_UV_Q327,Radial_Gradient_Q327,Radial_Dir_Q327);

    vec3 Pos_World_Q314;
    Object_To_World_Pos_B314(New_P_Q327,Pos_World_Q314);

    float Gradient1_Q328;
    float Gradient2_Q328;
    #if SMOOTH_EDGES
      Edge_AA_Vertex_B328(Pos_World_Q314,position,normal,cameraPosition,Radial_Gradient_Q327,Radial_Dir_Q327,tangent,Gradient1_Q328,Gradient2_Q328);
    #else
      Gradient1_Q328 = 1.0;
      Gradient2_Q328 = 1.0;
    #endif

    vec2 Rect_UV_Q357;
    vec4 Rect_Parms_Q357;
    vec2 Scale_XY_Q357;
    vec2 Line_UV_Q357;
    vec2 Color_UV_Info_Q357;
    Round_Rect_Vertex_B357(New_UV_Q327,Result_Q336,0.0,Anisotropy_Q331,Gradient1_Q328,Gradient2_Q328,normal,vec4(1,1,0,0),Rect_UV_Q357,Rect_Parms_Q357,Scale_XY_Q357,Line_UV_Q357,Color_UV_Info_Q357);

    vec3 Line_Vertex_Q333;
    Line_Vertex_B333(Scale_XY_Q357,Line_UV_Q357,(20.0),_Rate_,_Highlight_Transform_,Line_Vertex_Q333);

    // To_XY (#359)
    float X_Q359;
    float Y_Q359;
    X_Q359 = Color_UV_Info_Q357.x;
    Y_Q359 = Color_UV_Info_Q357.y;

    // From_XYZW (#358)
    vec4 Vec4_Q358 = vec4(X_Q359, Y_Q359, Result_Q336, Line_Width_Q341);

    vec3 Position = Pos_World_Q314;
    vec3 Normal = Nrm_World_Q326;
    vec2 UV = Rect_UV_Q357;
    vec3 Tangent = Line_Vertex_Q333;
    vec3 Binormal = Dir_Q334;
    vec4 Color = Out_Color_Q337;
    vec4 Extra1 = Rect_Parms_Q357;
    vec4 Extra2 = Vec4_Q358;
    vec4 Extra3 = vec4(0,0,0,0);

    gl_Position = viewProjection * vec4(Position,1);
    vPosition = Position;
    vNormal = Normal;
    vUV = UV;
    vTangent = Tangent;
    vBinormal = Binormal;
    vExtra1 = Extra1;
    vExtra2 = Extra2;
}