// Datadog Logs 料金表
const PRICING = {
    // 取り込み料金 ($/GB) - US/AP共通
    ingestion: 0.10,

    // 保持料金 ($/100万ログイベント)
    retention: {
        US: {
            annual: { 3: 1.06, 7: 1.27, 15: 1.70, 30: 2.50 },
            monthly: { 3: 1.59, 7: 1.91, 15: 2.55, 30: 3.75 }
        },
        AP: {
            annual: { 3: 1.33, 7: 1.59, 15: 2.13, 30: 3.13 },
            monthly: { 3: 1.99, 7: 2.39, 15: 3.19, 30: 4.69 }
        }
    }
};

// 為替レート (円/$)
const EXCHANGE_RATE = 150;

// DOM要素の取得
const elements = {
    logEvents: document.getElementById('logEvents'),
    logEventsSlider: document.getElementById('logEventsSlider'),
    logEventsDisplay: document.getElementById('logEventsDisplay'),
    logEventsUnit: document.getElementById('logEventsUnit'),
    logBytes: document.getElementById('logBytes'),
    logBytesSlider: document.getElementById('logBytesSlider'),
    logBytesUnit: document.getElementById('logBytesUnit'),
    retention: document.getElementById('retention'),
    region: document.getElementById('region'),
    paymentPlan: document.getElementById('paymentPlan'),
    calculateBtn: document.getElementById('calculateBtn'),
    shareBtn: document.getElementById('shareBtn'),
    ingestionCost: document.getElementById('ingestionCost'),
    retentionCost: document.getElementById('retentionCost'),
    totalUSD: document.getElementById('totalUSD'),
    totalJPY: document.getElementById('totalJPY')
};

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    loadFromURL();
    // 初期単位を設定
    previousEventsUnit = elements.logEventsUnit.value;
    previousBytesUnit = elements.logBytesUnit.value;
    syncSliders();
    addEventListeners();
    // 初期表示を更新
    updateDisplays();
    calculate();
    // 初期URLを設定（パラメータが無い場合のデフォルト値）
    updateURL();
});

// URLパラメータから設定を読み込む
function loadFromURL() {
    // URL読み込み中フラグをON
    isUpdatingFromURL = true;

    const params = new URLSearchParams(window.location.search);

    if (params.get('eventsUnit')) {
        elements.logEventsUnit.value = params.get('eventsUnit');
    }

    if (params.get('bytesUnit')) {
        elements.logBytesUnit.value = params.get('bytesUnit');
    }

    // 単位設定後に範囲を更新
    updateUnitRanges();

        if (params.get('events')) {
        const events = parseInt(params.get('events'));
        elements.logEvents.value = events;
        // スライダーの範囲内であれば同期
        if (events <= parseInt(elements.logEventsSlider.max)) {
            elements.logEventsSlider.value = events;
        }
    }

    if (params.get('bytes')) {
        const bytes = parseInt(params.get('bytes'));
        elements.logBytes.value = bytes;
        // スライダーの範囲内であれば同期
        if (bytes <= parseInt(elements.logBytesSlider.max)) {
            elements.logBytesSlider.value = bytes;
        }
    }

    if (params.get('retention')) {
        elements.retention.value = params.get('retention');
    }

    if (params.get('region')) {
        elements.region.value = params.get('region');
    }

    if (params.get('plan')) {
        elements.paymentPlan.value = params.get('plan');
    }

    // URL読み込み中フラグをOFF
    isUpdatingFromURL = false;
}

// 前回の単位を保持する変数
let previousEventsUnit = 'events';
let previousBytesUnit = 'gb';

