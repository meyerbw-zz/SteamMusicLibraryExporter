const SteamUser = require('steam-user');
const Steam = require('steam');
const fs = require('fs');

const client = new SteamUser();

function main() {
    const data = JSON.parse(fs.readFileSync('user-secrets.json'));

    console.info(`username is ${data.username}`);

    client.logOn({
        "accountName": data.username,
        "password": data.password
    });

    client.on('loggedOn', function (details) {
        console.log("Logged into Steam as " + client.steamID.getSteam3RenderedID());
        client.setPersona(SteamUser.EPersonaState.Online);
    });

    client.on('error', function (e) {
        // Some error occurred during logon
        console.log(e);
    });

    client.on('licenses', function (licenses) {
        client.setOption('licenses', licenses);

        //the library is fucked but the author refuses to change it
        //theres no way to tell when the licenses have been populated to the client option
        setTimeout(function () {
            console.log('enabling cache');
            client.setOption('enablePicsCache', true);
        }, 5000);
    });

    client.on('appOwnershipCached', function () {
        var ownedApps = client.getOwnedApps();

        var info = client.getProductInfo(ownedApps, [], function (data) {
            processData(data);
        });
    })
}

function processData(data) {
    let soundtracks = "App Id,App Name,Depot Id,Depot Name,Download Command\n";
    const ostRegex = new RegExp(/\bost\b/, "ig");

    for (let key in data) {
        if (data.hasOwnProperty(key)) {
            let entry = data[key];

            if (entry.appinfo) {
                if (entry.appinfo.depots) {
                    for (let depotKey in entry.appinfo.depots) {
                        if (entry.appinfo.depots.hasOwnProperty(depotKey)) {
                            let depotInfo = entry.appinfo.depots[depotKey];

                            
                            if (depotInfo.name) {
                                if (depotInfo.name.toLowerCase().includes('soundtrack') || (depotInfo.name.toLowerCase().search(ostRegex) != -1)) {
                                    soundtracks = `${soundtracks}${entry.appinfo.appid},${entry.appinfo.common.name.replace(/,/g, '')},`;
                                    soundtracks = `${soundtracks}${depotKey}, ${depotInfo.name.replace(/,/g, '')},`;
                                    soundtracks = `${soundtracks}download_depot ${entry.appinfo.appid} ${depotKey}\n`;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    fs.writeFile("soundtracks.csv", soundtracks, function (err) {
        if (err) {
            return console.log(err);
        }

        console.log("The file was saved!");
        process.exit();
    });
}

main();