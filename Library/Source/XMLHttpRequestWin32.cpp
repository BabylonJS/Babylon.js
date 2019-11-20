#include "XMLHttpRequest.h"

namespace Babylon
{
    arcana::task<void, std::exception_ptr> XMLHttpRequest::SendAsync()
    {
        return SendAsyncImpl();
    }
}
