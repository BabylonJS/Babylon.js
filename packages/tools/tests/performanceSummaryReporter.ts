/**
 * Custom Playwright reporter that aggregates performance test results
 * and logs an overall summary at the end of the run.
 *
 * Parses `[PERF]` log lines emitted by performance tests in stdout
 * and computes average/median/min/max differences across all tests.
 *
 * When PERF_COMMENT_FILE is set, writes a GitHub-flavored markdown
 * summary to that path (used by CI to post a PR comment).
 */
import { type Reporter, type TestCase, type TestResult, type FullResult } from "@playwright/test/reporter";
import * as fs from "fs";

interface PerfEntry {
    testName: string;
    baselineLabel: string;
    candidateLabel: string;
    baselineMs: number;
    candidateMs: number;
    diffPercent: number;
    direction: "faster" | "slower";
    inconclusive: boolean;
    pValue: number;
}

// Matches the structured part of a [PERF] log line:
// [PERF] <name>: <baselineLabel>: <time>ms, <candidateLabel>: <time>ms, <candidateLabel> is <pct>% faster|slower, p-value: <p>
const PERF_LINE_REGEX = /\[PERF\]\s+(.+?):\s+(\S+):\s+([\d.]+)ms,\s+(\S+):\s+([\d.]+)ms,\s+\S+ is ([\d.]+)% (faster|slower),\s+p-value:\s+([\d.]+)/;

class PerformanceSummaryReporter implements Reporter {
    private entries: PerfEntry[] = [];
    private failedTests: { title: string; error: string }[] = [];

