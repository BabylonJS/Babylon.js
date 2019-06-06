#pragma once

#include "Runtime.h"

#include <windows.ui.core.h>
#include <windows.ui.xaml.controls.h>

#include <memory>

namespace babylon
{
    class RuntimeUWP final : public Runtime
    {
    public:
        using DefaultInitializationScriptsArray = const std::array<std::string, 2>;
        static DefaultInitializationScriptsArray DEFAULT_INITIALIZATION_SCRIPTS;

        explicit RuntimeUWP(ABI::Windows::UI::Core::ICoreWindow* window, const std::string& rootUrl = {});
        explicit RuntimeUWP(ABI::Windows::UI::Xaml::Controls::ISwapChainPanel* panel, const std::string& rootUrl = {});
        RuntimeUWP(const Runtime&) = delete;
        ~RuntimeUWP() = default;

    private:
        class Impl;
    };
}
