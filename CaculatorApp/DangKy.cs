using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Windows.Forms;
using static System.Windows.Forms.VisualStyles.VisualStyleElement.StartPanel;

namespace CaculatorApp
{
    public partial class frmDangKy : Form
    {
        public frmDangKy()
        {
            InitializeComponent();
        }
        private void btnDangKy_Click_1(object sender, EventArgs e)
        {
            // Lấy thông tin từ các textbox
            string TenDangNhap = txtTenDangNhap.Text.Trim();
            string MatKhau = txtMatKhau.Text.Trim();
            string Phone = txtPhone.Text.Trim();

            // Thực hiện đăng ký người dùng
            bool result = XL_DangKy.DangKy(TenDangNhap, MatKhau, Phone);
        }
        private void btnBack_Click_1(object sender, EventArgs e)
        {

            frmDangNhap fdn = new frmDangNhap();
            this.Hide();
            fdn.Show();
        }
        private void frmDangKy_FormClosing(object sender, FormClosingEventArgs e)
        {
            Program.ExitApplication();
        }

        private void frmDangKy_KeyDown_ENTER(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Enter)
            {
                    btnDangKy_Click_1(sender, e);
            }
        }

        private void frmDangKy_Load(object sender, EventArgs e)
        {
            this.KeyPreview = true;
        }

        private void frmDangKy_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)Keys.Enter)
            {
                e.Handled = true;
            }
        }
    }
}
