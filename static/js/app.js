var redirect_uri = "https://teamb.dev:2052/player";

var client_id = "";
var client_secret = "";
var waveformTop = true;
//interval ids
var intervalId = "";
var annotationInterval = "";
var annotationIndex = 0;
var playerInterval = "";
var waveformTimer = "";
var progressTimer = "";

var currentPlaylistJson = []
var currentSongAnnotations = [];
var currentWaveformId = "";
var currentTrackLevels = "";
var jsonArray = [];
var web_player_id = "";
var currentSongsOffset = 0;
var access_token = null;
var refresh_token = null;
var currentPlaylist = "";
var radioButtons = [];
var userId = "";
var trackId = "";
var currentDuration = 0;
var progressMs = 0;
var currentPlayingObject = null;

const AUTHORIZE = "https://accounts.spotify.com/authorize"
const TOKEN = "https://accounts.spotify.com/api/token";
const PLAYLISTS = "https://api.spotify.com/v1/me/playlists?limit=50";
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
const USER = "https://api.spotify.com/v1/me"
const INSERT = "https://teamb.dev:2052/insert"
const RETRIEVE = "https://teamb.dev:2052/retrieve"
const REMOVE = "https://teamb.dev:2052/remove"

function onPageLoad() {
    client_id = localStorage.getItem("client_id");
    client_secret = localStorage.getItem("client_secret");
    if (window.location.search.length > 0) {
        handleRedirect();
    } else {
        access_token = localStorage.getItem("access_token");
        if (access_token == null) {
            // we don't have an access token so present token section
            document.getElementById("tokenSection").style.display = 'block';
        } else {
            // we have an access token so present de
            document.getElementById("playlistSelection").style.display = 'block';
            refreshPlaylists();
            currentlyPlaying();
        }
    }
    refreshRadioButtons();
}

/**
 * switches into player mode
 */
function switchPlayerMode() {
    //hide playlist selection
    document.getElementById("playlistSelection").style.display = 'none';
    //hide annotation editor
    document.getElementById("annotationSelection").style.display = 'none';
    //show player stuff
    document.getElementById("deviceSection").style.display = 'block';
    document.body.style.backgroundImage = 'none';
    //hide present
    document.getElementById("presentSelection").style.display = 'none';
    showButtons();
    document.getElementById("tracks").style.display = 'block';
    //auto load tracks. Currently theres also a button. Just make the program auto fetch the tracks ~5-10 seconds. Less ugly and less for user to think about
    fetchTracks();
}

/**
 * switches into annotation mode
 */
function switchAnnotationMode() {
    //hide playlist selection
    document.getElementById("playlistSelection").style.display = 'none';
    //show annotation editor
    // document.getElementById("annotationSelection").style.display = 'block';
    //removeAllItems("annotationTrack")
    //transferTracks();
    if(document.getElementById("annotationSelection").style.display == 'none')
    {
        document.getElementById("annotationSelection").style.display = 'block';
    }
    else {
        document.getElementById("annotationSelection").style.display = 'none';
    }
    callApi("GET", USER, null, handleUserIdResponse);
    setTimeout(fetchAnnotations, 500);

}

function presentAnnotations() {
    //console.log("in presentAnnotation")
    currentSongAnnotations.forEach(annotation => {
       let x = annotation.split(":");
       //console.log("X :" + x);
       //console.log("In for each: " + x[0]);
       //  if(progressMs < x[1]) {
       //      if(x[1]-5000 <= progressMs) {
       //          console.log("x[1]-5000 <= progressMs")
       //      }
       //  }
       if((progressMs < x[1]) && (x[1]-5000 <= progressMs)) {
           //console.log(x[0]);
            document.getElementById("annotationHeader").innerHTML = x[0];
       }
   })
}

function switchPresentMode() {
    //hide player stuff
    //document.getElementById("deviceSection").style.display = 'none';
    //hide playlist selection
    // setTimeout(fetchAnnotations, 500);
    switchAnnotationMode();
    document.getElementById("annotationSelection").style.display = 'none';
    document.getElementById("playlistSelection").style.display = 'none';
    //show present mode
    document.getElementById("presentSelection").style.display = 'block';
    document.getElementById("annotationSelection").style.display = 'none';
    document.getElementById("tracks").style.display = 'none';
    hideButtons();

    clearInterval(annotationInterval);

    annotationInterval = setInterval(function() {
        presentAnnotations();
        if(document.getElementById("presentSelection").style.display == 'none')
        {
            clearInterval(annotationInterval);
        }
    }, 1000);
}


/**
 * switches to playlist selection but allow player to keep playing
 */
function switchPlaylistSelection() {
    //hide player stuff
    document.getElementById("deviceSection").style.display = 'none';
    //hide annotation stuff
    document.getElementById("annotationSelection").style.display = 'none';
    //show playlist selection
    document.getElementById("playlistSelection").style.display = 'block';
    document.body.style.backgroundImage = 'none';
    removeAllItems("annotationTrack")
    currentSongsOffset = 0;
    currentPlaylistJson = [];
}

