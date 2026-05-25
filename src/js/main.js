import '../css/style.css';
import { processCSVData } from './dataProcessor.js';
import { populateFilters, renderTable } from './ui.js';
import { exportToCSV, printToPDF } from './export.js';

let allSessions = [];

// Initialize Theme
const initTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
};

const updateThemeIcon = (theme) => {
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
};

const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initTheme();

    const fileInput = document.getElementById('csvFileInput');
    const dropZone = document.getElementById('dropZone');
    const userFilter = document.getElementById('userFilter');
    const dateFilter = document.getElementById('dateFilter');
    const exportBtn = document.getElementById('exportBtn');
    const pdfBtn = document.getElementById('pdfBtn');
    const themeToggle = document.getElementById('themeToggle');

    const handleFile = (file) => {
        if (!file || !file.name.endsWith('.csv')) {
            alert('Please upload a valid CSV file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const csvData = event.target.result;
            allSessions = processCSVData(csvData);
            
            document.getElementById('uploadStatus').textContent = `Loaded ${file.name}`;
            document.getElementById('controlsSection').style.display = 'flex';
            document.getElementById('dataTable').style.display = 'block';
            
            populateFilters(allSessions);
            renderTable(allSessions);
        };
        reader.readAsText(file);
    };

    if (dropZone) {
        dropZone.addEventListener('click', () => fileInput.click());

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        ['dragleave', 'dragend'].forEach(type => {
            dropZone.addEventListener(type, () => {
                dropZone.classList.remove('dragover');
            });
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            handleFile(file);
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            handleFile(file);
        });
    }

    if (userFilter) {
        userFilter.addEventListener('change', () => renderTable(allSessions));
    }

    if (dateFilter) {
        dateFilter.addEventListener('change', () => renderTable(allSessions));
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', () => exportToCSV(allSessions));
    }

    if (pdfBtn) {
        pdfBtn.addEventListener('click', printToPDF);
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
});
