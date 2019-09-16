#pragma once

#include "Runtime.h"

namespace babylon
{
    class RuntimeApple final : public Runtime
    {
    public:
        explicit RuntimeApple(void* nativeWindowPtr);
        explicit RuntimeApple(void* nativeWindowPtr, const std::string& rootUrl);
        RuntimeApple(const RuntimeApple&) = delete;
    };
}
