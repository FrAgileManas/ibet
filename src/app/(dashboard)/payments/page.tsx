import PaymentHistoryTable from '@/components/PaymentHistoryTable';

export default function PaymentsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            💰 Payment Center
          </h1>
          <p className="text-lg text-gray-600">
            Track your balance, winnings, and transaction history
          </p>
        </div>

        {/* Main Content */}
        <PaymentHistoryTable />
      </div>
    </div>
  );
}