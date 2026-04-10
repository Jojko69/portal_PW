// =========================================================
// LOGIKA ZAKŁADEK I WIDOKÓW
// =========================================================
function switchTab(tabId, element) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    element.classList.add('active');
    if(tabId === 'map-tab' && typeof map !== 'undefined') map.invalidateSize();
}

function switchOrgView(viewId, element) {
    document.querySelectorAll('.org-view').forEach(view => view.classList.remove('active'));
    document.querySelectorAll('.org-toggle-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    element.classList.add('active');
}

// =========================================================
// ZAKŁADKA 4: KSIĄŻKA TELEFONICZNA (JSON FETCH & SEARCH)
// =========================================================

// Wbudowana baza jako fallback (gdy brak pliku serwerowego lub tryb offline)
let phonebookData = [
    {
        "id": "u-agnieszka.olszewska",
        "firstName": "Agnieszka",
        "lastName": "Olszewska",
        "position": "Pracownik jednostki",
        "department": "Wydział Budownictwa, Mechaniki i Petrochemii",
        "location": "BIP PW",
        "internalPhone": "",
        "fullPhone": "",
        "email": "agnieszka.olszewska@pw.edu.pl"
    },
    {
        "id": "u-monika.lewandowska",
        "firstName": "Monika",
        "lastName": "Lewandowska",
        "position": "Pracownik jednostki",
        "department": "Biuro ds. Zamówień Publicznych",
        "location": "BIP PW",
        "internalPhone": "",
        "fullPhone": "",
        "email": "monika.lewandowska@pw.edu.pl"
    },
    {
        "id": "8610",
        "firstName": "Iwona",
        "lastName": "Dobrzyńska",
        "position": "Kierownik Administracyjny Wydziału",
        "department": "Wydział Zarządzania",
        "location": "BIP PW",
        "internalPhone": "8610",
        "fullPhone": "(22) 234 8610",
        "email": "iwona.dobrzynska@pw.edu.pl"
    },
    {
        "id": "8358",
        "firstName": "Dział",
        "lastName": "Ekonomiczny",
        "position": "Pracownik jednostki",
        "department": "Wydział Zarządzania",
        "location": "BIP PW",
        "internalPhone": "8358",
        "fullPhone": "(22) 234 8358",
        "email": ""
    }
];

const phoneTableBody = document.getElementById('phone-table-body');
const phoneStatusDiv = document.getElementById('phone-load-status');

// Funkcja czyszcząca dane kontaktów
function cleanPhonebookData(data) {
    let cleaned = data.filter(item => {
        const fullName = `${item.firstName || ''} ${item.lastName || ''}`.toLowerCase();
        return !fullName.includes('to main content skip');
    });

    const emailHasName = {};
    cleaned.forEach(item => {
        if (item.email) {
            const email = item.email.toLowerCase().trim();
            const fullName = `${item.firstName || ''} ${item.lastName || ''}`.trim();
            if (fullName.length > 0) {
                emailHasName[email] = true;
            }
        }
    });

    const seenEmptyEmails = new Set();
    cleaned = cleaned.filter(item => {
        if (item.email) {
            const email = item.email.toLowerCase().trim();
            const fullName = `${item.firstName || ''} ${item.lastName || ''}`.trim();

            if (fullName.length === 0) {
                if (emailHasName[email]) return false;
                if (seenEmptyEmails.has(email)) return false;
                seenEmptyEmails.add(email);
            }
        }
        return true;
    });

    return cleaned;
}

// Automatyczne pobieranie pliku z serwera
async function fetchLocalJSON() {
    try {
        if (window.location.href.startsWith('blob:') || window.location.href.startsWith('data:') || window.location.protocol === 'file:') {
            phonebookData = cleanPhonebookData(phonebookData);
            renderPhoneTable(phonebookData);
            phoneStatusDiv.textContent = "Środowisko testowe offline. Wczytano dane wbudowane. Uruchom projekt na serwerze, aby załadować pełną bazę.";
            phoneStatusDiv.style.color = "#e67e22";
            return;
        }

        const response = await fetch('data/data_index_partial_optimized.json?t=' + new Date().getTime());
        if (response.ok) {
            const rawData = await response.json();
            phonebookData = cleanPhonebookData(rawData);
            renderPhoneTable(phonebookData);
            phoneStatusDiv.textContent = `Pomyślnie załadowano i wyczyszczono ${phonebookData.length} kontaktów z bazy.`;
            phoneStatusDiv.style.color = "var(--pw-ds)";
        } else {
            throw new Error('Brak pliku na serwerze');
        }
    } catch (error) {
        phonebookData = cleanPhonebookData(phonebookData);
        renderPhoneTable(phonebookData);
        phoneStatusDiv.textContent = "Błąd: Brak pliku 'data_index_partial_optimized.json' w katalogu data/ na serwerze.";
        phoneStatusDiv.classList.add('data-status-error');
    }
}

// Renderowanie tabeli kontaktów
function renderPhoneTable(data) {
    phoneTableBody.innerHTML = '';

    const limit = Math.min(data.length, 100);

    for(let i = 0; i < limit; i++) {
        const item = data[i];
        const tr = document.createElement('tr');

        const imieNazwisko = `${item.firstName || ''} ${item.lastName || ''}`.trim();
        const stanowisko = item.position ? `<br><span style="font-size:0.8rem; color:#666; font-weight:normal;">${item.position}</span>` : '';

        const dzial = item.department || '-';
        const lokalizacja = item.location ? ` (${item.location})` : '';

        let telefonyArr = [];
        if(item.fullPhone) telefonyArr.push(`<a href="tel:${item.fullPhone.replace(/\D/g, '')}" class="phone-link">${item.fullPhone}</a>`);
        if(item.internalPhone) telefonyArr.push(`Wewn: <span style="font-weight:bold;">${item.internalPhone}</span>`);
        const telefonyHtml = telefonyArr.length > 0 ? telefonyArr.join('<br>') : '-';

        const emailHtml = item.email ? `<a href="mailto:${item.email}" class="email-link">${item.email}</a>` : '-';

        tr.innerHTML = `
            <td style="font-weight: 700; color: #222;">${imieNazwisko || '-'}${stanowisko}</td>
            <td style="color: #444; font-size: 0.85rem;"><strong>${dzial}</strong>${lokalizacja}</td>
            <td>${telefonyHtml}</td>
            <td>${emailHtml}</td>
        `;
        phoneTableBody.appendChild(tr);
    }

    if(data.length === 0) {
        phoneTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color:#999;">Brak wyników wyszukiwania.</td></tr>';
    } else if (data.length > limit) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="4" style="text-align:center; padding: 15px; color:#888; font-size:0.85rem; font-weight: 600;">Wyświetlam ${limit} z ${data.length} znalezionych rekordów. Wpisz więcej znaków, aby zawęzić wyniki...</td>`;
        phoneTableBody.appendChild(tr);
    }
}

// Pomocnicza funkcja do usuwania polskich znaków (diakrytyków)
function removeDiacritics(str) {
    if (!str) return "";
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l").replace(/Ł/g, "L");
}

// Wyszukiwarka kontaktów
document.getElementById('phone-search-input').addEventListener('input', function(e) {
    const rawSearchTerm = e.target.value.toLowerCase().trim();
    const searchTerms = removeDiacritics(rawSearchTerm).split(/\s+/).filter(t => t.length > 0);
    const searchDigitsOnly = rawSearchTerm.replace(/\D/g, '');

    const filteredData = phonebookData.filter(item => {
        const recordText = removeDiacritics(`${item.firstName || ''} ${item.lastName || ''} ${item.department || ''} ${item.email || ''} ${item.position || ''} ${item.location || ''}`).toLowerCase();

        let textMatch = true;
        if (searchTerms.length > 0) {
            textMatch = searchTerms.every(term => recordText.includes(term));
        }

        let phoneMatch = false;
        if (searchDigitsOnly.length > 0) {
            const fullClean = (item.fullPhone || '').replace(/\D/g, '');
            const intClean = (item.internalPhone || '').replace(/\D/g, '');
            phoneMatch = fullClean.includes(searchDigitsOnly) || intClean.includes(searchDigitsOnly);
        }

        if (rawSearchTerm === "") return true;

        return textMatch || phoneMatch;
    });
    renderPhoneTable(filteredData);
});

fetchLocalJSON();


// =========================================================
// ZAKŁADKA 3: KODY JEDNOSTEK
// =========================================================
let unitCodesData = [];

const codesTableBody = document.getElementById('codes-table-body');
function renderCodesTable(data) {
    codesTableBody.innerHTML = '';
    data.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><span style="color: var(--pw-blue); font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">${item.type || 'JEDNOSTKA'}</span></td><td style="font-weight: 600; color: #333;">${item.name}</td><td><span class="code-symbol">${item.symbol || '-'}</span></td><td class="code-number">${item.code}</td>`;
        codesTableBody.appendChild(tr);
    });
}

