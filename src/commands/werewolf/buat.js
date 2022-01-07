const main = require("../../module/werewolf/main");
module.exports = {
  name: "buat",
  aliases: ["create"],
  cooldown: 1000 * 10,
  description: "Create werewolf rooms.",

  run: async (conn, m, args) => {
    if (!m.isGroup) {
      return conn.reply(m.chat, "Only group", m);
    }
    const msg = main.createGame(m.sender, m.chat);
    await conn.reply(m.chat, `${msg}`, m);
  },
};
