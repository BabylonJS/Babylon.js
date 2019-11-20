#pragma once

#include <windows.ui.core.h>
#include <windows.ui.xaml.controls.h>

namespace Babylon
{
    class Runtime;

    class RuntimeUWP final : public Runtime
    {
    public:
        explicit RuntimeUWP(ABI::Windows::UI::Core::ICoreWindow* window, LogCallback callback);
        explicit RuntimeUWP(ABI::Windows::UI::Core::ICoreWindow* window, const std::string& rootUrl, LogCallback callback);

        // TODO: Allow creation from swap chain, which is required by XAML apps.
        // explicit RuntimeUWP(ABI::Windows::UI::Xaml::Controls::ISwapChainPanel* panel, const std::string& rootUrl = {});
        
        RuntimeUWP(const Runtime&) = delete;
        ~RuntimeUWP();

    private:
        ABI::Windows::UI::Core::ICoreWindow* m_window{};
    };
}
