export const optimizedSmartFilterBlocks = [
    {
        fragment: {
            defines: [],
            const: `
const float _videoPixelatePower_ = 6.0;
const float _videoPixelateMin_ = 10.0;
const float _videoPixelateMax_ = 1920.0;
`,
            uniform: `
uniform float _intensity_;
uniform bool _disabled_;
uniform vec2 _aspect_;
uniform sampler2D _input_;
`,
            mainFunctionName: `_pixelate_`,
            functions: [
                {
                    name: `_pixelate_`,
                    params: ``,
                    code: `

                    vec4 _pixelate_(vec2 vUV) {
                        if (!_disabled_) {
                            float pixelateStrength = mix(_videoPixelateMin_, _videoPixelateMax_, pow(1. - _intensity_, _videoPixelatePower_));
                            vec2 _pixelate_ = vec2(pixelateStrength * _aspect_.x, pixelateStrength);
                            vec2 pixelSize = vec2(1. / _pixelate_);
                            vUV = pixelSize * (floor(_pixelate_ * vUV) + 0.5);
                        }
                        return texture2D(_input_, vUV);
                    }



`,
                },
            ],
        },
    },
];
