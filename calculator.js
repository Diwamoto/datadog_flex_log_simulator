// Datadog Flex Logs 料金体系
const STORAGE_PRICE_ANNUAL = 0.75; // 年払い: $0.75 / 100万イベント / 月
const STORAGE_PRICE_MONTHLY = 1.125; // 月払い: $1.125 / 100万イベント / 月

/**
 * ストレージ料金を計算する関数
 * @param {number} volume - ボリューム（百万イベント）
 * @param {boolean} isMonthlyPayment - 月払いかどうか
 * @returns {number} 計算された料金
 */
function calculateStorageCost(volume, isMonthlyPayment) {
    const pricePerMillion = isMonthlyPayment ? STORAGE_PRICE_MONTHLY : STORAGE_PRICE_ANNUAL;
    return volume * pricePerMillion;
}

/**
 * 月別の料金を計算する関数
 * @param {number} monthlyEvents - 月間イベント数（百万単位）
 * @param {number} retentionMonths - 保持期間（月）
 * @param {boolean} isMonthlyPayment - 月払いかどうか
 * @returns {Object} 計算結果
 */
function calculateMonthlyCosts(monthlyEvents, retentionMonths, isMonthlyPayment) {
    const results = [];
    let totalStorageCost = 0;

    for (let month = 1; month <= retentionMonths; month++) {
        // ストレージ料金（累積されたログに対して）
        const storedVolume = monthlyEvents * month; // 累積ボリューム
        const monthlyStorageCost = calculateStorageCost(storedVolume, isMonthlyPayment);

        results.push({
            month: month,
            storageCost: monthlyStorageCost,
            cumulativeVolume: storedVolume
        });

        totalStorageCost += monthlyStorageCost;
    }

    return {
        monthlyBreakdown: results,
        totalStorageCost: totalStorageCost,
        monthlyAverage: totalStorageCost / retentionMonths
    };
}

/**
 * メイン計算関数
 */
function calculateCosts() {
    // 入力値を取得
    const monthlyEvents = parseFloat(document.getElementById('monthlyEvents').value);
    const retentionPeriod = parseInt(document.getElementById('retentionPeriod').value);
    const paymentPlan = document.getElementById('paymentPlan').value;

    // 入力値の検証
    if (!monthlyEvents || monthlyEvents <= 0) {
        alert('月間ログイベント数を正しく入力してください。');
        return;
    }

    const isMonthlyPayment = paymentPlan === 'monthly';

    // 料金計算
    const results = calculateMonthlyCosts(monthlyEvents, retentionPeriod, isMonthlyPayment);

    // 結果を表示
    displayResults(results, monthlyEvents, retentionPeriod, isMonthlyPayment);
}

/**
 * 結果を表示する関数
 */
function displayResults(results, monthlyEvents, retentionPeriod, isMonthlyPayment) {
    // 総コスト表示
    document.getElementById('totalStorageCost').textContent = `$${results.totalStorageCost.toFixed(2)}`;
    document.getElementById('monthlyAverage').textContent = `$${results.monthlyAverage.toFixed(2)}`;

    // 月別内訳を表示
    displayMonthlyBreakdown(results.monthlyBreakdown, retentionPeriod);

    // 結果セクションを表示
    document.getElementById('results').style.display = 'block';

    // 結果セクションまでスクロール
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
}

/**
 * 月別内訳を表示する関数
 */
function displayMonthlyBreakdown(monthlyData, retentionPeriod) {
    const container = document.getElementById('monthlyBreakdown');
    
    let html = `
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <thead>
                    <tr style="background-color: #f8f9fa;">
                        <th style="padding: 12px; border: 1px solid #ddd; text-align: center;">月</th>
                        <th style="padding: 12px; border: 1px solid #ddd; text-align: center;">ストレージ料金</th>
                        <th style="padding: 12px; border: 1px solid #ddd; text-align: center;">累積ボリューム<br>（百万イベント）</th>
                    </tr>
                </thead>
                <tbody>
    `;

    monthlyData.forEach(data => {
        html += `
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${data.month}ヶ月目</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold; background-color: #e3f2fd;">$${data.storageCost.toFixed(2)}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${data.cumulativeVolume.toFixed(1)}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
        <div style="margin-top: 20px; padding: 15px; background-color: #e8f5e8; border-radius: 8px;">
            <h4 style="color: #2e7d32; margin-bottom: 10px;">📈 料金推移の特徴</h4>
            <ul style="margin: 0; padding-left: 20px;">
                <li><strong>ストレージ料金:</strong> 累積ボリュームに比例して増加</li>
                <li><strong>${retentionPeriod}ヶ月後:</strong> ログの削除と追加が釣り合い、料金が安定化</li>
            </ul>
        </div>
    `;

    container.innerHTML = html;
}

/**
 * イベント数表示を更新する関数
 */
function updateEventDisplay() {
    const monthlyEvents = parseFloat(document.getElementById('monthlyEvents').value) || 0;
    const totalEvents = monthlyEvents * 100; // 百万単位を万単位に変換
    document.getElementById('eventDisplay').textContent = `${totalEvents.toLocaleString()}万イベント`;
}

/**
 * ページ読み込み時の初期化
 */
document.addEventListener('DOMContentLoaded', function() {
    // デフォルト値を設定
    document.getElementById('monthlyEvents').value = '1';
    updateEventDisplay();
    
    // 入力値変更時にイベント数表示を更新
    document.getElementById('monthlyEvents').addEventListener('input', updateEventDisplay);
    
    // Enterキーでの計算実行
    document.getElementById('monthlyEvents').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            calculateCosts();
        }
    });
});

/**
 * 料金体系の詳細情報を表示する関数
 */
function showPricingDetails() {
    const details = `
        Datadog Flex Logs 料金体系の詳細:
        
        1. 転送料金（Ingestion）:
           - ログをDatadogに送信する際に発生
           - 月間ボリュームに応じて段階的に料金が変動
           
        2. ストレージ料金（Storage）:
           - 保存されているログに対して毎月継続的に発生
           - 累積ボリュームに応じて段階的に料金が変動
           
        3. 累積効果:
           - 時間が経つにつれて保存ログが増加
           - ${retentionPeriod}ヶ月後に削除と追加が釣り合い安定化
    `;
    
    alert(details);
} 