uniform mat4 world;
uniform mat4 viewProjection;
uniform vec3 cameraPosition;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
attribute vec3 tangent;
attribute vec4 color;

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


varying vec3 vNormal;
varying vec2 vUV;
varying vec3 vTangent;
varying vec4 vExtra1;
varying vec4 vExtra2;
varying vec4 vExtra3;

//BLOCK_BEGIN Blob_Vertex 40

void Blob_Vertex_B40(
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
    float Blob_Pulse,
    float Blob_Fade,
    float Blob_Enabled,
    float DistanceOffset,
    out vec3 Out_Position,
    out vec2 Out_UV,
    out vec3 Blob_Info,
    out vec2 Blob_Relative_UV)
{
    
    float blobSize, fadeIn;
    vec3 Hit_Position;
    Blob_Info = vec3(0.0,0.0,0.0);
    
    float Hit_Distance = dot(Blob_Position-Face_Center, Normal) + DistanceOffset*Blob_Far_Distance;
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
    Blob_Relative_UV = blobClipped/Face_Size.y;
}
//BLOCK_END Blob_Vertex

//BLOCK_BEGIN Round_Rect_Vertex 36

void Round_Rect_Vertex_B36(
    vec2 UV,
    vec3 Tangent,
    vec3 Binormal,
    float Radius,
    float Anisotropy,
    vec2 Blob_Center_UV,
    out vec2 Rect_UV,
    out vec2 Scale_XY,
    out vec4 Rect_Parms)
{
    Scale_XY = vec2(Anisotropy,1.0);
    Rect_UV = (UV - vec2(0.5,0.5)) * Scale_XY;
    Rect_Parms.xy = Scale_XY*0.5-vec2(Radius,Radius);
    Rect_Parms.zw = Blob_Center_UV;
}
//BLOCK_END Round_Rect_Vertex

//BLOCK_BEGIN Proximity_Vertex 33

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

void Proximity_Vertex_B33(
    vec3 Blob_Position,
    vec3 Blob_Position_2,
    vec3 Face_Center,
    vec3 Position,
    float Proximity_Far_Distance,
    float Relative_Scale,
    float Proximity_Anisotropy,
    vec3 Normal,
    vec3 Tangent,
    vec3 Binormal,
    out vec4 Extra,
    out float Distance_To_Face,
    out float Distance_Fade1,
    out float Distance_Fade2)
{
    //vec3 Active_Face_Dir_X = normalize(cross(Active_Face_Dir,Up));
    //vec3 Active_Face_Dir_X = normalize(vec3(Active_Face_Dir.y-Active_Face_Dir.z,Active_Face_Dir.z-Active_Face_Dir.x,Active_Face_Dir.x-Active_Face_Dir.y));
    //vec3 Active_Face_Dir_Y = cross(Active_Face_Dir,Active_Face_Dir_X);
    
    float distz1,distz2;
    Extra.xy = ProjectProximity(Blob_Position,Position,Face_Center,Normal,Tangent*Proximity_Anisotropy,Binormal,distz1)/Relative_Scale;
    Extra.zw = ProjectProximity(Blob_Position_2,Position,Face_Center,Normal,Tangent*Proximity_Anisotropy,Binormal,distz2)/Relative_Scale;
    
    Distance_To_Face = dot(Normal,Position-Face_Center);
    Distance_Fade1 = 1.0 - clamp(distz1/Proximity_Far_Distance, 0.0, 1.0);
    Distance_Fade2 = 1.0 - clamp(distz2/Proximity_Far_Distance, 0.0, 1.0);
    
}
//BLOCK_END Proximity_Vertex

//BLOCK_BEGIN Object_To_World_Pos 12

void Object_To_World_Pos_B12(
    vec3 Pos_Object,
    out vec3 Pos_World)
{
    Pos_World=(world * vec4(Pos_Object,1.0)).xyz;
    
}
//BLOCK_END Object_To_World_Pos

