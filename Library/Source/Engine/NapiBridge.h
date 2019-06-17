#pragma once

#include <napi/napi.h>

#include <string>
#include <vector>

namespace babylon
{
    template<typename ImplT>
    struct NapiBridge final : public Napi::ObjectWrap<NapiBridge<ImplT>>
    {
        class Definition
        {
            friend NapiBridge<ImplT>;

        public:
            Definition(const Definition&) = delete;
            Definition& operator=(const Definition&) = delete;

            template<void(ImplT::*method)(const Napi::CallbackInfo& info)>
            Definition& AddVoidReturningMethod(const std::string& name)
            {
                m_propertyDescriptors.push_back(InstanceMethod(name.c_str(), &NapiBridge<ImplT>::InstanceMethodImpl<method>, napi_default, m_impl));
                return *this;
            }

            template<Napi::Value(ImplT::*method)(const Napi::CallbackInfo& info)>
            Definition& AddValueReturningMethod(const std::string& name)
            {
                m_propertyDescriptors.push_back(InstanceMethod(name.c_str(), &NapiBridge<ImplT>::InstanceMethodImpl<method>, napi_default, m_impl));
                return *this;
            }

            Napi::Function Finalize()
            {
                return DefineClass(m_env, m_name.c_str(), m_propertyDescriptors, m_impl);
            }

        private:
            Definition(const std::string& name, Napi::Env& env, ImplT* impl)
                : m_name{ name }
                , m_env{ env }
                , m_impl{ impl }
            {}

            const std::string m_name{};
            Napi::Env& m_env{};
            ImplT* m_impl{};
            std::vector<Napi::ClassPropertyDescriptor<NapiBridge<ImplT>>> m_propertyDescriptors{};
        };

        static Definition Define(const std::string& name, Napi::Env& env, ImplT* impl)
        {
            return{ name, env, impl };
        }

        explicit NapiBridge(const Napi::CallbackInfo& info)
            : Napi::ObjectWrap<NapiBridge<ImplT>>{ info }
        {}

        template<void (ImplT::*method)(const Napi::CallbackInfo& info)>
        inline void InstanceMethodImpl(const Napi::CallbackInfo& info)
        {
            auto impl = reinterpret_cast<ImplT*>(info.Data());
            (impl->*method)(info);
        }

        template<Napi::Value(ImplT::*method)(const Napi::CallbackInfo& info)>
        inline Napi::Value InstanceMethodImpl(const Napi::CallbackInfo& info)
        {
            auto impl = reinterpret_cast<ImplT*>(info.Data());
            return (impl->*method)(info);
        }
    };

