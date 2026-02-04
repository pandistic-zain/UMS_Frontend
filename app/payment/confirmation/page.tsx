import { Suspense } from "react";
import PaymentConfirmationPage from "../../../components/payment/PaymentConfirmationPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="px-4 py-10 text-sm text-slate-500">Loading confirmation...</div>}>
      <PaymentConfirmationPage />
    </Suspense>
  );
}
