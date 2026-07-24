import { GetPathForComputed, transformPackageLocation } from "../../../../dev/buildTools/src/pathTransform";

describe("buildTools pathTransform", () => {
    describe("GetPathForComputed", () => {
        it("returns the computed path unchanged when the source file is not under a src directory", () => {
            const source = "/tmp/babylonjs-repro/packages/public/@babylonjs/shared-ui-components/tabs/lineWithFileButtonComponent.js";
            expect(GetPathForComputed("./fluent/hoc/fluentToolWrapper", source)).toBe("./fluent/hoc/fluentToolWrapper");
        });

        it("does not treat an ancestor directory that merely contains 'src' as the src anchor", () => {
            // Regression: a checkout located under ".../babylonjs-src/..." used to make
            // indexOf("src") match inside the ancestor directory name, producing an
            // absolute path that escaped the package and broke the emitted import.
            const deepSource = "/mnt/vss/_work/1/s/babylonjs-src/packages/public/@babylonjs/shared-ui-components/tabs/lineWithFileButtonComponent.js";
            const shallowSource = "/tmp/repro/packages/public/@babylonjs/shared-ui-components/tabs/lineWithFileButtonComponent.js";
            const computed = "./fluent/hoc/fluentToolWrapper";
            expect(GetPathForComputed(computed, deepSource)).toBe(computed);
            // The result must be independent of where the checkout sits on disk.
            expect(GetPathForComputed(computed, deepSource)).toBe(GetPathForComputed(computed, shallowSource));
        });

        it("anchors at a real 'src' path segment when the source file lives under one", () => {
            const source = "/mnt/vss/_work/1/s/babylonjs-src/packages/dev/sharedUiComponents/src/tabs/lineWithFileButtonComponent.ts";
            expect(GetPathForComputed("./fluent/hoc/fluentToolWrapper", source)).toBe(
                "/mnt/vss/_work/1/s/babylonjs-src/packages/dev/sharedUiComponents/src/./fluent/hoc/fluentToolWrapper"
            );
        });
    });

    describe("transformPackageLocation", () => {
        const options = {
            buildType: "es6" as const,
            basePackage: "@babylonjs/shared-ui-components",
            packageOnly: false,
            appendJS: false,
        };

        it("produces the same relative import regardless of checkout depth", () => {
            // Use src-anchored source paths so the result is fully determined by the
            // input (independent of the test runner's cwd), while still exercising a
            // deep checkout whose ancestor directory name contains "src".
            const location = "shared-ui-components/fluent/hoc/fluentToolWrapper";
            const shallow = "/tmp/repro/packages/dev/sharedUiComponents/src/tabs/lineWithFileButtonComponent.ts";
            const deep = "/mnt/vss/_work/1/s/babylonjs-src/packages/dev/sharedUiComponents/src/tabs/lineWithFileButtonComponent.ts";
            const resultShallow = transformPackageLocation(location, options, shallow);
            const resultDeep = transformPackageLocation(location, options, deep);
            expect(resultShallow).toBe("../fluent/hoc/fluentToolWrapper");
            expect(resultDeep).toBe(resultShallow);
            expect(resultDeep).not.toContain("babylonjs-src");
        });
    });
});
