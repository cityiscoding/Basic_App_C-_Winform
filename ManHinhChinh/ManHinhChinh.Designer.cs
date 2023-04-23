namespace ManHinhChinh
{
    partial class ManHinhChinh
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

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.btnCaculatorApp = new System.Windows.Forms.Button();
            this.SuspendLayout();
            // 
            // btnCaculatorApp
            // 
            this.btnCaculatorApp.Location = new System.Drawing.Point(406, 135);
            this.btnCaculatorApp.Name = "btnCaculatorApp";
            this.btnCaculatorApp.Size = new System.Drawing.Size(75, 23);
            this.btnCaculatorApp.TabIndex = 0;
            this.btnCaculatorApp.Text = "button1";
            this.btnCaculatorApp.UseVisualStyleBackColor = true;
            this.btnCaculatorApp.Click += new System.EventHandler(this.btnCaculatorApp_Click);
            // 
            // ManHinhChinh
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(8F, 16F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(800, 450);
            this.Controls.Add(this.btnCaculatorApp);
            this.Name = "ManHinhChinh";
            this.Text = "Form1";
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.Button btnCaculatorApp;
    }
}

