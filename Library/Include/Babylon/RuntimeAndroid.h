#pragma once

#include "Runtime.h"

class ANativeWindow;

namespace Babylon
{
    class RuntimeAndroid final : public Runtime
    {
    public:
        explicit RuntimeAndroid(ANativeWindow* nativeWindowPtr, float width, float height);
        explicit RuntimeAndroid(ANativeWindow* nativeWindowPtr, const std::string& rootUrl, float width, float height);
        RuntimeAndroid(const RuntimeAndroid&) = delete;

        void UpdateWindow(float width, float height, ANativeWindow* nativeWindowPtr);
    };
}
