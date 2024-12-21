import * as express from 'express';
import * as cors from 'cors';
import * as Pusher from 'pusher';
const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_APP_KEY,
    secret: process.env.PUSHER_APP_SECRET_KEY,
    cluster: process.env.PUSHER_APP_CLUSTER,
    useTLS: true,
});
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.post('/pusher/auth', (req, res) => {
    const socketId = req.body.socket_id;
    const channel = req.body.channel_name;
    const authResponse = pusher.authorizeChannel(socketId, channel);
    res.send(authResponse);
});
const port = 8686;
app.listen(port);
