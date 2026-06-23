# @tools/mcp-server-core

Shared internal utilities for the Babylon.js MCP server packages.

This package is not a standalone MCP server. It provides the common infrastructure used by the server entrypoints under `packages/tools/*-mcp-server`.

## What It Contains

- text handoff helpers for inline JSON vs file-backed JSON inputs
- shared JSON parsing and input validation helpers
- common MCP text response builders
- shared JSON import/export/snippet response helpers
- shared tool schema fragments for repeated Zod fields
- shared Scene-specific schema groups and attachment validation

## Typical Usage

The server packages consume this package from their entrypoints to avoid repeating the same MCP boilerplate:

```ts
import { CreateJsonExportResponse, CreateJsonImportResponse, CreateOutputFileSchema, CreateJsonFileSchema } from "../../mcp-server-core/dist/index.js";
```

That keeps repeated handler logic centralized while preserving clear, package-local tool definitions.

## Build

```bash
npm run build -w @tools/mcp-server-core
```

## Tests

```bash
npx jest packages/tools/mcp-server-core/test/unit --runInBand
```

## Main Modules

- `textHandoff.ts`: inline-vs-file input resolution and file writing
- `jsonValidation.ts`: shared JSON parsing
- `inputValidation.ts`: shared argument presence and alias helpers
- `response.ts`: shared MCP text responses
- `jsonToolResponses.ts`: shared import/export/snippet response builders
- `toolSchemas.ts`: shared field-level Zod schema fragments
- `sceneToolSchemas.ts`: Scene-specific grouped field fragments
- `sceneAttachmentValidation.ts`: shared scene attachment contract validation

## Consumers

This package is currently consumed by the Babylon.js MCP server packages for Node Material, Flow Graph, GUI, Node Geometry, Node Render Graph, Node Particle, and Scene workflows.
