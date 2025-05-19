/* eslint-disable @typescript-eslint/naming-convention */
const name = "msdfVertexShader";
const shader = `
attribute vec2 offsets;
attribute vec4 world0;
attribute vec4 world1;
attribute vec4 world2;
attribute vec4 world3;
attribute vec4 uvs;

uniform mat4 parentWorld;
uniform mat4 view;
uniform mat4 projection;
uniform vec3 center;
uniform int mode;

varying vec2 atlasUV;

void main(void) {
    mat4 world = mat4(world0, world1, world2, world3);
    vec4 worldPos =  (world * vec4(offsets.xy - vec2(0.5, 0.5), 0., 1.0));

    if (mode == 1) {
        vec3 viewPos = (view * parentWorld * vec4(0., 0., 0., 1.0)).xyz; 
        gl_Position = projection * vec4(viewPos + worldPos.xyz,1.0); 
    } else {
        vec3 viewPos = (view * parentWorld * worldPos).xyz; 
        gl_Position = projection * vec4(viewPos,1.0); 
    }
    atlasUV = vec2(uvs.x + offsets.x * uvs.z, uvs.y + (1.0 - offsets.y) * uvs.w);
}`;

/** @internal */
export const msdfVertexShader = { name, shader };
