let kodyData = [];
let filteredData = [];
const tableBody = document.getElementById('table-body');
const modalOverlay = document.getElementById('modal-overlay');
const form = document.getElementById('editor-form');
const searchInput = document.getElementById('search-input');
const statsText = document.getElementById('stats-text');

function removeDiacritics(str) {
    if (!str) return "";
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l").replace(/Ł/g, "L");
}

// 1. Pobranie danych
async function loadData() {
    try {
        const response = await fetch('/data/kody_jednostek.json?t=' + new Date().getTime());
        if (response.ok) {
            kodyData = await response.json();

            kodyData.forEach((item, idx) => {
                item._globalIndex = idx;
            });

            filteredData = [...kodyData];
            renderTable();
        } else {
            showStatus('Nie udało się pobrać pliku JSON bazy kodów.', false);
        }
    } catch (err) {
        showStatus('Błąd komunikacji z serwerem.', false);
    }
}

// 2. Wyszukiwarka
searchInput.addEventListener('input', (e) => {
    const term = removeDiacritics(e.target.value.toLowerCase().trim());
    if(term === '') {
        filteredData = [...kodyData];
    } else {
        filteredData = kodyData.filter(item => {
            const text = removeDiacritics(`${item.name || ''} ${item.symbol || ''} ${item.code || ''} ${item.type || ''}`).toLowerCase();
            return text.includes(term);
        });
    }
    renderTable();
});

// 3. Generowanie tabeli
function renderTable() {
    tableBody.innerHTML = '';

    filteredData.forEach((item) => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td><span style="color: var(--pw-blue); font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">${item.type || 'JEDNOSTKA'}</span></td>
            <td style="font-weight: 600; color: #333;">${item.name}</td>
            <td><span class="code-symbol">${item.symbol || '-'}</span></td>
            <td class="code-number">${item.code || '-'}</td>
            <td class="actions">
                <button class="btn btn-edit" onclick="openModal(${item._globalIndex})">Edytuj</button>
                <button class="btn btn-danger" onclick="deleteItem(${item._globalIndex})">Usuń</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });

    if(filteredData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px; color:#999;">Brak wyników.</td></tr>';
    }

    statsText.innerHTML = `Wyświetlam <strong>${filteredData.length}</strong> pasujących wyników.`;
}

// 4. Logika formularza (Modal)
function openModal(globalIndex = -1) {
    document.getElementById('edit-index').value = globalIndex;

    if (globalIndex === -1) {
        document.getElementById('modal-title').innerText = 'Dodaj nową jednostkę';
        form.reset();
    } else {
        document.getElementById('modal-title').innerText = 'Edytuj jednostkę';
        const item = kodyData[globalIndex];
        document.getElementById('f-type').value = item.type || '';
        document.getElementById('f-name').value = item.name || '';
        document.getElementById('f-symbol').value = item.symbol || '';
        document.getElementById('f-code').value = item.code || '';
    }
    modalOverlay.classList.add('active');
}

function closeModal() {
    modalOverlay.classList.remove('active');
}

// 5. Zapis zmian do lokalnej tablicy
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const globalIndex = parseInt(document.getElementById('edit-index').value);

    const newItem = {
        type: document.getElementById('f-type').value,
        name: document.getElementById('f-name').value,
        symbol: document.getElementById('f-symbol').value,
        code: document.getElementById('f-code').value
    };

    if (globalIndex === -1) {
        newItem._globalIndex = kodyData.length;
        kodyData.push(newItem);
        kodyData.forEach((it, idx) => it._globalIndex = idx);
    } else {
        newItem._globalIndex = globalIndex;
        kodyData[globalIndex] = newItem;
    }

    searchInput.dispatchEvent(new Event('input'));

    closeModal();
    showStatus('Zmiany zatwierdzone lokalnie. Pamiętaj, aby zapisać plik na serwerze!', true);
});

// 6. Usuwanie lokalne
function deleteItem(globalIndex) {
    const name = kodyData[globalIndex].name;
    if(confirm(`Czy na pewno chcesz usunąć kod jednostki: ${name}?`)) {
        kodyData.splice(globalIndex, 1);
        kodyData.forEach((it, idx) => it._globalIndex = idx);

        searchInput.dispatchEvent(new Event('input'));
        showStatus('Jednostka usunięta lokalnie. Zapisz plik na serwerze.', true);
    }
}

// 7. Wysyłanie paczki JSON do serwera
async function saveToServer() {
    const btn = document.querySelector('.btn-save');
    btn.innerText = 'Zapisywanie...';
    btn.disabled = true;

    try {
        const dataToSave = kodyData.map(item => {
            const cleanItem = { ...item };
            delete cleanItem._globalIndex;
            return cleanItem;
        });

        const response = await fetch('/api/save-kody', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSave, null, 4)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showStatus('✅ Sukces! Baza kodów jednostek została zaktualizowana na serwerze.', true);
        } else {
            showStatus(`Błąd: ${result.error}`, false);
        }
    } catch (err) {
        showStatus('Błąd połączenia z serwerem. Upewnij się, że server.js po aktualizacji został zrestartowany.', false);
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
