#include <Babylon/RuntimeWin32.h>
#include "RuntimeImpl.h"
#include "NativeEngine.h"
#include "NativeXr.h"

#include <filesystem>

namespace Babylon
{
    RuntimeWin32::RuntimeWin32(HWND hWnd)
        : RuntimeWin32{hWnd, GetUrlFromPath(GetModulePath().parent_path())}
    {
    }

    RuntimeWin32::RuntimeWin32(HWND hWnd, const std::string& rootUrl)
        : Runtime{std::make_unique<RuntimeImpl>(hWnd, rootUrl)}
    {
        RECT rect;
        if (GetWindowRect(hWnd, &rect))
        {
            auto width = rect.right - rect.left;
            auto height = rect.bottom - rect.top;
            NativeEngine::InitializeWindow(hWnd, width, height);
        }
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
