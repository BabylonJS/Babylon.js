#!/usr/bin/env node

/**
 * AI Code Simplifier Agent
 * 
 * This agent uses AI to analyze recent code changes and suggest intelligent
 * simplifications. Unlike rule-based approaches, this agent understands context
 * and can suggest a wide variety of improvements.
 * 
 * The agent:
 * 1. Reads recently changed files
 * 2. Analyzes the code using AI/heuristics
 * 3. Generates contextual simplification suggestions
 * 4. Outputs suggestions in a structured format
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AICodeSimplifierAgent {
    constructor(options = {}) {
        this.options = {
            changedFilesPath: options.changedFiles,
            commitsPath: options.commits,
            outputPath: options.output || '/tmp/agent_output',
            githubToken: options.githubToken,
            repository: options.repository,
            maxFilesPerRun: options.maxFilesPerRun || 50,
            maxSuggestionsPerFile: options.maxSuggestionsPerFile || 3
        };
        
        this.suggestions = [];
        this.filesAnalyzed = 0;
    }

    /**
     * Read the list of changed files
     */
    readChangedFiles() {
        if (!fs.existsSync(this.options.changedFilesPath)) {
            console.log('No changed files found');
            return [];
        }
        
        const content = fs.readFileSync(this.options.changedFilesPath, 'utf8');
        return content
            .split('\n')
            .filter(line => line.trim())
            .filter(file => fs.existsSync(file))
            .slice(0, this.options.maxFilesPerRun);
    }

    /**
     * Read recent commits
     */
    readRecentCommits() {
        if (!fs.existsSync(this.options.commitsPath)) {
            return [];
        }
        
        const content = fs.readFileSync(this.options.commitsPath, 'utf8');
        return content.split('\n').filter(line => line.trim()).map(line => {
            const [hash, author, message] = line.split('|');
            return { hash, author, message };
        });
    }

    /**
     * Analyze a single file for simplification opportunities
     * 
     * This is where the AI/intelligent analysis happens. In a real implementation,
     * this would call an LLM API (OpenAI, Anthropic, etc.) or use GitHub Copilot.
     * 
     * For this example, we'll use heuristic-based analysis that looks for common
     * patterns that could benefit from simplification.
     */
    async analyzeFile(filePath) {
        console.log(`  Analyzing: ${filePath}`);
        
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        const suggestions = [];
        
        // In a real implementation, this would call an AI service:
        // const analysis = await this.callAIService(content, filePath);
        
        // For now, use intelligent heuristics that go beyond simple pattern matching
        const fileAnalysis = this.performIntelligentAnalysis(content, filePath, lines);
        suggestions.push(...fileAnalysis);
        
        return suggestions.slice(0, this.options.maxSuggestionsPerFile);
    }

    /**
     * Perform intelligent code analysis
     * 
     * This uses heuristics to identify code that could be simplified.
     * In production, this would integrate with an LLM API.
     */
    performIntelligentAnalysis(content, filePath, lines) {
        const suggestions = [];
        const language = path.extname(filePath).substring(1);
        
        // Analyze complexity metrics
        const complexityIssues = this.analyzeComplexity(content, filePath, lines);
        suggestions.push(...complexityIssues);
        
        // Analyze for verbose patterns
        const verbosityIssues = this.analyzeVerbosity(content, filePath, lines);
        suggestions.push(...verbosityIssues);
        
        // Analyze for duplication
        const duplicationIssues = this.analyzeDuplication(content, filePath, lines);
        suggestions.push(...duplicationIssues);
        
        // Analyze for modern syntax opportunities
        const modernizationIssues = this.analyzeModernization(content, filePath, lines);
        suggestions.push(...modernizationIssues);
        
        return suggestions;
    }

    /**
     * Analyze code complexity and suggest simplifications
     */
    analyzeComplexity(content, filePath, lines) {
        const suggestions = [];
        
        // Look for deeply nested conditionals
        lines.forEach((line, index) => {
            const indentLevel = line.search(/\S/);
            if (indentLevel > 40 && /if|else|for|while/.test(line)) {
                suggestions.push({
                    file: filePath,
                    lines: `${index + 1}`,
                    language: path.extname(filePath).substring(1),
                    title: 'Consider extracting nested logic into a separate function',
                    priority: 'medium',
                    current_code: this.getContextLines(lines, index, 3),
                    suggested_code: '// Extract to: const result = checkCondition();\n' + line.trim(),
                    rationale: 'Deeply nested code (indentation > 40 chars) is hard to read and maintain. Extracting to a well-named function improves readability.',
                    impact: 'Improves code readability and maintainability. Reduces cognitive load when reviewing this code.'
                });
            }
        });
        
        // Look for long functions
        const functionLengths = this.analyzeFunctionLengths(content, lines);
        functionLengths.forEach(func => {
            if (func.length > 50) {
                suggestions.push({
                    file: filePath,
                    lines: `${func.start}-${func.end}`,
                    language: path.extname(filePath).substring(1),
                    title: `Function '${func.name}' is ${func.length} lines - consider splitting`,
                    priority: 'low',
                    current_code: `// Function: ${func.name}\n// Lines: ${func.length}`,
                    suggested_code: `// Split into smaller, focused functions\n// Each handling a single responsibility`,
                    rationale: `Functions longer than 50 lines often handle multiple responsibilities. The '${func.name}' function has ${func.length} lines.`,
                    impact: 'Splitting into smaller functions improves testability, reusability, and maintainability.'
                });
            }
        });
        
        return suggestions;
    }

    /**
     * Analyze for verbose code patterns
     */
    analyzeVerbosity(content, filePath, lines) {
        const suggestions = [];
        
        // Look for verbose array operations
        if (content.includes('for (let i = 0') && content.includes('push(')) {
            const match = content.match(/for\s*\(let\s+(\w+)\s*=\s*0[^}]+\.push\([^)]+\)/);
            if (match) {
                suggestions.push({
                    file: filePath,
                    lines: 'Multiple',
                    language: path.extname(filePath).substring(1),
                    title: 'Consider using array methods instead of for loops',
                    priority: 'low',
                    current_code: 'for (let i = 0; i < arr.length; i++) { result.push(transform(arr[i])); }',
                    suggested_code: 'const result = arr.map(item => transform(item));',
                    rationale: 'Modern array methods (.map, .filter, .reduce) are more declarative and easier to understand than imperative loops.',
                    impact: 'Improves readability and reduces boilerplate code. Communicates intent more clearly.'
                });
            }
        }
        
        // Look for verbose null/undefined checks
        if (/if\s*\(\s*\w+\s*!==?\s*null\s*&&\s*\w+\s*!==?\s*undefined\s*\)/.test(content)) {
            suggestions.push({
                file: filePath,
                lines: 'Multiple',
                language: path.extname(filePath).substring(1),
                title: 'Use optional chaining or nullish coalescing',
                priority: 'low',
                current_code: 'if (obj !== null && obj !== undefined && obj.prop) { ... }',
                suggested_code: 'if (obj?.prop) { ... }',
                rationale: 'Optional chaining (?.) simplifies null/undefined checks and is more concise.',
                impact: 'Reduces boilerplate and makes the code more modern and readable.'
            });
        }
        
        return suggestions;
    }

    /**
     * Analyze for code duplication
     */
    analyzeDuplication(content, filePath, lines) {
        const suggestions = [];
        
        // Simple duplication detection - look for repeated code blocks
        const codeBlocks = new Map();
        
        for (let i = 0; i < lines.length - 5; i++) {
            const block = lines.slice(i, i + 5).join('\n').trim();
            if (block.length > 50 && !/^\s*\/\/|^\s*\*/.test(block)) {  // Ignore comments
                if (codeBlocks.has(block)) {
                    codeBlocks.get(block).push(i);
                } else {
                    codeBlocks.set(block, [i]);
                }
            }
        }
        
        codeBlocks.forEach((occurrences, block) => {
            if (occurrences.length > 1) {
                suggestions.push({
                    file: filePath,
                    lines: occurrences.map(l => l + 1).join(', '),
                    language: path.extname(filePath).substring(1),
                    title: `Duplicated code block found in ${occurrences.length} places`,
                    priority: 'medium',
                    current_code: block.substring(0, 200) + '...',
                    suggested_code: '// Extract to a reusable function or constant',
                    rationale: `This code block appears ${occurrences.length} times. Duplication increases maintenance burden and risk of bugs.`,
                    impact: 'Reducing duplication makes the code easier to maintain and less error-prone when changes are needed.'
                });
            }
        });
        
        return suggestions.slice(0, 2);  // Limit duplication suggestions
    }

    /**
     * Analyze for modernization opportunities
     */
    analyzeModernization(content, filePath, lines) {
        const suggestions = [];
        
        // Look for var usage (should use let/const)
        if (/\bvar\s+\w+/.test(content)) {
            suggestions.push({
                file: filePath,
                lines: 'Multiple',
                language: path.extname(filePath).substring(1),
                title: 'Replace var with let or const',
                priority: 'low',
                current_code: 'var count = 0;',
                suggested_code: 'let count = 0; // or const if not reassigned',
                rationale: 'var has function scope and can lead to subtle bugs. let/const have block scope and are the modern standard.',
                impact: 'Prevents scope-related bugs and aligns with modern JavaScript best practices.'
            });
        }
        
        // Look for Promise chains that could use async/await
        if (content.includes('.then(') && content.includes('.then(') && !content.includes('async ')) {
            suggestions.push({
                file: filePath,
                lines: 'Multiple',
                language: path.extname(filePath).substring(1),
                title: 'Consider using async/await instead of Promise chains',
                priority: 'low',
                current_code: 'fetch(url).then(r => r.json()).then(data => process(data));',
                suggested_code: 'const response = await fetch(url);\nconst data = await response.json();\nprocess(data);',
                rationale: 'async/await syntax is more readable than Promise chains, especially for multiple sequential operations.',
                impact: 'Improves readability and makes error handling more straightforward.'
            });
        }
        
        return suggestions;
    }

    /**
     * Analyze function lengths in the code
     */
    analyzeFunctionLengths(content, lines) {
        const functions = [];
        let currentFunction = null;
        let braceCount = 0;
        
        lines.forEach((line, index) => {
            // Detect function start (simplified)
            const functionMatch = line.match(/(?:function|const|let)\s+(\w+)\s*(?:=\s*)?(?:async\s*)?\(|(\w+)\s*\([^)]*\)\s*{/);
            if (functionMatch && !currentFunction) {
                currentFunction = {
                    name: functionMatch[1] || functionMatch[2] || 'anonymous',
                    start: index + 1,
                    braceCount: 0
                };
            }
            
            if (currentFunction) {
                // Count braces
                braceCount += (line.match(/{/g) || []).length;
                braceCount -= (line.match(/}/g) || []).length;
                
                if (braceCount === 0 && line.includes('}')) {
                    currentFunction.end = index + 1;
                    currentFunction.length = currentFunction.end - currentFunction.start + 1;
                    functions.push(currentFunction);
                    currentFunction = null;
                }
            }
        });
        
        return functions;
    }

    /**
     * Get context lines around a specific line
     */
    getContextLines(lines, lineIndex, contextSize = 2) {
        const start = Math.max(0, lineIndex - contextSize);
        const end = Math.min(lines.length, lineIndex + contextSize + 1);
        return lines.slice(start, end).join('\n');
    }

    /**
     * Run the agent
     */
    async run() {
        console.log('🤖 AI Code Simplifier Agent Starting...\n');
        
        // Read inputs
        const changedFiles = this.readChangedFiles();
        const commits = this.readRecentCommits();
        
        console.log(`📊 Analysis Scope:`);
        console.log(`   - Files to analyze: ${changedFiles.length}`);
        console.log(`   - Recent commits: ${commits.length}\n`);
        
        if (changedFiles.length === 0) {
            console.log('ℹ️  No files to analyze\n');
            return;
        }
        
        // Analyze each file
        console.log('🔍 Analyzing files...\n');
        for (const file of changedFiles) {
            this.filesAnalyzed++;
            const fileSuggestions = await this.analyzeFile(file);
            this.suggestions.push(...fileSuggestions);
        }
        
        console.log(`\n✅ Analysis complete!`);
        console.log(`   - Files analyzed: ${this.filesAnalyzed}`);
        console.log(`   - Suggestions generated: ${this.suggestions.length}\n`);
        
        // Save outputs
        this.saveOutputs();
    }

    /**
     * Save analysis outputs
     */
    saveOutputs() {
        // Ensure output directory exists
        if (!fs.existsSync(this.options.outputPath)) {
            fs.mkdirSync(this.options.outputPath, { recursive: true });
        }
        
        // Save suggestions as JSON
        const suggestionsPath = path.join(this.options.outputPath, 'suggestions.json');
        fs.writeFileSync(suggestionsPath, JSON.stringify(this.suggestions, null, 2));
        console.log(`📄 Suggestions saved to: ${suggestionsPath}`);
        
        // Generate apply script if there are suggestions
        if (this.suggestions.length > 0) {
            const applyScriptPath = path.join(this.options.outputPath, 'apply_changes.sh');
            const script = this.generateApplyScript();
            fs.writeFileSync(applyScriptPath, script);
            fs.chmodSync(applyScriptPath, '755');
            console.log(`📝 Apply script generated: ${applyScriptPath}`);
        }
        
        // Save summary
        const summary = {
            timestamp: new Date().toISOString(),
            files_analyzed: this.filesAnalyzed,
            suggestions_count: this.suggestions.length,
            suggestions_by_priority: {
                high: this.suggestions.filter(s => s.priority === 'high').length,
                medium: this.suggestions.filter(s => s.priority === 'medium').length,
                low: this.suggestions.filter(s => s.priority === 'low').length
            }
        };
        
        const summaryPath = path.join(this.options.outputPath, 'summary.json');
        fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
        console.log(`📊 Summary saved to: ${summaryPath}\n`);
    }

    /**
     * Generate a script to apply suggestions
     * (This would be more sophisticated in a real implementation)
     */
    generateApplyScript() {
        return `#!/bin/bash
# Auto-generated script to apply code simplifications
# Review carefully before running!

echo "⚠️  This script contains suggested changes."
echo "Review each change carefully before applying."
echo ""
echo "Total suggestions: ${this.suggestions.length}"
echo ""
echo "This is a placeholder - actual implementation would apply specific changes"
echo "based on the AI suggestions in suggestions.json"
`;
    }
}

// CLI Interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {};
    
    for (let i = 0; i < args.length; i += 2) {
        const key = args[i].replace(/^--/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        options[key] = args[i + 1];
    }
    
    const agent = new AICodeSimplifierAgent(options);
    agent.run().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

module.exports = AICodeSimplifierAgent;
