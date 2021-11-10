var redirect_uri = "https://teamb.dev:2052/player";

var client_id = "";
var playlistId = "";
var waveformTop = true;
//interval ids
var intervalId = "";
var annotationInterval = "";
var playerInterval = "";
var waveformTimer = "";
var progressTimer = "";
var clickedRow = "";
var currentDate = "";
var currentIndex = 0;
var currentPlaylistJson = [];
var currentPlaylistDates = [];
var currentSongAnnotations = [];
var currentWaveformId = "";
var currentTrackLevels = "";
var jsonArray = [];
var web_player_id = "";
var currentSongsOffset = 0;
var isPaused = true;
var access_token = null;
var refresh_token = null;
var playlistName = "";
var playlistImageUrl = "";
var radioButtons = [];
var userId = "";
var trackId = "";
var currentDuration = 0;
var progressMs = 0;
var currentPlayingObject = null;
var lastStoredAnno = "";
var currentAlbumCover = "";
var currentTrackTitle = "";
var currentTrackArtist = "";
var currentMarkedAnnotations = new Map();
var lastPlayedSongId = "";
var nextAnnotation = "";
var waveformColor = "green";
var timeBeforeAnno = 5;
var annotationColor = "orange";

const AUTHORIZE = "https://accounts.spotify.com/authorize"
const TOKEN = "https://accounts.spotify.com/api/token";
const PLAYLISTS = "https://api.spotify.com/v1/me/playlists?limit=50";
const PLAYLISTIMAGE ="https://api.spotify.com/v1/playlists/{playlist_id}/images";
const DEVICES = "https://api.spotify.com/v1/me/player/devices";
const PLAY = "https://api.spotify.com/v1/me/player/play";
const PAUSE = "https://api.spotify.com/v1/me/player/pause";
const NEXT = "https://api.spotify.com/v1/me/player/next";
const PREVIOUS = "https://api.spotify.com/v1/me/player/previous";
const PLAYER = "https://api.spotify.com/v1/me/player";
const TRACKS = "https://api.spotify.com/v1/playlists/{{PlaylistId}}/tracks";
const ANALYSIS = "https://api.spotify.com/v1/audio-analysis/{id}";
const CURRENTLYPLAYING = "https://api.spotify.com/v1/me/player/currently-playing";
const SHUFFLE = "https://api.spotify.com/v1/me/player/shuffle";
const USER = "https://api.spotify.com/v1/me";
const INSERT = "https://teamb.dev:2052/insert";
const RETRIEVE = "https://teamb.dev:2052/retrieve";
const INSERTDATE = "https://teamb.dev:2052/insertDate";
const RETRIEVEDATES = "https://teamb.dev:2052/retrieveDates";
const REMOVE = "https://teamb.dev:2052/remove"
const AUTHORIZETEAMB = "https://teamb.dev:2052/authorization"
const REFRESHTEAMB = "https://teamb.dev:2052/refreshAccessToken";

function onPageLoad() {
    client_id = localStorage.getItem("client_id");
    if (window.location.search.length > 0) {
        handleRedirect();
    } else {
        access_token = localStorage.getItem("access_token");
        if(localStorage.getItem("userId") != null) userId = localStorage.getItem("userId");
        refreshPlaylists();
        currentlyPlaying();
    }
    refreshRadioButtons();
}

/**
 * switches into player mode
 */
function switchPlayerMode() {
    setTimeout(function() { wait() }, 400);
    //hide playlist selection
    document.getElementById("playlistSelection").style.display = 'none';
    //hide annotation editor
    //show player stuff
    document.getElementById("trackTitle").style.visibility = 'hidden';
    document.getElementById("playerSection").style.display = 'block';
    document.getElementById("trackArtist").style.visibility = 'hidden';
    document.getElementById("timeStamps").style.visibility = 'hidden';
    document.getElementById("timeStamps").style.height = "0px";
    document.getElementById("waveformDiv").style.visibility = 'hidden';
    document.getElementById("waveformDiv").style.height = "0px";
    document.getElementById("buttonArea").style.visibility = 'hidden';
    document.getElementById("buttonArea").style.height = "0px";

    document.body.style.backgroundImage = 'none';
    getPlaylistImage(playlistId);
    setTimeout(function() {
        document.getElementById("albumCover").setAttribute("src", playlistImageUrl);
    }, 500);
    setTimeout(function(){
        $("#playlistName").text(playlistName).fadeIn();
    },500);
    //hide present
    //document.getElementById("presentSection").style.display = 'none';
    fetchTracks();
    progressMs = 0;
}

/**
 * switches into annotation mode
 */
function switchAnnotationMode() {
    //hide playlist selection
    document.getElementById("playlistSelection").style.display = 'none';
    //show annotation editor
    // document.getElementById("annotationSection").style.display = 'block';
    //removeAllItems("annotationTrack")
    //transferTracks();
    if(document.getElementById("annotationSection").style.visibility == 'hidden')
    {
        document.getElementById("annotationSection").style.visibility = 'visible';
        document.getElementById("annotationSection").style.height = "250px";
        if(document.getElementById("presentSection").style.visibility == "hidden") {
            document.getElementById("trackInfo").setAttribute("class", "shrink");
        }
        setTimeout(wait, 500);
        //document.getElementById("trackArtist").style.display = "none";
        //document.getElementById("trackTitle").style.display = "none";
    }
    else {
        document.getElementById("annotationSection").style.height = "0";
        document.getElementById("annotationSection").style.visibility = 'hidden';
        if(document.getElementById("presentSection").style.visibility == "hidden") {
            document.getElementById("trackInfo").setAttribute("class", "grow");
        }

        setTimeout(wait, 500);
    }
    setTimeout(fetchAnnotations, 500);
}

