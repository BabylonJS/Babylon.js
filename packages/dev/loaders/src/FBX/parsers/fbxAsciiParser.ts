/* eslint-disable @typescript-eslint/naming-convention, jsdoc/require-param, jsdoc/require-returns */
import { type FBXDocument, type FBXNode, type FBXProperty } from "../types/fbxTypes";

/**
 * Parse an ASCII FBX file into an FBXDocument.
 */
export function parseAsciiFBX(text: string): FBXDocument {
    const tokenizer = new Tokenizer(text);
    const version = parseVersion(text);
    const nodes: FBXNode[] = [];

    while (!tokenizer.isEOF()) {
        tokenizer.skipWhitespaceAndComments();
        if (tokenizer.isEOF()) {
            break;
        }
        const node = parseNodeFromTokens(tokenizer);
        if (node) {
            nodes.push(node);
        }
    }

    return { version, nodes };
}

/** Extract FBX version from the header comment (e.g. "; FBX 7.7.0 project file") */
function parseVersion(text: string): number {
    const match = text.match(/;\s*FBX\s+(\d+)\.(\d+)\.(\d+)/);
    if (!match) {
        throw new Error("Cannot determine FBX version from ASCII header");
    }
    return parseInt(match[1]) * 1000 + parseInt(match[2]) * 100 + parseInt(match[3]);
}

// ── Tokenizer ──────────────────────────────────────────────────────────────────

const enum TokenType {
    Identifier,
    Number,
    String,
    OpenBrace,
    CloseBrace,
    Colon,
    Comma,
    Star,
    EOF,
}

interface Token {
    type: TokenType;
    value: string;
    pos: number;
}

class Tokenizer {
    private pos = 0;
    private readonly len: number;

    constructor(private readonly text: string) {
        this.len = text.length;
    }

    isEOF(): boolean {
        this.skipWhitespaceAndComments();
        return this.pos >= this.len;
    }

    peek(): Token {
        const saved = this.pos;
        const tok = this.next();
        this.pos = saved;
        return tok;
    }

    next(): Token {
        this.skipWhitespaceAndComments();
        if (this.pos >= this.len) {
            return { type: TokenType.EOF, value: "", pos: this.pos };
        }

        const ch = this.text[this.pos];
        const startPos = this.pos;

        switch (ch) {
            case "{":
                this.pos++;
                return { type: TokenType.OpenBrace, value: "{", pos: startPos };
            case "}":
                this.pos++;
                return { type: TokenType.CloseBrace, value: "}", pos: startPos };
            case ":":
                this.pos++;
                return { type: TokenType.Colon, value: ":", pos: startPos };
            case ",":
                this.pos++;
                return { type: TokenType.Comma, value: ",", pos: startPos };
            case "*":
                this.pos++;
                return { type: TokenType.Star, value: "*", pos: startPos };
            case '"':
                return this.readString();
            default:
                if (this.isNumberStart(ch)) {
                    return this.readNumber();
                }
                if (this.isIdentStart(ch)) {
                    return this.readIdentifier();
                }
                throw new Error(`Unexpected character '${ch}' at position ${this.pos}`);
        }
    }

    expect(type: TokenType): Token {
        const tok = this.next();
        if (tok.type !== type) {
            throw new Error(`Expected token type ${type} but got ${tok.type} ('${tok.value}') at pos ${tok.pos}`);
        }
        return tok;
    }

    /** Look ahead to see if the next identifier + colon is a child node start */
    isNextNodeStart(): boolean {
        const saved = this.pos;
        this.skipWhitespaceAndComments();
        // Read the identifier
        if (this.pos < this.len && this.isIdentStart(this.text[this.pos])) {
            while (this.pos < this.len && this.isIdentChar(this.text[this.pos])) {
                this.pos++;
            }
            // Skip whitespace between identifier and potential colon
            while (this.pos < this.len && (this.text[this.pos] === " " || this.text[this.pos] === "\t")) {
                this.pos++;
            }
            const isNode = this.pos < this.len && this.text[this.pos] === ":";
            this.pos = saved;
            return isNode;
        }
        this.pos = saved;
        return false;
    }

    skipWhitespaceAndComments(): void {
        while (this.pos < this.len) {
            const ch = this.text[this.pos];
            if (ch === " " || ch === "\t" || ch === "\r" || ch === "\n") {
                this.pos++;
            } else if (ch === ";") {
                // Skip comment to end of line
                while (this.pos < this.len && this.text[this.pos] !== "\n") {
                    this.pos++;
                }
            } else {
                break;
            }
        }
    }

    private readString(): Token {
        const startPos = this.pos;
        this.pos++; // skip opening quote
        let value = "";
        while (this.pos < this.len && this.text[this.pos] !== '"') {
            if (this.text[this.pos] === "\\" && this.pos + 1 < this.len) {
                this.pos++;
                value += this.text[this.pos];
            } else {
                value += this.text[this.pos];
            }
            this.pos++;
        }
        if (this.pos < this.len) {
            this.pos++; // skip closing quote
        }
        return { type: TokenType.String, value, pos: startPos };
    }

    private readNumber(): Token {
        const startPos = this.pos;
        // Handle leading sign
        if (this.text[this.pos] === "-" || this.text[this.pos] === "+") {
            this.pos++;
        }
        while (this.pos < this.len && this.isDigit(this.text[this.pos])) {
            this.pos++;
        }
        if (this.pos < this.len && this.text[this.pos] === ".") {
            this.pos++;
            while (this.pos < this.len && this.isDigit(this.text[this.pos])) {
                this.pos++;
            }
        }
        // Scientific notation
        if (this.pos < this.len && (this.text[this.pos] === "e" || this.text[this.pos] === "E")) {
            this.pos++;
            if (this.pos < this.len && (this.text[this.pos] === "+" || this.text[this.pos] === "-")) {
                this.pos++;
            }
            while (this.pos < this.len && this.isDigit(this.text[this.pos])) {
                this.pos++;
            }
        }
        return { type: TokenType.Number, value: this.text.substring(startPos, this.pos), pos: startPos };
    }

