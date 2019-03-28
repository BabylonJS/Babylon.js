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

const float pi = 3.1415926535;

vec3 id;          // ID of receiver
vec3 worldPos;    // world pos of receiving element
vec3 worldNormal; // world normal of receiving element

vec3 visible()
{
  vec3 proj = normalize((view * vec4(worldPos, 1.0))).xyz;

  // Vector is in [-1,1], scale to [0..1] for texture lookup
  proj.xy = proj.xy * 0.5 + 0.5;
  // proj.x += 0.5 / 4096.0;
  // proj.y += 0.5 / 4096.0;
  // Look up projected point in hemisphere item buffer
  vec3 xtex = texture(itemBuffer, proj.xy, 5.).xyz;

  // Compare the value in item buffer to the ID of the fragment
  // return vec3(xtex.x == id.x && xtex.y == id.y && xtex.z == id.z);
  return vec3(xtex == id, 0., 0.);
  //return xtex;
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
  float fij = max(cosi * cosj, 0.) / (pi * distance2 + shootDArea);

  fij *= float(visible());   // returns visibility as 0 or 1

  // Modulate shooter's energy by the receiver's reflectivity
  // and the area of the shooter.

  vec3 delta = 20. * shootEnergy * shootDArea * fij; // * recvColor

  return delta;
}

void main(void) {
    // Draw in residual AND gathering with multidraw buffer at uv position
    id = texture(idBuffer, vUV).xyz; 
    worldPos = texture(worldPosBuffer, vUV).xyz;
    // worldPos.x -= 1.5 / 16.;
    // worldPos.z += 1.5 / 16.;
    worldNormal = texture(worldNormalBuffer, vUV).xyz;
    
	  gl_FragColor = vec4(formFactorEnergy(), 1.0);
}