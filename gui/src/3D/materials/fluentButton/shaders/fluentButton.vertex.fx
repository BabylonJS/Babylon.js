uniform mat4 world;
uniform mat4 viewProjection;
uniform vec3 cameraPosition;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
attribute vec3 tangent;
attribute vec4 color;

uniform float _Edge_Width_;
uniform vec4 _Edge_Color_;
uniform float _Proximity_Max_Intensity_;
uniform float _Proximity_Far_Distance_;
uniform float _Proximity_Near_Radius_;
uniform float _Proximity_Anisotropy_;
uniform float _Selection_Fuzz_;
uniform float _Selected_;
uniform float _Selection_Fade_;
uniform float _Selection_Fade_Size_;
uniform float _Selected_Distance_;
uniform float _Selected_Fade_Length_;
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
uniform vec3 _Active_Face_Dir_;
uniform vec3 _Active_Face_Up_;
uniform bool _Enable_Fade_;
uniform float _Fade_Width_;
uniform bool _Smooth_Active_Face_;
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
varying vec4 vColor;
varying vec4 vExtra1;

//BLOCK_BEGIN Blob_Vertex 47

void Blob_Vertex_B47(
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
    vec4 Vx_Color,
    vec2 UV,
    vec3 Face_Center,
    vec2 Face_Size,
    vec2 In_UV,
    float Blob_Fade_Length,
    float Selection_Fade,
    float Selection_Fade_Size,
    float Inner_Fade,
    vec3 Active_Face_Center,
    float Blob_Pulse,
    float Blob_Fade,
    float Blob_Enabled,
    out vec3 Out_Position,
    out vec2 Out_UV,
    out vec3 Blob_Info)
{
    
    float blobSize, fadeIn;
    vec3 Hit_Position;
    Blob_Info = vec3(0.0,0.0,0.0);
    
    float Hit_Distance = dot(Blob_Position-Face_Center, Normal);
    Hit_Position = Blob_Position - Hit_Distance * Normal;
    
    float absD = abs(Hit_Distance);
    float lerpVal = clamp((absD-Blob_Near_Distance)/(Blob_Far_Distance-Blob_Near_Distance),0.0,1.0);
    fadeIn = 1.0-clamp((absD-Blob_Far_Distance)/Blob_Fade_Length,0.0,1.0);
    
    float innerFade = 1.0-clamp(-Hit_Distance/Inner_Fade,0.0,1.0);
    
    //compute blob size
    float farClip = clamp(1.0-step(Blob_Far_Distance+Blob_Fade_Length,absD), 0.0, 1.0);
    float size = mix(Blob_Near_Size,Blob_Far_Size,lerpVal)*farClip;
    blobSize = mix(size,Selection_Fade_Size,Selection_Fade)*innerFade*Blob_Enabled;
    Blob_Info.x = lerpVal*0.5+0.5;
        
    Blob_Info.y = fadeIn*Intensity*(1.0-Selection_Fade)*Blob_Fade;
    Blob_Info.x *= (1.0-Blob_Pulse);
    
    //compute blob position
    vec3 delta = Hit_Position - Face_Center;
    vec2 blobCenterXY = vec2(dot(delta,Tangent),dot(delta,Bitangent));
    
    vec2 quadUVin = 2.0*UV-1.0;  // remap to (-.5,.5)
    vec2 blobXY = blobCenterXY+quadUVin*blobSize;
    
    //keep the quad within the face
    vec2 blobClipped = clamp(blobXY,-Face_Size*0.5,Face_Size*0.5);
    vec2 blobUV = (blobClipped-blobCenterXY)/max(blobSize,0.0001)*2.0;
    
    vec3 blobCorner = Face_Center + blobClipped.x*Tangent + blobClipped.y*Bitangent;
    
    //blend using VxColor.r=1 for blob quad, 0 otherwise
    Out_Position = mix(Position,blobCorner,Vx_Color.rrr);
    Out_UV = mix(In_UV,blobUV,Vx_Color.rr);
    
}
//BLOCK_END Blob_Vertex

//BLOCK_BEGIN Proximity_Vertex 66

vec2 ProjectProximity(
    vec3 blobPosition,
    vec3 position,
    vec3 center,
    vec3 dir,
    vec3 xdir,
    vec3 ydir,
    out float vdistance
)
{
    vec3 delta = blobPosition - position;
    vec2 xy = vec2(dot(delta,xdir),dot(delta,ydir));
    vdistance = abs(dot(delta,dir));
    return xy;
}

