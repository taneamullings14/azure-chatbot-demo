// server.js
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { NlpManager } = require('node-nlp');

const app = express();
const PORT = 3000;

// ===== Middleware =====
app.use(cors()); // Allow frontend requests
app.use(express.json()); // Parse JSON body
app.use(express.static(__dirname)); // Serve HTML, CSS, JS files

// ===== NLP Manager Setup =====
const manager = new NlpManager({ languages: ['en'], forceNER: true });

// Add training documents
manager.addDocument('en', 'When is the deadline?', 'deadline');
manager.addDocument('en', 'Application closing date?', 'deadline');
manager.addDocument('en', 'How much is tuition?', 'tuition');
manager.addDocument('en', 'What are the fees?', 'tuition');

// Add answers
manager.addAnswer('en', 'deadline', 'The fall deadline is August 1st.');
manager.addAnswer('en', 'tuition', 'Tuition is $4,500 per semester.');

// Train and save NLP manager
(async () => {
    await manager.train();
    manager.save();
    console.log("NLP Manager trained and ready!");
})();

// ===== Routes =====

// Root route (test server)
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Chat endpoint
app.post('/chat', async (req, res) => {
    const message = req.body.message;

    if (!message) {
        return res.json({ reply: "Please type a message." });
    }

    // Use NLP Manager first
    const nlpResponse = await manager.process('en', message);

    let reply = nlpResponse.answer;

    // Keyword fallback
    if (!reply) {
        const msgLower = message.toLowerCase();
        if (msgLower.includes("cloud")) {
            reply = "Cloud computing is the delivery of computing services such as servers, storage, databases, networking, and software over the Internet.";
        } else if (msgLower.includes("virtual machine") || msgLower.includes("vm")) {
            reply = "A virtual machine (VM) is a software-based computer that runs on a physical machine and behaves like a separate computer.";
        } else if (msgLower.includes("azure")) {
            reply = "Microsoft Azure is a cloud computing platform that provides services like virtual machines, networking, storage, and databases.";
        } else if (msgLower.includes("network")) {
            reply = "A computer network is a group of connected devices that communicate with each other to share resources and information.";
        } else {
            reply = "I'm a chatbot running on an Azure Virtual Machine. You can ask me about cloud computing, Azure, virtual machines, and networks.";
        }
    }

	const logEntry = {
	    user: message,
	    bot: reply,
	    time: new Date()
    };

    fs.appendFileSync("chatlog.json", JSON.stringify(logEntry) + "\n");

    res.json({ reply });
});

// Start server
app.listen(PORT, () => {
    console.log(`Chatbot server is running on port ${PORT}`);
});
