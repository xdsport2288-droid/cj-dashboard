// Interactive Transport Dashboard Logic

// Custom MultiSelect Class
class CustomMultiSelect {
    constructor(selectElement, defaultText) {
        if (!selectElement) return;

        // If already wrapped, unwrap and destroy the old custom UI so we can recreate it fresh
        if (selectElement.parentNode && selectElement.parentNode.classList.contains('custom-multiselect')) {
            const oldWrapper = selectElement.parentNode;
            oldWrapper.parentNode.insertBefore(selectElement, oldWrapper);
            oldWrapper.remove();
        }

        this.selectElement = selectElement;
        this.defaultText = defaultText;
        this.options = Array.from(selectElement.options);

        // Hide the original select
        this.selectElement.style.display = 'none';

        // Create the wrapper
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'custom-multiselect';
        this.selectElement.parentNode.insertBefore(this.wrapper, this.selectElement);
        this.wrapper.appendChild(this.selectElement);

        // Create the summary button
        this.btn = document.createElement('div');
        this.baseBtnClass = this.selectElement.classList.contains('th-filter') ? 'th-filter custom-multiselect-btn' : 'filter-select custom-multiselect-btn';
        this.btn.className = this.baseBtnClass;
        this.btn.textContent = this.defaultText;
        this.wrapper.appendChild(this.btn);

        // Create the dropdown panel
        this.panel = document.createElement('div');
        this.panel.className = 'custom-multiselect-panel';
        this.panel.style.display = 'none';
        document.body.appendChild(this.panel);

        // Add global scroll listener ONCE to close popups on scroll
        if (!window.__cmsScrollListenerAttached) {
            window.addEventListener('scroll', (e) => {
                if (e.target && e.target.closest && e.target.closest('.custom-multiselect-panel')) return;
                document.querySelectorAll('.custom-multiselect-panel').forEach(p => p.style.display = 'none');
                document.querySelectorAll('.custom-multiselect').forEach(w => w.classList.remove('is-open'));
            }, { capture: true, passive: true });
            window.__cmsScrollListenerAttached = true;
        }

        // Select All Checkbox
        this.selectAllWrapper = document.createElement('label');
        this.selectAllWrapper.className = 'custom-multiselect-option select-all';
        const selectAllCb = document.createElement('input');
        selectAllCb.type = 'checkbox';
        this.selectAllWrapper.appendChild(selectAllCb);
        this.selectAllWrapper.appendChild(document.createTextNode(' 전체 선택/해제'));
        this.panel.appendChild(this.selectAllWrapper);

        // Determine grid columns
        let cols = 1;
        if (this.options.length > 20) cols = 4;
        else if (this.options.length > 12) cols = 3;
        else if (this.options.length > 6) cols = 2;

        this.panel.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        if (cols > 1) {
            this.panel.style.width = 'max-content';
            this.panel.style.maxWidth = '90vw'; // prevent overflow
            this.selectAllWrapper.style.gridColumn = '1 / -1';
            this.selectAllWrapper.style.borderBottom = '1px solid var(--card-border)';
            this.selectAllWrapper.style.marginBottom = '5px';
            this.selectAllWrapper.style.paddingBottom = '8px';
        }

        // Options checkboxes
        this.checkboxes = [];
        this.options.forEach(opt => {
            const lbl = document.createElement('label');
            lbl.className = 'custom-multiselect-option';
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.value = opt.value;
            cb.checked = opt.selected;
            lbl.appendChild(cb);
            lbl.appendChild(document.createTextNode(' ' + opt.textContent));
            this.panel.appendChild(lbl);
            this.checkboxes.push(cb);

            cb.addEventListener('change', () => {
                opt.selected = cb.checked;
                this.updateButton();
                this.updateSelectAllState(selectAllCb);
                if (this.syncTarget) this.syncTarget.syncFrom(this);
                if (typeof filterData === 'function') filterData();
            });
        });

        // Select All logic
        selectAllCb.addEventListener('change', () => {
            const isChecked = selectAllCb.checked;
            this.checkboxes.forEach((cb, i) => {
                cb.checked = isChecked;
                this.options[i].selected = isChecked;
            });
            this.updateButton();
            if (this.syncTarget) this.syncTarget.syncFrom(this);
            if (typeof filterData === 'function') filterData();
        });

        // Toggle panel
        this.btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = this.panel.style.display === 'grid';

            // Close all others first
            document.querySelectorAll('.custom-multiselect-panel').forEach(p => p.style.display = 'none');
            document.querySelectorAll('.custom-multiselect').forEach(w => w.classList.remove('is-open'));

            if (!isOpen) {
                this.panel.style.display = 'grid';
                this.wrapper.classList.add('is-open');

                // Reset positions to default before measuring
                this.panel.style.position = 'fixed';
                this.panel.style.top = '0';
                this.panel.style.left = '0';
                this.panel.style.right = 'auto';
                this.panel.style.bottom = 'auto';

                const btnRect = this.btn.getBoundingClientRect();
                
                this.panel.style.minWidth = btnRect.width + 'px';
                this.panel.style.width = 'max-content';
                this.panel.style.maxHeight = '50vh';
                this.panel.style.overflowY = 'auto';
                
                const panelRect = this.panel.getBoundingClientRect();

                // Horizontal Positioning
                let left = btnRect.left;
                // If it overflows the right edge of the screen, align right
                if (btnRect.left + panelRect.width > window.innerWidth) {
                    left = btnRect.right - panelRect.width;
                }
                // Clamp to screen edges
                if (left < 10) left = 10;
                this.panel.style.left = left + 'px';

                // Vertical Positioning
                let top = btnRect.bottom + 4;
                this.panel.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.4)';
                
                // Pop upwards if there isn't enough space below AND there is more space above
                if (btnRect.bottom + panelRect.height > window.innerHeight) {
                    if (btnRect.top > window.innerHeight - btnRect.bottom) {
                        top = btnRect.top - panelRect.height - 4;
                        this.panel.style.boxShadow = '0 -4px 15px rgba(0, 0, 0, 0.4)';
                    }
                }
                // Clamp to screen top edge
                if (top < 10) top = 10;
                this.panel.style.top = top + 'px';
            }
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.wrapper.contains(e.target) && !this.panel.contains(e.target)) {
                this.panel.style.display = 'none';
                this.wrapper.classList.remove('is-open');
            }
        });

        this.updateButton();
    }

    updateButton() {
        const selectedCheckboxes = this.checkboxes.filter(cb => cb.checked);
        const selectedCount = selectedCheckboxes.length;
        if (selectedCount === 0 || selectedCount === this.checkboxes.length) {
            this.btn.textContent = this.defaultText;
            this.btn.className = this.baseBtnClass;
            this.btn.title = this.defaultText;
        } else if (selectedCount === 1) {
            const selectedText = selectedCheckboxes[0].parentElement.textContent.trim();
            this.btn.textContent = selectedText;
            
            let extraClass = '';
            if (selectedText.includes('배차완료')) extraClass = 'success-text';
            else if (selectedText.includes('운송완료')) extraClass = 'warning-text';
            else if (selectedText.includes('취소')) extraClass = 'danger-text';
            else if (selectedText.includes('접수')) extraClass = 'info-text';
            else extraClass = 'primary-text';

            this.btn.className = `${this.baseBtnClass} has-selection ${extraClass}`;
            this.btn.title = selectedText;
        } else {
            const allSelectedTexts = selectedCheckboxes.map(cb => cb.parentElement.textContent.trim()).join(', ');
            this.btn.textContent = allSelectedTexts;
            this.btn.className = `${this.baseBtnClass} has-selection primary-text`;
            this.btn.title = allSelectedTexts;
        }
    }

    updateSelectAllState(selectAllCb) {
        const selectedCount = this.checkboxes.filter(cb => cb.checked).length;
        selectAllCb.checked = (selectedCount === this.checkboxes.length && selectedCount > 0);
    }

    setValue(val) {
        this.checkboxes.forEach((cb, i) => {
            cb.checked = (val !== '' && this.options[i].value === val);
            this.options[i].selected = cb.checked;
        });
        this.updateButton();
        const selectAllCb = this.selectAllWrapper.querySelector('input');
        if (selectAllCb) this.updateSelectAllState(selectAllCb);
        if (this.syncTarget) this.syncTarget.syncFrom(this);
    }

    setSyncTarget(targetCms) {
        this.syncTarget = targetCms;
    }

    syncFrom(otherCms) {
        if (!otherCms) return;
        this.checkboxes.forEach((cb, i) => {
            cb.checked = otherCms.checkboxes[i].checked;
            this.options[i].selected = cb.checked;
        });
        this.updateButton();
        const selectAllCb = this.selectAllWrapper.querySelector('input');
        if (selectAllCb) this.updateSelectAllState(selectAllCb);
    }
}

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
    const carrierSelect = document.getElementById('filter-carrier');
    const loadingSelect = document.getElementById('filter-loading');
    const destSelect = document.getElementById('filter-dest');
    const toneSelect = document.getElementById('filter-tone');
    const statusSelect = document.getElementById('filter-status');

    const currentShipper = shipperSelect.value;
    const currentCarrier = carrierSelect ? carrierSelect.value : '';
    const currentLoading = loadingSelect.value;
    const currentDest = destSelect.value;
    const currentTone = toneSelect.value;
    const currentStatus = statusSelect.value;

    shipperSelect.innerHTML = '<option value="">전체 거래처</option>';
    if (carrierSelect) carrierSelect.innerHTML = '<option value="">간선사 (전체)</option>';
    loadingSelect.innerHTML = '<option value="">전체 상차지</option>';
    destSelect.innerHTML = '<option value="">전체 하차지</option>';
    toneSelect.innerHTML = '<option value="">전체 톤급</option>';
    shipperSelect.innerHTML = '';
    if (carrierSelect) carrierSelect.innerHTML = '';
    loadingSelect.innerHTML = '';
    destSelect.innerHTML = '';
    toneSelect.innerHTML = '';
    statusSelect.innerHTML = '';

    const shippers = new Set();
    const carriers = new Set();
    const loadings = new Set();
    const dests = new Set();
    const tones = new Set();
    const carTypes = new Set();
    const statuses = new Set();
    const drivers = new Set();
    const carnums = new Set();
    const waypoints = new Set();
    const remarks = new Set();
    const fares = new Set();
    const startdates = new Set();
    const enddates = new Set();

    window.TRANSPORT_DATA.forEach(row => {
        if (row['화주명']) shippers.add(String(row['화주명']).trim());
        let c = String(row['간선사'] || '').trim();
        carriers.add(c === '' ? '(미지정)' : c);
        if (row['상차지명']) loadings.add(String(row['상차지명']).trim());
        if (row['하차지명']) dests.add(String(row['하차지명']).trim());
        if (row['요청 톤급']) tones.add(String(row['요청 톤급']).trim());
        if (row['요청 차량']) carTypes.add(String(row['요청 차량']).trim());
        if (row['주문 상태']) statuses.add(String(row['주문 상태']).trim());
        if (row['운전자명']) drivers.add(String(row['운전자명']).trim());
        if (row['차량번호']) carnums.add(String(row['차량번호']).trim());
        if (row['경유지'] !== undefined && row['경유지'] !== null) waypoints.add(String(row['경유지']).trim());
        if (row['비고'] !== undefined && row['비고'] !== null) remarks.add(String(row['비고']).trim());
        const sales = row['총 매출 금액'] || row['매출 금액'];
        if (sales !== undefined && sales !== null && String(sales).trim() !== '') fares.add(String(sales).trim());
        if (row['상차 요청 일시']) startdates.add(String(row['상차 요청 일시']).trim());
        if (row['하차 요청 일시']) enddates.add(String(row['하차 요청 일시']).trim());
    });

    const thStatus = document.getElementById('th-filter-status');
    const thShipper = document.getElementById('th-filter-shipper');
    const thCarrier = document.getElementById('th-filter-carrier');
    const thLoading = document.getElementById('th-filter-loading');
    const thDest = document.getElementById('th-filter-dest');
    const thTone = document.getElementById('th-filter-tone');
    const thCartype = document.getElementById('th-filter-cartype');
    const thDriver = document.getElementById('th-filter-driver');
    const thCarnum = document.getElementById('th-filter-carnum');
    const thWaypoint = document.getElementById('th-filter-waypoint');
    const thRemark = document.getElementById('th-filter-remark');
    const thFare = document.getElementById('th-filter-fare');
    const thStartdate = document.getElementById('th-filter-startdate');
    const thEnddate = document.getElementById('th-filter-enddate');

    if (thStatus) thStatus.innerHTML = '';
    if (thShipper) thShipper.innerHTML = '';
    if (thCarrier) thCarrier.innerHTML = '';
    if (thLoading) thLoading.innerHTML = '';
    if (thDest) thDest.innerHTML = '';
    if (thWaypoint) thWaypoint.innerHTML = '';
    if (thTone) thTone.innerHTML = '';
    if (thCartype) thCartype.innerHTML = '';
    if (thDriver) thDriver.innerHTML = '';
    if (thCarnum) thCarnum.innerHTML = '';
    if (thRemark) thRemark.innerHTML = '';
    if (thFare) thFare.innerHTML = '';
    if (thStartdate) thStartdate.innerHTML = '';
    if (thEnddate) thEnddate.innerHTML = '';

    // Populate options in native select elements
    if (shipperSelect) Array.from(shippers).sort().forEach(s => { const o = document.createElement('option'); o.value = s; o.textContent = s; shipperSelect.appendChild(o); });
    if (carrierSelect) Array.from(carriers).sort().forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c; carrierSelect.appendChild(o); });
    if (loadingSelect) Array.from(loadings).sort().forEach(l => { const o = document.createElement('option'); o.value = l; o.textContent = l; loadingSelect.appendChild(o); });
    if (destSelect) Array.from(dests).sort().forEach(d => { const o = document.createElement('option'); o.value = d; o.textContent = d; destSelect.appendChild(o); });
    if (toneSelect) Array.from(tones).sort().forEach(t => { const o = document.createElement('option'); o.value = t; o.textContent = t; toneSelect.appendChild(o); });
    if (statusSelect) Array.from(statuses).sort().forEach(s => { const o = document.createElement('option'); o.value = s; o.textContent = s; statusSelect.appendChild(o); });

    if (thStatus) Array.from(statuses).sort().forEach(s => { const o = document.createElement('option'); o.value = s; o.textContent = s; thStatus.appendChild(o); });
    if (thShipper) Array.from(shippers).sort().forEach(s => { const o = document.createElement('option'); o.value = s; o.textContent = s; thShipper.appendChild(o); });
    if (thCarrier) Array.from(carriers).sort().forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c; thCarrier.appendChild(o); });
    if (thLoading) Array.from(loadings).sort().forEach(l => { const o = document.createElement('option'); o.value = l; o.textContent = l; thLoading.appendChild(o); });
    if (thDest) Array.from(dests).sort().forEach(d => { const o = document.createElement('option'); o.value = d; o.textContent = d; thDest.appendChild(o); });
    if (thWaypoint) Array.from(waypoints).sort().forEach(w => { const o = document.createElement('option'); o.value = w; o.textContent = w; thWaypoint.appendChild(o); });
    if (thTone) Array.from(tones).sort().forEach(t => { const o = document.createElement('option'); o.value = t; o.textContent = t; thTone.appendChild(o); });
    if (thCartype) Array.from(carTypes).sort().forEach(t => { const o = document.createElement('option'); o.value = t; o.textContent = t; thCartype.appendChild(o); });
    if (thDriver) Array.from(drivers).sort().forEach(dr => { const o = document.createElement('option'); o.value = dr; o.textContent = dr; thDriver.appendChild(o); });
