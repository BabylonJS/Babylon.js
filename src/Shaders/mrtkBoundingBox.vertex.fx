uniform mat4 world;
uniform mat4 viewProjection;
uniform vec3 cameraPosition;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
attribute vec3 tangent;
attribute vec4 color;

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

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUV;
varying vec3 vTangent;
varying vec3 vBinormal;
varying vec4 vExtra1;

//BLOCK_BEGIN Blob_Vertex 47

void Blob_Vertex_B47(
    vec3 Position,
    vec3 Normal,
    vec3 Tangent,
    vec3 Bitangent,
    vec3 Blob_Position,
    float Intensity,
    vec4 Near_Color,
    vec4 Far_Color,
    float Blob_Near_Size,
    float Blob_Far_Size,
    float Blob_Near_Distance,
    float Blob_Far_Distance,
    vec4 Vx_Color,
    vec2 UV,
    vec3 Face_Center,
    vec2 Face_Size,
    vec2 In_UV,
    float Blob_Fade_Length,
    float Inner_Fade,
    float Blob_Enabled,
    float Fade,
    float Pulse,
    float Visible,
    out vec3 Out_Position,
    out vec2 Out_UV,
    out vec3 Blob_Info)
{
    
    float Hit_Distance = dot(Blob_Position-Face_Center, Normal);
    vec3 Hit_Position = Blob_Position - Hit_Distance * Normal;
    
    float absD = abs(Hit_Distance);
    float lerpVal = clamp((absD-Blob_Near_Distance)/(Blob_Far_Distance-Blob_Near_Distance),0.0,1.0);
    float fadeIn = 1.0-clamp((absD-Blob_Far_Distance)/Blob_Fade_Length,0.0,1.0);
    
    //compute blob position & uv
    vec3 delta = Hit_Position - Face_Center;
    vec2 blobCenterXY = vec2(dot(delta,Tangent),dot(delta,Bitangent));
    
    float innerFade = 1.0-clamp(-Hit_Distance/Inner_Fade,0.0,1.0);
    
    float size = mix(Blob_Near_Size,Blob_Far_Size,lerpVal)*innerFade*Blob_Enabled*Visible;
    //float size = mix(Blob_Near_Size,sqrt(max(0.0,radius*radius-Hit_Distance*Hit_Distance)),lerpVal);
    
    vec2 quadUVin = 2.0*UV-1.0;  // remap to (-.5,.5)
    vec2 blobXY = blobCenterXY+quadUVin*size;
    //keep the quad within the face
    vec2 blobClipped = clamp(blobXY,-Face_Size*0.5,Face_Size*0.5);
    vec2 blobUV = (blobClipped-blobCenterXY)/max(size,0.0001)*2.0;
    
    vec3 blobCorner = Face_Center + blobClipped.x*Tangent + blobClipped.y*Bitangent;
    
    //blend using VxColor.r=1 for blob quad, 0 otherwise
    Out_Position = mix(Position,blobCorner,Vx_Color.rrr);
    Out_UV = mix(In_UV,blobUV,Vx_Color.rr);
    Blob_Info = vec3((lerpVal*0.5+0.5)*(1.0-Pulse),Intensity*fadeIn*Fade,0.0);
    
}
//BLOCK_END Blob_Vertex

//BLOCK_BEGIN Object_To_World_Pos 44

void Object_To_World_Pos_B44(
    vec3 Pos_Object,
    out vec3 Pos_World)
{
    Pos_World=(world * vec4(Pos_Object,1.0)).xyz;
    
}
//BLOCK_END Object_To_World_Pos

//BLOCK_BEGIN Holo_Edge_Vertex 49

void Holo_Edge_Vertex_B49(
    vec3 Normal,
    vec2 UV,
    vec3 Tangent,
    vec3 Bitangent,
    vec3 Incident,
    bool Hide_Faces,
    out vec4 Holo_Edges)
{
    float NdotI = dot(Incident,Normal);
    vec2 flip = (UV-vec2(0.5,0.5));
    
    float udot = dot(Incident,Tangent)*flip.x*NdotI;
    float uval = (udot>0.0 && !Hide_Faces ? 0.0 : 1.0);
    
    float vdot = -dot(Incident,Bitangent)*flip.y*NdotI;
    float vval = (vdot>0.0 && !Hide_Faces ? 0.0 : 1.0);
    
    float frontside = NdotI<0.0 || Hide_Faces ? 1.0 : 0.0;
    //float smoothall = Hide_Faces ? 0.0 : 1.0;
    Holo_Edges = vec4(1.0,1.0,1.0,1.0)-vec4(uval*UV.x,uval*(1.0-UV.x),vval*UV.y,vval*(1.0-UV.y)) * frontside;
}
//BLOCK_END Holo_Edge_Vertex

