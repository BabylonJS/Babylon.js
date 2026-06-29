import { type Nullable } from "core/types";

// Placeholder that stands in for a string/template literal once it has been
// extracted from the source. A NUL character can never appear in real TS/JS
// source, so it is a safe sentinel that the detection regex can key off of.
const LiteralPlaceholderChar = "\u0000";

// Matches Parse.../Get...FlowGraph...FromSnippetAsync(<literal placeholder>).
// The argument has already been replaced by an indexed literal placeholder, so
// a call whose keyword sits inside a string/comment can never reach this regex.
const SnippetCallRegex = new RegExp(`FlowGraph[A-Za-z]*FromSnippetAsync\\s*\\(\\s*${LiteralPlaceholderChar}(\\d+)${LiteralPlaceholderChar}`);

interface ITokenizedSource {
    /** The source with comments removed and string/template literals replaced by indexed placeholders. */
    code: string;
    /** The extracted literals (including their surrounding quote characters), indexed by placeholder. */
    literals: string[];
}

/**
 * Walk a TS/JS source string and produce a version where:
 * - line comments (`// ...`) and block comments (`/* ... *\/`) are removed, and
 * - string and template literals are replaced by indexed placeholders.
 *
 * Tracking literal state while walking ensures that `//` or `/*` sequences that
 * appear inside a string (e.g. a `"https://..."` URL) are not mistaken for the
 * start of a comment, and that a `FromSnippetAsync(...)` sequence that only
 * appears inside a string literal collapses into a single placeholder rather
 * than surviving as code.
 * @param source - the raw playground source
 * @returns the scrubbed code and the literals that were lifted out of it
 */
function TokenizeSource(source: string): ITokenizedSource {
    const literals: string[] = [];
    let code = "";
    const length = source.length;
    let i = 0;

    while (i < length) {
        const char = source[i];
        const nextChar = i + 1 < length ? source[i + 1] : "";

        // Line comment: drop everything up to (but not including) the newline.
        if (char === "/" && nextChar === "/") {
            i += 2;
            while (i < length && source[i] !== "\n") {
                i++;
            }
            continue;
        }

        // Block comment: drop everything up to and including the closing `*/`.
        if (char === "/" && nextChar === "*") {
            i += 2;
            while (i < length && !(source[i] === "*" && source[i + 1] === "/")) {
                i++;
            }
            i += 2; // skip the closing `*/` (safe even when the comment is unterminated)
            code += " ";
            continue;
        }

        // String or template literal: consume the whole literal (honoring escapes)
        // and replace it with an indexed placeholder.
        if (char === '"' || char === "'" || char === "`") {
            const quote = char;
            let literal = char;
            i++;
            while (i < length) {
                const literalChar = source[i];
                if (literalChar === "\\") {
                    // Keep the escape sequence intact so a quote it escapes does not end the literal.
                    literal += literalChar + (i + 1 < length ? source[i + 1] : "");
                    i += 2;
                    continue;
                }
                literal += literalChar;
                i++;
                if (literalChar === quote) {
                    break;
                }
            }
            code += `${LiteralPlaceholderChar}${literals.length}${LiteralPlaceholderChar}`;
            literals.push(literal);
            continue;
        }

        code += char;
        i++;
    }

    return { code, literals };
}

/**
 * Strip the surrounding quote characters from a captured literal and return its
 * trimmed inner text, or null when there is nothing meaningful inside.
 * @param literal - a literal including its surrounding quote characters
 * @returns the inner snippet id, or null
 */
function ExtractIdFromLiteral(literal: string | undefined): Nullable<string> {
    if (!literal || literal.length < 2) {
        return null;
    }
    const inner = literal.slice(1, -1).trim();
    return inner.length > 0 ? inner : null;
}

/**
 * Scan playground source strings for a live flow graph snippet reference such as
 * `ParseFlowGraphCoordinatorFromSnippetAsync("#ABC123#0", ...)` and return the
 * referenced snippet id.
 *
 * Comments are scrubbed before matching, so a commented-out loader (a deliberately
 * inert preview scene) does NOT count as a live reference. References that only
 * appear inside string/URL literals are likewise ignored. The first live match
 * across the provided sources wins.
 * @param sources - the playground source strings to scan (e.g. main code plus extra files)
 * @returns the referenced flow graph snippet id, or null when no live reference is found
 */
export function DetectFlowGraphSnippetId(sources: ReadonlyArray<Nullable<string> | undefined>): Nullable<string> {
    for (const source of sources) {
        if (!source) {
            continue;
        }
        const { code, literals } = TokenizeSource(source);
        const match = SnippetCallRegex.exec(code);
        if (match) {
            const id = ExtractIdFromLiteral(literals[Number(match[1])]);
            if (id) {
                return id;
            }
        }
    }
    return null;
}
