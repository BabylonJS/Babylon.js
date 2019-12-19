#include "Babylon/Runtime.h"
#include "Babylon/RuntimeUWP.h"
#include "RuntimeImpl.h"
#include "NativeEngine.h"
#include "NativeXr.h"

#include <winrt/Windows.Graphics.Display.h>

using namespace winrt;
using namespace Windows::Graphics::Display;

namespace Babylon
{
    RuntimeUWP::RuntimeUWP(ABI::Windows::UI::Core::ICoreWindow* window)
        : RuntimeUWP{window, {}}
    {
    }

    RuntimeUWP::RuntimeUWP(ABI::Windows::UI::Core::ICoreWindow* window, const std::string& rootUrl)
        : Runtime{std::make_unique<RuntimeImpl>(window, rootUrl)}
        , m_window{window}
    {
        ABI::Windows::Foundation::Rect bounds;
        HRESULT result = window->get_Bounds(&bounds);
        auto displayInformation = DisplayInformation::GetForCurrentView();
        float displayScale = static_cast<float>(displayInformation.RawPixelsPerViewPixel());
        NativeEngine::InitializeWindow(window, static_cast<uint32_t>(bounds.Width * displayScale), static_cast<uint32_t>(bounds.Height * displayScale));
        m_window->AddRef();
    }

    RuntimeUWP::~RuntimeUWP()
    {
        m_window->Release();
    }

    /*RuntimeUWP::RuntimeUWP(ABI::Windows::UI::Xaml::Controls::ISwapChainPanel* panel, const std::string& rootUrl)
        : Runtime{ std::make_unique<RuntimeImpl>(from_abi<winrt::Windows::UI::Xaml::Controls::SwapChainPanel>(panel), rootUrl) }
    {}*/

    void RuntimeImpl::ThreadProcedure()
    {
        this->Dispatch([](Env& env) {
            InitializeNativeXr(env);
        });

        RuntimeImpl::BaseThreadProcedure();
    }
}
