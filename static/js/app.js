var redirect_uri = "https://teamb.dev:2052/player";

var client_id = "";
var client_secret = "";

var web_player_id = "";

var access_token = null;
var refresh_token = null;
var currentPlaylist = "";
var currentSongs = null;
var radioButtons = [];
var userId = "";
var trackId = "";

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

function onPageLoad() {
    client_id = localStorage.getItem("client_id");
    client_secret = localStorage.getItem("client_secret");
    if ( window.location.search.length > 0 ){
        handleRedirect();
    }
    else {
        access_token = localStorage.getItem("access_token");
        if ( access_token == null ){
            // we don't have an access token so present token section
            document.getElementById("tokenSection").style.display = 'block';
        }
        else {
            // we have an access token so present de
            document.getElementById("playlistSelection").style.display = 'block';
            refreshDevices();
            refreshPlaylists();
            currentlyPlaying();
        }
    }
    refreshRadioButtons();
}

//switches into player mode
function switchPlayerMode() {
    //hide playlist selection
    document.getElementById("playlistSelection").style.display = 'none';
    //hide annotation editor
    document.getElementById("annotationSelection").style.display = 'none';
    //show player stuff
    document.getElementById("deviceSection").style.display = 'block';
    //auto load tracks. Currently theres also a button. Just make the program auto fetch the tracks ~5-10 seconds. Less ugly and less for user to think about
    fetchTracks();
    refreshDevices();
    //transferToWebPlayer();
}

//switches into annotation mode
function switchAnnotationMode() {
    //hide player stuff
    document.getElementById("deviceSection").style.display = 'none';
    //hide playlist selection
    document.getElementById("playlistSelection").style.display = 'none';
    //show annotation editor
    document.getElementById("annotationSelection").style.display = 'block';
    transferTracks();
    callApi("GET", USER, null, handleUserIdResponse);
    setTimeout(refreshSelectedAnnotationSong, 100);
}

//switches to playlist selection but allow player to keep playing
function switchPlaylistSelection() {
    //hide player stuff
    document.getElementById("deviceSection").style.display = 'none';
    //hide annotation stuff
    document.getElementById("annotationSelection").style.display = 'none';
    //show playlist selection
    document.getElementById("playlistSelection").style.display = 'block';
    removeAllItems("annotationTrack")
}


//removes everything from storage and logs out
function removeAll() {
    localStorage.clear();
    window.location.href = "https://teamb.dev:2052";
    return false;
}

function handleRedirect(){
    let code = getCode();
    fetchAccessToken( code );
    window.history.pushState("", "", redirect_uri); // remove param from url
}

function getCode(){
    let code = null;
    const queryString = window.location.search;
    if ( queryString.length > 0 ){
        const urlParams = new URLSearchParams(queryString);
        code = urlParams.get('code')
    }
    return code;
}

function requestAuthorization(){
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

function fetchAccessToken( code ){
    let body = "grant_type=authorization_code";
    body += "&code=" + code;
    body += "&redirect_uri=" + encodeURI(redirect_uri);
    body += "&client_id=" + client_id;
    body += "&client_secret=" + client_secret;
    callAuthorizationApi(body);
}

function refreshAccessToken(){
    refresh_token = localStorage.getItem("refresh_token");
    let body = "grant_type=refresh_token";
    body += "&refresh_token=" + refresh_token;
    body += "&client_id=" + client_id;
    callAuthorizationApi(body);
}

function callAuthorizationApi(body){
    let xhr = new XMLHttpRequest();
    xhr.open("POST", TOKEN, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(client_id + ":" + client_secret));
    xhr.send(body);
    xhr.onload = handleAuthorizationResponse;
}

function handleAuthorizationResponse(){
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log(data);
        var data = JSON.parse(this.responseText);
        if ( data.access_token != undefined ){
            access_token = data.access_token;
            localStorage.setItem("access_token", access_token);
        }
        if ( data.refresh_token  != undefined ){
            refresh_token = data.refresh_token;
            localStorage.setItem("refresh_token", refresh_token);
        }
        onPageLoad();
    }
    else {
        console.log(this.responseText);
        //alert(this.responseText);
    }
}

