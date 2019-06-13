#include "XMLHttpRequest.h"

namespace babylon
{
    arcana::task<void, std::exception_ptr> XMLHttpRequest::SendAsync()
    {
        return SendAsyncImpl();
    }
}
