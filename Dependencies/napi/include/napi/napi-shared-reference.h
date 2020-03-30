#pragma once

#include <napi/napi.h>

namespace Napi
{
    template<typename T>
    class SharedReference
    {
    public:
        static SharedReference<T> New(const T& value)
        {
            napi_env env = value.Env();

            napi_ref ref;
            napi_status status = napi_create_reference(env, value, 1, &ref);
            NAPI_THROW_IF_FAILED(env, status, SharedReference<T>());

            return SharedReference<T>(env, ref);
        }

        SharedReference()
            : m_env(nullptr)
            , m_ref(nullptr)
        {
        }

        SharedReference(const SharedReference<T>& other)
            : m_env(other.m_env)
            , m_ref(other.m_ref)
        {
            Ref();
        }

        SharedReference(SharedReference<T>&& other)
            : m_env(other.m_env)
            , m_ref(other.m_ref)
        {
            other.m_env = nullptr;
            other.m_ref = nullptr;
        }

        ~SharedReference()
        {
            if (m_ref != nullptr)
            {
                Unref();
            }
        }

        SharedReference& operator=(const SharedReference<T>& other)
        {
            if (m_ref != nullptr)
            {
                Unref();
            }

            m_env = other.m_env;
            m_ref = other.m_ref;
            Ref();

            return *this;
        }

        SharedReference& operator=(SharedReference<T>&& other)
        {
            if (this != &other)
            {
                if (m_ref != nullptr)
                {
                    Unref();
                }

                m_env = other.m_env;
                m_ref = other.m_ref;
                other.m_env = nullptr;
                other.m_ref = nullptr;
            }

            return *this;
        }

        T Value() const
        {
            napi_value value;
            napi_status status = napi_get_reference_value(m_env, m_ref, &value);
            NAPI_THROW_IF_FAILED(m_env, status, T());
            return T(m_env, value);
        }

        Napi::Env Env() const
        {
            return Napi::Env(m_env);
        }

    protected:
        SharedReference(napi_env env, napi_ref ref)
            : m_env{env}
            , m_ref{ref}
        {
        }

        void Ref()
        {
            napi_status status = napi_reference_ref(m_env, m_ref, nullptr);
            NAPI_THROW_IF_FAILED_VOID(m_env, status);
        }

        void Unref()
        {
            napi_status status = napi_reference_unref(m_env, m_ref, nullptr);
            NAPI_THROW_IF_FAILED_VOID(m_env, status);
        }

        napi_env m_env;
        napi_ref m_ref;
    };

    template<typename T>
    Napi::SharedReference<T> Shared(T value)
    {
        return SharedReference<T>::New(value);
    }
}
