#pragma once

#include "Runtime.h"
#include <Windows.h>

namespace babylon
{
    class RuntimeWin32 final : public Runtime
    {
    public:
        explicit RuntimeWin32(HWND hWnd, LogCallback);
        explicit RuntimeWin32(HWND hWnd, const std::string& rootUrl, LogCallback);
        RuntimeWin32(const RuntimeWin32&) = delete;
    };
}
