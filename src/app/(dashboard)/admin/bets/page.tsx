import AdminBetManager from "@/components/AdminBetManager";

const AdminBetsPage = () => {
  return (
    <div className="container mx-auto p-4 md:p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Admin Bet Management
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Create and manage bets on the platform.
        </p>
      </header>
      
      <main>
        <AdminBetManager />
      </main>
    </div>
  );
};

export default AdminBetsPage;