////////////////////////////////////////////////////////////////////////////////////
//
// Passing the Selected Element to a Content Script

// The content script doesn't have direct access to the current selected
// element. However, any code you execute using inspectedWindow.eval has
// access to the DevTools console and command-line APIs. For example, in
// evaluated code you can use $0 to access the selected element.

// To pass the selected element to a content script:

// Create a method in the content script that takes the selected element
// as an argument. Call the method from the DevTools page using
// inspectedWindow.eval with the useContentScriptContext: true option.
// The code in your content script might look something like this:

function setSelectedElement(el) {
  // do something with the selected element
}

// Invoke the method from the DevTools page like this:

// chrome.devtools.inspectedWindow.eval(
//   "setSelectedElement($0)",
//   { useContentScriptContext: true }
// );

// The useContentScriptContext: true option specifies that the expression
// must be evaluated in the same context as the content scripts, so it can
// access the setSelectedElement method.

////////////////////////////////////////////////////////////////////////////////////
//
// Messaging from Content Scripts to the DevTools Page

// Messaging between the DevTools page and content scripts is indirect, by way
// of the background page.

// When sending a message to a content script, the background page can use the
// tabs.sendMessage method, which directs a message to the content scripts in a
// specific tab, as shown in Injecting a Content Script.

// When sending a message from a content script, there is no ready-made method
// to deliver a message to the correct DevTools page instance associated with
// the current tab. As a workaround, you can have the DevTools page establish a
// long-lived connection with the background page, and have the background page
// keep a map of tab IDs to connections, so it can route each message to the correct
// connection.

