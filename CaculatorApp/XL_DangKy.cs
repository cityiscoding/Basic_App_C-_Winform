using System.Data.SqlClient;
using System;
using System.Windows.Forms;
using System.Text.RegularExpressions;
using System.Linq;
using System.Security.Cryptography.X509Certificates;
using static System.Net.Mime.MediaTypeNames;

namespace CaculatorApp
{
    public static class XL_DangKy
    {

        private static readonly string ConnectionString = "Data Source=DESKTOP-E532F7N;Initial Catalog=TEST;Integrated Security=True";
        private static readonly string SelectQuery = "SELECT COUNT(*) FROM [User] WHERE username = @username OR phone = @phone";
        private static readonly string InsertQuery = "INSERT INTO [User] (username, password, phone) VALUES (@username, @password, @phone)";
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
            }
            return result;
        }

        public static bool KiemTraThongTin(string TenDangNhap, string MatKhau, string Phone)
        {
            // Kiểm tra các trường thông tin
            if (string.IsNullOrEmpty(TenDangNhap) || string.IsNullOrEmpty(MatKhau) || string.IsNullOrEmpty(Phone))
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
            if (!Regex.IsMatch(Phone, @"^0\d{9}$"))
            {
                MessageBox.Show("Số điện thoại không hợp lệ!", "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return false;
            }

            return true;
        }
        public static bool KiemTraUserNamePhone(string TenDangNhap, string Phone)
        {
            // Kiểm tra username và số điện thoại đã tồn tại trong cơ sở dữ liệu chưa
            using (SqlConnection con = new SqlConnection(ConnectionString))
            using (SqlCommand cmd = new SqlCommand(SelectQuery, con))
            {
                cmd.Parameters.AddWithValue("@username", TenDangNhap);
                cmd.Parameters.AddWithValue("@phone", Phone);
                try
                {
                    con.Open();
                    int count = (int)cmd.ExecuteScalar();
                    if (count > 0)
                    {
                        MessageBox.Show("Tên đăng nhập hoặc số điện thoại đã tồn tại!", "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
                        return false;
                    }
                    else
                    {
                        return true;
                    }
                }
                catch
                {
                    TestConnection();
                }
            }
            return true;
        }

        public static bool DangKy(string TenDangNhap, string MatKhau, string Phone)
        {
            if (!TestConnection())
            {
                return false;
            }
            if (!KiemTraThongTin(TenDangNhap, MatKhau, Phone))
            {
                return false;
            }

            if (!KiemTraUserNamePhone(TenDangNhap, Phone))
            {
                return false;
            }

            // Thêm thông tin người dùng mới vào cơ sở dữ liệu
            using (SqlConnection con = new SqlConnection(ConnectionString))
            using (SqlCommand cmd = new SqlCommand(InsertQuery, con))
            {
                cmd.Parameters.AddWithValue("@username", TenDangNhap);
                cmd.Parameters.AddWithValue("@password", MatKhau);
                cmd.Parameters.AddWithValue("@phone", Phone);
                try
                {
                    con.Open();
                    int rowsAffected = cmd.ExecuteNonQuery();
                    if (rowsAffected > 0)
                    {
                        MessageBox.Show("Đăng ký thành công!", "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Information);
                        return true;
                    }
                }
                catch
                {
                    TestConnection();
                }
            }
            return false;
        }

    }
}