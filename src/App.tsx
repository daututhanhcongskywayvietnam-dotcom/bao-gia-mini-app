import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';

// Định nghĩa kiểu dữ liệu cho giá coin
interface CryptoPrices {
    [key: string]: string;
}

function App() {
    const [amount, setAmount] = useState('');
    const [platform, setPlatform] = useState('SWC'); // Mặc định SWC
    const [gmail, setGmail] = useState('');
    const [prices, setPrices] = useState<CryptoPrices>({});

    // ĐỌC GIÁ TỪ BOT GỬI QUA URL (giả sử bot gửi tham số swc và rsw)
    const urlParams = new URLSearchParams(window.location.search);
    const rateSWC = parseFloat(urlParams.get('swc') || '27.0');
    const rateRSW = parseFloat(urlParams.get('rsw') || '27.0');

    const rates: Record<string, number> = { SWC: rateSWC, RSW: rateRSW };

    // Danh sách 10 coin hàng đầu để lấy giá từ Binance
    const top10Symbols = [
        "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT",
        "DOGEUSDT", "ADAUSDT", "AVAXUSDT", "DOTUSDT", "LINKUSDT"
    ];

    useEffect(() => {
        WebApp.ready();
        WebApp.expand();
        
        const fetchPrices = async () => {
            try {
                // Lấy giá của top 10 coin từ Binance
                const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbols=${JSON.stringify(top10Symbols)}`);
                const data = await response.json();
                
                const priceMap: CryptoPrices = {};
                data.forEach((item: any) => {
                    const symbol = item.symbol.replace('USDT', '');
                    const price = parseFloat(item.price);
                    
                    // Định dạng số: 2 chữ số thập phân cho coin lớn, 4 cho coin nhỏ
                    const fractionDigits = (symbol === 'DOGE' || symbol === 'XRP' || symbol === 'ADA') ? 4 : 2;
                    priceMap[symbol] = price.toLocaleString('en-US', {
                        minimumFractionDigits: fractionDigits,
                        maximumFractionDigits: fractionDigits
                    });
                });

                setPrices(priceMap);
            } catch (e) {
                console.error("Lỗi lấy giá Binance:", e);
                // Đặt giá mặc định nếu lỗi
                const fallbackPrices: CryptoPrices = {};
                top10Symbols.forEach(s => fallbackPrices[s.replace('USDT', '')] = '...');
                setPrices(fallbackPrices);
            }
        };

        fetchPrices();
        // Cập nhật giá mỗi 10 giây
        const interval = setInterval(fetchPrices, 10000);
        return () => clearInterval(interval);
    }, []);

    // Tính tổng tiền VNĐ
    const totalVNDNum = Number(amount) * rates[platform] * 1000;
    const totalVND = isNaN(totalVNDNum) ? '0' : totalVNDNum.toLocaleString('vi-VN');

    // Hàm xử lý khi nhấn nút gửi dữ liệu
    const handleSendData = () => {
        // Kiểm tra dữ liệu đầu vào
        if (!amount || Number(amount) <= 0) {
            WebApp.showAlert("⚠️ Vui lòng nhập số lượng USD hợp lệ!");
            return;
        }
        if (!gmail.trim() || !gmail.includes('@')) {
            WebApp.showAlert("⚠️ Vui lòng nhập Gmail hợp lệ!");
            return;
        }

        const payload = {
            amount: Number(amount),
            platform,
            gmail: gmail.trim(),
            totalVND: totalVNDNum
        };
        // Gửi dữ liệu về cho Bot Telegram
        WebApp.sendData(JSON.stringify(payload));
    };

    // Tạo nội dung cho thanh Ticker chạy ngang
    const marqueeItems = top10Symbols.map(s => s.replace('USDT', '')).map(sym => (
        <span key={sym} className="mx-4 flex items-center">
            <span className="font-bold text-gray-200">{sym}:</span>
            <span className="ml-1 text-green-400">${prices[sym] || '...'}</span>
        </span>
    ));

    // Bố cục giá của 4 khối coin lớn
    const majorCoins = [
        { sym: 'BTC', img: 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=032' },
        { sym: 'ETH', img: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=032' },
        { sym: 'DOGE', img: 'https://cryptologos.cc/logos/dogecoin-doge-logo.svg?v=032' },
        { sym: 'XRP', img: 'https://cryptologos.cc/logos/xrp-xrp-logo.svg?v=032' }
    ];

    return (
        <div className="min-h-screen w-full flex flex-col bg-gray-50 font-sans text-black overflow-x-hidden">
            
            {/* Thêm CSS tùy chỉnh cho hiệu ứng chạy marquee và nhấp nháy */}
            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    display: flex;
                    animation: marquee 20s linear infinite;
                }
                @keyframes pulse-red {
                    0%, 100% { background-color: #fef2f2; border-color: #fecaca; }
                    50% { background-color: #fee2e2; border-color: #f87171; }
                }
                .animate-pulse-red {
                    animation: pulse-red 1.5s infinite;
                }
            `}</style>

            <div className="w-full max-w-md mx-auto p-4 pt-6 flex-grow flex flex-col">
                
                {/* TIÊU ĐỀ LỚN TRÊN CÙNG */}
                <h1 className="text-2xl font-extrabold text-center mb-6 text-blue-900 tracking-tight">
                    Trợ Lý Hỗ Trợ Nạp Đô SWC/RSW
                </h1>

                {/* 1. THANH TICKER TOP 10 COIN CHẠY NGANG */}
                <div className="w-full bg-gray-950 text-white text-xs py-3 mb-6 rounded-xl shadow-inner overflow-hidden border border-gray-800">
                    <div className="animate-marquee whitespace-nowrap">
                        {marqueeItems}
                        {marqueeItems} {/* Lặp lại để tạo hiệu ứng vô tận */}
                    </div>
                </div>

                {/* 2. BỐN KHỐI BÁO GIÁ TO CỦA BTC, ETH, DOGE, XRP */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {majorCoins.map(coin => (
                        <div key={coin.sym} className="bg-white p-5 rounded-2xl flex flex-col items-center justify-center shadow-md border border-gray-100">
                            <div className="flex items-center mb-2">
                                <img src={coin.img} className="w-7 h-7 mr-2" alt={coin.sym} />
                                <span className="text-base font-bold text-gray-600">{coin.sym}</span>
                            </div>
                            <span className="text-2xl font-black text-green-600 tracking-tight">
                                ${prices[coin.sym] || '...'}
                            </span>
                        </div>
                    ))}
                </div>

                {/* FORM GIAO DỊCH VÀ CẢNH BÁO */}
                <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 flex-grow flex flex-col mb-4">
                    
                    {/* 3. HAI NÚT CHỌN DỰ ÁN SWC/RSW TO BỰ */}
                    <label className="block text-sm font-bold mb-3 text-gray-700">Bước 1: Chọn dự án</label>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <button 
                            onClick={() => setPlatform('SWC')} 
                            className={`p-5 rounded-2xl text-center shadow-lg transition-all ${platform === 'SWC' ? 'bg-blue-600 text-white scale-105' : 'bg-gray-100 text-gray-600'}`}>
                            <p className="text-xs font-bold uppercase tracking-wider mb-1">Quỹ SWC</p>
                            <p className="text-3xl font-black">{rateSWC}</p>
                        </button>
                        <button 
                            onClick={() => setPlatform('RSW')} 
                            className={`p-5 rounded-2xl text-center shadow-lg transition-all ${platform === 'RSW' ? 'bg-red-600 text-white scale-105' : 'bg-gray-100 text-gray-600'}`}>
                            <p className="text-xs font-bold uppercase tracking-wider mb-1">Quỹ RSW</p>
                            <p className="text-3xl font-black">{rateRSW}</p>
                        </button>
                    </div>

                    {/* 4. FORM ĐIỀN SỐ LƯỢNG & GMAIL */}
                    <div className="space-y-5 mb-6">
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700">Bước 2: Số lượng USD muốn mua</label>
                            <input 
                                type="number" 
                                value={amount} 
                                onChange={(e) => setAmount(e.target.value)} 
                                className="w-full p-4 rounded-xl border-2 border-gray-200 font-bold outline-none text-center text-xl bg-gray-50 placeholder-gray-400 focus:border-blue-300" 
                                placeholder="VD: 1000" 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700">Bước 3: Gmail nhận biên lai</label>
                            <input 
                                type="email" 
                                value={gmail} 
                                onChange={(e) => setGmail(e.target.value)} 
                                className="w-full p-4 rounded-xl border-2 border-gray-200 font-bold outline-none text-center text-lg bg-gray-50 placeholder-gray-400 focus:border-blue-300" 
                                placeholder="VD: sep.crypto@gmail.com" 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700">Tổng tiền cần thanh toán</label>
                            <div className="w-full p-5 rounded-xl bg-green-50 border-2 border-green-200 text-green-700 text-3xl font-black text-center shadow-inner">
                                {totalVND} <span className="text-xl font-bold">VNĐ</span>
                            </div>
                        </div>
                    </div>

                    {/* 5. KHUNG CẢNH BÁO NHẤP NHÁY */}
                    <div className="animate-pulse-red border-2 p-5 rounded-2xl mb-6 shadow-md">
                        <h3 className="text-lg font-bold text-red-700 flex items-center mb-2">
                            <span className="text-2xl mr-2">🚨</span> CẢNH BÁO CỰC KỲ QUAN TRỌNG!
                        </h3>
                        <ul className="text-sm text-red-950 list-disc list-inside space-y-1.5 leading-relaxed">
                            <li>Chỉ giao dịch bằng <b className="font-bold text-red-900">TÀI KHOẢN CHÍNH CHỦ</b>.</li>
                            <li>Người mua chịu trách nhiệm 100% về nguồn tiền nếu xảy ra vấn đề pháp lý.</li>
                            <li>Bắt buộc chuyển <b className="font-bold text-red-900">ĐÚNG NỘI DUNG</b> và <b className="font-bold text-red-900">SỐ TÀI KHOẢN</b> yêu cầu in trên mã QR!</li>
                        </ul>
                    </div>

                    {/* 6. NÚT LẤY MÃ QR */}
                    <button 
                        onClick={handleSendData} 
                        className="w-full bg-gradient-to-r from-blue-700 to-blue-900 text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-transform text-xl flex justify-center items-center mt-auto">
                        <span className="text-2xl mr-3">💳</span> LẤY MÃ QR NGAY
                    </button>
                </div>

            </div>
        </div>
    );
}

export default App;
