//-------------------------------------------------------------------------------------
// BCDirectCompute.cpp
//  
// Direct3D 11 Compute Shader BC Compressor
//
// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
// PARTICULAR PURPOSE.
//
// Copyright (c) Microsoft Corporation. All rights reserved.
//-------------------------------------------------------------------------------------

#include "directxtexp.h"

#include "BCDirectCompute.h"

#if defined(_DEBUG) || defined(PROFILE)
#pragma comment(lib,"dxguid.lib")
#endif

using Microsoft::WRL::ComPtr;

namespace
{
    #include "Shaders\Compiled\BC7Encode_EncodeBlockCS.inc"
    #include "Shaders\Compiled\BC7Encode_TryMode02CS.inc"
    #include "Shaders\Compiled\BC7Encode_TryMode137CS.inc"
    #include "Shaders\Compiled\BC7Encode_TryMode456CS.inc"
    #include "Shaders\Compiled\BC6HEncode_EncodeBlockCS.inc"
    #include "Shaders\Compiled\BC6HEncode_TryModeG10CS.inc"
    #include "Shaders\Compiled\BC6HEncode_TryModeLE10CS.inc"

    struct BufferBC6HBC7
    {
        UINT color[4];
    };

    struct ConstantsBC6HBC7
    {
        UINT    tex_width;
        UINT    num_block_x;
        UINT    format;
        UINT    mode_id;
        UINT    start_block_id;
        UINT    num_total_blocks;
        float   alpha_weight;
        UINT    reserved;
    };

    static_assert( sizeof(ConstantsBC6HBC7) == sizeof(UINT)*8, "Constant buffer size mismatch" );

    inline void RunComputeShader( ID3D11DeviceContext* pContext,
                                  ID3D11ComputeShader* shader,
                                  ID3D11ShaderResourceView** pSRVs, 
                                  UINT srvCount,
                                  ID3D11Buffer* pCB, 
                                  ID3D11UnorderedAccessView* pUAV,
                                  UINT X )
    {
        // Force UAV to nullptr before setting SRV since we are swapping buffers
        ID3D11UnorderedAccessView* nullUAV = nullptr;
        pContext->CSSetUnorderedAccessViews( 0, 1, &nullUAV, nullptr );

        pContext->CSSetShader( shader, nullptr, 0 );
        pContext->CSSetShaderResources( 0, srvCount, pSRVs );
        pContext->CSSetUnorderedAccessViews( 0, 1, &pUAV, nullptr );
        pContext->CSSetConstantBuffers( 0, 1, &pCB );
        pContext->Dispatch( X, 1, 1 );
    }

    inline void ResetContext( ID3D11DeviceContext* pContext )
    {
        ID3D11UnorderedAccessView* nullUAV = nullptr;
        pContext->CSSetUnorderedAccessViews( 0, 1, &nullUAV, nullptr );

        ID3D11ShaderResourceView* nullSRV[3] = { nullptr, nullptr, nullptr };
        pContext->CSSetShaderResources( 0, 3, nullSRV );

        ID3D11Buffer* nullBuffer[1] = { nullptr };
        pContext->CSSetConstantBuffers( 0, 1, nullBuffer );
    }
};

namespace DirectX
{

GPUCompressBC::GPUCompressBC() :
    m_bcformat(DXGI_FORMAT_UNKNOWN),
    m_srcformat(DXGI_FORMAT_UNKNOWN),
    m_alphaWeight(1.f),
    m_width(0),
    m_height(0)
{
}


//-------------------------------------------------------------------------------------
_Use_decl_annotations_
HRESULT GPUCompressBC::Initialize( ID3D11Device* pDevice )
{
    if ( !pDevice )
        return E_INVALIDARG;

    // Check for DirectCompute support
    D3D_FEATURE_LEVEL fl = pDevice->GetFeatureLevel();

    if ( fl < D3D_FEATURE_LEVEL_10_0 )
    {
        // DirectCompute not supported on Feature Level 9.x hardware
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );
    }