function showSettings() {
    document.getElementById("modalMenu").style.display = 'block';
}

function closeModal() {
    document.getElementById("modalMenu").style.display = 'none';
    timeBeforeAnno = document.getElementById("timeBeforeAnnoDropdown").value;
    waveformColor = document.getElementById("waveformColorDropdown").value;
    annotationColor = document.getElementById("annotationColorDropdown").value;
}

// function handleSettings() {
//     var e = document.getElementById("waveformColorDropdown");
//     waveformColor = e.options[e.selectedIndex].value;
//     var e2 = document.getElementById("annotationColorDropdown");
//     annototationColor = e2.options[e2.selectedIndex].value;
//     var e3 = document.getElementById("timeBeforeAnnoDropdown");
//     timeBeforeAnno = e3.options[e3.selectedIndex].value;
// }

function presentAnnotations() {
    for (let i = 0; i < currentSongAnnotations.length; i++) {

        let annotation = currentSongAnnotations[i];
        let splitIndex = annotation.lastIndexOf(":");
        let anno = annotation.substring(0, splitIndex);
        let timeBeforeAnnoMs = timeBeforeAnno * 1000;
        let ms = parseInt(annotation.substring(splitIndex + 1, annotation.length)) + timeBeforeAnnoMs/2;
        if ((progressMs < ms) && (ms - timeBeforeAnnoMs <= progressMs)) {
            if(document.getElementById("dotsDiv") != null) {
                document.getElementById("dotsDiv").setAttribute("class", "");
            }
            let time = Math.round(ms / 1000);
            let minutes = Math.floor(time / 60);
            let sec = time - minutes * 60 + '';
            if(lastStoredAnno != anno) {
                lastStoredAnno = anno;
            }
            document.getElementById("currentAnnotation").innerHTML = anno;

            if(anno.length > 60 && anno.length < 139 && document.getElementById("presentSection").style.visibility == "visible") document.getElementById("presentSection").style.height = "220px";
            else if(139 < anno.length  && document.getElementById("presentSection").style.visibility == "visible") document.getElementById("presentSection").style.height = "320px";
            else if(document.getElementById("presentSection").style.visibility == "visible") document.getElementById("presentSection").style.height = "120px";

            if(currentSongAnnotations[i + 1] != null) {
                nextAnnotation = currentSongAnnotations[i + 1];
                let nSplitIndex = nextAnnotation.lastIndexOf(":")
                let nextAnno = nextAnnotation.substring(0, nSplitIndex);
                let nextMs = nextAnnotation.substring(nSplitIndex + 1, nextAnnotation.length);

                let nTime = Math.round(nextMs / 1000);
                let nMinutes = Math.floor(nTime / 60);
                let nSec = nTime - nMinutes * 60 + '';
                document.getElementById("nextAnnotation").innerHTML = nextAnno.substring(0, 10) + "...";
            }
            else {
                document.getElementById("nextAnnotation").innerHTML = "";
            }
        }
        else if(i == 0){
            //$("#currentAnnotation").text("").fadeOut();
            if(document.getElementById("presentSection").style.visibility == "visible") {
                document.getElementById("presentSection").style.height = "100px";
            }
            document.getElementById("currentAnnotation").innerHTML = "";
            document.getElementById("dotsDiv").setAttribute("class", "dot-flashing");
        }
        // else if(i == 0 && progressMs >= ms + 5000) {
        //     if(lastStoredAnno == anno) break;
        //     $("#currentAnnotation").fadeOut(function() {
        //         //$(this).text("").fadeIn();
        //     });
        //     document.getElementById("dotsDiv").setAttribute("class", "dot-flashing");
        // }
        // else if(i == 0) {
        //     document.getElementById("dotsDiv").setAttribute("class", "dot-flashing");
        // }
        // else {
        //
        //     document.getElementById("dotsDiv").setAttribute("class", "dot-flashing");
        // }
    }

}
function wait() {

}

function switchPresentMode() {
    //hide player stuff
    //document.getElementById("playerSection").style.display = 'none';
    //hide playlist selection
    // setTimeout(fetchAnnotations, 500);
    if(document.getElementById("presentSection").style.visibility == 'hidden')
    {
        document.getElementById("presentSection").style.visibility = 'visible';
        document.getElementById("presentSection").style.height = "100px";

        if(document.getElementById("annotationSection").style.visibility == "hidden") {
            document.getElementById("trackInfo").setAttribute("class", "shrink");
        }


        //document.getElementById("trackArtist").style.display = "none";
        //document.getElementById("trackTitle").style.display = "none";
        setTimeout(wait, 500);
    }
    else {
        document.getElementById("presentSection").style.height = "0px";
        document.getElementById("presentSection").style.visibility = 'hidden'
        if(document.getElementById("annotationSection").style.visibility == "hidden") {
            document.getElementById("trackInfo").setAttribute("class", "grow");
        }

        setTimeout(wait, 500);
        //document.getElementById("trackInfo").style.transform = "scale(1)";
    }

    setTimeout(fetchAnnotations, 500);

    let currentSongId = "";

    clearInterval(annotationInterval);

    annotationInterval = setInterval(function() {
        if(currentSongId != trackId){
            currentSongId = trackId;
            fetchAnnotations();
        }
        presentAnnotations();
        if(document.getElementById("presentSection").style.display == 'none')
        {
            clearInterval(annotationInterval);
        }
    }, 1000);
}

