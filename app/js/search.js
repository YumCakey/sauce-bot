/**
 * Created by Chris on 1/24/2017.
 */

const google = require('./apis/google.js');
const ytdl = require('ytdl-core');
const fs = require('fs');
const http = require('http');
const https = require('https');
const util = require('util');

fs.writeFile("./log.txt", "", 'utf-8');

var playQueue = [];
var ap = document.getElementById("audioPlayer");
var titleArray = [];
var streamArr = [];

var currentSong = 0;
var repeatType = 0; //0 is no repeat, 1 is playlist repeat, 2 is song repeat
var currentPlaylist = "";
var durationLimit = 600;
var playStatus = 0; //0 = not playing 1 = playing
var currentList = 0;
var queueString = "";

var gettingStream = false;
var waitingForNextSong = false;
var startedPlaying = false;
var titleFinish = true;
var songPlayed = false;

function commandHelper() {
    "use strict";
    WriteLog("Stir pressed!");
    const query = document.getElementById("query");
    const queryValue = query.value.trim();
    if (queryValue.substring(0, 14).toUpperCase() == ("SAVE PLAYLIST ")) {
        savePlaylist();
        WriteLog("Save playlist!");
    } else if (queryValue.substring(0, 13).toUpperCase() == ("SAVE PLAYLIST")) {
        overwritePlaylist();
        WriteLog("Overwrite playlist!");
    }else if (queryValue.substring(0,9).toUpperCase() == ("SKIP SONG")) {
        skipSong();
    } else if (queryValue.substring(0,8).toUpperCase() == ("SKIP TO ")) {
        var index = queryValue.substring(8, queryValue.length);
        skipToSong(index - 1);
    } else if (queryValue.substring(0,15).toUpperCase() == ("DURATION LIMIT ")) {
        var durVal = queryValue.substring(15, queryValue.length);
        setDurLim(durVal);
    } else if (queryValue.substring(0,15).toUpperCase() == ("!!!CLEARDATA!!!")) {
        var result = confirm("WARNING: YOU ARE CLEARING ALL YOUR DATA!");
        if (result == true) {
            localStorage.clear();
            playQueue = [];
            titleArray = [];
            streamArr = [];
            updateQueueList();
        }
    } else if (queryValue.substring(0,16).toUpperCase() == ("!!!RESETSTATE!!!")) {
        var result = confirm("WARNING: YOU ARE RESETTING BACK TO THE LAST SAVED STATE!");
        if (result == true) {
            currentSong = 0;
            localStorage.removeItem("1#@#lastSession#@#1");
            playQueue = [];
            titleArray = [];
            streamArr = [];
            updateQueueList();
        }
    } else if (queryValue.substring(0,5).toUpperCase() == ("!HELP")) {
        alert("Commands:\n- Save playlist (playlist name)\n- Skip song \n- Skip to (song number) \n- Duration limit (time in seconds)\n- Clear playlist\n- Type anything to search or input a youtube link.");
    } else if (queryValue.substring(0,11).toUpperCase() == ("LOAD BACKUP")) {
        WriteLog("Command: Load Backup");
        loadBackup();
    }else if (queryValue.substring(0,11).toUpperCase() == ("SAVE BACKUP")) {
        saveBackup();
    }else if (queryValue == "") {
        alert("Please enter a command or search for a song!");
    } else if (queryValue.substring(0,14).toUpperCase() == ("CLEAR PLAYLIST")){
        var prompt = confirm("Would you like to clear the current playlist?");

        if(prompt == true) {
            clearQueue();
        }
    }else{
        if(titleFinish == true) {
            titleFinish = false;
            search();
        }
        WriteLog("Search song!");
    }
    /*
     if (queryValue.includes("!q ")) {
     search();
     } else if (queryValue.includes("!play")) {
     playSong();
     }else if (queryValue.includes("!pl add current ")){
     savePlaylist();
     }else if (queryValue.includes("!pl play ")){
     loadPlaylist();
     }*/
}

function WriteLog(message)
{
    var datetime = new Date().toLocaleString()
    var text = '[' + datetime + '] ' + message + '\r\n';
    console.log(text);
    fd = fs.openSync("./log.txt", "a");
    fs.writeSync(fd, text);
    fs.closeSync(fd);
}

