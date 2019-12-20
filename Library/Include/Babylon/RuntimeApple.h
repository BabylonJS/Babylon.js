#pragma once

#include "Runtime.h"

namespace Babylon
{
    class RuntimeApple final : public Runtime
    {
    public:
        explicit RuntimeApple(void* nativeWindowPtr, float width, float height);
        explicit RuntimeApple(void* nativeWindowPtr, const std::string& rootUrl, float width, float height);
        RuntimeApple(const RuntimeApple&) = delete;
    };
}
