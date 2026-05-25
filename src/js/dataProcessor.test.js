import { describe, it, expect } from 'vitest';
import { processCSVData } from './dataProcessor.js';

describe('processCSVData', () => {
    it('should handle the legacy Transaction format correctly', () => {
        const csv = `ID,Name,Date,Time,Punch State
1,John Doe,2023-10-01,08:00,Check In
1,John Doe,2023-10-01,17:00,Check Out`;
        
        const result = processCSVData(csv);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('John Doe');
        expect(result[0].sessions).toHaveLength(1);
        expect(result[0].sessions[0].inTime).toBe('08:00');
        expect(result[0].sessions[0].outTime).toBe('17:00');
        expect(result[0].formattedTotal).toBe('09:00');
    });

    it('should handle the new Time Card (semicolon) format correctly', () => {
        const csv = `ID,Name,Date,Time
1,Jane Smith,2023-10-01,09:00;12:00;13:00;18:00`;
        
        const result = processCSVData(csv);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Jane Smith');
        expect(result[0].sessions).toHaveLength(2);
        expect(result[0].sessions[0].inTime).toBe('09:00');
        expect(result[0].sessions[0].outTime).toBe('12:00');
        expect(result[0].sessions[1].inTime).toBe('13:00');
        expect(result[0].sessions[1].outTime).toBe('18:00');
        expect(result[0].formattedTotal).toBe('08:00');
    });

    it('should handle session durations correctly', () => {
        const csv = `ID,Name,Date,Time,Punch State
1,Worker,2023-10-01,08:00,Check In
1,Worker,2023-10-01,12:00,Check Out
1,Worker,2023-10-01,13:00,Check In
1,Worker,2023-10-01,17:00,Check Out`;
        
        const result = processCSVData(csv);
        expect(result[0].formattedTotal).toBe('08:00');
    });

    it('should handle missing punches by flagging them', () => {
        const csv = `ID,Name,Date,Time,Punch State
1,Forgetful,2023-10-01,08:00,Check In`;
        
        const result = processCSVData(csv);
        expect(result[0].sessions[0].inTime).toBe('08:00');
        expect(result[0].sessions[0].outTime).toBe(null);
        expect(result[0].formattedTotal).toBe('00:00');
    });

    it('should sort records by date descending and name ascending', () => {
        const csv = `ID,Name,Date,Time,Punch State
1,Alice,2023-10-01,08:00,Check In
2,Bob,2023-10-01,08:00,Check In
1,Alice,2023-10-02,08:00,Check In`;
        
        const result = processCSVData(csv);
        expect(result[0].date).toBe('2023-10-02');
        expect(result[1].name).toBe('Alice');
        expect(result[1].date).toBe('2023-10-01');
        expect(result[2].name).toBe('Bob');
        expect(result[2].date).toBe('2023-10-01');
    });
});