function getHelp(){
    "use strict";
    alert("Commands:\n- Save playlist (playlist name)\n- Skip song \n- Skip to (song number) \n- Duration limit (time in seconds)\n- Clear playlist\n- Type anything to search or input a youtube link.");
}

function search() {
    "use strict";
    const audioPlayer = document.getElementById("audioPlayer");
    const query = document.getElementById("query");
    const searchTerms = query.value.replace("!q ", "");
    if(searchTerms.indexOf("https://www.youtube.com/watch?") >= 0 || searchTerms.indexOf("https://youtu.be/") >= 0 || searchTerms.indexOf("http://www.youtube.com/v/") >= 0 || searchTerms.indexOf("https://www.youtube.ca/watch?") >= 0 || searchTerms.indexOf("http://www.youtube.ca/v/") >= 0){
        var url = searchTerms;
        ytdl.getInfo(url, {}, (err, info) => {
            if (err != null) {
                WriteLog(err);
                titleFinish = true;
            } else {
                //WriteLog(info);
                console.log(info);
                var audioURL;
                audioURL = info.formats[getFormat(info.formats)].url;
                var songTitle = info.title;
                WriteLog("Audio URL: " + audioURL);
                playQueue.push(url);
                waitingForNextSong = false;
                titleArray.push(songTitle);
                streamArr.push(audioURL);
                updateQueueList();
                titleFinish = true;
            }
        });
    }else {
        google.searchYouTube(encodeURIComponent(searchTerms)).then((url) => {
            WriteLog('[Search] Found URL ' + url + ' for search terms ' + searchTerms);
            ytdl.getInfo(url, {}, (err, info) => {
                if (err != null) {
                    WriteLog(err);
                    titleFinish = true;
                } else {
                    //WriteLog(info);
                    console.log(info);
                    var audioURL;
                    audioURL = info.formats[getFormat(info.formats)].url;
                    var songTitle = info.title;
                    WriteLog("Audio URL: " + audioURL);
                    playQueue.push(url);
                    waitingForNextSong = false;
                    titleArray.push(songTitle);
                    streamArr.push(audioURL);
                    updateQueueList();
                    titleFinish = true;
                }
            });
        }).catch(() => {
            WriteLog("Youtube Search Error");
            titleFinish = true;
        });
    }

}

var waiting = false;

function songLoop(){
    "use strict";
    playStatus = 1;
    startedPlaying = true;
    songPlayed = false;
    document.getElementById("seekTime").innerHTML = "Loading";
    playSong(currentSong);
    WriteLog("Play song!");
    updateQueueList();
    waiting = true;

    /*
    var loadcounter = 0;
    while(waiting){
        setTimeout(function(){
            document.getElementById("audioPlayer").oncanplay = function(){
                waiting = false;
                document.getElementById("seek").setAttribute("max", document.getElementById("audioPlayer").duration);
            };
            loadcounter++
        }, 1000);
    }
    */



}

function playSong(i) {
    waiting = true;
    if(i < playQueue.length && i > -1){
        var url = playQueue[i];
        getStreamUrl(url, i);
    }
}

function getFormat(formats){
    "use strict";
    for(var i = 0; i < formats.length; i++){
        try {
            if (formats[i].type.includes("audio")) {
                return i;
            }
        }catch(err){
            WriteLog("Format Error at format " + i + ".");
            return 0;
        }
    }
}

