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
                m_propertyDescriptors.push_back(Napi::ObjectWrap<NapiBridge<ImplT>>::InstanceMethod(name, &NapiBridge<ImplT>::InstanceMethodImpl<method>, napi_default, m_impl));
                return *this;
            }

            template<Napi::Value(ImplT::*method)(const Napi::CallbackInfo& info)>
            Definition& AddValueReturningMethod(const char* name)
            {
                m_propertyDescriptors.push_back(Napi::ObjectWrap<NapiBridge<ImplT>>::InstanceMethod(name, &NapiBridge<ImplT>::InstanceMethodImpl<method>, napi_default, m_impl));
                return *this;
            }

            Napi::Function Finalize()
            {
                return NapiBridge<ImplT>::DefineClass(m_env, m_name.c_str(), m_propertyDescriptors, m_impl);
            }

        private:
            Definition(const std::string& name, Napi::Env& env, ImplT* impl)
                : m_name{ name }
                , m_env{ env }
                , m_impl{ impl }
            {
            }

            const std::string m_name;
            Napi::Env& m_env;
            ImplT* m_impl{};
            std::vector<Napi::ClassPropertyDescriptor<NapiBridge<ImplT>>> m_propertyDescriptors;
        };

        static NapiBridge<ImplT>::Definition Define(const std::string& name, Napi::Env& env, ImplT* impl)
        {
            return NapiBridge<ImplT>::Definition{ name, env, impl };
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
                .template AddVoidReturningMethod<&NativeEngineT::RequestAnimationFrame>("requestAnimationFrame")
                .template AddValueReturningMethod<&NativeEngineT::CreateVertexArray>("createVertexArray")
                .template AddVoidReturningMethod<&NativeEngineT::DeleteVertexArray>("deleteVertexArray")
                .template AddVoidReturningMethod<&NativeEngineT::BindVertexArray>("bindVertexArray")
                .template AddValueReturningMethod<&NativeEngineT::CreateIndexBuffer>("createIndexBuffer")
                .template AddVoidReturningMethod<&NativeEngineT::DeleteIndexBuffer>("deleteIndexBuffer")
                .template AddVoidReturningMethod<&NativeEngineT::RecordIndexBuffer>("recordIndexBuffer")
                .template AddValueReturningMethod<&NativeEngineT::CreateVertexBuffer>("createVertexBuffer")
                .template AddVoidReturningMethod<&NativeEngineT::DeleteVertexBuffer>("deleteVertexBuffer")
                .template AddVoidReturningMethod<&NativeEngineT::RecordVertexBuffer>("recordVertexBuffer")
                .template AddValueReturningMethod<&NativeEngineT::CreateProgram>("createProgram")
                .template AddValueReturningMethod<&NativeEngineT::GetUniforms>("getUniforms")
                .template AddValueReturningMethod<&NativeEngineT::GetAttributes>("getAttributes")
                .template AddVoidReturningMethod<&NativeEngineT::SetProgram>("setProgram")
                .template AddVoidReturningMethod<&NativeEngineT::SetState>("setState")
                .template AddVoidReturningMethod<&NativeEngineT::SetZOffset>("setZOffset")
                .template AddValueReturningMethod<&NativeEngineT::GetZOffset>("getZOffset")
                .template AddVoidReturningMethod<&NativeEngineT::SetDepthTest>("setDepthTest")
                .template AddValueReturningMethod<&NativeEngineT::GetDepthWrite>("getDepthWrite")
                .template AddVoidReturningMethod<&NativeEngineT::SetDepthWrite>("setDepthWrite")
                .template AddVoidReturningMethod<&NativeEngineT::SetColorWrite>("setColorWrite")
                .template AddVoidReturningMethod<&NativeEngineT::SetBlendMode>("setBlendMode")
                .template AddVoidReturningMethod<&NativeEngineT::SetMatrix>("setMatrix")
                .template AddVoidReturningMethod<&NativeEngineT::SetIntArray>("setIntArray")
                .template AddVoidReturningMethod<&NativeEngineT::SetIntArray2>("setIntArray2")
                .template AddVoidReturningMethod<&NativeEngineT::SetIntArray3>("setIntArray3")
                .template AddVoidReturningMethod<&NativeEngineT::SetIntArray4>("setIntArray4")
                .template AddVoidReturningMethod<&NativeEngineT::SetFloatArray>("setFloatArray")
                .template AddVoidReturningMethod<&NativeEngineT::SetFloatArray2>("setFloatArray2")
                .template AddVoidReturningMethod<&NativeEngineT::SetFloatArray3>("setFloatArray3")
                .template AddVoidReturningMethod<&NativeEngineT::SetFloatArray4>("setFloatArray4")
                .template AddVoidReturningMethod<&NativeEngineT::SetMatrices>("setMatrices")
                .template AddVoidReturningMethod<&NativeEngineT::SetMatrix3x3>("setMatrix3x3")
                .template AddVoidReturningMethod<&NativeEngineT::SetMatrix2x2>("setMatrix2x2")
                .template AddVoidReturningMethod<&NativeEngineT::SetFloat>("setFloat")
                .template AddVoidReturningMethod<&NativeEngineT::SetFloat2>("setFloat2")
                .template AddVoidReturningMethod<&NativeEngineT::SetFloat3>("setFloat3")
                .template AddVoidReturningMethod<&NativeEngineT::SetFloat4>("setFloat4")
                .template AddVoidReturningMethod<&NativeEngineT::SetBool>("setBool")
                .template AddValueReturningMethod<&NativeEngineT::CreateTexture>("createTexture")
                .template AddVoidReturningMethod<&NativeEngineT::LoadTexture>("loadTexture")
                .template AddVoidReturningMethod<&NativeEngineT::LoadCubeTexture>("loadCubeTexture")
                .template AddValueReturningMethod<&NativeEngineT::GetTextureWidth>("getTextureWidth")
                .template AddValueReturningMethod<&NativeEngineT::GetTextureHeight>("getTextureHeight")
                .template AddVoidReturningMethod<&NativeEngineT::SetTextureSampling>("setTextureSampling")
                .template AddVoidReturningMethod<&NativeEngineT::SetTextureWrapMode>("setTextureWrapMode")
                .template AddVoidReturningMethod<&NativeEngineT::SetTextureAnisotropicLevel>("setTextureAnisotropicLevel")
                .template AddVoidReturningMethod<&NativeEngineT::SetTexture>("setTexture")
                .template AddVoidReturningMethod<&NativeEngineT::DeleteTexture>("deleteTexture")
                .template AddValueReturningMethod<&NativeEngineT::CreateFrameBuffer>("createFrameBuffer")
                .template AddVoidReturningMethod<&NativeEngineT::DrawIndexed>("drawIndexed")
                .template AddVoidReturningMethod<&NativeEngineT::BindFrameBuffer>("bindFrameBuffer")
                .template AddVoidReturningMethod<&NativeEngineT::UnbindFrameBuffer>("unbindFrameBuffer")
                .template AddVoidReturningMethod<&NativeEngineT::Draw>("draw")
                .template AddVoidReturningMethod<&NativeEngineT::Clear>("clear")
                .template AddValueReturningMethod<&NativeEngineT::GetRenderWidth>("getRenderWidth")
                .template AddValueReturningMethod<&NativeEngineT::GetRenderHeight>("getRenderHeight")
                .Finalize();

            env.Global().Set("nativeEngine", func.New({}));
        }
    };
}
