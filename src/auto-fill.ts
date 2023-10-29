export function autoFillPassword(username: string, password: string) {
  let passwordInputs = Array.from(
    document.querySelectorAll<HTMLInputElement>(
      "input[autocomplete=current-password]",
    ),
  ).filter((input) => input.checkVisibility());

  if (passwordInputs.length === 0) {
    passwordInputs = Array.from(
      document.querySelectorAll<HTMLInputElement>("input[type=password]"),
    ).filter((input) => input.checkVisibility());
  }

  if (passwordInputs.length === 0) {
    throw new Error(`No password input field found on ${window.location}`);
  } else if (passwordInputs.length > 1) {
    console.warn(`Multiple password input fields found on ${window.location}`);
  }

  const passwordInput = passwordInputs[0];

  const isUsernameInput = (input: HTMLInputElement) => {
    if (!["text", "email", undefined].includes(input.type)) return false;
    if (!input.checkVisibility()) return false;

    const types = [
      "email",
      "e-mail",
      "mail",
      "username",
      "user",
      "login",
      "account",
    ];

    const fields = [
      input.autocomplete,
      input.name,
      input.id,
      input.className,
      input.placeholder,
      input.ariaLabel,
      input.getAttribute("ng-model"),
    ];

    return fields.some(
      (field) =>
        field && types.some((type) => field.toLowerCase().includes(type)),
    );
  };

  let usernameInput: Element | null = passwordInput;
  outer: do {
    if (usernameInput.lastElementChild !== null) {
      usernameInput = usernameInput.lastElementChild;
      continue;
    }

    while (usernameInput.previousElementSibling === null) {
      if (usernameInput.parentElement === null) {
        console.warn(`No username input field found on ${window.location}`);
        usernameInput = null;
        break outer;
      }
      usernameInput = usernameInput.parentElement;
    }

    usernameInput = usernameInput.previousElementSibling;
  } while (
    usernameInput.tagName !== "INPUT" ||
    !(usernameInput instanceof HTMLInputElement) ||
    !isUsernameInput(usernameInput)
  );

  // Necessary for some JS libraries like React to detect the value correctly
  // See https://stackoverflow.com/a/46012210
  const setNativeValue = (input: HTMLInputElement, value: string) => {
    input.value = value;

    // React <= 15.5
    input.dispatchEvent(
      Object.assign(new InputEvent("input", { bubbles: true }), {
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

    // Angular
    input.dispatchEvent(new Event("blur", { bubbles: true }));
  };

  if (usernameInput !== null) setNativeValue(usernameInput, username);
  setNativeValue(passwordInput, password);
}
