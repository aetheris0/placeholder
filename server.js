const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/* Test page */
app.get("/", (req, res) => {
    res.json({
        name: "Warp AI",
        status: "online"
    });
});

/* AI endpoint */
app.post("/chat", async (req, res) => {

    try {

        const message = req.body.message;

        if (!message) {
            return res.status(400).json({
                error: "No message provided."
            });
        }

        const response = await client.responses.create({
            model: "gpt-5",
            instructions: `
You are Warp AI.

You are the AI assistant for Warp Games.

Be helpful, friendly, accurate and concise.

You can:
- Have conversations
- Answer questions
- Explain things
- Solve math
- Write stories
- Write paragraphs
- Rewrite text
- Brainstorm ideas
- Help with coding

If you don't know something, say so instead of making it up.
`,
            input: message
        });

        res.json({
            reply: response.output_text
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Warp AI could not generate a response."
        });

    }

});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Warp AI running on port ${PORT}`);
});
