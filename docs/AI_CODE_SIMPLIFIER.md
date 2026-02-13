# AI Code Simplifier Agent

An intelligent, continuous code simplification agent that analyzes daily code changes and suggests context-aware improvements using AI-powered analysis.

## Overview

Unlike traditional rule-based linters, this agent uses intelligent analysis to understand code context and suggest meaningful simplifications. It runs automatically every day, reviewing the previous day's changes and creating actionable suggestions.

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  Daily Trigger (2 AM UTC)                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Collect Recent Changes                                      │
│  - Get commits from last 24 hours                           │
│  - Extract changed source files                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  AI Analysis Engine                                          │
│  - Complexity analysis (nested code, long functions)        │
│  - Verbosity detection (can be more concise)                │
│  - Duplication detection (repeated patterns)                │
│  - Modernization opportunities (older syntax)               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Generate Suggestions                                        │
│  - Context-aware recommendations                            │
│  - Priority classification (high/medium/low)                │
│  - Before/after code examples                               │
│  - Impact assessment                                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Create GitHub Issue                                         │
│  - Organized suggestions                                    │
│  - Labeled for tracking                                     │
│  - Ready for team review                                    │
└─────────────────────────────────────────────────────────────┘
```

## Features

### Intelligent Analysis

The agent goes beyond simple pattern matching:

1. **Complexity Analysis**
   - Detects deeply nested code
   - Identifies overly long functions
   - Suggests extraction into smaller, focused units

2. **Verbosity Detection**
   - Finds imperative loops that could use declarative array methods
   - Identifies verbose null checks that could use optional chaining
   - Suggests more concise alternatives

3. **Duplication Detection**
   - Identifies repeated code blocks
   - Suggests extraction into reusable functions
   - Reduces maintenance burden

4. **Modernization Opportunities**
   - Suggests replacing `var` with `let`/`const`
   - Recommends `async`/`await` over Promise chains
   - Identifies opportunities for modern JavaScript features

### Context-Aware Suggestions

Each suggestion includes:
- **File and line numbers** - Exactly where to look
- **Current code** - What exists now
- **Suggested code** - Proposed improvement
- **Rationale** - Why this change helps
- **Impact assessment** - Expected benefits
- **Priority** - high/medium/low urgency

## Usage

### Automatic Daily Execution

The agent runs automatically every day at 2 AM UTC. It:
1. Analyzes commits from the previous 24 hours
2. Reviews all changed source files
3. Generates suggestions
4. Creates a GitHub issue with findings

No manual intervention required!

### Manual Execution

Trigger the workflow manually from GitHub Actions:

1. Go to **Actions** tab
2. Select "**Continuous Code Simplifier Agent**"
3. Click "**Run workflow**"
4. Configure options:
   - **days_back**: How many days to analyze (default: 1)
   - **create_pr**: Whether to create a PR (default: true)
5. Click "**Run workflow**"

### Local Testing

Test the agent locally before deploying:

```bash
# Analyze recent changes
git log --since="1 day ago" --name-only --pretty=format: | \
  sort -u | grep -E '\.(ts|tsx|js)$' > /tmp/changed_files.txt

# Run the agent
node scripts/ai-code-simplifier-agent.js \
  --changed-files /tmp/changed_files.txt \
  --output ./agent_output

# Review suggestions
cat ./agent_output/suggestions.json | jq .
```

## Output

### GitHub Issue

The agent creates a detailed issue with:

```markdown
## 🤖 Daily Code Simplification Suggestions

The AI Code Simplifier Agent has analyzed recent changes and found **X** 
opportunities for code simplification.

### 1. Consider extracting nested logic into a separate function

**File**: `src/components/Example.ts`
**Lines**: 45
**Priority**: medium

**Current Code**:
```typescript
if (condition1) {
    if (condition2) {
        if (condition3) {
            // deeply nested logic
        }
    }
}
```

**Suggested Simplification**:
```typescript
const result = checkConditions();
if (result) {
    // logic here
}
```

