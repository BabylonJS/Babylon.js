//-------------------------------------------------------------------------------------
// DirectXTexCompress.cpp
//  
// DirectX Texture Library - Texture compression
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

#ifdef _OPENMP
#include <omp.h>
#pragma warning(disable : 4616 6993)
#endif

#include "bc.h"


namespace DirectX
{

inline static DWORD _GetBCFlags( _In_ DWORD compress )
{
    static_assert( TEX_COMPRESS_RGB_DITHER == BC_FLAGS_DITHER_RGB, "TEX_COMPRESS_* flags should match BC_FLAGS_*" );
    static_assert( TEX_COMPRESS_A_DITHER == BC_FLAGS_DITHER_A, "TEX_COMPRESS_* flags should match BC_FLAGS_*"  );
    static_assert( TEX_COMPRESS_DITHER == (BC_FLAGS_DITHER_RGB | BC_FLAGS_DITHER_A), "TEX_COMPRESS_* flags should match BC_FLAGS_*"  );
    static_assert( TEX_COMPRESS_UNIFORM == BC_FLAGS_UNIFORM, "TEX_COMPRESS_* flags should match BC_FLAGS_*"  );
    return ( compress & (BC_FLAGS_DITHER_RGB|BC_FLAGS_DITHER_A|BC_FLAGS_UNIFORM) );
}

inline static DWORD _GetSRGBFlags( _In_ DWORD compress )
{
    static_assert( TEX_COMPRESS_SRGB_IN == TEX_FILTER_SRGB_IN, "TEX_COMPRESS_SRGB* should match TEX_FILTER_SRGB*" );
    static_assert( TEX_COMPRESS_SRGB_OUT == TEX_FILTER_SRGB_OUT, "TEX_COMPRESS_SRGB* should match TEX_FILTER_SRGB*" );
    static_assert( TEX_COMPRESS_SRGB == TEX_FILTER_SRGB, "TEX_COMPRESS_SRGB* should match TEX_FILTER_SRGB*" );
    return ( compress & TEX_COMPRESS_SRGB );
}

inline static bool _DetermineEncoderSettings( _In_ DXGI_FORMAT format, _Out_ BC_ENCODE& pfEncode, _Out_ size_t& blocksize, _Out_ DWORD& cflags )
{
    switch(format)
    {
    case DXGI_FORMAT_BC1_UNORM:
    case DXGI_FORMAT_BC1_UNORM_SRGB:    pfEncode = nullptr;         blocksize = 8;   cflags = 0; break;
    case DXGI_FORMAT_BC2_UNORM:
    case DXGI_FORMAT_BC2_UNORM_SRGB:    pfEncode = D3DXEncodeBC2;   blocksize = 16;  cflags = 0; break;
    case DXGI_FORMAT_BC3_UNORM:
    case DXGI_FORMAT_BC3_UNORM_SRGB:    pfEncode = D3DXEncodeBC3;   blocksize = 16;  cflags = 0; break;
    case DXGI_FORMAT_BC4_UNORM:         pfEncode = D3DXEncodeBC4U;  blocksize = 8;   cflags = TEX_FILTER_RGB_COPY_RED; break;
    case DXGI_FORMAT_BC4_SNORM:         pfEncode = D3DXEncodeBC4S;  blocksize = 8;   cflags = TEX_FILTER_RGB_COPY_RED; break;
    case DXGI_FORMAT_BC5_UNORM:         pfEncode = D3DXEncodeBC5U;  blocksize = 16;  cflags = TEX_FILTER_RGB_COPY_RED | TEX_FILTER_RGB_COPY_GREEN; break;
    case DXGI_FORMAT_BC5_SNORM:         pfEncode = D3DXEncodeBC5S;  blocksize = 16;  cflags = TEX_FILTER_RGB_COPY_RED | TEX_FILTER_RGB_COPY_GREEN; break;
    case DXGI_FORMAT_BC6H_UF16:         pfEncode = D3DXEncodeBC6HU; blocksize = 16;  cflags = 0; break;
    case DXGI_FORMAT_BC6H_SF16:         pfEncode = D3DXEncodeBC6HS; blocksize = 16;  cflags = 0; break;
    case DXGI_FORMAT_BC7_UNORM:
    case DXGI_FORMAT_BC7_UNORM_SRGB:    pfEncode = D3DXEncodeBC7;   blocksize = 16;  cflags = 0; break;
    default:                            pfEncode = nullptr;         blocksize = 0;   cflags = 0; return false;
    }

    return true;
}


//-------------------------------------------------------------------------------------
static HRESULT _CompressBC( _In_ const Image& image, _In_ const Image& result, _In_ DWORD bcflags,
                            _In_ DWORD srgb, _In_ float alphaRef )
{
    if ( !image.pixels || !result.pixels )
        return E_POINTER;

    assert( image.width == result.width );
    assert( image.height == result.height );

    const DXGI_FORMAT format = image.format;
    size_t sbpp = BitsPerPixel( format );
    if ( !sbpp )
        return E_FAIL;

    if ( sbpp < 8 )
    {
        // We don't support compressing from monochrome (DXGI_FORMAT_R1_UNORM)
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );
    }

