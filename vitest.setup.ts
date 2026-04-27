/**
 * Vitest setup file.
 * Provides any additional global setup needed for the test suite.
 */
import { vi } from "vitest";

// Mock optional external packages that may not be installed
vi.mock("draco3dgltf", () => ({
    DracoDecoderModule: vi.fn(),
}));
