const tmi = require('tmi.js');

const client = new tmi.Client({
  options: { debug: true },
  connection: {
    secure: true,
    reconnect: true
  },
  identity: {
    username: '<enter name of the bot here>',
    password: '<enter password here>'
  },
  channels: ['<enter channelname here>']
});

client.connect();

var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "mydb"
});

channel = '#thebroodles'

//1 = ready, 2 = in progress, 0 = in cd
var heistOpen = 1
var heistRnd
var heistPlayers = []

var huntOpen = 0
var huntPlayers = []

//prizePool values equal percentages of winnings for 1st, 2nd, 3rd
var prizePool = [60,30,10]
//base cooldown for the hunt in minutes
var huntCool = 15
//maximum cooldown variance for the hunt in minutes
var huntRange = 5

var jail = []
//jailtime in ms
var jailtime = 60000

//hunt message arrays
huntFirst = [`They took down the rampaging Zaghnol in a single blow and will be taking home`,`After kiting all of the Muu's around the trade district and aoe'ing them down, they have won`,`They may have used their Trance on a Trick Sparrow, but kept up the momentum and won`,`Ruthlessly wailing on wildlife provided them with the top score and`]
huntSecond =[`with a substantial bodycount and`,`got a little lost but scored a hefty sum and won`,`who got a bit carried away and took down another combatant! An easy`,`who decided to camp the theatre district and won`]
huntThird = [`just scrapping into a payout after a hard fought battle with a Muu, taking`,`despite being swarmed by Fangs, narrowly escapes and wins`,`who found the Zaghnol a bit too early but managed to escape and win`,`who sat back and sniped Trick Sparrows with Fira, winning`]
huntRIP = [`got lost on the Aircab, went back to Lindblum castle and retired!`,`tried so desperately to keep their Trance for Gizamaluke but not only lost it to a Muu but died completely!`,`was chased around the trade district fountain by the Zaghnol before being yeeted into next week!`,`ended up not participating and instead went to collect some potions for Cid.`]

//heist message arrays
stiltzkin = [`Stiltzkin! It shouldn't be that hard to hold up a moogle! Type !heist to join up!`,`It really was too easy, luckily you didn't have to hit him too hard, it was kind of amazing he actually fought back for a bit.`,`Somehow Stiltzkin was actually able to stop all of you on his own, how embarrassing. You can start a new !heist soon though to redeem yourself.`]
dragooShop = [`Dragoo's Armory in Lindblum! Type !heist to join up!`,`It was as easy as walking in and taking it. This Blurster Sword can definitely be sold to some weeb!`,`Somehow, you guys actually managed to get caught by Dragoo. He was more disappointed than mad. No broodlebits this time but you can start a new !heist soon.`]
bmvCemetary = [`the Black Mage Cemetary. Join up with !heist, but it's a bit messed up.`,`Well you succeeded. There wasn't really any issue, there's nothing here to stop you. But it's still pretty messed up.`,`Just as your team digs up the first grave, the Black Mage's eyes light up red and they all burst from their graves as zombies! Nope! No broodlebits today!`]
superSoft = [` the Super Soft! Type !heist to join up!`, `It was the perfect night for crime! You even managed to get some vintage Triple Triad cards while you were at it!`, `It was going really well until one of you knocked an open flame down and set everything on fire. No Super Soft. No broodlebits this time, but you can start a new !heist soon!`]
mageMasher = [`the Mage Masher! Type !heist to join up!`, `Wowee You actually just got a 3:21 MM without the wrist. Cinna even killed himself, it was beautiful.`, `Dude it's nearly been 5 minutes and Baku just killed Cinna. This is a reset. This is an easy pb, the game just needs to cooperate for once. Then you can start a new !heist.`]
theInvincible = [`the Invincible! Type !heist to join up!`, `A grand exit, cannons blazing, all the fireworks are worth firing to stop you from taking this ship.`, `While your team was able to find the Invincible quickly, carelessness has given your target enough time to react to your justice. Venging to return and reclaim your ship in another !heist soon.`]
heistArray = [stiltzkin,dragooShop,bmvCemetary,superSoft,mageMasher,theInvincible]

//values used to increase user score per message
//1: maximum gain per post + 1
//2: bonus score for lucky roll
//3: bonus chance is value x:1
incRng(10,5000,100)

initHunt()

gambleBits('!gamble ')
giveScore("!give ")
myScore('!broodlebits')
myScore('!score')
myScore(`!bits`)
leaderboard("!leaderboard")
leaderboard("!top")
stealBits('!steal ')
startHeist('!heist')
joinHeist('!heist')
joinHunt('!hunt')