    if ( fl < D3D_FEATURE_LEVEL_11_0 )
    {
        // DirectCompute support on Feature Level 10.x hardware is optional, and this function needs it
        D3D11_FEATURE_DATA_D3D10_X_HARDWARE_OPTIONS hwopts;
        HRESULT hr = pDevice->CheckFeatureSupport( D3D11_FEATURE_D3D10_X_HARDWARE_OPTIONS, &hwopts, sizeof(hwopts) );
        if ( FAILED(hr) )
        {
            memset( &hwopts, 0, sizeof(hwopts) );
        }

        if ( !hwopts.ComputeShaders_Plus_RawAndStructuredBuffers_Via_Shader_4_x )
        {
            return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );
        }
    }

    // Save a device reference and obtain immediate context
    m_device = pDevice;

    pDevice->GetImmediateContext( m_context.ReleaseAndGetAddressOf() );
    assert( m_context );

    //--- Create compute shader library: BC6H -----------------------------------------

    // Modes 11-14
    HRESULT hr = pDevice->CreateComputeShader( BC6HEncode_TryModeG10CS, sizeof(BC6HEncode_TryModeG10CS), nullptr, m_BC6H_tryModeG10CS.ReleaseAndGetAddressOf() );
    if ( FAILED(hr) )
        return hr;

    // Modes 1-10
    hr = pDevice->CreateComputeShader( BC6HEncode_TryModeLE10CS, sizeof(BC6HEncode_TryModeLE10CS), nullptr, m_BC6H_tryModeLE10CS.ReleaseAndGetAddressOf() );
    if ( FAILED(hr) )
        return hr;

    // Encode
    hr = pDevice->CreateComputeShader( BC6HEncode_EncodeBlockCS, sizeof(BC6HEncode_EncodeBlockCS), nullptr, m_BC6H_encodeBlockCS.ReleaseAndGetAddressOf() );
    if ( FAILED(hr) )
        return hr;

    //--- Create compute shader library: BC7 ------------------------------------------

    // Modes 4, 5, 6
    hr = pDevice->CreateComputeShader( BC7Encode_TryMode456CS, sizeof(BC7Encode_TryMode456CS), nullptr, m_BC7_tryMode456CS.ReleaseAndGetAddressOf() );
    if ( FAILED(hr) )
        return hr;

    // Modes 1, 3, 7
    hr = pDevice->CreateComputeShader( BC7Encode_TryMode137CS, sizeof(BC7Encode_TryMode137CS), nullptr, m_BC7_tryMode137CS.ReleaseAndGetAddressOf() );
    if ( FAILED(hr) )
        return hr;

    // Modes 0, 2
    hr = pDevice->CreateComputeShader( BC7Encode_TryMode02CS, sizeof(BC7Encode_TryMode02CS), nullptr, m_BC7_tryMode02CS.ReleaseAndGetAddressOf() );
    if ( FAILED(hr) )
        return hr;

    // Encode
    hr = pDevice->CreateComputeShader( BC7Encode_EncodeBlockCS, sizeof(BC7Encode_EncodeBlockCS), nullptr, m_BC7_encodeBlockCS.ReleaseAndGetAddressOf() );
    if ( FAILED(hr) )
        return hr;

    return S_OK;
}


