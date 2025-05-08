export function isValidName(username) {
  // TODO
  if (username.length < 3) {
    return { ok: false, mes: 'Слишком короткое имя.' };
  }
  if (username.length > 30) {
    return { ok: false, mes: 'Слишком длинное имя.' };
  }
  return { ok: true, mes: 'OK' };
}

function getLevelDisplayName(levelname) {
  return `DISPLAY_${levelname}`;
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
    case 'time':
      return prefix + 'Время';
  }
}

function getLeaderboardID(levelname) {
  return `leaderboard__${levelname}`;
}

export class LeaderboardManager {
  constructor() {
    this.allLeaderboardRecords = null;
    this.currentSortOption = {};
  }

  saveUserResults(username, levelname, time) {
    // TODO
    console.log('Save', username, levelname, time);
  }

  getSortOption(levelname) {
    if (!(levelname in this.currentSortOption)) {
      this.currentSortOption[levelname] = { 'key': 'time', 'order_mod': 1 };
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
    // receive & update
    fetch("https://brainoid.deno.dev/api/records")
      .then(response => response.json())
      .then(jsonRecords => {
        this.allLeaderboardRecords = {};
        for (const record of jsonRecords) {
          if (!(record.level in this.allLeaderboardRecords)) {
            this.allLeaderboardRecords[record.level] = [];
          }
          this.allLeaderboardRecords[record.level].push({ username: record.username, time: record.time });
        }
        this.updateAllLeaderboards(container);
      });
  }

  updateAllLeaderboards(container) {
    for (const [levelname, records] of Object.entries(this.allLeaderboardRecords)) {
      const leaderboardDiv = this.createLeaderboard(container, levelname, records);
      container.appendChild(leaderboardDiv);
    }
  }

  createLeaderboard(container, levelname, records, sortOption = { 'key': 'time', 'order_mod': 1 }) {
    // Sort
    this.currentSortOption[levelname] = sortOption;
    this.sortByOption(levelname);

    // Create
    const leaderboardDiv = document.createElement('div');
    leaderboardDiv.id = getLeaderboardID(levelname);
    leaderboardDiv.classList.add('leaderboard');

    // heading
    const heading = document.createElement('h2');
    heading.textContent = getLevelDisplayName(levelname);
    leaderboardDiv.appendChild(heading);

    // table base
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    // table header
    const headers = ['username', 'time'];
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
    const rowCountSelect = document.createElement('select');
    const rowOptions = [5, 10, 20, 'All'];
    rowOptions.forEach(optionValue => {
      const option = document.createElement('option');
      option.value = optionValue;
      option.textContent = optionValue === 'All' ? 'Все' : optionValue;
      rowCountSelect.appendChild(option);
    });

    rowCountSelect.addEventListener('change', (event) => {
      const selectedValue = event.target.value;
      const rowsToShow = selectedValue === 'All' ? records.length : parseInt(selectedValue);
      this.populateTable(tbody, records, rowsToShow);
    });

    leaderboardDiv.appendChild(rowCountSelect);

    // First table populating
    this.populateTable(tbody, records);

    return leaderboardDiv;
  }

  populateTable(tbody, records, rowsToShow = 5) {
    tbody.innerHTML = '';

    for (let i = 0; i < Math.min(rowsToShow, records.length); i++) {
      const entry = records[i];
      const row = document.createElement('tr');
      const usernameCell = document.createElement('td');
      usernameCell.textContent = entry.username;
      const timeCell = document.createElement('td');
      timeCell.textContent = entry.time;

      row.appendChild(usernameCell);
      row.appendChild(timeCell);
      tbody.appendChild(row);
    }
  }

  findLeaderboardByLevelname(levelname) {
    const leaderboards = document.querySelectorAll(`.leaderboard`);
    for (let leaderboard of leaderboards) {
      if (leaderboard.id == getLeaderboardID(levelname)) {
        return leaderboard;
      }
    }
  }

  sortTable(container, levelname, column) {
    const currentOption = this.getSortOption(levelname);
    const key = column;

    const new_option = {
      'key': column,
      'order_mod': (column == currentOption['key'] ? -1 * currentOption['order_mod'] : 1)
    };

    // Find & replace
    let existingLeaderboard = this.findLeaderboardByLevelname(levelname);
    if (existingLeaderboard) {
      const newLeaderboard = this.createLeaderboard(container, levelname, this.allLeaderboardRecords[levelname], new_option);
      container.replaceChild(newLeaderboard, existingLeaderboard);
    }
  }
}