    // Round to bytes
    sbpp = ( sbpp + 7 ) / 8;

    uint8_t *pDest = result.pixels;

    // Determine BC format encoder
    BC_ENCODE pfEncode;
    size_t blocksize;
    DWORD cflags;
    if ( !_DetermineEncoderSettings( result.format, pfEncode, blocksize, cflags ) )
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );

    XMVECTOR temp[16];
    const uint8_t *pSrc = image.pixels;
    const size_t rowPitch = image.rowPitch;
    for( size_t h=0; h < image.height; h += 4 )
    {
        const uint8_t *sptr = pSrc;
        uint8_t* dptr = pDest;
        size_t ph = std::min<size_t>( 4, image.height - h );
        size_t w = 0;
        for( size_t count = 0; count < rowPitch; count += sbpp*4, w += 4 )
        {
            size_t pw = std::min<size_t>( 4, image.width - w );
            assert( pw > 0 && ph > 0 );

            if ( !_LoadScanline( &temp[0], pw, sptr, rowPitch, format ) )
                return E_FAIL;

            if ( ph > 1 )
            {
                if ( !_LoadScanline( &temp[4], pw, sptr + rowPitch, rowPitch, format ) )
                    return E_FAIL;

                if ( ph > 2 )
                {
                    if ( !_LoadScanline( &temp[8], pw, sptr + rowPitch*2, rowPitch, format ) )
                        return E_FAIL;

                    if ( ph > 3 )
                    {
                        if ( !_LoadScanline( &temp[12], pw, sptr + rowPitch*3, rowPitch, format ) )
                            return E_FAIL;
                    }
                }
            }

            if ( pw != 4 || ph != 4 )
            {
                // Replicate pixels for partial block
                static const size_t uSrc[] = { 0, 0, 0, 1 };

                if ( pw < 4 )
                {
                    for( size_t t = 0; t < ph && t < 4; ++t )
                    {
                        for( size_t s = pw; s < 4; ++s )
                        {
#pragma prefast(suppress: 26000, "PREFAST false positive")
                            temp[ (t << 2) | s ] = temp[ (t << 2) | uSrc[s] ]; 
                        }
                    }
                }

                if ( ph < 4 )
                {
                    for( size_t t = ph; t < 4; ++t )
                    {
                        for( size_t s = 0; s < 4; ++s )
                        {
#pragma prefast(suppress: 26000, "PREFAST false positive")
                            temp[ (t << 2) | s ] = temp[ (uSrc[t] << 2) | s ]; 
                        }
                    }
                }
            }

            _ConvertScanline( temp, 16, result.format, format, cflags | srgb );
            
            if ( pfEncode )
                pfEncode( dptr, temp, bcflags );
            else
                D3DXEncodeBC1( dptr, temp, alphaRef, bcflags );

            sptr += sbpp*4;
            dptr += blocksize;
        }

        pSrc += rowPitch*4;
        pDest += result.rowPitch;
    }

    return S_OK;
}


