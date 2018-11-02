chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
    id: 'BitGoWindow',
    bounds: {
      width: 1000,
      height: 800,
      left: 100,
      top: 100
    },
    minWidth: 1000,
    minHeight: 600
  });
});

chrome.runtime.onUpdateAvailable.addListener(function(details) {
  console.log("updating to version " + details.version);
  chrome.runtime.reload();
});

function runUpdateCheck() {
  chrome.runtime.requestUpdateCheck(function(status) {
    if (status == "update_available") {
      console.log(new Date() + ": update pending...");
    } else if (status == "no_update") {
      console.log(new Date() + "no update found");
    } else if (status == "throttled") {
      console.log(new Date() + "Oops, I'm asking too frequently - I need to back off.");
    }
  });
}

runUpdateCheck();  // check on launch
setInterval(runUpdateCheck, 5 * 60 *  1000);  // poll regularly to check for updates
