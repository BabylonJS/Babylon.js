# Khronos 3D Commerce Viewer Certification

This page will run through all of the tests required for [3D Commerce Viewer Certification Program](https://www.khronos.org/3dcommerce/certification) and create a download for a zip with the results for submission.

## Setup
1. Download the [certification models](https://github.com/KhronosGroup/3DC-Certification/tree/main/models) and place them in a subfolder under this folder called `models`.
1. Launch the certification from vscode using the `Launch 3D Commerce Viewer Certification (Chrome)`.
1. Wait a few minutes for the page to render all the models and capture screenshots.  
_NOTE: The browser freezes a lot while loading these models. Please be patient._
1. Once the process completes, the page will generate a `certification.zip` for download with the results.

_NOTE: The page will use the local dist version of the sandbox (i.e. http://localhost:1338/sandbox/public/index-local.html?dist=true). Using the dev loader (i.e. without the `dist=true`) to load the sandbox makes this process much slower._