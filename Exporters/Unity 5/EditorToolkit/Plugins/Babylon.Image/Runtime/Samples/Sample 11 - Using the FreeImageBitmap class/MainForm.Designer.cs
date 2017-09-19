namespace Sample11
{
	partial class MainForm
	{
		/// <summary>
		/// Erforderliche Designervariable.
		/// </summary>
		private System.ComponentModel.IContainer components = null;

		/// <summary>
		/// Verwendete Ressourcen bereinigen.
		/// </summary>
		/// <param name="disposing">True, wenn verwaltete Ressourcen gelöscht werden sollen; andernfalls False.</param>
		protected override void Dispose(bool disposing)
		{
			if (disposing && (components != null))
			{
				components.Dispose();
			}
			base.Dispose(disposing);
		}

		#region Vom Windows Form-Designer generierter Code

		/// <summary>
		/// Erforderliche Methode für die Designerunterstützung.
		/// Der Inhalt der Methode darf nicht mit dem Code-Editor geändert werden.
		/// </summary>
		private void InitializeComponent()
		{
			this.pictureBox = new System.Windows.Forms.PictureBox();
			this.bLoadImage = new System.Windows.Forms.Button();
			this.bSaveImage = new System.Windows.Forms.Button();
			this.ofd = new System.Windows.Forms.OpenFileDialog();
			this.sfd = new System.Windows.Forms.SaveFileDialog();
			this.lWidth = new System.Windows.Forms.Label();
			this.lHeight = new System.Windows.Forms.Label();
			this.lBpp = new System.Windows.Forms.Label();
			this.lMetadataCount = new System.Windows.Forms.Label();
			this.bGreyscale = new System.Windows.Forms.Button();
			this.cbSelectFrame = new System.Windows.Forms.ComboBox();
			this.lComment = new System.Windows.Forms.Label();
			this.bAdjustGamma = new System.Windows.Forms.Button();
			this.vGamma = new System.Windows.Forms.NumericUpDown();
			this.bRedChannelOnly = new System.Windows.Forms.Button();
			this.bBlueChannel = new System.Windows.Forms.Button();
			this.bGreenChannel = new System.Windows.Forms.Button();
			this.bAllChannels = new System.Windows.Forms.Button();
			this.lSelectFrame = new System.Windows.Forms.Label();
			this.lImageFormat = new System.Windows.Forms.Label();
			this.bRotate = new System.Windows.Forms.Button();
			this.vRotate = new System.Windows.Forms.TrackBar();
			this.lRotate = new System.Windows.Forms.Label();
			this.lColors = new System.Windows.Forms.Label();
			this.nShowMetadata = new System.Windows.Forms.Button();
			((System.ComponentModel.ISupportInitialize)(this.pictureBox)).BeginInit();
			((System.ComponentModel.ISupportInitialize)(this.vGamma)).BeginInit();
			((System.ComponentModel.ISupportInitialize)(this.vRotate)).BeginInit();
			this.SuspendLayout();
			// 
			// pictureBox
			// 
			this.pictureBox.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
			this.pictureBox.Location = new System.Drawing.Point(14, 15);
			this.pictureBox.Margin = new System.Windows.Forms.Padding(4);
			this.pictureBox.Name = "pictureBox";
			this.pictureBox.Size = new System.Drawing.Size(542, 395);
			this.pictureBox.SizeMode = System.Windows.Forms.PictureBoxSizeMode.StretchImage;
			this.pictureBox.TabIndex = 0;
			this.pictureBox.TabStop = false;
			// 
			// bLoadImage
			// 
			this.bLoadImage.Location = new System.Drawing.Point(564, 15);
			this.bLoadImage.Margin = new System.Windows.Forms.Padding(4);
			this.bLoadImage.Name = "bLoadImage";
			this.bLoadImage.Size = new System.Drawing.Size(125, 28);
			this.bLoadImage.TabIndex = 1;
			this.bLoadImage.Text = "Load image";
			this.bLoadImage.UseVisualStyleBackColor = true;
			this.bLoadImage.Click += new System.EventHandler(this.bLoadImage_Click);
			// 
			// bSaveImage
			// 
			this.bSaveImage.Location = new System.Drawing.Point(564, 51);
			this.bSaveImage.Margin = new System.Windows.Forms.Padding(4);
			this.bSaveImage.Name = "bSaveImage";
			this.bSaveImage.Size = new System.Drawing.Size(125, 28);
			this.bSaveImage.TabIndex = 2;
			this.bSaveImage.Text = "Save image";
			this.bSaveImage.UseVisualStyleBackColor = true;
			this.bSaveImage.Click += new System.EventHandler(this.bSaveImage_Click);
			// 
			// ofd
			// 
			this.ofd.AddExtension = false;
			this.ofd.AutoUpgradeEnabled = false;
			this.ofd.Filter = "All files|*.*";
			this.ofd.RestoreDirectory = true;
			this.ofd.SupportMultiDottedExtensions = true;
			// 
			// sfd
			// 
			this.sfd.AddExtension = false;
			this.sfd.Filter = "All files|*.*";
			this.sfd.RestoreDirectory = true;
			this.sfd.SupportMultiDottedExtensions = true;
			// 
			// lWidth
			// 
			this.lWidth.AutoSize = true;
			this.lWidth.Location = new System.Drawing.Point(563, 350);
			this.lWidth.Name = "lWidth";
			this.lWidth.Size = new System.Drawing.Size(57, 16);
			this.lWidth.TabIndex = 6;
			this.lWidth.Text = "Width: 0";
			// 
			// lHeight
			// 
			this.lHeight.AutoSize = true;
			this.lHeight.Location = new System.Drawing.Point(649, 350);
			this.lHeight.Name = "lHeight";
			this.lHeight.Size = new System.Drawing.Size(60, 16);
			this.lHeight.TabIndex = 7;
			this.lHeight.Text = "Height: 0";
			// 
			// lBpp
			// 
			this.lBpp.AutoSize = true;
			this.lBpp.Location = new System.Drawing.Point(740, 350);
			this.lBpp.Name = "lBpp";
			this.lBpp.Size = new System.Drawing.Size(45, 16);
			this.lBpp.TabIndex = 8;
			this.lBpp.Text = "Bpp: 0";
			// 
			// lMetadataCount
			// 
			this.lMetadataCount.AutoSize = true;
			this.lMetadataCount.Location = new System.Drawing.Point(809, 350);
			this.lMetadataCount.Name = "lMetadataCount";
			this.lMetadataCount.Size = new System.Drawing.Size(77, 16);
			this.lMetadataCount.TabIndex = 9;
			this.lMetadataCount.Text = "Metadata: 0";
			// 
			// bGreyscale
			// 
			this.bGreyscale.Location = new System.Drawing.Point(564, 121);
			this.bGreyscale.Name = "bGreyscale";
			this.bGreyscale.Size = new System.Drawing.Size(125, 28);
			this.bGreyscale.TabIndex = 10;
			this.bGreyscale.Text = "Conv to greyscale";
			this.bGreyscale.UseVisualStyleBackColor = true;
			this.bGreyscale.Click += new System.EventHandler(this.bGreyscale_Click);
			// 
			// cbSelectFrame
			// 
			this.cbSelectFrame.FormattingEnabled = true;
			this.cbSelectFrame.Location = new System.Drawing.Point(695, 156);
			this.cbSelectFrame.Name = "cbSelectFrame";
			this.cbSelectFrame.Size = new System.Drawing.Size(121, 24);
			this.cbSelectFrame.TabIndex = 11;
			this.cbSelectFrame.SelectedIndexChanged += new System.EventHandler(this.comboBox1_SelectedIndexChanged);
			// 
			// lComment
			// 
			this.lComment.AutoSize = true;
			this.lComment.Location = new System.Drawing.Point(563, 373);
			this.lComment.Name = "lComment";
			this.lComment.Size = new System.Drawing.Size(107, 16);
			this.lComment.TabIndex = 12;
			this.lComment.Text = "Image-comment:";
			// 
			// bAdjustGamma
			// 
			this.bAdjustGamma.Location = new System.Drawing.Point(564, 185);
			this.bAdjustGamma.Name = "bAdjustGamma";
			this.bAdjustGamma.Size = new System.Drawing.Size(125, 28);
			this.bAdjustGamma.TabIndex = 13;
			this.bAdjustGamma.Text = "Adjust gamma";
			this.bAdjustGamma.UseVisualStyleBackColor = true;
			this.bAdjustGamma.Click += new System.EventHandler(this.bAdjustGamma_Click);
			// 
			// vGamma
			// 
			this.vGamma.DecimalPlaces = 2;
			this.vGamma.Increment = new decimal(new int[] {
            0,
            0,
            0,
            0});
			this.vGamma.Location = new System.Drawing.Point(695, 189);
			this.vGamma.Maximum = new decimal(new int[] {
            2,
            0,
            0,
            0});
			this.vGamma.Name = "vGamma";
			this.vGamma.Size = new System.Drawing.Size(121, 23);
			this.vGamma.TabIndex = 14;
			// 
			// bRedChannelOnly
			// 
			this.bRedChannelOnly.Location = new System.Drawing.Point(564, 219);
			this.bRedChannelOnly.Name = "bRedChannelOnly";
			this.bRedChannelOnly.Size = new System.Drawing.Size(125, 28);
			this.bRedChannelOnly.TabIndex = 15;
			this.bRedChannelOnly.Text = "Red channel";
			this.bRedChannelOnly.UseVisualStyleBackColor = true;
			this.bRedChannelOnly.Click += new System.EventHandler(this.bRedChannelOnly_Click);
			// 
			// bBlueChannel
			// 
			this.bBlueChannel.Location = new System.Drawing.Point(564, 287);
			this.bBlueChannel.Name = "bBlueChannel";
			this.bBlueChannel.Size = new System.Drawing.Size(125, 28);
			this.bBlueChannel.TabIndex = 16;
			this.bBlueChannel.Text = "Blue channel";
			this.bBlueChannel.UseVisualStyleBackColor = true;
			this.bBlueChannel.Click += new System.EventHandler(this.bBlueChannel_Click);
			// 
			// bGreenChannel
			// 
			this.bGreenChannel.Location = new System.Drawing.Point(564, 253);
			this.bGreenChannel.Name = "bGreenChannel";
			this.bGreenChannel.Size = new System.Drawing.Size(125, 28);
			this.bGreenChannel.TabIndex = 17;
			this.bGreenChannel.Text = "Green channel";
			this.bGreenChannel.UseVisualStyleBackColor = true;
			this.bGreenChannel.Click += new System.EventHandler(this.bGreenChannel_Click);
			// 
			// bAllChannels
			// 
			this.bAllChannels.Location = new System.Drawing.Point(563, 321);
			this.bAllChannels.Name = "bAllChannels";
			this.bAllChannels.Size = new System.Drawing.Size(126, 28);
			this.bAllChannels.TabIndex = 18;
			this.bAllChannels.Text = "All channels";
			this.bAllChannels.UseVisualStyleBackColor = true;
			this.bAllChannels.Click += new System.EventHandler(this.bAllChannels_Click);
			// 
			// lSelectFrame
			// 
			this.lSelectFrame.AutoSize = true;
			this.lSelectFrame.Location = new System.Drawing.Point(563, 159);
			this.lSelectFrame.Name = "lSelectFrame";
			this.lSelectFrame.Size = new System.Drawing.Size(86, 16);
			this.lSelectFrame.TabIndex = 19;
			this.lSelectFrame.Text = "Select frame:";
			// 
			// lImageFormat
			// 
			this.lImageFormat.AutoSize = true;
			this.lImageFormat.Location = new System.Drawing.Point(563, 395);
			this.lImageFormat.Name = "lImageFormat";
			this.lImageFormat.Size = new System.Drawing.Size(92, 16);
			this.lImageFormat.TabIndex = 20;
			this.lImageFormat.Text = "Image-format:";
			// 
			// bRotate
			// 
			this.bRotate.Location = new System.Drawing.Point(564, 86);
			this.bRotate.Name = "bRotate";
			this.bRotate.Size = new System.Drawing.Size(125, 28);
			this.bRotate.TabIndex = 21;
			this.bRotate.Text = "Rotate";
			this.bRotate.UseVisualStyleBackColor = true;
			this.bRotate.Click += new System.EventHandler(this.bRotate_Click);
			// 
			// vRotate
			// 
			this.vRotate.Location = new System.Drawing.Point(695, 80);
			this.vRotate.Maximum = 360;
			this.vRotate.Name = "vRotate";
			this.vRotate.Size = new System.Drawing.Size(170, 45);
			this.vRotate.TabIndex = 22;
			this.vRotate.TickFrequency = 10;
			this.vRotate.TickStyle = System.Windows.Forms.TickStyle.Both;
			this.vRotate.Scroll += new System.EventHandler(this.vRotate_Scroll);
			// 
			// lRotate
			// 
			this.lRotate.AutoSize = true;
			this.lRotate.Location = new System.Drawing.Point(871, 92);
			this.lRotate.Name = "lRotate";
			this.lRotate.Size = new System.Drawing.Size(15, 16);
			this.lRotate.TabIndex = 23;
			this.lRotate.Text = "0";
			// 
			// lColors
			// 
			this.lColors.AutoSize = true;
			this.lColors.Location = new System.Drawing.Point(740, 394);
			this.lColors.Name = "lColors";
			this.lColors.Size = new System.Drawing.Size(60, 16);
			this.lColors.TabIndex = 24;
			this.lColors.Text = "Colors: 0";
			// 
			// nShowMetadata
			// 
			this.nShowMetadata.Location = new System.Drawing.Point(696, 15);
			this.nShowMetadata.Name = "nShowMetadata";
			this.nShowMetadata.Size = new System.Drawing.Size(125, 28);
			this.nShowMetadata.TabIndex = 25;
			this.nShowMetadata.Text = "Show metadata";
			this.nShowMetadata.UseVisualStyleBackColor = true;
			this.nShowMetadata.Click += new System.EventHandler(this.nShowMetadata_Click);
			// 
			// MainForm
			// 
			this.AutoScaleDimensions = new System.Drawing.SizeF(7F, 16F);
			this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
			this.ClientSize = new System.Drawing.Size(908, 423);
			this.Controls.Add(this.nShowMetadata);
			this.Controls.Add(this.lColors);
			this.Controls.Add(this.lRotate);
			this.Controls.Add(this.vRotate);
			this.Controls.Add(this.bRotate);
			this.Controls.Add(this.lImageFormat);
			this.Controls.Add(this.lSelectFrame);
			this.Controls.Add(this.bAllChannels);
			this.Controls.Add(this.bGreenChannel);
			this.Controls.Add(this.bBlueChannel);
			this.Controls.Add(this.bRedChannelOnly);
			this.Controls.Add(this.vGamma);
			this.Controls.Add(this.bAdjustGamma);
			this.Controls.Add(this.lComment);
			this.Controls.Add(this.cbSelectFrame);
			this.Controls.Add(this.bGreyscale);
			this.Controls.Add(this.lMetadataCount);
			this.Controls.Add(this.lBpp);
			this.Controls.Add(this.lHeight);
			this.Controls.Add(this.lWidth);
			this.Controls.Add(this.bSaveImage);
			this.Controls.Add(this.bLoadImage);
			this.Controls.Add(this.pictureBox);
			this.DoubleBuffered = true;
			this.Font = new System.Drawing.Font("Tahoma", 9.75F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
			this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
			this.Margin = new System.Windows.Forms.Padding(4);
			this.MaximizeBox = false;
			this.MinimizeBox = false;
			this.Name = "MainForm";
			this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
			this.Text = "Sample 11";
			((System.ComponentModel.ISupportInitialize)(this.pictureBox)).EndInit();
			((System.ComponentModel.ISupportInitialize)(this.vGamma)).EndInit();
			((System.ComponentModel.ISupportInitialize)(this.vRotate)).EndInit();
			this.ResumeLayout(false);
			this.PerformLayout();

		}

		#endregion

		private System.Windows.Forms.PictureBox pictureBox;
		private System.Windows.Forms.Button bLoadImage;
		private System.Windows.Forms.Button bSaveImage;
		private System.Windows.Forms.OpenFileDialog ofd;
		private System.Windows.Forms.SaveFileDialog sfd;
		private System.Windows.Forms.Label lWidth;
		private System.Windows.Forms.Label lHeight;
		private System.Windows.Forms.Label lBpp;
		private System.Windows.Forms.Label lMetadataCount;
		private System.Windows.Forms.Button bGreyscale;
		private System.Windows.Forms.ComboBox cbSelectFrame;
		private System.Windows.Forms.Label lComment;
		private System.Windows.Forms.Button bAdjustGamma;
		private System.Windows.Forms.NumericUpDown vGamma;
		private System.Windows.Forms.Button bRedChannelOnly;
		private System.Windows.Forms.Button bBlueChannel;
		private System.Windows.Forms.Button bGreenChannel;
		private System.Windows.Forms.Button bAllChannels;
		private System.Windows.Forms.Label lSelectFrame;
		private System.Windows.Forms.Label lImageFormat;
		private System.Windows.Forms.Button bRotate;
		private System.Windows.Forms.TrackBar vRotate;
		private System.Windows.Forms.Label lRotate;
		private System.Windows.Forms.Label lColors;
		private System.Windows.Forms.Button nShowMetadata;
	}
}

