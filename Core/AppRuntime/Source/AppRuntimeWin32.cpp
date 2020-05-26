#include "AppRuntime.h"

#include <Objbase.h>

#include <gsl/gsl>
#include <cassert>

namespace Babylon
{
    namespace
    {
        constexpr size_t FILENAME_BUFFER_SIZE = 1024;
    }

    void AppRuntime::RunPlatformTier()
    {
        HRESULT hr = CoInitializeEx(nullptr, COINIT_APARTMENTTHREADED);
        assert(SUCCEEDED(hr));
        auto coInitScopeGuard = gsl::finally([] { CoUninitialize(); });

        char filename[FILENAME_BUFFER_SIZE];
        DWORD result = GetModuleFileNameA(nullptr, filename, std::size(filename));
        assert(result != 0);
        RunEnvironmentTier(filename);
    }
}
