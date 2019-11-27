#pragma once

#include "Runtime.h"

namespace Babylon
{
    class RuntimeApple final : public Runtime
    {
    public:
        explicit RuntimeApple(void* nativeWindowPtr, LogCallback callback);
        explicit RuntimeApple(void* nativeWindowPtr, const std::string& rootUrl, LogCallback callback);
        RuntimeApple(const RuntimeApple&) = delete;
    };
}