if (thCarnum) Array.from(carnums).sort().forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c; thCarnum.appendChild(o); });
    if (thRemark) Array.from(remarks).sort().forEach(r => { const o = document.createElement('option'); o.value = r; o.textContent = r; thRemark.appendChild(o); });
    if (thFare) Array.from(fares).sort((a, b) => Number(a) - Number(b)).forEach(f => { const o = document.createElement('option'); o.value = f; o.textContent = f; thFare.appendChild(o); });
    if (thStartdate) Array.from(startdates).sort().forEach(d => { const o = document.createElement('option'); o.value = d; o.textContent = d; thStartdate.appendChild(o); });
    if (thEnddate) Array.from(enddates).sort().forEach(d => { const o = document.createElement('option'); o.value = d; o.textContent = d; thEnddate.appendChild(o); });

    // Initialize Custom MultiSelects
    window.cmsShipper = new CustomMultiSelect(document.getElementById('filter-shipper'), '화주사 (전체)');
    if (carrierSelect) window.cmsCarrier = new CustomMultiSelect(document.getElementById('filter-carrier'), '간선사 (전체)');
    window.cmsLoading = new CustomMultiSelect(document.getElementById('filter-loading'), '출발지명 (전체)');
    window.cmsDest = new CustomMultiSelect(document.getElementById('filter-dest'), '도착지명 (전체)');
    window.cmsTone = new CustomMultiSelect(document.getElementById('filter-tone'), '차량톤수 (전체)');
    window.cmsStatus = new CustomMultiSelect(document.getElementById('filter-status'), '접수상태 (전체)');

    window.cmsThStatus = new CustomMultiSelect(document.getElementById('th-filter-status'), '접수상태 (전체)');
    window.cmsThShipper = new CustomMultiSelect(document.getElementById('th-filter-shipper'), '화주사 (전체)');
    window.cmsThCarrier = new CustomMultiSelect(document.getElementById('th-filter-carrier'), '간선사 (전체)');
    window.cmsThLoading = new CustomMultiSelect(document.getElementById('th-filter-loading'), '출발지명 (전체)');
    window.cmsThDest = new CustomMultiSelect(document.getElementById('th-filter-dest'), '도착지명 (전체)');
    window.cmsThStartdate = new CustomMultiSelect(document.getElementById('th-filter-startdate'), '출발일시 (전체)');
    window.cmsThEnddate = new CustomMultiSelect(document.getElementById('th-filter-enddate'), '도착일시 (전체)');
    window.cmsThWaypoint = new CustomMultiSelect(document.getElementById('th-filter-waypoint'), '경유지 (전체)');
    window.cmsThTone = new CustomMultiSelect(document.getElementById('th-filter-tone'), '차량톤수 (전체)');
    window.cmsThCartype = new CustomMultiSelect(document.getElementById('th-filter-cartype'), '차량유형 (전체)');
    window.cmsThDriver = new CustomMultiSelect(document.getElementById('th-filter-driver'), '접수자 (전체)');
    window.cmsThCarnum = new CustomMultiSelect(document.getElementById('th-filter-carnum'), '차량번호 (전체)');
    window.cmsThRemark = new CustomMultiSelect(document.getElementById('th-filter-remark'), '비고 (전체)');
    window.cmsThFare = new CustomMultiSelect(document.getElementById('th-filter-fare'), '운임 (전체)');
    new CustomMultiSelect(document.getElementById('th-filter-remark'), '비고 (전체)');
    new CustomMultiSelect(document.getElementById('th-filter-fare'), '운임 (전체)');

    const bindSync = (cms1, cms2) => {
        if (cms1 && cms2) {
            cms1.setSyncTarget(cms2);
            cms2.setSyncTarget(cms1);
        }
    };
    bindSync(window.cmsShipper, window.cmsThShipper);
    bindSync(window.cmsCarrier, window.cmsThCarrier);
    bindSync(window.cmsLoading, window.cmsThLoading);
    bindSync(window.cmsDest, window.cmsThDest);
    bindSync(window.cmsTone, window.cmsThTone);
    bindSync(window.cmsStatus, window.cmsThStatus);

    // Dynamically generate tabs
    const tableTabs = document.querySelector('.table-tabs');
    if (tableTabs) {
        tableTabs.innerHTML = '<button class="tab-btn active" data-status="">전체</button>';
        Array.from(statuses).sort().forEach(s => {
            const btn = document.createElement('button');
            btn.className = 'tab-btn';
            btn.dataset.status = s;
            btn.textContent = s;
            tableTabs.appendChild(btn);
        });
    }

    // Bind tab click events dynamically
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const selectedStatus = e.currentTarget.getAttribute('data-status');
            if (window.cmsStatus) window.cmsStatus.setValue(selectedStatus);
            if (window.cmsThStatus) window.cmsThStatus.setValue(selectedStatus);
            filterData();
        });
    });

    // Restore previous selections if they still exist
    if (currentShipper) shipperSelect.value = currentShipper;
    if (currentCarrier) carrierSelect.value = currentCarrier;
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
        const 운임 = cleanNumeric(row['총 매출 금액'] || row['매출 금액']);
        const sales = Math.floor(운임 * 1.01 / 100) * 100;
        const purchase = Math.floor(운임 * 0.96);
        salesTotal += sales;
        purchaseTotal += purchase;
    });

    let profitTotal = salesTotal - purchaseTotal;
    let margin = salesTotal > 0 ? (profitTotal / salesTotal) * 100 : 0;

    document.getElementById('kpi-sales').textContent = formatKRW(salesTotal);
    document.getElementById('kpi-purchase').textContent = formatKRW(purchaseTotal);
    document.getElementById('kpi-profit').textContent = formatKRW(profitTotal);
    document.getElementById('kpi-margin').textContent = margin.toFixed(1) + '%';
    document.getElementById('kpi-orders').textContent = ordersCount.toLocaleString() + ' 건';

    const countSource = statusUnfilteredData || activeData;
    const statusCounts = {};
    countSource.forEach(row => {
        const status = row['주문 상태'] || '상태 없음';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const totalSourceCount = countSource.length;
    
    let activeStatuses = [];
    if (window.cmsStatus && window.cmsStatus.checkboxes) {
        const checkedBoxes = window.cmsStatus.checkboxes.filter(cb => cb.checked);
        if (checkedBoxes.length > 0 && checkedBoxes.length < window.cmsStatus.checkboxes.length) {
            activeStatuses = checkedBoxes.map(cb => cb.value);
        }
    }

    let kpiHtml = '';

    Object.keys(statusCounts).sort().forEach(status => {
        const count = statusCounts[status];
        const pct = totalSourceCount > 0 ? ((count / totalSourceCount) * 100).toFixed(1) : 0;
        
        let colorClass = 'primary';
        if (status.includes('배차완료')) colorClass = 'success';
        else if (status.includes('운송완료')) colorClass = 'warning';
        else if (status.includes('취소')) colorClass = 'danger';
        else if (status.includes('접수')) colorClass = 'info';
        
        window.statusColorMap = window.statusColorMap || {};
        window.statusColorMap[status] = colorClass;
        
        const isInactive = activeStatuses.length > 0 && !activeStatuses.includes(status);
        kpiHtml += `<span class="status-tag ${colorClass} ${isInactive ? 'inactive' : ''}" data-status="${status}">${status} ${count} (${pct}%)</span>\n`;
    });

    document.getElementById('kpi-orders-detail').innerHTML = kpiHtml;
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
        tbody.innerHTML = `<tr><td colspan="13" style="text-align: center; color: var(--text-secondary); padding: 2rem;">검색 및 필터 조건에 맞는 데이터가 없습니다.</td></tr>`;
        if (summaryBox) {
            summaryBox.innerHTML = `<span class="summary-item">현재 조건에 맞는 데이터가 없습니다.</span>`;
        }
        return;
    }

    activeData.forEach(row => {
        const tr = document.createElement('tr');
        tr.className = 'animate-fade';

        // Order status badge styling matching KPI tags
        const statusVal = row['주문 상태'] || '대기';
        const mappedColor = (window.statusColorMap && window.statusColorMap[statusVal]) ? window.statusColorMap[statusVal] : 'warning';
        const badgeClass = `badge-${mappedColor}`;

        const 운임 = cleanNumeric(row['총 매출 금액'] || row['매출 금액']);
        const sales = Math.floor(운임 * 1.01 / 100) * 100;
        const purchase = Math.floor(운임 * 0.96);
        const profit = sales - purchase;

        totalSales += sales;
        totalPurchase += purchase;

        tr.innerHTML = `
            <td><span class="badge ${badgeClass}">${row['주문 상태'] || '대기'}</span></td>
            <td style="max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${row['화주명'] || ''}">${row['화주명'] || '-'}</td>
            <td style="max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${row['간선사'] || ''}">${row['간선사'] || '-'}</td>
            <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${row['상차지명'] || ''}">${row['상차지명'] || '-'}</td>
            <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${row['하차지명'] || ''}">${row['하차지명'] || '-'}</td>
            <td>${row['상차 요청 일시'] || '-'}</td>
            <td>${row['하차 요청 일시'] || '-'}</td>
            <td style="text-align: center;">${row['경유지'] || '0'}</td>
            <td>${row['요청 톤급'] || '-'}</td>
            <td>${row['요청 차량'] || '-'}</td>
            <td style="max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${row['비고'] || ''}">${row['비고'] || '-'}</td>
            <td>${row['운전자명'] || '-'}</td>
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
        const 운임_t = cleanNumeric(row['총 매출 금액'] || row['매출 금액']);
        trendMap[dateStr].sales += Math.floor(운임_t * 1.01 / 100) * 100;
        trendMap[dateStr].purchase += Math.floor(운임_t * 0.96);
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
    const sortedDests = Object.entries(destMap).sort((a, b) => b[1] - a[1]).slice(0, 7);

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

    // 톤급별 점유율(%) 및 대수(건수) 계산을 위한 총 건수 도출 - 많은 순서대로 정렬
    const sortedToneEntries = Object.entries(toneMap).sort((a, b) => b[1] - a[1]);
    const totalTones = sortedToneEntries.reduce((sum, [, count]) => sum + count, 0);
    const toneLabels = sortedToneEntries.map(([tone, val]) => {
        const pct = totalTones > 0 ? ((val / totalTones) * 100).toFixed(1) : 0;
        return `${tone} (${val}대 / ${pct}%)`;
    });

    toneChart = new Chart(ctxTone, {
        type: 'doughnut',
        data: {
            labels: toneLabels,
            datasets: [{
                data: sortedToneEntries.map(([, val]) => val),
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
                        label: function (context) {
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
    const getSelectedValues = (id) => {
        const el = document.getElementById(id);
        if (!el) return [];
        return Array.from(el.selectedOptions).map(o => o.value).filter(v => v !== '');
    };

    const shipperVals = getSelectedValues('filter-shipper');
    const carrierVals = getSelectedValues('filter-carrier');
    const loadingVals = getSelectedValues('filter-loading');
    const destVals = getSelectedValues('filter-dest');
    const toneVals = getSelectedValues('filter-tone');
    const statusVals = getSelectedValues('filter-status');

    // Read Table Header Filters
    const thStatusVals = getSelectedValues('th-filter-status');
    const thShipperVals = getSelectedValues('th-filter-shipper');
    const thCarrierVals = getSelectedValues('th-filter-carrier');
    const thLoadingVals = getSelectedValues('th-filter-loading');
    const thDestVals = getSelectedValues('th-filter-dest');
    const thWaypointVals = getSelectedValues('th-filter-waypoint');
    const thToneVals = getSelectedValues('th-filter-tone');
    const thCartypeVals = getSelectedValues('th-filter-cartype');
    const thDriverVals = getSelectedValues('th-filter-driver');
    const thCarnumVals = getSelectedValues('th-filter-carnum');
    const thRemarkVals = getSelectedValues('th-filter-remark');
    const thFareVals = getSelectedValues('th-filter-fare');

    const thStartDateVals = getSelectedValues('th-filter-startdate');
    const thEndDateVals = getSelectedValues('th-filter-enddate');

    // Update main header title dynamically
    const brandNameSpan = document.getElementById('brand-name');
    if (shipperVals.length === 1) {
        let displayName = shipperVals[0];
        displayName = displayName.replace(/주식회사/g, '').replace(/_수출포장/g, '').replace(/_/g, ' ').trim();
        brandNameSpan.textContent = displayName;
    } else if (shipperVals.length > 1) {
        brandNameSpan.textContent = `다중 거래처 (${shipperVals.length}곳)`;
    } else {
        brandNameSpan.textContent = "더운반)이천지점";
    }

    let startDateVal = '';
    let endDateVal = '';
    const fp = Array.isArray(datePicker) ? datePicker[0] : (datePicker || null);
    
    if (fp && fp.selectedDates && fp.selectedDates.length > 0) {
        const start = fp.selectedDates[0];
        startDateVal = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
        if (fp.selectedDates.length > 1) {
            const end = fp.selectedDates[1];
            endDateVal = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
        } else {
            endDateVal = startDateVal;
        }
    } else {
        const dateInput = document.getElementById('filter-date-range');
        const dateRangeVal = dateInput ? dateInput.value : '';
        if (dateRangeVal) {
            const parts = dateRangeVal.split(/ to | ~ |~| \- /);
            startDateVal = parts[0] ? parts[0].trim() : '';
            endDateVal = parts[1] ? parts[1].trim() : startDateVal;
        }
    }
    
    // BULLETPROOF DEFAULT: If still empty (e.g., initial load before flatpickr is ready), force current month 1st to today.
    if (!startDateVal) {
        const t = new Date();
        startDateVal = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-01`;
        endDateVal = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    }

    const searchVal = document.getElementById('search-input').value.toLowerCase();

    updateStatusTab(statusVals.length === 1 ? statusVals[0] : '');

    const checkMulti = (vals, rowValue) => {
        if (vals.length === 0) return true;
        return vals.includes(String(rowValue || '').trim());
    };

    // 1. 주문 상태 필터를 포함한 최종 데이터 필터링
    activeData = window.TRANSPORT_DATA.filter(row => {
        if (!checkMulti(shipperVals, row['화주명'])) return false;
        let c = String(row['간선사'] || '').trim();
        if (!checkMulti(carrierVals, c === '' ? '(미지정)' : c)) return false;
        if (!checkMulti(loadingVals, row['상차지명'])) return false;
        if (!checkMulti(destVals, row['하차지명'])) return false;
        if (!checkMulti(toneVals, row['요청 톤급'])) return false;
        if (!checkMulti(statusVals, row['주문 상태'])) return false;

        if (row['상차 요청 일시']) {
            const rowDate = row['상차 요청 일시'].split(' ')[0];
            if (startDateVal && rowDate < startDateVal) return false;
            if (endDateVal && rowDate > endDateVal) return false;
        } else if (startDateVal || endDateVal) {
            return false;
        }

        if (!checkMulti(thStatusVals, row['주문 상태'])) return false;
        if (!checkMulti(thShipperVals, row['화주명'])) return false;
        if (!checkMulti(thCarrierVals, c === '' ? '(미지정)' : c)) return false;
        if (!checkMulti(thLoadingVals, row['상차지명'])) return false;
        if (!checkMulti(thDestVals, row['하차지명'])) return false;
        if (!checkMulti(thWaypointVals, row['경유지'] !== undefined && row['경유지'] !== null ? row['경유지'] : '')) return false;
        if (!checkMulti(thToneVals, row['요청 톤급'])) return false;
        if (!checkMulti(thCartypeVals, row['요청 차량'])) return false;
        if (!checkMulti(thDriverVals, row['운전자명'])) return false;
        if (!checkMulti(thCarnumVals, row['차량번호'])) return false;
        if (!checkMulti(thRemarkVals, row['비고'] !== undefined && row['비고'] !== null ? row['비고'] : '')) return false;

        if (thFareVals.length > 0) {
            const sales = row['총 매출 금액'] || row['매출 금액'];
            if (!thFareVals.includes(String(sales !== undefined && sales !== null ? sales : '').trim())) return false;
        }

        if (!checkMulti(thStartDateVals, row['상차 요청 일시'])) return false;
        if (!checkMulti(thEndDateVals, row['하차 요청 일시'])) return false;

        if (searchVal) {
            const driver = String(row['운전자명'] || '').toLowerCase();
            const carNum = String(row['차량번호'] || '').toLowerCase();
            const address = String(row['하차지 상세 주소'] || '').toLowerCase();
            const carType = String(row['요청 차량'] || '').toLowerCase();
            const tone = String(row['요청 톤급'] || '').toLowerCase();
            const shipper = String(row['화주명'] || '').toLowerCase();
            const loading = String(row['상차지명'] || '').toLowerCase();
            const dest = String(row['하차지명'] || '').toLowerCase();
            const remark = String(row['비고'] || '').toLowerCase();

            if (!driver.includes(searchVal) && 
                !carNum.includes(searchVal) && 
                !address.includes(searchVal) &&
                !carType.includes(searchVal) &&
                !tone.includes(searchVal) &&
                !shipper.includes(searchVal) &&
                !loading.includes(searchVal) &&
                !dest.includes(searchVal) &&
                !remark.includes(searchVal)) {
                return false;
            }
        }
        return true;
    });

    // 2. 주문 상태 필터만 제외한 데이터 필터링 (KPI 상태별 비율 유지용)
    const statusUnfilteredData = window.TRANSPORT_DATA.filter(row => {
        if (!checkMulti(shipperVals, row['화주명'])) return false;
        let c = String(row['간선사'] || '').trim();
        if (!checkMulti(carrierVals, c === '' ? '(미지정)' : c)) return false;
        if (!checkMulti(loadingVals, row['상차지명'])) return false;
        if (!checkMulti(destVals, row['하차지명'])) return false;
        if (!checkMulti(toneVals, row['요청 톤급'])) return false;

        if (row['상차 요청 일시']) {
            const rowDate = row['상차 요청 일시'].split(' ')[0];
            if (startDateVal && rowDate < startDateVal) return false;
            if (endDateVal && rowDate > endDateVal) return false;
        } else if (startDateVal || endDateVal) {
            return false;
        }

        if (!checkMulti(thShipperVals, row['화주명'])) return false;
        if (!checkMulti(thCarrierVals, c === '' ? '(미지정)' : c)) return false;
        if (!checkMulti(thLoadingVals, row['상차지명'])) return false;
        if (!checkMulti(thDestVals, row['하차지명'])) return false;
        if (!checkMulti(thWaypointVals, row['경유지'] !== undefined && row['경유지'] !== null ? row['경유지'] : '')) return false;
        if (!checkMulti(thToneVals, row['요청 톤급'])) return false;
        if (!checkMulti(thCartypeVals, row['요청 차량'])) return false;
        if (!checkMulti(thDriverVals, row['운전자명'])) return false;
        if (!checkMulti(thCarnumVals, row['차량번호'])) return false;
        if (!checkMulti(thRemarkVals, row['비고'] !== undefined && row['비고'] !== null ? row['비고'] : '')) return false;

        if (thFareVals.length > 0) {
            const sales = row['총 매출 금액'] || row['매출 금액'];
            if (!thFareVals.includes(String(sales !== undefined && sales !== null ? sales : '').trim())) return false;
        }

        if (!checkMulti(thStartDateVals, row['상차 요청 일시'])) return false;
        if (!checkMulti(thEndDateVals, row['하차 요청 일시'])) return false;

        if (searchVal) {
            const driver = String(row['운전자명'] || '').toLowerCase();
            const carNum = String(row['차량번호'] || '').toLowerCase();
            const address = String(row['하차지 상세 주소'] || '').toLowerCase();
            const carType = String(row['요청 차량'] || '').toLowerCase();
            const tone = String(row['요청 톤급'] || '').toLowerCase();
            const shipper = String(row['화주명'] || '').toLowerCase();
            const loading = String(row['상차지명'] || '').toLowerCase();
            const dest = String(row['하차지명'] || '').toLowerCase();
            const remark = String(row['비고'] || '').toLowerCase();

            if (!driver.includes(searchVal) && 
                !carNum.includes(searchVal) && 
                !address.includes(searchVal) &&
                !carType.includes(searchVal) &&
                !tone.includes(searchVal) &&
                !shipper.includes(searchVal) &&
                !loading.includes(searchVal) &&
                !dest.includes(searchVal) &&
                !remark.includes(searchVal)) {
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
    window.location.reload(true);
}

// Export CSV
function exportToCSV() {
    // Determine which data to export based on current filter status
    let dataToExport = activeData;

    const headers = ['접수상태', '출발지명', '도착지명', '출발일시', '도착일시', '도착지주소', '경유지', '차량톤수', '차량번호', '접수자', '비고', '운임', '매입금액', '순이익', '순이익률'];

    let csvContent = '\uFEFF'; // UTF-8 BOM
    csvContent += headers.join(',') + '\n';

    activeData.forEach(row => {
        const 운임_csv = cleanNumeric(row['총 매출 금액'] || row['매출 금액']);
        const sales = Math.floor(운임_csv * 1.01 / 100) * 100;
        const purchase = Math.floor(운임_csv * 0.96);
        const profit = sales - purchase;
        const margin = sales > 0 ? (profit / sales * 100).toFixed(1) + '%' : '0%';

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

function applyDynamicLabels() {
    // Load Configuration
    const getConfigName = (key, defaultName) => {
        return (window.DASHBOARD_CONFIG && window.DASHBOARD_CONFIG[key] && window.DASHBOARD_CONFIG[key].display_name) || defaultName;
    };
    
    window.nameStatus = getConfigName('주문 상태', '접수상태');
    window.nameShipper = getConfigName('화주명', '화주사');
    window.nameLoading = getConfigName('상차지명', '출발지명');
    window.nameDest = getConfigName('하차지명', '도착지명');
    window.nameTone = getConfigName('요청 톤급', '차량톤수');
    window.nameDriver = getConfigName('운전자명', '접수자');
    window.nameFare = getConfigName('총 매출 금액', '운임');
    window.nameStartDate = getConfigName('상차 요청 일시', '출발일시');
    window.nameEndDate = getConfigName('하차 요청 일시', '도착일시');

    // Update UI Labels dynamically
    const lblStatus = document.querySelector('label[for="filter-status"]');
    if(lblStatus) lblStatus.innerHTML = `🔄 ${window.nameStatus}`;
    
    const lblShipper = document.querySelector('label[for="filter-shipper"]');
    if(lblShipper) lblShipper.innerHTML = `🏢 ${window.nameShipper}`;

    const lblLoading = document.querySelector('label[for="filter-loading"]');
    if(lblLoading) lblLoading.innerHTML = `📍 ${window.nameLoading}`;
    
    const lblDest = document.querySelector('label[for="filter-dest"]');
    if(lblDest) lblDest.innerHTML = `📍 ${window.nameDest}`;
    
    const lblTone = document.querySelector('label[for="filter-tone"]');
    if(lblTone) lblTone.innerHTML = `⚖️ ${window.nameTone}`;

    const thStart = document.getElementById('th-filter-startdate');
    if(thStart) thStart.placeholder = `${window.nameStartDate} (선택)`;

    const thEnd = document.getElementById('th-filter-enddate');
    if(thEnd) thEnd.placeholder = `${window.nameEndDate} (선택)`;
}

// On Load
function initDashboard() {
    applyDynamicLabels();
    initEditMode();
    initFilters();
    updateKPIs();
    updateCharts();
    updateTable();

    // Show initial update time if available
    const timeSpan = document.getElementById('last-updated-time');
    if (timeSpan && window.LAST_UPDATED) {
        timeSpan.textContent = "최근 업데이트: " + window.LAST_UPDATED;
    }

    // Function to add custom buttons to flatpickr
    const addCustomButtons = function (selectedDates, dateStr, instance) {
        const btnContainer = document.createElement("div");
        btnContainer.style.display = "flex";
        btnContainer.style.gap = "5px";
        btnContainer.style.padding = "5px 10px 10px 10px";
        btnContainer.style.backgroundColor = "var(--bg-secondary)";
        btnContainer.style.borderTop = "1px solid var(--card-border)";
        btnContainer.style.borderRadius = "0 0 5px 5px";

        const todayBtn = document.createElement("button");
        todayBtn.textContent = "오늘";
        todayBtn.className = "btn btn-secondary";
        todayBtn.style.flex = "1";
        todayBtn.style.padding = "6px";
        todayBtn.style.cursor = "pointer";
        todayBtn.style.backgroundColor = "rgba(72, 187, 120, 0.2)"; // subtle green tint
        todayBtn.style.color = "#48bb78";
        todayBtn.addEventListener("click", function () {
            const today = new Date();
            instance.setDate([today, today]);
            instance.close();
            filterData();
        });

        const clearBtn = document.createElement("button");
        clearBtn.textContent = "전체선택 (초기화)";
        clearBtn.className = "btn btn-secondary";
        clearBtn.style.flex = "2";
        clearBtn.style.padding = "6px";
        clearBtn.style.cursor = "pointer";
        clearBtn.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
        clearBtn.style.color = "var(--text-primary)";
        clearBtn.addEventListener("click", function () {
            instance.clear();
            instance.close();
        });

        btnContainer.appendChild(todayBtn);
        btnContainer.appendChild(clearBtn);
        instance.calendarContainer.appendChild(btnContainer);
    };

    // Initialize Flatpickr date range picker
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    datePicker = flatpickr("#filter-date-range", {
        mode: "range",
        locale: "ko",
        dateFormat: "Y-m-d",
        defaultDate: [firstDay, today],
        onChange: function (selectedDates, dateStr, instance) {
            if (selectedDates.length === 0 || selectedDates.length === 2) filterData();
        },
        onReady: addCustomButtons
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

    // Tab button event listeners are bound dynamically in initFilters()

    // KPI Status tag click event listeners (Event delegation)
    document.getElementById('kpi-orders-detail').addEventListener('click', (e) => {
        const target = e.target.closest('.status-tag');
        if (target) {
            const statusVal = target.getAttribute('data-status');
            
            if (window.cmsStatus && window.cmsStatus.checkboxes) {
                const checkedBoxes = window.cmsStatus.checkboxes.filter(cb => cb.checked);
                // If it's already the ONLY one selected, toggle it off (reset to all)
                if (checkedBoxes.length === 1 && checkedBoxes[0].value === statusVal) {
                    window.cmsStatus.setValue('');
                    if (window.cmsThStatus) window.cmsThStatus.setValue('');
                } else {
                    // Otherwise, set to only this status
                    window.cmsStatus.setValue(statusVal);
                    if (window.cmsThStatus) window.cmsThStatus.setValue(statusVal);
                }
            } else {
                // Fallback for native select
                const selectEl = document.getElementById('filter-status');
                if (selectEl) {
                    selectEl.value = (selectEl.value === statusVal) ? '' : statusVal;
                }
            }
            filterData();
        }
    });

    const btnReset = document.getElementById('btn-reset');
    if (btnReset) btnReset.addEventListener('click', resetFilters);
    
    const btnReload = document.getElementById('btn-reload');
    if (btnReload) btnReload.addEventListener('click', () => window.location.reload(true));

    document.getElementById('btn-export').addEventListener('click', exportToCSV);
    document.getElementById('btn-theme').addEventListener('click', toggleTheme);
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
    } catch (e) {
        // silently fail on dev env or network errors
    }
}, 5000); // Check every 5 seconds

// ==========================================
// Edit Mode & Drag-and-Drop Implementation
// ==========================================
let isEditMode = false;
let dragSrcEl = null;

const filterIdToConfigKey = {
    'filter-status': '주문 상태',
    'filter-shipper': '화주명',
    'filter-loading': '상차지명',
    'filter-dest': '하차지명',
    'filter-tone': '요청 톤급'
};

function initEditMode() {
    const btnEdit = document.getElementById('btn-edit');
    const filterItems = document.querySelectorAll('.filters-panel .filter-item, .filters-panel .filter-group');
    
    if(!btnEdit) return;

    // Map all interactive elements to config keys
    const filterIdToConfigKey = {
        'filter-status': 'status_filter',
        'filter-shipper': 'shipper_filter',
        'filter-loading': 'loading_filter',
        'filter-dest': 'dest_filter',
        'filter-tone': 'tone_filter',
        'filter-date-range': 'date_filter'
    };

    // Apply order from config on load
    filterItems.forEach(item => {
        const el = item.querySelector('select, input, button');
        if(el && filterIdToConfigKey[el.id]) {
            const key = filterIdToConfigKey[el.id];
            if(window.DASHBOARD_CONFIG && window.DASHBOARD_CONFIG[key] && window.DASHBOARD_CONFIG[key].order !== undefined) {
                item.style.order = window.DASHBOARD_CONFIG[key].order;
            }
            
            // Also apply custom name if edited
            let label = item.querySelector('label');
            if (!label && el.tagName === 'BUTTON') {
                label = el;
            }
            if(label && window.DASHBOARD_CONFIG && window.DASHBOARD_CONFIG[key] && window.DASHBOARD_CONFIG[key].display_name) {
                if(label.tagName === 'BUTTON') {
                    label.innerText = window.DASHBOARD_CONFIG[key].display_name;
                } else {
                    const textParts = label.innerText.split(' ');
                    const icon = textParts[0].match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/) ? textParts[0] + ' ' : '';
                    label.innerText = icon + window.DASHBOARD_CONFIG[key].display_name;
                }
            }
        }
    });

    let originalFilterStates = [];
    let skipSaveOnExit = false;

    btnEdit.addEventListener('click', () => {
        isEditMode = !isEditMode;
        const btnCancel = document.getElementById('btn-cancel-edit');
        
        if(isEditMode) {
            document.body.classList.add('edit-mode');
            btnEdit.textContent = '✅ 편집 완료';
            btnEdit.classList.replace('btn-secondary', 'btn-primary');
            if (btnCancel) btnCancel.style.display = 'inline-block';
            
            // Backup initial state for cancellation (keep reference to elements in original order)
            originalFilterStates = Array.from(filterItems);
            
            // Re-bind cancel logic every time we enter edit mode
            if (btnCancel) {
                // Remove existing listeners if any
                const newBtnCancel = btnCancel.cloneNode(true);
                btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
                
                newBtnCancel.addEventListener('click', () => {
                    const parent = document.querySelector('.filters-panel');
                    // Appending elements in original sequence restores the DOM
                    originalFilterStates.forEach(item => {
                        parent.appendChild(item);
                        // Also restore style.order just in case
                        item.style.order = '';
                    });
                    
                    // Re-trigger click to exit edit mode
                    skipSaveOnExit = true;
                    btnEdit.click();
                });
            }
            
            filterItems.forEach(item => {
                item.addEventListener('mousedown', handleSortableDragStart);

                
                const label = item.querySelector('label');
                if(label) label.setAttribute('contenteditable', 'true');
            });
        } else {
            document.body.classList.remove('edit-mode');
            btnEdit.textContent = '⚙️ 편집 모드';
            btnEdit.classList.replace('btn-primary', 'btn-secondary');
            const currentBtnCancel = document.getElementById('btn-cancel-edit');
            if(currentBtnCancel) currentBtnCancel.style.display = 'none';
            
            filterItems.forEach(item => {
                item.removeEventListener('mousedown', handleSortableDragStart);
                const label = item.querySelector('label');
                if(label) label.removeAttribute('contenteditable');
            });

            if (skipSaveOnExit) {
                skipSaveOnExit = false;
                return;
            }

            // 편집 완료 시 자동 저장 실행
            const newConfig = window.DASHBOARD_CONFIG ? JSON.parse(JSON.stringify(window.DASHBOARD_CONFIG)) : {};
            const itemsArray = Array.from(filterItems);
            itemsArray.sort((a, b) => {
                return (parseInt(a.style.order) || 0) - (parseInt(b.style.order) || 0);
            });

            itemsArray.forEach((item, index) => {
                const el = item.querySelector('select, input, button');
                let label = item.querySelector('label');
                if (!label && el && el.tagName === 'BUTTON') {
                    label = el;
                }
                if(el && label && filterIdToConfigKey[el.id]) {
                    const key = filterIdToConfigKey[el.id];
                    if(!newConfig[key]) newConfig[key] = {};
                    const textParts = label.innerText.split(' ');
                    const icon = textParts[0].match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/) ? textParts.shift() : ''; 
                    const nameText = textParts.join(' ').trim();
                    newConfig[key].display_name = nameText;
                    newConfig[key].order = index + 1;
                }
            });

            window.DASHBOARD_CONFIG = newConfig;
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(newConfig, null, 2));

            fetch('http://127.0.0.1:8888/save-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig)
            })
            .then(response => {
                if (response.ok) {
                    alert("✅ 설정이 성공적으로 저장되어 서버에 자동 반영 중입니다!\n(약 10~20초 뒤 새로고침 시 반영됩니다)");
                } else {
                    throw new Error("Local server error");
                }
            })
            .catch(err => {
                console.error("Local sync server not found, falling back to manual download.", err);
                const dlAnchorElem = document.createElement('a');
                dlAnchorElem.setAttribute("href", dataStr);
                dlAnchorElem.setAttribute("download", "config.json");
                document.body.appendChild(dlAnchorElem);
                dlAnchorElem.click();
                dlAnchorElem.remove();
                alert("❌ 로컬 동기화 프로그램(파이썬)이 실행되어 있지 않거나 연결할 수 없습니다.\n\n수동 저장을 위해 config.json 파일이 다운로드 되었습니다.\n이 파일을 현재 폴더에 덮어쓰고 파이썬 스크립트를 실행해 주세요.");
            });
        }
    });

}

let isSortableDragging = false;
let sortableDragEl = null;
let sortableGhost = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

function handleSortableDragStart(e) {
    if (!isEditMode) return;
    
    // If clicking on label, allow click to pass through for editing title, don't drag
    if (e.target.tagName === 'LABEL') {
        return;
    }

    isSortableDragging = true;
    sortableDragEl = this;
    
    // Ensure all items have an explicit order before starting
    const siblings = Array.from(sortableDragEl.parentNode.querySelectorAll('.filter-item, .filter-group'));
    siblings.forEach((sib, index) => {
        if (!sib.style.order) sib.style.order = index + 1;
    });
    
    // Calculate initial offset
    const rect = sortableDragEl.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    
    // Create ghost for smooth visual follow
    sortableGhost = sortableDragEl.cloneNode(true);
    sortableGhost.style.position = 'fixed';
    sortableGhost.style.zIndex = '9999';
    sortableGhost.style.left = rect.left + 'px';
    sortableGhost.style.top = rect.top + 'px';
    sortableGhost.style.width = rect.width + 'px';
    sortableGhost.style.height = rect.height + 'px';
    sortableGhost.style.opacity = '0.9';
    sortableGhost.style.pointerEvents = 'none'; // let mouse events pass through
    sortableGhost.style.margin = '0';
    sortableGhost.style.transform = 'scale(1.05)';
    sortableGhost.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
    sortableGhost.style.transition = 'none';
    
    document.body.appendChild(sortableGhost);
    
    // Hide original element visually but keep its space in the grid
    sortableDragEl.style.opacity = '0.2';
    
    e.preventDefault();
}

document.addEventListener('mousemove', (e) => {
    if (!isSortableDragging || !sortableGhost || !sortableDragEl) return;
    
    sortableGhost.style.left = (e.clientX - dragOffsetX) + 'px';
    sortableGhost.style.top = (e.clientY - dragOffsetY) + 'px';
    
    // Find grid item under the mouse
    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target) return;

    const targetItem = target.closest('.filter-item, .filter-group');
    
    if (targetItem) {
        if (targetItem === sortableGhost) {
            console.warn("[Drag debug] Detected target is GHOST element (pointer-events failed):", target);
        } else if (targetItem === sortableDragEl) {
            // Hovering over the translucent original element
        } else if (targetItem.parentNode !== sortableDragEl.parentNode) {
            console.warn("[Drag debug] Parent mismatch. Target parent:", targetItem.parentNode, "Drag parent:", sortableDragEl.parentNode);
        } else {
            console.log("[Drag debug] Valid swap target found:", targetItem);
        }
    } else {
        console.log("[Drag debug] No filter-item under mouse. Target element:", target);
    }

    // Ensure targetItem is a sibling of the dragged element to prevent matching the ghost element (which lives in document.body)
    if (targetItem && targetItem !== sortableDragEl && targetItem.parentNode === sortableDragEl.parentNode) {
        // True sortable behavior using DOM insertion
        const parent = sortableDragEl.parentNode;
        const targetRect = targetItem.getBoundingClientRect();
        
        // Insert before or after based on horizontal center
        if (e.clientX > targetRect.left + targetRect.width / 2) {
            parent.insertBefore(sortableDragEl, targetItem.nextSibling);
        } else {
            parent.insertBefore(sortableDragEl, targetItem);
        }
        
        // Update style.order to match the new DOM sequence so save logic works
        const newSiblings = Array.from(parent.querySelectorAll('.filter-item, .filter-group'));
        newSiblings.forEach((sib, index) => {
            sib.style.order = index + 1;
        });
    } else if (!targetItem && target.closest('.filters-panel') === sortableDragEl.parentNode) {
        // Mouse is hovering over empty space inside the filters-panel
        const parent = sortableDragEl.parentNode;
        const lastChild = parent.lastElementChild;
        if (lastChild && sortableDragEl !== lastChild) {
            const lastRect = lastChild.getBoundingClientRect();
            // If the mouse is generally after or below the last item
            if (e.clientY > lastRect.bottom || (e.clientY > lastRect.top && e.clientX > lastRect.right)) {
                parent.appendChild(sortableDragEl);
                
                const newSiblings = Array.from(parent.querySelectorAll('.filter-item, .filter-group'));
                newSiblings.forEach((sib, index) => {
                    sib.style.order = index + 1;
                });
            }
        }
    }
});

document.addEventListener('mouseup', () => {
    if (isSortableDragging) {
        isSortableDragging = false;
        if (sortableGhost) {
            sortableGhost.remove();
            sortableGhost = null;
        }
        if (sortableDragEl) {
            sortableDragEl.style.opacity = '1';
            sortableDragEl = null;
        }
    }
});

// Floating Scroll Buttons Logic
const btnScrollTop = document.getElementById('btn-scroll-top');
const btnScrollBottom = document.getElementById('btn-scroll-bottom');

if (btnScrollTop) {
    btnScrollTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    btnScrollTop.style.display = 'none'; // hidden initially
}
if (btnScrollBottom) {
    btnScrollBottom.addEventListener('click', () => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });
}

window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        if (btnScrollTop) btnScrollTop.style.display = 'flex';
    } else {
        if (btnScrollTop) btnScrollTop.style.display = 'none';
    }
    
    const scrollBottom = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
    if (scrollBottom > 100) {
        if (btnScrollBottom) btnScrollBottom.style.display = 'flex';
    } else {
        if (btnScrollBottom) btnScrollBottom.style.display = 'none';
    }
});

// App execution
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}