//BLOCK_BEGIN Choose_Blob 27

void Choose_Blob_B27(
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
    
    float b1 = Blob_Enable_1 ? 1.0 : 0.0;
    float b2 = Blob_Enable_2 ? 1.0 : 0.0;
    Blob_Enable = b1+(b2-b1)*Vx_Color.g;
    
    Pulse = Blob_Pulse_1*(1.0-Vx_Color.g)+Vx_Color.g*Blob_Pulse_2;
    Fade = Blob_Fade_1*(1.0-Vx_Color.g)+Vx_Color.g*Blob_Fade_2;
    Near_Size = Near_Size_1*(1.0-Vx_Color.g)+Vx_Color.g*Near_Size_2;
    Inner_Fade = Blob_Inner_Fade_1*(1.0-Vx_Color.g)+Vx_Color.g*Blob_Inner_Fade_2;
}
//BLOCK_END Choose_Blob

//BLOCK_BEGIN Move_Verts 32

void Move_Verts_B32(
    vec2 UV,
    float Radius,
    float Anisotropy,
    float Line_Width,
    float Visible,
    out vec3 New_P,
    out vec2 New_UV)
{
    
    vec2 xy = 2.0 * UV - vec2(0.5,0.5);
    vec2 center = clamp(xy, 0.0, 1.0);
    
    vec2 delta = 2.0 * (xy - center);
    float deltaLength = length(delta);
    
    vec2 aniso = vec2(1.0 / Anisotropy, 1.0);
    center = (center-vec2(0.5,0.5))*(1.0-2.0*Radius*aniso);
    
    New_UV = vec2((2.0-2.0*deltaLength)*Visible,0.0);
    
    float deltaRadius =  (Radius - Line_Width * New_UV.x);
    
    New_P.xy = (center + deltaRadius / deltaLength *aniso * delta);
    New_P.z = 0.0;
    
}
//BLOCK_END Move_Verts

//BLOCK_BEGIN Object_To_World_Dir 14

void Object_To_World_Dir_B14(
    vec3 Dir_Object,
    out vec3 Binormal_World)
{
    Binormal_World = (world * vec4(Dir_Object,0.0)).xyz;
    
}
//BLOCK_END Object_To_World_Dir

//BLOCK_BEGIN Proximity_Visibility 55

void Proximity_Visibility_B55(
    float Selection,
    vec3 Proximity_Center,
    vec3 Proximity_Center_2,
    float Proximity_Far_Distance,
    float Proximity_Radius,
    vec3 Face_Center,
    vec3 Normal,
    vec2 Face_Size,
    float Gaze,
    out float Width)
{
    //make all edges invisible if no proximity or selection visible
    float boxMaxSize = length(Face_Size)*0.5;
    
    float d1 = dot(Proximity_Center-Face_Center, Normal);
    vec3 blob1 = Proximity_Center - d1 * Normal;
    
    float d2 = dot(Proximity_Center_2-Face_Center, Normal);
    vec3 blob2 = Proximity_Center_2 - d2 * Normal;
    
    //vec3 objectOriginInWorld = (world * vec4(vec3(0.0,0.0,0.0),1.0)).xyz;
    vec3 delta1 = blob1 - Face_Center;
    vec3 delta2 = blob2 - Face_Center;
    
    float dist1 = dot(delta1,delta1);
    float dist2 = dot(delta2,delta2);
    
    float nearestProxDist = sqrt(min(dist1,dist2));
    
    Width = (1.0 - step(boxMaxSize+Proximity_Radius,nearestProxDist))*(1.0-step(Proximity_Far_Distance,min(d1,d2))*(1.0-step(0.0001,Selection)));
    Width = max(Gaze, Width);
}
//BLOCK_END Proximity_Visibility

//BLOCK_BEGIN Selection_Vertex 31

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

