/**
 * Helper: Converts HH:mm string to total minutes from midnight.
 */
function timeToMinutes(timeStr) {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    return (hours * 60) + minutes;
}

/**
 * Helper: Calculates duration in minutes between two HH:mm strings.
 * Handles overnight shifts by adding 24 hours if outTime < inTime.
 */
function calculateDuration(inTime, outTime) {
    const inMin = timeToMinutes(inTime);
    const outMin = timeToMinutes(outTime);
    if (inMin === null || outMin === null) return 0;
    
    let diff = outMin - inMin;
    if (diff < 0) diff += 1440; // Add 24 hours
    return diff;
}

/**
 * Helper: Formats total minutes back to HH:mm string.
 */
function formatMinutes(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Processes raw CSV text from ZKTeco attendance machine.
 * Groups data by Employee and Date, and identifies Check-In/Check-Out sessions.
 * Supports multiple delimiters and formats.
 */
export function processCSVData(csvText) {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    // 1. Detect Delimiter
    const firstLine = lines[0];
    const delimiters = [',', ';', '\t'];
    let delimiter = ',';
    let maxCols = 0;
    delimiters.forEach(d => {
        const cols = firstLine.split(d).length;
        if (cols > maxCols) {
            maxCols = cols;
            delimiter = d;
        }
    });

    // 2. Parse Headers
    const rawHeaders = firstLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
    
    // Helper to find column index by flexible name
    const findIndex = (names) => {
        return rawHeaders.findIndex(h => names.some(n => h.toLowerCase().includes(n.toLowerCase())));
    };

    const colIdx = {
        empId: findIndex(['Employee ID', 'ID', 'Emp ID']),
        name: findIndex(['First Name', 'Name', 'FirstName']),
        date: findIndex(['Date']),
        time: findIndex(['Time']), // This will match 'Time' or 'Times' or 'Punch Time'
        punchState: findIndex(['Punch State', 'State'])
    };

    // If 'Time' and 'Times' both exist, we want the one that likely contains the list of times
    // In some formats 'Times' is a count, 'Time' is the string. 
    // We'll refine the 'time' index if 'Times' is picked but 'Time' exists.
    if (rawHeaders.includes('Times') && rawHeaders.includes('Time')) {
        colIdx.time = rawHeaders.indexOf('Time');
    }

    const records = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ''));
        let record = {};
        rawHeaders.forEach((header, index) => {
            if (values[index] !== undefined) {
                record[header] = values[index];
            }
        });
        
        // Normalize record keys for easier access
        const normalized = {
            empId: values[colIdx.empId],
            name: values[colIdx.name],
            date: values[colIdx.date],
            time: values[colIdx.time],
            punchState: colIdx.punchState !== -1 ? values[colIdx.punchState] : null
        };
        records.push(normalized);
    }

    let allSessions = [];
    const isTransactionFormat = colIdx.punchState !== -1;

    if (isTransactionFormat) {
        // ... (Transaction logic)
        const groupedByUserAndDate = {};
        records.forEach(rec => {
            if (!rec.empId || !rec.date) return;
            const key = `${rec.empId}_${rec.date}`;
            if (!groupedByUserAndDate[key]) {
                groupedByUserAndDate[key] = {
                    empId: rec.empId,
                    name: rec.name,
                    date: rec.date,
                    punches: []
                };
            }
            groupedByUserAndDate[key].punches.push(rec);
        });

        Object.values(groupedByUserAndDate).forEach(group => {
            group.punches.sort((a, b) => a.time.localeCompare(b.time));
            let sessions = [];
            let currentSession = null;

            group.punches.forEach(punch => {
                const state = punch.punchState;
                const time = punch.time;

                if (state === 'Check In') {
                    if (currentSession) sessions.push(currentSession);
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
            if (currentSession) sessions.push(currentSession);

            let dailyTotalMinutes = 0;
            sessions.forEach(s => {
                if (s.inTime && s.outTime) {
                    dailyTotalMinutes += calculateDuration(s.inTime, s.outTime);
                }
            });

            allSessions.push({
                empId: group.empId,
                name: group.name,
                date: group.date,
                sessions: sessions,
                formattedTotal: formatMinutes(dailyTotalMinutes)
            });
        });
    } else {
        // Time Card Format (semicolon separated)
        records.forEach(rec => {
            if (!rec.empId || !rec.date) return;
            const timeStr = rec.time || '';
            const punches = timeStr.split(';').map(t => t.trim()).filter(t => t);
            punches.sort(); 

            let sessions = [];
            for (let i = 0; i < punches.length; i += 2) {
                const inTimeRaw = punches[i];
                const outTimeRaw = punches[i + 1];
                sessions.push({ 
                    inTime: inTimeRaw ? inTimeRaw.substring(0, 5) : null, 
                    outTime: outTimeRaw ? outTimeRaw.substring(0, 5) : null 
                });
            }

            let dailyTotalMinutes = 0;
            sessions.forEach(s => {
                if (s.inTime && s.outTime) {
                    dailyTotalMinutes += calculateDuration(s.inTime, s.outTime);
                }
            });

            allSessions.push({
                empId: rec.empId,
                name: rec.name,
                date: rec.date,
                sessions: sessions,
                formattedTotal: formatMinutes(dailyTotalMinutes)
            });
        });
    }

    return allSessions.sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        if (a.name !== b.name) return a.name.localeCompare(b.name);
        return 0;
    });
}
