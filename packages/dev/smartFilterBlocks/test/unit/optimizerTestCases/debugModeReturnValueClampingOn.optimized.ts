export const optimizedSmartFilterBlocks = [
    {
        fragment: {
            defines: [],
            const: `
`,
            uniform: `
uniform vec3 _tint_;
uniform float _amount_;
uniform float _amount_2_;
uniform bool _disabled_;
uniform sampler2D _input_;

`,
            mainFunctionName: `_mainImage_`,
            functions: [
                {
                    name: `_mainImage_`,
                    params: ``,
                    code: `

                    vec4 _exposure_(vec2 vUV) {
    vec4 _autoMainInputColor_ = texture2D(_input_, vUV);

                if (_disabled_) return _autoMainInputColor_;

                        vec4 color = _autoMainInputColor_;
                        return vec4(color.rgb * _amount_2_, color.a);
                    }



                        vec4 _mainImage_(vec2 vUV) {
                            vec4 color = clamp(_exposure_(vUV), 0.0, 1.0);
                            vec3 tinted = mix(color.rgb, _tint_, _amount_);
                            return vec4(tinted, color.a);
                        }


`,
                },
            ],
        },
    },
];
