export const canvasShader = {
    path: {
        vertexSource: `
            precision highp float;

            attribute vec3 position;
            attribute vec2 uv;

            uniform mat4 worldViewProjection;

            varying vec2 vUV;

            void main(void) {
                gl_Position = worldViewProjection * vec4(position, 1.0);
                vUV = uv;
            }
        `,
        fragmentSource: `
            precision highp float;
    
            uniform sampler2D textureSampler;
    
            uniform bool r;
            uniform bool g;
            uniform bool b;
            uniform bool a;

            uniform int x1;
            uniform int y1;
            uniform int x2;
            uniform int y2;
            uniform int w;
            uniform int h;

            uniform int time;
            uniform bool showGrid;
    
            varying vec2 vUV;

            float scl = 200.0;
            float speed = 10.0 / 1000.0;
            float smoothing = 0.2;
    
            void main(void) {
                vec2 pos2 = vec2(gl_FragCoord.x, gl_FragCoord.y);
                vec2 pos = floor(pos2 * 0.05);
                float pattern = mod(pos.x + pos.y, 2.0); 
                if (pattern == 0.0) {
                    pattern = 0.7;
                }
                vec4 bg = vec4(pattern, pattern, pattern, 1.0);
                vec4 col = texture(textureSampler, vUV);
                if (!r && !g && !b) {
                    if (a) {
                        col = vec4(col.a, col.a, col.a, 1.0);
                    } else {
                        col = vec4(0.0,0.0,0.0,0.0);
                    }
                } else {
                    if (!r) {
                        col.r = 0.0;
                        if (!b) {
                            col.r = col.g;
                        }
                        else if (!g) {
                            col.r = col.b;
                        }
                    }
                    if (!g) {
                        col.g = 0.0;
                        if (!b) {
                            col.g = col.r;
                        }
                        else if (!r) {
                            col.g = col.b;
                        }
                    }
                    if (!b) {
                        col.b = 0.0;
                        if (!r) {
                            col.b = col.g;
                        } else if (!g) {
                            col.b = col.r;
                        }
                    }
                    if (!a) {
                        col.a = 1.0;
                    }
                }
                gl_FragColor = col * (col.a) + bg * (1.0 - col.a);
                float wF = float(w);
                float hF = float(h);
                int xPixel = int(floor(vUV.x * wF));
                int yPixel = int(floor((1.0 - vUV.y) * hF));
                int xDis = min(abs(xPixel - x1), abs(xPixel - x2));
                int yDis = min(abs(yPixel - y1), abs(yPixel - y2));
                if (showGrid) {
                    vec2 frac = fract(vUV * vec2(wF,hF));
                    float thickness = 0.1;
                    if (abs(frac.x) < thickness || abs (frac.y) < thickness) {
                        gl_FragColor = vec4(0.75,0.75,0.75,1.0);
                    }
                }
                if (xPixel >= x1 && yPixel >= y1 && xPixel <= x2 && yPixel <= y2) {
                    if (xDis <= 4 || yDis <= 4) {
                        float c = sin(vUV.x * scl + vUV.y * scl + float(time) * speed);
                        c = smoothstep(-smoothing,smoothing,c);
                        float val = 1.0 - c;
                        gl_FragColor = vec4(val, val, val, 1.0) * 0.7 + gl_FragColor * 0.3;
                    }
                }
            }`
    },
    options: {
        attributes: ['position', 'uv'],
        uniforms: ['worldViewProjection', 'textureSampler', 'r', 'g', 'b', 'a', 'x1', 'y1', 'x2', 'y2', 'w', 'h', 'time', 'showGrid']
    }
}