/**
 * switches to playlist selection
 */
function switchPlaylistSelection() {
    //hide player stuff
    pause();

    playlistName = "";
    document.getElementById("playerSection").style.display = 'none';
    //hide annotation stuff
    //show playlist selection
    document.getElementById("playlistSelection").style.display = 'block';
    currentSongsOffset = 0;
    currentPlaylistJson = [];
    clickedRow = "";
    trackId = "";
}

function controlMenu() {
    if(document.getElementById("navBar").style.left == "0px") {
        document.getElementById("navBar").style = "left: -100px;";
    }
    else {
        document.getElementById("navBar").style.left = "0";
    }
}

/**
 * removes everything from storage and logs out
 */
function logout() {
    localStorage.clear();
    window.location.href = "https://teamb.dev:2052";
    return false;
}

function handleRedirect() {
    let code = getCode();
    fetchAccessToken(code);
    window.history.pushState("", "", redirect_uri); // remove param from url
}

function getCode() {
    let code = null;
    const queryString = window.location.search;
    if (queryString.length > 0) {
        const urlParams = new URLSearchParams(queryString);
        code = urlParams.get('code')
    }
    return code;
}

function requestAuthorization() {
    client_id = "c6f5c006684341518ba23d7bae85b169";
    localStorage.setItem("client_id", client_id);

    let url = AUTHORIZE;
    url += "?client_id=" + client_id;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirect_uri);
    url += "&show_dialog=true";
    url += "&scope=user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read streaming user-read-playback-state user-read-recently-played playlist-read-private";
    window.location.href = url; // Show Spotify's authorization screen
}

function fetchAccessToken(code) {
    callApi("POST", AUTHORIZETEAMB + "?code=" + code, null, handleAuthorizationResponse);
}

function handleAuthorizationResponse() {
    if (this.status == 200) {
        var data = JSON.parse(this.responseText);
        if (data.access_token != undefined) {
            access_token = data.access_token;
            localStorage.setItem("access_token", access_token);
        }
        if (data.refresh_token != undefined) {
            refresh_token = data.refresh_token;
            localStorage.setItem("refresh_token", refresh_token);
        }

        if(userId == "" || userId == null) {
            setTimeout(function (){
                callApi("GET", USER, null, handleUserIdResponse);
            }, 1000);
        }

        if(!(document.getElementById("playerSection").style.display == "block")) {
            onPageLoad();
        }
    } else {
        console.log(this.responseText);
        //alert(this.responseText);
    }
}

function refreshAccessToken() {
    refresh_token = localStorage.getItem("refresh_token");
    callApi("POST", REFRESHTEAMB +"?uid="+ userId + "&rt=" + refresh_token, null, handleAuthorizationResponse);
}



/**
 * helper function for GET, POST, PUT, and DELETE calls
 * to Spotify API
 */
function callApi(method, url, body, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
    xhr.send(body);
    xhr.onload = callback;
}

function refreshPlaylists() {
    callApi("GET", PLAYLISTS, null, handlePlaylistsResponse);
}

function handlePlaylistsResponse() {
    if (this.status == 200) {
        var data = JSON.parse(this.responseText);
        // console.log(data);
        removeAllItems("playlists");
        data.items.forEach(item => addPlaylist(item));
    } else if (this.status == 401) {
        refreshAccessToken()
    } else {
        console.log(this.responseText);
        //alert(this.responseText);
    }
}

function switchIcon() {
    document.getElementById("buttonArea").remove("fa fa-pause-circle-o");
    let node = document.createElement("i");
    document.getElementById("buttonArea").appendChild(node);
    document.getElementById("buttonArea").classList.add("fa fa-pause-circle-o");
}

function addPlaylist(item) {
    let node = document.createElement("tr");

    let th = document.createElement("th");
    let playlistName = document.createTextNode(item.name);
    node.value = item.id;

    th.appendChild(playlistName);
    node.appendChild(th);
    node.setAttribute("onclick", "handlePlaylistClick()");
    document.getElementById("playlists").appendChild(node);
}

function handlePlaylistClick() {
    playlistName = event.target.innerHTML;
    playlistId = event.target.parentElement.value;
    //console.log(playlistId);
    // console.log(playlistId.value);
    setTimeout(function() {
        switchPlayerMode();
    }, 500);

}

/**
 * clears an HTML component
 */
function removeAllItems(elementId) {
    let node = document.getElementById(elementId);
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
}

/**
 * Take annotation from page and store in mongo
 */
