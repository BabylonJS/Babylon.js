#pragma once

#include <napi/env.h>

namespace Babylon::Plugins::NativeEngine
{
    void InitializeGraphics(void* windowPtr, size_t width, size_t height);

    void Initialize(Napi::Env env);

    void Reinitialize(Napi::Env env, void* windowPtr, size_t width, size_t height);

    void DeinitializeGraphics();
}
