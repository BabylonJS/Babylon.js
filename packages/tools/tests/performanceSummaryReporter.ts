/**
 * Custom Playwright reporter that aggregates performance test results
 * and logs an overall summary at the end of the run.
 *
 * Parses `[PERF]` log lines emitted by performance tests in stdout
 * and computes average/median/min/max differences across all tests.
 */
import { type Reporter, type TestCase, type TestResult, type FullResult } from "@playwright/test/reporter";

interface PerfEntry {
    testName: string;
    baselineLabel: string;
    candidateLabel: string;
    baselineMs: number;
    candidateMs: number;
    diffPercent: number;
    direction: "faster" | "slower";
    inconclusive: boolean;
}

// Matches the structured part of a [PERF] log line:
// [PERF] <name>: <baselineLabel>: <time>ms, <candidateLabel>: <time>ms, <candidateLabel> is <pct>% faster|slower, ...
const PERF_LINE_REGEX = /\[PERF\]\s+(.+?):\s+(\S+):\s+([\d.]+)ms,\s+(\S+):\s+([\d.]+)ms,\s+\S+ is ([\d.]+)% (faster|slower)/;

class PerformanceSummaryReporter implements Reporter {
    private entries: PerfEntry[] = [];

    onTestEnd(_test: TestCase, result: TestResult) {
        for (const output of result.stdout) {
            const line = typeof output === "string" ? output : output.toString();
            if (!line.includes("[PERF]")) continue;
            const parsed = this.parsePerfLine(line);
            if (parsed) {
                this.entries.push(parsed);
            }
        }
    }

    onEnd(_result: FullResult) {
        if (this.entries.length === 0) return;

        const conclusive = this.entries.filter((e) => !e.inconclusive);
        const inconclusiveCount = this.entries.length - conclusive.length;

        if (conclusive.length === 0) {
            console.log("");
            console.log("=".repeat(80));
            console.log("PERFORMANCE SUMMARY");
            console.log(`All ${this.entries.length} test(s) were inconclusive (noisy measurements).`);
            console.log("=".repeat(80));
            return;
        }

        // Signed percentages: positive = candidate slower, negative = candidate faster
        const signedDiffs = conclusive.map((e) => (e.direction === "slower" ? e.diffPercent : -e.diffPercent));

        const avg = signedDiffs.reduce((a, b) => a + b, 0) / signedDiffs.length;
        const sorted = [...signedDiffs].sort((a, b) => a - b);
        const median = sorted.length % 2 === 0 ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 : sorted[Math.floor(sorted.length / 2)];
        const min = sorted[0];
        const max = sorted[sorted.length - 1];

        const baselineLabel = conclusive[0].baselineLabel;
        const candidateLabel = conclusive[0].candidateLabel;

        const formatDiff = (val: number): string => {
            const abs = Math.abs(val).toFixed(1);
            return val > 0.05 ? `${abs}% slower` : val < -0.05 ? `${abs}% faster` : `${abs}% (no change)`;
        };

        // Find the worst regressions and best improvements
        const worstRegression = conclusive.reduce((worst, e) => {
            const signed = e.direction === "slower" ? e.diffPercent : -e.diffPercent;
            const worstSigned = worst.direction === "slower" ? worst.diffPercent : -worst.diffPercent;
            return signed > worstSigned ? e : worst;
        });
        const bestImprovement = conclusive.reduce((best, e) => {
            const signed = e.direction === "slower" ? e.diffPercent : -e.diffPercent;
            const bestSigned = best.direction === "slower" ? best.diffPercent : -best.diffPercent;
            return signed < bestSigned ? e : best;
        });

        console.log("");
        console.log("=".repeat(80));
        console.log("PERFORMANCE SUMMARY");
        console.log("-".repeat(80));
        console.log(`Tests:     ${conclusive.length} conclusive, ${inconclusiveCount} inconclusive`);
        console.log(`Baseline:  ${baselineLabel}`);
        console.log(`Candidate: ${candidateLabel}`);
        console.log("-".repeat(80));
        console.log(`Average:   ${candidateLabel} is ${formatDiff(avg)}`);
        console.log(`Median:    ${candidateLabel} is ${formatDiff(median)}`);
        console.log(`Range:     ${formatDiff(min)} to ${formatDiff(max)}`);
        console.log("-".repeat(80));
        console.log(
            `Worst regression:    ${worstRegression.testName} (${formatDiff(worstRegression.direction === "slower" ? worstRegression.diffPercent : -worstRegression.diffPercent)})`
        );
        console.log(
            `Best improvement:    ${bestImprovement.testName} (${formatDiff(bestImprovement.direction === "slower" ? bestImprovement.diffPercent : -bestImprovement.diffPercent)})`
        );
        console.log("=".repeat(80));
    }

    private parsePerfLine(line: string): PerfEntry | null {
        const match = line.match(PERF_LINE_REGEX);
        if (!match) return null;
        return {
            testName: match[1],
            baselineLabel: match[2],
            candidateLabel: match[4],
            baselineMs: parseFloat(match[3]),
            candidateMs: parseFloat(match[5]),
            diffPercent: parseFloat(match[6]),
            direction: match[7] as "faster" | "slower",
            inconclusive: line.includes("[INCONCLUSIVE"),
        };
    }
}

export default PerformanceSummaryReporter;
