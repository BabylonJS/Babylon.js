//-------------------------------------------------------------------------------------
// DirectXTexD3D11.cpp
//  
// DirectX Texture Library - Direct3D 11 helpers
//
// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
// PARTICULAR PURPOSE.
//
// Copyright (c) Microsoft Corporation. All rights reserved.
//
// http://go.microsoft.com/fwlink/?LinkId=248926
//-------------------------------------------------------------------------------------

#include "directxtexp.h"

#if !defined(_XBOX_ONE) || !defined(_TITLE) || !MONOLITHIC
#include <d3d10.h>
#endif

using Microsoft::WRL::ComPtr;

namespace DirectX
{

static HRESULT _Capture( _In_ ID3D11DeviceContext* pContext, _In_ ID3D11Resource* pSource, _In_ const TexMetadata& metadata,
                         _In_ const ScratchImage& result )
{
    if ( !pContext || !pSource || !result.GetPixels() )
        return E_POINTER;

    if ( metadata.IsVolumemap() )
    {
        //--- Volume texture ----------------------------------------------------------
        assert( metadata.arraySize == 1 );

        size_t height = metadata.height;
        size_t depth = metadata.depth;

        for( size_t level = 0; level < metadata.mipLevels; ++level )
        {
            UINT dindex = D3D11CalcSubresource( static_cast<UINT>( level ), 0, static_cast<UINT>( metadata.mipLevels ) );

            D3D11_MAPPED_SUBRESOURCE mapped;
            HRESULT hr = pContext->Map( pSource, dindex, D3D11_MAP_READ, 0, &mapped );
            if ( FAILED(hr) )
                return hr;

            auto pslice = reinterpret_cast<const uint8_t*>( mapped.pData );
            if ( !pslice )
            {
                pContext->Unmap( pSource, dindex );
                return E_POINTER;
            }

            size_t lines = ComputeScanlines( metadata.format, height );
            if ( !lines )
            {
                pContext->Unmap( pSource, dindex );
                return E_UNEXPECTED;
            }

            for( size_t slice = 0; slice < depth; ++slice )
            {
                const Image* img = result.GetImage( level, 0, slice );
                if ( !img )
                {
                    pContext->Unmap( pSource, dindex );
                    return E_FAIL;
                }

                if ( !img->pixels )
                {
                    pContext->Unmap( pSource, dindex );
                    return E_POINTER;
                }

                const uint8_t* sptr = pslice;
                uint8_t* dptr = img->pixels;
                for( size_t h = 0; h < lines; ++h )
                {
                    size_t msize = std::min<size_t>( img->rowPitch, mapped.RowPitch );
                    memcpy_s( dptr, img->rowPitch, sptr, msize );
                    sptr += mapped.RowPitch;
                    dptr += img->rowPitch;
                }

                pslice += mapped.DepthPitch;
            }

            pContext->Unmap( pSource, dindex );

            if ( height > 1 )
                height >>= 1;
            if ( depth > 1 )
                depth >>= 1;
        }
    }
    else
    {
        //--- 1D or 2D texture --------------------------------------------------------
        assert( metadata.depth == 1 );

        for( size_t item = 0; item < metadata.arraySize; ++item )
        {
            size_t height = metadata.height;

            for( size_t level = 0; level < metadata.mipLevels; ++level )
            {
                UINT dindex = D3D11CalcSubresource( static_cast<UINT>( level ), static_cast<UINT>( item ), static_cast<UINT>( metadata.mipLevels ) );

                D3D11_MAPPED_SUBRESOURCE mapped;
                HRESULT hr = pContext->Map( pSource, dindex, D3D11_MAP_READ, 0, &mapped );
                if ( FAILED(hr) )
                    return hr;

                const Image* img = result.GetImage( level, item, 0 );
                if ( !img )
                {
                    pContext->Unmap( pSource, dindex );
                    return E_FAIL;
                }

                if ( !img->pixels )
                {
                    pContext->Unmap( pSource, dindex );
                    return E_POINTER;
                }

                size_t lines = ComputeScanlines( metadata.format, height );
                if ( !lines )
                {
                    pContext->Unmap( pSource, dindex );
                    return E_UNEXPECTED;
                }

                auto sptr = reinterpret_cast<const uint8_t*>( mapped.pData );
                uint8_t* dptr = img->pixels;
                for( size_t h = 0; h < lines; ++h )
                {
                    size_t msize = std::min<size_t>( img->rowPitch, mapped.RowPitch );
                    memcpy_s( dptr, img->rowPitch, sptr, msize );
                    sptr += mapped.RowPitch;
                    dptr += img->rowPitch;
                }

                pContext->Unmap( pSource, dindex );

                if ( height > 1 )
                    height >>= 1;
            }
        }
    }

    return S_OK;
}


//=====================================================================================
// Entry-points
//=====================================================================================

//-------------------------------------------------------------------------------------
// Determine if given texture metadata is supported on the given device
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
bool IsSupportedTexture( ID3D11Device* pDevice, const TexMetadata& metadata )
{
    if ( !pDevice )
        return false;

    D3D_FEATURE_LEVEL fl = pDevice->GetFeatureLevel();

    // Validate format
    DXGI_FORMAT fmt = metadata.format;

    if ( !IsValid( fmt ) )
        return false;

    switch( fmt )
    {
    case DXGI_FORMAT_BC4_TYPELESS:
    case DXGI_FORMAT_BC4_UNORM:
    case DXGI_FORMAT_BC4_SNORM:
    case DXGI_FORMAT_BC5_TYPELESS:
    case DXGI_FORMAT_BC5_UNORM:
    case DXGI_FORMAT_BC5_SNORM:
        if ( fl < D3D_FEATURE_LEVEL_10_0 )
            return false;
        break;

    case DXGI_FORMAT_BC6H_TYPELESS:
    case DXGI_FORMAT_BC6H_UF16:
    case DXGI_FORMAT_BC6H_SF16:
    case DXGI_FORMAT_BC7_TYPELESS:
    case DXGI_FORMAT_BC7_UNORM:
    case DXGI_FORMAT_BC7_UNORM_SRGB:
        if ( fl < D3D_FEATURE_LEVEL_11_0 )
            return false;
        break;
    }

    // Validate miplevel count
    if ( metadata.mipLevels > D3D11_REQ_MIP_LEVELS )
        return false;
       
    // Validate array size, dimension, and width/height
    size_t arraySize = metadata.arraySize;
    size_t iWidth = metadata.width;
    size_t iHeight = metadata.height;
    size_t iDepth = metadata.depth;

    // Most cases are known apriori based on feature level, but we use this for robustness to handle the few optional cases
    UINT formatSupport = 0;
    HRESULT hr = pDevice->CheckFormatSupport( fmt, &formatSupport );
    if ( FAILED(hr) )
    {
        formatSupport = 0;
    }

    switch ( metadata.dimension )
    {
    case TEX_DIMENSION_TEXTURE1D:
        if ( !(formatSupport & D3D11_FORMAT_SUPPORT_TEXTURE1D) )
            return false;

        if ( (arraySize > D3D11_REQ_TEXTURE1D_ARRAY_AXIS_DIMENSION)
             || (iWidth > D3D11_REQ_TEXTURE1D_U_DIMENSION) )
            return false;

        if ( fl < D3D_FEATURE_LEVEL_11_0 )
        {
            if ( (arraySize > D3D10_REQ_TEXTURE1D_ARRAY_AXIS_DIMENSION)
                 || (iWidth > D3D10_REQ_TEXTURE1D_U_DIMENSION) )
                return false;

            if ( fl < D3D_FEATURE_LEVEL_10_0 )
            {
                if ( (arraySize > 1) || (iWidth > D3D_FL9_3_REQ_TEXTURE1D_U_DIMENSION) )
                    return false;

                if ( (fl < D3D_FEATURE_LEVEL_9_3) && (iWidth > D3D_FL9_1_REQ_TEXTURE1D_U_DIMENSION ) )
                    return false;
            }
        }
        break;

    case TEX_DIMENSION_TEXTURE2D:
        if ( metadata.IsCubemap() )
        {
            if ( !(formatSupport & D3D11_FORMAT_SUPPORT_TEXTURECUBE) )
                return false;

            if ( (arraySize > D3D11_REQ_TEXTURE2D_ARRAY_AXIS_DIMENSION)
                 || (iWidth > D3D11_REQ_TEXTURECUBE_DIMENSION) 
                 || (iHeight > D3D11_REQ_TEXTURECUBE_DIMENSION))
                return false;

            if ( fl < D3D_FEATURE_LEVEL_11_0 )
            {
                if ( (arraySize > D3D10_REQ_TEXTURE2D_ARRAY_AXIS_DIMENSION)
                     || (iWidth > D3D10_REQ_TEXTURECUBE_DIMENSION) 
                     || (iHeight > D3D10_REQ_TEXTURECUBE_DIMENSION))
                    return false;

                if ( (fl < D3D_FEATURE_LEVEL_10_1) && (arraySize != 6) )
                    return false;

                if ( fl < D3D_FEATURE_LEVEL_10_0 )
                {
                    if ( (iWidth > D3D_FL9_3_REQ_TEXTURECUBE_DIMENSION )
                         || (iHeight > D3D_FL9_3_REQ_TEXTURECUBE_DIMENSION ) )
                        return false;

                    if ( (fl < D3D_FEATURE_LEVEL_9_3)
                         && ( (iWidth > D3D_FL9_1_REQ_TEXTURECUBE_DIMENSION)
                              || (iHeight > D3D_FL9_1_REQ_TEXTURECUBE_DIMENSION) ) )
                        return false;
                }
            }
        }
        else // Not a cube map
        {
            if ( !(formatSupport & D3D11_FORMAT_SUPPORT_TEXTURE2D) )
                return false;

            if ( (arraySize > D3D11_REQ_TEXTURE2D_ARRAY_AXIS_DIMENSION)
                 || (iWidth > D3D11_REQ_TEXTURE2D_U_OR_V_DIMENSION) 
                 || (iHeight > D3D11_REQ_TEXTURE2D_U_OR_V_DIMENSION))
                return false;

            if ( fl < D3D_FEATURE_LEVEL_11_0 )
            {
                if ( (arraySize > D3D10_REQ_TEXTURE2D_ARRAY_AXIS_DIMENSION)
                     || (iWidth > D3D10_REQ_TEXTURE2D_U_OR_V_DIMENSION) 
                     || (iHeight > D3D10_REQ_TEXTURE2D_U_OR_V_DIMENSION))
                    return false;

                if ( fl < D3D_FEATURE_LEVEL_10_0 )
                {
                    if ( (arraySize > 1)
                         || (iWidth > D3D_FL9_3_REQ_TEXTURE2D_U_OR_V_DIMENSION)
                         || (iHeight > D3D_FL9_3_REQ_TEXTURE2D_U_OR_V_DIMENSION) )
                        return false;

                    if ( (fl < D3D_FEATURE_LEVEL_9_3)
                         && ( (iWidth > D3D_FL9_1_REQ_TEXTURE2D_U_OR_V_DIMENSION)
                              || (iHeight > D3D_FL9_1_REQ_TEXTURE2D_U_OR_V_DIMENSION) ) )
                        return false;
                }
            }
        }
        break;

    case TEX_DIMENSION_TEXTURE3D:
        if ( !(formatSupport & D3D11_FORMAT_SUPPORT_TEXTURE3D) )
            return false;

        if ( (arraySize > 1)
             || (iWidth > D3D11_REQ_TEXTURE3D_U_V_OR_W_DIMENSION) 
             || (iHeight > D3D11_REQ_TEXTURE3D_U_V_OR_W_DIMENSION)
             || (iDepth > D3D11_REQ_TEXTURE3D_U_V_OR_W_DIMENSION) )
            return false;

        if ( fl < D3D_FEATURE_LEVEL_11_0 )
        {
            if ( (iWidth > D3D10_REQ_TEXTURE3D_U_V_OR_W_DIMENSION) 
                 || (iHeight > D3D10_REQ_TEXTURE3D_U_V_OR_W_DIMENSION)
                 || (iDepth > D3D10_REQ_TEXTURE3D_U_V_OR_W_DIMENSION) )
                return false;

            if ( fl < D3D_FEATURE_LEVEL_10_0 )
            {
                if ( (iWidth > D3D_FL9_1_REQ_TEXTURE3D_U_V_OR_W_DIMENSION)
                     || (iHeight > D3D_FL9_1_REQ_TEXTURE3D_U_V_OR_W_DIMENSION)
                     || (iDepth > D3D_FL9_1_REQ_TEXTURE3D_U_V_OR_W_DIMENSION) )
                    return false;
            }
        }
        break;

    default:
        // Not a supported dimension
        return false;
    }

    return true;
}


//-------------------------------------------------------------------------------------
// Create a texture resource
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
HRESULT CreateTexture( ID3D11Device* pDevice, const Image* srcImages, size_t nimages, const TexMetadata& metadata,
                       ID3D11Resource** ppResource )
{
    return CreateTextureEx( pDevice, srcImages, nimages, metadata,
                            D3D11_USAGE_DEFAULT, D3D11_BIND_SHADER_RESOURCE, 0, 0, false,
                            ppResource );
}

_Use_decl_annotations_
HRESULT CreateTextureEx( ID3D11Device* pDevice, const Image* srcImages, size_t nimages, const TexMetadata& metadata,
                         D3D11_USAGE usage, unsigned int bindFlags, unsigned int cpuAccessFlags, unsigned int miscFlags, bool forceSRGB,
                         ID3D11Resource** ppResource )
{
    if ( !pDevice || !srcImages || !nimages || !ppResource )
        return E_INVALIDARG;

    *ppResource = nullptr;

    if ( !metadata.mipLevels || !metadata.arraySize )
        return E_INVALIDARG;

#ifdef _M_X64
    if ( (metadata.width > 0xFFFFFFFF) || (metadata.height > 0xFFFFFFFF)
         || (metadata.mipLevels > 0xFFFFFFFF) || (metadata.arraySize > 0xFFFFFFFF) )
        return E_INVALIDARG;
#endif

    std::unique_ptr<D3D11_SUBRESOURCE_DATA[]> initData( new (std::nothrow) D3D11_SUBRESOURCE_DATA[ metadata.mipLevels * metadata.arraySize ] );
    if ( !initData )
        return E_OUTOFMEMORY;

    // Fill out subresource array
    if ( metadata.IsVolumemap() )
    {
        //--- Volume case -------------------------------------------------------------
        if ( !metadata.depth )
            return E_INVALIDARG;

#ifdef _M_X64
        if ( metadata.depth > 0xFFFFFFFF )
            return E_INVALIDARG;
#endif

        if ( metadata.arraySize > 1 )
            // Direct3D 11 doesn't support arrays of 3D textures
            return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );

        size_t depth = metadata.depth;

        size_t idx = 0;
        for( size_t level = 0; level < metadata.mipLevels; ++level )
        {
            size_t index = metadata.ComputeIndex( level, 0, 0 );
            if ( index >= nimages )
                return E_FAIL;

            const Image& img = srcImages[ index ];

            if ( img.format != metadata.format )
                return E_FAIL;

            if ( !img.pixels )
                return E_POINTER;

            // Verify pixels in image 1 .. (depth-1) are exactly image->slicePitch apart
            // For 3D textures, this relies on all slices of the same miplevel being continous in memory
            // (this is how ScratchImage lays them out), which is why we just give the 0th slice to Direct3D 11
            const uint8_t* pSlice = img.pixels + img.slicePitch;
            for( size_t slice = 1; slice < depth; ++slice )
            {
                size_t tindex = metadata.ComputeIndex( level, 0, slice );
                if ( tindex >= nimages )
                    return E_FAIL;

                const Image& timg = srcImages[ tindex ];

                if ( !timg.pixels )
                    return E_POINTER;

                if ( timg.pixels != pSlice
                     || timg.format != metadata.format
                     || timg.rowPitch != img.rowPitch
                     || timg.slicePitch != img.slicePitch )
                    return E_FAIL;

                pSlice = timg.pixels + img.slicePitch;
            }

            assert( idx < (metadata.mipLevels * metadata.arraySize) );

            initData[idx].pSysMem = img.pixels;
            initData[idx].SysMemPitch = static_cast<DWORD>( img.rowPitch );
            initData[idx].SysMemSlicePitch = static_cast<DWORD>( img.slicePitch );
            ++idx;

            if ( depth > 1 )
                depth >>= 1;
        }
    }
    else
    {
        //--- 1D or 2D texture case ---------------------------------------------------
        size_t idx = 0;
        for( size_t item = 0; item < metadata.arraySize; ++item )
        {
            for( size_t level = 0; level < metadata.mipLevels; ++level )
            {
                size_t index = metadata.ComputeIndex( level, item, 0 );
                if ( index >= nimages )
                    return E_FAIL;

                const Image& img = srcImages[ index ];

                if ( img.format != metadata.format )
                    return E_FAIL;

                if ( !img.pixels )
                    return E_POINTER;

                assert( idx < (metadata.mipLevels * metadata.arraySize) );

                initData[idx].pSysMem = img.pixels;
                initData[idx].SysMemPitch = static_cast<DWORD>( img.rowPitch );
                initData[idx].SysMemSlicePitch = static_cast<DWORD>( img.slicePitch );
                ++idx;
            }
        }
    }

