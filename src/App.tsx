import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';

interface CryptoPrices {
    BTC: string;
    ETH: string;
    BNB: string;
    USDT: string;
    DOGE: string;
    TON: string;
}

function App() {
    const [amount, setAmount] = useState('');
    const [platform, setPlatform] = useState('SWC');
    const [prices, setPrices] = useState<CryptoPrices>({ BTC: '...', ETH: '...', BNB: '...', TON: '...' });

    useEffect(() => {
        WebApp.ready();
        WebApp.expand();

        const fetchPrices = async () => {
            try {
                const response = await fetch('https://api.binance.com/api/v3/ticker/price');
                const data = await response.json();
                
                const priceMap: any = {};
                data.forEach((item: any) => {
                    priceMap[item.symbol] = item.price;
                });

                setPrices({
                    BTC: parseFloat(priceMap['BTCUSDT']).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
                    ETH: parseFloat(priceMap['ETHUSDT']).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
                    BNB: parseFloat(priceMap['BNBUSDT']).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
                    TON: parseFloat(priceMap['TONUSDT']).toLocaleString('en-US', {minimumFractionDigits: 3, maximumFractionDigits: 3}),
                });
            } catch (error) {
                console.error("Lỗi cập nhật giá:", error);
            }
        };

        fetchPrices();
        const interval = setInterval(fetchPrices, 10000);
        return () => clearInterval(interval);
    }, []);

    const handlePay = () => {
        const val = Number(amount);
        if (val < 10) {
            WebApp.showAlert("Sếp vui lòng nhập số lượng tối thiểu là 10 nhé!");
            return;
        }
        
        const data = {
            amount: val,
            platform: platform
        };
        
        if (WebApp.sendData) {
            WebApp.sendData(JSON.stringify(data));
        }
    };

    return (
        /* ÉP CHÍNH GIỮA TOÀN MÀN HÌNH */
        <div className="min-h-screen w-full flex flex-col items-center justify-start bg-gray-50 p-4 font-sans pb-10 overflow-x-hidden">
            
            {/* CONTAINER GIỮA MÀN HÌNH */}
            <div className="w-full max-w-md mx-auto flex flex-col items-center">
                
                {/* BẢNG GIÁ CRYPTO */}
                <div className="w-full mb-6 mt-2">
                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center justify-center gap-2">
                        📊 Tỷ giá Thị trường (Live)
                    </h3>
                    <div className="grid grid-cols-2 gap-3 w-full">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                            <span className="text-xs text-gray-500 font-bold mb-1">BTC/USDT</span>
                            <span className="text-lg font-extrabold text-green-600">${prices.BTC}</span>
                        </div>
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                            <span className="text-xs text-gray-500 font-bold mb-1">ETH/USDT</span>
                            <span className="text-lg font-extrabold text-green-600">${prices.ETH}</span>
                        </div>
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                            <span className="text-xs text-gray-500 font-bold mb-1">BNB/USDT</span>
                            <span className="text-lg font-extrabold text-green-600">${prices.BNB}</span>
                        </div>
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                            <span className="text-xs text-gray-500 font-bold mb-1">TON/USDT</span>
                            <span className="text-lg font-extrabold text-green-600">${prices.TON}</span>
                        </div>
                    </div>
                </div>

                {/* FORM GIAO DỊCH KÍN */}
                <div className="bg-white rounded-3xl shadow-xl p-6 w-full border border-gray-100">
                    <h2 className="text-2xl font-extrabold text-center mb-1 text-gray-800 tracking-tight">
                        GIAO DỊCH KÍN 🤫
                    </h2>
                    <p className="text-center text-gray-500 mb-6 text-sm">
                        An toàn - Bảo mật - Không công khai
                    </p>
                    
                    <div className="mb-5">
                        <label className="block text-gray-700 font-bold mb-2">Số lượng USD cần mua:</label>
                        <input 
                            type="number" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Ví dụ: 1000"
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-lg transition-all text-center font-bold"
                        />
                    </div>

                    <div className="mb-8">
                        <label className="block text-gray-700 font-bold mb-2">Chọn dự án:</label>
                        <select 
                            value={platform}
                            onChange={(e) => setPlatform(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-lg bg-white transition-all text-center font-bold appearance-none"
                        >
                            <option value="SWC">🔵 Quỹ SWC</option>
                            <option value="RSW">🔴 Quỹ RSW</option>
                            <option value="USDT">🟢 Mua USDT</option>
                        </select>
                    </div>

                    <button 
                        onClick={handlePay}
                        className="w-full bg-blue-600 text-white font-bold py-4 px-4 rounded-2xl shadow-md hover:bg-blue-700 active:transform active:scale-95 transition-all text-lg"
                    >
                        💰 LẤY MÃ QR THANH TOÁN
                    </button>
                    
                    <p className="text-center text-xs text-gray-400 mt-5">
                        Hóa đơn sẽ được tự động gửi vào tin nhắn riêng của Sếp.
                    </p>
                </div>
                
            </div>
        </div>
    );
}

export default App;