async function fetchUnitCodes() {
    try {
        if (window.location.protocol === 'file:') {
            console.warn("Uruchomiono lokalnie (file://). Pobieranie JSON może nie zadziałać.");
            return;
        }
        const response = await fetch('data/kody_jednostek.json?t=' + new Date().getTime());
        if (response.ok) {
            unitCodesData = await response.json();
            renderCodesTable(unitCodesData);
        } else {
            console.error('Błąd pobierania danych kodów jednostek z serwera.');
        }
    } catch (error) {
        console.error('Błąd komunikacji przy pobieraniu kodów jednostek:', error);
    }
}

fetchUnitCodes();

document.getElementById('codes-search-input').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    const filteredData = unitCodesData.filter(item => item.name.toLowerCase().includes(searchTerm) || item.symbol.toLowerCase().includes(searchTerm) || item.code.toLowerCase().includes(searchTerm) || item.type.toLowerCase().includes(searchTerm));
    renderCodesTable(filteredData);
});

// =========================================================
// LOGIKA MAPY
// =========================================================
let pwMapData = [];

const map = L.map('map', { center: [52.2205, 21.0105], zoom: 15, zoomControl: false });
L.control.zoom({ position: 'bottomright' }).addTo(map);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map);

const mapLayers = { 'wydział': L.layerGroup().addTo(map), 'administracja': L.layerGroup().addTo(map), 'akademik': L.layerGroup().addTo(map), 'budynek PW': L.layerGroup().addTo(map) };
const mapColors = { 'wydział': '#00458d', 'administracja': '#e67e22', 'akademik': '#27ae60', 'budynek PW': '#8e44ad' };