//-------------------------------------------------------------------------------------
#ifdef _OPENMP
static HRESULT _CompressBC_Parallel( _In_ const Image& image, _In_ const Image& result, _In_ DWORD bcflags,
                                     _In_ DWORD srgb, _In_ float alphaRef )
{
    if ( !image.pixels || !result.pixels )
        return E_POINTER;

    assert( image.width == result.width );
    assert( image.height == result.height );

    const DXGI_FORMAT format = image.format;
    size_t sbpp = BitsPerPixel( format );
    if ( !sbpp )
        return E_FAIL;

    if ( sbpp < 8 )
    {
        // We don't support compressing from monochrome (DXGI_FORMAT_R1_UNORM)
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );
    }

    // Round to bytes
    sbpp = ( sbpp + 7 ) / 8;

    // Determine BC format encoder
    BC_ENCODE pfEncode;
    size_t blocksize;
    DWORD cflags;
    if ( !_DetermineEncoderSettings( result.format, pfEncode, blocksize, cflags ) )
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );

    // Refactored version of loop to support parallel independance
    const size_t nBlocks = std::max<size_t>(1, (image.width + 3) / 4 ) * std::max<size_t>(1, (image.height + 3) / 4 );

    bool fail = false;

#pragma omp parallel for
    for( int nb=0; nb < static_cast<int>( nBlocks ); ++nb )
    {
        const size_t nbWidth = std::max<size_t>(1, (image.width + 3) / 4 );

        const size_t y = nb / nbWidth;
        const size_t x = nb - (y*nbWidth);

        assert( x < image.width && y < image.height );

        size_t rowPitch = image.rowPitch;
        const uint8_t *pSrc = image.pixels + (y*4*rowPitch) + (x*4*sbpp);

        uint8_t *pDest = result.pixels + (nb*blocksize);

        size_t ph = std::min<size_t>( 4, image.height - y );
        size_t pw = std::min<size_t>( 4, image.width - x );
        assert( pw > 0 && ph > 0 );

        XMVECTOR temp[16];
        if ( !_LoadScanline( &temp[0], pw, pSrc, rowPitch, format ) )
            fail = true;

        if ( ph > 1 )
        {
            if ( !_LoadScanline( &temp[4], pw, pSrc + rowPitch, rowPitch, format ) )
                fail = true;

            if ( ph > 2 )
            {
                if ( !_LoadScanline( &temp[8], pw, pSrc + rowPitch*2, rowPitch, format ) )
                    fail = true;

                if ( ph > 3 )
                {
                    if ( !_LoadScanline( &temp[12], pw, pSrc + rowPitch*3, rowPitch, format ) )
                        fail = true;
                }
            }
        }

        if ( pw != 4 || ph != 4 )
        {
            // Replicate pixels for partial block
            static const size_t uSrc[] = { 0, 0, 0, 1 };

            if ( pw < 4 )
            {
                for( size_t t = 0; t < ph && t < 4; ++t )
                {
                    for( size_t s = pw; s < 4; ++s )
                    {
                        temp[ (t << 2) | s ] = temp[ (t << 2) | uSrc[s] ]; 
                    }
                }
            }

            if ( ph < 4 )
            {
                for( size_t t = ph; t < 4; ++t )
                {
                    for( size_t s = 0; s < 4; ++s )
                    {
                        temp[ (t << 2) | s ] = temp[ (uSrc[t] << 2) | s ]; 
                    }
                }
            }
        }

        _ConvertScanline( temp, 16, result.format, format, cflags | srgb );
            
        if ( pfEncode )
            pfEncode( pDest, temp, bcflags );
        else
            D3DXEncodeBC1( pDest, temp, alphaRef, bcflags );
    }

    return (fail) ? E_FAIL : S_OK;
}

#endif // _OPENMP