function getStreamUrl(url, i){
    "use strict";
    gettingStream = true;
    ytdl.getInfo(url, {}, (err, info) => {
        if (err != null) {
            WriteLog(err);
            document.getElementById("seekTime").innerHTML = "Error!"
        } else {
            var audioURL = info.formats[getFormat(info.formats)].url;
            document.getElementById('audioPlayer').setAttribute("src", audioURL);
            document.getElementById('audioPlayer').play();
            gettingStream = false;
            waiting = false;
        }
    });
}
function updateQueueList() {
    "use strict";
    WriteLog("Update Queue List called");
    //WriteLog(playQueue);
    //WriteLog(titleArray);
    queueString = "";
    var ql = document.getElementById("queueList");
    //ql.innerHTML = queueString;
    if(titleArray.length == playQueue.length){
        for (var i = 0; i < playQueue.length; i++) {
            //WriteLog(i + ", " + currentSong + ", " + startedPlaying);
            //WriteLog("BEFORE: " + currentSong);
            if (i == currentSong && startedPlaying == false) {
                queueString = queueString + "<li id='" + i + "' class='list-item-playing' onmouseover='toggleMove(this)' onmouseout='toggleMove(this)' ondblclick='skipToSong(" + i + ")'><div class='moveDiv'><img class='moveUp' id='" + i + "' onclick='swapUp(this.id)' src='./images/moveUp.png'><img class='moveDown' id='" + i + "' onclick='swapDown(this.id)' src='./images/moveDown.png'></div><div class='songDiv'><img class='qdeleteIcon' id='" + i + "' src='./images/Delete.png' onclick='deleteSong(this.id)'>" + (i + 1) + ". " + titleArray[i] + "</li></div>";
            } else if (i == currentSong && startedPlaying == true) {
                queueString = queueString + "<li id='" + i + "' class='list-item-playing' onmouseover='toggleMove(this)' onmouseout='toggleMove(this)' ondblclick='skipToSong(" + i + ")'><div class='moveDiv'><img class='moveUp' id='" + i + "' onclick='swapUp(this.id)' src='./images/moveUp.png'><img class='moveDown' id='" + i + "' onclick='swapDown(this.id)' src='./images/moveDown.png'></div><div class='songDiv'><img class='qdeleteIcon' id='" + i + "' src='./images/Delete.png' onclick='deleteSong(this.id)'> " + (i + 1) + ". " + titleArray[i] + "</li></div>";
            } else {
                queueString = queueString + "<li id='" + i + "' class='list-item-not-playing' onmouseover='toggleMove(this)' onmouseout='toggleMove(this)' ondblclick='skipToSong(" + i + ")'><div class='moveDiv'><img class='moveUp' id='" + i + "' onclick='swapUp(this.id)' src='./images/moveUp.png'><img class='moveDown' id='" + i + "' onclick='swapDown(this.id)' src='./images/moveDown.png'></div><div class='songDiv'><img class='qdeleteIcon' id='" + i + "' src='./images/Delete.png' onclick='deleteSong(this.id)'> " + (i + 1) + ". " + titleArray[i] + "</li></div>";
            }
            //WriteLog("AFTER: " + currentSong);
        }
    }else{
        titleArray = new Array(playQueue.length);
        for (var i = 0; i < playQueue.length; i++) {
            var url = playQueue[i];
            getTitle(url, i);
        }
    }
    ql.innerHTML = queueString;
}

function getTitle(url, i){
    "use strict";
    ytdl.getInfo(url, {}, (err, info) => {
        if (err != null) {
            WriteLog(err);
        } else {
            titleArray[i] = info.title;
            if (i == currentSong && startedPlaying == false) {
                queueString = queueString + "<li id='" + i + "' class='list-item-playing' onmousedown='itemSelect(this.id)' ondblclick='skipToSong(" + i + ")'><img class='qdeleteIcon' id='" + i + "' src='./images/Delete.png' onclick='deleteSong(this.id)'> " + (i + 1) + ". " + titleArray[i] + "</li>";
            } else if (i == currentSong && startedPlaying == true) {
                queueString = queueString + "<li id='" + i + "' class='list-item-playing' onmousedown='itemSelect(this.id)' ondblclick='skipToSong(" + i + ")'><img class='qdeleteIcon' id='" + i + "' src='./images/Delete.png' onclick='deleteSong(this.id)'> " + (i + 1) + ". " + titleArray[i] + "</li>";
            } else {
                queueString = queueString + "<li id='" + i + "' class='list-item-not-playing' onmousedown='itemSelect(this.id)' ondblclick='skipToSong(" + i + ")'><img class='qdeleteIcon' id='" + i + "' src='./images/Delete.png' onclick='deleteSong(this.id)'> " + (i + 1) + ". " + titleArray[i] + "</li>";
            }
            if(i == titleArray.length - 1){
                document.getElementById("queueList").innerHTML = queueString;
            }
        }
    });
}

