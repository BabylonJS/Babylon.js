import { type ISdfListOp } from "../../sdf/sdfListOp";
import { type ISdfLayer, type ISdfLayerOffset, type ISdfPayload, type ISdfReference, type ISdfSubLayer } from "../../sdf/sdfLayer";
import {
    type ISdfAttributeSpec,
    type ISdfCompositionFields,
    type ISdfPrimSpec,
    type ISdfPropertySpec,
    type ISdfRelationshipSpec,
    type ISdfVariantSetSpec,
    type ISdfVariantSpec,
    type SdfInterpolation,
    type SdfSpecifier,
    type SdfVariability,
} from "../../sdf/sdfSpec";
import { type SdfArrayValueType, type SdfMetadata, type SdfScalarValueType, type SdfValue, type SdfValueType } from "../../sdf/sdfValue";
import { UsdResourceLimitError, ValidateResourceLimit } from "../../../usdErrors";

const DiagnosticMetadataKey = "parser:diagnostics";

type TokenKind = "identifier" | "number" | "string" | "asset" | "path" | "symbol" | "eof";
type ListOperation = "prepend" | "append" | "add" | "delete" | "reorder";
type RawValue = boolean | number | string | IRawNumber | IRawAsset | IRawPath | IRawDictionary | IRawValueBlock | RawValue[];
const MaxUsdaDiagnostics = 256;
// Shared cap on structural nesting (prim bodies and variant bodies) and on value nesting
// (arrays/tuples/dictionaries). Both bound untrusted input so pathological depth is rejected with a
// typed parser error instead of a native RangeError, without penalizing wide (sibling-heavy) stages.
const MaxNestingDepth = 256;
const MaxValueNestingDepth = 256;

/** Configurable, validated resource ceilings for the USDA text parser. All are finite, non-negative safe integers. */
export interface IUsdaParserLimits {
    /** Maximum decoded USDA text size, measured as UTF-8 bytes. */
    maxInputBytes: number;
    /** Maximum number of non-EOF lexer tokens the source may produce. */
    maxTokenCount: number;
    /** Maximum number of token-consumption steps the parser may spend building the layer. */
    maxParserWork: number;
}

/** Safe default parser resource limits. Sized so any well-formed in-profile USDA text parses, while adversarial input is rejected with a typed {@link UsdResourceLimitError}. */
export const DefaultUsdaParserLimits: IUsdaParserLimits = {
    maxInputBytes: 256 * 1024 * 1024,
    maxTokenCount: 5_000_000,
    maxParserWork: 10_000_000,
};

interface IToken {
    kind: TokenKind;
    value: string;
    line: number;
    column: number;
}

interface IRawAsset {
    kind: "asset";
    value: string;
}

interface IRawNumber {
    kind: "number";
    value: string;
}

interface IRawPath {
    kind: "path";
    value: string;
}

interface IRawDictionary {
    kind: "dictionary";
    value: Record<string, RawValue>;
    // Members authored with an explicit type (e.g. `float ratio = 1`) are resolved to their tagged
    // Sdf value at parse time so downstream inference does not silently re-type them.
    resolved?: Record<string, SdfValue>;
}

// A `None` value block authored for an attribute, relationship target list, or dictionary member.
// Represents a deliberately absent opinion rather than a zero/empty coercion.
interface IRawValueBlock {
    kind: "block";
}

/** Recoverable USDA parse diagnostic emitted while building the Sdf layer. */
export interface IUsdaParseDiagnostic {
    /** Human-readable parser diagnostic. */
    message: string;
    /** 1-based source line where the diagnostic was produced. */
    line: number;
    /** 1-based source column where the diagnostic was produced. */
    column: number;
}

/** Measured resource usage of a successful parse. Exposed for tests and boundary tuning; not public API. @internal */
export interface IUsdaParseAccounting {
    /** Decoded text size in UTF-8 bytes. */
    inputBytes: number;
    /** Non-EOF tokens produced by the lexer. */
    tokenCount: number;
    /** Token-consumption steps spent by the parser. */
    parserWork: number;
}

/** Result shape for callers that need recoverable diagnostics separately from the parsed layer. */
export interface IUsdaParseResult {
    /** Parsed Sdf layer. */
    layer: ISdfLayer;
    /** Recoverable parse diagnostics. Fatal header errors are thrown instead. */
    diagnostics: IUsdaParseDiagnostic[];
    /** Measured resource usage of the successful parse. */
    accounting: IUsdaParseAccounting;
}

interface IBodyTarget extends ISdfCompositionFields {
    properties: Record<string, ISdfPropertySpec>;
    children: ISdfPrimSpec[];
    active?: boolean;
    instanceable?: boolean;
    kind?: string;
}

/**
 * Parses ASCII USDA text into the frozen Sdf layer data model.
 * Recoverable diagnostics are also attached to `layer.metadata["parser:diagnostics"]` as a dictionary
 * of string values so the primary return remains an `ISdfLayer`; use `ParseUsdaWithDiagnostics` when
 * the diagnostics should be consumed out-of-band.
 * @param text USDA source text.
 * @param identifier Layer identifier to store on the returned Sdf layer.
 * @param limits optional validated resource ceilings, defaulting to {@link DefaultUsdaParserLimits}.
 * @returns Parsed Sdf layer.
 */
export function ParseUsda(text: string, identifier: string, limits?: Partial<IUsdaParserLimits>): ISdfLayer {
    const result = ParseUsdaWithDiagnostics(text, identifier, limits);
    if (result.diagnostics.length > 0) {
        result.layer.metadata = result.layer.metadata ?? {};
        result.layer.metadata[DiagnosticMetadataKey] = DiagnosticsToMetadata(result.diagnostics);
    }
    return result.layer;
}

/**
 * Parses ASCII USDA text into the frozen Sdf layer data model and returns recoverable diagnostics separately.
 *
 * Exported for unit tests and the intra-module {@link ParseUsda} entry point only; it is not re-exported from
 * the loaders package root and is not public API.
 * @internal
 * @param text USDA source text.
 * @param identifier Layer identifier to store on the returned Sdf layer.
 * @param limits optional validated resource ceilings, defaulting to {@link DefaultUsdaParserLimits}.
 * @returns Parsed Sdf layer plus recoverable diagnostics.
 */
export function ParseUsdaWithDiagnostics(text: string, identifier: string, limits?: Partial<IUsdaParserLimits>): IUsdaParseResult {
    const effectiveLimits = ResolveUsdaParserLimits(limits);
    const inputBytes = Utf8ByteLength(text);
    if (inputBytes > effectiveLimits.maxInputBytes) {
        throw new UsdResourceLimitError("input-bytes", effectiveLimits.maxInputBytes, `USDA parser: input size exceeds the ${effectiveLimits.maxInputBytes}-byte resource cap.`, {
            actual: inputBytes,
            path: identifier,
        });
    }

    const header = /^\uFEFF?\s*#usda\s+(\d+)\.(\d+)(?:\.(\d+))?(?:\s|$)/.exec(text);
    if (!header) {
        throw new Error("USD: not a valid USDA document (missing '#usda 1.0' header).");
    }

    const [, major, minor, patch] = header;
    // AOUSD authoring tools stamp cosmetic patch levels (e.g. `#usda 1.0.32`); treat any `1.0.x` as
    // USDA 1.0. Newer major/minor versions imply unsupported grammar and are rejected explicitly.
    if (major !== "1" || minor !== "0") {
        const version = patch !== undefined ? `${major}.${minor}.${patch}` : `${major}.${minor}`;
        throw new Error(`USD: unsupported USDA version '${version}'; only '#usda 1.0' is supported.`);
    }

    const lexer = new UsdaLexer(text, header[0].length, effectiveLimits.maxTokenCount, identifier);
    const { tokens, diagnostics } = lexer.scan();
    const parser = new UsdaParser(tokens, identifier, effectiveLimits.maxParserWork, diagnostics);
    const result = parser.parseLayer();
    return {
        layer: result.layer,
        diagnostics: result.diagnostics,
        accounting: { inputBytes, tokenCount: tokens.length - 1, parserWork: parser.work },
    };
}

