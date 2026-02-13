# Continuous Code Simplifier

The Continuous Code Simplifier is an automated workflow that helps maintain code quality by identifying and fixing common code patterns that can be simplified.

## Overview

The code simplifier runs automatically on a weekly schedule (every Monday at 2 AM UTC) and can also be triggered manually. It analyzes the codebase for common simplification opportunities and creates a pull request with the suggested changes.

## What It Does

The simplifier identifies and fixes the following patterns:

### 1. Unnecessary Ternary Operators
```javascript
// Before
const result = condition ? true : false;

// After
const result = condition;
```

```javascript
// Before
const result = condition ? false : true;

// After
const result = !condition;
```

### 2. Redundant Boolean Comparisons
```javascript
// Before
if (isValid === true) { }

// After
if (isValid) { }
```

```javascript
// Before
if (isValid === false) { }

// After
if (!isValid) { }
```

### 3. ESLint Auto-fixes
The simplifier also runs ESLint with the `--fix` flag to automatically fix other code quality issues defined in the project's ESLint configuration.

### 4. Code Formatting
Prettier is run to ensure consistent code formatting across all files.

## How to Use

### Automatic Execution
The workflow runs automatically every Monday at 2 AM UTC. No manual intervention is required.

### Manual Execution
You can manually trigger the workflow from the GitHub Actions tab:

1. Go to the Actions tab in the GitHub repository
2. Select "Continuous Code Simplifier" from the workflows list
3. Click "Run workflow"
4. Optionally specify a custom target path (default: `packages/**/src/**/*.{ts,tsx,js}`)
5. Click the green "Run workflow" button

### Running Locally

You can also run the simplifier locally:

```bash
# Run on default patterns (packages/**/src/**/*.{ts,tsx,js})
node scripts/code-simplifier.js --verbose

# Run in dry-run mode (no files will be modified)
node scripts/code-simplifier.js --dry-run --verbose

# Run on specific patterns
node scripts/code-simplifier.js --verbose "packages/dev/core/src/**/*.ts"
```

#### Command Line Options

- `--verbose` or `-v`: Show detailed output for each file processed
- `--dry-run` or `-d`: Run in dry-run mode without modifying files
- Additional arguments: File patterns to process (glob patterns)

## Workflow Details

### Permissions
The workflow requires:
- `contents: write` - to create branches and push commits
- `pull-requests: write` - to create pull requests

### Steps
1. **Checkout repository** - Fetches the latest code
2. **Setup Node.js** - Installs Node.js 20 with npm caching
3. **Install dependencies** - Installs all project dependencies
4. **Run code simplification** - Executes the simplifier script
5. **Commit and push changes** - Creates a commit with changes (if any)
6. **Create Pull Request** - Opens a PR with the simplifications

### Pull Request Details
When changes are found, the workflow creates a pull request with:
- **Title**: 🤖 Automated Code Simplification
- **Labels**: `automated`, `code-quality`
- **Description**: Detailed summary of changes and review guidelines

## Configuration

### Modifying the Schedule
Edit `.github/workflows/code-simplifier.yml` to change the schedule:

```yaml
on:
  schedule:
    - cron: '0 2 * * 1'  # Every Monday at 2 AM UTC
```

### Modifying Target Patterns
The default target pattern is `packages/**/src/**/*.{ts,tsx,js}`. To change this:

1. For manual runs: Specify the pattern when triggering the workflow
2. For automatic runs: Edit the workflow file's default value

### Adding New Simplification Rules

To add new simplification patterns, edit `scripts/code-simplifier.js`:

```javascript
// Add your pattern in the simplifyFile method
const yourPattern = /your-regex-here/g;
if (yourPattern.test(simplified)) {
    simplified = simplified.replace(yourPattern, 'replacement');
    appliedPatterns.push('your-pattern-name');
    changesMade = true;
}
```

## Benefits

1. **Consistent Code Quality**: Automatically maintains code quality standards
2. **Reduced Manual Review**: Catches common patterns automatically
3. **Educational**: Team members learn better patterns through PR reviews
4. **Time Savings**: Reduces time spent on manual code reviews for simple issues
5. **Continuous Improvement**: Code quality improves incrementally over time

## Best Practices

1. **Review All PRs**: Always review the automated PRs before merging
2. **Test Changes**: Ensure all tests pass before merging
3. **Customize Patterns**: Add project-specific patterns as needed
4. **Monitor Results**: Check the workflow runs to ensure it's working as expected

## Troubleshooting

### Workflow Fails to Create PR
- Check that the workflow has the necessary permissions
- Ensure the `automated` and `code-quality` labels exist in the repository
- Verify that there are actual changes to commit

### No Changes Detected
This is expected behavior when the code is already clean. The workflow will complete successfully with no PR created.

### Script Errors
- Check Node.js version compatibility (requires Node.js 20+)
- Ensure all dependencies are installed
- Review the script output for specific error messages

## Future Enhancements

Potential improvements for the code simplifier:

- [ ] Add more simplification patterns
- [ ] Support for more complex code transformations
- [ ] Integration with AI-powered code review
- [ ] Custom configuration file support
- [ ] Parallel processing for large codebases
- [ ] Incremental simplification (one file/pattern at a time)
- [ ] Statistics dashboard showing simplification trends

## Contributing

To contribute to the code simplifier:

1. Add new patterns to `scripts/code-simplifier.js`
2. Test your patterns locally with `--dry-run` first
3. Submit a PR with your changes
4. Include examples of the patterns you're fixing

## License

This tool is part of the Babylon.js project and follows the same license.
