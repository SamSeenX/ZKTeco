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
 * Supports both Transaction format and Time Card (semicolon-separated) format.
 */
export function processCSVData(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/\r$/, ''));
    const records = [];

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',');
        let record = {};
        headers.forEach((header, index) => {
            if (values[index] !== undefined) {
                record[header] = values[index].trim().replace(/\r$/, '');
            }
        });
        records.push(record);
    }

    let allSessions = [];
    
    // Detect if this is the new "Time Card" format or the old "Transaction" format
    const isTransactionFormat = headers.includes('Punch State');

    if (isTransactionFormat) {
        // Process the original transaction format (one punch per row)
        const groupedByUserAndDate = {};

        records.forEach(rec => {
            const empId = rec['Employee ID'] || rec['ID'];
            const name = rec['First Name'] || rec['Name'];
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
        // Process the new Time Card format where times are combined in a single cell with semicolons
        records.forEach(rec => {
            const empId = rec['Employee ID'] || rec['ID'];
            const name = rec['First Name'] || rec['Name'];
            const date = rec['Date'];
            const timeStr = rec['Time'] || '';
            
            if (!empId || !date) return;

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
                empId: empId,
                name: name,
                date: date,
                sessions: sessions,
                formattedTotal: formatMinutes(dailyTotalMinutes)
            });
        });
    }

    // Sort by date (newest first) then by name
    return allSessions.sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        if (a.name !== b.name) return a.name.localeCompare(b.name);
        return 0;
    });
}