function storeAnnotation() {
    //get annotation text and timestamp from page form
    //replace whitespace with _
    let annotation = String(document.getElementById("annotationText").value);
    // let MMSS = String(document.getElementById("annotationTime").value)
    let min = String(document.getElementById("annotationMin").value)
    let sec = String(document.getElementById("annotationSec").value)
    // let milliseconds = (MMSS * 60000) + (MMSSArray[1] * 1000);
    let milliseconds = (min * 60000) + (sec * 1000);
    //make sure form isn't empty
    if (annotation == '' || min == '' || sec == '') {
        alert("Please enter both the annotation and timestamp.")
        return false
    }
    else if (!(min >= 0) || !(sec >= 0 && sec <= 59)) {
        alert("Please enter a valid time.");
        return false;
    }
    // Get User
    let trackIndex = currentIndex;
    let arrayIndex = 0;
    if (trackIndex > 99) {
        arrayIndex = trackIndex.charAt(0);
    }
    trackIndex -= (100 * arrayIndex);
    let id = jsonArray[arrayIndex].items[trackIndex].track.id;
    let regAnno = annotation.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s/g, '_');
    let annotationData = "?uid=" + userId + "&track=" + id + "&anno=" + regAnno + "&sec=" + milliseconds + "&access_token=" + localStorage.getItem("access_token");
    //send off to mongodb
    callApi("GET", INSERT + annotationData, null, null)
    //refresh annotations for currently selected song
    //refreshAnnotations()
    document.getElementById("annotationText").value = "";
    document.getElementById("annotationMin").value = "";
    document.getElementById("annotationSec").value = "";
    setTimeout(fetchAnnotations, 500);
}

/**
 * Remove annotation from the db
 */
function removeAnnotation() {
    //get annotation text and timestamp from page form
    //replace whitespace with _
    let MM = String(document.getElementById("annotationMin").value)
    let SS = String(document.getElementById("annotationSec").value)
    //make sure form isnt empty
    if (MM == '' || SS == '') {
        alert("Please enter both the annotation and timestamp.")
        return false
    }

    // Get User
    //let dropdown = document.getElementById("tracks");
    let trackIndex = currentIndex; //dropdown.options[dropdown.selectedIndex].value;
    let arrayIndex = 0;
    if (trackIndex > 99) {
        arrayIndex = trackIndex.charAt(0);
    }
    trackIndex -= (100 * arrayIndex);
    let milliseconds = (MM * 60000) + (SS * 1000);
    let id = jsonArray[arrayIndex].items[trackIndex].track.id;
    let removalData = "?uid=" + userId + "&track=" + id + "&sec=" + milliseconds + "&access_token=" + localStorage.getItem("access_token");
    //send off to mongodb
    callApi("GET", REMOVE + removalData, null, null)
    //refresh annotations for currently selected song
    //refreshAnnotations()
    setTimeout(fetchAnnotations, 500);
    document.getElementById("annotationText").value = "";
    document.getElementById("annotationMin").value = "";
    document.getElementById("annotationSec").value = ""
}

function handleUserIdResponse() {
    if (this.status == 200) {
        userId = JSON.parse(this.responseText)["id"];
        localStorage.setItem("userId", userId);
        //console.log("UserID in Handle " + userId);
        refreshAccessToken();
    } else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}


function fetchAnnotations() {
    //let dropdown = document.getElementById("tracks");
    let trackIndex =  currentIndex;//dropdown.options[dropdown.selectedIndex].value;
    let arrayIndex = 0;
    if (trackIndex > 99) {
        arrayIndex = trackIndex.charAt(0);
    }
    trackIndex -= (100 * arrayIndex);
    if (userId != '' && jsonArray[arrayIndex].items[trackIndex].track != null) callApi("GET", RETRIEVE + "?uid=" + userId + "&track=" + jsonArray[arrayIndex].items[trackIndex].track.id + "&access_token=" + localStorage.getItem("access_token"), null, handleAnnotationsResponse)
}

function handleAnnotationsResponse() {
    if (this.status == 200) {
        currentSongAnnotations = [];
        var data = JSON.parse(this.responseText);
        // console.log(data);
        removeAllItems("songAnnotations");
        for (var key in data) {
            addAnnotations(data[key], key)
            // console.log(data[key], key)
        }
    } else {
        console.log(this.responseText);
        //alert(this.responseText);
    }
}

function addAnnotations(annotation, seconds) {
    let node = document.createElement("tr");
    node.value = annotation;
    node.id = seconds
    let td1 = document.createElement("td");
    let td2 = document.createElement("td");

    let newAnno = document.createTextNode(annotation);

    let time = Math.round(seconds / 1000);
    let minutes = Math.floor(time / 60);
    let sec = time - minutes * 60 +'';

    let convertedTime = document.createTextNode(minutes + ":" + sec.padStart(2,'0'));
    td1.appendChild(newAnno);
    td2.appendChild(convertedTime);

    node.appendChild(td1);
    node.appendChild(td2);
    node.setAttribute("onclick", "setAnnotationFields()");
    currentSongAnnotations.push(annotation + ":" + seconds);
    document.getElementById("songAnnotations").appendChild(node);
}



function addTrackAnnotation(item, index) {
    let node = document.createElement("option");
    node.value = index + currentSongsOffset;
    // document.body.style.backgroundImage = "url('" + data.item.album.images[0].url + "')";
    // let albumImage = "img src = '" + "url('" + data.item.album.images[0].url + "')" + "'";
    node.innerHTML = item.track.name + " (" + item.track.artists[0].name + ")";
    node.src = item.track.album.images[0].url;
    // "url('" + data.item.album.images[0].url + "')";
    document.getElementById("annotationTrack").appendChild(node);
}

