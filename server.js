const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { json } = require('stream/consumers');
const { error } = require('console');
const { runInThisContext } = require('vm');

const app = express();
app.use(cors());
app.use(express.json());
// Serve frontend files from the project directory so you can open them in a browser

const DB_PATH = path.join(__dirname, 'database.json');
function normalizeQuestion(question) {

    if (typeof question !== 'object') {
        return
    }
    const questionText = typeof question.question === 'string' ? question.question : String(question || '');

    const type = typeof question.type === 'string' ? question.type : "multipleChoice";

    let correct = [];
    if (!Array.isArray(question.correct)) {
        return;
    }
    correct = question.correct.filter(function (e) {
        return e;
    });

    if (correct.length < 1) {
        return;
    }

    if (type === 'open') {
        return {
            question: questionText,
            type: type,
            correct: [correct],
        }
    }

    let allanswers = [];
    if (Array.isArray(question.allanswers)) {
        allanswers = question.allanswers.filter(function (e) {
            return e;
        });
    }
    else {
        return;
    }


    if (allanswers.length < 1) {
        return;
    }
    return {
        question: questionText,
        correct: correct,
        type: type,
        allanswers: allanswers
    };


}

async function readDB() {
    try {
        const data = await fs.readFile(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        // If file doesn't exist, initialize it
        if (err.code === 'ENOENT') {
            const initial = { allQuizes: {} };
            await fs.writeFile(DB_PATH, JSON.stringify(initial, null, 4));
            return initial;
        }
        throw err;
    }
}

async function writeDB(db) {
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 4), 'utf8');
}
async function writeLeaderboard(name, score, code) {
    await enqueueWrite(async () => {
        const db = await readDB();
        if (!db.allQuizes[code]) {
            return {'error': 'Quiz not found' };
        }
        db.allQuizes[code].Leaderboard[name] = score;
        await writeDB(db);
    });
    return {'success': true  };
}

// Simple write queue to avoid concurrent write races
let writeQueue = Promise.resolve();
function enqueueWrite(fn) {
    writeQueue = writeQueue.then(() => fn());
    return writeQueue;
}



// Normalize incoming quiz data to the expected schema used in database.json
function normalizeQuiz(quiz) {
    
    const out = {};
    if (!quiz || typeof quiz !== 'object') {
        return { 'error': 'Invalid quiz data' }
    }

    // Determine name: keep blank when not provided
    if (quiz && typeof quiz === 'object' && typeof quiz.name === 'string') {
        out.name = quiz.name.trim()
    } else {
        out.name = "unknown";
    }
    let rawQuestions = [];
    if (Array.isArray(quiz.AllQuestions)) {
        rawQuestions = quiz.AllQuestions;
    } else {
        return { 'error': 'Missing questions' }
    }
    out.AllQuestions = rawQuestions.map(question => {
        return normalizeQuestion(question);
    }).filter(q => q !== undefined);
    if (out.AllQuestions.length < 1) {
        return { 'error': 'No valid questions' }
    }
    // Extract questions array from various possible shapes
    

    // Normalize each question

    out.Leaderboard = {};
    return { 'success': true, 'out': out   };
}



// Create or replace a quiz at code
// Body: { code: string, quiz: object }

function generateCode(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = crypto.randomBytes(length);
    let out = '';
    for (let i = 0; i < length; i++) out += chars[bytes[i] % chars.length];
    return out;
}

// Create a quiz with a server-generated unique 10-character code
// Body: { quiz: object }
function sendJson(res, obj, status = 200) {
    try {
        const str = JSON.stringify(obj);
        res.status(status).set('Content-Type', 'application/json; charset=utf-8').send(str);
    } catch (e) {
        res.status(500).set('Content-Type', 'application/json; charset=utf-8').send(JSON.stringify({ error: 'Failed to serialize response' }));
    }
}
app.post('/api/create-quiz', async (req, res) => {
    const database = await readDB();

    let code 
    for (let index = 0; index < 100; index++) {
        code = generateCode(10);
        if (!database.allQuizes[code]) {
            break
        };
        code = null;
    }
    if (!code) {
        return sendJson(res, { error: 'Failed to generate unique code' }, 500);
    }
    console.log('Received quiz creation request:', JSON.stringify(req.body.quiz, null, 4));
    let normalized = normalizeQuiz(req.body.quiz);
    
    if (normalized.error) {
        return sendJson(res, { error: normalized.error }, 400);
    }
    const db = await readDB();
    db.allQuizes[code] = normalized.out;
    await writeDB(db);
    sendJson(res, {success: true, code: code });
});


// Add/update a leaderboard entry for an existing quiz
// Body: { code: string, name: string, score: number }



const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';
app.listen(PORT, HOST, () => console.log(`Server listening on http://${HOST}:${PORT} (serving files from ${__dirname})`));
app.use(express.static(__dirname));
