const {
  default: makeWASocket,
  decryptMediaMessageBuffer,
  DisconnectReason,
  proto,
} = require("@adiwajshing/baileys-md");
const { Collection } = require("@discordjs/collection");
const fs = require("fs");
const path = require("path");
const didYouMean = require("didyoumean");
const prefix = "/";

module.exports.WAConn = class {
  constructor(args) {
    if (!global.conn) global.conn = {};
    this.setting = {
      prefix: ["/", "\\", "$"],
      owner: ["6289694553246"],
    };
    let startSock = () => {
      this.sock = makeWASocket(args);

      this.sock.ev.on("messages.upsert", async (M) => {
        const m = M.messages[0];
        if (M.type === "notify") {
          if (!m.message) return;
          delete m.message?.messageContextInfo;
          if (Object.keys(m.message).length == 0) return;

          let jid = m.key.remoteJid;
          this.sendMessage = this.sock.sendMessage;
          jid && (await this.sock.presenceSubscribe(jid));
          await this.sock.sendReadReceipt(
            jid,
            m.key.participant || m.key.remoteJid,
            [m.key.id]
          );
          if (m.key) {
            m.id = m.key.id;
            m.isBaileys = m.id.startsWith("3EB0") && m.id.length === 12;
            m.chat = m.key.remoteJid;
            m.fromMe = m.key.fromMe;
            m.isGroup = m.chat.endsWith("@g.us");
            m.sender = m.fromMe
              ? this.sock.user.id
              : m.participant
              ? m.participant
              : m.key.participant
              ? m.key.participant
              : m.chat;
          }
          if (m.message) {
            m.mtype = Object.keys(m.message)[0];
            m.msg = m.message[m.mtype];
            m.text = m.msg.text || m.msg.caption || m.msg || "";
            let quoted = (m.quoted = m.msg.contextInfo
              ? m.msg.contextInfo.quotedMessage
              : null);
            m.mentionedJid = m.msg.contextInfo
              ? m.msg.contextInfo.mentionedJid
              : [];
            if (m.quoted) {
              let type = Object.keys(m.quoted)[0];
              m.quoted = m.quoted[type];
              if (["productMessage"].includes(type)) {
                type = Object.keys(m.quoted)[0];
                m.quoted = m.quoted[type];
              }
              if (typeof m.quoted === "string") m.quoted = { text: m.quoted };
              m.quoted.mtype = type;
              m.quoted.id = m.msg.contextInfo.stanzaId;
              m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat;
              m.quoted.isBaileys = m.quoted.id
                ? m.quoted.id.startsWith("3EB0") && m.quoted.id.length === 12
                : false;
              m.quoted.sender = m.msg.contextInfo.participant;
              m.quoted.fromMe =
                m.quoted.sender === (conn.user && conn.user.jid);
              m.quoted.text = m.quoted.text || m.quoted.caption || "";
              m.quoted.mentionedJid = m.quoted.contextInfo
                ? m.quoted.contextInfo.mentionedJid
                : [];
            }
          }
          const { text, mtype } = m;
          const body =
            mtype === "conversation" && text.startsWith(prefix)
              ? text
              : (mtype === "imageMessage" || mtype === "videoMessage") &&
                text &&
                text.startsWith(prefix)
              ? text
              : mtype === "ephemeralMessage" && text.startsWith(prefix)
              ? text
              : mtype === "extendedTextMessage" && text.startsWith(prefix)
              ? text
              : "";

          const argv = body.slice(1).trim().split(/ +/).shift().toLowerCase();
          const args = body.trim().split(/ +/).slice(1);

          this.commands = new Collection();
          this.mean = [];
          this.aliases = new Collection();

          fs.readdirSync(path.join(__dirname + "/../commands")).forEach(
            (dir) => {
              const commands = fs
                .readdirSync(path.join(__dirname + `/../commands/${dir}`))
                .filter((file) => file.endsWith(".js"));
              for (let file of commands) {
                let pull = require(`../commands/${dir}/${file}`);
                if (pull.name) {
                  this.mean.push(pull.name);
                  this.commands.set(pull.name, pull);
                } else {
                  continue;
                }
                if (pull.aliases && Array.isArray(pull.aliases))
                  pull.aliases.forEach((alias) =>
                    this.aliases.set(alias, pull.name)
                  );
              }
            }
          );

          let command = this.commands.get(argv);
          if (!command) command = this.commands.get(this.aliases.get(argv));

          if (
            this.mean.includes(didYouMean(argv, this.mean)) &&
            !this.mean.includes(argv)
          ) {
            this.reply(
              m.chat,
              `Mungkin yang anda maksud adalah ${prefix}${didYouMean(
                argv,
                this.mean
              )}`,
              m
            );
          }
          if (command) {
            command.run(this, m, args);
          }
          //   if (argv) {
          //     this.reply(m.chat, `${argv}`);
          //   }
        }
      });

      this.sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection == "open") {
          this.id = this.sock.user.id;
          console.log("CONNECTED: " + this.id);
          global.conn[this.id] = this;
          this.sock.sendMessage(this.id, { text: "BOT connected" });
        }
        if (connection === "close") {
          // reconnect if not logged out
          if (
            lastDisconnect?.error?.output?.statusCode !==
            DisconnectReason.loggedOut
          ) {
            startSock();
            // log("connection closed");
          } else {
            console.log("connection closed");
          }
        }
      });
    };
    startSock();
  }

  stop() {
    this.sock.end(new Error("Connection closed"));
  }

  reply(jid, text, quoted) {
    return this.sock.sendMessage(jid, { text: text }, { quoted: quoted });
  }

  downloadMedia(message) {
    return new Promise(async (resolve, reject) => {
      let arr = [];
      (await decryptMediaMessageBuffer(message))
        .on("data", (e) => {
          arr.push(e);
        })
        .on("end", () => {
          resolve(Buffer.concat(arr));
        })
        .on("error", (e) => {
          reject("Error when tring to download media\n" + String(e));
        });
    });
  }

  sendImage(jid, image, caption, quoted) {
    return this.sock.sendMessage(
      jid,
      { image: image, caption: caption },
      { quoted: quoted }
    );
  }

  sendSticker(jid, sticker, caption, quoted) {
    return this.sock.sendMessage(
      jid,
      { sticker: sticker, caption: caption, mimetype: "image/webp" },
      { quoted: quoted }
    );
  }

  sendAudio(jid, audio, caption, quoted) {
    return this.sock.sendMessage(
      jid,
      { audio: audio, caption: caption, mimetype: "audio/mpeg" },
      { quoted: quoted }
    );
  }

  sendVideo(jid, video, caption, quoted) {
    return this.sock.sendMessage(
      jid,
      { video: video, caption: caption, mimetype: "video/mp4" },
      { quoted: quoted }
    );
  }
};
