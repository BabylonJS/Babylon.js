//-------------------------------------------------------------------------------------
// DirectXTexPMAlpha.cpp
//  
// DirectX Texture Library - Premultiplied alpha operations
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

namespace DirectX
{

static HRESULT _PremultiplyAlpha( _In_ const Image& srcImage, _In_ const Image& destImage )
{
    assert( srcImage.width == destImage.width );
    assert( srcImage.height == destImage.height );

    ScopedAlignedArrayXMVECTOR scanline( reinterpret_cast<XMVECTOR*>( _aligned_malloc( (sizeof(XMVECTOR)*srcImage.width), 16 ) ) );
    if ( !scanline )
        return E_OUTOFMEMORY;

    const uint8_t *pSrc = srcImage.pixels;
    uint8_t *pDest = destImage.pixels;
    if ( !pSrc || !pDest )
        return E_POINTER;

    for( size_t h = 0; h < srcImage.height; ++h )
    {
        if ( !_LoadScanline( scanline.get(), srcImage.width, pSrc, srcImage.rowPitch, srcImage.format ) )
            return E_FAIL;

        XMVECTOR* ptr = scanline.get();
        for( size_t w = 0; w < srcImage.width; ++w )
        {
            XMVECTOR v = *ptr;
            XMVECTOR alpha = XMVectorSplatW( *ptr );
            alpha = XMVectorMultiply( v, alpha );
            *(ptr++) = XMVectorSelect( v, alpha, g_XMSelect1110 );
        }

        if ( !_StoreScanline( pDest, destImage.rowPitch, destImage.format, scanline.get(), srcImage.width ) )
            return E_FAIL;

        pSrc += srcImage.rowPitch;
        pDest += destImage.rowPitch;
    }

    return S_OK;
}

static HRESULT _PremultiplyAlphaLinear( _In_ const Image& srcImage, _In_ DWORD flags, _In_ const Image& destImage )
{
    assert( srcImage.width == destImage.width );
    assert( srcImage.height == destImage.height );

    static_assert( TEX_PMALPHA_SRGB_IN == TEX_FILTER_SRGB_IN, "TEX_PMALHPA_SRGB* should match TEX_FILTER_SRGB*" );
    static_assert( TEX_PMALPHA_SRGB_OUT == TEX_FILTER_SRGB_OUT, "TEX_PMALHPA_SRGB* should match TEX_FILTER_SRGB*" );
    static_assert( TEX_PMALPHA_SRGB == TEX_FILTER_SRGB, "TEX_PMALHPA_SRGB* should match TEX_FILTER_SRGB*" );
    flags &= TEX_PMALPHA_SRGB;

    ScopedAlignedArrayXMVECTOR scanline( reinterpret_cast<XMVECTOR*>( _aligned_malloc( (sizeof(XMVECTOR)*srcImage.width), 16 ) ) );
    if ( !scanline )
        return E_OUTOFMEMORY;

    const uint8_t *pSrc = srcImage.pixels;
    uint8_t *pDest = destImage.pixels;
    if ( !pSrc || !pDest )
        return E_POINTER;

    for( size_t h = 0; h < srcImage.height; ++h )
    {
        if ( !_LoadScanlineLinear( scanline.get(), srcImage.width, pSrc, srcImage.rowPitch, srcImage.format, flags ) )
            return E_FAIL;

        XMVECTOR* ptr = scanline.get();
        for( size_t w = 0; w < srcImage.width; ++w )
        {
            XMVECTOR v = *ptr;
            XMVECTOR alpha = XMVectorSplatW( *ptr );
            alpha = XMVectorMultiply( v, alpha );
            *(ptr++) = XMVectorSelect( v, alpha, g_XMSelect1110 );
        }

        if ( !_StoreScanlineLinear( pDest, destImage.rowPitch, destImage.format, scanline.get(), srcImage.width, flags ) )
            return E_FAIL;

        pSrc += srcImage.rowPitch;
        pDest += destImage.rowPitch;
    }

    return S_OK;
}


//=====================================================================================
// Entry-points
//=====================================================================================

//-------------------------------------------------------------------------------------
// Converts to a premultiplied alpha version of the texture
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
HRESULT PremultiplyAlpha( const Image& srcImage, DWORD flags, ScratchImage& image )
{
    if ( !srcImage.pixels )
        return E_POINTER;

    if ( IsCompressed(srcImage.format)
         || IsPlanar(srcImage.format)
         || IsPalettized(srcImage.format)
         || IsTypeless(srcImage.format)
         || !HasAlpha(srcImage.format) )
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );

#ifdef _M_X64
    if ( (srcImage.width > 0xFFFFFFFF) || (srcImage.height > 0xFFFFFFFF) )
        return E_INVALIDARG;
#endif

    HRESULT hr = image.Initialize2D( srcImage.format, srcImage.width, srcImage.height, 1, 1 );
    if ( FAILED(hr) )
        return hr;
   
    const Image *rimage = image.GetImage( 0, 0, 0 );
    if ( !rimage )
    {
        image.Release();
        return E_POINTER;
    }

    hr = ( flags & TEX_PMALPHA_IGNORE_SRGB ) ? _PremultiplyAlpha( srcImage, *rimage ) : _PremultiplyAlphaLinear( srcImage, flags, *rimage );
    if ( FAILED(hr) )
    {
        image.Release();
        return hr;
    }

    return S_OK;
}


//-------------------------------------------------------------------------------------
// Converts to a premultiplied alpha version of the texture (complex)
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
HRESULT PremultiplyAlpha( const Image* srcImages, size_t nimages, const TexMetadata& metadata, DWORD flags, ScratchImage& result )
{
    if ( !srcImages || !nimages )
        return E_INVALIDARG;

    if ( IsCompressed(metadata.format)
         || IsPlanar(metadata.format)
         || IsPalettized(metadata.format)
         || IsTypeless(metadata.format)
         || !HasAlpha(metadata.format) )
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );

#ifdef _M_X64
    if ( (metadata.width > 0xFFFFFFFF) || (metadata.height > 0xFFFFFFFF) )
        return E_INVALIDARG;
#endif

    if ( metadata.IsPMAlpha() )
    {
        // Already premultiplied
        return E_FAIL;
    }

    TexMetadata mdata2 = metadata;
    mdata2.SetAlphaMode(TEX_ALPHA_MODE_PREMULTIPLIED);
    HRESULT hr = result.Initialize( mdata2 );
    if ( FAILED(hr) )
        return hr;

    if ( nimages != result.GetImageCount() )
    {
        result.Release();
        return E_FAIL;
    }

    const Image* dest = result.GetImages();
    if ( !dest )
    {
        result.Release();
        return E_POINTER;
    }

    for( size_t index=0; index < nimages; ++index )
    {
        const Image& src = srcImages[ index ];
        if ( src.format != metadata.format )
        {
            result.Release();
            return E_FAIL;
        }

#ifdef _M_X64
        if ( (src.width > 0xFFFFFFFF) || (src.height > 0xFFFFFFFF) )
            return E_FAIL;
#endif
        const Image& dst = dest[ index ];
        assert( dst.format == metadata.format );

        if ( src.width != dst.width || src.height != dst.height )
        {
            result.Release();
            return E_FAIL;
        }

        hr = ( flags & TEX_PMALPHA_IGNORE_SRGB ) ? _PremultiplyAlpha( src, dst ) : _PremultiplyAlphaLinear( src, flags, dst );
        if ( FAILED(hr) )
        {
            result.Release();
            return hr;
        }
    }

    return S_OK;
}

}; // namespace
