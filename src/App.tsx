import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';

function App() {
    const [amount, setAmount] = useState('');
    const [platform, setPlatform] = useState('SWC'); // Mặc định SWC
    const [gmail, setGmail] = useState('');
    
    // State lưu giá Top 10 Coin
    const [prices, setPrices] = useState<Record<string, string>>({
        BTC: '...', ETH: '...', BNB: '...', SOL: '...', XRP: '...', 
        DOGE: '...', ADA: '...', AVAX: '...', DOT: '...', LINK: '...'
    });

    // ĐỌC GIÁ TỪ BOT GỬI QUA URL
    const urlParams = new URLSearchParams(window.location.search);
    const rateSWC = parseFloat(urlParams.get('swc') || '27.0');
    const rateRSW = parseFloat(urlParams.get('rsw') || '27.0');

    const rates: Record<string, number> = { SWC: rateSWC, RSW: rateRSW };

    // Danh sách symbol gửi lên Binance API
    const top10Symbols = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT", "DOGEUSDT", "ADAUSDT", "AVAXUSDT", "DOTUSDT", "LINKUSDT"];
    // Danh sách hiển thị
    const displayCoins = ["BTC", "ETH", "BNB", "SOL", "XRP", "DOGE", "ADA", "AVAX", "DOT", "LINK"];

    useEffect(() => {
        WebApp.ready();
        WebApp.expand();
        
        const fetchPrices = async () => {
            try {
                // Lấy 1 lần Top 10 Coin từ Binance
                const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbols=${JSON.stringify(top10Symbols)}`);
                const data = await response.json();
                
                const priceMap: any = {};
                data.forEach((item: any) => { priceMap[item.symbol] = item.price; });

                setPrices({
                    BTC: parseFloat(priceMap['BTCUSDT']).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
                    ETH: parseFloat(priceMap['ETHUSDT']).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
                    BNB: parseFloat(priceMap['BNBUSDT']).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
                    SOL: parseFloat(priceMap['SOLUSDT']).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
                    XRP: parseFloat(priceMap['XRPUSDT']).toLocaleString('en-US', {minimumFractionDigits: 4, maximumFractionDigits: 4}),
                    DOGE: parseFloat(priceMap['DOGEUSDT']).toLocaleString('en-US', {minimumFractionDigits: 4, maximumFractionDigits: 4}),
                    ADA: parseFloat(priceMap['ADAUSDT']).toLocaleString('en-US', {minimumFractionDigits: 4, maximumFractionDigits: 4}),
                    AVAX: parseFloat(priceMap['AVAXUSDT']).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
                    DOT: parseFloat(priceMap['DOTUSDT']).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
                    LINK: parseFloat(priceMap['LINKUSDT']).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
                });
            } catch (e) { console.error("Lỗi lấy giá Binance:", e); }
        };

        fetchPrices();
        const interval = setInterval(fetchPrices, 10000); // Tự động cập nhật 10s/lần
        return () => clearInterval(interval);
    }, []);

    const totalVND = (Number(amount) * rates[platform] * 1000).toLocaleString('vi-VN');

    // KIỂM TRA ĐIỀU KIỆN & GỬI DỮ LIỆU CHUẨN XÁC
    const handleSendData = () => {
        if (!amount || Number(amount) <= 0) {
            WebApp.showAlert("⚠️ Sếp vui lòng nhập số lượng USD hợp lệ!");
            return;
        }
        if (!gmail.trim()) {
            WebApp.showAlert("⚠️ Sếp vui lòng nhập Gmail của bạn để nhận biên lai!");
            return;
        }

        const payload = {
            amount: Number(amount),
            platform,
            gmail: gmail.trim()
        };
        WebApp.sendData(JSON.stringify(payload));
    };

    // Chuỗi nội dung chạy Marquee
    const marqueeContent = displayCoins.map(sym => `🔥 ${sym}: $${prices[sym]}`).join('   |   ');

    return (
        <div className="min-h-screen w-full flex flex-col bg-gray-50 font-sans text-black relative">
            
            {/* CSS TÙY CHỈNH CHO HIỆU ỨNG */}
            <style>{`
                @keyframes scroll {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                .animate-marquee-advanced {
                    display: inline-block;
                    white-space: nowrap;
                    animation: scroll 25s linear infinite;
                }
                @keyframes pulse-border-powerful {
                    0%, 100% { border-color: #fca5a5; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.2); }
                    50% { border-color: #ef4444; box-shadow: 0 0 15px 5px rgba(239, 68, 68, 0.6); }
                }
                .alert-box-powerful {
                    animation: pulse-border-powerful 1.2s infinite;
                }
            `}</style>

            <div className="w-full max-w-md mx-auto p-4 pt-6 flex-grow flex flex-col">
                
                {/* 1. THANH TICKER CHẠY TOP 10 COIN (NẰM TRÊN CÙNG) */}
                <div className="bg-gray-900 text-green-400 text-xs py-3 overflow-hidden w-full flex items-center mb-4 font-mono rounded-xl shadow-inner border-2 border-gray-800">
                    <div className="animate-marquee-advanced font-bold tracking-wide">
                        {marqueeContent} &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp; {marqueeContent}
                    </div>
                </div>

                {/* 2. BỐN KHỐI BÁO GIÁ CRYPTO TO */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {[
                        { sym: 'BTC', p: prices.BTC, img: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/btc.png' },
                        { sym: 'ETH', p: prices.ETH, img: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/eth.png' },
                        { sym: 'DOGE', p: prices.DOGE, img: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/doge.png' },
                        { sym: 'XRP', p: prices.XRP, img: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/xrp.png' }
                    ].map(coin => (
                        <div key={coin.sym} className="bg-white border-2 border-gray-100 p-4 rounded-2xl flex flex-col justify-center items-center shadow-sm">
                            <div className="flex items-center mb-1">
                                <img src={coin.img} className="w-6 h-6 mr-2" alt={coin.sym} />
                                <span className="text-sm font-bold text-gray-500">{coin.sym}</span>
                            </div>
                            <span className="text-xl font-black text-green-500">${coin.p}</span>
                        </div>
                    ))}
                </div>

                {/* FORM GIAO DỊCH TỔNG HỢP */}
                <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 flex-grow flex flex-col">
                    
                    {/* 3. HAI NÚT BÁO GIÁ NỘI BỘ TO (CÓ THỂ BẤM CHỌN LUÔN) */}
                    <label className="block text-sm font-bold mb-2 text-gray-700">1. Chọn dự án:</label>
                    <div className="grid grid-cols-2 gap-4 mb-5">
                        <button onClick={() => setPlatform('SWC')} className={`bg-blue-600 text-white p-4 rounded-2xl text-center shadow-md transform transition-transform active:scale-95 ${platform === 'SWC' ? 'ring-4 ring-blue-300 scale-[1.02]' : 'opacity-90'}`}>
                            <p className="text-[11px] font-bold uppercase tracking-wider mb-1">Giá Quỹ SWC</p>
                            <p className="text-2xl font-black">{rateSWC}</p>
                        </button>
                        <button onClick={() => setPlatform('RSW')} className={`bg-red-600 text-white p-4 rounded-2xl text-center shadow-md transform transition-transform active:scale-95 ${platform === 'RSW' ? 'ring-4 ring-red-300 scale-[1.02]' : 'opacity-90'}`}>
                            <p className="text-[11px] font-bold uppercase tracking-wider mb-1">Giá Quỹ RSW</p>
                            <p className="text-2xl font-black">{rateRSW}</p>
                        </button>
                    </div>

                    {/* 4. FORM NHẬP THÔNG TIN */}
                    <label className="block text-sm font-bold mb-2 text-gray-700">2. Số lượng USD muốn mua:</label>
                    <input 
                        type="number" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)} 
                        className="w-full p-4 mb-5 rounded-2xl border-2 border-gray-100 font-black outline-none text-center text-2xl text-blue-600 bg-gray-50 focus:border-blue-500 focus:bg-white transition-colors placeholder-gray-300" 
                        placeholder="VD: 1000" 
                    />

                    <label className="block text-sm font-bold mb-2 text-gray-700">3. Gmail nhận biên lai:</label>
                    <input 
                        type="email" 
                        value={gmail} 
                        onChange={(e) => setGmail(e.target.value)} 
                        className="w-full p-4 mb-5 rounded-2xl border-2 border-gray-100 font-bold outline-none text-center text-lg text-gray-800 bg-gray-50 focus:border-blue-500 focus:bg-white transition-colors placeholder-gray-300" 
                        placeholder="VD: sep.crypto@gmail.com" 
                    />

                    <label className="block text-sm font-bold mb-2 text-gray-700">4. Tổng tiền cần thanh toán:</label>
                    <div className="w-full p-4 mb-6 rounded-2xl bg-green-50 border-2 border-green-200 text-green-700 text-3xl font-black text-center shadow-inner">
                        {totalVND} <span className="text-xl font-bold text-green-600">VNĐ</span>
                    </div>

                    {/* 5. KHUNG CẢNH BÁO NHẤP NHÁY */}
                    <div className="alert-box-powerful bg-red-50 border-2 border-red-200 text-red-900 p-4 rounded-xl text-center leading-relaxed font-semibold mb-6 flex items-start">
                        <span className="text-3xl mr-3 mt-1">🚨</span>
                        <div className="text-xs text-left">
                            <b className="text-red-700 text-sm uppercase">Cảnh báo cực kỳ quan trọng!</b><br/><br/>
                            • Chỉ giao dịch bằng <b>TÀI KHOẢN CHÍNH CHỦ</b>. Người mua chịu trách nhiệm 100% về nguồn tiền nếu xảy ra vấn đề pháp lý.<br/><br/>
                            • Bắt buộc chuyển <b className="bg-yellow-200 text-red-700 px-1 rounded">ĐÚNG NỘI DUNG</b> và <b className="bg-yellow-200 text-red-700 px-1 rounded">SỐ TÀI KHOẢN</b> yêu cầu in trên mã QR!
                        </div>
                    </div>

                    {/* 6. NÚT SUBMIT LẤY MÃ QR */}
                    <button onClick={handleSendData} className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-transform flex justify-center items-center text-lg mt-auto">
                        <span className="text-2xl mr-2">💳</span> LẤY MÃ QR NGAY
                    </button>
                </div>

            </div>
        </div>
    );
}

export default App;