void Proximity_Vertex_B66(
    vec3 Blob_Position,
    vec3 Blob_Position_2,
    vec3 Active_Face_Center,
    vec3 Active_Face_Dir,
    vec3 Position,
    float Proximity_Far_Distance,
    float Relative_Scale,
    float Proximity_Anisotropy,
    vec3 Up,
    out vec4 Extra1,
    out float Distance_To_Face,
    out float Intensity)
{
    vec3 Active_Face_Dir_X = normalize(cross(Active_Face_Dir,Up));
    //vec3 Active_Face_Dir_X = normalize(vec3(Active_Face_Dir.y-Active_Face_Dir.z,Active_Face_Dir.z-Active_Face_Dir.x,Active_Face_Dir.x-Active_Face_Dir.y));
    vec3 Active_Face_Dir_Y = cross(Active_Face_Dir,Active_Face_Dir_X);
    
    float distz1,distz2;
    Extra1.xy = ProjectProximity(Blob_Position,Position,Active_Face_Center,Active_Face_Dir,Active_Face_Dir_X*Proximity_Anisotropy,Active_Face_Dir_Y,distz1)/Relative_Scale;
    Extra1.zw = ProjectProximity(Blob_Position_2,Position,Active_Face_Center,Active_Face_Dir,Active_Face_Dir_X*Proximity_Anisotropy,Active_Face_Dir_Y,distz2)/Relative_Scale;
    
    Distance_To_Face = dot(Active_Face_Dir,Position-Active_Face_Center);
    Intensity = 1.0 - clamp(min(distz1,distz2)/Proximity_Far_Distance, 0.0, 1.0);
    
}
//BLOCK_END Proximity_Vertex

//BLOCK_BEGIN Holo_Edge_Vertex 44

void Holo_Edge_Vertex_B44(
    vec3 Incident,
    vec3 Normal,
    vec2 UV,
    vec3 Tangent,
    vec3 Bitangent,
    bool Smooth_Active_Face,
    float Active,
    out vec4 Holo_Edges)
{
    float NdotI = dot(Incident,Normal);
    
    vec2 flip = (UV-vec2(0.5,0.5));
    float udot = dot(Incident,Tangent)*flip.x*NdotI;
    float uval = 1.0 - float(udot > 0.0);
    
    float vdot = -dot(Incident,Bitangent)*flip.y*NdotI;
    float vval = 1.0 - float(vdot > 0.0);
    
    float Smooth_And_Active = step(1.0, float(Smooth_Active_Face && Active > 0.0));
    uval = mix(uval, max(1.0,uval), Smooth_And_Active); 
    vval = mix(vval, max(1.0,vval), Smooth_And_Active);
    Holo_Edges = vec4(1.0,1.0,1.0,1.0)-vec4(uval*UV.x,uval*(1.0-UV.x),vval*UV.y,vval*(1.0-UV.y));
}
//BLOCK_END Holo_Edge_Vertex

//BLOCK_BEGIN Object_To_World_Pos 13

void Object_To_World_Pos_B13(
    vec3 Pos_Object,
    out vec3 Pos_World)
{
    Pos_World=(world * vec4(Pos_Object,1.0)).xyz;
    
}
//BLOCK_END Object_To_World_Pos

//BLOCK_BEGIN Choose_Blob 38

void Choose_Blob_B38(
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
    Position = Position1*(1.0-Vx_Color.g)+Vx_Color.g*Position2;
    
    float b1 = float(Blob_Enable_1);
    float b2 = float(Blob_Enable_2);
    Blob_Enable = b1+(b2-b1)*Vx_Color.g;
    
    Pulse = Blob_Pulse_1*(1.0-Vx_Color.g)+Vx_Color.g*Blob_Pulse_2;
    Fade = Blob_Fade_1*(1.0-Vx_Color.g)+Vx_Color.g*Blob_Fade_2;
    Near_Size = Near_Size_1*(1.0-Vx_Color.g)+Vx_Color.g*Near_Size_2;
    Inner_Fade = Blob_Inner_Fade_1*(1.0-Vx_Color.g)+Vx_Color.g*Blob_Inner_Fade_2;
}
//BLOCK_END Choose_Blob

