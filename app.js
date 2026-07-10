// Interactive Transport Dashboard Logic

let activeData = [...window.TRANSPORT_DATA];
let trendChart = null;
let toneChart = null;
let destChart = null;
let datePicker = null;

// Helper to format currency
function formatKRW(val) {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(val).replace('₩', '₩ ');
}

// Helper to clean numeric values
function cleanNumeric(val) {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return val;
    const str = String(val).replace(/,/g, '').trim();
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

// Extract unique values for filters
function initFilters() {
    const shipperSelect = document.getElementById('filter-shipper');
    const loadingSelect = document.getElementById('filter-loading');
    const destSelect = document.getElementById('filter-dest');
    const toneSelect = document.getElementById('filter-tone');
    const statusSelect = document.getElementById('filter-status');

    // Keep current values
    const currentShipper = shipperSelect.value;
    const currentLoading = loadingSelect.value;
    const currentDest = destSelect.value;
    const currentTone = toneSelect.value;
    const currentStatus = statusSelect.value;

    shipperSelect.innerHTML = '<option value="">전체 거래처</option>';
    loadingSelect.innerHTML = '<option value="">전체 상차지</option>';
    destSelect.innerHTML = '<option value="">전체 하차지</option>';
    toneSelect.innerHTML = '<option value="">전체 톤급</option>';
    statusSelect.innerHTML = '<option value="">전체 상태</option>';

    const shippers = new Set();
    const loadings = new Set();
    const dests = new Set();
    const tones = new Set();
    const statuses = new Set(['운송실적 확정', '배차확정', '주문 취소']);
    const drivers = new Set();
    const carnums = new Set();

    window.TRANSPORT_DATA.forEach(row => {
        if (row['화주명']) shippers.add(String(row['화주명']).trim());
        if (row['상차지명']) loadings.add(String(row['상차지명']).trim());
        if (row['하차지명']) dests.add(String(row['하차지명']).trim());
        if (row['요청 톤급']) tones.add(String(row['요청 톤급']).trim());
        if (row['주문 상태']) statuses.add(String(row['주문 상태']).trim());
        if (row['운전자명']) drivers.add(String(row['운전자명']).trim());
        if (row['차량번호']) carnums.add(String(row['차량번호']).trim());
    });

    // Populate Shipper
    Array.from(shippers).sort().forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        shipperSelect.appendChild(opt);
    });

    // Populate Loading
    Array.from(loadings).sort().forEach(l => {
        const opt = document.createElement('option');
        opt.value = l;
        opt.textContent = l;
        loadingSelect.appendChild(opt);
    });

    // Populate Destination
    Array.from(dests).sort().forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        destSelect.appendChild(opt);
    });

    // Populate Tones
    Array.from(tones).sort().forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        toneSelect.appendChild(opt);
    });

    // Populate Statuses
    Array.from(statuses).sort().forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        statusSelect.appendChild(opt);
    });

    // Populate Table Header Dropdowns
    const thStatus = document.getElementById('th-filter-status');
    const thLoading = document.getElementById('th-filter-loading');
    const thDest = document.getElementById('th-filter-dest');
    const thTone = document.getElementById('th-filter-tone');
    const thDriver = document.getElementById('th-filter-driver');
    const thCarnum = document.getElementById('th-filter-carnum');

    if (thStatus) {
        thStatus.innerHTML = '<option value="">전체</option>';
        Array.from(statuses).sort().forEach(s => { const o = document.createElement('option'); o.value = s; o.textContent = s; thStatus.appendChild(o); });
    }
    if (thLoading) {
        thLoading.innerHTML = '<option value="">전체</option>';
        Array.from(loadings).sort().forEach(l => { const o = document.createElement('option'); o.value = l; o.textContent = l; thLoading.appendChild(o); });
    }
    if (thDest) {
        thDest.innerHTML = '<option value="">전체</option>';
        Array.from(dests).sort().forEach(d => { const o = document.createElement('option'); o.value = d; o.textContent = d; thDest.appendChild(o); });
    }
    if (thTone) {
        thTone.innerHTML = '<option value="">전체</option>';
        Array.from(tones).sort().forEach(t => { const o = document.createElement('option'); o.value = t; o.textContent = t; thTone.appendChild(o); });
    }
    if (thDriver) {
        thDriver.innerHTML = '<option value="">전체</option>';
        Array.from(drivers).sort().forEach(dr => { const o = document.createElement('option'); o.value = dr; o.textContent = dr; thDriver.appendChild(o); });
    }
    if (thCarnum) {
        thCarnum.innerHTML = '<option value="">전체</option>';
        Array.from(carnums).sort().forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c; thCarnum.appendChild(o); });
    }

    // Restore previous selections if they still exist
    if (currentShipper) shipperSelect.value = currentShipper;
    if (currentLoading) loadingSelect.value = currentLoading;
    if (currentDest) destSelect.value = currentDest;
    if (currentTone) toneSelect.value = currentTone;
    if (currentStatus) statusSelect.value = currentStatus;
}