    // Create texture using static initialization data
    HRESULT hr = E_FAIL;

    DXGI_FORMAT tformat = ( forceSRGB ) ? MakeSRGB( metadata.format ) : metadata.format;

    switch ( metadata.dimension )
    {
    case TEX_DIMENSION_TEXTURE1D:
        {
            D3D11_TEXTURE1D_DESC desc;
            desc.Width = static_cast<UINT>( metadata.width );
            desc.MipLevels = static_cast<UINT>( metadata.mipLevels );
            desc.ArraySize = static_cast<UINT>( metadata.arraySize );
            desc.Format = tformat;
            desc.Usage = usage;
            desc.BindFlags = bindFlags;
            desc.CPUAccessFlags = cpuAccessFlags;
            desc.MiscFlags = miscFlags & ~D3D11_RESOURCE_MISC_TEXTURECUBE;

            hr = pDevice->CreateTexture1D( &desc, initData.get(), reinterpret_cast<ID3D11Texture1D**>(ppResource) );
        }
        break;

    case TEX_DIMENSION_TEXTURE2D:
        {
            D3D11_TEXTURE2D_DESC desc;
            desc.Width = static_cast<UINT>( metadata.width );
            desc.Height = static_cast<UINT>( metadata.height ); 
            desc.MipLevels = static_cast<UINT>( metadata.mipLevels );
            desc.ArraySize = static_cast<UINT>( metadata.arraySize );
            desc.Format = tformat;
            desc.SampleDesc.Count = 1;
            desc.SampleDesc.Quality = 0;
            desc.Usage = usage;
            desc.BindFlags = bindFlags;
            desc.CPUAccessFlags = cpuAccessFlags;
            if ( metadata.IsCubemap() )
                desc.MiscFlags =  miscFlags | D3D11_RESOURCE_MISC_TEXTURECUBE;
            else
                desc.MiscFlags =  miscFlags & ~D3D11_RESOURCE_MISC_TEXTURECUBE;

            hr = pDevice->CreateTexture2D( &desc, initData.get(), reinterpret_cast<ID3D11Texture2D**>(ppResource) );
        }
        break;

    case TEX_DIMENSION_TEXTURE3D:
        {
            D3D11_TEXTURE3D_DESC desc;
            desc.Width = static_cast<UINT>( metadata.width );
            desc.Height = static_cast<UINT>( metadata.height );
            desc.Depth = static_cast<UINT>( metadata.depth );
            desc.MipLevels = static_cast<UINT>( metadata.mipLevels );
            desc.Format = tformat;
            desc.Usage = usage;
            desc.BindFlags = bindFlags;
            desc.CPUAccessFlags = cpuAccessFlags;
            desc.MiscFlags = miscFlags & ~D3D11_RESOURCE_MISC_TEXTURECUBE;

            hr = pDevice->CreateTexture3D( &desc, initData.get(), reinterpret_cast<ID3D11Texture3D**>(ppResource) );
        }
        break;
    }

