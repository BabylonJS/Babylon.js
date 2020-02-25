#include "XMLHttpRequest.h"
#include <Babylon/XMLHttpRequest.h>

#include <Babylon/NetworkUtils.h>

#include <Babylon/JsRuntime.h>

namespace Babylon
{
    namespace
    {
        constexpr auto JS_ROOT_URL_NAME = "RootUrl";
    }

    void InitializeXMLHttpRequest(JsRuntime& runtime, std::string rootUrl)
    {
        runtime.Dispatch([rootUrl = std::move(rootUrl)](Napi::Env env) {
            XMLHttpRequest::Initialize(env, rootUrl.data());
        });
    }

    void XMLHttpRequest::Initialize(Napi::Env env, const char* rootUrl)
    {
        Napi::HandleScope scope{env};

        auto jsNative = env.Global().Get(JsRuntime::JS_NATIVE_NAME).As<Napi::Object>();
        jsNative.Set(JS_ROOT_URL_NAME, Napi::String::New(env, rootUrl));

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

        env.Global().Set(JS_XML_HTTP_REQUEST_CONSTRUCTOR_NAME, func);
    }

    XMLHttpRequest::XMLHttpRequest(const Napi::CallbackInfo& info)
        : Napi::ObjectWrap<XMLHttpRequest>{info}
        , m_runtime{JsRuntime::GetFromJavaScript(info.Env())}
        , m_rootUrl{info.Env().Global().Get(JsRuntime::JS_NATIVE_NAME).ToObject().Get(JS_ROOT_URL_NAME).ToString()}
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
        m_url = GetAbsoluteUrl(info[1].As<Napi::String>().Utf8Value(), m_rootUrl);
        SetReadyState(ReadyState::Opened);
    }

    void XMLHttpRequest::Send(const Napi::CallbackInfo& info)
    {
        m_runtime.Dispatch(std::function<arcana::task<void, std::exception_ptr>(Napi::Env)>{
            [this](Napi::Env) {
                return SendAsync();
            }});
    }

    // TODO: Make this just be SendAsync() once the UWP file access bug is fixed.
    arcana::task<void, std::exception_ptr> XMLHttpRequest::SendAsyncImpl()
    {
        if (m_responseType.empty() || m_responseType == XMLHttpRequestTypes::ResponseType::Text)
        {
            return LoadTextAsync(m_url).then(arcana::inline_scheduler, arcana::cancellation::none(), [this](const std::string& data) {
                m_runtime.Dispatch([this, data = data](Napi::Env) {
                    // check UTF-8 BOM encoding
                    if (data.size() >= 3 && data[0] == '\xEF' && data[1] == '\xBB' && data[2] == '\xBF')
                    {
                        m_responseText = data.substr(3);
                    }
                    else
                    {
                        // UTF8 encoding
                        m_responseText = std::move(data);
                    }

                    m_status = HTTPStatusCode::Ok;
                    SetReadyState(ReadyState::Done);
                });
            });
        }
        else if (m_responseType == XMLHttpRequestTypes::ResponseType::ArrayBuffer)
        {
            return LoadBinaryAsync(m_url).then(arcana::inline_scheduler, arcana::cancellation::none(), [this](const std::vector<uint8_t>& data) {
                m_runtime.Dispatch([this, data = data](Napi::Env) {
                    m_response = Napi::Persistent(Napi::ArrayBuffer::New(Env(), data.size()));
                    memcpy(m_response.Value().Data(), data.data(), data.size());
                    m_status = HTTPStatusCode::Ok;
                    SetReadyState(ReadyState::Done);
                });
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