document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const subject = urlParams.get('subject');
    const term = urlParams.get('term');
    const student = localStorage.getItem('selectedStudent');

    //document.getElementById('subjectTermTitle').textContent = `${subject} - ${term}`;

    // Set the back button to return to the term-select page
    //document.getElementById('backButton').onclick = function () {
        //window.location.href = `term-select.html?subject=${encodeURIComponent(subject)}`;
   // };

    document.getElementById('discussionInput').addEventListener('input', validateAndUpdateDiscussionScore);
    document.getElementById('projectInput').addEventListener('input', validateAndUpdateProjectScore);
    document.getElementById('addQuizBtn').addEventListener('click', () => addQuiz());

    // Load existing scores if available
    loadScores(student, subject, term);

    // Save scores periodically
    setInterval(() => saveScores(student, subject, term), 5000);
});

function loadScores(student, subject, term) {
    fetch('/api/scores')
        .then(response => response.json())
        .then(scores => {
            const studentScores = scores[student]?.[subject]?.[term];
            if (studentScores) {
                document.getElementById('discussionInput').value = studentScores.discussion;
                document.getElementById('projectInput').value = studentScores.project;
                studentScores.quizzes.forEach(quiz => addQuiz(quiz));
                // Directly update the scores
                updateAllScores();
            }
        })
        .catch(error => {
            console.error('Failed to load scores:', error);
        });
}

function saveScores(student, subject, term) {
    const discussion = parseFloat(document.getElementById('discussionInput').value) || 0;
    const project = parseFloat(document.getElementById('projectInput').value) || 0;
    const quizzes = Array.from(document.querySelectorAll('.quiz')).map(quizDiv => ({
        name: quizDiv.querySelector('input[type="text"]').value,
        rawScore: parseFloat(quizDiv.querySelector('.rawScore').value) || 0,
        totalScore: parseFloat(quizDiv.querySelector('.totalScore').value) || 0
    }));

    fetch('/api/scores')
        .then(response => response.json())
        .then(scores => {
            if (!scores[student]) scores[student] = {};
            if (!scores[student][subject]) scores[student][subject] = {};
            scores[student][subject][term] = { discussion, project, quizzes };

            return fetch('/api/scores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(scores)
            });
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Failed to save scores:', data.error);
            } else {
                console.log('Scores saved successfully');
            }
        })
        .catch(error => {
            console.error('Failed to save scores:', error);
        });
}

function validateAndUpdateDiscussionScore() {
    const discussionInput = parseFloat(document.getElementById('discussionInput').value) || 0;
    if (discussionInput > 100) {
        alert('You cannot input a number higher than 100!');
        document.getElementById('discussionInput').value = '';
        document.getElementById('discussionScore').textContent = '0';
    } else {
        updateDiscussionScore();
    }
    updateFinalScore();
    saveScores(
        localStorage.getItem('selectedStudent'),
        new URLSearchParams(window.location.search).get('subject'),
        new URLSearchParams(window.location.search).get('term')
    );
}

function updateDiscussionScore() {
    const discussionInput = parseFloat(document.getElementById('discussionInput').value) || 0;
    const discussionScore = (discussionInput * 40) / 100;
    document.getElementById('discussionScore').textContent = discussionScore.toFixed(2);
    updateFinalScore();
}

function validateAndUpdateProjectScore() {
    const projectInput = parseFloat(document.getElementById('projectInput').value) || 0;
    if (projectInput > 100) {
        alert('You cannot input a number higher than 100!');
        document.getElementById('projectInput').value = '';
        document.getElementById('projectScore').textContent = '0';
    } else {
        updateProjectScore();
    }
    updateFinalScore();
    saveScores(
        localStorage.getItem('selectedStudent'),
        new URLSearchParams(window.location.search).get('subject'),
        new URLSearchParams(window.location.search).get('term')
    );
}