    return hr;
}


//-------------------------------------------------------------------------------------
// Create a shader resource view and associated texture
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
HRESULT CreateShaderResourceView( ID3D11Device* pDevice, const Image* srcImages, size_t nimages, const TexMetadata& metadata,
                                  ID3D11ShaderResourceView** ppSRV )
{
    return CreateShaderResourceViewEx( pDevice, srcImages, nimages, metadata,
                                       D3D11_USAGE_DEFAULT, D3D11_BIND_SHADER_RESOURCE, 0, 0, false,
                                       ppSRV );
}

_Use_decl_annotations_
HRESULT CreateShaderResourceViewEx( ID3D11Device* pDevice, const Image* srcImages, size_t nimages, const TexMetadata& metadata,
                                    D3D11_USAGE usage, unsigned int bindFlags, unsigned int cpuAccessFlags, unsigned int miscFlags, bool forceSRGB,
                                    ID3D11ShaderResourceView** ppSRV )
{
    if ( !ppSRV )
        return E_INVALIDARG;

    *ppSRV = nullptr;

    ComPtr<ID3D11Resource> resource;
    HRESULT hr = CreateTextureEx( pDevice, srcImages, nimages, metadata,
                                  usage, bindFlags, cpuAccessFlags, miscFlags, forceSRGB,
                                  resource.GetAddressOf() );
    if ( FAILED(hr) )
        return hr;

    assert( resource );

    D3D11_SHADER_RESOURCE_VIEW_DESC SRVDesc;
    memset( &SRVDesc, 0, sizeof(SRVDesc) );
    if ( forceSRGB )
        SRVDesc.Format = MakeSRGB( metadata.format );
    else
        SRVDesc.Format = metadata.format;

    switch ( metadata.dimension )
    {
    case TEX_DIMENSION_TEXTURE1D:
        if ( metadata.arraySize > 1 )
        {
            SRVDesc.ViewDimension = D3D_SRV_DIMENSION_TEXTURE1DARRAY;
            SRVDesc.Texture1DArray.MipLevels = static_cast<UINT>( metadata.mipLevels );
            SRVDesc.Texture1DArray.ArraySize = static_cast<UINT>( metadata.arraySize );
        }
        else
        {
            SRVDesc.ViewDimension = D3D_SRV_DIMENSION_TEXTURE1D;
            SRVDesc.Texture1D.MipLevels = static_cast<UINT>( metadata.mipLevels );
        }
        break;

    case TEX_DIMENSION_TEXTURE2D:
        if ( metadata.IsCubemap() )
        {
            if (metadata.arraySize > 6)
            {
                assert( (metadata.arraySize % 6) == 0 );
                SRVDesc.ViewDimension = D3D_SRV_DIMENSION_TEXTURECUBEARRAY;
                SRVDesc.TextureCubeArray.MipLevels = static_cast<UINT>( metadata.mipLevels );
                SRVDesc.TextureCubeArray.NumCubes = static_cast<UINT>( metadata.arraySize / 6 );
            }
            else
            {
                SRVDesc.ViewDimension = D3D_SRV_DIMENSION_TEXTURECUBE;
                SRVDesc.TextureCube.MipLevels = static_cast<UINT>( metadata.mipLevels );
            }
        }
        else if ( metadata.arraySize > 1 )
        {
            SRVDesc.ViewDimension = D3D_SRV_DIMENSION_TEXTURE2DARRAY;
            SRVDesc.Texture2DArray.MipLevels = static_cast<UINT>( metadata.mipLevels );
            SRVDesc.Texture2DArray.ArraySize = static_cast<UINT>( metadata.arraySize );
        }
        else
        {
            SRVDesc.ViewDimension = D3D_SRV_DIMENSION_TEXTURE2D;
            SRVDesc.Texture2D.MipLevels = static_cast<UINT>( metadata.mipLevels );
        }
        break;

    case TEX_DIMENSION_TEXTURE3D:
        assert( metadata.arraySize == 1 );
        SRVDesc.ViewDimension = D3D_SRV_DIMENSION_TEXTURE3D;
        SRVDesc.Texture3D.MipLevels = static_cast<UINT>( metadata.mipLevels );
        break;

    default:
        return E_FAIL;
    }

    hr = pDevice->CreateShaderResourceView( resource.Get(), &SRVDesc, ppSRV );
    if ( FAILED(hr) )
        return hr;

    assert( *ppSRV );

    return S_OK;
}


