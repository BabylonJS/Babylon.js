export type OptimizationTestCase = {
    name: string;
    smartFilterFactory: () => SmartFilter;
    expectedOptimizedBlocks: string[];
};