function skipSong(){
    "use strict";
    if(currentSong != playQueue.length - 1){
        WriteLog("[skipSong] BEFORE: " + currentSong);
        currentSong++;
        WriteLog("[skipSong] AFTER: " + currentSong);
        songLoop();
    }else{
        alert("Can't skip to next song!");
    }

}

function skipToSong(index){
    "use strict";
    WriteLog(index + " " + currentSong);
    if(index != currentSong) {
        currentSong = index;
        songLoop();
    }else{
        alert("Song already playing!");
    }
}

function deleteSong(id){
    "use strict";
    WriteLog("id: " + id + " currentSong: " + currentSong);
    if(id == currentSong){
        if(playStatus == 0) {
            document.getElementById('audioPlayer').pause();
            var i2 = 0;
            var newPlayQueue = new Array(playQueue.length - 1);
            var newStreamArr = new Array(playQueue.length - 1);
            var newTitleArray = new Array(playQueue.length - 1);
            for (var i = 0; i < playQueue.length; i++) {
                if (i != id) {
                    newPlayQueue[i2] = playQueue[i];
                    try {
                        newStreamArr[i2] = streamArr[i];
                    } catch (err) {
                        WriteLog("StreamArray not filled")
                    }
                    try {
                        newTitleArray[i2] = titleArray[i];
                    } catch (err) {
                        WriteLog("TitleArray not filled")
                    }
                    i2++;
                }
            }
            playQueue = newPlayQueue;
            titleArray = newTitleArray;
            streamArr = newStreamArr;
            updateQueueList();
            songLoop();
        }else{
            alert("Can't delete playing song!");
        }
    }else if(id < currentSong){
        var i2 = 0;
        var newPlayQueue = new Array(playQueue.length - 1);
        var newStreamArr = new Array(playQueue.length - 1);
        var newTitleArray = new Array(playQueue.length - 1);
        for(var i = 0; i < playQueue.length; i++){
            if(i != id){
                newPlayQueue[i2] = playQueue[i];
                try {
                    newStreamArr[i2] = streamArr[i];
                }catch(err){
                    WriteLog("StreamArray not filled")
                }
                try {
                    newTitleArray[i2] = titleArray[i];
                }catch(err){
                    WriteLog("TitleArray not filled")
                }
                i2++;
            }
        }
        playQueue = newPlayQueue;
        titleArray = newTitleArray;
        streamArr = newStreamArr;
        currentSong--;
        updateQueueList();
    }else{
        var i2 = 0;
        var newPlayQueue = new Array(playQueue.length - 1);
        var newStreamArr = new Array(playQueue.length - 1);
        var newTitleArray = new Array(playQueue.length - 1);
        for(var i = 0; i < playQueue.length; i++){
            if(i != id){
                newPlayQueue[i2] = playQueue[i];
                try {
                    newStreamArr[i2] = streamArr[i];
                }catch(err){
                    WriteLog("StreamArray not filled")
                }
                try {
                    newTitleArray[i2] = titleArray[i];
                }catch(err){
                    WriteLog("TitleArray not filled")
                }
                i2++;
            }
        }
        playQueue = newPlayQueue;
        streamArr = newStreamArr;
        titleArray = newTitleArray;
        updateQueueList();
    }
    updateQueueList();
}

/* -------------------------------------------------------------------------
 Queue Manipulation Methods
 ------------------------------------------------------------------------- */

function clearQueueList() {
    "use strict";
    var queueString = document.getElementById("queueList").innerHTML;
    queueString = "";
}

function swapSong(newArray){
    "use strict";
    var newPlayQueue = new Array(newArray.length);
    var newTitleArray = new Array(newArray.length);
    var newStreamArray = new Array(newArray.length);
    for(var i = 0; i < newArray.length; i++){
        if(newArray[i] == currentSong){
            currentSong = i;
        }
        newPlayQueue[i] = playQueue[newArray[i]];
        newTitleArray[i] = titleArray[newArray[i]];
        newStreamArray[i] = streamArr[newArray[i]];
    }
    playQueue = newPlayQueue;
    titleArray = newTitleArray;
    streamArr = newStreamArray;
    updateQueueList();
}

