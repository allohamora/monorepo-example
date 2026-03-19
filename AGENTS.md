@README.md

## Instructions

- Install new dependencies by npm install commands; do NOT manually edit package.json or package-lock.json.
- Write comments only when necessary to clarify complex logic; prefer self-documenting code.
- Use `context7` mcp tools to get latest docs of the libraries before using them.
- Use `for...of` loops instead of `forEach` for better performance and readability.
- Avoid single-letter or one-word variable names; use descriptive names that clearly indicate purpose (e.g., `task` instead of `t`, `words` instead of `w`).
- In prose, keep normal sentence capitalization for lowercase tool, package, and workspace names: capitalize them at the start of a sentence (e.g., Npm, Client, Shared) and use lowercase elsewhere (e.g., npm, client, shared).
- Do NOT use the non-null assertion operator (`!`) in TypeScript; instead, use proper type guards, optional chaining, or refactor to handle null/undefined cases explicitly.
- After changes, update tests and docs when needed to keep behavior and documentation aligned.
