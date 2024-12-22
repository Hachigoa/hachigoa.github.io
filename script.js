let subjects = [];
let schedule = [];
let timerInterval;

// Add a subject to the list
document.getElementById('addSubjectForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const subject = document.getElementById('newSubject').value.trim();
    if (subject && !subjects.includes(subject)) {
        subjects.push(subject);
        updateSubjectList();
    }
    document.getElementById('newSubject').value = '';
});

// Update the subject list in the UI and save to localStorage
function updateSubjectList() {
    const subjectList = document.getElementById('subjects');
    subjectList.innerHTML = '';
    subjects.forEach((subject) => {
        const li = document.createElement('li');
        li.textContent = subject;
        subjectList.appendChild(li);
    });
    // Save subjects to localStorage
    localStorage.setItem('subjects', JSON.stringify(subjects));
}

// Generate the schedule based on study and break durations
document.getElementById('scheduleForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const scheduleType = document.getElementById('scheduleType').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;

    if (!startTime || !endTime || startTime >= endTime) {
        alert('Invalid start or end time.');
        return;
    }

    schedule = generateSchedule(scheduleType, startTime, endTime);
    displaySchedule();
    startCountdown();
    // Save the schedule to localStorage
    localStorage.setItem('schedule', JSON.stringify(schedule));
});

// Generate the schedule logic
function generateSchedule(type, startTime, endTime) {
    const generatedSchedule = [];
    const studyDuration = 90; // 1 hour 30 minutes
    const breakDuration = 30; // 30 minutes
    let currentTime = parseTime(startTime);
    const endMinutes = parseTime(endTime);

    while (currentTime + studyDuration <= endMinutes) {
        if (subjects.length === 0) {
            alert('Please add subjects to generate a schedule.');
            return [];
        }

        subjects.forEach((subject) => {
            if (currentTime + studyDuration > endMinutes) return;

            generatedSchedule.push({
                subject,
                type: 'Study Session',
                start: formatTime(currentTime),
                end: formatTime(currentTime + studyDuration),
            });
            currentTime += studyDuration;

            if (currentTime + breakDuration <= endMinutes) {
                generatedSchedule.push({
                    subject: 'Break',
                    type: 'Break',
                    start: formatTime(currentTime),
                    end: formatTime(currentTime + breakDuration),
                });
                currentTime += breakDuration;
            }
        });
    }

    return generatedSchedule;
}

// Display the schedule in the UI
function displaySchedule() {
    const scheduleList = document.getElementById('scheduleList');
    scheduleList.innerHTML = '';
    schedule.forEach(({ subject, type, start, end }) => {
        const li = document.createElement('li');
        li.textContent = `${subject} (${type}): ${start} - ${end}`;
        scheduleList.appendChild(li);
    });
}

// Countdown Timer Logic
function startCountdown() {
    clearInterval(timerInterval);
    if (schedule.length === 0) {
        alert('No schedule generated. Please create a schedule first.');
        return;
    }

    let currentIndex = 0;

    function updateTimer() {
        if (currentIndex >= schedule.length) {
            document.getElementById('eventLabel').textContent = 'All sessions complete.';
            document.getElementById('timer').textContent = '00:00:00';
            clearInterval(timerInterval);
            return;
        }

        const now = new Date();
        const [startHours, startMinutes] = schedule[currentIndex].start.split(':').map(Number);
        const targetTime = new Date();
        targetTime.setHours(startHours, startMinutes, 0, 0);

        const remainingTime = targetTime - now;

        // If remaining time is negative or less than the session/break duration
        if (remainingTime <= 0) {
            currentIndex++;
            updateTimer();
        } else {
            const currentSession = schedule[currentIndex];
            const sessionDuration = currentSession.type === 'Study Session' ? 90 * 60 * 1000 : 30 * 60 * 1000; // 90 minutes for study, 30 for break
            const remainingSessionTime = remainingTime < sessionDuration ? remainingTime : sessionDuration;

            const hours = Math.floor(remainingSessionTime / 1000 / 60 / 60);
            const minutes = Math.floor((remainingSessionTime / 1000 / 60) % 60);
            const seconds = Math.floor((remainingSessionTime / 1000) % 60);

            document.getElementById('eventLabel').textContent = `Next: ${currentSession.subject} (${currentSession.type})`;
            document.getElementById('timer').textContent = `${formatNumber(hours)}:${formatNumber(minutes)}:${formatNumber(seconds)}`;
        }
    }

    timerInterval = setInterval(updateTimer, 1000);
    updateTimer(); // Ensure the first call happens immediately
}

// Helper functions
function parseTime(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${formatNumber(hours)}:${formatNumber(mins)}`;
}

function formatNumber(num) {
    return num.toString().padStart(2, '0');
}

// Export the schedule to a JSON file
document.getElementById('exportButton').addEventListener('click', () => {
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(schedule))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'schedule.json');
    downloadAnchor.click();
});

// Import the schedule from a file
document.getElementById('importFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
        try {
            schedule = JSON.parse(reader.result);
            displaySchedule();
            startCountdown();
        } catch (err) {
            alert('Invalid file format.');
        }
    };
    reader.readAsText(file);
});

