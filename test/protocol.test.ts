import assert from "node:assert/strict";
import test from "node:test";
import { EVENT_CATALOG } from "../src/events.js";
import {
  decodePacket,
  encodePacket,
  messageDataToBytes,
  PacketStreamParser,
} from "../src/protocol.js";

const separator = "\x0c";

function rawPacket(opcode: string, payload: string) {
  const parser = new PacketStreamParser();
  const batch = parser.push(encodePacket(opcode, payload));
  assert.equal(batch.errors.length, 0);
  assert.equal(batch.packets.length, 1);
  return batch.packets[0]!;
}

void test("uses UTF-8 byte lengths and parses split packets", () => {
  const encoded = encodePacket("0005", `${separator}한글😀${separator}user`);
  const declaredLength = Number(new TextDecoder().decode(encoded.slice(6, 12)));
  assert.equal(
    declaredLength,
    new TextEncoder().encode(`${separator}한글😀${separator}user`).length,
  );

  const parser = new PacketStreamParser();
  assert.equal(parser.push(encoded.slice(0, 7)).packets.length, 0);
  assert.equal(parser.push(encoded.slice(7, 16)).packets.length, 0);
  const result = parser.push(encoded.slice(16));
  assert.equal(result.packets[0]?.fields[0], "한글😀");
});

void test("parses multiple packets and recovers after garbage", () => {
  const first = encodePacket("0000");
  const second = encodePacket("9999", `${separator}future`);
  const combined = new Uint8Array(3 + first.length + second.length);
  combined.set([1, 2, 3]);
  combined.set(first, 3);
  combined.set(second, 3 + first.length);

  const result = new PacketStreamParser().push(combined);
  assert.equal(result.errors.length, 1);
  assert.deepEqual(
    result.packets.map((packet) => packet.opcode),
    ["0000", "9999"],
  );
  assert.equal(decodePacket(result.packets[1]!).type, "unknown");
});

void test("accepts every WebSocket message data representation", async () => {
  const value = "hello😀";
  const bytes = new TextEncoder().encode(value);
  assert.equal(new TextDecoder().decode(await messageDataToBytes(value)), value);
  assert.equal(new TextDecoder().decode(await messageDataToBytes(bytes.buffer)), value);
  assert.equal(new TextDecoder().decode(await messageDataToBytes(bytes)), value);
  assert.equal(new TextDecoder().decode(await messageDataToBytes(new Blob([bytes]))), value);
});

