import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';

interface CryptoPrices {
    BTC: string; ETH: string; DOGE: string; XRP: string;
}

function App() {
    const [amount, setAmount] = useState('');
    const [platform, setPlatform] = useState('SWC');
    const [gmail, setGmail] = useState('');
    const [prices, setPrices] = useState<CryptoPrices>({ BTC: '...', ETH: '...', DOGE: '...', XRP: '...' });

    // ĐỌC GIÁ TỪ BOT GỬI QUA URL
    const urlParams = new URLSearchParams(window.location.search);
    const rateSWC = parseFloat(urlParams.get('swc') || '27.0');
    const rateRSW = parseFloat(urlParams.get('rsw') || '27.0');

    const rates: Record<string, number> = { SWC: rateSWC, RSW: rateRSW };

    useEffect(() => {
        WebApp.ready();
        WebApp.expand();
        
        const fetchPrices = async () => {
            try {
                const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbols=["BTCUSDT","ETHUSDT","DOGEUSDT","XRPUSDT"]');
                const data = await response.json();
                const priceMap: any = {};
                data.forEach((item: any) => { priceMap[item.symbol] = item.price; });

                setPrices({
                    BTC: parseFloat(priceMap['BTCUSDT']).toLocaleString('en-US', {minimumFractionDigits: 2}),
                    ETH: parseFloat(priceMap['ETHUSDT']).toLocaleString('en-US', {minimumFractionDigits: 2}),
                    DOGE: parseFloat(priceMap['DOGEUSDT']).toLocaleString('en-US', {minimumFractionDigits: 4}),
                    XRP: parseFloat(priceMap['XRPUSDT']).toLocaleString('en-US', {minimumFractionDigits: 4}),
                });
            } catch (e) { console.error(e); }
        };
        fetchPrices();
        const interval = setInterval(fetchPrices, 10000);
        return () => clearInterval(interval);
    }, []);

    const totalVND = (Number(amount) * rates[platform] * 1000).toLocaleString('vi-VN');

    // KIỂM TRA ĐIỀU KIỆN & GỬI DỮ LIỆU
    const handleSendData = () => {
        if (!amount || Number(amount) <= 0) {
            WebApp.showAlert("⚠️ Sếp vui lòng nhập số lượng USD muốn giao dịch!");
            return;
        }
        if (!gmail.trim()) {
            WebApp.showAlert("⚠️ Sếp vui lòng nhập Gmail để nhận biên lai nhé!");
            return;
        }

        const payload = {
            amount: Number(amount),
            platform,
            gmail: gmail.trim()
        };
        WebApp.sendData(JSON.stringify(payload));
    };

    return (
        <div className="min-h-screen w-full flex flex-col bg-gray-50 font-sans text-black relative">
            
            {/* THÊM CSS CHO CHỮ CHẠY & HIỆU ỨNG NHẤP NHÁY MẠNH */}
            <style>{`
                @keyframes scroll {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                .animate-marquee {
                    display: inline-block;
                    white-space: nowrap;
                    animation: scroll 15s linear infinite;
                }
                @keyframes pulse-border {
                    0%, 100% { border-color: #fca5a5; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                    50% { border-color: #ef4444; box-shadow: 0 0 10px 2px rgba(239, 68, 68, 0.8); }
                }
                .alert-box {
                    animation: pulse-border 1.5s infinite;
                }
            `}</style>

            {/* THANH TIÊU ĐỀ CỐ ĐỊNH (GIÁ QUỸ) */}
            <div className="bg-white shadow-md z-10 sticky top-0 left-0 w-full border-b border-gray-200">
                <div className="flex justify-between items-center p-4">
                    <div className="flex flex-col items-start">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Giá Quỹ SWC</span>
                        <span className="text-xl font-black text-blue-600">{rateSWC}</span>
                    </div>
                    <div className="h-8 w-px bg-gray-200"></div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Giá Quỹ RSW</span>
                        <span className="text-xl font-black text-red-600">{rateRSW}</span>
                    </div>
                </div>

                {/* THANH CHẠY GIÁ COIN (MARQUEE) */}
                <div className="bg-gray-900 text-green-400 text-xs py-2 overflow-hidden w-full border-t border-gray-800 flex items-center font-mono">
                    <div className="animate-marquee font-bold tracking-wide">
                        🔥 BTC: ${prices.BTC} &nbsp;&nbsp;&nbsp; 🚀 ETH: ${prices.ETH} &nbsp;&nbsp;&nbsp; 🐕 DOGE: ${prices.DOGE} &nbsp;&nbsp;&nbsp; 💧 XRP: ${prices.XRP} &nbsp;&nbsp;&nbsp; 
                        🔥 BTC: ${prices.BTC} &nbsp;&nbsp;&nbsp; 🚀 ETH: ${prices.ETH} &nbsp;&nbsp;&nbsp; 🐕 DOGE: ${prices.DOGE} &nbsp;&nbsp;&nbsp; 💧 XRP: ${prices.XRP}
                    </div>
                </div>
            </div>

            {/* PHẦN NỘI DUNG CHÍNH */}
            <div className="w-full max-w-md mx-auto p-4 pt-6 flex-grow flex flex-col">
                
                {/* KHUNG CẢNH BÁO NHẤP NHÁY LÀM NỔI BẬT */}
                <div className="alert-box bg-red-50 border-2 rounded-xl p-4 mb-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-red-600"></div>
                    <h3 className="text-red-700 font-black text-sm uppercase flex items-center mb-2">
                        <span className="text-xl mr-2">🚨</span> Cảnh báo cực kỳ quan trọng!
                    </h3>
                    <p className="text-xs text-red-900 font-semibold leading-relaxed ml-2">
                        • Chỉ giao dịch bằng <b>TÀI KHOẢN CHÍNH CHỦ</b>. Người mua chịu trách nhiệm 100% về nguồn tiền nếu xảy ra vấn đề pháp lý.<br/><br/>
                        • Bắt buộc chuyển <b className="bg-yellow-200 text-red-700 px-1">ĐÚNG SỐ TÀI KHOẢN</b> và <b className="bg-yellow-200 text-red-700 px-1">ĐÚNG NỘI DUNG</b> yêu cầu in trên mã QR!
                    </p>
                </div>

                {/* FORM GIAO DỊCH */}
                <div className="bg-white p-5 rounded-3xl shadow-lg border border-gray-100 flex-grow">
                    
                    <label className="block text-sm font-bold mb-2 text-gray-700">1. Chọn dự án:</label>
                    <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full p-4 mb-5 rounded-2xl border-2 border-gray-100 font-bold bg-gray-50 outline-none focus:border-blue-500 focus:bg-white transition-colors">
                        <option value="SWC">🔵 Quỹ SWC</option>
                        <option value="RSW">🔴 Quỹ RSW</option>
                    </select>

                    <label className="block text-sm font-bold mb-2 text-gray-700">2. Số lượng USD:</label>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-4 mb-5 rounded-2xl border-2 border-gray-100 font-black outline-none text-center text-2xl text-blue-600 bg-gray-50 focus:border-blue-500 focus:bg-white transition-colors placeholder-gray-300" placeholder="VD: 1000" />

                    <label className="block text-sm font-bold mb-2 text-gray-700">3. Gmail nhận biên lai:</label>
                    <input 
                        type="email" 
                        value={gmail} 
                        onChange={(e) => setGmail(e.target.value)} 
                        className="w-full p-4 mb-6 rounded-2xl border-2 border-gray-100 font-bold outline-none text-center text-lg text-gray-800 bg-gray-50 focus:border-blue-500 focus:bg-white transition-colors placeholder-gray-300" 
                        placeholder="VD: sep@gmail.com" 
                    />

                    <label className="block text-sm font-bold mb-2 text-gray-700">4. Tổng tiền cần thanh toán:</label>
                    <div className="w-full p-4 mb-6 rounded-2xl bg-green-50 border-2 border-green-200 text-green-700 text-3xl font-black text-center shadow-inner">
                        {totalVND} <span className="text-lg font-bold text-green-600">VNĐ</span>
                    </div>

                    <button onClick={handleSendData} className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-transform flex justify-center items-center text-lg mt-auto">
                        <span className="text-2xl mr-2">💳</span> LẤY MÃ QR NGAY
                    </button>
                </div>

            </div>
        </div>
    );
}

export default App;
