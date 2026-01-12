// Contoh komponen Ringkasan Anggaran
export default function Dashboard() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Dashboard Keuangan</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-green-100 rounded-lg shadow">
          <p className="text-sm text-green-600">Total Income</p>
          <p className="text-xl font-bold">Rp 3.043.530</p>
        </div>
        <div className="p-4 bg-red-100 rounded-lg shadow">
          <p className="text-sm text-red-600">Total Outcome</p>
          <p className="text-xl font-bold">Rp 1.678.795</p>
        </div>
        <div className="p-4 bg-blue-100 rounded-lg shadow">
          <p className="text-sm text-blue-600">Saving Rate</p>
          <p className="text-xl font-bold">32.8%</p>
        </div>
      </div>
      
      {/* Nantinya daftar transaksi dari database akan muncul di sini */}
    </div>
  );
}