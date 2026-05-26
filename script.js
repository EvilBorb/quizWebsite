
let currentquestion = null
let resultDisplayed = false

let questionsection =document.getElementById("questionsection");

let correctorincorrect = document.createElement("section");
correctorincorrect.id ='correctorincorrect'

document.body.appendChild(correctorincorrect)
let textInCorrectorincorrect = document.createElement("p")
correctorincorrect.appendChild(textInCorrectorincorrect)
let buttonInCorrectorincorrect = document.createElement("button")
correctorincorrect.appendChild(buttonInCorrectorincorrect)
buttonInCorrectorincorrect.textContent = 'Continue'


let totalCorrect = 0;
let totalIncorrect = 0;
let keepplaying = false;
let QuestionsToChooseFrom 
function getjson() {
  return fetch('database.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      return response.json();
    })
    .catch(error => {
      console.error('There was a problem with the fetch operation:', error);
    });
}


const colorsForOption = ["rgb(192, 0, 0)", "rgb(0, 222, 141)", "rgb(255, 255, 0)", "rgb(0, 255, 251)"];




function shuffleArray(arrayd) {
    for (let i = arrayd.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1)); 
        [arrayd[i], arrayd[j]] = [arrayd[j], arrayd[i]];   
    }
    return arrayd;
}

function multipleChoiceQuestion(questionData) {
	let answers = shuffleArray(questionData.allanswers)

	document.getElementById("question").textContent = questionData.question
	for (let index = 0; index < answers.length; index++) {

		let button = document.createElement("button");

		button.textContent = answers[index];
		button.style.backgroundColor = colorsForOption[index % colorsForOption.length]
		button.className = "options";

		questionsection.appendChild(button);

	}
}

function NewQuestion(AllQuestionData) {
	document.querySelectorAll(".options").forEach(el => el.remove());
	let rand = Math.random();
	let randomint = Math.floor(rand * AllQuestionData.length);
	let questionData = AllQuestionData[randomint]
	currentquestion = questionData
	QuestionsToChooseFrom = AllQuestionData
	console.log('new question:', questionData)
	if (questionData.type == 'multipleChoice') {
		
		multipleChoiceQuestion(questionData)
	}
	else if( questionData.type == 'open') {
		console.error('no valid type you idiot!!!!!!')	
	}
	

}
buttonInCorrectorincorrect.onclick = function() {
	if (QuestionsToChooseFrom && resultDisplayed) {
		console.warn('correct or incorrect is NOT displayed')
		correctorincorrect.style.display = 'none';
		resultDisplayed =false;
		NewQuestion(QuestionsToChooseFrom);
		
		return
	}
}
document.addEventListener("click", function(event) {

    if  (!event.target.classList.contains("options") || !currentquestion) {return}

	correctorincorrect.style.display = 'inline';
	let response;
	let color;
	if (currentquestion.correct.includes(event.target.textContent)) {
		console.log('correct');
		totalCorrect++;
		response = 'Correct' ;
		color = "rgb(0,255,0)";


	} 
	else {
		response = 'Incorrect'
		totalIncorrect++;
		color = "rgb(255,0,0)";


		console.log('incorrect');
	}
	
	let percentage = Math.round(totalCorrect / (totalIncorrect+totalCorrect) *10000)/100
	correctorincorrect.style.backgroundColor = color
	resultDisplayed = true;
	if (response == 'Correct') {
		textInCorrectorincorrect.innerHTML = `${response}!<br/>Total correct answers: ${totalCorrect}<br/>Total incorrect answers: ${totalIncorrect}<br/>Percentage correct: ${percentage}`;

	}
	textInCorrectorincorrect.innerHTML = `${response}!<br/>The correct answer: ${currentquestion.correct}<br/>Total correct answers: ${totalCorrect}<br/>Total incorrect answers: ${totalIncorrect}<br/>Percentage correct: ${percentage}`;

	return true;

});
function startNew(Quiz) {
	totalCorrect = 0;
	totalIncorrect = 0;
	resultDisplayed = false;
	correctorincorrect.style.display = 'none';
	resultDisplayed =false;
	currentquestion = null;
	keepplaying = true;
	questionsection.style.display = 'inline';
	let inputCodeSection = document.getElementById('InputQuizCode');
	inputCodeSection.style.display = 'none';
		console.log('new question')
	NewQuestion(Quiz.AllQuestions);
	
}

let enterCodeButton = document.getElementById('EnterCode')
enterCodeButton.onclick = async function() {

    let database = await getjson();   // wait for JSON to load
	let codeInput = document.getElementById('inputIputQuizCode').value;

	console.log(database)
    if (database && codeInput in database.allQuizes) {
        alert('Starting quiz: ' + codeInput);
        startNew(database.allQuizes[codeInput]);
    } else {
		if (!database) {
			console.warn("no database")
		}
		console.warn(codeInput)
		if (codeInput in database.allQuizes){
			console.warn('it is in the database!!!!')
		}
        alert('Invalid quiz code' );
    }
};
