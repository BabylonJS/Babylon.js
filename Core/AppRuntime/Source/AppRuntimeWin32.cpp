#include "AppRuntime.h"

#include <Objbase.h>

#include <gsl/gsl>
#include <cassert>

namespace Babylon
{
    void AppRuntime::RunPlatformTier()
    {
        HRESULT hr = CoInitializeEx(nullptr, COINIT_APARTMENTTHREADED);
        assert(SUCCEEDED(hr));
        auto coInitScopeGuard = gsl::finally([] { CoUninitialize(); });

        RunEnvironmentTier();
    }
}
