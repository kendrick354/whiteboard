import DynamoDBService from './services/DynamoDBService.js';

var savedBoards = {};
var savedUndos = {};
var saveDelay = {};

const s_whiteboard = {
    handleEventsAndData: async function (content) {
        var tool = content["t"];
        var wid = content["wid"];
        var username = content["username"];

        if (tool === "clear") {
            await DynamoDBService.deleteWhiteboardData(wid);
            delete savedBoards[wid];
            delete savedUndos[wid];
        } else if (tool === "undo") {
            if (!savedUndos[wid]) {
                savedUndos[wid] = [];
            }
            let savedBoard = await this.loadStoredData(wid);
            if (savedBoard) {
                for (var i = savedBoards[wid].length - 1; i >= 0; i--) {
                    if (savedBoards[wid][i]["username"] == username) {
                        var drawId = savedBoards[wid][i]["drawId"];
                        for (var i = savedBoards[wid].length - 1; i >= 0; i--) {
                            if (
                                savedBoards[wid][i]["drawId"] == drawId &&
                                savedBoards[wid][i]["username"] == username
                            ) {
                                savedUndos[wid].push(savedBoards[wid][i]);
                                savedBoards[wid].splice(i, 1);
                            }
                        }
                        break;
                    }
                }
                if (savedUndos[wid].length > 1000) {
                    savedUndos[wid].splice(0, savedUndos[wid].length - 1000);
                }
            }
            await this.saveToDB(wid);
        } else if (tool === "redo") {
            if (!savedUndos[wid]) {
                savedUndos[wid] = [];
            }
            let savedBoard = await this.loadStoredData(wid);
            for (var i = savedUndos[wid].length - 1; i >= 0; i--) {
                if (savedUndos[wid][i]["username"] == username) {
                    var drawId = savedUndos[wid][i]["drawId"];
                    for (var i = savedUndos[wid].length - 1; i >= 0; i--) {
                        if (
                            savedUndos[wid][i]["drawId"] == drawId &&
                            savedUndos[wid][i]["username"] == username
                        ) {
                            savedBoard.push(savedUndos[wid][i]);
                            savedUndos[wid].splice(i, 1);
                        }
                    }
                    break;
                }
            }
            await this.saveToDB(wid);
        } else if (
            ["line", "pen", "rect", "circle", "eraser", "addImgBG", "recSelect", 
             "eraseRec", "addTextBox", "setTextboxText", "removeTextbox", 
             "setTextboxPosition", "setTextboxFontSize", "setTextboxFontColor"]
            .includes(tool)
        ) {
            let savedBoard = await this.loadStoredData(wid);
            delete content["wid"];
            if (tool === "setTextboxText") {
                for (var i = savedBoard.length - 1; i >= 0; i--) {
                    if (
                        savedBoard[i]["t"] === "setTextboxText" &&
                        savedBoard[i]["d"][0] === content["d"][0]
                    ) {
                        savedBoard.splice(i, 1);
                    }
                }
            }
            savedBoard.push(content);
            await this.saveToDB(wid);
        }
    },

    saveToDB: async function (wid) {
        if (savedBoards[wid]) {
            try {
                await DynamoDBService.saveWhiteboardData(wid, savedBoards[wid]);
            } catch (error) {
                console.error("Error saving to DynamoDB:", error);
            }
        }
    },

    loadStoredData: async function (wid) {
        if (wid in savedBoards) {
            return savedBoards[wid];
        }

        try {
            const data = await DynamoDBService.getWhiteboardData(wid);
            savedBoards[wid] = data;
            return data;
        } catch (error) {
            console.error("Error loading from DynamoDB:", error);
            savedBoards[wid] = [];
            return [];
        }
    },

    copyStoredData: function (sourceWid, targetWid) {
        const sourceData = this.loadStoredData(sourceWid);
        if (sourceData.length === 0 || this.loadStoredData(targetWid).lenght > 0) {
            return;
        }
        savedBoards[targetWid] = sourceData.slice();
        this.saveToDB(targetWid);
    },
    saveData: function (wid, data) {
        const existingData = this.loadStoredData(wid);
        if (existingData.length > 0 || !data) {
            return;
        }
        savedBoards[wid] = JSON.parse(data);
        this.saveToDB(wid);
    },
};

export { s_whiteboard as default };
