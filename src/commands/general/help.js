module.exports = {
  name: "help",
  aliases: ["h"],
  cooldown: 1000 * 10,
  description: "Shows all available bot commands.",

  run: async (conn, m, args) => {
    const templateButtons = [
      {
        index: 1,
        urlButton: {
          displayText: "❤ Follow me",
          url: "https://instagram.com/mrizqirmdhn_",
        },
      },
    ];

    let msg = "Hello";

    const templateMessage = {
      text: msg,
      footer: "@mrizqirmdhn_",
      templateButtons: templateButtons,
    };
    conn.sendMessage(m.chat, templateMessage);
  },
};
