# Manual testing workflows

## Reusing running processes

**Before starting any command, check whether it is already running** by checking the port or looking for an existing shell session. If the process is already running and healthy, skip that step. `npm run build:dev` only needs to run once per session.

For port numbers, check commands, and server startup steps, see [local-servers.md](local-servers.md).

## Dev Host

For devhost setup, validation workflow, and cleanup, see [devhost-testing.instructions.md](devhost-testing.instructions.md).

## Smart Filter Editor (SFE)

To test SFE, you need to run multiple commands to build the necessary assets and start the dev server. Here are the commands you need to run in separate terminal windows:

Start these next two in parallel:
`npm run watch:assets`
`npm run watch:assets:smart-filters`
Once they both report "Watching for" then continue.
`npm run watch:source:smart-filters`
Wait for "Watching for file changes." then continue.
`npm run serve -w @tools/smart-filters-editor`
Wait for "compiled successfully" then continue.

Launch the tool in the browser by navigating to the following URL using playwright-cli:
`http://localhost:1346`

Use the [editor-interaction.instructions.md](editor-interaction.instructions.md) instructions for interacting with SFE.

## CDN-based Editors (NME, GUI Editor, NGE, NRGE, NPE)

All CDN-based editors require the CDN server (1337) first, then their own server. See [local-servers.md](local-servers.md) for ports, workspaces, and startup steps.

Launch the editor at `http://localhost:<port>` after starting the required servers.

Use [editor-interaction.instructions.md](editor-interaction.instructions.md) for interacting with any of these editors.
