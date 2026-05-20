/**
 * Processes raw CSV text from ZKTeco attendance machine.
 * Groups data by Employee and Date, and identifies Check-In/Check-Out sessions.
 */
export function processCSVData(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const records = [];

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',');
        let record = {};
        headers.forEach((header, index) => {
            if (values[index] !== undefined) {
                record[header] = values[index].trim();
            }
        });
        records.push(record);
    }

    const groupedByUserAndDate = {};

    records.forEach(rec => {
        const empId = rec['Employee ID'];
        const name = rec['First Name'];
        const date = rec['Date'];
        
        if (!empId || !date) return;

        const key = `${empId}_${date}`;
        if (!groupedByUserAndDate[key]) {
            groupedByUserAndDate[key] = {
                empId: empId,
                name: name,
                date: date,
                punches: []
            };
        }
        groupedByUserAndDate[key].punches.push(rec);
    });

    const allSessions = [];

    Object.values(groupedByUserAndDate).forEach(group => {
        group.punches.sort((a, b) => a['Time'].localeCompare(b['Time']));

        let sessions = [];
        let currentSession = null;

        group.punches.forEach(punch => {
            const state = punch['Punch State'];
            const time = punch['Time'];

            if (state === 'Check In') {
                if (currentSession) {
                    sessions.push(currentSession);
                }
                currentSession = { inTime: time, outTime: null };
            } else if (state === 'Check Out') {
                if (currentSession) {
                    currentSession.outTime = time;
                    sessions.push(currentSession);
                    currentSession = null;
                } else {
                    sessions.push({ inTime: null, outTime: time });
                }
            }
        });

        if (currentSession) {
            sessions.push(currentSession);
        }

        allSessions.push({
            empId: group.empId,
            name: group.name,
            date: group.date,
            sessions: sessions
        });
    });

    // Sort by date (newest first) then by name
    return allSessions.sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        if (a.name !== b.name) return a.name.localeCompare(b.name);
        return 0;
    });
}
