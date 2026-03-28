import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';

// 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU ĐẦY ĐỦ
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

// 2. DỮ LIỆU LỊCH SỬ MẪU (FULL STATUS)
const MOCK_HISTORY: Transaction[] = [
    { id: '#SWC102', userId: 'ID: 507318xxx', date: '29/03 14:30', type: 'Mua SWC', amountUSD: 1000, amountVND: '27.000.000', status: 'Hoàn thành' },
    { id: '#RSW098', userId: 'ID: 751590xxx', date: '29/03 09:15', type: 'Mua RSW', amountUSD: 500, amountVND: '13.500.000', status: 'Bị huỷ' },
    { id: '#SWC075', userId: 'ID: 124456xxx', date: '28/03 20:00', type: 'Mua SWC', amountUSD: 2000, amountVND: '54.000.000', status: 'Hoàn thành' },
    { id: '#SWC074', userId: 'ID: 998234xxx', date: '28/03 18:20', type: 'Mua SWC', amountUSD: 100, amountVND: '2.700.000', status: 'Hoàn thành' }
];

function App() {
    // 3. QUẢN LÝ STATE (ĐẦY ĐỦ)
    const [activeTab, setActiveTab] = useState<'trade' | 'history'>('trade');
    const [amount, setAmount] = useState('');
    const [platform, setPlatform] = useState('SWC');
    const [gmail, setGmail] = useState('');
    const [internalRates, setInternalRates] = useState({ swc: 27.0, rsw: 27.0 });
    const [prices, setPrices] = useState<CryptoPrices>({});
    const [tgUser, setTgUser] = useState({
        name: 'Khách Hàng',
        avatar: 'https://i.pravatar.cc/150?img=11', 
        rank: 'Thành Viên'
    });

    // 4. CẤU HÌNH SYMBOl BINANCE (LẤY 10 COIN ĐỂ DỮ LIỆU LUÔN MƯỢT)
    const displayCoins = ["BTC", "ETH", "BNB", "XRP", "DOGE", "CAKE", "SOL", "ADA", "DOT", "LINK"];
    const binanceSymbols = displayCoins.map(coin => coin + "USDT");

    useEffect(() => {
        // Khởi tạo WebApp
        WebApp.ready();
        WebApp.expand();
        
        // Lấy thông tin giá từ URL Parameter gửi từ Bot
        const urlParams = new URLSearchParams(window.location.search);
        const rSWC = parseFloat(urlParams.get('swc') || '27.0');
        const rRSW = parseFloat(urlParams.get('rsw') || '27.0');
        setInternalRates({ swc: rSWC, rsw: rRSW });

        // Lấy thông tin người dùng từ Telegram
        const user = WebApp.initDataUnsafe?.user;
        if (user) {
            setTgUser({
                name: (user.last_name ? user.last_name + ' ' : '') + user.first_name,
                avatar: user.photo_url || 'https://i.pravatar.cc/150?img=11',
                rank: 'Thành Viên' 
            });
        }

        // 5. LOGIC LẤY GIÁ REALTIME (FIX LỖI URL ENCODING CHO IOS)
        const fetchPrices = async () => {
            try {
                const url = `https://api.binance.com/api/v3/ticker/price?symbols=${encodeURIComponent(JSON.stringify(binanceSymbols))}`;
                const response = await fetch(url);
                const data = await response.json();
                
                const priceMap: CryptoPrices = {};
                if (Array.isArray(data)) {
                    data.forEach((item: any) => {
                        const symbol = item.symbol.replace('USDT', '');
                        const price = parseFloat(item.price);
                        const fractionDigits = (symbol === 'DOGE' || symbol === 'XRP' || symbol === 'ADA') ? 4 : 2;
                        priceMap[symbol] = price.toLocaleString('en-US', {
                            minimumFractionDigits: fractionDigits,
                            maximumFractionDigits: fractionDigits
                        });
                    });
                    setPrices(priceMap);
                }
            } catch (e) {
                console.error("Lỗi lấy giá:", e);
            }
        };

        fetchPrices();
        const interval = setInterval(fetchPrices, 10000);
        return () => clearInterval(interval);
    }, []);

    // 6. LOGIC TÍNH TOÁN
    const currentRate = platform === 'SWC' ? internalRates.swc : internalRates.rsw;
    const totalVNDNum = Number(amount) * currentRate * 1000;
    const totalVND = isNaN(totalVNDNum) ? '0' : totalVNDNum.toLocaleString('vi-VN');

    // 7. GỬI DỮ LIỆU VỀ BOT
    const handleSendData = () => {
        if (!amount || Number(amount) <= 0) {
            WebApp.showAlert("⚠️ Sếp vui lòng nhập số lượng USD hợp lệ!");
            return;
        }
        if (!gmail.trim() || !gmail.includes('@')) {
            WebApp.showAlert("⚠️ Sếp vui lòng nhập Gmail hợp lệ để nhận biên lai!");
            return;
        }

        const payload = {
            amount: Number(amount),
            platform,
            gmail: gmail.trim(),
            rate: currentRate,
            totalVND: totalVNDNum
        };
        WebApp.sendData(JSON.stringify(payload));
    };

    // Bố cục giá của 6 khối Block (CoinMarketCap Link)
    const coinBlocks = [
        { sym: 'BTC', img: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png' },
        { sym: 'ETH', img: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png' },
        { sym: 'BNB', img: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png' },
        { sym: 'XRP', img: 'https://s2.coinmarketcap.com/static/img/coins/64x64/52.png' },
        { sym: 'DOGE', img: 'https://s2.coinmarketcap.com/static/img/coins/64x64/74.png' },
        { sym: 'CAKE', img: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7186.png' }
    ];

    return (
        <div className="h-screen w-full bg-gray-50 font-sans text-black flex flex-col overflow-hidden relative">
            
            {/* 8. CSS ANIMATION FULL OPTION */}
            <style>{`
                @keyframes pulse-border {
                    0%, 100% { border-color: #fca5a5; box-shadow: 0 0 0 0 rgba(239,68,68,0.2); }
                    50% { border-color: #ef4444; box-shadow: 0 0 15px 5px rgba(239,68,68,0.6); }
                }
                .alert-box-powerful { animation: pulse-border 1.2s infinite; }

                @keyframes spin-slow { 100% { transform: rotate(360deg); } }
                @keyframes flash-glow {
                    0%, 100% { border-color: #0ea5e9; box-shadow: 0 0 15px 5px rgba(14, 165, 233, 0.8); opacity: 1; }
                    50% { border-color: #38bdf8; box-shadow: 0 0 5px 2px rgba(56, 189, 248, 0.3); opacity: 0.6; }
                }
                .avatar-glow-container { position: relative; display: inline-block; border-radius: 50%; }
                .avatar-glow-container::before {
                    content: ''; position: absolute; inset: -5px; border-radius: 50%;
                    border: 3px dashed #38bdf8; 
                    animation: spin-slow 8s linear infinite, flash-glow 1.5s ease-in-out infinite;
                    z-index: 0; box-sizing: border-box;
                }
                .animate-fade-in { animation: fadeIn 0.3s ease-in; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>

            {/* 9. HEADER GRADIENT ROYAL BLUE */}
            <div className="w-full bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-4 flex justify-between items-center rounded-b-3xl shadow-xl z-20 shrink-0 border-b border-blue-900">
                <div className="flex items-center gap-3">
                    <img 
                        src="https://i.postimg.cc/nLf79FLk/Do-Va-Va-ng-Ba-i-Da-ng-Facebook-Chu-c-Mu-ng-Te-t-Nguye-n-Da-n-Do-Ho-a.png" 
                        alt="Logo" 
                        className="w-11 h-11 rounded-full border-2 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] object-cover bg-white" 
                    />
                    <div className="flex flex-col">
                        <span className="font-black text-blue-300 text-sm tracking-wide">TRỢ LÝ USDT</span>
                        <span className="text-[10px] text-blue-200 opacity-80 uppercase font-bold tracking-tighter">Nạp Đô Hỏa Tốc</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-right">
                    <div className="flex flex-col">
                        <span className="font-bold text-sm text-gray-100">{tgUser.name}</span>
                        <span className="text-[10px] text-blue-400 font-semibold uppercase">{tgUser.rank}</span>
                    </div>
                    <div className="avatar-glow-container w-10 h-10">
                        <img src={tgUser.avatar} alt="Ava" className="w-full h-full rounded-full object-cover relative z-10 border border-gray-700 bg-gray-800" />
                    </div>
                </div>
            </div>

            {/* 10. NỘI DUNG CHÍNH (TAB TRADE & HISTORY) */}
            <div className="flex-grow overflow-y-auto pb-24 p-4 block">
                {activeTab === 'trade' ? (
                    <div className="w-full max-w-md mx-auto flex flex-col gap-4 animate-fade-in">
                        {/* 6 KHỐI BÁO GIÁ CRYPTO */}
                        <div className="w-full grid grid-cols-3 gap-2">
                            {coinBlocks.map(coin => (
                                <div key={coin.sym} className="bg-white border border-gray-100 py-3 px-1 rounded-xl flex flex-col items-center shadow-sm">
                                    <img src={coin.img} className="w-7 h-7 mb-1" alt={coin.sym} />
                                    <span className="text-[10px] font-bold text-gray-500">{coin.sym}</span>
                                    <span className="text-xs font-black text-green-500">${prices[coin.sym] || '...'}</span>
                                </div>
                            ))}
                        </div>

                        {/* FORM GIAO DỊCH CHÍNH */}
                        <div className="bg-white p-5 rounded-3xl shadow-lg border border-gray-100 block">
                            <label className="block text-sm font-bold mb-3 text-gray-700">1. Chọn dự án giao dịch:</label>
                            <div className="grid grid-cols-2 gap-3 mb-5">
                                <button onClick={() => setPlatform('SWC')} className={`p-4 rounded-2xl text-center shadow-sm transition-all duration-300 ${platform === 'SWC' ? 'bg-blue-600 text-white scale-105 ring-4 ring-blue-200' : 'bg-gray-100 text-gray-500'}`}>
                                    <p className="text-[10px] font-bold uppercase mb-1 opacity-80">Giá Quỹ SWC</p>
                                    <p className="text-2xl font-black">{internalRates.swc}</p>
                                </button>
                                <button onClick={() => setPlatform('RSW')} className={`p-4 rounded-2xl text-center shadow-sm transition-all duration-300 ${platform === 'RSW' ? 'bg-red-600 text-white scale-105 ring-4 ring-red-200' : 'bg-gray-100 text-gray-500'}`}>
                                    <p className="text-[10px] font-bold uppercase mb-1 opacity-80">Giá Quỹ RSW</p>
                                    <p className="text-2xl font-black">{internalRates.rsw}</p>
                                </button>
                            </div>

                            <label className="block text-sm font-bold mb-2 text-gray-700">2. Số lượng USD muốn nạp:</label>
                            <input 
                                type="number" 
                                value={amount} 
                                onChange={(e) => setAmount(e.target.value)} 
                                className="w-full p-4 mb-4 rounded-2xl border-2 border-gray-100 font-black text-center text-2xl text-blue-600 bg-gray-50 outline-none focus:border-blue-500 transition-all" 
                                placeholder="VD: 1000" 
                            />

                            <label className="block text-sm font-bold mb-2 text-gray-700">3. Gmail nhận thông báo:</label>
                            <input 
                                type="email" 
                                value={gmail} 
                                onChange={(e) => setGmail(e.target.value)} 
                                className="w-full p-4 mb-4 rounded-2xl border-2 border-gray-100 font-bold text-center bg-gray-50 outline-none focus:border-blue-500 transition-all" 
                                placeholder="VD: sep.crypto@gmail.com" 
                            />

                            <label className="block text-sm font-bold mb-2 text-gray-700">4. Tổng tiền thanh toán (VNĐ):</label>
                            <div className="w-full p-5 rounded-2xl bg-green-50 border-2 border-green-200 text-green-700 text-3xl font-black text-center shadow-inner mb-6">
                                {totalVND} <span className="text-lg font-bold">VNĐ</span>
                            </div>

                            {/* CẢNH BÁO NHẤP NHÁY */}
                            <div className="alert-box-powerful w-full bg-red-50 border-2 border-red-200 text-red-900 p-4 rounded-xl text-center mb-6">
                                <b className="text-red-700 text-sm uppercase block mb-1">🚨 CẢNH BÁO QUAN TRỌNG</b>
                                <p className="text-[11px] text-left leading-tight font-medium">• Chỉ giao dịch tài khoản <b>CHÍNH CHỦ</b>. Chịu trách nhiệm 100% nguồn tiền.<br/>• Chuyển <b>ĐÚNG NỘI DUNG</b> và <b>SỐ TÀI KHOẢN</b> trên QR!</p>
                            </div>

                            <button onClick={handleSendData} className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-transform text-lg flex justify-center items-center">
                                💳 LẤY MÃ QR THANH TOÁN
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 animate-fade-in max-w-md mx-auto">
                        <h2 className="text-lg font-black text-gray-800 px-2 flex justify-between items-center">
                            Lịch sử toàn hệ thống
                            <span className="text-[10px] font-normal text-gray-400 italic">Real-time</span>
                        </h2>
                        {MOCK_HISTORY.map((tx) => (
                            <div key={tx.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold text-white ${tx.type.includes('SWC') ? 'bg-blue-500' : 'bg-red-500'}`}>{tx.type}</span>
                                        <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-1 rounded">{tx.userId}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-medium">{tx.date} • {tx.id}</p>
                                    <span className={`text-[10px] font-bold ${tx.status === 'Hoàn thành' ? 'text-green-600' : 'text-red-500'}`}>{tx.status === 'Hoàn thành' ? '✓ Thành công' : '✕ Đã hủy'}</span>
                                </div>
                                <div className="text-right">
                                    <p className={`font-black text-base ${tx.status === 'Hoàn thành' ? 'text-green-600' : 'text-gray-300 line-through'}`}>+{tx.amountUSD} $</p>
                                    <p className="text-[10px] font-bold text-gray-400">{tx.amountVND} VNĐ</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 11. BOTTOM NAV BAR */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t p-2 flex justify-around shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-20 pb-safe">
                <button onClick={() => setActiveTab('trade')} className={`flex flex-col items-center p-2 transition-all ${activeTab === 'trade' ? 'text-blue-600 scale-110' : 'text-gray-400'}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    <span className="text-[10px] font-black mt-1">GIAO DỊCH</span>
                </button>
                <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center p-2 transition-all ${activeTab === 'history' ? 'text-blue-600 scale-110' : 'text-gray-400'}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    <span className="text-[10px] font-black mt-1">LỊCH SỬ</span>
                </button>
            </div>
        </div>
    );
}

export default App;
