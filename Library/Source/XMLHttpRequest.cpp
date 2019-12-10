#include "XMLHttpRequest.h"
#include "RuntimeImpl.h"
#include <curl/curl.h>

namespace Babylon
{
    Napi::FunctionReference XMLHttpRequest::CreateConstructor(Napi::Env& env)
    {
        Napi::HandleScope scope{env};

        Napi::Function func = DefineClass(
            env,
            "XMLHttpRequest",
            {
                StaticValue("UNSENT", Napi::Value::From(env, 0)),
                StaticValue("OPENED", Napi::Value::From(env, 1)),
                StaticValue("HEADERS_RECEIVED", Napi::Value::From(env, 2)),
                StaticValue("LOADING", Napi::Value::From(env, 3)),
                StaticValue("DONE", Napi::Value::From(env, 4)),
                InstanceAccessor("readyState", &XMLHttpRequest::GetReadyState, nullptr),
                InstanceAccessor("response", &XMLHttpRequest::GetResponse, nullptr),
                InstanceAccessor("responseText", &XMLHttpRequest::GetResponseText, nullptr),
                InstanceAccessor("responseType", &XMLHttpRequest::GetResponseType, &XMLHttpRequest::SetResponseType),
                InstanceAccessor("responseURL", &XMLHttpRequest::GetResponseURL, nullptr),
                InstanceAccessor("status", &XMLHttpRequest::GetStatus, nullptr),
                InstanceMethod("addEventListener", &XMLHttpRequest::AddEventListener),
                InstanceMethod("removeEventListener", &XMLHttpRequest::RemoveEventListener),
                InstanceMethod("open", &XMLHttpRequest::Open),
                InstanceMethod("send", &XMLHttpRequest::Send),
            });

        return Napi::Persistent(func);
    }

    XMLHttpRequest::XMLHttpRequest(const Napi::CallbackInfo& info)
        : Napi::ObjectWrap<XMLHttpRequest>{info}
        , m_runtimeImpl{RuntimeImpl::GetRuntimeImplFromJavaScript(info.Env())}
    {
    }

    Napi::Value XMLHttpRequest::GetReadyState(const Napi::CallbackInfo&)
    {
        return Napi::Value::From(Env(), arcana::underlying_cast(m_readyState));
    }

    Napi::Value XMLHttpRequest::GetResponse(const Napi::CallbackInfo&)
    {
        return m_response.Value();
    }

    Napi::Value XMLHttpRequest::GetResponseText(const Napi::CallbackInfo&)
    {
        return Napi::Value::From(Env(), m_responseText);
    }

    Napi::Value XMLHttpRequest::GetResponseType(const Napi::CallbackInfo&)
    {
        return Napi::Value::From(Env(), m_responseType);
    }

    void XMLHttpRequest::SetResponseType(const Napi::CallbackInfo&, const Napi::Value& value)
    {
        m_responseType = value.As<Napi::String>().Utf8Value();
    }

    Napi::Value XMLHttpRequest::GetResponseURL(const Napi::CallbackInfo&)
    {
        return Napi::Value::From(Env(), m_responseURL);
    }

    Napi::Value XMLHttpRequest::GetStatus(const Napi::CallbackInfo&)
    {
        return Napi::Value::From(Env(), arcana::underlying_cast(m_status));
    }

    void XMLHttpRequest::AddEventListener(const Napi::CallbackInfo& info)
    {
        std::string eventType = info[0].As<Napi::String>().Utf8Value();
        Napi::Function eventHandler = info[1].As<Napi::Function>();

        const auto& eventHandlerRefs = m_eventHandlerRefs[eventType];
        for (auto it = eventHandlerRefs.begin(); it != eventHandlerRefs.end(); ++it)
        {
            if (it->Value() == eventHandler)
            {
                throw Napi::Error::New(info.Env(), "Cannot add the same event handler twice");
            }
        }

        m_eventHandlerRefs[eventType].push_back(Napi::Persistent(eventHandler));
    }

    void XMLHttpRequest::RemoveEventListener(const Napi::CallbackInfo& info)
    {
        std::string eventType = info[0].As<Napi::String>().Utf8Value();
        Napi::Function eventHandler = info[1].As<Napi::Function>();
        auto itType = m_eventHandlerRefs.find(eventType);
        if (itType != m_eventHandlerRefs.end())
        {
            auto& eventHandlerRefs = itType->second;
            for (auto it = eventHandlerRefs.begin(); it != eventHandlerRefs.end(); ++it)
            {
                if (it->Value() == eventHandler)
                {
                    eventHandlerRefs.erase(it);
                    break;
                }
            }
        }
    }

    void XMLHttpRequest::Open(const Napi::CallbackInfo& info)
    {
        m_method = info[0].As<Napi::String>().Utf8Value();
        m_url = m_runtimeImpl.GetAbsoluteUrl(info[1].As<Napi::String>().Utf8Value());
        SetReadyState(ReadyState::Opened);
    }

    void XMLHttpRequest::Send(const Napi::CallbackInfo& info)
    {
        auto lock = m_runtimeImpl.AcquireTaskLock();

        m_runtimeImpl.Task = m_runtimeImpl.Task.then(arcana::inline_scheduler, arcana::cancellation::none(), [this] {
            return SendAsync();
        });
    }

    // TODO: Make this just be SendAsync() once the UWP file access bug is fixed.
    arcana::task<void, std::exception_ptr> XMLHttpRequest::SendAsyncImpl()
    {
        if (m_responseType.empty() || m_responseType == XMLHttpRequestTypes::ResponseType::Text)
        {
            return m_runtimeImpl.LoadUrlAsync<std::string>(m_url).then(arcana::inline_scheduler, m_runtimeImpl.Cancellation(), [this](const std::string& data) {
                m_responseText = std::move(data);
                m_status = HTTPStatusCode::Ok;
                SetReadyState(ReadyState::Done);
            });
        }
        else if (m_responseType == XMLHttpRequestTypes::ResponseType::ArrayBuffer)
        {
            return m_runtimeImpl.LoadUrlAsync<std::vector<char>>(m_url).then(arcana::inline_scheduler, m_runtimeImpl.Cancellation(), [this](const std::vector<char>& data) {
                m_response = Napi::Persistent(Napi::ArrayBuffer::New(Env(), data.size()));
                memcpy(m_response.Value().Data(), data.data(), data.size());
                m_status = HTTPStatusCode::Ok;
                SetReadyState(ReadyState::Done);
            });
        }
        else
        {
            throw std::exception();
        }
    }

    void XMLHttpRequest::SetReadyState(ReadyState readyState)
    {
        m_readyState = readyState;

        auto it = m_eventHandlerRefs.find(XMLHttpRequestTypes::EventType::ReadyStateChange);
        if (it != m_eventHandlerRefs.end())
        {
            const auto& eventHandlerRefs = it->second;
            for (const auto& eventHandlerRef : eventHandlerRefs)
            {
                eventHandlerRef.Call({});
            }
        }
    }

}