void test("catalog exposes 101 known opcodes plus the unknown variant", () => {
  const definitions = Object.values(EVENT_CATALOG);
  assert.equal(definitions.length, 101);
  assert.equal(new Set(definitions.map((definition) => definition.type)).size, 101);

  const specializedPayloads: Partial<Record<string, string>> = {
    "0001": `${separator}user${separator}16|0`,
    "0002": `${separator}123${separator}bj${separator}1${separator}10${separator}2]family${separator}ignored${separator}16|0`,
    "0003": `${separator}ignored${separator}ignored${separator}2${separator}3${separator}admin${separator}bannedBj${separator}bannedNick`,
    "0004": `${separator}1${separator}user${separator}nickname${separator}16`,
    "0005": `${separator}message${separator}sender${separator}${separator}1${separator}2${separator}nickname${separator}flag${separator}12`,
    "0007": `${separator}0${separator}`,
    "0008": `${separator}user${separator}ignored${separator}30${separator}1${separator}ignored${separator}1${separator}manager${separator}nickname`,
    "0009": `${separator}message${separator}sender${separator}receiver${separator}3${separator}2${separator}senderNick${separator}receiverNick${separator}1|0`,
    "0012": `${separator}16${separator}user${separator}nickname${separator}0${separator}0${separator}0`,
    "0013": `${separator}user${separator}256${separator}0${separator}nickname`,
    "0014": `${separator}user${separator}newNickname${separator}1${separator}16${separator}oldNickname`,
    "0018": `${separator}bj${separator}sender${separator}nickname${separator}10${separator}2${separator}${separator}${separator}file${separator}1${separator}3${separator}google_tts${separator}synthetic-id${separator}ko_KR${separator}123`,
    "0020": `${separator}bj${separator}bjNick${separator}sender${separator}senderNick${separator}ignored${separator}1${separator}ignored${separator}10${separator}2${separator}ignored${separator}ignored${separator}ko_KR`,
    "0021": `${separator}1${separator}ignored${separator}528${separator}1${separator}1`,
    "0023": `${separator}5${separator}10`,
    "0026": `${separator}message${separator}sender${separator}1${separator}ignored${separator}nickname${separator}512${separator}3`,
    "0033": `${separator}ignored${separator}bj${separator}bjNick${separator}sender${separator}senderNick${separator}10${separator}2${separator}ignored${separator}file${separator}1${separator}3${separator}google_tts${separator}synthetic-id${separator}ko_KR${separator}123`,
    "0034": `${separator}ignored${separator}bj${separator}bjNick${separator}sender${separator}senderNick${separator}ignored${separator}1${separator}ignored${separator}10${separator}2${separator}ignored${separator}ko_KR`,
    "0037": `${separator}ignored${separator}bj${separator}sender${separator}senderNick${separator}10`,
    "0038": `${separator}ignored${separator}bj${separator}sender${separator}senderNick${separator}10`,
    "0045": `${separator}ignored${separator}sender${separator}senderNick${separator}receiver${separator}receiverNick${separator}1`,
    "0047": `${separator}ignored${separator}bj${separator}itemType${separator}120`,
    "0050": `${separator}1${separator}bj${separator}123${separator}1`,
    "0054": `${separator}replacement${separator}word1,word2`,
    "0058": `${separator}admin notice`,
    "0070": `${separator}ignored${separator}1${separator}bj${separator}ignored${separator}buyer${separator}buyerNick${separator}goods${separator}2`,
    "0071": `${separator}ignored${separator}1${separator}bj${separator}ignored${separator}buyer${separator}buyerNick${separator}goods${separator}2`,
    "0074": `${separator}1${separator}bj${separator}vr${separator}rtmp${separator}hls${separator}2`,
    "0075": `${separator}0`,
    "0076": `${separator}1${separator}user${separator}nickname`,
    "0077": `${separator}user${separator}nickname${separator}time${separator}manager${separator}managerNick${separator}256|1024`,
    "0078": `${separator}1${separator}user${separator}nickname${separator}256|0`,
    "0086": `${separator}bj${separator}sender${separator}nickname${separator}2894${separator}file${separator}0${separator}123${separator}ko_KR${separator}456`,
    "0087": `${separator}123${separator}bj${separator}sender${separator}nickname${separator}message${separator}secondary${separator}title${separator}image${separator}default${separator}10${separator}20${separator}1${separator}0${separator}0${separator}${separator}${separator}ko_KR${separator}456`,
    "0090": `${separator}123${separator}0`,
    "0091": `${separator}123${separator}receiver${separator}sender${separator}nickname${separator}111${separator}ignored${separator}ignored${separator}2${separator}ignored${separator}ko_KR${separator}456`,
    "0092": `${separator}123${separator}bj${separator}sender${separator}nickname${separator}message${separator}secondary${separator}title${separator}image${separator}default${separator}10`,
    "0093": `${separator}bj${separator}sender${separator}nickname${separator}4${separator}123${separator}100${separator}8${separator}1${separator}synthetic-id${separator}ko_KR${separator}456`,
    "0095": `${separator}1${separator}2${separator}translated${separator}3${separator}4`,
    "0102": `${separator}ignored${separator}sender${separator}senderNick${separator}receiver${separator}receiverNick${separator}ticket`,
    "0103": `${separator}bj${separator}sender${separator}nickname${separator}10${separator}image${separator}title${separator}123${separator}ko_KR${separator}456`,
    "0104": `${separator}unused${separator}1${separator}unused${separator}notice`,
    "0105": `${separator}1${separator}bj${separator}sender${separator}nickname${separator}10${separator}2${separator}${separator}3${separator}relay${separator}${separator}${separator}${separator}file${separator}1`,
    "0107": `${separator}bj${separator}sender${separator}nickname${separator}10${separator}image${separator}title${separator}123${separator}ko_KR${separator}456`,
    "0108": `${separator}unused${separator}sender${separator}senderNick${separator}receiver${separator}receiverNick${separator}subId${separator}subNick${separator}1${separator}code${separator}1${separator}type${separator}period${separator}3${separator}4`,
    "0109": `${separator}1${separator}${separator}group${separator}sub${separator}1${separator}user${separator}nickname${separator}flag${separator}1122867${separator}-1${separator}0${separator}png${separator}4${separator}123456${separator}654321${separator}8${separator}-1${separator}0${separator}-1`,
    "0111": `${separator}ignored${separator}bj${separator}drop${separator}message${separator}image`,
    "0118": `${separator}ignored${separator}sender${separator}senderNick${separator}receiver${separator}receiverNick${separator}title${separator}image`,
    "0119": `${separator}{"ad":"synthetic"}`,
    "0120": `${separator}ignored${separator}receiver${separator}receiverNick${separator}item`,
    "0121": `${separator}{"type":"CHALLENGE_NOTICE","title":"synthetic"}`,
    "0122": `${separator}{"caption":"synthetic"}`,
    "0125": `${separator}{"fanOrder":10,"list":[["user","nickname",500,0,0]]}`,
    "0126": `${separator}1|1024`,
    "0127": `${separator}user${separator}p=3&fw=4&afw=8`,
    "0130": `${separator}unused${separator}unused${separator}unused${separator}unused${separator}12`,
    "0131": `${separator}unused${separator}streamer${separator}user${separator}123`,
    "0136": `${separator}1${separator}streamer${separator}ko${separator}subtitle${separator}123`,
    "0138": `${separator}2${separator}sender`,
    "0139": `${separator}{"caption":"synthetic"}`,
    "0140": `${separator}user${separator}3`,
    "0141": `${separator}user${separator}nickname${separator}2${separator}123${separator}message${separator}60${separator}flag`,
  };

  for (const [opcode, definition] of Object.entries(EVENT_CATALOG)) {
    const event = decodePacket(rawPacket(opcode, specializedPayloads[opcode] ?? separator));
    assert.equal(event.type, definition.type, opcode);
    assert.equal(event.opcode, opcode);
  }
});

