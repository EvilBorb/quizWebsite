let quizeditor = document.getElementById('quiz-editor')
let newQuestionButton = document.getElementById('newQuestion')
let finishmaking = document.getElementById('FinishMaking')
// ensure these buttons don't act as form submit buttons (prevents reload)
if (newQuestionButton) newQuestionButton.type = 'button';
if (finishmaking) finishmaking.type = 'button';
let questions = 0
function createQuestionBlock(questionNumber) { // deze functie is gemaakt door chatgpt omdat ik te lui was om het zelf te maken (de rest van de code is uiteraard wel door mij gemaakt)
    // Main container
    const questionBlock = document.createElement("div");
    questionBlock.className = "quiz-question-block";

    // Question label
    const questionLabel = document.createElement("label");
    questionLabel.htmlFor = `question-text-${questionNumber}`;
    questionLabel.textContent = `Vraag ${questionNumber}:`;

    // Question input
    const questionInput = document.createElement("input");
    questionInput.type = "text";
    questionInput.id = `question-text-${questionNumber}`;
    questionInput.placeholder = "Typ hier je vraag...";

    // Answers container
    const answersContainer = document.createElement("div");
    answersContainer.className = "answerscontainer";

    // Answers label
    const answersLabel = document.createElement("label");
    answersLabel.textContent = "Antwoorden:";

    // Answer section
    const answerSection = document.createElement("section");
    answerSection.className = "Answers";
    answerSection.id = "Answer1";

    const answerText = document.createElement("p");
    answerText.textContent = "Antwoord 1:";

    const answerInput = document.createElement("input");
    answerInput.type = "text";
    answerInput.placeholder = "Typ hier een antwoord";

    const correctText = document.createTextNode(" Goed: ");

    const correctCheckbox = document.createElement("input");
    correctCheckbox.type = "checkbox";




    // Add answer elements
    answerSection.append(
        answerText,
        answerInput,
        correctText,
        correctCheckbox
    );

    // New answer button
    const newAnswerBtn = document.createElement("button");
    newAnswerBtn.className = "NewAnswer";
    newAnswerBtn.textContent = "Antwoord toevoegen";

    // Assemble answers container
    answersContainer.append(
        answersLabel,
        answerSection,
        newAnswerBtn
    );

    // Assemble question block
    questionBlock.append(
        questionLabel,
        questionInput,
        answersContainer
    );

    return questionBlock;
}
const BASE_URL = window.BASE_API_URL

async function createQuizAndGetCode(quiz) {
    console.log('Creating quiz:', JSON.stringify(quiz, null, 4));
    const res = await fetch('/api/create-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quiz: quiz })
    });

    const text = await res.json();
    console.log(text);
    return text;
}


function getQuizData() {
    
    const quizData = {};
    const allquestionData = [];
    // All question blocks
    const questionBlocks = document.querySelectorAll(".quiz-question-block");

    questionBlocks.forEach(block => {
        const questionInput = block.querySelector("input[type='text']");
        const questionText = questionInput.value;
        if (questionText === '' || !questionText) return;

        const answersSections = block.querySelectorAll(".Answers");

        // Collect all answers
        const allanswers = [];
        const correct = [];
        answersSections.forEach(answer => {

            const answerInput = answer.querySelector("input[type='text']");
            const checkbox = answer.querySelector("input[type='checkbox']");
            if (answerInput && answerInput.value.trim() !== '') {
                allanswers.push(answerInput.value);
                if (checkbox && checkbox.checked) {
                    correct.push(answerInput.value);
                }
            }

        });
        if (allanswers.length < 1 || correct.length < 1) return;
        allquestionData.push({
            question: questionText,
            correct: correct,
            type: "multipleChoice",
            allanswers: allanswers
        });
    });


    return { AllQuestions: allquestionData, name: 'untitled' };

}

function createNewAnswer(answersContainer, answerNumber) {
    const answer = document.createElement("section");
    answer.className = "Answers";

    const label = document.createElement("p");
    label.textContent = `Antwoord ${answerNumber}:`;

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Typ hier een antwoord";

    const correctText = document.createTextNode(" Goed: ");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";

    answer.append(label, input, correctText, checkbox);

    // insert ABOVE the "NewAnswer" button (last child)
    const button = answersContainer.querySelector(".NewAnswer");
    answersContainer.insertBefore(answer, button);
}

newQuestionButton.onclick = function () {
    questions++
    quizeditor.insertBefore(createQuestionBlock(questions), newQuestionButton);
}
document.addEventListener("click", function (event) {
    if (event.target.classList.contains("NewAnswer")) {
        let block = event.target.parentElement
        let answers = block.querySelectorAll(".Answers").length;
        block.insertBefore(createNewAnswer(block, answers + 1), event.target)


    }

});
// Prevent page reload on submit and show returned code on the page
finishmaking.onclick = async function () {
    const myQuiz = getQuizData();

    if (myQuiz.length === 0) {
        alert('Please add at least one question with answers before finishing the quiz.');
        return;
    }
    const result = await createQuizAndGetCode(myQuiz);
    if (result.error) {
        alert('Error creating quiz: ' + result.error);
        return;
    }

    alert('Quiz created! Your quiz code is: ' + result.code);

    /* try {
   
   
     } catch (err) {
       console.error('Create failed:', err);
       alert('Create failed: ' + (err.message || err));
     }*/
};

