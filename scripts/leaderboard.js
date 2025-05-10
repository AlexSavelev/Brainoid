import { formatDatetime } from '/scripts/misc.js'

import { LEVELS } from '/scripts/assets.js'

export function isValidName(username) {
  if (username.length < 3) {
    return { ok: false, mes: 'Слишком короткое имя.' };
  }
  if (username.length > 30) {
    return { ok: false, mes: 'Слишком длинное имя.' };
  }
  return { ok: true, mes: 'OK' };
}

function getLevelDisplayName(levelname) {
  return LEVELS[levelname]['name'];
}

function getHeaderDisplayName(headerTxt, sortOption) {
  let prefix = '';
  if (headerTxt == sortOption['key']) {
    prefix = (sortOption['order_mod'] == 1 ? '↑' : '↓') + ' ';
  }
  // Display
  switch (headerTxt) {
    case 'username':
      return prefix + 'Имя';
    case 'duration':
      return prefix + 'Продолжительность';
    case 'timestamp':
      return prefix + 'Установлен';
  }
}

function getDisplayTime(timestamp) {
  return formatDatetime(timestamp, 'H:i d-m-Y');
}

export class LeaderboardManager {
  constructor() {
    this.enable_kv_db = false;
    fetch('/config.json')
      .then(response => response.json())
      .then(data => this.enable_kv_db = data.enable_kv_database);

    this.allLeaderboardRecords = null;
    this.currentSortOption = {};
  }

  get db_enabled() {
    return this.enable_kv_db;
  }

  saveUserResults(username, levelname, duration, timestamp) {
    if (!this.enable_kv_db) {
      return;
    }
    fetch('/api/records', {
      method: 'POST',
      body: JSON.stringify({
        level: levelname,
        username: username,
        duration: duration,
        timestamp: timestamp
      }),
      headers: {
        'Content-type': 'application/json; charset=UTF-8'
      }
    });
  }

  getSortOption(levelname) {
    if (!(levelname in this.currentSortOption)) {
      this.currentSortOption[levelname] = { 'key': 'duration', 'order_mod': 1, 'cnt': 5 };
    }
    return this.currentSortOption[levelname];
  }

  sortByOption(levelname) {
    let records = this.allLeaderboardRecords[levelname];
    const key = this.getSortOption(levelname)['key'];
    const modifier = this.getSortOption(levelname)['order_mod'];
    records.sort((a, b) => {
      if (a[key] < b[key]) return -1 * modifier;
      if (a[key] > b[key]) return 1 * modifier;
      return 0;
    });
  }

  updateLeaderboard(container) {
    // clear
    container.innerHTML = '';
    // check
    if (!this.enable_kv_db) {
      this.allLeaderboardRecords = {};
      this.updateAllLeaderboards(container);
      return;
    }
    // receive & update
    fetch("/api/records")
      .then(response => response.json())
      .then(jsonRecords => {
        this.allLeaderboardRecords = {};
        for (const record of jsonRecords) {
          if (!(record.level in this.allLeaderboardRecords)) {
            this.allLeaderboardRecords[record.level] = [];
          }
          this.allLeaderboardRecords[record.level].push({
            username: record.username,
            duration: record.duration,
            timestamp: record.timestamp
          });
        }
        this.updateAllLeaderboards(container);
      });
  }

  updateAllLeaderboards(container) {
    let leaderboardsWritten = 0;
    for (const [levelname, records] of Object.entries(this.allLeaderboardRecords)) {
      const leaderboardDiv = this.createLeaderboard(container, levelname, records);
      container.appendChild(leaderboardDiv);
      leaderboardsWritten += 1;
    }
    if (leaderboardsWritten == 0) {
      this.emptyDBMessage(container);
    }
  }

  emptyDBMessage(container) {
    const leaderboardDiv = document.createElement('div');
    leaderboardDiv.classList.add('leaderboard');

    const heading = document.createElement('h3');
    heading.textContent = 'Здесь пока ничего нет';
    leaderboardDiv.appendChild(heading);
    container.appendChild(leaderboardDiv);
  }

