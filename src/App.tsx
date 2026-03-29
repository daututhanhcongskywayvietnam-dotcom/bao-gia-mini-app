import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';

// ==========================================================
// 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU (INTERFACES)
// ==========================================================
interface CryptoPrices {
  [key: string]: string;
}

interface Transaction {
  id: string;
  userId: string;
  date: string;
  type: string;
  amountUSD: number;
  amountVND: string;
  status: 'Hoàn thành' | 'Bị huỷ';
}

// ==========================================================
// 2. DỮ LIỆU MẪU LỊCH SỬ
// ==========================================================
const MOCK_HISTORY: Transaction[] = [
  { id: '#SWC999', userId: 'ID: 507318xxx', date: '29/03 07:15', type: 'Mua SWC', amountUSD: 5000, amountVND: '135.000.000', status: 'Hoàn thành' },
  { id: '#RSW888', userId: 'ID: 751590xxx', date: '29/03 06:45', type: 'Mua RSW', amountUSD: 200, amountVND: '5.400.000', status: 'Bị huỷ' },
  { id: '#SWC777', userId: 'ID: 124456xxx', date: '29/03 05:20', type: 'Mua SWC', amountUSD: 1000, amountVND: '27.000.000', status: 'Hoàn thành' },
  { id: '#SWC666', userId: 'ID: 998234xxx', date: '28/03 23:10', type: 'Mua SWC', amountUSD: 1500, amountVND: '40.500.000', status: 'Hoàn thành' },
  { id: '#RSW555', userId: 'ID: 662341xxx', date: '28/03 21:05', type: 'Mua RSW', amountUSD: 100, amountVND: '2.700.000', status: 'Hoàn thành' },
];

