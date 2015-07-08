//-------------------------------------------------------------------------------------
// DirectXTexCompressGPU.cpp
//  
// DirectX Texture Library - DirectCompute-based texture compression
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

#include "bcdirectcompute.h"

namespace DirectX
{

inline static DWORD _GetSRGBFlags( _In_ DWORD compress )
{
    static_assert( TEX_COMPRESS_SRGB_IN == TEX_FILTER_SRGB_IN, "TEX_COMPRESS_SRGB* should match TEX_FILTER_SRGB*" );
    static_assert( TEX_COMPRESS_SRGB_OUT == TEX_FILTER_SRGB_OUT, "TEX_COMPRESS_SRGB* should match TEX_FILTER_SRGB*" );
    static_assert( TEX_COMPRESS_SRGB == TEX_FILTER_SRGB, "TEX_COMPRESS_SRGB* should match TEX_FILTER_SRGB*" );
    return ( compress & TEX_COMPRESS_SRGB );
}


//-------------------------------------------------------------------------------------
// Converts to R8G8B8A8_UNORM or R8G8B8A8_UNORM_SRGB doing any conversion logic needed
//-------------------------------------------------------------------------------------
static HRESULT _ConvertToRGBA32( _In_ const Image& srcImage, _In_ ScratchImage& image, bool srgb, _In_ DWORD filter )
{
    if ( !srcImage.pixels )
        return E_POINTER;

    DXGI_FORMAT format = srgb ? DXGI_FORMAT_R8G8B8A8_UNORM_SRGB : DXGI_FORMAT_R8G8B8A8_UNORM;

    HRESULT hr = image.Initialize2D( format, srcImage.width, srcImage.height, 1, 1 );
    if ( FAILED(hr) )
        return hr;

    const Image *img = image.GetImage( 0, 0, 0 );
    if ( !img )
    {
        image.Release();
        return E_POINTER;
    }

    uint8_t* pDest = img->pixels;
    if ( !pDest )
    {
        image.Release();
        return E_POINTER;
    }

    ScopedAlignedArrayXMVECTOR scanline( reinterpret_cast<XMVECTOR*>( _aligned_malloc( ( sizeof(XMVECTOR) * srcImage.width ), 16 ) ) );
    if ( !scanline )
    {
        image.Release();
        return E_OUTOFMEMORY;
    }

    const uint8_t *pSrc = srcImage.pixels;
    for( size_t h = 0; h < srcImage.height; ++h )
    {
        if ( !_LoadScanline( scanline.get(), srcImage.width, pSrc, srcImage.rowPitch, srcImage.format ) )
        {
            image.Release();
            return E_FAIL;
        }

        _ConvertScanline( scanline.get(), srcImage.width, format, srcImage.format, filter );

        if ( !_StoreScanline( pDest, img->rowPitch, format, scanline.get(), srcImage.width ) )
        {
            image.Release();
            return E_FAIL;
        }

        pSrc += srcImage.rowPitch;
        pDest += img->rowPitch;
    }

    return S_OK;
}


//-------------------------------------------------------------------------------------
// Converts to DXGI_FORMAT_R32G32B32A32_FLOAT doing any conversion logic needed
//-------------------------------------------------------------------------------------
static HRESULT _ConvertToRGBAF32( const Image& srcImage, ScratchImage& image, _In_ DWORD filter )
{
    if ( !srcImage.pixels )
        return E_POINTER;

    HRESULT hr = image.Initialize2D( DXGI_FORMAT_R32G32B32A32_FLOAT, srcImage.width, srcImage.height, 1, 1 );
    if ( FAILED(hr) )
        return hr;

    const Image *img = image.GetImage( 0, 0, 0 );
    if ( !img )
    {
        image.Release();
        return E_POINTER;
    }

    uint8_t* pDest = img->pixels;
    if ( !pDest )
    {
        image.Release();
        return E_POINTER;
    }

    const uint8_t *pSrc = srcImage.pixels;
    for( size_t h = 0; h < srcImage.height; ++h )
    {
        if ( !_LoadScanline( reinterpret_cast<XMVECTOR*>(pDest), srcImage.width, pSrc, srcImage.rowPitch, srcImage.format ) )
        {
            image.Release();
            return E_FAIL;
        }

        _ConvertScanline( reinterpret_cast<XMVECTOR*>(pDest), srcImage.width, DXGI_FORMAT_R32G32B32A32_FLOAT, srcImage.format, filter );

        pSrc += srcImage.rowPitch;
        pDest += img->rowPitch;
    }

    return S_OK;
}


//-------------------------------------------------------------------------------------
// Compress using GPU, converting to the proper input format for the shader if needed
//-------------------------------------------------------------------------------------
inline static HRESULT _GPUCompress( _In_ GPUCompressBC* gpubc, _In_ const Image& srcImage, _In_ const Image& destImage, _In_ DWORD compress )
{
    if ( !gpubc )
        return E_POINTER;

    assert( srcImage.pixels && destImage.pixels );

    DXGI_FORMAT format = gpubc->GetSourceFormat();

    if ( srcImage.format == format )
    {
        // Input is already in our required source format
        return gpubc->Compress( srcImage, destImage );
    }
    else
    {
        // Convert format and then use as the source image
        ScratchImage image;
        HRESULT hr;

        DWORD srgb = _GetSRGBFlags( compress );

        switch( format )
        {
        case DXGI_FORMAT_R8G8B8A8_UNORM:
            hr = _ConvertToRGBA32( srcImage, image, false, srgb );
            break;

        case DXGI_FORMAT_R8G8B8A8_UNORM_SRGB:
            hr = _ConvertToRGBA32( srcImage, image, true, srgb );
            break;

        case DXGI_FORMAT_R32G32B32A32_FLOAT:
            hr = _ConvertToRGBAF32( srcImage, image, srgb );
            break;

        default:
            hr = E_UNEXPECTED;
            break;
        }

        if ( FAILED(hr) )
            return hr;

        const Image *img = image.GetImage( 0, 0, 0 );
        if ( !img )
            return E_POINTER;

        return gpubc->Compress( *img, destImage );
    }
}


//=====================================================================================
// Entry-points
//=====================================================================================

//-------------------------------------------------------------------------------------
// Compression
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
HRESULT Compress( ID3D11Device* pDevice, const Image& srcImage, DXGI_FORMAT format, DWORD compress, float alphaWeight, ScratchImage& image )
{
    if ( !pDevice || IsCompressed(srcImage.format) || !IsCompressed(format) )
        return E_INVALIDARG;

    if ( IsTypeless(format)
         || IsTypeless(srcImage.format) || IsPlanar(srcImage.format) || IsPalettized(srcImage.format) )
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );

    // Setup GPU compressor
    std::unique_ptr<GPUCompressBC> gpubc( new (std::nothrow) GPUCompressBC );
    if ( !gpubc )
        return E_OUTOFMEMORY;

    HRESULT hr = gpubc->Initialize( pDevice );
    if ( FAILED(hr) )
        return hr;

    hr = gpubc->Prepare( srcImage.width, srcImage.height, format, alphaWeight );
    if ( FAILED(hr) )
        return hr;

    // Create workspace for result
    hr = image.Initialize2D( format, srcImage.width, srcImage.height, 1, 1 );
    if ( FAILED(hr) )
        return hr;

    const Image *img = image.GetImage( 0, 0, 0 );
    if ( !img )
    {
        image.Release();
        return E_POINTER;
    }

    hr = _GPUCompress( gpubc.get(), srcImage, *img, compress );
    if ( FAILED(hr) )
        image.Release();

    return hr;
}

_Use_decl_annotations_
HRESULT Compress( ID3D11Device* pDevice, const Image* srcImages, size_t nimages, const TexMetadata& metadata,
                  DXGI_FORMAT format, DWORD compress, float alphaWeight, ScratchImage& cImages )
{
    if ( !pDevice || !srcImages || !nimages )
        return E_INVALIDARG;

    if ( IsCompressed(metadata.format) || !IsCompressed(format) )
        return E_INVALIDARG;

    if ( IsTypeless(format)
         || IsTypeless(metadata.format) || IsPlanar(metadata.format) || IsPalettized(metadata.format) )
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );

    cImages.Release();

    // Setup GPU compressor
    std::unique_ptr<GPUCompressBC> gpubc( new (std::nothrow) GPUCompressBC );
    if ( !gpubc )
        return E_OUTOFMEMORY;

    HRESULT hr = gpubc->Initialize( pDevice );
    if ( FAILED(hr) )
        return hr;

    // Create workspace for result
    TexMetadata mdata2 = metadata;
    mdata2.format = format;
    hr = cImages.Initialize( mdata2 );
    if ( FAILED(hr) )
        return hr;

    if ( nimages != cImages.GetImageCount() )
    {
        cImages.Release();
        return E_FAIL;
    }

    const Image* dest = cImages.GetImages();
    if ( !dest  )
    {
        cImages.Release();
        return E_POINTER;
    }

    // Process images (ordered by size)
    switch( metadata.dimension )
    {
    case TEX_DIMENSION_TEXTURE1D:
    case TEX_DIMENSION_TEXTURE2D:
        {
            size_t w = metadata.width;
            size_t h = metadata.height;

            for( size_t level=0; level < metadata.mipLevels; ++level )
            {
                hr = gpubc->Prepare( w, h, format, alphaWeight );
                if ( FAILED(hr) )
                {
                    cImages.Release();
                    return hr;
                }

                for( size_t item = 0; item < metadata.arraySize; ++item )
                {
                    size_t index = metadata.ComputeIndex( level, item, 0 );
                    if ( index >= nimages )
                    {
                        cImages.Release();
                        return E_FAIL;
                    }

                    assert( dest[ index ].format == format );

                    const Image& src = srcImages[ index ];

                    if ( src.width != dest[ index ].width || src.height != dest[ index ].height )
                    {
                        cImages.Release();
                        return E_FAIL;
                    }

                    hr = _GPUCompress( gpubc.get(), src, dest[ index ], compress );
                    if ( FAILED(hr) )
                    {
                        cImages.Release();
                        return hr;
                    }
                }

                if ( h > 1 )
                    h >>= 1;

                if ( w > 1 )
                    w >>= 1;
            }
        }
        break;

    case TEX_DIMENSION_TEXTURE3D:
        {
            size_t w = metadata.width;
            size_t h = metadata.height;
            size_t d = metadata.depth;

            for( size_t level=0; level < metadata.mipLevels; ++level )
            {
                hr = gpubc->Prepare( w, h, format, alphaWeight );
                if ( FAILED(hr) )
                {
                    cImages.Release();
                    return hr;
                }

                for( size_t slice=0; slice < d; ++slice )
                {
                    size_t index = metadata.ComputeIndex( level, 0, slice );
                    if ( index >= nimages )
                    {
                        cImages.Release();
                        return E_FAIL;
                    }

                    assert( dest[ index ].format == format );

                    const Image& src = srcImages[ index ];

                    if ( src.width != dest[ index ].width || src.height != dest[ index ].height )
                    {
                        cImages.Release();
                        return E_FAIL;
                    }

                    hr = _GPUCompress( gpubc.get(), src, dest[ index ], compress );
                    if ( FAILED(hr) )
                    {
                        cImages.Release();
                        return hr;
                    }
                }

                if ( h > 1 )
                    h >>= 1;

                if ( w > 1 )
                    w >>= 1;

                if ( d > 1 )
                    d >>= 1;
            }
        }
        break;

    default:
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );
    }

    return S_OK;
}

}; // namespace