void test("decodes chat, subscription, broadcaster status, and current player fields", () => {
  const joined = decodePacket(
    rawPacket(
      "0004",
      `${separator}1${separator}user1${separator}nick1${separator}16${separator}user2${separator}nick2${separator}32`,
    ),
  );
  assert.equal(joined.type, "chatUser");
  if (joined.type === "chatUser" && joined.data.action === "join") {
    assert.partialDeepStrictEqual(joined.data.users[0], {
      userId: "user1",
      nickname: "nick1",
      userFlag: "16",
    });
    assert.equal(joined.data.users[0]?.userStatus.isGuest, true);
    assert.equal(joined.data.users[1]?.userStatus.isFan, true);
  }

  const left = decodePacket(
    rawPacket(
      "0004",
      `${separator}-1${separator}user${separator}nick${separator}2${separator}etc${separator}16`,
    ),
  );
  assert.equal(left.type, "chatUser");
  if (left.type === "chatUser" && left.data.action === "leave") {
    assert.equal(left.data.userId, "user");
    assert.equal(left.data.quitFlag, 2);
    assert.equal(left.data.etcInfo, "etc");
    assert.equal(left.data.isKicked, true);
  }

  const normallyLeft = decodePacket(
    rawPacket(
      "0004",
      `${separator}-1${separator}user${separator}nick${separator}1${separator}-1${separator}16`,
    ),
  );
  assert.equal(normallyLeft.type, "chatUser");
  if (normallyLeft.type === "chatUser" && normallyLeft.data.action === "leave") {
    assert.equal(normallyLeft.data.isKicked, false);
  }

  const chat = decodePacket(
    rawPacket(
      "0005",
      `${separator}hello${separator}user${separator}${separator}1${separator}2${separator}nick${separator}flag${separator}9`,
    ),
  );
  assert.equal(chat.type, "chatMessage");
  if (chat.type === "chatMessage") {
    assert.equal(chat.data.message, "hello");
    assert.equal(chat.data.senderNickname, "nick");
  }

  const statusChat = decodePacket(
    rawPacket(
      "0005",
      `${separator}status${separator}user${separator}${separator}1${separator}2${separator}nick${separator}1622901|34090016${separator}9`,
    ),
  );
  assert.equal(statusChat.type, "chatMessage");
  if (statusChat.type === "chatMessage")
    assert.deepEqual(statusChat.data.senderStatus, {
      flag1: 1622901,
      flag2: 34090016,
      isAdmin: true,
      isBJ: true,
      isManager: true,
      isFixedManager: true,
      isTopFan: true,
      isFan: true,
      isSupporter: true,
      isWhisperAllowed: true,
      isFollower: true,
      followerTier: 2,
      isGuest: true,
      hasAppliedQuickview: true,
      isMobile: true,
      isFemale: true,
      isHideSex: true,
      isAtagAllow: true,
      isEmployee: true,
      isEmployeeAdminChat: true,
      isCleanAti: true,
    });

  const dumb = decodePacket(
    rawPacket(
      "0008",
      `${separator}target${separator}ignored${separator}30${separator}2${separator}streamer${separator}1${separator}${separator}targetNick`,
    ),
  );
  assert.equal(dumb.type, "setDumb");
  if (dumb.type === "setDumb") {
    assert.equal(dumb.data.targetNickname, "targetNick");
    assert.equal(dumb.data.durationSeconds, 30);
    assert.equal(dumb.data.muteCount, 2);
    assert.equal(dumb.data.commanderId, "streamer");
    assert.equal(dumb.data.commanderRole, "streamer");
    assert.equal(dumb.data.commanderLabel, "");
  }

  const userFlag = decodePacket(
    rawPacket(
      "0012",
      `${separator}196640|425984${separator}user${separator}nick${separator}0${separator}0${separator}65536|163840`,
    ),
  );
  assert.equal(userFlag.type, "setUserFlag");
  if (userFlag.type === "setUserFlag") {
    assert.equal(userFlag.data.previousUserFlag, "65536|163840");
    assert.equal(userFlag.data.flag1, 196640);
    assert.equal(userFlag.data.flag2, 425984);
    assert.equal(userFlag.data.previousFlag1, 65536);
    assert.equal(userFlag.data.previousFlag2, 163840);
    assert.equal(userFlag.data.isFanClub, true);
    assert.equal(userFlag.data.wasFanClub, false);
    assert.equal(userFlag.data.isFollower, true);
    assert.equal(userFlag.data.wasFollower, false);
    assert.equal(userFlag.data.followerTier, 1);
    assert.equal(userFlag.data.previousFollowerTier, 0);
    assert.equal(userFlag.data.userStatus.isWhisperAllowed, false);
    assert.equal(userFlag.data.previousUserStatus.isWhisperAllowed, true);
  }

  for (const [flag2, tier] of [
    [0, 0],
    [1 << 18, 1],
    [1 << 19, 2],
    [1 << 20, 3],
  ] as const) {
    const event = decodePacket(
      rawPacket(
        "0012",
        `${separator}0|${flag2}${separator}user${separator}nick${separator}0${separator}0${separator}0|0`,
      ),
    );
    assert.equal(event.type, "setUserFlag");
    if (event.type === "setUserFlag") assert.equal(event.data.followerTier, tier);
  }

  const nickname = decodePacket(
    rawPacket(
      "0014",
      `${separator}user${separator}newNickname${separator}${separator}65536|163840${separator}oldNickname`,
    ),
  );
  assert.equal(nickname.type, "setNickname");
  if (nickname.type === "setNickname") {
    assert.equal(nickname.data.userId, "user");
    assert.equal(nickname.data.newNickname, "newNickname");
    assert.equal(nickname.data.oldNickname, "oldNickname");
    assert.equal(nickname.data.changeType, 0);
    assert.equal(nickname.data.userFlag, "65536|163840");
  }

  const ice = decodePacket(
    rawPacket("0021", `${separator}1${separator}1${separator}528${separator}1${separator}1`),
  );
  assert.equal(ice.type, "iceModeEx");
  if (ice.type === "iceModeEx") {
    assert.equal(ice.data.frozen, true);
    assert.equal(ice.data.allowedRoleMask, 528);
    assert.deepEqual(ice.data.allowedRoles, ["streamer", "manager"]);
    assert.equal(ice.data.balloonLimitCount, 1);
    assert.equal(ice.data.subscriptionLimitCount, 1);
  }

  const managerChat = decodePacket(
    rawPacket(
      "0026",
      `${separator}line1\rline2${separator}sender${separator}1${separator}ignored${separator}manager${separator}512${separator}3`,
    ),
  );
  assert.equal(managerChat.type, "managerChat");
  if (managerChat.type === "managerChat") {
    assert.equal(managerChat.data.message, "line1line2");
    assert.equal(managerChat.data.isAdmin, true);
  }

  for (const [itemType, quickViewProduct, durationDays] of [
    [1, "quickView", 30],
    [2, "quickView", 90],
    [3, "quickView", 365],
    [100, "quickViewPlus", 7],
    [101, "quickViewPlus", 30],
    [102, "quickViewPlus", 90],
    [103, "quickViewPlus", 365],
    [7, "unknown", null],
  ] as const) {
    const quickView = decodePacket(
      rawPacket(
        "0045",
        `${separator}ignored${separator}sender${separator}sNick${separator}receiver${separator}rNick${separator}${itemType}`,
      ),
    );
    assert.equal(quickView.type, "sendQuickView");
    if (quickView.type === "sendQuickView") {
      assert.equal(quickView.data.itemType, itemType);
      assert.equal(quickView.data.quickViewProduct, quickViewProduct);
      assert.equal(quickView.data.durationDays, durationDays);
    }
  }

  const poll = decodePacket(
    rawPacket("0050", `${separator}1${separator}bj${separator}123${separator}1`),
  );
  assert.equal(poll.type, "notifyPoll");
  if (poll.type === "notifyPoll") {
    assert.equal(poll.data.pollNo, 123);
    assert.equal(poll.data.pollState, "started");
    assert.equal(poll.data.visible, true);
  }
  const closedPoll = decodePacket(
    rawPacket("0050", `${separator}4${separator}bj${separator}123${separator}1`),
  );
  const hiddenPoll = decodePacket(
    rawPacket("0050", `${separator}2${separator}bj${separator}123${separator}0`),
  );
  if (closedPoll.type === "notifyPoll") assert.equal(closedPoll.data.pollState, "closed");
  if (hiddenPoll.type === "notifyPoll") {
    assert.equal(hiddenPoll.data.pollState, "hidden");
    assert.equal(hiddenPoll.data.visible, false);
  }

  const banned = decodePacket(rawPacket("0054", `${separator}replacement${separator}word1,word2`));
  assert.equal(banned.type, "banWord");
  if (banned.type === "banWord") assert.equal(banned.data.banWordList, "word1,word2");

  const balloon = decodePacket(
    rawPacket(
      "0018",
      `${separator}bj${separator}user${separator}nick${separator}10${separator}0${separator}0${separator}123${separator}10${separator}0${separator}1${separator}google_tts${separator}synthetic-id${separator}ko_KR${separator}456`,
    ),
  );
  assert.equal(balloon.type, "sendBalloon");
  if (balloon.type === "sendBalloon") {
    assert.equal(balloon.data.count, 10);
    assert.equal(balloon.data.becameFanClub, false);
    assert.equal(balloon.data.topFanLevel, 1);
    assert.equal(balloon.data.becameTopFan, true);
    assert.equal(balloon.data.ttsData, "google_tts");
    assert.equal(balloon.data.senderLanguage, "ko_KR");
    assert.equal(balloon.data.urlModify, "456");
  }

  const manager = decodePacket(
    rawPacket(
      "0013",
      `${separator}user${separator}269025632|688128${separator}1${separator}manager`,
    ),
  );
  assert.equal(manager.type, "setSubBj");
  if (manager.type === "setSubBj") {
    assert.equal(manager.data.nickname, "manager");
    assert.equal(manager.data.hidden, true);
    assert.equal(manager.data.flag1, 269025632);
    assert.equal(manager.data.flag2, 688128);
    assert.equal(manager.data.isManager, true);
    assert.equal(manager.data.isFixedManager, true);
    assert.equal(manager.data.isEmployee, false);
  }

  const adminNotice = decodePacket(rawPacket("0058", `${separator}운영자 공지`));
  assert.equal(adminNotice.type, "sendAdminNotice");
  if (adminNotice.type === "sendAdminNotice") assert.equal(adminNotice.data.message, "운영자 공지");

  const vodBalloon = decodePacket(
    rawPacket(
      "0086",
      `${separator}bj${separator}sender${separator}nickname${separator}2894${separator}bj_2894${separator}0${separator}7373${separator}ko_KR${separator}456`,
    ),
  );
  assert.equal(vodBalloon.type, "vodBalloon");
  if (vodBalloon.type === "vodBalloon") {
    assert.equal(vodBalloon.data.senderNickname, "nickname");
    assert.equal(vodBalloon.data.balloonCount, 2894);
    assert.equal(vodBalloon.data.fileName, "bj_2894");
    assert.equal(vodBalloon.data.isDefault, false);
    assert.equal(vodBalloon.data.chatNo, "7373");
    assert.equal(vodBalloon.data.senderLanguage, "ko_KR");
    assert.equal(vodBalloon.data.urlModify, "456");
  }

  const adcon = decodePacket(
    rawPacket(
      "0087",
      `${separator}123${separator}bj${separator}user${separator}nick${separator}message${separator}secondary${separator}title${separator}image${separator}default${separator}10${separator}20${separator}1${separator}0${separator}0${separator}${separator}${separator}ko_KR${separator}456`,
    ),
  );
  assert.equal(adcon.type, "adconEffect");
  if (adcon.type === "adconEffect") {
    assert.equal(adcon.data.count, 10);
    assert.equal(adcon.data.becameFanClub, true);
    assert.equal(adcon.data.isTopFan, true);
    assert.equal(adcon.data.senderLanguage, "ko_KR");
  }

  const follow = decodePacket(
    rawPacket(
      "0093",
      `${separator}bj${separator}user${separator}nick${separator}4${separator}123${separator}100${separator}8${separator}1${separator}synthetic-id${separator}ko_KR${separator}456`,
    ),
  );
  assert.equal(follow.type, "followItemEffect");
  if (follow.type === "followItemEffect") {
    assert.equal(follow.data.month, 4);
    assert.equal(follow.data.accumulatedMonth, 8);
    assert.equal(follow.data.tier, 1);
    assert.equal(follow.data.subscriptionTier, "basic");
    assert.equal(follow.data.senderLanguage, "ko_KR");
  }

  const plusFollow = decodePacket(
    rawPacket(
      "0093",
      `${separator}bj${separator}user${separator}nick${separator}25${separator}123${separator}201${separator}25${separator}2${separator}synthetic-id${separator}ko_KR${separator}456`,
    ),
  );
  assert.equal(plusFollow.type, "followItemEffect");
  if (plusFollow.type === "followItemEffect") {
    assert.equal(plusFollow.data.subscriptionTier, "plus");
    assert.partialDeepStrictEqual(plusFollow.data.subscriptionProduct, {
      itemType: 201,
      subscriptionTier: "plus",
      month: 1,
    });
  }

  const kickMessageState = decodePacket(rawPacket("0090", `${separator}123${separator}1`));
  assert.equal(kickMessageState.type, "kickMsgState");
  if (kickMessageState.type === "kickMsgState")
    assert.equal(kickMessageState.data.hideKickMessage, true);

  const translated = decodePacket(
    rawPacket("0095", `${separator}7${separator}1${separator}translated${separator}2${separator}3`),
  );
  assert.equal(translated.type, "translation");
  if (translated.type === "translation") {
    assert.equal(translated.data.messageIndex, 7);
    assert.equal(translated.data.message, "translated");
  }

  const ticket = decodePacket(
    rawPacket(
      "0102",
      `${separator}ignored${separator}sender${separator}sNick${separator}receiver${separator}rNick${separator}ticket-data`,
    ),
  );
  assert.equal(ticket.type, "giftTicket");
  if (ticket.type === "giftTicket") assert.equal(ticket.data.ticketData, "ticket-data");

  const gift = decodePacket(
    rawPacket(
      "0108",
      `${separator}unused${separator}sender${separator}sNick${separator}receiver${separator}rNick${separator}streamer${separator}streamerNick${separator}11${separator}code${separator}0${separator}0${separator}${separator}0${separator}0`,
    ),
  );
  assert.equal(gift.type, "sendSubscription");
  if (gift.type === "sendSubscription") {
    assert.equal(gift.data.receiverNickname, "rNick");
    assert.equal(gift.data.broadcasterId, "streamer");
    assert.equal(gift.data.subscriptionTier, "basic");
    assert.equal(gift.data.subscriptionMonth, 1);
  }

  const video = decodePacket(
    rawPacket(
      "0105",
      `${separator}1${separator}bj${separator}sender${separator}nickname${separator}50${separator}2${separator}${separator}0${separator}0${separator}${separator}${separator}${separator}${separator}1`,
    ),
  );
  assert.equal(video.type, "videoBalloon");
  if (video.type === "videoBalloon") assert.equal(video.data.becameFanClub, true);

  const stationAdcon = decodePacket(
    rawPacket(
      "0107",
      `${separator}bj${separator}sender${separator}nickname${separator}2${separator}image${separator}방송국에서 nickname님이 애드벌룬 2개를 선물 하셨습니다.${separator}123${separator}ko_KR${separator}456`,
    ),
  );
  assert.equal(stationAdcon.type, "stationAdcon");
  if (stationAdcon.type === "stationAdcon")
    assert.partialDeepStrictEqual(stationAdcon.data, {
      senderNickname: "nickname",
      count: 2,
      title: "방송국에서 nickname님이 애드벌룬 2개를 선물 하셨습니다.",
      chatNo: "123",
    });

  const battleMission = decodePacket(
    rawPacket("0121", `${separator}{"type":"NOTICE","uuid":"synthetic"}`),
  );
  assert.equal(battleMission.type, "mission");
  if (battleMission.type === "mission") {
    assert.equal(battleMission.data.missionKind, "battle");
    assert.equal(battleMission.data.action, "notice");
  }

  const challengeGift = decodePacket(
    rawPacket(
      "0121",
      `${separator}{"type":"CHALLENGE_GIFT","key":123,"uuid":"gift-event","title":"미션","gift_count":500,"chno":456,"is_relay":false,"image":"gift-image","user_id":"sender","user_nick":"senderNick","bj_id":"bj","bj_nick":"bjNick"}`,
    ),
  );
  assert.equal(challengeGift.type, "mission");
  if (
    challengeGift.type === "mission" &&
    challengeGift.data.missionKind === "challenge" &&
    challengeGift.data.action === "gift"
  ) {
    assert.equal(challengeGift.data.title, "미션");
    assert.equal(challengeGift.data.giftCount, 500);
    assert.equal(challengeGift.data.missionKey, 123);
    assert.equal(challengeGift.data.uuid, "gift-event");
    assert.equal(challengeGift.data.chatNo, 456);
    assert.equal(challengeGift.data.senderNickname, "senderNick");
    assert.equal(challengeGift.data.broadcasterNickname, "bjNick");
    assert.equal(challengeGift.data.image, "gift-image");
    assert.equal(challengeGift.data.isRelay, false);
  }

  const challengeNotice = decodePacket(
    rawPacket(
      "0121",
      `${separator}{"type":"CHALLENGE_NOTICE","key":123,"uuid":"notice-event","title":"미션","mission_status":"SUCCESS"}`,
    ),
  );
  assert.equal(challengeNotice.type, "mission");
  if (
    challengeNotice.type === "mission" &&
    challengeNotice.data.missionKind === "challenge" &&
    challengeNotice.data.action === "notice"
  ) {
    assert.equal(challengeNotice.data.status, "success");
    assert.equal(challengeNotice.data.missionKey, 123);
  }

  const challengeSettle = decodePacket(
    rawPacket(
      "0121",
      `${separator}{"type":"CHALLENGE_SETTLE","key":123,"uuid":"settle-event","title":"미션","settle_count":1000,"is_relay":false,"image":"settle-image","bj_id":"bj","bj_nick":"bjNick"}`,
    ),
  );
  assert.equal(challengeSettle.type, "mission");
  if (
    challengeSettle.type === "mission" &&
    challengeSettle.data.missionKind === "challenge" &&
    challengeSettle.data.action === "settle"
  ) {
    assert.equal(challengeSettle.data.settleCount, 1000);
    assert.equal(challengeSettle.data.missionKey, 123);
    assert.equal(challengeSettle.data.uuid, "settle-event");
  }

  const missionSettle = decodePacket(
    rawPacket(
      "0125",
      `${separator}{"chno":456,"uuid":"settle-event","fanOrder":18002,"list":[["user","nickname",1000,1,0],["existing","existingNick",6850,0,0]]}`,
    ),
  );
  assert.equal(missionSettle.type, "missionSettle");
  if (missionSettle.type === "missionSettle") {
    assert.equal(missionSettle.data.chatNo, 456);
    assert.equal(missionSettle.data.uuid, "settle-event");
    assert.equal(missionSettle.data.fanOrder, 18002);
    assert.deepEqual(missionSettle.data.participants[0], {
      userId: "user",
      nickname: "nickname",
      contributionCount: 1000,
      becameFanClub: true,
      becameTopFan: false,
    });
    assert.equal(missionSettle.data.participants[1]?.becameFanClub, false);
  }

  const ogq = decodePacket(
    rawPacket(
      "0109",
      `${separator}123${separator}이미지와 함께 표시${separator}group${separator}20${separator}1${separator}user${separator}nickname${separator}flag${separator}1122867${separator}-1${separator}0${separator}png${separator}4${separator}123456${separator}654321${separator}8${separator}-1${separator}0${separator}-1`,
    ),
  );
  assert.equal(ogq.type, "ogqEmoticon");
  if (ogq.type === "ogqEmoticon") {
    assert.equal(ogq.data.message, "이미지와 함께 표시");
    assert.equal(ogq.data.senderNickname, "nickname");
    assert.equal(ogq.data.color, "#332211");
    assert.equal(ogq.data.extension, "png");
    assert.equal(ogq.data.cheerTeamNumber, -1);
  }

  const ogqGift = decodePacket(
    rawPacket(
      "0118",
      `${separator}ignored${separator}sender${separator}sNick${separator}receiver${separator}rNick${separator}title${separator}image`,
    ),
  );
  assert.equal(ogqGift.type, "ogqEmoticonGift");
  if (ogqGift.type === "ogqEmoticonGift") assert.equal(ogqGift.data.imageUrl, "image");

  const inBroadcastAd = decodePacket(rawPacket("0119", `${separator}{"ad":"synthetic"}`));
  assert.equal(inBroadcastAd.type, "adInBroadJson");
  if (inBroadcastAd.type === "adInBroadJson")
    assert.equal(inBroadcastAd.data.payload.ad, "synthetic");

  const gem = decodePacket(
    rawPacket(
      "0120",
      `${separator}ignored${separator}receiver${separator}rNick${separator}gem-item`,
    ),
  );
  assert.equal(gem.type, "gemItemSend");
  if (gem.type === "gemItemSend") assert.equal(gem.data.itemName, "gem-item");

  const extendedUsers = decodePacket(
    rawPacket(
      "0127",
      `${separator}user1${separator}p=3&fw=4&afw=8${separator}user2${separator}fw=-1&afw=-1`,
    ),
  );
  assert.equal(extendedUsers.type, "chuserExtend");
  if (extendedUsers.type === "chuserExtend") {
    assert.deepEqual(extendedUsers.data.users, [
      {
        userId: "user1",
        representativePersonalconMonth: 3,
        subscriptionMonth: 4,
        accumulatedSubscriptionMonth: 8,
      },
      {
        userId: "user2",
        representativePersonalconMonth: null,
        subscriptionMonth: -1,
        accumulatedSubscriptionMonth: -1,
      },
    ]);
  }

  const status = decodePacket(rawPacket("0007", `${separator}0${separator}`));
  assert.equal(status.type, "setBjStat");
  if (status.type === "setBjStat") assert.equal(status.data.status, 0);

  const subtitle = decodePacket(
    rawPacket(
      "0136",
      `${separator}1${separator}streamer${separator}ko${separator}안녕하세요${separator}123`,
    ),
  );
  assert.equal(subtitle.type, "globalSubtitle");
  if (subtitle.type === "globalSubtitle") assert.equal(subtitle.data.subtitle, "안녕하세요");

  const timeout = decodePacket(
    rawPacket(
      "0141",
      `${separator}user${separator}nickname${separator}2${separator}123${separator}message${separator}60${separator}flag`,
    ),
  );
  assert.equal(timeout.type, "nightbotTimeout");
  if (timeout.type === "nightbotTimeout") assert.equal(timeout.data.reasonCode, 2);
});

