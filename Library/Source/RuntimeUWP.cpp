#include "Babylon/Runtime.h"
#include "Babylon/RuntimeUWP.h"
#include "RuntimeImpl.h"

namespace babylon
{
    RuntimeUWP::RuntimeUWP(ABI::Windows::UI::Core::ICoreWindow* window, const std::string& rootUrl)
        : Runtime { std::make_unique<RuntimeImpl>(window, rootUrl) }
        , m_window{ window }
    {
        m_window->AddRef();
    }

    RuntimeUWP::~RuntimeUWP()
    {
        m_window->Release();
    }

    /*RuntimeUWP::RuntimeUWP(ABI::Windows::UI::Xaml::Controls::ISwapChainPanel* panel, const std::string& rootUrl)
        : Runtime{ std::make_unique<RuntimeImpl>(from_abi<winrt::Windows::UI::Xaml::Controls::SwapChainPanel>(panel), rootUrl) }
    {
    }*/

    void RuntimeImpl::ThreadProcedure()
    {
        RuntimeImpl::BaseThreadProcedure();
    }
}