// 単位変更時の処理
function updateUnitRanges() {
    const eventsUnit = elements.logEventsUnit.value;
    const bytesUnit = elements.logBytesUnit.value;

        // ログイベント数の単位変換
    if (eventsUnit !== previousEventsUnit) {
        const currentValue = parseInt(elements.logEvents.value) || 100000000;

        if (eventsUnit === 'millions' && previousEventsUnit === 'events') {
            // イベント → 百万イベント
            const newValue = Math.max(1, Math.round(currentValue / 1000000));
            elements.logEvents.value = newValue;
            if (newValue <= parseInt(elements.logEventsSlider.max)) {
                elements.logEventsSlider.value = newValue;
            }
        } else if (eventsUnit === 'events' && previousEventsUnit === 'millions') {
            // 百万イベント → イベント
            const newValue = currentValue * 1000000;
            elements.logEvents.value = newValue;
            if (newValue <= parseInt(elements.logEventsSlider.max)) {
                elements.logEventsSlider.value = newValue;
            }
        }
        previousEventsUnit = eventsUnit;
    }

        // バイト数の単位変換
    if (bytesUnit !== previousBytesUnit) {
        const currentValue = parseInt(elements.logBytes.value) || 1000;

        // 前の単位から基本単位（bytes）に変換
        const bytesMultipliers = {
            'bytes': 1,
            'kb': 1000,
            'mb': 1000000,
            'gb': 1000000000,
            'tb': 1000000000000
        };

                const valueInBytes = currentValue * bytesMultipliers[previousBytesUnit];
        const newValue = Math.max(1, Math.round(valueInBytes / bytesMultipliers[bytesUnit]));

        elements.logBytes.value = newValue;
        if (newValue <= parseInt(elements.logBytesSlider.max)) {
            elements.logBytesSlider.value = newValue;
        }

        previousBytesUnit = bytesUnit;
    }

        // スライダーの範囲調整（大きな値対応）
    if (eventsUnit === 'millions') {
        elements.logEventsSlider.max = 1000000; // 100万百万イベント = 1兆イベント
        elements.logEventsSlider.step = 1000;
    } else {
        elements.logEventsSlider.max = 1000000000000; // 1兆イベント
        elements.logEventsSlider.step = 1000000000;
    }

    // バイト数の範囲設定（大きな値対応）
    const bytesRanges = {
        'bytes': { max: 1000000000000000, step: 1000000000000 }, // 1PB、1TB刻み
        'kb': { max: 1000000000000, step: 1000000 }, // 1PB相当、1GB刻み
        'mb': { max: 1000000000, step: 1000 }, // 1PB相当、1TB刻み
        'gb': { max: 1000000, step: 1000 }, // 1PB、1TB刻み
        'tb': { max: 1000, step: 1 } // 1PB、1TB刻み
    };

    const byteRange = bytesRanges[bytesUnit];
    elements.logBytesSlider.max = byteRange.max;
    elements.logBytesSlider.step = byteRange.step;

    updateDisplays();
    calculate();
    updateURL();
}

// 表示更新
function updateDisplays() {
    const eventsValue = parseInt(elements.logEvents.value);
    const eventsUnit = elements.logEventsUnit.value;

    elements.logEventsDisplay.textContent = formatLogEvents(eventsValue, eventsUnit);
}

// スライダーと数値入力の同期
function syncSliders() {
            // ログイベント数の同期
    elements.logEvents.addEventListener('input', function() {
        const value = Math.max(parseInt(this.value) || 1, 1);
        this.value = value;
        // スライダーの範囲内であれば同期
        if (value <= parseInt(elements.logEventsSlider.max)) {
            elements.logEventsSlider.value = value;
        }
        updateDisplays();
        calculate();
        updateURL();
    });

    elements.logEventsSlider.addEventListener('input', function() {
        elements.logEvents.value = this.value;
        updateDisplays();
        calculate();
        updateURL();
    });

    // ログバイト数の同期
    elements.logBytes.addEventListener('input', function() {
        const value = Math.max(parseInt(this.value) || 1, 1);
        this.value = value;
        // スライダーの範囲内であれば同期
        if (value <= parseInt(elements.logBytesSlider.max)) {
            elements.logBytesSlider.value = value;
        }
        updateDisplays();
        calculate();
        updateURL();
    });

    elements.logBytesSlider.addEventListener('input', function() {
        elements.logBytes.value = this.value;
        updateDisplays();
        calculate();
        updateURL();
    });

    // 単位変更の監視
    elements.logEventsUnit.addEventListener('change', updateUnitRanges);
    elements.logBytesUnit.addEventListener('change', updateUnitRanges);
}

// イベントリスナーの追加
function addEventListeners() {
    // 選択要素の変更時に計算とURL更新を実行
    elements.retention.addEventListener('change', function() {
        calculate();
        updateURL();
    });
    elements.region.addEventListener('change', function() {
        calculate();
        updateURL();
    });
    elements.paymentPlan.addEventListener('change', function() {
        calculate();
        updateURL();
    });

    // 計算ボタン
    elements.calculateBtn.addEventListener('click', function() {
        calculate();
        updateURL();
        // 計算完了のアニメーション
        this.textContent = '計算完了！';
        setTimeout(() => {
            this.textContent = '計算する';
        }, 1000);
    });

    // 共有ボタン
    elements.shareBtn.addEventListener('click', shareURL);
}

