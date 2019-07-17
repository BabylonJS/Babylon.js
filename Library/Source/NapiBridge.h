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
            Definition& AddVoidReturningMethod(const char* name)
            {
                m_propertyDescriptors.push_back(InstanceMethod(name, &NapiBridge<ImplT>::InstanceMethodImpl<method>, napi_default, m_impl));
                return *this;
            }

            template<Napi::Value(ImplT::*method)(const Napi::CallbackInfo& info)>
            Definition& AddValueReturningMethod(const char* name)
            {
                m_propertyDescriptors.push_back(InstanceMethod(name, &NapiBridge<ImplT>::InstanceMethodImpl<method>, napi_default, m_impl));
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
            {
            }

            const std::string m_name{};
            Napi::Env& m_env;
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
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::RequestAnimationFrame>("requestAnimationFrame")
                .NapiBridge<NativeEngineT>::AddValueReturningMethod<&NativeEngineT::CreateVertexArray>("createVertexArray")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::DeleteVertexArray>("deleteVertexArray")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::BindVertexArray>("bindVertexArray")
                .NapiBridge<NativeEngineT>::AddValueReturningMethod<&NativeEngineT::CreateIndexBuffer>("createIndexBuffer")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::DeleteIndexBuffer>("deleteIndexBuffer")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::RecordIndexBuffer>("recordIndexBuffer")
                .NapiBridge<NativeEngineT>::AddValueReturningMethod<&NativeEngineT::CreateVertexBuffer>("createVertexBuffer")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::DeleteVertexBuffer>("deleteVertexBuffer")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::RecordVertexBuffer>("recordVertexBuffer")
                .NapiBridge<NativeEngineT>::AddValueReturningMethod<&NativeEngineT::CreateProgram>("createProgram")
                .NapiBridge<NativeEngineT>::AddValueReturningMethod<&NativeEngineT::GetUniforms>("getUniforms")
                .NapiBridge<NativeEngineT>::AddValueReturningMethod<&NativeEngineT::GetAttributes>("getAttributes")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::SetProgram>("setProgram")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::SetState>("setState")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::SetZOffset>("setZOffset")
                .NapiBridge<NativeEngineT>::AddValueReturningMethod<&NativeEngineT::GetZOffset>("getZOffset")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::SetDepthTest>("setDepthTest")
                .NapiBridge<NativeEngineT>::AddValueReturningMethod<&NativeEngineT::GetDepthWrite>("getDepthWrite")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::SetDepthWrite>("setDepthWrite")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::SetColorWrite>("setColorWrite")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::SetBlendMode>("setBlendMode")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::SetMatrix>("setMatrix")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::SetIntArray>("setIntArray")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::SetIntArray2>("setIntArray2")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::SetIntArray3>("setIntArray3")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::SetIntArray4>("setIntArray4")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::SetFloatArray>("setFloatArray")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::SetFloatArray2>("setFloatArray2")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::SetFloatArray3>("setFloatArray3")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::SetFloatArray4>("setFloatArray4")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::SetMatrices>("setMatrices")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::SetMatrix3x3>("setMatrix3x3")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::SetMatrix2x2>("setMatrix2x2")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::SetFloat>("setFloat")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::SetFloat2>("setFloat2")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::SetFloat3>("setFloat3")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::SetFloat4>("setFloat4")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::SetBool>("setBool")
                .NapiBridge<NativeEngineT>::AddValueReturningMethod<&NativeEngineT::CreateTexture>("createTexture")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::LoadTexture>("loadTexture")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::LoadCubeTexture>("loadCubeTexture")
                .NapiBridge<NativeEngineT>::AddValueReturningMethod<&NativeEngineT::GetTextureWidth>("getTextureWidth")
                .NapiBridge<NativeEngineT>::AddValueReturningMethod<&NativeEngineT::GetTextureHeight>("getTextureHeight")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::SetTextureSampling>("setTextureSampling")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::SetTextureWrapMode>("setTextureWrapMode")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::SetTextureAnisotropicLevel>("setTextureAnisotropicLevel")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::SetTexture>("setTexture")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::DeleteTexture>("deleteTexture")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::DrawIndexed>("drawIndexed")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::Draw>("draw")
                .NapiBridge<NativeEngineT>::AddVoidReturningMethod<&NativeEngineT::Clear>("clear")
                .NapiBridge<NativeEngineT>::AddValueReturningMethod<&NativeEngineT::GetRenderWidth>("getRenderWidth")
                .NapiBridge<NativeEngineT>::AddValueReturningMethod<&NativeEngineT::GetRenderHeight>("getRenderHeight")
                .NapiBridge<NativeEngineT>::Finalize();

            env.Global().Set("nativeEngine", func.New({}));
        }
    };
}
