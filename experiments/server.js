function updateEvery(interval) {
  var last = new Date();
  setInterval(function() {
    var date = new Date();
    if (date - last >= interval) {
      console.log('updating', date);
      last = date;
    }
  }, 0);
}

updateEvery(500);