function refreshDevices(){
    callApi( "GET", DEVICES, null, handleDevicesResponse );
}

function handleDevicesResponse(){
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log(data);
        removeAllItems( "devices" );
        data.devices.forEach(item => addDevice(item));
    }
    else if ( this.status == 401 ){
        refreshAccessToken()
    }
    else {
        console.log(this.responseText);
        //alert(this.responseText);
    }
}

function addDevice(item){
    let node = document.createElement("option");
    node.value = item.id;
    node.innerHTML = item.name;
    document.getElementById("devices").appendChild(node);
}

function callApi(method, url, body, callback){
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
    xhr.send(body);
    xhr.onload = callback;
}

function refreshPlaylists(){
    callApi( "GET", PLAYLISTS, null, handlePlaylistsResponse );
}

function handlePlaylistsResponse(){
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log(data);
        removeAllItems( "playlists" );
        data.items.forEach(item => addPlaylist(item));
        document.getElementById('playlists').value=currentPlaylist;
    }
    else if ( this.status == 401 ){
        refreshAccessToken()
    }
    else {
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

function addPlaylist(item){
    let node = document.createElement("option");
    node.value = item.id;
    node.innerHTML = item.name + " (" + item.tracks.total + ")";
    document.getElementById("playlists").appendChild(node);
}

function removeAllItems( elementId ){
    let node = document.getElementById(elementId);
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
}

function play(){
    let playlist_id = document.getElementById("playlists").value;
    let trackindex = document.getElementById("tracks").value;
    // TODO album stuff goes here, implementation of displaying album
    // let album = document.getElementById("album").value;
    // if ( album.length > 0 ){
    //     body.context_uri = album;
    // }
    // else{
    //
    // }
    let body = {};
    body.context_uri = "spotify:playlist:" + playlist_id;
    body.offset = {};
    body.offset.position = trackindex.length > 0 ? Number(trackindex) : 0;
    body.offset.position_ms = 0;
    callApi( "PUT", PLAY + "?device_id=" + deviceId(), JSON.stringify(body), handleApiResponse);
    // document.getElementById("playPause").style.display = 'none';
    // document.getElementById("pausePlay").style.display = 'block';
}

/**
 * Take annotation from page and store in mongo
 */
function storeAnnotation() {
    //get annotation text and timestamp from page form
    //replace whitespace with _
    let annotation = String(document.getElementById("annotationText").value).replace(/\s/g, '_')
    let seconds = String(document.getElementById("annotationTime").value)
    //make sure form isnt empty
    if(annotation == '' || seconds == '') {
        alert("Please enter both the annotation and timestamp.")
        return false
    }
    // Get User
    let dropdown = document.getElementById("annotationTrack");
    let trackIndex = dropdown.options[dropdown.selectedIndex].value;
    let id = currentSongs.items[trackIndex].track.id;
    let annotationData = "?uid=" + userId + "&track=" + id + "&anno=" + annotation + "&sec=" + seconds + "&refresh_token=TESTING"

    //send off to mongodb
    callApi("GET", INSERT + annotationData, null, null)
    //refresh annotations for currently selected song
    //refreshAnnotations()
    fetchAnnotations();
}

function handleUserIdResponse() {
    if(this.status == 200)
    {
        userId = JSON.parse(this.responseText)["id"];
        console.log(userId);
    }
    else {
        console.log(this.responseText);
        //alert(this.responseText);
    }
}


function fetchAnnotations() {
    let dropdown = document.getElementById("annotationTrack");
    let trackIndex = dropdown.options[dropdown.selectedIndex].value;
    if(userId != '') callApi("GET", RETRIEVE + "?uid=" + userId + "&track=" + currentSongs.items[trackIndex].track.id, null, handleAnnotationsResponse)
}

function handleAnnotationsResponse() {
    if (this.status == 200){
        var data = JSON.parse(this.responseText);
        console.log(data);
        removeAllItems( "songAnnotations" );
        for(var key in data) {
            addAnnotations(data[key])
            console.log(data[key])
        }
    }
    else {
        console.log(this.responseText);
        //alert(this.responseText);
    }
}

function addAnnotations(annotation){
    let node = document.createElement("option");
    node.innerHTML = annotation.replace(/(_)/g, ' ');
    document.getElementById("songAnnotations").appendChild(node);
}

function addTrackAnnotation(item, index) {
    let node = document.createElement("option");
    node.value = index;
    // document.body.style.backgroundImage = "url('" + data.item.album.images[0].url + "')";
    // let albumImage = "img src = '" + "url('" + data.item.album.images[0].url + "')" + "'";
    node.innerHTML = item.track.name + " (" + item.track.artists[0].name + ")";
    node.src = item.track.album.images[0].url;
    // "url('" + data.item.album.images[0].url + "')";
    document.getElementById("annotationTrack").appendChild(node);
}

function shuffle(){
    callApi( "PUT", SHUFFLE + "?state=true&device_id=" + deviceId(), null, handleApiResponse );
    play();
}

function pause(){
    callApi( "PUT", PAUSE + "?device_id=" + deviceId(), null, handleApiResponse );
    // document.getElementById("pausePlay").style.display = 'none';
    // document.getElementById("playPause").style.display = 'block';
}

function next(){
    callApi( "POST", NEXT + "?device_id=" + deviceId(), null, handleApiResponse );
}

function previous(){
    callApi( "POST", PREVIOUS + "?device_id=" + deviceId(), null, handleApiResponse );
}

function transfer(){
    let body = {};
    body.device_ids = [];
    body.device_ids.push(deviceId());
    callApi( "PUT", PLAYER, JSON.stringify(body), handleApiResponse );
}

//transfer function with ability to use string input
function transferToWebPlayer(){
    let body = {};
    body.device_ids = [];
    body.device_ids.push(web_player_id);
    callApi( "PUT", PLAYER, JSON.stringify(body), handleApiResponse );
}

function handleApiResponse(){
    if ( this.status == 200){
        console.log(this.responseText);
        setTimeout(currentlyPlaying, 2000);
    }
    else if ( this.status == 204 ){
        setTimeout(currentlyPlaying, 2000);
    }
    else if ( this.status == 401 ){
        refreshAccessToken()
    }
    else {
        console.log(this.responseText);
        //alert(this.responseText);
    }
}

function deviceId(){
    return document.getElementById("devices").value;
}

//fills annotations editor with songs from current playlist
function transferTracks() {
    currentSongs.items.forEach((item, index) => addTrackAnnotation(item, index))
}

function refreshSelectedAnnotationSong(){
    let dropdown = document.getElementById("annotationTrack");
    let image = dropdown.options[dropdown.selectedIndex].src;
    fetchAnnotations();
    //alert(image);
    document.body.style.backgroundImage = "url('" + image + "')";
}

//fills player section with songs from current playlist
function fetchTracks(){
    let playlist_id = document.getElementById("playlists").value;
    if (playlist_id.length > 0){
        url = TRACKS.replace("{{PlaylistId}}", playlist_id);
        callApi( "GET", url, null, handleTracksResponse );
    }
}

function handleTracksResponse(){
    if (this.status == 200){
        var data = JSON.parse(this.responseText);
        currentSongs = data;
        console.log(data);
        removeAllItems( "tracks" );
        data.items.forEach( (item, index) => addTrack(item, index));
    }
    else if ( this.status == 401 ){
        refreshAccessToken()
    }
    else {
        console.log(this.responseText);
        //alert(this.responseText);
    }
}

function addTrack(item, index){
    let node = document.createElement("option");
    node.value = index;
    node.innerHTML = item.track.name + " (" + item.track.artists[0].name + ")";
    document.getElementById("tracks").appendChild(node);
}

function currentlyPlaying(){
    callApi( "GET", PLAYER + "?market=US", null, handleCurrentlyPlayingResponse );
}

function handleCurrentlyPlayingResponse() {
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log(data);
        if ( data.item != null && document.getElementById("playlistSelection").style.display != "block"){
            //call analyze
            getTrackAnalysis(data.item.id);
            document.body.style.backgroundImage = "url('" + data.item.album.images[0].url + "')";
            document.getElementById("trackTitle").innerHTML = data.item.name;
            document.getElementById("trackArtist").innerHTML = data.item.artists[0].name;
        }


        if (data.device != null){
            // select device
            currentDevice = data.device.id;
            document.getElementById('devices').value=currentDevice;
        }

        if ( data.context != null ){
            // select playlist
            currentPlaylist = data.context.uri;
            currentPlaylist = currentPlaylist.substring( currentPlaylist.lastIndexOf(":") + 1,  currentPlaylist.length );
            document.getElementById('playlists').value=currentPlaylist;
        }
    }
    else if (this.status == 204){

    }
    else if ( this.status == 401 ){
        refreshAccessToken()
    }
    else {
        console.log(this.responseText);
        //alert(this.responseText);
    }
}

