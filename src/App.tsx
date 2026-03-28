import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';

// Khai báo kiểu dữ liệu
interface CryptoPrices {
    BTC: string;
    ETH: string;
    DOGE: string;
    XRP: string;
}

function App() {
    const [amount, setAmount] = useState('');
    const [platform, setPlatform] = useState('SWC');
    const [prices, setPrices] = useState<CryptoPrices>({ BTC: '...', ETH: '...', DOGE: '...', XRP: '...' });

    // ĐỌC GIÁ TỪ URL MÀ BOT GỬI SANG (SWC, RSW)
    const urlParams = new URLSearchParams(window.location.search);
    const rateSWC = parseFloat(urlParams.get('swc') || '27.0');
    const rateRSW = parseFloat(urlParams.get('rsw') || '27.0');

    // Khai báo tỷ giá
    const rates: Record<string, number> = {
        SWC: rateSWC,
        RSW: rateRSW
    };

    // Chuẩn bị App & Lấy giá Binance
    useEffect(() => {
        WebApp.ready();
        WebApp.expand();

        // Ép màu nền App sáng
        WebApp.setHeaderColor('#f9fafb');
        WebApp.setBackgroundColor('#f9fafb');

        const fetchPrices = async () => {
            try {
                // Lấy giá list coin yêu cầu
                const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbols=["BTCUSDT","ETHUSDT","DOGEUSDT","XRPUSDT"]');
                const data = await response.json();
                
                const priceMap: any = {};
                data.forEach((item: any) => {
                    priceMap[item.symbol] = item.price;
                });

                setPrices({
                    BTC: parseFloat(priceMap['BTCUSDT']).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
                    ETH: parseFloat(priceMap['ETHUSDT']).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
                    DOGE: parseFloat(priceMap['DOGEUSDT']).toLocaleString('en-US', {minimumFractionDigits: 4, maximumFractionDigits: 4}),
                    XRP: parseFloat(priceMap['XRPUSDT']).toLocaleString('en-US', {minimumFractionDigits: 4, maximumFractionDigits: 4}),
                });
            } catch (error) {
                console.error("Lỗi cập nhật giá Binance:", error);
            }
        };

        fetchPrices();
        const interval = setInterval(fetchPrices, 10000); // Cập nhật sau 10 giây
        return () => clearInterval(interval);
    }, []);

    const handlePay = () => {
        const val = Number(amount);
        if (val < 10) {
            WebApp.showAlert("Sếp vui lòng nhập số lượng tối thiểu là 10 USD nhé!");
            return;
        }
        
        // Dữ liệu bắn về cho Bot
        const data = {
            amount: val,
            platform: platform
        };
        
        if (WebApp.sendData) {
            WebApp.sendData(JSON.stringify(data));
        }
    };

    // TỰ ĐỘNG TÍNH THÀNH TIỀN (VNĐ)
    const currentRate = rates[platform];
    const amountNum = Number(amount);
    const totalVND = amountNum > 0 ? (amountNum * currentRate * 1000).toLocaleString('vi-VN') : '0';

    // Style chung để ép cứng Light Mode cho ô nhập liệu
    const inputStyle = {
        color: '#000000', 
        backgroundColor: '#ffffff', 
        WebkitTextFillColor: '#000000', 
        opacity: 1
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-start bg-gray-50 font-sans overflow-x-hidden" style={{ color: '#000' }}>
            
            <div className="w-[92%] max-w-md mx-auto flex flex-col items-center pt-4 pb-10">
                
                {/* 📊 BẢNG TỶ GIÁ VNĐ NỘI BỘ */}
                <div className="w-full mb-4">
                    <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center justify-center gap-1.5">
                        💎 Tỷ giá Nội bộ (VNĐ)
                    </h3>
                    <div className="grid grid-cols-2 gap-2.5 w-full">
                        <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-200 flex flex-col items-center justify-center shadow-inner">
                            <span className="text-[11px] text-blue-800 font-bold mb-0.5">Quỹ SWC</span>
                            <span className="text-sm font-extrabold text-blue-600">{rateSWC}</span>
                        </div>
                        <div className="bg-red-50 p-2.5 rounded-xl border border-red-200 flex flex-col items-center justify-center shadow-inner">
                            <span className="text-[11px] text-red-800 font-bold mb-0.5">Quỹ RSW</span>
                            <span className="text-sm font-extrabold text-red-600">{rateRSW}</span>
                        </div>
                    </div>
                </div>

                {/* 📈 BẢNG TỶ GIÁ THỊ TRƯỜNG CRYPTO (CÓ ICON LOGO) */}
                <div className="w-full mb-6">
                    <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center justify-center gap-1.5">
                        📈 Thị trường Crypto (Live)
                    </h3>
                    <div className="grid grid-cols-4 gap-2 w-full">
                        {/* Box BTC */}
                        <div className="bg-white p-2 rounded-xl border border-gray-100 flex flex-col items-center justify-center shadow-sm">
                            <img src="https://cryptologos.cc/logos/bitcoin-btc-logo.png" alt="BTC" className="w-6 h-6 mb-1 drop-shadow-sm" />
                            <span className="text-[9px] text-gray-500 font-bold mb-0.5">BTC</span>
                            <span className="text-[11px] font-extrabold text-gray-900">${prices.BTC}</span>
                        </div>
                        {/* Box ETH */}
                        <div className="bg-white p-2 rounded-xl border border-gray-100 flex flex-col items-center justify-center shadow-sm">
                            <img src="https://cryptologos.cc/logos/ethereum-eth-logo.png" alt="ETH" className="w-6 h-6 mb-1 drop-shadow-sm" />
                            <span className="text-[9px] text-gray-500 font-bold mb-0.5">ETH</span>
                            <span className="text-[11px] font-extrabold text-gray-900">${prices.ETH}</span>
                        </div>
                        {/* Box DOGE */}
                        <div className="bg-white p-2 rounded-xl border border-gray-100 flex flex-col items-center justify-center shadow-sm">
                            <img src="https://cryptologos.cc/logos/dogecoin-doge-logo.png" alt="DOGE" className="w-6 h-6 mb-1 drop-shadow-sm" />
                            <span className="text-[9px] text-gray-500 font-bold mb-0.5">DOGE</span>
                            <span className="text-[11px] font-extrabold text-gray-900">${prices.DOGE}</span>
                        </div>
                        {/* Box XRP */}
                        <div className="bg-white p-2 rounded-xl border border-gray-100 flex flex-col items-center justify-center shadow-sm">
                            <img src="https://cryptologos.cc/logos/xrp-xrp-logo.png" alt="XRP" className="w-6 h-6 mb-1 drop-shadow-sm" />
                            <span className="text-[9px] text-gray-500 font-bold mb-0.5">XRP</span>
                            <span className="text-[11px] font-extrabold text-gray-900">${prices.XRP}</span>
                        </div>
                    </div>
                </div>

                {/* 📝 FORM GIAO DỊCH */}
                <div className="bg-white rounded-3xl shadow-xl p-6 w-full border border-gray-100 flex flex-col items-center">
                    <h2 className="text-2xl font-extrabold text-center mb-1 text-gray-900 tracking-tighter">
                        GIAO DỊCH KÍN 🤫
                    </h2>
                    <p className="text-center text-gray-500 mb-6 text-sm">
                        An toàn - Bảo mật - Không công khai
                    </p>
                    
                    {/* Ô CHỌN DỰ ÁN */}
                    <div className="mb-4 w-full">
                        <label className="block text-gray-700 font-bold mb-1.5 text-sm ml-1">1. Chọn dự án:</label>
                        <select 
                            value={platform}
                            onChange={(e) => setPlatform(e.target.value)}
                            style={inputStyle}
                            className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-lg text-center font-bold appearance-none shadow-sm transition-all"
                        >
                            <option value="SWC">🔵 Quỹ SWC</option>
                            <option value="RSW">🔴 Quỹ RSW</option>
                        </select>
                    </div>

                    {/* Ô NHẬP SỐ LƯỢNG */}
                    <div className="mb-5 w-full">
                        <label className="block text-gray-700 font-bold mb-1.5 text-sm ml-1">2. Số lượng mua (USD):</label>
                        <input 
                            type="number" 
                            inputMode="decimal"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Nhập số tiền (VD: 1000)"
                            style={inputStyle}
                            className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xl transition-all text-center font-extrabold placeholder-gray-400 shadow-sm"
                        />
                    </div>

                    {/* Ô TÍNH TỔNG TIỀN TỰ ĐỘNG */}
                    <div className="mb-8 w-full">
                        <label className="block text-gray-700 font-bold mb-1.5 text-sm ml-1">3. Tổng tiền thanh toán (Dự kiến):</label>
                        <div className="w-full px-4 py-4 rounded-2xl border-2 border-green-200 bg-green-50 text-center font-extrabold text-green-700 text-2xl shadow-inner transition-all">
                            {totalVND} VNĐ
                        </div>
                    </div>

                    {/* NÚT LẤY QR */}
                    <button 
                        onClick={handlePay}
                        className="w-full bg-blue-600 text-white font-bold py-4.5 px-4 rounded-2xl shadow-lg hover:bg-blue-700 active:transform active:scale-95 transition-all text-lg tracking-tight"
                    >
                        💰 LẤY MÃ QR THANH TOÁN
                    </button>
                    
                    <p className="text-center text-xs text-gray-400 mt-5 w-[90%] mx-auto leading-relaxed">
                        Hóa đơn sẽ được tự động gửi vào tin nhắn riêng của Sếp.
                    </p>
                </div>
                
            </div>
        </div>
    );
}

export default App;