void test("decodes every field-reading official player branch", () => {
  const cases: readonly [string, string, string, Record<string, unknown>][] = [
    ["0001", `${separator}user${separator}16|0`, "login", { userId: "user", userFlag: "16|0" }],
    [
      "0002",
      `${separator}123${separator}bj${separator}1${separator}10${separator}2]family${separator}ignored${separator}16|0`,
      "joinChannel",
      {
        chatNo: "123",
        broadcasterId: "bj",
        maxManagerCount: 10,
        familyNickname: "family",
        familyNicknamePosition: 2,
      },
    ],
    [
      "0003",
      `${separator}ignored${separator}ignored${separator}2${separator}3${separator}admin${separator}bannedBj${separator}bannedNick`,
      "quitChannel",
      { kickType: 2, actor: "manager", adminKickCount: 3 },
    ],
    [
      "0009",
      `${separator}line1\rline2${separator}sender${separator}receiver${separator}3${separator}2${separator}senderNick${separator}receiverNick${separator}1|0`,
      "directChat",
      { message: "line1line2", senderId: "sender", receiverId: "receiver", isAdmin: true },
    ],
    [
      "0020",
      `${separator}bj${separator}bjNick${separator}sender${separator}senderNick${separator}ignored${separator}1${separator}ignored${separator}10${separator}2${separator}ignored${separator}ignored${separator}ko_KR`,
      "sendFanLetter",
      { broadcasterNickname: "bjNick", count: 10, relay: false },
    ],
    ["0023", `${separator}5${separator}10`, "slowMode", { automaticSeconds: 5, manualSeconds: 10 }],
    [
      "0033",
      `${separator}ignored${separator}bj${separator}bjNick${separator}sender${separator}senderNick${separator}10${separator}2${separator}ignored${separator}file${separator}1${separator}3${separator}tts${separator}ignored${separator}ko_KR${separator}456`,
      "sendBalloonSub",
      { broadcasterId: "bj", senderId: "sender", count: 10, relay: true },
    ],
    [
      "0034",
      `${separator}ignored${separator}bj${separator}bjNick${separator}sender${separator}senderNick${separator}ignored${separator}1${separator}ignored${separator}10${separator}2${separator}ignored${separator}ko_KR`,
      "sendFanLetterSub",
      { senderNickname: "senderNick", count: 10, relay: true },
    ],
    [
      "0037",
      `${separator}ignored${separator}bj${separator}sender${separator}senderNick${separator}10`,
      "chocolate",
      { broadcasterId: "bj", count: 10, relay: false },
    ],
    [
      "0038",
      `${separator}ignored${separator}bj${separator}sender${separator}senderNick${separator}10`,
      "chocolateSub",
      { count: 10, relay: true },
    ],
    [
      "0047",
      `${separator}ignored${separator}bj${separator}1${separator}121`,
      "itemUsing",
      { remainingSeconds: 121, remainingMinutes: 2 },
    ],
    [
      "0070",
      `${separator}ignored${separator}1${separator}bj${separator}ignored${separator}buyer${separator}buyerNick${separator}goods${separator}2`,
      "buyGoods",
      { goodsType: 1, buyerId: "buyer", goodsName: "goods", count: 2, relay: false },
    ],
    [
      "0071",
      `${separator}ignored${separator}1${separator}bj${separator}ignored${separator}buyer${separator}buyerNick${separator}goods${separator}2`,
      "buyGoodsSub",
      { count: 2, relay: true },
    ],
    [
      "0074",
      `${separator}1${separator}bj${separator}vr${separator}rtmp${separator}hls${separator}2`,
      "notifyVr",
      { action: 1, broadcasterId: "bj", vrType: 2 },
    ],
    ["0075", `${separator}0`, "notifyMobBroadPause", { state: 0, action: "pause" }],
    [
      "0076",
      `${separator}1${separator}user${separator}nickname`,
      "kickAndCancel",
      { cancelled: true, userId: "user" },
    ],
    [
      "0092",
      `${separator}123${separator}bj${separator}sender${separator}nickname${separator}message${separator}secondary${separator}title${separator}image${separator}default${separator}10`,
      "itemSellEffect",
      { chatNo: 123, title: "title", count: 10 },
    ],
    [
      "0103",
      `${separator}bj${separator}sender${separator}nickname${separator}10${separator}image${separator}title${separator}123${separator}ko_KR${separator}456`,
      "vodAdcon",
      { broadcasterId: "bj", chatNo: "123", count: 10 },
    ],
    [
      "0111",
      `${separator}ignored${separator}bj${separator}drop${separator}message${separator}image`,
      "itemDrops",
      { broadcasterId: "bj", name: "drop", imageUrl: "image" },
    ],
    ["0126", `${separator}1|1024`, "setAdminFlag", { userFlag: "1|1024" }],
  ];

  for (const [opcode, payload, type, expected] of cases) {
    const event = decodePacket(rawPacket(opcode, payload));
    assert.equal(event.type, type, opcode);
    assert.partialDeepStrictEqual(event.data, expected, opcode);
  }

  const kickList = decodePacket(
    rawPacket(
      "0077",
      `${separator}user${separator}nickname${separator}time${separator}manager${separator}managerNick${separator}256|1024`,
    ),
  );
  assert.equal(kickList.type, "kickUserList");
  if (kickList.type === "kickUserList")
    assert.partialDeepStrictEqual(kickList.data.users[0], {
      userId: "user",
      commanderPrimaryFlag: 256,
      commanderSecondaryFlag: 1024,
    });

  const adminUsers = decodePacket(
    rawPacket(
      "0078",
      `${separator}1${separator}adminCleanAti${separator}adminCleanAtiNick${separator}590339|165888${separator}fixedManager${separator}fixedManagerNick${separator}320|0${separator}employeeAdminChat${separator}employeeAdminChatNick${separator}0|9216`,
    ),
  );
  assert.equal(adminUsers.type, "adminChatUser");
  if (adminUsers.type === "adminChatUser") {
    assert.partialDeepStrictEqual(adminUsers.data.users[0], {
      userId: "adminCleanAti",
      isAdmin: true,
      isCleanAti: true,
    });
    assert.partialDeepStrictEqual(adminUsers.data.users[1], {
      userId: "fixedManager",
      isManager: true,
      isFixedManager: true,
    });
    assert.partialDeepStrictEqual(adminUsers.data.users[2], {
      userId: "employeeAdminChat",
      isEmployee: true,
      isEmployeeAdminChat: true,
    });
    assert.equal(adminUsers.data.users[2]?.userStatus.isEmployee, true);
  }

  const chat = decodePacket(
    rawPacket(
      "0005",
      `${separator}line1\rline2${separator}sender${separator}1122867${separator}0${separator}3${separator}nickname${separator}16|0${separator}4${separator}light${separator}dark${separator}8${separator}2${separator}ignored${separator}7`,
    ),
  );
  assert.equal(chat.type, "chatMessage");
  if (chat.type === "chatMessage")
    assert.partialDeepStrictEqual(chat.data, {
      message: "line1line2",
      color: "#332211",
      accumulatedSubscriptionMonth: "8",
      representativePersonalconMonth: "2",
      cheerTeamNumber: 7,
    });

  const follow = decodePacket(
    rawPacket(
      "0091",
      `${separator}123${separator}receiver${separator}sender${separator}nickname${separator}111${separator}ignored${separator}ignored${separator}1${separator}ignored${separator}ko_KR${separator}456`,
    ),
  );
  assert.equal(follow.type, "followItem");
  if (follow.type === "followItem")
    assert.partialDeepStrictEqual(follow.data, {
      tier: 1,
      subscriptionTier: "basic",
      subscriptionMonth: 1,
      senderLanguage: "ko_KR",
      urlModify: "456",
    });

  const battle = decodePacket(
    rawPacket(
      "0121",
      `${separator}{"type":"GIFT","title":"battle","gift_count":100,"is_relay":true,"image":"image","user_id":"sender","user_nick":"nickname","fan_order":10,"top_fan":2}`,
    ),
  );
  assert.equal(battle.type, "mission");
  if (
    battle.type === "mission" &&
    battle.data.missionKind === "battle" &&
    battle.data.action === "gift"
  )
    assert.partialDeepStrictEqual(battle.data, {
      giftCount: 100,
      senderId: "sender",
      fanOrder: 10,
      topFanLevel: 2,
    });

  const timeout = decodePacket(
    rawPacket(
      "0141",
      `${separator}user${separator}nickname${separator}4${separator}123${separator}message${separator}60${separator}flag`,
    ),
  );
  assert.equal(timeout.type, "nightbotTimeout");
  if (timeout.type === "nightbotTimeout") assert.equal(timeout.data.reason, "links");
});

