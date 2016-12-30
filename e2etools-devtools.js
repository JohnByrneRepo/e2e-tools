////////////////////////////////////////////////////////////////////////////////////
// Reference:

// https://developer.chrome.com/extensions/devtools
// https://github.com/GoogleChrome/devtools-docs
// https://github.com/GoogleChrome/devtools-docs/issues/143

console.log("Initialising e2e tools");

var scriptNameList = [], panelBody = {}, runOnce = false;

////////////////////////////////////////////////////////////////////////////////////
//
// Create dev tools panel

chrome.devtools.panels.create("e2e tools",
  "logo.png",
  "e2etools-panel.html",
  function(panel) {
    console.log("Registered Backbone Atlas developer tools panel");
    panel.onShown.addListener(function(panelWindow) {
      if (runOnce) return;
      runOnce = true;
      panelBody = panelWindow.document.body;
      getscriptNameList();
    });
  });

////////////////////////////////////////////////////////////////////////////////////
//
// Getting a reference panel's window

// To postMessage from a devtools panel, you'll need a reference to its window object.
// Get a panel's iframe window in from the the panel.onShown event handler:

// onShown.addListener(function callback)
// extensionPanel.onShown.addListener(function (extPanelWindow) {
//     extPanelWindow instanceof Window; // true
//     extPanelWindow.postMessage( // …
// });

////////////////////////////////////////////////////////////////////////////////////
//
// Get resources

function getscriptNameList() {
  chrome.devtools.inspectedWindow.getResources(function(resources) {
    var frames = [];
    console.log(JSON.stringify(resources, null, 4));
    for (var i = 0,l = resources.length; i < l; i++) {
      var resource = resources[i];
      switch (resource.type) {
        case 'document':
        {
          frames.push({url: resource.url});
          break;
        }
        case 'script':
        {
          var resourceUrlParts = resource.url.split('/');
          // debugger;
          // if (resourceUrlParts.indexOf('app') > -1) {

            scriptNameList.push({
              file: resourceUrlParts[resourceUrlParts.length - 1],
              resource: resource
            });


          // }
          break;
        }
      }
    }
    resolvescriptNameList(scriptNameList);
  });

  function resolvescriptNameList(scriptNameList) {
    scriptNameList.forEach(function(script) {
      script.resource.getContent(function(content){
        script.content = content;
        $(panelBody).append('' +
          '<li>' + script.file + '</li>'
          );
      }.bind(this));
    });
  }
}

////////////////////////////////////////////////////////////////////////////////////
//
// Connect to background page

var backgroundPageConnection = chrome.runtime.connect({
  name: "e2etools-panel"
});

// Handle messages from the background page

backgroundPageConnection.onMessage.addListener(function(message) {

});

////////////////////////////////////////////////////////////////////////////////////
//
// Inject a content script into tab

chrome.runtime.sendMessage({
  tabId: chrome.devtools.inspectedWindow.tabId,
  scriptToInject: "content_script.js"
});

// backgroundPageConnection.postMessage({
//     name: 'init',
//     tabId: chrome.devtools.inspectedWindow.tabId
// });

////////////////////////////////////////////////////////////////////////////////////
//
// Evaluating JavaScript in the Inspected Window and
// passing the Selected Element to a Content Script

// You can use the inspectedWindow.eval method to execute JavaScript code
// in the context of the inspected page. You can invoke the eval method
// from a DevTools page, panel or sidebar pane.

chrome.devtools.inspectedWindow.eval(
  "inspect($$('head script[data-soak=main]')[0])",
  function(result, isException) { }
);

// By default, the expression is evaluated in the context of the main frame of
// the page. Now, you may be familiar with the DevTools commandline API features
// like element inspection (inspect(elem)), breaking on functions (debug(fn)),
// copying to clipboard (copy()) and more. inspectedWindow.eval() uses the same
// script execution context and options as the code typed at the DevTools console,
// which allows access to these APIs within the eval. For example, SOAK uses it for
// inspecting an element:

// Alternatively, use the useContentScriptContext: true option for inspectedWindow.eval()
// to evaluate the expression in the same context as the content scripts (example below).

chrome.devtools.inspectedWindow.eval(
  "setSelectedElement($0)",
  { useContentScriptContext: true }
);

// The useContentScriptContext: true option specifies that the expression must be evaluated
// in the same context as the content scripts, so it can access the setSelectedElement method.

// Calling eval with useContentScriptContext: true does not create a content script
// context, so you must load a context script before calling eval, either by calling
// executeScript or by specifying a content script in the manifest.json file.

// Once the context script context exists, you can use this option to inject additional
// content scripts.

// The eval method is powerful when used in the right context and dangerous when used
// inappropriately. Use the tabs.executeScript method if you don't need access to the
// JavaScript context of the inspected page. For detailed cautions and a comparison of
// the two methods, see inspectedWindow.

// Messaging from Content Scripts to the DevTools Page

// Create a connection to the background page

// var backgroundPageConnection = chrome.runtime.connect({
//     name: "panel"
// });

// backgroundPageConnection.postMessage({
//     name: 'init',
//     tabId: chrome.devtools.inspectedWindow.tabId
// });

// Messaging from Injected Scripts to the DevTools Page
// While the above solution works for content scripts, code that
// is injected directly into the page (e.g. through appending a <script>
// tag or through inspectedWindow.eval) requires a different strategy.
// In this context, runtime.sendMessage will not pass messages to the background
// script as expected.

// As a workaround, you can combine your injected script with a content
// script that acts as an intermediary. To pass messages to the content script,
// you can use the window.postMessage API. Here's an example, assuming the
// background script from the previous section:

// // injected-script.js

// window.postMessage({
//   greeting: 'hello there!',
//   source: 'my-devtools-extension'
// }, '*');
// // content-script.js

// window.addEventListener('message', function(event) {
//   // Only accept messages from the same frame
//   if (event.source !== window) {
//     return;
//   }

//   var message = event.data;

//   // Only accept messages that we know are ours
//   if (typeof message !== 'object' || message === null ||
//       !message.source === 'my-devtools-extension') {
//     return;
//   }

//   chrome.runtime.sendMessage(message);
// });

// Your message will now flow from the injected script, to the content script, to
// the background script, and finally to the DevTools page.

// You can also consider two alternative message passing techniques here:
// https://github.com/GoogleChrome/devtools-docs/issues/143

// Detecting When DevTools Opens and Closes
// If your extension needs to track whether the DevTools window is open, you can add an onConnect listener to the background page, and call connect from the DevTools page. Since each tab can have its own DevTools window open, you may receive multiple connect events. To track whether any DevTools window is open, you need to count the connect and disconnect events as shown below:

// // background.js
// var openCount = 0;
// chrome.runtime.onConnect.addListener(function (port) {
//     if (port.name == "devtools-page") {
//       if (openCount == 0) {
//         alert("DevTools window opening.");
//       }
//       openCount++;

//       port.onDisconnect.addListener(function(port) {
//           openCount--;
//           if (openCount == 0) {
//             alert("Last DevTools window closing.");
//           }
//       });
//     }
// });
// The DevTools page creates a connection like this:

// // devtools.js

// // Create a connection to the background page
// var backgroundPageConnection = chrome.runtime.connect({
//     name: "devtools-page"
// });
