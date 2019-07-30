#include <Babylon/RuntimeAndroid.h>
#include "RuntimeImpl.h"
//#include <filesystem>

namespace babylon
{

    RuntimeAndroid::RuntimeAndroid(void* nativeWindowPtr)
        : RuntimeAndroid{nativeWindowPtr, GetUrlFromPath("."/*GetModulePath().parent_path()*/) } // todo : GetModulePath().parent_path() std::fs experimental not available with ndk
    {
    }

    RuntimeAndroid::RuntimeAndroid(void* nativeWindowPtr, const std::string& rootUrl)
        : Runtime{ std::make_unique<RuntimeImpl>(nativeWindowPtr, rootUrl) }
    {
        /*RECT rect;
        if (GetWindowRect(hWnd, &rect))
        {
            float width = static_cast<float>(rect.right - rect.left);
            float height = static_cast<float>(rect.bottom - rect.top);
            UpdateSize(width, height);
        }
        */
    }

    void RuntimeImpl::ThreadProcedure()
    {
        /*HRESULT hr = CoInitializeEx(nullptr, COINIT_APARTMENTTHREADED);
        assert(SUCCEEDED(hr));
        auto coInitializeScopeGuard = gsl::finally([] { CoUninitialize(); });

        RuntimeImpl::BaseThreadProcedure();*/
    }

}