function swapUp(songNum){
    "use strict";
    songNum = parseInt(songNum);
    WriteLog("Song num: " + songNum);
    if(songNum != 0){
        if(songNum-1 == currentSong){
            currentSong++;
        }else if(songNum == currentSong){
            currentSong--;
        }
        var songLink = playQueue[songNum];
        var title = titleArray[songNum];
        var streamLink = streamArr[songNum];
        WriteLog(songLink + " " + title + " " + streamLink);
        playQueue[songNum] = playQueue[songNum-1];
        titleArray[songNum] = titleArray[songNum-1];
        streamArr[songNum] = streamArr[songNum-1];

        playQueue[songNum-1] = songLink;
        titleArray[songNum-1] = title;
        streamArr[songNum-1] = streamLink;
        updateQueueList();
    }
}

function swapDown(songNum){
    "use strict";
    songNum = parseInt(songNum);
    WriteLog("Song num: " + songNum);
    if(songNum != playQueue.length-1){
        if(songNum+1 == currentSong){
            currentSong--;
        }else if(songNum == currentSong){
            currentSong++;
        }
        var songLink = playQueue[songNum];
        var title = titleArray[songNum];
        var streamLink = streamArr[songNum];
        WriteLog(songLink + " " + title + " " + streamLink);
        WriteLog(songNum+1);
        WriteLog(playQueue[songNum+1] + " " + titleArray[songNum+1] + " " + streamArr[songNum+1]);
        playQueue[songNum] = playQueue[songNum+1];
        titleArray[songNum] = titleArray[songNum+1];
        streamArr[songNum] = streamArr[songNum+1];

        playQueue[songNum+1] = songLink;
        titleArray[songNum+1] = title;
        streamArr[songNum+1] = streamLink;
        updateQueueList();
    }
}

/* -------------------------------------------------------------------------
Playlist Methods
------------------------------------------------------------------------- */

function savePlaylist(){
    "use strict";
    if(playQueue.length > 0) {
        const query = document.getElementById("query");
        var playlistName = query.value.substring(14, query.length);
        var playlist = "";
        if (localStorage.getItem("playlistNames") == null) {
            localStorage.setItem("playlistNames", playlistName);
        } else {
            var playlistNames = localStorage.getItem("playlistNames");
            var playlistNamesArr = playlistNames.split("%");
            WriteLog(playlistNamesArr);
            var exists = false;
            for (var x = 0; x < playlistNamesArr.length; x++) {
                WriteLog(playlistNamesArr[i] + " " + playlistName);
                if (playlistNamesArr[x] == playlistName) {
                    exists = true;
                    break;
                }
            }
            if (exists == false) {
                playlistNames = playlistNames + "%" + playlistName;
                localStorage.setItem("playlistNames", playlistNames);
            }
        }
        var prompt = true;
        if (localStorage.getItem(playlistName) != null) {
            prompt = confirm("This playlist already exists! Would you like to overwrite it?");
        }
        if (prompt == true) {
            var i = 0;
            for (i = 0; i < playQueue.length; i++) {
                playlist = playlist + playQueue[i] + ",";
            }
            localStorage.setItem(playlistName, playlist);
        }
        alert("Playlist saved!");
        refreshPlaylists();
    }else{
        alert("No songs in queue!");
    }
}

function refreshPlaylists(){
    "use strict";
    var playlistString = "";
    if(localStorage.getItem("playlistNames") != null) {
        var namesArr = localStorage.getItem("playlistNames").split("%");
        for (var i = 0; i < namesArr.length; i++) {
            if(namesArr[i] == currentPlaylist){
                playlistString = playlistString + "<li id='" + namesArr[i] + "' class='playlist-playing'>" + namesArr[i] + "<img id='" + namesArr[i] + "' src='./images/Delete.png' class='deleteIcon' onclick='deletePlaylistBt(this.id)'><img id='" + namesArr[i] + "' src='./images/Play.png'  class='playIcon' onclick='loadPlaylistBt(this.id)'></li>";
            }else {
                playlistString = playlistString + "<li id='" + namesArr[i] + "' class='playlist-not-playing'>" + namesArr[i] + "<img id='" + namesArr[i] + "' src='./images/Delete.png' class='deleteIcon' onclick='deletePlaylistBt(this.id)'><img id='" + namesArr[i] + "' src='./images/Play.png'  class='playIcon' onclick='loadPlaylistBt(this.id)'></li>";
            }
        }
    }
    document.getElementById("playlistList").innerHTML = playlistString;
    if(currentPlaylist == ""){
        document.getElementById("currentPlaylist").innerHTML = "";
    }else{
        document.getElementById("currentPlaylist").innerHTML = "Current playlist: " + currentPlaylist;
    }
}

