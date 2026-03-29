import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';

// Định nghĩa kiểu dữ liệu
interface CryptoPrices {
    BTC: string; ETH: string; BNB: string; XRP: string; DOGE: string; CAKE: string;
}

interface Transaction {
    id: string; date: string; type: string; amountUSD: number; amountVND: string; status: 'Hoàn thành' | 'Bị huỷ';
}

const MOCK_HISTORY: Transaction[] = [
    { id: '#SWC102', date: '29/03/2026 14:30', type: 'Mua SWC', amountUSD: 1000, amountVND: '27.000.000', status: 'Hoàn thành' },
    { id: '#RSW098', date: '28/03/2026 09:15', type: 'Mua RSW', amountUSD: 500, amountVND: '13.500.000', status: 'Bị huỷ' },
    { id: '#SWC075', date: '25/03/2026 20:00', type: 'Mua SWC', amountUSD: 2000, amountVND: '54.000.000', status: 'Hoàn thành' }
];

function App() {
    const [activeTab, setActiveTab] = useState<'trade' | 'history'>('trade');
    const [amount, setAmount] = useState('');
    const [platform, setPlatform] = useState('SWC');
    const [gmail, setGmail] = useState('');
    
    // 🔥 CẬP NHẬT: State lưu tỷ giá từ Backend (Để mặc định là 27.0 nếu lỗi)
    const [backendRates, setBackendRates] = useState({ SWC: 27.0, RSW: 27.0 });

    const [prices, setPrices] = useState<CryptoPrices>({
        BTC: '...', ETH: '...', BNB: '...', XRP: '...', DOGE: '...', CAKE: '...'
    });
    
    const [tgUser, setTgUser] = useState({
        name: 'Khách Hàng',
        avatar: 'https://i.pravatar.cc/150?img=11', 
        rank: 'Thành Viên'
    });

    const BACKEND_URL = 'https://swc-bot-brain.onrender.com'; // URL Backend của sếp

    useEffect(() => {
        WebApp.ready();
        WebApp.expand();
        
        const user = WebApp.initDataUnsafe?.user;
        if (user) {
            setTgUser({
                name: user.first_name || 'Khách Hàng',
                avatar: user.photo_url || 'https://i.pravatar.cc/150?img=11',
                rank: 'Thành Viên' 
            });
        }

        // 🔥 CẬP NHẬT: Hàm lấy tỷ giá từ server (Đảm bảo khớp với Bot)
        const fetchExchangeRates = async () => {
            try {
                // Giả định backend có api /api/rates trả về { swc: 27.1, rsw: 27.2 }
                const response = await fetch(`${BACKEND_URL}/api/rates`);
                const data = await response.json();
                if (data.swc && data.rsw) {
                    setBackendRates({ SWC: data.swc, RSW: data.rsw });
                }
            } catch (e) {
                console.error("Lỗi lấy tỷ giá từ Backend, dùng giá từ URL...");
                // Nếu lỗi, lấy tạm từ URL như cũ làm phương án dự phòng
                const urlParams = new URLSearchParams(window.location.search);
                setBackendRates({
                    SWC: parseFloat(urlParams.get('swc') || '27.0'),
                    RSW: parseFloat(urlParams.get('rsw') || '27.0')
                });
            }
        };

        const fetchPrices = async () => {
            try {
                const binanceSymbols = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "XRPUSDT", "DOGEUSDT", "CAKEUSDT"];
                const url = `https://api.binance.com/api/v3/ticker/price?symbols=${encodeURIComponent(JSON.stringify(binanceSymbols))}`;
                const response = await fetch(url);
                const data = await response.json();
                
                const priceMap: any = {};
                data.forEach((item: any) => { priceMap[item.symbol] = item.price; });

                const formatP = (priceStr: string | undefined, decimals: number) => {
                    if (!priceStr) return '...';
                    return parseFloat(priceStr).toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals});
                };

                setPrices({
                    BTC: formatP(priceMap['BTCUSDT'], 2),
                    ETH: formatP(priceMap['ETHUSDT'], 2),
                    BNB: formatP(priceMap['BNBUSDT'], 2),
                    XRP: formatP(priceMap['XRPUSDT'], 4),
                    DOGE: formatP(price_map['DOGEUSDT'], 4),
                    CAKE: formatP(priceMap['CAKEUSDT'], 3)
                });
            } catch (e) { console.error("Lỗi lấy giá Binance:", e); }
        };

        fetchExchangeRates(); // Lấy tỷ giá SWC/RSW
        fetchPrices(); // Lấy giá Coin sàn Binance
        
        const interval = setInterval(() => {
            fetchPrices();
            fetchExchangeRates();
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    // Tính tổng tiền dựa trên giá lấy từ Backend
    const totalVND = (Number(amount) * backendRates[platform as keyof typeof backendRates] * 1000).toLocaleString('vi-VN');

    const handleSendData = () => {
        if (!amount || Number(amount) <= 0) {
            WebApp.showAlert("⚠️ Sếp vui lòng nhập số lượng USD hợp lệ!");
            return;
        }
        if (!gmail.trim()) {
            WebApp.showAlert("⚠️ Sếp vui lòng nhập Gmail để nhận biên lai!");
            return;
        }
        const payload = { 
            amount: Number(amount), 
            platform, 
            gmail: gmail.trim(),
            rate: backendRates[platform as keyof typeof backendRates] // Gửi luôn tỷ giá lúc mua về bot
        };
        WebApp.sendData(JSON.stringify(payload));
    };

    const coinBlocks = [
        { sym: 'BTC', p: prices.BTC, img: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png' },
        { sym: 'ETH', p: prices.ETH, img: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png' },
        { sym: 'BNB', p: prices.BNB, img: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png' },
        { sym: 'XRP', p: prices.XRP, img: 'https://s2.coinmarketcap.com/static/img/coins/64x64/52.png' },
        { sym: 'DOGE', p: prices.DOGE, img: 'https://s2.coinmarketcap.com/static/img/coins/64x64/74.png' },
        { sym: 'CAKE', p: prices.CAKE, img: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7186.png' }
    ];

    return (
        <div className="h-screen w-full bg-gray-50 font-sans text-black flex flex-col overflow-hidden relative">
            <style>{`
                @keyframes pulse-border-powerful {
                    0%, 100% { border-color: #fca5a5; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.2); }
                    50% { border-color: #ef4444; box-shadow: 0 0 15px 5px rgba(239, 68, 68, 0.6); }
                }
                .alert-box-powerful { animation: pulse-border-powerful 1.2s infinite; }
                @keyframes spin-slow { 100% { transform: rotate(360deg); } }
                @keyframes flash-glow {
                    0%, 100% { border-color: rgba(56, 189, 248, 1); box-shadow: 0 0 10px 2px rgba(56, 189, 248, 0.8); opacity: 1; }
                    50% { border-color: rgba(56, 189, 248, 0.2); box-shadow: 0 0 2px 0px rgba(56, 189, 248, 0.2); opacity: 0.5; }
                }
                .avatar-glow-container { position: relative; display: inline-block; border-radius: 50%; }
                .avatar-glow-container::before {
                    content: ''; position: absolute; inset: -4px; border-radius: 50%;
                    border: 2px dashed; 
                    animation: spin-slow 6s linear infinite, flash-glow 1s ease-in-out infinite;
                    z-index: 0; box-sizing: border-box;
                }
            `}</style>

            <div className="w-full bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-4 flex justify-between items-center rounded-b-3xl shadow-xl z-20 shrink-0 border-b border-blue-900">
                <div className="flex items-center gap-3">
                    <img src="https://i.postimg.cc/nLf79FLk/Do-Va-Va-ng-Ba-i-Da-ng-Facebook-Chu-c-Mu-ng-Te-t-Nguye-n-Da-n-Do-Ho-a.png" alt="Logo" className="w-11 h-11 rounded-full border-2 border-blue-400 object-cover bg-white" />
                    <div className="flex flex-col">
                        <span className="font-black text-blue-300 text-sm tracking-wide">TRỢ LÝ USDT</span>
                        <span className="text-[10px] text-blue-200 opacity-80">Nạp rút hỏa tốc</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                    <div className="flex flex-col">
                        <span className="font-bold text-sm text-gray-100">{tgUser.name}</span>
                        <span className="text-[10px] text-blue-400 font-semibold">{tgUser.rank}</span>
                    </div>
                    <div className="avatar-glow-container w-10 h-10">
                        <img src={tgUser.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover relative z-10 border border-gray-700 bg-gray-800" />
                    </div>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto pb-24 p-4">
                {activeTab === 'trade' && (
                    <div className="w-full max-w-md mx-auto flex flex-col gap-4">
                        <div className="w-full grid grid-cols-3 gap-2 mb-2">
                            {coinBlocks.map(coin => (
                                <div key={coin.sym} className="bg-white border border-gray-100 py-3 px-2 rounded-xl flex flex-col justify-center items-center shadow-sm">
                                    <img src={coin.img} className="w-6 h-6 mb-1" alt={coin.sym} />
                                    <span className="text-[10px] font-bold text-gray-500">{coin.sym}</span>
                                    <span className="text-xs font-black text-green-500">${coin.p}</span>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white p-5 rounded-3xl shadow-lg border border-gray-100 mt-2">
                            <label className="block text-sm font-bold mb-3 text-gray-700">1. Chọn dự án:</label>
                            <div className="w-full grid grid-cols-2 gap-3 mb-5">
                                <button onClick={() => setPlatform('SWC')} className={`p-4 rounded-2xl text-center transition-all ${platform === 'SWC' ? 'bg-blue-600 text-white scale-105 ring-4 ring-blue-200' : 'bg-gray-100 text-gray-500'}`}>
                                    <p className="text-[10px] font-bold uppercase mb-1">Giá Quỹ SWC</p>
                                    <p className="text-2xl font-black">{backendRates.SWC}</p>
                                </button>
                                <button onClick={() => setPlatform('RSW')} className={`p-4 rounded-2xl text-center transition-all ${platform === 'RSW' ? 'bg-red-600 text-white scale-105 ring-4 ring-red-200' : 'bg-gray-100 text-gray-500'}`}>
                                    <p className="text-[10px] font-bold uppercase mb-1">Giá Quỹ RSW</p>
                                    <p className="text-2xl font-black">{backendRates.RSW}</p>
                                </button>
                            </div>

                            <label className="block text-sm font-bold mb-2 text-gray-700">2. Số lượng USD muốn mua:</label>
                            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-4 mb-4 rounded-2xl border border-gray-200 font-black text-center text-xl text-blue-600 bg-gray-50 outline-none focus:bg-white" placeholder="VD: 1000" />

                            <label className="block text-sm font-bold mb-2 text-gray-700">3. Gmail của bạn:</label>
                            <input type="email" value={gmail} onChange={(e) => setGmail(e.target.value)} className="w-full p-4 mb-5 rounded-2xl border border-gray-200 font-bold text-center text-lg text-gray-800 bg-gray-50 outline-none focus:bg-white" placeholder="VD: sep@gmail.com" />

                            <label className="block text-sm font-bold mb-2 text-gray-700">4. Tổng tiền thanh toán:</label>
                            <div className="w-full p-4 mb-6 rounded-2xl bg-green-50 border border-green-200 text-green-700 text-2xl font-black text-center">
                                {totalVND} <span className="text-lg font-bold text-green-600">VNĐ</span>
                            </div>

                            <div className="alert-box-powerful w-full bg-red-50 border border-red-200 text-red-900 p-4 rounded-xl text-center mb-6">
                                <b className="text-red-700 text-sm uppercase block mb-1">🚨 Cảnh báo quan trọng!</b>
                                <p className="text-[11px] text-left leading-relaxed opacity-90">
                                    • Giao dịch bằng tài khoản chính chủ.<br/>
                                    • Chuyển đúng nội dung và số tài khoản in trên mã QR!
                                </p>
                            </div>

                            <button onClick={handleSendData} className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-transform text-lg">
                                💳 LẤY MÃ QR THANH TOÁN
                            </button>
                        </div>
                    </div>
                )}
                {/* Lịch sử giữ nguyên như code của sếp */}
            </div>

            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex justify-around items-center pb-safe pt-2 px-2 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-20">
                <button onClick={() => setActiveTab('trade')} className={`flex flex-col items-center p-2 w-24 ${activeTab === 'trade' ? 'text-blue-600' : 'text-gray-400'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
                    <span className="text-[10px] font-bold mt-1">Giao Dịch</span>
                </button>
                <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center p-2 w-24 ${activeTab === 'history' ? 'text-blue-600' : 'text-gray-400'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg>
                    <span className="text-[10px] font-bold mt-1">Lịch Sử</span>
                </button>
            </div>
        </div>
    );
}

export default App;
