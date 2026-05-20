/**
 * Export module for CSV and Print functionality.
 */

export function exportToCSV(allSessions) {
    if (!allSessions || allSessions.length === 0) return;

    const userFilterValue = document.getElementById('userFilter').value;
    const dateFilterValue = document.getElementById('dateFilter').value;
    
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

    let csvContent = "ID,Name,Date";
    for(let i = 1; i <= currentMaxSessions; i++) {
        csvContent += `,In ${i},Out ${i}`;
    }
    csvContent += "\n";

    filteredSessions.forEach(row => {
        let rowData = `"${row.empId}","${row.name}","${row.date}"`;
        for(let i = 0; i < currentMaxSessions; i++) {
            const session = row.sessions[i];
            if (session) {
                rowData += `,"${session.inTime || 'Missing In'}","${session.outTime || 'Missing Out'}"`;
            } else {
                rowData += `,"-","-"`;
            }
        }
        csvContent += rowData + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "attendance_export.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

export function printToPDF() {
    window.print();
}