function ResolveUsdaParserLimits(limits?: Partial<IUsdaParserLimits>): IUsdaParserLimits {
    return {
        maxInputBytes: limits?.maxInputBytes !== undefined ? ValidateResourceLimit(limits.maxInputBytes, "maxInputBytes") : DefaultUsdaParserLimits.maxInputBytes,
        maxTokenCount: limits?.maxTokenCount !== undefined ? ValidateResourceLimit(limits.maxTokenCount, "maxTokenCount") : DefaultUsdaParserLimits.maxTokenCount,
        maxParserWork: limits?.maxParserWork !== undefined ? ValidateResourceLimit(limits.maxParserWork, "maxParserWork") : DefaultUsdaParserLimits.maxParserWork,
    };
}

// Computes the exact UTF-8 byte length of a UTF-16 JS string without allocating an encoded copy, so the
// input-bytes cap and its reported `actual` reflect real bytes; allocating a second full TextEncoder
// buffer would itself defeat the allocation the cap is meant to bound. Lone surrogates count as 3 bytes,
// matching TextEncoder's U+FFFD replacement. A full pass (not early-exit) is used so the exact byte count
// is available for both accounting and the error's `actual`.
function Utf8ByteLength(text: string): number {
    let bytes = 0;
    for (let index = 0; index < text.length; index++) {
        const code = text.charCodeAt(index);
        if (code <= 0x7f) {
            bytes += 1;
        } else if (code <= 0x7ff) {
            bytes += 2;
        } else if (code >= 0xd800 && code <= 0xdbff && index + 1 < text.length) {
            const next = text.charCodeAt(index + 1);
            if (next >= 0xdc00 && next <= 0xdfff) {
                bytes += 4;
                index++;
            } else {
                bytes += 3;
            }
        } else {
            bytes += 3;
        }
    }
    return bytes;
}

class UsdaLexer {
    private _position: number;
    private _line = 1;
    private _column = 1;
    private readonly _diagnostics: IUsdaParseDiagnostic[] = [];

    public constructor(
        private readonly _text: string,
        startIndex: number,
        private readonly _maxTokenCount: number,
        private readonly _identifier: string
    ) {
        this._position = 0;
        while (this._position < startIndex) {
            this._advance();
        }
    }

    public scan(): { tokens: IToken[]; diagnostics: IUsdaParseDiagnostic[] } {
        const tokens: IToken[] = [];
        let tokenCount = 0;
        while (!this._isAtEnd()) {
            this._skipWhitespaceAndComments();
            if (this._isAtEnd()) {
                break;
            }

            tokenCount++;
            if (tokenCount > this._maxTokenCount) {
                throw new UsdResourceLimitError("token-count", this._maxTokenCount, `USDA parser: token count exceeds the ${this._maxTokenCount}-token resource cap.`, {
                    actual: tokenCount,
                    path: this._identifier,
                });
            }

            const line = this._line;
            const column = this._column;
            const char = this._peekChar();
            if (char === '"' || char === "'") {
                tokens.push({ kind: "string", value: this._readString(line, column), line, column });
            } else if (char === "@") {
                tokens.push({ kind: "asset", value: this._readDelimited("@", "@", "asset reference", line, column), line, column });
            } else if (char === "<") {
                tokens.push({ kind: "path", value: this._readDelimited("<", ">", "path reference", line, column), line, column });
            } else if (IsSymbol(char)) {
                this._advance();
                tokens.push({ kind: "symbol", value: char, line, column });
            } else if (IsNumberStart(char, this._peekChar(1))) {
                tokens.push({ kind: "number", value: this._readNumber(line, column), line, column });
            } else {
                tokens.push({ kind: "identifier", value: this._readIdentifier(), line, column });
            }
        }
        tokens.push({ kind: "eof", value: "", line: this._line, column: this._column });
        return { tokens, diagnostics: this._diagnostics };
    }

    private _skipWhitespaceAndComments(): void {
        let skipped = true;
        while (skipped && !this._isAtEnd()) {
            skipped = false;
            while (/\s/.test(this._peekChar())) {
                this._advance();
                skipped = true;
                if (this._isAtEnd()) {
                    return;
                }
            }
            if (this._peekChar() === "#") {
                this._advanceUntilLineEnd();
                skipped = true;
            } else if (this._peekChar() === "/" && this._peekChar(1) === "/") {
                this._advanceUntilLineEnd();
                skipped = true;
            } else if (this._peekChar() === "/" && this._peekChar(1) === "*") {
                const commentLine = this._line;
                const commentColumn = this._column;
                this._advance();
                this._advance();
                while (!this._isAtEnd() && !(this._peekChar() === "*" && this._peekChar(1) === "/")) {
                    this._advance();
                }
                if (this._isAtEnd()) {
                    this._diagnose("Unterminated block comment.", commentLine, commentColumn);
                } else {
                    this._advance();
                    this._advance();
                }
                skipped = true;
            }
        }
    }

    private _readString(line: number, column: number): string {
        const quote = this._peekChar();
        if (this._peekChar(1) === quote && this._peekChar(2) === quote) {
            this._advance();
            this._advance();
            this._advance();
            let value = "";
            while (!this._isAtEnd() && !(this._peekChar() === quote && this._peekChar(1) === quote && this._peekChar(2) === quote)) {
                const char = this._advance();
                if (char === "\\" && !this._isAtEnd()) {
                    value += DecodeEscape(this._advance());
                } else {
                    value += char;
                }
            }
            if (this._isAtEnd()) {
                this._diagnose("Unterminated triple-quoted string.", line, column);
                return value;
            }
            this._advance();
            this._advance();
            this._advance();
            return value;
        }

        this._advance();
        let value = "";
        while (!this._isAtEnd() && this._peekChar() !== quote && this._peekChar() !== "\n") {
            const char = this._advance();
            if (char === "\\" && !this._isAtEnd()) {
                value += DecodeEscape(this._advance());
            } else {
                value += char;
            }
        }
        if (this._peekChar() !== quote) {
            this._diagnose("Unterminated string literal.", line, column);
            return value;
        }
        this._advance();
        return value;
    }

    private _readDelimited(open: string, close: string, label: string, line: number, column: number): string {
        this._advance();
        let value = "";
        while (!this._isAtEnd() && this._peekChar() !== close && this._peekChar() !== "\n") {
            const char = this._advance();
            if (char === "\\" && !this._isAtEnd()) {
                value += this._advance();
            } else {
                value += char;
            }
        }
        if (this._peekChar() !== close) {
            this._diagnose(`Unterminated ${label}.`, line, column);
            return value;
        }
        this._advance();
        return value;
    }

    private _readNumber(line: number, column: number): string {
        let value = "";
        if (this._peekChar() === "+" || this._peekChar() === "-") {
            value += this._advance();
        }
        while (/\d/.test(this._peekChar())) {
            value += this._advance();
        }
        if (this._peekChar() === ".") {
            value += this._advance();
            while (/\d/.test(this._peekChar())) {
                value += this._advance();
            }
        }
        if (this._peekChar().toLowerCase() === "e") {
            value += this._advance();
            if (this._peekChar() === "+" || this._peekChar() === "-") {
                value += this._advance();
            }
            if (!/\d/.test(this._peekChar())) {
                this._diagnose(`Malformed exponent in number literal '${value}'.`, line, column);
            }
            while (/\d/.test(this._peekChar())) {
                value += this._advance();
            }
        }
        return value;
    }

