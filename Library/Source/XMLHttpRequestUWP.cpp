#include "XMLHttpRequest.h"

#include "Common.h"
#include "RuntimeImpl.h"

#include <robuffer.h>
#include <winrt/Windows.Storage.Streams.h>

// Included after the WinRT headers because they enable non-WinRT interfaces. If this were included before
// the WinRT headers, we'd have to explicitly include unknwn.h, or build would fail with C2338.
#include <arcana/threading/task_conversions.h>

namespace Babylon
{
    arcana::task<void, std::exception_ptr> XMLHttpRequest::SendAsync()
    {
        return SendAsyncImpl()
            .then(arcana::inline_scheduler, m_runtimeImpl.Cancellation(), [url = m_url, responseType = m_responseType, this](arcana::expected<void, std::exception_ptr> result)
        {
            if (result.has_error())
            {
                winrt::Windows::Foundation::Uri uri{ winrt::to_hstring(url) };

                std::wstring_view path{ uri.Path() };
                if (path[0] != L'/')
                {
                    throw std::runtime_error("Invalid file url");
                }

                std::wstring localPath{ path.substr(1) };
                std::replace(localPath.begin(), localPath.end(), '/', '\\');
                // TODO: decode escaped url characters

                // TODO: handle errors
                return arcana::create_task<std::exception_ptr>(winrt::Windows::Storage::StorageFile::GetFileFromPathAsync(localPath))
                    .then(arcana::inline_scheduler, m_runtimeImpl.Cancellation(), [responseType = std::move(responseType), this](const winrt::Windows::Storage::StorageFile& file)
                {
                    if (responseType.empty() || responseType == XMLHttpRequestTypes::ResponseType::Text)
                    {
                        return arcana::create_task<std::exception_ptr>(winrt::Windows::Storage::FileIO::ReadTextAsync(file))
                            .then(m_runtimeImpl.Dispatcher(), m_runtimeImpl.Cancellation(), [this](const winrt::hstring& text)
                        {
                            m_responseText = winrt::to_string(text);
                        });
                    }
                    else if (responseType == XMLHttpRequestTypes::ResponseType::ArrayBuffer)
                    {
                        return arcana::create_task<std::exception_ptr>(winrt::Windows::Storage::FileIO::ReadBufferAsync(file))
                            .then(m_runtimeImpl.Dispatcher(), m_runtimeImpl.Cancellation(), [this](const winrt::Windows::Storage::Streams::IBuffer& buffer)
                        {
                            std::byte* bytes;
                            auto bufferByteAccess = buffer.as<::Windows::Storage::Streams::IBufferByteAccess>();
                            winrt::check_hresult(bufferByteAccess->Buffer(reinterpret_cast<byte**>(&bytes)));

                            m_response = Napi::Persistent(Napi::ArrayBuffer::New(Env(), buffer.Length()));
                            memcpy(m_response.Value().Data(), bytes, buffer.Length());
                        });
                    }
                    else
                    {
                        throw std::logic_error("Unexpected response type.");
                    }
                }).then(m_runtimeImpl.Dispatcher(), m_runtimeImpl.Cancellation(), [this, url = std::move(url)]
                {
                    m_responseURL = url;
                    m_status = HTTPStatusCode::Ok;

                    SetReadyState(ReadyState::Done);
                });
            }
            else
            {
                return arcana::task_from_result<std::exception_ptr>();
            }
        });
    }
}
