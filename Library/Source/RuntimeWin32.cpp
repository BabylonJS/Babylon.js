#include <Babylon/RuntimeWin32.h>
#include "RuntimeImpl.h"

#include "NativeXr.h"

#include <filesystem>

namespace babylon
{
    RuntimeWin32::RuntimeWin32(HWND hWnd)
        : RuntimeWin32{ hWnd, GetUrlFromPath(GetModulePath().parent_path()) }
    {
    }

    RuntimeWin32::RuntimeWin32(HWND hWnd, const std::string& rootUrl)
        : Runtime{ std::make_unique<RuntimeImpl>(hWnd, rootUrl) }
    {
        RECT rect;
        if (GetWindowRect(hWnd, &rect))
        {
            float width = static_cast<float>(rect.right - rect.left);
            float height = static_cast<float>(rect.bottom - rect.top);
            UpdateSize(width, height);
        }
    }

    void RuntimeImpl::ThreadProcedure()
    {
        HRESULT hr = CoInitializeEx(nullptr, COINIT_APARTMENTTHREADED);
        assert(SUCCEEDED(hr));
        auto coInitializeScopeGuard = gsl::finally([] { CoUninitialize(); });

        Execute([](RuntimeImpl& runtime)
        {
            InitializeNativeXr(runtime.Env());
        });

        RuntimeImpl::BaseThreadProcedure();
    }
}