    private _readIdentifier(): string {
        let value = "";
        while (!this._isAtEnd()) {
            const char = this._peekChar();
            if (/\s/.test(char) || IsSymbol(char) || char === "#" || char === "@" || char === "<" || char === ">" || char === '"' || char === "'") {
                break;
            }
            if (char === "/" && (this._peekChar(1) === "/" || this._peekChar(1) === "*")) {
                break;
            }
            value += this._advance();
        }
        return value;
    }

    private _advanceUntilLineEnd(): void {
        while (!this._isAtEnd() && this._peekChar() !== "\n") {
            this._advance();
        }
    }

    private _diagnose(message: string, line: number, column: number): void {
        if (this._diagnostics.length >= MaxUsdaDiagnostics) {
            return;
        }
        this._diagnostics.push({ message, line, column });
    }

    private _advance(): string {
        const char = this._text[this._position] ?? "";
        this._position++;
        if (char === "\n") {
            this._line++;
            this._column = 1;
        } else {
            this._column++;
        }
        return char;
    }

    private _peekChar(offset = 0): string {
        return this._text[this._position + offset] ?? "";
    }

    private _isAtEnd(): boolean {
        return this._position >= this._text.length;
    }
}

class UsdaParser {
    private _nestingDepth = 0;
    private _valueDepth = 0;
    private _position = 0;
    private _work = 0;
    private readonly _diagnostics: IUsdaParseDiagnostic[];

    public constructor(
        private readonly _tokens: IToken[],
        private readonly _identifier: string,
        private readonly _maxParserWork: number,
        lexerDiagnostics: IUsdaParseDiagnostic[] = []
    ) {
        this._diagnostics = [...lexerDiagnostics];
    }

    public get work(): number {
        return this._work;
    }

    public parseLayer(): { layer: ISdfLayer; diagnostics: IUsdaParseDiagnostic[] } {
        const layer: ISdfLayer = {
            identifier: this._identifier,
            subLayers: [],
            rootPrims: [],
        };

        this._skipDelimiters();
        if (this._peek().value === "(") {
            this._parseLayerMetadata(layer);
        }

        while (!this._isAtEnd()) {
            this._skipDelimiters();
            const prim = this._tryParsePrim("");
            if (prim) {
                layer.rootPrims.push(prim);
            } else if (!this._isAtEnd()) {
                this._diagnose(`Unexpected token '${this._peek().value}' at layer scope.`);
                this._consume();
            }
        }

        return { layer, diagnostics: this._diagnostics };
    }

    private _parseLayerMetadata(layer: ISdfLayer): void {
        this._expectSymbol("(");
        while (!this._isAtEnd() && this._peek().value !== ")") {
            this._skipDelimiters();
            if (this._peek().value === ")") {
                break;
            }
            const key = this._consumeKey();
            if (key === undefined) {
                this._consume();
                continue;
            }
            if (!this._matchSymbol("=")) {
                this._diagnose(`Expected '=' after layer metadata key '${key}'.`);
                continue;
            }

            if (key === "subLayers") {
                layer.subLayers = this._parseSubLayers();
                continue;
            }

            const value = this._parseRawValue();
            switch (key) {
                case "upAxis": {
                    const upAxis = RawToString(value);
                    if (upAxis === "Y" || upAxis === "Z") {
                        layer.upAxis = upAxis;
                    } else {
                        this._diagnose(`Unsupported upAxis '${upAxis}'.`);
                    }
                    break;
                }
                case "metersPerUnit":
                    layer.metersPerUnit = RawToNumber(value);
                    break;
                case "timeCodesPerSecond":
                    layer.timeCodesPerSecond = RawToNumber(value);
                    break;
                case "framesPerSecond":
                    layer.framesPerSecond = RawToNumber(value);
                    break;
                case "startTimeCode":
                    layer.startTimeCode = RawToNumber(value);
                    break;
                case "endTimeCode":
                    layer.endTimeCode = RawToNumber(value);
                    break;
                case "defaultPrim":
                    layer.defaultPrim = RawToString(value);
                    break;
                default:
                    AddMetadata(layer, key, InferSdfValue(value));
                    break;
            }
        }
        this._expectSymbol(")");
    }

    private _parseSubLayers(): ISdfSubLayer[] {
        const subLayers: ISdfSubLayer[] = [];
        if (!this._expectSymbol("[")) {
            return subLayers;
        }
        while (!this._isAtEnd() && this._peek().value !== "]") {
            this._skipDelimiters();
            if (this._peek().value === "]") {
                break;
            }
            if (this._peek().kind !== "asset" && this._peek().kind !== "string") {
                this._diagnose("Expected subLayer asset path.");
                this._consume();
                continue;
            }
            const assetPath = this._consume().value;
            const layerOffset = this._tryParseLayerOffset();
            const subLayer: ISdfSubLayer = { assetPath };
            if (layerOffset) {
                subLayer.layerOffset = layerOffset;
            }
            subLayers.push(subLayer);
            this._matchSymbol(",");
        }
        this._expectSymbol("]");
        return subLayers;
    }

    private _tryParsePrim(parentPath: string): ISdfPrimSpec | undefined {
        const specifier = this._tryConsumeSpecifier();
        if (!specifier) {
            return undefined;
        }

        let typeName: string | undefined;
        let name: string | undefined;
        if (this._peek().kind === "string") {
            name = this._consume().value;
        } else {
            typeName = this._consumeIdentifierLike();
            if (this._peek().kind === "string") {
                name = this._consume().value;
            } else {
                name = this._consumeIdentifierLike();
            }
        }

        if (!name) {
            this._diagnose("Prim declaration is missing a name.");
            name = "";
        }

        const path = `${parentPath}/${name}`;
        const prim: ISdfPrimSpec = {
            name,
            path,
            specifier,
            properties: {},
            children: [],
        };
        if (typeName) {
            prim.typeName = typeName;
        }

        if (this._peek().value === "(") {
            this._parsePrimMetadata(prim);
        }

        if (this._matchSymbol("{")) {
            this._enterNesting(path);
            try {
                this._parseBody(prim, path);
                this._expectSymbol("}");
            } finally {
                this._exitNesting();
            }
        } else {
            this._diagnose(`Expected body for prim '${path}'.`);
        }

        return prim;
    }

    private _parseBody(target: IBodyTarget, ownerPath: string): void {
        while (!this._isAtEnd() && this._peek().value !== "}") {
            this._skipDelimiters();
            if (this._peek().value === "}") {
                break;
            }

            const prim = this._tryParsePrim(ownerPath);
            if (prim) {
                target.children.push(prim);
                continue;
            }

            if (this._peek().value === "variantSet") {
                const variantSet = this._parseVariantSet(ownerPath);
                if (variantSet) {
                    target.variantSets = target.variantSets ?? [];
                    // A `variantSets` metadata entry may have already registered this set by name with no
                    // variants. Merge the parsed variants into that placeholder rather than appending a
                    // duplicate empty set, which would otherwise shadow the real one during composition.
                    const existing = target.variantSets.find((candidate) => candidate.name === variantSet.name);
                    if (existing) {
                        existing.variants = { ...existing.variants, ...variantSet.variants };
                    } else {
                        target.variantSets.push(variantSet);
                    }
                }
                continue;
            }

            const listOperation = this._tryConsumeListOperation();
            // A relationship may be authored with a leading `custom` qualifier (`custom rel foo = ...`).
            // Consume it so the declaration routes to the relationship parser instead of being
            // misread as an attribute whose type name is `rel`.
            if (this._peek().value === "custom" && this._peek(1).value === "rel") {
                this._consume();
            }
            if (this._peek().value === "rel") {
                const relationship = this._parseRelationship(ownerPath, listOperation);
                if (relationship) {
                    target.properties[relationship.name ?? ""] = relationship;
                }
                continue;
            }

            const compositionKey = this._peek().value;
            if (IsCompositionKey(compositionKey) && this._peek(1).value === "=") {
                this._consume();
                this._expectSymbol("=");
                this._parseCompositionValue(target, compositionKey, listOperation);
                continue;
            }

            if (!this._parseAttribute(target, ownerPath, listOperation)) {
                this._diagnose(`Skipping unexpected token '${this._peek().value}'.`);
                this._consume();
            }
        }
    }

