#pragma once

#include "Runtime.h"
#include <Windows.h>

namespace Babylon
{
    class RuntimeWin32 final : public Runtime
    {
    public:
        explicit RuntimeWin32(HWND hWnd, float width, float height);
        explicit RuntimeWin32(HWND hWnd, const std::string& rootUrl, float width, float height);
        RuntimeWin32(const RuntimeWin32&) = delete;
    };
}