function shuffle() {
    callApi("PUT", SHUFFLE + "?state=true&device_id=" + web_player_id, null, handleApiResponse);
}

/**
 * plays song from beginning or resumes
 */
function play(index) {
    let body = {};
    body.context_uri = "spotify:playlist:" + playlistId;
    body.offset = {};
    body.offset.position = index;
    body.position_ms = 0;
    callApi("PUT", PLAY + "?device_id=" + web_player_id, JSON.stringify(body), handleApiResponse);
}

function handleRowTrackClick() {
    if(clickedRow != null && clickedRow != "") clickedRow.setAttribute("class", "");
    clickedRow = event.target;
    clickedRow.parentElement.cells[2].innerHTML = "Today";
    play(clickedRow.parentElement.value);
}

/**
 * plays song from specified time position
 */
function seek(position) {
    // let trackIndex;
    // if(trackId == "") {
    //     trackIndex = 0;
    // }
    // else {
    //     for(let i in currentPlaylistJson) {
    //         if(currentPlaylistJson[i][i] == trackId) trackIndex = i;
    //     }
    // }
    lastStoredAnno = "";
    let body = {};
    body.context_uri = "spotify:playlist:" + playlistId;
    body.offset = {};
    body.offset.position = currentIndex;
    body.position_ms = position;
    callApi("PUT", PLAY + "?device_id=" + web_player_id, JSON.stringify(body), handleApiResponse);
}

function handleResume() {
    seek(progressMs);
}

function pause() {
    callApi("PUT", PAUSE + "?device_id=" + web_player_id, null, handlePauseResponse);
    clearInterval(waveformTimer);
}

function next() {
    progressMs = 0;
    callApi("POST", NEXT + "?device_id=" + web_player_id, null, handleApiResponse);
}

function previous() {
    progressMs = 0;
    callApi("POST", PREVIOUS + "?device_id=" + web_player_id, null, handleApiResponse);
}

function getPlaylistImage(id) {
    //console.log(id);
    let updatedUrl = PLAYLISTIMAGE.replace("{playlist_id}", id);
    //console.log(updatedUrl);
    callApi("GET", updatedUrl, null, handlePlaylistImage);
}

function handlePlaylistImage(){
    if(this.status == 200) {
        var data = JSON.parse(this.responseText);
        playlistImageUrl = data[0].url;
    }
    else {
        console.log(this.responseText);
    }
}

function handleApiResponse() {
    if (this.status == 200) {
        console.log(this.responseText);
        setTimeout(currentlyPlaying, 1000);
    } else if (this.status == 204) {
        setTimeout(currentlyPlaying, 1000);
    } else if (this.status == 401) {
        refreshAccessToken()
    } else {
        console.log(this.responseText);
        //alert(this.responseText);
    }
}

function handlePauseResponse() {
    if (this.status == 200) {
        var data = JSON.parse(this.responseText);
        progressMs = data.progress_ms;
        setTimeout(currentlyPlaying, 2000);
    } else if (this.status == 204) {
        setTimeout(currentlyPlaying, 2000);
    } else if (this.status == 401) {
        refreshAccessToken()
    } else {
        console.log(this.responseText);
    }
}

/**
 * when a user selects a annotation from the box, the text and time fields are filled
 */
function setAnnotationFields() {
    $(window).scrollTop(0);
    let annotationTable = event.target.parentElement;
    let text = annotationTable.value;
    let storedMs = annotationTable.id;
    var timePro = Math.round(storedMs / 1000);
    var minutesPro = Math.floor(timePro / 60);
    var secPro = timePro - minutesPro * 60 +'';
    document.getElementById("annotationText").value = text;
    // document.getElementById("annotationText").value = minutesPro + ":" + secPro.padStart(2,'0');
    document.getElementById("annotationMin").value = minutesPro;
    document.getElementById("annotationSec").value = secPro.padStart(2,'0');
    seek(storedMs);
}

/**
 * fills player section with songs from current playlist
 */
function fetchTracks() {
    currentSongsOffset = 0;
    removeAllItems("tracks");
    // let playlist_id = document.getElementById("playlists").value;
    // let playlist = document.getElementById("playlists");
    // let playlist_size = playlist.options[playlist.selectedIndex].innerText.split("(")[1];
    // playlist_size = playlist_size.substring(0, playlist_size.length - 1);
    if (playlistId.length > 0) {
        let url = TRACKS.replace("{{PlaylistId}}", playlistId);
        //reset jsonarray here otherwise the previous playlists would still be stored
        jsonArray = [];
        callApi("GET", RETRIEVEDATES + "?uid=" + userId + "&access_token="+ localStorage.getItem("access_token"), null, handleDatesResponse);
        setTimeout(function () {
            callApi("GET", url, null, handleTracksResponse);
        }, 200);
    }

}

function handleDatesResponse() {
    if (this.status == 200) {
        let localUID = localStorage.getItem("userId");
        if(localUID != null) userId = localUID;
        currentPlaylistDates = [];
        var data = JSON.parse(this.responseText);
        // console.log(data);
        removeAllItems("songAnnotations");
        for (var key in data) {
            currentPlaylistDates.push({[key]: data[key]});
        }

    }
    else{
        console.log(this.responseText)
    }
}