    private _parsePrimMetadata(prim: ISdfPrimSpec): void {
        this._expectSymbol("(");
        while (!this._isAtEnd() && this._peek().value !== ")") {
            this._skipDelimiters();
            const listOperation = this._tryConsumeListOperation();
            const key = this._consumeKey();
            if (!key) {
                this._consume();
                continue;
            }
            if (!this._matchSymbol("=")) {
                this._diagnose(`Expected '=' after prim metadata key '${key}'.`);
                continue;
            }
            this._parseCompositionValue(prim, key, listOperation);
        }
        this._expectSymbol(")");
    }

    private _parseCompositionValue(target: IBodyTarget, key: string, listOperation?: ListOperation): void {
        switch (key) {
            case "references":
                target.references = MergeListOps(target.references, BuildListOp(this._parseReferences(), listOperation));
                break;
            case "payload":
            case "payloads":
                target.payloads = MergeListOps(target.payloads, BuildListOp(this._parsePayloads(), listOperation));
                break;
            case "inherits":
                target.inherits = MergeListOps(target.inherits, BuildListOp(this._parsePathItems(), listOperation));
                break;
            case "specializes":
                target.specializes = MergeListOps(target.specializes, BuildListOp(this._parsePathItems(), listOperation));
                break;
            case "variants":
                target.variantSelections = { ...(target.variantSelections ?? {}), ...this._parseVariantSelections() };
                break;
            case "variantSets":
                this._parseVariantSetNames(target);
                break;
            case "relocates":
                target.relocates = this._parseRelocates();
                break;
            case "active":
                target.active = RawToBoolean(this._parseRawValue());
                break;
            case "instanceable":
                target.instanceable = RawToBoolean(this._parseRawValue());
                break;
            case "kind":
                target.kind = RawToString(this._parseRawValue());
                break;
            default:
                AddMetadata(target, key, InferSdfValue(this._parseRawValue()));
                break;
        }
    }

    private _parseVariantSet(ownerPath: string): ISdfVariantSetSpec | undefined {
        this._consume();
        const name = this._peek().kind === "string" ? this._consume().value : this._consumeIdentifierLike();
        if (!name) {
            this._diagnose("variantSet is missing a name.");
            return undefined;
        }
        // USDA authors a variant set as `variantSet "name" = { ... }`; consume the assignment operator
        // between the name and the variant block before expecting the opening brace.
        if (this._peek().value === "=") {
            this._consume();
        }
        if (!this._expectSymbol("{")) {
            return undefined;
        }

        const variantSet: ISdfVariantSetSpec = { name, variants: {} };
        while (!this._isAtEnd() && this._peek().value !== "}") {
            this._skipDelimiters();
            if (this._peek().value === "}") {
                break;
            }
            if (this._peek().kind !== "string") {
                this._diagnose("Expected quoted variant name.");
                this._consume();
                continue;
            }
            const variantName = this._consume().value;
            const variant: ISdfVariantSpec = { name: variantName, properties: {}, children: [] };
            if (this._peek().value === "(") {
                this._parseVariantMetadata(variant);
            }
            if (this._expectSymbol("{")) {
                this._enterNesting(ownerPath);
                try {
                    this._parseBody(variant, ownerPath);
                    this._expectSymbol("}");
                } finally {
                    this._exitNesting();
                }
            }
            variantSet.variants[variantName] = variant;
        }
        this._expectSymbol("}");
        return variantSet;
    }

    private _parseVariantMetadata(variant: ISdfVariantSpec): void {
        this._expectSymbol("(");
        while (!this._isAtEnd() && this._peek().value !== ")") {
            const key = this._consumeKey();
            if (!key) {
                this._consume();
                continue;
            }
            if (this._matchSymbol("=")) {
                AddMetadata(variant, key, InferSdfValue(this._parseRawValue()));
            }
        }
        this._expectSymbol(")");
    }

    private _parseRelationship(ownerPath: string, listOperation?: ListOperation): ISdfRelationshipSpec | undefined {
        this._consume();
        const name = this._consumePropertyName();
        if (!name) {
            this._diagnose("Relationship is missing a name.");
            return undefined;
        }
        let metadata = this._peek().value === "(" ? this._parseSimpleMetadataBlock() : undefined;
        // Targets are optional: a relationship may be declared without an assignment (`rel proxyPrim`)
        // or blocked with `None`. Either case yields an empty explicit target list.
        const targets = this._matchSymbol("=") ? this._parsePathItems() : [];
        // USD canonically authors relationship metadata after the target list, e.g.
        // `rel r = </x> ( bindMaterialAs = "..." )`. Merge any trailing block over a pre-target one.
        if (this._peek().value === "(") {
            metadata = { ...(metadata ?? {}), ...this._parseSimpleMetadataBlock() };
        }
        const relationship: ISdfRelationshipSpec = {
            kind: "relationship",
            name,
            path: `${ownerPath}.${name}`,
            targets: BuildListOp(targets, listOperation),
        };
        if (metadata && Object.keys(metadata).length > 0) {
            relationship.metadata = metadata;
        }
        return relationship;
    }

    private _parseAttribute(target: IBodyTarget, ownerPath: string, listOperation?: ListOperation): boolean {
        const { variability } = this._consumeAttributeQualifiers();
        const typeName = this._parseTypeName();
        if (!typeName) {
            return false;
        }
        const authoredName = this._consumePropertyName();
        if (!authoredName) {
            this._diagnose(`Attribute of type '${typeName}' is missing a name.`);
            return false;
        }

        const metadata = this._peek().value === "(" ? this._parseSimpleMetadataBlock() : undefined;
        const { name, suffix } = SplitPropertySuffix(authoredName);
        const attribute = (target.properties[name]?.kind === "attribute" ? target.properties[name] : undefined) as ISdfAttributeSpec | undefined;
        const nextAttribute: ISdfAttributeSpec = attribute ?? {
            kind: "attribute",
            name,
            path: `${ownerPath}.${name}`,
            typeName,
        };
        nextAttribute.typeName = typeName;
        if (variability) {
            nextAttribute.variability = variability;
        }
        ApplyAttributeMetadata(nextAttribute, metadata);

        if (this._matchSymbol("=")) {
            if (suffix === "timeSamples") {
                nextAttribute.timeSamples = this._parseTimeSamples(typeName);
            } else if (suffix === "connect") {
                nextAttribute.connections = MergeListOps(nextAttribute.connections, BuildListOp(this._parsePathItems(), listOperation));
            } else {
                // Capture the value's start token before consuming it so an invalid-value diagnostic
                // points at the authored value rather than whatever follows it.
                const valueToken = this._peek();
                const parsed = ParseSdfValue(typeName, this._parseRawValue(), this._diagnostics, valueToken);
                if (parsed !== undefined) {
                    nextAttribute.default = parsed;
                }
            }
        }

        // USD authors attribute metadata after the value, e.g. `int[] indices = [...] ( elementSize = 4 )`.
        // Parse a trailing metadata block in addition to any block authored before the assignment.
        if (this._peek().value === "(") {
            ApplyAttributeMetadata(nextAttribute, this._parseSimpleMetadataBlock());
        }

        target.properties[name] = nextAttribute;
        return true;
    }