//BLOCK_BEGIN Wireframe_Vertex 51

void Wireframe_Vertex_B51(
    vec3 Position,
    vec3 Normal,
    vec3 Tangent,
    vec3 Bitangent,
    float Edge_Width,
    vec2 Face_Size,
    out vec3 Wire_Vx_Pos,
    out vec2 UV,
    out vec2 Widths)
{
    Widths.xy = Edge_Width/Face_Size;
    
    float x = dot(Position,Tangent);
    float y = dot(Position,Bitangent);
    
    float dx = 0.5-abs(x);
    float newx = (0.5 - dx * Widths.x * 2.0)*sign(x);
    
    float dy = 0.5-abs(y);
    float newy = (0.5 - dy * Widths.y * 2.0)*sign(y);
    
    Wire_Vx_Pos = Normal * 0.5 + newx * Tangent + newy * Bitangent;
    
    UV.x = dot(Wire_Vx_Pos,Tangent) + 0.5;
    UV.y = dot(Wire_Vx_Pos,Bitangent) + 0.5;
}
//BLOCK_END Wireframe_Vertex

//BLOCK_BEGIN Selection_Vertex 48

vec2 ramp2(vec2 start, vec2 end, vec2 x)
{
   return clamp((x-start)/(end-start),vec2(0.0,0.0),vec2(1.0,1.0));
}

float computeSelection(
    vec3 blobPosition,
    vec3 normal,
    vec3 tangent,
    vec3 bitangent,
    vec3 faceCenter,
    vec2 faceSize,
    float selectionFuzz,
    float farDistance,
    float fadeLength
)
{
    vec3 delta = blobPosition - faceCenter;
    float absD = abs(dot(delta,normal));
    float fadeIn = 1.0-clamp((absD-farDistance)/fadeLength,0.0,1.0);
    
    vec2 blobCenterXY = vec2(dot(delta,tangent),dot(delta,bitangent));

    vec2 innerFace = faceSize * (1.0-selectionFuzz) * 0.5;
    vec2 selectPulse = ramp2(-faceSize*0.5,-innerFace,blobCenterXY)-ramp2(innerFace,faceSize*0.5,blobCenterXY);

    return selectPulse.x * selectPulse.y * fadeIn;
}

void Selection_Vertex_B48(
    vec3 Blob_Position,
    vec3 Blob_Position_2,
    vec3 Face_Center,
    vec2 Face_Size,
    vec3 Normal,
    vec3 Tangent,
    vec3 Bitangent,
    float Selection_Fuzz,
    float Selected,
    float Far_Distance,
    float Fade_Length,
    vec3 Active_Face_Dir,
    out float Show_Selection)
{
    float select1 = computeSelection(Blob_Position,Normal,Tangent,Bitangent,Face_Center,Face_Size,Selection_Fuzz,Far_Distance,Fade_Length);
    float select2 = computeSelection(Blob_Position_2,Normal,Tangent,Bitangent,Face_Center,Face_Size,Selection_Fuzz,Far_Distance,Fade_Length);
    
    float Active = max(0.0,dot(Active_Face_Dir,Normal));
    
    Show_Selection = mix(max(select1,select2),1.0,Selected)*Active;
}
//BLOCK_END Selection_Vertex

//BLOCK_BEGIN Proximity_Visibility 54

void Proximity_Visibility_B54(
    float Selection,
    vec3 Proximity_Center,
    vec3 Proximity_Center_2,
    float Input_Width,
    float Proximity_Far_Distance,
    float Proximity_Radius,
    vec3 Active_Face_Center,
    vec3 Active_Face_Dir,
    out float Width)
{
    //make all edges invisible if no proximity or selection visible
    vec3 boxEdges = (world * vec4(vec3(0.5,0.5,0.5),0.0)).xyz;
    float boxMaxSize = length(boxEdges);
    
    float d1 = dot(Proximity_Center-Active_Face_Center, Active_Face_Dir);
    vec3 blob1 = Proximity_Center - d1 * Active_Face_Dir;
    
    float d2 = dot(Proximity_Center_2-Active_Face_Center, Active_Face_Dir);
    vec3 blob2 = Proximity_Center_2 - d2 * Active_Face_Dir;
    
    //vec3 objectOriginInWorld = (world * vec4(vec3(0.0,0.0,0.0),1.0)).xyz;
    vec3 delta1 = blob1 - Active_Face_Center;
    vec3 delta2 = blob2 - Active_Face_Center;
    
    float dist1 = dot(delta1,delta1);
    float dist2 = dot(delta2,delta2);
    
    float nearestProxDist = sqrt(min(dist1,dist2));
    
    //Width = Input_Width * (1.0 - step(boxMaxSize+Proximity_Radius,nearestProxDist)*(1.0-step(Selection,0.0)));
    Width = Input_Width * (1.0 - step(boxMaxSize+Proximity_Radius,nearestProxDist))*(1.0-step(Proximity_Far_Distance,min(d1,d2))*(1.0-step(0.0001,Selection)));
    
}
//BLOCK_END Proximity_Visibility