//BLOCK_BEGIN Choose_Blob 42

void Choose_Blob_B42(
    vec4 Vx_Color,
    vec3 Position1,
    vec3 Position2,
    bool Blob_Enable_1,
    bool Blob_Enable_2,
    float Near_Size_1,
    float Near_Size_2,
    float Blob_Inner_Fade_1,
    float Blob_Inner_Fade_2,
    float Blob_Pulse_1,
    float Blob_Pulse_2,
    float Blob_Fade_1,
    float Blob_Fade_2,
    out vec3 Position,
    out float Near_Size,
    out float Inner_Fade,
    out float Blob_Enable,
    out float Fade,
    out float Pulse)
{
    vec3 blob1 =  (Use_Global_Left_Index ? Global_Left_Index_Tip_Position.xyz :  Position1);
    vec3 blob2 =  (Use_Global_Right_Index ? Global_Right_Index_Tip_Position.xyz :  Position2);
    
    Position = blob1*(1.0-Vx_Color.g)+Vx_Color.g*blob2;
    
    float b1 = Blob_Enable_1 ? 1.0 : 0.0;
    float b2 = Blob_Enable_2 ? 1.0 : 0.0;
    Blob_Enable = b1+(b2-b1)*Vx_Color.g;
    
    Pulse = Blob_Pulse_1*(1.0-Vx_Color.g)+Vx_Color.g*Blob_Pulse_2;
    Fade = Blob_Fade_1*(1.0-Vx_Color.g)+Vx_Color.g*Blob_Fade_2;
    Near_Size = Near_Size_1*(1.0-Vx_Color.g)+Vx_Color.g*Near_Size_2;
    Inner_Fade = Blob_Inner_Fade_1*(1.0-Vx_Color.g)+Vx_Color.g*Blob_Inner_Fade_2;
}
//BLOCK_END Choose_Blob

//BLOCK_BEGIN Wireframe_Vertex 34

void Wireframe_Vertex_B34(
    vec3 Position,
    vec3 Normal,
    vec3 Tangent,
    vec3 Bitangent,
    vec3 Tangent_World,
    vec3 Bitangent_World,
    float Edge_Width,
    out vec3 Result,
    out vec2 UV,
    out vec2 Widths,
    out vec2 Face_Size)
{
    Face_Size = vec2(length(Tangent_World),length(Bitangent_World));
    Widths.xy = Edge_Width/Face_Size;
    
    float x = dot(Position,Tangent);
    float y = dot(Position,Bitangent);
    
    float dx = 0.5-abs(x);
    float newx = (0.5 - dx * Widths.x * 2.0)*sign(x);
    
    float dy = 0.5-abs(y);
    float newy = (0.5 - dy * Widths.y * 2.0)*sign(y);
    
    Result = Normal * 0.5 + newx * Tangent + newy * Bitangent;
    
    UV.x = dot(Result,Tangent) + 0.5;
    UV.y = dot(Result,Bitangent) + 0.5;
}
//BLOCK_END Wireframe_Vertex

//BLOCK_BEGIN Object_To_World_Dir 35

void Object_To_World_Dir_B35(
    vec3 Dir_Object,
    out vec3 Dir_World)
{
    Dir_World=(world * vec4(Dir_Object,0.0)).xyz;
}
//BLOCK_END Object_To_World_Dir

//BLOCK_BEGIN Object_To_World_Dir 61

void Object_To_World_Dir_B61(
    vec3 Nrm_Object,
    out vec3 Nrm_World)
{
    Nrm_World=(world * vec4(Nrm_Object,0.0)).xyz;
}
//BLOCK_END Object_To_World_Dir

//BLOCK_BEGIN ComputeWidth 59

void ComputeWidth_B59(
    vec3 Eye,
    vec3 Model_Center,
    float Near_Width,
    float Far_Width,
    float Near_Distance,
    float Far_Distance,
    out float Width)
{
    float d = distance(Model_Center, Eye);
    float k = clamp((d-Near_Distance)/(Far_Distance-Near_Distance), 0.0, 1.0);
    Width = mix(Near_Width, Far_Width, k);
    
}
//BLOCK_END ComputeWidth


