import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";

// Nx restores file globs without pruning files absent from the cached revision.
export const createNodes = [
    "packages/public/**/package.json",
    (files, _options, context) =>
        files.flatMap((file) => {
            const { scripts } = JSON.parse(readFileSync(join(context.workspaceRoot, file), "utf8"));
            if (!scripts?.build || !scripts.clean) {
                return [];
            }
            return [
                [
                    file,
                    {
                        projects: {
                            [dirname(file)]: {
                                targets: {
                                    "clean-for-cache": {
                                        executor: "nx:run-script",
                                        options: { script: "clean" },
                                        dependsOn: ["^build"],
                                        cache: false,
                                    },
                                },
                            },
                        },
                    },
                ],
            ];
        }),
];
