using CalculatorApp;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using static System.Windows.Forms.VisualStyles.VisualStyleElement;

namespace CaculatorApp
{
    public partial class frmDangNhap : Form
    {
        public frmDangNhap()
        {
            InitializeComponent();
        }

        private void frmDangNhap_FormClosing(object sender, FormClosingEventArgs e)
        {
            Program.ExitApplication();
        }

        private void btnDangNhap_Click(object sender, EventArgs e)
        {
            string TenDangNhap = txtTenDangNhap.Text.Trim();
            string MatKhau = txtMatKhau.Text.Trim();
            bool result = XL_DangNhap.DangNhap(TenDangNhap, MatKhau);
            if (result)
            {
                this.Hide();
                frmManHinhChinh mhc = new frmManHinhChinh();
                mhc.Show();
            }
        }

        private void btnDangKyNgay_Click(object sender, EventArgs e)
        {
            frmDangKy fdk = new frmDangKy();
            this.Hide();
            fdk.Show();
        }

        private void btnQuenMatKhau_Click(object sender, EventArgs e)
        {
            frmQuenMatKhau fqmk = new frmQuenMatKhau();
            this.Hide();
            fqmk.Show();
        }

        private void frmDangNhap_Load(object sender, EventArgs e)
        {
            this.KeyPreview = true;
        }

        private void frmDangNhap_KeyDown_ENTER(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Enter)
            {
                    btnDangNhap_Click(sender, e);
            }
        }

        private void frmDangNhap_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)Keys.Enter)
            {
                e.Handled = true;
            }
        }
    }
}