void main()
{
    vec3 Pos_World_Q44;
    Object_To_World_Pos_B44(_Center_,Pos_World_Q44);

    vec3 Position_Q42;
    float Near_Size_Q42;
    float Inner_Fade_Q42;
    float Blob_Enable_Q42;
    float Fade_Q42;
    float Pulse_Q42;
    Choose_Blob_B42(color,_Blob_Position_,_Blob_Position_2_,_Blob_Enable_,_Blob_Enable_2_,_Blob_Near_Size_,_Blob_Near_Size_2_,_Blob_Inner_Fade_,_Blob_Inner_Fade_2_,_Blob_Pulse_,_Blob_Pulse_2_,_Blob_Fade_,_Blob_Fade_2_,Position_Q42,Near_Size_Q42,Inner_Fade_Q42,Blob_Enable_Q42,Fade_Q42,Pulse_Q42);

    // Hide_Faces (#46)
    float Visible_Q46 = _Hide_XY_Faces_ ? abs(normal.z) : 1.0;

    vec3 Dir_World_Q35;
    Object_To_World_Dir_B35(tangent,Dir_World_Q35);

    vec3 Dir_World_Q36;
    Object_To_World_Dir_B35((cross(normal,tangent)),Dir_World_Q36);

    // To_RGBA (#17)
    float R_Q17;
    float G_Q17;
    float B_Q17;
    float A_Q17;
    R_Q17=color.r; G_Q17=color.g; B_Q17=color.b; A_Q17=color.a;

    vec3 Nrm_World_Q61;
    Object_To_World_Dir_B61(normal,Nrm_World_Q61);

    // Scale3 (#22)
    vec3 Result_Q22 = 0.5 * normal;

    vec3 Pos_World_Q58;
    Object_To_World_Pos_B44(vec3(0,0,0),Pos_World_Q58);

    // Normalize3 (#20)
    vec3 Normalized_Q20 = normalize(Nrm_World_Q61);

    // Normalize3 (#18)
    vec3 Normalized_Q18 = normalize(Dir_World_Q35);

    // Normalize3 (#19)
    vec3 Normalized_Q19 = normalize(Dir_World_Q36);

    vec3 Pos_World_Q21;
    Object_To_World_Pos_B44(Result_Q22,Pos_World_Q21);

    float Width_Q59;
    ComputeWidth_B59(cameraPosition,Pos_World_Q58,_Near_Width_,_Far_Width_,_Near_Distance_,_Far_Distance_,Width_Q59);

    vec3 Result_Q34;
    vec2 UV_Q34;
    vec2 Widths_Q34;
    vec2 Face_Size_Q34;
    Wireframe_Vertex_B34(position,normal,tangent,(cross(normal,tangent)),Dir_World_Q35,Dir_World_Q36,Width_Q59,Result_Q34,UV_Q34,Widths_Q34,Face_Size_Q34);

    // Scale3 (#45)
    vec3 Result_Q45 = Visible_Q46 * Result_Q34;

    // Pack_For_Vertex (#23)
    vec3 Vec3_Q23 = vec3(Widths_Q34.x,Widths_Q34.y,R_Q17);

    vec3 Pos_World_Q12;
    Object_To_World_Pos_B44(Result_Q45,Pos_World_Q12);

    // Incident3 (#33)
    vec3 Incident_Q33 = normalize(Pos_World_Q12-cameraPosition);

    vec3 Out_Position_Q47;
    vec2 Out_UV_Q47;
    vec3 Blob_Info_Q47;
    Blob_Vertex_B47(Pos_World_Q12,Normalized_Q20,Normalized_Q18,Normalized_Q19,Position_Q42,_Blob_Intensity_,vec4(0.41,0,0.216,1),vec4(0,0.089,1,1),Near_Size_Q42,_Blob_Far_Size_,_Blob_Near_Distance_,_Blob_Far_Distance_,color,uv,Pos_World_Q21,Face_Size_Q34,UV_Q34,_Blob_Fade_Length_,Inner_Fade_Q42,Blob_Enable_Q42,Fade_Q42,Pulse_Q42,Visible_Q46,Out_Position_Q47,Out_UV_Q47,Blob_Info_Q47);

    vec4 Holo_Edges_Q49;
    Holo_Edge_Vertex_B49(Normalized_Q20,uv,Dir_World_Q35,Dir_World_Q36,Incident_Q33,_Hide_XY_Faces_,Holo_Edges_Q49);

    vec3 Position = Out_Position_Q47;
    vec2 UV = Out_UV_Q47;
    vec3 Tangent = Pos_World_Q44;
    vec3 Binormal = Blob_Info_Q47;
    vec4 Color = vec4(1,1,1,1);
    vec4 Extra1 = Holo_Edges_Q49;
    vec3 Normal = Vec3_Q23;

    gl_Position = viewProjection * vec4(Position,1);
    vPosition = Position;
    vNormal = Normal;
    vUV = UV;
    vTangent = Tangent;
    vBinormal = Binormal;
    vExtra1 = Extra1;
}