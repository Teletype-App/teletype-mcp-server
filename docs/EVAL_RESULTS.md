English | [Русский](ru/EVAL_RESULTS.md)

# Terminal client eval, 29 September 2026

Five terminal client and model combinations each ran 21 complete tasks and nine first-tool selection tasks on the final build. Codex used GPT-6 Luna and GPT-6 Sol with `model_reasoning_effort="high"`. The complete and selection batches ran concurrently, with four CLI jobs in each batch. Every task used a local Teletype API fixture. No live project token or customer data was used.

| Client and model | Complete, human review | Complete, automatic | First tool | Complete tokens including cache | Mean complete time | Complete API estimate | First-tool API estimate |
| --- | --: | --: | --: | --: | --: | --: | --: |
| Codex, `gpt-6-sol` (high) | **21/21** | 21/21 | **9/9** | 4,032,127 | 43.7 s | $1.8831 | $0.3840 |
| Codex, `gpt-6-luna` (high) | **21/21** | 20/21 | 8/9 | 3,346,902 | 30.3 s | $0.0785 | $0.0193 |
| Claude Code, `glm-5.3-flash` | 19/21 | 21/21 | **9/9** | 833,526 | 31.2 s | $0.0506 | $0.0159 |
| OpenCode, `opencode-go/deepseek-v4-flash` | 18/21 | 19/21 | 6/9 | 1,289,892 | 14.6 s | $0.0423 | $0.0137 |
| Antigravity CLI, `gemini-3.8-flash-medium` | 20/21 | 20/21 | **9/9** | 2,906,288 | 39.6 s | $0.8396 | $0.2335 |

The human result is the primary quality measure. I inspected all 105 first answers submitted to `eval_grade_case`, the terminal replies, tool arguments and results, and every later call. An answer failed for unsupported commitments, an inaccurate delivery claim, an unrequested data change, or a material error in the final reply. The automatic grader checks narrower conditions and produced both false passes and false failures.

The nine selection tasks check the first production MCP tool chosen. I also reviewed its arguments by hand. They do not check task completion. The selection fixture hides `eval_*` tools. The strict score treats preparatory searches as misses when the user has already supplied the needed ID. All 150 CLI runs exited successfully and used one compiled fixture snapshot (`94d7840232faa22969b0ef2f7d89fbdb0b611c9372fb695d5f63be51313414fe`). Each CLI ran in a fresh bubblewrap workspace with the repository and other runs hidden. The fixture was available through an MCP socket bridge.

## What the review found

- **Sol:** all 21 complete tasks and all nine first-tool choices passed.
- **Luna:** all 21 complete tasks passed. On one short draft task, it listed open conversations before reading the supplied dialog ID.
- **GLM:** one draft promised a delivery time update and rescheduling without evidence. When asked only to close a conversation as resolved, it also assigned a category the user had not requested.
- **DeepSeek:** the first confirmed-send reply omitted the queue versus delivery distinction, the final capabilities reply said 16 tools when 17 were available, and a phone-dialog preview claimed a possible owner assignment would definitely occur. It also made three wrong first-tool choices.
- **Gemini:** the first confirmed-send reply implied completion without saying delivery was unconfirmed. It corrected the wording after grading and did not resend. The isolated run prevented access to the case and grader source.

All five clients included `appeal_id` in the detailed inbox answer. No complete run repeated a confirmed write after grading. The remaining failures concern model choices and wording in this terminal setup. A successful automatic grade does not guarantee that a draft is grounded or that an unrequested change was avoided.

## API-equivalent cost

The estimates multiply CLI-reported uncached input, cached input, cache writes, and output tokens by published per-million-token rates. They are **not subscription charges or verified API bills**. Output includes reasoning tokens where the client reports them. CLI token accounting and installed skills differ between clients, so these totals compare the actual terminal setups rather than model-only efficiency. Claude Code's own reported dollar total is retained in the CSV but is not used for the API estimate.

| Model | Input | Cached input | Output | Source |
| --- | --: | --: | --: | --- |
| GPT-6 Luna | $0.10 | $0.01 | $0.50 | [OpenAI](https://developers.openai.com/api/docs/models/gpt-6-luna) |
| GPT-6 Sol | $2.00 | $0.20 | $10.00 | [OpenAI](https://developers.openai.com/api/docs/models/gpt-6-sol) |
| GLM-5.3-Flash | $0.15 | $0.03 | $0.50 | [Z.AI](https://docs.z.ai/guides/overview/pricing) |
| DeepSeek V4 Flash, off-peak | $0.15 | $0.003 | $0.60 | [OpenCode Go](https://dev.opencode.ai/docs/go/) |
| Gemini 3.8 Flash, through 2026 | $0.75 | $0.075 | $3.75 | [Google](https://ai.google.dev/gemini-api/docs/pricing) |

OpenAI cache writes use $0.125 per million for Luna and $2.50 for Sol. OpenCode's DeepSeek rates double during its published UTC peak windows. These runs were off-peak. The Gemini rates shown apply through 31 December 2026. Each run is priced separately from its reported token categories.

Per-case records: [complete tasks](../eval-results/terminal-agents-current.csv), [first-tool selection](../eval-results/tool-selection-terminal-agents-current.csv), and [human review notes](../eval-results/terminal-review.json). Raw CLI transcripts stay local. The current runner requires Linux bubblewrap and can regenerate a new snapshot with:

```sh
npm run build
node scripts/run-terminal-eval.mjs --concurrency 4 --force &
complete_pid=$!
node scripts/run-terminal-eval.mjs --selection --concurrency 4 --force &
selection_pid=$!
wait "$complete_pid"
wait "$selection_pid"
node scripts/summarize-terminal-eval.mjs
```

These are one-run observations on synthetic data. They show concrete failure modes but do not estimate failure rates on real projects.
