export interface PaymentPayload {
  amount: number;
  currency: string;
  method: 'mtn_momo' | 'orange_money' | 'card';
  phoneNumber?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  message?: string;
}

export const simulatePayment = async (payload: PaymentPayload): Promise<PaymentResult> => {
  console.log('[Mock Payment] Processing payment:', payload);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  // For demo, require phone number to succeed
  const isSuccess = payload.phoneNumber && payload.phoneNumber.length >= 9;
  if (isSuccess) {
    return {
      success: true,
      transactionId: 'TXN-' + Date.now().toString(36).toUpperCase(),
      message: 'Payment successful',
    };
  }
  return {
    success: false,
    message: 'Payment failed. Please provide a valid phone number.',
  };
};