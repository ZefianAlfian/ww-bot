const P = require("pino");
const sess = "session.json";
const { useSingleFileAuthState } = require("@adiwajshing/baileys-md");
const { state, saveState } = useSingleFileAuthState(sess);
const { WAConn } = require("./lib/conn");

function startSock() {
  const conn = new WAConn({
    logger: P({ level: "silent" }),
    printQRInTerminal: true,
    auth: state,
  });

  const { sock } = conn;

  sock.ev.on("connection.update", (update) => {
    let qr = update.qr;
    qr && console.log("Scan QRCode");
  });
}

startSock();
