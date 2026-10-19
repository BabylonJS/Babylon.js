import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { addJsExtensionsToCompiledFiles } from "../../src/addJSToCompiledFiles";
import { prepareES6Build } from "../../src/prepareEs6Build";
import { externalArgs } from "../../src/utils";

vi.mock("fs", async (importOriginal) => ({ ...(await importOriginal<typeof import("fs")>()) }));

describe("build postprocessing", () => {
    let tempDir: string;
    let previousDirectory: string;
    let previousArgs: string[];

    beforeEach(() => {
        tempDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "bjs-postprocessing-")));
        previousDirectory = process.cwd();
        previousArgs = externalArgs.splice(0);
        process.chdir(tempDir);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        externalArgs.splice(0, externalArgs.length, ...previousArgs);
        process.chdir(previousDirectory);
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    const writeFile = (name: string, content: string) => {
        const file = path.join(tempDir, name);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, content);
        const timestamp = new Date("2000-01-01T00:00:00Z");
        fs.utimesSync(file, timestamp, timestamp);
        return file;
    };

    describe("import extensions", () => {
        it.each([false, true])("preserves transformations and skips unchanged writes (mjs: %s)", (forceMJS) => {
            const extension = forceMJS ? ".mjs" : ".js";
            writeFile(`dependency${extension}`, "export const value = 1;");
            const source = [
                'import { value } from "./dependency";',
                'export { value } from "./dependency";',
                'import "./dependency";',
                'const loaded = import("./dependency");',
                'declare module "./dependency" {}',
            ].join("\n");
            const file = writeFile("entry.js", source);
            const write = vi.spyOn(fs, "writeFileSync");

            addJsExtensionsToCompiledFiles([file], forceMJS);

            expect(fs.readFileSync(file, "utf8")).toBe(source.replaceAll("./dependency", `./dependency${extension}`));
            expect(write.mock.calls).toEqual([[file, source.replaceAll("./dependency", `./dependency${extension}`)]]);
            const timestamp = fs.statSync(file).mtimeMs;
            write.mockClear();

            addJsExtensionsToCompiledFiles([file], forceMJS);

            expect(write).not.toHaveBeenCalled();
            expect(fs.statSync(file).mtimeMs).toBe(timestamp);
        });

        it("checks each resolved dependency once across files and import kinds", () => {
            const dependency = writeFile("dependency.js", "export const value = 1;");
            const first = writeFile("entry.js", 'import { value } from "./dependency.js";\nimport "./dependency.js";');
            const second = writeFile("nested/entry.d.ts", 'export { value } from "../dependency.js";\ntype Loaded = typeof import("../dependency.js");');
            const exists = vi.spyOn(fs, "existsSync");

            addJsExtensionsToCompiledFiles([first, second], false);

            expect(exists.mock.calls).toEqual([[dependency]]);
        });

        it("resolves identical specifiers separately in different directories", () => {
            writeFile("dependency.js", "export const value = 1;");
            const first = writeFile("entry.js", 'import "./dependency.js";');
            const second = writeFile("nested/entry.js", 'import "./dependency.js";');
            vi.spyOn(console, "log").mockImplementation(() => {});

            expect(() => addJsExtensionsToCompiledFiles([first, second], false)).toThrow("File ./dependency.js does not exist");
        });

        it.each(['import { value } from "./missing.js";', 'import "./missing.js";', 'const loaded = import("./missing.js");'])(
            "still validates unchanged files containing %s",
            (source) => {
                const file = writeFile("entry.js", source);
                const timestamp = fs.statSync(file).mtimeMs;
                vi.spyOn(console, "log").mockImplementation(() => {});

                expect(() => addJsExtensionsToCompiledFiles([file], false)).toThrow("File ./missing.js does not exist");
                expect(fs.statSync(file).mtimeMs).toBe(timestamp);
            }
        );

        it("does not reuse successful validation across invocations", () => {
            const dependency = writeFile("dependency.js", "export const value = 1;");
            const file = writeFile("entry.js", 'import "./dependency.js";');
            addJsExtensionsToCompiledFiles([file], false);
            fs.unlinkSync(dependency);
            vi.spyOn(console, "log").mockImplementation(() => {});

            expect(() => addJsExtensionsToCompiledFiles([file], false)).toThrow("File ./dependency.js does not exist");
        });

        it("propagates failures when writing transformed files", () => {
            writeFile("dependency.js", "export const value = 1;");
            const file = writeFile("entry.js", 'import "./dependency";');
            vi.spyOn(fs, "writeFileSync").mockImplementation(() => {
                throw new Error("write failed");
            });

            expect(() => addJsExtensionsToCompiledFiles([file], false)).toThrow("write failed");
        });
    });

    describe("constant inlining", () => {
        it("preserves output while leaving unrelated and already-inlined files untouched", async () => {
            const constants = writeFile("constants.js", 'export class Constants {}\nConstants.VALUE = 7;\nConstants.LABEL = "label";');
            const untouched = writeFile("untouched.js", "export const value = 42;");
            const file = writeFile("entry.js", ['import { Constants } from "./constants.js";', "const values = [Constants.VALUE, Constants.VALUE, Constants.LABEL];"].join("\n"));
            externalArgs.push("--constFile", constants);
            const untouchedTimestamp = fs.statSync(untouched).mtimeMs;
            const constantsTimestamp = fs.statSync(constants).mtimeMs;
            const write = vi.spyOn(fs, "writeFileSync");

            await prepareES6Build();

            expect(fs.readFileSync(file, "utf8")).toBe("\nconst values = [7, 7, `label`];");
            expect(write.mock.calls).toEqual([[file, "\nconst values = [7, 7, `label`];"]]);
            expect(fs.statSync(untouched).mtimeMs).toBe(untouchedTimestamp);
            expect(fs.statSync(constants).mtimeMs).toBe(constantsTimestamp);
            const timestamp = fs.statSync(file).mtimeMs;
            write.mockClear();

            await prepareES6Build();

            expect(write).not.toHaveBeenCalled();
            expect(fs.statSync(file).mtimeMs).toBe(timestamp);
        });

        it("reports write failures through the existing nonzero exit path", async () => {
            const constants = writeFile("constants.js", "export class Constants {}\nConstants.VALUE = 7;");
            writeFile("entry.js", "const value = Constants.VALUE;");
            externalArgs.push("--constFile", constants);
            const failure = new Error("write failed");
            vi.spyOn(fs, "writeFileSync").mockImplementation(() => {
                throw failure;
            });
            const log = vi.spyOn(console, "log").mockImplementation(() => {});
            const exit = vi.spyOn(process, "exit").mockImplementation(() => {
                throw new Error("build failed");
            });

            await expect(prepareES6Build()).rejects.toThrow("build failed");
            expect(log).toHaveBeenCalledWith(failure);
            expect(exit).toHaveBeenCalledWith(1);
        });
    });
});
