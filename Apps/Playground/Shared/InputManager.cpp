#include "InputManager.h"

InputManager::InputManager(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<InputManager>{ info }
    , m_buffer{ static_cast<InputManager::InputBuffer*>(info.Data()) }
{}

Napi::Value InputManager::PointerX(const Napi::CallbackInfo& info)
{
    return Napi::Value::From(info.Env(), m_buffer->GetPointerX());
}

Napi::Value InputManager::PointerY(const Napi::CallbackInfo& info)
{
    return Napi::Value::From(info.Env(), m_buffer->GetPointerY());
}

Napi::Value InputManager::IsPointerDown(const Napi::CallbackInfo& info)
{
    return Napi::Value::From(info.Env(), m_buffer->IsPointerDown());
}
