import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';

interface CryptoPrices {
    BTC: string; ETH: string; DOGE: string; XRP: string;
}

function App() {
    const [amount, setAmount] = useState('');
    const [platform, setPlatform] = useState('SWC');
    const [gmail, setGmail] = useState(''); // Thêm state cho Gmail
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

    // Nút Gửi dữ liệu: Gửi cả amount, platform và gmail
    const handleSendData = () => {
        // [TÍNH NĂNG MỚI] Kiểm tra bắt buộc nhập
        if (!amount || Number(amount) <= 0) {
            WebApp.showAlert("⚠️ Vui lòng nhập số lượng USD hợp lệ!");
            return;
        }
        if (!gmail.trim()) {
            WebApp.showAlert("⚠️ Vui lòng nhập Gmail của bạn!");
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
        <div className="min-h-screen w-full flex flex-col items-center bg-gray-50 p-4 font-sans text-black">
            <div className="w-full max-w-md">
                
                {/* TỶ GIÁ NỘI BỘ */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-blue-600 text-white p-3 rounded-2xl text-center shadow-lg">
                        <p className="text-[10px] font-bold opacity-80 uppercase">Giá Quỹ SWC</p>
                        <p className="text-xl font-black">{rateSWC}</p>
                    </div>
                    <div className="bg-red-600 text-white p-3 rounded-2xl text-center shadow-lg">
                        <p className="text-[10px] font-bold opacity-80 uppercase">Giá Quỹ RSW</p>
                        <p className="text-xl font-black">{rateRSW}</p>
                    </div>
                </div>

                {/* TỶ GIÁ CRYPTO LIVE - CHIA 2 HÀNG & MÀU XANH */}
                <div className="grid grid-cols-2 gap-3 mb-6"> 
                    {[
                        { sym: 'BTC', p: prices.BTC, img: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/btc.png' },
                        { sym: 'ETH', p: prices.ETH, img: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/eth.png' },
                        { sym: 'DOGE', p: prices.DOGE, img: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/doge.png' },
                        { sym: 'XRP', p: prices.XRP, img: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/xrp.png' }
                    ].map(coin => (
                        <div key={coin.sym} className="bg-white border border-gray-100 p-3 rounded-xl flex items-center shadow-sm">
                            <img src={coin.img} className="w-8 h-8 mr-3" alt={coin.sym} />
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-500">{coin.sym}</span>
                                {/* Số hiển thị to hơn và màu xanh thị trường */}
                                <span className="text-lg font-black text-green-500">${coin.p}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* FORM GIAO DỊCH */}
                <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100">
                    <label className="block text-sm font-bold mb-2">1. Chọn dự án:</label>
                    <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full p-3 mb-4 rounded-xl border-2 border-gray-100 font-bold bg-white outline-none">
                        <option value="SWC">🔵 Quỹ SWC</option>
                        <option value="RSW">🔴 Quỹ RSW</option>
                    </select>

                    <label className="block text-sm font-bold mb-2">2. Số lượng USD:</label>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-3 mb-4 rounded-xl border-2 border-gray-100 font-bold outline-none text-center text-xl" placeholder="VD: 1000" style={{backgroundColor: '#fff', color: '#000'}} />

                    {/* TRƯỜNG NHẬP GMAIL MỚI */}
                    <label className="block text-sm font-bold mb-2">3. Gmail của bạn:</label>
                    <input 
                        type="email" 
                        value={gmail} 
                        onChange={(e) => setGmail(e.target.value)} 
                        className="w-full p-3 mb-4 rounded-xl border-2 border-gray-100 font-bold outline-none text-center text-lg" 
                        placeholder="VD: sếp@gmail.com" 
                        style={{backgroundColor: '#fff', color: '#000'}} 
                    />

                    <label className="block text-sm font-bold mb-2">4. Thành tiền (VNĐ):</label>
                    <div className="w-full p-4 mb-6 rounded-xl bg-green-50 border-2 border-green-100 text-green-700 text-2xl font-black text-center shadow-inner">
                        {totalVND}
                    </div>

                    <button onClick={handleSendData} className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform mb-4">
                        💰 LẤY MÃ QR THANH TOÁN
                    </button>

                    {/* [TÍNH NĂNG MỚI] GHI CHÚ BẮT BUỘC */}
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs p-4 rounded-xl text-center leading-relaxed">
                        📌 <b>Lưu ý:</b> Chỉ giao dịch tài khoản chính chủ. Người mua chịu trách nhiệm 100% về nguồn tiền nếu xảy ra vấn đề pháp lý.<br/><br/>
                        <b>Bắt buộc chuyển đúng nội dung yêu cầu hoặc QR đã in ra.</b>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
