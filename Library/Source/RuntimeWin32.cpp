#include <Babylon/RuntimeWin32.h>
#include "RuntimeImpl.h"
#include "NativeEngine.h"
#include "NativeXr.h"

#include <filesystem>

namespace Babylon
{
    RuntimeWin32::RuntimeWin32(HWND hWnd, float width, float height)
        : RuntimeWin32{hWnd, GetUrlFromPath(GetModulePath().parent_path()), width, height}
    {
    }

    RuntimeWin32::RuntimeWin32(HWND hWnd, const std::string& rootUrl, float width, float height)
        : Runtime{std::make_unique<RuntimeImpl>(hWnd, rootUrl)}
    {
        NativeEngine::InitializeWindow(hWnd, static_cast<uint32_t>(width), static_cast<uint32_t>(height));
    }

    void RuntimeImpl::ThreadProcedure()
    {
        HRESULT hr = CoInitializeEx(nullptr, COINIT_APARTMENTTHREADED);
        assert(SUCCEEDED(hr));
        auto coInitializeScopeGuard = gsl::finally([] { CoUninitialize(); });

        Dispatch([](Env& env) {
            InitializeNativeXr(env);
        });

        RuntimeImpl::BaseThreadProcedure();
    }
}
