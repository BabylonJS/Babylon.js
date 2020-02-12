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
    RuntimeUWP::RuntimeUWP(ABI::Windows::UI::Core::ICoreWindow* window, float width, float height)
        : RuntimeUWP{window, {}, width, height}
    {
    }

    RuntimeUWP::RuntimeUWP(ABI::Windows::UI::Core::ICoreWindow* window, const std::string& rootUrl, float width, float height)
        : Runtime{std::make_unique<RuntimeImpl>(window, rootUrl)}
        , m_window{window}
    {
        NativeEngine::InitializeWindow(window, static_cast<uint32_t>(width), static_cast<uint32_t>(height));
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
        this->Dispatch([](Napi::Env env) {
            InitializeNativeXr(env);
        });

        RuntimeImpl::BaseThreadProcedure();
    }
}