//-------------------------------------------------------------------------------------
_Use_decl_annotations_
HRESULT GPUCompressBC::Prepare( size_t width, size_t height, DXGI_FORMAT format, float alphaWeight )
{
    if ( !width || !height || alphaWeight < 0.f )
        return E_INVALIDARG;

#ifdef _M_X64
    if ( (width > 0xFFFFFFFF) || (height > 0xFFFFFFFF) )
        return E_INVALIDARG;
#endif

    m_width = width;
    m_height = height;

    m_alphaWeight = alphaWeight;

    size_t xblocks = std::max<size_t>( 1, (width + 3) >> 2 );
    size_t yblocks = std::max<size_t>( 1, (height + 3) >> 2 );
    size_t num_blocks = xblocks * yblocks;

    switch( format )
    {
    // BC6H GPU compressor takes RGBAF32 as input
    case DXGI_FORMAT_BC6H_TYPELESS:
    case DXGI_FORMAT_BC6H_UF16:
    case DXGI_FORMAT_BC6H_SF16:
        m_srcformat = DXGI_FORMAT_R32G32B32A32_FLOAT;
        break;

    // BC7 GPU compressor takes RGBA32 as input
    case DXGI_FORMAT_BC7_TYPELESS:
    case DXGI_FORMAT_BC7_UNORM:
        m_srcformat = DXGI_FORMAT_R8G8B8A8_UNORM;
        break;

    case DXGI_FORMAT_BC7_UNORM_SRGB:
        m_srcformat = DXGI_FORMAT_R8G8B8A8_UNORM_SRGB;
        break;

    default:
        m_bcformat = m_srcformat = DXGI_FORMAT_UNKNOWN;
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );
    }

    m_bcformat = format;

    auto pDevice = m_device.Get();
    if ( !pDevice )
        return E_POINTER;

    // Create structured buffers
    size_t bufferSize = num_blocks * sizeof( BufferBC6HBC7 );
    {
        D3D11_BUFFER_DESC desc;
        memset( &desc, 0, sizeof(desc) );
        desc.BindFlags = D3D11_BIND_UNORDERED_ACCESS | D3D11_BIND_SHADER_RESOURCE;
        desc.Usage = D3D11_USAGE_DEFAULT;
        desc.MiscFlags = D3D11_RESOURCE_MISC_BUFFER_STRUCTURED;
        desc.StructureByteStride = sizeof( BufferBC6HBC7 );
        desc.ByteWidth = static_cast<UINT>( bufferSize );

        HRESULT hr = pDevice->CreateBuffer( &desc, nullptr, m_output.ReleaseAndGetAddressOf() );
        if ( FAILED(hr) )
        {
            return hr;
        }

        hr = pDevice->CreateBuffer( &desc, nullptr, m_err1.ReleaseAndGetAddressOf() );
        if ( FAILED(hr) )
        {
            return hr;
        }

        hr = pDevice->CreateBuffer( &desc, nullptr, m_err2.ReleaseAndGetAddressOf() );
        if ( FAILED(hr) )
        {
            return hr;
        }
    }

    // Create staging output buffer
    {
        D3D11_BUFFER_DESC desc;
        memset( &desc, 0, sizeof(desc) );
        desc.Usage = D3D11_USAGE_STAGING;
        desc.CPUAccessFlags = D3D11_CPU_ACCESS_READ;
        desc.ByteWidth = static_cast<UINT>( bufferSize );

        HRESULT hr = pDevice->CreateBuffer( &desc, nullptr, m_outputCPU.ReleaseAndGetAddressOf() );
        if ( FAILED(hr) )
        {
            return hr;
        }
    }

    // Create constant buffer
    {
        D3D11_BUFFER_DESC desc;
        memset( &desc, 0, sizeof(desc) );
        desc.BindFlags = D3D11_BIND_CONSTANT_BUFFER;
        desc.Usage = D3D11_USAGE_DYNAMIC;
        desc.CPUAccessFlags = D3D11_CPU_ACCESS_WRITE;
        desc.ByteWidth = sizeof( ConstantsBC6HBC7 );

        HRESULT hr = pDevice->CreateBuffer( &desc, nullptr, m_constBuffer.ReleaseAndGetAddressOf() );
        if ( FAILED(hr) )
        {
            return hr;
        }
    }

    // Create shader resource views
    {
        D3D11_SHADER_RESOURCE_VIEW_DESC desc;
        memset( &desc, 0, sizeof(desc) );
        desc.Buffer.NumElements = static_cast<UINT>( num_blocks );
        desc.ViewDimension = D3D11_SRV_DIMENSION_BUFFER;

        HRESULT hr = pDevice->CreateShaderResourceView( m_err1.Get(), &desc, m_err1SRV.ReleaseAndGetAddressOf() );
        if ( FAILED(hr) )
        {
            return hr;
        }

        hr = pDevice->CreateShaderResourceView( m_err2.Get(), &desc, m_err2SRV.ReleaseAndGetAddressOf() );
        if ( FAILED(hr) )
        {
            return hr;
        }
    }

    // Create unordered access views
    {
        D3D11_UNORDERED_ACCESS_VIEW_DESC desc;
        memset( &desc, 0, sizeof(desc) );
        desc.Buffer.NumElements = static_cast<UINT>( num_blocks );
        desc.ViewDimension = D3D11_UAV_DIMENSION_BUFFER;

        HRESULT hr = pDevice->CreateUnorderedAccessView( m_output.Get(), &desc, m_outputUAV.ReleaseAndGetAddressOf() );
        if ( FAILED(hr) )
        {
            return hr;
        }

        hr = pDevice->CreateUnorderedAccessView( m_err1.Get(), &desc, m_err1UAV.ReleaseAndGetAddressOf() );
        if ( FAILED(hr) )
        {
            return hr;
        }

        hr = pDevice->CreateUnorderedAccessView( m_err2.Get(), &desc, m_err2UAV.ReleaseAndGetAddressOf() );
        if ( FAILED(hr) )
        {
            return hr;
        }
    }
    
    return S_OK;
}


