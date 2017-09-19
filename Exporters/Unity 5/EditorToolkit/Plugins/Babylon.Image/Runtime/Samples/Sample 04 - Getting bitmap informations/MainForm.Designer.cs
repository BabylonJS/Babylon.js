namespace Sample04
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
			this.ofd = new System.Windows.Forms.OpenFileDialog();
			this.bOpenFile = new System.Windows.Forms.Button();
			this.lWidth = new System.Windows.Forms.Label();
			this.lHeight = new System.Windows.Forms.Label();
			this.lBPP = new System.Windows.Forms.Label();
			this.lRedMask = new System.Windows.Forms.Label();
			this.lGreenMask = new System.Windows.Forms.Label();
			this.lBlueMask = new System.Windows.Forms.Label();
			this.lImageType = new System.Windows.Forms.Label();
			this.lDPIY = new System.Windows.Forms.Label();
			this.lDPIX = new System.Windows.Forms.Label();
			this.lFormat = new System.Windows.Forms.Label();
			this.lHeader = new System.Windows.Forms.Label();
			this.SuspendLayout();
			// 
			// ofd
			// 
			this.ofd.Filter = "All files (*.*)|*.*";
			// 
			// bOpenFile
			// 
			this.bOpenFile.Location = new System.Drawing.Point(12, 358);
			this.bOpenFile.Name = "bOpenFile";
			this.bOpenFile.Size = new System.Drawing.Size(75, 23);
			this.bOpenFile.TabIndex = 4;
			this.bOpenFile.Text = "Open file";
			this.bOpenFile.UseVisualStyleBackColor = true;
			this.bOpenFile.Click += new System.EventHandler(this.bOpenFile_Click);
			// 
			// lWidth
			// 
			this.lWidth.AutoSize = true;
			this.lWidth.Location = new System.Drawing.Point(9, 51);
			this.lWidth.Name = "lWidth";
			this.lWidth.Size = new System.Drawing.Size(46, 16);
			this.lWidth.TabIndex = 0;
			this.lWidth.Text = "Width:";
			// 
			// lHeight
			// 
			this.lHeight.AutoSize = true;
			this.lHeight.Location = new System.Drawing.Point(9, 76);
			this.lHeight.Name = "lHeight";
			this.lHeight.Size = new System.Drawing.Size(53, 16);
			this.lHeight.TabIndex = 1;
			this.lHeight.Text = "Height: ";
			// 
			// lBPP
			// 
			this.lBPP.AutoSize = true;
			this.lBPP.Location = new System.Drawing.Point(9, 101);
			this.lBPP.Name = "lBPP";
			this.lBPP.Size = new System.Drawing.Size(80, 16);
			this.lBPP.TabIndex = 2;
			this.lBPP.Text = "Color Depth:";
			// 
			// lRedMask
			// 
			this.lRedMask.AutoSize = true;
			this.lRedMask.Location = new System.Drawing.Point(9, 129);
			this.lRedMask.Name = "lRedMask";
			this.lRedMask.Size = new System.Drawing.Size(68, 16);
			this.lRedMask.TabIndex = 3;
			this.lRedMask.Text = "Red Mask:";
			// 
			// lGreenMask
			// 
			this.lGreenMask.AutoSize = true;
			this.lGreenMask.Location = new System.Drawing.Point(9, 188);
			this.lGreenMask.Name = "lGreenMask";
			this.lGreenMask.Size = new System.Drawing.Size(80, 16);
			this.lGreenMask.TabIndex = 5;
			this.lGreenMask.Text = "Green Mask:";
			// 
			// lBlueMask
			// 
			this.lBlueMask.AutoSize = true;
			this.lBlueMask.Location = new System.Drawing.Point(9, 158);
			this.lBlueMask.Name = "lBlueMask";
			this.lBlueMask.Size = new System.Drawing.Size(70, 16);
			this.lBlueMask.TabIndex = 6;
			this.lBlueMask.Text = "Blue Mask:";
			// 
			// lImageType
			// 
			this.lImageType.AutoSize = true;
			this.lImageType.Location = new System.Drawing.Point(9, 215);
			this.lImageType.Name = "lImageType";
			this.lImageType.Size = new System.Drawing.Size(81, 16);
			this.lImageType.TabIndex = 7;
			this.lImageType.Text = "Image Type:";
			// 
			// lDPIY
			// 
			this.lDPIY.AutoSize = true;
			this.lDPIY.Location = new System.Drawing.Point(9, 244);
			this.lDPIY.Name = "lDPIY";
			this.lDPIY.Size = new System.Drawing.Size(43, 16);
			this.lDPIY.TabIndex = 8;
			this.lDPIY.Text = "DPI Y:";
			// 
			// lDPIX
			// 
			this.lDPIX.AutoSize = true;
			this.lDPIX.Location = new System.Drawing.Point(9, 273);
			this.lDPIX.Name = "lDPIX";
			this.lDPIX.Size = new System.Drawing.Size(44, 16);
			this.lDPIX.TabIndex = 9;
			this.lDPIX.Text = "DPI X:";
			// 
			// lFormat
			// 
			this.lFormat.AutoSize = true;
			this.lFormat.Location = new System.Drawing.Point(9, 302);
			this.lFormat.Name = "lFormat";
			this.lFormat.Size = new System.Drawing.Size(78, 16);
			this.lFormat.TabIndex = 10;
			this.lFormat.Text = "File Format:";
			// 
			// lHeader
			// 
			this.lHeader.AutoSize = true;
			this.lHeader.Location = new System.Drawing.Point(117, 19);
			this.lHeader.Name = "lHeader";
			this.lHeader.Size = new System.Drawing.Size(162, 16);
			this.lHeader.TabIndex = 11;
			this.lHeader.Text = "Bitmap-Information Viewer";
			// 
			// MainForm
			// 
			this.AutoScaleDimensions = new System.Drawing.SizeF(7F, 16F);
			this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
			this.ClientSize = new System.Drawing.Size(400, 393);
			this.Controls.Add(this.lHeader);
			this.Controls.Add(this.lFormat);
			this.Controls.Add(this.lDPIX);
			this.Controls.Add(this.lDPIY);
			this.Controls.Add(this.lImageType);
			this.Controls.Add(this.lBlueMask);
			this.Controls.Add(this.lGreenMask);
			this.Controls.Add(this.bOpenFile);
			this.Controls.Add(this.lRedMask);
			this.Controls.Add(this.lBPP);
			this.Controls.Add(this.lHeight);
			this.Controls.Add(this.lWidth);
			this.Font = new System.Drawing.Font("Tahoma", 9.75F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
			this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
			this.Margin = new System.Windows.Forms.Padding(3, 4, 3, 4);
			this.MaximizeBox = false;
			this.MinimizeBox = false;
			this.Name = "MainForm";
			this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
			this.Text = "Sample04";
			this.ResumeLayout(false);
			this.PerformLayout();

		}

		#endregion

		private System.Windows.Forms.OpenFileDialog ofd;
		private System.Windows.Forms.Button bOpenFile;
		private System.Windows.Forms.Label lWidth;
		private System.Windows.Forms.Label lHeight;
		private System.Windows.Forms.Label lBPP;
		private System.Windows.Forms.Label lRedMask;
		private System.Windows.Forms.Label lGreenMask;
		private System.Windows.Forms.Label lBlueMask;
		private System.Windows.Forms.Label lImageType;
		private System.Windows.Forms.Label lDPIY;
		private System.Windows.Forms.Label lDPIX;
		private System.Windows.Forms.Label lFormat;
		private System.Windows.Forms.Label lHeader;
	}
}