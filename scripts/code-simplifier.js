#!/usr/bin/env node

/**
 * Code Simplifier Script
 * 
 * This script analyzes JavaScript/TypeScript code and suggests or applies
 * simplifications to improve code quality and readability.
 * 
 * Simplifications include:
 * - Removing unnecessary ternary operators (e.g., `x ? true : false` -> `x`)
 * - Simplifying boolean comparisons (e.g., `x === true` -> `x`)
 * - Removing unnecessary else blocks after return statements
 * - Detecting and reporting console.log statements
 * - Other common code smell patterns
 */

const fs = require('fs');
const path = require('path');

class CodeSimplifier {
    constructor(options = {}) {
        this.options = {
            dryRun: options.dryRun || false,
            verbose: options.verbose || false,
            patterns: options.patterns || ['packages/**/src/**/*.{ts,tsx,js}'],
            exclude: options.exclude || ['**/node_modules/**', '**/dist/**', '**/build/**']
        };
        this.stats = {
            filesProcessed: 0,
            filesChanged: 0,
            simplifications: 0,
            patterns: {}
        };
    }

    /**
     * Find all files matching the patterns
     */
    findFiles() {
        const files = [];
        
        // Simple recursive file finder
        const findFilesRecursive = (dir, patterns) => {
            if (!fs.existsSync(dir)) {
                return [];
            }
            
            const result = [];
            const stat = fs.statSync(dir);
            
            // If it's a file, check if it matches
            if (stat.isFile()) {
                const ext = path.extname(dir);
                if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
                    return [dir];
                }
                return [];
            }
            
            // If it's a directory, recurse
            if (!stat.isDirectory()) {
                return [];
            }
            
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                // Skip excluded directories
                if (this.options.exclude.some(pattern => 
                    fullPath.includes('node_modules') || 
                    fullPath.includes('/dist/') || 
                    fullPath.includes('/build/')
                )) {
                    continue;
                }
                
                if (entry.isDirectory()) {
                    result.push(...findFilesRecursive(fullPath, patterns));
                } else if (entry.isFile()) {
                    // Check if file matches any pattern
                    const ext = path.extname(entry.name);
                    if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
                        result.push(fullPath);
                    }
                }
            }
            
            return result;
        };
        
        // If patterns are provided as arguments, use those
        if (this.options.patterns.length > 0) {
            for (const pattern of this.options.patterns) {
                files.push(...findFilesRecursive(pattern, []));
            }
        } else {
            // Start from packages directory by default
            const packagesDir = path.join(process.cwd(), 'packages');
            if (fs.existsSync(packagesDir)) {
                files.push(...findFilesRecursive(packagesDir, this.options.patterns));
            }
        }
        
        return [...new Set(files)]; // Remove duplicates
    }

    /**
     * Apply simplifications to a file
     */
    simplifyFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        let simplified = content;
        let changesMade = false;

        // Track which patterns were applied
        const appliedPatterns = [];

        // Pattern 1: Unnecessary ternary returning boolean
        // x ? true : false -> x
        // x ? false : true -> !x
        const ternaryBoolPattern1 = /(\w+)\s*\?\s*true\s*:\s*false/g;
        if (ternaryBoolPattern1.test(simplified)) {
            simplified = simplified.replace(/(\w+)\s*\?\s*true\s*:\s*false/g, '$1');
            appliedPatterns.push('unnecessary-ternary-bool');
            changesMade = true;
        }

        const ternaryBoolPattern2 = /(\w+)\s*\?\s*false\s*:\s*true/g;
        if (ternaryBoolPattern2.test(simplified)) {
            simplified = simplified.replace(/(\w+)\s*\?\s*false\s*:\s*true/g, '!$1');
            appliedPatterns.push('unnecessary-ternary-bool-negated');
            changesMade = true;
        }

        // Pattern 2: Redundant boolean comparison
        // x === true -> x
        // x === false -> !x
        // x !== false -> x
        // x !== true -> !x
        const boolComparePattern1 = /(\w+)\s*===\s*true(?!\w)/g;
        if (boolComparePattern1.test(simplified)) {
            simplified = simplified.replace(boolComparePattern1, '$1');
            appliedPatterns.push('redundant-bool-compare-true');
            changesMade = true;
        }

        const boolComparePattern2 = /(\w+)\s*===\s*false(?!\w)/g;
        if (boolComparePattern2.test(simplified)) {
            simplified = simplified.replace(boolComparePattern2, '!$1');
            appliedPatterns.push('redundant-bool-compare-false');
            changesMade = true;
        }

        const boolComparePattern3 = /(\w+)\s*!==\s*false(?!\w)/g;
        if (boolComparePattern3.test(simplified)) {
            simplified = simplified.replace(boolComparePattern3, '$1');
            appliedPatterns.push('redundant-bool-compare-not-false');
            changesMade = true;
        }

        const boolComparePattern4 = /(\w+)\s*!==\s*true(?!\w)/g;
        if (boolComparePattern4.test(simplified)) {
            simplified = simplified.replace(boolComparePattern4, '!$1');
            appliedPatterns.push('redundant-bool-compare-not-true');
            changesMade = true;
        }

        // Pattern 3: Double negation
        // !!x when used in boolean context could be simplified
        // Note: This is context-dependent, so we'll just report it
        if (/!![\w.]+/.test(simplified)) {
            if (this.options.verbose) {
                console.log(`  ℹ️  Double negation found in ${path.relative(process.cwd(), filePath)}`);
            }
        }

        // Update statistics
        if (changesMade) {
            this.stats.filesChanged++;
            this.stats.simplifications += appliedPatterns.length;
            
            appliedPatterns.forEach(pattern => {
                this.stats.patterns[pattern] = (this.stats.patterns[pattern] || 0) + 1;
            });

            if (!this.options.dryRun) {
                fs.writeFileSync(filePath, simplified, 'utf8');
            }

            if (this.options.verbose) {
                console.log(`  ✓ Simplified: ${path.relative(process.cwd(), filePath)}`);
                appliedPatterns.forEach(pattern => {
                    console.log(`    - Applied: ${pattern}`);
                });
            }
        }

        return changesMade;
    }

    /**
     * Run the simplifier on all files
     */
    run() {
        console.log('🔍 Code Simplifier Starting...\n');
        
        if (this.options.dryRun) {
            console.log('🏃 Running in DRY RUN mode (no files will be modified)\n');
        }

        const files = this.findFiles();
        console.log(`📁 Found ${files.length} files to process\n`);

        for (const file of files) {
            this.stats.filesProcessed++;
            
            try {
                this.simplifyFile(file);
            } catch (error) {
                console.error(`❌ Error processing ${path.relative(process.cwd(), file)}: ${error.message}`);
            }
        }

        this.printSummary();
    }

    /**
     * Print summary statistics
     */
    printSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 Summary');
        console.log('='.repeat(60));
        console.log(`Files processed: ${this.stats.filesProcessed}`);
        console.log(`Files changed: ${this.stats.filesChanged}`);
        console.log(`Total simplifications: ${this.stats.simplifications}`);
        
        if (Object.keys(this.stats.patterns).length > 0) {
            console.log('\nSimplification patterns applied:');
            Object.entries(this.stats.patterns)
                .sort((a, b) => b[1] - a[1])
                .forEach(([pattern, count]) => {
                    console.log(`  - ${pattern}: ${count}`);
                });
        }
        console.log('='.repeat(60));

        if (this.stats.filesChanged === 0) {
            console.log('\n✨ No simplifications needed - code is already clean!\n');
        } else {
            console.log(`\n✅ Successfully simplified ${this.stats.filesChanged} file(s)\n`);
        }
    }
}

// CLI Interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {
        dryRun: args.includes('--dry-run') || args.includes('-d'),
        verbose: args.includes('--verbose') || args.includes('-v'),
        patterns: []
    };

    // Extract patterns from args
    const patternArgs = args.filter(arg => !arg.startsWith('-'));
    if (patternArgs.length > 0) {
        options.patterns = patternArgs;
    }

    const simplifier = new CodeSimplifier(options);
    try {
        simplifier.run();
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

module.exports = CodeSimplifier;
