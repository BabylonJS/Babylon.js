// Uniforms
uniform highp uint index;

#include<lightClusteredDeclaration>
#include<lightVxUboDeclaration>[0..1]

void main(void) {
    gl_FragColor = vec4(1 << index, 0, 0, 1);
}