void test("connects subscription item types to the official player product table", () => {
  const regularGift = decodePacket(
    rawPacket(
      "0108",
      `${separator}unused${separator}sender${separator}sNick${separator}receiver${separator}rNick${separator}streamer${separator}streamerNick${separator}103${separator}code${separator}0${separator}0${separator}${separator}0${separator}0`,
    ),
  );
  assert.equal(regularGift.type, "sendSubscription");
  if (regularGift.type === "sendSubscription") {
    assert.partialDeepStrictEqual(regularGift.data.subscriptionProduct, {
      subscriptionTier: "basic",
      level: 1,
      month: 3,
      isGift: true,
      isTrial: false,
      isLegacy: false,
    });
  }

  const trialGift = decodePacket(
    rawPacket(
      "0108",
      `${separator}unused${separator}sender${separator}sNick${separator}receiver${separator}rNick${separator}streamer${separator}streamerNick${separator}30${separator}code${separator}0${separator}0${separator}${separator}0${separator}0`,
    ),
  );
  assert.equal(trialGift.type, "sendSubscription");
  if (trialGift.type === "sendSubscription") {
    assert.partialDeepStrictEqual(trialGift.data.subscriptionProduct, {
      subscriptionTier: "plus",
      level: 1,
      month: 1,
      isCeremony: true,
      isTrial: true,
    });
  }

  const legacyGift = decodePacket(
    rawPacket(
      "0108",
      `${separator}unused${separator}sender${separator}sNick${separator}receiver${separator}rNick${separator}streamer${separator}streamerNick${separator}1${separator}code${separator}0${separator}0${separator}${separator}0${separator}0`,
    ),
  );
  assert.equal(legacyGift.type, "sendSubscription");
  if (legacyGift.type === "sendSubscription") {
    assert.partialDeepStrictEqual(legacyGift.data.subscriptionProduct, {
      month: 3,
      isLegacy: true,
      isCeremony: false,
      isGift: true,
    });
  }

  const legacySubscription = decodePacket(
    rawPacket(
      "0091",
      `${separator}123${separator}receiver${separator}sender${separator}nickname${separator}1${separator}ignored${separator}ignored${separator}1${separator}ignored${separator}ko_KR${separator}456`,
    ),
  );
  assert.equal(legacySubscription.type, "followItem");
  if (legacySubscription.type === "followItem") {
    assert.equal(legacySubscription.data.subscriptionSource, "live");
    assert.partialDeepStrictEqual(legacySubscription.data.subscriptionProduct, {
      month: 3,
      isLegacy: true,
      isCeremony: false,
      isGift: true,
    });
  }

  const plusSubscription = decodePacket(
    rawPacket(
      "0091",
      `${separator}123${separator}receiver${separator}sender${separator}nickname${separator}2413${separator}ignored${separator}ignored${separator}2${separator}ignored${separator}ko_KR${separator}456`,
    ),
  );
  assert.equal(plusSubscription.type, "followItem");
  if (plusSubscription.type === "followItem") {
    assert.partialDeepStrictEqual(plusSubscription.data.subscriptionProduct, {
      subscriptionTier: "plus",
      level: 4,
      month: 1,
      isGift: false,
    });
  }

  const vodSubscription = decodePacket(
    rawPacket(
      "0091",
      `${separator}123${separator}receiver${separator}sender${separator}nickname${separator}9200${separator}ignored${separator}ignored${separator}2${separator}ignored${separator}ko_KR${separator}456`,
    ),
  );
  assert.equal(vodSubscription.type, "followItem");
  if (vodSubscription.type === "followItem") {
    assert.equal(vodSubscription.data.subscriptionSource, "vod");
    assert.partialDeepStrictEqual(vodSubscription.data.subscriptionProduct, {
      itemType: 200,
      vodItemType: 9200,
      subscriptionTier: "plus",
      level: 2,
    });
  }

  const unknownSubscription = decodePacket(
    rawPacket(
      "0091",
      `${separator}123${separator}receiver${separator}sender${separator}nickname${separator}999${separator}ignored${separator}ignored${separator}2`,
    ),
  );
  assert.equal(unknownSubscription.type, "followItem");
  if (unknownSubscription.type === "followItem") {
    assert.equal(unknownSubscription.data.subscriptionSource, "unknown");
  }

  const unknown = decodePacket(
    rawPacket(
      "0108",
      `${separator}unused${separator}sender${separator}sNick${separator}receiver${separator}rNick${separator}streamer${separator}streamerNick${separator}999${separator}code${separator}0${separator}0${separator}${separator}0${separator}0`,
    ),
  );
  assert.equal(unknown.type, "sendSubscription");
  if (unknown.type === "sendSubscription") assert.equal(unknown.data.subscriptionProduct, null);
});

void test("rejects malformed specialized payloads without losing raw parsing", () => {
  const raw = rawPacket("0121", `${separator}{bad json}`);
  assert.throws(() => decodePacket(raw), /invalid JSON/);
  assert.equal(raw.text, `${separator}{bad json}`);

  const malformedSettlement = rawPacket(
    "0125",
    `${separator}{"fanOrder":1,"list":[["too","short"]]}`,
  );
  assert.throws(() => decodePacket(malformedSettlement), /must contain five fields/);
});