//-------------------------------------------------------------------------------------
static DXGI_FORMAT _DefaultDecompress( _In_ DXGI_FORMAT format )
{
    switch( format )
    {
    case DXGI_FORMAT_BC1_TYPELESS:
    case DXGI_FORMAT_BC1_UNORM:
    case DXGI_FORMAT_BC2_TYPELESS:
    case DXGI_FORMAT_BC2_UNORM:
    case DXGI_FORMAT_BC3_TYPELESS:
    case DXGI_FORMAT_BC3_UNORM:
    case DXGI_FORMAT_BC7_TYPELESS:
    case DXGI_FORMAT_BC7_UNORM:
        return DXGI_FORMAT_R8G8B8A8_UNORM;

    case DXGI_FORMAT_BC1_UNORM_SRGB:
    case DXGI_FORMAT_BC2_UNORM_SRGB:
    case DXGI_FORMAT_BC3_UNORM_SRGB:
    case DXGI_FORMAT_BC7_UNORM_SRGB:
        return DXGI_FORMAT_R8G8B8A8_UNORM_SRGB;

    case DXGI_FORMAT_BC4_TYPELESS:
    case DXGI_FORMAT_BC4_UNORM:
        return DXGI_FORMAT_R8_UNORM;

    case DXGI_FORMAT_BC4_SNORM:
        return DXGI_FORMAT_R8_SNORM;

    case DXGI_FORMAT_BC5_TYPELESS:
    case DXGI_FORMAT_BC5_UNORM:
        return DXGI_FORMAT_R8G8_UNORM;

    case DXGI_FORMAT_BC5_SNORM:
        return DXGI_FORMAT_R8G8_SNORM;

    case DXGI_FORMAT_BC6H_TYPELESS:
    case DXGI_FORMAT_BC6H_UF16:
    case DXGI_FORMAT_BC6H_SF16:
        // We could use DXGI_FORMAT_R32G32B32_FLOAT here since BC6H is always Alpha 1.0,
        // but this format is more supported by viewers
        return DXGI_FORMAT_R32G32B32A32_FLOAT;

    default:
        return DXGI_FORMAT_UNKNOWN;
    }
}


