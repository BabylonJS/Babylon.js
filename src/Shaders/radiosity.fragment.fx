// Attributes
in vec2 vUV;

uniform sampler2D itemBuffer;
uniform sampler2D idBuffer;
uniform sampler2D worldPosBuffer;
uniform sampler2D worldNormalBuffer;

uniform vec3 shootPos;     // world-space position of shooter
uniform vec3 shootNormal;  // world-space normal of shooter
uniform vec3 shootEnergy;  // energy from shooter residual texture
uniform float shootDArea;  // the delta area of the shooter

uniform vec3 recvColor;  // reflectivity

uniform mat4 view;

const float resolution = 8.0;
const float pi = 3.1415926535;

vec3 id;          // ID of receiver, for item buffer
vec3 worldPos;    // world pos of receiving element
vec3 worldNormal; // world normal of receiving element

bool visible()
{
  vec3 proj = normalize((view * worldPos).xyz);

  // Vector is in [-1,1], scale to [0..1] for texture lookup
  proj.xy = proj.xy * 0.5 + 0.5;

  // Look up projected point in hemisphere item buffer
  vec3 xtex = tex2D(itemBuffer, proj.xy);

  // Compare the value in item buffer to the ID of the fragment
  return all(xtex == id);
}

vec3 formFactorEnergy()
{

  // a normalized vector from shooter to receiver
  vec3 r = shootPos - worldPos;
  float distance2 = dot(r, r);
  r = normalize(r);

  // the angles of the receiver and the shooter from r
  float cosi = dot(worldNormal, r);
  float cosj = -dot(shootNormal, r);

  // compute the disc approximation form factor
  float fij = max(cosi * cosj, 0) / (pi * distance2 + shootDArea);

  fij *= visible();   // returns visibility as 0 or 1


  // Modulate shooter's energy by the receiver's reflectivity
  // and the area of the shooter.

  vec3 delta = shooterEnergy * recvColor * shootDArea * fij;

  return delta;
}

void main(void) {
    // Draw in residual AND gathering with multidraw buffer at uv position

    id = texture(idBuffer, vUV).xyz;
    worldPos = texture(worldPosBuffer, vUV).xyz;
    worldNormal = texture(worldNormalBuffer, vUV).xyz;
    
	  gl_FragColor = vec4(formFactorEnergy(), 1.0);
}