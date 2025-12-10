// Load environment variables from .env file
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const axios = require('axios');

const app = express();
// Use port 5000 for the backend server
const PORT = process.env.PORT || 5000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ----------------------------------------------------
// Middleware: Updated CORS Policy for Vercel Deployment
// ----------------------------------------------------

// CRITICAL FIX: The custom domain is explicitly listed, and the REGEX catches preview links.
const allowedOrigins = [
    'http://localhost:5173', // For local development
    'https://cimba.vercel.app', // **Your specific custom domain**
];

// Regex to catch all dynamic Vercel subdomains (e.g., cimba-bx8q93ud0-...)
// This is necessary because Vercel creates unique subdomains for every push.
const VERCEL_REGEX = /^https:\/\/cimba-.*\.vercel\.app$/;

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g., Postman or server-to-server)
        if (!origin) return callback(null, true); 
        
        // Check if the origin is in our allowed list OR matches the Vercel pattern
        if (allowedOrigins.includes(origin) || VERCEL_REGEX.test(origin)) {
            callback(null, true);
        } else {
            // Log the blocked origin for troubleshooting
            console.log('CORS blocked origin:', origin);
            callback(new Error(`Not allowed by CORS policy. Origin: ${origin}`));
        }
    },
    methods: 'GET,POST',
    credentials: true,
}));

app.use(express.json()); // To parse incoming JSON requests

// ----------------------------------------------------
// Database Initialization (Steps 4 & 5)
// ----------------------------------------------------

const DB_PATH = path.join(__dirname, 'faqs.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeDatabase();
    }
});

function initializeDatabase() {
    // Define the schema and insert initial data
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS faqs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT NOT NULL,
            answer TEXT NOT NULL
        )`);

        // Sample initial data (The "grounding context")
        const faqs = [
            ["What are your hours of operation?", "Our support team operates from 9 AM to 5 PM, Monday to Friday, Central Time (CT). We are closed on all major US holidays."],
            ["How do I reset my password?", "You can reset your password by clicking the 'Forgot Password' link on the login page. A secure link will be sent to your registered email address."],
            ["What is the return policy?", "We offer a 30-day full refund policy for all digital products from the date of purchase. Physical items must be returned within 14 days in original, unopened packaging."],
            ["What is the required tech stack for the CIMBA chatbot project?", "The required tech stack is React, Spring Boot (or Node/Express), MongoDB (or SQLite), and the OpenAI API (or Gemini API)."],
            ["Where can I find my order tracking number?", "Your tracking number is included in the 'Shipping Confirmation' email sent within 24 hours of your order being dispatched."],
            ["Can I modify an order after it has been placed?", "No, once an order is placed, it immediately enters fulfillment and cannot be modified or cancelled."]
        ];

        // Check if data already exists before inserting to prevent duplicates on restart
        db.get("SELECT COUNT(*) AS count FROM faqs", (err, row) => {
            if (row && row.count === 0) {
                const stmt = db.prepare("INSERT INTO faqs (question, answer) VALUES (?, ?)");
                faqs.forEach(faq => {
                    stmt.run(faq[0], faq[1]);
                });
                stmt.finalize(() => {
                    console.log(`Successfully inserted ${faqs.length} sample FAQs.`);
                });
            } else {
                console.log('FAQs table already populated or database error occurred.');
            }
        });
    });
}


// ----------------------------------------------------
// RAG Implementation (Steps 6, 7, 8)
// ----------------------------------------------------
app.post('/api/chat', async (req, res) => {
    const { userQuery } = req.body;

    if (!userQuery) {
        return res.status(400).json({ error: 'Query is required' });
    }
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not set. Please check your .env file.' });
    }

    try {
        // STEP 6: Implement Retrieval Logic (Enhanced Keyword Matching)
        const queryLower = userQuery.toLowerCase();
        
        // 1. Tokenize query, keeping only words >= 3 chars
        const keywords = queryLower.split(/\s+/)
                                   .filter(word => word.length > 2); 
        
        // 2. Build individual LIKE conditions
        let conditions = keywords.map(word => `question LIKE '%${word}%' OR answer LIKE '%${word}%'`);
        
        // 3. Add the full query text as a condition for exact phrase matching
        conditions.push(`question LIKE '%${queryLower}%' OR answer LIKE '%${queryLower}%'`);
        
        // 4. Combine all conditions with OR
        const whereClause = conditions.join(' OR ');

        let context = '';
        
        // Use an asynchronous promise wrapper for SQLite
        const retrievedContext = await new Promise((resolve, reject) => {
            const sql = `
                SELECT question, answer FROM faqs 
                WHERE ${whereClause} 
                LIMIT 3
            `;
            
            db.all(sql, [], (err, rows) => {
                if (err) {
                    return reject(err);
                }
                resolve(rows);
            });
        });

        if (retrievedContext.length > 0) {
            // Format retrieved context into a single string
            context = retrievedContext.map((row, index) => 
                `FAQ Document ${index + 1}:\nQ: ${row.question}\nA: ${row.answer}`
            ).join('\n---\n');
        } else {
            context = 'No specific FAQ documents found in the database that match the query.';
        }
        
        console.log(`[RAG] Retrieved Context:\n${context}`);


        // STEP 7: Construct the LLM Prompt (Augmentation)
        const augmentedPrompt = `
            You are a helpful customer support chatbot for a company. Your answers MUST be based ONLY on the provided context 
            from our company's FAQs. Do not use outside knowledge. 
            If the context does not contain the answer, state clearly and politely that you cannot find the relevant information in the company documents.

            CONTEXT:
            ---
            ${context}
            ---

            CUSTOMER QUERY: ${userQuery}
        `;

        // STEP 8: Call the Gemini API (Generation)
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;
        
        // Configuration for exponential backoff retry logic
        const maxRetries = 3;
        let attempt = 0;
        let geminiResponse;

        // ** GOOGLE SEARCH GROUNDING TOOL IS INCLUDED HERE **
        const payload = {
            contents: [
                { role: "user", parts: [{ text: augmentedPrompt }] }
            ],
            tools: [{ "google_search": {} }] 
        };

        while (attempt < maxRetries) {
            try {
                geminiResponse = await axios.post(geminiUrl, payload, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 10000 // 10 second timeout
                });
                break; // Success, exit loop
            } catch (error) {
                attempt++;
                if (attempt >= maxRetries) {
                    throw error; // If max retries reached, throw the error
                }
                // Wait using exponential backoff (1s, 2s, 4s...)
                const delay = Math.pow(2, attempt) * 1000; 
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        const generatedText = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
            throw new Error("LLM response was empty or malformed.");
        }

        // Return the final response to the frontend
        res.json({ text: generatedText });

    } catch (error) {
        console.error('Error during RAG process:', error.response ? JSON.stringify(error.response.data) : error.message);
        res.status(500).json({ 
            error: 'Failed to generate response. Check API key, server logs, or network connection.',
            details: error.response?.data || error.message
        });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Backend Ready. Start React app next.');
});