const mapObjectsList = [];
const listContainer = document.getElementById('object-list');

async function fetchMapData() {
    try {
        if (window.location.protocol === 'file:') {
            console.warn("Uruchomiono lokalnie (file://). Pobieranie JSON może nie zadziałać. Uruchom przez serwer lokalny.");
        }

        const response = await fetch('data/mapa_obiektow.json?t=' + new Date().getTime());
        if (response.ok) {
            pwMapData = await response.json();

            Object.values(mapLayers).forEach(layerGroup => layerGroup.clearLayers());
            listContainer.innerHTML = '';
            mapObjectsList.length = 0;

            initMapMarkers();
            applyMapFilters();
        } else {
            console.error('Błąd pobierania danych mapy z serwera.');
        }
    } catch (error) {
        console.error('Błąd pobierania danych mapy:', error);
    }
}

function initMapMarkers() {
    pwMapData.forEach(item => {
        const markerColor = mapColors[item.category] || '#7f8c8d';
        const displayName = item.shortName ? `${item.name} (${item.shortName})` : item.name;
        const hasCoords = item.coords[0] !== "" && item.coords[1] !== "";
        let layer = null;

        if (hasCoords) {
            layer = L.circleMarker(item.coords, { radius: 12, fillColor: markerColor, color: "#ffffff", weight: 2, fillOpacity: 1 });
            layer.bindTooltip(item.shortName || item.name, { permanent: true, direction: 'right', offset: [10, 0], className: 'classic-tooltip' });
            layer.bindPopup(`<div class="popup-info"><strong style="color:${markerColor}; text-transform:uppercase; font-size:10px;">${item.category}</strong><h3 style="margin-top:2px; font-size: 1.05rem;">${displayName}</h3><div class="popup-desc">${item.desc}</div><p style="color:#666; font-size:0.8rem;"><strong>Adres:</strong> ${item.address}</p></div>`);
            layer.addTo(mapLayers[item.category]);
        }

        const itemEl = document.createElement('div');
        itemEl.className = 'object-item';
        if (!hasCoords) itemEl.style.opacity = "0.7";
        itemEl.innerHTML = `<h4>${displayName} ${!hasCoords ? '⚠️' : ''}</h4><p>${item.address || 'Brak adresu'}</p><span class="tag" style="background: ${markerColor}">${item.category}</span>`;
        if (hasCoords) itemEl.onclick = () => { map.setView(item.coords, 18); layer.openPopup(); };

        listContainer.appendChild(itemEl);
        mapObjectsList.push({ item, marker: layer, listItem: itemEl, categoryId: item.category, hasCoords });
    });
}

