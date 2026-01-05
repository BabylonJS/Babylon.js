export const optimizedSmartFilterBlocks = [
    {
        fragment: {
            defines: [],
            const: `
`,
            uniform: `
uniform float _progress_;
uniform vec3 _tint_;
uniform float _amount_;
uniform sampler2D _input_;

uniform vec3 _tint_2_;
uniform float _amount_2_;
uniform sampler2D _input_2_;

`,
            mainFunctionName: `_wipe_`,
            functions: [
                {
                    name: `_wipe_`,
                    params: ``,
                    code: `

                        vec4 _mainImage_(vec2 vUV) {
                            vec4 color = texture2D(_input_, vUV);
                            vec3 tinted = mix(color.rgb, _tint_, _amount_);
                            return vec4(tinted, color.a);
                        }


                        vec4 _mainImage_2_(vec2 vUV) {
                            vec4 color = texture2D(_input_2_, vUV);
                            vec3 tinted = mix(color.rgb, _tint_2_, _amount_2_);
                            return vec4(tinted, color.a);
                        }


                    vec4 _wipe_(vec2 vUV) {
                        vec4 colorA = _mainImage_(vUV);
                        vec4 colorB = _mainImage_2_(vUV);
                        return mix(colorB, colorA, step(_progress_, vUV.y));
                    }



`,
                },
            ],
        },
    },
];