// Calculate and Render KPIs
function updateKPIs(statusUnfilteredData) {
    let salesTotal = 0;
    let purchaseTotal = 0;
    let ordersCount = activeData.length;

    activeData.forEach(row => {
        salesTotal += cleanNumeric(row['총 매출 금액'] || row['매출 금액']);
        purchaseTotal += cleanNumeric(row['총 매입 금액'] || row['매입 금액']);
    });

    let profitTotal = salesTotal - purchaseTotal;
    let margin = salesTotal > 0 ? (profitTotal / salesTotal) * 100 : 0;

    document.getElementById('kpi-sales').textContent = formatKRW(salesTotal);
    document.getElementById('kpi-purchase').textContent = formatKRW(purchaseTotal);
    document.getElementById('kpi-profit').textContent = formatKRW(profitTotal);
    document.getElementById('kpi-margin').textContent = margin.toFixed(2) + '%';
    document.getElementById('kpi-orders').textContent = ordersCount.toLocaleString() + ' 건';

    const countSource = statusUnfilteredData || activeData;
    
    let confirmCount = 0;
    let assignCount = 0;
    let cancelCount = 0;

    countSource.forEach(row => {
        const status = row['주문 상태'];
        if (status === '운송실적 확정') confirmCount++;
        else if (status === '배차확정') assignCount++;
        else if (status === '주문 취소') cancelCount++;
    });

    const totalSourceCount = countSource.length;
    const confirmPct = totalSourceCount > 0 ? ((confirmCount / totalSourceCount) * 100).toFixed(1) : 0;
    const assignPct = totalSourceCount > 0 ? ((assignCount / totalSourceCount) * 100).toFixed(1) : 0;
    const cancelPct = totalSourceCount > 0 ? ((cancelCount / totalSourceCount) * 100).toFixed(1) : 0;

    const currentStatus = document.getElementById('filter-status').value;

    document.getElementById('kpi-orders-detail').innerHTML = `
        <span class="status-tag success ${currentStatus && currentStatus !== '운송실적 확정' ? 'inactive' : ''}" data-status="운송실적 확정">확정 ${confirmCount} (${confirmPct}%)</span>
        <span class="status-tag warning ${currentStatus && currentStatus !== '배차확정' ? 'inactive' : ''}" data-status="배차확정">배차 ${assignCount} (${assignPct}%)</span>
        <span class="status-tag danger ${currentStatus && currentStatus !== '주문 취소' ? 'inactive' : ''}" data-status="주문 취소">취소 ${cancelCount} (${cancelPct}%)</span>
    `;
}