function overwritePlaylist(){
    "use strict";
    if(playQueue.length > 0) {
        if (currentPlaylist != "") {
            var prompt = confirm("Would you like to overwrite the current playlist " + currentPlaylist + "?");
            if (prompt == true) {
                var playlist = "";
                for (var i = 0; i < playQueue.length; i++) {
                    if (i == 0) {
                        playlist = playQueue[0];
                    } else {
                        playlist = playlist + "," + playQueue[i];
                    }
                }
                localStorage.setItem(currentPlaylist, playlist);
                alert("Playlist overwritten!");
            }
        }
    }else{
        alert("No songs in queue!");
    }
}

function loadPlaylistBt(id){
    "use strict";
    WriteLog(id);
    var playlistName = id;
    var playlist = localStorage.getItem(playlistName);
    playlist = playlist.substring(0, (playlist.length - 1));

    if(localStorage.getItem(playlistName) != null){
        playQueue = playlist.split(",");
    }
    document.getElementById("audioPlayer").setAttribute("src", "");
    WriteLog(playQueue.length);
    titleArray = [];
    clearQueueList();
    updateQueueList();
    currentSong = 0;
    currentPlaylist = id;
    startedPlaying = false;
    playStatus = 0;
    document.getElementById("playPause-button").setAttribute("src", "./images/Play.png");
    refreshPlaylists();
    alert("Playlist loaded!");
    updateQueueList();
}

function deletePlaylistBt(id){
    "use strict";
    var prompt = confirm("Are you sure you want to delete the playlist " + id + "?");
    if(prompt == true) {
        var playlistName = id;
        if (localStorage.getItem(playlistName) != null) {
            localStorage.removeItem(playlistName);
        }
        var namesArr = localStorage.getItem("playlistNames").split("%");
        var i2 = 0;
        var newNamesArr = new Array(namesArr.length - 1);
        for(var i = 0; i < namesArr.length; i++){
            if(namesArr[i] != playlistName){
                newNamesArr[i2] = namesArr[i];
                i2++;
            }
        }
        var namesString = "";
        for(var i = 0; i < newNamesArr.length; i++){
            if(i==0){
                namesString = newNamesArr[i];
            }else{
                namesString = namesString + "%" + newNamesArr[i];
            }
        }
        localStorage.setItem("playlistNames", namesString);
        if(namesString == ""){
            localStorage.removeItem("playlistNames");
        }
        refreshPlaylists();
    }
}

/*------------------------------------------------------------
Window Load and Unload
----------------------------------------------------------- */

window.onunload = function(){
    "use strict";
    if(playQueue.length > 0) {
        var sessionString = "";
        var titleString = "";
        for (var i = 0; i < playQueue.length; i++) {
            if (i > 0) {
                sessionString = sessionString + "," + playQueue[i];
                titleString = titleString + "t##@##t" + titleArray[i];
            } else {
                sessionString = playQueue[i];
                titleString = titleArray[i];
            }
        }
        localStorage.setItem("1#@#lastSession#@#1", sessionString);
        localStorage.setItem("1#@#lastTitleArray#@#1", titleString);
    }
    localStorage.setItem("1#@#currentPlaylist#@#1", currentPlaylist);
    saveBackup();
};