//BLOCK_BEGIN Object_To_World_Dir 67

void Object_To_World_Dir_B67(
    vec3 Dir_Object,
    out vec3 Dir_World)
{
    Dir_World=(world * vec4(Dir_Object,0.0)).xyz;
    
}
//BLOCK_END Object_To_World_Dir


void main()
{
    // Active_Face_Center (#49)
    vec3 Active_Face_Center_Q49;
    Active_Face_Center_Q49 = (world * vec4(_Active_Face_Dir_*0.5,1.0)).xyz;
    
    // Pick_Local_Or_Global_Left (#41)
    vec3 Blob_Position_Q41 =  mix(_Blob_Position_, Global_Left_Index_Tip_Position.xyz, float(Use_Global_Left_Index));

    // Pick_Local_Or_Global_Right (#42)
    vec3 Blob_Position_Q42 =  mix(_Blob_Position_2_, Global_Right_Index_Tip_Position.xyz, float(Use_Global_Right_Index));

    // Object_To_World_Dir (#64)
    vec3 Active_Face_Dir_Q64 = normalize((world * vec4(_Active_Face_Dir_,0.0)).xyz);

    // Relative_Scale (#57)
    float Relative_Scale_Q57;
    #if RELATIVE_WIDTH
      Relative_Scale_Q57 = length((world * vec4(vec3(0,1,0),0.0)).xyz);
    #else
      Relative_Scale_Q57 = 1.0;
    #endif

    // Object_To_World_Dir (#30)
    vec3 Tangent_World_Q30;
    Tangent_World_Q30=(world * vec4(tangent,0.0)).xyz;
    
    // Object_To_World_Dir (#31)
    vec3 Binormal_World_Q31;
    Binormal_World_Q31=(world * vec4((cross(normal,tangent)),0.0)).xyz;
    
    // Object_To_World_Dir (#60)
    vec3 Normal_World_Q60;
    Normal_World_Q60=(world * vec4(normal,0.0)).xyz;
    
    // Scale3 (#18)
    vec3 Result_Q18 = 0.5 * normal;

    vec3 Dir_World_Q67;
    Object_To_World_Dir_B67(_Active_Face_Up_,Dir_World_Q67);

    // Multiply (#56)
    float Product_Q56 = _Edge_Width_ * Relative_Scale_Q57;

    // Normalize3 (#29)
    vec3 Normal_World_N_Q29 = normalize(Normal_World_Q60);

    // Normalize3 (#28)
    vec3 Tangent_World_N_Q28 = normalize(Tangent_World_Q30);

    // Normalize3 (#32)
    vec3 Binormal_World_N_Q32 = normalize(Binormal_World_Q31);

    vec3 Position_Q38;
    float Near_Size_Q38;
    float Inner_Fade_Q38;
    float Blob_Enable_Q38;
    float Fade_Q38;
    float Pulse_Q38;
    Choose_Blob_B38(color,Blob_Position_Q41,Blob_Position_Q42,_Blob_Enable_,_Blob_Enable_2_,_Blob_Near_Size_,_Blob_Near_Size_2_,_Blob_Inner_Fade_,_Blob_Inner_Fade_2_,_Blob_Pulse_,_Blob_Pulse_2_,_Blob_Fade_,_Blob_Fade_2_,Position_Q38,Near_Size_Q38,Inner_Fade_Q38,Blob_Enable_Q38,Fade_Q38,Pulse_Q38);

    // Object_To_World_Pos (#33)
    vec3 Face_Center_Q33;
    Face_Center_Q33=(world * vec4(Result_Q18,1.0)).xyz;
    
    // Face_Size (#50)
    vec2 Face_Size_Q50 = vec2(length(Tangent_World_Q30),length(Binormal_World_Q31));

    float Show_Selection_Q48;
    Selection_Vertex_B48(Blob_Position_Q41,Blob_Position_Q42,Face_Center_Q33,Face_Size_Q50,Normal_World_N_Q29,Tangent_World_N_Q28,Binormal_World_N_Q32,_Selection_Fuzz_,_Selected_,_Selected_Distance_,_Selected_Fade_Length_,Active_Face_Dir_Q64,Show_Selection_Q48);

    // Normalize3 (#72)
    vec3 Normalized_Q72 = normalize(Dir_World_Q67);

    // Active_Face (#34)
    float Active_Q34 = max(0.0,dot(Active_Face_Dir_Q64,Normal_World_N_Q29));

    float Width_Q54;
    Proximity_Visibility_B54(Show_Selection_Q48,Blob_Position_Q41,Blob_Position_Q42,Product_Q56,_Proximity_Far_Distance_,_Proximity_Near_Radius_,Active_Face_Center_Q49,Active_Face_Dir_Q64,Width_Q54);

    vec3 Wire_Vx_Pos_Q51;
    vec2 UV_Q51;
    vec2 Widths_Q51;
    Wireframe_Vertex_B51(position,normal,tangent,(cross(normal,tangent)),Width_Q54,Face_Size_Q50,Wire_Vx_Pos_Q51,UV_Q51,Widths_Q51);

    // Pack_For_Vertex (#27)
    vec3 Vec3_Q27 = vec3(Widths_Q51.x,Widths_Q51.y,color.r);

    vec3 Pos_World_Q13;
    Object_To_World_Pos_B13(Wire_Vx_Pos_Q51,Pos_World_Q13);

    // Incident3 (#36)
    vec3 Incident_Q36 = normalize(Pos_World_Q13-cameraPosition);

    vec3 Out_Position_Q47;
    vec2 Out_UV_Q47;
    vec3 Blob_Info_Q47;
    Blob_Vertex_B47(Pos_World_Q13,Normal_World_N_Q29,Tangent_World_N_Q28,Binormal_World_N_Q32,Position_Q38,_Blob_Intensity_,Near_Size_Q38,_Blob_Far_Size_,_Blob_Near_Distance_,_Blob_Far_Distance_,color,uv,Face_Center_Q33,Face_Size_Q50,UV_Q51,_Blob_Fade_Length_,_Selection_Fade_,_Selection_Fade_Size_,Inner_Fade_Q38,Active_Face_Center_Q49,Pulse_Q38,Fade_Q38,Blob_Enable_Q38,Out_Position_Q47,Out_UV_Q47,Blob_Info_Q47);

    vec4 Extra1_Q66;
    float Distance_To_Face_Q66;
    float Intensity_Q66;
    Proximity_Vertex_B66(Blob_Position_Q41,Blob_Position_Q42,Active_Face_Center_Q49,Active_Face_Dir_Q64,Pos_World_Q13,_Proximity_Far_Distance_,Relative_Scale_Q57,_Proximity_Anisotropy_,Normalized_Q72,Extra1_Q66,Distance_To_Face_Q66,Intensity_Q66);

    vec4 Holo_Edges_Q44;
    Holo_Edge_Vertex_B44(Incident_Q36,Normal_World_N_Q29,uv,Tangent_World_Q30,Binormal_World_Q31,_Smooth_Active_Face_,Active_Q34,Holo_Edges_Q44);

    // From_XYZ (#19)
    vec3 Vec3_Q19 = vec3(Show_Selection_Q48,Distance_To_Face_Q66,Intensity_Q66);

    vec3 Position = Out_Position_Q47;
    vec2 UV = Out_UV_Q47;
    vec3 Tangent = Blob_Info_Q47;
    vec3 Binormal = Vec3_Q19;
    vec3 Normal = Vec3_Q27;
    vec4 Extra1 = Extra1_Q66;
    vec4 Color = Holo_Edges_Q44;

    gl_Position = viewProjection * vec4(Position,1);
    vPosition = Position;
    vNormal = Normal;
    vUV = UV;
    vTangent = Tangent;
    vBinormal = Binormal;
    vColor = Color;
    vExtra1 = Extra1;
}