    private _parseSimpleMetadataBlock(): SdfMetadata {
        const metadata: SdfMetadata = {};
        this._expectSymbol("(");
        while (!this._isAtEnd() && this._peek().value !== ")") {
            this._skipDelimiters();
            if (this._peek().value === ")") {
                break;
            }
            let key = this._consumeKey();
            if (!key) {
                this._consume();
                continue;
            }
            if (this._peek().value !== "=" && this._peek(1).value === "=") {
                key = this._consumeKey() ?? key;
            }
            if (!this._matchSymbol("=")) {
                this._diagnose(`Expected '=' after metadata key '${key}'.`);
                continue;
            }
            metadata[key] = InferSdfValue(this._parseRawValue());
        }
        this._expectSymbol(")");
        return metadata;
    }

    private _parseTypeName(): string | undefined {
        const base = this._consumeIdentifierLike();
        if (!base) {
            return undefined;
        }
        if (this._peek().value === "[" && this._peek(1).value === "]") {
            this._consume();
            this._consume();
            return `${base}[]`;
        }
        return base;
    }

    private _consumeAttributeQualifiers(): { variability?: SdfVariability } {
        let variability: SdfVariability | undefined;
        while (this._peek().value === "custom" || this._peek().value === "uniform" || this._peek().value === "varying") {
            const qualifier = this._consume().value;
            if (qualifier === "uniform" || qualifier === "varying") {
                variability = qualifier;
            }
        }
        return { variability };
    }

    private _parseTimeSamples(typeName: string): { times: number[]; values: SdfValue[] } {
        const raw = this._parseRawValue();
        if (!IsRawDictionary(raw)) {
            this._diagnose("Expected dictionary value for timeSamples.");
            return { times: [], values: [] };
        }
        const entries = Object.entries(raw.value)
            .map(([time, value]) => ({ time: Number(time), value }))
            .filter((entry) => !Number.isNaN(entry.time))
            .sort((left, right) => left.time - right.time);
        const times: number[] = [];
        const values: SdfValue[] = [];
        for (const entry of entries) {
            const value = ParseSdfValue(typeName, entry.value, this._diagnostics, this._peek());
            // Drop samples whose value fails strict conversion so `times` and `values` stay aligned.
            if (value !== undefined) {
                times.push(entry.time);
                values.push(value);
            }
        }
        return { times, values };
    }

    private _parseVariantSelections(): Record<string, string> {
        const selections: Record<string, string> = {};
        if (!this._expectSymbol("{")) {
            return selections;
        }
        while (!this._isAtEnd() && this._peek().value !== "}") {
            this._skipDelimiters();
            if (this._peek().value === "}") {
                break;
            }
            let key = this._consumeKey();
            if (!key) {
                this._consume();
                continue;
            }
            if (this._peek().value !== "=" && this._peek(1).value === "=") {
                key = this._consumeKey() ?? key;
            }
            if (this._expectSymbol("=")) {
                selections[key] = RawToString(this._parseRawValue());
            }
        }
        this._expectSymbol("}");
        return selections;
    }

    private _parseVariantSetNames(target: IBodyTarget): void {
        const raw = this._parseRawValue();
        const names = Array.isArray(raw) ? raw.map((item) => RawToString(item)) : [RawToString(raw)];
        for (const name of names) {
            if (!name) {
                continue;
            }
            target.variantSets = target.variantSets ?? [];
            if (!target.variantSets.some((variantSet) => variantSet.name === name)) {
                target.variantSets.push({ name, variants: {} });
            }
        }
    }

    private _parseRelocates(): { source: string; target: string }[] {
        const raw = this._parseRawValue();
        if (!IsRawDictionary(raw)) {
            return [];
        }
        return Object.entries(raw.value).map(([source, target]) => ({ source, target: RawToPath(target) }));
    }

    private _parseReferences(): ISdfReference[] {
        return this._parseReferenceLike((assetPath, primPath, layerOffset) => ({ assetPath, primPath, layerOffset }));
    }

    private _parsePayloads(): ISdfPayload[] {
        return this._parseReferenceLike((assetPath, primPath, layerOffset) => ({ assetPath, primPath, layerOffset }));
    }

    private _parseReferenceLike<T>(factory: (assetPath: string, primPath?: string, layerOffset?: ISdfLayerOffset) => T): T[] {
        const items: T[] = [];
        if (this._matchSymbol("[")) {
            while (!this._isAtEnd() && this._peek().value !== "]") {
                const positionBeforeItem = this._position;
                const item = this._parseSingleReferenceLike(factory);
                if (item) {
                    items.push(item);
                }
                this._matchSymbol(",");
                if (this._position === positionBeforeItem) {
                    this._consume();
                }
            }
            this._expectSymbol("]");
        } else {
            const item = this._parseSingleReferenceLike(factory);
            if (item) {
                items.push(item);
            }
        }
        return items;
    }

    private _parseSingleReferenceLike<T>(factory: (assetPath: string, primPath?: string, layerOffset?: ISdfLayerOffset) => T): T | undefined {
        let assetPath = "";
        let primPath: string | undefined;
        if (this._peek().kind === "asset" || this._peek().kind === "string") {
            assetPath = this._consume().value;
        }
        if (this._peek().kind === "path") {
            primPath = this._consume().value;
        }
        if (!assetPath && !primPath) {
            this._diagnose("Expected reference or payload target.");
            return undefined;
        }
        const layerOffset = this._tryParseLayerOffset();
        return factory(assetPath, primPath, layerOffset);
    }

    private _parsePathItems(): string[] {
        const raw = this._parseRawValue();
        // A `None` value block clears the target list rather than producing a bogus path.
        if (IsRawValueBlock(raw)) {
            return [];
        }
        if (Array.isArray(raw)) {
            return raw.map((item) => RawToPath(item));
        }
        return [RawToPath(raw)];
    }

    private _tryParseLayerOffset(): ISdfLayerOffset | undefined {
        if (this._peek().value !== "(") {
            return undefined;
        }
        let offset: number | undefined;
        let scale: number | undefined;
        this._expectSymbol("(");
        while (!this._isAtEnd() && this._peek().value !== ")") {
            this._skipDelimiters();
            const key = this._consumeKey();
            if (!key) {
                this._consume();
                continue;
            }
            if (this._expectSymbol("=")) {
                const value = RawToNumber(this._parseRawValue());
                if (key === "offset") {
                    offset = value;
                } else if (key === "scale") {
                    scale = value;
                }
            }
        }
        this._expectSymbol(")");
        if (offset === undefined && scale === undefined) {
            return undefined;
        }
        return { offset: offset ?? 0, scale: scale ?? 1 };
    }

    private _enterNesting(path: string): void {
        if (this._nestingDepth >= MaxNestingDepth) {
            throw new UsdResourceLimitError("prim-nesting", MaxNestingDepth, `USDA parser: nesting depth exceeds ${MaxNestingDepth} at '${path}'.`, {
                actual: this._nestingDepth + 1,
                path,
            });
        }
        this._nestingDepth++;
    }

    private _exitNesting(): void {
        this._nestingDepth--;
    }

    private _enterValue(): void {
        if (this._valueDepth >= MaxValueNestingDepth) {
            throw new UsdResourceLimitError("value-nesting", MaxValueNestingDepth, `USDA parser: value nesting depth exceeds the ${MaxValueNestingDepth}-level resource cap.`, {
                actual: this._valueDepth + 1,
            });
        }
        this._valueDepth++;
    }

    private _exitValue(): void {
        this._valueDepth--;
    }

