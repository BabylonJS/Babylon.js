import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

/**
 *
 */
export function RegisterShaderLanguages() {
    const wgslId = "wgsl";
    const glslId = "glsl";
    const ensure = (id: string) => {
        try {
            monaco.languages.getLanguages().find((l) => l.id === id) || monaco.languages.register({ id });
        } catch {
            monaco.languages.register({ id });
        }
    };
    ensure(wgslId);
    ensure(glslId);

    const slashComments: any[] = [
        [/(\/\/.*$)/, "comment"],
        [/\/\*/, { token: "comment", next: "@comment" }],
    ];
    const numberRule: any[] = [/(\d+(\.\d+)?([eE][+-]?\d+)?[fF]?)/, "number"];
    const ident = /[A-Za-z_]\w*/;

    monaco.languages.setMonarchTokensProvider(wgslId, {
        defaultToken: "source",
        tokenizer: {
            root: [
                ...slashComments,
                numberRule,
                [/(struct|var|let|const|override|fn|return|if|else|switch|case|default|break|continue|loop|for|while|discard|enable|requires|type|alias)\b/, "keyword"],
                [/(true|false)/, "constant"],
                [/(i32|u32|f32|f16|vec[234](?:i|u|f)?|mat[234]x[234]|ptr|array|texture\w*|sampler|bool)/, "type"],
                [/@(binding|group|builtin|location|stage|vertex|fragment|compute|workgroup_size)/, "annotation"],
                [ident, "identifier"],
                [/\"([^\"\\]|\\.)*\"?/, "string"],
            ],
            comment: [
                [/[^/*]+/, "comment"],
                [/\*\//, "comment", "@pop"],
                [/./, "comment"],
            ],
        },
    } as any);

    monaco.languages.setMonarchTokensProvider(glslId, {
        defaultToken: "source",
        tokenizer: {
            root: [
                [/#\s*(version|define|undef|if|ifdef|ifndef|else|elif|endif|extension|pragma|line).*/, "meta"],
                ...slashComments,
                numberRule,
                [
                    /(attribute|varying|uniform|buffer|layout|in|out|inout|const|struct|return|if|else|switch|case|default|break|continue|discard|while|for|do|precision|highp|mediump|lowp)\b/,
                    "keyword",
                ],
                [/(void|bool|int|uint|float|double|mat[234](?:x[234])?|vec[234]|ivec[234]|u?sampler\w*|image\w*)/, "type"],
                [/(true|false)/, "constant"],
                [ident, "identifier"],
                [/"([^"\\]|\\.)*"?/, "string"],
            ],
            comment: [
                [/[^/*]+/, "comment"],
                [/\*\//, "comment", "@pop"],
                [/./, "comment"],
            ],
        },
    } as any);

    const cfg: monaco.languages.LanguageConfiguration = {
        comments: { lineComment: "//", blockComment: ["/*", "*/"] },
        brackets: [
            ["{", "}"],
            ["[", "]"],
            ["(", ")"],
        ],
        autoClosingPairs: [
            { open: "{", close: "}" },
            { open: "[", close: "]" },
            { open: "(", close: ")" },
            { open: '"', close: '"' },
        ],
    };
    monaco.languages.setLanguageConfiguration(wgslId, cfg);
    monaco.languages.setLanguageConfiguration(glslId, cfg);
}