//-------------------------------------------------------------------------------------
// Save a texture resource to a DDS file in memory/on disk
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
HRESULT CaptureTexture( ID3D11Device* pDevice, ID3D11DeviceContext* pContext, ID3D11Resource* pSource, ScratchImage& result )
{
    if ( !pDevice || !pContext || !pSource )
        return E_INVALIDARG;

    D3D11_RESOURCE_DIMENSION resType = D3D11_RESOURCE_DIMENSION_UNKNOWN;
    pSource->GetType( &resType );

    HRESULT hr;

    switch( resType )
    {
    case D3D11_RESOURCE_DIMENSION_TEXTURE1D:
        {
            ComPtr<ID3D11Texture1D> pTexture;
            hr = pSource->QueryInterface( __uuidof(ID3D11Texture1D), reinterpret_cast<void**>( pTexture.GetAddressOf() ) );
            if ( FAILED(hr) )
                break;

            assert( pTexture );

            D3D11_TEXTURE1D_DESC desc;
            pTexture->GetDesc( &desc );

            desc.BindFlags = 0;
            desc.MiscFlags = 0;
            desc.CPUAccessFlags = D3D11_CPU_ACCESS_READ;
            desc.Usage = D3D11_USAGE_STAGING;

            ComPtr<ID3D11Texture1D> pStaging;
            hr = pDevice->CreateTexture1D( &desc, 0, pStaging.GetAddressOf() );
            if ( FAILED(hr) )
                break;

            assert( pStaging );

            pContext->CopyResource( pStaging.Get(), pSource );

            TexMetadata mdata;
            mdata.width = desc.Width;
            mdata.height = mdata.depth = 1;
            mdata.arraySize = desc.ArraySize;
            mdata.mipLevels = desc.MipLevels;
            mdata.miscFlags = 0;
            mdata.miscFlags2 = 0;
            mdata.format = desc.Format;
            mdata.dimension = TEX_DIMENSION_TEXTURE1D;

            hr = result.Initialize( mdata );
            if ( FAILED(hr) )
                break;

            hr = _Capture( pContext, pStaging.Get(), mdata, result );
        }
        break;

    case D3D11_RESOURCE_DIMENSION_TEXTURE2D:
        {
            ComPtr<ID3D11Texture2D> pTexture;
            hr = pSource->QueryInterface( __uuidof(ID3D11Texture2D), reinterpret_cast<void**>( pTexture.GetAddressOf() ) );
            if ( FAILED(hr) )
                break;

            assert( pTexture );

            D3D11_TEXTURE2D_DESC desc;
            pTexture->GetDesc( &desc );

            ComPtr<ID3D11Texture2D> pStaging;
            if ( desc.SampleDesc.Count > 1 )
            {
                desc.SampleDesc.Count = 1;
                desc.SampleDesc.Quality = 0;

                ComPtr<ID3D11Texture2D> pTemp;
                hr = pDevice->CreateTexture2D( &desc, 0, pTemp.GetAddressOf() );
                if ( FAILED(hr) )
                    break;

                assert( pTemp );

                DXGI_FORMAT fmt = desc.Format;
                if ( IsTypeless(fmt) )
                {
                    // Assume a UNORM if it exists otherwise use FLOAT
                    fmt = MakeTypelessUNORM( fmt );
                    fmt = MakeTypelessFLOAT( fmt );
                }

                UINT support = 0;
                hr = pDevice->CheckFormatSupport( fmt, &support );
                if ( FAILED(hr) )
                    break;

                if ( !(support & D3D11_FORMAT_SUPPORT_MULTISAMPLE_RESOLVE) )
                {
                    hr = E_FAIL;
                    break;
                }

                for( UINT item = 0; item < desc.ArraySize; ++item )
                {
                    for( UINT level = 0; level < desc.MipLevels; ++level )
                    {
                        UINT index = D3D11CalcSubresource( level, item, desc.MipLevels );
                        pContext->ResolveSubresource( pTemp.Get(), index, pSource, index, fmt );
                    }
                }

                desc.BindFlags = 0;
                desc.MiscFlags &= D3D11_RESOURCE_MISC_TEXTURECUBE;
                desc.CPUAccessFlags = D3D11_CPU_ACCESS_READ;
                desc.Usage = D3D11_USAGE_STAGING;

                hr = pDevice->CreateTexture2D( &desc, 0, pStaging.GetAddressOf() );
                if ( FAILED(hr) )
                    break;

                assert( pStaging );

                pContext->CopyResource( pStaging.Get(), pTemp.Get() );
            }
            else
            {
                desc.BindFlags = 0;
                desc.MiscFlags &= D3D11_RESOURCE_MISC_TEXTURECUBE;
                desc.CPUAccessFlags = D3D11_CPU_ACCESS_READ;
                desc.Usage = D3D11_USAGE_STAGING;

                hr = pDevice->CreateTexture2D( &desc, 0, &pStaging );
                if ( FAILED(hr) )
                    break;

                assert( pStaging );

                pContext->CopyResource( pStaging.Get(), pSource );
            }

            TexMetadata mdata;
            mdata.width = desc.Width;
            mdata.height = desc.Height;
            mdata.depth = 1;
            mdata.arraySize = desc.ArraySize;
            mdata.mipLevels = desc.MipLevels;
            mdata.miscFlags = (desc.MiscFlags & D3D11_RESOURCE_MISC_TEXTURECUBE) ? TEX_MISC_TEXTURECUBE : 0;
            mdata.miscFlags2 = 0;
            mdata.format = desc.Format;
            mdata.dimension = TEX_DIMENSION_TEXTURE2D;

            hr = result.Initialize( mdata );
            if ( FAILED(hr) )
                break;

            hr = _Capture( pContext, pStaging.Get(), mdata, result );
        }
        break;

    case D3D11_RESOURCE_DIMENSION_TEXTURE3D:
        {
            ComPtr<ID3D11Texture3D> pTexture;
            hr = pSource->QueryInterface( __uuidof(ID3D11Texture3D), reinterpret_cast<void**>( pTexture.GetAddressOf() ) );
            if ( FAILED(hr) )
                break;

            assert( pTexture );

            D3D11_TEXTURE3D_DESC desc;
            pTexture->GetDesc( &desc );

            desc.BindFlags = 0;
            desc.MiscFlags = 0;
            desc.CPUAccessFlags = D3D11_CPU_ACCESS_READ;
            desc.Usage = D3D11_USAGE_STAGING;

            ComPtr<ID3D11Texture3D> pStaging;
            hr = pDevice->CreateTexture3D( &desc, 0, pStaging.GetAddressOf() );
            if ( FAILED(hr) )
                break;

            assert( pStaging );

            pContext->CopyResource( pStaging.Get(), pSource );

            TexMetadata mdata;
            mdata.width = desc.Width;
            mdata.height = desc.Height;
            mdata.depth = desc.Depth;
            mdata.arraySize = 1;
            mdata.mipLevels = desc.MipLevels;
            mdata.miscFlags = 0;
            mdata.miscFlags2 = 0;
            mdata.format = desc.Format;
            mdata.dimension = TEX_DIMENSION_TEXTURE3D;

            hr = result.Initialize( mdata );
            if ( FAILED(hr) )
                break;

            hr = _Capture( pContext, pStaging.Get(), mdata, result );
        }
        break;

    default:
        hr = E_FAIL;
        break;
    }

    if ( FAILED(hr) )
    {
        result.Release();
        return hr;
    }

    return S_OK;
}

}; // namespace
