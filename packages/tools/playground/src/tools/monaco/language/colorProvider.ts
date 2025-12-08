import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

/**
 *
 * @param lang The language to register the color provider for.
 */
export function RegisterColorProvider(lang: "javascript" | "typescript") {
    monaco.languages.registerColorProvider(lang, {
        provideColorPresentations: (_model: any, colorInfo: any) => {
            const c = colorInfo.color;
            const p = 100.0;
            const cvt = (n: number) => Math.round(n * p) / p;
            const label =
                c.alpha === undefined || c.alpha === 1.0 ? `(${cvt(c.red)}, ${cvt(c.green)}, ${cvt(c.blue)})` : `(${cvt(c.red)}, ${cvt(c.green)}, ${cvt(c.blue)}, ${cvt(c.alpha)})`;
            return [{ label }];
        },
        provideDocumentColors: (model: any) => {
            const digitGroup = "\\s*(\\d*(?:\\.\\d+)?)\\s*";
            const regex = `BABYLON\\.Color(?:3|4)\\s*\\(${digitGroup},${digitGroup},${digitGroup}(?:,${digitGroup})?\\)\\n{0}`;
            const matches = model.findMatches(regex, false, true, true, null, true);
            const num = (g: string) => (g === undefined ? undefined : Number(g));
            return matches.map((m: any) => ({
                color: { red: num(m.matches![1])!, green: num(m.matches![2])!, blue: num(m.matches![3])!, alpha: num(m.matches![4])! },
                range: {
                    startLineNumber: m.range.startLineNumber,
                    startColumn: m.range.startColumn + m.matches![0].indexOf("("),
                    endLineNumber: m.range.startLineNumber,
                    endColumn: m.range.endColumn,
                },
            }));
        },
    });
}