function App() {
  // ==========================================================
  // 3. QUẢN LÝ TRẠNG THÁI (STATES)
  // ==========================================================
  const [activeTab, setActiveTab] = useState<'trade' | 'history'>('trade');
  const [amount, setAmount] = useState('');
  const [platform, setPlatform] = useState('SWC');
  const [gmail, setGmail] = useState('');
  const [internalRates, setInternalRates] = useState({ swc: 27.0, rsw: 27.0 });
  const [prices, setPrices] = useState<CryptoPrices>({});
  
  // Nâng cấp tgUser có thêm isVerified và totalPurchased để tính hạng
  const [tgUser, setTgUser] = useState({
    name: 'Khách Hàng',
    avatar: 'https://i.pravatar.cc/150?img=11',
    isVerified: false, // MẶC ĐỊNH LÀ CHƯA XÁC MINH (Chỉnh thành true để test)
    totalPurchased: 5500 // Giả lập tổng tiền đã mua (USD) để chia hạng
  });

  // Đã bỏ LINK và ADA
  const displayCoins = ["BTC", "ETH", "BNB", "XRP", "DOGE", "CAKE"];
  const binanceSymbols = displayCoins.map(coin => coin + "USDT");

  // Hàm tính rank dựa trên tổng chi tiêu
  const getRank = (total: number) => {
    if (total >= 10000) return 'Hạng Kim Cương 💎';
    if (total >= 5000) return 'Hạng Vàng 🥇';
    if (total >= 1000) return 'Hạng Bạc 🥈';
    return 'Thành Viên 🥉';
  };

  // ==========================================================
  // 4. HIỆU ỨNG VÀ LOGIC FETCH DỮ LIỆU
  // ==========================================================
  useEffect(() => {
    WebApp.ready();
    WebApp.expand();

    const urlParams = new URLSearchParams(window.location.search);
    const rSWC = parseFloat(urlParams.get('swc') || '27.0');
    const rRSW = parseFloat(urlParams.get('rsw') || '27.0');
    setInternalRates({ swc: rSWC, rsw: rRSW });

    const user = WebApp.initDataUnsafe?.user;
    if (user) {
      setTgUser(prev => ({
        ...prev,
        name: (user.last_name ? user.last_name + ' ' : '') + user.first_name,
        avatar: user.photo_url || 'https://i.pravatar.cc/150?img=11',
      }));
    }

    const fetchLiveInternalRates = async () => {
      try {
        const response = await fetch('https://bot-ty-gia-swc.onrender.com/api/rates');
        const data = await response.json();
        if (data.swc && data.rsw) {
          setInternalRates({ swc: data.swc, rsw: data.rsw });
        }
      } catch (e) {
        console.warn("Đang dùng giá dự phòng...");
      }
    };

    const fetchCryptoPrices = async () => {
      try {
        const url = `https://api.binance.com/api/v3/ticker/price?symbols=${encodeURIComponent(JSON.stringify(binanceSymbols))}`;
        const response = await fetch(url);
        const data = await response.json();
        const priceMap: CryptoPrices = {}; 
        if (Array.isArray(data)) {
          data.forEach((item: any) => {
            const symbol = item.symbol.replace('USDT', '');
            const price = parseFloat(item.price);
            const dec = (symbol === 'DOGE' || symbol === 'XRP') ? 4 : 2;
            priceMap[symbol] = price.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
          });
          setPrices(priceMap);
        }
      } catch (e) {
        console.error("Lỗi Binance:", e);
      }
    };

    fetchLiveInternalRates();
    fetchCryptoPrices();
    
    const interval = setInterval(() => {
      fetchLiveInternalRates();
      fetchCryptoPrices();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // ==========================================================
  // 5. TÍNH TIỀN VÀ XỬ LÝ NÚT THANH TOÁN
  // ==========================================================
  const currentRate = platform === 'SWC' ? internalRates.swc : internalRates.rsw;
  const totalVNDNum = Number(amount) * currentRate * 1000;
  const totalVNDStr = isNaN(totalVNDNum) ? '0' : totalVNDNum.toLocaleString('vi-VN');

  const handleSendData = () => {
    // Check xác minh trước
    if (!tgUser.isVerified) {
      WebApp.showAlert("⚠️ Sếp chưa xác minh tài khoản! Vui lòng hoàn tất xác minh trước khi tạo QR giao dịch.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      WebApp.showAlert("⚠️ Sếp hãy nhập số lượng USD muốn nạp!");
      return;
    }
    if (!gmail.trim() || !gmail.includes('@')) {
      WebApp.showAlert("⚠️ Sếp vui lòng nhập Gmail hợp lệ!");
      return;
    }

    const payload = {
      amount: Number(amount),
      platform,
      gmail: gmail.trim(),
      rate: currentRate,
      totalVND: totalVNDNum,
      timestamp: new Date().toISOString()
    };
    WebApp.sendData(JSON.stringify(payload));
  };

  // Đã xóa bỏ LINK và ADA khỏi danh sách khối coin
  const coinBlocks = [
    { sym: 'BTC', img: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png' },
    { sym: 'ETH', img: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png' },
    { sym: 'BNB', img: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png' },
    { sym: 'XRP', img: 'https://s2.coinmarketcap.com/static/img/coins/64x64/52.png' },
    { sym: 'DOGE', img: 'https://s2.coinmarketcap.com/static/img/coins/64x64/74.png' },
    { sym: 'CAKE', img: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7186.png' }
  ];

  return (
    <div className="h-screen w-full bg-slate-50 font-sans text-slate-900 flex flex-col overflow-hidden relative">

      <style>{`
        @keyframes pulse-border {
          0%, 100% { border-color: #fca5a5; box-shadow: 0 0 0 0 rgba(239,68,68,0.2); }
          50% { border-color: #ef4444; box-shadow: 0 0 20px 5px rgba(239,68,68,0.5); }
        }
        .alert-box-powerful { animation: pulse-border 1.5s infinite; }

        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes glow-flash {
          0%, 100% { border-color: #0ea5e9; box-shadow: 0 0 15px 2px rgba(14,165,233,0.8); opacity: 1; }
          50% { border-color: #38bdf8; box-shadow: 0 0 5px 0px rgba(56,189,248,0.2); opacity: 0.6; }
        }
        .avatar-container { position: relative; display: inline-block; border-radius: 50%; }
        .avatar-container::before {
          content: ''; position: absolute; inset: -5px; border-radius: 50%;
          border: 3px dashed #38bdf8;
          animation: spin-slow 10s linear infinite, glow-flash 2s ease-in-out infinite;
          z-index: 0; box-sizing: border-box;
        }
        .animate-slide-up { animation: slideUp 0.4s ease-out; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* HEADER */}
      <header className="w-full bg-gradient-to-r from-slate-950 via-blue-950 to-slate-950 text-white p-4 flex justify-between items-center rounded-b-[2.5rem] shadow-2xl z-30 shrink-0 border-b border-blue-800">
        <div className="flex items-center gap-3">
          <img
            src="https://i.postimg.cc/nLf79FLk/Do-Va-Va-ng-Ba-i-Da-ng-Facebook-Chu-c-Mu-ng-Te-t-Nguye-n-Da-n-Do-Ho-a.png"
            alt="Logo"
            className="w-12 h-12 rounded-full border-2 border-blue-400 shadow-lg object-cover bg-white"
          />
          <div className="flex flex-col">
            <span className="font-black text-blue-300 text-base tracking-tight uppercase leading-none">Trợ lý USDT</span>
            <span className="text-[10px] text-blue-200 opacity-70 font-bold tracking-widest mt-1">NẠP ĐÔ HỎA TỐC</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-right">
          <div className="flex flex-col">
            <span className="font-bold text-sm text-slate-100">{tgUser.name}</span>
            <span className="text-[9px] text-blue-400 font-black uppercase tracking-tighter bg-blue-900/40 px-1.5 py-0.5 rounded-md mt-1">
              {getRank(tgUser.totalPurchased)}
            </span>
            {tgUser.isVerified ? (
              <span className="text-[10px] text-emerald-400 font-bold mt-1">Đã xác minh ✅</span>
            ) : (
              <span className="text-[10px] text-rose-400 font-bold mt-1">Chưa xác minh ❌</span>
            )}
          </div>
          <div className="avatar-container w-10 h-10">
            <img src={tgUser.avatar} alt="User" className="w-full h-full rounded-full object-cover relative z-10 border border-slate-700 bg-slate-800 shadow-inner" />
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-grow overflow-y-auto pb-28 p-4 block">
        {activeTab === 'trade' ? (
          <div className="w-full max-w-md mx-auto flex flex-col gap-5 animate-slide-up">
            
            {/* Cập nhật grid-cols-3 vì giờ chỉ còn 6 coin cho cân đối */}
            <section className="w-full grid grid-cols-3 gap-2">
              {coinBlocks.map(coin => (
                <div key={coin.sym} className="bg-white border border-slate-200 py-3 px-1 rounded-2xl flex flex-col items-center shadow-sm">
                  <img src={coin.img} className="w-7 h-7 mb-1.5" alt={coin.sym} />
                  <span className="text-[10px] font-bold text-slate-500">{coin.sym}</span>
                  <span className="text-[10px] font-black text-emerald-600">${prices[coin.sym] || '...'}</span>
                </div>
              ))}
            </section>

            <section className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col gap-5">
              <div>
                <label className="block text-xs font-black mb-3 text-slate-500 uppercase tracking-widest text-center">1. Chọn dự án đầu tư</label>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setPlatform('SWC')} className={`p-4 rounded-2xl text-center transition-all duration-300 transform active:scale-95 ${platform === 'SWC' ? 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-100 scale-105' : 'bg-slate-50 text-slate-400'}`}>
                    <p className="text-[10px] font-bold uppercase mb-1">Dự án SWC</p>
                    <p className="text-2xl font-black">{internalRates.swc}</p>
                  </button>
                  <button onClick={() => setPlatform('RSW')} className={`p-4 rounded-2xl text-center transition-all duration-300 transform active:scale-95 ${platform === 'RSW' ? 'bg-red-600 text-white shadow-lg ring-4 ring-red-100 scale-105' : 'bg-slate-50 text-slate-400'}`}>
                    <p className="text-[10px] font-bold uppercase mb-1">Dự án RSW</p>
                    <p className="text-2xl font-black">{internalRates.rsw}</p>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold mb-2 text-slate-600 ml-1">Số lượng USD muốn mua:</label>
                  {/* Phóng to số tiền text-3xl -> text-4xl */}
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-4 rounded-2xl border-2 border-slate-100 font-black text-center text-4xl text-blue-600 bg-slate-50 focus:border-blue-500 focus:bg-white transition-all outline-none" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-2 text-slate-600 ml-1">Gmail nhận biên lai:</label>
                  <input type="email" value={gmail} onChange={(e) => setGmail(e.target.value)} className="w-full p-4 rounded-2xl border-2 border-slate-100 font-bold text-center text-slate-800 bg-slate-50 focus:border-blue-500 focus:bg-white transition-all outline-none" placeholder="vidu@gmail.com" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black mb-2 text-slate-500 uppercase tracking-widest text-center">Tổng tiền thanh toán</label>
                {/* Phóng to tổng tiền text-4xl -> text-5xl */}
                <div className="w-full p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-700 text-5xl font-black text-center shadow-inner break-words">
                  {totalVNDStr} <span className="text-lg font-bold">VNĐ</span>
                </div>
              </div>

              <div className="alert-box-powerful w-full bg-red-50 border-2 border-red-200 text-red-900 p-4 rounded-2xl text-center">
                <b className="text-red-700 text-sm uppercase block mb-1">🚨 Cảnh báo quan trọng</b>
                <p className="text-[10px] text-left leading-tight font-medium">
                  • Chỉ giao dịch bằng <b>TÀI KHOẢN CHÍNH CHỦ</b>.<br/>
                  • Chuyển khoản <b>ĐÚNG NỘI DUNG</b> và <b>SỐ TÀI KHOẢN</b> trên QR.<br/>
                  • Người mua chịu trách nhiệm 100% về nguồn tiền của mình.
                </p>
              </div>

              <button onClick={handleSendData} className="w-full bg-gradient-to-r from-blue-700 to-blue-900 text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all text-xl uppercase tracking-tighter flex justify-center items-center gap-3">
                <span>💳</span> LẤY MÃ QR THANH TOÁN
              </button>
            </section>
          </div>
        ) : (
          <div className="flex flex-col gap-3 animate-slide-up max-w-md mx-auto">
            <div className="flex justify-between items-center px-2 mb-2">
              <h2 className="text-xl font-black text-slate-800">Lịch sử hệ thống</h2>
              <span className="text-[10px] text-slate-400 font-bold bg-slate-200 px-2 py-1 rounded-full animate-pulse">LIVE</span>
            </div>
            
            {MOCK_HISTORY.map((tx) => (
              <div key={tx.id} className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-slate-100 flex justify-between items-center transform hover:scale-[1.02] transition-transform">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black text-white uppercase ${tx.type.includes('SWC') ? 'bg-blue-600' : 'bg-red-600'}`}>{tx.type}</span>
                    <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">{tx.userId}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold">{tx.date} • Mã: {tx.id}</p>
                  <span className={`text-[11px] font-black ${tx.status === 'Hoàn thành' ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {tx.status === 'Hoàn thành' ? '✓ GIAO DỊCH THÀNH CÔNG' : '✕ GIAO DỊCH BỊ HỦY'}
                  </span>
                </div>
                <div className="text-right flex flex-col items-end">
                  <p className={`font-black text-lg leading-none mb-1 ${tx.status === 'Hoàn thành' ? 'text-emerald-600' : 'text-slate-300 line-through'}`}>
                    {tx.status === 'Hoàn thành' ? '+' : ''}{tx.amountUSD.toLocaleString()} $
                  </p>
                  <p className="text-[10px] font-bold text-slate-400">{tx.amountVND} VNĐ</p>
                </div>
              </div>
            ))}
            <p className="text-center text-[10px] text-slate-400 mt-5 italic">Dữ liệu được bảo mật bởi hệ thống SWC Global</p>
          </div>
        )}
      </main>

      {/* BOTTOM NAV BAR */}
      <nav className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-200 p-3 flex justify-around shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-40 pb-safe-area-inset-bottom">
        <button onClick={() => setActiveTab('trade')} className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'trade' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
          <div className={`p-2 rounded-xl ${activeTab === 'trade' ? 'bg-blue-50' : ''}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">GIAO DỊCH</span>
        </button>

        <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'history' ? 'text-blue-600 scale-110' : 'text-gray-400'}`}>
          <div className={`p-2 rounded-xl ${activeTab === 'history' ? 'bg-blue-50' : ''}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">LỊCH SỬ</span>
        </button>
      </nav>

    </div>
  );
}

export default App;
