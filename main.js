const SteamUser = require('steam-user');
const Steam = require('steam');
const fs = require('fs');
const path = require('path');

const client = new SteamUser();
const soundtrackFilename = `soundtracks.csv`;
const steamScriptFilename = `steamDownloadScript.txt`;
const userSecrets = JSON.parse(fs.readFileSync(`user-secrets.json`));

function main() {
    console.info(`username is ${userSecrets.username}`);

    client.logOn({
        "accountName": userSecrets.username,
        "password": userSecrets.password
    });

    client.on(`loggedOn`, function (details) {
        console.info(`Logged into Steam as ` + client.steamID.getSteam3RenderedID());
        client.setPersona(SteamUser.EPersonaState.Online);
    });

    client.on(`error`, function (e) {
        // Some error occurred during logon
        console.error(e);
    });

    client.on(`licenses`, function (licenses) {
        console.info('Retrieving libray listing...');

        //an error is thrown that license don't exist. setting it a timeout makes it work, but it'd be nice if the underlying library had a `licenses actually loaded` event or something.
        setTimeout(function () {
            client.setOption(`enablePicsCache`, true);
        }, 2000);
    });

    client.on(`appOwnershipCached`, function () {
        var ownedApps = client.getOwnedApps();

        var info = client.getProductInfo(ownedApps, [], function (data) {
            processData(data);
        });
    })
}

function processData(data) {
    console.info('Searching for soundtracks...')

    let soundtracks = `App Id,App Name,Depot Id,Depot Name,Download Command\n`;
    let downloadCommands = [];
    
    const ostRegex = new RegExp(/\bost\b/, `ig`);

    for (let key in data) {
        if (data.hasOwnProperty(key)) {
            let entry = data[key];

            if (entry.appinfo) {
                if (entry.appinfo.depots) {
                    for (let depotKey in entry.appinfo.depots) {
                        if (entry.appinfo.depots.hasOwnProperty(depotKey)) {
                            let depotInfo = entry.appinfo.depots[depotKey];

                            if (depotInfo.name) {
                                if (depotInfo.name.toLowerCase().includes(`soundtrack`) || (depotInfo.name.toLowerCase().search(ostRegex) != -1)) {
                                    soundtracks = `${soundtracks}${entry.appinfo.appid},${entry.appinfo.common.name.replace(/,/g, '')},`;
                                    soundtracks = `${soundtracks}${depotKey}, ${depotInfo.name.replace(/,/g, '')},`;
                                    soundtracks = `${soundtracks}download_depot ${entry.appinfo.appid} ${depotKey}\n`;

                                    downloadCommands.push(`download_depot ${entry.appinfo.appid} ${depotKey}`);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    const writeSoundtrackPromise = new Promise((resolve, reject) => {
        fs.writeFile(soundtrackFilename, soundtracks, function (err) {
            if (err) {
                reject(err)
            }

            console.log(`Soundtrack listing saved to: ${path.join(process.env.PWD, soundtrackFilename)}`);
            resolve();
        });
    });

    const writeScriptPromise = new Promise((resolve, reject) => {
        fs.writeFile(steamScriptFilename, buildSteamScript(downloadCommands), function (err) {
            if (err) {
                reject(err);
            }

            console.log(`Steam download script saved to: ${path.join(process.env.PWD, steamScriptFilename)}`);
            resolve();
        });
    });

    Promise.all([writeSoundtrackPromise, writeScriptPromise])
        .then(() => { 
            process.exit();
        })
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}

function buildSteamScript(downloadCommands){
    let scriptContent = `login ${userSecrets.username}\n`;

    downloadCommands.forEach((command) => {
        scriptContent = `${scriptContent}${command}\n`;
    });

    scriptContent = `${scriptContent}quit\n`;

    return scriptContent;
}

main();