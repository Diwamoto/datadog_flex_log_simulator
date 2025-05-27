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
 * 月別の料金を計算する関数（6ヶ月と12ヶ月の比較）
 * @param {number} monthlyEvents - 月間イベント数（百万単位）
 * @param {boolean} isMonthlyPayment - 月払いかどうか
 * @returns {Object} 計算結果
 */
function calculateMonthlyCosts(monthlyEvents, isMonthlyPayment) {
    const results = [];
    const displayMonths = 24; // 常に24ヶ月まで表示
    const retentionPeriods = [6, 12]; // 6ヶ月と12ヶ月の比較
    
    // 各保持期間の総コストを計算
    const retentionCosts = {};
    
    retentionPeriods.forEach(retentionMonths => {
        let totalCost = 0;
        for (let month = 1; month <= retentionMonths; month++) {
            const storedVolume = monthlyEvents * month;
            const monthlyStorageCost = calculateStorageCost(storedVolume, isMonthlyPayment);
            totalCost += monthlyStorageCost;
        }
        retentionCosts[retentionMonths] = {
            total: totalCost,
            average: totalCost / retentionMonths
        };
    });

    // 24ヶ月分のデータを生成
    for (let month = 1; month <= displayMonths; month++) {
        const monthData = { month: month };
        
        retentionPeriods.forEach(retentionMonths => {
            let storedVolume, monthlyStorageCost;
            
            if (month <= retentionMonths) {
                // 保持期間内：累積していく
                storedVolume = monthlyEvents * month;
            } else {
                // 保持期間後：一定量を維持
                storedVolume = monthlyEvents * retentionMonths;
            }
            
            monthlyStorageCost = calculateStorageCost(storedVolume, isMonthlyPayment);
            
            monthData[`retention${retentionMonths}`] = {
                storageCost: monthlyStorageCost,
                cumulativeVolume: storedVolume,
                isRetentionPeriod: month <= retentionMonths
            };
        });
        
        results.push(monthData);
    }

    return {
        monthlyBreakdown: results,
        retentionCosts: retentionCosts
    };
}

/**
 * メイン計算関数
 */
function calculateCosts() {
    // 入力値を取得
    const monthlyEvents = parseFloat(document.getElementById('monthlyEvents').value);
    const paymentPlan = document.getElementById('paymentPlan').value;

    // 入力値の検証
    if (!monthlyEvents || monthlyEvents <= 0) {
        alert('月間ログイベント数を正しく入力してください。');
        return;
    }

    const isMonthlyPayment = paymentPlan === 'monthly';

    // 料金計算
    const results = calculateMonthlyCosts(monthlyEvents, isMonthlyPayment);

    // 結果を表示
    displayResults(results, monthlyEvents, isMonthlyPayment);
}

/**
 * 結果を表示する関数
 */
function displayResults(results, monthlyEvents, isMonthlyPayment) {
    // 総コスト表示（6ヶ月と12ヶ月の比較）
    const cost6 = results.retentionCosts[6];
    const cost12 = results.retentionCosts[12];
    
    document.getElementById('totalStorageCost').innerHTML = `
        <div style="display: flex; gap: 20px; justify-content: center;">
            <div style="text-align: center;">
                <div style="font-size: 0.9rem; color: #666;">6ヶ月保持</div>
                <div style="font-size: 1.5rem; font-weight: bold; color: #632ca6;">$${cost6.total.toFixed(2)}</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 0.9rem; color: #666;">12ヶ月保持</div>
                <div style="font-size: 1.5rem; font-weight: bold; color: #632ca6;">$${cost12.total.toFixed(2)}</div>
            </div>
        </div>
    `;
    
    document.getElementById('monthlyAverage').innerHTML = `
        <div style="display: flex; gap: 20px; justify-content: center;">
            <div style="text-align: center;">
                <div style="font-size: 0.9rem; color: #666;">6ヶ月平均</div>
                <div style="font-size: 1.5rem; font-weight: bold; color: #632ca6;">$${cost6.average.toFixed(2)}</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 0.9rem; color: #666;">12ヶ月平均</div>
                <div style="font-size: 1.5rem; font-weight: bold; color: #632ca6;">$${cost12.average.toFixed(2)}</div>
            </div>
        </div>
    `;

    // グラフを表示
    displayChart(results.monthlyBreakdown);

    // 月別内訳を表示
    displayMonthlyBreakdown(results.monthlyBreakdown);

    // 結果セクションを表示
    document.getElementById('results').style.display = 'block';

    // 結果セクションまでスクロール
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
}

