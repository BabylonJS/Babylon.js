import type { FullResult, Reporter, TestCase, TestResult } from "@playwright/test/reporter";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type PublicReportReporterOptions = {
    outputFolder?: string;
};

type PublicTestResult = {
    duration: number;
    retry: number;
    status: TestResult["status"];
    title: string;
};

const escapeHtml = (value: string): string => {
    return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
};

class PublicReportReporter implements Reporter {
    private readonly _outputFolder: string;
    private readonly _results = new Map<string, PublicTestResult>();

    public constructor(options: PublicReportReporterOptions = {}) {
        this._outputFolder = options.outputFolder ?? "playwright-report";
    }

    public onTestEnd(test: TestCase, result: TestResult): void {
        this._results.set(test.id, {
            duration: result.duration,
            retry: result.retry,
            status: result.status,
            title: test.titlePath().join(" > "),
        });
    }

    public onEnd(result: FullResult): void {
        const results = [...this._results.values()].sort((left, right) => left.title.localeCompare(right.title));
        const totals = new Map<string, number>();
        for (const testResult of results) {
            totals.set(testResult.status, (totals.get(testResult.status) ?? 0) + 1);
        }

        const summary = [...totals.entries()]
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([status, count]) => `<li><strong>${escapeHtml(status)}</strong>: ${count}</li>`)
            .join("");
        const rows = results
            .map(
                (testResult) =>
                    `<tr><td>${escapeHtml(testResult.title)}</td><td>${escapeHtml(testResult.status)}</td><td>${testResult.retry + 1}</td><td>${testResult.duration} ms</td></tr>`
            )
            .join("");
        const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Playwright test report</title>
<style>
body { color: #24292f; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 2rem; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #d0d7de; padding: 0.5rem; text-align: left; }
th { background: #f6f8fa; }
</style>
</head>
<body>
<h1>Playwright test report</h1>
<p>Overall status: <strong>${escapeHtml(result.status)}</strong></p>
<ul>${summary}</ul>
<p>This public report intentionally omits errors, output, attachments, traces, and configuration.</p>
<table>
<thead><tr><th>Test</th><th>Status</th><th>Attempts</th><th>Duration</th></tr></thead>
<tbody>${rows}</tbody>
</table>
</body>
</html>
`;

        mkdirSync(this._outputFolder, { recursive: true });
        writeFileSync(join(this._outputFolder, "index.html"), html, "utf8");
    }
}

export default PublicReportReporter;