function updateProjectScore() {
    const projectInput = parseFloat(document.getElementById('projectInput').value) || 0;
    const projectScore = (projectInput * 30) / 100;
    document.getElementById('projectScore').textContent = projectScore.toFixed(2);
    updateFinalScore();
}

function addQuiz(quiz = {}) {
    const quizContainer = document.getElementById('quizContainer');
    const quizDiv = document.createElement('div');
    quizDiv.classList.add('quiz');

    quizDiv.innerHTML = `
        <input type="text" placeholder="Quiz Name" value="${quiz.name || ''}">
        <input type="number" class="rawScore" placeholder="Raw Score" min="0" step="0.01" value="${quiz.rawScore || ''}">
        <input type="number" class="totalScore" placeholder="Total Score" min="0" step="0.01" value="${quiz.totalScore || ''}">
        <button type="button" onclick="removeQuiz(this)">Remove</button>
    `;

    quizContainer.appendChild(quizDiv);

    quizDiv.querySelector('input[type="text"]').addEventListener('input', () => {
        validateAndUpdateQuizScore();
        saveScores(
            localStorage.getItem('selectedStudent'),
            new URLSearchParams(window.location.search).get('subject'),
            new URLSearchParams(window.location.search).get('term')
        );
    });
    quizDiv.querySelector('.rawScore').addEventListener('input', () => {
        validateAndUpdateQuizScore();
        saveScores(
            localStorage.getItem('selectedStudent'),
            new URLSearchParams(window.location.search).get('subject'),
            new URLSearchParams(window.location.search).get('term')
        );
    });
    quizDiv.querySelector('.totalScore').addEventListener('input', () => {
        validateAndUpdateQuizScore();
        saveScores(
            localStorage.getItem('selectedStudent'),
            new URLSearchParams(window.location.search).get('subject'),
            new URLSearchParams(window.location.search).get('term')
        );
    });
}

function removeQuiz(button) {
    button.parentElement.remove();
    updateQuizScore();
    saveScores(
        localStorage.getItem('selectedStudent'),
        new URLSearchParams(window.location.search).get('subject'),
        new URLSearchParams(window.location.search).get('term')
    );
}

function validateAndUpdateQuizScore() {
    const quizDivs = document.querySelectorAll('.quiz');
    let valid = true;

    quizDivs.forEach(quizDiv => {
        const rawScoreInput = quizDiv.querySelector('.rawScore');
        const totalScoreInput = quizDiv.querySelector('.totalScore');

        const rawScore = parseFloat(rawScoreInput.value) || 0;
        const totalScore = parseFloat(totalScoreInput.value) || 0;

        if (rawScore > totalScore) {
            alert('Raw score cannot be higher than total score!');
            rawScoreInput.value = '';
            valid = false;
        }
    });

    if (valid) {
        updateQuizScore();
    }
}

function updateQuizScore() {
    const rawScores = Array.from(document.querySelectorAll('.rawScore')).map(input => parseFloat(input.value) || 0);
    const totalScores = Array.from(document.querySelectorAll('.totalScore')).map(input => parseFloat(input.value) || 0);

    const totalRawScore = rawScores.reduce((sum, score) => sum + score, 0);
    const totalMaxScore = totalScores.reduce((sum, score) => sum + score, 0);

    let quizScore = 0;
    if (totalMaxScore > 0) {
        quizScore = (totalRawScore * 30) / totalMaxScore;
    }

    document.getElementById('quizScore').textContent = quizScore.toFixed(2);
    updateFinalScore();
}

function updateFinalScore() {
    const discussionScore = parseFloat(document.getElementById('discussionScore').textContent) || 0;
    const projectScore = parseFloat(document.getElementById('projectScore').textContent) || 0;
    const quizScore = parseFloat(document.getElementById('quizScore').textContent) || 0;

    const finalScore = discussionScore + projectScore + quizScore;
    document.getElementById('finalScore').textContent = `${finalScore.toFixed(2)} / 100`;
}

function updateAllScores() {
    updateDiscussionScore();
    updateProjectScore();
    updateQuizScore();
}
