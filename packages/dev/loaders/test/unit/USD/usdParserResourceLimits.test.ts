import { describe, expect, it } from "vitest";
import { ParseUsda, ParseUsdaWithDiagnostics } from "loaders/USD/resolution/parser/usda/usdaParser";
import { UsdConfigurationError, UsdResourceLimitError } from "loaders/USD/usdErrors";
import { ResolveUsdStageWithFetcherAsync } from "loaders/USD/resolution/usdResolver";

const SampleUsda = `#usda 1.0
def Xform "P" {
    double3 xformOp:translate = (1, 2, 3)
}
`;
const SampleIdentifier = "memory:sample.usda";
const { accounting } = ParseUsdaWithDiagnostics(SampleUsda, SampleIdentifier);

function expectResourceLimitError(fn: () => unknown, kind: UsdResourceLimitError["kind"]): UsdResourceLimitError {
    let caught: unknown;
    try {
        fn();
    } catch (error) {
        caught = error;
    }
    expect(caught).toBeInstanceOf(UsdResourceLimitError);
    const limitError = caught as UsdResourceLimitError;
    expect(limitError.kind).toBe(kind);
    expect(Number.isFinite(limitError.limit)).toBe(true);
    return limitError;
}

describe("USDA parser resource limits", () => {
    it("enforces the input size limit at exact and over-boundaries", () => {
        expect(() => ParseUsdaWithDiagnostics(SampleUsda, SampleIdentifier, { maxInputBytes: accounting.inputBytes })).not.toThrow();

        const error = expectResourceLimitError(() => ParseUsdaWithDiagnostics(SampleUsda, SampleIdentifier, { maxInputBytes: accounting.inputBytes - 1 }), "input-bytes");
        expect(error.limit).toBe(accounting.inputBytes - 1);
        expect(error.actual).toBe(accounting.inputBytes);
        expect(error.path).toBe(SampleIdentifier);
        expectResourceLimitError(() => ParseUsdaWithDiagnostics(SampleUsda, SampleIdentifier, { maxInputBytes: 0 }), "input-bytes");
    });

    it("enforces the token count limit at exact and over-boundaries", () => {
        expect(() => ParseUsdaWithDiagnostics(SampleUsda, SampleIdentifier, { maxTokenCount: accounting.tokenCount })).not.toThrow();

        const error = expectResourceLimitError(() => ParseUsdaWithDiagnostics(SampleUsda, SampleIdentifier, { maxTokenCount: accounting.tokenCount - 1 }), "token-count");
        expect(error.actual).toBe(accounting.tokenCount);
        expectResourceLimitError(() => ParseUsdaWithDiagnostics(SampleUsda, SampleIdentifier, { maxTokenCount: 0 }), "token-count");
    });

    it("enforces parser work at exact and over-boundaries", () => {
        expect(() => ParseUsdaWithDiagnostics(SampleUsda, SampleIdentifier, { maxParserWork: accounting.parserWork })).not.toThrow();

        const error = expectResourceLimitError(() => ParseUsdaWithDiagnostics(SampleUsda, SampleIdentifier, { maxParserWork: accounting.parserWork - 1 }), "parser-work");
        expect(error.actual).toBe(accounting.parserWork);
        expectResourceLimitError(() => ParseUsdaWithDiagnostics(SampleUsda, SampleIdentifier, { maxParserWork: 0 }), "parser-work");
    });

    it("allows zero token and parser work budgets for an empty-content document", () => {
        const result = ParseUsdaWithDiagnostics("#usda 1.0\n", "memory:empty.usda", { maxTokenCount: 0, maxParserWork: 0 });

        expect(result.accounting.tokenCount).toBe(0);
        expect(result.accounting.parserWork).toBe(0);
    });

    it("validates resource configuration before parsing", () => {
        const malformedSource = "#usda 1.0\ndef Xform";
        expect(() => ParseUsda(malformedSource, "memory:invalid-input-bytes.usda", { maxInputBytes: -1 })).toThrow(UsdConfigurationError);
        expect(() => ParseUsda(malformedSource, "memory:invalid-token-count.usda", { maxTokenCount: 1.5 })).toThrow(UsdConfigurationError);
        expect(() => ParseUsda(malformedSource, "memory:invalid-parser-work.usda", { maxParserWork: Number.NaN })).toThrow(UsdConfigurationError);
        expect(() => ParseUsda(malformedSource, "memory:invalid-infinity.usda", { maxInputBytes: Number.POSITIVE_INFINITY })).toThrow(UsdConfigurationError);
    });

    it("preserves the existing value nesting cap with generous parser limits", () => {
        const nestedValue = "[".repeat(300) + "0" + "]".repeat(300);
        const source = `#usda 1.0
def Xform "P" {
    int[] deep = ${nestedValue}
}
`;
        const error = expectResourceLimitError(
            () =>
                ParseUsda(source, "memory:deep-value.usda", {
                    maxInputBytes: 1_000_000,
                    maxTokenCount: 1_000_000,
                    maxParserWork: 1_000_000,
                }),
            "value-nesting"
        );
        expect(error.limit).toBe(256);
    });

    it("parses with defaults and reports positive resource usage", () => {
        expect(() => ParseUsda(SampleUsda, SampleIdentifier)).not.toThrow();

        const result = ParseUsdaWithDiagnostics(SampleUsda, SampleIdentifier);
        expect(result.accounting.inputBytes).toBeGreaterThan(0);
        expect(result.accounting.tokenCount).toBeGreaterThan(0);
        expect(result.accounting.parserWork).toBeGreaterThan(0);
    });

    it("measures and enforces input size as UTF-8 bytes for non-ASCII content", () => {
        const source = `#usda 1.0
# comment 🎉 café ñ
def Xform "P" {
}
`;
        const expectedBytes = new TextEncoder().encode(source).length;
        const { accounting } = ParseUsdaWithDiagnostics(source, "memory:utf8.usda");
        expect(accounting.inputBytes).toBe(expectedBytes);
        expect(accounting.inputBytes).toBeGreaterThan(source.length);

        expect(() => ParseUsdaWithDiagnostics(source, "memory:utf8.usda", { maxInputBytes: expectedBytes })).not.toThrow();
        const error = expectResourceLimitError(() => ParseUsdaWithDiagnostics(source, "memory:utf8.usda", { maxInputBytes: expectedBytes - 1 }), "input-bytes");
        expect(error.actual).toBe(expectedBytes);
    });

    it("rejects an oversized raw buffer at the resolver seam before decoding", async () => {
        const data = new TextEncoder().encode('#usda 1.0\ndef Xform "P" {}\n').buffer;
        const fetchAsset = async () => {
            throw new Error("fetch should not be called for an oversized buffer");
        };
        let caught: unknown;
        try {
            await ResolveUsdStageWithFetcherAsync(data, "", "oversized.usda", { maxInputBytes: 4 }, fetchAsset);
        } catch (error) {
            caught = error;
        }
        expect(caught).toBeInstanceOf(UsdResourceLimitError);
        const limitError = caught as UsdResourceLimitError;
        expect(limitError.kind).toBe("input-bytes");
        expect(limitError.actual).toBe(data.byteLength);
        expect(limitError.limit).toBe(4);
    });
});
