import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';

// Khai báo kiểu dữ liệu cho bảng giá
interface CryptoPrices {
    BTC: string;
    ETH: string;
    BNB: string;
    TON: string;
}

function App() {
    const [amount, setAmount] = useState('');
    const [platform, setPlatform] = useState('SWC');
    const [prices, setPrices] = useState<CryptoPrices>({ BTC: '...', ETH: '...', BNB: '...', TON: '...' });

    // Bật hiệu ứng mở full màn hình & Lấy giá Crypto
    useEffect(() => {
        WebApp.ready();
        WebApp.expand();

        // Hàm lấy giá tự động từ sàn Binance (Hoàn toàn miễn phí, không cần đăng nhập)
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

        // Lấy giá ngay khi mở App
        fetchPrices();
        
        // Tự động làm mới giá sau mỗi 10 giây
        const interval = setInterval(fetchPrices, 10000);
        return () => clearInterval(interval);
    }, []);

    // Xử lý khi Sếp bấm nút Lấy QR
    const handlePay = () => {
        const val = Number(amount);
        if (val < 10) {
            WebApp.showAlert("Sếp vui lòng nhập số lượng tối thiểu là 10 nhé!");
            return;
        }
        
        // Gói dữ liệu để bắn về cho Bot
        const data = {
            amount: val,
            platform: platform
        };
        
        // Bắn dữ liệu về Bot và tự động đóng Mini App
        if (WebApp.sendData) {
            WebApp.sendData(JSON.stringify(data));
        }
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4 font-sans pb-10">
            
            {/* BẢNG GIÁ CRYPTO TRỰC TUYẾN (Cập nhật Live) */}
            <div className="w-full max-w-sm mb-6 mt-2">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    📊 Tỷ giá Thị trường (Live)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center">
                        <span className="text-xs text-gray-500 font-bold mb-1">BTC/USDT</span>
                        <span className="text-lg font-extrabold text-green-600">${prices.BTC}</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center">
                        <span className="text-xs text-gray-500 font-bold mb-1">ETH/USDT</span>
                        <span className="text-lg font-extrabold text-green-600">${prices.ETH}</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center">
                        <span className="text-xs text-gray-500 font-bold mb-1">BNB/USDT</span>
                        <span className="text-lg font-extrabold text-green-600">${prices.BNB}</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center">
                        <span className="text-xs text-gray-500 font-bold mb-1">TON/USDT</span>
                        <span className="text-lg font-extrabold text-green-600">${prices.TON}</span>
                    </div>
                </div>
            </div>

            {/* FORM GIAO DỊCH KÍN */}
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm border border-gray-100">
                <h2 className="text-2xl font-extrabold text-center mb-1 text-gray-800">
                    GIAO DỊCH KÍN 🤫
                </h2>
                <p className="text-center text-gray-500 mb-6 text-sm">
                    An toàn - Bảo mật - Không công khai
                </p>
                
                {/* Ô nhập số lượng */}
                <div className="mb-5">
                    <label className="block text-gray-700 font-bold mb-2">Số lượng USD cần mua:</label>
                    <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Ví dụ: 1000"
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-lg transition-all"
                    />
                </div>

                {/* Ô chọn dự án */}
                <div className="mb-8">
                    <label className="block text-gray-700 font-bold mb-2">Chọn dự án:</label>
                    <select 
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-lg bg-white transition-all"
                    >
                        <option value="SWC">🔵 Quỹ SWC</option>
                        <option value="RSW">🔴 Quỹ RSW</option>
                        <option value="USDT">🟢 Mua USDT</option>
                    </select>
                </div>

                {/* Nút thanh toán */}
                <button 
                    onClick={handlePay}
                    className="w-full bg-blue-600 text-white font-bold py-4 px-4 rounded-xl shadow-md hover:bg-blue-700 active:transform active:scale-95 transition-all text-lg"
                >
                    💰 LẤY MÃ QR THANH TOÁN
                </button>
                
                <p className="text-center text-xs text-gray-400 mt-5">
                    Hóa đơn sẽ được tự động gửi vào tin nhắn riêng của Sếp.
                </p>
            </div>
        </div>
    );
}

export default App;
