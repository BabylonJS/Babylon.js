/**
 * Vitest setup file.
 * Provides any additional global setup needed for the test suite.
 */
import { vi } from "vitest";

// Polyfill Symbol.metadata for TC39 Stage 3 decorators
// Node.js does not yet support Symbol.metadata natively
(Symbol as any).metadata ??= Symbol.for("Symbol.metadata");

// Mock optional external packages that may not be installed
vi.mock("draco3dgltf", () => ({
    DracoDecoderModule: vi.fn(),
}));
