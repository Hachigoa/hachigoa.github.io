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

// Update the subject list in the UI
function updateSubjectList() {
    const subjectList = document.getElementById('subjects');
    subjectList.innerHTML = '';
    subjects.forEach((subject) => {
        const li = document.createElement('li');
        li.textContent = subject;
        
        // Add a remove button to each subject
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.className = 'remove-button';
        removeButton.addEventListener('click', () => {
            subjects = subjects.filter(s => s !== subject);
            updateSubjectList();
        });
        li.appendChild(removeButton);
        
        subjectList.appendChild(li);
    });
}

// Show/hide time fields based on schedule type
document.getElementById('scheduleType').addEventListener('change', (e) => {
    const timeFields = document.getElementById('timeFields');
    if (e.target.value === 'intensive') {
        timeFields.style.display = 'none';
    } else {
        timeFields.style.display = 'block';
    }
});

// Generate the schedule
document.getElementById('scheduleForm').addEventListener('submit', (e) => {
    e.preventDefault(); // Prevent page refresh
    
    const scheduleType = document.getElementById('scheduleType').value;
    const studyDuration = parseInt(document.getElementById('studyDuration').value, 10);
    const breakDuration = parseInt(document.getElementById('breakDuration').value, 10);

    if (subjects.length === 0) {
        alert('Please add subjects before generating a schedule.');
        return;
    }

    if (scheduleType === 'intensive') {
        schedule = generateIntensiveSchedule(studyDuration, breakDuration);
    } else {
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;

        if (!startTime || !endTime || startTime >= endTime) {
            alert('Invalid start or end time.');
            return;
        }

        schedule = generateBalancedSchedule(studyDuration, breakDuration, startTime, endTime);
    }

    displaySchedule();
    startCountdown();
});

// Generate the schedule logic for intensive mode
function generateIntensiveSchedule(studyDuration, breakDuration) {
    const generatedSchedule = [];
    let currentTime = 0;

    while (true) {
        for (const subject of subjects) {
            generatedSchedule.push({
                subject,
                type: 'Study Session',
                start: formatTime(currentTime),
                end: formatTime(currentTime + studyDuration),
            });
            currentTime += studyDuration;

            generatedSchedule.push({
                subject: 'Break',
                type: 'Break',
                start: formatTime(currentTime),
                end: formatTime(currentTime + breakDuration),
            });
            currentTime += breakDuration;
        }
    }

    return generatedSchedule;
}

// Generate the schedule logic for balanced mode
function generateBalancedSchedule(studyDuration, breakDuration, startTime, endTime) {
    const generatedSchedule = [];
    let currentTime = parseTime(startTime);
    const endMinutes = parseTime(endTime);

    while (currentTime + studyDuration <= endMinutes) {
        for (const subject of subjects) {
            if (currentTime + studyDuration > endMinutes) break;

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
        }
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

// Start the countdown timer
function startCountdown() {
    clearInterval(timerInterval);
    if (schedule.length === 0) return;

    let currentIndex = 0;

    function updateTimer() {
        const now = new Date();
        const [hours, minutes] = schedule[currentIndex].start.split(':').map(Number);
        const targetTime = new Date();
        targetTime.setHours(hours, minutes, 0, 0);

        const remainingTime = targetTime - now;

        if (remainingTime <= 0) {
            currentIndex++;
            if (currentIndex >= schedule.length) {
                document.getElementById('eventLabel').textContent = 'All sessions complete.';
                document.getElementById('timer').textContent = '00:00:00';
                clearInterval(timerInterval);
                return;
            }
            updateTimer();
        } else {
            const hours = Math.floor(remainingTime / 1000 / 60 / 60);
            const minutes = Math.floor((remainingTime / 1000 / 60) % 60);
            const seconds = Math.floor((remainingTime / 1000) % 60);

            document.getElementById('eventLabel').textContent = `Next: ${schedule[currentIndex].subject} (${schedule[currentIndex].type})`;
            document.getElementById('timer').textContent = `${formatNumber(hours)}:${formatNumber(minutes)}:${formatNumber(seconds)}`;
        }
    }

    timerInterval = setInterval(updateTimer, 1000);
    updateTimer();
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

// Import functionality for the import button
document.getElementById('importButton').addEventListener('click', () => {
    document.getElementById('importFile').click(); // Trigger the hidden file input click
});

// Handle file import
document.getElementById('importFile').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const lines = content.split('\n').map(line => line.trim()).filter(line => line);

            // Reset subjects and schedule
            subjects = [];
            schedule = [];

            lines.forEach(line => {
                if (line.startsWith('Subject:')) {
                    subjects.push(line.replace('Subject:', '').trim());
                } else if (line.startsWith('Schedule:')) {
                    // Parse the schedule and add it to the list
                    const scheduleData = line.replace('Schedule:', '').trim();
                    const [subject, start, end] = scheduleData.split(',');

                    // Ensure the start and end times are valid
                    if (subject && start && end) {
                        schedule.push({ subject, start, end, type: 'Study Session' });
                    }
                }
            });

            // Update the subject list
            updateSubjectList();

            // Display the schedule after import
            displaySchedule();

            // Restart the countdown with the imported schedule
            startCountdown();
        };
        reader.readAsText(file);
    } else {
        alert('Please upload a valid .txt file.');
    }
});

// Export functionality
document.getElementById('exportButton').addEventListener('click', () => {
    if (schedule.length === 0) {
        alert('No schedule to export.');
        return;
    }

    const scheduleText = subjects.map(subject => `Subject: ${subject}`).join('\n') + '\n' +
        schedule.map(item => `Schedule: ${item.subject},${item.start},${item.end}`).join('\n');

    const blob = new Blob([scheduleText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'study_schedule.txt';
    a.click();
    URL.revokeObjectURL(url);
});

// Dark mode toggle functionality
document.getElementById('darkModeToggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});
