#include <gtk/gtk.h>
#include <FreeImage.h>
#include <string.h>

void destroy(GtkWidget * widget, gpointer data) {
	gtk_main_quit();
}

int main(int argc, char *argv[])
{
	GtkWidget *window, *imagebox;
	GdkVisual *visual;
	GdkImage *image;
	FIBITMAP *dib;
	int y;

	// initialize the FreeImage library
	FreeImage_Initialise(TRUE);

	dib = FreeImage_Load(FIF_PNG, "freeimage.png", PNG_DEFAULT);

	gtk_init(&argc, &argv);

	window = gtk_window_new(GTK_WINDOW_TOPLEVEL);

	gtk_signal_connect(GTK_OBJECT(window), "destroy",
				GTK_SIGNAL_FUNC(destroy), NULL);

	visual = gdk_visual_get_system();

	image = gdk_image_new(GDK_IMAGE_NORMAL,visual,
		FreeImage_GetWidth(dib),FreeImage_GetHeight(dib));

	g_print("picture: %d bpp\n"
		"system:  %d bpp   byteorder: %d\n"
		"  redbits: %d   greenbits: %d   bluebits: %d\n"
		"image:   %d bpp   %d bytes/pixel\n",
		FreeImage_GetBPP(dib),
		visual->depth,visual->byte_order,
		visual->red_prec,visual->green_prec,visual->blue_prec,
		image->depth,image->bpp );

	if (FreeImage_GetBPP(dib) != (image->bpp << 3)) {
		FIBITMAP *ptr;

		switch (image->bpp) {
			case 1:
				ptr = FreeImage_ConvertTo8Bits(dib);
				break;

			case 2:
				if (image->depth == 15) {
					ptr = FreeImage_ConvertTo16Bits555(dib);
				} else {
					ptr = FreeImage_ConvertTo16Bits565(dib);
				}

				break;
			case 3:
				ptr = FreeImage_ConvertTo24Bits(dib);
				break;

			default:
			case 4:
				ptr = FreeImage_ConvertTo32Bits(dib);
				break;
		}

		FreeImage_Unload(dib);
		dib = ptr;
	}

//makes it upside down :(
//	memcpy(image->mem, FreeImage_GetBits(dib), image->bpl * image->height);

	BYTE *ptr = FreeImage_GetBits(dib);

	for (y = 0; y < image->height; y++) {
		memcpy(image->mem + (y * image->bpl),
			ptr + ((image->height - y - 1) * image->bpl),
			image->bpl);
	}

	FreeImage_Unload(dib);

	imagebox = gtk_image_new_from_image(image, NULL);
	gtk_container_add(GTK_CONTAINER(window), imagebox);

	gtk_widget_show(imagebox);
	gtk_widget_show(window);

	gtk_main();

	// release the FreeImage library
	FreeImage_DeInitialise();

	return 0;
}

 	  	 