// 料金計算
function calculate() {
    const logEventsValue = parseFloat(elements.logEvents.value) || 0;
    const logBytesValue = parseFloat(elements.logBytes.value) || 0;
    const eventsUnit = elements.logEventsUnit.value;
    const bytesUnit = elements.logBytesUnit.value;
    const retention = parseInt(elements.retention.value);
    const region = elements.region.value;
    const paymentPlan = elements.paymentPlan.value;

    // ログイベント数を百万イベント単位に変換
    let logEventsInMillions;
    if (eventsUnit === 'millions') {
        logEventsInMillions = logEventsValue;
    } else {
        logEventsInMillions = logEventsValue / 1000000;
    }

    // バイト数をGB単位に変換
    const bytesToGBMultipliers = {
        'bytes': 1 / 1000000000,
        'kb': 1 / 1000000,
        'mb': 1 / 1000,
        'gb': 1,
        'tb': 1000
    };

    const logBytesInGB = logBytesValue * bytesToGBMultipliers[bytesUnit];

    // 取り込み料金計算
    const ingestionCost = logBytesInGB * PRICING.ingestion;

    // 保持料金計算
    const retentionRate = PRICING.retention[region][paymentPlan][retention];
    const retentionCost = logEventsInMillions * retentionRate;

    // 合計料金
    const totalUSD = ingestionCost + retentionCost;
    const totalJPY = totalUSD * EXCHANGE_RATE;

    // 結果の表示
    updateResults(ingestionCost, retentionCost, totalUSD, totalJPY);
}

// 結果の表示更新
function updateResults(ingestionCost, retentionCost, totalUSD, totalJPY) {
    elements.ingestionCost.textContent = formatCurrency(ingestionCost, 'USD');
    elements.retentionCost.textContent = formatCurrency(retentionCost, 'USD');
    elements.totalUSD.textContent = formatCurrency(totalUSD, 'USD');
    elements.totalJPY.textContent = formatCurrency(totalJPY, 'JPY');

    // アニメーション効果
    [elements.ingestionCost, elements.retentionCost, elements.totalUSD, elements.totalJPY].forEach(el => {
        el.style.transform = 'scale(1.05)';
        setTimeout(() => {
            el.style.transform = 'scale(1)';
        }, 200);
    });
}

// URL動的更新機能
let isUpdatingFromURL = false; // URL読み込み中のフラグ

function updateURL() {
    // URL読み込み中は更新しない（無限ループ防止）
    if (isUpdatingFromURL) return;

    const params = new URLSearchParams();
    params.set('events', elements.logEvents.value);
    params.set('eventsUnit', elements.logEventsUnit.value);
    params.set('bytes', elements.logBytes.value);
    params.set('bytesUnit', elements.logBytesUnit.value);
    params.set('retention', elements.retention.value);
    params.set('region', elements.region.value);
    params.set('plan', elements.paymentPlan.value);

    const newURL = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

    // URLを更新（ページリロードなし）
    window.history.replaceState({}, '', newURL);
}

// URL共有機能
function shareURL() {
    const currentURL = window.location.href;

    // URLをクリップボードにコピー
    navigator.clipboard.writeText(currentURL).then(() => {
        // 成功フィードバック
        const originalText = elements.shareBtn.textContent;
        elements.shareBtn.textContent = 'URLをコピーしました！';
        elements.shareBtn.classList.add('share-success');

        setTimeout(() => {
            elements.shareBtn.textContent = originalText;
            elements.shareBtn.classList.remove('share-success');
        }, 2000);
    }).catch(() => {
        // フォールバック: URLを表示
        prompt('この URL をコピーしてください:', currentURL);
    });
}

// ユーティリティ関数: 数値フォーマット
function formatNumber(num) {
    return num.toLocaleString('ja-JP', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

// ユーティリティ関数: ログイベント数フォーマット（日本の単位）
function formatLogEvents(num, unit) {
    if (unit === 'millions') {
        // 百万イベント単位の時は実際のイベント数に変換して日本語表示
        const actualEvents = num * 1000000;
        if (actualEvents >= 100000000) {
            return `${(actualEvents / 100000000).toFixed(1)}億`;
        } else if (actualEvents >= 10000) {
            return `${(actualEvents / 10000).toFixed(1)}万`;
        } else if (actualEvents >= 1000) {
            return `${(actualEvents / 1000).toFixed(1)}千`;
        } else {
            return actualEvents.toString();
        }
    } else {
        if (num >= 100000000) {
            return `${(num / 100000000).toFixed(1)}億`;
        } else if (num >= 10000) {
            return `${(num / 10000).toFixed(1)}万`;
        } else if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}千`;
        } else {
            return num.toString();
        }
    }
}



// ユーティリティ関数: 通貨フォーマット（完全な数値表示）
function formatCurrency(amount, currency = 'USD') {
    if (currency === 'USD') {
        return `$${amount.toFixed(2)}`;
    } else if (currency === 'JPY') {
        const roundedAmount = Math.round(amount);
        return `¥${roundedAmount.toLocaleString()}`;
    }
    return amount.toString();
}

// エラーハンドリング
window.addEventListener('error', function(e) {
    console.error('エラーが発生しました:', e.error);
    // ユーザーに分かりやすいエラーメッセージを表示
    elements.totalUSD.textContent = 'エラー';
    elements.totalJPY.textContent = 'エラー';
});

// スマートフォン対応: タッチイベントの最適化
if ('ontouchstart' in window) {
    document.body.classList.add('touch-device');
}