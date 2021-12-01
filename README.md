# teamb
Spotify Project, Team B, CSC380 Fall 2021

Prerequisites: Have the knowledge to successfully create and run a linux web server.

Login to Spotify for Developers dashboard
From the dashboard create a new app. 
Edit the settings of the app. Under Redirect URIs add your domain (or IP) including the /player Ex. https://mydomain.com/player, https://134.123.212.23/player, etc..
Exit the settings and enter Users and Access. Add users you would like to give access to. Note: You need to give access to yourself.
Here write down your Client ID and your Client Secret.
Deploy a linux web server. (Intended for Ubuntu 18.04)
On the server install Python with the following packages
flask v2.0.2
jsonmerge v1.8.0
pymongo v3.12.1
python-dotenv v0.19.2
requests v2.26.0
Create an instance of MongoDB on the linux server, OR create a free tier cluster using MongoDB Atlas 
The Spotify Web Player requires HTTPS. Use a free ssl site such as zerossl to obtain an 
SSL certificate or route your domain through Cloudflare. 
Note if you obtain a certificate and do not use a WSGI you need to name your .crt file certificate.crt and your .key file private.key. Put these files in the same directory as the __init_.py. Edit the __init__.py file and uncomment the lines regarding SSL.
In the same directory as the __init__.py file create an env file. It MUST be named .env
 In this file assign your Spotify Client Secret 
“ clientSecret=yourSecretKeyHere “
As well as your MongoDB url with the user and password  “mongoUrl=mongodb+srv://username:password@mongodburl”
Edit the uri variable in  __init__.py to your domain /player as a string. 
“ uri = ‘https://mydomain.com/player’ ”
Go into the static/js/ and open the app.js. Change the base_uri variable to match your domain name.
 ‘ var base_uri = “https://mydomain.com” ‘
Google documentation for your web server and Flask. Such as Apache WSGI Flask, Nginx uWSGI Flask, OpenLiteSpeed WSGI Flask, and etc..
 Directly run the __init__.py or run the file through your WSGI. 
If you have an adblocker, disable it on your site for the UI to run properly.

