import { Effect } from "babylonjs";

let name = 'starfieldProceduralTexturePixelShader';
let shader = `precision highp float;

#define volsteps 20
#define iterations 15
varying vec2 vPosition;
varying vec2 vUV;
uniform float time;
uniform float alpha;
uniform float beta;
uniform float zoom;
uniform float formuparam;
uniform float stepsize;
uniform float tile;
uniform float brightness;
uniform float darkmatter;
uniform float distfading;
uniform float saturation;
void main()
{
vec3 dir=vec3(vUV*zoom,1.);
float localTime=time*0.0001;

mat2 rot1=mat2(cos(alpha),sin(alpha),-sin(alpha),cos(alpha));
mat2 rot2=mat2(cos(beta),sin(beta),-sin(beta),cos(beta));
dir.xz*=rot1;
dir.xy*=rot2;
vec3 from=vec3(1.,.5,0.5);
from+=vec3(-2.,localTime*2.,localTime);
from.xz*=rot1;
from.xy*=rot2;

float s=0.1,fade=1.;
vec3 v=vec3(0.);
for (int r=0; r<volsteps; r++) {
vec3 p=from+s*dir*.5;
p=abs(vec3(tile)-mod(p,vec3(tile*2.))); 
float pa,a=pa=0.;
for (int i=0; i<iterations; i++) {
p=abs(p)/dot(p,p)-formuparam; 
a+=abs(length(p)-pa); 
pa=length(p);
}
float dm=max(0.,darkmatter-a*a*.001); 
a*=a*a; 
if (r>6) fade*=1.-dm; 

v+=fade;
v+=vec3(s,s*s,s*s*s*s)*a*brightness*fade; 
fade*=distfading; 
s+=stepsize;
}
v=mix(vec3(length(v)),v,saturation); 
gl_FragColor=vec4(v*.01,1.);
}`;

Effect.ShadersStore[name] = shader;

export { shader, name };