function hideButtons() {
    // if(document.getElementById("presentSelection") == 'block') {
    document.getElementById("present").style.display = 'none';
    document.getElementById("playlistsButton").style.display = 'none';
    document.getElementById("annotationButton").style.display = 'none';
    document.getElementById("logoutButton").style.display = 'none';
    document.getElementById("exitPresent").style.display = 'block';
    // }
    // else {
    //     document.getElementById("present").style.display = 'block';
    //     document.getElementById("playlistsButton").style.display = 'block';
    //     document.getElementById("annotationButton").style.display = 'block';
    //     document.getElementById("logoutButton").style.display = 'block';
    // }
}

function showButtons() {
    document.getElementById("present").style.display = 'block';
    document.getElementById("playlistsButton").style.display = 'block';
    document.getElementById("annotationButton").style.display = 'block';
    document.getElementById("logoutButton").style.display = 'block';
    document.getElementById("exitPresent").style.display = 'none';
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
    client_secret = "daab896cb43846d995865e9d40296b01";
    localStorage.setItem("client_id", client_id);
    localStorage.setItem("client_secret", client_secret); // In a real app you should not expose your client_secret to the user

    let url = AUTHORIZE;
    url += "?client_id=" + client_id;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirect_uri);
    url += "&show_dialog=true";
    url += "&scope=user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read streaming user-read-playback-state user-read-recently-played playlist-read-private";
    window.location.href = url; // Show Spotify's authorization screen
}

function fetchAccessToken(code) {
    let body = "grant_type=authorization_code";
    body += "&code=" + code;
    body += "&redirect_uri=" + encodeURI(redirect_uri);
    body += "&client_id=" + client_id;
    body += "&client_secret=" + client_secret;
    callAuthorizationApi(body);
}

function refreshAccessToken() {
    refresh_token = localStorage.getItem("refresh_token");
    let body = "grant_type=refresh_token";
    body += "&refresh_token=" + refresh_token;
    body += "&client_id=" + client_id;
    callAuthorizationApi(body);
}

function callAuthorizationApi(body) {
    let xhr = new XMLHttpRequest();
    xhr.open("POST", TOKEN, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(client_id + ":" + client_secret));
    xhr.send(body);
    xhr.onload = handleAuthorizationResponse;
}

function handleAuthorizationResponse() {
    if (this.status == 200) {
        var data = JSON.parse(this.responseText);
        // console.log(data);
        var data = JSON.parse(this.responseText);
        if (data.access_token != undefined) {
            access_token = data.access_token;
            localStorage.setItem("access_token", access_token);
        }
        if (data.refresh_token != undefined) {
            refresh_token = data.refresh_token;
            localStorage.setItem("refresh_token", refresh_token);
        }
        onPageLoad();
    } else {
        console.log(this.responseText);
        //alert(this.responseText);
    }
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
        document.getElementById('playlists').value = currentPlaylist;
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
    let node = document.createElement("option");
    node.value = item.id;
    node.innerHTML = item.name + " (" + item.tracks.total + ")";
    document.getElementById("playlists").appendChild(node);
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
    let annotation = String(document.getElementById("annotationText").value).replace(/\s/g, '_')
    let MMSS = String(document.getElementById("annotationTime").value)
    let MMSSArray = MMSS.split(':');
    let milliseconds = (MMSSArray[0] * 60000) + (MMSSArray[1] * 1000);
    console.log(milliseconds);
    //make sure form isnt empty
    if (annotation == '' || MMSS == '') {
        alert("Please enter both the annotation and timestamp.")
        return false
    }
    // Get User
    let dropdown = document.getElementById("tracks");
    let trackIndex = dropdown.options[dropdown.selectedIndex].value;
    let arrayIndex = 0;
    if (trackIndex > 100) {
        arrayIndex = trackIndex.charAt(0);
    }
    let id = jsonArray[arrayIndex].items[trackIndex].track.id;
    let annotationData = "?uid=" + userId + "&track=" + id + "&anno=" + annotation + "&sec=" + milliseconds + "&refresh_token=TESTING"

    //send off to mongodb
    callApi("GET", INSERT + annotationData, null, null)
    //refresh annotations for currently selected song
    //refreshAnnotations()
    document.getElementById("annotationText").value = "";
    document.getElementById("annotationTime").value = "";
    setTimeout(fetchAnnotations, 500);
}

/**
 * Remove annotation from the db
 */
function removeAnnotation() {
    //get annotation text and timestamp from page form
    //replace whitespace with _
    let MMSS = String(document.getElementById("annotationTime").value)
    //make sure form isnt empty
    if (MMSS == '') {
        alert("Please enter both the annotation and timestamp.")
        return false
    }

    // Get User
    let dropdown = document.getElementById("tracks");
    let trackIndex = dropdown.options[dropdown.selectedIndex].value;
    let arrayIndex = 0;
    if (trackIndex > 100) {
        arrayIndex = trackIndex.charAt(0);
    }
    let MMSSArray = MMSS.split(':');
    let milliseconds = (MMSSArray[0] * 60000) + (MMSSArray[1] * 1000);
    let id = jsonArray[arrayIndex].items[trackIndex].track.id;
    let removalData = "?uid=" + userId + "&track=" + id + "&sec=" + milliseconds;
    //send off to mongodb
    callApi("GET", REMOVE + removalData, null, null)
    //refresh annotations for currently selected song
    //refreshAnnotations()
    setTimeout(fetchAnnotations, 500);
    document.getElementById("annotationText").value = "";
    document.getElementById("annotationTime").value = "";
}

