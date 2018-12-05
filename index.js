var fs = require('fs');
var PlayMusic = require('playmusic');
var util = require('util');
var http = require('http');

var pm = new PlayMusic();
var config = JSON.parse(fs.readFileSync("config.json"));

http.createServer(function (req, res) {
  var allSongs = [];

  // control for favicon
  if (req.url === '/favicon.ico') {
    res.writeHead(200, {'Content-Type': 'image/x-icon'} );
    res.end();
    console.log('favicon requested');
    return;
  }

  pm.init({androidId: config.androidId, masterToken: config.masterToken}, function(err) {
    if(err) console.error(err); 
  
    /*pm.getPlayLists(function(err, data) {
      if(err) console.error(err);
      console.log(data.data.items);
    });
  
    pm.getPlayListEntries(function(err, data) {
      console.log(data.data.items);
    });*/
    console.log("Getting all tracks (10,000)...");
    pm.getAllTracks(function(err, library) {
      allSongs = library.data.items;
      console.log("Found " + allSongs.length + " songs.");
      //console.log(allSongs[0].playCount + ': ' + allSongs[0].title);
      //allSongs.sort(dynamicSortMultiple("playCount"));
      //allSongs.sort(dynamicSort("-playCount"));
      console.log("Getting most played tracks...");
      allSongs.sort((a,b) => (a.playCount > b.playCount) ? 1 : ((b.playCount > a.playCount) ? -1 : 0));
      allSongs = allSongs.reverse();
      var top = allSongs.slice(0,1000);
      var ids = [];
      var result = "";
      for (var x = 0; x < top.length; x++) {
        result += top[x]["playCount"] + ': ' + top[x]["title"] + '<br>';
        ids.push(top[x]["id"]);
      }
      console.log("Creating 'Top' playlist...");
      pm.addPlayList("Top", function(err, data){
        if (err) console.error(err);
        console.log("Playlist with id: " + data.mutate_response[0]['id'] + " created.");
        console.log("Adding tracks to playlist...");
        pm.addTrackToPlayList(ids, data.mutate_response[0]['id'],function(err, data){
          if (err) console.error(err);
          else console.log("Tracks added.");
        });
      });
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(result);
    }); //pm.getAllTracks ends

  }); // pm.init ends
  
}).listen(8080, () => {
  console.log('Server started at port: 8080');
}); // http.createServer ends



/* 
 * People.sort(dynamicSort("Name")); 
 * https://stackoverflow.com/questions/1129216/sort-array-of-objects-by-string-property-value
*/
function dynamicSort(property) {
  var sortOrder = 1;
  if(property[0] === "-") {
      sortOrder = -1;
      property = property.substr(1);
  }
  return function (a,b) {
      var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
      return result * sortOrder;
  }
}

/* 
 * People.sort(dynamicSortMultiple("Name", "-Surname")); 
 * https://stackoverflow.com/questions/1129216/sort-array-of-objects-by-string-property-value
*/
function dynamicSortMultiple() {
  var props = arguments;
  return function (obj1, obj2) {
      var i = 0, result = 0, numberOfProperties = props.length;
      while(result === 0 && i < numberOfProperties) {
          result = dynamicSort(props[i])(obj1, obj2);
          i++;
      }
      return result;
  }
}