    private _parseRawValue(): RawValue | undefined {
        const token = this._peek();
        if (token.kind === "eof") {
            return undefined;
        }
        if (this._matchSymbol("[")) {
            return this._parseRawArray("]");
        }
        if (this._matchSymbol("(")) {
            return this._parseRawArray(")");
        }
        if (this._matchSymbol("{")) {
            return this._parseRawDictionary();
        }
        this._consume();
        switch (token.kind) {
            case "number":
                return { kind: "number", value: token.value };
            case "string":
                return token.value;
            case "asset":
                return { kind: "asset", value: token.value };
            case "path":
                return { kind: "path", value: token.value };
            case "identifier":
                if (token.value === "true") {
                    return true;
                }
                if (token.value === "false") {
                    return false;
                }
                if (token.value === "None") {
                    return { kind: "block" };
                }
                return token.value;
            default:
                return token.value;
        }
    }

    private _parseRawArray(closing: ")" | "]"): RawValue[] {
        this._enterValue();
        try {
            const values: RawValue[] = [];
            while (!this._isAtEnd() && this._peek().value !== closing) {
                this._skipDelimiters();
                if (this._peek().value === closing) {
                    break;
                }
                const value = this._parseRawValue();
                if (value !== undefined) {
                    values.push(value);
                }
                this._matchSymbol(",");
            }
            this._expectSymbol(closing);
            return values;
        } finally {
            this._exitValue();
        }
    }

    private _tryConsumeDictionaryMemberType(): string | undefined {
        // A typed dictionary member is authored as `<type> <name> =` or `<type>[] <name> =`.
        // Only consume the leading type when the shape matches and the separator is `=`; a `:`
        // separator is reserved for time-sample keys, which are untyped.
        if (this._peek().kind !== "identifier") {
            return undefined;
        }
        let offset = 1;
        let arraySuffix = "";
        if (this._peek(offset).value === "[" && this._peek(offset + 1).value === "]") {
            arraySuffix = "[]";
            offset += 2;
        }
        const nameKind = this._peek(offset).kind;
        if ((nameKind !== "identifier" && nameKind !== "string") || this._peek(offset + 1).value !== "=") {
            return undefined;
        }
        const typeName = this._consume().value;
        if (arraySuffix) {
            this._consume();
            this._consume();
        }
        return `${typeName}${arraySuffix}`;
    }

    private _parseRawDictionary(): IRawDictionary {
        this._enterValue();
        try {
            const value: Record<string, RawValue> = {};
            const resolved: Record<string, SdfValue> = {};
            while (!this._isAtEnd() && this._peek().value !== "}") {
                this._skipDelimiters();
                if (this._peek().value === "}") {
                    break;
                }
                const memberType = this._tryConsumeDictionaryMemberType();
                let key = this._consumeKey();
                if (!key) {
                    this._consume();
                    continue;
                }
                if (!memberType && this._peek().value !== ":" && this._peek().value !== "=" && (this._peek(1).value === ":" || this._peek(1).value === "=")) {
                    key = this._consumeKey() ?? key;
                }
                if (this._matchSymbol(":") || this._matchSymbol("=")) {
                    const valueToken = this._peek();
                    const rawValue = this._parseRawValue();
                    if (rawValue !== undefined) {
                        if (memberType) {
                            // Resolve authored member types eagerly so `float ratio = 1` stays a float
                            // instead of being re-inferred as an int by untyped metadata inference. A
                            // member whose value is invalid for its declared type is dropped entirely
                            // rather than retained and later retyped by structural inference.
                            const converted = ParseSdfValue(memberType, rawValue, this._diagnostics, valueToken);
                            if (converted !== undefined) {
                                value[key] = rawValue;
                                resolved[key] = converted;
                            }
                        } else {
                            value[key] = rawValue;
                        }
                    }
                }
                this._matchSymbol(",");
            }
            this._expectSymbol("}");
            const dictionary: IRawDictionary = { kind: "dictionary", value };
            if (Object.keys(resolved).length > 0) {
                dictionary.resolved = resolved;
            }
            return dictionary;
        } finally {
            this._exitValue();
        }
    }

    private _tryConsumeSpecifier(): SdfSpecifier | undefined {
        const value = this._peek().value;
        if (value === "def" || value === "over" || value === "class") {
            this._consume();
            return value;
        }
        return undefined;
    }

    private _tryConsumeListOperation(): ListOperation | undefined {
        const value = this._peek().value;
        if (IsListOperation(value)) {
            this._consume();
            return value;
        }
        return undefined;
    }

    private _consumeKey(): string | undefined {
        if (this._peek().kind === "identifier" || this._peek().kind === "string" || this._peek().kind === "number" || this._peek().kind === "path") {
            return this._consume().value;
        }
        return undefined;
    }

    private _consumeIdentifierLike(): string | undefined {
        if (this._peek().kind === "identifier" || this._peek().kind === "string") {
            return this._consume().value;
        }
        return undefined;
    }

    private _consumePropertyName(): string | undefined {
        let name = this._consumeIdentifierLike();
        if (!name) {
            return undefined;
        }
        while (this._peek().value === ":" && (this._peek(1).kind === "identifier" || this._peek(1).kind === "string")) {
            this._consume();
            name += `:${this._consume().value}`;
        }
        return name;
    }

    private _skipDelimiters(): void {
        while (this._peek().value === ";" || this._peek().value === ",") {
            this._consume();
        }
    }

    private _expectSymbol(value: string): boolean {
        if (this._matchSymbol(value)) {
            return true;
        }
        this._diagnose(`Expected '${value}' but found '${this._peek().value}'.`);
        return false;
    }

    private _matchSymbol(value: string): boolean {
        if (this._peek().value === value) {
            this._consume();
            return true;
        }
        return false;
    }

    private _peek(offset = 0): IToken {
        return this._tokens[Math.min(this._position + offset, this._tokens.length - 1)];
    }

    private _consume(): IToken {
        this._work++;
        if (this._work > this._maxParserWork) {
            throw new UsdResourceLimitError("parser-work", this._maxParserWork, `USDA parser: parser work exceeds the ${this._maxParserWork}-unit resource cap.`, {
                actual: this._work,
                path: this._identifier,
            });
        }
        const token = this._peek();
        if (!this._isAtEnd()) {
            this._position++;
        }
        return token;
    }

    private _diagnose(message: string): void {
        if (this._diagnostics.length >= MaxUsdaDiagnostics) {
            return;
        }
        const token = this._peek();
        this._diagnostics.push({ message, line: token.line, column: token.column });
    }

    private _isAtEnd(): boolean {
        return this._peek().kind === "eof";
    }
}

function PushDiagnostic(diagnostics: IUsdaParseDiagnostic[], message: string, token: IToken): void {
    // Honor the same recoverable-diagnostic cap as the parser's instance-level _diagnose so a
    // pathological document cannot grow the module-level conversion diagnostics without bound.
    if (diagnostics.length >= MaxUsdaDiagnostics) {
        return;
    }
    diagnostics.push({ message, line: token.line, column: token.column });
}

function ParseSdfValue(typeName: string, raw: RawValue | undefined, diagnostics: IUsdaParseDiagnostic[], token: IToken): SdfValue | undefined {
    // A `None` value block is authored the same way regardless of the declared type.
    if (IsRawValueBlock(raw)) {
        return { type: "block", value: null };
    }
    const tag = GetSdfValueTag(typeName, diagnostics, token);
    if (tag === "dictionary") {
        return { type: "dictionary", value: RawToMetadata(raw) };
    }
    if (IsArrayValueTag(tag)) {
        const elementTag = tag.slice(0, -2) as SdfScalarValueType;
        const rawItems = Array.isArray(raw) ? raw : raw === undefined ? [] : [raw];
        const converted: unknown[] = [];
        for (const item of rawItems) {
            const element = ConvertScalarPayload(elementTag, item);
            if (element === InvalidValue) {
                PushDiagnostic(diagnostics, `Invalid '${elementTag}' element in '${typeName}' value; dropping the authored default.`, token);
                return undefined;
            }
            converted.push(element);
        }
        return { type: tag, value: converted } as SdfValue;
    }
    const scalar = ConvertScalarPayload(tag, raw);
    if (scalar === InvalidValue) {
        PushDiagnostic(diagnostics, `Invalid '${tag}' value; dropping the authored default.`, token);
        return undefined;
    }
    return { type: tag, value: scalar } as SdfValue;
}

