using CaculatorApp;
using System;
using System.Data.SqlClient;
using System.Text.RegularExpressions;
using System.Windows.Forms;

namespace CalculatorApp
{
    public static class XL_DangNhap
    {
        private static readonly string ConnectionString = "Data Source=DESKTOP-E532F7N;Initial Catalog=TEST;Integrated Security=True";
        private static readonly string SelectQuery = "SELECT COUNT(*) FROM [User] WHERE username = @username AND password = @password";
        public static bool TestConnection()
        {
            bool result = false;
            try
            {
                using (SqlConnection con = new SqlConnection(ConnectionString))
                {
                    con.Open();
                    result = true;
                }
            }
            catch (Exception)
            {
                MessageBox.Show("Lỗi kết nối cơ sở dữ liệu. Vui lòng thử lại sau!", "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return false;
            }
            return result;
        }

        public static bool KiemTraThongTin(string TenDangNhap, string MatKhau)
        {
            // Kiểm tra các trường thông tin
            if (string.IsNullOrEmpty(TenDangNhap) || string.IsNullOrEmpty(MatKhau))
            {
                MessageBox.Show("Vui lòng nhập đầy đủ thông tin!");
                return false;
            }
            if (!Regex.IsMatch(TenDangNhap, "^[A-Za-z]{5,20}$"))
            {
                MessageBox.Show("Tên đăng nhập phải là chữ 5->10 ký tự và không chứa ký tự đặc biệt!", "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return false;
            }
            if (!Regex.IsMatch(MatKhau, @"^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@,._]{8,20}$"))
            {
                MessageBox.Show("Mật khẩu phải chứa từ 8->20 ký tự và có ít nhất 1 chữ hoa và 1 số!", "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return false;
            }
            return true;
        }



        public static bool DangNhap(string TenDangNhap, string MatKhau)
        {
            if (!TestConnection())
            {
                return false;
            }
            if (!KiemTraThongTin(TenDangNhap, MatKhau))
            {
                return false;
            }


            bool result = false;
            try
            {
                using (SqlConnection con = new SqlConnection(ConnectionString))
                {
                    con.Open();
                    using (SqlCommand cmd = new SqlCommand(SelectQuery, con))
                    {
                        cmd.Parameters.AddWithValue("@username", TenDangNhap);
                        cmd.Parameters.AddWithValue("@password", MatKhau);

                        int count = (int)cmd.ExecuteScalar();
                        if (count > 0)
                        {
                            result = true;
                            MessageBox.Show($"Xin chào '{TenDangNhap}'", "Đăng nhập thành công!", MessageBoxButtons.OK, MessageBoxIcon.Information, MessageBoxDefaultButton.Button1);

                        }
                        else
                        {
                            MessageBox.Show("Tên đăng nhập hoặc mật khẩu không đúng.", "Đăng nhập thất bại!", MessageBoxButtons.OK, MessageBoxIcon.Error, MessageBoxDefaultButton.Button1);
                        }
                    }
                }
            }
            catch (Exception)
            {
                TestConnection();
            }
            return result;
        }
    }
}
