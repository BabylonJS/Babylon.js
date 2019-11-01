#pragma once

#include "Runtime.h"

class ANativeWindow;

namespace babylon
{
    class RuntimeAndroid final : public Runtime
    {
    public:
        explicit RuntimeAndroid(ANativeWindow* nativeWindowPtr, LogCallback callback);
        explicit RuntimeAndroid(ANativeWindow* nativeWindowPtr, const std::string& rootUrl, LogCallback callback);
        RuntimeAndroid(const RuntimeAndroid&) = delete;
    };
}
