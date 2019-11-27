#version 300 es

layout(location = 0) out vec4 glFragData[2];

// Attributes
in vec2 vUV;

uniform samplerCube itemBuffer;
uniform sampler2D idBuffer;
uniform sampler2D worldPosBuffer;
uniform sampler2D worldNormalBuffer;
uniform sampler2D residualBuffer;
uniform sampler2D gatheringBuffer;

uniform vec3 shootPos;     // world-space position of shooter
uniform vec3 shootNormal;  // world-space normal of shooter
uniform vec3 shootEnergy;  // energy from shooter residual texture
uniform float shootDArea;  // the delta area of the shooter
uniform float gatheringScale;  // scaling of the value written to gathering texture
uniform float residualScale;  // scaling of the value read to residual texture
uniform vec2 nearFar;
uniform float normalBias;

uniform vec3 recvColor;  // reflectivity

uniform mat4 view;

const float pi = 3.1415926535;

vec3 id;          // ID of receiver
vec3 worldPos;    // world pos of receiving element
vec3 worldNormal; // world normal of receiving element
vec3 r;           // Direction from shooter to receiver

float visible()
{
  // Look up projected point
  vec3 directionToLight = vec3(view * vec4(worldPos, 1.0)).xyz*vec3(1.0, -1.0, 1.0);
   
  // Normal inset Bias. TODO merge with formFactorEnergy
  vec3 r2 = shootPos - worldPos;
  vec3 worldLightDir = normalize(r2);

  float ndl = dot(worldNormal, worldLightDir);
  float sinNL = sqrt(1.0 - ndl * ndl);
  float nBias = normalBias * sinNL;

  // float depth = (length(directionToLight - worldNormal * nBias) + nearFar.x) / nearFar.y;
  vec3 absDir = abs(directionToLight);
  float depth = max(max(absDir.x, absDir.y), absDir.z);
  float farMinusNear = nearFar.y - nearFar.x;
  // TODO : there is a more efficient way to project depth without this costly operation for each fragment
  depth = ((nearFar.y + nearFar.x) - 2.0 * nearFar.y * nearFar.x / depth) / farMinusNear;
  // depth = (length(directionToLight - worldNormal * nBias) + nearFar.x) / nearFar.y;
  // depth = clamp(depth, 0., 1.0);

  // directionToLight = normalize(directionToLight);
  
  float shadow = texture(itemBuffer, directionToLight).x + nBias;
  // return vec3(shadow - depth);
  return step(depth, shadow);
}

vec3 formFactorEnergy()
{

  // a normalized vector from shooter to receiver
  r = shootPos - worldPos;
  float distance2 = dot(r, r);
  r = normalize(r);

  // the angles of the receiver and the shooter from r
  float cosi = max(dot(worldNormal, r), 0.0);
  float cosj = -dot(shootNormal, r);

  // compute the disc approximation form factor
  float fij = max(cosi * cosj, 0.) / (pi * distance2 + shootDArea);

  fij *= visible();   // returns visibility as 0 or 1

  // Modulate shooter's energy by the receiver's reflectivity
  // and the area of the shooter.

  vec3 delta = shootEnergy * shootDArea * fij; // * recvColor

  return delta;
}

void main(void) {
    // Draw in residual AND gathering with multidraw buffer at uv position
    id = texture(idBuffer, vUV).xyz;
    vec4 worldPos4 = texture(worldPosBuffer, vUV);
    worldPos = worldPos4.xyz;
    worldNormal = texture(worldNormalBuffer, vUV).xyz;

    vec3 energy = formFactorEnergy();
    glFragData[0] = vec4(energy + residualScale * texture(residualBuffer, vUV).xyz, worldPos4.a);
    glFragData[1] = vec4(energy * gatheringScale + texture(gatheringBuffer, vUV).xyz, worldPos4.a);    
    // glFragData[0] = vec4(vec3(visible()), worldPos4.a);
    // glFragData[1] = vec4(vec3(visible()), worldPos4.a);
}
