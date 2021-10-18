const redirectUri = "http://134.122.35.252:2052/player";
const siteUrl = "http://134.122.35.252:2052/";
const AUTHORIZE = "https://accounts.spotify.com/authorize"
const TOKEN = "https://accounts.spotify.com/api/token";
const PLAYLISTS = "https://api.spotify.com/v1/me/playlists";
const DEVICES = "https://api.spotify.com/v1/me/player/devices";
const PLAY = "https://api.spotify.com/v1/me/player/play";
const PAUSE = "https://api.spotify.com/v1/me/player/pause";
const NEXT = "https://api.spotify.com/v1/me/player/next";
const PREVIOUS = "https://api.spotify.com/v1/me/player/previous";
const PLAYER = "https://api.spotify.com/v1/me/player";
const TRACKS = "https://api.spotify.com/v1/playlists/{{PlaylistId}}/tracks";
const CURRENTLYPLAYING = "https://api.spotify.com/v1/me/player/currently-playing";
const SHUFFLE = "https://api.spotify.com/v1/me/player/shuffle";

var clientId = "c6f5c006684341518ba23d7bae85b169";
var clientSecret = "";
//& client secret

var accessToken = null;
var refreshToken = null;


function onPageLoad(){
    clientId = localStorage.getItem("clientId");
    if ( window.location.search.length > 0 ){
        redirect();
    }
    else{
        accessToken = localStorage.getItem("accessToken");
        if ( accessToken == null ){
            // we don't have an access token so present token section
            document.getElementById("tokenSection").style.display = 'block';
        }
        else {
            // we have an access token so present device section
            document.getElementById("deviceSection").style.display = 'block';

            refreshDevices();
            refreshPlaylists();
            currentlyPlaying();
        }
    }
    refreshRadioButtons();
}

/**
 * removes everything from storage and logs out
 */
function removeAll() {
    localStorage.clear();
    window.location.href = siteUrl;
    return false;
}

/**
 * Handles redirect to new webpage
 */
function redirect() {
    let code;
    let query = window.location.search;
    if(query.length > 0) {
        let urlParams = new URLSearchParams(query);
        code = urlParams.get('code');
    }
    getAccessToken(code);
    window.history.pushState("","",redirectUri);
}

/**
 * Using the clientId and responseUri this function opens Spotify's Authorization screen
 */
function requestAuthorization(){
    //clientId = document.getElementById("clientId").value;
    //clientSecret = document.getElementById("clientSecret").value;
    //localStorage.setItem("client_id", client_id);
    //localStorage.setItem("client_secret", client_secret); // In a real app you should not expose your client_secret to the user

    let url = AUTHORIZE;
    url += "?client_id=" + clientId;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirectUri);
    url += "&show_dialog=true";
    url += "&scope=user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read streaming user-read-playback-state user-read-recently-played playlist-read-private";
    window.location.href = url; // Show Spotify's authorization screen
}

/**
 * Gets access token from uri
 */
function getAccessToken(code) {
    let body = "grant_type=authorization_code";
    body += "&code=" + code;
    body += "&redirect_uri=" + encodeURI(redirectUri);
    body += "&client_id=" + clientId;
    body += "&client_secret=" + getClientSecret();
    callAuthorizationApi(body);
}

/**
 * Gets refresh token from body
 */
function refreshAccessToken(){
    refreshToken = localStorage.getItem("refresh_token");
    let body = "grant_type refresh_token";
    body += "&refresh_token=" + refreshToken;
    body += "&client_id=" + clientId;
    callAuthorizationApi(body);
}

/**
 * Authenticates web app to use Spotify API
 */
function callAuthorizationApi(body) {
    let xhr = new XMLHttpRequest();
    xhr.open("POST", TOKEN, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.setRequestHeader("Authorization", "Basic" + btoa(clientId + ":" + getClientSecret()))
    xhr.send(body);
    xhr.onload = handleAuthorizationResponse;
}

/**
 * Handles the authorization repsonse from calling the API
 */
function handleAuthorizationResponse() {
    if (this.status == 200) {
        var data = JSON.parse(this.responseText);
        console.log(data);
        var data = JSON.parse(this.responseText);
        if (data.accessToken != undefined) {
            accessToken = data.accessToken;
            localStorage.setItem("access_token", accessToken);
        }
        if(data.accessToken != undefined) {
            refreshToken = data.refreshToken;
            localStorage.setItem("refresh_token", refreshToken);
        }
        onPageLoad();
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

/**
 * Returns the secret client id
 */
function getClientSecret() {
    fetch('/clientSecret')
        .then(function (response) {
            return response.json();
        }).then(function (text) {
        return text.clientSecret;
    });
}

/**
 * Helper function to make calls to Spotify API
 * @param method = GET or POST
 * @param url = URL retrieving data from
 * @param body = json file if wanted, can be null
 * @param callback = function where data gets handled
 */
function callApi(method, url, body, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
    xhr.send(body);
    xhr.onload = callback;
}

