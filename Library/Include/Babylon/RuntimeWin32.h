#pragma once

#include "Runtime.h"
#include <Windows.h>

namespace babylon
{
    class RuntimeWin32 final : public Runtime
    {
    public:
        explicit RuntimeWin32(HWND hWnd);
        explicit RuntimeWin32(HWND hWnd, const std::string& rootUrl);
        RuntimeWin32(const RuntimeWin32&) = delete;
    };
}
