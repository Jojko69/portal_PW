let mapData = [];
const tableBody = document.getElementById('table-body');
const modalOverlay = document.getElementById('modal-overlay');
const form = document.getElementById('editor-form');

// Parsuje wklejone współrzędne w formacie "52.2177, 21.0116" → [52.2177, 21.0116]
function parseCoords(value) {
    const trimmed = value.trim();
    if (!trimmed) return ['', ''];
    const parts = trimmed.split(',');
    if (parts.length < 2) return ['', ''];
    const lat = parseFloat(parts[0].trim());
    const lng = parseFloat(parts[1].trim());
    if (isNaN(lat) || isNaN(lng)) return ['', ''];
    return [lat, lng];
}

// Mapowanie kolorów tagów dla czytelności
const getTagClass = (category) => {
    switch(category) {
        case 'wydział': return 'tag-wydzial';
        case 'administracja': return 'tag-admin';
        case 'akademik': return 'tag-akademik';
        case 'budynek PW': return 'tag-budynek';
        default: return '';
    }
};

// 1. Pobranie danych na start
async function loadData() {
    try {
        const response = await fetch('data/mapa_obiektow.json?t=' + new Date().getTime());
        if (response.ok) {
            mapData = await response.json();
            renderTable();
        } else {
            showStatus('Nie udało się pobrać pliku JSON. Upewnij się, że plik istnieje.', false);
        }
    } catch (err) {
        showStatus('Błąd komunikacji z serwerem. Czy uruchomiłeś serwer przez plik server.js?', false);
    }
}

// 2. Generowanie tabeli
function renderTable() {
    tableBody.innerHTML = '';
    mapData.forEach((item, index) => {
        const tr = document.createElement('tr');
        const hasCoords = (item.coords && item.coords[0] && item.coords[1]) ? `${item.coords[0]}, ${item.coords[1]}` : '<span style="color:#e74c3c;">Brak</span>';

        tr.innerHTML = `
            <td style="font-family: monospace; font-size:0.8rem; color:#666;">${item.id}</td>
            <td style="font-weight:600;">${item.name} <span style="font-size:0.8rem; color:#888;">${item.shortName ? `(${item.shortName})` : ''}</span></td>
            <td><span class="tag ${getTagClass(item.category)}">${item.category}</span></td>
            <td>${item.address || '-'}</td>
            <td>${hasCoords}</td>
            <td class="actions">
                <button class="btn btn-edit" onclick="openModal(${index})">Edytuj</button>
                <button class="btn btn-danger" onclick="deleteItem(${index})">Usuń</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// 3. Logika formularza (Modal)
function openModal(index = -1) {
    document.getElementById('edit-index').value = index;
    if (index === -1) {
        document.getElementById('modal-title').innerText = 'Dodaj nowy obiekt';
        form.reset();
        document.getElementById('f-id').value = 'custom/obiekt-' + Date.now();
    } else {
        document.getElementById('modal-title').innerText = 'Edytuj obiekt';
        const item = mapData[index];
        document.getElementById('f-id').value = item.id;
        document.getElementById('f-name').value = item.name;
        document.getElementById('f-short').value = item.shortName;
        document.getElementById('f-category').value = item.category;
        document.getElementById('f-address').value = item.address;
        document.getElementById('f-desc').value = item.desc;
        const lat = item.coords[0] || '';
        const lng = item.coords[1] || '';
        document.getElementById('f-coords').value = (lat && lng) ? `${lat}, ${lng}` : '';
        document.getElementById('f-website').value = item.website;
    }
    modalOverlay.classList.add('active');
}

function closeModal() {
    modalOverlay.classList.remove('active');
}

// 4. Zapis zmian z formularza do lokalnej zmiennej "mapData"
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const index = parseInt(document.getElementById('edit-index').value);

    const newItem = {
        id: document.getElementById('f-id').value,
        name: document.getElementById('f-name').value,
        shortName: document.getElementById('f-short').value,
        category: document.getElementById('f-category').value,
        address: document.getElementById('f-address').value,
        desc: document.getElementById('f-desc').value,
        coords: parseCoords(document.getElementById('f-coords').value),
        website: document.getElementById('f-website').value
    };

    if (index === -1) {
        mapData.push(newItem);
    } else {
        mapData[index] = newItem;
    }

    renderTable();
    closeModal();
    showStatus('Zmiany zatwierdzone lokalnie. Pamiętaj, aby zapisać plik na serwerze!', true);
});

// 5. Usuwanie rekordu z lokalnej zmiennej
function deleteItem(index) {
    if(confirm(`Czy na pewno chcesz usunąć obiekt: ${mapData[index].name}?`)) {
        mapData.splice(index, 1);
        renderTable();
        showStatus('Obiekt usunięty lokalnie. Zapisz plik na serwerze.', true);
    }
}

// 6. Wysyłanie całego zaktualizowanego JSON do naszego server.js
async function saveToServer() {
    const btn = document.querySelector('.btn-save');
    btn.innerText = 'Zapisywanie...';
    btn.disabled = true;

    try {
        const response = await fetch('/api/save-mapa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mapData, null, 4)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showStatus('✅ Sukces! Plik mapa_obiektow.json został zaktualizowany na serwerze.', true);
        } else {
            showStatus(`Błąd: ${result.error}`, false);
        }
    } catch (err) {
        showStatus('Błąd połączenia z serwerem. Upewnij się, że skrypt server.js działa.', false);
    } finally {
        btn.innerText = 'Zapisz plik na serwerze';
        btn.disabled = false;
    }
}

// Pomocnicze wyświetlanie powiadomień
function showStatus(message, isSuccess) {
    const statusDiv = document.getElementById('status-msg');
    statusDiv.innerText = message;
    statusDiv.className = isSuccess ? 'status-success' : 'status-error';
    statusDiv.style.display = 'block';
    setTimeout(() => { statusDiv.style.display = 'none'; }, 5000);
}

loadData();
