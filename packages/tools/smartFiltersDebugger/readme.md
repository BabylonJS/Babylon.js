# Babylon.js Smart Filters

# PREVIEW WARNING

This package is currently in preview form. There are known issues which will be addressed before leaving preview.

## Known issues

1. Dragging from a connection point creates a new connection, but it should be in read only mode.

## Debugger Browser Extension

This browser extension is intended to aid in the development of web applications that make use of Smart Filters. It is not intended to be distributed in the extension store, but instead loaded locally to aid in the debugging of applications using Smart Filters. When installed as an extension, it adds a button in the browser which can launch a popup window showing a visual representation of the current Smart Filter. You can then modify the values of input blocks and see the results live (assuming the application is continuing to render new frames). The application must register the Smart Filter to view on the window object for this debugger to find it. See below for more details.

### Usage

1. Build: `npm install` then `npm run build -w @tools/smart-filters-debugger`
1. Install in Chrome or Edge
    - Go to Manage Extensions
    - Turn on Developer Mode
    - Click "Load Unpacked"
    - Browse to packages/tools/smartFiltersDebugger/dist
1. Update the web application you are debugging to set these globals:
    - window.currentSmartFilter to the current SmartFilter instance
    - window.thinEngine to the ThinEngine instance used when creating your SmartFilter
1. Browse to the web application you want to debug, and click the Smart Filter Debugger button in the Extensions menu (consider pinning it to make it easier to get to)
1. A popup will appear with the Editor in it
1. You can modify the values of input blocks and see the results in real time in your web application

#### Unsupported Cases

1. Changing input textures is not currently supported
1. Changes to the structure of the Smart Filter (e.g. changing connections, deleting blocks, adding blocks) is not currently supported

### Dev Inner Loop

To work on the browser extension:

1. Run `npm run watch -w @tools/smart-filters-debugger` in the root of the repo
1. If you haven't done the installation steps above, do them now (only needs to be done once)
1. To make changes
    1. Make your change in the code, and confirm your incremental build is green in the terminal
    1. Reload your web application, click the Smart Filter Debugger extension button again, and you should see your changes
1. To debug, open the browser Dev Tools in the web application and you will be able to find the browser extension code in the Sources tab and debug it
