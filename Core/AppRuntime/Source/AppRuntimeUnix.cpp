#include "WorkQueue.h"
#include "AppRuntime.h"

namespace Babylon
{
    void AppRuntime::RunPlatformTier()
    {
        RunEnvironmentTier();
    }
}
