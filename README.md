# Description
The node script will generate a `soundtracks.csv` file which contains information about soundtracks you may own based off what things are in your Steam library. It will also generate a `steamDownloadScript.txt` file which is a SteamCMD script that will attempt to download all the soundtracks that it found.

# Usage
1. Clone the repository
2. run `npm install`
3. rename `user-secrets.json.example` to `user-secrets.json` and fill in your credentials
4. run `npm start`

# Download Depots Through SteamCMD
If you want to automate the download process as well, you can use [SteamCMD](https://developer.valvesoftware.com/wiki/SteamCMD) and run the generated file, `steamDownloadScript.txt`. This script will iterate through all your potential soundtrack licenses and attempt to download them.

For convenience I would recommend just maunally installing SteamCMD into the same directory as the repository and running the script through the steps below:
1. navigate to the repository directory
2. run `mkdir SteamCMD && cd SteamCMD`
3. run `curl -sqL "https://steamcdn-a.akamaihd.net/client/installer/steamcmd_osx.tar.gz" | tar zxvf -` **IMPORTANT: Double check this command with the official SteamCMD documentation before running.**
4. run `./steamcmd.sh +runscript ../steamDownloadScript.txt` and follow any credential prompts.

This _should_ download everything into a directory called `steamapps/` within the previously created `SteamCMD` directory.

# Disclaimer
There are no tests and I don't know what the lowest version of node is that this will run on. I wrote it at 2 AM and used node v8.1.2 and npm 5.0.3.