    onTestEnd(test: TestCase, result: TestResult) {
        // Only record failures from the final attempt — earlier retries that
        // failed but were subsequently retried should not appear as failures.
        const isFinalAttempt = result.retry >= test.retries;
        if ((result.status === "failed" || result.status === "timedOut") && isFinalAttempt) {
            const error = result.errors.map((e) => e.message || "").join("\n") || result.status;
            this.failedTests.push({ title: test.title, error });
        }
        // Only collect [PERF] entries from the final attempt to avoid duplicates
        // when a test fails on an earlier retry and then passes.
        if (!isFinalAttempt) return;
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
        if (this.entries.length === 0 && this.failedTests.length === 0) {
            // No perf entries and no failures — write an all-passed message if requested.
            const commentFile = process.env.PERF_COMMENT_FILE;
            if (commentFile) {
                fs.writeFileSync(commentFile, "## ⚡ Performance Test Results\n\n🟢 All performance tests passed — no regressions detected.\n", "utf-8");
            }
            return;
        }

        const conclusive = this.entries.filter((e) => !e.inconclusive);
        const inconclusiveEntries = this.entries.filter((e) => e.inconclusive);
        const inconclusiveCount = inconclusiveEntries.length;

        const formatDiff = (val: number): string => {
            const abs = Math.abs(val).toFixed(1);
            return val > 0.05 ? `${abs}% slower` : val < -0.05 ? `${abs}% faster` : `${abs}% (no change)`;
        };

        const signedDiff = (e: PerfEntry): number => (e.direction === "slower" ? e.diffPercent : -e.diffPercent);

        // ---- Console output (same as before) ----
        if (conclusive.length > 0) {
            const signedDiffs = conclusive.map(signedDiff);
            const avg = signedDiffs.reduce((a, b) => a + b, 0) / signedDiffs.length;
            const sorted = [...signedDiffs].sort((a, b) => a - b);
            const median = sorted.length % 2 === 0 ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 : sorted[Math.floor(sorted.length / 2)];
            const min = sorted[0];
            const max = sorted[sorted.length - 1];
            const baselineLabel = conclusive[0].baselineLabel;
            const candidateLabel = conclusive[0].candidateLabel;

            const worstRegression = conclusive.reduce((worst, e) => (signedDiff(e) > signedDiff(worst) ? e : worst));
            const bestImprovement = conclusive.reduce((best, e) => (signedDiff(e) < signedDiff(best) ? e : best));

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
            console.log(`Worst regression:    ${worstRegression.testName} (${formatDiff(signedDiff(worstRegression))})`);
            console.log(`Best improvement:    ${bestImprovement.testName} (${formatDiff(signedDiff(bestImprovement))})`);
            console.log("=".repeat(80));
        } else if (this.entries.length > 0) {
            console.log("");
            console.log("=".repeat(80));
            console.log("PERFORMANCE SUMMARY");
            console.log(`All ${this.entries.length} test(s) were inconclusive (noisy measurements).`);
            console.log("=".repeat(80));
        }

        // ---- Markdown file for GitHub comment ----
        const commentFile = process.env.PERF_COMMENT_FILE;
        if (!commentFile) return;

        const md: string[] = [];
        md.push("## ⚡ Performance Test Results\n");

        if (conclusive.length > 0) {
            const signedDiffs = conclusive.map(signedDiff);
            const avg = signedDiffs.reduce((a, b) => a + b, 0) / signedDiffs.length;
            const sorted = [...signedDiffs].sort((a, b) => a - b);
            const median = sorted.length % 2 === 0 ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 : sorted[Math.floor(sorted.length / 2)];
            const baselineLabel = conclusive[0].baselineLabel;
            const candidateLabel = conclusive[0].candidateLabel;

            const icon = avg > 5 ? "🔴" : avg > 0.05 ? "🟡" : "🟢";
            md.push(`**Baseline:** ${baselineLabel} · **Candidate:** ${candidateLabel}\n`);
            md.push(`| Metric | Value |`);
            md.push(`| --- | --- |`);
            md.push(`| ${icon} Average | ${formatDiff(avg)} |`);
            md.push(`| Median | ${formatDiff(median)} |`);
            md.push(`| Tests | ${conclusive.length} conclusive, ${inconclusiveCount} inconclusive |`);
            md.push("");
        }

        // Classify by statistical significance (p < 0.05) AND direction
        const significantRegressions = conclusive.filter((e) => e.direction === "slower" && e.pValue < 0.05);
        const significantImprovements = conclusive.filter((e) => e.direction === "faster" && e.pValue < 0.05);
        const insignificant = conclusive.filter((e) => e.pValue >= 0.05);

        const confidenceLabel = (p: number): string => {
            if (p < 0.01) return "High";
            if (p < 0.05) return "Medium";
            return "Low";
        };

        // Significant regressions table
        if (significantRegressions.length > 0) {
            const sorted = [...significantRegressions].sort((a, b) => b.diffPercent - a.diffPercent);
            md.push(`### 🔻 Significant Regressions (${significantRegressions.length})\n`);
            md.push(`| Test | Baseline | Candidate | Diff | p-value | Confidence |`);
            md.push(`| --- | ---: | ---: | ---: | ---: | :---: |`);
            for (const e of sorted) {
                md.push(
                    `| ${e.testName} | ${e.baselineMs.toFixed(1)}ms | ${e.candidateMs.toFixed(1)}ms | **${e.diffPercent.toFixed(1)}% slower** | ${e.pValue.toFixed(4)} | ${confidenceLabel(e.pValue)} |`
                );
            }
            md.push("");
        }

        // Significant improvements table
        if (significantImprovements.length > 0) {
            const sorted = [...significantImprovements].sort((a, b) => b.diffPercent - a.diffPercent);
            md.push(`<details><summary>🔺 Significant Improvements (${significantImprovements.length})</summary>\n`);
            md.push(`| Test | Baseline | Candidate | Diff | p-value | Confidence |`);
            md.push(`| --- | ---: | ---: | ---: | ---: | :---: |`);
            for (const e of sorted) {
                md.push(
                    `| ${e.testName} | ${e.baselineMs.toFixed(1)}ms | ${e.candidateMs.toFixed(1)}ms | ${e.diffPercent.toFixed(1)}% faster | ${e.pValue.toFixed(4)} | ${confidenceLabel(e.pValue)} |`
                );
            }
            md.push(`\n</details>\n`);
        }

        // Not statistically significant (noise)
        if (insignificant.length > 0) {
            md.push(`<details><summary>🔘 Not Significant — p ≥ 0.05 (${insignificant.length})</summary>\n`);
            md.push(`| Test | Baseline | Candidate | Diff | p-value |`);
            md.push(`| --- | ---: | ---: | ---: | ---: |`);
            const sorted = [...insignificant].sort((a, b) => a.pValue - b.pValue);
            for (const e of sorted) {
                const diffLabel = e.direction === "slower" ? `${e.diffPercent.toFixed(1)}% slower` : `${e.diffPercent.toFixed(1)}% faster`;
                md.push(`| ${e.testName} | ${e.baselineMs.toFixed(1)}ms | ${e.candidateMs.toFixed(1)}ms | ${diffLabel} | ${e.pValue.toFixed(4)} |`);
            }
            md.push(`\n</details>\n`);
        }

        // Inconclusive
        if (inconclusiveEntries.length > 0) {
            md.push(`<details><summary>⚪ Inconclusive (${inconclusiveEntries.length})</summary>\n`);
            md.push(inconclusiveEntries.map((e) => `- ${e.testName}`).join("\n"));
            md.push(`\n</details>\n`);
        }

        // Failed tests (errors / timeouts)
        if (this.failedTests.length > 0) {
            md.push(`### ❌ Failed Tests (${this.failedTests.length})\n`);
            md.push(`| Test | Error |`);
            md.push(`| --- | --- |`);
            for (const f of this.failedTests) {
                // Truncate error to first line, max 120 chars
                const firstLine = f.error.split("\n")[0].substring(0, 120);
                md.push(`| ${f.title} | ${firstLine} |`);
            }
            md.push("");
        }

        fs.writeFileSync(commentFile, md.join("\n"), "utf-8");
        console.log(`Performance comment written to ${commentFile}`);
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
            pValue: parseFloat(match[8]),
        };
    }
}

export default PerformanceSummaryReporter;