/**
 * グラフを表示する関数（6ヶ月と12ヶ月の比較）
 */
function displayChart(monthlyData) {
    const container = document.getElementById('chartContainer');
    
    // グラフの設定
    const maxCost6 = Math.max(...monthlyData.map(d => d.retention6.storageCost));
    const maxCost12 = Math.max(...monthlyData.map(d => d.retention12.storageCost));
    const maxCost = Math.max(maxCost6, maxCost12);
    const chartHeight = 350;
    const chartWidth = 900;
    const padding = { top: 40, right: 40, bottom: 80, left: 80 };
    
    let svg = `
        <svg width="${chartWidth}" height="${chartHeight}" style="background: white; border-radius: 8px;">
            <!-- グリッドライン -->
    `;
    
    // Y軸のグリッドライン
    for (let i = 0; i <= 5; i++) {
        const y = padding.top + (chartHeight - padding.top - padding.bottom) * i / 5;
        const value = maxCost * (5 - i) / 5;
        svg += `
            <line x1="${padding.left}" y1="${y}" x2="${chartWidth - padding.right}" y2="${y}" 
                  stroke="#e0e0e0" stroke-width="1"/>
            <text x="${padding.left - 10}" y="${y + 5}" text-anchor="end" font-size="12" fill="#666">
                $${value.toFixed(0)}
            </text>
        `;
    }
    
    // 6ヶ月保持のライン
    let pathData6 = '';
    monthlyData.forEach((data, index) => {
        const x = padding.left + (chartWidth - padding.left - padding.right) * index / (monthlyData.length - 1);
        const y = padding.top + (chartHeight - padding.top - padding.bottom) * (1 - data.retention6.storageCost / maxCost);
        
        if (index === 0) {
            pathData6 += `M ${x} ${y}`;
        } else {
            pathData6 += ` L ${x} ${y}`;
        }
        
        // データポイント（6ヶ月）
        const color = data.retention6.isRetentionPeriod ? '#2196f3' : '#81c784';
        svg += `
            <circle cx="${x}" cy="${y}" r="3" fill="${color}" stroke="white" stroke-width="2"/>
        `;
    });
    
    // 12ヶ月保持のライン
    let pathData12 = '';
    monthlyData.forEach((data, index) => {
        const x = padding.left + (chartWidth - padding.left - padding.right) * index / (monthlyData.length - 1);
        const y = padding.top + (chartHeight - padding.top - padding.bottom) * (1 - data.retention12.storageCost / maxCost);
        
        if (index === 0) {
            pathData12 += `M ${x} ${y}`;
        } else {
            pathData12 += ` L ${x} ${y}`;
        }
        
        // データポイント（12ヶ月）
        const color = data.retention12.isRetentionPeriod ? '#632ca6' : '#ff9800';
        svg += `
            <circle cx="${x}" cy="${y}" r="3" fill="${color}" stroke="white" stroke-width="2"/>
        `;
        
        // X軸ラベル（6ヶ月ごと）
        if (index % 6 === 0 || index === monthlyData.length - 1) {
            svg += `
                <text x="${x}" y="${chartHeight - padding.bottom + 20}" text-anchor="middle" font-size="12" fill="#666">
                    ${data.month}ヶ月
                </text>
            `;
        }
    });
    
    // ライン描画
    svg += `<path d="${pathData6}" stroke="#2196f3" stroke-width="3" fill="none"/>`;
    svg += `<path d="${pathData12}" stroke="#632ca6" stroke-width="3" fill="none"/>`;
    
    // 保持期間の境界線
    const retention6X = padding.left + (chartWidth - padding.left - padding.right) * 5 / (monthlyData.length - 1);
    const retention12X = padding.left + (chartWidth - padding.left - padding.right) * 11 / (monthlyData.length - 1);
    
    svg += `
        <line x1="${retention6X}" y1="${padding.top}" x2="${retention6X}" y2="${chartHeight - padding.bottom}" 
              stroke="#2196f3" stroke-width="2" stroke-dasharray="5,5"/>
        <text x="${retention6X + 5}" y="${padding.top + 20}" font-size="11" fill="#2196f3" font-weight="bold">
            6ヶ月後安定
        </text>
        <line x1="${retention12X}" y1="${padding.top}" x2="${retention12X}" y2="${chartHeight - padding.bottom}" 
              stroke="#632ca6" stroke-width="2" stroke-dasharray="5,5"/>
        <text x="${retention12X + 5}" y="${padding.top + 35}" font-size="11" fill="#632ca6" font-weight="bold">
            12ヶ月後安定
        </text>
    `;
    
    // 軸ラベル
    svg += `
        <text x="${chartWidth / 2}" y="${chartHeight - 10}" text-anchor="middle" font-size="14" font-weight="bold" fill="#333">
            経過月数
        </text>
        <text x="20" y="${chartHeight / 2}" text-anchor="middle" font-size="14" font-weight="bold" fill="#333" 
              transform="rotate(-90, 20, ${chartHeight / 2})">
            月額料金 (USD)
        </text>
    `;
    
    svg += '</svg>';
    
    container.innerHTML = `
        <h4 style="margin-bottom: 15px; color: #632ca6;">📊 料金推移比較グラフ（24ヶ月）</h4>
        <div style="text-align: center; margin-bottom: 15px;">
            ${svg}
        </div>
        <div style="display: flex; justify-content: center; gap: 15px; font-size: 12px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 5px;">
                <div style="width: 12px; height: 12px; background: #2196f3; border-radius: 50%;"></div>
                <span>6ヶ月保持（累積期間）</span>
            </div>
            <div style="display: flex; align-items: center; gap: 5px;">
                <div style="width: 12px; height: 12px; background: #81c784; border-radius: 50%;"></div>
                <span>6ヶ月保持（安定期間）</span>
            </div>
            <div style="display: flex; align-items: center; gap: 5px;">
                <div style="width: 12px; height: 12px; background: #632ca6; border-radius: 50%;"></div>
                <span>12ヶ月保持（累積期間）</span>
            </div>
            <div style="display: flex; align-items: center; gap: 5px;">
                <div style="width: 12px; height: 12px; background: #ff9800; border-radius: 50%;"></div>
                <span>12ヶ月保持（安定期間）</span>
            </div>
        </div>
    `;
}

