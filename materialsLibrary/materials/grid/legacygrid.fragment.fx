uniform vec3 mainColor;
uniform vec4 gridControl;

void main(void) {
    gl_FragColor = vec4(1, 1, 1, 0.1);
    
    #ifdef TRANSPARENT
        // Min opacity as if there were no lines.
        gl_FragColor = vec4(mainColor.rgb, 0.08);
    #else
        // Apply the color.
        gl_FragColor = vec4(mainColor.rgb, 1.0);
    #endif
}