function saveNewRadioButton() {
    let item = {};
    item.deviceId = deviceId();
    item.playlistId = document.getElementById("playlists").value;
    radioButtons.push(item);
    localStorage.setItem("radio_button", JSON.stringify(radioButtons));
    refreshRadioButtons();
}

function refreshRadioButtons(){
    let data = localStorage.getItem("radio_button");
    if ( data != null){
        radioButtons = JSON.parse(data);
        if ( Array.isArray(radioButtons) ){
            removeAllItems("radioButtons");
            radioButtons.forEach( (item, index) => addRadioButton(item, index));
        }
    }
}

function onRadioButton( deviceId, playlistId ){
    let body = {};
    body.context_uri = "spotify:playlist:" + playlistId;
    body.offset = {};
    body.offset.position = 0;
    body.offset.position_ms = 0;
    callApi( "PUT", PLAY + "?device_id=" + deviceId, JSON.stringify(body), handleApiResponse );
    //callApi( "PUT", SHUFFLE + "?state=true&device_id=" + deviceId, null, handleApiResponse );
}

function addRadioButton(item, index){
    let node = document.createElement("button");
    node.className = "btn btn-primary m-2";
    node.innerText = index;
    node.onclick = function() { onRadioButton( item.deviceId, item.playlistId ) };
    document.getElementById("radioButtons").appendChild(node);
}

/**
 * Gets track analysis for current song. Must take in a trackid when called.
 * @param trackId trackId of current song
 */
function getTrackAnalysis(trackId){
    let url = ANALYSIS.replace("{id}", trackId);
    callApi("GET", url,  null, analyzeWaveform);
}

/**
 * Handles response from API call and creates a .json with each point for
 *  the waveform.
 */
function analyzeWaveform(){
    if ( this.status == 200 ) {
        var data = JSON.parse(this.responseText);
        //Node.js
        const fs = require('fs');

        let duration = data.track.duration;

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

            levels.push(loudness);
        }
        //Write file out for the different waveform levels
        fs.writeFile('levels.json', JSON.stringify(levels), (err) => {
            console.log(err);
        })
    }
    else if ( this.status == 401 ){
        refreshAccessToken()
    }
}

// Set up the Web Playback SDK
window.onSpotifyPlayerAPIReady = () => {
    const player = new Spotify.Player({
        name: 'Spotify Annotation Player',
        getOAuthToken: cb => { cb(access_token); }
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

    // Connect to the player!
    player.connect();
}

