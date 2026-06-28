# BlogWritingAI

A full-stack AI-powered blogging platform that uses a multi-agent workflow to research topics, analyze information, generate structured outlines, and produce Markdown articles. Built with a focus on content quality and automation, the platform also includes safeguards such as IP-based rate limiting, prompt injection prevention and input validation.<br>
[View Live](https://sudevop1.github.io/BlogWritingAI/)

## 💡 How it works

1. **Topic Analysis:** Analyzes the topic and determines the optimal content strategy.

2. **Web Research:** Research agents gather, verify, and deduplicate relevant sources.

3. **Content Planning:** An orchestrator creates the article structure and writing plan.

4. **AI Writing:** Specialized LLM agents generate detailed, coherent article sections.

5. **Review & Assembly:** Sections are refined and compiled into Markdown output.

6. **Security & Reliability:** Rate limiting, authentication, validation, and prompt-injection protection.
   <br>

## 🤖 Agentic Workflow

![Workflow](https://raw.githubusercontent.com/SudevOP1/BlogWritingAI/main/WorkflowDiagram.png)<br>
<br>

## 🛠️ Tech Stacks

- **Frontend**: `React` + `Tailwind CSS`
- **Backend**: `FastAPI`
- **LLM Providers**: `Groq`, `Ollama`
- **AI Orchestration & Search**: `LangChain`, `Tavily`
  <br>

## ✨ Website Design

![Example](https://raw.githubusercontent.com/SudevOP1/BlogWritingAI/main/Implementation.png)<br>
<br>

## 🚀 How to run it locally

### 1. Clone the repo

```bash
git clone https://github.com/SudevOP1/BlogWritingAI.git
cd BlogWritingAI
```

### 2. Backend Server

Create & Setup Virtual Environment

```bash
python -m venv venv
venv\Scripts\activate
```

Install Dependencies

```bash
pip install -r requirements.txt
```

Run Server

```bash
uvicorn main:app --reload
```

### 3. Frontend Server

Install Dependencies

```bash
npm i
```

Run Server

```bash
npm run dev
```

### 4. See the magic happen

Open `http://localhost:5173/` in your browser<br>
