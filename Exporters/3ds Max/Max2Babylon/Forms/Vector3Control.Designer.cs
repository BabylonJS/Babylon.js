namespace Max2Babylon
{
    partial class Vector3Control
    {
        /// <summary> 
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary> 
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Component Designer generated code

        /// <summary> 
        /// Required method for Designer support - do not modify 
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.label1 = new System.Windows.Forms.Label();
            this.nupX = new System.Windows.Forms.NumericUpDown();
            this.nupY = new System.Windows.Forms.NumericUpDown();
            this.label2 = new System.Windows.Forms.Label();
            this.nupZ = new System.Windows.Forms.NumericUpDown();
            this.label3 = new System.Windows.Forms.Label();
            ((System.ComponentModel.ISupportInitialize)(this.nupX)).BeginInit();
            ((System.ComponentModel.ISupportInitialize)(this.nupY)).BeginInit();
            ((System.ComponentModel.ISupportInitialize)(this.nupZ)).BeginInit();
            this.SuspendLayout();
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Location = new System.Drawing.Point(4, 6);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(20, 13);
            this.label1.TabIndex = 0;
            this.label1.Text = "X: ";
            // 
            // nupX
            // 
            this.nupX.DecimalPlaces = 2;
            this.nupX.Location = new System.Drawing.Point(30, 4);
            this.nupX.Maximum = new decimal(new int[] {
            1000000,
            0,
            0,
            0});
            this.nupX.Minimum = new decimal(new int[] {
            1000000,
            0,
            0,
            -2147483648});
            this.nupX.Name = "nupX";
            this.nupX.Size = new System.Drawing.Size(57, 20);
            this.nupX.TabIndex = 1;
            // 
            // nupY
            // 
            this.nupY.DecimalPlaces = 2;
            this.nupY.Location = new System.Drawing.Point(123, 4);
            this.nupY.Maximum = new decimal(new int[] {
            1000000,
            0,
            0,
            0});
            this.nupY.Minimum = new decimal(new int[] {
            1000000,
            0,
            0,
            -2147483648});
            this.nupY.Name = "nupY";
            this.nupY.Size = new System.Drawing.Size(57, 20);
            this.nupY.TabIndex = 3;
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Location = new System.Drawing.Point(97, 6);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(17, 13);
            this.label2.TabIndex = 2;
            this.label2.Text = "Y:";
            // 
            // nupZ
            // 
            this.nupZ.DecimalPlaces = 2;
            this.nupZ.Location = new System.Drawing.Point(216, 4);
            this.nupZ.Maximum = new decimal(new int[] {
            1000000,
            0,
            0,
            0});
            this.nupZ.Minimum = new decimal(new int[] {
            1000000,
            0,
            0,
            -2147483648});
            this.nupZ.Name = "nupZ";
            this.nupZ.Size = new System.Drawing.Size(57, 20);
            this.nupZ.TabIndex = 5;
            // 
            // label3
            // 
            this.label3.AutoSize = true;
            this.label3.Location = new System.Drawing.Point(190, 6);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(17, 13);
            this.label3.TabIndex = 4;
            this.label3.Text = "Z:";
            // 
            // Vector3Control
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.Controls.Add(this.nupZ);
            this.Controls.Add(this.label3);
            this.Controls.Add(this.nupY);
            this.Controls.Add(this.label2);
            this.Controls.Add(this.nupX);
            this.Controls.Add(this.label1);
            this.Name = "Vector3Control";
            this.Size = new System.Drawing.Size(294, 28);
            ((System.ComponentModel.ISupportInitialize)(this.nupX)).EndInit();
            ((System.ComponentModel.ISupportInitialize)(this.nupY)).EndInit();
            ((System.ComponentModel.ISupportInitialize)(this.nupZ)).EndInit();
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.NumericUpDown nupX;
        private System.Windows.Forms.NumericUpDown nupY;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.NumericUpDown nupZ;
        private System.Windows.Forms.Label label3;
    }
}