function handleTracksResponse() {
    if (this.status == 200) {
        var data = JSON.parse(this.responseText);
        // previousCurrentSongs = currentSongs
        // currentSongs = Object.assign(previousCurrentSongs, data)
        jsonArray.push(data);
        //console.log(data);
        data.items.forEach((item, index) => addTrack(item, index));
        //console.log(data.next);
        if (data.next != null) {
            currentSongsOffset += 100;
            callApi("GET", data.next, null, handleTracksResponse);
        }
    } else if (this.status == 401) {
        refreshAccessToken()
    } else {
        console.log(this.responseText);
        //alert(this.responseText);
    }
}

function addTrack(item, index) {
    let node = document.createElement("tr");
    node.value = index + currentSongsOffset;
    if (item.track != null) {
        let td1 = document.createElement("td");
        let td2 = document.createElement("td");
        let td3 = document.createElement("td");

        let trackName = document.createTextNode(item.track.name) ;
        let artist = document.createTextNode(item.track.artists[0].name);
        let lastPlayed = document.createTextNode("Never Played");
        for(let i in currentPlaylistDates) {
            if(currentPlaylistDates[i][item.track.id] != undefined) {
                let today = new Date();
                let oldDate = new Date(currentPlaylistDates[i][item.track.id]);
                let msInDay = 24 * 60 * 60 * 1000;
                today.setHours(0,0,0,0);
                oldDate.setHours(0,0,0,0)
                let diff = (+today - +oldDate)/msInDay
                let floorDiff = Math.floor(diff);
                if(diff == 0) {
                    lastPlayed = document.createTextNode("Today");
                }
                else if(diff == 1) {
                    lastPlayed = document.createTextNode(floorDiff + " Day Ago");
                }
                else {
                    lastPlayed = document.createTextNode(floorDiff + " Days Ago");
                }
            }
        }

        td1.appendChild(trackName);
        td2.appendChild(artist);
        td3.appendChild(lastPlayed);

        node.appendChild(td1);
        node.appendChild(td2);
        node.appendChild(td3);

        node.setAttribute("onclick", "handleRowTrackClick()");
        node.id = item.track.id;
        document.getElementById("tracks").appendChild(node);
        currentPlaylistJson.push({[node.value]: node.id});
    } else {
        return;
    }
}

function currentlyPlaying() {
    callApi("GET", PLAYER + "?market=US", null, handleCurrentlyPlayingResponse);
}

function handleCurrentlyPlayingResponse() {
    if (this.status == 200) {
        var data = JSON.parse(this.responseText);
        if (data.item != null && document.getElementById("playlistSelection").style.display != "block") {
            //call analyze
            if(currentWaveformId !== data.item.id) { getTrackAnalysis(data.item.id); }

            if(currentAlbumCover != data.item.album.images[0].url) {
                $("#albumCover").fadeOut(function() {
                    $(this).attr("src", data.item.album.images[0].url).fadeIn();
                });
                currentAlbumCover = data.item.album.images[0].url;
            }
            if(currentTrackTitle != data.item.name) {
                $("#trackTitle").fadeOut(function() {
                    $(this).text(data.item.name).fadeIn();
                });
                currentTrackTitle = data.item.name;
            }
            if(currentTrackArtist != data.item.artists[0].name) {
                $("#trackArtist").fadeOut(function() {
                    $(this).text(data.item.artists[0].name).fadeIn();
                });
                currentTrackArtist = data.item.artists[0].name;
            }

        }
    } else if (this.status == 204) {

    } else if (this.status == 401) {
        refreshAccessToken()
    } else {
        console.log(this.responseText);
        //alert(this.responseText);
    }
}

function saveNewRadioButton() {
    let item = {};
    item.deviceId = web_player_id;
    item.playlistId = document.getElementById("playlists").value;
    radioButtons.push(item);
    localStorage.setItem("radio_button", JSON.stringify(radioButtons));
    refreshRadioButtons();
}

function refreshRadioButtons() {
    let data = localStorage.getItem("radio_button");
    if (data != null) {
        radioButtons = JSON.parse(data);
        if (Array.isArray(radioButtons)) {
            removeAllItems("radioButtons");
            radioButtons.forEach((item, index) => addRadioButton(item, index));
        }
    }
}

function onRadioButton(deviceId, playlistId) {
    let body = {};
    body.context_uri = "spotify:playlist:" + playlistId;
    body.offset = {};
    body.offset.position = 0;
    body.offset.position_ms = 0;
    callApi("PUT", PLAY + "?device_id=" + deviceId, JSON.stringify(body), handleApiResponse);
    //callApi( "PUT", SHUFFLE + "?state=true&device_id=" + deviceId, null, handleApiResponse );
}

function addRadioButton(item, index) {
    let node = document.createElement("button");
    node.className = "btn btn-primary m-2";
    node.innerText = index;
    node.onclick = function () {
        onRadioButton(item.deviceId, item.playlistId)
    };
    document.getElementById("radioButtons").appendChild(node);
}

/**
 * Gets track analysis for current song. Must take in a trackid when called.
 * @param trackId of current song
 */