function initHunt() {
  if(huntOpen === 0) {
    rnd = (Math.floor(Math.random() * 5)+20)*60000
    setTimeout(openHunt, rnd)
  }
}

function openHunt() {
  client.say(channel, `The Festival of the Hunt is now accepting entrants! Try your hand at becoming Lindblum's grandest fighter and win broodlebits! For each combatant the prize will grow larger! Use !hunt to sign up now!`)
  huntOpen = 1
  setTimeout(function(){ client.say(channel,`The Festival of the Hunt will close sign-ups in 5 minutes! Type !hunt to sign up!`); }, 300000)
  setTimeout(function(){ client.say(channel,`The Festival of the Hunt will close sign-ups in 1 minute! Type !hunt to sign up!`); }, 540000)
  setTimeout(resetHunt, 600000)
}

function joinHunt(command) {
  client.on('message', (channel, user, message, self) => {
    if(self) return;
    if(message.toLowerCase() === command) {
      if(huntOpen === 1) {
        if(huntPlayers.indexOf(user["display-name"]) !== -1) {
          client.say(channel, `@` + user["display-name"] + ` You are already registered in The Festival of the Hunt.`)
        }
        else {
          huntPlayers.push(user["display-name"])
        }
      }
      else {
        client.say(channel, `@` + user["display-name"] + ` The Festival of the Hunt is not currently accepting entrants.`)
      }
    }
  })
}

async function resetHunt() {
  shuffledPlayers = (async () => await shuffle(huntPlayers))()
  .then(function(shuffledPlayers) {
    if(shuffledPlayers.length <= 2) {
      client.say(channel, `Unfortunately, there weren't enough players registered in the The Festival of the Hunt. Another hunt will begin again soon...`)
    }
    else {
      first = ((Math.pow(shuffledPlayers.length, 2)*5000)/100)*prizePool[0]
      second = ((Math.pow(shuffledPlayers.length, 2)*5000)/100)*prizePool[1]
      third = ((Math.pow(shuffledPlayers.length, 2)*5000)/100)*prizePool[2]
      client.say(channel, 'In first place we have ' + shuffledPlayers[0] + `! ` + huntFirst[Math.floor(Math.random()*3)] + ' ' + first + ' broodlebits!')
      addScore(shuffledPlayers[0],first)
      client.say(channel, 'In second place, ' + shuffledPlayers[1] + ` ` + huntSecond[Math.floor(Math.random()*3)]  + ' ' + second + ' broodlebits!')
      addScore(shuffledPlayers[1],second)
      client.say(channel, 'And in third, ' + shuffledPlayers[2] + ` ` + huntThird[Math.floor(Math.random()*3)] + ' ' + third + ' broodlebits!')
      addScore(shuffledPlayers[2],third)
      if(shuffledPlayers[3]) {
        client.say(channel, shuffledPlayers[3] + ' ' + huntRIP[Math.floor(Math.random()*3)])
      }
      if(shuffledPlayers[4]) {
        client.say(channel, shuffledPlayers[4] + ' ' + huntRIP[Math.floor(Math.random()*3)])
      }
      client.say(channel, `Thank you to all participants! The hunt will return soon...`)
    }
    huntOpen = 2
    shuffledPlayers = []
    huntPlayers = []
    rnd = (huntCool*60000) + Math.floor(Math.random() * (huntRange*60000))
    setTimeout(openHunt, rnd)
  })
}

function resetHeist() {
  var winNames = ''
  var lossNames = ''
  result = Math.floor(Math.random() * 10)+1
  if(result <= 6) {
    for (var i = 0; i < heistPlayers.length; i++) {
      if(Math.floor(Math.random() * 4) === 1){
        prison(heistPlayers[i])
        lossNames += heistPlayers[i] + ', '
      }
      else {
        winNames += heistPlayers[i] + ', '
        addScore(heistPlayers[i], 10000)
      }
    }
    if(lossNames === '') {
    client.say(channel,heistArray[heistRnd][1] + ' Everyone makes off with 10000 broodlebits!')
    }
    else {
      client.say(channel,heistArray[heistRnd][1] + ' Everyone makes off with 10000 broodlebits! Except for ' + lossNames + 'who got  POLICE BUSTED! POLICE')
    }
  }
  else {
    client.say(channel, heistArray[heistRnd][2])
  }
  heistOpen = 0
  heistPlayers = []
  setTimeout(function(){heistOpen = 1}, 180000)
}

