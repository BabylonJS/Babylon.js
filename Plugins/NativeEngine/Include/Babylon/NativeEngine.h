#pragma once

#include <napi/env.h>

namespace Babylon
{
    void InitializeGraphics(void* windowPtr, size_t width, size_t height);

    void InitializeNativeEngine(Napi::Env env);

    void ReinitializeNativeEngine(Napi::Env env, void* windowPtr, size_t width, size_t height);
}
