# CIMBA RAG Support Chatbot 🤖

A smart customer support chatbot built using **Retrieval-Augmented Generation (RAG)**.  
The system answers user queries strictly using internally stored FAQ data, ensuring **accurate, grounded, and non-hallucinated responses**.

---

## 🚀 Live Application

Frontend (Vercel):  
https://cimba-harshnc1212-5405s-projects.vercel.app/

Backend (Render):  
https://smart-chatbot-uikw.onrender.com/

FAQs Doc link:
https://docs.google.com/document/d/1fVNbEehus96AFYs9cDbYI91xDr-PAwjhU3IVxvRVtcU/edit?usp=sharing

Note: The Gemini API key may reach its usage limit during consecutive or repeated chatbot interactions, due to free-tier quota constraints.

---

## 🧠 Problem Overview

Customer support teams receive repetitive queries related to working hours, policies, and project requirements.  
This project implements a **RAG-based chatbot** that retrieves relevant FAQ documents and uses an LLM to generate responses **only from retrieved company data**, reducing incorrect or hallucinated answers.

---

## 🛠️ Technology Stack

- React (Vite)
- Tailwind CSS
- Node.js
- Express.js
- SQLite (FAQ database)
- Gemini-2.5-flash API (LLM)
- Axios
- Vercel
- Render

---

## 🧩 How the RAG System Works

1. User enters a query in the React chat UI.
2. Backend processes the query and extracts keywords.
3. Matching FAQ records are retrieved from SQLite.
4. Retrieved FAQs are injected into an augmented prompt.
5. Gemini generates a response strictly limited to the provided context.
6. If no relevant context exists, the chatbot clearly states that information is unavailable.

---

## ✨ Features

- Retrieval-Augmented Generation (RAG)
- Context-restricted LLM responses
- SQLite-based FAQ storage
- No hallucinations
- Responsive chat UI
- Conversation history with auto-scroll
- Loading indicators
- Secure environment-based configuration
- Production-safe CORS handling

---

## 📸 Screenshots

- FAQs
- <img width="1539" height="142" alt="image" src="https://github.com/user-attachments/assets/945b1753-5e32-43d9-805f-ebffdc3a4a4c" />

- Chat Interface
- <img width="1343" height="807" alt="image" src="https://github.com/user-attachments/assets/1e66785d-10b9-4e43-8a5e-bd48401acf4a" />

- Architecture Diagram
- <img width="2048" height="1365" alt="image" src="https://github.com/user-attachments/assets/5f0bfc2d-7319-41ad-81bd-0ac13af4f31e" />


---

## ⚙️ Complete End-to-End Setup (Single Flow)

Prerequisites: Node.js (v18+), npm, and a Gemini API key.

Clone the repository and move into the project root:

```bash
git clone https://github.com/Harshjoshiit/Smart-Chatbot.git
