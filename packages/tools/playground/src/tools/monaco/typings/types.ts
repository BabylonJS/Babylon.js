/* eslint-disable jsdoc/require-jsdoc */

export type AddPathsFn = (spec: string, target: string) => void;

export type ParsedSpec = {
    raw: string; // as written by the user
    name: string; // @scope/pkg or pkg (no version, no subpath)
    version?: string; // "4.17.21" | "local" | "latest"
    subpath?: string; // "get" in "lodash@4.17.21/get"
    scoped: boolean;
};

export type RequestLocalResolve = {
    base: string; // e.g. "shader-object"
    fullSpec: string; // e.g. "shader-object@local"
};
