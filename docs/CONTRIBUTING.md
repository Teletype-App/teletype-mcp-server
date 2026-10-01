English | [Русский](ru/CONTRIBUTING.md)

# Contributing

Use Node.js 20.19+, 22.13+, or 24.x for local npm scripts and install dependencies with `npm ci`. Keep unrelated changes out of the same pull request. Add tests for observable behavior. Run `npm run check:fast` while developing. CI runs `npm run check`, including coverage and focused mutation checks.

Do not commit API tokens, customer data, or production logs. Tools that change data must require explicit confirmation and report partially completed operations.

When changing tool results, update `outputSchema` and `structuredContent` together. Run `npm run mcp:smoke` after changing the MCP server or either transport. It checks the 2025 and 2026-07-28 handshakes over HTTP and stdio with the SDK client. The same smoke command also checks the offline eval fixture. Keep the client setup examples in `examples/clients/` aligned with the CLI flags.

Add tool contract changes in `src/tool-catalog.ts`. For Public API response changes, keep additional fields allowed and validate only fields the tool consumes. Before a release, run `npm run package:smoke` on a supported Node.js version. Run `npm run mcp:conformance` on Node.js 24 because the external conformance CLI does not run on Node.js 20.

For text shown to MCP clients, add the same key to the English and Russian catalogs under `src/locales/`. Use `t(key, params)` in the handler. Keep parameter names and types aligned between catalogs. `npm run typecheck` checks the catalog shape. Client-facing strings contain no em dashes and no semicolons in either language, and a catalog-wide test in `src/i18n.test.ts` rejects them. Rerun `npm run check:fast` after text changes.

For `npm run eval:model`, `EVAL_SPLIT` selects `core`, `heldout` (cases never used for prompt tuning), or `all`.

## Releases

The GitHub release workflow accepts tags in the form `v<package.json version>`. It checks the tag against the package, `server.json`, and built CLI before publishing. Configure an [npm Trusted Publisher](https://docs.npmjs.com/trusted-publishers/) for the public GitHub repository and `release.yml` workflow to allow direct `npm publish`. The `NPM_TOKEN` repository secret remains available during migration. Docker and GitHub Release jobs run only after npm publishing succeeds.

Before the first public tag:

1. Make `https://github.com/Teletype-App/teletype-mcp-server` publicly accessible and confirm that the repository URL in `package.json` and `server.json` is correct.
2. Deploy `https://mcp.teletype.app/mcp` with HTTPS. Run `TELETYPE_API_TOKEN=... npm run hosted:smoke` with a project token to verify the MCP handshake and a read through the Teletype Public API. The command prints no project data or token.
3. Confirm that the npm name `teletype-mcp-server` is available and configure its Trusted Publisher. Keep the `mcpName` in `package.json` equal to the name in `server.json`.
4. Update both package and registry versions together. Run `npm run check`, `npm run package:smoke`, `npm run mcp:conformance`, `npm run bundle:mcpb`, and `GITHUB_REF_NAME=v<version> npm run release:verify`. Validate `server.json` with the official `mcp-publisher validate` command.

After the release workflow publishes npm, Docker, and the `.mcpb` asset, check their public URLs. Then authenticate with the [MCP Registry publisher](https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/quickstart.mdx) and run `mcp-publisher publish server.json`. The registry requires the npm version and remote URL in the manifest to be live. Registry publication is a separate, deliberate step.