// Populate and Update Table
function updateTable() {
    const tbody = document.getElementById('table-body');
    const summaryBox = document.getElementById('table-summary');
    tbody.innerHTML = '';
    
    let totalSales = 0;
    let totalPurchase = 0;
    let totalCount = activeData.length;

    if (totalCount === 0) {
        tbody.innerHTML = `<tr><td colspan="11" style="text-align: center; color: var(--text-secondary); padding: 2rem;">검색 및 필터 조건에 맞는 데이터가 없습니다.</td></tr>`;
        if (summaryBox) {
            summaryBox.innerHTML = `<span class="summary-item">현재 조건에 맞는 데이터가 없습니다.</span>`;
        }
        return;
    }

    activeData.forEach(row => {
        const tr = document.createElement('tr');
        tr.className = 'animate-fade';

        // Order status badge styling
        let badgeClass = 'badge-warning';
        if (row['주문 상태'] === '운송실적 확정') badgeClass = 'badge-success';
        if (row['주문 상태'] === '주문 취소') badgeClass = 'badge-danger';

        const sales = cleanNumeric(row['총 매출 금액'] || row['매출 금액']);
        const purchase = cleanNumeric(row['총 매입 금액'] || row['매입 금액']);
        const profit = sales - purchase;
        
        totalSales += sales;
        totalPurchase += purchase;

        tr.innerHTML = `
            <td><span class="badge ${badgeClass}">${row['주문 상태'] || '대기'}</span></td>
            <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${row['상차지명'] || ''}">${row['상차지명'] || '-'}</td>
            <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${row['하차지명'] || ''}">${row['하차지명'] || '-'}</td>
            <td>${row['상차 요청 일시'] || '-'}</td>
            <td>${row['하차 요청 일시'] || '-'}</td>
            <td style="text-align: center;">${row['경유지'] || '0'}</td>
            <td>${row['요청 톤급'] || '-'}</td>
            <td>${row['운전자명'] || '-'}</td>
            <td>${row['차량번호'] || '-'}</td>
            <td style="max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${row['비고'] || ''}">${row['비고'] || '-'}</td>
            <td style="font-weight: 600; text-align: right; color: var(--accent);">${sales.toLocaleString()}원</td>
        `;
        tbody.appendChild(tr);
    });
    
    if (summaryBox) {
        summaryBox.innerHTML = `
            <span class="summary-item"><strong>총 건수:</strong> ${totalCount.toLocaleString()}건</span>
            <span class="summary-item" style="color: #60a5fa;"><strong>총 운임:</strong> ${totalSales.toLocaleString()}원</span>
            <span class="summary-item" style="color: #f59e0b;"><strong>총 매입:</strong> ${totalPurchase.toLocaleString()}원</span>
            <span class="summary-item" style="color: #10b981;"><strong>순이익:</strong> ${(totalSales - totalPurchase).toLocaleString()}원</span>
        `;
    }
}

