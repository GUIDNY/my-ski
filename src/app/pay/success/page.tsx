import { IconCheck } from "@/components/Icons";

export default function PaySuccess() {
  return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col items-center justify-center text-center px-6" dir="rtl">
      <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5">
        <IconCheck size={36} />
      </div>
      <h1 className="font-display text-3xl font-black text-slate-900 mb-2">קיבלנו את הפרטים! 🎿</h1>
      <p className="text-slate-500 max-w-md mb-8">פרטי התשלום נקלטו והסכום נשמר כפיקדון. נציג SkiShare יאשר את ההזמנה, ורק לאחר האישור יבוצע החיוב בפועל. אישור הזמנה יישלח אליך במייל.</p>
      <a href="/" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-xl transition">חזרה לאתר</a>
    </div>
  );
}