//-------------------------------------------------------------------------------------
static HRESULT _DecompressBC( _In_ const Image& cImage, _In_ const Image& result )
{
    if ( !cImage.pixels || !result.pixels )
        return E_POINTER;

    assert( cImage.width == result.width );
    assert( cImage.height == result.height );

    const DXGI_FORMAT format = result.format;
    size_t dbpp = BitsPerPixel( format );
    if ( !dbpp )
        return E_FAIL;

    if ( dbpp < 8 )
    {
        // We don't support decompressing to monochrome (DXGI_FORMAT_R1_UNORM)
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );
    }

    // Round to bytes
    dbpp = ( dbpp + 7 ) / 8;

    uint8_t *pDest = result.pixels;
    if ( !pDest )
        return E_POINTER;

    // Promote "typeless" BC formats
    DXGI_FORMAT cformat;
    switch( cImage.format )
    {
    case DXGI_FORMAT_BC1_TYPELESS:  cformat = DXGI_FORMAT_BC1_UNORM; break;
    case DXGI_FORMAT_BC2_TYPELESS:  cformat = DXGI_FORMAT_BC2_UNORM; break;
    case DXGI_FORMAT_BC3_TYPELESS:  cformat = DXGI_FORMAT_BC3_UNORM; break;
    case DXGI_FORMAT_BC4_TYPELESS:  cformat = DXGI_FORMAT_BC4_UNORM; break;
    case DXGI_FORMAT_BC5_TYPELESS:  cformat = DXGI_FORMAT_BC5_UNORM; break;
    case DXGI_FORMAT_BC6H_TYPELESS: cformat = DXGI_FORMAT_BC6H_UF16; break;
    case DXGI_FORMAT_BC7_TYPELESS:  cformat = DXGI_FORMAT_BC7_UNORM; break;
    default:                        cformat = cImage.format;         break;
    }

    // Determine BC format decoder
    BC_DECODE pfDecode;
    size_t sbpp;
    switch(cformat)
    {
    case DXGI_FORMAT_BC1_UNORM:
    case DXGI_FORMAT_BC1_UNORM_SRGB:    pfDecode = D3DXDecodeBC1;   sbpp = 8;   break;
    case DXGI_FORMAT_BC2_UNORM:
    case DXGI_FORMAT_BC2_UNORM_SRGB:    pfDecode = D3DXDecodeBC2;   sbpp = 16;  break;
    case DXGI_FORMAT_BC3_UNORM:
    case DXGI_FORMAT_BC3_UNORM_SRGB:    pfDecode = D3DXDecodeBC3;   sbpp = 16;  break;
    case DXGI_FORMAT_BC4_UNORM:         pfDecode = D3DXDecodeBC4U;  sbpp = 8;   break;
    case DXGI_FORMAT_BC4_SNORM:         pfDecode = D3DXDecodeBC4S;  sbpp = 8;   break;
    case DXGI_FORMAT_BC5_UNORM:         pfDecode = D3DXDecodeBC5U;  sbpp = 16;  break;
    case DXGI_FORMAT_BC5_SNORM:         pfDecode = D3DXDecodeBC5S;  sbpp = 16;  break;
    case DXGI_FORMAT_BC6H_UF16:         pfDecode = D3DXDecodeBC6HU; sbpp = 16;  break;
    case DXGI_FORMAT_BC6H_SF16:         pfDecode = D3DXDecodeBC6HS; sbpp = 16;  break;
    case DXGI_FORMAT_BC7_UNORM:
    case DXGI_FORMAT_BC7_UNORM_SRGB:    pfDecode = D3DXDecodeBC7;   sbpp = 16;  break;
    default:
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );
    }

    XMVECTOR temp[16];
    const uint8_t *pSrc = cImage.pixels;
    const size_t rowPitch = result.rowPitch;
    for( size_t h=0; h < cImage.height; h += 4 )
    {
        const uint8_t *sptr = pSrc;
        uint8_t* dptr = pDest;
        size_t ph = std::min<size_t>( 4, cImage.height - h );
        size_t w = 0;
        for( size_t count = 0; count < cImage.rowPitch; count += sbpp, w += 4 )
        {
            pfDecode( temp, sptr );
            _ConvertScanline( temp, 16, format, cformat, 0 );

            size_t pw = std::min<size_t>( 4, cImage.width - w );
            assert( pw > 0 && ph > 0 );

            if ( !_StoreScanline( dptr, rowPitch, format, &temp[0], pw ) )
                return E_FAIL;

            if ( ph > 1 )
            {
                if ( !_StoreScanline( dptr + rowPitch, rowPitch, format, &temp[4], pw ) )
                    return E_FAIL;

                if ( ph > 2 )
                {
                    if ( !_StoreScanline( dptr + rowPitch*2, rowPitch, format, &temp[8], pw ) )
                        return E_FAIL;

                    if ( ph > 3 )
                    {
                        if ( !_StoreScanline( dptr + rowPitch*3, rowPitch, format, &temp[12], pw ) )
                            return E_FAIL;
                    }
                }
            }

            sptr += sbpp;
            dptr += dbpp*4;
        }

        pSrc += cImage.rowPitch;
        pDest += rowPitch*4;
    }

    return S_OK;
}