//-------------------------------------------------------------------------------------
_Use_decl_annotations_
HRESULT GPUCompressBC::Compress( const Image& srcImage, const Image& destImage )
{
    if ( !srcImage.pixels || !destImage.pixels )
        return E_INVALIDARG;

    if ( srcImage.width != destImage.width
         || srcImage.height != destImage.height
         || srcImage.width != m_width
         || srcImage.height != m_height
         || srcImage.format != m_srcformat
         || destImage.format != m_bcformat )
    {
        return E_UNEXPECTED;
    }

    //--- Create input texture --------------------------------------------------------
    auto pDevice = m_device.Get();
    if ( !pDevice )
        return E_POINTER;

    // We need to avoid the hardware doing additional colorspace conversion
    DXGI_FORMAT inputFormat = ( m_srcformat == DXGI_FORMAT_R8G8B8A8_UNORM_SRGB ) ? DXGI_FORMAT_R8G8B8A8_UNORM : m_srcformat;

    ComPtr<ID3D11Texture2D> sourceTex;
    {
        D3D11_TEXTURE2D_DESC desc;
        memset( &desc, 0, sizeof(desc) );
        desc.Width = static_cast<UINT>( srcImage.width );
        desc.Height = static_cast<UINT>( srcImage.height ); 
        desc.MipLevels = 1;
        desc.ArraySize = 1;
        desc.Format = inputFormat;
        desc.SampleDesc.Count = 1;
        desc.Usage = D3D11_USAGE_DEFAULT;
        desc.BindFlags = D3D11_BIND_SHADER_RESOURCE;

        D3D11_SUBRESOURCE_DATA initData;
        initData.pSysMem = srcImage.pixels;
        initData.SysMemPitch = static_cast<DWORD>( srcImage.rowPitch );
        initData.SysMemSlicePitch = static_cast<DWORD>( srcImage.slicePitch );

        HRESULT hr = pDevice->CreateTexture2D( &desc, &initData, sourceTex.GetAddressOf() );
        if ( FAILED(hr) )
        {
            return hr;
        }
    }

    ComPtr<ID3D11ShaderResourceView> sourceSRV;
    {
        D3D11_SHADER_RESOURCE_VIEW_DESC desc;
        memset( &desc, 0, sizeof(desc) );
        desc.Texture2D.MipLevels = 1;
        desc.Format = inputFormat;
        desc.ViewDimension = D3D11_SRV_DIMENSION_TEXTURE2D;

        HRESULT hr = pDevice->CreateShaderResourceView( sourceTex.Get(), &desc, sourceSRV.GetAddressOf() );
        if ( FAILED(hr) )
        {
            return hr;
        }
    }

    //--- Compress using DirectCompute ------------------------------------------------
    bool isbc7 = false;
    switch( m_bcformat )
    {
    case DXGI_FORMAT_BC6H_TYPELESS:
    case DXGI_FORMAT_BC6H_UF16:
    case DXGI_FORMAT_BC6H_SF16:
        break;

    case DXGI_FORMAT_BC7_TYPELESS:
    case DXGI_FORMAT_BC7_UNORM:
    case DXGI_FORMAT_BC7_UNORM_SRGB:
        isbc7 = true;
        break;

    default:
        return E_UNEXPECTED;
    }

    const UINT MAX_BLOCK_BATCH = 64;

    auto pContext = m_context.Get();
    if ( !pContext )
        return E_UNEXPECTED;

    size_t xblocks = std::max<size_t>( 1, (m_width + 3) >> 2 );
    size_t yblocks = std::max<size_t>( 1, (m_height + 3) >> 2 );

    UINT num_total_blocks = static_cast<UINT>( xblocks * yblocks );
    UINT num_blocks = num_total_blocks;
    int start_block_id = 0;
    while (num_blocks > 0)
    {
        UINT n = std::min<UINT>( num_blocks, MAX_BLOCK_BATCH );
        UINT uThreadGroupCount = n;

        {
            D3D11_MAPPED_SUBRESOURCE mapped;
            HRESULT hr = pContext->Map( m_constBuffer.Get(), 0, D3D11_MAP_WRITE_DISCARD, 0, &mapped );
            if ( FAILED(hr) )
                return hr;

            ConstantsBC6HBC7 param;
            param.tex_width = static_cast<UINT>( srcImage.width );
            param.num_block_x = static_cast<UINT>( xblocks );
            param.format = m_bcformat;
            param.mode_id = 0;
            param.start_block_id = start_block_id;
            param.num_total_blocks = num_total_blocks;
            param.alpha_weight = m_alphaWeight;
            memcpy( mapped.pData, &param, sizeof( param ) );

            pContext->Unmap( m_constBuffer.Get(), 0 );
        }

        if ( isbc7 )
        {
            //--- BC7 -----------------------------------------------------------------
            ID3D11ShaderResourceView* pSRVs[] = { sourceSRV.Get(), nullptr };
            RunComputeShader( pContext, m_BC7_tryMode456CS.Get(), pSRVs, 2, m_constBuffer.Get(),
                              m_err1UAV.Get(), std::max<UINT>( (uThreadGroupCount + 3) / 4, 1) );

            for ( UINT i = 0; i < 3; ++i )
            {
                static const UINT modes[] = { 1, 3, 7 };
                {
                    D3D11_MAPPED_SUBRESOURCE mapped;
                    HRESULT hr = pContext->Map( m_constBuffer.Get(), 0, D3D11_MAP_WRITE_DISCARD, 0, &mapped );
                    if ( FAILED(hr) )
                    {
                        ResetContext( pContext );
                        return hr;
                    }

                    ConstantsBC6HBC7 param;
                    param.tex_width = static_cast<UINT>( srcImage.width );
                    param.num_block_x = static_cast<UINT>( xblocks );
                    param.format = m_bcformat;
                    param.mode_id = modes[i];
                    param.start_block_id = start_block_id;
                    param.num_total_blocks = num_total_blocks;
                    param.alpha_weight = m_alphaWeight;
                    memcpy( mapped.pData, &param, sizeof( param ) );
                    pContext->Unmap( m_constBuffer.Get(), 0 );
                }

                pSRVs[1] = (i & 1) ? m_err2SRV.Get() : m_err1SRV.Get();
                RunComputeShader( pContext, m_BC7_tryMode137CS.Get(), pSRVs, 2, m_constBuffer.Get(),
                                  (i & 1) ? m_err1UAV.Get() : m_err2UAV.Get(), uThreadGroupCount );
            }               

            for ( UINT i = 0; i < 2; ++i )
            {
                static const UINT modes[] = { 0, 2 };
                {
                    D3D11_MAPPED_SUBRESOURCE mapped;
                    HRESULT hr = pContext->Map( m_constBuffer.Get(), 0, D3D11_MAP_WRITE_DISCARD, 0, &mapped );
                    if ( FAILED(hr) )
                    {
                        ResetContext( pContext );
                        return hr;
                    }

                    ConstantsBC6HBC7 param;
                    param.tex_width = static_cast<UINT>( srcImage.width );
                    param.num_block_x = static_cast<UINT>( xblocks );
                    param.format = m_bcformat;
                    param.mode_id = modes[i];
                    param.start_block_id = start_block_id;
                    param.num_total_blocks = num_total_blocks;
                    param.alpha_weight = m_alphaWeight;
                    memcpy( mapped.pData, &param, sizeof( param ) );
                    pContext->Unmap( m_constBuffer.Get(), 0 );
                }

                pSRVs[1] = (i & 1) ? m_err1SRV.Get() : m_err2SRV.Get();
                RunComputeShader( pContext, m_BC7_tryMode02CS.Get(), pSRVs, 2, m_constBuffer.Get(),
                                  (i & 1) ? m_err2UAV.Get() : m_err1UAV.Get(), uThreadGroupCount );
            }

            pSRVs[1] = m_err2SRV.Get();
            RunComputeShader( pContext, m_BC7_encodeBlockCS.Get(), pSRVs, 2, m_constBuffer.Get(),
                              m_outputUAV.Get(), std::max<UINT>( (uThreadGroupCount + 3) / 4, 1) );
        }
        else
        {
            //--- BC6H ----------------------------------------------------------------
            ID3D11ShaderResourceView* pSRVs[] = { sourceSRV.Get(), nullptr };
            RunComputeShader( pContext, m_BC6H_tryModeG10CS.Get(), pSRVs, 2, m_constBuffer.Get(),
                              m_err1UAV.Get(), std::max<UINT>( (uThreadGroupCount + 3) / 4, 1) );

            for ( UINT i = 0; i < 10; ++i )
            {
                {
                    D3D11_MAPPED_SUBRESOURCE mapped;
                    HRESULT hr = pContext->Map( m_constBuffer.Get(), 0, D3D11_MAP_WRITE_DISCARD, 0, &mapped );
                    if ( FAILED(hr) )
                    {
                        ResetContext( pContext );
                        return hr;
                    }

                    ConstantsBC6HBC7 param;
                    param.tex_width = static_cast<UINT>( srcImage.width );
                    param.num_block_x = static_cast<UINT>( xblocks );
                    param.format = m_bcformat;
                    param.mode_id = i;
                    param.start_block_id = start_block_id;
                    param.num_total_blocks = num_total_blocks;
                    memcpy( mapped.pData, &param, sizeof( param ) );
                    pContext->Unmap( m_constBuffer.Get(), 0 );
                }

                pSRVs[1] = (i & 1) ? m_err2SRV.Get() : m_err1SRV.Get();
                RunComputeShader( pContext, m_BC6H_tryModeLE10CS.Get(), pSRVs, 2, m_constBuffer.Get(),
                                  (i & 1) ? m_err1UAV.Get() : m_err2UAV.Get(), std::max<UINT>( (uThreadGroupCount + 1) / 2, 1) );
            }               

            pSRVs[1] = m_err1SRV.Get();
            RunComputeShader( pContext, m_BC6H_encodeBlockCS.Get(), pSRVs, 2, m_constBuffer.Get(),
                              m_outputUAV.Get(), std::max<UINT>( (uThreadGroupCount + 1) / 2, 1) );
        }

        start_block_id += n;
        num_blocks -= n;
    }

    ResetContext( pContext );

    //--- Copy output texture back to CPU ---------------------------------------------

    pContext->CopyResource( m_outputCPU.Get(), m_output.Get() );

    D3D11_MAPPED_SUBRESOURCE mapped;
    HRESULT hr = pContext->Map( m_outputCPU.Get(), 0, D3D11_MAP_READ, 0, &mapped );
    if ( SUCCEEDED(hr) )
    {
        const uint8_t *pSrc = reinterpret_cast<const uint8_t *>( mapped.pData );
        uint8_t *pDest = destImage.pixels;

        size_t pitch = xblocks * sizeof( BufferBC6HBC7 );

        size_t rows = std::max<size_t>( 1, ( destImage.height + 3 ) >> 2 );

        for( size_t h = 0; h < rows; ++h )
        {
            memcpy( pDest, pSrc, destImage.rowPitch );

            pSrc += pitch;
            pDest += destImage.rowPitch;
        }

        pContext->Unmap( m_outputCPU.Get(), 0 );
    }

    return hr;
}

}; // namespace