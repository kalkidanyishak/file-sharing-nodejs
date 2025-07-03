function customAlert(htmlContent, options = {}) {
    // Default options
    const defaults = {
      title: 'Alert',
      okButtonText: 'OK',
      onOk: null, // Callback function when OK is clicked
      closeOnOverlayClick: true, // Whether to close when clicking outside the box
      style: {
        backgroundColor: '#fff',
        borderColor: '#ccc',
        textColor: '#333',
        buttonBackgroundColor: '#007bff',
        buttonTextColor: '#fff'
      }
    };
  
    // Merge options (user-provided options override defaults)
    const settings = { ...defaults, ...options };
  
    // 1. Create the necessary elements
    const overlay = document.createElement('div');
    const alertBox = document.createElement('div');
    const titleBar = document.createElement('div');
    const title = document.createElement('h2');
    const closeButton = document.createElement('span');
    const content = document.createElement('div');
    const buttonBar = document.createElement('div');
    const okButton = document.createElement('button');
  
    // 2. Set up the elements and their attributes/content
    // Overlay
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent background */
      z-index: 1000; /* Ensure it's on top */
      display: flex;
      justify-content: center;
      align-items: center;
    `;
  
    // Alert Box
    alertBox.style.cssText = `
      background-color: ${settings.style.backgroundColor};
      border: 1px solid ${settings.style.borderColor};
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      min-width: 300px;
      max-width: 80%;  /* Prevent it from being too wide on large screens */
      margin: 0 auto; /* Center the box horizontally */
      overflow: hidden; /* Prevent content overflow */
    `;
  
  
    // Title Bar
    titleBar.style.cssText = `
      background-color: ${settings.style.backgroundColor};
      padding: 10px;
      border-bottom: 1px solid ${settings.style.borderColor};
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
  
    // Title
    title.textContent = settings.title;
    title.style.cssText = `
      margin: 0;
      color: ${settings.style.textColor};
      font-size: 1.2em;
    `;
  
    // Close Button
    closeButton.textContent = 'x'; // Or use an actual close icon (font awesome, etc.)
    closeButton.style.cssText = `
      cursor: pointer;
      font-size: 1.5em;
      color: ${settings.style.textColor};
    `;
    closeButton.addEventListener('click', closeAlert);
  
    // Content Area
    content.style.cssText = `
      padding: 20px;
      color: ${settings.style.textColor};
      font-size: 1em;
      word-wrap: break-word; /* Handle long words that break the layout */
    `;
    content.innerHTML = htmlContent; // Insert the HTML content
  
    // Button Bar
    buttonBar.style.cssText = `
      padding: 10px;
      text-align: right;
      border-top: 1px solid ${settings.style.borderColor};
      background-color: ${settings.style.backgroundColor};
    `;
  
    // OK Button
    okButton.textContent = settings.okButtonText;
    okButton.style.cssText = `
      background-color: ${settings.style.buttonBackgroundColor};
      color: ${settings.style.buttonTextColor};
      border: none;
      padding: 8px 15px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 1em;
    `;
  
    // 3. Assemble the elements
    titleBar.appendChild(title);
    titleBar.appendChild(closeButton);
  
    buttonBar.appendChild(okButton);
  
    alertBox.appendChild(titleBar);
    alertBox.appendChild(content);
    alertBox.appendChild(buttonBar);
  
    overlay.appendChild(alertBox);
  
    // 4. Add the overlay to the document body
    document.body.appendChild(overlay);
  
  
    // 5. Button event listeners and closing function
    okButton.addEventListener('click', () => {
      closeAlert();
      if (settings.onOk) {
        settings.onOk(); // Execute the callback if provided
      }
    });
  
  
    function closeAlert() {
      document.body.removeChild(overlay);
    }
  
    // Optional: Close when clicking outside the alert box
    if (settings.closeOnOverlayClick) {
      overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {  // Only close if the overlay itself was clicked
          closeAlert();
        }
      });
    }
  
  
    // Prevent clicks inside the alert box from closing the overlay
    alertBox.addEventListener('click', (event) => {
      event.stopPropagation(); // Stop the click event from bubbling up to the overlay
    });
  
  
    // Focus the OK button for accessibility
    okButton.focus();
  
  
    // Prevent scrolling behind the alert
    document.body.style.overflow = 'hidden';
  
    // Restore scrolling when the alert is closed
    overlay.addEventListener('transitionend', () => {
      if (!document.body.contains(overlay)) {
        document.body.style.overflow = '';
      }
    });
  
    return { close: closeAlert }; // Return a close function for programmatic closing
  
  }
  
  
  // Example usage:
  document.getElementById('myButton').addEventListener('click', () => {
    customAlert(`
      <h1>Important Message</h1>
      <p>This is a custom alert box with <strong>HTML</strong> content.</p>
      <ul>
        <li>Item 1</li>
        <li>Item 2</li>
      </ul>
      <img src="https://via.placeholder.com/50" alt="Placeholder image">
    `, {
      title: 'Custom Alert Example',
      okButtonText: 'Acknowledge',
      onOk: () => {
        console.log('User acknowledged the alert.');
      },
      style: {
        backgroundColor: '#f0f8ff',
        borderColor: '#add8e6',
        textColor: '#2f4f4f',
        buttonBackgroundColor: '#4682b4',
        buttonTextColor: '#fff'
      }
    });
  });