//-------------------------------------------------------------------------------------
bool _IsAlphaAllOpaqueBC( _In_ const Image& cImage )
{
    if ( !cImage.pixels )
        return false;

    // Promote "typeless" BC formats
    DXGI_FORMAT cformat;
    switch( cImage.format )
    {
    case DXGI_FORMAT_BC1_TYPELESS:  cformat = DXGI_FORMAT_BC1_UNORM; break;
    case DXGI_FORMAT_BC2_TYPELESS:  cformat = DXGI_FORMAT_BC2_UNORM; break;
    case DXGI_FORMAT_BC3_TYPELESS:  cformat = DXGI_FORMAT_BC3_UNORM; break;
    case DXGI_FORMAT_BC7_TYPELESS:  cformat = DXGI_FORMAT_BC7_UNORM; break;
    default:                        cformat = cImage.format;         break;
    }

    // Determine BC format decoder
    BC_DECODE pfDecode;
    size_t sbpp;
    switch(cformat)
    {
    case DXGI_FORMAT_BC1_UNORM:
    case DXGI_FORMAT_BC1_UNORM_SRGB:    pfDecode = D3DXDecodeBC1;   sbpp = 8;   break;
    case DXGI_FORMAT_BC2_UNORM:
    case DXGI_FORMAT_BC2_UNORM_SRGB:    pfDecode = D3DXDecodeBC2;   sbpp = 16;  break;
    case DXGI_FORMAT_BC3_UNORM:
    case DXGI_FORMAT_BC3_UNORM_SRGB:    pfDecode = D3DXDecodeBC3;   sbpp = 16;  break;
    case DXGI_FORMAT_BC7_UNORM:
    case DXGI_FORMAT_BC7_UNORM_SRGB:    pfDecode = D3DXDecodeBC7;   sbpp = 16;  break;
    default:
        // BC4, BC5, and BC6 don't have alpha channels
        return false;
    }

    // Scan blocks for non-opaque alpha
    static const XMVECTORF32 threshold = { 0.99f, 0.99f, 0.99f, 0.99f };

    XMVECTOR temp[16];
    const uint8_t *pPixels = cImage.pixels;
    for( size_t h = 0; h < cImage.height; h += 4 )
    {
        const uint8_t *ptr = pPixels;
        size_t ph = std::min<size_t>( 4, cImage.height - h );
        size_t w = 0;
        for( size_t count = 0; count < cImage.rowPitch; count += sbpp, w += 4 )
        {
            pfDecode( temp, ptr );

            size_t pw = std::min<size_t>( 4, cImage.width - w );
            assert( pw > 0 && ph > 0 );

            if ( pw == 4 && ph == 4 )
            {
                // Full blocks
                for( size_t j = 0; j < 16; ++j )
                {
                    XMVECTOR alpha = XMVectorSplatW( temp[j] );
                    if ( XMVector4Less( alpha, threshold ) )
                        return false;
                }
            }
            else
            {
                // Handle partial blocks
                for( size_t y = 0; y < ph; ++y )
                {
                    for( size_t x = 0; x < pw; ++x )
                    {
                        XMVECTOR alpha = XMVectorSplatW( temp[ y * 4 + x ] );
                        if ( XMVector4Less( alpha, threshold ) )
                            return false;
                    }
                }
            }

            ptr += sbpp;
        }

        pPixels += cImage.rowPitch;
    }

    return true;
}


//=====================================================================================
// Entry-points
//=====================================================================================

//-------------------------------------------------------------------------------------
// Compression
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
HRESULT Compress( const Image& srcImage, DXGI_FORMAT format, DWORD compress, float alphaRef, ScratchImage& image )
{
    if ( IsCompressed(srcImage.format) || !IsCompressed(format) )
        return E_INVALIDARG;

    if ( IsTypeless(format)
         || IsTypeless(srcImage.format) || IsPlanar(srcImage.format) || IsPalettized(srcImage.format) )
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );

    // Create compressed image
    HRESULT hr = image.Initialize2D( format, srcImage.width, srcImage.height, 1, 1 );
    if ( FAILED(hr) )
        return hr;

    const Image *img = image.GetImage( 0, 0, 0 );
    if ( !img )
    {
        image.Release();
        return E_POINTER;
    }

    // Compress single image
    if (compress & TEX_COMPRESS_PARALLEL)
    {
#ifndef _OPENMP
        return E_NOTIMPL;
#else
        hr = _CompressBC_Parallel( srcImage, *img, _GetBCFlags( compress ), _GetSRGBFlags( compress ), alphaRef );
#endif // _OPENMP
    }
    else
    {
        hr = _CompressBC( srcImage, *img, _GetBCFlags( compress ), _GetSRGBFlags( compress ), alphaRef );
    }

    if ( FAILED(hr) )
        image.Release();

    return hr;
}

