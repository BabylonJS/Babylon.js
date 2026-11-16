import { describe, it, expect } from "vitest";
import * as path from "path";
import * as ts from "typescript";

const DeclarationPath = path.resolve(__dirname, "../../../../../src/LibDeclarations/htmlInCanvas.d.ts");
const FixtureName = "htmlInCanvasTypesFixture.ts";

function getDiagnostics(source: string): string[] {
    const options: ts.CompilerOptions = {
        target: ts.ScriptTarget.ES2017,
        lib: ["lib.es2017.d.ts", "lib.dom.d.ts"],
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        types: [],
    };
    const host = ts.createCompilerHost(options);
    const getSourceFile = host.getSourceFile;
    host.getSourceFile = (fileName, languageVersion, onError, shouldCreate) => {
        if (path.basename(fileName) === FixtureName) {
            return ts.createSourceFile(fileName, source, languageVersion, true);
        }
        return getSourceFile.call(host, fileName, languageVersion, onError, shouldCreate);
    };
    const fileExists = host.fileExists;
    host.fileExists = (fileName) => path.basename(fileName) === FixtureName || fileExists.call(host, fileName);

    const program = ts.createProgram([DeclarationPath, FixtureName], options, host);
    return ts.getPreEmitDiagnostics(program).map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
}

describe("HTML-in-Canvas declarations", () => {
    it("keeps legacy drawElementImage calls with optional destination dimensions compiling", () => {
        const diagnostics = getDiagnostics(`
            declare const context: CanvasRenderingContext2D;
            declare const element: Element;
            declare const width: number | undefined;
            declare const height: number | undefined;

            const explicitUndefined: void = context.drawElementImage(element, 0, 0, 100, 100, 0, 0, undefined, undefined);
            const explicitUndefinedHeight: void = context.drawElementImage(element, 0, 0, 100, 100, 0, 0, 50, undefined);
            const optionalDimensions: void = context.drawElementImage(element, 0, 0, 100, 100, 0, 0, width, height);
            const widthOnly: void = context.drawElementImage(element, 0, 0, 100, 100, 0, 0, 50);
            const current: void = context.drawElementImage(element, 0, 0, 100, 100, 0, 0, 50, 50, { preserveElementGeometry: true });
            export { explicitUndefined, explicitUndefinedHeight, optionalDimensions, widthOnly, current };
        `);

        expect(diagnostics).toEqual([]);
    });
});
