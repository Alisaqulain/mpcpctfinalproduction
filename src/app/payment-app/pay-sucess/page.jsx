import React from 'react';
const Details = [{
  amount : "1999",
  date : "07/05/2025",
  method : "Debit Card",
  con : "IST-45210HJ001",
  id : "7484123435"

}];

const PaymentSuccess = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fff] p-4 mb-40">
      <div className="bg-white rounded-md p-6 w-full max-w-lg text-center border h-100">
        <div>
        <div className="flex justify-center mb-4">
          <div className="rounded-full p-2">
           <img src="/right.png" alt="" />
          </div>
        </div>
        <h2 className="text-xl font-semibold mb-4">Payment Successfully</h2>
        <hr className="mb-4" />

        <div className="text-left space-y-3 text-sm">
            <h2 className='text-center'>Payment Details</h2>
          <div className="flex justify-between">
            <span className="text-gray-500">Payment Amount</span>
            <span className="font-medium">₹ {Details[0].amount}.00</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Payment Date</span>
            <span className="font-medium">{Details[0].date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Payment Method</span>
            <span className="font-medium">{Details[0].method}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Confirmation</span>
            <span className="font-medium">{Details[0].con}</span>
          </div>
        </div>

        <hr className="my-4" />
        <p className="text-sm font-medium text-gray-600">
          Reference ID : {Details[0].id}
        </p>

        </div>
        <div className="mt-18 text-[14px] text-[#000000] font-semibold">
          You will receive a payment receipt in your registered email ID.
        </div>
        <div className="text-sm mt-5 font-semibold">
          If you need help, Contact us or{' '}
          <a href="#" className="text-[#0D3451] font-semibold pt-3">
            Visit our FAQ's
          </a>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
