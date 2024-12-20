const express = require('express');
const cors = require('cors');
const Pusher = require('pusher');
const pusher = new Pusher({
    appId: "1911417",
    key: "366d78f54727f5e9b7d1",
    secret: "eda2fe887b30a107b7c3",
    cluster: "eu",
    useTLS: true,
});
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.post("/pusher/auth", (req, res) => {
    const socketId = req.body.socket_id;
    const channel = req.body.channel_name;
    const authResponse = pusher.authorizeChannel(socketId, channel);
    res.send(authResponse);
});
const port = 8686;
app.listen(port);
