const API_URL = 'https://opentdb.com/api.php?amount=20&type=multiple';

const fallbackQuestions = [
    {
        category:'Science',
        question:'What is the chemical symbol for gold?',
        correct_answer:'Au',
        incorrect_answers:['Ag','Gd','Go']
    },
    {
        category:'Geography',
        question:'Which country has the most natural lakes?',
        correct_answer:'Canada',
        incorrect_answers:['Brazil','Russia','United States']
    },
    {
        category:'Entertainment',
        question:'Which film features the quote “Here’s looking at you, kid”?',
        correct_answer:'Casablanca',
        incorrect_answers:['The Godfather','Jaws','Citizen Kane']
    },
    {
        category:'Science',
        question:'How many bones are in the adult human body?',
        correct_answer:'206',
        incorrect_answers:['186','216','226']
    },
    {
        category:'History',
        question:'Who was the first person to walk on the Moon?',
        correct_answer:'Neil Armstrong',
        incorrect_answers:['Buzz Aldrin','Yuri Gagarin','John Glenn']
    },
    {
        category:'Geography',
        question:'What is the capital city of Ghana?',
        correct_answer:'Accra',
        incorrect_answers:['Kumasi','Tamale','Cape Coast']
    },
    {
        category:'Science',
        question:'What planet is known as the Red Planet?',
        correct_answer:'Mars',
        incorrect_answers:['Venus','Jupiter','Mercury']
    },
    {
        category:'Technology',
        question:'What does CPU stand for?',
        correct_answer:'Central Processing Unit',
        incorrect_answers:[
            'Computer Personal Unit',
            'Central Program Utility',
            'Computer Processing Utility'
        ]
    },
    {
        category:'Geography',
        question:'Which is the largest continent?',
        correct_answer:'Asia',
        incorrect_answers:['Africa','Europe','North America']
    },
    {
        category:'History',
        question:'Which ancient civilization built the pyramids of Giza?',
        correct_answer:'Ancient Egyptians',
        incorrect_answers:['Romans','Greeks','Mayans']
    },
    {
        category:'Science',
        question:'What gas do humans need to breathe to survive?',
        correct_answer:'Oxygen',
        incorrect_answers:['Carbon dioxide','Hydrogen','Nitrogen']
    },
    {
        category:'Sports',
        question:'How many players are on a football team on the field?',
        correct_answer:'11',
        incorrect_answers:['9','10','12']
    },
    {
        category:'Geography',
        question:'Which ocean is the largest?',
        correct_answer:'Pacific Ocean',
        incorrect_answers:['Atlantic Ocean','Indian Ocean','Arctic Ocean']
    },
    {
        category:'Technology',
        question:'What does HTML stand for?',
        correct_answer:'HyperText Markup Language',
        incorrect_answers:[
            'HighText Machine Language',
            'Hyperlink Text Management Language',
            'Home Tool Markup Language'
        ]
    },
    {
        category:'General Knowledge',
        question:'How many days are there in a leap year?',
        correct_answer:'366',
        incorrect_answers:['365','364','367']
    },
    {
        category:'Science',
        question:'What is H2O commonly known as?',
        correct_answer:'Water',
        incorrect_answers:['Hydrogen','Oxygen','Salt']
    },
    {
        category:'Geography',
        question:'Which country is known as the Land of the Rising Sun?',
        correct_answer:'Japan',
        incorrect_answers:['China','Thailand','South Korea']
    },
    {
        category:'History',
        question:'Who discovered penicillin?',
        correct_answer:'Alexander Fleming',
        incorrect_answers:[
            'Isaac Newton',
            'Louis Pasteur',
            'Albert Einstein'
        ]
    },
    {
        category:'General Knowledge',
        question:'How many continents are there?',
        correct_answer:'7',
        incorrect_answers:['5','6','8']
    },
    {
        category:'Technology',
        question:'Which device is commonly used to move a pointer on a computer screen?',
        correct_answer:'Mouse',
        incorrect_answers:['Printer','Speaker','Scanner']
    }
];

const $ = id => document.getElementById(id);

let questionPool = [];
let questions = [];
let usedQuestions = new Set();

let current = 0;
let score = 0;
let answered = false;
let loading = false;

function decode(value){

    const element = document.createElement('textarea');

    element.innerHTML = value;

    return element.value;
}

function shuffle(items){

    return [...items].sort(() => Math.random() - 0.5);
}

function questionKey(item){

    return decode(item.question)
        .trim()
        .toLowerCase();
}

function cleanQuestion(item){

    return {
        ...item,
        question:decode(item.question),
        correct_answer:decode(item.correct_answer),
        incorrect_answers:item.incorrect_answers.map(decode)
    };
}

async function fetchQuestions(){

    const controller = new AbortController();

    const timeout = setTimeout(() => {
        controller.abort();
    },5000);

    try{

        const response = await fetch(API_URL,{
            signal:controller.signal
        });

        clearTimeout(timeout);

        if(!response.ok){
            throw new Error('API unavailable');
        }

        const data = await response.json();

        if(data.response_code !== 0){
            throw new Error('No questions available');
        }

        return data.results.map(cleanQuestion);

    }catch(error){

        clearTimeout(timeout);

        throw error;
    }
}

function getUnusedQuestions(){

    return questionPool.filter(item => {
        return !usedQuestions.has(questionKey(item));
    });
}

