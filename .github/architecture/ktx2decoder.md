# KTX2 Decoder (`@babylonjs/ktx2decoder`)

The KTX2 Decoder package provides texture transcoding support for KTX2 compressed texture files.

**Implementation:** `packages/tools/ktx2Decoder`

## Architecture Overview

The package decodes KTX2 container files and transcodes their compressed texture data into GPU-ready formats. It supports multiple transcoder backends and runs in a web worker for non-blocking texture decompression.

## Major Subsystems

### Transcoders (`src/Transcoders/`)
Format-specific transcoding implementations. Each transcoder handles conversion from a source compression format (e.g., Basis Universal, UASTC) to a GPU-native format supported by the current rendering backend (BC, ETC, ASTC, etc.).

### Misc (`src/Misc/`)
Shared utilities and helpers for the decoding pipeline.

### Legacy (`src/legacy/`)
Backward-compatibility code for older API integration patterns.
