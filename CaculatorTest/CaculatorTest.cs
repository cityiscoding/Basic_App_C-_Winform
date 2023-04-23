//using Microsoft.VisualStudio.TestTools.UnitTesting;
//using System;
//using CaculatorApp;

//namespace CaculatorTest
//{
//    [TestClass]
//    public class CaculatorTest
//    {
//        [TestMethod]
//        public void AddTest()
//        {
//            int expected = 5;
//            int actual = Caculator.Add(2, 3);
//            Assert.AreEqual(expected, actual);
//        }
//        [TestMethod]
//        public void SubTest()
//        {
//            int expected = 2;
//            int actual = Caculator.Sub(5, 3);
//            Assert.AreEqual(expected, actual);
//        }

//        [TestMethod]
//        public void MulTest()
//        {
//            int expected = 15;
//            int actual = Caculator.Mul(3, 5);
//            Assert.AreEqual(expected, actual);
//        }

//        [TestMethod]
//        public void DivTest()
//        {
//            int expected = 2;
//            int actual = Caculator.Div(6, 3);
//            Assert.AreEqual(expected, actual);
//        }

//        [TestMethod]
//        [ExpectedException(typeof(DivideByZeroException))]
//        public void DivByZeroTest()
//        {
//            int actual = Caculator.Div(6, 0);
//        }
//    }
//}
