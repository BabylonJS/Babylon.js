#include <vga.h>
#include "FreeImage.h"

int main(void)
{
	FIBITMAP *dib,*ptr;
	vga_modeinfo *inf;
	int length,height,bpp,y;

	// initialize the FreeImage library
	FreeImage_Initialise();

	dib = FreeImage_Load(FIF_PNG, "freeimage.png", PNG_DEFAULT);

	vga_init();
	vga_setmode(vga_getdefaultmode());

	inf = vga_getmodeinfo(vga_getcurrentmode());

	switch(inf->colors) {
	default:
		printf("Must be at least 256 color mode!\n");
		return;

	case 1 << 8:
		bpp = 8;
		break;

	case 1 << 15:
		bpp = 15;
		break;

	case 1 << 16:
		bpp = 16;
		break;

	case 1 << 24:
		if( inf->bytesperpixel == 3 ) {
			bpp = 24;
		} else {
			bpp = 32;
		}
		break;
	}

	if(FreeImage_GetBPP(dib) != bpp) {
		switch(bpp) {
		case 8:
			ptr = FreeImage_ConvertTo8Bits(dib);
			break;

		case 15:
			ptr = FreeImage_ConvertTo16Bits555(dib);
			break;

		case 16:
			ptr = FreeImage_ConvertTo16Bits565(dib);
			break;

		case 24:
			ptr = FreeImage_ConvertTo24Bits(dib);
			break;

		default:
		case 32:
			ptr = FreeImage_ConvertTo32Bits(dib);
			break;
		}

		FreeImage_Unload(dib);
		dib = ptr;
	}

	length = FreeImage_GetWidth(dib);
	if( inf->width < length ) {
		length = inf->width;
	}
	height = FreeImage_GetHeight(dib);
	if( inf->height < height ) {
		height = inf->height;
	}

	for(y = 0; y < height; y++) {
		vga_drawscansegment(FreeImage_GetScanLine(dib, y), 0, y, length);
	}

	FreeImage_Unload(dib);

	vga_getch();
	vga_setmode(TEXT);

	// release the FreeImage library
	FreeImage_DeInitialise();

	return 0;
}
