import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BuildShader } from "../../src/buildShaders";
import { externalArgs } from "../../src/utils";

describe.each(["Shaders", "ShadersWGSL"])("shader include generation (%s)", (shaderDirectory) => {
    let tempDir: string;
    let previousArgs: string[];

    beforeEach(() => {
        tempDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "bjs-shader-includes-")));
        previousArgs = externalArgs.splice(0);
    });

    afterEach(() => {
        externalArgs.splice(0, externalArgs.length, ...previousArgs);
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    const writeFile = (file: string, content: string) => {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, content);
        return file;
    };

    it.each([false, true])("keeps transitive core imports in the core package (explicit: %s)", (explicitCore) => {
        const coreDirectory = path.join(tempDir, "packages", "dev", "core", "src", shaderDirectory, "ShadersInclude");
        const addonDirectory = path.join(tempDir, "packages", "dev", "addons", "src", "atmosphere", shaderDirectory);
        writeFile(path.join(coreDirectory, "parent.fx"), "#include<nested>");
        writeFile(path.join(coreDirectory, "nested.fx"), "#include<leaf>");
        writeFile(path.join(coreDirectory, "leaf.fx"), "float leaf = 1.;");
        writeFile(path.join(addonDirectory, "ShadersInclude", "nested.fx"), "#include<wrong>");
        writeFile(path.join(addonDirectory, "ShadersInclude", "local.fx"), "float local = 1.;");
        if (explicitCore) {
            writeFile(path.join(addonDirectory, "ShadersInclude", "parent.fx"), "#include<wrong>");
        }
        const shader = writeFile(path.join(addonDirectory, "entry.fragment.fx"), `#include<local>\n#include<${explicitCore ? "core/" : ""}parent>`);

        BuildShader(shader, undefined, false);

        const generated = fs.readFileSync(shader.replace(".fx", ".ts"), "utf8");
        const suffix = shaderDirectory === "ShadersWGSL" ? "WGSL" : "";
        for (const name of ["leaf", "nested", "parent"]) {
            expect(generated).toContain(`import { ${name}${suffix} } from "core/${shaderDirectory}/ShadersInclude/${name}";`);
        }
        expect(generated).toContain(`import { local${suffix} } from "../${shaderDirectory}/ShadersInclude/local";`);
        expect(generated).toContain(`const includes = [local${suffix}, leaf${suffix}, nested${suffix}, parent${suffix}];`);
        expect(generated).not.toContain("wrong");
        expect(generated).not.toContain("#include<core/");
    });

    it("retains relative imports for core shaders", () => {
        const directory = path.join(tempDir, "packages", "dev", "core", "src", shaderDirectory);
        writeFile(path.join(directory, "ShadersInclude", "parent.fx"), "#include<nested>");
        writeFile(path.join(directory, "ShadersInclude", "nested.fx"), "float nested = 1.;");
        const shader = writeFile(path.join(directory, "entry.fragment.fx"), "#include<parent>");

        BuildShader(shader, undefined, true);

        const generated = fs.readFileSync(shader.replace(".fx", ".ts"), "utf8");
        const suffix = shaderDirectory === "ShadersWGSL" ? "WGSL" : "";
        for (const name of ["nested", "parent"]) {
            expect(generated).toContain(`import { ${name}${suffix} } from "./ShadersInclude/${name}";`);
        }
    });
});