// Render or Update Charts
function updateCharts() {
    // Process Trend Data (by Date)
    const trendMap = {};
    activeData.forEach(row => {
        const dateStr = (row['상차 요청 일시'] || '미정').split(' ')[0];
        if (!trendMap[dateStr]) {
            trendMap[dateStr] = { sales: 0, purchase: 0 };
        }
        trendMap[dateStr].sales += cleanNumeric(row['총 매출 금액'] || row['매출 금액']);
        trendMap[dateStr].purchase += cleanNumeric(row['총 매입 금액'] || row['매입 금액']);
    });

    const sortedDates = Object.keys(trendMap).sort();
    const trendSales = [];
    const trendPurchase = [];
    const trendProfit = [];

    sortedDates.forEach(d => {
        trendSales.push(trendMap[d].sales);
        trendPurchase.push(trendMap[d].purchase);
        trendProfit.push(trendMap[d].sales - trendMap[d].purchase);
    });

    // Process Truck Tone distribution
    const toneMap = {};
    activeData.forEach(row => {
        const tone = row['요청 톤급'] || '기타';
        toneMap[tone] = (toneMap[tone] || 0) + 1;
    });

    // Process Destination counts
    const destMap = {};
    activeData.forEach(row => {
        const dest = row['하차지명'] || '미정';
        destMap[dest] = (destMap[dest] || 0) + 1;
    });
    const sortedDests = Object.entries(destMap).sort((a,b) => b[1] - a[1]).slice(0, 7);

    // Chart.js updates
    // 1. Trend Chart
    if (trendChart) trendChart.destroy();
    const ctxTrend = document.getElementById('trendChart').getContext('2d');
    trendChart = new Chart(ctxTrend, {
        type: 'bar',
        data: {
            labels: sortedDates,
            datasets: [
                {
                    label: '총 매출액',
                    data: trendSales,
                    backgroundColor: '#3b82f6',
                    borderRadius: 4
                },
                {
                    label: '총 매입액',
                    data: trendPurchase,
                    backgroundColor: '#f59e0b',
                    borderRadius: 4
                },
                {
                    label: '순이익',
                    data: trendProfit,
                    type: 'line',
                    borderColor: '#10b981',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') } }
            },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-secondary') } },
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-secondary') } }
            }
        }
    });

    // 2. Tone Chart
    if (toneChart) toneChart.destroy();
    const ctxTone = document.getElementById('toneChart').getContext('2d');
    
    // 톤급별 점유율(%) 및 대수(건수) 계산을 위한 총 건수 도출
    const totalTones = Object.values(toneMap).reduce((sum, count) => sum + count, 0);
    const toneLabels = Object.entries(toneMap).map(([tone, val]) => {
        const pct = totalTones > 0 ? ((val / totalTones) * 100).toFixed(1) : 0;
        return `${tone} (${val}대 / ${pct}%)`;
    });

    toneChart = new Chart(ctxTone, {
        type: 'doughnut',
        data: {
            labels: toneLabels,
            datasets: [{
                data: Object.values(toneMap),
                backgroundColor: ['#8b5cf6', '#3b82f6', '#10b981', '#06b6d4', '#f59e0b', '#ef4444'],
                borderWidth: 1,
                borderColor: getComputedStyle(document.body).getPropertyValue('--bg-secondary')
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') } },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const val = context.raw;
                            const pct = totalTones > 0 ? ((val / totalTones) * 100).toFixed(1) : 0;
                            const originalLabel = context.label.split(' ')[0];
                            return ` ${originalLabel}: ${val}건 (${pct}%)`;
                        }
                    }
                }
            }
        }
    });

    // 3. Destination Chart
    if (destChart) destChart.destroy();
    const ctxDest = document.getElementById('destChart').getContext('2d');
    destChart = new Chart(ctxDest, {
        type: 'bar',
        data: {
            labels: sortedDests.map(x => x[0]),
            datasets: [{
                label: '운송 건수',
                data: sortedDests.map(x => x[1]),
                backgroundColor: 'rgba(6, 182, 212, 0.7)',
                borderColor: '#06b6d4',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-secondary'), stepSize: 5 } },
                y: { grid: { display: false }, ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-secondary') } }
            }
        }
    });
}

// Sync status select and table tabs
function updateStatusTab(statusVal) {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        if (tab.getAttribute('data-status') === statusVal) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

// Filter Action
function filterData() {
    const shipperVal = document.getElementById('filter-shipper').value;
    const loadingVal = document.getElementById('filter-loading').value;
    const destVal = document.getElementById('filter-dest').value;
    const toneVal = document.getElementById('filter-tone').value;
    const statusVal = document.getElementById('filter-status').value;

    // Read Table Header Filters
    const thStatusVal = document.getElementById('th-filter-status')?.value || '';
    const thLoadingVal = document.getElementById('th-filter-loading')?.value || '';
    const thDestVal = document.getElementById('th-filter-dest')?.value || '';
    const thToneVal = document.getElementById('th-filter-tone')?.value || '';
    const thDriverVal = document.getElementById('th-filter-driver')?.value || '';
    const thCarnumVal = document.getElementById('th-filter-carnum')?.value || '';
    
    // Update main header title dynamically
    const brandNameSpan = document.getElementById('brand-name');
    if (shipperVal) {
        let displayName = shipperVal;
        // Clean up suffix for cleaner display
        displayName = displayName.replace(/주식회사/g, '').replace(/_수출포장/g, '').replace(/_/g, ' ').trim();
        brandNameSpan.textContent = displayName;
    } else {
        brandNameSpan.textContent = "더운반)이천지점";
    }
    
    const dateRangeVal = document.getElementById('filter-date-range').value;
    let startDateVal = '';
    let endDateVal = '';
    if (dateRangeVal) {
        const parts = dateRangeVal.split(/ to | ~ |~/);
        startDateVal = parts[0] ? parts[0].trim() : '';
        endDateVal = parts[1] ? parts[1].trim() : startDateVal;
    }
    
    const searchVal = document.getElementById('search-input').value.toLowerCase();
    
    updateStatusTab(statusVal);

    // 1. 주문 상태 필터를 포함한 최종 데이터 필터링
    activeData = window.TRANSPORT_DATA.filter(row => {
        // Shipper Match
        if (shipperVal && String(row['화주명'] || '').trim() !== shipperVal) return false;
        
        // Loading Match
        if (loadingVal && String(row['상차지명'] || '').trim() !== loadingVal) return false;

        // Destination Match
        if (destVal && String(row['하차지명'] || '').trim() !== destVal) return false;
        
        // Tone Match
        if (toneVal && String(row['요청 톤급'] || '').trim() !== toneVal) return false;
        
        // Status Match
        if (statusVal && String(row['주문 상태'] || '').trim() !== statusVal) return false;

        // Date Range Match
        if (row['상차 요청 일시']) {
            const rowDate = row['상차 요청 일시'].split(' ')[0];
            if (startDateVal && rowDate < startDateVal) return false;
            if (endDateVal && rowDate > endDateVal) return false;
        } else if (startDateVal || endDateVal) {
            return false;
        }

        // Table Header Specific Matches
        if (thStatusVal && String(row['주문 상태'] || '').trim() !== thStatusVal) return false;
        if (thLoadingVal && String(row['상차지명'] || '').trim() !== thLoadingVal) return false;
        if (thDestVal && String(row['하차지명'] || '').trim() !== thDestVal) return false;
        if (thToneVal && String(row['요청 톤급'] || '').trim() !== thToneVal) return false;
        if (thDriverVal && String(row['운전자명'] || '').trim() !== thDriverVal) return false;
        if (thCarnumVal && String(row['차량번호'] || '').trim() !== thCarnumVal) return false;

        // Search text Match (Search drivers, vehicle numbers, detail addresses)
        if (searchVal) {
            const driver = String(row['운전자명'] || '').toLowerCase();
            const carNum = String(row['차량번호'] || '').toLowerCase();
            const address = String(row['하차지 상세 주소'] || '').toLowerCase();
            if (!driver.includes(searchVal) && !carNum.includes(searchVal) && !address.includes(searchVal)) {
                return false;
            }
        }

        return true;
    });

    // 2. 주문 상태 필터만 제외한 데이터 필터링 (KPI 상태별 비율 유지용)
    const statusUnfilteredData = window.TRANSPORT_DATA.filter(row => {
        // Shipper Match
        if (shipperVal && String(row['화주명'] || '').trim() !== shipperVal) return false;
        
        // Loading Match
        if (loadingVal && String(row['상차지명'] || '').trim() !== loadingVal) return false;

        // Destination Match
        if (destVal && String(row['하차지명'] || '').trim() !== destVal) return false;
        
        // Tone Match
        if (toneVal && String(row['요청 톤급'] || '').trim() !== toneVal) return false;
        
        // Date Range Match
        if (row['상차 요청 일시']) {
            const rowDate = row['상차 요청 일시'].split(' ')[0];
            if (startDateVal && rowDate < startDateVal) return false;
            if (endDateVal && rowDate > endDateVal) return false;
        } else if (startDateVal || endDateVal) {
            return false;
        }

        // Table Header Specific Matches
        if (thStatusVal && String(row['주문 상태'] || '').trim() !== thStatusVal) return false;
        if (thLoadingVal && String(row['상차지명'] || '').trim() !== thLoadingVal) return false;
        if (thDestVal && String(row['하차지명'] || '').trim() !== thDestVal) return false;
        if (thToneVal && String(row['요청 톤급'] || '').trim() !== thToneVal) return false;
        if (thDriverVal && String(row['운전자명'] || '').trim() !== thDriverVal) return false;
        if (thCarnumVal && String(row['차량번호'] || '').trim() !== thCarnumVal) return false;

        // Search text Match
        if (searchVal) {
            const driver = String(row['운전자명'] || '').toLowerCase();
            const carNum = String(row['차량번호'] || '').toLowerCase();
            const address = String(row['하차지 상세 주소'] || '').toLowerCase();
            if (!driver.includes(searchVal) && !carNum.includes(searchVal) && !address.includes(searchVal)) {
                return false;
            }
        }

        return true;
    });

    updateKPIs(statusUnfilteredData);
    updateCharts();
    updateTable();
}

// Reset Filters
function resetFilters() {
    document.getElementById('filter-shipper').value = '';
    document.getElementById('filter-loading').value = '';
    document.getElementById('filter-dest').value = '';
    document.getElementById('filter-tone').value = '';
    document.getElementById('filter-status').value = '';
    if (datePicker) {
        datePicker.clear();
    }
    document.getElementById('search-input').value = '';
    
    updateStatusTab('');
    activeData = [...window.TRANSPORT_DATA];
    updateKPIs();
    updateCharts();
    updateTable();
}

// Export CSV
function exportToCSV() {
    if (activeData.length === 0) return;
    
    // Create header
    const headers = ['주문상태', '상차지명', '하차지명', '출발일', '도착일', '하차지상세주소', '경유지', '톤급', '차량번호', '운전자명', '비고', '매출금액', '매입금액', '순이익', '순이익률'];
    
    let csvContent = '\uFEFF'; // UTF-8 BOM
    csvContent += headers.join(',') + '\n';
    
    activeData.forEach(row => {
        const sales = cleanNumeric(row['총 매출 금액'] || row['매출 금액']);
        const purchase = cleanNumeric(row['총 매입 금액'] || row['매입 금액']);
        const profit = sales - purchase;
        const margin = sales > 0 ? (profit / sales * 100).toFixed(2) + '%' : '0%';
        
        const line = [
            row['주문 상태'] || '',
            row['상차지명'] || '',
            row['하차지명'] || '',
            row['상차 요청 일시'] || '',
            row['하차 요청 일시'] || '',
            `"${(row['하차지 상세 주소'] || '').replace(/"/g, '""')}"`,
            row['경유지'] || '0',
            row['요청 톤급'] || '',
            row['차량번호'] || '',
            row['운전자명'] || '',
            `"${(row['비고'] || '').replace(/"/g, '""')}"`,
            sales,
            purchase,
            profit,
            `"${margin}"`
        ];
        csvContent += line.join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "운송데이터_추출결과.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Theme toggle
function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    
    const themeIcon = document.getElementById('theme-icon');
    if (newTheme === 'light') {
        themeIcon.textContent = '☀️';
    } else {
        themeIcon.textContent = '🌙';
    }
    
    const flatpickrTheme = document.getElementById('flatpickr-dark-theme');
    if (flatpickrTheme) {
        flatpickrTheme.disabled = (newTheme === 'light');
    }
    
    // Re-render charts to pick up new text colors
    updateCharts();
}

// On Load
function initDashboard() {
    initFilters();
    updateKPIs();
    updateCharts();
    updateTable();

    // Show initial update time if available
    const timeSpan = document.getElementById('last-updated-time');
    if (timeSpan && window.LAST_UPDATED) {
        timeSpan.textContent = "최근 업데이트: " + window.LAST_UPDATED;
    }

    // Initialize Flatpickr date range picker
    datePicker = flatpickr("#filter-date-range", {
        mode: "range",
        locale: "ko",
        dateFormat: "Y-m-d",
        onChange: function(selectedDates, dateStr, instance) {
            // Only filter if 0 dates selected (cleared) or both dates selected (range complete)
            if (selectedDates.length === 0 || selectedDates.length === 2) {
                filterData();
            }
        }
    });

    // Event listeners
    document.getElementById('filter-shipper').addEventListener('change', filterData);
    document.getElementById('filter-loading').addEventListener('change', filterData);
    document.getElementById('filter-dest').addEventListener('change', filterData);
    document.getElementById('filter-tone').addEventListener('change', filterData);
    document.getElementById('filter-status').addEventListener('change', filterData);
    document.getElementById('search-input').addEventListener('input', filterData);

    // Table header filters event listeners
    document.querySelectorAll('.th-filter').forEach(el => {
        el.addEventListener('change', filterData);
    });
    
    // Tab button event listeners
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const selectedStatus = e.currentTarget.getAttribute('data-status');
            document.getElementById('filter-status').value = selectedStatus;
            filterData();
        });
    });
    
    // KPI Status tag click event listeners (Event delegation)
    document.getElementById('kpi-orders-detail').addEventListener('click', (e) => {
        const target = e.target.closest('.status-tag');
        if (target) {
            const statusVal = target.getAttribute('data-status');
            document.getElementById('filter-status').value = statusVal;
            filterData();
        }
    });
    
    document.getElementById('btn-reset').addEventListener('click', resetFilters);
    document.getElementById('btn-export').addEventListener('click', exportToCSV);
    document.getElementById('btn-theme').addEventListener('click', toggleTheme);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}