    template<typename NativeEngineT>
    struct NativeEngineDefiner
    {
        static void Define(Napi::Env& env, NativeEngineT* impl)
        {
            Napi::HandleScope scope{ env };
            auto func = NapiBridge<NativeEngineT>::Define("NativeEngine", env, impl)
                .AddVoidReturningMethod<&NativeEngineT::RequestAnimationFrame>("requestAnimationFrame")
                .AddValueReturningMethod<&NativeEngineT::CreateVertexArray>("createVertexArray")
                .AddVoidReturningMethod<&NativeEngineT::DeleteVertexArray>("deleteVertexArray")
                .AddVoidReturningMethod<&NativeEngineT::BindVertexArray>("bindVertexArray")
                .AddValueReturningMethod<&NativeEngineT::CreateIndexBuffer>("createIndexBuffer")
                .AddVoidReturningMethod<&NativeEngineT::DeleteIndexBuffer>("deleteIndexBuffer")
                .AddVoidReturningMethod<&NativeEngineT::RecordIndexBuffer>("recordIndexBuffer")
                .AddValueReturningMethod<&NativeEngineT::CreateVertexBuffer>("createVertexBuffer")
                .AddVoidReturningMethod<&NativeEngineT::DeleteVertexBuffer>("deleteVertexBuffer")
                .AddVoidReturningMethod<&NativeEngineT::RecordVertexBuffer>("recordVertexBuffer")
                .AddValueReturningMethod<&NativeEngineT::CreateProgram>("createProgram")
                .AddValueReturningMethod<&NativeEngineT::GetUniforms>("getUniforms")
                .AddValueReturningMethod<&NativeEngineT::GetAttributes>("getAttributes")
                .AddVoidReturningMethod<&NativeEngineT::SetProgram>("setProgram")
                .AddVoidReturningMethod<&NativeEngineT::SetState>("setState")
                .AddVoidReturningMethod<&NativeEngineT::SetZOffset>("setZOffset")
                .AddValueReturningMethod<&NativeEngineT::GetZOffset>("getZOffset")
                .AddVoidReturningMethod<&NativeEngineT::SetDepthTest>("setDepthTest")
                .AddValueReturningMethod<&NativeEngineT::GetDepthWrite>("getDepthWrite")
                .AddVoidReturningMethod<&NativeEngineT::SetDepthWrite>("setDepthWrite")
                .AddVoidReturningMethod<&NativeEngineT::SetColorWrite>("setColorWrite")
                .AddVoidReturningMethod<&NativeEngineT::SetBlendMode>("setBlendMode")
                .AddVoidReturningMethod<&NativeEngineT::SetMatrix>("setMatrix")
                .AddVoidReturningMethod<&NativeEngineT::SetIntArray>("setIntArray")
                .AddVoidReturningMethod<&NativeEngineT::SetIntArray2>("setIntArray2")
                .AddVoidReturningMethod<&NativeEngineT::SetIntArray3>("setIntArray3")
                .AddVoidReturningMethod<&NativeEngineT::SetIntArray4>("setIntArray4")
                .AddVoidReturningMethod<&NativeEngineT::SetFloatArray>("setFloatArray")
                .AddVoidReturningMethod<&NativeEngineT::SetFloatArray2>("setFloatArray2")
                .AddVoidReturningMethod<&NativeEngineT::SetFloatArray3>("setFloatArray3")
                .AddVoidReturningMethod<&NativeEngineT::SetFloatArray4>("setFloatArray4")
                .AddVoidReturningMethod<&NativeEngineT::SetMatrices>("setMatrices")
                .AddVoidReturningMethod<&NativeEngineT::SetMatrix3x3>("setMatrix3x3")
                .AddVoidReturningMethod<&NativeEngineT::SetMatrix2x2>("setMatrix2x2")
                .AddVoidReturningMethod<&NativeEngineT::SetFloat>("setFloat")
                .AddVoidReturningMethod<&NativeEngineT::SetFloat2>("setFloat2")
                .AddVoidReturningMethod<&NativeEngineT::SetFloat3>("setFloat3")
                .AddVoidReturningMethod<&NativeEngineT::SetFloat4>("setFloat4")
                .AddVoidReturningMethod<&NativeEngineT::SetBool>("setBool")
                .AddValueReturningMethod<&NativeEngineT::CreateTexture>("createTexture")
                .AddVoidReturningMethod<&NativeEngineT::LoadTexture>("loadTexture")
                .AddVoidReturningMethod<&NativeEngineT::LoadCubeTexture>("loadCubeTexture")
                .AddValueReturningMethod<&NativeEngineT::GetTextureWidth>("getTextureWidth")
                .AddValueReturningMethod<&NativeEngineT::GetTextureHeight>("getTextureHeight")
                .AddVoidReturningMethod<&NativeEngineT::SetTextureSampling>("setTextureSampling")
                .AddVoidReturningMethod<&NativeEngineT::SetTextureWrapMode>("setTextureWrapMode")
                .AddVoidReturningMethod<&NativeEngineT::SetTextureAnisotropicLevel>("setTextureAnisotropicLevel")
                .AddVoidReturningMethod<&NativeEngineT::SetTexture>("setTexture")
                .AddVoidReturningMethod<&NativeEngineT::DeleteTexture>("deleteTexture")
                .AddVoidReturningMethod<&NativeEngineT::DrawIndexed>("drawIndexed")
                .AddVoidReturningMethod<&NativeEngineT::Draw>("draw")
                .AddVoidReturningMethod<&NativeEngineT::Clear>("clear")
                .AddValueReturningMethod<&NativeEngineT::GetRenderWidth>("getRenderWidth")
                .AddValueReturningMethod<&NativeEngineT::GetRenderHeight>("getRenderHeight")
                .Finalize();
            env.Global().Set("nativeEngine", func.New({}));
        }
    };
}