void Selection_Vertex_B31(
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
    
    Show_Selection = mix(max(select1,select2),1.0,Selected);
}
//BLOCK_END Selection_Vertex


void main()
{
    // Pack_For_Vertex (#29)
    vec3 Vec3_Q29 = vec3(vec2(0,0).x,vec2(0,0).y,color.r);

    // Object_To_World_Dir (#24)
    vec3 Nrm_World_Q24;
    Nrm_World_Q24 = normalize((world * vec4(normal,0.0)).xyz);
    
    // Object_To_World_Pos (#30)
    vec3 Face_Center_Q30;
    Face_Center_Q30=(world * vec4(vec3(0,0,0),1.0)).xyz;
    
    // Object_To_World_Dir (#13)
    vec3 Tangent_World_Q13;
    Tangent_World_Q13 = (world * vec4(tangent,0.0)).xyz;
    
    // Conditional (#42)
    vec3 Result_Q42;
    Result_Q42 = _Use_Global_Left_Index_ ? Global_Left_Index_Tip_Position.xyz : _Blob_Position_;
    
    // Conditional (#43)
    vec3 Result_Q43;
    Result_Q43 = _Use_Global_Right_Index_ ? Global_Right_Index_Tip_Position.xyz : _Blob_Position_2_;
    
    // Lerp (#58)
    float Value_At_T_Q58=mix(_Blob_Near_Size_,_Blob_Pulse_Max_Size_,_Blob_Pulse_);

    // Lerp (#59)
    float Value_At_T_Q59=mix(_Blob_Near_Size_2_,_Blob_Pulse_Max_Size_,_Blob_Pulse_2_);

    // CrossProduct (#70)
    vec3 Cross_Q70 = cross(normal, tangent);

    // Multiply (#45)
    float Product_Q45 = _Gaze_Intensity_ * _Gaze_Focus_;

    // Step (#46)
    float Step_Q46 = step(0.0001, Product_Q45);

    // Normalize3 (#15)
    vec3 Tangent_World_N_Q15 = normalize(Tangent_World_Q13);

    vec3 Position_Q27;
    float Near_Size_Q27;
    float Inner_Fade_Q27;
    float Blob_Enable_Q27;
    float Fade_Q27;
    float Pulse_Q27;
    Choose_Blob_B27(color,Result_Q42,Result_Q43,_Blob_Enable_,_Blob_Enable_2_,Value_At_T_Q58,Value_At_T_Q59,_Blob_Inner_Fade_,_Blob_Inner_Fade_2_,_Blob_Pulse_,_Blob_Pulse_2_,_Blob_Fade_,_Blob_Fade_2_,Position_Q27,Near_Size_Q27,Inner_Fade_Q27,Blob_Enable_Q27,Fade_Q27,Pulse_Q27);

    vec3 Binormal_World_Q14;
    Object_To_World_Dir_B14(Cross_Q70,Binormal_World_Q14);

    // Anisotropy (#21)
    float Anisotropy_Q21=length(Tangent_World_Q13)/length(Binormal_World_Q14);

    // Normalize3 (#16)
    vec3 Binormal_World_N_Q16 = normalize(Binormal_World_Q14);

    // Face_Size (#35)
    vec2 Face_Size_Q35;
    float ScaleY_Q35;
    Face_Size_Q35 = vec2(length(Tangent_World_Q13),length(Binormal_World_Q14));
    ScaleY_Q35 = Face_Size_Q35.y;
    
    // Scale_Radius_And_Width (#38)
    float Out_Radius_Q38;
    float Out_Line_Width_Q38;
    Out_Radius_Q38 = _Relative_To_Height_ ? _Radius_ : _Radius_ / ScaleY_Q35;
    Out_Line_Width_Q38 = _Relative_To_Height_ ? _Line_Width_ : _Line_Width_ / ScaleY_Q35;

    float Show_Selection_Q31;
    Selection_Vertex_B31(Result_Q42,Result_Q43,Face_Center_Q30,Face_Size_Q35,Nrm_World_Q24,Tangent_World_N_Q15,Binormal_World_N_Q16,_Selection_Fuzz_,_Selected_,_Selected_Distance_,_Selected_Fade_Length_,vec3(0,0,-1),Show_Selection_Q31);

    // Max (#41)
    float MaxAB_Q41=max(Show_Selection_Q31,Product_Q45);

    float Width_Q55;
    Proximity_Visibility_B55(Show_Selection_Q31,Result_Q42,Result_Q43,_Proximity_Far_Distance_,_Proximity_Near_Radius_,Face_Center_Q30,Nrm_World_Q24,Face_Size_Q35,Step_Q46,Width_Q55);

    vec3 New_P_Q32;
    vec2 New_UV_Q32;
    Move_Verts_B32(uv,Out_Radius_Q38,Anisotropy_Q21,Out_Line_Width_Q38,Width_Q55,New_P_Q32,New_UV_Q32);

    vec3 Pos_World_Q12;
    Object_To_World_Pos_B12(New_P_Q32,Pos_World_Q12);

    vec3 Out_Position_Q40;
    vec2 Out_UV_Q40;
    vec3 Blob_Info_Q40;
    vec2 Blob_Relative_UV_Q40;
    Blob_Vertex_B40(Pos_World_Q12,Nrm_World_Q24,Tangent_World_N_Q15,Binormal_World_N_Q16,Position_Q27,_Blob_Intensity_,Near_Size_Q27,_Blob_Far_Size_,_Blob_Near_Distance_,_Blob_Far_Distance_,color,uv,Face_Center_Q30,Face_Size_Q35,New_UV_Q32,_Blob_Fade_Length_,_Selection_Fade_,_Selection_Fade_Size_,Inner_Fade_Q27,Pulse_Q27,Fade_Q27,Blob_Enable_Q27,0.0,Out_Position_Q40,Out_UV_Q40,Blob_Info_Q40,Blob_Relative_UV_Q40);

    vec2 Rect_UV_Q36;
    vec2 Scale_XY_Q36;
    vec4 Rect_Parms_Q36;
    Round_Rect_Vertex_B36(New_UV_Q32,Tangent_World_Q13,Binormal_World_Q14,Out_Radius_Q38,Anisotropy_Q21,Blob_Relative_UV_Q40,Rect_UV_Q36,Scale_XY_Q36,Rect_Parms_Q36);

    vec4 Extra_Q33;
    float Distance_To_Face_Q33;
    float Distance_Fade1_Q33;
    float Distance_Fade2_Q33;
    Proximity_Vertex_B33(Result_Q42,Result_Q43,Face_Center_Q30,Pos_World_Q12,_Proximity_Far_Distance_,1.0,_Proximity_Anisotropy_,Nrm_World_Q24,Tangent_World_N_Q15,Binormal_World_N_Q16,Extra_Q33,Distance_To_Face_Q33,Distance_Fade1_Q33,Distance_Fade2_Q33);

    // From_XYZW (#37)
    vec4 Vec4_Q37 = vec4(MaxAB_Q41, Distance_Fade1_Q33, Distance_Fade2_Q33, Out_Radius_Q38);

    vec3 Position = Out_Position_Q40;
    vec3 Normal = Vec3_Q29;
    vec2 UV = Out_UV_Q40;
    vec3 Tangent = Blob_Info_Q40;
    vec3 Binormal = vec3(0,0,0);
    vec4 Color = vec4(1,1,1,1);
    vec4 Extra1 = Rect_Parms_Q36;
    vec4 Extra2 = Extra_Q33;
    vec4 Extra3 = Vec4_Q37;

    gl_Position = viewProjection * vec4(Position,1);
    vNormal = Normal;
    vUV = UV;
    vTangent = Tangent;
    vExtra1 = Extra1;
    vExtra2 = Extra2;
    vExtra3 = Extra3;
}