**Rationale**: Deeply nested code is hard to read and maintain...
**Impact**: Improves code readability and maintainability...
```

### JSON Output

Structured data for programmatic access:

```json
[
  {
    "file": "src/file.ts",
    "lines": "45",
    "language": "ts",
    "title": "Suggestion title",
    "priority": "medium",
    "current_code": "...",
    "suggested_code": "...",
    "rationale": "...",
    "impact": "..."
  }
]
```

## Configuration

### Workflow Schedule

Edit `.github/workflows/code-simplifier-agent.yml`:

```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
```

### Analysis Parameters

Modify `scripts/ai-code-simplifier-agent.js`:

```javascript
this.options = {
    maxFilesPerRun: 50,        // Max files to analyze
    maxSuggestionsPerFile: 3,  // Max suggestions per file
    // ... other options
};
```

### Integrating with AI Services

The current implementation uses heuristic-based analysis. To integrate with an AI service (OpenAI, Anthropic, GitHub Copilot):

```javascript
async analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Call AI service
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-4',
            messages: [{
                role: 'system',
                content: 'You are a code review expert. Analyze this code and suggest simplifications.'
            }, {
                role: 'user',
                content: `File: ${filePath}\n\n${content}`
            }]
        })
    });
    
    const data = await response.json();
    return this.parseSuggestions(data.choices[0].message.content);
}
```

## Best Practices

### Reviewing Suggestions

1. **Don't auto-apply everything** - Review each suggestion
2. **Consider context** - The agent doesn't know all business logic
3. **Prioritize high-priority items** - Focus on impactful changes first
4. **Test changes** - Always test after applying simplifications

### Team Workflow

1. **Daily review** - Assign someone to review daily issues
2. **Label system** - Use labels to track accepted/rejected suggestions
3. **Feedback loop** - Close issues with notes on why suggestions were accepted/rejected
4. **Continuous improvement** - Tune the agent based on team feedback

### Customization

1. **Add domain-specific patterns** - Extend the analysis for your codebase
2. **Adjust priorities** - Weight suggestions based on your team's values
3. **Filter files** - Exclude generated code, vendor files, etc.
4. **Custom metrics** - Add analysis for your specific code quality metrics

## Examples

### Example 1: Complexity Reduction

**Before**:
```typescript
function processData(items) {
    for (let i = 0; i < items.length; i++) {
        if (items[i].active) {
            if (items[i].value > 100) {
                if (items[i].category === 'premium') {
                    // Process premium items
                    results.push(transform(items[i]));
                }
            }
        }
    }
}
```

**Agent Suggestion**:
```typescript
function processData(items) {
    const premiumItems = items
        .filter(item => item.active && item.value > 100 && item.category === 'premium');
    
    return premiumItems.map(item => transform(item));
}
```

### Example 2: Modernization

**Before**:
```javascript
function loadData() {
    return fetch('/api/data')
        .then(response => response.json())
        .then(data => processData(data))
        .then(result => saveResult(result));
}
```

**Agent Suggestion**:
```javascript
async function loadData() {
    const response = await fetch('/api/data');
    const data = await response.json();
    const result = await processData(data);
    return saveResult(result);
}
```

### Example 3: Duplication Elimination

**Before**:
```typescript
function handleUserLogin(user) {
    if (!user || !user.email || !user.password) {
        throw new Error('Invalid user');
    }
    // ... login logic
}

function handleUserRegister(user) {
    if (!user || !user.email || !user.password) {
        throw new Error('Invalid user');
    }
    // ... register logic
}
```

**Agent Suggestion**:
```typescript
function validateUser(user) {
    if (!user || !user.email || !user.password) {
        throw new Error('Invalid user');
    }
}

function handleUserLogin(user) {
    validateUser(user);
    // ... login logic
}

function handleUserRegister(user) {
    validateUser(user);
    // ... register logic
}
```

## Troubleshooting

### No Suggestions Generated

- **Cause**: No changes in the analysis period, or code is already optimal
- **Solution**: This is normal! The agent only creates issues when it finds opportunities

### Too Many Suggestions

- **Cause**: Large refactoring or many files changed
- **Solution**: Adjust `maxFilesPerRun` or `maxSuggestionsPerFile` in the agent configuration

### False Positives

- **Cause**: Heuristic analysis doesn't understand full context
- **Solution**: Review and close invalid suggestions. Consider adding exclusion patterns.

### Workflow Fails

- **Cause**: GitHub token permissions or repository configuration
- **Solution**: Check workflow logs, ensure proper permissions are set

## Future Enhancements

- [ ] Integration with real AI/LLM APIs (OpenAI, Anthropic, GitHub Copilot)
- [ ] Machine learning to improve suggestion quality over time
- [ ] Auto-apply safe simplifications (with tests passing)
- [ ] Integration with code review process
- [ ] Metrics dashboard showing code quality trends
- [ ] Team-specific customization profiles
- [ ] Learning from accepted/rejected suggestions

## Contributing

To improve the agent:

1. Add new analysis patterns in `performIntelligentAnalysis()`
2. Improve detection algorithms
3. Add domain-specific checks
4. Integrate with AI services
5. Submit PRs with improvements

## License

Part of the Babylon.js project - follows the same license.
