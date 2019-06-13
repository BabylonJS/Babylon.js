#pragma once

#include "Runtime.h"

#include <Windows.h>

#include <array>
#include <memory>
#include <string>

namespace babylon
{
    class RuntimeWin32 final : public Runtime
    {
    public:
        using DefaultInitializationScriptsArray = const std::array<std::string, 2>;
        static DefaultInitializationScriptsArray DEFAULT_INITIALIZATION_SCRIPTS;

        explicit RuntimeWin32(HWND hWnd, const std::string& rootUrl = {});
        RuntimeWin32(const RuntimeWin32&) = delete;
        ~RuntimeWin32();

    private:
        class Impl;
    };
}