// Live auto-polling mechanism
const knownDataStrings = new Set([JSON.stringify(window.TRANSPORT_DATA)]);

setInterval(async () => {
    try {
        const res = await fetch('dashboard_data.json?t=' + Date.now());
        if (!res.ok) return;
        const newData = await res.json();
        const actualData = newData.data || newData;
        const newStr = JSON.stringify(actualData);
        
        // Use a Set to remember seen versions. This prevents popup spam 
        // if the GitHub CDN flip-flops between old and new versions during deployment.
        if (!knownDataStrings.has(newStr)) {
            console.log("New data detected! Updating dashboard live...");
            knownDataStrings.add(newStr);
            window.TRANSPORT_DATA = actualData;
            
            if (newData.last_updated) {
                window.LAST_UPDATED = newData.last_updated;
                const timeSpan = document.getElementById('last-updated-time');
                if (timeSpan) timeSpan.textContent = "최근 업데이트: " + window.LAST_UPDATED;
            }
            
            // Update dropdowns in case there are new shippers/dests
            initFilters();
            
            // Re-apply filters with new data
            filterData();
            
            // Show a subtle notification (toast) to user (Sticky until closed)
            const toast = document.createElement('div');
            toast.style.position = 'fixed';
            toast.style.bottom = '20px';
            toast.style.right = '20px';
            toast.style.backgroundColor = 'var(--accent)';
            toast.style.color = '#fff';
            toast.style.padding = '12px 24px';
            toast.style.borderRadius = '8px';
            toast.style.zIndex = '9999';
            toast.style.fontWeight = 'bold';
            toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            toast.style.animation = 'fadein 0.5s';
            toast.style.display = 'flex';
            toast.style.alignItems = 'center';
            toast.style.gap = '15px';
            
            const msgSpan = document.createElement('span');
            msgSpan.textContent = "데이터가 실시간으로 최신화되었습니다!";
            toast.appendChild(msgSpan);
            
            const closeBtn = document.createElement('button');
            closeBtn.textContent = '확인 (닫기)';
            closeBtn.style.background = 'rgba(255,255,255,0.2)';
            closeBtn.style.border = 'none';
            closeBtn.style.color = '#fff';
            closeBtn.style.padding = '4px 10px';
            closeBtn.style.borderRadius = '4px';
            closeBtn.style.cursor = 'pointer';
            closeBtn.style.fontWeight = 'bold';
            
            closeBtn.onclick = function() {
                toast.style.animation = 'fadeout 0.3s';
                setTimeout(() => toast.remove(), 290);
            };
            
            toast.appendChild(closeBtn);
            document.body.appendChild(toast);
        }
    } catch(e) {
        // Ignore fetch errors to prevent console spam
    }
}, 10000); // Poll every 10 seconds