function handleUserIdResponse() {
    if (this.status == 200) {
        userId = JSON.parse(this.responseText)["id"];
        // console.log(userId);
    } else {
        console.log(this.responseText);
        //alert(this.responseText);
    }
}


function fetchAnnotations() {
    let dropdown = document.getElementById("tracks");
    let trackIndex = dropdown.options[dropdown.selectedIndex].value;
    let arrayIndex = 0;
    if (trackIndex > 100) {
        arrayIndex = trackIndex.charAt(0);
    }
    // console.log(jsonArray[arrayIndex].items[trackIndex])
    // console.log(trackIndex)
    if (userId != '') callApi("GET", RETRIEVE + "?uid=" + userId + "&track=" + jsonArray[arrayIndex].items[trackIndex].track.id, null, handleAnnotationsResponse)
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
    let node = document.createElement("option");
    node.innerHTML = annotation;
    node.value = seconds;
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
    play();
}

/**
 * plays song from beginning or resumes
 */
function play() {
    let playlist_id = document.getElementById("playlists").value;
    let trackIndex = document.getElementById("tracks").value;

    let body = {};
    body.context_uri = "spotify:playlist:" + playlist_id;
    body.offset = {};
    body.offset.position = trackIndex;
    body.position_ms = 0;
    callApi("PUT", PLAY + "?device_id=" + web_player_id, JSON.stringify(body), handleApiResponse);
}

/**
 * plays song from specified time position
 */
function seek(position) {
    let playlist_id = document.getElementById("playlists").value;
    let trackIndex = document.getElementById("tracks").value;

    let body = {};
    body.context_uri = "spotify:playlist:" + playlist_id;
    body.offset = {};
    body.offset.position = trackIndex;
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
    let annotationBox = document.getElementById("songAnnotations");
    let annotation = annotationBox.options[annotationBox.selectedIndex];
    let text = annotation.innerText;
    let storedMs = annotation.value;
    var timePro = Math.round(storedMs / 1000);
    var minutesPro = Math.floor(timePro / 60);
    var secPro = timePro - minutesPro * 60 +'';
    document.getElementById("annotationText").value = text;
    document.getElementById("annotationTime").value = minutesPro + ":" + secPro.padStart(2,'0');
    seek(storedMs);
}

/**
 * fills player section with songs from current playlist
 */
function fetchTracks() {
    currentSongsOffset = 0;
    removeAllItems("tracks");
    let playlist_id = document.getElementById("playlists").value;
    let playlist = document.getElementById("playlists");
    let playlist_size = playlist.options[playlist.selectedIndex].innerText.split("(")[1];
    playlist_size = playlist_size.substring(0, playlist_size.length - 1);
    if (playlist_id.length > 0) {
        let url = TRACKS.replace("{{PlaylistId}}", playlist_id);
        //reset jsonarray here otherwise the previous playlists would still be stored
        jsonArray = []
        callApi("GET", url, null, handleTracksResponse);
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
    let node = document.createElement("option");
    node.value = index + currentSongsOffset;
    if (item.track != null) {
        node.innerHTML = item.track.name + " (" + item.track.artists[0].name + ")";
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

            //document.getElementById("albumCover").src= data.item.album.images[0].url;
            document.getElementById("trackTitle").innerHTML = data.item.name;
            document.getElementById("trackArtist").innerHTML = data.item.artists[0].name;
        }

        if (data.context != null) {
            // select playlist
            currentPlaylist = data.context.uri;
            currentPlaylist = currentPlaylist.substring(currentPlaylist.lastIndexOf(":") + 1, currentPlaylist.length);
            document.getElementById('playlists').value = currentPlaylist;
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
                if ((x / width) < ((progressMs - offset) / currentDuration)) {
                    fill = "green";
                } else {
                    fill = "white"
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
        document.getElementById("annotationTime").value = minutesPro + ":" + secPro.padStart(2,'0');
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

    player.addListener('player_state_changed', ({paused, position, duration, track_window: {current_track}}) => {
        progressMs = position;
        clearInterval(playerInterval)

        playerInterval = setInterval(function() {
            progressMs += paused ? 0 : 1000;
        }, 1000);
        currentDuration = duration;
        trackId = current_track.id
        currentPlayingObject = current_track;
        currentlyPlaying();
        for(let i in currentPlaylistJson) {
            if(currentPlaylistJson[i][i] == trackId) document.getElementById("tracks").value = i;
        }

        //document.getElementById("tracks").value = ;

    });

    // Connect to the player!
    player.connect();
}