function getTrackAnalysis(trackId) {
    let url = ANALYSIS.replace("{id}", trackId);
    callApi("GET", url, null, analyzeWaveform);
}

/**
 * Handles response from API call and creates a .json with each point for
 * the waveform.
 */
function analyzeWaveform() {
    if (this.status == 200) {
        let data = JSON.parse(this.responseText);
        duration = data.track.duration;

        let segments = data.segments.map(segment => {
            return {
                start: segment.start / duration,
                duration: segment.duration / duration,
                loudness: 1 - (Math.min(Math.max(segment.loudness_max, -35), 0) / -35)
            }
        })

        let min = Math.min(...segments.map(s => s.loudness));
        let max = Math.max(...segments.map(s => s.loudness));

        let levels = [];

        for (let i = 0.000; i < 1; i += 0.001) {
            let s = segments.find(segment => {
                return i <= segment.start + segment.duration;
            })

            let loudness = Math.round((s.loudness / max) * 100) / 100;
            if (loudness == 0) loudness = 0.01
            levels.push(loudness);
            currentTrackLevels = levels;
            showProgress();
            drawWaveformsHandler(levels);
        }
    }
    else if(this.status == 401) {
        refreshAccessToken();
    }
}

function drawWaveformsHandler(levelsData) {
    clearInterval(intervalId);

    intervalId = setInterval(function() {
        drawWaveform(levelsData, "canvasBg", -2500)
        drawWaveforms(levelsData);
    }, 1000);
    currentWaveformId = trackId;
}

function drawWaveforms(data) {
    let elementTop = document.getElementById("canvasTop")
    let elementBottom = document.getElementById("canvasBottom")
    if(waveformTop) {
        drawWaveform(data, "canvasTop", -1000)
        drawWaveform(data, "canvasBottom", 0)
        /**
         * fade in and out
         */
        clearInterval(waveformTimer);
        var opOut = 1;  // initial opacity
        var opIn = 0;  // initial opacity
        waveformTimer = setInterval(function () {
            if (opOut == 0 || opIn == 1){
                clearInterval(waveformTimer);
            }
            elementBottom.style.opacity = opOut;
            elementBottom.style.filter = 'alpha(opacity=' + opOut + ")";
            opOut -= .01;
            elementTop.style.opacity = opIn;
            elementTop.style.filter = 'alpha(opacity=' + opIn + ")";
            opIn += .01;}, 10);
        waveformTop = false;
    }
    else {
        drawWaveform(data, "canvasTop", 0)
        drawWaveform(data, "canvasBottom", -1000)
        /**
         * fade in and out
         */
        clearInterval(waveformTimer);
        var opOut = 1;  // initial opacity
        var opIn = 0;  // initial opacity
        waveformTimer = setInterval(function () {
            if (opOut == 0 || opIn == 1){
                clearInterval(waveformTimer);
            }
            elementTop.style.opacity = opOut;
            elementTop.style.filter = 'alpha(opacity=' + opOut + ")";
            opOut -= .01;
            elementBottom.style.opacity = opIn;
            elementBottom.style.filter = 'alpha(opacity=' + opIn + ")";
            opIn += .01;}, 10);
        waveformTop = true;
    }

}

/**
 * Function that uses canvas to draw the waveform for each song.
 * Data is the array of points.
 */
function drawWaveform(data, id, offset) {
    if(lastPlayedSongId != trackId) {
        currentMarkedAnnotations = new Map();
    }
    let canvas = document.getElementById(id);
    let {height, width} = canvas.parentNode.getBoundingClientRect();

    canvas.width = width;
    canvas.height = height;

    let context = canvas.getContext('2d');
    //console.log(width);
    for (let x = 0; x < width; x++) {
        if (x % 8 == 0) {
            let i = Math.ceil(data.length * (x / width));

            let h = Math.round(data[i] * height) / 2;

            if(offset == -1) {
                fill = "white"
            }
            else {
                let check = false;
                if(currentSongAnnotations != null &&
                    document.getElementById("presentSection").style.visibility == "visible" ||
                    document.getElementById("annotationSection").style.visibility == "visible") {
                    let firstAnno = currentSongAnnotations[0].substring(0, currentSongAnnotations[0].lastIndexOf(":"));
                    if(!(firstAnno == "You have no annotations for this song!")) {
                        for(let a = 0; a < currentSongAnnotations.length; a++) {
                            let annotation = currentSongAnnotations[a];
                            let splitIndex = annotation.lastIndexOf(":");
                            let ms = parseInt(annotation.substring(splitIndex + 1, annotation.length))
                            let percentage = ms / currentDuration;
                            if (((x / width) > (percentage) && (percentage + .01) > (x / width)) && currentMarkedAnnotations.get(annotation) == undefined) {
                                check = true;
                                currentMarkedAnnotations.set(annotation, true);
                            }
                        }
                    }
                }
                if (check) {
                    fill = annotationColor;
                }
                else if ((x / width) < ((progressMs - offset) / currentDuration)) {
                    fill = waveformColor;
                } else {
                    fill = "#d3d3d3"
                }
            }

            context.fillStyle = fill;
            if (((height / 2) - h) == 0) {
                context.fillRect(x, .1, 4, h);
            } else {
                context.fillRect(x, (height / 2) - h, 4, h);
            }
            context.fillRect(x, (height / 2), 4, h);
        }
    }
}