    private readIdentifier(): Token {
        const startPos = this.pos;
        while (this.pos < this.len && this.isIdentChar(this.text[this.pos])) {
            this.pos++;
        }
        return { type: TokenType.Identifier, value: this.text.substring(startPos, this.pos), pos: startPos };
    }

    private isDigit(ch: string): boolean {
        return ch >= "0" && ch <= "9";
    }

    private isNumberStart(ch: string): boolean {
        if (this.isDigit(ch)) {
            return true;
        }
        if ((ch === "-" || ch === "+") && this.pos + 1 < this.len) {
            return this.isDigit(this.text[this.pos + 1]) || this.text[this.pos + 1] === ".";
        }
        return false;
    }

    private isIdentStart(ch: string): boolean {
        return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_";
    }

    private isIdentChar(ch: string): boolean {
        return this.isIdentStart(ch) || this.isDigit(ch) || ch === "|";
    }
}

// ── Node Parsing ───────────────────────────────────────────────────────────────

function parseNodeFromTokens(tokenizer: Tokenizer): FBXNode | null {
    const nameTok = tokenizer.peek();
    if (nameTok.type === TokenType.CloseBrace || nameTok.type === TokenType.EOF) {
        return null;
    }

    // Node name
    const identTok = tokenizer.next();
    if (identTok.type !== TokenType.Identifier) {
        throw new Error(`Expected identifier for node name, got '${identTok.value}' at pos ${identTok.pos}`);
    }
    const name = identTok.value;
    tokenizer.expect(TokenType.Colon);

    // Parse properties until we hit '{' or end-of-line content
    const properties: FBXProperty[] = [];
    const children: FBXNode[] = [];

    // Check for array shorthand: *count { a: ... }
    let peek = tokenizer.peek();
    if (peek.type === TokenType.Star) {
        // Array node like "Vertices: *25959 {"
        tokenizer.next(); // consume *
        const countTok = tokenizer.expect(TokenType.Number);
        const count = parseInt(countTok.value);
        tokenizer.expect(TokenType.OpenBrace);

        // Expect "a:" followed by comma-separated values
        const aTok = tokenizer.next();
        if (aTok.type === TokenType.Identifier && aTok.value === "a") {
            tokenizer.expect(TokenType.Colon);
            const values = parseArrayValues(tokenizer, count);
            properties.push({ type: "float64[]", value: new Float64Array(values) });
        }

        tokenizer.expect(TokenType.CloseBrace);
        return { name, properties, children };
    }

    // Parse inline properties (comma-separated values on the same logical line)
    // Values can be: numbers, strings, or bare identifiers (e.g. "T", "Y", "CullingOff")
    peek = tokenizer.peek();
    while (peek.type !== TokenType.OpenBrace && peek.type !== TokenType.CloseBrace && peek.type !== TokenType.EOF) {
        if (peek.type === TokenType.Number) {
            const tok = tokenizer.next();
            const numVal = parseNumericValue(tok.value);
            if (Number.isInteger(numVal) && !tok.value.includes(".") && !tok.value.includes("e") && !tok.value.includes("E")) {
                properties.push({ type: isInt32(numVal) ? "int32" : "int64", value: numVal });
            } else {
                properties.push({ type: "float64", value: numVal });
            }
        } else if (peek.type === TokenType.String) {
            const tok = tokenizer.next();
            properties.push({ type: "string", value: tok.value });
        } else if (peek.type === TokenType.Identifier) {
            // Check if this is a property value or the start of a new child node.
            // If the next non-whitespace after the identifier is ':', it's a child node name — stop.
            if (tokenizer.isNextNodeStart()) {
                break;
            }
            // Bare identifier as a property value (e.g. "T", "Y", "CullingOff")
            const tok = tokenizer.next();
            properties.push({ type: "string", value: tok.value });
        } else if (peek.type === TokenType.Comma) {
            tokenizer.next(); // consume comma
        } else {
            break;
        }
        peek = tokenizer.peek();
    }

    // Check for block body { ... }
    peek = tokenizer.peek();
    if (peek.type === TokenType.OpenBrace) {
        tokenizer.next(); // consume '{'
        // Parse child nodes
        while (true) {
            peek = tokenizer.peek();
            if (peek.type === TokenType.CloseBrace || peek.type === TokenType.EOF) {
                break;
            }
            const child = parseNodeFromTokens(tokenizer);
            if (child) {
                children.push(child);
            } else {
                break;
            }
        }
        tokenizer.expect(TokenType.CloseBrace);
    }

    return { name, properties, children };
}

function parseArrayValues(tokenizer: Tokenizer, count: number): number[] {
    const values: number[] = [];
    while (true) {
        const peek = tokenizer.peek();
        if (peek.type === TokenType.CloseBrace || peek.type === TokenType.EOF) {
            break;
        }
        if (peek.type === TokenType.Comma) {
            tokenizer.next();
            continue;
        }
        if (peek.type === TokenType.Number) {
            const tok = tokenizer.next();
            values.push(Number(tok.value));
        } else {
            break;
        }
    }
    if (values.length !== count) {
        throw new Error(`ASCII FBX array declared ${count} values but parsed ${values.length}`);
    }
    return values;
}

function parseNumericValue(str: string): number {
    return Number(str);
}

function isInt32(value: number): boolean {
    return value >= -2147483648 && value <= 2147483647;
}
