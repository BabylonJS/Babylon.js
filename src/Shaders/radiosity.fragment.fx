#version 300 es

layout(location = 0) out vec4 glFragData[2];

// Attributes
in vec2 vUV;

#ifdef HEMICUBE
uniform samplerCube itemBuffer;
#else
uniform sampler2D itemBuffer;
#endif
uniform sampler2D idBuffer;
uniform sampler2D worldPosBuffer;
uniform sampler2D worldNormalBuffer;
uniform sampler2D residualBuffer;
uniform sampler2D gatheringBuffer;

uniform vec3 shootPos;     // world-space position of shooter
uniform vec3 shootNormal;  // world-space normal of shooter
uniform vec3 shootEnergy;  // energy from shooter residual texture
uniform float shootDArea;  // the delta area of the shooter
uniform vec2 nearFar;

uniform vec3 recvColor;  // reflectivity

uniform mat4 view;

const float pi = 3.1415926535;

vec3 id;          // ID of receiver
vec3 worldPos;    // world pos of receiving element
vec3 worldNormal; // world normal of receiving element

vec3 visible()
{
  // Look up projected point in hemisphere item buffer
  vec3 proj = (view * vec4(worldPos, 1.0)).xyz;
  #ifdef HEMICUBE
  // proj = normalize(proj);
  // proj.xyz = proj.zxy;
  proj.y = -proj.y;
  #ifdef DEPTH_COMPARE
  float depthProj = proj.z;
  float farMinusNear = nearFar.y - nearFar.x;

  // TODO : there is a more efficient way to project depth without this costly operation for each fragment
  depthProj = (depthProj * (nearFar.y + nearFar.x) - 2.0 * nearFar.y * nearFar.x) / farMinusNear;
  // depthProj = depthProj * 0.5 + 0.5;

  float depth = texture(itemBuffer, proj).r;
  return vec3(depthProj - depth <= 1e-6);
  #else
  return vec3(texture(itemBuffer, proj).xyz == id);
  #endif
  #else
  #ifdef DEPTH_COMPARE
  float depthProj = proj.z;
  proj = normalize(proj);

  // Vector is in [-1,1], scale to [0..1] for texture lookup
  proj.xy = proj.xy * 0.5 + 0.5;

  float farMinusNear = nearFar.y - nearFar.x;

  depthProj = (2.0 * depthProj - nearFar.y - nearFar.x) / farMinusNear;
  depthProj = depthProj * 0.5 + 0.5;

  float depth = texture(itemBuffer, proj.xy).r;
  return float(depthProj - depth <= 1e-4);
  #else
  // Compare the value in item buffer to the ID of the fragment
  proj = normalize(proj);

  // Vector is in [-1,1], scale to [0..1] for texture lookup
  proj.xy = proj.xy * 0.5 + 0.5;
  vec3 xtex = texture(itemBuffer, proj.xy).xyz;
  return float(xtex == id);
  #endif
  #endif
}

vec3 formFactorEnergy()
{

  // a normalized vector from shooter to receiver
  vec3 r = shootPos - worldPos;
  float distance2 = dot(r, r);
  r = normalize(r);

  // the angles of the receiver and the shooter from r
  float cosi = max(dot(worldNormal, r), 0.0);
  float cosj = -dot(shootNormal, r);

  // compute the disc approximation form factor
  float fij = max(cosi * cosj, 0.) / (pi * distance2 + shootDArea);

  fij *= float(visible());   // returns visibility as 0 or 1

  // Modulate shooter's energy by the receiver's reflectivity
  // and the area of the shooter.

  vec3 delta = 1. * shootEnergy * shootDArea * fij; // * recvColor

  return delta;
}

void main(void) {
    // Draw in residual AND gathering with multidraw buffer at uv position
    id = texture(idBuffer, vUV).xyz; 
    vec4 worldPos4 = texture(worldPosBuffer, vUV);
    worldPos = worldPos4.xyz;
    // worldPos.x -= 1.5 / 16.;
    // worldPos.z += 1.5 / 16.;
    worldNormal = texture(worldNormalBuffer, vUV).xyz;
    
    vec3 energy = formFactorEnergy();
    glFragData[0] = vec4(energy + texture(residualBuffer, vUV).xyz, worldPos4.a);
    glFragData[1] = vec4(energy + texture(gatheringBuffer, vUV).xyz, worldPos4.a);
}