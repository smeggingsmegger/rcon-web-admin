"use strict";

var request = require(__dirname + "/request");
var db = require(__dirname + "/db");

/**
 * Steam utils
 */
var steamapi = {};

/**
 * Request to our api
 * @param {string} type
 * @param {string[]} ids
 * @param {function} callback
 */
steamapi.request = function (type, ids, callback) {
    if (!ids.length) {
        callback({});
        return;
    }
    var res = {};
    var missingIds = [];
    for (var i = 0; i < ids.length; i++) {
        var id = ids[i];
        var banData = steamapi.getDataForId(type, id);
        if (banData) {
            res[id] = banData;
        } else {
            missingIds.push(id);
        }
    }
    if (missingIds.length) {
        request.get("https://0x.at/steamapi/api.php?action=" + type + "&ids=" + missingIds.join(","), false, function (result) {
            if (result !== null) {
                var data = JSON.parse(result);
                for (var i = 0; i < data.players.length; i++) {
                    var banData = data.players[i];
                    steamapi.saveDataForId(type, banData.SteamId, banData);
                    res[banData.SteamId] = banData;
                }
            }
            callback(res);
        });
    } else {
        callback(res);
    }
};

/**
 * Get db data for steamid
 * @param {string} type
 * @param {string} id
 * @returns {*}
 */
steamapi.getDataForId = function (type, id) {
    var sdb = db.get("steamapi");
    var playerData = sdb.get(id).value();
    if (!playerData || !playerData[type]) return null;
    if (playerData[type].timestamp < (new Date().getTime() / 1000 - 86400)) {
        delete playerData[type];
    }
    return playerData[type] || null;
};

/**
 * Save db data for steamid
 * @param {string} type
 * @param {string} id
 * @param {object} data
 * @returns {*}
 */
steamapi.saveDataForId = function (type, id, data) {
    var sdb = db.get("steamapi");
    var playerData = sdb.get(id).value();
    if (!playerData) playerData = {};
    data.timestamp = new Date().getTime() / 1000;
    playerData[type] = data;
    sdb.set(id, playerData).value();
};

/**
 * Delete old entries
 */
steamapi.cleanup = function () {
    try {
        var data = db.get("steamapi").value();
        var timeout = new Date() / 1000 - 86400;
        for (var steamId in data) {
            if (data.hasOwnProperty(steamId)) {
                var entries = data[steamId];
                for (var entryIndex in entries) {
                    if (entries.hasOwnProperty(entryIndex)) {
                        var entryRow = entries[entryIndex];
                        if (entryRow.timestamp < timeout) {
                            delete entries[entryIndex];
                        }
                    }
                }
            }
        }
        db.get("steamapi").setState(data);
    } catch (e) {
        console.error(new Date(), "Steamapi cleanup failed", e, e.stack);
    }
};

// each 30 minutes cleanup the steamapi db and remove old entries
setInterval(steamapi.cleanup, 30 * 60 * 1000);
steamapi.cleanup();

module.exports = steamapi;