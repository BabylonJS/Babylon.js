export type LangId = "javascript" | "typescript" | "wgsl" | "glsl" | "fx" | "txt";

/**
 * Gets the file extension from a file path.
 * @param p The file path to check.
 * @returns The file extension.
 */
export function ExtFromPath(p: string): LangId {
    const low = p.toLowerCase();
    if (low.endsWith(".ts") || low.endsWith(".tsx")) {
        return "typescript";
    }
    if (low.endsWith(".js") || low.endsWith(".jsx")) {
        return "javascript";
    }
    if (low.endsWith(".wgsl")) {
        return "wgsl";
    }
    if (low.endsWith(".glsl")) {
        return "glsl";
    }
    if (low.endsWith(".fx")) {
        return "fx";
    }
    return "txt";
}

/**
 *
 * @param text The content of the shader file.
 * @returns The detected language or the fallback.
 */
export function DetectFxLangFromContent(text: string): "wgsl" | "glsl" {
    const t = text || "";
    const isWGSL = /@group\(|@binding\(|@location\(|\bfn\b|\blet\b|\bvar\s*<|\btexture\w*\b|\bsampler\b/.test(t);
    const isGLSL = /#\s*version\b|\b(attribute|varying|precision)\b|\bvoid\s+main\s*\(/.test(t);
    if (isWGSL && !isGLSL) {
        return "wgsl";
    }
    if (isGLSL && !isWGSL) {
        return "glsl";
    }
    return "wgsl";
}

/**
 * Determines the language of a file based on its path and content.
 * @param path The file path to check.
 * @param fallback The fallback language if the path cannot be determined.
 * @param content The content of the file, used for more accurate language detection.
 * @returns The detected language or the fallback.
 */
export function MonacoLanguageFor(path: string, fallback: "javascript" | "typescript", content?: string) {
    const ext = ExtFromPath(path);
    if (ext === "typescript") {
        return "typescript";
    }
    if (ext === "javascript") {
        return "javascript";
    }
    if (ext === "wgsl") {
        return "wgsl";
    }
    if (ext === "glsl") {
        return "glsl";
    }
    if (ext === "fx") {
        return DetectFxLangFromContent(content || "");
    }
    return fallback;
}

/**
 *
 * @param fromPath
 * @param rel
 * @returns
 */
export function ResolveRelative(fromPath: string, rel: string) {
    const base = fromPath.split("/");
    base.pop();
    for (const part of rel.split("/")) {
        if (!part || part === ".") {
            continue;
        }
        if (part === "..") {
            base.pop();
        } else {
            base.push(part);
        }
    }
    return base.join("/");
}

/**
 * Picks the actual file path from a list of possible paths.
 * @param path The base path to check.
 * @param has A function that checks if a path exists.
 * @returns The actual file path if found, or null.
 */
export function PickActual(path: string, has: (p: string) => boolean): string | null {
    if (has(path)) {
        return path;
    }
    for (const ext of [".ts", ".tsx", ".js", ".mjs"]) {
        if (has(path + ext)) {
            return path + ext;
        }
    }
    return null;
}

/**
 * Strips the query string from a URL.
 * @param s string
 * @returns string
 */
export function StripQuery(s: string) {
    return s.replace(/\?.*$/, "");
}
