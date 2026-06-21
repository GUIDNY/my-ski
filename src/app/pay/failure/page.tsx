export default function PayFailure() {
  return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col items-center justify-center text-center px-6" dir="rtl">
      <div className="w-20 h-20 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-5 text-4xl">✕</div>
      <h1 className="font-display text-3xl font-black text-slate-900 mb-2">התשלום לא הושלם</h1>
      <p className="text-slate-500 max-w-md mb-8">משהו השתבש או שהתשלום בוטל. אפשר לנסות שוב, או לדבר איתנו בוואטסאפ ונשמח לעזור.</p>
      <a href="/" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-xl transition">חזרה לאתר</a>
    </div>
  );
}