$(document).ready(function(){
    "use strict";
    if(localStorage.getItem("1#@#lastSession#@#1") != null) {
        playQueue = localStorage.getItem("1#@#lastSession#@#1").split(",");
        titleArray = localStorage.getItem("1#@#lastTitleArray#@#1").split("t##@##t");
        //updateQueueList();
        //localStorage.removeItem("1#@#lastTitleArray#@#1");
        localStorage.removeItem("1#@#lastSession#@#1");
    }
    if(localStorage.getItem("volume") != null){
        document.getElementById("vol-control").value = localStorage.getItem("volume");
        var ap = document.getElementById('audioPlayer');
        //WriteLog('Before: ' + ap.volume);
        ap.volume = localStorage.getItem("volume") / 100;

    }
    if(localStorage.getItem("durationLimit") != null){
        durationLimit = localStorage.getItem("durationLimit");
    }

    currentPlaylist = localStorage.getItem("1#@#currentPlaylist#@#1");
    if(currentPlaylist == "") {
        document.getElementById("currentPlaylist").innerHTML = "";
    }else{
        document.getElementById("currentPlaylist").innerHTML = "Current playlist: " + currentPlaylist;
    }

    document.getElementById("audioPlayer").oncanplaythrough = function(){
        waiting = false;
        document.getElementById("seek").setAttribute("max", document.getElementById("audioPlayer").duration);
    };

    document.getElementById('audioPlayer').ontimeupdate = function() {
        //WriteLog("[Play] Currently playing ./audio/" + currentSong + ".mp4");
        songPlayed = true;
        var curtime = parseInt(document.getElementById("audioPlayer").currentTime, 10);
        document.getElementById("seek").value = curtime;
        document.getElementById("seekTime").innerHTML = convertTime(curtime) + "/" + convertTime(document.getElementById("audioPlayer").duration);
    };

    document.getElementById("seek").onchange = function() {
        document.getElementById("audioPlayer").currentTime = document.getElementById("seek").value;
        document.getElementById("seekTime").innerHTML = "0:00/" + document.getElementById("audioPlayer").duration;
    };

    document.getElementById('audioPlayer').addEventListener('ended', () => {
        var ppb = document.getElementById("playPause-button");
        ppb.setAttribute("src", "./images/Play.png");
        playStatus = 0;
        WriteLog(songPlayed);
        if(songPlayed == true) {
            if (repeatType == 0) {
                if (currentSong == playQueue.length - 1) {
                    //WriteLog("[songLoop] BEFORE: " + currentSong);
                    //currentSong++;
                    //WriteLog("[songLoop] AFTER: " + currentSong);
                    startedPlaying = false;
                    //songPlayed = false;
                    waitingForNextSong = true;
                } else {
                    //WriteLog("[songLoop] BEFORE: " + currentSong);
                    currentSong++;
                    //WriteLog("[songLoop] AFTER: " + currentSong);
                    songPlayed = false;
                    songLoop();
                }
            } else if (repeatType == 1) {
                if (currentSong === playQueue.length - 1) {
                    WriteLog("Going to first song!");
                    songPlayed = false;
                    skipToSong(0);
                } else {
                    //WriteLog("[songLoop] BEFORE: " + currentSong);
                    WriteLog("Going to next song!");
                    //currentSong++;
                    //WriteLog("[songLoop] AFTER: " + currentSong);
                    songPlayed = false;
                    skipToSong(currentSong + 1);
                }
            } else if (repeatType == 2) {
                songPlayed = false;
                songLoop();
            }
        }else{
            songLoop();
        }
    });

    refreshPlaylists();
    //titleArray = [];
    WriteLog(playQueue);
    updateQueueList();
});


/*-----------------------------------------------------
Web Element Functions
---------------------------------------------------- */
/*
$( function() {
    $( "#queueList" ).sortable({
        update: function(even, ui){
            "use strict";
            var newListOrder = $(this).sortable("toArray");
            swapSong(newListOrder);
            updateQueueList();
        }
    });
    $( "#queueList" ).disableSelection();
});*/

function toggleMove(element){
    "use strict";
    if(element.getElementsByClassName('moveDiv')[0].style.visibility == "visible") {
        element.getElementsByClassName('moveDiv')[0].style.visibility = "hidden";
    }else{
        element.getElementsByClassName('moveDiv')[0].style.visibility = "visible";
    }
}

