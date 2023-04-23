//using CaculatorApp;
//using Microsoft.VisualStudio.TestTools.UnitTesting;
//using System;
//using System.Collections.Generic;
//using System.Linq;
//using System.Text;
//using System.Threading.Tasks;

//namespace CaculatorTest
//{
//    [TestClass]
//    public class PtBac2Test
//    {
//        [TestMethod]
//        public void TestKiemTraPhuongTrinhVoSoNghiem()
//        {
//            // Arrange
//            double a = 0;
//            double b = 0;
//            double c = 0;

//            // Act
//            string result = PtBac2.KiemTraPhuongTrinh(a, b, c);

//            // Assert
//            Assert.AreEqual("Phuong trinh vo so nghiem", result);
//        }

//        [TestMethod]
//        public void TestKiemTraPhuongTrinhVoNghiem()
//        {
//            // Arrange
//            double a = 0;
//            double b = 0;
//            double c = 1;

//            // Act
//            string result = PtBac2.KiemTraPhuongTrinh(a, b, c);

//            // Assert
//            Assert.AreEqual("Phuong trinh vo nghiem", result);
//        }

//        [TestMethod]
//        public void TestKiemTraPhuongTrinhCoNghiemDuyNhat()
//        {
//            // Arrange
//            double a = 0;
//            double b = 2;
//            double c = 4;

//            // Act
//            string result = PtBac2.KiemTraPhuongTrinh(a, b, c);

//            // Assert
//            Assert.AreEqual("Phuong trinh co nghiem duy nhat x = -2", result);
//        }

//        [TestMethod]
//        public void TestKiemTraPhuongTrinhCoNghiemKep()
//        {
//            // Arrange
//            double a = 2;
//            double b = -4;
//            double c = 2;

//            // Act
//            string result = PtBac2.KiemTraPhuongTrinh(a, b, c);

//            // Assert
//            Assert.AreEqual("Phuong trinh co nghiem kep Delta = 0. x = 1", result);
//        }

//        [TestMethod]
//        public void TestKiemTraPhuongTrinhCoHaiNghiem()
//        {
//            // Arrange
//            double a = 2;
//            double b = 5;
//            double c = -3;

//            // Act
//            string result = PtBac2.KiemTraPhuongTrinh(a, b, c);

//            // Assert
//            Assert.AreEqual("Phuong trinh co 2 nghiem phan biet x1 Delta > 0. = 0.5, x2 = -3", result);
//        }
//    }
//}