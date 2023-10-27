export function autoFillPassword(username: string, password: string) {
  let passwordInputs = document.querySelectorAll<HTMLInputElement>(
    "input[autocomplete=current-password]",
  );

  if (passwordInputs.length === 0) {
    passwordInputs = document.querySelectorAll<HTMLInputElement>(
      "input[type=password]",
    );
  }

  if (passwordInputs.length === 0) {
    throw new Error(`No password input field found on ${window.location}`);
  } else if (passwordInputs.length > 1) {
    throw new Error(
      `Multiple password input fields found on ${window.location}`,
    );
  }

  const passwordInput = passwordInputs.item(0);

  let usernameInput: Element = passwordInput;
  do {
    if (usernameInput.lastElementChild !== null) {
      usernameInput = usernameInput.lastElementChild;
      continue;
    }

    while (usernameInput.previousElementSibling === null) {
      if (usernameInput.parentElement === null) {
        throw new Error(`No username input field found on ${window.location}`);
      }
      usernameInput = usernameInput.parentElement;
    }

    usernameInput = usernameInput.previousElementSibling;
  } while (
    usernameInput.tagName !== "INPUT" ||
    !(usernameInput instanceof HTMLInputElement) ||
    (usernameInput.type !== "email" &&
      !usernameInput.autocomplete.includes("email") &&
      !usernameInput.autocomplete.includes("username"))
  );

  // Necessary for some JS libraries like React to detect the value correctly
  // See https://stackoverflow.com/a/46012210
  function setNativeValue(input: HTMLInputElement, value: string) {
    // React <= 15.5
    input.dispatchEvent(
      Object.assign(new Event("input", { bubbles: true }), {
        simulated: true,
        value,
      }),
    );

    // React >= 15.6
    var nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;

    if (nativeInputValueSetter === undefined) {
      throw new Error(
        `Failed to set value for input ${input} on ${window.location}`,
      );
    }

    nativeInputValueSetter.call(input, value);

    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  setNativeValue(usernameInput, username);
  setNativeValue(passwordInput, password);
}