function playToggle(){
    var ppb = document.getElementById("playPause-button");
    var ap = document.getElementById("audioPlayer");
    if(playQueue.length > 0) {
        if (currentSong == 0 && startedPlaying == false) {
            songLoop();
            ppb.setAttribute("src", "./images/Pause.png");
        }else if (startedPlaying == true) {
            if (playStatus == 0) {
                ap.play();
                playStatus = 1;
                ppb.setAttribute("src", "./images/Pause.png");
            } else if (playStatus == 1) {
                ap.pause();
                playStatus = 0;
                ppb.setAttribute("src", "./images/Play.png");
            }
        }
    }
}

function repeatToggles(){
    "use strict";
    var rb = document.getElementById("repeatMode-button");
    if(repeatType == 0){ //switch to playlist repeat
        repeatType = 1;
        rb.setAttribute("src", "./images/RepeatQueue.png");
    }else if(repeatType == 1){ //switch to single repeat
        repeatType = 2;
        rb.setAttribute("src", "./images/RepeatCurrent.png");
    }else if(repeatType == 2){ //switch to no repeat
        repeatType = 0;
        rb.setAttribute("src", "./images/NoRepeat.png");
    }
}

function SetVolume(val)
{
    localStorage.setItem("volume", val);
    var ap = document.getElementById('audioPlayer');
    //WriteLog('Before: ' + ap.volume);
    ap.volume = val / 100;
    //WriteLog('After: ' + ap.volume);
}

function toggleLists(){
    "use strict";
    if(currentList == 0){
        document.getElementById("queueList").style.display = "none";
        document.getElementById("playlistList").style.display = "block";
        document.getElementById("playlist-button").innerHTML = "Queue";
        document.getElementById("heading").innerHTML = "Playlists";
        currentList = 1;
    }else{
        document.getElementById("playlistList").style.display = "none";
        document.getElementById("queueList").style.display = "block";
        document.getElementById("playlist-button").innerHTML = "Playlists";
        document.getElementById("heading").innerHTML = "Current Queue";
        currentList = 0;
    }
}

function str_pad_left(string,pad,length) {
    return (new Array(length+1).join(pad)+string).slice(-length);
}

function convertTime(time){
    "use strict";
    //WriteLog(document.getElementById("audioPlayer").duration);
    time = Math.floor(time);
    var minutes = Math.floor(time / 60);
    var seconds = time - (minutes * 60);
    var finalTime = str_pad_left(minutes,'0',2)+':'+str_pad_left(seconds,'0',2);
    //WriteLog(finalTime);
    return finalTime;
}

function setDurLim(durLim){
    "use strict";
    durationLimit = durLim;
    localStorage.setItem("durationLimit", durationLimit);
}

function getDurLim(){
    "use strict";
    alert("Current song duration limit is " + durationLimit + " seconds.");
}

function clearQueue(){
    "use strict";
    document.getElementById("audioPlayer").pause();
    document.getElementById("audioPlayer").setAttribute("src", "");
    document.getElementById("playPause-button").setAttribute("src", "./images/Play.png");
    document.getElementById("audioPlayer").load();
    document.getElementById("seekTime").innerHTML = "--/--";
    currentPlaylist = "";
    refreshPlaylists();
    playQueue = [];
    titleArray = [];
    streamArr = [];
    updateQueueList();
}

function saveBackup(){
    "use strict";
    var backupString = localStorage.getItem('playlistNames');
    var playlistArr = localStorage.getItem("playlistNames").split("%");
    for(var i = 0; i < playlistArr.length; i++){
        WriteLog(playlistArr[i]);
        backupString = backupString + "$%$%$" + localStorage.getItem(playlistArr[i]);
    }
    fs.writeFileSync("./backup.txt", backupString, 'utf-8');
}

function loadBackup(){
    "use strict";
    var loadedBackup = "";
    WriteLog("Inside load Backup");
    fs.readFile('./backup.txt', 'utf-8', (err, data) => {
        if (err) throw err;
        loadedBackup = data;
        WriteLog(loadedBackup);
        var backupArr = loadedBackup.split("$%$%$");
        localStorage.setItem("playlistNames", backupArr[0]);
        var playlistArr = backupArr[0].split("%");
        for(var i = 0; i < playlistArr.length; i++){
            localStorage.setItem(playlistArr[i], backupArr[i+1]);
        }
        refreshPlaylists();
    });
}