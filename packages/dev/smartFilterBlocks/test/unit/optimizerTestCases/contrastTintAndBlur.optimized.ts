export const optimizedSmartFilterBlocks = [
    {
        fragment: {
            defines: [],
            const: `
const float _epsilon_ = 0.01;
`,
            uniform: `
uniform vec2 _texelStep_;
uniform float[7] _weights_;
uniform sampler2D _input_;
`,
            mainFunctionName: `_directionalBlur_`,
            functions: [
                {
                    name: `_directionalBlur_`,
                    params: ``,
                    code: `

                vec4 _directionalBlur_(vec2 vUV) {
                    vec2 start = vUV - 3.0 * _texelStep_;

                    vec4 finalWeightedColor = vec4(0., 0., 0., 0.);

                    for (int i = 0; i < 7; i++)
                    {
                        vec2 fetchUV = start + _texelStep_ * float(i);
                        fetchUV = clamp(fetchUV, 0., 1.);
                        vec4 colorSample = texture2D(_input_, fetchUV);

                        // Ignore samples from mostly transparent pixels
                        if (colorSample.a < _epsilon_) continue;

                        finalWeightedColor += colorSample * _weights_[i];
                    }

                    return finalWeightedColor;
                }



`,
                },
            ],
        },
    },
    {
        fragment: {
            defines: [],
            const: `
const float _epsilon_ = 0.01;
`,
            uniform: `
uniform vec2 _texelStep_;
uniform float[7] _weights_;
uniform sampler2D _input_;
`,
            mainFunctionName: `_directionalBlur_`,
            functions: [
                {
                    name: `_directionalBlur_`,
                    params: ``,
                    code: `

                vec4 _directionalBlur_(vec2 vUV) {
                    vec2 start = vUV - 3.0 * _texelStep_;

                    vec4 finalWeightedColor = vec4(0., 0., 0., 0.);

                    for (int i = 0; i < 7; i++)
                    {
                        vec2 fetchUV = start + _texelStep_ * float(i);
                        fetchUV = clamp(fetchUV, 0., 1.);
                        vec4 colorSample = texture2D(_input_, fetchUV);

                        // Ignore samples from mostly transparent pixels
                        if (colorSample.a < _epsilon_) continue;

                        finalWeightedColor += colorSample * _weights_[i];
                    }

                    return finalWeightedColor;
                }



`,
                },
            ],
        },
    },
    {
        fragment: {
            defines: [],
            const: `
const float _epsilon_ = 0.01;
`,
            uniform: `
uniform vec2 _texelStep_;
uniform float[7] _weights_;
uniform sampler2D _input_;
`,
            mainFunctionName: `_directionalBlur_`,
            functions: [
                {
                    name: `_directionalBlur_`,
                    params: ``,
                    code: `

                vec4 _directionalBlur_(vec2 vUV) {
                    vec2 start = vUV - 3.0 * _texelStep_;

                    vec4 finalWeightedColor = vec4(0., 0., 0., 0.);

                    for (int i = 0; i < 7; i++)
                    {
                        vec2 fetchUV = start + _texelStep_ * float(i);
                        fetchUV = clamp(fetchUV, 0., 1.);
                        vec4 colorSample = texture2D(_input_, fetchUV);

                        // Ignore samples from mostly transparent pixels
                        if (colorSample.a < _epsilon_) continue;

                        finalWeightedColor += colorSample * _weights_[i];
                    }

                    return finalWeightedColor;
                }



`,
                },
            ],
        },
    },
    {
        fragment: {
            defines: [],
            const: `
const float _epsilon_ = 0.01;
`,
            uniform: `
uniform vec2 _texelStep_;
uniform float[7] _weights_;
uniform sampler2D _input_;
`,
            mainFunctionName: `_directionalBlur_`,
            functions: [
                {
                    name: `_directionalBlur_`,
                    params: ``,
                    code: `

                vec4 _directionalBlur_(vec2 vUV) {
                    vec2 start = vUV - 3.0 * _texelStep_;

                    vec4 finalWeightedColor = vec4(0., 0., 0., 0.);

                    for (int i = 0; i < 7; i++)
                    {
                        vec2 fetchUV = start + _texelStep_ * float(i);
                        fetchUV = clamp(fetchUV, 0., 1.);
                        vec4 colorSample = texture2D(_input_, fetchUV);

                        // Ignore samples from mostly transparent pixels
                        if (colorSample.a < _epsilon_) continue;

                        finalWeightedColor += colorSample * _weights_[i];
                    }

                    return finalWeightedColor;
                }



`,
                },
            ],
        },
    },
    {
        fragment: {
            defines: [],
            const: `
`,
            uniform: `
uniform vec3 _tint_;
uniform float _amount_;
uniform float _intensity_;
uniform bool _disabled_;
uniform sampler2D _input_;

`,
            mainFunctionName: `_mainImage_`,
            functions: [
                {
                    name: `_mainImage_`,
                    params: ``,
                    code: `

                    float _remap_(float i, float smin, float smax, float dmin, float dmax) {
                        return dmin + (i - smin) * (dmax - dmin) / (smax - smin);
                    }


                    vec3 _remap_(vec3 i, float smin, float smax, float dmin, float dmax) {
                        return dmin + (i - smin) * (dmax - dmin) / (smax - smin);
                    }


                    vec4 _contrast_(vec2 vUV) {
    vec4 _autoMainInputColor_ = texture2D(_input_, vUV);

                if (_disabled_) return _autoMainInputColor_;

                        vec4 color = _autoMainInputColor_;

                        float contrastLMin = mix(-2., 0., _intensity_ * 2.0);
                        float contrastLMax = mix(3., 1., _intensity_ * 2.0);

                        vec3 contrastMin = _remap_(color.rgb, contrastLMin, contrastLMax, 0., 1.);

                        float intensityMapped = _remap_(_intensity_, 0.5, 1., 0., 1.0);
                        float contrastHMin = mix(0., 0.45, intensityMapped);
                        float contrastHMax = mix(1., 0.5, intensityMapped);

                        vec3 contrastMax = _remap_(color.rgb, contrastHMin, contrastHMax, 0., 1.);

                        return vec4(mix(contrastMin, contrastMax, step(_intensity_, 0.5)), color.a);
                    }



                        vec4 _mainImage_(vec2 vUV) {
                            vec4 color = _contrast_(vUV);
                            vec3 tinted = mix(color.rgb, _tint_, _amount_);
                            return vec4(tinted, color.a);
                        }


`,
                },
            ],
        },
    },
];