/**
 * 月別内訳を表示する関数（6ヶ月と12ヶ月の比較）
 */
function displayMonthlyBreakdown(monthlyData) {
    const container = document.getElementById('monthlyBreakdown');
    
    let html = `
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <thead>
                    <tr style="background-color: #f8f9fa;">
                        <th style="padding: 12px; border: 1px solid #ddd; text-align: center;" rowspan="2">月</th>
                        <th style="padding: 12px; border: 1px solid #ddd; text-align: center;" colspan="3">6ヶ月保持</th>
                        <th style="padding: 12px; border: 1px solid #ddd; text-align: center;" colspan="3">12ヶ月保持</th>
                    </tr>
                    <tr style="background-color: #f8f9fa;">
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center; font-size: 12px;">料金</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center; font-size: 12px;">累積ボリューム</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center; font-size: 12px;">状態</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center; font-size: 12px;">料金</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center; font-size: 12px;">累積ボリューム</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center; font-size: 12px;">状態</th>
                    </tr>
                </thead>
                <tbody>
    `;

    monthlyData.forEach(data => {
        const status6Color = data.retention6.isRetentionPeriod ? '#e3f2fd' : '#e8f5e8';
        const status6Text = data.retention6.isRetentionPeriod ? '累積中' : '安定';
        const status12Color = data.retention12.isRetentionPeriod ? '#f3e5f5' : '#fff3e0';
        const status12Text = data.retention12.isRetentionPeriod ? '累積中' : '安定';
        
        html += `
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${data.month}ヶ月目</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center; background-color: ${status6Color};">$${data.retention6.storageCost.toFixed(2)}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center; background-color: ${status6Color};">${data.retention6.cumulativeVolume.toFixed(1)}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center; background-color: ${status6Color}; font-weight: bold;">${status6Text}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center; background-color: ${status12Color};">$${data.retention12.storageCost.toFixed(2)}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center; background-color: ${status12Color};">${data.retention12.cumulativeVolume.toFixed(1)}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center; background-color: ${status12Color}; font-weight: bold;">${status12Text}</td>
            </tr>
        `;
    });

    const final6Cost = monthlyData[monthlyData.length - 1].retention6.storageCost;
    const final12Cost = monthlyData[monthlyData.length - 1].retention12.storageCost;

    html += `
                </tbody>
            </table>
        </div>
        <div style="margin-top: 20px; padding: 15px; background-color: #e8f5e8; border-radius: 8px;">
            <h4 style="color: #2e7d32; margin-bottom: 10px;">📈 料金推移の特徴</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <h5 style="color: #2196f3; margin-bottom: 8px;">6ヶ月保持</h5>
                    <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
                        <li>累積期間：1-6ヶ月</li>
                        <li>安定期間：7-24ヶ月</li>
                        <li>最終料金：$${final6Cost.toFixed(2)}/月</li>
                    </ul>
                </div>
                <div>
                    <h5 style="color: #632ca6; margin-bottom: 8px;">12ヶ月保持</h5>
                    <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
                        <li>累積期間：1-12ヶ月</li>
                        <li>安定期間：13-24ヶ月</li>
                        <li>最終料金：$${final12Cost.toFixed(2)}/月</li>
                    </ul>
                </div>
            </div>
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
 * URLパラメータを更新する関数
 */
function updateURLParams() {
    const monthlyEvents = document.getElementById('monthlyEvents').value;
    const paymentPlan = document.getElementById('paymentPlan').value;
    
    const params = new URLSearchParams();
    if (monthlyEvents) params.set('events', monthlyEvents);
    if (paymentPlan) params.set('payment', paymentPlan);
    
    const newURL = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    window.history.replaceState({}, '', newURL);
}

/**
 * URLパラメータから値を読み込む関数
 */
function loadFromURLParams() {
    const params = new URLSearchParams(window.location.search);
    
    const events = params.get('events');
    const payment = params.get('payment');
    
    if (events) {
        document.getElementById('monthlyEvents').value = events;
    }
    if (payment && ['annual', 'monthly'].includes(payment)) {
        document.getElementById('paymentPlan').value = payment;
    }
    
    updateEventDisplay();
}

/**
 * 共有URLを生成する関数
 */
function generateShareURL() {
    const monthlyEvents = document.getElementById('monthlyEvents').value;
    const paymentPlan = document.getElementById('paymentPlan').value;
    
    if (!monthlyEvents || monthlyEvents <= 0) {
        alert('月間ログイベント数を入力してから共有URLを生成してください。');
        return;
    }
    
    const params = new URLSearchParams();
    params.set('events', monthlyEvents);
    params.set('payment', paymentPlan);
    
    const shareURL = window.location.origin + window.location.pathname + '?' + params.toString();
    
    // クリップボードにコピー
    navigator.clipboard.writeText(shareURL).then(() => {
        // 成功メッセージを表示
        showShareMessage('共有URLをクリップボードにコピーしました！');
    }).catch(() => {
        // フォールバック: テキストエリアを使用
        const textArea = document.createElement('textarea');
        textArea.value = shareURL;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showShareMessage('共有URLをクリップボードにコピーしました！');
    });
}

/**
 * 共有メッセージを表示する関数
 */
function showShareMessage(message) {
    // 既存のメッセージがあれば削除
    const existingMessage = document.getElementById('shareMessage');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // メッセージ要素を作成
    const messageDiv = document.createElement('div');
    messageDiv.id = 'shareMessage';
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4caf50;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        font-weight: bold;
        animation: slideIn 0.3s ease-out;
    `;
    messageDiv.textContent = message;
    
    // アニメーションのCSSを追加
    if (!document.getElementById('shareMessageStyle')) {
        const style = document.createElement('style');
        style.id = 'shareMessageStyle';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(messageDiv);
    
    // 3秒後に自動削除
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => messageDiv.remove(), 300);
        }
    }, 3000);
}

/**
 * ページ読み込み時の初期化
 */
document.addEventListener('DOMContentLoaded', function() {
    // URLパラメータから値を読み込み
    loadFromURLParams();
    
    // デフォルト値が設定されていない場合のみ設定
    if (!document.getElementById('monthlyEvents').value) {
        document.getElementById('monthlyEvents').value = '1';
    }
    updateEventDisplay();
    
    // 入力値変更時にイベント数表示とURLを更新
    document.getElementById('monthlyEvents').addEventListener('input', function() {
        updateEventDisplay();
        updateURLParams();
    });
    

    document.getElementById('paymentPlan').addEventListener('change', updateURLParams);
    
    // Enterキーでの計算実行
    document.getElementById('monthlyEvents').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            calculateCosts();
        }
    });
    
    // URLパラメータがある場合は自動計算
    const params = new URLSearchParams(window.location.search);
    if (params.get('events')) {
        // 少し遅延させて計算を実行（DOM更新後）
        setTimeout(() => {
            calculateCosts();
            // 結果セクションまでスクロール
            setTimeout(() => {
                document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
            }, 200);
        }, 100);
    }
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