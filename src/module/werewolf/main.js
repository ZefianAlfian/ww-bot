const { room, rooms } = require("./rooms.js");

class werewolf {
  splitLineTextGroup(linetext) {
    let textArr = linetext.split("-");
    return textArr;
  }

  splitLineTextPerson(linetext) {
    let textArr = linetext.split("@");
    return textArr;
  }

  createGame(userId, groupId) {
    try {
      const create = room.createRoom(userId, groupId);
      return create;
    } catch (e) {
      throw e;
    }
  }

  addPlayer(linetext) {
    let res = this.splitLineTextGroup(linetext);
    try {
      room.addPlayer(res[0], res[1]);
    } catch (e) {
      throw e;
    }
    let msg = `${res[0]} berhasil join ke dalam permainan`;
    return msg;
  }

  listPlayers(linetext) {
    let res = this.splitLineTextGroup(linetext);
    let msg = "";
    try {
      msg = room.listPlayers(res[1]);
    } catch (e) {
      throw e;
    }
    return msg;
  }

  showRooms() {
    console.log(rooms);
  }
}

module.exports = new werewolf();
