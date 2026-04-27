interface TestFrameworkLike {
    fn: (...args: any[]) => any;
    mock?: (moduleId: string, factory: () => any) => void;
    mocked?: <T>(item: T) => any;
    resetAllMocks: () => void;
}

let resolvedTestFramework = ((globalThis as any).vi ?? (globalThis as any).jest) as TestFrameworkLike | undefined;

if (!resolvedTestFramework) {
    try {
        resolvedTestFramework = require("@jest/globals").jest as TestFrameworkLike;
    } catch {
        resolvedTestFramework = undefined;
    }
}

if (!resolvedTestFramework) {
    throw new Error("Expected a Jest or Vitest test framework on the global scope.");
}

export const testFramework = resolvedTestFramework;

export const createMockFn = () => testFramework.fn();

export const asMock = <T>(item: T): any => {
    return testFramework.mocked ? testFramework.mocked(item) : (item as any);
};

export const resetAllMocks = () => {
    testFramework.resetAllMocks();
};