fetchMapData();

function applyMapFilters() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const activeCategories = Array.from(document.querySelectorAll('.filter-check:checked')).map(cb => cb.value);

    mapObjectsList.forEach(obj => {
        const searchString = `${obj.item.name} ${obj.item.shortName || ''} ${obj.item.address || ''}`.toLowerCase();
        const textMatch = searchString.includes(searchTerm);
        const catMatch = activeCategories.includes(obj.categoryId);

        if (textMatch && catMatch) {
            obj.listItem.style.display = '';
            if (obj.hasCoords && !mapLayers[obj.categoryId].hasLayer(obj.marker)) mapLayers[obj.categoryId].addLayer(obj.marker);
        } else {
            obj.listItem.style.display = 'none';
            if (obj.hasCoords && mapLayers[obj.categoryId].hasLayer(obj.marker)) mapLayers[obj.categoryId].removeLayer(obj.marker);
        }
    });
}

document.getElementById('search-input').addEventListener('input', applyMapFilters);
document.querySelectorAll('.filter-check').forEach(cb => cb.addEventListener('change', applyMapFilters));

function resetMapView() {
    const allVisibleMarkers = [];
    Object.keys(mapLayers).forEach(group => { if (map.hasLayer(mapLayers[group])) mapLayers[group].eachLayer(l => allVisibleMarkers.push(l)); });
    if (allVisibleMarkers.length > 0) map.fitBounds(L.featureGroup(allVisibleMarkers).getBounds(), { padding: [50, 50] });
    else map.setView([52.2205, 21.0105], 15);
}

document.getElementById('org-search-input').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    const allItems = document.querySelectorAll('.org-list li, .faculty-item');

    allItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (searchTerm === '') { item.style.display = ''; item.classList.remove('org-highlight'); }
        else if (text.includes(searchTerm)) { item.style.display = ''; item.classList.add('org-highlight'); }
        else { item.style.display = 'none'; item.classList.remove('org-highlight'); }
    });

    document.querySelectorAll('.org-column, .org-column > div[style*="background: white"], .org-faculties').forEach(block => {
        if (searchTerm === '') { block.style.display = ''; return; }
        if (block.classList.contains('org-column') && block.style.background === 'transparent') { block.style.display = ''; return; }
        const hasVisibleItems = Array.from(block.querySelectorAll('li, .faculty-item')).some(el => el.style.display !== 'none');
        block.style.display = (!hasVisibleItems && block.querySelectorAll('li, .faculty-item').length > 0) ? 'none' : '';
    });

    document.querySelectorAll('.org-sub-title').forEach(subTitle => {
        if (searchTerm === '') { subTitle.style.display = ''; return; }
        const nextList = subTitle.nextElementSibling;
        if (nextList && nextList.classList.contains('org-list')) {
            subTitle.style.display = Array.from(nextList.querySelectorAll('li')).some(li => li.style.display !== 'none') ? '' : 'none';
        }
    });
});
