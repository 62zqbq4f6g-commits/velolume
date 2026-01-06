# VELOLUME SESSION MANAGEMENT

## Overview

This document explains how to maintain continuity between Claude/Claude Code sessions using the PROJECT_STATE.md file.

## File Location

Place this file in your codebase:

```
/velolume
  /docs
    PROJECT_STATE.md    ← Living project document
    SESSION_GUIDE.md    ← This file
```

---

## Starting a New Session

### Option 1: With Claude (Chat)

Copy the contents of PROJECT_STATE.md and paste at the start of your conversation:

```
Here's our project state. Continue from where we left off:

[paste PROJECT_STATE.md contents]

Today I want to focus on: [your goal]
```

### Option 2: With Claude Code

```
First, read /docs/PROJECT_STATE.md to understand the project context and current status.

Then: [your specific task]
```

---

## During a Session

Work normally. The project state document helps maintain context but doesn't need constant updates during active work.

---

## Ending a Session

Ask Claude (Chat) or Claude Code:

```
Update PROJECT_STATE.md with what we accomplished this session:
- What was completed
- Decisions made
- What's next
- Any blockers or open questions
```

Claude/Claude Code will update:

- **Last Updated** date
- **Session** number (increment)
- **✅ COMPLETED** — Move finished items here with dates
- **🔄 IN PROGRESS** — Update status
- **📋 NEXT UP** — Reprioritize if needed
- **💡 KEY DECISIONS** — Add any new decisions
- **📝 SESSION LOG** — Add session summary

---

## Prompt Templates

### Starting Session (Chat)

```
I'm continuing work on Velolume. Here's the current project state:

[paste PROJECT_STATE.md]

Today's focus: [goal]
```

### Starting Session (Claude Code)

```
Read /docs/PROJECT_STATE.md for project context.

Current task: [specific task]

Key context:
- [any additional context not in the doc]
```

### Ending Session

```
Please update /docs/PROJECT_STATE.md with today's progress:

Completed:
- [list what was done]

Decisions:
- [list any decisions made]

Next priorities:
- [what should happen next]

Blockers:
- [anything blocking progress]
```

### Quick Status Check

```
Read /docs/PROJECT_STATE.md and give me a quick summary of:
1. Current focus
2. What's blocked
3. Next 3 priorities
```

---

## Best Practices

- **Update at natural breakpoints** — End of session, after major milestone, when priorities shift
- **Keep it scannable** — Use the existing format, don't add walls of text
- **Be specific about blockers** — Include what action unblocks it
- **Track decisions with rationale** — Future you will forget why
- **Session log is optional but valuable** — Helps track progress over time

---

## If Context Gets Lost

If a session starts without PROJECT_STATE.md:

```
I need to reconstruct project context. The project is Velolume - a creator data platform.

Key files to check:
- /docs/PROJECT_STATE.md (if it exists)
- /lib/ai/processor.ts (detection logic)
- /package.json (dependencies)
- Recent git commits

Please scan these and summarize current project status.
```

---

## Document Sections Explained

| Section | Purpose | Update Frequency |
|---------|---------|------------------|
| 🎯 CURRENT FOCUS | What we're working on NOW | Every session |
| ✅ COMPLETED | Done items with dates | When items complete |
| 🔄 IN PROGRESS | Active work | Every session |
| 📋 NEXT UP | Priority queue | When priorities change |
| 🚫 BLOCKED | What's stuck and why | As blockers arise/resolve |
| 💡 KEY DECISIONS | Important choices made | When decisions made |
| ⚠️ OPEN QUESTIONS | Unresolved questions | As questions arise/resolve |
| 🏗️ TECHNICAL STATUS | Component status table | When status changes |
| 📊 VALIDATION RESULTS | Test findings | After tests |
| 🗺️ ROADMAP | Phase overview | Rarely (reference only) |
| 📝 SESSION LOG | Session summaries | End of each session |
