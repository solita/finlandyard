
module.exports = {
  log: function(time, msg) {
    var container = document.getElementById("log");
    var iDiv = document.createElement('div');
    iDiv.className = "log-entry";
    iDiv.innerHTML = time.toISOString() + ": " + msg;
    container.prepend(iDiv);
  }
};
