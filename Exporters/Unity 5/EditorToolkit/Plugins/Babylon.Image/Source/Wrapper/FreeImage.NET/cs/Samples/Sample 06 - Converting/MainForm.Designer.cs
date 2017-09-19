namespace Sample06
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
			this.picBox = new System.Windows.Forms.PictureBox();
			this.bExample01 = new System.Windows.Forms.Button();
			this.bOriginal = new System.Windows.Forms.Button();
			this.bExample02 = new System.Windows.Forms.Button();
			this.bExample03 = new System.Windows.Forms.Button();
			((System.ComponentModel.ISupportInitialize)(this.picBox)).BeginInit();
			this.SuspendLayout();
			// 
			// picBox
			// 
			this.picBox.BackColor = System.Drawing.Color.White;
			this.picBox.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
			this.picBox.Location = new System.Drawing.Point(12, 12);
			this.picBox.Name = "picBox";
			this.picBox.Size = new System.Drawing.Size(747, 465);
			this.picBox.TabIndex = 0;
			this.picBox.TabStop = false;
			// 
			// bExample01
			// 
			this.bExample01.Location = new System.Drawing.Point(93, 483);
			this.bExample01.Name = "bExample01";
			this.bExample01.Size = new System.Drawing.Size(88, 23);
			this.bExample01.TabIndex = 1;
			this.bExample01.Text = "Example 01";
			this.bExample01.UseVisualStyleBackColor = true;
			this.bExample01.Click += new System.EventHandler(this.bExample01_Click);
			// 
			// bOriginal
			// 
			this.bOriginal.Location = new System.Drawing.Point(12, 483);
			this.bOriginal.Name = "bOriginal";
			this.bOriginal.Size = new System.Drawing.Size(75, 23);
			this.bOriginal.TabIndex = 2;
			this.bOriginal.Text = "Original";
			this.bOriginal.UseVisualStyleBackColor = true;
			this.bOriginal.Click += new System.EventHandler(this.bOriginal_Click);
			// 
			// bExample02
			// 
			this.bExample02.Location = new System.Drawing.Point(187, 483);
			this.bExample02.Name = "bExample02";
			this.bExample02.Size = new System.Drawing.Size(88, 23);
			this.bExample02.TabIndex = 3;
			this.bExample02.Text = "Example 02";
			this.bExample02.UseVisualStyleBackColor = true;
			this.bExample02.Click += new System.EventHandler(this.bExample02_Click);
			// 
			// bExample03
			// 
			this.bExample03.Location = new System.Drawing.Point(281, 483);
			this.bExample03.Name = "bExample03";
			this.bExample03.Size = new System.Drawing.Size(88, 23);
			this.bExample03.TabIndex = 4;
			this.bExample03.Text = "Example 03";
			this.bExample03.UseVisualStyleBackColor = true;
			this.bExample03.Click += new System.EventHandler(this.bExample03_Click);
			// 
			// MainForm
			// 
			this.AutoScaleDimensions = new System.Drawing.SizeF(7F, 16F);
			this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
			this.ClientSize = new System.Drawing.Size(771, 518);
			this.Controls.Add(this.bExample03);
			this.Controls.Add(this.bExample02);
			this.Controls.Add(this.bOriginal);
			this.Controls.Add(this.bExample01);
			this.Controls.Add(this.picBox);
			this.Font = new System.Drawing.Font("Tahoma", 9.75F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
			this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
			this.Margin = new System.Windows.Forms.Padding(3, 4, 3, 4);
			this.MaximizeBox = false;
			this.MinimizeBox = false;
			this.Name = "MainForm";
			this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
			this.Text = "Sample06";
			((System.ComponentModel.ISupportInitialize)(this.picBox)).EndInit();
			this.ResumeLayout(false);

		}

		#endregion

		private System.Windows.Forms.PictureBox picBox;
		private System.Windows.Forms.Button bExample01;
		private System.Windows.Forms.Button bOriginal;
		private System.Windows.Forms.Button bExample02;
		private System.Windows.Forms.Button bExample03;
	}
}