#pragma once

#include "Runtime.h"

class ANativeWindow;

namespace Babylon
{
    class RuntimeAndroid final : public Runtime
    {
    public:
        explicit RuntimeAndroid(ANativeWindow* nativeWindowPtr);
        explicit RuntimeAndroid(ANativeWindow* nativeWindowPtr, const std::string& rootUrl);
        RuntimeAndroid(const RuntimeAndroid&) = delete;
    };
}
