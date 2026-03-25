# Manual testing workflows

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

Use the `.github\instructions\editor-interaction.instructions.md` instructions for interacting with SFE.

## Node Material Editor (NME)

To test NME, you need to build the dev packages, start the CDN server, and then start the Node Editor dev server. Here are the commands you need to run in order:

`npm run build:dev`
Wait for the build to complete successfully, then continue.
`npx build-tools -c dw -wd -wa -sc`
Wait for "watching for asset changes..." then continue.
`npm run serve -w @tools/babylon-server`
Wait for "compiled successfully" then continue.
`npm run serve -w @tools/node-editor`
Wait for "compiled successfully" then continue.

Launch the tool in the browser by navigating to the following URL using playwright-cli:
`http://localhost:1340`

Use the `.github\instructions\editor-interaction.instructions.md` instructions for interacting with NME.

## GUI Editor

To test the GUI Editor, you need to build the dev packages, start the CDN server, and then start the GUI Editor dev server. Here are the commands you need to run in order:

`npm run build:dev`
Wait for the build to complete successfully, then continue.
`npx build-tools -c dw -wd -wa -sc`
Wait for "watching for asset changes..." then continue.
`npm run serve -w @tools/babylon-server`
Wait for "compiled successfully" then continue.
`npm run serve -w @tools/gui-editor`
Wait for "compiled successfully" then continue.

Launch the tool in the browser by navigating to the following URL using playwright-cli:
`http://localhost:1341`

Use the `.github\instructions\editor-interaction.instructions.md` instructions for interacting with the GUI Editor.

## Node Geometry Editor (NGE)

To test NGE, you need to build the dev packages, start the CDN server, and then start the Node Geometry Editor dev server. Here are the commands you need to run in order:

`npm run build:dev`
Wait for the build to complete successfully, then continue.
`npx build-tools -c dw -wd -wa -sc`
Wait for "watching for asset changes..." then continue.
`npm run serve -w @tools/babylon-server`
Wait for "compiled successfully" then continue.
`npm run serve -w @tools/node-geometry-editor`
Wait for "compiled successfully" then continue.

Launch the tool in the browser by navigating to the following URL using playwright-cli:
`http://localhost:1343`

Use the `.github\instructions\editor-interaction.instructions.md` instructions for interacting with NGE.

## Node Render Graph Editor (NRGE)

To test NRGE, you need to build the dev packages, start the CDN server, and then start the Node Render Graph Editor dev server. Here are the commands you need to run in order:

`npm run build:dev`
Wait for the build to complete successfully, then continue.
`npx build-tools -c dw -wd -wa -sc`
Wait for "watching for asset changes..." then continue.
`npm run serve -w @tools/babylon-server`
Wait for "compiled successfully" then continue.
`npm run serve -w @tools/node-render-graph-editor`
Wait for "compiled successfully" then continue.

Launch the tool in the browser by navigating to the following URL using playwright-cli:
`http://localhost:1344`

Use the `.github\instructions\editor-interaction.instructions.md` instructions for interacting with NRGE.

## Node Particle Editor (NPE)

To test NPE, you need to build the dev packages, start the CDN server, and then start the Node Particle Editor dev server. Here are the commands you need to run in order:

`npm run build:dev`
Wait for the build to complete successfully, then continue.
`npx build-tools -c dw -wd -wa -sc`
Wait for "watching for asset changes..." then continue.
`npm run serve -w @tools/babylon-server`
Wait for "compiled successfully" then continue.
`npm run serve -w @tools/node-particle-editor`
Wait for "compiled successfully" then continue.

Launch the tool in the browser by navigating to the following URL using playwright-cli:
`http://localhost:1345`

Use the `.github\instructions\editor-interaction.instructions.md` instructions for interacting with NPE.