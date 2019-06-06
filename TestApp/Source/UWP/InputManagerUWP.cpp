#include "InputManagerUWP.h"

InputManagerUWP::InputManagerUWP(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<InputManagerUWP>{ info }
    , m_buffer{ static_cast<InputManagerUWP::InputBuffer*>(info.Data()) }
{}

Napi::Value InputManagerUWP::PointerX(const Napi::CallbackInfo& info)
{
    return Napi::Value::From(info.Env(), m_buffer->GetPointerX());
}

Napi::Value InputManagerUWP::PointerY(const Napi::CallbackInfo& info)
{
    return Napi::Value::From(info.Env(), m_buffer->GetPointerY());
}

Napi::Value InputManagerUWP::IsPointerDown(const Napi::CallbackInfo& info)
{
    return Napi::Value::From(info.Env(), m_buffer->IsPointerDown());
}