function joinHeist(command) {
  client.on('message', (channel, user, message, self) => {
    if(self) return;
    if(message.toLowerCase() === command) {
      if(heistOpen===2) {
        if(jail.indexOf(user["display-name"]) >= 0) {
          client.say(channel, `@` + user["display-name"] + ` PEPOLICE You can't join a !heist in jail! PEPOLICE`)
          return
        }
        if(heistPlayers.indexOf(user["display-name"]) !== -1) {
          client.say(channel, `@` + user["display-name"] + ` You are already in the heist.`)
        } 
        else {
          heistPlayers.push(user["display-name"])
        }
      }
    }
  })
}

function startHeist(command) {
  client.on('message', (channel, user, message, self) => {
    if(self) return;
    if(message.toLowerCase() === command) {
      if(heistOpen === 1) {
        heistRnd = Math.floor(Math.random() * 6)
        client.say(channel, user["display-name"] + ' is getting a team together to perform a heist on ' + heistArray[heistRnd][0])
        heistOpen=2
        setTimeout(resetHeist, 90000)
      }
      else if (heistOpen === 0) {
        client.say(channel, `You can't start a new !heist just yet, it's still too POLICE HOT POLICE out there!`)
      }
    }
  })
}

async function stealBits(command) {
  client.on('message', (channel, user, message, self) => {
    if(self) return;
    if(message.startsWith(command)){
      if(jail.indexOf(user["display-name"]) >= 0) {
        client.say(channel, `@` + user["display-name"] + ` PEPOLICE You're in jail! PEPOLICE`)
        return
      }
      var name = user["display-name"];
      var theft = message.split(" ")
      var victim = theft[1]
      var value = parseInt(theft[2])
      if(value<=0) {
        client.say(channel, `It doesn't work like that. WierdChamp`)
      }
      else {
        userScore = (async () => await findScore(name))()
        .then(function(userScore) {
          if(userScore >= value) {
            victScore = (async () => await findScore(victim))()
            .then(function(victScore) {
              if(victScore >= value) {
                rnd = Math.floor(Math.random() * 5)
                if(rnd >= 2) {
                  client.say(channel, name + ' just stole ' + value + ' broodlebits from ' + victim + '! MoneyDance robHaw MoneyDance' )
                  addScore(name,value)
                  takeScore(victim,value)
                }
                else {
                  var rndLoss = Math.floor(Math.random() * 6)+1
                  loss = Math.ceil(value/rndLoss)
                  client.say(channel, name + ' just got POLICE BUSTED POLICE and lost ' + loss + ' trying to steal from ' + victim + '!')
                  prison(name)
                  takeScore(name,loss)
                }
              }
              else {
                client.say(channel, `Target can't be found or doesn't have enough broodlebits!`)
              }
            })
          }
          else {
            client.say(channel, `You don't have enough broodlebits!`)
          }
        })
      }
    }
  })
}

async function gambleBits(command) {
  client.on('message', (channel, user, message, self) => {
    if(self) return;
    if(message.startsWith(command)){
      var name = user["display-name"];
      var wager = message.split(" ")
      wagerCheck = wager[1].toString()
      wager = parseInt(wager[1])
      if(wagerCheck === 'all') {
        rnd = Math.floor(Math.random() * 100)+1
        if (rnd >= 51) {
          userScore = (async () => await findScore(name))()
          .then(function(userScore) {
            addScore(name,userScore)
            userScore = userScore + userScore
            client.say(channel, name + ' just gambled everything and won ' + userScore + ' broodlebits! TSCool')
          })
        }
        else {
          userScore = (async () => await findScore(name))()
          .then(function(userScore) {
            client.say(channel,'ThisIsFine ' + name + ' just gambled ' + userScore + ' broodlebits and lost! ThisIsFine')
            updateScore(name,0)
          })
        }
      }
      else if (isNaN(wager)){
        client.say(channel, 'You must gamble a number or all!')
      }
      else if (wager <=0) {
        client.say(channel, `Don't be cheeky.`)
      }
      else{
        userScore = (async () => await findScore(name))()
        .then(function(userScore) {
          if(wager<=userScore) {
            rnd = Math.floor(Math.random() * 100)+1
            if (rnd >= 51) {
              addScore(name,wager)
              client.say(channel, name + ' gambled ' + wager + ' broodlebits and won! OOOO')
            }
            else {
              userScore = userScore - wager
              takeScore(name,wager)
              client.say(channel, name + ' gambled ' + wager + ' broodlebits and lost! steinAA')
            }
          }
          else {
            client.say(channel, `You don't have enough broodlebits! weirdChamp`)
          }
        })
      }
    }
  })
}