/**
 * handles user clicking on waveform
 */
function handleWaveformClick() {
    var rect = document.getElementById("canvasBg").getBoundingClientRect();
    var positionPercentage = 1 - ((rect.right - event.clientX) / (rect.right - rect.left));
    seek((positionPercentage * currentDuration));
    drawWaveformsHandler(currentTrackLevels);

    setTimeout(function(){
        var timePro = Math.round(progressMs / 1000);
        var minutesPro = Math.floor(timePro / 60);
        var secPro = timePro - minutesPro * 60 +'';
        // document.getElementById("annotationTime").value = minutesPro + ":" + secPro.padStart(2,'0');
        document.getElementById("annotationMin").value = minutesPro;
        document.getElementById("annotationSec").value = secPro.padStart(2, '0');
    }, 1000);
}

/**
 * Show song progress and duration in numbers
 */
function showProgress(){
    var timeDur = Math.round(currentDuration / 1000);
    var minutesDur = Math.floor(timeDur / 60);
    var secDur = timeDur - minutesDur * 60 +'';

    document.getElementById("duration").innerHTML = minutesDur + ":" + secDur.padStart(2,'0');

    clearInterval(progressTimer);

    progressTimer = setInterval(function () {
        var timePro = Math.round(progressMs / 1000);
        var minutesPro = Math.floor(timePro / 60);
        var secPro = timePro - minutesPro * 60 +'';
        document.getElementById("progress").innerHTML = minutesPro + ":" + secPro.padStart(2,'0');
    })
}

/**
 *Get Date
 *
 */
 function getDate(){
     let date = new Date();
     let day = date.getDate();
     let month = date.getMonth()+1;
     let year = date.getFullYear();
     currentDate = month+"/"+day+"/"+year;
 }

function storeDate() {
    getDate();
    //make sure form isnt empty
    if (currentDate == "") {
        console.log("No Date")
        return false
    }
    let dateData = "?uid=" + userId + "&track=" + trackId + "&date=" + currentDate + "&access_token=" + localStorage.getItem("access_token")

    //send off to mongodb
    callApi("GET", INSERTDATE + dateData, null, null)
}

/**
 * Set up the Web Playback SDK
 */
window.onSpotifyPlayerAPIReady = () => {
    const player = new Spotify.Player({
        name: 'Spotify Annotation Player',
        getOAuthToken: cb => {
            cb(access_token);
        }
    });

    // Error handling
    player.on('initialization_error', e => console.error(e));
    player.on('authentication_error', e => console.error(e));
    player.on('account_error', e => console.error(e));
    player.on('playback_error', e => console.error(e));

    // Ready
    player.on('ready', data => {
        console.log('Ready with Device ID', data.device_id);
        web_player_id = data.device_id;
    });
    //console.log(userId);

    player.addListener('player_state_changed', ({paused, position, duration, track_window: {current_track}}) => {
        for(let i in currentPlaylistJson) {
            if(currentPlaylistJson[i][i] == trackId) currentIndex = i;
        }

        if(document.getElementById("timeStamps").style.visibility == 'hidden') {
            $("#playlistName").text(playlistName).fadeOut();
            document.getElementById("trackTitle").innerHTML = "";
            document.getElementById("trackArtist").innerHTML = "";
            document.getElementById("trackTitle").style.visibility = 'visible';
            document.getElementById("trackArtist").style.visibility = 'visible';
            document.getElementById("timeStamps").style.visibility = 'visible';
            document.getElementById("timeStamps").style.height = "20px";
            document.getElementById("waveformDiv").style.visibility = 'visible';
            document.getElementById("waveformDiv").style.height = "100px";
            document.getElementById("buttonArea").style.visibility = 'visible';
            document.getElementById("buttonArea").style.height = "50px";
        }

        progressMs = position;
        clearInterval(playerInterval)
        isPaused = paused;
        if(isPaused){
            document.getElementById("playPause").style.display = 'contents';
            document.getElementById("pausePlay").style.display = 'none';
        }
        else {
            document.getElementById("pausePlay").style.display = 'contents';
            document.getElementById("playPause").style.display = 'none';
        }

        playerInterval = setInterval(function() {
            progressMs += paused ? 0 : 1000;
        }, 1000);
        currentDuration = duration;
        if(trackId != current_track.id){
            nextAnnotation = "";
            document.getElementById("nextAnnotation").innerHTML = "";
        }
        trackId = current_track.id
        currentPlayingObject = current_track;
        currentlyPlaying();
        for(let i in currentPlaylistJson) {
            if(currentPlaylistJson[i][i] == trackId) document.getElementById("tracks").value = i;
            if(currentPlaylistJson[i][i] == current_track.linked_from.id) document.getElementById("tracks").value = i;
        }


        if(clickedRow != null) {
            if(clickedRow != "") {
                clickedRow.setAttribute("class", "");
            }
            clickedRow = document.getElementById(trackId);
            if(clickedRow == null) {
                clickedRow = document.getElementById(current_track.linked_from.id);
                trackId = current_track.linked_from.id;
            }
            clickedRow.setAttribute("class", "active-row");
            currentIndex = clickedRow.parentElement.value;
        }

        storeDate();
        fetchAnnotations();
    });

    // Connect to the player!
    player.connect();
}