_Use_decl_annotations_
HRESULT Compress( const Image* srcImages, size_t nimages, const TexMetadata& metadata,
                  DXGI_FORMAT format, DWORD compress, float alphaRef, ScratchImage& cImages )
{
    if ( !srcImages || !nimages )
        return E_INVALIDARG;

    if ( IsCompressed(metadata.format) || !IsCompressed(format) )
        return E_INVALIDARG;

    if ( IsTypeless(format)
         || IsTypeless(metadata.format) || IsPlanar(metadata.format) || IsPalettized(metadata.format) )
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );

    cImages.Release();

    TexMetadata mdata2 = metadata;
    mdata2.format = format;
    HRESULT hr = cImages.Initialize( mdata2 );
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

    for( size_t index=0; index < nimages; ++index )
    {
        assert( dest[ index ].format == format );

        const Image& src = srcImages[ index ];

        if ( src.width != dest[ index ].width || src.height != dest[ index ].height )
        {
            cImages.Release();
            return E_FAIL;
        }

        if ( (compress & TEX_COMPRESS_PARALLEL) )
        {
#ifndef _OPENMP
            return E_NOTIMPL;
#else
            if ( compress & TEX_COMPRESS_PARALLEL )
            {
                hr = _CompressBC_Parallel( src, dest[ index ], _GetBCFlags( compress ), _GetSRGBFlags( compress ), alphaRef );
                if ( FAILED(hr) )
                {
                    cImages.Release();
                    return  hr;
                }
            }
#endif // _OPENMP
        }
        else
        {
            hr = _CompressBC( src, dest[ index ], _GetBCFlags( compress ), _GetSRGBFlags( compress ), alphaRef );
            if ( FAILED(hr) )
            {
                cImages.Release();
                return hr;
            }
        }
    }

    return S_OK;
}


//-------------------------------------------------------------------------------------
// Decompression
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
HRESULT Decompress( const Image& cImage, DXGI_FORMAT format, ScratchImage& image )
{
    if ( !IsCompressed(cImage.format) || IsCompressed(format) )
        return E_INVALIDARG;

    if ( format == DXGI_FORMAT_UNKNOWN )
    {
        // Pick a default decompressed format based on BC input format
        format = _DefaultDecompress( cImage.format );
        if ( format == DXGI_FORMAT_UNKNOWN )
        {
            // Input is not a compressed format
            return E_INVALIDARG;
        }
    }
    else
    {
        if ( !IsValid(format) )
            return E_INVALIDARG;

        if ( IsTypeless(format) || IsPlanar(format) || IsPalettized(format) )
            return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );
    }

    // Create decompressed image
    HRESULT hr = image.Initialize2D( format, cImage.width, cImage.height, 1, 1 );
    if ( FAILED(hr) )
        return hr;

    const Image *img = image.GetImage( 0, 0, 0 );
    if ( !img )
    {
        image.Release();
        return E_POINTER;
    }

    // Decompress single image
    hr = _DecompressBC( cImage, *img );
    if ( FAILED(hr) )
        image.Release();

    return hr;
}

_Use_decl_annotations_
HRESULT Decompress( const Image* cImages, size_t nimages, const TexMetadata& metadata,
                    DXGI_FORMAT format, ScratchImage& images )
{
    if ( !cImages || !nimages )
        return E_INVALIDARG;

    if ( !IsCompressed(metadata.format) || IsCompressed(format) )
        return E_INVALIDARG;

    if ( format == DXGI_FORMAT_UNKNOWN )
    {
        // Pick a default decompressed format based on BC input format
        format = _DefaultDecompress( cImages[0].format );
        if ( format == DXGI_FORMAT_UNKNOWN )
        {
            // Input is not a compressed format
            return E_FAIL;
        }
    }
    else
    {
        if ( !IsValid(format) )
            return E_INVALIDARG;

        if ( IsTypeless(format) || IsPlanar(format) || IsPalettized(format) )
            HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );
    }

    images.Release();

    TexMetadata mdata2 = metadata;
    mdata2.format = format;
    HRESULT hr = images.Initialize( mdata2 );
    if ( FAILED(hr) )
        return hr;

    if ( nimages != images.GetImageCount() )
    {
        images.Release();
        return E_FAIL;
    }

    const Image* dest = images.GetImages();
    if ( !dest )
    {
        images.Release();
        return E_POINTER;
    }

    for( size_t index=0; index < nimages; ++index )
    {
        assert( dest[ index ].format == format );

        const Image& src = cImages[ index ];
        if ( !IsCompressed( src.format ) )
        {
            images.Release();
            return E_FAIL;
        }

        if ( src.width != dest[ index ].width || src.height != dest[ index ].height )
        {
            images.Release();
            return E_FAIL;
        }

        hr = _DecompressBC( src, dest[ index ] );
        if ( FAILED(hr) )
        {
            images.Release();
            return hr;
        }
    }

    return S_OK;
}

}; // namespace