function selectNewQuestions(){

    const available = getUnusedQuestions();

    if(available.length < 5){
        return null;
    }

    const selected = shuffle(available).slice(0,5);

    selected.forEach(item => {
        usedQuestions.add(questionKey(item));
    });

    return selected;
}

async function getQuizQuestions(){

    let selected = selectNewQuestions();

    if(selected){
        return selected;
    }

    try{

        const newQuestions = await fetchQuestions();

        questionPool.push(...newQuestions);

        selected = selectNewQuestions();

        if(selected){
            return selected;
        }

    }catch(error){

    }

    const fallbackPool =
        fallbackQuestions.map(cleanQuestion);

    let available = fallbackPool.filter(item => {
        return !usedQuestions.has(questionKey(item));
    });

    if(available.length < 5){

        usedQuestions.clear();

        available = fallbackPool;
    }

    const selectedFallback =
        shuffle(available).slice(0,5);

    selectedFallback.forEach(item => {
        usedQuestions.add(questionKey(item));
    });

    return selectedFallback;
}

async function startQuiz(){

    if(loading){
        return;
    }

    loading = true;

    hide('quiz-view');
    hide('results-view');
    show('loading-view');

    $('loading-view').querySelector('h2').textContent =
        'Loading your challenge...';

    $('loading-view').querySelector('p').textContent =
        'Fetching five questions from the trivia vault.';

    try{

        questions = await getQuizQuestions();

    }catch(error){

        questions = shuffle(
            fallbackQuestions.map(cleanQuestion)
        ).slice(0,5);
    }

    current = 0;
    score = 0;
    answered = false;

    $('score').textContent = '0';

    hide('loading-view');
    show('quiz-view');

    renderQuestion();

    loading = false;
}

function renderQuestion(){

    answered = false;

    const item = questions[current];

    const choices = shuffle([
        item.correct_answer,
        ...item.incorrect_answers
    ]);

    $('question-count').textContent =
        `Question ${current + 1} of ${questions.length}`;

    $('category').textContent =
        item.category || 'General Knowledge';

    $('question-number').textContent =
        String(current + 1).padStart(2,'0');

    $('question-text').textContent =
        item.question;

    $('progress-bar').style.width =
        `${((current + 1) / questions.length) * 100}%`;

    $('feedback').textContent =
        'Choose an answer';

    $('feedback').parentElement.className =
        'feedback-content';

    $('next-button').disabled = true;

    $('next-button').innerHTML =
        current === questions.length - 1
            ? 'See results <span>→</span>'
            : 'Next question <span>→</span>';

    $('answers').innerHTML = '';

    choices.forEach((choice,index) => {

        const button =
            document.createElement('button');

        button.type = 'button';

        button.className =
            'answer-button';

        button.innerHTML = `
            <span class="answer-letter">
                ${String.fromCharCode(65 + index)}
            </span>
            <span>${choice}</span>
        `;

        button.addEventListener('click',() => {

            selectAnswer(
                button,
                choice,
                item.correct_answer
            );

        });

        $('answers').appendChild(button);
    });
}

function selectAnswer(button,choice,correct){

    if(answered){
        return;
    }

    answered = true;

    const isCorrect =
        choice === correct;

    const feedback =
        $('feedback');

    const feedbackContent =
        feedback.parentElement;

    const feedbackIcon =
        feedbackContent.querySelector('.feedback-icon');

    if(isCorrect){

        score++;

        $('score').textContent =
            score;

        button.classList.add('correct');

        feedback.textContent =
            `Correct! ${correct} is the right answer.`;

        feedbackContent.className =
            'feedback-content good';

        feedbackIcon.textContent =
            '✓';

    }else{

        button.classList.add('incorrect');

        feedback.textContent =
            `Not quite — the answer is ${correct}.`;

        feedbackContent.className =
            'feedback-content bad';

        feedbackIcon.textContent =
            '×';

        [...$('answers').children]
            .find(item =>
                item.lastElementChild.textContent === correct
            )
            ?.classList.add('correct');
    }

    [...$('answers').children].forEach(item => {
        item.disabled = true;
    });

    $('next-button').disabled = false;
}

function showResults(){

    hide('quiz-view');
    show('results-view');

    const percentage =
        Math.round(
            (score / questions.length) * 100
        );

    $('final-score').textContent =
        score;

    $('final-percent').textContent =
        `${percentage}%`;

    $('final-total').textContent =
        questions.length;

    $('result-copy').textContent =
        `You scored ${score} out of ${questions.length}.`;

    if(percentage === 100){

        $('result-title').textContent =
            'Perfect round!';

        $('result-emoji').textContent =
            '🏆';

    }else if(percentage >= 60){

        $('result-title').textContent =
            'Nice work!';

        $('result-emoji').textContent =
            '🏆';

    }else{

        $('result-title').textContent =
            'Good warm-up!';

        $('result-emoji').textContent =
            '★';
    }
}

function hide(id){

    $(id).classList.add('hidden');
}

function show(id){

    $(id).classList.remove('hidden');
}

$('next-button').addEventListener('click',() => {

    if(!answered){
        return;
    }

    if(current < questions.length - 1){

        current++;

        renderQuestion();

    }else{

        showResults();
    }
});

$('restart-button').addEventListener('click',() => {

    startQuiz();
});

startQuiz();