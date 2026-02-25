const express = require("express");
const cors = require("cors");
const fs = require("fs");

function log(msg) {
    fs.appendFileSync("server.log", msg + "\n");
    console.log(msg);
}

// load environment variables; we keep the key in `API.env` for now.
// you might rename this to `.env` later but the important part is that
// `dotenv` reads whatever file contains GEMINI_API_KEY.
//require("dotenv").config();

const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.set("view engine", "hbs");
app.use(cors());
app.use(express.json());
// basic logging of every request
app.use((req, res, next) => {
    log(`incoming ${req.method} ${req.url}`);
    next();
});
app.use(express.static("public"));

// instantiate client after loading config
typeof process !== 'undefined';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// verify that the API key was loaded; early log helps if it isn't
if (!process.env.GEMINI_API_KEY) {
    console.error("⚠️  GEMINI_API_KEY not loaded. Create API.env or .env with the key and restart.");
}


app.get("/", (req,res)=>{ 
    res.render("main");
});

app.post("/api/check-news", async (req,res)=>{

    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ verdict: "No text provided", type: "fake" });
        }

        // use a stable, widely available model; older gemini endpoints may not be
        // accessible under every key. if you have access to gemini you can replace
        // this string.
        // selected an available model that supports generateContent
        // based on the ListModels response for this API key:
        // models/gemini-2.5-flash is present and works with v1beta.
        const modelName = "gemini-2.5-flash";
        log(`using model ${modelName}`);
        // note: requestOptions is a separate second argument
        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = `
        You are a fake news detection AI.

        Analyze this news and respond ONLY in this format:

        Verdict: REAL or FAKE
        Reason: short reason

        News: ${text}
        `;

        const result = await model.generateContent(prompt);
        const modelRespText = await result.response.text();

        // try to extract structured fields from the model's text response
        const modelText = (modelRespText || "").toString();
        const lines = modelText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        let parsedVerdictText = modelText;
        let parsedReason = null;
        for (const line of lines) {
            if (line.toLowerCase().startsWith("verdict:")) {
                parsedVerdictText = line;
            } else if (line.toLowerCase().startsWith("reason:")) {
                parsedReason = line.replace(/^[Rr]eason:\s*/i, "");
            }
        }

        const verdict = parsedVerdictText.toLowerCase().includes("fake") ? "fake" : "real";
        const reasons = parsedReason ? [parsedReason] : [];
        const score = verdict === "fake" ? 25 : 85; // simple heuristic score

        res.json({
            verdict: parsedVerdictText,
            type: verdict,
            reasons,
            score,
            raw: modelText
        });
    } catch (e) {
        // log full object to capture status/message from API client
        log("error in /api/check-news: " + (e.message || JSON.stringify(e)));
        if (e.status && e.statusText) {
            log("HTTP error " + e.status + " " + e.statusText);
        }
        // return a stable JSON shape so the frontend won't crash
        res.status(500).json({ verdict: "Server error", type: "fake", reasons: [], score: 0, raw: "" });
    }

});


app.listen(8080, ()=> console.log("Server running on 8080"));