function GetSdfValueTag(typeName: string, diagnostics: IUsdaParseDiagnostic[], token: IToken): Exclude<SdfValueType, "block"> {
    if (typeName === "dictionary") {
        return "dictionary";
    }
    const isArray = typeName.endsWith("[]");
    const elementType = isArray ? typeName.slice(0, -2) : typeName;
    const normalizedElement = NormalizeScalarTypeName(elementType);
    if (normalizedElement) {
        return (isArray ? `${normalizedElement}[]` : normalizedElement) as SdfScalarValueType | SdfArrayValueType;
    }
    PushDiagnostic(diagnostics, `Unsupported Sdf value type '${typeName}', preserving payload as token${isArray ? "[]" : ""}.`, token);
    return isArray ? "token[]" : "token";
}

function NormalizeScalarTypeName(typeName: string): SdfScalarValueType | undefined {
    switch (typeName) {
        case "bool":
        case "int":
        case "uint":
        case "int64":
        case "uint64":
        case "half":
        case "float":
        case "double":
            return typeName;
        case "string":
        case "token":
        case "asset":
        case "path":
        case "vec2f":
        case "vec3f":
        case "vec4f":
        case "vec2d":
        case "vec3d":
        case "vec4d":
        case "point3f":
        case "point3d":
        case "normal3f":
        case "quatf":
        case "quatd":
        case "matrix4d":
        case "color3f":
            return typeName;
        case "float2":
        case "texCoord2f":
            return "vec2f";
        case "float3":
        case "texCoord3f":
            return "vec3f";
        case "float4":
        case "color4f":
            return "vec4f";
        case "double2":
            return "vec2d";
        case "double3":
            return "vec3d";
        case "double4":
            return "vec4d";
        case "normal3d":
            return "normal3f";
        default:
            return undefined;
    }
}

function ConvertScalarPayload(tag: SdfScalarValueType, raw: RawValue | undefined): unknown {
    switch (tag) {
        case "bool":
            return RawToBoolean(raw);
        case "int":
            return ParseStrictInteger(raw, Int32Range);
        case "uint":
            return ParseStrictInteger(raw, Uint32Range);
        case "int64":
            return ParseStrictBigInt(raw, Int64Range);
        case "uint64":
            return ParseStrictBigInt(raw, Uint64Range);
        case "half":
        case "float":
        case "double":
            return ParseStrictFloat(raw);
        case "string":
        case "token":
            return RawToString(raw);
        case "asset":
            return { authoredPath: RawToAssetPath(raw) };
        case "path":
            return RawToPath(raw);
        case "vec2f":
        case "vec2d":
            return ParseNumberTuple(raw, 2);
        case "vec3f":
        case "vec3d":
        case "point3f":
        case "point3d":
        case "normal3f":
        case "color3f":
            return ParseNumberTuple(raw, 3);
        case "vec4f":
        case "vec4d":
            return ParseNumberTuple(raw, 4);
        case "quatf":
        case "quatd": {
            const tuple = ParseNumberTuple(raw, 4);
            return tuple === InvalidValue ? InvalidValue : [tuple[1], tuple[2], tuple[3], tuple[0]];
        }
        case "matrix4d":
            return ParseNumberTuple(raw, 16);
    }
}

function InferSdfValue(raw: RawValue | undefined): SdfValue {
    if (IsRawValueBlock(raw)) {
        return { type: "block", value: null };
    }
    if (IsRawDictionary(raw)) {
        return { type: "dictionary", value: RawToMetadata(raw) };
    }
    if (Array.isArray(raw)) {
        if (raw.every((item) => typeof item === "number" || IsRawNumber(item))) {
            return { type: "double[]", value: raw.map((item) => RawToNumber(item)) };
        }
        return { type: "token[]", value: raw.map((item) => RawToString(item)) };
    }
    if (typeof raw === "boolean") {
        return { type: "bool", value: raw };
    }
    if (typeof raw === "number") {
        return Number.isInteger(raw) ? { type: "int", value: raw } : { type: "double", value: raw };
    }
    if (IsRawNumber(raw)) {
        const value = Number(raw.value);
        return Number.isInteger(value) ? { type: "int", value } : { type: "double", value };
    }
    if (IsRawAsset(raw)) {
        return { type: "asset", value: { authoredPath: raw.value } };
    }
    if (IsRawPath(raw)) {
        return { type: "path", value: raw.value };
    }
    return { type: "string", value: RawToString(raw) };
}

function RawToMetadata(raw: RawValue | undefined): SdfMetadata {
    const metadata: SdfMetadata = {};
    if (IsRawDictionary(raw)) {
        for (const [key, value] of Object.entries(raw.value)) {
            // Prefer the type resolved at parse time so authored member types survive; fall back to
            // structural inference for members declared without an explicit type.
            metadata[key] = raw.resolved?.[key] ?? InferSdfValue(value);
        }
    }
    return metadata;
}

function ApplyAttributeMetadata(attribute: ISdfAttributeSpec, metadata: SdfMetadata | undefined): void {
    if (!metadata) {
        return;
    }
    for (const [key, value] of Object.entries(metadata)) {
        if (key === "interpolation") {
            const interpolation = value.type === "string" || value.type === "token" ? value.value : undefined;
            if (IsInterpolation(interpolation)) {
                attribute.interpolation = interpolation;
            }
        } else if (key === "colorSpace") {
            attribute.colorSpace = value.type === "string" || value.type === "token" ? value.value : undefined;
        } else {
            attribute.metadata = attribute.metadata ?? {};
            attribute.metadata[key] = value;
        }
    }
}

function DiagnosticsToMetadata(diagnostics: IUsdaParseDiagnostic[]): SdfValue {
    const value: SdfMetadata = {};
    for (let index = 0; index < diagnostics.length; index++) {
        const diagnostic = diagnostics[index];
        value[String(index)] = { type: "string", value: `${diagnostic.line}:${diagnostic.column} ${diagnostic.message}` };
    }
    return { type: "dictionary", value };
}

function BuildListOp<T>(items: T[], operation?: ListOperation): ISdfListOp<T> {
    switch (operation) {
        case "prepend":
            return { isExplicit: false, prepended: items };
        case "append":
            return { isExplicit: false, appended: items };
        case "add":
            return { isExplicit: false, added: items };
        case "delete":
            return { isExplicit: false, deleted: items };
        case "reorder":
            return { isExplicit: false, ordered: items };
        default:
            return { isExplicit: true, explicit: items };
    }
}

function MergeListOps<T>(left: ISdfListOp<T> | undefined, right: ISdfListOp<T>): ISdfListOp<T> {
    if (!left || right.isExplicit) {
        return right;
    }
    return {
        isExplicit: false,
        explicit: left.explicit,
        prepended: [...(left.prepended ?? []), ...(right.prepended ?? [])],
        appended: [...(left.appended ?? []), ...(right.appended ?? [])],
        added: [...(left.added ?? []), ...(right.added ?? [])],
        deleted: [...(left.deleted ?? []), ...(right.deleted ?? [])],
        ordered: [...(left.ordered ?? []), ...(right.ordered ?? [])],
    };
}

function SplitPropertySuffix(name: string): { name: string; suffix?: "connect" | "timeSamples" } {
    if (name.endsWith(".connect")) {
        return { name: name.slice(0, -".connect".length), suffix: "connect" };
    }
    if (name.endsWith(".timeSamples")) {
        return { name: name.slice(0, -".timeSamples".length), suffix: "timeSamples" };
    }
    return { name };
}

