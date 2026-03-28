import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';

// Định nghĩa kiểu dữ liệu
interface CryptoPrices {
    BTC: string; ETH: string; BNB: string; XRP: string; DOGE: string; LINK: string; CAKE: string; ADA: string;
}

interface Transaction {
    id: string; date: string; type: string; amountUSD: number; amountVND: string; status: 'Hoàn thành' | 'Bị huỷ';
}

// DỮ LIỆU LỊCH SỬ MẪU (UI) - Đã thêm trạng thái Hoàn thành / Bị huỷ
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
    
    // State lưu giá 8 Coin
    const [prices, setPrices] = useState<CryptoPrices>({
        BTC: '...', ETH: '...', BNB: '...', XRP: '...', DOGE: '...', LINK: '...', CAKE: '...', ADA: '...'
    });
    
    // Lưu thông tin User Telegram
    const [tgUser, setTgUser] = useState({
        name: 'Khách Hàng',
        avatar: 'https://i.pravatar.cc/150?img=11', 
        rank: 'Thành Viên'
    });

    const urlParams = new URLSearchParams(window.location.search);
    const rateSWC = parseFloat(urlParams.get('swc') || '27.0');
    const rateRSW = parseFloat(urlParams.get('rsw') || '27.0');
    const rates: Record<string, number> = { SWC: rateSWC, RSW: rateRSW };

    // 8 Đồng coin hiển thị dạng khối Block
    const binanceSymbols = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "XRPUSDT", "DOGEUSDT", "LINKUSDT", "CAKEUSDT", "ADAUSDT"];

    useEffect(() => {
        WebApp.ready();
        WebApp.expand();
        
        // Lấy Data User từ Telegram
        const user = WebApp.initDataUnsafe?.user;
        if (user) {
            setTgUser({
                name: user.first_name || 'Khách Hàng',
                avatar: user.photo_url || 'https://i.pravatar.cc/150?img=11',
                rank: 'Thành Viên' 
            });
        }

        const fetchPrices = async () => {
            try {
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
                    DOGE: formatP(priceMap['DOGEUSDT'], 4),
                    LINK: formatP(priceMap['LINKUSDT'], 2),
                    CAKE: formatP(priceMap['CAKEUSDT'], 3),
                    ADA: formatP(priceMap['ADAUSDT'], 4)
                });
            } catch (e) { console.error("Lỗi lấy giá Binance:", e); }
        };

        fetchPrices();
        const interval = setInterval(fetchPrices, 10000);
        return () => clearInterval(interval);
    }, []);

    const totalVND = (Number(amount) * rates[platform] * 1000).toLocaleString('vi-VN');

    const handleSendData = () => {
        if (!amount || Number(amount) <= 0) {
            WebApp.showAlert("⚠️ Sếp vui lòng nhập số lượng USD hợp lệ!");
            return;
        }
        if (!gmail.trim()) {
            WebApp.showAlert("⚠️ Sếp vui lòng nhập Gmail để nhận biên lai!");
            return;
        }
        const payload = { amount: Number(amount), platform, gmail: gmail.trim() };
        WebApp.sendData(JSON.stringify(payload));
    };

    return (
        <div className="h-screen w-full bg-gray-50 font-sans text-black flex flex-col overflow-hidden relative">
            
            {/* CSS TỔNG HỢP (ANIMATION AVATAR & CẢNH BÁO) */}
            <style>{`
                @keyframes pulse-border-powerful {
                    0%, 100% { border-color: #fca5a5; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.2); }
                    50% { border-color: #ef4444; box-shadow: 0 0 15px 5px rgba(239, 68, 68, 0.6); }
                }
                .alert-box-powerful { animation: pulse-border-powerful 1.2s infinite; }

                @keyframes spin-slow { 100% { transform: rotate(360deg); } }
                .avatar-glow-container { position: relative; display: inline-block; border-radius: 50%; }
                .avatar-glow-container::before {
                    content: ''; position: absolute; inset: -4px; border-radius: 50%;
                    border: 2px dashed #38bdf8; 
                    animation: spin-slow 8s linear infinite;
                    filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.8));
                    z-index: 0;
                }
            `}</style>

            {/* HEADER DARK MODE XỊN XÒ */}
            <div className="w-full bg-gray-950 text-white p-4 flex justify-between items-center rounded-b-3xl shadow-xl z-20 shrink-0 border-b border-gray-800">
                <div className="flex items-center gap-3">
                    
                    {/* 👇 SẾP DÁN LINK ẢNH LOGO VÀO CHỖ src="..." BÊN DƯỚI NHÉ 👇 */}
                    <img 
                        src="https://photos.app.goo.gl/i8BVUufxfV1XB41t5" 
                        alt="Logo SWC" 
                        className="w-10 h-10 rounded-full border border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] object-cover bg-white" 
                    />
                    
                    <div className="flex flex-col">
                        <span className="font-black text-blue-400 text-sm tracking-wide">TRỢ LÝ USDT</span>
                        <span className="text-[10px] text-gray-400">Nạp rút hỏa tốc</span>
                    </div>
                </div>

                {/* Góc phải: Tên User + Avatar phát sáng */}
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

            {/* KHU VỰC NỘI DUNG CHÍNH */}
            <div className="flex-grow overflow-y-auto pb-24 p-4 block">
                
                {/* HIỂN THỊ TAB: GIAO DỊCH */}
                {activeTab === 'trade' && (
                    <div className="w-full max-w-md mx-auto flex flex-col gap-4 block">
                        
                        {/* 1. KHỐI 8 COIN (Xếp 4 cột - 2 hàng cho gọn, không bị chiếm hết màn hình) */}
                        <div className="w-full grid grid-cols-4 gap-2 mb-2">
                            {[
                                { sym: 'BTC', p: prices.BTC, img: 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=032' },
                                { sym: 'ETH', p: prices.ETH, img: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=032' },
                                { sym: 'BNB', p: prices.BNB, img: 'https://cryptologos.cc/logos/bnb-bnb-logo.svg?v=032' },
                                { sym: 'XRP', p: prices.XRP, img: 'https://cryptologos.cc/logos/xrp-xrp-logo.svg?v=032' },
                                { sym: 'DOGE', p: prices.DOGE, img: 'https://cryptologos.cc/logos/dogecoin-doge-logo.svg?v=032' },
                                { sym: 'LINK', p: prices.LINK, img: 'https://cryptologos.cc/logos/chainlink-link-logo.svg?v=032' },
                                { sym: 'CAKE', p: prices.CAKE, img: 'https://cryptologos.cc/logos/pancakeswap-cake-logo.svg?v=032' },
                                { sym: 'ADA', p: prices.ADA, img: 'https://cryptologos.cc/logos/cardano-ada-logo.svg?v=032' }
                            ].map(coin => (
                                <div key={coin.sym} className="bg-white border border-gray-100 p-2 rounded-xl flex flex-col justify-center items-center shadow-sm">
                                    <img src={coin.img} className="w-6 h-6 mb-1" alt={coin.sym} />
                                    <span className="text-[10px] font-bold text-gray-500">{coin.sym}</span>
                                    <span className="text-xs font-black text-green-500">${coin.p}</span>
                                </div>
                            ))}
                        </div>

                        {/* 2. FORM GIAO DỊCH TỔNG HỢP */}
                        <div className="w-full bg-white p-5 sm:p-6 rounded-3xl shadow-lg border border-gray-100 mt-2 block">
                            
                            <label className="block text-sm font-bold mb-3 text-gray-700">1. Chọn dự án:</label>
                            <div className="w-full grid grid-cols-2 gap-3 mb-5">
                                <button onClick={() => setPlatform('SWC')} className={`p-4 rounded-2xl text-center shadow-sm transition-all duration-200 ${platform === 'SWC' ? 'bg-blue-600 text-white scale-105 ring-4 ring-blue-200' : 'bg-gray-100 text-gray-500'}`}>
                                    <p className="text-[10px] font-bold uppercase mb-1">Giá Quỹ SWC</p>
                                    <p className="text-2xl font-black">{rateSWC}</p>
                                </button>
                                <button onClick={() => setPlatform('RSW')} className={`p-4 rounded-2xl text-center shadow-sm transition-all duration-200 ${platform === 'RSW' ? 'bg-red-600 text-white scale-105 ring-4 ring-red-200' : 'bg-gray-100 text-gray-500'}`}>
                                    <p className="text-[10px] font-bold uppercase mb-1">Giá Quỹ RSW</p>
                                    <p className="text-2xl font-black">{rateRSW}</p>
                                </button>
                            </div>

                            <label className="block text-sm font-bold mb-2 text-gray-700">2. Số lượng USD muốn mua:</label>
                            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-4 mb-4 rounded-2xl border border-gray-200 font-black outline-none text-center text-xl text-blue-600 bg-gray-50 focus:border-blue-500 transition-colors" placeholder="VD: 1000" />

                            <label className="block text-sm font-bold mb-2 text-gray-700">3. Gmail nhận biên lai:</label>
                            <input type="email" value={gmail} onChange={(e) => setGmail(e.target.value)} className="w-full p-4 mb-5 rounded-2xl border border-gray-200 font-bold outline-none text-center text-lg text-gray-800 bg-gray-50 focus:border-blue-500 transition-colors" placeholder="VD: sep@gmail.com" />

                            <label className="block text-sm font-bold mb-2 text-gray-700">4. Tổng tiền cần thanh toán:</label>
                            <div className="w-full p-4 mb-6 rounded-2xl bg-green-50 border border-green-200 text-green-700 text-2xl font-black text-center">
                                {totalVND} <span className="text-lg font-bold text-green-600">VNĐ</span>
                            </div>

                            {/* CẢNH BÁO NHẤP NHÁY */}
                            <div className="alert-box-powerful w-full bg-red-50 border border-red-200 text-red-900 p-4 rounded-xl text-center mb-6">
                                <b className="text-red-700 text-sm uppercase block mb-1">🚨 Cảnh báo quan trọng!</b>
                                <p className="text-xs text-left leading-relaxed">
                                    • Giao dịch bằng <b>TÀI KHOẢN CHÍNH CHỦ</b>.<br/>
                                    • Bắt buộc chuyển <b className="bg-yellow-200 text-red-700 px-1">ĐÚNG NỘI DUNG</b> và <b className="bg-yellow-200 text-red-700 px-1">SỐ TÀI KHOẢN</b> trên QR!
                                </p>
                            </div>

                            <button onClick={handleSendData} className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-transform text-lg flex justify-center items-center">
                                💳 LẤY MÃ QR NGAY
                            </button>
                        </div>
                    </div>
                )}

                {/* HIỂN THỊ TAB: LỊCH SỬ */}
                {activeTab === 'history' && (
                    <div className="flex flex-col gap-4 animate-fade-in max-w-md mx-auto">
                        <h2 className="text-lg font-black text-gray-800 px-2">Lịch sử giao dịch gần đây</h2>
                        {MOCK_HISTORY.map((tx) => (
                            <div key={tx.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tx.type.includes('SWC') ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                            {tx.type}
                                        </span>
                                        <span className="text-xs text-gray-400">{tx.id}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium mb-1">{tx.date}</p>
                                    
                                    {/* TRẠNG THÁI HOÀN THÀNH / BỊ HUỶ */}
                                    <p className={`text-xs font-bold ${tx.status === 'Hoàn thành' ? 'text-green-600' : 'text-red-500'}`}>
                                        {tx.status === 'Hoàn thành' ? '✓ Hoàn thành' : '✕ Bị huỷ'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-black text-lg ${tx.status === 'Hoàn thành' ? 'text-green-600' : 'text-gray-400 line-through'}`}>
                                        {tx.status === 'Hoàn thành' ? '+' : ''}{tx.amountUSD} $
                                    </p>
                                    <p className="text-xs font-bold text-gray-400">{tx.amountVND} VNĐ</p>
                                </div>
                            </div>
                        ))}
                        <div className="text-center text-xs text-gray-400 mt-4">
                            <i>Đây là dữ liệu mẫu. Tính năng đồng bộ Data đang được phát triển...</i>
                        </div>
                    </div>
                )}
            </div>

            {/* BOTTOM NAVIGATION (MENU DƯỚI CÙNG CỐ ĐỊNH) */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex justify-around items-center pb-safe pt-2 px-2 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-20">
                <button 
                    onClick={() => setActiveTab('trade')} 
                    className={`flex flex-col items-center p-2 w-24 transition-colors ${activeTab === 'trade' ? 'text-blue-600' : 'text-gray-400'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    <span className="text-[10px] font-bold mt-1">Giao Dịch</span>
                </button>
                
                <button 
                    onClick={() => setActiveTab('history')} 
                    className={`flex flex-col items-center p-2 w-24 transition-colors ${activeTab === 'history' ? 'text-blue-600' : 'text-gray-400'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    <span className="text-[10px] font-bold mt-1">Lịch Sử</span>
                </button>
            </div>

        </div>
    );
}

export default App;
