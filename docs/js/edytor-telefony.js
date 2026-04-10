let phonebookData = [];
let filteredData = [];
const tableBody = document.getElementById('table-body');
const modalOverlay = document.getElementById('modal-overlay');
const form = document.getElementById('editor-form');
const searchInput = document.getElementById('search-input');
const statsText = document.getElementById('stats-text');

const DISPLAY_LIMIT = 100;

function removeDiacritics(str) {
    if (!str) return "";
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l").replace(/Ł/g, "L");
}

// 1. Pobranie danych
async function loadData() {
    try {
        const response = await fetch('data/data_index_partial_optimized.json?t=' + new Date().getTime());
        if (response.ok) {
            phonebookData = await response.json();

            phonebookData.forEach((item, idx) => {
                item._globalIndex = idx;
            });

            filteredData = [...phonebookData];
            renderTable();
        } else {
            showStatus('Nie udało się pobrać pliku JSON bazy kontaktów.', false);
        }
    } catch (err) {
        showStatus('Błąd komunikacji z serwerem.', false);
    }
}

// 2. Wyszukiwarka
searchInput.addEventListener('input', (e) => {
    const term = removeDiacritics(e.target.value.toLowerCase().trim());
    if(term === '') {
        filteredData = [...phonebookData];
    } else {
        filteredData = phonebookData.filter(item => {
            const text = removeDiacritics(`${item.firstName || ''} ${item.lastName || ''} ${item.department || ''} ${item.email || ''}`).toLowerCase();
            return text.includes(term);
        });
    }
    renderTable();
});

// 3. Generowanie tabeli (tylko DISPLAY_LIMIT rekordów)
function renderTable() {
    tableBody.innerHTML = '';

    const countToRender = Math.min(filteredData.length, DISPLAY_LIMIT);

    for(let i = 0; i < countToRender; i++) {
        const item = filteredData[i];
        const tr = document.createElement('tr');

        const imieNazwisko = `${item.firstName || ''} ${item.lastName || ''}`.trim() || '-';
        const stanowisko = item.position ? `<br><span style="font-size:0.8rem; color:#666;">${item.position}</span>` : '';
        const dzial = item.department || '-';
        const lokalizacja = item.location ? `<br><span style="font-size:0.8rem; color:#666;">${item.location}</span>` : '';

        let telefony = [];
        if(item.fullPhone) telefony.push(item.fullPhone);
        if(item.internalPhone) telefony.push(`Wew: ${item.internalPhone}`);

        tr.innerHTML = `
            <td><strong>${imieNazwisko}</strong>${stanowisko}</td>
            <td>${dzial}${lokalizacja}</td>
            <td>${telefony.join('<br>') || '-'}</td>
            <td>${item.email || '-'}</td>
            <td class="actions">
                <button class="btn btn-edit" onclick="openModal(${item._globalIndex})">Edytuj</button>
                <button class="btn btn-danger" onclick="deleteItem(${item._globalIndex})">Usuń</button>
            </td>
        `;
        tableBody.appendChild(tr);
    }

    if(filteredData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px; color:#999;">Brak wyników.</td></tr>';
    }

    statsText.innerHTML = `Wyświetlam <strong>${countToRender}</strong> z <strong>${filteredData.length}</strong> pasujących wyników (Baza całkowita: ${phonebookData.length} kontaktów).`;
}

// 4. Logika formularza (Modal)
function openModal(globalIndex = -1) {
    document.getElementById('edit-index').value = globalIndex;

    if (globalIndex === -1) {
        document.getElementById('modal-title').innerText = 'Dodaj nowy kontakt';
        form.reset();
        document.getElementById('f-id').value = 'custom-user-' + Date.now();
    } else {
        document.getElementById('modal-title').innerText = 'Edytuj kontakt';
        const item = phonebookData[globalIndex];
        document.getElementById('f-id').value = item.id || '';
        document.getElementById('f-firstName').value = item.firstName || '';
        document.getElementById('f-lastName').value = item.lastName || '';
        document.getElementById('f-position').value = item.position || '';
        document.getElementById('f-department').value = item.department || '';
        document.getElementById('f-location').value = item.location || '';
        document.getElementById('f-internalPhone').value = item.internalPhone || '';
        document.getElementById('f-fullPhone').value = item.fullPhone || '';
        document.getElementById('f-email').value = item.email || '';
        document.getElementById('f-bipUrl').value = item.bipUrl || '';
    }
    modalOverlay.classList.add('active');
}

function closeModal() {
    modalOverlay.classList.remove('active');
}

// 5. Zapis zmian
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const globalIndex = parseInt(document.getElementById('edit-index').value);

    const newItem = {
        id: document.getElementById('f-id').value,
        firstName: document.getElementById('f-firstName').value,
        lastName: document.getElementById('f-lastName').value,
        position: document.getElementById('f-position').value,
        department: document.getElementById('f-department').value,
        location: document.getElementById('f-location').value,
        internalPhone: document.getElementById('f-internalPhone').value,
        fullPhone: document.getElementById('f-fullPhone').value,
        email: document.getElementById('f-email').value,
        bipUrl: document.getElementById('f-bipUrl').value
    };

    if (globalIndex === -1) {
        newItem._globalIndex = phonebookData.length;
        phonebookData.unshift(newItem);
        phonebookData.forEach((it, idx) => it._globalIndex = idx);
    } else {
        newItem._globalIndex = globalIndex;
        phonebookData[globalIndex] = newItem;
    }

    searchInput.dispatchEvent(new Event('input'));

    closeModal();
    showStatus('Zmiany zatwierdzone lokalnie. Pamiętaj, aby zapisać plik na serwerze!', true);
});

// 6. Usuwanie
function deleteItem(globalIndex) {
    const name = `${phonebookData[globalIndex].firstName || ''} ${phonebookData[globalIndex].lastName || ''}`.trim();
    if(confirm(`Czy na pewno chcesz usunąć kontakt: ${name || 'Nieznany'}?`)) {
        phonebookData.splice(globalIndex, 1);
        phonebookData.forEach((it, idx) => it._globalIndex = idx);

        searchInput.dispatchEvent(new Event('input'));
        showStatus('Kontakt usunięty lokalnie. Zapisz plik na serwerze.', true);
    }
}

// 7. Wysyłanie do serwera (z pominięciem własności _globalIndex)
async function saveToServer() {
    const btn = document.querySelector('.btn-save');
    btn.innerText = 'Zapisywanie...';
    btn.disabled = true;

    try {
        const dataToSave = phonebookData.map(item => {
            const cleanItem = { ...item };
            delete cleanItem._globalIndex;
            return cleanItem;
        });

        const response = await fetch('/api/save-telefony', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSave, null, 2)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showStatus('✅ Sukces! Baza kontaktów została zaktualizowana na serwerze.', true);
        } else {
            showStatus(`Błąd: ${result.error}`, false);
        }
    } catch (err) {
        showStatus('Błąd połączenia z serwerem.', false);
    } finally {
        btn.innerText = 'Zapisz plik na serwerze';
        btn.disabled = false;
    }
}

function showStatus(message, isSuccess) {
    const statusDiv = document.getElementById('status-msg');
    statusDiv.innerText = message;
    statusDiv.className = isSuccess ? 'status-success' : 'status-error';
    statusDiv.style.display = 'block';
    setTimeout(() => { statusDiv.style.display = 'none'; }, 5000);
}

loadData();