  createLeaderboard(container, levelname, records, sortOption = { 'key': 'duration', 'order_mod': 1, 'cnt': 5 }) {
    // Sort
    this.currentSortOption[levelname] = sortOption;
    this.sortByOption(levelname);

    // Create
    const leaderboardDiv = document.createElement('div');
    leaderboardDiv.setAttribute('level', levelname);
    leaderboardDiv.classList.add('leaderboard');

    // heading
    const heading = document.createElement('h3');
    heading.textContent = getLevelDisplayName(levelname);
    leaderboardDiv.appendChild(heading);

    // table base
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    // table header
    const headers = ['username', 'duration', 'timestamp'];
    const headerRow = document.createElement('tr');
    headers.forEach(headerName => {
      const header = document.createElement('th');
      header.textContent = getHeaderDisplayName(headerName, sortOption);
      header.addEventListener('click', () => this.sortTable(container, levelname, headerName));
      headerRow.appendChild(header);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // table body register
    table.appendChild(tbody);
    leaderboardDiv.appendChild(table);

    // select rows
    const selectLabel = document.createElement('label');
    selectLabel.innerHTML = 'Количество строк: ';

    const rowCountSelect = document.createElement('select');
    const rowOptions = [5, 10, 20, 50, 100, 'All'];
    rowOptions.forEach(optionValue => {
      const option = document.createElement('option');
      option.value = optionValue;
      option.textContent = optionValue === 'All' ? 'Все' : optionValue;
      rowCountSelect.appendChild(option);
    });

    rowCountSelect.value = (sortOption['cnt'] == records.length ? 'All' : sortOption['cnt']);

    rowCountSelect.addEventListener('change', (event) => {
      const selectedValue = event.target.value;
      const rowsToShow = selectedValue === 'All' ? records.length : parseInt(selectedValue);
      this.currentSortOption[levelname]['cnt'] = rowsToShow;
      this.populateTable(tbody, levelname, records);
    });

    leaderboardDiv.appendChild(selectLabel);
    leaderboardDiv.appendChild(rowCountSelect);

    // First table populating
    this.populateTable(tbody, levelname, records);

    return leaderboardDiv;
  }

  populateTable(tbody, levelname, records) {
    const rowsToShow = this.currentSortOption[levelname]['cnt'];
    tbody.innerHTML = '';

    for (let i = 0; i < Math.min(rowsToShow, records.length); i++) {
      const entry = records[i];
      const row = document.createElement('tr');
      const usernameCell = document.createElement('td');
      usernameCell.textContent = entry.username;
      const durationCell = document.createElement('td');
      durationCell.textContent = entry.duration;
      const timestampCell = document.createElement('td');
      timestampCell.textContent = getDisplayTime(entry.timestamp);

      row.appendChild(usernameCell);
      row.appendChild(durationCell);
      row.appendChild(timestampCell);
      tbody.appendChild(row);
    }
  }

  findLeaderboardByLevelname(levelname) {
    const leaderboards = document.querySelectorAll(`.leaderboard`);
    for (const leaderboard of leaderboards) {
      if (leaderboard.getAttribute('level') == levelname) {
        return leaderboard;
      }
    }
  }

  sortTable(container, levelname, column) {
    const currentOption = this.getSortOption(levelname);

    const new_option = {
      'key': column,
      'order_mod': (column == currentOption['key'] ? -1 * currentOption['order_mod'] : 1),
      'cnt': currentOption['cnt']
    };

    // Find & replace
    const existingLeaderboard = this.findLeaderboardByLevelname(levelname);
    if (existingLeaderboard) {
      const newLeaderboard = this.createLeaderboard(container, levelname, this.allLeaderboardRecords[levelname], new_option);
      container.replaceChild(newLeaderboard, existingLeaderboard);
    }
  }
}