#pragma once

#include "Runtime.h"

namespace babylon
{
    class RuntimeAndroid final : public Runtime
    {
    public:
        explicit RuntimeAndroid(void* nativeWindowPtr);
        explicit RuntimeAndroid(void* nativeWindowPtr, const std::string& rootUrl);
        RuntimeAndroid(const RuntimeAndroid&) = delete;
    };
}
