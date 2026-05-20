/**
 * UI Manipulation module for rendering tables and populating filters.
 */

export function populateFilters(allSessions) {
    const users = new Set();
    const dates = new Set();

    allSessions.forEach(s => {
        users.add(s.name);
        dates.add(s.date);
    });

    const userFilter = document.getElementById('userFilter');
    userFilter.innerHTML = '<option value="ALL">All Users</option>';
    Array.from(users).sort().forEach(user => {
        const option = document.createElement('option');
        option.value = user;
        option.textContent = user;
        userFilter.appendChild(option);
    });

    const dateFilter = document.getElementById('dateFilter');
    dateFilter.innerHTML = '<option value="ALL">All Dates</option>';
    Array.from(dates).sort((a, b) => b.localeCompare(a)).forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        option.textContent = date;
        dateFilter.appendChild(option);
    });
}

export function renderTable(allSessions) {
    const userFilterValue = document.getElementById('userFilter').value;
    const dateFilterValue = document.getElementById('dateFilter').value;
    const thead = document.getElementById('tableHead');
    const tbody = document.getElementById('tableBody');
    
    const filteredSessions = allSessions.filter(sessionObj => {
        const userMatch = userFilterValue === 'ALL' || sessionObj.name === userFilterValue;
        const dateMatch = dateFilterValue === 'ALL' || sessionObj.date === dateFilterValue;
        return userMatch && dateMatch;
    });

    let currentMaxSessions = 1;
    filteredSessions.forEach(s => {
        if (s.sessions.length > currentMaxSessions) {
            currentMaxSessions = s.sessions.length;
        }
    });

    let headerRow = '<tr><th>ID</th><th>Name</th><th>Date</th>';
    for (let i = 1; i <= currentMaxSessions; i++) {
        headerRow += `<th>In ${i}</th><th>Out ${i}</th>`;
    }
    headerRow += '</tr>';
    thead.innerHTML = headerRow;

    tbody.innerHTML = '';

    if (filteredSessions.length === 0) {
        const totalCols = 3 + (currentMaxSessions * 2);
        tbody.innerHTML = `<tr><td colspan="${totalCols}" class="empty-state">No attendance records found for the selected filters</td></tr>`;
        return;
    }

    filteredSessions.forEach(sessionObj => {
        const tr = document.createElement('tr');
        
        let hasWarning = false;
        let cellsHtml = `
            <td>${sessionObj.empId}</td>
            <td><strong>${sessionObj.name}</strong></td>
            <td>${sessionObj.date}</td>
        `;

        for (let i = 0; i < currentMaxSessions; i++) {
            const session = sessionObj.sessions[i];
            if (session) {
                const isMissingIn = !session.inTime;
                const isMissingOut = !session.outTime;
                
                if (isMissingIn || isMissingOut) {
                    hasWarning = true;
                }

                const inHtml = isMissingIn 
                    ? '<span class="missing-badge">Missing In</span>' 
                    : `<span class="time-cell">${session.inTime}</span>`;
                    
                const outHtml = isMissingOut 
                    ? '<span class="missing-badge">Missing Out</span>' 
                    : `<span class="time-cell">${session.outTime}</span>`;
                
                cellsHtml += `<td>${inHtml}</td><td>${outHtml}</td>`;
            } else {
                cellsHtml += `<td class="empty-cell">-</td><td class="empty-cell">-</td>`;
            }
        }
        
        if (hasWarning) {
            tr.classList.add('row-warning');
        }

        tr.innerHTML = cellsHtml;
        tbody.appendChild(tr);
    });
}