async function giveScore(command) {
  client.on('message', (channel, user, message, self) => {
    if(self) return;
    if(message.startsWith(command)){
      var name = user["display-name"];
      var rcp = message.split(" ")
      var value = rcp[2]
      var rcp = rcp[1]
      var value = parseInt(value)
      var validation = (async () => await findScore(rcp))()
      .then(function(validation) {
        if(!Number.isNaN(validation)) {
          if(value>0) {
            userScore = (async () => await findScore(name))()
            .then(function(userScore) {
              rcpScore = (async () => await findScore(rcp))()
              .then(function(rcpScore) {
                if(value<=userScore) {
                  addScore(rcp,value)
                  takeScore(name,value)
                  client.say(channel, name + ' just gave ' + rcp + ' ' + value + ' broodlebits! ')
                }
                //catch low funds
                else{
                  client.say(channel, `You don't have enough broodlebits! weirdChamp`)
                }
             })
            })
          }
          //catch 0 or less
          else{
            client.say(channel, `Don't be cheeky`)
          }
        }
        else {
          client.say(channel, rcp + ` can not be found.`)
        }
      })
      
    }
  })
}

function takeScore(user,score) {
  var sql = "UPDATE chatters SET score = score-'" + score + "' WHERE user = '" + user + "'"
  con.query(sql, function (err, result) {
  })
}

function addScore(user,score) {
  var sql = "UPDATE chatters SET score = score+'" + score + "' WHERE user = '" + user + "'"
  con.query(sql, function (err, result) {
  })
}

function updateScore(user,score) {
  var sql = "UPDATE chatters SET score='" + score + "'WHERE user = '" + user + "'"
  con.query(sql, function (err, result) {
  })
}

function scoreGain (name,rng) {
  var sql = "INSERT INTO chatters (user, score) VALUES ('" + name + "', 1) ON DUPLICATE KEY UPDATE score=score+'" + rng + "'"
  con.query(sql, function (err) {
  if (err) throw err;
  })
}

function incRng(rnd,lucky,chance) {
  client.on('message', (channel, user, message, self) => {
    if(self) return;
    var name = user["display-name"]
    var rng = Math.floor(Math.random() * rnd)+1
    var bonus = Math.floor(Math.random() * chance)
    if (bonus == chance-1) {
      rng = rng + lucky
      client.say(channel, name + " is feeling lucky!")
    }
    scoreGain(name, rng)
  })
}

async function findScore(user) {
  return new Promise(resolve => {
    setTimeout(() => {
      var sql = "SELECT score FROM chatters WHERE user = '" + user + "'"
      con.query(sql, function (err, result) {
        if (err) throw err;
        var score = JSON.stringify(result)
        score = score.replace(/\D/g,'')
        score = score.replace(/\","score":/g, ': ')
        score = score.replace(/\},/g, ', ')
        score = score.replace(/\}\]/g, '')
        score = parseInt(score)
        resolve(score);
      }, 1000);
    });
  })
}

async function myScore(command) {
  (async() => {client.on('message', (channel, user, message, self) => {
  if(self) return;
  if(message.toLowerCase() === command) {
    var user = user["display-name"];
    score = (async () => await findScore(user))()
    .then(function(score) {
     client.say(channel, user + " has " + score + " broodlebits!");
    })
  }
  })
  })();
}

function leaderboard(command) {
  client.on('message', (channel, tags, message, self) => {
  if(self) return;
  if(message.toLowerCase() === command) {
    var sql = "SELECT * FROM chatters ORDER BY score DESC LIMIT 5"
    con.connect(function(err, result) {
      con.query(sql, function (err, result) {
        var response = JSON.stringify(result)
        var response = response.replace(/\[\{"user":"/g, '')
        var response = response.replace(/\{"user":"/g, '')
        var response = response.replace(/\","score":/g, ': ')
        var response = response.replace(/\},/g, ', ')
        var response = response.replace(/\}\]/g, '')
        client.say(channel, response)
      })
    })
  }
  })
}

function prison(name) {
  if(jail.indexOf(name) !== -1) {
  }
  else {
    jail.push(name)
    setTimeout(function(){
      index = jail.indexOf(name)
      jail.splice(index, 1)
    }, jailtime)
  }
}

function shuffle(array) {
  var currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}
