uniform vec3 cameraPosition;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUV;
varying vec3 vTangent;
varying vec3 vBinormal;
varying vec4 vColor;
varying vec4 vExtra1;

uniform float _Edge_Width_;
uniform vec4 _Edge_Color_;
uniform bool _Relative_Width_;
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
uniform bool Enable_Fade;
uniform float _Fade_Width_;
uniform bool _Smooth_Active_Face_;
uniform bool _Show_Frame_;
uniform bool _Use_Blob_Texture_;

uniform bool Use_Global_Left_Index;
uniform bool Use_Global_Right_Index;
uniform vec4 Global_Left_Index_Tip_Position;
uniform vec4 Global_Right_Index_Tip_Position;
uniform vec4 Global_Left_Thumb_Tip_Position;
uniform vec4 Global_Right_Thumb_Tip_Position;
uniform float  Global_Left_Index_Tip_Proximity;
uniform float  Global_Right_Index_Tip_Proximity;

//BLOCK_BEGIN Holo_Edge_Fragment 35

void Holo_Edge_Fragment_B35(
    vec4 Edges,
    float Edge_Width,
    out float NotEdge)
{
    vec2 c = vec2(min(Edges.r,Edges.g),min(Edges.b,Edges.a));
    vec2 df = fwidth(c)*Edge_Width;
    vec2 g = clamp(c/df, 0.0, 1.0);
    NotEdge = g.x*g.y;
}
//BLOCK_END Holo_Edge_Fragment

//BLOCK_BEGIN Blob_Fragment 39

void Blob_Fragment_B39(
    vec2 UV,
    vec3 Blob_Info,
    sampler2D Blob_Texture,
    out vec4 Blob_Color)
{
    float k = dot(UV,UV);
    Blob_Color = Blob_Info.y * texture(Blob_Texture,vec2(vec2(sqrt(k),Blob_Info.x).x,1.0-vec2(sqrt(k),Blob_Info.x).y))*(1.0-clamp(k, 0.0, 1.0));
}
//BLOCK_END Blob_Fragment

//BLOCK_BEGIN Wireframe_Fragment 59

vec2 FilterStep(vec2 Edge, vec2 X)
{
    // note we are in effect doubling the filter width
    vec2 dX = max(fwidth(X),vec2(0.00001,0.00001));
    return clamp( (X+dX - max(Edge,X-dX))/(dX*2.0), 0.0, 1.0);
}

void Wireframe_Fragment_B59(
    vec3 Widths,
    vec2 UV,
    float Proximity,
    vec4 Edge_Color,
    out vec4 Wireframe)
{
    vec2 c = min(UV,vec2(1.0,1.0)-UV);
    vec2 g = FilterStep(Widths.xy*0.5,c); 
    Wireframe = (1.0-min(g.x,g.y))*Proximity * Edge_Color;
    
}
//BLOCK_END Wireframe_Fragment

//BLOCK_BEGIN Proximity 53

void Proximity_B53(
    vec3 Proximity_Center,
    vec3 Proximity_Center_2,
    float Proximity_Max_Intensity,
    float Proximity_Near_Radius,
    vec3 Position,
    vec3 Show_Selection,
    vec4 Extra1,
    float Dist_To_Face,
    float Intensity,
    out float Proximity)
{
    vec2 delta1 = Extra1.xy;
    vec2 delta2 = Extra1.zw;
    
    float d2 = sqrt(min(dot(delta1,delta1),dot(delta2,delta2)) + Dist_To_Face*Dist_To_Face);
    
    //float d = distance(Proximity_Center.xyz,Position);
    Proximity = Intensity * Proximity_Max_Intensity * (1.0-clamp(d2/Proximity_Near_Radius, 0.0, 1.0))*(1.0-Show_Selection.x)+Show_Selection.x;
    
}
//BLOCK_END Proximity

//BLOCK_BEGIN To_XYZ 46

void To_XYZ_B46(
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


void main()
{
    float NotEdge_Q35;
    #if ENABLE_FADE
      Holo_Edge_Fragment_B35(vColor,_Fade_Width_,NotEdge_Q35);
    #else
      NotEdge_Q35 = 1.0;
    #endif

    // vec4 Blob_Color_Q39;
    // Blob_Fragment_B39(vUV,vTangent,_Blob_Texture_,Blob_Color_Q39);
    vec4 Blob_Color_Q39;
    float k = dot(vUV,vUV);
    vec2 blobTextureCoord = vec2(vec2(sqrt(k),vTangent.x).x,1.0-vec2(sqrt(k),vTangent.x).y);
    vec4 blobColor = mix(vec4(1.0, 1.0, 1.0, 1.0) * step(1.0 - vTangent.x, clamp(sqrt(k) + 0.1, 0.0, 1.0)), texture(_Blob_Texture_,blobTextureCoord), float(_Use_Blob_Texture_));
    Blob_Color_Q39 = vTangent.y * blobColor * (1.0-clamp(k, 0.0, 1.0));

    // Is_Quad (#24)
    float Is_Quad_Q24;
    Is_Quad_Q24=vNormal.z;
    
    // Pick_Local_Or_Global_Left (#41)
    vec3 Blob_Position_Q41 =  mix(_Blob_Position_, Global_Left_Index_Tip_Position.xyz, float(Use_Global_Left_Index));

    // Pick_Local_Or_Global_Right (#42)
    vec3 Blob_Position_Q42 =  mix(_Blob_Position_2_, Global_Right_Index_Tip_Position.xyz, float(Use_Global_Right_Index));

    float X_Q46;
    float Y_Q46;
    float Z_Q46;
    To_XYZ_B46(vBinormal,X_Q46,Y_Q46,Z_Q46);

    float Proximity_Q53;
    Proximity_B53(Blob_Position_Q41,Blob_Position_Q42,_Proximity_Max_Intensity_,_Proximity_Near_Radius_,vPosition,vBinormal,vExtra1,Y_Q46,Z_Q46,Proximity_Q53);

    vec4 Wireframe_Q59;
    Wireframe_Fragment_B59(vNormal,vUV,Proximity_Q53,_Edge_Color_,Wireframe_Q59);

    // Mix_Colors (#23)
    vec4 Wire_Or_Blob_Q23 = mix(Wireframe_Q59, Blob_Color_Q39, Is_Quad_Q24);

    // Conditional_Color (#22)
    vec4 Result_Q22;
    Result_Q22 = mix(Wire_Or_Blob_Q23, vec4(0.3,0.3,0.3,0.3), float(_Show_Frame_));
    
    // Scale_Color (#37)
    vec4 Final_Color_Q37 = NotEdge_Q35 * Result_Q22;

    vec4 Out_Color = Final_Color_Q37;
    float Clip_Threshold = 0.0;
    bool To_sRGB = false;

    gl_FragColor = Out_Color;
}