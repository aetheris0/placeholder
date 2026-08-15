/*
 * WARP AI
 * Static browser AI
 * No backend
 * No API key
 */

(async function () {

    "use strict";

    /* =========================
       CONFIG
    ========================= */

    const MODEL = "HuggingFaceTB/SmolLM2-135M-Instruct";

    const MAX_HISTORY = 12;

    let generator = null;
    let loading = false;
    let ready = false;

    let history = [];

    let mode = "chat";


    /* =========================
       FIND WARP UI
    ========================= */

    const input = document.getElementById("wai-input");
    const send = document.getElementById("wai-send");
    const chat = document.getElementById("wai-chat");

    if (!input || !send || !chat) {
        console.error("Warp AI: UI elements were not found.");
        return;
    }


    /* =========================
       MESSAGE FUNCTION
    ========================= */

    function addMessage(name, text, user) {

        const welcome =
            document.getElementById("wai-welcome");

        if (welcome) {
            welcome.remove();
        }

        const div =
            document.createElement("div");

        div.className =
            "warp-message";

        const avatar =
            document.createElement("div");

        avatar.className =
            "warp-avatar";

        avatar.textContent =
            user ? "YOU" : "W";


        const content =
            document.createElement("div");

        content.className =
            "warp-content";


        const nameElement =
            document.createElement("div");

        nameElement.className =
            "warp-name";

        nameElement.textContent =
            name;


        const textElement =
            document.createElement("div");

        textElement.className =
            "warp-text";

        textElement.textContent =
            text;


        content.appendChild(nameElement);
        content.appendChild(textElement);

        div.appendChild(avatar);
        div.appendChild(content);

        chat.appendChild(div);

        chat.scrollTop =
            chat.scrollHeight;

        return textElement;
    }


    /* =========================
       LOADING MESSAGE
    ========================= */

    function loadingMessage() {

        const welcome =
            document.getElementById("wai-welcome");

        if (welcome) {
            welcome.remove();
        }

        const div =
            document.createElement("div");

        div.className =
            "warp-message";

        div.id =
            "warp-loading";


        div.innerHTML = `
            <div class="warp-avatar">W</div>

            <div class="warp-content">

                <div class="warp-name">
                    Warp AI
                </div>

                <div class="warp-text">
                    Loading AI...
                </div>

            </div>
        `;

        chat.appendChild(div);

        chat.scrollTop =
            chat.scrollHeight;
    }


    function updateLoading(text) {

        const loading =
            document.getElementById(
                "warp-loading"
            );

        if (!loading) return;

        const element =
            loading.querySelector(
                ".warp-text"
            );

        if (element) {
            element.textContent = text;
        }
    }


    function removeLoading() {

        const loading =
            document.getElementById(
                "warp-loading"
            );

        if (loading) {
            loading.remove();
        }
    }


    /* =========================
       LOAD TRANSFORMERS.JS
    ========================= */

    async function loadRuntime() {

        updateLoading(
            "Loading Warp AI engine..."
        );

        try {

            const module =
                await import(
                    "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2"
                );

            return module;

        } catch (error) {

            console.error(
                "Warp AI runtime error:",
                error
            );

            throw new Error(
                "Couldn't load the browser AI engine."
            );
        }
    }


    /* =========================
       LOAD MODEL
    ========================= */

    async function loadModel() {

        if (ready) {
            return;
        }

        if (loading) {
            return;
        }

        loading = true;

        loadingMessage();

        try {

            const {
                pipeline,
                env
            } = await loadRuntime();


            /*
             * Browser cache.
             */

            env.allowLocalModels = false;


            /*
             * Try WebGPU first.
             */

            let device =
                "wasm";


            if (
                typeof navigator !== "undefined" &&
                "gpu" in navigator
            ) {
                device = "webgpu";
            }


            updateLoading(
                "Downloading Warp AI..."
            );


            try {

                generator =
                    await pipeline(
                        "text-generation",
                        MODEL,
                        {
                            device: device,
                            dtype: "q4"
                        }
                    );

            } catch (firstError) {

                console.warn(
                    "Warp AI WebGPU/model load failed:",
                    firstError
                );


                /*
                 * Fallback to WASM.
                 */

                updateLoading(
                    "Starting compatibility mode..."
                );


                generator =
                    await pipeline(
                        "text-generation",
                        MODEL,
                        {
                            device: "wasm",
                            dtype: "q8"
                        }
                    );
            }


            ready = true;

            removeLoading();

            addMessage(
                "Warp AI",
                "I'm ready. What do you want to know?",
                false
            );


        } catch (error) {

            console.error(
                "Warp AI model error:",
                error
            );

            removeLoading();

            addMessage(
                "Warp AI",
                "I couldn't load the local AI model. Try refreshing the page or using a browser with WebGPU support.",
                false
            );

        } finally {

            loading = false;

        }
    }


    /* =========================
       SYSTEM PROMPT
    ========================= */

    function systemPrompt() {

        if (mode === "math") {

            return `
You are Warp AI Math.

Solve the user's math problem accurately.

Show useful steps when appropriate.

Give the final answer clearly.

Do not invent information.
`;
        }


        if (mode === "write") {

            return `
You are Warp AI Writer.

Write exactly what the user asks for.

You can create:
- stories
- paragraphs
- essays
- sentences
- dialogue
- descriptions
- ideas

Follow the requested style and length.
`;
        }


        if (mode === "search") {

            return `
You are Warp AI.

The user selected Search mode.

Answer the question using your existing knowledge.

You do NOT have live web access in this static version,
so never pretend that you searched Google.
`;
        }


        return `
You are Warp AI.

You are a helpful AI assistant.

Have natural conversations with the user.

Answer questions clearly.

Help with:
- school subjects
- explanations
- coding
- math
- writing
- brainstorming
- general knowledge

Be concise unless the user asks for detail.

Never claim to have live internet access.
`;
    }


    /* =========================
       BUILD PROMPT
    ========================= */

    function buildPrompt(userText) {

        let prompt =
            systemPrompt() +
            "\n\n";


        for (
            let i = 0;
            i < history.length;
            i++
        ) {

            const item =
                history[i];

            if (item.role === "user") {

                prompt +=
                    "User: " +
                    item.content +
                    "\n\n";

            } else {

                prompt +=
                    "Warp AI: " +
                    item.content +
                    "\n\n";
            }
        }


        prompt +=
            "User: " +
            userText +
            "\n\nWarp AI:";


        return prompt;
    }


    /* =========================
       GENERATE RESPONSE
    ========================= */

    async function generate(text) {

        if (!ready) {
            await loadModel();
        }

        if (!generator) {
            throw new Error(
                "AI model isn't ready."
            );
        }


        const prompt =
            buildPrompt(text);


        const result =
            await generator(
                prompt,
                {
                    max_new_tokens: 180,

                    temperature: 0.7,

                    do_sample: true,

                    repetition_penalty: 1.08
                }
            );


        let output =
            result?.[0]?.generated_text;


        if (
            typeof output !== "string"
        ) {
            return "I couldn't generate a response.";
        }


        /*
         * Remove prompt from generated text.
         */

        if (
            output.startsWith(prompt)
        ) {

            output =
                output.slice(
                    prompt.length
                );
        }


        /*
         * Clean common model endings.
         */

        output =
            output
                .replace(
                    /^Warp AI:\s*/i,
                    ""
                )
                .trim();


        /*
         * Prevent accidental fake
         * conversation continuation.
         */

        const stopWords = [
            "\nUser:",
            "\nHuman:",
            "\nWarp AI:"
        ];


        for (
            const stop of stopWords
        ) {

            const index =
                output.indexOf(stop);

            if (index !== -1) {

                output =
                    output.slice(
                        0,
                        index
                    );

            }
        }


        return output.trim();
    }


    /* =========================
       SEND MESSAGE
    ========================= */

    async function sendMessage() {

        const text =
            input.value.trim();


        if (!text) {
            return;
        }


        if (loading) {
            return;
        }


        input.value = "";

        input.disabled = true;

        send.disabled = true;


        addMessage(
            "You",
            text,
            true
        );


        try {

            /*
             * Math mode has a local
             * calculator for basic expressions.
             */

            if (mode === "math") {

                const simple =
                    calculateMath(text);

                if (simple !== null) {

                    addMessage(
                        "Warp AI",
                        "Answer: " + simple,
                        false
                    );

                    history.push({
                        role: "user",
                        content: text
                    });

                    history.push({
                        role: "assistant",
                        content:
                            "Answer: " + simple
                    });

                    trimHistory();

                    return;
                }
            }


            loadingMessage();


            const reply =
                await generate(text);


            removeLoading();


            addMessage(
                "Warp AI",
                reply,
                false
            );


            history.push({

                role: "user",

                content: text

            });


            history.push({

                role: "assistant",

                content: reply

            });


            trimHistory();


        } catch (error) {

            console.error(
                "Warp AI generation error:",
                error
            );


            removeLoading();


            addMessage(
                "Warp AI",
                "Something went wrong while generating the response.",
                false
            );

        } finally {

            input.disabled = false;

            send.disabled = false;

            input.focus();

        }
    }


    /* =========================
       BASIC MATH
    ========================= */

    function calculateMath(expression) {

        let value =
            expression
                .replace(
                    /,/g,
                    ""
                )
                .replace(
                    /\^/g,
                    "**"
                )
                .trim();


        /*
         * Only allow mathematical
         * characters.
         */

        if (
            !/^[0-9+\-*/().%\s*]+$/.test(
                value
            )
        ) {
            return null;
        }


        if (
            !/[0-9]/.test(value)
        ) {
            return null;
        }


        try {

            const result =
                Function(
                    '"use strict"; return (' +
                    value +
                    ")"
                )();


            if (
                typeof result === "number" &&
                Number.isFinite(result)
            ) {

                return String(
                    Math.round(
                        result * 1000000000
                    ) / 1000000000
                );
            }

        } catch (error) {

            return null;

        }


        return null;
    }


    /* =========================
       HISTORY LIMIT
    ========================= */

    function trimHistory() {

        if (
            history.length >
            MAX_HISTORY
        ) {

            history =
                history.slice(
                    history.length -
                    MAX_HISTORY
                );
        }
    }


    /* =========================
       MODE BUTTONS
    ========================= */

    const modeButtons =
        document.querySelectorAll(
            ".warp-mode"
        );


    modeButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    modeButtons.forEach(
                        function (b) {

                            b.classList.remove(
                                "active"
                            );

                        }
                    );


                    button.classList.add(
                        "active"
                    );


                    mode =
                        button.dataset.mode;


                    const placeholders = {

                        chat:
                            "Message Warp AI...",

                        search:
                            "Search the web...",

                        math:
                            "Enter a math problem...",

                        write:
                            "What should Warp AI write?"

                    };


                    input.placeholder =
                        placeholders[mode] ||
                        placeholders.chat;

                }
            );

        }
    );


    /* =========================
       EVENTS
    ========================= */

    send.addEventListener(
        "click",
        sendMessage
    );


    input.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();

            }

        }
    );


    /* =========================
       START
    ========================= */

    /*
     * Don't download the model
     * immediately.
     *
     * It starts when the user
     * sends the first message.
     */

    console.log(
        "Warp AI loaded."
    );

})();