function AddMetadata(target: { metadata?: SdfMetadata }, key: string, value: SdfValue): void {
    target.metadata = target.metadata ?? {};
    target.metadata[key] = value;
}

// Sentinel returned by strict conversion when authored text cannot be represented in the declared
// type. Callers drop the value (and emit a diagnostic) instead of silently coercing it.
const InvalidValue = Symbol("invalid-sdf-value");

interface INumberRange {
    min: number;
    max: number;
}

interface IBigIntRange {
    min: bigint;
    max: bigint;
}

const Int32Range: INumberRange = { min: -2147483648, max: 2147483647 };
const Uint32Range: INumberRange = { min: 0, max: 4294967295 };
const Int64Range: IBigIntRange = { min: -9223372036854775808n, max: 9223372036854775807n };
const Uint64Range: IBigIntRange = { min: 0n, max: 18446744073709551615n };

function ParseSpecialFloat(text: string): number | undefined {
    switch (text) {
        case "inf":
        case "+inf":
            return Number.POSITIVE_INFINITY;
        case "-inf":
            return Number.NEGATIVE_INFINITY;
        case "nan":
        case "-nan":
            return Number.NaN;
    }
    return undefined;
}

function ParseStrictFloat(raw: RawValue | undefined): number | typeof InvalidValue {
    if (IsRawNumber(raw)) {
        const value = Number(raw.value);
        // Reject finite literals that overflow to +/-Infinity (e.g. `1e400`). Intentional
        // `inf`/`-inf`/`nan` lex as identifiers and are preserved by the string branch below.
        return Number.isFinite(value) ? value : InvalidValue;
    }
    if (typeof raw === "number") {
        return raw;
    }
    // `inf`/`-inf`/`nan` lex as identifiers, so they arrive as bare strings.
    if (typeof raw === "string") {
        const special = ParseSpecialFloat(raw);
        if (special !== undefined) {
            return special;
        }
    }
    return InvalidValue;
}

function ParseStrictInteger(raw: RawValue | undefined, range: INumberRange): number | typeof InvalidValue {
    if (!IsRawNumber(raw) || !/^[+-]?\d+$/.test(raw.value)) {
        return InvalidValue;
    }
    const value = Number(raw.value);
    if (!Number.isInteger(value) || value < range.min || value > range.max) {
        return InvalidValue;
    }
    return value;
}

function ParseStrictBigInt(raw: RawValue | undefined, range: IBigIntRange): bigint | typeof InvalidValue {
    if (!IsRawNumber(raw) || !/^[+-]?\d+$/.test(raw.value)) {
        return InvalidValue;
    }
    const value = BigInt(raw.value);
    if (value < range.min || value > range.max) {
        return InvalidValue;
    }
    return value;
}

function ParseNumberTuple(raw: RawValue | undefined, length: number): number[] | typeof InvalidValue {
    const numbers = CollectTupleNumbers(raw);
    if (numbers === undefined || numbers.length !== length) {
        return InvalidValue;
    }
    return numbers;
}

function CollectTupleNumbers(raw: RawValue | undefined): number[] | undefined {
    if (!Array.isArray(raw)) {
        return undefined;
    }
    const numbers: number[] = [];
    for (const item of raw) {
        if (Array.isArray(item)) {
            const nested = CollectTupleNumbers(item);
            if (nested === undefined) {
                return undefined;
            }
            numbers.push(...nested);
            continue;
        }
        const value = CoerceComponentNumber(item);
        if (value === undefined) {
            return undefined;
        }
        numbers.push(value);
    }
    return numbers;
}

function CoerceComponentNumber(raw: RawValue): number | undefined {
    if (typeof raw === "number") {
        return raw;
    }
    if (IsRawNumber(raw)) {
        const value = Number(raw.value);
        // Reject tuple components that overflow to +/-Infinity; intentional inf/nan arrive as strings.
        return Number.isFinite(value) ? value : undefined;
    }
    if (typeof raw === "string") {
        return ParseSpecialFloat(raw);
    }
    return undefined;
}

function RawToNumber(raw: RawValue | undefined): number {
    if (typeof raw === "number") {
        return raw;
    }
    if (IsRawNumber(raw)) {
        return Number(raw.value);
    }
    const value = Number(RawToString(raw));
    return Number.isNaN(value) ? 0 : value;
}

function RawToBoolean(raw: RawValue | undefined): boolean {
    if (typeof raw === "boolean") {
        return raw;
    }
    if (typeof raw === "number") {
        return raw !== 0;
    }
    return RawToString(raw) === "true";
}

function RawToString(raw: RawValue | undefined): string {
    if (raw === undefined) {
        return "";
    }
    if (typeof raw === "string" || typeof raw === "number" || typeof raw === "boolean") {
        return String(raw);
    }
    if (IsRawNumber(raw)) {
        return raw.value;
    }
    if (IsRawAsset(raw) || IsRawPath(raw)) {
        return raw.value;
    }

    if (Array.isArray(raw)) {
        return raw.map((item) => RawToString(item)).join(",");
    }
    return "";
}

function IsRawNumber(value: RawValue | undefined): value is IRawNumber {
    return typeof value === "object" && value !== null && !Array.isArray(value) && "kind" in value && value.kind === "number";
}

function RawToAssetPath(raw: RawValue | undefined): string {
    if (IsRawAsset(raw)) {
        return raw.value;
    }
    return RawToString(raw);
}

function RawToPath(raw: RawValue | undefined): string {
    if (IsRawPath(raw)) {
        return raw.value;
    }
    return RawToString(raw);
}

function IsRawAsset(raw: RawValue | undefined): raw is IRawAsset {
    return typeof raw === "object" && raw !== null && !Array.isArray(raw) && raw.kind === "asset";
}

function IsRawPath(raw: RawValue | undefined): raw is IRawPath {
    return typeof raw === "object" && raw !== null && !Array.isArray(raw) && raw.kind === "path";
}

function IsRawDictionary(raw: RawValue | undefined): raw is IRawDictionary {
    return typeof raw === "object" && raw !== null && !Array.isArray(raw) && raw.kind === "dictionary";
}

function IsRawValueBlock(raw: RawValue | undefined): raw is IRawValueBlock {
    return typeof raw === "object" && raw !== null && !Array.isArray(raw) && raw.kind === "block";
}

function IsArrayValueTag(tag: SdfValueType): tag is SdfArrayValueType {
    return tag.endsWith("[]");
}

function IsInterpolation(value: string | undefined): value is SdfInterpolation {
    return value === "constant" || value === "uniform" || value === "varying" || value === "vertex" || value === "faceVarying";
}

function IsCompositionKey(value: string): boolean {
    return (
        value === "references" ||
        value === "payload" ||
        value === "payloads" ||
        value === "inherits" ||
        value === "specializes" ||
        value === "variantSets" ||
        value === "variants" ||
        value === "relocates" ||
        value === "active" ||
        value === "instanceable" ||
        value === "kind"
    );
}

function IsListOperation(value: string): value is ListOperation {
    return value === "prepend" || value === "append" || value === "add" || value === "delete" || value === "reorder";
}

function IsSymbol(char: string): boolean {
    return char === "(" || char === ")" || char === "{" || char === "}" || char === "[" || char === "]" || char === "=" || char === "," || char === ":" || char === ";";
}

function IsNumberStart(char: string, next: string): boolean {
    return /\d/.test(char) || ((char === "+" || char === "-") && (/\d/.test(next) || next === ".")) || (char === "." && /\d/.test(next));
}

function DecodeEscape(char: string): string {
    switch (char) {
        case "n":
            return "\n";
        case "r":
            return "\r";
        case "t":
            return "\t";
        default:
            return char;
    }
}
